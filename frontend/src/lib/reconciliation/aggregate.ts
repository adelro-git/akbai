// ============================================================
// reconciliation/aggregate.ts — pure data-completeness aggregators.
//
// No IO, no React, no Supabase imports — the route handlers fetch the rows
// and hand them in. This keeps the math deterministic and unit-testable
// (vitest), mirroring lib/weekly-story/aggregate.ts + lib/streak.
//
// Date model: every date is a YYYY-MM-DD string already normalized to
// Asia/Manila (UTC+8) by the caller via getManilaToday(). All arithmetic is
// done by anchoring the string at T00:00:00Z and shifting UTC day fields, so
// results never drift with the host runtime's local timezone. The check-in
// table stores check_in_date as a Manila DATE (migration 006 default
// CURRENT_DATE under the Manila session), so a check-in saved at 23:55 PHT
// lands on that same Manila calendar date — the comparison is string-equal,
// no clock math, so the "near-midnight PHT" edge is correct by construction.
//
// Money is INTEGER centavos throughout; peso conversion is a UI concern.
// ============================================================

import type {
  MonthlyReconciliation,
  ReconciliationCheckIn,
  ReconciliationDay,
  WeeklyReconciliation,
} from './types';

const WEEKLY_WINDOW_DAYS = 7;

/** Filipino weekday abbreviations indexed by JS getUTCDay() (0=Sun..6=Sat). */
const FIL_DAY_BY_DOW: readonly string[] = [
  'Lin', // Sunday
  'Lun', // Monday
  'Mar', // Tuesday
  'Miy', // Wednesday
  'Hue', // Thursday
  'Bie', // Friday
  'Sab', // Saturday
] as const;

/** Filipino month names indexed 0..11 (Enero..Disyembre). */
const FIL_MONTHS: readonly string[] = [
  'Enero',
  'Pebrero',
  'Marso',
  'Abril',
  'Mayo',
  'Hunyo',
  'Hulyo',
  'Agosto',
  'Setyembre',
  'Oktubre',
  'Nobyembre',
  'Disyembre',
] as const;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Shift a YYYY-MM-DD string by deltaDays, returning YYYY-MM-DD. */
function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Filipino weekday abbreviation for a YYYY-MM-DD string. */
function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return FIL_DAY_BY_DOW[d.getUTCDay()];
}

/** First day of the month containing dateStr, as YYYY-MM-01. */
function firstOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  return `${year}-${month}-01`;
}

/**
 * Index the user's check-ins by Manila calendar date. The latest row wins if
 * (defensively) two rows share a date — the unique(user_id, check_in_date)
 * constraint means this should not happen, but Map-set is safe either way.
 */
function indexByDate(
  checkIns: ReconciliationCheckIn[],
): Map<string, ReconciliationCheckIn> {
  const byDate = new Map<string, ReconciliationCheckIn>();
  for (const row of checkIns) {
    byDate.set(row.check_in_date, row);
  }
  return byDate;
}

/**
 * Build a WeeklyReconciliation for the trailing 7 days ending at `today`
 * (inclusive). Surfaces which of those 7 Manila days were NOT checked in so
 * the user can back-fill, plus running sales/expenses/net totals.
 *
 * @param checkIns the user's daily_check_in rows (any window superset is fine;
 *   rows outside the 7-day window are ignored). check_in_date is Manila DATE.
 * @param today YYYY-MM-DD (Manila) — the window's last day.
 */
export function computeWeeklyReconciliation(
  checkIns: ReconciliationCheckIn[],
  today: string,
): WeeklyReconciliation {
  const byDate = indexByDate(checkIns);
  const rangeStart = shiftDate(today, -(WEEKLY_WINDOW_DAYS - 1));

  const days: ReconciliationDay[] = [];
  const missingDates: string[] = [];
  let loggedCount = 0;
  let totalSales = 0;
  let totalExpenses = 0;

  // Walk oldest → today so `days` reads chronologically left-to-right.
  for (let i = WEEKLY_WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const date = shiftDate(today, -i);
    const row = byDate.get(date);
    const logged = row !== undefined;

    if (logged) {
      loggedCount += 1;
      const sales = row.sales_amount ?? 0;
      const expenses = row.expenses_amount ?? 0;
      totalSales += sales;
      totalExpenses += expenses;
      days.push({
        date,
        day_label: dayLabel(date),
        logged: true,
        sales_centavos: row.sales_amount,
        expenses_centavos: row.expenses_amount,
      });
    } else {
      missingDates.push(date);
      days.push({
        date,
        day_label: dayLabel(date),
        logged: false,
        sales_centavos: null,
        expenses_centavos: null,
      });
    }
  }

  return {
    range_start: rangeStart,
    range_end: today,
    days,
    missing_dates: missingDates,
    logged_count: loggedCount,
    total_days: WEEKLY_WINDOW_DAYS,
    total_sales_centavos: totalSales,
    total_expenses_centavos: totalExpenses,
    net_centavos: totalSales - totalExpenses,
  };
}

/**
 * Build a MonthlyReconciliation for the current calendar month, month-to-date
 * (first of the month → today, inclusive). Surfaces month-to-date totals and
 * which elapsed days were NOT checked in.
 *
 * @param checkIns the user's daily_check_in rows (superset is fine; rows
 *   outside the month are ignored). check_in_date is Manila DATE.
 * @param today YYYY-MM-DD (Manila).
 */
export function computeMonthlyReconciliation(
  checkIns: ReconciliationCheckIn[],
  today: string,
): MonthlyReconciliation {
  const byDate = indexByDate(checkIns);
  const monthStart = firstOfMonth(today);

  // days_elapsed = day-of-month of `today` (1-based, includes today).
  const daysElapsed = Number(today.split('-')[2]);

  const missingDates: string[] = [];
  let daysLogged = 0;
  let totalSales = 0;
  let totalExpenses = 0;

  for (let i = 0; i < daysElapsed; i += 1) {
    const date = shiftDate(monthStart, i);
    const row = byDate.get(date);
    if (row !== undefined) {
      daysLogged += 1;
      totalSales += row.sales_amount ?? 0;
      totalExpenses += row.expenses_amount ?? 0;
    } else {
      missingDates.push(date);
    }
  }

  const monthIndex = Number(today.split('-')[1]) - 1;
  const year = today.split('-')[0];
  const monthLabel = `${FIL_MONTHS[monthIndex]} ${year}`;

  return {
    month_start: monthStart,
    month_end: today,
    month_label: monthLabel,
    total_sales_centavos: totalSales,
    total_expenses_centavos: totalExpenses,
    net_centavos: totalSales - totalExpenses,
    days_logged: daysLogged,
    days_elapsed: daysElapsed,
    missing_dates: missingDates,
  };
}
