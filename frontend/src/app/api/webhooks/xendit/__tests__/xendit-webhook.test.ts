/**
 * Xendit Webhook Handler Tests — Signature verification, event routing, idempotency
 * Feature: Xendit Payment Infrastructure (Build 8), Gap D2
 *
 * Tests: signature verification (valid, invalid, missing), event type routing,
 *        idempotency (duplicate payments), always-200 behavior
 * Mocks: Supabase service client, payment recording, subscription lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Sentry mock: unresolved targets + amount mismatches are captured ---
const mockCaptureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  withScope: (fn: (scope: unknown) => void) =>
    fn({
      setLevel: vi.fn(),
      setTags: vi.fn(),
      setExtras: vi.fn(),
      setFingerprint: vi.fn(),
    }),
}));

// --- Mock all dependencies before importing the route ---
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn().mockReturnValue({}),
}));

// record-payment: keep the real reconcileAmount + TIER price map (pure logic),
// mock the I/O functions so we can assert routing without a DB.
vi.mock('@/lib/payments/record-payment', async () => {
  const actual = await vi.importActual<typeof import('@/lib/payments/record-payment')>(
    '@/lib/payments/record-payment'
  );
  return {
    ...actual,
    recordPayment: vi.fn(),
    linkPaymentToInvoice: vi.fn(),
    linkPaymentToSubscription: vi.fn(),
    resolveSubscriptionByXenditId: vi.fn(),
    resolveInvoiceForPayment: vi.fn(),
  };
});

vi.mock('@/lib/subscriptions/lifecycle', () => ({
  activateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock('@/lib/subscriptions/grace-period', () => ({
  startGracePeriod: vi.fn(),
}));

import {
  recordPayment,
  linkPaymentToInvoice,
  linkPaymentToSubscription,
  resolveSubscriptionByXenditId,
  resolveInvoiceForPayment,
} from '@/lib/payments/record-payment';
import { activateSubscription, cancelSubscription } from '@/lib/subscriptions/lifecycle';
import { startGracePeriod } from '@/lib/subscriptions/grace-period';

// ============================================================
// Test Helpers
// ============================================================

const WEBHOOK_SECRET = 'test-webhook-secret-xyz';

function createWebhookRequest(
  body: unknown,
  callbackToken?: string
): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (callbackToken !== undefined) {
    headers['x-callback-token'] = callbackToken;
  }

  return new Request('http://localhost:3000/api/webhooks/xendit', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ============================================================
// Setup
// ============================================================

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.XENDIT_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ============================================================
// Signature Verification Tests
// ============================================================

describe('Xendit Webhook — Signature Verification', () => {
  it('should return 200 when signature is valid', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(recordPayment).mockResolvedValue({ inserted: true, paymentId: 'pay-001' });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-inv-123',
          user_id: '00000000-0000-0000-0000-000000000001',
          amount: 499,
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('should return 200 even when signature is invalid (prevent retry storms)', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      { event: 'invoice.paid', data: { id: 'xnd-123', amount: 100 } },
      'wrong-secret'
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    // But no processing should happen
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it('should return 200 when callback token header is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      { event: 'invoice.paid', data: { id: 'xnd-123', amount: 100 } }
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(recordPayment).not.toHaveBeenCalled();
  });

  it('should return 200 when XENDIT_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.XENDIT_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      { event: 'invoice.paid', data: { id: 'xnd-123', amount: 100 } },
      'some-token'
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(recordPayment).not.toHaveBeenCalled();
  });
});

// ============================================================
// Event Type Routing Tests
// ============================================================

describe('Xendit Webhook — Event Routing', () => {
  it('should process a plain invoice.paid, mark the invoice paid (P3)', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    // external_id (₱9.99 → 999 amount → 99900 centavos) resolves to an invoice
    // whose total matches, so reconciliation passes and the invoice is paid.
    vi.mocked(resolveInvoiceForPayment).mockResolvedValue({
      id: 'inv-uuid-1',
      user_id: '00000000-0000-0000-0000-000000000002',
      total_centavos: 99900,
      status: 'sent',
    });
    vi.mocked(recordPayment).mockResolvedValue({ inserted: true, paymentId: 'pay-001' });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-inv-456',
          external_id: 'inv-uuid-1',
          user_id: '00000000-0000-0000-0000-000000000002',
          amount: 999,
          currency: 'PHP',
          payment_method: 'gcash',
          paid_at: '2026-04-12T10:00:00Z',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(resolveInvoiceForPayment).toHaveBeenCalledWith(expect.anything(), {
      invoiceId: 'inv-uuid-1',
      userId: '00000000-0000-0000-0000-000000000002',
    });
    expect(recordPayment).toHaveBeenCalledTimes(1);
    // The single reachable P3 path: invoice gets marked paid.
    expect(linkPaymentToInvoice).toHaveBeenCalledWith(
      expect.anything(),
      'pay-001',
      'inv-uuid-1'
    );
    // Subscription path must NOT run for a plain invoice.
    expect(linkPaymentToSubscription).not.toHaveBeenCalled();
  });

  it('should process invoice.expired and start grace period', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      {
        event: 'invoice.expired',
        data: {
          id: 'xnd-inv-expired',
          user_id: '00000000-0000-0000-0000-000000000003',
          amount: 499,
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(startGracePeriod).toHaveBeenCalledTimes(1);
  });

  it('should process recurring.plan.activated and activate subscription', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      {
        event: 'recurring.plan.activated',
        data: {
          id: 'xnd-recurring-123',
          user_id: '00000000-0000-0000-0000-000000000004',
          amount: 499,
          currency: 'PHP',
          subscription_id: 'sub-123',
          payment_method: 'credit_card',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(activateSubscription).toHaveBeenCalledTimes(1);
  });

  it('should process recurring.plan.stopped and cancel subscription', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      {
        event: 'recurring.plan.stopped',
        data: {
          id: 'xnd-recurring-stop',
          user_id: '00000000-0000-0000-0000-000000000005',
          amount: 499,
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(cancelSubscription).toHaveBeenCalledTimes(1);
  });

  it('should return 200 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = new Request('http://localhost:3000/api/webhooks/xendit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-token': WEBHOOK_SECRET,
      },
      body: 'not json at all',
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it('should return 200 for invalid payload structure', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');

    const req = createWebhookRequest(
      { event: 'unknown.event', data: {} },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });
});

// ============================================================
// Idempotency Tests (Gap D2)
// ============================================================

describe('Xendit Webhook — Idempotency', () => {
  it('should skip processing when payment is duplicate', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(resolveInvoiceForPayment).mockResolvedValue({
      id: 'inv-uuid-dup',
      user_id: '00000000-0000-0000-0000-000000000006',
      total_centavos: 49900,
      status: 'sent',
    });
    vi.mocked(recordPayment).mockResolvedValue({ inserted: false, paymentId: null });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-duplicate-123',
          external_id: 'inv-uuid-dup',
          user_id: '00000000-0000-0000-0000-000000000006',
          amount: 499,
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(recordPayment).toHaveBeenCalledTimes(1);
    // Duplicate → invoice NOT re-marked paid.
    expect(linkPaymentToInvoice).not.toHaveBeenCalled();
  });
});

// ============================================================
// Error Handling Tests
// ============================================================

describe('Xendit Webhook — Error Handling', () => {
  it('should return 200 even when processing throws', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(resolveInvoiceForPayment).mockResolvedValue({
      id: 'inv-uuid-err',
      user_id: '00000000-0000-0000-0000-000000000007',
      total_centavos: 49900,
      status: 'sent',
    });
    vi.mocked(recordPayment).mockRejectedValue(new Error('DB connection lost'));

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-error-123',
          external_id: 'inv-uuid-err',
          user_id: '00000000-0000-0000-0000-000000000007',
          amount: 499,
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    // MUST return 200 to prevent retry storms
    expect(res.status).toBe(200);
  });
});

// ============================================================
// Subscription Renewal Tests (P2 + P4 — resolve via xendit_subscription_id)
// ============================================================

describe('Xendit Webhook — Subscription Renewal (P2/P4)', () => {
  it('should resolve the Xendit subscription id to the internal UUID and extend the period', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    // Xendit gives us its OWN id (non-UUID). Resolver returns the internal row.
    vi.mocked(resolveSubscriptionByXenditId).mockResolvedValue({
      id: 'sub-internal-uuid',
      user_id: '00000000-0000-0000-0000-000000000008',
      tier: 'pro',
      current_period_end: '2026-05-12T00:00:00Z',
      status: 'active',
    });
    vi.mocked(recordPayment).mockResolvedValue({ inserted: true, paymentId: 'pay-sub-1' });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-renewal-1',
          user_id: '00000000-0000-0000-0000-000000000008',
          amount: 499, // ₱499 Pro → 49900 centavos, matches expected price
          currency: 'PHP',
          subscription_id: 'xnd-sub-NON-uuid', // Xendit's id, NOT a UUID
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    // P2: looked up by the Xendit subscription id, not the PK.
    expect(resolveSubscriptionByXenditId).toHaveBeenCalledWith(
      expect.anything(),
      'xnd-sub-NON-uuid'
    );
    // The payments FK must use the INTERNAL UUID, never the Xendit id.
    expect(recordPayment).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subscription_id: 'sub-internal-uuid',
        payment_type: 'subscription_payment',
      })
    );
    // P4: exactly one reachable renewal path — period extended via internal UUID.
    expect(linkPaymentToSubscription).toHaveBeenCalledWith(
      expect.anything(),
      'pay-sub-1',
      'sub-internal-uuid'
    );
    // Plain-invoice path must NOT run for a subscription renewal.
    expect(linkPaymentToInvoice).not.toHaveBeenCalled();
  });

  it('should not extend the period when the Xendit subscription cannot be resolved', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(resolveSubscriptionByXenditId).mockResolvedValue(null);

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-renewal-orphan',
          user_id: '00000000-0000-0000-0000-000000000009',
          amount: 499,
          currency: 'PHP',
          subscription_id: 'xnd-sub-unknown',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(recordPayment).not.toHaveBeenCalled();
    expect(linkPaymentToSubscription).not.toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalled();
  });
});

// ============================================================
// Amount Reconciliation Tests (P6 — reject tampered amounts)
// ============================================================

describe('Xendit Webhook — Amount Reconciliation (P6)', () => {
  it('should reject a subscription renewal whose amount does not match the tier price', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(resolveSubscriptionByXenditId).mockResolvedValue({
      id: 'sub-internal-uuid',
      user_id: '00000000-0000-0000-0000-00000000000a',
      tier: 'pro', // expected 49900 centavos
      current_period_end: '2026-05-12T00:00:00Z',
      status: 'active',
    });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-tampered-sub',
          user_id: '00000000-0000-0000-0000-00000000000a',
          amount: 1, // ₱1.00 → 100 centavos, NOT ₱499
          currency: 'PHP',
          subscription_id: 'xnd-sub-1',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    // No payment recorded, no period extended.
    expect(recordPayment).not.toHaveBeenCalled();
    expect(linkPaymentToSubscription).not.toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch')
    );
  });

  it('should reject a plain invoice whose amount does not match the invoice total', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(resolveInvoiceForPayment).mockResolvedValue({
      id: 'inv-uuid-tamper',
      user_id: '00000000-0000-0000-0000-00000000000b',
      total_centavos: 250000, // ₱2,500.00 expected
      status: 'sent',
    });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-tampered-inv',
          external_id: 'inv-uuid-tamper',
          user_id: '00000000-0000-0000-0000-00000000000b',
          amount: 1, // ₱1.00 → 100 centavos, NOT ₱2,500
          currency: 'PHP',
        },
      },
      WEBHOOK_SECRET
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(recordPayment).not.toHaveBeenCalled();
    expect(linkPaymentToInvoice).not.toHaveBeenCalled();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch')
    );
  });
});
