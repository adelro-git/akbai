/**
 * Tests for Deadlines API Route
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock timezone
// ============================================================

vi.mock('@/lib/timezone', () => ({
  toManila: () => new Date(Date.UTC(2026, 2, 28, 10, 0, 0)),
  getManilaToday: () => '2026-03-28',
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
    lt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
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

import { GET, POST, PATCH } from '../route';
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

// ============================================================
// GET /api/deadlines
// ============================================================

describe('GET /api/deadlines', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await GET(makeRequest('http://localhost:3000/api/deadlines'));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('returns deadlines for authenticated user', async () => {
    const mockDeadlines = [
      {
        id: 'dl-1',
        user_id: mockUser.id,
        form_name: '1701Q',
        due_date: '2026-04-15',
        description: 'Quarterly Income Tax Return',
        status: 'upcoming',
        notified_7d: false,
        notified_3d: false,
        notified_1d: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const chain = mockChain();
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: mockDeadlines, error: null });
      return chain;
    };
    mockFromChains['bir_deadlines'] = chain;

    const res = await GET(makeRequest('http://localhost:3000/api/deadlines'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deadlines).toHaveLength(1);
    expect(json.data.deadlines[0].urgency).toBe('normal');
    expect(json.data.deadlines[0].days_until).toBe(18); // Apr 15 - Mar 28 = 18
  });

  it('marks overdue deadlines correctly', async () => {
    const mockDeadlines = [
      {
        id: 'dl-2',
        user_id: mockUser.id,
        form_name: '2551Q',
        due_date: '2026-01-25',
        description: 'Quarterly Percentage Tax',
        status: 'upcoming',
        notified_7d: false,
        notified_3d: false,
        notified_1d: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const chain = mockChain();
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: mockDeadlines, error: null });
      return chain;
    };
    mockFromChains['bir_deadlines'] = chain;

    const res = await GET(makeRequest('http://localhost:3000/api/deadlines'));
    const json = await res.json();

    expect(json.data.deadlines[0].urgency).toBe('overdue');
    expect(json.data.deadlines[0].days_until).toBeLessThan(0);
  });

  it('handles status filter', async () => {
    const chain = mockChain();
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: [], error: null });
      return chain;
    };
    mockFromChains['bir_deadlines'] = chain;

    const res = await GET(makeRequest('http://localhost:3000/api/deadlines?status=filed'));
    expect(res.status).toBe(200);
  });
});

// ============================================================
// POST /api/deadlines
// ============================================================

describe('POST /api/deadlines', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await POST(
      makeRequest('http://localhost:3000/api/deadlines', 'POST', {
        tax_type: 'sole_prop_8pct',
      })
    );

    expect(res.status).toBe(401);
  });

  it('rejects invalid tax type', async () => {
    const res = await POST(
      makeRequest('http://localhost:3000/api/deadlines', 'POST', {
        tax_type: 'invalid_type',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('generates deadlines for valid tax type', async () => {
    const chain = mockChain();
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: null, error: null });
      return chain;
    };
    mockFromChains['bir_deadlines'] = chain;

    const res = await POST(
      makeRequest('http://localhost:3000/api/deadlines', 'POST', {
        tax_type: 'sole_prop_8pct',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.generated).toBe(4); // 1701Q: 3 + 1701A: 1
    expect(json.data.inserted).toBe(4);
  });

  it('skips existing deadlines (upsert behavior)', async () => {
    const chain = mockChain();
    // First call returns existing, rest return null
    chain.maybeSingle
      .mockResolvedValueOnce({ data: { id: 'existing-1' }, error: null })
      .mockResolvedValue({ data: null, error: null });
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => {
      resolve({ data: null, error: null });
      return chain;
    };
    mockFromChains['bir_deadlines'] = chain;

    const res = await POST(
      makeRequest('http://localhost:3000/api/deadlines', 'POST', {
        tax_type: 'sole_prop_8pct',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.generated).toBe(4);
    expect(json.data.inserted).toBe(3); // One already existed
  });

  it('rejects invalid body format', async () => {
    const res = await POST(
      makeRequest('http://localhost:3000/api/deadlines', 'POST', {})
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

// ============================================================
// PATCH /api/deadlines
// ============================================================

describe('PATCH /api/deadlines', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'No session' },
    });

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/deadlines', 'PATCH', {
        id: '00000000-0000-0000-0000-000000000001',
        status: 'filed',
      })
    );

    expect(res.status).toBe(401);
  });

  it('updates deadline status to filed', async () => {
    const chain = mockChain();
    chain.single.mockResolvedValue({
      data: { id: '00000000-0000-0000-0000-000000000001', status: 'filed' },
      error: null,
    });
    mockFromChains['bir_deadlines'] = chain;

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/deadlines', 'PATCH', {
        id: '00000000-0000-0000-0000-000000000001',
        status: 'filed',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('filed');
  });

  it('rejects invalid status', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/deadlines', 'PATCH', {
        id: '00000000-0000-0000-0000-000000000001',
        status: 'invalid_status',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects missing id', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/deadlines', 'PATCH', {
        status: 'filed',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('rejects invalid uuid for id', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/deadlines', 'PATCH', {
        id: 'not-a-uuid',
        status: 'filed',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
