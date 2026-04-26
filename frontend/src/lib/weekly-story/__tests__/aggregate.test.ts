// ============================================================
// aggregate.test.ts — Phase 7 weekly-story aggregator.
// Mocks the timezone helper to a deterministic Manila Wednesday so the week
// bounds are 2026-04-20..2026-04-26.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-22',
}));

import { aggregateWeeklyStory } from '../aggregate';

interface MockTxn {
  type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
}

function makeSupabase(rows: MockTxn[], opts: { error?: unknown } = {}) {
  const supabase = {
    from: vi.fn((_table: string) => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        is: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        lte: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        // The aggregator awaits the builder directly (no `.single()` after the
        // range filters). We make it thenable so `await supabase.from(...)
        // .select(...).eq(...).is(...).gte(...).lte(...)` resolves to the data.
        then: (resolve: (value: { data: MockTxn[] | null; error: unknown }) => void) => {
          if (opts.error) {
            resolve({ data: null, error: opts.error });
          } else {
            resolve({ data: rows, error: null });
          }
        },
      };
      return builder;
    }),
  };
  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('aggregateWeeklyStory', () => {
  it('returns null when the user has no transactions for the week', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = makeSupabase([]) as any;
    const result = await aggregateWeeklyStory(sb, 'user-1', 'Maria');
    expect(result).toBeNull();
  });

  it('aggregates income and expenses, materializing the 7-day breakdown', async () => {
    const rows: MockTxn[] = [
      { type: 'income', amount: 50000, transaction_date: '2026-04-20' }, // Mon
      { type: 'income', amount: 30000, transaction_date: '2026-04-22' }, // Wed
      { type: 'expense', amount: 10000, transaction_date: '2026-04-22' },
      { type: 'expense', amount: 5000, transaction_date: '2026-04-25' }, // Sat
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = makeSupabase(rows) as any;
    const result = await aggregateWeeklyStory(sb, 'user-1', 'Maria');

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.week_start).toBe('2026-04-20');
    expect(result.week_end).toBe('2026-04-26');
    expect(result.kita_centavos).toBe(80000);
    expect(result.gastos_centavos).toBe(15000);
    expect(result.tubo_centavos).toBe(65000);
    expect(result.daily_breakdown).toHaveLength(7);
    // Mon (index 0) had ₱500, Wed (index 2) had ₱300, Sat (index 5) had ₱-50
    // → kita peak is Mon.
    expect(result.peak_day_index).toBe(0);
    expect(result.daily_breakdown[0].kita_centavos).toBe(50000);
    expect(result.daily_breakdown[2].kita_centavos).toBe(30000);
    expect(result.daily_breakdown[5].gastos_centavos).toBe(5000);
  });

  it('returns peak_day_index null when no day has any income', async () => {
    const rows: MockTxn[] = [
      { type: 'expense', amount: 10000, transaction_date: '2026-04-22' },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = makeSupabase(rows) as any;
    const result = await aggregateWeeklyStory(sb, 'user-1');
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.peak_day_index).toBeNull();
    expect(result.kita_centavos).toBe(0);
    expect(result.gastos_centavos).toBe(10000);
    expect(result.tubo_centavos).toBe(-10000);
  });

  it('throws when the underlying query errors so the route can map to error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = makeSupabase([], { error: new Error('db down') }) as any;
    await expect(aggregateWeeklyStory(sb, 'user-1')).rejects.toThrow('db down');
  });

  it('populates a non-empty takeaway sentence', async () => {
    const rows: MockTxn[] = [
      { type: 'income', amount: 100000, transaction_date: '2026-04-20' },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = makeSupabase(rows) as any;
    const result = await aggregateWeeklyStory(sb, 'user-1', 'Maria');
    expect(result).not.toBeNull();
    if (!result) return;
    expect(typeof result.takeaway).toBe('string');
    expect(result.takeaway.length).toBeGreaterThan(0);
  });
});
