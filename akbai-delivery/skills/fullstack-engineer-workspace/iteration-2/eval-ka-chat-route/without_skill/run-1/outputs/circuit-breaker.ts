// lib/claude/circuit-breaker.ts
// Daily spend cap tracking to prevent cost overruns
//
// Circuit breaker pattern:
// - Track daily Claude API spend per user
// - Enforce hard daily cap (₱500 initially, ~$8.86 USD)
// - When cap reached, return graceful degradation (no error) — all non-AI features still work
// - Reset at midnight Asia/Manila timezone

import { createAdminClient } from '@/lib/supabase/admin';

// Daily spend cap in Philippine centavos
// ₱500 /day = 50,000 centavos (~$8.86 USD)
// This is the circuit breaker threshold. Adjust based on actual usage patterns.
const DAILY_CAP_CENTAVOS = 50000; // ₱500.00

export interface CircuitStatus {
  allowed: boolean;
  spentToday: number; // centavos spent so far today
  dailyCap: number; // Hard cap in centavos
  remainingBudget: number; // centavos remaining
  percentageUsed: number; // 0-100, for monitoring/alerting
}

/**
 * Check if a user can make another Claude API call
 *
 * Returns:
 * - allowed: true if spentToday < dailyCap
 * - spentToday: current spend for today (Asia/Manila timezone)
 * - dailyCap: the hard limit
 * - remainingBudget: max(0, dailyCap - spentToday)
 *
 * Called by lib/claude/client.ts before every API call.
 * If circuit is open (allowed=false), the caller returns a graceful error
 * and the UI shows: "Nag-rest muna si KA para bukas..."
 */
export async function checkCircuitBreaker(userId: string): Promise<CircuitStatus> {
  const supabase = createAdminClient();

  // Get today's boundary (Asia/Manila timezone)
  // Use ISO format for consistency: YYYY-MM-DDTHH:MM:SS+08:00
  const manilaDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const dayStart = `${manilaDate}T00:00:00+08:00`;
  const dayEnd = `${manilaDate}T23:59:59+08:00`;

  // Query today's total spend for this user
  const { data, error } = await supabase
    .from('ai_spend_log')
    .select('cost_centavos')
    .eq('user_id', userId)
    .gte('created_at', dayStart)
    .lt('created_at', dayEnd);

  if (error) {
    // If we can't check spend, fail closed (deny the request)
    // This prevents runaway costs if the database is flaky
    console.error('[Circuit Breaker] Check failed:', error);
    return {
      allowed: false,
      spentToday: 0,
      dailyCap: DAILY_CAP_CENTAVOS,
      remainingBudget: 0,
      percentageUsed: 100, // Fail closed = report 100% used
    };
  }

  const spentToday = data?.reduce((sum, row) => sum + row.cost_centavos, 0) ?? 0;
  const remainingBudget = Math.max(0, DAILY_CAP_CENTAVOS - spentToday);
  const percentageUsed = Math.round((spentToday / DAILY_CAP_CENTAVOS) * 100);

  return {
    allowed: spentToday < DAILY_CAP_CENTAVOS,
    spentToday,
    dailyCap: DAILY_CAP_CENTAVOS,
    remainingBudget,
    percentageUsed,
  };
}

/**
 * Record a Claude API call's cost
 *
 * Called by lib/claude/client.ts after every successful API call.
 * Stores the cost, model used, and timestamp for tracking and circuit breaker logic.
 *
 * Note: Circuit breaker is checked BEFORE the call, so we're confident there's budget.
 * But we still record every call for analytics and auditing.
 */
export async function recordSpend(userId: string, costCentavos: number, model: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('ai_spend_log').insert({
    user_id: userId,
    cost_centavos: costCentavos,
    model,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Log but don't throw — recording spend is a side effect
    // We don't want to fail the user's request if logging fails
    console.error('[Circuit Breaker] Recording spend failed:', error);
  }
}

/**
 * Estimate today's remaining budget (for UI hints)
 *
 * Can be called from client-side API routes to show budget hints:
 * - "You have ₱342 remaining for KA queries today"
 * - "Receipt scan costs ₱0.16, you have ₱25 left"
 *
 * Note: This is an estimate. The actual amount could change if multiple
 * requests are in-flight simultaneously. Always use server-side checkCircuitBreaker
 * as the source of truth.
 */
export async function estimateRemainingBudget(userId: string): Promise<{ remaining: number; formattedPhp: string }> {
  const status = await checkCircuitBreaker(userId);
  const php = status.remainingBudget / 100;
  return {
    remaining: status.remainingBudget,
    formattedPhp: `₱${php.toFixed(2)}`,
  };
}

/**
 * Database schema for ai_spend_log table
 *
 * This table tracks every Claude API call for cost monitoring and circuit breaker logic.
 *
 * CREATE TABLE IF NOT EXISTS ai_spend_log (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES auth.users(id),
 *   cost_centavos INTEGER NOT NULL,
 *   model TEXT NOT NULL,                    -- "claude-haiku-4-5-20251001" or "claude-sonnet-4-6"
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Index for fast daily aggregation (critical for circuit breaker checks)
 * CREATE INDEX idx_ai_spend_log_user_date
 *   ON ai_spend_log(user_id, created_at DESC);
 *
 * -- This table is admin-only (accessed via service role)
 * -- No user-facing RLS needed
 * ALTER TABLE ai_spend_log ENABLE ROW LEVEL SECURITY;
 */

/**
 * Circuit Breaker Behavior & User Experience
 *
 * When circuit OPENS (spentToday >= dailyCap):
 * ✓ API returns: { success: false, error: 'AI_CIRCUIT_OPEN', user_message: '...' }
 * ✓ HTTP status: 503 Service Unavailable
 * ✓ UI shows: "Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!"
 * ✓ All non-AI features continue to work (expense entry, invoice viewing, deadline list, etc.)
 * ✓ KA chat is disabled for the day
 * ✓ Circuit resets automatically at midnight Asia/Manila
 *
 * This is a graceful degradation, not an error.
 * The user's business doesn't break — just the most advanced features pause for the day.
 *
 * Monitoring & Alerting:
 * - percentageUsed >= 80%: Log warning in Sentry (heads up)
 * - percentageUsed >= 100%: Circuit opens, log info (normal behavior at scale)
 * - percentageUsed > 100%: Impossible (circuit opens at 100%), but if seen = bug
 *
 * Scaling:
 * - Phase 1 (50 users): ₱500/day cap is plenty (avg ₱10/user)
 * - Phase 2 (200 users): Might need to increase to ₱1,500-2,000/day
 * - Phase 3 (500+ users): Dynamic per-user cap based on tier
 */
