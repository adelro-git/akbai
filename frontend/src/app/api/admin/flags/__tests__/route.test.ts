/**
 * API Route Tests — PATCH /api/admin/flags (resolve a content flag)
 * Feature: Admin Dashboard (Gap D10)
 *
 * Focus (A5/G3): the resolve update must filter `.is('deleted_at', null)` so a
 * soft-deleted flag cannot be resurrected, and a missing/soft-deleted id
 * (PGRST116 from .single()) must return 404, not a generic 500.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ============================================================
// Hoisted mocks
// ============================================================

const { mockServiceFrom, mockGetUser } = vi.hoisted(() => ({
  mockServiceFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

// Bypass auth in these tests by running as the dev user.
vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

// Rate limit is a no-op for route logic tests.
vi.mock('@/lib/rate-limit/middleware', () => ({
  enforceRateLimit: vi.fn(() => null),
}));

const VALID_ID = '550e8400-e29b-41d4-a716-446655440000';

const patchReq = (body: unknown): NextRequest =>
  new Request('http://localhost/api/admin/flags', {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as unknown as NextRequest;

// Builds the update().eq().is().select().single() chain with a controllable
// terminal result. Returns the spies so assertions can inspect the chain.
function buildUpdateChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ single }));
  const is = vi.fn(() => ({ select }));
  const eq = vi.fn(() => ({ is }));
  const update = vi.fn(() => ({ eq }));
  mockServiceFrom.mockReturnValue({ update });
  return { update, eq, is, select, single };
}

describe('PATCH /api/admin/flags (A5/G3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves a flag and applies the soft-delete filter', async () => {
    const chain = buildUpdateChain({
      data: { id: VALID_ID, resolved: true, resolved_at: '2026-05-31T00:00:00Z' },
      error: null,
    });

    const { PATCH } = await import('../route');
    const res = await PATCH(patchReq({ id: VALID_ID }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.resolved).toBe(true);

    // A5/G3: the deleted_at filter MUST be present in the update chain.
    expect(chain.eq).toHaveBeenCalledWith('id', VALID_ID);
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('returns 404 (not 500) when the flag id is missing or soft-deleted (PGRST116)', async () => {
    buildUpdateChain({
      data: null,
      error: { code: 'PGRST116', message: 'no rows returned' },
    });

    const { PATCH } = await import('../route');
    const res = await PATCH(patchReq({ id: VALID_ID }));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 500 for a genuine DB error (non-PGRST116)', async () => {
    buildUpdateChain({
      data: null,
      error: { code: '57014', message: 'statement timeout' },
    });

    const { PATCH } = await import('../route');
    const res = await PATCH(patchReq({ id: VALID_ID }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe('DB_ERROR');
  });

  it('returns 400 when the body is not a valid UUID', async () => {
    const { PATCH } = await import('../route');
    const res = await PATCH(patchReq({ id: 'not-a-uuid' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });
});
