/**
 * Payment Recording — Insert payment records with idempotency (Gap D2)
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Service-role-only functions that write to the payments table
 *
 * Flow: Xendit webhook → recordPayment() → INSERT ... ON CONFLICT DO NOTHING
 *       If xendit_payment_id already exists, no-op (idempotent).
 *
 * Dependencies: Supabase service client (bypasses RLS)
 * Tested by: QA — duplicate payment handling, invoice/subscription linking
 */

import * as Sentry from '@sentry/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreatePaymentPayload } from './schemas';

// ============================================================
// Result Types — what callers get back from recording operations
// ============================================================

export interface RecordPaymentResult {
  /** Whether the payment was newly inserted (false = duplicate, already existed) */
  inserted: boolean;
  /** The payment ID (null if duplicate and we couldn't fetch it) */
  paymentId: string | null;
}

/**
 * Resolved AKBai subscription identity. Xendit only ever gives us its OWN
 * subscription id (a non-UUID string). We must translate that into the
 * internal `subscriptions.id` UUID before touching the payments FK or
 * extending the billing period.
 */
export interface ResolvedSubscription {
  /** Internal subscriptions.id (UUID) — the FK target for payments.subscription_id. */
  id: string;
  user_id: string;
  tier: string;
  current_period_end: string | null;
  status: string;
}

/**
 * Server-side expected monthly price per tier, in integer centavos. Used for
 * P6 amount reconciliation on recurring renewals where no per-event invoice
 * row exists. Tiers whose price we cannot independently assert are omitted —
 * the caller skips reconciliation for those (we never block a legitimate
 * renewal just because we lack a reference price).
 *
 * Pro Monthly = ₱499.00 = 49900 centavos (per terms page + paywall modal).
 */
export const TIER_EXPECTED_PRICE_CENTAVOS: Record<string, number> = {
  pro: 49900,
};

/**
 * Resolved AKBai invoice identity for a one-time invoice.paid event, including
 * the server-side total used for amount reconciliation (P6).
 */
export interface ResolvedInvoice {
  id: string;
  user_id: string;
  total_centavos: number;
  status: string;
}

// ============================================================
// recordPayment — Insert a payment record with idempotency check
// Uses INSERT ... ON CONFLICT (xendit_payment_id) DO NOTHING.
// If the payment already exists, returns { inserted: false }.
// This is the core D2 idempotency mechanism.
// ============================================================

export async function recordPayment(
  serviceClient: SupabaseClient,
  paymentData: CreatePaymentPayload
): Promise<RecordPaymentResult> {
  // --- Attempt idempotent insert ---
  // Supabase JS client doesn't support ON CONFLICT DO NOTHING directly,
  // so we use upsert with ignoreDuplicates option which maps to ON CONFLICT DO NOTHING.
  const { data, error } = await serviceClient
    .from('payments')
    .upsert(
      {
        user_id: paymentData.user_id,
        payment_type: paymentData.payment_type,
        xendit_payment_id: paymentData.xendit_payment_id ?? null,
        xendit_invoice_id: paymentData.xendit_invoice_id ?? null,
        payment_method: paymentData.payment_method ?? null,
        amount_centavos: paymentData.amount_centavos,
        currency: paymentData.currency ?? 'PHP',
        status: paymentData.status ?? 'pending',
        invoice_id: paymentData.invoice_id ?? null,
        subscription_id: paymentData.subscription_id ?? null,
        paid_at: paymentData.paid_at ?? null,
        notes: paymentData.notes ?? null,
      },
      {
        onConflict: 'xendit_payment_id',
        ignoreDuplicates: true,
      }
    )
    .select('id')
    .single();

  if (error) {
    // If the error is "no rows returned" it means the duplicate was ignored
    if (error.code === 'PGRST116') {
      console.log(
        `[Payment] Duplicate payment detected (xendit_payment_id: ${paymentData.xendit_payment_id}). Skipping.`
      );
      return { inserted: false, paymentId: null };
    }
    console.error('[Payment] Failed to record payment:', error.message);
    throw new Error(`Failed to record payment: ${error.message}`);
  }

  console.log(`[Payment] Recorded payment ${data.id} (xendit: ${paymentData.xendit_payment_id})`);
  return { inserted: true, paymentId: data.id };
}

// ============================================================
// resolveSubscriptionByXenditId — Xendit sub id → internal UUID (P2)
// Xendit's webhook carries data.subscription_id, which is XENDIT's
// subscription id (a non-UUID string), NOT subscriptions.id. We MUST
// look the row up by the xendit_subscription_id column to get the
// internal UUID before using it as the payments.subscription_id FK
// (REFERENCES subscriptions(id)) or extending the period.
// Returns null when no matching live subscription exists.
// ============================================================

export async function resolveSubscriptionByXenditId(
  serviceClient: SupabaseClient,
  xenditSubscriptionId: string
): Promise<ResolvedSubscription | null> {
  const { data: sub, error } = await serviceClient
    .from('subscriptions')
    .select('id, user_id, tier, current_period_end, status')
    .eq('xendit_subscription_id', xenditSubscriptionId)
    .is('deleted_at', null)
    .single();

  if (error || !sub) {
    console.error(
      `[Payment] No subscription found for xendit_subscription_id ${xenditSubscriptionId}:`,
      error?.message
    );
    return null;
  }

  return sub as ResolvedSubscription;
}

// ============================================================
// resolveInvoiceForPayment — Find the AKBai invoice for a webhook (P3)
// A one-time invoice.paid event references the originating AKBai invoice
// via data.external_id (the external_id we set when creating the Xendit
// invoice = the AKBai invoices.id). We resolve it scoped by user_id +
// deleted_at IS NULL so a stolen/forged external_id from another tenant
// can never be marked paid. Returns null when it can't be resolved.
// ============================================================

export async function resolveInvoiceForPayment(
  serviceClient: SupabaseClient,
  params: { invoiceId: string; userId: string }
): Promise<ResolvedInvoice | null> {
  const { invoiceId, userId } = params;

  const { data: invoice, error } = await serviceClient
    .from('invoices')
    .select('id, user_id, total_centavos, status')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error || !invoice) {
    console.error(
      `[Payment] Could not resolve invoice ${invoiceId} for user ${userId}:`,
      error?.message
    );
    return null;
  }

  return invoice as ResolvedInvoice;
}

// ============================================================
// reconcileAmount — Defense-in-depth amount check (P6)
// The stored amount comes from the UNTRUSTED webhook payload (only a
// static x-callback-token gates the request). Wherever we have a
// server-side expected amount (resolved invoice total, or a tier's
// expected price), we compare the webhook amount against it. On
// mismatch we capture to Sentry and the caller MUST abort (do not mark
// the invoice paid / do not extend the period). Equal centavos only —
// no tolerance, money is integer centavos.
// ============================================================

export function reconcileAmount(params: {
  observedCentavos: number;
  expectedCentavos: number;
  context: Record<string, unknown>;
}): boolean {
  const { observedCentavos, expectedCentavos, context } = params;

  if (observedCentavos === expectedCentavos) {
    return true;
  }

  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTags({ alert: 'payment_amount_mismatch' });
    scope.setExtras({
      observed_centavos: observedCentavos,
      expected_centavos: expectedCentavos,
      ...context,
    });
    Sentry.captureMessage(
      '[Xendit Webhook] Amount mismatch — payment NOT applied'
    );
  });

  console.error(
    `[Payment] Amount mismatch — observed ${observedCentavos}c, expected ${expectedCentavos}c. Refusing to apply.`,
    context
  );

  return false;
}

// ============================================================
// linkPaymentToInvoice — Mark an invoice as paid after payment
// Updates the invoice status and links the payment record.
// ============================================================

export async function linkPaymentToInvoice(
  serviceClient: SupabaseClient,
  paymentId: string,
  invoiceId: string
): Promise<void> {
  const { error } = await serviceClient
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .is('deleted_at', null);

  if (error) {
    console.error(`[Payment] Failed to link payment ${paymentId} to invoice ${invoiceId}:`, error.message);
    throw new Error(`Failed to update invoice status: ${error.message}`);
  }

  console.log(`[Payment] Linked payment ${paymentId} to invoice ${invoiceId} — marked as paid`);
}

// ============================================================
// linkPaymentToSubscription — Extend subscription period on renewal
// IMPORTANT (P2): `subscriptionId` here is the INTERNAL subscriptions.id
// UUID — already resolved from Xendit's id via resolveSubscriptionByXenditId.
// Do NOT pass Xendit's data.subscription_id directly; that is a non-UUID
// string keyed on the xendit_subscription_id column, not the PK.
// Extends the subscription's current_period_end by one month.
// ============================================================

export async function linkPaymentToSubscription(
  serviceClient: SupabaseClient,
  paymentId: string,
  subscriptionId: string
): Promise<void> {
  // --- Fetch current subscription (by internal UUID PK) to calc new period ---
  const { data: sub, error: fetchError } = await serviceClient
    .from('subscriptions')
    .select('current_period_end, status')
    .eq('id', subscriptionId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !sub) {
    console.error(`[Payment] Subscription ${subscriptionId} not found:`, fetchError?.message);
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  // --- Calculate new period: extend by 30 days from current end or now ---
  const baseDate = sub.current_period_end
    ? new Date(sub.current_period_end)
    : new Date();
  const newPeriodEnd = new Date(baseDate);
  newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

  const { error: updateError } = await serviceClient
    .from('subscriptions')
    .update({
      current_period_start: new Date().toISOString(),
      current_period_end: newPeriodEnd.toISOString(),
      status: 'active',
      grace_period_end: null,
      grace_notifications_sent: 0,
    })
    .eq('id', subscriptionId)
    .is('deleted_at', null);

  if (updateError) {
    console.error(
      `[Payment] Failed to update subscription ${subscriptionId}:`,
      updateError.message
    );
    throw new Error(`Failed to update subscription: ${updateError.message}`);
  }

  console.log(
    `[Payment] Linked payment ${paymentId} to subscription ${subscriptionId} — period extended to ${newPeriodEnd.toISOString()}`
  );
}
