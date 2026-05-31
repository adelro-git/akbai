import { describe, it, expect } from 'vitest';
import {
  InvoiceStatusEnum,
  CreateInvoiceItemSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  UpdateInvoiceStatusSchema,
} from '../schemas';

// ─── InvoiceStatusEnum ───────────────────────────────────────────────

describe('InvoiceStatusEnum', () => {
  it('accepts all valid statuses', () => {
    for (const s of ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']) {
      expect(InvoiceStatusEnum.parse(s)).toBe(s);
    }
  });

  it('rejects invalid statuses', () => {
    expect(() => InvoiceStatusEnum.parse('pending')).toThrow();
    expect(() => InvoiceStatusEnum.parse('completed')).toThrow();
    expect(() => InvoiceStatusEnum.parse('')).toThrow();
  });
});

// ─── CreateInvoiceItemSchema ─────────────────────────────────────────

describe('CreateInvoiceItemSchema', () => {
  const validItem = {
    description: 'Chocolate Cake (8-inch)',
    unit_price_centavos: 85000,
  };

  it('accepts valid item with minimal fields', () => {
    const result = CreateInvoiceItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('accepts item with all optional fields', () => {
    const result = CreateInvoiceItemSchema.safeParse({
      ...validItem,
      quantity: 3,
      unit: 'piece',
      costing_card_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const result = CreateInvoiceItemSchema.safeParse({
      description: '',
      unit_price_centavos: 85000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer price', () => {
    const result = CreateInvoiceItemSchema.safeParse({
      ...validItem,
      unit_price_centavos: 850.50,
    });
    expect(result.success).toBe(false);
  });

  // E2: fractional quantity is a legit use case (e.g. 2.5 hours). The schema
  // intentionally allows it; the route handler rounds the resulting line total
  // to integer centavos rather than the schema forbidding the input.
  it('accepts a fractional quantity (e.g. hours)', () => {
    const result = CreateInvoiceItemSchema.safeParse({
      ...validItem,
      quantity: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero or negative quantity', () => {
    expect(CreateInvoiceItemSchema.safeParse({ ...validItem, quantity: 0 }).success).toBe(false);
    expect(CreateInvoiceItemSchema.safeParse({ ...validItem, quantity: -1 }).success).toBe(false);
  });
});

// ─── CreateInvoiceSchema ─────────────────────────────────────────────

describe('CreateInvoiceSchema', () => {
  const validInvoice = {
    invoice_number: 'INV-202604-001',
    client_name: 'Juan dela Cruz',
    items: [
      { description: 'Chocolate Cake (8-inch)', unit_price_centavos: 85000 },
    ],
  };

  it('accepts valid invoice with items', () => {
    const result = CreateInvoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it('accepts invoice with all optional fields', () => {
    const result = CreateInvoiceSchema.safeParse({
      ...validInvoice,
      invoice_date: '2026-04-12',
      due_date: '2026-05-12',
      client_email: 'juan@example.com',
      client_phone: '+639171234567',
      client_address: '123 Rizal St, Makati',
      discount_centavos: 5000,
      tax_rate_pct: 12.00,
      notes: 'Salamat po sa order!',
      internal_notes: 'Rush order for fiesta',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing client name', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-001',
      items: [{ description: 'Cake', unit_price_centavos: 85000 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing invoice number', () => {
    const result = CreateInvoiceSchema.safeParse({
      client_name: 'Juan',
      items: [{ description: 'Cake', unit_price_centavos: 85000 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = CreateInvoiceSchema.safeParse({
      ...validInvoice,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer discount', () => {
    const result = CreateInvoiceSchema.safeParse({
      ...validInvoice,
      discount_centavos: 50.75,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = CreateInvoiceSchema.safeParse({
      ...validInvoice,
      invoice_date: '04-12-2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = CreateInvoiceSchema.safeParse({
      ...validInvoice,
      client_email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpdateInvoiceSchema ─────────────────────────────────────────────

describe('UpdateInvoiceSchema', () => {
  it('accepts partial update with client name', () => {
    const result = UpdateInvoiceSchema.safeParse({ client_name: 'Maria Santos' });
    expect(result.success).toBe(true);
  });

  it('accepts nulling optional fields', () => {
    const result = UpdateInvoiceSchema.safeParse({ due_date: null });
    expect(result.success).toBe(true);
  });

  it('rejects empty update', () => {
    const result = UpdateInvoiceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── UpdateInvoiceStatusSchema ───────────────────────────────────────

describe('UpdateInvoiceStatusSchema', () => {
  it('accepts valid status values', () => {
    for (const s of ['draft', 'sent', 'paid', 'cancelled']) {
      const result = UpdateInvoiceStatusSchema.safeParse({ status: s });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = UpdateInvoiceStatusSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(false);
  });
});
