/**
 * Subscription Types — Zod schemas + TypeScript types for subscription lifecycle
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Define subscription tiers, statuses, and grace period data shapes
 *
 * Used by: Xendit webhook handler, subscription API route, grace period logic,
 *          subscription UI components
 */

import { z } from 'zod';

// ============================================================
// Subscription Tier — determines feature access and scan limits
// ============================================================
// Sprint 17 — 'starter' is the ₱299 lifetime IAP tier per ADR-018.
// Resolution priority (architect Open Q 3 (a)): pro > starter > free.
// 'business' / 'scale' are Phase 2/3 forward refs preserved for
// backwards compatibility with Build 8 Xendit-era code.

export const SubscriptionTierEnum = z.enum(['free', 'starter', 'pro', 'business', 'scale']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierEnum>;

// ============================================================
// Subscription Status — lifecycle state machine
// active → past_due (payment failed, grace period starts)
// past_due → active (payment received) | cancelled (grace expired)
// trialing → active (converted) | cancelled (trial ended)
// cancelled/expired are terminal states (user must re-subscribe)
// ============================================================

export const SubscriptionStatusEnum = z.enum([
  'active',
  'past_due',
  'cancelled',
  'expired',
  'trialing',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

// ============================================================
// Subscription Row — matches subscriptions table in Supabase
// ============================================================

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  /** Trial/subscription anchor (subscriptions.started_at, NOT NULL DEFAULT now()). Trial countdown reads this. */
  started_at: string;
  xendit_subscription_id: string | null;
  xendit_customer_id: string | null;
  payment_method: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  grace_period_end: string | null;
  grace_notifications_sent: number;
  scans_used_this_period: number;
  scan_limit: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Grace Period Check Result — returned by checkGracePeriod()
// ============================================================

export const GracePeriodResultSchema = z.object({
  inGracePeriod: z.boolean(),
  daysRemaining: z.number().int().nonnegative(),
  expired: z.boolean(),
  graceEndDate: z.string().datetime().nullable(),
});
export type GracePeriodResult = z.infer<typeof GracePeriodResultSchema>;

// ============================================================
// Subscription Info — lightweight shape for API responses
// ============================================================

export const SubscriptionInfoSchema = z.object({
  tier: SubscriptionTierEnum,
  status: SubscriptionStatusEnum,
  currentPeriodEnd: z.string().datetime().nullable(),
  gracePeriod: GracePeriodResultSchema.nullable(),
  scansUsed: z.number().int().nonnegative(),
  scanLimit: z.number().int().nonnegative(),
  // P1 — true when scanLimit is the UNLIMITED_SCANS sentinel. Consumers
  // (usage meter / paywall) render a "walang-limit" label instead of the
  // raw sentinel number when this is set.
  unlimited: z.boolean(),
});
export type SubscriptionInfo = z.infer<typeof SubscriptionInfoSchema>;

// ============================================================
// Xendit Webhook Event Types — the events we handle
// ============================================================

export const XenditEventTypeEnum = z.enum([
  'invoice.paid',
  'invoice.expired',
  'recurring.plan.activated',
  'recurring.plan.stopped',
]);
export type XenditEventType = z.infer<typeof XenditEventTypeEnum>;

// ============================================================
// Xendit Webhook Payload — validated structure from Xendit callbacks
// ============================================================

export const XenditWebhookPayloadSchema = z.object({
  event: XenditEventTypeEnum,
  data: z.object({
    id: z.string().min(1),
    external_id: z.string().optional(),
    user_id: z.string().uuid().optional(),
    status: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().length(3).default('PHP'),
    payment_method: z.string().optional(),
    paid_at: z.string().optional(),
    subscription_id: z.string().optional(),
  }).passthrough(),
});
export type XenditWebhookPayload = z.infer<typeof XenditWebhookPayloadSchema>;

// ============================================================
// Scan Limits per Tier
// ============================================================
// NOTE: scan_limit is INFORMATIONAL — surfaced by /api/subscriptions and the
// paywall usage meter. There is currently NO scans_used >= scan_limit hard
// gate; the OCR route caps spend via the circuit-breaker COST caps, not this
// number. So a large sentinel for "Unlimited" tiers is purely a display
// concern, not an enforcement risk.
//
// UNLIMITED_SCANS is a safe sentinel: scan_limit is INTEGER (int4) per
// migration 023, max ~2.1B, so 1,000,000 cannot overflow the column. The UI
// renders this value as a "walang-limit" label (never the raw number) — see
// isUnlimitedScans() + the subscriptions API `unlimited` flag.
export const UNLIMITED_SCANS = 1_000_000;

export const SCAN_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,
  // Sprint 17 — Starter is the ₱299 lifetime IAP tier (100 scans/month per
  // project-context.md §4). No Kai chat; OCR + reports only.
  starter: 100,
  // P1 fix — project-context.md §4: Pro Monthly / Pro Annual = Unlimited scans.
  // The previous literal 50 was BELOW Starter's 100, which mis-stated Pro as
  // more limited than the cheaper lifetime tier.
  pro: UNLIMITED_SCANS,
  // business / scale are legacy Build-8 (Xendit-era) forward refs; unchanged.
  business: 80,
  scale: 200,
};

// ============================================================
// isUnlimitedScans — true when a scan_limit value represents the
// "Unlimited" sentinel. Use this at the UI layer to swap the raw
// number for a "walang-limit" label. Treats any value at/above the
// sentinel as unlimited so future tiers can reuse UNLIMITED_SCANS.
// ============================================================

export function isUnlimitedScans(scanLimit: number): boolean {
  return scanLimit >= UNLIMITED_SCANS;
}
