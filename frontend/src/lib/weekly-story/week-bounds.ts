// ============================================================
// week-bounds.ts — Manila ISO-week (Monday-start) helpers.
// Pure module (no IO). Tested via vitest.
//
// Adapted from frontend/src/lib/morning-briefing/aggregate.ts's local
// getWeekStart / getWeekEnd helpers — those are non-exported. ADR-015
// promotes them into a shared module so the home Kuwento card and the
// future /kuwento route compute identical week boundaries.
// ============================================================

import { getManilaToday } from '@/lib/timezone';

export type ManilaWeekBounds = {
  /** YYYY-MM-DD (Monday, Manila) */
  week_start: string;
  /** YYYY-MM-DD (Sunday, Manila) */
  week_end: string;
};

/** Internal date arithmetic — pads YYYY-MM-DD output. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function shift(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Get the Monday (ISO week start) of the week containing a given YYYY-MM-DD. */
export function getMondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0, Tue=1, .., Sun=6
  return shift(dateStr, -diff);
}

/** Get the Sunday (end) of the week containing a given YYYY-MM-DD. */
export function getSundayOf(dateStr: string): string {
  return shift(getMondayOf(dateStr), 6);
}

/**
 * Compute Manila ISO-week bounds. If `today` is omitted the helper reads
 * `getManilaToday()` so callers in route handlers don't need to thread the
 * date through. Tests pass an explicit `today` for determinism.
 */
export function getManilaWeekBounds(today: string = getManilaToday()): ManilaWeekBounds {
  return {
    week_start: getMondayOf(today),
    week_end: getSundayOf(today),
  };
}

/**
 * Sequence of YYYY-MM-DD entries, Mon..Sun, for a given week. Used by the
 * aggregator to materialize the 7-entry daily_breakdown even when some days
 * have zero transactions.
 */
export function enumerateWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shift(weekStart, i));
}

/** Filipino weekday abbreviations for the 7 ISO-week days, Mon..Sun. */
export const FIL_DAY_LABELS: readonly string[] = [
  'Lun',
  'Mar',
  'Miy',
  'Hue',
  'Bie',
  'Sab',
  'Lin',
] as const;
