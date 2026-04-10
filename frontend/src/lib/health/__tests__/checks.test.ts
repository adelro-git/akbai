/**
 * Health Check Tests — Verify dependency health check functions
 * Feature: Dependency Health Checks (Gap D4)
 *
 * Tests: checkSupabase, checkAnthropic, checkXendit, runAllChecks, deriveOverallStatus
 * Mocks: global fetch, env vars
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkSupabase,
  checkAnthropic,
  checkXendit,
  runAllChecks,
  deriveOverallStatus,
} from '../checks';
import type { ServiceHealth } from '../types';

// ============================================================
// Setup — Mock fetch and env vars for isolated testing
// ============================================================

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  process.env.XENDIT_SECRET_KEY = 'xnd-test-key';
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

// ============================================================
// checkSupabase Tests
// ============================================================

describe('checkSupabase', () => {
  it('returns healthy when Supabase responds with 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 200 })
    );

    const result = await checkSupabase();

    expect(result.service).toBe('supabase');
    expect(result.status).toBe('healthy');
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    expect(result.checked_at).toBeDefined();
  });

  it('returns down when Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const result = await checkSupabase();

    expect(result.service).toBe('supabase');
    expect(result.status).toBe('down');
    expect(result.message).toContain('Missing Supabase');
  });

  it('returns degraded when Supabase returns non-200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    const result = await checkSupabase();

    expect(result.service).toBe('supabase');
    expect(result.status).toBe('degraded');
    expect(result.message).toContain('500');
  });

  it('returns down when fetch throws (network error)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await checkSupabase();

    expect(result.service).toBe('supabase');
    expect(result.status).toBe('down');
    expect(result.message).toContain('ECONNREFUSED');
  });
});

// ============================================================
// checkAnthropic Tests
// ============================================================

describe('checkAnthropic', () => {
  it('returns healthy when Anthropic API responds with 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );

    const result = await checkAnthropic();

    expect(result.service).toBe('anthropic');
    expect(result.status).toBe('healthy');
  });

  it('returns down when API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await checkAnthropic();

    expect(result.service).toBe('anthropic');
    expect(result.status).toBe('down');
    expect(result.message).toContain('Missing or placeholder');
  });

  it('returns down when API key is placeholder', async () => {
    process.env.ANTHROPIC_API_KEY = 'your-anthropic-api-key-here';

    const result = await checkAnthropic();

    expect(result.status).toBe('down');
  });

  it('returns degraded when rate-limited (429)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 429 })
    );

    const result = await checkAnthropic();

    expect(result.status).toBe('degraded');
    expect(result.message).toContain('rate-limiting');
  });

  it('returns degraded when overloaded (529)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 529 })
    );

    const result = await checkAnthropic();

    expect(result.status).toBe('degraded');
    expect(result.message).toContain('overloaded');
  });
});

// ============================================================
// checkXendit Tests
// ============================================================

describe('checkXendit', () => {
  it('returns healthy when XENDIT_SECRET_KEY is configured', async () => {
    const result = await checkXendit();

    expect(result.service).toBe('xendit');
    expect(result.status).toBe('healthy');
  });

  it('returns degraded when XENDIT_SECRET_KEY is missing', async () => {
    delete process.env.XENDIT_SECRET_KEY;

    const result = await checkXendit();

    expect(result.service).toBe('xendit');
    expect(result.status).toBe('degraded');
    expect(result.message).toContain('not configured');
  });
});

// ============================================================
// deriveOverallStatus Tests
// ============================================================

describe('deriveOverallStatus', () => {
  const now = new Date().toISOString();

  it('returns healthy when all services are healthy', () => {
    const services: ServiceHealth[] = [
      { service: 'supabase', status: 'healthy', latency_ms: 50, checked_at: now },
      { service: 'anthropic', status: 'healthy', latency_ms: 100, checked_at: now },
      { service: 'xendit', status: 'healthy', latency_ms: 5, checked_at: now },
    ];

    expect(deriveOverallStatus(services)).toBe('healthy');
  });

  it('returns degraded when any service is degraded but none down', () => {
    const services: ServiceHealth[] = [
      { service: 'supabase', status: 'healthy', latency_ms: 50, checked_at: now },
      { service: 'anthropic', status: 'degraded', latency_ms: 100, checked_at: now },
      { service: 'xendit', status: 'healthy', latency_ms: 5, checked_at: now },
    ];

    expect(deriveOverallStatus(services)).toBe('degraded');
  });

  it('returns down when any service is down', () => {
    const services: ServiceHealth[] = [
      { service: 'supabase', status: 'down', latency_ms: 0, checked_at: now },
      { service: 'anthropic', status: 'healthy', latency_ms: 100, checked_at: now },
      { service: 'xendit', status: 'healthy', latency_ms: 5, checked_at: now },
    ];

    expect(deriveOverallStatus(services)).toBe('down');
  });
});

// ============================================================
// runAllChecks Tests
// ============================================================

describe('runAllChecks', () => {
  it('returns results for all three services', async () => {
    // Mock fetch for Supabase (first call) and Anthropic (second call)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 200 }))   // Supabase
      .mockResolvedValueOnce(new Response(null, { status: 200 }));  // Anthropic

    const results = await runAllChecks();

    expect(results).toHaveLength(3);
    const serviceNames = results.map((r) => r.service);
    expect(serviceNames).toContain('supabase');
    expect(serviceNames).toContain('anthropic');
    expect(serviceNames).toContain('xendit');
  });
});
