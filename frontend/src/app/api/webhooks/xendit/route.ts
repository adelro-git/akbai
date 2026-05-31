/**
 * Xendit Webhook Handler — Receives payment callback events from Xendit
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Process invoice.paid, invoice.expired, recurring.plan.activated,
 *       recurring.plan.stopped events from Xendit.
 *
 * Flow: Xendit POST → verify signature → parse event → record payment (idempotent)
 *       → update subscription → return 200 OK always
 *
 * Security:
 *   - Verifies x-callback-token header against XENDIT_WEBHOOK_SECRET env var
 *   - Uses service role client (bypasses RLS) for all DB writes
 *   - Returns 200 OK on ALL requests to prevent Xendit retry storms
 *
 * Idempotency (Gap D2):
 *   - recordPayment() uses INSERT ... ON CONFLICT (xendit_payment_id) DO NOTHING
 *   - Duplicate webhook deliveries are silently absorbed
 *
 * Dependencies: Supabase service client, payment recording, subscription lifecycle
 * Tested by: QA — signature verification, event routing, idempotency, error handling
 */

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { XenditWebhookPayloadSchema } from '@/lib/subscriptions/types';
import {
  recordPayment,
  linkPaymentToInvoice,
  linkPaymentToSubscription,
  resolveSubscriptionByXenditId,
  resolveInvoiceForPayment,
  reconcileAmount,
  TIER_EXPECTED_PRICE_CENTAVOS,
} from '@/lib/payments/record-payment';
import {
  activateSubscription,
  cancelSubscription,
} from '@/lib/subscriptions/lifecycle';
import { startGracePeriod } from '@/lib/subscriptions/grace-period';

// ============================================================
// Signature Verification — Compare x-callback-token to env var
// Xendit sends a static callback token in the header, not HMAC.
// ============================================================

function verifyWebhookSignature(req: NextRequest): boolean {
  const callbackToken = req.headers.get('x-callback-token');
  const expectedSecret = process.env.XENDIT_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error('[Xendit Webhook] XENDIT_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!callbackToken) {
    console.warn('[Xendit Webhook] Missing x-callback-token header');
    return false;
  }

  // --- Constant-time comparison to prevent timing attacks ---
  if (callbackToken.length !== expectedSecret.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < callbackToken.length; i++) {
    mismatch |= callbackToken.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  return mismatch === 0;
}

// ============================================================
// Event Handlers — Process each Xendit event type
// ============================================================

// --- invoice.paid: A one-time invoice OR a recurring subscription renewal ---
//
// There are exactly TWO mutually-exclusive paths, picked once up front:
//
//   A. data.subscription_id present → recurring renewal. Resolve Xendit's
//      subscription id to the internal subscriptions.id UUID (P2), reconcile
//      the amount against the tier's expected price (P6), record the payment
//      with the INTERNAL UUID as the FK, then extend current_period_end.
//
//   B. no data.subscription_id → one-time invoice. Resolve the originating
//      AKBai invoice via external_id scoped to the user (P3), reconcile the
//      amount against the invoice total (P6), record the payment, then mark
//      the invoice paid.
//
// Reconciliation failures and unresolved targets are logged + sent to Sentry
// and abort the path WITHOUT applying anything — they never throw, so the
// outer POST handler still returns 200 and Xendit does not retry-storm.
async function handleInvoicePaid(
  serviceClient: ReturnType<typeof createServiceClient>,
  data: { id: string; external_id?: string; user_id?: string; amount: number; currency: string; payment_method?: string; paid_at?: string; subscription_id?: string }
): Promise<void> {
  if (!data.user_id) {
    console.warn('[Xendit Webhook] invoice.paid missing user_id in external_id');
    return;
  }

  const amountCentavos = Math.round(data.amount * 100);
  const paymentMethod = data.payment_method as
    | 'gcash'
    | 'credit_card'
    | 'bank_transfer'
    | 'cash'
    | 'other'
    | undefined;

  // ── Path A: recurring subscription renewal ──────────────────────────
  if (data.subscription_id) {
    // P2 — translate Xendit's subscription id into the internal UUID.
    const sub = await resolveSubscriptionByXenditId(serviceClient, data.subscription_id);
    if (!sub) {
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setTags({ alert: 'xendit_subscription_unresolved' });
        scope.setExtras({
          xendit_subscription_id: data.subscription_id,
          xendit_payment_id: data.id,
          user_id: data.user_id,
        });
        Sentry.captureMessage('[Xendit Webhook] invoice.paid for unknown subscription');
      });
      return;
    }

    // P6 — reconcile amount against the tier's expected price WHERE we have one.
    const expected = TIER_EXPECTED_PRICE_CENTAVOS[sub.tier];
    if (
      expected !== undefined &&
      !reconcileAmount({
        observedCentavos: amountCentavos,
        expectedCentavos: expected,
        context: {
          path: 'subscription_renewal',
          tier: sub.tier,
          subscription_id: sub.id,
          xendit_payment_id: data.id,
          user_id: data.user_id,
        },
      })
    ) {
      // Mismatch already captured to Sentry. Do NOT record / do NOT extend.
      return;
    }

    // Record with the INTERNAL UUID so the payments.subscription_id FK holds.
    const result = await recordPayment(serviceClient, {
      user_id: data.user_id,
      payment_type: 'subscription_payment',
      xendit_payment_id: data.id,
      amount_centavos: amountCentavos,
      currency: data.currency,
      payment_method: paymentMethod,
      status: 'succeeded',
      subscription_id: sub.id,
      paid_at: data.paid_at ?? new Date().toISOString(),
    });

    if (!result.inserted || !result.paymentId) {
      console.log(`[Xendit Webhook] Duplicate subscription invoice.paid for ${data.id} — skipping renewal`);
      return;
    }

    // Single reachable renewal path — extend the period by the internal UUID.
    await linkPaymentToSubscription(serviceClient, result.paymentId, sub.id);
    return;
  }

  // ── Path B: one-time (non-subscription) invoice ─────────────────────
  // P3 — resolve the originating AKBai invoice via external_id, scoped to user.
  if (!data.external_id) {
    console.warn(`[Xendit Webhook] invoice.paid ${data.id} has no external_id — cannot resolve invoice`);
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTags({ alert: 'xendit_invoice_unresolved' });
      scope.setExtras({ xendit_payment_id: data.id, user_id: data.user_id });
      Sentry.captureMessage('[Xendit Webhook] invoice.paid missing external_id');
    });
    return;
  }

  const invoice = await resolveInvoiceForPayment(serviceClient, {
    invoiceId: data.external_id,
    userId: data.user_id,
  });
  if (!invoice) {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setTags({ alert: 'xendit_invoice_unresolved' });
      scope.setExtras({
        external_id: data.external_id,
        xendit_payment_id: data.id,
        user_id: data.user_id,
      });
      Sentry.captureMessage('[Xendit Webhook] invoice.paid for unknown invoice');
    });
    return;
  }

  // P6 — reconcile webhook amount against the server-side invoice total.
  if (
    !reconcileAmount({
      observedCentavos: amountCentavos,
      expectedCentavos: invoice.total_centavos,
      context: {
        path: 'invoice_payment',
        invoice_id: invoice.id,
        xendit_payment_id: data.id,
        user_id: data.user_id,
      },
    })
  ) {
    // Mismatch already captured to Sentry. Do NOT record / do NOT mark paid.
    return;
  }

  const result = await recordPayment(serviceClient, {
    user_id: data.user_id,
    payment_type: 'invoice_payment',
    xendit_payment_id: data.id,
    amount_centavos: amountCentavos,
    currency: data.currency,
    payment_method: paymentMethod,
    status: 'succeeded',
    invoice_id: invoice.id,
    paid_at: data.paid_at ?? new Date().toISOString(),
  });

  if (!result.inserted || !result.paymentId) {
    console.log(`[Xendit Webhook] Duplicate invoice.paid for ${data.id} — skipping mark-paid`);
    return;
  }

  // P3 — single reachable path that actually marks the invoice paid.
  await linkPaymentToInvoice(serviceClient, result.paymentId, invoice.id);
}

// --- invoice.expired: Payment window expired, start grace period ---
async function handleInvoiceExpired(
  serviceClient: ReturnType<typeof createServiceClient>,
  data: { user_id?: string }
): Promise<void> {
  if (!data.user_id) {
    console.warn('[Xendit Webhook] invoice.expired missing user_id');
    return;
  }

  await startGracePeriod(serviceClient, data.user_id);
}

// --- recurring.plan.activated: Subscription plan is now active ---
async function handleRecurringActivated(
  serviceClient: ReturnType<typeof createServiceClient>,
  data: { user_id?: string; subscription_id?: string; payment_method?: string }
): Promise<void> {
  if (!data.user_id) {
    console.warn('[Xendit Webhook] recurring.plan.activated missing user_id');
    return;
  }

  await activateSubscription(serviceClient, data.user_id, 'pro', {
    xenditSubscriptionId: data.subscription_id,
    paymentMethod: data.payment_method,
  });
}

// --- recurring.plan.stopped: Subscription plan was cancelled by Xendit ---
async function handleRecurringStopped(
  serviceClient: ReturnType<typeof createServiceClient>,
  data: { user_id?: string }
): Promise<void> {
  if (!data.user_id) {
    console.warn('[Xendit Webhook] recurring.plan.stopped missing user_id');
    return;
  }

  await cancelSubscription(serviceClient, data.user_id);
}

// ============================================================
// POST Handler — Main webhook entry point
// ALWAYS returns 200 OK to prevent Xendit retry storms.
// Errors are logged but never surfaced as non-2xx responses.
// ============================================================

export async function POST(req: NextRequest) {
  // --- Log all incoming webhooks for debugging ---
  console.log('[Xendit Webhook] Received callback');

  // --- Verify signature ---
  if (!verifyWebhookSignature(req)) {
    console.warn('[Xendit Webhook] Signature verification failed');
    // Return 200 even on auth failure to prevent retry storms
    // Log the failure for security monitoring
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 }
    );
  }

  // --- Parse body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn('[Xendit Webhook] Invalid JSON body');
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 }
    );
  }

  // --- Validate payload structure ---
  const parsed = XenditWebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('[Xendit Webhook] Invalid payload structure:', parsed.error.flatten());
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 }
    );
  }

  const { event, data } = parsed.data;
  console.log(`[Xendit Webhook] Processing event: ${event}, payment_id: ${data.id}`);

  // --- Route to event handler ---
  try {
    const serviceClient = createServiceClient();

    switch (event) {
      case 'invoice.paid':
        await handleInvoicePaid(serviceClient, data);
        break;

      case 'invoice.expired':
        await handleInvoiceExpired(serviceClient, data);
        break;

      case 'recurring.plan.activated':
        await handleRecurringActivated(serviceClient, data);
        break;

      case 'recurring.plan.stopped':
        await handleRecurringStopped(serviceClient, data);
        break;

      default:
        console.log(`[Xendit Webhook] Unhandled event type: ${event}`);
    }
  } catch (error: unknown) {
    // --- Log error but ALWAYS return 200 ---
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Xendit Webhook] Error processing ${event}:`, message);
  }

  return NextResponse.json(
    { success: true, data: { received: true } },
    { status: 200 }
  );
}
