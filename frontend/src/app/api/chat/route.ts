/**
 * Chat API — POST /api/chat
 * Feature: Kai Chat (Build 2) + Reply Drafter integration (Sprint 12)
 * Role: Main chat endpoint. Handles general chat AND reply-drafting requests
 *       within the same conversation thread.
 *
 * Reply Drafter integration: When the user's message is detected as a
 * reply-drafting request (customer message paste + intent keywords),
 * the chat route applies reply-drafter guardrails (no impersonation,
 * no unauthorized commitments, no financial advice) to the output.
 * The lib/reply-drafter/ guardrails and intent detector are reused.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
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
import { identifyDependencyError, getDependencyFallback } from '@/lib/health';
import { ChatRequestSchema } from '@/lib/claude/schemas';
import type { KAFeature, UserTier, UserContext } from '@/lib/claude';
import {
  detectReplyDraftIntent,
  REPLY_DISCLAIMER,
  validateReplyOutput,
  SAFE_FALLBACK_MESSAGE,
} from '@/lib/reply-drafter';

export async function POST(req: NextRequest) {
  try {
    // --- Auth Check ---
    const supabase = await createClient();

    let user;
    if (SKIP_AUTH) {
      user = DEV_USER;
    } else {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
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
      user = authUser;
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

    const { message, feature: requestedFeature } = parsed.data;

    // --- Input Sanitization ---
    const { sanitizedInput, injectionDetected } = sanitizeInput(message);
    if (injectionDetected) {
      console.warn(`[Chat] Injection attempt from user ${user.id}`);
    }

    // --- Reply-Draft Intent Detection ---
    // If the user's message looks like a reply-drafting request,
    // override the feature to 'reply_drafter' so we get the right
    // system prompt (communication scope + reply drafter feature block).
    const isReplyDraft =
      requestedFeature === 'reply_drafter' || detectReplyDraftIntent(sanitizedInput);
    const feature: KAFeature = isReplyDraft ? 'reply_drafter' : (requestedFeature as KAFeature);

    // --- Load User Context ---
    // Dev bypass uses service client to bypass RLS; auth path uses normal client
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    let tier: UserTier = 'free';
    let userContext: UserContext;
    let userData: { display_name: string | null; onboarding_completed: boolean } | null = null;

    const { data: profile } = await db
      .from('business_profiles')
      .select('business_type, bir_registered')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    const { data: userRow } = await db
      .from('users')
      .select('display_name, onboarding_completed')
      .eq('id', user.id)
      .single();
    userData = userRow;

    const { data: subscription } = await db
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    tier = (subscription?.tier as UserTier) ?? 'free';

    userContext = {
      firstName: userData?.display_name ?? null,
      businessType: profile?.business_type ?? null,
      tier,
      birRegistered: profile?.bir_registered ?? false,
    };

    // --- Model Selection ---
    const selectedModel = selectModel(tier, feature);
    const maxTokens = getMaxTokens(feature);

    // --- API Key Check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return NextResponse.json({
        success: true,
        data: { message: KA_ERROR_MESSAGES.api_key_missing },
      });
    }

    // --- Circuit Breaker (skipped in dev bypass) ---
    let serviceSupabase: ReturnType<typeof createServiceClient> | null = null;
    if (!SKIP_AUTH) {
      // Circuit Breaker: Fail-Closed —
      // If spend tracking is unavailable, block AI requests rather than allowing unbounded spend.
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
        cbResult = await checkCircuitBreaker(
          serviceSupabase, user.id, estCost, tier,
          userData?.onboarding_completed ?? false
        );
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
    }

    // --- Prompt Assembly ---
    const systemPrompt = assembleSystemPrompt({
      feature,
      userContext,
    });

    // --- Conversation History ---
    const { data: history } = await db
      .from('ka_conversations')
      .select('role, content')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(20);

    // Save user message to conversation history
    const conversationDomain = isReplyDraft ? 'communication' : 'general';
    await db.from('ka_conversations').insert({
      user_id: user.id,
      role: 'user',
      content: sanitizedInput.trim(),
      domain: conversationDomain,
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
    let filteredResponse = filterOutput(rawResponse);

    // --- Reply-Draft Output Guardrails ---
    // When this was a reply-drafting request, apply additional validation:
    // no impersonation, no unauthorized commitments, no financial advice.
    if (isReplyDraft) {
      const replyValidation = validateReplyOutput(filteredResponse);
      if (!replyValidation.valid) {
        console.warn(`[Chat] Reply-draft output guardrail triggered: ${replyValidation.reason}`);
        filteredResponse = SAFE_FALLBACK_MESSAGE;
      } else {
        // Append the reply-draft disclaimer so users know to review before sending
        filteredResponse = `${filteredResponse}\n\n${REPLY_DISCLAIMER}`;
      }
    }

    const finalResponse = applyBIRDisclaimer(filteredResponse, 'chat');

    // --- Record Spend & Save Response ---
    // Use serviceSupabase for spend recording (needs service role for ai_spend table),
    // or create one for dev bypass
    const spendClient = serviceSupabase ?? (SKIP_AUTH ? createServiceClient() : null);
    if (spendClient) {
      try {
        const actualCost = calculateActualCost(
          selectedModel,
          response.usage.input_tokens,
          response.usage.output_tokens
        );
        await recordSpend(spendClient, user.id, actualCost, feature);
      } catch (spendError) {
        console.error('[Chat] Failed to record spend — API call succeeded but cost not tracked', spendError);
      }
    }

    // Save assistant response to conversation history
    await db.from('ka_conversations').insert({
      user_id: user.id,
      role: 'assistant',
      content: finalResponse,
      domain: conversationDomain,
    });

    // --- Count today's queries for free tier warning ---
    const todayStart = new Date();
    todayStart.setUTCHours(todayStart.getUTCHours() < 16 ? -8 : 16, 0, 0, 0); // UTC+8 day boundary
    const { count } = await db
      .from('ka_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .is('deleted_at', null)
      .gte('created_at', todayStart.toISOString());
    const queriesUsedToday = count ?? 0;

    return NextResponse.json({ success: true, data: { message: finalResponse, queriesUsedToday } });
  } catch (error: unknown) {
    console.error('Chat API error:', error instanceof Error ? error.message : error);
    console.error('Chat API stack:', error instanceof Error ? error.stack : 'no stack');

    // --- Dependency-Specific Fallback: Show a targeted message based on which service failed ---
    const errorType = identifyDependencyError(error);
    const fallbackMessage = getDependencyFallback(errorType);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: fallbackMessage,
          message_tl: fallbackMessage,
        },
      },
      { status: 500 }
    );
  }
}
