/**
 * RevenueCat REST entitlement lookup — fetchEntitlementsFromRevenueCat()
 * tests (Sprint 17 batch 2).
 *
 * Scope: validates the tier-resolution state machine without hitting
 *        the real RevenueCat REST API. Mocks `global.fetch` and
 *        @sentry/nextjs.
 *
 * Key assertions (architect §4 state table):
 *   - REST happy path: pro_unlimited live → 'pro' with expires_at
 *   - REST happy path: starter_lifetime only → 'starter' with null
 *   - REST happy path: both active → 'pro' (priority)
 *   - REST happy path: pro expired, starter active → 'starter' (fallback)
 *   - REST happy path: no entitlements → 'free'
 *   - REST 401 / 404 / 5xx → fallback 'free' + Sentry capture
 *   - REST network error → fallback 'free' + Sentry capture
 *   - REST invalid JSON → fallback 'free' + Sentry capture
 *   - Missing REVENUECAT_REST_API_KEY env var → fallback 'free'
 *
 * Reference: sprint-17-revenuecat-pattern.md §3 (lines 512-557) + §4.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Mocks — Sentry only; fetch is mocked via global override per test.
// ============================================================

const mockSentryCapture = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => mockSentryCapture(...args),
}));

// ============================================================
// Subject under test
// ============================================================

import { fetchEntitlementsFromRevenueCat } from '../server-entitlements';

// ============================================================
// Fixtures
// ============================================================

const APP_USER_ID = '00000000-0000-0000-0000-000000000099';
const REST_KEY = 'rc-rest-key-test-xyz';

const FUTURE_DATE = '2099-12-31T00:00:00.000Z';
const PAST_DATE = '2020-01-01T00:00:00.000Z';

function mockFetchResponse(status: number, json: unknown): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(json),
  }) as unknown as typeof fetch;
}

function mockFetchReject(err: Error): void {
  global.fetch = vi.fn().mockRejectedValue(err) as unknown as typeof fetch;
}

function mockFetchInvalidJson(status = 200): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new Error('Unexpected token')),
  }) as unknown as typeof fetch;
}

// ============================================================
// Lifecycle
// ============================================================

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

beforeEach(() => {
  mockSentryCapture.mockReset();
  process.env.REVENUECAT_REST_API_KEY = REST_KEY;
});

afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});

// ============================================================
// Happy path — entitlement resolution
// ============================================================

describe('fetchEntitlementsFromRevenueCat — happy path', () => {
  it('returns tier=pro with expires_at when pro_unlimited is live', async () => {
    mockFetchResponse(200, {
      subscriber: {
        entitlements: {
          pro_unlimited: { expires_date: FUTURE_DATE },
        },
      },
    });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'pro', expires_at: FUTURE_DATE });
  });

  it('returns tier=starter with null expires_at when only starter_lifetime is active', async () => {
    mockFetchResponse(200, {
      subscriber: {
        entitlements: {
          starter_lifetime: { expires_date: null, purchase_date: '2026-05-01T00:00:00Z' },
        },
      },
    });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'starter', expires_at: null });
  });

  it('returns tier=pro when BOTH pro_unlimited (live) and starter_lifetime are active', async () => {
    mockFetchResponse(200, {
      subscriber: {
        entitlements: {
          pro_unlimited: { expires_date: FUTURE_DATE },
          starter_lifetime: { expires_date: null },
        },
      },
    });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result.tier).toBe('pro');
    expect(result.expires_at).toBe(FUTURE_DATE);
  });

  it('falls back to tier=starter when pro_unlimited is EXPIRED and starter_lifetime is active', async () => {
    mockFetchResponse(200, {
      subscriber: {
        entitlements: {
          pro_unlimited: { expires_date: PAST_DATE },
          starter_lifetime: { expires_date: null },
        },
      },
    });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result.tier).toBe('starter');
    expect(result.expires_at).toBeNull();
  });

  it('returns tier=free when pro_unlimited is expired and no starter_lifetime', async () => {
    mockFetchResponse(200, {
      subscriber: {
        entitlements: {
          pro_unlimited: { expires_date: PAST_DATE },
        },
      },
    });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
  });

  it('returns tier=free when no entitlements are active', async () => {
    mockFetchResponse(200, { subscriber: { entitlements: {} } });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
  });

  it('returns tier=free when entitlements key is missing entirely', async () => {
    mockFetchResponse(200, { subscriber: {} });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
  });

  it('sends Authorization: Bearer header with REVENUECAT_REST_API_KEY', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ subscriber: { entitlements: {} } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchEntitlementsFromRevenueCat(APP_USER_ID);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers?: Record<string, string> },
    ];
    expect(url).toContain(`/v1/subscribers/${APP_USER_ID}`);
    expect(init?.headers?.Authorization).toBe(`Bearer ${REST_KEY}`);
  });
});

// ============================================================
// Failure paths — REST error responses + fallbacks
// ============================================================

describe('fetchEntitlementsFromRevenueCat — failure paths', () => {
  it('returns tier=free + Sentry capture on HTTP 401', async () => {
    mockFetchResponse(401, { error: 'Unauthorized' });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as {
      tags?: { source?: string };
      extra?: { appUserId?: string; status?: number };
    } | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-rest-lookup');
    expect(captureArgs?.extra?.status).toBe(401);
  });

  it('returns tier=free + Sentry capture on HTTP 404', async () => {
    mockFetchResponse(404, { error: 'Not Found' });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as {
      extra?: { status?: number };
    } | undefined;
    expect(captureArgs?.extra?.status).toBe(404);
  });

  it('returns tier=free + Sentry capture on HTTP 5xx', async () => {
    mockFetchResponse(503, { error: 'Service Unavailable' });

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
  });

  it('returns tier=free + Sentry capture on network/fetch reject', async () => {
    mockFetchReject(new Error('ECONNREFUSED'));

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as {
      tags?: { source?: string };
    } | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-rest-lookup');
  });

  it('returns tier=free + Sentry capture on invalid JSON body', async () => {
    mockFetchInvalidJson(200);

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
  });
});

// ============================================================
// Missing REST key — Sprint 17 acceptance fallback
// ============================================================

describe('fetchEntitlementsFromRevenueCat — missing REST key fallback', () => {
  it('returns tier=free without calling fetch when REVENUECAT_REST_API_KEY is missing', async () => {
    delete process.env.REVENUECAT_REST_API_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await fetchEntitlementsFromRevenueCat(APP_USER_ID);
    expect(result).toEqual({ tier: 'free', expires_at: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    // No Sentry capture — this is the EXPECTED Sprint 17 acceptance path,
    // not an error.
    expect(mockSentryCapture).not.toHaveBeenCalled();
  });
});
