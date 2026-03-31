/**
 * Reply Drafter API — POST /api/reply-draft (Build 7)
 *
 * Accepts a customer message and generates 2 Taglish reply options
 * using Claude Haiku. Phase 1: user copies the reply and pastes
 * into their messaging app (no API integration).
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import {
  selectModel,
  checkCircuitBreaker,
  recordSpend,
  estimateCost,
  calculateActualCost,
  KA_ERROR_MESSAGES,
} from '@/lib/claude';
import type { UserTier, KAFeature } from '@/lib/claude';
import {
  ReplyDraftRequestSchema,
  assembleReplyPrompt,
  parseReplyResponse,
  validateReplyInput,
  validateReplyOutput,
  SAFE_FALLBACK_MESSAGE,
} from '@/lib/reply-drafter';

// ============================================================
// Feature constant
// ============================================================

const FEATURE: KAFeature = 'reply_drafter';
const REPLY_DISCLAIMER =
  'Ito ay draft lang — i-review at i-edit mo bago i-send sa customer mo.';

// ============================================================
// POST Handler
// ============================================================

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
    const parsed = ReplyDraftRequestSchema.safeParse(body);

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

    const { customerMessage, context, tone } = parsed.data;

    // --- Input Guardrails ---
    const inputValidation = validateReplyInput(customerMessage);
    if (!inputValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: inputValidation.reason ?? 'Invalid input',
            message_tl: 'Hindi valid ang message. I-check mo ulit, Boss.',
          },
        },
        { status: 400 }
      );
    }

    // --- Load User Context ---
    let tier: UserTier = 'free';
    let businessType: string | null = null;
    let onboardingCompleted = false;

    if (SKIP_AUTH) {
      businessType = 'food_baking';
    } else {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_type')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      businessType = profile?.business_type ?? null;

      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      onboardingCompleted = userData?.onboarding_completed ?? false;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      tier = (subscription?.tier as UserTier) ?? 'free';
    }

    // --- Model Selection ---
    const selectedModel = selectModel(tier, FEATURE);
    const maxTokens = 512;

    // --- API Key Check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: KA_ERROR_MESSAGES.api_key_missing,
          message_tl: KA_ERROR_MESSAGES.api_key_missing,
        },
      });
    }

    // --- Circuit Breaker (skipped in dev bypass) ---
    let serviceSupabase: ReturnType<typeof createServiceClient> | null = null;
    if (!SKIP_AUTH) {
      try {
        serviceSupabase = createServiceClient();
      } catch {
        console.error('[ReplyDraft] Service role client unavailable — blocking (fail-closed)');
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

      const estimatedInputTokens = 1500;
      const estCost = estimateCost(selectedModel, estimatedInputTokens, maxTokens);

      let cbResult;
      try {
        cbResult = await checkCircuitBreaker(
          serviceSupabase, user.id, estCost, tier, onboardingCompleted
        );
      } catch (cbError) {
        console.error('[ReplyDraft] Circuit breaker check failed — blocking (fail-closed)', cbError);
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
        const errorMessage =
          tier === 'free' && cbResult.reason === 'user_cap'
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
    const systemPrompt = assembleReplyPrompt(businessType, tone);

    // Build the user message with optional context
    let userMessage = `Customer message:\n"${customerMessage}"`;
    if (context) {
      userMessage += `\n\nAdditional context from the business owner:\n${context}`;
    }

    // --- Claude API Call ---
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // --- Extract Response ---
    const rawResponse =
      response.content[0].type === 'text'
        ? response.content[0].text
        : '';

    if (!rawResponse) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: KA_ERROR_MESSAGES.api_error,
            message_tl: KA_ERROR_MESSAGES.api_error,
          },
        },
        { status: 500 }
      );
    }

    // --- Parse Reply Options ---
    const replies = parseReplyResponse(rawResponse, tone);

    // --- Output Guardrails ---
    const validatedReplies = replies.map((reply) => {
      const validation = validateReplyOutput(reply.text);
      if (!validation.valid) {
        console.warn(`[ReplyDraft] Output guardrail triggered: ${validation.reason}`);
        return { text: SAFE_FALLBACK_MESSAGE, tone: reply.tone };
      }
      return reply;
    });

    // --- Record Spend (skip in dev bypass) ---
    if (!SKIP_AUTH && serviceSupabase) {
      try {
        const actualCost = calculateActualCost(
          selectedModel,
          response.usage.input_tokens,
          response.usage.output_tokens
        );
        await recordSpend(serviceSupabase, user.id, actualCost, FEATURE);
      } catch (spendError) {
        console.error('[ReplyDraft] Failed to record spend', spendError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        replies: validatedReplies,
        disclaimer: REPLY_DISCLAIMER,
      },
    });
  } catch (error: unknown) {
    console.error('[ReplyDraft] Error:', error instanceof Error ? error.message : error);
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
