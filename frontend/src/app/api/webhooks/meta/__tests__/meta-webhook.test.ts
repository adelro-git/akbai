/**
 * Tests for Meta Webhook Endpoint — GET verification and POST handling
 * Feature: Meta API Integration (Sprint 12, Gap E2)
 *
 * Tests cover: successful verification, token mismatch, missing params,
 * POST payload handling, invalid JSON rejection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Test Helpers — mock NextRequest for route handler
// ============================================================

function createMockRequest(
  method: string,
  params?: Record<string, string>,
  body?: unknown
): Request & { nextUrl: URL } {
  const url = new URL('http://localhost:3000/api/webhooks/meta');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const req = new Request(url.toString(), init) as Request & { nextUrl: URL };
  req.nextUrl = url;
  return req;
}

// ============================================================
// 1. GET — Successful Verification
// ============================================================

describe('Meta Webhook — GET verification', () => {
  const VERIFY_TOKEN = 'test-verify-token-123';

  beforeEach(() => {
    vi.stubEnv('META_WEBHOOK_VERIFY_TOKEN', VERIFY_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return challenge on valid verification request', async () => {
    const { GET } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('GET', {
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'test-challenge-abc',
    });

    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('test-challenge-abc');
  });

  it('should return 403 on token mismatch', async () => {
    const { GET } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('GET', {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'test-challenge',
    });

    const res = await GET(req as never);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 on missing hub.mode', async () => {
    const { GET } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('GET', {
      'hub.verify_token': VERIFY_TOKEN,
      'hub.challenge': 'test-challenge',
    });

    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_PARAMS');
  });

  it('should return 400 on missing hub.challenge', async () => {
    const { GET } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('GET', {
      'hub.mode': 'subscribe',
      'hub.verify_token': VERIFY_TOKEN,
    });

    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  it('should return 500 when META_WEBHOOK_VERIFY_TOKEN is not set', async () => {
    vi.unstubAllEnvs();
    // Remove the env var
    const original = process.env.META_WEBHOOK_VERIFY_TOKEN;
    delete process.env.META_WEBHOOK_VERIFY_TOKEN;

    // Need fresh import to avoid module cache
    vi.resetModules();
    const { GET } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('GET', {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'some-token',
      'hub.challenge': 'test-challenge',
    });

    const res = await GET(req as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('SERVER_CONFIG');

    // Restore
    if (original) process.env.META_WEBHOOK_VERIFY_TOKEN = original;
  });
});

// ============================================================
// 2. POST — Payload Handling
// ============================================================

describe('Meta Webhook — POST payload', () => {
  beforeEach(() => {
    vi.stubEnv('META_WEBHOOK_VERIFY_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 200 on valid payload', async () => {
    const { POST } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('POST', undefined, {
      object: 'page',
      entry: [{ id: '123', changes: [] }],
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.received).toBe(true);
  });

  it('should return 200 even on structurally invalid payload (no retry storms)', async () => {
    const { POST } = await import('@/app/api/webhooks/meta/route');
    const req = createMockRequest('POST', undefined, {
      unexpected: 'data',
    });

    const res = await POST(req as never);
    // Still 200 to prevent Meta retry storms
    expect(res.status).toBe(200);
  });

  it('should return 400 on non-JSON body', async () => {
    const { POST } = await import('@/app/api/webhooks/meta/route');
    const url = new URL('http://localhost:3000/api/webhooks/meta');
    const req = new Request(url.toString(), {
      method: 'POST',
      body: 'not json at all',
      headers: { 'Content-Type': 'text/plain' },
    }) as Request & { nextUrl: URL };
    req.nextUrl = url;

    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_JSON');
  });
});
