import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock timezone
// ============================================================

vi.mock('@/lib/timezone', () => ({
  toManila: () => new Date(Date.UTC(2026, 2, 26, 10, 0, 0)),
  getManilaToday: () => '2026-03-26',
}));

// ============================================================
// Mock Supabase
// ============================================================

const mockUser = { id: 'user-maria-123', email: 'maria@test.local' };

const mockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  };
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));
  return chain;
};

let mockFromChains: Record<string, ReturnType<typeof mockChain>>;
let mockGetUser: ReturnType<typeof vi.fn>;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (!mockFromChains[table]) {
        mockFromChains[table] = mockChain();
      }
      return mockFromChains[table];
    },
  })),
}));

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: 'dev-user', email: 'dev@test.local' },
}));

// ============================================================
// Import route handlers after mocks
// ============================================================

import { GET, POST, PATCH, DELETE } from '../route';
import { NextRequest } from 'next/server';

function makeRequest(
  url: string,
  method = 'GET',
  body?: Record<string, unknown>
): NextRequest {
  const opts: RequestInit = { method };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), opts);
}

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockFromChains = {};
  mockGetUser = vi.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
});

describe('GET /api/expenses', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await GET(makeRequest('http://localhost:3000/api/expenses'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('returns transactions for authenticated user', async () => {
    const mockTx = [
      {
        id: 'tx-1',
        type: 'expense',
        amount: 15000,
        category: 'ingredients',
        description: 'Bigas',
        transaction_date: '2026-03-26',
        source: 'manual',
        source_ref_id: null,
        created_at: '2026-03-26T10:00:00Z',
      },
    ];

    // Build a chain where every method returns the same chain object,
    // and the chain itself resolves to { data, error } when awaited.
    const chain = mockChain();
    // Set the data/error on the chain so it resolves correctly
    (chain as Record<string, unknown>).data = mockTx;
    (chain as Record<string, unknown>).error = null;
    // Also make it thenable for await
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: mockTx, error: null });
      return chain;
    };

    mockFromChains['transactions'] = chain;

    const res = await GET(makeRequest('http://localhost:3000/api/expenses?month=2026-03'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.transactions).toHaveLength(1);
    expect(json.data.summary.total_expenses).toBe(15000);
    expect(json.data.summary.by_category).toHaveLength(1);
  });

  it('rejects invalid query params', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/expenses?month=invalid'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────
  // Sprint 14 — `?range=linggo|buwan|taon` shorthand
  // Mocked Manila today is '2026-03-26' (see top-of-file vi.mock).
  // ──────────────────────────────────────────────────────────────────

  /**
   * Wire a transactions chain that captures `.gte`/`.lte` filter values
   * and resolves to `mockTx` when awaited.
   */
  function wireTxChain(mockTx: unknown[]) {
    const chain = mockChain();
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: mockTx, error: null });
      return chain;
    };
    mockFromChains['transactions'] = chain;
    return chain;
  }

  /**
   * Resolve the `transaction_date` filter window that was actually applied
   * to the query: returns the args passed to `.gte('transaction_date', X)`
   * and `.lte('transaction_date', Y)`.
   */
  function readDateWindow(chain: ReturnType<typeof mockChain>): {
    from: string | undefined;
    to: string | undefined;
  } {
    const gteCall = chain.gte.mock.calls.find((c) => c[0] === 'transaction_date');
    const lteCall = chain.lte.mock.calls.find((c) => c[0] === 'transaction_date');
    return { from: gteCall?.[1] as string | undefined, to: lteCall?.[1] as string | undefined };
  }

  it('range=linggo returns trailing 7 Manila days (2026-03-20 → 2026-03-26)', async () => {
    const chain = wireTxChain([]);
    const res = await GET(makeRequest('http://localhost:3000/api/expenses?range=linggo'));

    expect(res.status).toBe(200);
    expect(readDateWindow(chain)).toEqual({ from: '2026-03-20', to: '2026-03-26' });
  });

  it('range=buwan matches existing ?month= behavior for current Manila month', async () => {
    const chain = wireTxChain([]);
    const res = await GET(makeRequest('http://localhost:3000/api/expenses?range=buwan'));

    expect(res.status).toBe(200);
    expect(readDateWindow(chain)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
  });

  it('range=taon returns current Manila year (2026-01-01 → today)', async () => {
    const chain = wireTxChain([]);
    const res = await GET(makeRequest('http://localhost:3000/api/expenses?range=taon'));

    expect(res.status).toBe(200);
    expect(readDateWindow(chain)).toEqual({ from: '2026-01-01', to: '2026-03-26' });
  });

  it('range=taon boundary: Jan 1 included, prior Dec 31 excluded', async () => {
    // The Postgres filter uses date-only `transaction_date >= '2026-01-01'`,
    // so a row stored as '2025-12-31' is below the floor and excluded;
    // a row stored as '2026-01-01' is included.
    const chain = wireTxChain([]);
    await GET(makeRequest('http://localhost:3000/api/expenses?range=taon'));

    const { from } = readDateWindow(chain);
    expect(from).toBe('2026-01-01');
    // Sanity check on date-string ordering — Dec 31 prior year sorts below floor:
    expect('2025-12-31' < (from ?? '')).toBe(true);
    expect('2026-01-01' < (from ?? '')).toBe(false);
  });

  it('when both ?range= and ?month= are sent, ?range= wins', async () => {
    const chain = wireTxChain([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const res = await GET(
      makeRequest('http://localhost:3000/api/expenses?range=linggo&month=2025-08')
    );

    expect(res.status).toBe(200);
    // ?range=linggo wins → trailing 7 days from mocked today (2026-03-26).
    expect(readDateWindow(chain)).toEqual({ from: '2026-03-20', to: '2026-03-26' });
    // The conflict is warn-logged for adoption visibility.
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('invalid ?range= value returns 400 with conversational Filipino message', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/expenses?range=quarter'));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message_tl).toBe('Hindi tama ang saklaw ng panahon.');
  });

  it('no params at all defaults to current Manila month (parity with existing default)', async () => {
    const chain = wireTxChain([]);
    const res = await GET(makeRequest('http://localhost:3000/api/expenses'));

    expect(res.status).toBe(200);
    expect(readDateWindow(chain)).toEqual({ from: '2026-03-01', to: '2026-03-31' });
  });
});

describe('POST /api/expenses', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await POST(
      makeRequest('http://localhost:3000/api/expenses', 'POST', {
        type: 'expense',
        amount: 5000,
        category: 'ingredients',
      })
    );

    expect(res.status).toBe(401);
  });

  it('creates expense transaction', async () => {
    const mockTx = {
      id: 'tx-new',
      type: 'expense',
      amount: 5000,
      category: 'ingredients',
      description: null,
      transaction_date: '2026-03-26',
      source: 'manual',
      source_ref_id: null,
      created_at: '2026-03-26T10:00:00Z',
    };

    const chain = mockChain();
    chain.single.mockResolvedValue({ data: mockTx, error: null });
    mockFromChains['transactions'] = chain;

    const res = await POST(
      makeRequest('http://localhost:3000/api/expenses', 'POST', {
        type: 'expense',
        amount: 5000,
        category: 'ingredients',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('tx-new');
  });

  it('rejects invalid body — missing amount', async () => {
    const res = await POST(
      makeRequest('http://localhost:3000/api/expenses', 'POST', {
        type: 'expense',
        category: 'ingredients',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects mismatched category for type', async () => {
    const res = await POST(
      makeRequest('http://localhost:3000/api/expenses', 'POST', {
        type: 'expense',
        amount: 5000,
        category: 'sales', // income category on expense type
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('PATCH /api/expenses', () => {
  it('returns 400 when no id provided', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/expenses', 'PATCH', { amount: 6000 })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('updates transaction amount', async () => {
    const chain = mockChain();
    chain.single.mockResolvedValue({
      data: { id: 'tx-1', amount: 6000, category: 'ingredients' },
      error: null,
    });
    mockFromChains['transactions'] = chain;

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/expenses?id=tx-1', 'PATCH', { amount: 6000 })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

describe('DELETE /api/expenses', () => {
  it('returns 400 when no id provided', async () => {
    const res = await DELETE(
      makeRequest('http://localhost:3000/api/expenses', 'DELETE')
    );
    const json = await res.json();

    expect(res.status).toBe(400);
  });

  it('soft-deletes transaction', async () => {
    const chain = mockChain();
    mockFromChains['transactions'] = chain;

    const res = await DELETE(
      makeRequest('http://localhost:3000/api/expenses?id=tx-1', 'DELETE')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deleted).toBe(true);
  });
});
