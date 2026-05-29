// ============================================================
// aggregate.test.ts — Sprint 18 reconciliation aggregators (pure functions).
//
// No mocks needed — computeWeeklyReconciliation / computeMonthlyReconciliation
// are pure: rows in, reconciliation out. `today` is passed explicitly for
// determinism (the routes thread getManilaToday() in production).
//
// Covers: missing-day detection, week-boundary crossing, month-boundary
// crossing (1st of month), all-logged, none-logged, null sales/expenses,
// and the UTC+8 near-midnight edge (a check-in saved at 23:55 PHT lands on
// that Manila calendar date — string-equal, no clock drift).
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  computeWeeklyReconciliation,
  computeMonthlyReconciliation,
} from '../aggregate';
import type { ReconciliationCheckIn } from '../types';

function checkIn(
  date: string,
  sales: number | null = null,
  expenses: number | null = null,
): ReconciliationCheckIn {
  return { check_in_date: date, sales_amount: sales, expenses_amount: expenses };
}

// ============================================================
// Weekly
// ============================================================

describe('computeWeeklyReconciliation', () => {
  // today = Wed 2026-04-22 → window is 2026-04-16 .. 2026-04-22 (7 days).
  const today = '2026-04-22';

  it('spans exactly 7 days ending at today, oldest → today', () => {
    const result = computeWeeklyReconciliation([], today);
    expect(result.range_start).toBe('2026-04-16');
    expect(result.range_end).toBe('2026-04-22');
    expect(result.days).toHaveLength(7);
    expect(result.total_days).toBe(7);
    expect(result.days[0].date).toBe('2026-04-16');
    expect(result.days[6].date).toBe('2026-04-22');
  });

  it('flags every day missing when there are no check-ins', () => {
    const result = computeWeeklyReconciliation([], today);
    expect(result.logged_count).toBe(0);
    expect(result.missing_dates).toEqual([
      '2026-04-16',
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
    ]);
    expect(result.total_sales_centavos).toBe(0);
    expect(result.total_expenses_centavos).toBe(0);
    expect(result.net_centavos).toBe(0);
    expect(result.days.every((d) => !d.logged)).toBe(true);
  });

  it('flags no missing days when every day is logged', () => {
    const rows: ReconciliationCheckIn[] = [
      checkIn('2026-04-16', 1000, 200),
      checkIn('2026-04-17', 1000, 200),
      checkIn('2026-04-18', 1000, 200),
      checkIn('2026-04-19', 1000, 200),
      checkIn('2026-04-20', 1000, 200),
      checkIn('2026-04-21', 1000, 200),
      checkIn('2026-04-22', 1000, 200),
    ];
    const result = computeWeeklyReconciliation(rows, today);
    expect(result.logged_count).toBe(7);
    expect(result.missing_dates).toEqual([]);
    expect(result.total_sales_centavos).toBe(7000);
    expect(result.total_expenses_centavos).toBe(1400);
    expect(result.net_centavos).toBe(5600);
    expect(result.days.every((d) => d.logged)).toBe(true);
  });

  it('detects the specific missing days and totals only logged amounts', () => {
    // Logged Mon, Wed, Sat (within window); missing the other 4.
    const rows: ReconciliationCheckIn[] = [
      checkIn('2026-04-20', 50000, 10000), // Mon
      checkIn('2026-04-22', 30000, 5000), // Wed (today)
      checkIn('2026-04-18', 20000, null), // Sat (expenses left blank)
    ];
    const result = computeWeeklyReconciliation(rows, today);
    expect(result.logged_count).toBe(3);
    expect(result.missing_dates).toEqual([
      '2026-04-16',
      '2026-04-17',
      '2026-04-19',
      '2026-04-21',
    ]);
    expect(result.total_sales_centavos).toBe(100000);
    // Null expenses on 04-18 contribute 0, not NaN.
    expect(result.total_expenses_centavos).toBe(15000);
    expect(result.net_centavos).toBe(85000);

    // The logged-day entries preserve their raw nullable amounts.
    const apr18 = result.days.find((d) => d.date === '2026-04-18');
    expect(apr18?.logged).toBe(true);
    expect(apr18?.sales_centavos).toBe(20000);
    expect(apr18?.expenses_centavos).toBeNull();
  });

  it('crosses a month boundary correctly (window straddles two months)', () => {
    // today = 2026-05-03 → window 2026-04-27 .. 2026-05-03.
    const may3 = '2026-05-03';
    const rows: ReconciliationCheckIn[] = [
      checkIn('2026-04-28', 1000), // logged in April side
      checkIn('2026-05-01', 2000), // logged in May side
    ];
    const result = computeWeeklyReconciliation(rows, may3);
    expect(result.range_start).toBe('2026-04-27');
    expect(result.range_end).toBe('2026-05-03');
    expect(result.days).toHaveLength(7);
    expect(result.logged_count).toBe(2);
    expect(result.missing_dates).toEqual([
      '2026-04-27',
      '2026-04-29',
      '2026-04-30',
      '2026-05-02',
      '2026-05-03',
    ]);
    expect(result.total_sales_centavos).toBe(3000);
  });

  it('crosses a year boundary correctly (Dec → Jan)', () => {
    // today = 2026-01-02 → window 2025-12-27 .. 2026-01-02.
    const jan2 = '2026-01-02';
    const rows: ReconciliationCheckIn[] = [checkIn('2025-12-31', 9999)];
    const result = computeWeeklyReconciliation(rows, jan2);
    expect(result.range_start).toBe('2025-12-27');
    expect(result.range_end).toBe('2026-01-02');
    expect(result.logged_count).toBe(1);
    expect(result.total_sales_centavos).toBe(9999);
    expect(result.missing_dates).toContain('2025-12-27');
    expect(result.missing_dates).toContain('2026-01-01');
  });

  it('ignores check-ins outside the 7-day window', () => {
    const rows: ReconciliationCheckIn[] = [
      checkIn('2026-04-22', 5000), // today (in window)
      checkIn('2026-04-15', 99999), // one day before window → ignored
      checkIn('2026-04-30', 88888), // future → ignored
    ];
    const result = computeWeeklyReconciliation(rows, today);
    expect(result.logged_count).toBe(1);
    expect(result.total_sales_centavos).toBe(5000);
  });

  it('UTC+8 near-midnight edge: a 23:55 PHT check-in counts on its Manila date', () => {
    // The route normalizes check_in_date to the Manila calendar date before
    // calling the aggregator. A check-in at 2026-04-22T23:55+08:00 stores
    // check_in_date = '2026-04-22'. We assert the aggregator treats that as
    // today (logged), NOT as the UTC date 2026-04-22T15:55Z which is still
    // the 22nd anyway — but the point is the aggregator never re-derives a
    // date from a timestamp, so there is no off-by-one.
    const rows: ReconciliationCheckIn[] = [checkIn('2026-04-22', 12345)];
    const result = computeWeeklyReconciliation(rows, today);
    const todayEntry = result.days[6];
    expect(todayEntry.date).toBe('2026-04-22');
    expect(todayEntry.logged).toBe(true);
    expect(todayEntry.sales_centavos).toBe(12345);
    expect(result.missing_dates).not.toContain('2026-04-22');
  });

  it('assigns correct Filipino weekday labels (Lun..Lin)', () => {
    // 2026-04-16 is a Thursday (Hue); 2026-04-22 is a Wednesday (Miy).
    const result = computeWeeklyReconciliation([], today);
    expect(result.days[0].day_label).toBe('Hue'); // Thu 04-16
    expect(result.days[6].day_label).toBe('Miy'); // Wed 04-22
  });
});

// ============================================================
// Monthly
// ============================================================

describe('computeMonthlyReconciliation', () => {
  it('uses month-to-date window: first of month → today inclusive', () => {
    const today = '2026-05-10'; // 10 days elapsed
    const result = computeMonthlyReconciliation([], today);
    expect(result.month_start).toBe('2026-05-01');
    expect(result.month_end).toBe('2026-05-10');
    expect(result.days_elapsed).toBe(10);
    expect(result.month_label).toBe('Mayo 2026');
  });

  it('flags all elapsed days missing when no check-ins', () => {
    const today = '2026-05-05';
    const result = computeMonthlyReconciliation([], today);
    expect(result.days_logged).toBe(0);
    expect(result.days_elapsed).toBe(5);
    expect(result.missing_dates).toEqual([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
      '2026-05-05',
    ]);
    expect(result.net_centavos).toBe(0);
  });

  it('sums only month-to-date logged amounts and lists missing days', () => {
    const today = '2026-05-05';
    const rows: ReconciliationCheckIn[] = [
      checkIn('2026-05-01', 100000, 30000),
      checkIn('2026-05-03', 50000, null), // expenses blank
      checkIn('2026-04-30', 99999, 99999), // previous month → ignored
      checkIn('2026-05-06', 88888), // future (beyond today) → ignored
    ];
    const result = computeMonthlyReconciliation(rows, today);
    expect(result.days_logged).toBe(2);
    expect(result.days_elapsed).toBe(5);
    expect(result.total_sales_centavos).toBe(150000);
    expect(result.total_expenses_centavos).toBe(30000); // null treated as 0
    expect(result.net_centavos).toBe(120000);
    expect(result.missing_dates).toEqual([
      '2026-05-02',
      '2026-05-04',
      '2026-05-05',
    ]);
  });

  it('handles the 1st of the month (single elapsed day)', () => {
    const today = '2026-05-01';
    const result = computeMonthlyReconciliation(
      [checkIn('2026-05-01', 4200)],
      today,
    );
    expect(result.month_start).toBe('2026-05-01');
    expect(result.days_elapsed).toBe(1);
    expect(result.days_logged).toBe(1);
    expect(result.missing_dates).toEqual([]);
    expect(result.total_sales_centavos).toBe(4200);
  });

  it('handles end-of-month with all days logged (no missing)', () => {
    // Build a fully-logged April (30 days). today = 2026-04-30.
    const today = '2026-04-30';
    const rows: ReconciliationCheckIn[] = Array.from({ length: 30 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return checkIn(`2026-04-${day}`, 1000, 100);
    });
    const result = computeMonthlyReconciliation(rows, today);
    expect(result.days_elapsed).toBe(30);
    expect(result.days_logged).toBe(30);
    expect(result.missing_dates).toEqual([]);
    expect(result.total_sales_centavos).toBe(30000);
    expect(result.total_expenses_centavos).toBe(3000);
    expect(result.net_centavos).toBe(27000);
    expect(result.month_label).toBe('Abril 2026');
  });

  it('produces a negative net when expenses exceed sales', () => {
    const today = '2026-05-02';
    const rows: ReconciliationCheckIn[] = [checkIn('2026-05-01', 1000, 5000)];
    const result = computeMonthlyReconciliation(rows, today);
    expect(result.net_centavos).toBe(-4000);
  });

  it('labels months in Filipino across the year', () => {
    expect(computeMonthlyReconciliation([], '2026-01-15').month_label).toBe(
      'Enero 2026',
    );
    expect(computeMonthlyReconciliation([], '2026-12-15').month_label).toBe(
      'Disyembre 2026',
    );
  });

  it('UTC+8 near-midnight edge: a 23:55 PHT check-in on the 1st counts that day', () => {
    // check_in_date '2026-05-01' from a 23:55+08:00 save counts on May 1,
    // never bleeds into April or May 2.
    const today = '2026-05-02';
    const rows: ReconciliationCheckIn[] = [checkIn('2026-05-01', 7777)];
    const result = computeMonthlyReconciliation(rows, today);
    expect(result.days_logged).toBe(1);
    expect(result.missing_dates).toEqual(['2026-05-02']);
    expect(result.total_sales_centavos).toBe(7777);
  });
});
