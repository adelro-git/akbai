import { describe, it, expect } from 'vitest';
import {
  PaymentTypeEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  CreatePaymentSchema,
  RecordCashPaymentSchema,
  UpdatePaymentStatusSchema,
} from '../schemas';

// ─── Enums ───────────────────────────────────────────────────────────

describe('PaymentTypeEnum', () => {
  it('accepts valid payment types', () => {
    expect(PaymentTypeEnum.parse('invoice_payment')).toBe('invoice_payment');
    expect(PaymentTypeEnum.parse('subscription_payment')).toBe('subscription_payment');
  });

  it('rejects invalid payment types', () => {
    expect(() => PaymentTypeEnum.parse('refund')).toThrow();
  });
});

describe('PaymentMethodEnum', () => {
  it('accepts all valid methods', () => {
    for (const m of ['gcash', 'credit_card', 'bank_transfer', 'cash', 'other']) {
      expect(PaymentMethodEnum.parse(m)).toBe(m);
    }
  });

  it('rejects invalid methods', () => {
    expect(() => PaymentMethodEnum.parse('paypal')).toThrow();
  });
});

describe('PaymentStatusEnum', () => {
  it('accepts all valid statuses', () => {
    for (const s of ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled']) {
      expect(PaymentStatusEnum.parse(s)).toBe(s);
    }
  });

  it('rejects invalid statuses', () => {
    expect(() => PaymentStatusEnum.parse('completed')).toThrow();
  });
});

// ─── CreatePaymentSchema ─────────────────────────────────────────────

describe('CreatePaymentSchema', () => {
  const validPayment = {
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    payment_type: 'invoice_payment' as const,
    amount_centavos: 85000,
  };

  it('accepts valid payment with minimal fields', () => {
    const result = CreatePaymentSchema.safeParse(validPayment);
    expect(result.success).toBe(true);
  });

  it('accepts payment with all optional fields', () => {
    const result = CreatePaymentSchema.safeParse({
      ...validPayment,
      currency: 'PHP',
      payment_method: 'gcash',
      status: 'succeeded',
      xendit_payment_id: 'xnd_pay_123456',
      xendit_invoice_id: 'xnd_inv_789',
      invoice_id: '550e8400-e29b-41d4-a716-446655440001',
      paid_at: '2026-04-12T10:30:00.000Z',
      notes: 'GCash payment received',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing amount', () => {
    const result = CreatePaymentSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      payment_type: 'invoice_payment',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer amount', () => {
    const result = CreatePaymentSchema.safeParse({
      ...validPayment,
      amount_centavos: 850.50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = CreatePaymentSchema.safeParse({
      ...validPayment,
      amount_centavos: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = CreatePaymentSchema.safeParse({
      ...validPayment,
      amount_centavos: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid user_id', () => {
    const result = CreatePaymentSchema.safeParse({
      ...validPayment,
      user_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ─── RecordCashPaymentSchema ─────────────────────────────────────────

describe('RecordCashPaymentSchema', () => {
  const validCash = {
    invoice_id: '550e8400-e29b-41d4-a716-446655440000',
    amount_centavos: 85000,
  };

  it('accepts valid cash payment', () => {
    const result = RecordCashPaymentSchema.safeParse(validCash);
    expect(result.success).toBe(true);
  });

  it('accepts cash payment with optional fields', () => {
    const result = RecordCashPaymentSchema.safeParse({
      ...validCash,
      notes: 'Binayaran sa bahay',
      paid_at: '2026-04-12T10:30:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing invoice_id', () => {
    const result = RecordCashPaymentSchema.safeParse({
      amount_centavos: 85000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid invoice_id', () => {
    const result = RecordCashPaymentSchema.safeParse({
      ...validCash,
      invoice_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpdatePaymentStatusSchema ───────────────────────────────────────

describe('UpdatePaymentStatusSchema', () => {
  it('accepts valid status update', () => {
    const result = UpdatePaymentStatusSchema.safeParse({ status: 'succeeded' });
    expect(result.success).toBe(true);
  });

  it('accepts status with optional fields', () => {
    const result = UpdatePaymentStatusSchema.safeParse({
      status: 'failed',
      failure_reason: 'Insufficient funds',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = UpdatePaymentStatusSchema.safeParse({ status: 'done' });
    expect(result.success).toBe(false);
  });
});
