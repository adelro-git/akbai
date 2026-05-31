/**
 * Dev-Auth Bypass — Unit Tests
 * Feature: Dev auth bypass production guard (A2 + G6)
 * Tests: SKIP_AUTH is hard-pinned to false in production even when
 *        NEXT_PUBLIC_SKIP_AUTH leaks as 'true'; dev/local behavior unchanged.
 *
 * Note: SKIP_AUTH is evaluated at module load, so each case resets the module
 *       registry (vi.resetModules) and re-imports after stubbing the env.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Helper — stub env then freshly import the module
// ============================================================

async function loadSkipAuth(env: {
  nodeEnv?: string;
  vercelEnv?: string;
  skipAuth?: string;
}): Promise<boolean> {
  vi.resetModules();
  vi.unstubAllEnvs();
  // NODE_ENV defaults to 'test' under vitest; set explicitly per case.
  // Use vi.stubEnv because NODE_ENV is typed readonly in @types/node.
  vi.stubEnv('NODE_ENV', env.nodeEnv ?? 'test');
  vi.stubEnv('VERCEL_ENV', env.vercelEnv ?? '');
  vi.stubEnv('NEXT_PUBLIC_SKIP_AUTH', env.skipAuth ?? '');

  const mod = await import('../dev-auth');
  return mod.SKIP_AUTH;
}

describe('SKIP_AUTH production guard (A2 + G6)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is true in development when NEXT_PUBLIC_SKIP_AUTH=true (unchanged dev behavior)', async () => {
    const skip = await loadSkipAuth({ nodeEnv: 'development', skipAuth: 'true' });
    expect(skip).toBe(true);
  });

  it('is false in development when NEXT_PUBLIC_SKIP_AUTH is not set', async () => {
    const skip = await loadSkipAuth({ nodeEnv: 'development', skipAuth: '' });
    expect(skip).toBe(false);
  });

  it('is HARD FALSE in production even when NEXT_PUBLIC_SKIP_AUTH=true (leaked flag)', async () => {
    const skip = await loadSkipAuth({ nodeEnv: 'production', skipAuth: 'true' });
    expect(skip).toBe(false);
  });

  it('is HARD FALSE when VERCEL_ENV=production even if NODE_ENV is not production', async () => {
    const skip = await loadSkipAuth({
      nodeEnv: 'development',
      vercelEnv: 'production',
      skipAuth: 'true',
    });
    expect(skip).toBe(false);
  });

  it('is true on a Vercel preview deploy when the flag is set (non-prod VERCEL_ENV)', async () => {
    const skip = await loadSkipAuth({
      nodeEnv: 'development',
      vercelEnv: 'preview',
      skipAuth: 'true',
    });
    expect(skip).toBe(true);
  });

  it('is false in production when the flag is unset', async () => {
    const skip = await loadSkipAuth({ nodeEnv: 'production', skipAuth: '' });
    expect(skip).toBe(false);
  });

  it('treats any non-"true" value as false (only exact "true" opts in)', async () => {
    const skip = await loadSkipAuth({ nodeEnv: 'development', skipAuth: '1' });
    expect(skip).toBe(false);
  });
});
