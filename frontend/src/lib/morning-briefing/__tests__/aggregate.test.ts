/**
 * Unit Tests — Morning Briefing Data Aggregation
 * Feature: Ang Umaga Mo (Build 5)
 *
 * Tests the aggregateBriefingData() function which assembles financial context
 * from Supabase for the morning briefing prompt. Business-critical because
 * wrong amounts or missing deadlines mislead the user about their finances.
 *
 * All monetary values in centavos (integers).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Hoisted Mocks — timezone helpers return deterministic Manila dates
// ============================================================

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-03-28', // Saturday
  toManila: () => new Date(Date.UTC(2026, 2, 28, 8, 0, 0)), // 8 AM Manila
  formatManilaDate: (_date?: Date, fmt?: string) => {
    if (fmt === 'EEEE') return 'Saturday';
    return '2026-03-28';
  },
}));

import { aggregateBriefingData } from '../aggregate';

// ============================================================
// Mock Supabase Client Factory
// ============================================================

interface MockQueryResult {
  data: unknown;
  error: null;
  count?: number;
}

function createMockSupabase(overrides: {
  yesterdayTxns?: Array<{ type: string; amount: number; category: string }>;
  allTimeTxns?: Array<{ type: string; amount: number }>;
  olderTxns?: Array<{ type: string; amount: number }>;
  thisWeekTxns?: Array<{ type: string; amount: number }>;
  lastWeekTxns?: Array<{ type: string; amount: number }>;
  deadlines?: Array<{ form_name: string; description: string | null; due_date: string; status: string }>;
  userData?: { created_at: string } | null;
} = {}) {
  const {
    yesterdayTxns = [],
    allTimeTxns = [],
    olderTxns = [],
    thisWeekTxns = [],
    lastWeekTxns = [],
    deadlines = [],
    userData = { created_at: '2026-01-01T00:00:00Z' },
  } = overrides;

  // Track call sequence to distinguish different transaction queries
  let transactionCallIndex = 0;

  return {
    from: vi.fn((table: string) => {
      if (table === 'transactions') {
        const callIdx = transactionCallIndex++;
        return buildTransactionChain(callIdx, {
          yesterdayTxns,
          allTimeTxns,
          olderTxns,
          thisWeekTxns,
          lastWeekTxns,
        });
      }
      if (table === 'bir_deadlines') {
        return buildDeadlineChain(deadlines);
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: userData, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    }),
  } as any;
}

/**
 * Builds a chain-mock for transaction queries.
 * The aggregate function makes 4 transaction queries in sequence:
 *   0: yesterday's transactions (select type,amount,category → eq user_id → eq transaction_date → is deleted_at)
 *   1: all-time transactions (select type,amount → eq user_id → is deleted_at)
 *   2: older transactions for trend (select type,amount → eq user_id → is deleted_at → lte transaction_date)
 *   3: this week (select type,amount → eq user_id → is deleted_at → gte → lte)
 *   4: last week (select type,amount → eq user_id → is deleted_at → gte → lte)
 */
function buildTransactionChain(
  callIdx: number,
  data: {
    yesterdayTxns: unknown[];
    allTimeTxns: unknown[];
    olderTxns: unknown[];
    thisWeekTxns: unknown[];
    lastWeekTxns: unknown[];
  }
) {
  const resolveWith = (result: unknown[]) => ({
    data: result,
    error: null,
  });

  // For yesterday query (callIdx 0): select → eq(user_id) → eq(transaction_date) → is(deleted_at)
  if (callIdx === 0) {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            is: () => Promise.resolve(resolveWith(data.yesterdayTxns)),
          }),
        }),
      }),
    };
  }

  // For all-time query (callIdx 1): select → eq(user_id) → is(deleted_at)
  if (callIdx === 1) {
    return {
      select: () => ({
        eq: () => ({
          is: () => Promise.resolve(resolveWith(data.allTimeTxns)),
        }),
      }),
    };
  }

  // For older transactions (callIdx 2): select → eq(user_id) → is(deleted_at) → lte(transaction_date)
  if (callIdx === 2) {
    return {
      select: () => ({
        eq: () => ({
          is: () => ({
            lte: () => Promise.resolve(resolveWith(data.olderTxns)),
          }),
        }),
      }),
    };
  }

  // For this/last week (callIdx 3, 4): select → eq(user_id) → is(deleted_at) → gte → lte
  const weekData = callIdx === 3 ? data.thisWeekTxns : data.lastWeekTxns;
  return {
    select: () => ({
      eq: () => ({
        is: () => ({
          gte: () => ({
            lte: () => Promise.resolve(resolveWith(weekData)),
          }),
        }),
      }),
    }),
  };
}

function buildDeadlineChain(deadlines: unknown[]) {
  return {
    select: () => ({
      eq: () => ({
        is: () => ({
          neq: () => ({
            gte: () => ({
              lte: () => ({
                order: () => Promise.resolve({ data: deadlines, error: null }),
              }),
            }),
          }),
        }),
      }),
    }),
  };
}

// ============================================================
// Tests
// ============================================================

const TEST_USER_ID = 'user-maria-001';

describe('aggregateBriefingData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Correct structure with mock Supabase responses ---

  it('returns correct structure with yesterday income and expenses', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [
        { type: 'income', amount: 500000, category: 'sales' },      // P5,000
        { type: 'expense', amount: 150000, category: 'ingredients' }, // P1,500
        { type: 'expense', amount: 75000, category: 'packaging' },    // P750
      ],
      allTimeTxns: [
        { type: 'income', amount: 500000 },
        { type: 'expense', amount: 150000 },
        { type: 'expense', amount: 75000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.briefing_date).toBe('2026-03-28');
    expect(result.day_of_week).toBe('Saturday');
    expect(result.yesterday.total_income_centavos).toBe(500000);
    expect(result.yesterday.total_expenses_centavos).toBe(225000);
    expect(result.yesterday.income_count).toBe(1);
    expect(result.yesterday.expense_count).toBe(2);
    expect(result.yesterday.has_transactions).toBe(true);
    expect(result.has_any_transactions).toBe(true);
  });

  // --- Empty transactions (new user) ---

  it('handles empty transactions — new user with zero history', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [],
      allTimeTxns: [],
      olderTxns: [],
      thisWeekTxns: [],
      lastWeekTxns: [],
      userData: { created_at: '2026-03-27T00:00:00Z' },
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.yesterday.total_income_centavos).toBe(0);
    expect(result.yesterday.total_expenses_centavos).toBe(0);
    expect(result.yesterday.income_count).toBe(0);
    expect(result.yesterday.expense_count).toBe(0);
    expect(result.yesterday.has_transactions).toBe(false);
    expect(result.yesterday.top_expense_categories).toEqual([]);
    expect(result.cash_position.balance_centavos).toBe(0);
    expect(result.cash_position.trend_vs_last_week).toBe('flat');
    expect(result.has_any_transactions).toBe(false);
  });

  // --- Missing BIR deadlines ---

  it('handles missing BIR deadlines — returns empty array', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [{ type: 'income', amount: 100000 }],
      deadlines: [],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.upcoming_deadlines).toEqual([]);
  });

  it('returns upcoming BIR deadlines with correct days_until calculation', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [{ type: 'income', amount: 100000 }],
      deadlines: [
        { form_name: '2550M', description: 'Monthly VAT', due_date: '2026-04-02', status: 'upcoming' },
        { form_name: '1701Q', description: 'Quarterly ITR', due_date: '2026-04-10', status: 'upcoming' },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.upcoming_deadlines).toHaveLength(2);
    expect(result.upcoming_deadlines[0].form_type).toBe('2550M');
    expect(result.upcoming_deadlines[0].form_description).toBe('Monthly VAT');
    expect(result.upcoming_deadlines[0].days_until).toBe(5); // Apr 2 - Mar 28
    expect(result.upcoming_deadlines[1].form_type).toBe('1701Q');
    expect(result.upcoming_deadlines[1].days_until).toBe(13); // Apr 10 - Mar 28
  });

  // --- Centavo amounts ---

  it('handles centavo amounts correctly — integers only, no rounding', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [
        { type: 'income', amount: 34550, category: 'sales' },     // P345.50
        { type: 'expense', amount: 12075, category: 'transport' }, // P120.75
      ],
      allTimeTxns: [
        { type: 'income', amount: 34550 },
        { type: 'expense', amount: 12075 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.yesterday.total_income_centavos).toBe(34550);
    expect(result.yesterday.total_expenses_centavos).toBe(12075);
    expect(result.cash_position.balance_centavos).toBe(34550 - 12075); // 22475
    // Verify these are integers, not floats
    expect(Number.isInteger(result.yesterday.total_income_centavos)).toBe(true);
    expect(Number.isInteger(result.yesterday.total_expenses_centavos)).toBe(true);
    expect(Number.isInteger(result.cash_position.balance_centavos)).toBe(true);
  });

  // --- Trend computation ---

  it('computes trend as "up" when current balance exceeds week-ago balance', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [
        { type: 'income', amount: 1000000 },
        { type: 'expense', amount: 200000 },
      ],
      olderTxns: [
        { type: 'income', amount: 500000 },
        { type: 'expense', amount: 200000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    // Current balance: 1000000 - 200000 = 800000
    // Week-ago balance: 500000 - 200000 = 300000
    // Change: +500000 → 'up'
    expect(result.cash_position.trend_vs_last_week).toBe('up');
    expect(result.cash_position.change_centavos).toBe(500000);
  });

  it('computes trend as "down" when current balance is less than week-ago', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [
        { type: 'income', amount: 300000 },
        { type: 'expense', amount: 500000 },
      ],
      olderTxns: [
        { type: 'income', amount: 300000 },
        { type: 'expense', amount: 100000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    // Current: 300000 - 500000 = -200000
    // Week-ago: 300000 - 100000 = 200000
    // Change: -400000 → 'down'
    expect(result.cash_position.trend_vs_last_week).toBe('down');
    expect(result.cash_position.change_centavos).toBe(-400000);
  });

  it('computes trend as "flat" when balances are equal', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [
        { type: 'income', amount: 500000 },
        { type: 'expense', amount: 200000 },
      ],
      olderTxns: [
        { type: 'income', amount: 500000 },
        { type: 'expense', amount: 200000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.cash_position.trend_vs_last_week).toBe('flat');
    expect(result.cash_position.change_centavos).toBe(0);
  });

  // --- Top expense categories ---

  it('sorts top expense categories by amount desc and limits to 3', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [
        { type: 'expense', amount: 50000, category: 'ingredients' },
        { type: 'expense', amount: 30000, category: 'packaging' },
        { type: 'expense', amount: 80000, category: 'transport' },
        { type: 'expense', amount: 20000, category: 'utilities' },
        { type: 'expense', amount: 10000, category: 'supplies' },
      ],
      allTimeTxns: [
        { type: 'expense', amount: 190000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.yesterday.top_expense_categories).toHaveLength(3);
    // Sorted by amount descending
    expect(result.yesterday.top_expense_categories[0].category).toBe('transport');
    expect(result.yesterday.top_expense_categories[0].amount_centavos).toBe(80000);
    expect(result.yesterday.top_expense_categories[1].category).toBe('ingredients');
    expect(result.yesterday.top_expense_categories[1].amount_centavos).toBe(50000);
    expect(result.yesterday.top_expense_categories[2].category).toBe('packaging');
    expect(result.yesterday.top_expense_categories[2].amount_centavos).toBe(30000);
    // 4th and 5th categories should NOT appear
  });

  it('aggregates multiple expenses in the same category', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [
        { type: 'expense', amount: 25000, category: 'ingredients' },
        { type: 'expense', amount: 35000, category: 'ingredients' },
        { type: 'expense', amount: 15000, category: 'transport' },
      ],
      allTimeTxns: [
        { type: 'expense', amount: 75000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.yesterday.top_expense_categories[0].category).toBe('ingredients');
    expect(result.yesterday.top_expense_categories[0].amount_centavos).toBe(60000); // 25000 + 35000
    expect(result.yesterday.top_expense_categories[1].category).toBe('transport');
    expect(result.yesterday.top_expense_categories[1].amount_centavos).toBe(15000);
  });

  // --- Week comparison ---

  it('computes week-over-week comparison correctly', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [{ type: 'income', amount: 100000 }],
      thisWeekTxns: [
        { type: 'income', amount: 200000 },
        { type: 'expense', amount: 50000 },
      ],
      lastWeekTxns: [
        { type: 'income', amount: 150000 },
        { type: 'expense', amount: 80000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.week_comparison.this_week_income_centavos).toBe(200000);
    expect(result.week_comparison.this_week_expense_centavos).toBe(50000);
    expect(result.week_comparison.last_week_income_centavos).toBe(150000);
    expect(result.week_comparison.last_week_expense_centavos).toBe(80000);
  });

  // --- Days since signup ---

  it('calculates days_since_signup from user created_at', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [],
      userData: { created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago (dynamic)
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    // Should be approximately 3 days (exact depends on test execution time)
    expect(result.days_since_signup).toBeGreaterThanOrEqual(2);
    expect(result.days_since_signup).toBeLessThanOrEqual(4);
  });

  it('handles null user data gracefully — days_since_signup defaults to 0', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [],
      userData: null,
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.days_since_signup).toBe(0);
  });

  // --- Income-only day (no expenses) ---

  it('handles income-only day — expenses are zero, no top categories', async () => {
    const supabase = createMockSupabase({
      yesterdayTxns: [
        { type: 'income', amount: 250000, category: 'sales' },
        { type: 'income', amount: 100000, category: 'sales' },
      ],
      allTimeTxns: [
        { type: 'income', amount: 350000 },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.yesterday.total_income_centavos).toBe(350000);
    expect(result.yesterday.total_expenses_centavos).toBe(0);
    expect(result.yesterday.income_count).toBe(2);
    expect(result.yesterday.expense_count).toBe(0);
    expect(result.yesterday.top_expense_categories).toEqual([]);
  });

  // --- BIR deadline description null handling ---

  it('handles null deadline description — defaults to empty string', async () => {
    const supabase = createMockSupabase({
      allTimeTxns: [{ type: 'income', amount: 100000 }],
      deadlines: [
        { form_name: '2550M', description: null, due_date: '2026-04-05', status: 'upcoming' },
      ],
    });

    const result = await aggregateBriefingData(supabase, TEST_USER_ID);

    expect(result.upcoming_deadlines[0].form_description).toBe('');
  });
});
