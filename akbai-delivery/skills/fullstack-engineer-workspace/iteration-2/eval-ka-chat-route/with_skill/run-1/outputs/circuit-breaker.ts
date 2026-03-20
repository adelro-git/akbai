/**
 * Claude API Circuit Breaker — Daily Spend Cap
 * Feature: AI Integration (cost control)
 * Role: Prevents daily Claude API spending from exceeding business limits
 *
 * Responsibility: Check remaining daily budget before Claude calls. Open circuit
 * (deny requests) if daily cap exceeded. Resets at midnight Asia/Manila timezone.
 * Used by callClaude wrapper to prevent cost overruns.
 *
 * Daily cap: ₱500 (Phase 1 beta) — adjust based on actual usage patterns.
 * If circuit opens, app degrades gracefully — non-AI features continue working.
 *
 * Dependencies: Supabase admin client, ai_spend_log table
 * Tested by: QA — spend cap enforcement, timezone boundary, grace state
 */

import { createAdminClient } from '@/lib/supabase/admin';

// Daily cap in Philippine centavos (₱500.00)
// Adjust based on Phase 1 usage patterns and cost targets
const DAILY_CAP_CENTAVOS = 50000;

/**
 * Status of the circuit breaker for a given user on a given day.
 */
export interface CircuitStatus {
  allowed: boolean; // true = user can make Claude calls today
  spentToday: number; // centavos spent so far today
  dailyCap: number; // ceiling in centavos
  remainingBudget: number; // dailyCap - spentToday
}

/**
 * Check if a user can make a Claude API call today.
 *
 * Query the ai_spend_log table for today's total spend (Asia/Manila timezone).
 * Compare against DAILY_CAP_CENTAVOS. Return status object.
 *
 * Error handling: If we can't query the database (Supabase down), fail closed
 * (deny the request) for safety. Better to block a request than overspend.
 *
 * @param userId - User ID to check
 * @returns CircuitStatus with allowed flag and budget details
 */
export async function checkCircuitBreaker(userId: string): Promise<CircuitStatus> {
  const supabase = createAdminClient();

  // --- Timezone Boundary: Calculate today's date in Asia/Manila ---
  // toLocaleDateString returns YYYY-MM-DD in the specified timezone
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Manila',
  });

  // --- Query Today's Spend: Sum cost_centavos for this user, today only ---
  const { data, error } = await supabase
    .from('ai_spend_log')
    .select('cost_centavos')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00+08:00`)
    .lt('created_at', `${today}T23:59:59+08:00`);

  // --- Error Handling: Fail closed if we can't check spend ---
  if (error) {
    console.error(
      `[Circuit Breaker] Database query failed for user ${userId}. Failing closed.`,
      error
    );
    return {
      allowed: false,
      spentToday: 0,
      dailyCap: DAILY_CAP_CENTAVOS,
      remainingBudget: 0,
    };
  }

  // --- Calculate Remaining Budget ---
  const spentToday = data?.reduce((sum, row) => sum + (row.cost_centavos ?? 0), 0) ?? 0;
  const remainingBudget = Math.max(0, DAILY_CAP_CENTAVOS - spentToday);
  const allowed = spentToday < DAILY_CAP_CENTAVOS;

  if (!allowed) {
    console.warn(
      `[Circuit Breaker] Daily cap exceeded for user ${userId}. Spent: ₱${(spentToday / 100).toFixed(2)}, Cap: ₱${(DAILY_CAP_CENTAVOS / 100).toFixed(2)}`
    );
  }

  return {
    allowed,
    spentToday,
    dailyCap: DAILY_CAP_CENTAVOS,
    remainingBudget,
  };
}

/**
 * Record a Claude API call's cost in the spend log.
 *
 * Called after a successful Claude API call to track the cost against
 * the user's daily budget. Used by the circuit breaker to enforce limits.
 *
 * @param userId - User ID
 * @param costCentavos - Cost of the API call in Philippine centavos
 * @param model - Model name for audit trail (claude-haiku-4-5-20251001, claude-sonnet-4-6, etc.)
 */
export async function recordSpend(
  userId: string,
  costCentavos: number,
  model: string
): Promise<void> {
  const supabase = createAdminClient();

  // --- Log Spend: Insert into ai_spend_log with audit context ---
  const { error } = await supabase.from('ai_spend_log').insert({
    user_id: userId,
    cost_centavos: costCentavos,
    model,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error(
      `[Circuit Breaker] Failed to record spend for user ${userId}. Cost: ₱${(costCentavos / 100).toFixed(2)}, Model: ${model}`,
      error
    );
    // Don't throw — spend recording failure shouldn't break the app
    // The cost just won't be tracked, but the API call succeeded
  }
}

/**
 * Custom error thrown when the circuit breaker is open.
 *
 * Caught by callClaude wrapper and returned as { success: false, error: { code: 'AI_CIRCUIT_OPEN' } }
 * to the client. UI shows "Nag-rest muna si KA para bukas..."
 */
export class CircuitBreakerOpenError extends Error {
  constructor(
    message: string,
    public spentToday: number,
    public dailyCap: number
  ) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}
