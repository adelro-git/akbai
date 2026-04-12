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

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { XenditWebhookPayloadSchema } from '@/lib/subscriptions/types';
import { recordPayment } from '@/lib/payments/record-payment';
import { linkPaymentToSubscription } from '@/lib/payments/record-payment';
import {
  activateSubscription,
  renewSubscription,
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

// --- invoice.paid: A one-time or subscription invoice was paid ---
async function handleInvoicePaid(
  serviceClient: ReturnType<typeof createServiceClient>,
  data: { id: string; external_id?: string; user_id?: string; amount: number; currency: string; payment_method?: string; paid_at?: string; subscription_id?: string }
): Promise<void> {
  if (!data.user_id) {
    console.warn('[Xendit Webhook] invoice.paid missing user_id in external_id');
    return;
  }

  // --- Record payment with idempotency ---
  const result = await recordPayment(serviceClient, {
    user_id: data.user_id,
    payment_type: data.subscription_id ? 'subscription_payment' : 'invoice_payment',
    xendit_payment_id: data.id,
    amount_centavos: Math.round(data.amount * 100),
    currency: data.currency,
    payment_method: data.payment_method as 'gcash' | 'credit_card' | 'bank_transfer' | 'cash' | 'other' | undefined,
    status: 'succeeded',
    subscription_id: data.subscription_id,
    paid_at: data.paid_at ?? new Date().toISOString(),
  });

  if (!result.inserted) {
    console.log(`[Xendit Webhook] Duplicate invoice.paid for ${data.id} — skipping`);
    return;
  }

  // --- If linked to subscription, extend the period ---
  if (data.subscription_id && result.paymentId) {
    await linkPaymentToSubscription(serviceClient, result.paymentId, data.subscription_id);
  } else if (data.subscription_id) {
    // Payment was inserted but subscription needs renewal
    await renewSubscription(serviceClient, data.user_id);
  }
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
