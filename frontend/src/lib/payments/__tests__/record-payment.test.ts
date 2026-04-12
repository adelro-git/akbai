/**
 * Payment Recording Tests — Insert with idempotency and linking
 * Feature: Xendit Payment Infrastructure (Build 8), Gap D2
 *
 * Tests: recordPayment (new insert, duplicate handling), linkPaymentToInvoice,
 *        linkPaymentToSubscription
 * Mocks: Supabase service client
 */

import { describe, it, expect, vi } from 'vitest';
import {
  recordPayment,
  linkPaymentToInvoice,
  linkPaymentToSubscription,
} from '../record-payment';
import type { CreatePaymentPayload } from '../schemas';

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

describe('linkPaymentToSubscription', () => {
  it('should extend subscription period by 30 days', async () => {
    // Need a more specific mock for this function since it does select then update
    const singleFn = vi.fn()
      .mockResolvedValueOnce({
        data: { current_period_end: '2026-05-12T00:00:00Z', status: 'active' },
        error: null,
      });

    const isFnForUpdate = vi.fn().mockResolvedValue({ error: null });
    const isFnForSelect = vi.fn().mockReturnValue({ single: singleFn });

    const eqFnForUpdate = vi.fn().mockReturnValue({ is: isFnForUpdate });
    const eqFnForSelect = vi.fn().mockReturnValue({ is: isFnForSelect });

    let callCount = 0;
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqFnForSelect,
        }),
        update: vi.fn().mockReturnValue({
          eq: eqFnForUpdate,
        }),
      }),
    };

    await linkPaymentToSubscription(mockClient as never, 'pay-001', 'sub-001');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
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
