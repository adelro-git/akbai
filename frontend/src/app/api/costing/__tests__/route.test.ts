import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Supabase + dev-auth + rate-limit
//
// Mirrors the expenses route test harness: a chainable mock where every
// builder method returns the same chain, the chain is awaitable, and
// terminal `.single()` calls are stubbed per-table. The in-memory
// rate-limit store is reset in beforeEach so the 30/60s POST cap never
// trips between tests.
// ============================================================

const mockUser = { id: 'user-maria-123', email: 'maria@test.local' };

const mockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  };
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));
  // Make the chain awaitable (resolves to an empty result by default).
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
    resolve({ data: null, error: null });
    return chain;
  };
  return chain;
};

let mockFromChains: Record<string, ReturnType<typeof mockChain>>;
let mockGetUser: ReturnType<typeof vi.fn>;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (!mockFromChains[table]) mockFromChains[table] = mockChain();
      return mockFromChains[table];
    },
  })),
}));

// Service client is used when SKIP_AUTH is true. Keep SKIP_AUTH false here so
// the auth-gated path runs against the mocked createClient above.
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: (table: string) => {
      if (!mockFromChains[table]) mockFromChains[table] = mockChain();
      return mockFromChains[table];
    },
  })),
}));

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: 'dev-user', email: 'dev@test.local' },
}));

// ============================================================
// Import route handlers + rate-limit reset after mocks
// ============================================================

import { POST } from '../route';
import { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

function makeRequest(method = 'POST', body?: Record<string, unknown>): NextRequest {
  const opts: RequestInit = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL('http://localhost:3000/api/costing'), opts);
}

/**
 * Wire the two tables a successful POST touches:
 * - costing_cards: `.insert().select('id').single()` returns the new id, and a
 *   later `.select('*').eq().single()` returns the full row.
 * - costing_card_items: `.insert()` resolves OK, later `.select('*')...` lists.
 *
 * Returns the captured insert payload for costing_cards so tests can assert on
 * the derived fields (break_even_qty, etc.).
 */
function wireSuccessfulInsert(fullCard: Record<string, unknown>) {
  const cardChain = mockChain();
  // First `.single()` (after insert().select('id')) → new id.
  // Second `.single()` (the full re-fetch) → the full card row.
  cardChain.single
    .mockResolvedValueOnce({ data: { id: 'card-1' }, error: null })
    .mockResolvedValueOnce({ data: fullCard, error: null });
  mockFromChains['costing_cards'] = cardChain;

  const itemsChain = mockChain();
  mockFromChains['costing_card_items'] = itemsChain;

  return { cardChain, itemsChain };
}

/** Read the object passed to costing_cards.insert(). */
function readCardInsert(cardChain: ReturnType<typeof mockChain>): Record<string, unknown> {
  const call = cardChain.insert.mock.calls[0];
  return (call?.[0] ?? {}) as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFromChains = {};
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
  _resetStore();
});

describe('POST /api/costing — auth + validation', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'No session' } });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Ube Cake',
        items: [{ item_name: 'Ube', unit_cost_centavos: 5000 }],
      })
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid body (no items)', async () => {
    const res = await POST(makeRequest('POST', { product_name: 'Ube Cake' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });
});

// ============================================================
// B3 — break-even must NOT short-circuit to null when fixed costs are 0
// ============================================================

describe('POST /api/costing — break-even with zero fixed costs (B3)', () => {
  it('persists break_even_qty = 0 when monthly_fixed_costs_centavos is 0 and a price is set', async () => {
    const { cardChain } = wireSuccessfulInsert({ id: 'card-1', product_name: 'Ube Cake' });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Ube Cake',
        selling_price_centavos: 10000, // ₱100 — contribution margin is positive
        monthly_fixed_costs_centavos: 0, // VALID zero — must not null out break-even
        items: [{ item_name: 'Ube', unit_cost_centavos: 6000 }], // cost/unit ₱60
      })
    );

    expect(res.status).toBe(201);
    const insert = readCardInsert(cardChain);
    // calculateBreakEven(0, 10000, 6000) → 0 (no fixed costs to cover).
    expect(insert.break_even_qty).toBe(0);
    expect(insert.break_even_qty).not.toBeNull();
  });

  it('persists break_even_qty = 0 when fixed costs are omitted (defaults to 0) but a price is set', async () => {
    const { cardChain } = wireSuccessfulInsert({ id: 'card-1', product_name: 'Ube Cake' });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Ube Cake',
        selling_price_centavos: 10000,
        // monthly_fixed_costs_centavos omitted → persisted as 0
        items: [{ item_name: 'Ube', unit_cost_centavos: 6000 }],
      })
    );

    expect(res.status).toBe(201);
    const insert = readCardInsert(cardChain);
    expect(insert.break_even_qty).toBe(0);
    expect(insert.monthly_fixed_costs_centavos).toBe(0);
  });

  it('computes a real break-even when fixed costs and price are both set', async () => {
    const { cardChain } = wireSuccessfulInsert({ id: 'card-1', product_name: 'Ube Cake' });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Ube Cake',
        selling_price_centavos: 10000, // ₱100
        monthly_fixed_costs_centavos: 500000, // ₱5,000 fixed
        items: [{ item_name: 'Ube', unit_cost_centavos: 6000 }], // ₱60 cost/unit
      })
    );

    expect(res.status).toBe(201);
    const insert = readCardInsert(cardChain);
    // 500000 / (10000 - 6000) = 125 units.
    expect(insert.break_even_qty).toBe(125);
  });

  it('leaves break_even_qty null when there is no selling price', async () => {
    const { cardChain } = wireSuccessfulInsert({ id: 'card-1', product_name: 'Ube Cake' });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Ube Cake',
        monthly_fixed_costs_centavos: 500000,
        items: [{ item_name: 'Ube', unit_cost_centavos: 6000 }],
      })
    );

    expect(res.status).toBe(201);
    const insert = readCardInsert(cardChain);
    expect(insert.break_even_qty).toBeNull();
  });
});

// ============================================================
// B2 — card total uses exact-sum-then-round (verified end-to-end)
// ============================================================

describe('POST /api/costing — total cost rounding (B2)', () => {
  it('stores the exact-then-rounded total, not the sum of rounded rows', async () => {
    const { cardChain } = wireSuccessfulInsert({ id: 'card-1', product_name: 'Halo-Halo' });

    const res = await POST(
      makeRequest('POST', {
        product_name: 'Halo-Halo',
        items: [
          { item_name: 'Sago', quantity: 0.5, unit_cost_centavos: 2525 },
          { item_name: 'Gulaman', quantity: 0.5, unit_cost_centavos: 2525 },
          { item_name: 'Leche', quantity: 0.5, unit_cost_centavos: 2525 },
        ],
      })
    );

    expect(res.status).toBe(201);
    const insert = readCardInsert(cardChain);
    // Exact: 1262.5 * 3 = 3787.5 → 3788. (Sum-of-rounded rows would be 3789.)
    expect(insert.total_cost_centavos).toBe(3788);
    expect(insert.total_cost_centavos).not.toBe(3789);
  });
});
