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
// linkPaymentToSubscription — Update subscription period on payment
// Extends the subscription's current_period_end by one month.
// ============================================================

export async function linkPaymentToSubscription(
  serviceClient: SupabaseClient,
  paymentId: string,
  subscriptionId: string
): Promise<void> {
  // --- Fetch current subscription to calculate new period ---
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
