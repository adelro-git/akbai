/**
 * Subscription Lifecycle — State transitions for subscription management
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Activate, pause, cancel, and renew subscriptions via service role
 *
 * State Machine:
 *   free → active (on first payment)
 *   active → past_due (payment failed) → cancelled (grace expired)
 *   active → cancelled (user cancels)
 *   past_due → active (payment received)
 *   trialing → active (converted) | cancelled (trial ended)
 *
 * Dependencies: Supabase service client (bypasses RLS)
 * Tested by: QA — activate, cancel, renew state transitions
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from './types';
import { SCAN_LIMITS } from './types';

// ============================================================
// activateSubscription — Transition to active status with tier
// Called after successful payment or recurring plan activation.
// Sets tier, scan limits, and billing period.
// ============================================================

export async function activateSubscription(
  serviceClient: SupabaseClient,
  userId: string,
  tier: SubscriptionTier,
  options?: {
    xenditSubscriptionId?: string;
    xenditCustomerId?: string;
    paymentMethod?: string;
  }
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await serviceClient
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        tier,
        status: 'active',
        xendit_subscription_id: options?.xenditSubscriptionId ?? null,
        xendit_customer_id: options?.xenditCustomerId ?? null,
        payment_method: options?.paymentMethod ?? null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        scan_limit: SCAN_LIMITS[tier],
        scans_used_this_period: 0,
        grace_period_end: null,
        grace_notifications_sent: 0,
        cancelled_at: null,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error(`[Subscription] Failed to activate for user ${userId}:`, error.message);
    throw new Error(`Failed to activate subscription: ${error.message}`);
  }

  console.log(`[Subscription] Activated ${tier} for user ${userId}`);
}

// ============================================================
// pauseSubscription — Set status to past_due (payment problem)
// Called when a payment fails. Grace period is handled separately.
// ============================================================

export async function pauseSubscription(
  serviceClient: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await serviceClient
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('status', ['active']);

  if (error) {
    console.error(`[Subscription] Failed to pause for user ${userId}:`, error.message);
    throw new Error(`Failed to pause subscription: ${error.message}`);
  }

  console.log(`[Subscription] Paused subscription for user ${userId}`);
}

// ============================================================
// cancelSubscription — Set status to cancelled, record timestamp
// Called when user cancels or grace period expires.
// Resets tier to 'free' and clears scan limits.
// ============================================================

export async function cancelSubscription(
  serviceClient: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await serviceClient
    .from('subscriptions')
    .update({
      status: 'cancelled',
      tier: 'free',
      cancelled_at: new Date().toISOString(),
      scan_limit: SCAN_LIMITS.free,
      grace_period_end: null,
      grace_notifications_sent: 0,
    })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error(`[Subscription] Failed to cancel for user ${userId}:`, error.message);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }

  console.log(`[Subscription] Cancelled subscription for user ${userId}`);
}

// ============================================================
// renewSubscription — Extend current period by 30 days
// Called on successful recurring payment. Clears grace period
// and resets scan usage for the new billing period.
// ============================================================

export async function renewSubscription(
  serviceClient: SupabaseClient,
  userId: string,
  tier?: SubscriptionTier
): Promise<void> {
  // --- Fetch current subscription to get tier if not provided ---
  const { data: sub, error: fetchError } = await serviceClient
    .from('subscriptions')
    .select('tier, current_period_end')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !sub) {
    console.error(`[Subscription] No subscription found for user ${userId}:`, fetchError?.message);
    throw new Error(`No subscription found for user ${userId}`);
  }

  const effectiveTier = (tier ?? sub.tier) as SubscriptionTier;
  const now = new Date();
  const baseDate = sub.current_period_end
    ? new Date(sub.current_period_end)
    : now;
  const newPeriodEnd = new Date(baseDate);
  newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

  const { error: updateError } = await serviceClient
    .from('subscriptions')
    .update({
      tier: effectiveTier,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: newPeriodEnd.toISOString(),
      scan_limit: SCAN_LIMITS[effectiveTier],
      scans_used_this_period: 0,
      grace_period_end: null,
      grace_notifications_sent: 0,
    })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (updateError) {
    console.error(`[Subscription] Failed to renew for user ${userId}:`, updateError.message);
    throw new Error(`Failed to renew subscription: ${updateError.message}`);
  }

  console.log(
    `[Subscription] Renewed ${effectiveTier} for user ${userId} — period ends ${newPeriodEnd.toISOString()}`
  );
}
