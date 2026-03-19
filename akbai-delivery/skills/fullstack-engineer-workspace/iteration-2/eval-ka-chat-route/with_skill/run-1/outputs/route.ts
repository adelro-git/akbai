/**
 * KA Chat API Route
 * Feature: KA Chat (Build 1+)
 * Role: Accept user messages, call Claude with KA persona, return response
 *
 * Flow:
 * 1. Auth — verify session and get user ID
 * 2. Validation — parse + validate request body (Zod)
 * 3. Load Profile — fetch user and business data from Supabase
 * 4. Tier Check — verify user's subscription tier (free/pro/business)
 * 5. Build Prompt — construct KA persona system prompt with user context
 * 6. Circuit Breaker — check daily Claude spend cap
 * 7. Model Select — route to Haiku/Sonnet based on tier (free=Haiku only)
 * 8. Call Claude — send message through retry wrapper (3 max retries)
 * 9. Validate Response — ensure Claude response is non-empty text
 * 10. Store Message — save user message and KA response to ka_conversations
 * 11. Return — wrap in standard envelope { success, data, error }
 *
 * Error handling: All errors return { success: false, error: { code, message, message_tl } }
 * Retry logic: Exponential backoff with jitter, max 3 retries (4 total attempts)
 * Circuit breaker: Prevents daily spend from exceeding ₱500 cap
 *
 * Dependencies:
 * - Supabase (auth, database queries)
 * - Claude API via callClaude wrapper (includes retry + circuit breaker)
 * - Zod for validation
 * - KA persona prompt builder
 *
 * Tested by: QA — auth failures, tier limits, circuit breaker, Claude API errors,
 *           malformed requests, retry scenarios, database errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ============================================================
// Imports: Validation, Error Handling, Utilities
// ============================================================
import { ChatRequestSchema, ChatResponseSchema, ConversationMessageSchema } from './chat-schemas';
import { buildKaPersonaPrompt } from './ka-persona-prompt';
import { selectModel, calculateCost } from './model-router';
import { checkCircuitBreaker, recordSpend, CircuitBreakerOpenError } from './circuit-breaker';
import { retryWithBackoff } from './retry';

// ============================================================
// API Response Helpers
// ============================================================

/**
 * Standard API success response.
 * Wraps data in { success: true, data } envelope.
 */
function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard API error response.
 * Returns { success: false, error: { code, message, message_tl?, details? } }
 */
function apiError(
  code: string,
  message: string,
  message_tl?: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message, message_tl, details } },
    { status }
  );
}

// ============================================================
// Claude API Constants
// ============================================================

const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-6',
} as const;

type ModelId = (typeof MODELS)[keyof typeof MODELS];

// ============================================================
// POST /api/ka/chat Handler
// ============================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabaseClient = createClient();
  const supabaseAdmin = createAdminClient();

  // ============================================================
  // 1. Auth Check: Verify session and extract user ID
  // ============================================================
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    console.error('[KA Chat] Auth failed:', authError?.message);
    return apiError(
      'AUTH_REQUIRED',
      'User not authenticated',
      'Kailangan mo maging naka-login para makipag-chat sa KA',
      401
    );
  }

  const userId = user.id;
  const userEmail = user.email || 'unknown';

  // ============================================================
  // 2. Request Validation: Parse and validate request body
  // ============================================================
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error('[KA Chat] JSON parse failed:', error);
    return apiError(
      'INVALID_JSON',
      'Request body is not valid JSON',
      'May problema sa request mo. Check mo if properly formatted.',
      400
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    console.warn(`[KA Chat] Validation failed for user ${userId}:`, issues);
    return apiError(
      'VALIDATION_ERROR',
      'Invalid request body',
      'May hindi tama sa message mo. Subukan ulit.',
      400,
      { issues }
    );
  }

  const { message, scope } = parsed.data;

  console.log(`[KA Chat] New message from user ${userId}: "${message.substring(0, 50)}..."`);

  // ============================================================
  // 3. Load User Profile: Fetch user data and business context
  // ============================================================
  const { data: userProfile, error: userError } = await supabaseClient
    .from('users')
    .select(`
      id,
      email,
      first_name,
      subscription_tier,
      business_id,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    console.error(`[KA Chat] User profile not found for ${userId}:`, userError);
    return apiError(
      'USER_NOT_FOUND',
      'User profile not found',
      'May problema sa pag-load ng profile mo. Subukan ulit.',
      404
    );
  }

  // --- Fetch Business Profile (optional, handles free tier without business) ---
  let businessProfile: { name: string; type: string } | null = null;
  if (userProfile.business_id) {
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('name, type')
      .eq('id', userProfile.business_id)
      .single();
    businessProfile = business;
  }

  const businessName = businessProfile?.name ?? 'Negosyo mo';
  const businessType = businessProfile?.type ?? 'small business';
  const tier = (userProfile.subscription_tier as 'free' | 'pro' | 'business') ?? 'free';
  const userName = userProfile.first_name ?? 'Partner';

  console.log(
    `[KA Chat] User context: name=${userName}, tier=${tier}, business=${businessName}`
  );

  // ============================================================
  // 4. Tier Validation: Check if free tier exceeds daily text query limit
  // ============================================================
  if (tier === 'free') {
    // --- Count user's text queries today (Asia/Manila timezone) ---
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

    const { count, error: countError } = await supabaseClient
      .from('ka_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', 'user')
      .gte('created_at', `${today}T00:00:00+08:00`)
      .lt('created_at', `${today}T23:59:59+08:00`);

    const queryCountToday = count ?? 0;

    if (queryCountToday >= 10) {
      console.warn(
        `[KA Chat] Free tier daily limit reached for user ${userId}. Queries: ${queryCountToday}`
      );
      return apiError(
        'TIER_LIMIT_REACHED',
        'Free tier daily text query limit reached (10 per day)',
        'Na-reach mo na ang 10 text queries mo ngayong araw. Pro subscribers get unlimited. Upgrade here → [link]',
        403
      );
    }
  }

  // ============================================================
  // 5. Build KA Persona Prompt: Personalized system prompt with user context
  // ============================================================
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const systemPrompt = buildKaPersonaPrompt({
    userName,
    businessName,
    businessType,
    tier,
    todayDate: today,
  });

  // ============================================================
  // 6. Circuit Breaker Check: Verify daily Claude spend hasn't exceeded cap
  // ============================================================
  const circuitStatus = await checkCircuitBreaker(userId);
  if (!circuitStatus.allowed) {
    console.warn(
      `[KA Chat] Circuit breaker open for user ${userId}. Spent: ₱${(circuitStatus.spentToday / 100).toFixed(2)}`
    );
    return apiError(
      'AI_CIRCUIT_OPEN',
      `Daily AI spend cap reached (₱${(circuitStatus.dailyCap / 100).toFixed(2)})`,
      'Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!',
      503
    );
  }

  // ============================================================
  // 7. Model Selection: Route to Haiku/Sonnet based on tier and task
  // ============================================================
  // For KA chat, we use 'ka_reasoning' task type (always Sonnet for Pro/Business, Haiku for Free)
  const selectedModel = selectModel('ka_reasoning', tier);
  console.log(
    `[KA Chat] Selected model: ${selectedModel === MODELS.HAIKU ? 'Haiku' : 'Sonnet'} for tier=${tier}`
  );

  // ============================================================
  // 8. Claude API Call: With Retry Logic & Error Handling
  // ============================================================
  let claudeResponse: Anthropic.Message | null = null;
  let callError: Error | null = null;

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // --- Retry Wrapper: Exponential backoff, max 3 retries ---
    claudeResponse = await retryWithBackoff(
      () =>
        anthropic.messages.create({
          model: selectedModel,
          max_tokens: 1024,
          temperature: 0,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        userId,
      }
    );

    console.log(
      `[KA Chat] Claude API success for user ${userId}. Tokens: ${claudeResponse.usage.input_tokens}/${claudeResponse.usage.output_tokens}`
    );
  } catch (error: any) {
    // --- Handle Circuit Breaker Error (should not happen, but fallback) ---
    if (error instanceof CircuitBreakerOpenError) {
      console.warn(
        `[KA Chat] Circuit breaker error for user ${userId}:`,
        error.message
      );
      return apiError(
        'AI_CIRCUIT_OPEN',
        'Daily AI spend cap reached',
        'Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!',
        503
      );
    }

    // --- Handle General Claude API Errors ---
    console.error(
      `[KA Chat] Claude API error for user ${userId}:`,
      error.message || error
    );
    callError = error;

    // Check if it's a retryable error that exhausted all retries
    if (error.status === 429) {
      return apiError(
        'RATE_LIMITED',
        'Claude API rate limit exceeded (retry exhausted)',
        'KA is busy ngayon. Subukan ulit in a few moments.',
        429
      );
    }

    if (error.status >= 500) {
      return apiError(
        'CLAUDE_SERVER_ERROR',
        `Claude API server error (status ${error.status})`,
        'May technical issue sa KA ngayon. Our team is on it. Subukan ulit soon.',
        503
      );
    }

    // Default Claude error
    return apiError(
      'CLAUDE_API_ERROR',
      error.message || 'Claude API call failed',
      'May problema sa pag-process ng message mo. Subukan ulit.',
      500
    );
  }

  // ============================================================
  // 9. Validate Claude Response: Extract text and ensure non-empty
  // ============================================================
  const textBlock = claudeResponse.content.find((block) => block.type === 'text');
  const responseText = (textBlock as any)?.text ?? '';

  if (!responseText || responseText.trim().length === 0) {
    console.error(
      `[KA Chat] Empty response from Claude for user ${userId}. Raw response:`,
      claudeResponse.content
    );
    return apiError(
      'EMPTY_RESPONSE',
      'Claude returned empty response',
      'KA hindi nakasagot properly. Subukan ulit.',
      500
    );
  }

  // ============================================================
  // 10. Calculate Cost & Record Spend
  // ============================================================
  const costCentavos = calculateCost(
    selectedModel as ModelId,
    claudeResponse.usage.input_tokens,
    claudeResponse.usage.output_tokens
  );

  console.log(
    `[KA Chat] Cost: ₱${(costCentavos / 100).toFixed(2)} for user ${userId}`
  );

  await recordSpend(userId, costCentavos, claudeResponse.model);

  // ============================================================
  // 11. Store Conversation: Save user message and KA response
  // ============================================================
  try {
    // --- Insert user message ---
    const { error: userMsgError } = await supabaseAdmin
      .from('ka_conversations')
      .insert({
        user_id: userId,
        role: 'user',
        content: message,
        scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userMsgError) {
      console.error(
        `[KA Chat] Failed to store user message for ${userId}:`,
        userMsgError
      );
    }

    // --- Insert KA response ---
    const { error: kaMsgError } = await supabaseAdmin
      .from('ka_conversations')
      .insert({
        user_id: userId,
        role: 'assistant',
        content: responseText,
        scope,
        input_tokens: claudeResponse.usage.input_tokens,
        output_tokens: claudeResponse.usage.output_tokens,
        model: claudeResponse.model,
        cost_centavos: costCentavos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (kaMsgError) {
      console.error(`[KA Chat] Failed to store KA response for ${userId}:`, kaMsgError);
      // Don't fail the request — response already generated and costs already recorded
    }
  } catch (error) {
    console.error(`[KA Chat] Error storing conversation for ${userId}:`, error);
    // Don't fail the request — response was already generated successfully
  }

  // ============================================================
  // 12. Return Success Response
  // ============================================================
  const response: z.infer<typeof ChatResponseSchema> = {
    content: responseText,
    inputTokens: claudeResponse.usage.input_tokens,
    outputTokens: claudeResponse.usage.output_tokens,
    model: claudeResponse.model,
    costCentavos,
  };

  console.log(`[KA Chat] Response sent to user ${userId}. Cost: ₱${(costCentavos / 100).toFixed(2)}`);

  return apiSuccess(response, 200);
}
