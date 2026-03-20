// AKBai Build 0 — Circuit breaker: daily spend caps + atomic spend recording
// Source: ai-guardrails.md §5

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CircuitBreakerResult, KAFeature, UserTier } from './types';

/** Get today's date in Asia/Manila timezone as YYYY-MM-DD. */
function getTodayManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

/**
 * Check if a Claude API call is allowed under the circuit breaker caps.
 *
 * @param supabase - Service role Supabase client (for reading all users' spend)
 * @param userId - The user making the request
 * @param estimatedCostUsd - Pre-call cost estimate
 * @param tier - User tier (for free tier query limit enforcement)
 */
export async function checkCircuitBreaker(
  supabase: SupabaseClient,
  userId: string,
  estimatedCostUsd: number,
  tier: UserTier = 'free'
): Promise<CircuitBreakerResult> {
  const today = getTodayManila();
  const globalCap = Number(process.env.CIRCUIT_BREAKER_DAILY_CAP_USD ?? 5.0);
  const userCap = Number(process.env.CIRCUIT_BREAKER_USER_CAP_USD ?? 0.5);
  const warningPct = Number(process.env.CIRCUIT_BREAKER_WARNING_PCT ?? 0.8);

  // Check global daily spend
  const { data: globalSpend } = await supabase
    .from('daily_api_spend')
    .select('total_cost_usd')
    .eq('date', today);

  const globalTotal = globalSpend?.reduce(
    (sum: number, row: { total_cost_usd: number }) => sum + Number(row.total_cost_usd),
    0
  ) ?? 0;

  if (globalTotal + estimatedCostUsd > globalCap) {
    return { allowed: false, reason: 'global_cap', remainingUsd: Math.max(0, globalCap - globalTotal) };
  }

  // Check per-user daily spend
  const { data: userSpend } = await supabase
    .from('daily_api_spend')
    .select('total_cost_usd, query_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  const userTotal = Number(userSpend?.total_cost_usd ?? 0);
  const userQueryCount = Number(userSpend?.query_count ?? 0);

  // Free tier: enforce 10-query daily limit
  if (tier === 'free' && userQueryCount >= 10) {
    return { allowed: false, reason: 'user_cap', remainingUsd: 0 };
  }

  if (userTotal + estimatedCostUsd > userCap) {
    return { allowed: false, reason: 'user_cap', remainingUsd: Math.max(0, userCap - userTotal) };
  }

  // Check warning threshold
  const warningThresholdReached =
    globalTotal / globalCap >= warningPct || userTotal / userCap >= warningPct;

  if (warningThresholdReached) {
    console.warn(
      `[CircuitBreaker] Warning: spend at warning threshold — global: $${globalTotal.toFixed(2)}/$${globalCap}, user: $${userTotal.toFixed(2)}/$${userCap}`
    );
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
  const today = getTodayManila();

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
