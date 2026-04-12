/**
 * Xendit Webhook Handler Tests — Signature verification, event routing, idempotency
 * Feature: Xendit Payment Infrastructure (Build 8), Gap D2
 *
 * Tests: signature verification (valid, invalid, missing), event type routing,
 *        idempotency (duplicate payments), always-200 behavior
 * Mocks: Supabase service client, payment recording, subscription lifecycle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock all dependencies before importing the route ---
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/payments/record-payment', () => ({
  recordPayment: vi.fn(),
  linkPaymentToSubscription: vi.fn(),
}));

vi.mock('@/lib/subscriptions/lifecycle', () => ({
  activateSubscription: vi.fn(),
  renewSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock('@/lib/subscriptions/grace-period', () => ({
  startGracePeriod: vi.fn(),
}));

import { recordPayment } from '@/lib/payments/record-payment';
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
  it('should process invoice.paid and record payment', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(recordPayment).mockResolvedValue({ inserted: true, paymentId: 'pay-001' });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-inv-456',
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
    expect(recordPayment).toHaveBeenCalledTimes(1);
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
    vi.mocked(recordPayment).mockResolvedValue({ inserted: false, paymentId: null });

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-duplicate-123',
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
    // Should not proceed to subscription update on duplicate
  });
});

// ============================================================
// Error Handling Tests
// ============================================================

describe('Xendit Webhook — Error Handling', () => {
  it('should return 200 even when processing throws', async () => {
    const { POST } = await import('@/app/api/webhooks/xendit/route');
    vi.mocked(recordPayment).mockRejectedValue(new Error('DB connection lost'));

    const req = createWebhookRequest(
      {
        event: 'invoice.paid',
        data: {
          id: 'xnd-error-123',
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
