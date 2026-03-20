import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, _resetStore } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetStore();
  });

  it('allows requests under the limit', () => {
    const result = checkRateLimit('192.168.1.1', { windowMs: 60_000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests at the limit', () => {
    const config = { windowMs: 60_000, maxRequests: 3 };
    checkRateLimit('10.0.0.1', config);
    checkRateLimit('10.0.0.1', config);
    checkRateLimit('10.0.0.1', config);

    const result = checkRateLimit('10.0.0.1', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets counter after window expires', async () => {
    const config = { windowMs: 50, maxRequests: 1 };
    checkRateLimit('10.0.0.2', config);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    const result = checkRateLimit('10.0.0.2', config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('tracks different keys independently', () => {
    const config = { windowMs: 60_000, maxRequests: 1 };
    checkRateLimit('ip-a', config);
    const result = checkRateLimit('ip-b', config);
    expect(result.allowed).toBe(true);
  });

  it('returns decreasing remaining count', () => {
    const config = { windowMs: 60_000, maxRequests: 5 };
    expect(checkRateLimit('ip-c', config).remaining).toBe(4);
    expect(checkRateLimit('ip-c', config).remaining).toBe(3);
    expect(checkRateLimit('ip-c', config).remaining).toBe(2);
    expect(checkRateLimit('ip-c', config).remaining).toBe(1);
    expect(checkRateLimit('ip-c', config).remaining).toBe(0);
    expect(checkRateLimit('ip-c', config).allowed).toBe(false);
  });
});
