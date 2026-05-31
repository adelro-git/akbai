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
  /** Simulate a DB read error on the global daily_api_spend query (C6). */
  globalError?: { message: string };
  /** Simulate a DB read error on the per-user daily_api_spend query (C6). */
  userError?: { message: string };
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
              return Promise.resolve({
                data: opts.globalError ? null : globalRows,
                error: opts.globalError ?? null,
              });
            }
            if (col === 'user_id') {
              // User spend query — needs .eq('date', ...).maybeSingle().
              // .maybeSingle() resolves null (not an error) when no row exists.
              return {
                eq: (_col: string, _val: unknown) => ({
                  maybeSingle: () => Promise.resolve({
                    data: opts.userError ? null : userRow,
                    error: opts.userError ?? null,
                  }),
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

  // --- C6: fail CLOSED on a real DB read error (was fail-open: discarded ---
  //     error → treated as 0 spend → request allowed). The breaker must
  //     THROW so the caller's existing fail-closed try/catch blocks. A
  //     missing user row (maybeSingle → null, no error) is NOT an error and
  //     still means 0 spend. ---

  it('fails closed (throws) when the GLOBAL spend read errors', async () => {
    const supabase = createMockSupabase({
      userSpend: 0.05,
      userQueryCount: 2,
      globalError: { message: 'connection terminated' },
    });
    await expect(checkCircuitBreaker(supabase, 'user-1', 0.01)).rejects.toThrow(
      /failing closed/i
    );
  });

  it('fails closed (throws) when the per-USER spend read errors', async () => {
    const supabase = createMockSupabase({
      globalSpend: 0.5,
      userError: { message: 'statement timeout' },
    });
    await expect(checkCircuitBreaker(supabase, 'user-1', 0.01)).rejects.toThrow(
      /failing closed/i
    );
  });

  it('treats a missing user row (maybeSingle null) as 0 spend and allows', async () => {
    // globalSpend present, but NO userSpend → userRow is null, no error.
    const supabase = createMockSupabase({ globalSpend: 0.5 });
    const result = await checkCircuitBreaker(supabase, 'user-new', 0.01);
    expect(result.allowed).toBe(true);
  });
});

// ============================================================
// C1 — defensive env cap parsing. An env var SET to '' must fall back to
// the default, not yield 0/NaN (which would silently disable the cap or
// make the warning ratio NaN). Each test sets the env to '' and asserts
// the DEFAULT-cap behaviour still holds.
// ============================================================

describe('checkCircuitBreaker — env cap parsing (C1)', () => {
  it('falls back to the default global cap when CIRCUIT_BREAKER_DAILY_CAP_USD is empty', async () => {
    process.env.CIRCUIT_BREAKER_DAILY_CAP_USD = '';
    // Spend 4.98 + est 0.05 = 5.03 > default 5.0 → should TRIP global cap.
    // If '' had parsed to 0, EVERYTHING would trip with reason global_cap at
    // 0; this asserts the default 5.0 is in force (allowed below, tripped above).
    const tripping = createMockSupabase({ globalSpend: 4.98, userSpend: 0.1, userQueryCount: 2 });
    const tripResult = await checkCircuitBreaker(tripping, 'user-1', 0.05);
    expect(tripResult.allowed).toBe(false);
    expect(tripResult.reason).toBe('global_cap');

    const allowing = createMockSupabase({ globalSpend: 1.0, userSpend: 0.1, userQueryCount: 2 });
    const allowResult = await checkCircuitBreaker(allowing, 'user-1', 0.01);
    expect(allowResult.allowed).toBe(true);
  });

  it('falls back to the default user cap when CIRCUIT_BREAKER_USER_CAP_USD is empty', async () => {
    process.env.CIRCUIT_BREAKER_USER_CAP_USD = '';
    // user 0.49 + 0.05 = 0.54 > default 0.5 → TRIP user cap (not 0).
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.49, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.05);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_cap');
  });

  it('falls back to the default warning pct when CIRCUIT_BREAKER_WARNING_PCT is empty (no NaN)', async () => {
    process.env.CIRCUIT_BREAKER_WARNING_PCT = '';
    // user 0.40 / 0.5 = 0.80 == default 0.8 → warning reached.
    // If '' had parsed to NaN, the comparison would be false (NaN >= NaN).
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.40, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);
    expect(result.allowed).toBe(true);
    expect(result.warningThresholdReached).toBe(true);
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

  // --- F4 regression: a USER-only warning must be tagged cap='user', not
  //     'global'. Here global is at 40% (1.0/2.5, well under the 80% line) but
  //     user is exactly at the 80% line — the user ratio is what crossed, so the
  //     cap label + fingerprint must reflect 'user'. Under the old (buggy) logic
  //     the cap was inferred from the global ratio only, which still happened to
  //     yield 'user' here — but the threshold-crossed derivation is what makes
  //     this correct rather than coincidental. ---
  it('tags a user-only warning as cap=user (global meaningfully under threshold)', async () => {
    process.env.CIRCUIT_BREAKER_DAILY_CAP_USD = '2.5';
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.4, userQueryCount: 5 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);

    expect(result.allowed).toBe(true);
    expect(result.warningThresholdReached).toBe(true);
    expect(mockSetLevel).toHaveBeenCalledWith('warning');
    expect(mockSetTags).toHaveBeenCalledWith({
      alert: 'circuit_breaker_warning',
      cap: 'user',
    });
    expect(mockSetFingerprint).toHaveBeenCalledWith(['circuit-breaker-warning', 'user']);
  });

  // --- F4: a GLOBAL warning (global ratio crossed) must be tagged cap='global'.
  //     Global at 80% (4.0/5.0), user comfortably under (0.1/0.5 = 20%). ---
  it('tags a global warning as cap=global (user under threshold)', async () => {
    const supabase = createMockSupabase({ globalSpend: 4.0, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.0);

    expect(result.allowed).toBe(true);
    expect(result.warningThresholdReached).toBe(true);
    expect(mockSetLevel).toHaveBeenCalledWith('warning');
    expect(mockSetTags).toHaveBeenCalledWith({
      alert: 'circuit_breaker_warning',
      cap: 'global',
    });
    expect(mockSetFingerprint).toHaveBeenCalledWith(['circuit-breaker-warning', 'global']);
  });

  it('does NOT fire any Sentry alert when well under all caps', async () => {
    const supabase = createMockSupabase({ globalSpend: 1.0, userSpend: 0.1, userQueryCount: 2 });
    const result = await checkCircuitBreaker(supabase, 'user-1', 0.01);

    expect(result.allowed).toBe(true);
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });
});
