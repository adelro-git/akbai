/**
 * Morning Briefing API — GET /api/morning-briefing
 * Feature: Ang Umaga Mo (Build 5)
 * Role: Generates a personalized morning briefing via Claude, with caching
 *       in daily_check_in to limit to one API call per user per day.
 *
 * Flow: Auth check -> Feature flag -> Tier check -> Cache check -> Time window
 *       -> Aggregate data -> Assemble prompt -> Claude API -> Guardrails
 *       -> Cache result -> Return briefing
 *
 * Dependencies: Supabase (transactions, bir_deadlines, daily_check_in, users),
 *               Claude API via @anthropic-ai/sdk, morning-briefing/aggregate
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday, toManila } from '@/lib/timezone';
import { FLAGS } from '@/lib/feature-flags/flags';
import { aggregateBriefingData } from '@/lib/morning-briefing';
import {
  assembleSystemPrompt,
  selectModel,
  getMaxTokens,
  applyBIRDisclaimer,
  filterOutput,
  checkCircuitBreaker,
  recordSpend,
  estimateCost,
  calculateActualCost,
  KA_ERROR_MESSAGES,
} from '@/lib/claude';
import type { KAFeature, UserTier, UserContext } from '@/lib/claude';
import type { MorningBriefingResponse } from '@/lib/morning-briefing/types';

// ============================================================
// Constants
// ============================================================

const FEATURE: KAFeature = 'morning_briefing';
const MORNING_WINDOW_START = 5;  // 5 AM Manila
const MORNING_WINDOW_END = 12;   // 12 PM Manila

// ============================================================
// GET — Generate or return cached morning briefing
// ============================================================

export async function GET() {
  try {
    const supabase = await createClient();

    // --- Auth Check ---
    let userId: string;
    let tier: UserTier = 'free';
    let userContext: UserContext;
    let onboardingCompleted = false;

    if (SKIP_AUTH) {
      userId = DEV_USER.id;
      tier = 'pro'; // Dev mode simulates pro tier for briefing access
      userContext = {
        firstName: 'Boss',
        businessType: 'food_baking',
        tier: 'pro',
        birRegistered: false,
      };
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

      userId = authUser.id;

      // --- Load user profile data ---
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('business_type, bir_registered')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      const { data: userData } = await supabase
        .from('users')
        .select('display_name, onboarding_completed, feature_flags')
        .eq('id', userId)
        .single();

      onboardingCompleted = userData?.onboarding_completed ?? false;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      tier = (subscription?.tier as UserTier) ?? 'free';

      userContext = {
        firstName: userData?.display_name ?? null,
        businessType: profile?.business_type ?? null,
        tier,
        birRegistered: profile?.bir_registered ?? false,
      };

      // --- Feature Flag Check ---
      const featureFlags = (userData?.feature_flags ?? {}) as Record<string, boolean>;
      if (featureFlags[FLAGS.MORNING_BRIEFING_ENABLED] === false) {
        const response: MorningBriefingResponse = {
          available: false,
          reason: 'feature_disabled',
          cached: false,
          message_tl: 'Ang Morning Briefing ay hindi pa available sa account mo.',
        };
        return NextResponse.json({ success: true, data: response });
      }
    }

    // --- Tier Check: Pro or Business only ---
    if (tier === 'free' && !SKIP_AUTH) {
      const response: MorningBriefingResponse = {
        available: false,
        reason: 'tier_required',
        cached: false,
        message_tl: 'Mag-upgrade sa Pro para makita ang Morning Briefing mo!',
      };
      return NextResponse.json({ success: true, data: response });
    }

    // --- Cache Check: look for today's briefing ---
    const today = getManilaToday();

    if (!SKIP_AUTH) {
      const { data: cached } = await supabase
        .from('daily_check_in')
        .select('briefing_content, briefing_generated_at')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .is('deleted_at', null)
        .not('briefing_content', 'is', null)
        .single();

      if (cached?.briefing_content) {
        const response: MorningBriefingResponse = {
          available: true,
          briefing: cached.briefing_content,
          cached: true,
        };
        return NextResponse.json({ success: true, data: response });
      }
    }

    // --- Time Window Check (5AM-12PM Manila) ---
    const manilaHour = toManila().getUTCHours();
    if (manilaHour < MORNING_WINDOW_START || manilaHour >= MORNING_WINDOW_END) {
      // In dev mode, skip the time window check so we can test anytime
      if (!SKIP_AUTH) {
        const response: MorningBriefingResponse = {
          available: false,
          reason: 'outside_window',
          cached: false,
          message_tl: 'Bukas ulit! Ang Morning Briefing mo ay available from 5AM to 12PM.',
        };
        return NextResponse.json({ success: true, data: response });
      }
    }

    // --- API Key Check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      // Graceful fallback when no API key configured
      const response: MorningBriefingResponse = {
        available: false,
        reason: 'error',
        cached: false,
        message_tl: 'Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.',
      };
      return NextResponse.json({ success: true, data: response });
    }

    // --- Circuit Breaker (skip in dev bypass) ---
    const selectedModel = selectModel(tier, FEATURE);
    const maxTokens = getMaxTokens(FEATURE);
    let serviceSupabase: ReturnType<typeof createServiceClient> | null = null;

    if (!SKIP_AUTH) {
      try {
        serviceSupabase = createServiceClient();
      } catch {
        console.error('[MorningBriefing] Service role client unavailable — blocking (fail-closed)');
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

      const estimatedInputTokens = 3000; // briefing prompts are larger
      const estCost = estimateCost(selectedModel, estimatedInputTokens, maxTokens);

      let cbResult;
      try {
        cbResult = await checkCircuitBreaker(
          serviceSupabase, userId, estCost, tier, onboardingCompleted
        );
      } catch (cbError) {
        console.error('[MorningBriefing] Circuit breaker check failed — blocking (fail-closed)', cbError);
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
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: KA_ERROR_MESSAGES[errorKey],
              message_tl: KA_ERROR_MESSAGES[errorKey],
            },
          },
          { status: 429 }
        );
      }
    }

    // --- Aggregate Data ---
    const context = await aggregateBriefingData(supabase, userId);

    // --- Assemble System Prompt ---
    const systemPrompt = assembleSystemPrompt({
      feature: FEATURE,
      userContext,
      dataContext: JSON.stringify(context),
    });

    // --- Claude API Call ---
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user' as const,
          content: `Generate my morning briefing for today, ${context.briefing_date} (${context.day_of_week}).`,
        },
      ],
    });

    // --- Extract Response ---
    const rawResponse =
      response.content[0].type === 'text'
        ? response.content[0].text
        : KA_ERROR_MESSAGES.api_error;

    // --- Output Guardrails ---
    const filteredResponse = filterOutput(rawResponse);
    const finalResponse = applyBIRDisclaimer(filteredResponse, 'card');

    // --- Record Spend (skip in dev bypass) ---
    if (!SKIP_AUTH && serviceSupabase) {
      try {
        const actualCost = calculateActualCost(
          selectedModel,
          response.usage.input_tokens,
          response.usage.output_tokens
        );
        await recordSpend(serviceSupabase, userId, actualCost, FEATURE);
      } catch (spendError) {
        console.error('[MorningBriefing] Failed to record spend', spendError);
      }
    }

    // --- Cache Result: upsert into daily_check_in ---
    if (!SKIP_AUTH) {
      await supabase
        .from('daily_check_in')
        .upsert(
          {
            user_id: userId,
            check_in_date: today,
            briefing_content: finalResponse,
            briefing_generated_at: new Date().toISOString(),
            kai_greeting: '', // required column, briefing-only check-ins use empty string
          },
          { onConflict: 'user_id,check_in_date' }
        );
    }

    const briefingResponse: MorningBriefingResponse = {
      available: true,
      briefing: finalResponse,
      cached: false,
    };
    return NextResponse.json({ success: true, data: briefingResponse });
  } catch (error: unknown) {
    console.error('[MorningBriefing] Error:', error instanceof Error ? error.message : error);

    const response: MorningBriefingResponse = {
      available: false,
      reason: 'error',
      cached: false,
      message_tl: 'Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.',
    };
    return NextResponse.json({ success: true, data: response });
  }
}
