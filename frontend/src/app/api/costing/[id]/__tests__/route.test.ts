import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Supabase + dev-auth
//
// Chainable mock mirroring the expenses/costing harness: every builder
// method returns the same chain, the chain is awaitable, and terminal
// `.single()` calls are stubbed per-table. The [id] route has no rate-limit
// guard, so none is needed here.
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
// Import route handler after mocks
// ============================================================

import { PATCH } from '../route';
import { NextRequest } from 'next/server';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/costing/card-1'), {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const params = Promise.resolve({ id: 'card-1' });

/**
 * Wire the costing_cards table for a PATCH:
 * - first `.single()` → the existing row (ownership + recalc baseline),
 * - the `.update()` chain resolves OK (awaited without `.single()`),
 * - second `.single()` → the full re-fetched row returned to the client.
 *
 * `existing` controls the stored selling price / fixed costs / yield used by
 * the recalculation, which is exactly what B4 depends on.
 */
function wireExisting(existing: Record<string, unknown>) {
  const cardChain = mockChain();
  cardChain.single
    .mockResolvedValueOnce({ data: existing, error: null }) // ownership lookup
    .mockResolvedValueOnce({ data: { id: 'card-1', ...existing }, error: null }); // re-fetch
  mockFromChains['costing_cards'] = cardChain;

  // Items table only used when `items` are in the payload; provide a default.
  mockFromChains['costing_card_items'] = mockChain();

  return cardChain;
}

/** Read the object passed to costing_cards.update(). */
function readCardUpdate(cardChain: ReturnType<typeof mockChain>): Record<string, unknown> {
  const call = cardChain.update.mock.calls.find(
    (c) => c[0] && typeof c[0] === 'object' && 'break_even_qty' in c[0]
  );
  return (call?.[0] ?? {}) as Record<string, unknown>;
}

const baseExisting = {
  id: 'card-1',
  total_cost_centavos: 6000, // ₱60 cost
  target_margin_pct: 30,
  selling_price_centavos: 10000, // ₱100 price
  monthly_fixed_costs_centavos: 0, // ₱0 fixed — the B4 hot spot
  yield_quantity: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFromChains = {};
  mockGetUser = vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null });
});

describe('PATCH /api/costing/[id] — auth + ownership', () => {
  it('returns 404 when the card is not found / not owned', async () => {
    const cardChain = mockChain();
    cardChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    mockFromChains['costing_cards'] = cardChain;

    const res = await PATCH(makeRequest({ product_name: 'New Name' }), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });
});

// ============================================================
// B4 — break_even_qty (always in the update payload) must not be wiped
//       to null when fixed costs are 0, and must be preserved when a PATCH
//       does not change pricing.
// ============================================================

describe('PATCH /api/costing/[id] — break-even with zero fixed costs (B4)', () => {
  it('recomputes break_even_qty = 0 (not null) when stored fixed costs are 0', async () => {
    const cardChain = wireExisting(baseExisting);

    // Touch a non-pricing field so the PATCH passes the refine() guard but
    // leaves selling price / fixed costs unchanged.
    const res = await PATCH(makeRequest({ product_name: 'Ube Cake v2' }), { params });

    expect(res.status).toBe(200);
    const update = readCardUpdate(cardChain);
    // calculateBreakEven(0, 10000, 6000) → 0. The old falsy `&&` guard would
    // have written null here, wiping a valid value.
    expect(update.break_even_qty).toBe(0);
    expect(update.break_even_qty).not.toBeNull();
  });

  it('does not wipe break_even_qty on a PATCH that leaves pricing untouched', async () => {
    // Existing card has real fixed costs and price → break-even of 125.
    const cardChain = wireExisting({
      ...baseExisting,
      monthly_fixed_costs_centavos: 500000, // ₱5,000
    });

    const res = await PATCH(makeRequest({ description: 'May bagong recipe' }), { params });

    expect(res.status).toBe(200);
    const update = readCardUpdate(cardChain);
    // 500000 / (10000 - 6000) = 125 — preserved, not nulled.
    expect(update.break_even_qty).toBe(125);
  });

  it('recomputes break_even_qty = 0 when fixed costs are explicitly PATCHed to 0', async () => {
    const cardChain = wireExisting({
      ...baseExisting,
      monthly_fixed_costs_centavos: 500000,
    });

    const res = await PATCH(makeRequest({ monthly_fixed_costs_centavos: 0 }), { params });

    expect(res.status).toBe(200);
    const update = readCardUpdate(cardChain);
    expect(update.break_even_qty).toBe(0);
    expect(update.monthly_fixed_costs_centavos).toBe(0);
  });

  it('sets break_even_qty null when the card has no selling price', async () => {
    const cardChain = wireExisting({
      ...baseExisting,
      selling_price_centavos: null,
      monthly_fixed_costs_centavos: 0,
    });

    const res = await PATCH(makeRequest({ description: 'Wala pang presyo' }), { params });

    expect(res.status).toBe(200);
    const update = readCardUpdate(cardChain);
    expect(update.break_even_qty).toBeNull();
  });
});

// ============================================================
// B2 — total recalculated from new items uses exact-then-round
// ============================================================

describe('PATCH /api/costing/[id] — total cost rounding (B2)', () => {
  it('recomputes total_cost_centavos with exact-then-round when items are replaced', async () => {
    const cardChain = wireExisting(baseExisting);

    const res = await PATCH(
      makeRequest({
        items: [
          { item_name: 'Sago', quantity: 0.5, unit_cost_centavos: 2525 },
          { item_name: 'Gulaman', quantity: 0.5, unit_cost_centavos: 2525 },
          { item_name: 'Leche', quantity: 0.5, unit_cost_centavos: 2525 },
        ],
      }),
      { params }
    );

    expect(res.status).toBe(200);
    const update = readCardUpdate(cardChain);
    // 1262.5 * 3 = 3787.5 → 3788 (sum-of-rounded would be 3789).
    expect(update.total_cost_centavos).toBe(3788);
    expect(update.total_cost_centavos).not.toBe(3789);
  });
});
