/**
 * Grace Period Logic — 3-day window before subscription downgrade (Gap C2)
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Start, check, and expire grace periods when payments fail
 *
 * Flow: Payment fails → startGracePeriod() → 3 days → expireGracePeriod() → free tier
 *       Payment succeeds during grace → subscription renewed, grace cleared
 *
 * The grace_period_end and grace_notifications_sent columns on the subscriptions
 * table track this state. Auto-cancel logic in auto-cancel.ts calls
 * expireGracePeriod() for overdue subscriptions.
 *
 * Dependencies: Supabase service client (bypasses RLS)
 * Tested by: QA — start grace, check in-period, check expired, expire
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GracePeriodResult } from './types';

// ============================================================
// Grace Period Duration — 3 days (72 hours) from payment failure
// ============================================================

const GRACE_PERIOD_DAYS = 3;

// ============================================================
// startGracePeriod — Begin the 3-day grace window
// Sets status to 'past_due' and grace_period_end to now + 3 days.
// Called by webhook handler when a payment fails.
// ============================================================

export async function startGracePeriod(
  serviceClient: SupabaseClient,
  userId: string
): Promise<void> {
  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + GRACE_PERIOD_DAYS);

  const { error } = await serviceClient
    .from('subscriptions')
    .update({
      status: 'past_due',
      grace_period_end: graceEnd.toISOString(),
      grace_notifications_sent: 0,
    })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('status', ['active', 'past_due']);

  if (error) {
    console.error(`[Grace Period] Failed to start for user ${userId}:`, error.message);
    throw new Error(`Failed to start grace period: ${error.message}`);
  }

  console.log(
    `[Grace Period] Started for user ${userId} — expires ${graceEnd.toISOString()}`
  );
}

// ============================================================
// checkGracePeriod — Check if user is in grace period
// Returns whether they're in the grace window, days remaining, and
// whether the grace period has expired.
// ============================================================

export async function checkGracePeriod(
  serviceClient: SupabaseClient,
  userId: string
): Promise<GracePeriodResult> {
  const { data: sub, error } = await serviceClient
    .from('subscriptions')
    .select('status, grace_period_end')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  // --- No subscription or error: not in grace period ---
  if (error || !sub) {
    return {
      inGracePeriod: false,
      daysRemaining: 0,
      expired: false,
      graceEndDate: null,
    };
  }

  // --- No grace period set: not in grace period ---
  if (!sub.grace_period_end || sub.status !== 'past_due') {
    return {
      inGracePeriod: false,
      daysRemaining: 0,
      expired: false,
      graceEndDate: null,
    };
  }

  const now = new Date();
  const graceEnd = new Date(sub.grace_period_end);
  const msRemaining = graceEnd.getTime() - now.getTime();

  // --- Grace period has expired ---
  if (msRemaining <= 0) {
    return {
      inGracePeriod: false,
      daysRemaining: 0,
      expired: true,
      graceEndDate: sub.grace_period_end,
    };
  }

  // --- Currently in grace period ---
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    inGracePeriod: true,
    daysRemaining,
    expired: false,
    graceEndDate: sub.grace_period_end,
  };
}

// ============================================================
// expireGracePeriod — Cancel subscription after grace period ends
// Sets tier to 'free', status to 'cancelled', clears grace fields.
// Called by auto-cancel cron job or by checkGracePeriod when expired.
// ============================================================

export async function expireGracePeriod(
  serviceClient: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await serviceClient
    .from('subscriptions')
    .update({
      status: 'cancelled',
      tier: 'free',
      scan_limit: 0,
      grace_period_end: null,
      grace_notifications_sent: 0,
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error(`[Grace Period] Failed to expire for user ${userId}:`, error.message);
    throw new Error(`Failed to expire grace period: ${error.message}`);
  }

  console.log(`[Grace Period] Expired for user ${userId} — downgraded to free tier`);
}
