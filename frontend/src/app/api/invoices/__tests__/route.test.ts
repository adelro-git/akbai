import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks — dev-auth (skip auth → service client), timezone,
// rate-limit (never limited), invoice-number generator.
// ============================================================

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: 'dev-user-1' },
}));

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-15',
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  enforceRateLimit: vi.fn(() => null),
}));

vi.mock('@/lib/invoices/number-generator', () => ({
  generateInvoiceNumber: vi.fn(async () => 'INV-202604-001'),
}));

// The auth path's createClient is never used (SKIP_AUTH=true) but the module
// imports it, so provide a no-op stub.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({})),
}));

// ── Service-client mock — capture the invoice header insert payload so the
//    E2 (rounding) / E3 (discount) assertions can read the computed totals. ──
let invoiceInsertPayload: Record<string, unknown> | null = null;
let itemInsertPayloads: Array<Record<string, unknown>> | null = null;

function makeServiceDb() {
  const invoicesChain = {
    insert: vi.fn((payload: Record<string, unknown>) => {
      invoiceInsertPayload = payload;
      return invoicesChain;
    }),
    select: vi.fn(() => invoicesChain),
    single: vi.fn(async () => ({ data: { id: 'inv-1', ...invoiceInsertPayload }, error: null })),
    update: vi.fn(() => invoicesChain),
    eq: vi.fn(() => invoicesChain),
  };
  const itemsChain = {
    insert: vi.fn(async (payload: Array<Record<string, unknown>>) => {
      itemInsertPayloads = payload;
      return { error: null };
    }),
  };
  return {
    from: vi.fn((table: string) => {
      if (table === 'invoices') return invoicesChain;
      if (table === 'invoice_items') return itemsChain;
      throw new Error(`unexpected table ${table}`);
    }),
  };
}

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => makeServiceDb()),
}));

// Import AFTER mocks
import { POST } from '../route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/invoices — totals computation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invoiceInsertPayload = null;
    itemInsertPayloads = null;
  });

  // ── E2: fractional quantity (e.g. 2.5 hours) must NOT store fractional
  //    centavos — both the line total and the invoice subtotal are rounded. ──
  it('rounds fractional-quantity line totals to integer centavos (E2)', async () => {
    const res = await POST(
      makeRequest({
        invoice_number: 'INV-202604-001',
        client_name: 'Juan dela Cruz',
        // 33333 centavos/hr * 2.5 hrs = 83332.5 → rounds to 83333
        items: [{ description: 'Consulting (hours)', quantity: 2.5, unit_price_centavos: 33333 }],
      })
    );
    expect(res.status).toBe(201);

    expect(invoiceInsertPayload?.subtotal_centavos).toBe(83333);
    expect(Number.isInteger(invoiceInsertPayload?.subtotal_centavos)).toBe(true);
    expect(itemInsertPayloads?.[0].total_centavos).toBe(83333);
    expect(Number.isInteger(itemInsertPayloads?.[0].total_centavos)).toBe(true);
  });

  it('keeps tax and total as integer centavos with fractional quantity (E2)', async () => {
    const res = await POST(
      makeRequest({
        invoice_number: 'INV-202604-001',
        client_name: 'Juan',
        tax_rate_pct: 12,
        items: [{ description: 'Hours', quantity: 1.5, unit_price_centavos: 33333 }],
      })
    );
    expect(res.status).toBe(201);
    // subtotal: round(33333 * 1.5) = round(49999.5) = 50000
    expect(invoiceInsertPayload?.subtotal_centavos).toBe(50000);
    expect(Number.isInteger(invoiceInsertPayload?.tax_amount_centavos)).toBe(true);
    expect(Number.isInteger(invoiceInsertPayload?.total_centavos)).toBe(true);
    // tax = round(50000 * 0.12) = 6000; total = 56000
    expect(invoiceInsertPayload?.tax_amount_centavos).toBe(6000);
    expect(invoiceInsertPayload?.total_centavos).toBe(56000);
  });

  // ── E3: a discount larger than the subtotal must be rejected (400), not
  //    persisted as a negative total. ──
  it('rejects a discount greater than the subtotal with 400 (E3)', async () => {
    const res = await POST(
      makeRequest({
        invoice_number: 'INV-202604-001',
        client_name: 'Juan',
        discount_centavos: 100000, // > subtotal of 85000
        items: [{ description: 'Cake', unit_price_centavos: 85000 }],
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message_tl).toContain('discount');
    // Nothing should have been inserted.
    expect(invoiceInsertPayload).toBeNull();
  });

  it('accepts a discount equal to the subtotal (total = tax only) (E3)', async () => {
    const res = await POST(
      makeRequest({
        invoice_number: 'INV-202604-001',
        client_name: 'Juan',
        discount_centavos: 85000,
        items: [{ description: 'Cake', unit_price_centavos: 85000 }],
      })
    );
    expect(res.status).toBe(201);
    // taxableAmount clamped to 0 → tax 0 → total 0, never negative.
    expect(invoiceInsertPayload?.total_centavos).toBe(0);
    expect(invoiceInsertPayload?.tax_amount_centavos).toBe(0);
  });
});
