import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Sentry mock — must be declared before importing the module under
// test. vi.mock factories are hoisted, so the static import below
// receives the mocked module. We capture withScope's scope-builder
// callback so tests can assert level/tags/fingerprint set on a trip
// or warning.
// ============================================================

const mockCaptureMessage = vi.fn();
const mockSetLevel = vi.fn();
const mockSetTags = vi.fn();
const mockSetFingerprint = vi.fn();
const mockSetExtras = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  withScope: (fn: (scope: unknown) => void) => {
    fn({
      setLevel: (...args: unknown[]) => mockSetLevel(...args),
      setTags: (...args: unknown[]) => mockSetTags(...args),
      setFingerprint: (...args: unknown[]) => mockSetFingerprint(...args),
      setExtras: (...args: unknown[]) => mockSetExtras(...args),
    });
  },
}));

import { checkCircuitBreaker } from '../circuit-breaker';

// Mock Supabase client factory
function createMockSupabase(opts: {
  globalSpend?: number;
  userSpend?: number;
  userQueryCount?: number;
}) {
  const globalRows = opts.globalSpend !== undefined
    ? [{ total_cost_usd: opts.globalSpend }]
    : [];
  const userRow = opts.userSpend !== undefined
    ? { total_cost_usd: opts.userSpend, query_count: opts.userQueryCount ?? 0 }
    : null;

  return {
    from: (table: string) => ({
      select: (columns: string) => {
        // Return different chain based on whether it's global or user query
        return {
          eq: (col: string, val: unknown) => {
            if (col === 'date') {
              // Global spend query — returns array
              return Promise.resolve({ data: globalRows, error: null });
            }
            if (col === 'user_id') {
              // User spend query — needs .eq('date', ...).single()
              return {
                eq: (_col: string, _val: unknown) => ({
                  single: () => Promise.resolve({ data: userRow, error: null }),
                }),
              };
            }
            return { data: null, error: null };
          },
        };
      },
    }),
  } as unknown as Parameters<typeof checkCircuitBreaker>[0];
}

beforeEach(() => {
  // Reset env vars to defaults
  delete process.env.CIRCUIT_BREAKER_DAILY_CAP_USD;
  delete process.env.CIRCUIT_BREAKER_USER_CAP_USD;
  delete process.env.CIRCUIT_BREAKER_WARNING_PCT;
  // Reset Sentry spies between tests
  vi.clearAllMocks();
});

describe('checkCircuitBreaker', () => {
  it('allows call when under both caps', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);
    expect(result.allowed).toBe(true);
  });

  it('blocks when user cap exceeded', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.49, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.05);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
  });

  it('blocks when global cap exceeded', async () => {
    const supabase = createMockSupabase({ globalSpend: 4.98, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.05);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('global_cap');
  });

  it('returns warningThresholdReached when at 80%', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.40, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);
    expect(result.allowed).toBe(true);
    expect(result.warningThresholdReached).toBe(true);
  });

  it('blocks free tier at 10 queries per day', async () => {
    const supabase = createMockSupabase({ globalSpend: 0.5, userSpend: 0.05, userQueryCount: 10 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01, 'free');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
  });

  // --- Gap E3: Onboarding rate-limit exemption ---

  it('exempts free tier query limit during onboarding (onboardingCompleted=false)', async () => {
    const supabase = createMockSupabase({ globalSpend: 0.5, userSpend: 0.05, userQueryCount: 10 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01, 'free', false);
    expect(result.allowed).toBe(true);
  });

  it('enforces free tier query limit after onboarding (onboardingCompleted=true)', async () => {
    const supabase = createMockSupabase({ globalSpend: 0.5, userSpend: 0.05, userQueryCount: 10 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01, 'free', true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
  });

  it('enforces free tier query limit when onboardingCompleted is undefined (safe default)', async () => {
    const supabase = createMockSupabase({ globalSpend: 0.5, userSpend: 0.05, userQueryCount: 10 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01, 'free', undefined);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
  });
});

// ============================================================
// Sprint 18 (resilience §11) — Sentry alerting on trip / warning
// The breaker's allow/deny logic is unchanged; these tests only assert
// that the right Sentry event (level + tags + fingerprint) fires.
// ============================================================

describe('checkCircuitBreaker — Sentry alerting', () => {
  it('fires an error-level Sentry alert on global cap TRIP', async () => {
    const supabase = createMockSupabase({ globalSpend: 4.98, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.05);

    expect(result.allowed).toBe(false);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSetLevel).toHaveBeenCalledWith('error');
    expect(mockSetTags).toHaveBeenCalledWith({ alert: 'circuit_breaker_trip', cap: 'global' });
    expect(mockSetFingerprint).toHaveBeenCalledWith(['circuit-breaker-trip', 'global']);
  });

  it('fires an error-level Sentry alert on user cost cap TRIP', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.49, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.05);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSetLevel).toHaveBeenCalledWith('error');
    expect(mockSetTags).toHaveBeenCalledWith({ alert: 'circuit_breaker_trip', cap: 'user' });
    expect(mockSetFingerprint).toHaveBeenCalledWith(['circuit-breaker-trip', 'user']);
  });

  it('fires an error-level Sentry alert on free-tier query-limit TRIP (cap=user)', async () => {
    const supabase = createMockSupabase({ globalSpend: 0.5, userSpend: 0.05, userQueryCount: 10 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01, 'free', true);

    expect(result.allowed).toBe(false);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSetLevel).toHaveBeenCalledWith('error');
    expect(mockSetTags).toHaveBeenCalledWith({ alert: 'circuit_breaker_trip', cap: 'user' });
  });

  it('includes spend/limit/userId context in the trip alert extras', async () => {
    const supabase = createMockSupabase({ globalSpend: 4.98, userSpend: 0.1, userQueryCount: 2 });
    await checkCircuitBreaker(supabase, 'user-abc', 0.05);

    expect(mockSetExtras).toHaveBeenCalledTimes(1);
    const extras = mockSetExtras.mock.calls[0]?.[0] as {
      cap: string;
      current_spend_usd: number;
      limit_usd: number;
      user_id: string;
    };
    expect(extras.cap).toBe('global');
    expect(extras.limit_usd).toBe(5.0);
    expect(extras.user_id).toBe('user-abc');
    expect(extras.current_spend_usd).toBeCloseTo(5.03, 4);
  });

  it('fires a warning-level Sentry alert at the warning threshold (no trip)', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.4, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);

    expect(result.allowed).toBe(true);
    expect(result.warningThresholdReached).toBe(true);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockSetLevel).toHaveBeenCalledWith('warning');
    expect(mockSetTags).toHaveBeenCalledWith({
      alert: 'circuit_breaker_warning',
      cap: 'user',
    });
    expect(mockSetFingerprint).toHaveBeenCalledWith(['circuit-breaker-warning', 'user']);
  });

  it('does NOT fire any Sentry alert when well under all caps', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);

    expect(result.allowed).toBe(true);
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });
});
