/**
 * Auto-Cancel — Process expired grace periods in batch
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Query all past_due subscriptions with expired grace periods and cancel them
 *
 * Designed to be called by a cron job (Supabase pg_cron or Edge Function).
 * Processes each subscription individually so one failure doesn't block others.
 *
 * Dependencies: Supabase service client (bypasses RLS)
 * Tested by: QA — batch processing, individual failure isolation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { expireGracePeriod } from './grace-period';

// ============================================================
// Result Type — Summary of batch processing
// ============================================================

export interface AutoCancelResult {
  processed: number;
  cancelled: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}

// ============================================================
// processExpiredGracePeriods — Find and cancel all expired grace periods
// Queries subscriptions where:
//   - status = 'past_due'
//   - grace_period_end < now (grace period has expired)
//   - deleted_at IS NULL
// Cancels each one individually using expireGracePeriod().
// ============================================================

export async function processExpiredGracePeriods(
  serviceClient: SupabaseClient
): Promise<AutoCancelResult> {
  const result: AutoCancelResult = {
    processed: 0,
    cancelled: 0,
    failed: 0,
    errors: [],
  };

  // --- Query all expired grace period subscriptions ---
  const { data: expiredSubs, error } = await serviceClient
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'past_due')
    .lt('grace_period_end', new Date().toISOString())
    .is('deleted_at', null);

  if (error) {
    console.error('[Auto-Cancel] Failed to query expired subscriptions:', error.message);
    throw new Error(`Failed to query expired subscriptions: ${error.message}`);
  }

  if (!expiredSubs || expiredSubs.length === 0) {
    console.log('[Auto-Cancel] No expired grace periods to process');
    return result;
  }

  console.log(`[Auto-Cancel] Found ${expiredSubs.length} expired grace period(s) to process`);

  // --- Process each subscription individually ---
  for (const sub of expiredSubs) {
    result.processed++;
    try {
      await expireGracePeriod(serviceClient, sub.user_id);
      result.cancelled++;
    } catch (err: unknown) {
      result.failed++;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ userId: sub.user_id, error: errorMessage });
      console.error(`[Auto-Cancel] Failed to cancel user ${sub.user_id}:`, errorMessage);
    }
  }

  console.log(
    `[Auto-Cancel] Complete: ${result.cancelled} cancelled, ${result.failed} failed out of ${result.processed} processed`
  );

  return result;
}
