/**
 * API Route Tests — GET /api/admin/users
 * Feature: Admin Dashboard (Gap D10)
 *
 * Focus (A1): the last_sign_in_at enrichment must paginate the GoTrue
 * admin.listUsers() API. GoTrue defaults to perPage=50 and does not paginate
 * on its own, so users beyond the first page would otherwise get a null
 * last_sign_in_at. We assert the loop walks every page and that sign-in data
 * is mapped for users beyond the first page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ============================================================
// Hoisted mocks
// ============================================================

const { mockServiceFrom, mockListUsers, mockGetUser } = vi.hoisted(() => ({
  mockServiceFrom: vi.fn(),
  mockListUsers: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockServiceFrom,
    auth: { admin: { listUsers: mockListUsers } },
  })),
}));

vi.mock('@/lib/admin/auth', () => ({
  isAdmin: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

vi.mock('@/lib/rate-limit/middleware', () => ({
  enforceRateLimit: vi.fn(() => null),
}));

const getReq = (): NextRequest =>
  new Request('http://localhost/api/admin/users') as unknown as NextRequest;

// Stub the users table read: select().is().order() resolves to the rows.
function stubUsersTable(rows: Array<Record<string, unknown>>) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const is = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ is }));
  mockServiceFrom.mockReturnValue({ select });
}

describe('GET /api/admin/users (A1 pagination)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('paginates listUsers and maps sign-in data for users beyond the first page', async () => {
    // Two domain users: one on "page 1" of auth, one only present on "page 2".
    stubUsersTable([
      { id: 'u-1', email: 'a@x.com', full_name: null, business_name: null, subscription_tier: 'free', onboarding_completed: true, feature_flags: null, created_at: '2026-01-02T00:00:00Z' },
      { id: 'u-2', email: 'b@x.com', full_name: null, business_name: null, subscription_tier: 'pro', onboarding_completed: true, feature_flags: null, created_at: '2026-01-01T00:00:00Z' },
    ]);

    // First page is "full" (length === perPage 1000) so the loop continues;
    // second page is short so the loop stops. We simulate the full first page
    // with a single representative entry padded by length via the array.
    const fullPage = Array.from({ length: 1000 }, (_, i) =>
      i === 0
        ? { id: 'u-1', last_sign_in_at: '2026-05-01T00:00:00Z' }
        : { id: `pad-${i}`, last_sign_in_at: null },
    );
    mockListUsers
      .mockResolvedValueOnce({ data: { users: fullPage }, error: null })
      .mockResolvedValueOnce({
        data: { users: [{ id: 'u-2', last_sign_in_at: '2026-05-02T00:00:00Z' }] },
        error: null,
      });

    const { GET } = await import('../route');
    const res = await GET(getReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // listUsers walked both pages.
    expect(mockListUsers).toHaveBeenCalledTimes(2);
    expect(mockListUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
    expect(mockListUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });

    const byId = Object.fromEntries(
      (json.data as Array<{ id: string; last_sign_in_at: string | null }>).map((u) => [u.id, u.last_sign_in_at]),
    );
    expect(byId['u-1']).toBe('2026-05-01T00:00:00Z');
    // u-2 only appears on auth page 2 — proves pagination worked.
    expect(byId['u-2']).toBe('2026-05-02T00:00:00Z');
  });

  it('stops after a single short page (no extra listUsers calls)', async () => {
    stubUsersTable([
      { id: 'u-1', email: 'a@x.com', full_name: null, business_name: null, subscription_tier: 'free', onboarding_completed: true, feature_flags: null, created_at: '2026-01-02T00:00:00Z' },
    ]);

    mockListUsers.mockResolvedValueOnce({
      data: { users: [{ id: 'u-1', last_sign_in_at: '2026-05-01T00:00:00Z' }] },
      error: null,
    });

    const { GET } = await import('../route');
    const res = await GET(getReq());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockListUsers).toHaveBeenCalledTimes(1);
    expect(json.data[0].last_sign_in_at).toBe('2026-05-01T00:00:00Z');
  });

  it('stops paginating gracefully when listUsers errors mid-walk', async () => {
    stubUsersTable([
      { id: 'u-1', email: 'a@x.com', full_name: null, business_name: null, subscription_tier: 'free', onboarding_completed: true, feature_flags: null, created_at: '2026-01-02T00:00:00Z' },
    ]);

    mockListUsers.mockResolvedValueOnce({ data: null, error: { message: 'auth down' } });

    const { GET } = await import('../route');
    const res = await GET(getReq());
    const json = await res.json();

    // Endpoint still succeeds; sign-in is simply null for unmapped users.
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data[0].last_sign_in_at).toBeNull();
    expect(mockListUsers).toHaveBeenCalledTimes(1);
  });
});
