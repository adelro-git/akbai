/**
 * Health Check Functions — Lightweight pings for each external dependency
 * Feature: Dependency Health Checks (Gap D4)
 * Role: Verify each dependency is reachable without wasting API tokens
 *
 * Design decisions:
 * - Supabase: Uses service client to run a simple auth admin call (no RLS needed)
 * - Anthropic: Verifies API key is set and endpoint is reachable via HEAD/GET (no token spend)
 * - Xendit: Config readiness only (integration not built yet)
 *
 * Each check returns a ServiceHealth object with status + latency.
 * Timeout: 5 seconds per check to avoid blocking the health endpoint.
 */

import type { ServiceHealth } from './types';

// ============================================================
// Timeout Helper — Wraps a promise with a timeout to prevent
// health checks from hanging indefinitely on network issues.
// ============================================================

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Health check timed out')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

const CHECK_TIMEOUT_MS = 5000;

// ============================================================
// checkSupabase — Verify Supabase is reachable via REST API
// Uses a lightweight fetch to the Supabase REST endpoint.
// Does NOT use the cookie-based server client (avoids next/headers).
// ============================================================

export async function checkSupabase(): Promise<ServiceHealth> {
  const now = new Date().toISOString();
  const start = performance.now();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return {
        service: 'supabase',
        status: 'down',
        latency_ms: 0,
        message: 'Missing Supabase environment variables',
        checked_at: now,
      };
    }

    // --- Lightweight ping: HEAD request to the REST API endpoint ---
    const response = await withTimeout(
      fetch(`${url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      }),
      CHECK_TIMEOUT_MS
    );

    const latency = Math.round(performance.now() - start);

    if (response.ok || response.status === 200) {
      return {
        service: 'supabase',
        status: 'healthy',
        latency_ms: latency,
        checked_at: now,
      };
    }

    return {
      service: 'supabase',
      status: 'degraded',
      latency_ms: latency,
      message: `Supabase returned status ${response.status}`,
      checked_at: now,
    };
  } catch (error: unknown) {
    const latency = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      service: 'supabase',
      status: 'down',
      latency_ms: latency,
      message,
      checked_at: now,
    };
  }
}

// ============================================================
// checkAnthropic — Verify Anthropic API is reachable
// Only checks that the API key is set and the endpoint responds.
// Does NOT create a completion (no token spend).
// ============================================================

export async function checkAnthropic(): Promise<ServiceHealth> {
  const now = new Date().toISOString();
  const start = performance.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return {
        service: 'anthropic',
        status: 'down',
        latency_ms: 0,
        message: 'Missing or placeholder ANTHROPIC_API_KEY',
        checked_at: now,
      };
    }

    // --- Lightweight ping: GET /v1/models to verify API key + connectivity ---
    // This endpoint returns the list of available models without spending tokens.
    const response = await withTimeout(
      fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      }),
      CHECK_TIMEOUT_MS
    );

    const latency = Math.round(performance.now() - start);

    if (response.ok) {
      return {
        service: 'anthropic',
        status: 'healthy',
        latency_ms: latency,
        checked_at: now,
      };
    }

    // 401 = bad key, 429 = rate limited (still reachable), 529 = overloaded
    if (response.status === 429) {
      return {
        service: 'anthropic',
        status: 'degraded',
        latency_ms: latency,
        message: 'Anthropic API is rate-limiting requests',
        checked_at: now,
      };
    }

    if (response.status === 529) {
      return {
        service: 'anthropic',
        status: 'degraded',
        latency_ms: latency,
        message: 'Anthropic API is overloaded',
        checked_at: now,
      };
    }

    return {
      service: 'anthropic',
      status: 'down',
      latency_ms: latency,
      message: `Anthropic API returned status ${response.status}`,
      checked_at: now,
    };
  } catch (error: unknown) {
    const latency = Math.round(performance.now() - start);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      service: 'anthropic',
      status: 'down',
      latency_ms: latency,
      message,
      checked_at: now,
    };
  }
}

// ============================================================
// checkXendit — Verify Xendit payment integration readiness
// Xendit integration is not built yet, so this only checks
// that the environment variable is configured. Once the
// integration exists, this will ping the Xendit API.
// ============================================================

export async function checkXendit(): Promise<ServiceHealth> {
  const now = new Date().toISOString();
  const start = performance.now();

  const xenditKey = process.env.XENDIT_SECRET_KEY;
  const latency = Math.round(performance.now() - start);

  if (!xenditKey) {
    return {
      service: 'xendit',
      status: 'degraded',
      latency_ms: latency,
      message: 'XENDIT_SECRET_KEY not configured (integration not yet built)',
      checked_at: now,
    };
  }

  // Config is present — report healthy (no API ping until integration is built)
  return {
    service: 'xendit',
    status: 'healthy',
    latency_ms: latency,
    checked_at: now,
  };
}

// ============================================================
// runAllChecks — Execute all dependency checks in parallel
// Returns an array of ServiceHealth results.
// ============================================================

export async function runAllChecks(): Promise<ServiceHealth[]> {
  const results = await Promise.allSettled([
    checkSupabase(),
    checkAnthropic(),
    checkXendit(),
  ]);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    // Promise.allSettled should never reject since each check has its own try/catch,
    // but handle it defensively.
    const serviceNames = ['supabase', 'anthropic', 'xendit'] as const;
    return {
      service: serviceNames[index],
      status: 'down' as const,
      latency_ms: 0,
      message: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      checked_at: new Date().toISOString(),
    };
  });
}

// ============================================================
// deriveOverallStatus — Compute aggregate status from individual checks.
// Logic: all healthy = healthy, any down = down, otherwise degraded.
// ============================================================

export function deriveOverallStatus(
  services: ServiceHealth[]
): 'healthy' | 'degraded' | 'down' {
  const hasDown = services.some((s) => s.status === 'down');
  const hasDegraded = services.some((s) => s.status === 'degraded');

  if (hasDown) return 'down';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}
