import { describe, it, expect, vi, beforeEach } from 'vitest';
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
