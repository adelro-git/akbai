/**
 * Tests for Push API Routes — subscribe, unsubscribe, preferences, notifications
 * Feature: Push Notifications (Gap B6)
 * Tests Zod validation on API route inputs. Full integration tests
 * require Supabase and are covered separately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Supabase — prevent actual DB calls in unit tests
// Build a self-referencing mock chain where every method returns
// the chain itself. Terminal methods resolve with default data.
// ============================================================

const chainMethods = ['from', 'select', 'insert', 'update', 'eq', 'is', 'order', 'limit', 'single', 'maybeSingle', 'in'];
const mockSupabaseChain: Record<string, ReturnType<typeof vi.fn>> = {};
for (const method of chainMethods) {
  mockSupabaseChain[method] = vi.fn();
}

/** Reset all chain methods to return the chain object */
function resetChain() {
  for (const method of chainMethods) {
    mockSupabaseChain[method].mockReset();
    mockSupabaseChain[method].mockReturnValue(mockSupabaseChain);
  }
  // Terminal methods with default resolved values
  mockSupabaseChain.insert.mockResolvedValue({ data: null, error: null });
  mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
  mockSupabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });
  mockSupabaseChain.limit.mockResolvedValue({ data: [], error: null });
  mockSupabaseChain.order.mockResolvedValue({ data: [], error: null });
}

// Initial setup
resetChain();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: (...args: unknown[]) => mockSupabaseChain.from(...args),
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: (...args: unknown[]) => mockSupabaseChain.from(...args),
  }),
}));

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

// Mock the push-send library so the /send route tests exercise the route's
// auth + error handling (G4/G7) without touching web-push or the DB.
const mockSendPushToUser = vi.fn();
vi.mock('@/lib/push/send', () => ({
  sendPushToUser: (...args: unknown[]) => mockSendPushToUser(...args),
}));

// ============================================================
// Subscribe route tests
// ============================================================

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    resetChain();
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for missing endpoint (web branch)', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ platform: 'web', p256dh_key: 'key', auth_key: 'auth' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 201 for valid subscription data (web branch)', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'web',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        p256dh_key: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_test',
        auth_key: 'tBHItJI5svbpC7sc3fAhFQ',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.subscribed).toBe(true);
  });

  // ===== Sprint 16: native branch =====

  it('returns 201 for valid native (android) subscription payload', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'android',
        native_token: 'fcm-token-abcdef1234567890',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.subscribed).toBe(true);
  });

  it('returns 201 for valid native (ios) subscription payload with device_id', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'ios',
        native_token: 'apns-token-zyxwvu9876543210',
        device_id: 'device-uuid-1',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
  });

  it('returns 400 when native payload is missing native_token', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ platform: 'android' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 when platform discriminator is missing', async () => {
    const { POST } = await import('../subscribe/route');
    const req = new Request('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        p256dh_key: 'key',
        auth_key: 'auth',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

// ============================================================
// Unsubscribe route tests
// ============================================================

describe('POST /api/push/unsubscribe', () => {
  beforeEach(() => {
    resetChain();
  });

  it('returns 400 for missing platform discriminator', async () => {
    const { POST } = await import('../unsubscribe/route');
    const req = new Request('http://localhost/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 200 for valid unsubscribe (web branch)', async () => {
    const { POST } = await import('../unsubscribe/route');
    const req = new Request('http://localhost/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'web',
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.unsubscribed).toBe(true);
  });

  // ===== Sprint 16: native branch =====

  it('returns 200 for valid unsubscribe (android branch)', async () => {
    const { POST } = await import('../unsubscribe/route');
    const req = new Request('http://localhost/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'android',
        native_token: 'fcm-token-abcdef1234567890',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.unsubscribed).toBe(true);
  });

  it('returns 400 when native unsubscribe payload is missing native_token', async () => {
    const { POST } = await import('../unsubscribe/route');
    const req = new Request('http://localhost/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ platform: 'ios' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

// ============================================================
// Preferences route tests
// ============================================================

describe('GET /api/push/preferences', () => {
  beforeEach(() => {
    resetChain();
    // Override order to resolve with preferences data (terminal for GET query)
    mockSupabaseChain.order.mockResolvedValue({
      data: [
        { id: '1', user_id: 'test', notification_type: 'bir_deadline', enabled: true, created_at: '', updated_at: '' },
      ],
      error: null,
    });
  });

  it('returns preferences array', async () => {
    const { GET } = await import('../preferences/route');
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.preferences).toBeDefined();
    expect(Array.isArray(json.data.preferences)).toBe(true);
  });
});

describe('PATCH /api/push/preferences', () => {
  beforeEach(() => {
    resetChain();
    // Override single to resolve with updated preference (terminal for PATCH)
    mockSupabaseChain.single.mockResolvedValue({
      data: { id: '1', notification_type: 'bir_deadline', enabled: false },
      error: null,
    });
  });

  it('returns 400 for invalid notification_type', async () => {
    const { PATCH } = await import('../preferences/route');
    const req = new Request('http://localhost/api/push/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ notification_type: 'fake', enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req as never);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('returns 200 for valid preference update', async () => {
    const { PATCH } = await import('../preferences/route');
    const req = new Request('http://localhost/api/push/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ notification_type: 'bir_deadline', enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

// ============================================================
// Send route tests (service-role only) — G4 (constant-time bearer) + G7
// (structured error envelope when the send path throws).
// ============================================================

describe('POST /api/push/send', () => {
  const VALID_KEY = 'service-role-key-1234567890';
  // A valid SendPushSchema body (user_id must be a UUID).
  const validBody = {
    user_id: '00000000-0000-0000-0000-000000000001',
    notification_type: 'bir_deadline',
    title: 'BIR Deadline',
    body: 'Reminder',
  };

  beforeEach(() => {
    resetChain();
    mockSendPushToUser.mockReset();
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_KEY;
  });

  function sendReq(headers: Record<string, string>, body: unknown = validBody) {
    return new Request('http://localhost/api/push/send', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  it('returns 500 when service-role key is not configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({ authorization: 'Bearer whatever' }) as never);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('CONFIG_ERROR');
  });

  it('returns 403 when the Authorization header is missing', async () => {
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({}) as never);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it('returns 403 for a wrong bearer token (G4 constant-time compare still rejects)', async () => {
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({ authorization: 'Bearer wrong-key' }) as never);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it('returns 403 for a malformed (non-Bearer) Authorization header', async () => {
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({ authorization: VALID_KEY }) as never);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 for an invalid body when the bearer is valid', async () => {
    const { POST } = await import('../send/route');
    const res = await POST(
      sendReq({ authorization: `Bearer ${VALID_KEY}` }, { user_id: 'not-a-uuid' }) as never
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(mockSendPushToUser).not.toHaveBeenCalled();
  });

  it('returns 200 with sent/total on a successful send', async () => {
    mockSendPushToUser.mockResolvedValue({ sent: 2, total: 3 });
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({ authorization: `Bearer ${VALID_KEY}` }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ sent: 2, total: 3 });
    expect(mockSendPushToUser).toHaveBeenCalledOnce();
  });

  // --- G7 regression: a throw in the send path (e.g. missing VAPID env →
  // getVapidConfig() throws) must surface as the structured error envelope,
  // not an opaque framework 500. ---
  it('returns a structured 500 envelope when sendPushToUser throws (G7)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSendPushToUser.mockRejectedValue(new Error('Missing VAPID environment variables.'));
    const { POST } = await import('../send/route');
    const res = await POST(sendReq({ authorization: `Bearer ${VALID_KEY}` }) as never);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('PUSH_SEND_FAILED');
    expect(typeof json.error.message).toBe('string');
    errorSpy.mockRestore();
  });
});
