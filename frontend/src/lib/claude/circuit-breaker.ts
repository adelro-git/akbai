// AKBai Build 0 — Circuit breaker: daily spend caps + atomic spend recording
// Source: ai-guardrails.md §5
// Sprint 18 (resilience §11): trip/warning now fire Sentry alerts so the
// circuit breaker is observable (email routing within 2 min is configured in
// the Sentry dashboard — this code only emits the event).

import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CircuitBreakerResult, KAFeature, UserTier } from './types';
import { getManilaToday } from '@/lib/timezone';

// ============================================================
// Sentry Alerting — surface circuit-breaker trips + warnings
// Server-only. We use a stable fingerprint per (alert, cap) so Sentry
// groups all events of the same kind into one issue and de-dupes alert
// emails (a tripped cap can fire on every blocked request within a day —
// without a fixed fingerprint that would be an email storm).
// ============================================================

/** Which cap the alert concerns — used as a Sentry tag + fingerprint key. */
type BreakerCap = 'global' | 'user';

// ============================================================
// Env cap parsing (C1 safety) — defensive numeric env reader.
// `Number(process.env.X ?? default)` is unsafe: an env var SET to an empty
// string ('') is NOT nullish, so `?? default` is skipped and Number('') === 0,
// which silently DISABLES the cap (cap of 0 → every request trips, or a 0
// divisor for the warning ratio → NaN). Treat '' / whitespace / NaN as "unset"
// and fall back to the default.
// ============================================================

/**
 * Read a numeric env var, falling back to `fallback` when the var is unset,
 * empty/whitespace, or not a finite number.
 */
function numericEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Fire a Sentry alert when the breaker TRIPS (a request is blocked because a
 * spend cap is exceeded). Captured at `error` level so it routes to the
 * high-priority alert rule. Extra context lets the on-call (Anton) see which
 * cap, the current spend, and the limit at a glance.
 */
function captureBreakerTrip(params: {
  cap: BreakerCap;
  currentSpendUsd: number;
  limitUsd: number;
  userId: string;
}): void {
  const { cap, currentSpendUsd, limitUsd, userId } = params;
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTags({ alert: 'circuit_breaker_trip', cap });
    // Stable per-cap fingerprint → one Sentry issue per cap, de-dupes alert spam.
    scope.setFingerprint(['circuit-breaker-trip', cap]);
    scope.setExtras({
      cap,
      current_spend_usd: Number(currentSpendUsd.toFixed(4)),
      limit_usd: limitUsd,
      // Per-user trips carry the userId; global trips include it for triage but
      // the issue is grouped by cap, not by user.
      user_id: userId,
    });
    Sentry.captureMessage(
      `[CircuitBreaker] TRIP — ${cap} daily spend cap exceeded`,
    );
  });
}

/**
 * Fire a Sentry alert when the breaker crosses the WARNING threshold (spend is
 * approaching a cap but the request is still allowed). Distinct fingerprint
 * from trips so warnings and trips are separate Sentry issues.
 */
function captureBreakerWarning(params: {
  globalSpendUsd: number;
  globalCapUsd: number;
  userSpendUsd: number;
  userCapUsd: number;
  warningPct: number;
  userId: string;
}): void {
  const { globalSpendUsd, globalCapUsd, userSpendUsd, userCapUsd, warningPct, userId } =
    params;
  // Which cap pushed us over the warning line (used for the tag + fingerprint).
  // Derive from the threshold that ACTUALLY crossed — a warning can be raised by
  // EITHER ratio, so inferring solely from the global ratio mislabels a user-only
  // warning as 'global'. Global wins the tie when both have crossed (the global
  // cap is the broader, higher-severity concern for the on-call).
  const globalCrossed = globalSpendUsd / globalCapUsd >= warningPct;
  const cap: BreakerCap = globalCrossed ? 'global' : 'user';
  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    scope.setTags({ alert: 'circuit_breaker_warning', cap });
    scope.setFingerprint(['circuit-breaker-warning', cap]);
    scope.setExtras({
      cap,
      warning_pct: warningPct,
      global_spend_usd: Number(globalSpendUsd.toFixed(4)),
      global_cap_usd: globalCapUsd,
      user_spend_usd: Number(userSpendUsd.toFixed(4)),
      user_cap_usd: userCapUsd,
      user_id: userId,
    });
    Sentry.captureMessage(
      `[CircuitBreaker] WARNING — ${cap} spend at warning threshold`,
    );
  });
}

/**
 * Check if a Claude API call is allowed under the circuit breaker caps.
 *
 * @param supabase - Service role Supabase client (for reading all users' spend)
 * @param userId - The user making the request
 * @param estimatedCostUsd - Pre-call cost estimate
 * @param tier - User tier (for free tier query limit enforcement)
 * @param onboardingCompleted - Whether user finished Kilala Kita (Gap E3: exempt during onboarding)
 */
export async function checkCircuitBreaker(
  supabase: SupabaseClient,
  userId: string,
  estimatedCostUsd: number,
  tier: UserTier = 'free',
  onboardingCompleted?: boolean
): Promise<CircuitBreakerResult> {
  const today = getManilaToday();
  const globalCap = numericEnv(process.env.CIRCUIT_BREAKER_DAILY_CAP_USD, 5.0);
  const userCap = numericEnv(process.env.CIRCUIT_BREAKER_USER_CAP_USD, 0.5);
  const warningPct = numericEnv(process.env.CIRCUIT_BREAKER_WARNING_PCT, 0.8);

  // Check global daily spend.
  // C6 (fail-open guard): a discarded read error used to be treated as "zero
  // spend" → the call was ALLOWED, defeating the fail-closed contract the chat
  // and OCR routes depend on. Capture the error and FAIL CLOSED (throw) on any
  // real DB error so the caller's existing try/catch blocks the request. An
  // empty result set legitimately means "no spend yet today" (0).
  const { data: globalSpend, error: globalErr } = await supabase
    .from('daily_api_spend')
    .select('total_cost_usd')
    .eq('date', today);

  if (globalErr) {
    throw new Error(
      `[CircuitBreaker] global spend read failed — failing closed: ${globalErr.message}`
    );
  }

  const globalTotal = globalSpend?.reduce(
    (sum: number, row: { total_cost_usd: number }) => sum + Number(row.total_cost_usd),
    0
  ) ?? 0;

  if (globalTotal + estimatedCostUsd > globalCap) {
    // --- TRIP (global cap): block + alert ---
    captureBreakerTrip({
      cap: 'global',
      currentSpendUsd: globalTotal + estimatedCostUsd,
      limitUsd: globalCap,
      userId,
    });
    return { allowed: false, reason: 'global_cap', remainingUsd: Math.max(0, globalCap - globalTotal) };
  }

  // Check per-user daily spend.
  // C6 (fail-open guard): `.maybeSingle()` returns `data: null, error: null`
  // when the user has no row for today (legitimately 0 spend), instead of
  // `.single()`'s PGRST116 "no rows" error. Any OTHER error is a real DB
  // failure → FAIL CLOSED (throw) so the caller blocks. The old code used
  // `.single()` and discarded the error, so a failed read became "0 spend"
  // and the request was allowed — a fail-open hole inside a fail-closed guard.
  const { data: userSpend, error: userErr } = await supabase
    .from('daily_api_spend')
    .select('total_cost_usd, query_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (userErr) {
    throw new Error(
      `[CircuitBreaker] user spend read failed — failing closed: ${userErr.message}`
    );
  }

  const userTotal = Number(userSpend?.total_cost_usd ?? 0);
  const userQueryCount = Number(userSpend?.query_count ?? 0);

  // Free tier: enforce 10-query daily limit (only after onboarding — Gap E3)
  if (tier === 'free' && onboardingCompleted !== false && userQueryCount >= 10) {
    // --- TRIP (user cap — free-tier query limit): block + alert ---
    captureBreakerTrip({
      cap: 'user',
      currentSpendUsd: userTotal,
      limitUsd: userCap,
      userId,
    });
    return { allowed: false, reason: 'user_cap', remainingUsd: 0 };
  }

  if (userTotal + estimatedCostUsd > userCap) {
    // --- TRIP (user cap — daily spend): block + alert ---
    captureBreakerTrip({
      cap: 'user',
      currentSpendUsd: userTotal + estimatedCostUsd,
      limitUsd: userCap,
      userId,
    });
    return { allowed: false, reason: 'user_cap', remainingUsd: Math.max(0, userCap - userTotal) };
  }

  // Check warning threshold
  const warningThresholdReached =
    globalTotal / globalCap >= warningPct || userTotal / userCap >= warningPct;

  if (warningThresholdReached) {
    console.warn(
      `[CircuitBreaker] Warning: spend at warning threshold — global: $${globalTotal.toFixed(2)}/$${globalCap}, user: $${userTotal.toFixed(2)}/$${userCap}`
    );
    // --- WARNING threshold: allowed, but alert so we can act before a trip ---
    captureBreakerWarning({
      globalSpendUsd: globalTotal,
      globalCapUsd: globalCap,
      userSpendUsd: userTotal,
      userCapUsd: userCap,
      warningPct,
      userId,
    });
  }

  return {
    allowed: true,
    remainingUsd: Math.min(globalCap - globalTotal, userCap - userTotal),
    warningThresholdReached,
  };
}

/**
 * Record actual spend after a successful Claude API call.
 * Uses the increment_daily_spend RPC for atomic upsert.
 *
 * @param supabase - Service role Supabase client
 * @param userId - The user who made the request
 * @param costUsd - Actual cost calculated from response.usage
 * @param feature - Which feature was used (for count columns)
 */
export async function recordSpend(
  supabase: SupabaseClient,
  userId: string,
  costUsd: number,
  feature: KAFeature
): Promise<void> {
  const today = getManilaToday();

  const { error } = await supabase.rpc('increment_daily_spend', {
    p_user_id: userId,
    p_date: today,
    p_cost: costUsd,
    p_feature: feature,
  });

  if (error) {
    console.error('[CircuitBreaker] Failed to record spend:', error);
  }
}
