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
