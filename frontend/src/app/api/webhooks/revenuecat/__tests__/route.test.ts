/**
 * RevenueCat Webhook Handler Tests — Signature verification, event routing,
 * idempotency, environment guard, always-200 behavior.
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 *
 * Mock surface:
 *   - @/lib/supabase/service.createServiceClient → mock Supabase chain
 *     with .from(...).insert(...), .from(...).update().eq(...), .rpc(...)
 *   - @/lib/iap/server-entitlements.fetchEntitlementsFromRevenueCat →
 *     deterministic entitlement (tier='pro', expires_at=FUTURE_DATE)
 *   - @sentry/nextjs.captureException → spy (verifies tagging on error)
 *
 * Reference: sprint-17-revenuecat-pattern.md §3 + §8 batch 2 + §12.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Mock setup — must come BEFORE importing the route module.
// vi.mock factories are hoisted; references inside use `vi.fn()`
// constructed locally to allow per-test reconfiguration.
// ============================================================

// --- Service client mock: returns a chainable mock object ---
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();
const mockRpc = vi.fn();

const mockServiceClient = {
  from: vi.fn((_table: string) => ({
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { eq: (...eqArgs: unknown[]) => mockUpdateEq(...eqArgs) };
    },
  })),
  rpc: (...args: unknown[]) => mockRpc(...args),
};

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => mockServiceClient),
}));

// --- REST entitlement lookup mock ---
const mockFetchEntitlements = vi.fn();
vi.mock('@/lib/iap/server-entitlements', () => ({
  fetchEntitlementsFromRevenueCat: (...args: unknown[]) => mockFetchEntitlements(...args),
}));

// --- Sentry mock (dynamic-imported by the route) ---
const mockSentryCapture = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockSentryCapture(...args),
}));

// ============================================================
// Test fixtures
// ============================================================

const WEBHOOK_AUTH = 'rc-webhook-secret-xyz-123';
const FUTURE_DATE = '2099-12-31T00:00:00.000Z';
const EVENT_ID_BASE = '11111111-2222-3333-4444-555555555555';
const USER_ID = '00000000-0000-0000-0000-000000000001';

function makeEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    api_version: '1.0',
    event: {
      id: EVENT_ID_BASE,
      type: 'INITIAL_PURCHASE',
      event_timestamp_ms: 1716826800000,
      app_user_id: USER_ID,
      environment: 'PRODUCTION',
      product_id: 'pro_monthly',
      ...overrides,
    },
  };
}

function makeRequest(body: unknown, authHeader?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authHeader !== undefined) {
    headers['Authorization'] = authHeader;
  }
  return new Request('http://localhost:3000/api/webhooks/revenuecat', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

// ============================================================
// Lifecycle
// ============================================================

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();

  process.env.REVENUECAT_WEBHOOK_AUTH = WEBHOOK_AUTH;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  // NODE_ENV defaults to 'test' in vitest; explicit set for clarity.
  // Use vi.stubEnv because NODE_ENV is typed as readonly in @types/node.
  vi.stubEnv('NODE_ENV', 'test');

  // Default: insert succeeds, RPC succeeds, REST returns 'pro'
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue({ error: null });
  mockFetchEntitlements.mockResolvedValue({ tier: 'pro', expires_at: FUTURE_DATE });
});

afterEach(() => {
  vi.unstubAllEnvs();
  process.env = { ...originalEnv };
});

// ============================================================
// Signature Verification
// ============================================================

describe('RevenueCat Webhook — Signature Verification', () => {
  it('returns 200 + processes when Authorization Bearer matches', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('returns 200 silent when Authorization token is wrong (no DB writes)', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), 'Bearer wrong-secret-here');

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 200 silent when Authorization header is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent()); // no auth header

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 200 silent when Authorization prefix is not Bearer', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Basic ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 200 silent when REVENUECAT_WEBHOOK_AUTH env var is missing', async () => {
    delete process.env.REVENUECAT_WEBHOOK_AUTH;
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('uses constant-time compare (length mismatch fails without leaking)', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    // Token shorter than expected → length-mismatch branch
    const req = makeRequest(makeEvent(), 'Bearer short');

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ============================================================
// Body parsing / Zod validation
// ============================================================

describe('RevenueCat Webhook — Body Parsing', () => {
  it('returns 200 silent on invalid JSON body', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest('this-is-not-json', `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 200 silent on Zod parse failure (missing api_version)', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest({ event: { id: 'not-a-uuid' } }, `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 200 silent on Zod parse failure (unknown event type)', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const bad = makeEvent({ type: 'SOMETHING_UNKNOWN' });

    const res = await POST(makeRequest(bad, `Bearer ${WEBHOOK_AUTH}`) as never);
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ============================================================
// Idempotency (Gap G2)
// ============================================================

describe('RevenueCat Webhook — Idempotency', () => {
  it('inserts event on first delivery and proceeds to tier write', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.received).toBe(true);
    expect(json.data.deduped).toBeUndefined();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('returns deduped=true on duplicate event (PG 23505) and skips tier write', async () => {
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.deduped).toBe(true);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFetchEntitlements).not.toHaveBeenCalled();
  });

  it('returns 200 + skips tier write on other insert DB error', async () => {
    mockInsert.mockResolvedValue({
      error: { code: 'XX000', message: 'connection lost' },
    });

    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('marks event processed after successful tier write', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    await POST(req as never);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updateArgs = mockUpdate.mock.calls[0]?.[0] as { processed_at?: string };
    expect(updateArgs?.processed_at).toBeDefined();
    expect(mockUpdateEq).toHaveBeenCalledWith('event_id', EVENT_ID_BASE);
  });
});

// ============================================================
// Event-type routing — p_reset_started_at flag
// ============================================================

describe('RevenueCat Webhook — Event-type routing', () => {
  type Case = { type: string; reset: boolean };

  // Each case has a unique valid UUID so the idempotent insert doesn't
  // collide across iterations within the same describe block.
  const cases: (Case & { id: string })[] = [
    { type: 'INITIAL_PURCHASE',      reset: true,  id: '11111111-1111-1111-1111-111111111101' },
    { type: 'NON_RENEWING_PURCHASE', reset: true,  id: '11111111-1111-1111-1111-111111111102' },
    { type: 'RENEWAL',               reset: false, id: '11111111-1111-1111-1111-111111111103' },
    { type: 'PRODUCT_CHANGE',        reset: false, id: '11111111-1111-1111-1111-111111111104' },
    { type: 'CANCELLATION',          reset: false, id: '11111111-1111-1111-1111-111111111105' },
    { type: 'EXPIRATION',            reset: false, id: '11111111-1111-1111-1111-111111111106' },
    { type: 'BILLING_ISSUE',         reset: false, id: '11111111-1111-1111-1111-111111111107' },
    { type: 'UNCANCELLATION',        reset: false, id: '11111111-1111-1111-1111-111111111108' },
  ];

  for (const { type, reset, id } of cases) {
    it(`${type} → set_user_tier_v2 called with p_reset_started_at=${reset}`, async () => {
      const { POST } = await import('@/app/api/webhooks/revenuecat/route');
      const req = makeRequest(
        makeEvent({ type, id }),
        `Bearer ${WEBHOOK_AUTH}`,
      );

      const res = await POST(req as never);
      expect(res.status).toBe(200);
      expect(mockRpc).toHaveBeenCalledTimes(1);
      const [name, params] = mockRpc.mock.calls[0] as [
        string,
        { p_reset_started_at: boolean; p_user_id: string; p_tier: string },
      ];
      expect(name).toBe('set_user_tier_v2');
      expect(params.p_reset_started_at).toBe(reset);
      expect(params.p_user_id).toBe(USER_ID);
      expect(params.p_tier).toBe('pro');
    });
  }

  const logOnly: { type: string; id: string }[] = [
    { type: 'SUBSCRIBER_ALIAS', id: '22222222-2222-2222-2222-222222222201' },
    { type: 'TRANSFER',         id: '22222222-2222-2222-2222-222222222202' },
    { type: 'TEST',             id: '22222222-2222-2222-2222-222222222203' },
  ];
  for (const { type, id } of logOnly) {
    it(`${type} → log only, NO set_user_tier_v2 call`, async () => {
      const { POST } = await import('@/app/api/webhooks/revenuecat/route');
      const req = makeRequest(
        makeEvent({ type, id }),
        `Bearer ${WEBHOOK_AUTH}`,
      );

      const res = await POST(req as never);
      expect(res.status).toBe(200);
      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockFetchEntitlements).not.toHaveBeenCalled();
    });
  }
});

// ============================================================
// Environment guard (sandbox vs production)
// ============================================================

describe('RevenueCat Webhook — Environment guard', () => {
  it('skips tier write for SANDBOX event when NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ environment: 'SANDBOX', id: '99999999-0000-0000-0000-000000000001' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFetchEntitlements).not.toHaveBeenCalled();
    // Event was still inserted for audit trail
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('processes SANDBOX event when NODE_ENV=development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ environment: 'SANDBOX', id: '99999999-0000-0000-0000-000000000002' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('processes PRODUCTION event when NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ environment: 'PRODUCTION', id: '99999999-0000-0000-0000-000000000003' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });

  it('processes PRODUCTION event when NODE_ENV=test (default)', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ environment: 'PRODUCTION', id: '99999999-0000-0000-0000-000000000004' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// Entitlement → set_user_tier_v2 payload
// ============================================================

describe('RevenueCat Webhook — Entitlement payload', () => {
  it('passes the REST-resolved tier + expires_at through to the RPC', async () => {
    mockFetchEntitlements.mockResolvedValue({ tier: 'starter', expires_at: null });
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ type: 'NON_RENEWING_PURCHASE', product_id: 'starter_lifetime' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    await POST(req as never);

    const [, params] = mockRpc.mock.calls[0] as [
      string,
      { p_tier: string; p_expires_at: string | null; p_revenuecat_app_user_id: string },
    ];
    expect(params.p_tier).toBe('starter');
    expect(params.p_expires_at).toBeNull();
    expect(params.p_revenuecat_app_user_id).toBe(USER_ID);
  });

  it('passes pro tier with FUTURE_DATE expires_at on RENEWAL', async () => {
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(
      makeEvent({ type: 'RENEWAL', product_id: 'pro_monthly' }),
      `Bearer ${WEBHOOK_AUTH}`,
    );

    await POST(req as never);

    const [, params] = mockRpc.mock.calls[0] as [
      string,
      { p_tier: string; p_expires_at: string | null },
    ];
    expect(params.p_tier).toBe('pro');
    expect(params.p_expires_at).toBe(FUTURE_DATE);
  });
});

// ============================================================
// Error handling — always 200
// ============================================================

describe('RevenueCat Webhook — Error handling', () => {
  it('returns 200 when set_user_tier_v2 throws (Sentry capture invoked)', async () => {
    mockRpc.mockResolvedValue({
      error: { message: 'RPC database unavailable' },
    });
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as {
      tags?: { source?: string; event_type?: string };
    } | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-webhook');
    expect(captureArgs?.tags?.event_type).toBe('INITIAL_PURCHASE');
  });

  it('returns 200 when REST entitlement lookup throws', async () => {
    mockFetchEntitlements.mockRejectedValue(new Error('REST timeout'));
    const { POST } = await import('@/app/api/webhooks/revenuecat/route');
    const req = makeRequest(makeEvent(), `Bearer ${WEBHOOK_AUTH}`);

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
  });
});
