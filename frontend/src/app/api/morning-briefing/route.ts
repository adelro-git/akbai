/**
 * Morning Briefing API — GET /api/morning-briefing
 * Feature: Ang Umaga Mo (Build 5) + Phase 7 D6 tonal rotation
 * Role: Generates a personalized morning briefing via Claude, with caching
 *       in daily_check_in to limit to one API call per user per day. Phase 7
 *       extends the response with a `tagline` (≤ 80 chars) + `tone` so the
 *       Kumustahan hero on the new home renders a tone-rotated one-liner.
 *
 * Flow: Auth check -> Feature flag -> Tier check -> Cache check -> Time window
 *       -> Pick tone (deterministic, day-of-year % 3)
 *       -> Aggregate data -> Assemble prompt (with JSON output hint)
 *       -> Claude API -> Parse JSON (briefing + tagline) -> Guardrails
 *       -> Cache result -> Return briefing + tagline + tone
 *
 * Graceful Claude fallback (Anton's call 2026-04-26 — credits intentionally
 * not topped up before the 24h feel-test gate):
 *   - Missing API key (or dev placeholder)
 *   - SDK throws `credit balance` / `insufficient` 4xx
 *   - SDK throws any 5xx after circuit breaker passed
 * In all three cases the route returns
 *   { available: true, tone, tagline, briefing, cached: false, reason: 'no_credits' }
 * using deterministic templates from `fallback-templates.ts`. No financial
 * figures are fabricated.
 *
 * Schema note (Phase 7, pre-migration): the response now includes
 * `tagline` + `tone` but the `daily_check_in` cache table does NOT yet have
 * `briefing_tagline` / `briefing_tone` columns. Until migration `013_morning_briefing_tone.sql`
 * lands, we serve tagline + tone live in the response without persisting them.
 * Today's first-day cache miss therefore re-runs Claude per day — acceptable
 * for the feel-test window. Once the migration ships, populate the cache write
 * + the cache-hit read paths to include the new columns.
 *
 * Dependencies: Supabase (transactions, bir_deadlines, daily_check_in, users),
 *               Claude API via @anthropic-ai/sdk, morning-briefing/aggregate,
 *               morning-briefing/tone, morning-briefing/fallback-templates
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday, toManila } from '@/lib/timezone';
import { FLAGS } from '@/lib/feature-flags/flags';
import {
  aggregateBriefingData,
  pickTone,
  pickFallback,
} from '@/lib/morning-briefing';
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
import type {
  MorningBriefingResponse,
  MorningTone,
} from '@/lib/morning-briefing/types';

// ============================================================
// Constants
// ============================================================

const FEATURE: KAFeature = 'morning_briefing';
const MORNING_WINDOW_START = 5;  // 5 AM Manila
const MORNING_WINDOW_END = 12;   // 12 PM Manila — kept for documentation only; gate uses 23
void MORNING_WINDOW_END;

// ============================================================
// Helpers
// ============================================================

/**
 * Build the per-call output-format hint that asks Claude to emit BOTH
 * a full briefing paragraph AND a one-liner tagline matching the picked tone.
 * Kept here (not in features.ts) so the tone is injected at request time.
 */
function buildOutputFormatHint(tone: MorningTone): string {
  const toneGuidance: Record<MorningTone, string> = {
    energetic:
      'Punchy, action-leaning. Kumukumpas ka — like nudging the user to start the day. Example shape: "Tara, simulan na natin ang araw, {name}!"',
    observant:
      'Calm, noticing. You see one small thing from yesterday and acknowledge it without dramatizing. Example shape: "Magandang araw, {name}. {micro-observation about yesterday}."',
    celebratory:
      'Warm, recognising progress. Highlight one positive shape from yesterday — never invent figures. Example shape: "Ayos, {name}! {one positive shape from yesterday}."',
  };

  return `[OUTPUT_FORMAT — STRICT]
Return ONLY a single JSON object (no prose, no markdown fences) with EXACTLY these two fields:
{
  "briefing": "<full paragraph as today, ~120-200 words, conversational Filipino>",
  "tagline": "<one-liner ≤ 80 chars, tone='${tone}'>"
}

TONE='${tone}' — ${toneGuidance[tone]}

TAGLINE RULES:
- Maximum 80 characters (HARD LIMIT — count before emitting).
- Conversational Filipino. No tax claims, no advice, no bare English verbs.
- May use the user's first name if known.
- Must match the tone above.
- Do NOT include the BIR disclaimer in the tagline.

If you cannot produce a tagline that satisfies these constraints, omit the
"tagline" field entirely and return only { "briefing": "..." }. Never invent numbers.`;
}

interface ParsedClaudeOutput {
  briefing: string;
  tagline?: string;
}

/**
 * Parse Claude's response into { briefing, tagline? }.
 * Permissive — strips markdown fences and tolerates surrounding prose.
 * On any parse failure, falls back to using the entire raw text as `briefing`
 * with no tagline (so the hero degrades to a static greeting client-side).
 */
function parseClaudeOutput(rawText: string): ParsedClaudeOutput {
  const trimmed = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  // Try direct JSON.parse first.
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object' && typeof parsed.briefing === 'string') {
      const out: ParsedClaudeOutput = { briefing: parsed.briefing };
      if (typeof parsed.tagline === 'string' && parsed.tagline.trim().length > 0) {
        out.tagline = parsed.tagline.trim();
      }
      return out;
    }
  } catch {
    // fall through to substring extraction
  }

  // Fall back: find the first {...} object in the text.
  const objMatch = candidate.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed && typeof parsed === 'object' && typeof parsed.briefing === 'string') {
        const out: ParsedClaudeOutput = { briefing: parsed.briefing };
        if (typeof parsed.tagline === 'string' && parsed.tagline.trim().length > 0) {
          out.tagline = parsed.tagline.trim();
        }
        return out;
      }
    } catch {
      // fall through
    }
  }

  // No JSON parsable — return raw text as the briefing, no tagline.
  return { briefing: rawText };
}

/**
 * True if the SDK error is a credit-balance / insufficient-funds 4xx.
 * Anthropic surfaces these with messages like "Your credit balance is too low...".
 * We match defensively (case-insensitive substring) so we don't miss minor
 * wording changes between SDK versions.
 */
function isCreditBalanceError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes('credit balance')) return true;
  if (lower.includes('insufficient')) return true;
  return false;
}

/**
 * True if this looks like a 5xx server error from Anthropic.
 * The SDK exposes `status` on most error subclasses; we also fall back to
 * substring sniffing for environments that throw plain Errors.
 */
function isServerError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number' && status >= 500 && status < 600) return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /\b5\d\d\b/.test(msg) || /overload|server error/i.test(msg);
}

/**
 * Build a graceful-fallback response. Uses the deterministic templates so
 * the hero still has a Kumustahan one-liner even when Claude is unreachable.
 */
function buildFallbackResponse(
  briefingDate: string,
  firstName: string | null
): MorningBriefingResponse {
  const tone = pickTone(briefingDate);
  const fallback = pickFallback(tone, briefingDate, firstName);
  return {
    available: true,
    briefing: fallback.briefing,
    tagline: fallback.tagline,
    tone,
    cached: false,
    reason: 'no_credits',
  };
}

// ============================================================
// GET — Generate or return cached morning briefing
// ============================================================

export async function GET() {
  let pickedTone: MorningTone | null = null;
  let userFirstName: string | null = null;
  let briefingDate = getManilaToday();

  try {
    const supabase = await createClient();

    // --- Auth Check ---
    let userId: string;
    let tier: UserTier = 'free';
    let userContext: UserContext;
    let onboardingCompleted = false;

    if (SKIP_AUTH) {
      userId = DEV_USER.id;
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
    }

    // Dev bypass uses service client to bypass RLS; auth path uses normal client
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    // --- Load user profile data ---
    const { data: profileData } = await db
      .from('business_profiles')
      .select('business_type, bir_registered')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    const { data: userData } = await db
      .from('users')
      .select('display_name, onboarding_completed, feature_flags')
      .eq('id', userId)
      .single();

    onboardingCompleted = userData?.onboarding_completed ?? false;
    userFirstName = userData?.display_name ?? null;

    const { data: subscriptionData } = await db
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    tier = (subscriptionData?.tier as UserTier) ?? 'free';

    // Dev mode simulates pro tier for briefing access when no subscription exists
    if (SKIP_AUTH && tier === 'free') {
      tier = 'pro';
    }

    userContext = {
      firstName: userFirstName,
      businessType: profileData?.business_type ?? null,
      tier,
      birRegistered: profileData?.bir_registered ?? false,
    };

    // --- Feature Flag Check ---
    if (!SKIP_AUTH) {
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
    briefingDate = today;
    pickedTone = pickTone(today);

    const { data: cached } = await db
      .from('daily_check_in')
      .select('briefing_content, briefing_generated_at')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .is('deleted_at', null)
      .not('briefing_content', 'is', null)
      .single();

    if (cached?.briefing_content) {
      // Cache hit. Pre-migration the cache row only stores `briefing_content`.
      // We still return tone (deterministic from today's date), but the tagline
      // will be undefined for cached rows — the hero degrades cleanly.
      // Once migration 013 lands, read briefing_tagline + briefing_tone here.
      const response: MorningBriefingResponse = {
        available: true,
        briefing: cached.briefing_content,
        tone: pickedTone,
        cached: true,
      };
      return NextResponse.json({ success: true, data: response });
    }

    // --- Time Window Check ---
    // Briefing is generated once daily (cached). Available all day after generation.
    // Only block NEW generation outside 5AM-11PM Manila — but if cache exists,
    // it was already returned above, so this only gates first-time generation.
    const manilaHour = toManila().getUTCHours();
    if (!SKIP_AUTH && (manilaHour < MORNING_WINDOW_START || manilaHour >= 23)) {
      const response: MorningBriefingResponse = {
        available: false,
        reason: 'outside_window',
        cached: false,
        message_tl: 'Bukas ulit! Ang Morning Briefing mo ay available mula 5AM.',
      };
      return NextResponse.json({ success: true, data: response });
    }

    // --- API Key Check (graceful fallback per Phase 7) ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      const response = buildFallbackResponse(today, userFirstName);
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
    const context = await aggregateBriefingData(db, userId);

    // --- Assemble System Prompt (with tone-aware output format hint) ---
    const systemPrompt = assembleSystemPrompt({
      feature: FEATURE,
      userContext,
      dataContext: JSON.stringify(context),
      outputFormatHint: buildOutputFormatHint(pickedTone),
    });

    // --- Claude API Call (graceful fallback on credit/5xx errors) ---
    const anthropic = new Anthropic({ apiKey });

    let response;
    try {
      response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user' as const,
            content: `Generate my morning briefing for today, ${context.briefing_date} (${context.day_of_week}). Tone for the tagline: ${pickedTone}.`,
          },
        ],
      });
    } catch (anthropicError) {
      if (isCreditBalanceError(anthropicError) || isServerError(anthropicError)) {
        // Avoid logging the raw error message — Anthropic SDK errors can include
        // billing-account fragments. Logging the constructor name keeps the
        // signal we need (which class of failure fired) without the leak.
        console.warn(
          '[MorningBriefing] Claude unavailable, returning deterministic fallback. Error class:',
          anthropicError instanceof Error ? anthropicError.constructor.name : 'unknown'
        );
        const fallback = buildFallbackResponse(today, userFirstName);
        return NextResponse.json({ success: true, data: fallback });
      }
      throw anthropicError;
    }

    // --- Extract & Parse Response ---
    const rawResponse =
      response.content[0].type === 'text'
        ? response.content[0].text
        : KA_ERROR_MESSAGES.api_error;

    const parsed = parseClaudeOutput(rawResponse);

    // --- Output Guardrails (briefing only — tagline is short & tone-bound) ---
    const filteredBriefing = filterOutput(parsed.briefing);
    const finalBriefing = applyBIRDisclaimer(filteredBriefing, 'card');
    // Tagline goes through filterOutput too (sanitises injection markers)
    // but skips the BIR disclaimer since it's a one-liner under the hero.
    const finalTagline = parsed.tagline ? filterOutput(parsed.tagline) : undefined;

    // --- Record Spend ---
    const spendClient = serviceSupabase ?? (SKIP_AUTH ? createServiceClient() : null);
    if (spendClient) {
      try {
        const actualCost = calculateActualCost(
          selectedModel,
          response.usage.input_tokens,
          response.usage.output_tokens
        );
        await recordSpend(spendClient, userId, actualCost, FEATURE);
      } catch (spendError) {
        console.error('[MorningBriefing] Failed to record spend', spendError);
      }
    }

    // --- Cache Result: upsert into daily_check_in ---
    // Phase 7 note: tagline + tone are intentionally NOT persisted yet.
    // Migration 013 will add briefing_tagline + briefing_tone columns; once it
    // lands, extend this upsert to include them.
    await db
      .from('daily_check_in')
      .upsert(
        {
          user_id: userId,
          check_in_date: today,
          briefing_content: finalBriefing,
          briefing_generated_at: new Date().toISOString(),
          kai_greeting: '', // required column, briefing-only check-ins use empty string
        },
        { onConflict: 'user_id,check_in_date' }
      );

    const briefingResponse: MorningBriefingResponse = {
      available: true,
      briefing: finalBriefing,
      tagline: finalTagline,
      tone: pickedTone,
      cached: false,
    };
    return NextResponse.json({ success: true, data: briefingResponse });
  } catch (error: unknown) {
    console.error('[MorningBriefing] Error:', error instanceof Error ? error.message : error);

    // Last-ditch graceful fallback: even on unexpected errors, the hero gets
    // a tagline. Only fall back when we have a tone (i.e., we got past auth
    // and feature checks). Otherwise return the original error path so
    // 401/feature_disabled users don't get a "successful" briefing.
    if (pickedTone) {
      const fallback = buildFallbackResponse(briefingDate, userFirstName);
      return NextResponse.json({ success: true, data: fallback });
    }

    const response: MorningBriefingResponse = {
      available: false,
      reason: 'error',
      cached: false,
      message_tl: 'Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.',
    };
    return NextResponse.json({ success: true, data: response });
  }
}
