/**
 * Expenses range resolver — converts a `ExpensesRange` pill value into a
 * `{from, to}` pair of Manila-local YYYY-MM-DD date strings for the
 * `/api/expenses` GET query.
 *
 * All math is calendar-date math (no time component). `transaction_date`
 * rows are date-only, so a row written at 23:59 Manila on Dec 31 stores
 * `2026-12-31` and will NOT appear in `range=taon` of 2027 — by design.
 *
 * Range definitions:
 *  - `linggo` — trailing 7 days ending today (inclusive)
 *  - `buwan`  — first → last day of current Manila month
 *  - `taon`   — Jan 1 of current Manila year → today (inclusive)
 *
 * The `todayManila` parameter is required (caller supplies via
 * `getManilaToday()`) so this helper is fully deterministic and easy
 * to unit-test.
 */

import type { ExpensesRange } from './schemas';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

/** Add `days` (can be negative) to a YYYY-MM-DD date string. Returns YYYY-MM-DD. */
function addDays(ymd: string, days: number): string {
  // Build a UTC date from the YYYY-MM-DD parts so we don't pick up the
  // process timezone. Calendar arithmetic in UTC is safe across DST.
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Last day-of-month for a given (year, monthIndex0..11). */
function lastDayOfMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month = last day of this month, in UTC.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Resolve a pill range to a Manila YYYY-MM-DD `{from, to}` window.
 *
 * @param range        Pill value (`'linggo' | 'buwan' | 'taon'`)
 * @param todayManila  Today in Manila as `YYYY-MM-DD` (use `getManilaToday()`).
 */
export function resolveRange(range: ExpensesRange, todayManila: string): DateRange {
  const [year, month] = todayManila.split('-').map(Number);

  switch (range) {
    case 'linggo': {
      const from = addDays(todayManila, -6); // 6 days back + today = 7 days
      return { from, to: todayManila };
    }
    case 'buwan': {
      const mm = String(month).padStart(2, '0');
      const lastDay = lastDayOfMonth(year, month - 1);
      return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` };
    }
    case 'taon': {
      return { from: `${year}-01-01`, to: todayManila };
    }
  }
}
