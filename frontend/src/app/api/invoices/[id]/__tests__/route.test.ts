import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks — dev-auth (skip auth → service client). The PATCH path
// fetches the current invoice (must be 'draft'), recalculates
// totals from items, soft-deletes old items, inserts new ones,
// then updates the header.
// ============================================================

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: 'dev-user-1' },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({})),
}));

// ── Service-client mock. `invoices` serves both the "fetch current" read
//    (.single → draft) and the header update (.single → updated). We capture
//    the update payload to assert the recalculated totals. ──
let headerUpdatePayload: Record<string, unknown> | null = null;
let itemInsertPayloads: Array<Record<string, unknown>> | null = null;

function makeServiceDb() {
  const invoicesChain: Record<string, unknown> = {};
  const assign = (fn: (arg?: unknown) => unknown) => fn;
  Object.assign(invoicesChain, {
    select: vi.fn(() => invoicesChain),
    update: vi.fn((payload: Record<string, unknown>) => {
      headerUpdatePayload = payload;
      return invoicesChain;
    }),
    eq: vi.fn(() => invoicesChain),
    is: vi.fn(() => invoicesChain),
    // First .single() returns the current draft invoice; the header-update
    // .single() returns the updated row. Both resolve fine for our assertions.
    single: vi.fn(async () => ({
      data: { id: 'inv-1', user_id: 'dev-user-1', status: 'draft' },
      error: null,
    })),
  });
  void assign;

  const itemsChain: Record<string, unknown> = {};
  Object.assign(itemsChain, {
    update: vi.fn(() => itemsChain),
    eq: vi.fn(() => itemsChain),
    is: vi.fn(async () => ({ error: null })),
    insert: vi.fn(async (payload: Array<Record<string, unknown>>) => {
      itemInsertPayloads = payload;
      return { error: null };
    }),
  });

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
import { PATCH } from '../route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/invoices/inv-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: 'inv-1' }) };

describe('PATCH /api/invoices/[id] — totals recomputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headerUpdatePayload = null;
    itemInsertPayloads = null;
  });

  // ── E2: fractional quantity must round to integer centavos on update. ──
  it('rounds fractional-quantity line totals on update (E2)', async () => {
    const res = await PATCH(
      makeRequest({
        items: [{ description: 'Hours', quantity: 2.5, unit_price_centavos: 33333 }],
      }) as never,
      ctx as never
    );
    expect(res.status).toBe(200);

    // round(33333 * 2.5) = round(83332.5) = 83333
    expect(headerUpdatePayload?.subtotal_centavos).toBe(83333);
    expect(Number.isInteger(headerUpdatePayload?.subtotal_centavos)).toBe(true);
    expect(itemInsertPayloads?.[0].total_centavos).toBe(83333);
    expect(Number.isInteger(itemInsertPayloads?.[0].total_centavos)).toBe(true);
    expect(Number.isInteger(headerUpdatePayload?.tax_amount_centavos)).toBe(true);
    expect(Number.isInteger(headerUpdatePayload?.total_centavos)).toBe(true);
  });

  // ── E3: discount > subtotal must 400, not persist a negative total. ──
  it('rejects a discount greater than the subtotal with 400 (E3)', async () => {
    const res = await PATCH(
      makeRequest({
        discount_centavos: 100000,
        items: [{ description: 'Cake', unit_price_centavos: 85000 }],
      }) as never,
      ctx as never
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message_tl).toContain('discount');
    // No header update should have been applied.
    expect(headerUpdatePayload).toBeNull();
  });

  it('clamps taxable amount to 0 when discount equals subtotal (E3)', async () => {
    const res = await PATCH(
      makeRequest({
        discount_centavos: 85000,
        tax_rate_pct: 12,
        items: [{ description: 'Cake', unit_price_centavos: 85000 }],
      }) as never,
      ctx as never
    );
    expect(res.status).toBe(200);
    expect(headerUpdatePayload?.total_centavos).toBe(0);
    expect(headerUpdatePayload?.tax_amount_centavos).toBe(0);
  });
});
