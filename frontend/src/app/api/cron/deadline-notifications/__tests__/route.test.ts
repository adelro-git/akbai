/**
 * Deadline Notification Cron — Route handler tests.
 * Feature: Push Notifications (Gap B6) + Resilience scheduling (Sprint 18, §11)
 *
 * Mock surface (mirrors the RevenueCat route test conventions):
 *   - @/lib/supabase/service.createServiceClient → chainable mock whose
 *     terminal .is(...) resolves to { data, error }.
 *   - @/lib/push/deadline-triggers.triggerDeadlineNotifications → spy.
 *
 * Coverage:
 *   - Auth fail-closed: no header / blank / wrong / unset CRON_SECRET → 401.
 *   - Success path: distinct users enumerated, trigger invoked per user,
 *     summary { processed, sent, skipped } correct.
 *   - DB error → sanitized 500.
 *   - Per-user trigger throw is isolated (counted skipped, batch continues).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Mock setup — hoisted before importing the route module.
// ============================================================

// --- Service client mock: from(...).select(...).eq(...).is(...) resolves ---
const mockIs = vi.fn();
const mockServiceClient = {
  from: vi.fn((_table: string) => ({
    select: (_cols: string) => ({
      eq: (_col: string, _val: unknown) => ({
        is: (...args: unknown[]) => mockIs(...args),
      }),
    }),
  })),
};

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}));

// --- Deadline trigger mock ---
const mockTrigger = vi.fn();
vi.mock('@/lib/push/deadline-triggers', () => ({
  triggerDeadlineNotifications: (...args: unknown[]) => mockTrigger(...args),
}));

// ============================================================
// Fixtures
// ============================================================

const CRON_SECRET = 'cron-secret-abc-123';
const USER_A = '00000000-0000-0000-0000-00000000000a';
const USER_B = '00000000-0000-0000-0000-00000000000b';

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers['Authorization'] = authHeader;
  }
  return new Request('http://localhost:3000/api/cron/deadline-notifications', {
    method: 'GET',
    headers,
  });
}

// ============================================================
// Lifecycle
// ============================================================

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = CRON_SECRET;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

  // Default: two distinct users with upcoming deadlines (USER_A appears twice).
  mockIs.mockResolvedValue({
    data: [{ user_id: USER_A }, { user_id: USER_A }, { user_id: USER_B }],
    error: null,
  });
  // Default trigger: 1 sent for whoever is called.
  mockTrigger.mockResolvedValue({ sent: 1, notifications: [] });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ============================================================
// Auth — fail-closed
// ============================================================

describe('Cron deadline-notifications — Auth (fail-closed)', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization token is blank', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest('Bearer ') as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization token is wrong', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest('Bearer totally-wrong-secret') as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization prefix is not Bearer', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Basic ${CRON_SECRET}`) as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('returns 401 when CRON_SECRET env var is unset (misconfig fail-closed)', async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('returns 401 on length-mismatched token (constant-time branch)', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest('Bearer short') as never);
    expect(res.status).toBe(401);
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});

// ============================================================
// Success path
// ============================================================

describe('Cron deadline-notifications — Success', () => {
  it('processes distinct users and returns the summary', async () => {
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // USER_A deduped from two rows → 2 distinct users processed.
    expect(json.data.processed).toBe(2);
    expect(json.data.sent).toBe(2);
    expect(json.data.skipped).toBe(0);

    expect(mockTrigger).toHaveBeenCalledTimes(2);
    expect(mockTrigger).toHaveBeenCalledWith(USER_A);
    expect(mockTrigger).toHaveBeenCalledWith(USER_B);
  });

  it('counts a user with nothing due as skipped', async () => {
    mockTrigger.mockImplementation((userId: string) =>
      Promise.resolve({ sent: userId === USER_A ? 1 : 0, notifications: [] }),
    );
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);

    const json = await res.json();
    expect(json.data.processed).toBe(2);
    expect(json.data.sent).toBe(1);
    expect(json.data.skipped).toBe(1);
  });

  it('returns an empty summary when there are no candidate users', async () => {
    mockIs.mockResolvedValue({ data: [], error: null });
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({ processed: 0, sent: 0, skipped: 0 });
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('isolates a per-user trigger failure (counts skipped, batch continues)', async () => {
    mockTrigger.mockImplementation((userId: string) => {
      if (userId === USER_A) {
        return Promise.reject(new Error('send blew up'));
      }
      return Promise.resolve({ sent: 1, notifications: [] });
    });
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    // Both attempted; A failed (skipped), B sent.
    expect(json.data.processed).toBe(1);
    expect(json.data.sent).toBe(1);
    expect(json.data.skipped).toBe(1);
    expect(mockTrigger).toHaveBeenCalledTimes(2);
  });
});

// ============================================================
// DB error → sanitized 500
// ============================================================

describe('Cron deadline-notifications — Error handling', () => {
  it('returns sanitized 500 when the candidate query errors', async () => {
    mockIs.mockResolvedValue({ data: null, error: { message: 'connection refused at db host' } });
    const { GET } = await import('@/app/api/cron/deadline-notifications/route');
    const res = await GET(makeRequest(`Bearer ${CRON_SECRET}`) as never);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('CRON_QUERY_FAILED');
    // Sanitized — the raw DB message must not leak into the response.
    expect(JSON.stringify(json)).not.toContain('connection refused');
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
