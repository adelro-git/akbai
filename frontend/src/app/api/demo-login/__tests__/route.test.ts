/**
 * Demo Login route — handler tests.
 * Feature: Reviewer demo bypass (Sprint 18, Gap §11 P0).
 *
 * Mock surface:
 *   - @/lib/supabase/server.createClient → a client whose
 *     auth.signInWithPassword is a spy. We assert it is NEVER called on any
 *     fail-closed path, and is called with the FIXED demo email on success.
 *
 * Coverage (this is an AUTH SURFACE — fail-closed is the headline):
 *   - DEMO_MODE_ENABLED unset/!= 'true' → 404, no Supabase call. (prod default)
 *   - Enabled + wrong email → 403, no Supabase call. (no arbitrary emails)
 *   - Enabled + demo email but DEMO_ACCOUNT_PASSWORD unset → 500, no sign-in.
 *   - Enabled + demo email + password, Supabase rejects → 403 (generic).
 *   - Enabled + demo email + password, Supabase accepts → 200, signed in with
 *     the FIXED demo email (never the request's email).
 *   - Malformed body → 403, no Supabase call.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Supabase SSR server client mock ---
const mockSignInWithPassword = vi.fn();
const mockServerClient = {
  auth: { signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args) },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockServerClient),
}));

const DEMO_EMAIL = 'demo@akbai.app';
const DEMO_PASSWORD = 'strong-demo-password-123';

function makeRequest(body?: unknown, raw?: string): Request {
  return new Request('http://localhost:3000/api/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw !== undefined ? raw : JSON.stringify(body ?? {}),
  });
}

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.DEMO_MODE_ENABLED;
  delete process.env.NEXT_PUBLIC_DEMO_MODE;
  delete process.env.DEMO_ACCOUNT_PASSWORD;
  // Default: a successful sign-in (overridden per-test where needed).
  mockSignInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ============================================================
// Gate 1 — master kill-switch (production default = OFF)
// ============================================================

describe('demo-login — DEMO_MODE_ENABLED gate (fail-closed)', () => {
  it('returns 404 when DEMO_MODE_ENABLED is unset', async () => {
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest({ email: DEMO_EMAIL }) as never);
    expect(res.status).toBe(404);
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it.each(['false', 'TRUE', '1', ''])(
    'returns 404 when DEMO_MODE_ENABLED is non-exact value %j',
    async (val) => {
      process.env.DEMO_MODE_ENABLED = val;
      process.env.DEMO_ACCOUNT_PASSWORD = DEMO_PASSWORD;
      const { POST } = await import('@/app/api/demo-login/route');
      const res = await POST(makeRequest({ email: DEMO_EMAIL }) as never);
      expect(res.status).toBe(404);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    },
  );
});

// ============================================================
// Gate 2 — only the demo email (no arbitrary emails)
// ============================================================

describe('demo-login — email gate', () => {
  beforeEach(() => {
    process.env.DEMO_MODE_ENABLED = 'true';
    process.env.DEMO_ACCOUNT_PASSWORD = DEMO_PASSWORD;
  });

  it.each(['attacker@evil.com', 'demo@akbai.com', 'admin@akbai.app', ''])(
    'returns 403 and never calls Supabase for non-demo email %j',
    async (email) => {
      const { POST } = await import('@/app/api/demo-login/route');
      const res = await POST(makeRequest({ email }) as never);
      expect(res.status).toBe(403);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    },
  );

  it('returns 403 on malformed JSON body (no Supabase call)', async () => {
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest(undefined, '{not json') as never);
    expect(res.status).toBe(403);
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('returns 403 when body has no email field', async () => {
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(403);
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});

// ============================================================
// Gate 3 — password must be configured
// ============================================================

describe('demo-login — password config gate', () => {
  it('returns 500 (fail-closed) when DEMO_ACCOUNT_PASSWORD is unset', async () => {
    process.env.DEMO_MODE_ENABLED = 'true';
    // DEMO_ACCOUNT_PASSWORD intentionally unset.
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest({ email: DEMO_EMAIL }) as never);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('DEMO_MISCONFIGURED');
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});

// ============================================================
// Sign-in path
// ============================================================

describe('demo-login — sign-in', () => {
  beforeEach(() => {
    process.env.DEMO_MODE_ENABLED = 'true';
    process.env.DEMO_ACCOUNT_PASSWORD = DEMO_PASSWORD;
  });

  it('returns 200 and signs in with the FIXED demo email + configured password', async () => {
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest({ email: DEMO_EMAIL }) as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  });

  it('always authenticates the demo identity, never the request email', async () => {
    // Even if the email gate passes via the canonical demo email, the password
    // grant must target DEMO_EMAIL — not whatever string the client sent.
    const { POST } = await import('@/app/api/demo-login/route');
    await POST(makeRequest({ email: '  DEMO@AKBAI.APP  ' }) as never);

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  });

  it('returns generic 403 when Supabase rejects the credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    const { POST } = await import('@/app/api/demo-login/route');
    const res = await POST(makeRequest({ email: DEMO_EMAIL }) as never);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('DEMO_FORBIDDEN');
    // No DB/internal detail leaked.
    expect(JSON.stringify(json)).not.toContain('Invalid login credentials');
  });
});
