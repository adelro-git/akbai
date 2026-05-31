/**
 * Payment Recording Tests — Insert with idempotency and linking
 * Feature: Xendit Payment Infrastructure (Build 8), Gap D2
 *
 * Tests: recordPayment (new insert, duplicate handling), linkPaymentToInvoice,
 *        linkPaymentToSubscription
 * Mocks: Supabase service client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Sentry mock: reconcileAmount + resolvers capture mismatches/unresolved ---
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

import {
  recordPayment,
  linkPaymentToInvoice,
  linkPaymentToSubscription,
  resolveSubscriptionByXenditId,
  resolveInvoiceForPayment,
  reconcileAmount,
  TIER_EXPECTED_PRICE_CENTAVOS,
} from '../record-payment';
import type { CreatePaymentPayload } from '../schemas';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// Test Data
// ============================================================

const testPayment: CreatePaymentPayload = {
  user_id: '00000000-0000-0000-0000-000000000001',
  payment_type: 'subscription_payment',
  amount_centavos: 49900,
  currency: 'PHP',
  xendit_payment_id: 'xnd-pay-123',
  status: 'succeeded',
  paid_at: '2026-04-12T10:00:00Z',
};

// ============================================================
// Mock Supabase Client Factories
// ============================================================

function createMockUpsertClient(
  returnData: { id: string } | null,
  error: { code?: string; message: string } | null
) {
  return {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: returnData, error }),
        }),
      }),
    }),
  };
}

function createMockUpdateClient(error: { message: string } | null = null) {
  return {
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ error }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { current_period_end: '2026-05-12T00:00:00Z', status: 'active' },
              error: null,
            }),
          }),
        }),
      }),
    }),
  };
}

// ============================================================
// recordPayment Tests
// ============================================================

describe('recordPayment', () => {
  it('should insert a new payment and return inserted=true', async () => {
    const mockClient = createMockUpsertClient({ id: 'pay-001' }, null);

    const result = await recordPayment(mockClient as never, testPayment);

    expect(result.inserted).toBe(true);
    expect(result.paymentId).toBe('pay-001');
    expect(mockClient.from).toHaveBeenCalledWith('payments');
  });

  it('should return inserted=false for duplicate xendit_payment_id (idempotency)', async () => {
    const mockClient = createMockUpsertClient(null, {
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
    });

    const result = await recordPayment(mockClient as never, testPayment);

    expect(result.inserted).toBe(false);
    expect(result.paymentId).toBeNull();
  });

  it('should throw on unexpected database error', async () => {
    const mockClient = createMockUpsertClient(null, {
      code: '42P01',
      message: 'relation "payments" does not exist',
    });

    await expect(
      recordPayment(mockClient as never, testPayment)
    ).rejects.toThrow('Failed to record payment');
  });

  it('should handle payment without xendit_payment_id', async () => {
    const cashPayment: CreatePaymentPayload = {
      ...testPayment,
      xendit_payment_id: undefined,
      payment_type: 'invoice_payment',
    };
    const mockClient = createMockUpsertClient({ id: 'pay-002' }, null);

    const result = await recordPayment(mockClient as never, cashPayment);

    expect(result.inserted).toBe(true);
    expect(result.paymentId).toBe('pay-002');
  });
});

// ============================================================
// linkPaymentToInvoice Tests
// ============================================================

describe('linkPaymentToInvoice', () => {
  it('should update invoice status to paid', async () => {
    const mockClient = createMockUpdateClient(null);

    await linkPaymentToInvoice(mockClient as never, 'pay-001', 'inv-001');

    expect(mockClient.from).toHaveBeenCalledWith('invoices');
  });

  it('should throw on database error', async () => {
    const mockClient = createMockUpdateClient({ message: 'Invoice not found' });

    await expect(
      linkPaymentToInvoice(mockClient as never, 'pay-001', 'inv-001')
    ).rejects.toThrow('Failed to update invoice status');
  });
});

// ============================================================
// linkPaymentToSubscription Tests
// ============================================================

describe('linkPaymentToSubscription (P2 — internal UUID, period advances)', () => {
  it('should extend current_period_end by 30 days from the current end', async () => {
    // Need a more specific mock for this function since it does select then update
    const singleFn = vi.fn()
      .mockResolvedValueOnce({
        data: { current_period_end: '2026-05-12T00:00:00Z', status: 'active' },
        error: null,
      });

    // Capture the UPDATE payload so we can assert the period actually advances.
    const updatePayloads: Array<Record<string, unknown>> = [];
    const isFnForUpdate = vi.fn().mockResolvedValue({ error: null });
    const isFnForSelect = vi.fn().mockReturnValue({ single: singleFn });

    const eqFnForUpdate = vi.fn().mockReturnValue({ is: isFnForUpdate });
    const eqFnForSelect = vi.fn().mockReturnValue({ is: isFnForSelect });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqFnForSelect,
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          updatePayloads.push(payload);
          return { eq: eqFnForUpdate };
        }),
      }),
    };

    // Internal subscriptions.id UUID (NOT the Xendit id) is what gets passed in.
    await linkPaymentToSubscription(mockClient as never, 'pay-001', 'sub-uuid-001');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    // Looks up by the internal PK (id), not xendit_subscription_id.
    expect(eqFnForSelect).toHaveBeenCalledWith('id', 'sub-uuid-001');
    expect(eqFnForUpdate).toHaveBeenCalledWith('id', 'sub-uuid-001');

    // Period must advance: 2026-05-12 + 30 days = 2026-06-11.
    expect(updatePayloads).toHaveLength(1);
    const newEnd = new Date(updatePayloads[0].current_period_end as string);
    expect(newEnd.toISOString()).toBe('2026-06-11T00:00:00.000Z');
    expect(updatePayloads[0].status).toBe('active');
  });

  it('should throw when subscription not found', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }),
    };

    await expect(
      linkPaymentToSubscription(mockClient as never, 'pay-001', 'sub-001')
    ).rejects.toThrow('Subscription not found');
  });
});

// ============================================================
// resolveSubscriptionByXenditId Tests (P2)
// Xendit's data.subscription_id is a NON-UUID string keyed on the
// xendit_subscription_id column — resolve it to the internal UUID.
// ============================================================

describe('resolveSubscriptionByXenditId', () => {
  it('should look up by xendit_subscription_id and return the internal UUID row', async () => {
    const eqFn = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'sub-uuid-001',
            user_id: 'user-1',
            tier: 'pro',
            current_period_end: '2026-05-12T00:00:00Z',
            status: 'active',
          },
          error: null,
        }),
      }),
    });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqFn }),
      }),
    };

    const resolved = await resolveSubscriptionByXenditId(
      mockClient as never,
      'xnd-sub-abc'
    );

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    // Critical: query the xendit_subscription_id column, NOT the PK.
    expect(eqFn).toHaveBeenCalledWith('xendit_subscription_id', 'xnd-sub-abc');
    expect(resolved?.id).toBe('sub-uuid-001');
    expect(resolved?.tier).toBe('pro');
  });

  it('should return null when no live subscription matches', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      }),
    };

    const resolved = await resolveSubscriptionByXenditId(
      mockClient as never,
      'xnd-sub-missing'
    );

    expect(resolved).toBeNull();
  });
});

// ============================================================
// resolveInvoiceForPayment Tests (P3)
// Resolve the originating AKBai invoice via external_id, scoped to the
// user so a forged external_id from another tenant cannot be paid.
// ============================================================

describe('resolveInvoiceForPayment', () => {
  it('should resolve invoice scoped by id AND user_id', async () => {
    const eqId = vi.fn();
    const eqUser = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'inv-001',
            user_id: 'user-1',
            total_centavos: 250000,
            status: 'sent',
          },
          error: null,
        }),
      }),
    });
    eqId.mockReturnValue({ eq: eqUser });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: eqId }),
      }),
    };

    const resolved = await resolveInvoiceForPayment(mockClient as never, {
      invoiceId: 'inv-001',
      userId: 'user-1',
    });

    expect(mockClient.from).toHaveBeenCalledWith('invoices');
    expect(eqId).toHaveBeenCalledWith('id', 'inv-001');
    expect(eqUser).toHaveBeenCalledWith('user_id', 'user-1');
    expect(resolved?.total_centavos).toBe(250000);
  });

  it('should return null when invoice cannot be resolved', async () => {
    const eqUser = vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }),
    });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: eqUser }),
        }),
      }),
    };

    const resolved = await resolveInvoiceForPayment(mockClient as never, {
      invoiceId: 'inv-missing',
      userId: 'user-1',
    });

    expect(resolved).toBeNull();
  });
});

// ============================================================
// reconcileAmount Tests (P6 — defense-in-depth amount check)
// ============================================================

describe('reconcileAmount', () => {
  it('should return true and not alert when amounts match exactly', () => {
    const ok = reconcileAmount({
      observedCentavos: 49900,
      expectedCentavos: 49900,
      context: { path: 'subscription_renewal' },
    });

    expect(ok).toBe(true);
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('should return false and capture to Sentry on mismatch', () => {
    const ok = reconcileAmount({
      observedCentavos: 100, // ₱1.00 — tampered
      expectedCentavos: 49900, // ₱499.00 expected
      context: { path: 'subscription_renewal', tier: 'pro' },
    });

    expect(ok).toBe(false);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      expect.stringContaining('Amount mismatch')
    );
  });

  it('exposes Pro tier expected price as ₱499 in centavos', () => {
    expect(TIER_EXPECTED_PRICE_CENTAVOS.pro).toBe(49900);
  });
});
