import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  assembleSystemPrompt,
  selectModel,
  getMaxTokens,
  sanitizeInput,
  applyBIRDisclaimer,
  filterOutput,
  checkCircuitBreaker,
  recordSpend,
  estimateCost,
  calculateActualCost,
  KA_ERROR_MESSAGES,
} from '@/lib/claude';
import { ChatRequestSchema } from '@/lib/claude/schemas';
import type { KAFeature, UserTier, UserContext } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    // --- Auth Check ---
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            message_tl: 'Kailangan mag-login muna.',
          },
        },
        { status: 401 }
      );
    }

    // --- Zod Validation ---
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            message_tl: 'Walang mensahe o mali ang format.',
          },
        },
        { status: 400 }
      );
    }

    const { message, feature } = parsed.data;

    // --- Input Sanitization ---
    const { sanitizedInput, injectionDetected } = sanitizeInput(message);
    if (injectionDetected) {
      console.warn(`[Chat] Injection attempt from user ${user.id}`);
    }

    // --- Load User Context ---
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('business_type, bir_registered')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Read tier from subscriptions table (SELECT-only RLS — users cannot modify)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    const tier: UserTier = (subscription?.tier as UserTier) ?? 'free';

    const userContext: UserContext = {
      firstName: userData?.display_name ?? null,
      businessType: profile?.business_type ?? null,
      tier,
      birRegistered: profile?.bir_registered ?? false,
    };

    // --- Model Selection ---
    const selectedModel = selectModel(tier, feature as KAFeature);
    const maxTokens = getMaxTokens(feature as KAFeature);

    // --- Circuit Breaker (pre-call) ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return NextResponse.json({
        success: true,
        data: { message: KA_ERROR_MESSAGES.api_key_missing },
      });
    }

    // --- Circuit Breaker: Fail-Closed ---
    // If spend tracking is unavailable, block AI requests rather than allowing unbounded spend.
    let serviceSupabase: ReturnType<typeof createServiceClient>;
    try {
      serviceSupabase = createServiceClient();
    } catch {
      console.error('[Chat] Service role client unavailable — blocking requests (fail-closed)');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
            message_tl: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
          },
        },
        { status: 503 }
      );
    }

    const estimatedInputTokens = 2000;
    const estCost = estimateCost(selectedModel, estimatedInputTokens, maxTokens);

    let cbResult;
    try {
      cbResult = await checkCircuitBreaker(serviceSupabase, user.id, estCost, tier);
    } catch (cbError) {
      console.error('[Chat] Circuit breaker check failed — blocking requests (fail-closed)', cbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
            message_tl: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
          },
        },
        { status: 503 }
      );
    }

    if (!cbResult.allowed) {
      const errorKey = cbResult.reason === 'global_cap' ? 'global_cap' : 'user_cap';
      const errorMessage = tier === 'free' && cbResult.reason === 'user_cap'
        ? KA_ERROR_MESSAGES.free_tier_limit
        : KA_ERROR_MESSAGES[errorKey];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: errorMessage,
            message_tl: errorMessage,
          },
        },
        { status: 429 }
      );
    }

    // --- Prompt Assembly ---
    const systemPrompt = assembleSystemPrompt({
      feature: feature as KAFeature,
      userContext,
    });

    // --- Conversation History ---
    const { data: history } = await supabase
      .from('ka_conversations')
      .select('role, content')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from('ka_conversations').insert({
      user_id: user.id,
      role: 'user',
      content: sanitizedInput.trim(),
      domain: 'general',
    });

    // --- Claude API Call ---
    const anthropic = new Anthropic({ apiKey });

    const contextMessages: Anthropic.MessageParam[] = [
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: sanitizedInput.trim() },
    ];

    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: contextMessages,
    });

    // --- Extract Response ---
    const rawResponse =
      response.content[0].type === 'text'
        ? response.content[0].text
        : KA_ERROR_MESSAGES.api_error;

    // --- Output Guardrails ---
    const filteredResponse = filterOutput(rawResponse);
    const finalResponse = applyBIRDisclaimer(filteredResponse, 'chat');

    // --- Record Spend ---
    // Failure to record spend should log but not block the response (API call already succeeded)
    try {
      const actualCost = calculateActualCost(
        selectedModel,
        response.usage.input_tokens,
        response.usage.output_tokens
      );
      await recordSpend(serviceSupabase, user.id, actualCost, feature as KAFeature);
    } catch (spendError) {
      console.error('[Chat] Failed to record spend — API call succeeded but cost not tracked', spendError);
    }

    // --- Save Assistant Response ---
    await supabase.from('ka_conversations').insert({
      user_id: user.id,
      role: 'assistant',
      content: finalResponse,
      domain: 'general',
    });

    return NextResponse.json({ success: true, data: { message: finalResponse } });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: KA_ERROR_MESSAGES.api_error,
          message_tl: KA_ERROR_MESSAGES.api_error,
        },
      },
      { status: 500 }
    );
  }
}
