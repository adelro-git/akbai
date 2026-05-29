// AKBai — Shared timezone utilities for UTC+8 (Asia/Manila) enforcement
// All user-facing timestamps, BIR deadlines, daily boundaries, and push
// notifications must go through these helpers. Never use raw `new Date()`
// for display purposes.
// Resolves: Gap A3

import { format } from 'date-fns';

/** IANA timezone identifier for Philippine Standard Time (UTC+8). */
export const MANILA_TZ = 'Asia/Manila' as const;

/**
 * Convert any Date to a Date object whose UTC fields represent Manila local time.
 * This lets you pass the result to date-fns `format()` and get Manila-correct output
 * without needing @date-fns/tz.
 *
 * How it works: we format the date's parts in Asia/Manila, then construct a new
 * Date from those parts. The resulting Date's UTC methods (getUTCFullYear, etc.)
 * will return Manila-local values.
 */
export function toManila(date?: Date): Date {
  const d = date ?? new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '0';

  const year = Number(get('year'));
  const month = Number(get('month')) - 1; // JS months are 0-indexed
  const day = Number(get('day'));
  const hour = Number(get('hour')) === 24 ? 0 : Number(get('hour'));
  const minute = Number(get('minute'));
  const second = Number(get('second'));

  // Construct a Date where the *local* values represent Manila time.
  // We use Date.UTC so the values are deterministic regardless of the runtime's timezone.
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Format a date in Manila timezone using a date-fns format string.
 *
 * @param date - The date to format (defaults to now)
 * @param formatStr - A date-fns format string (defaults to 'yyyy-MM-dd')
 * @returns Formatted date string in Manila time
 */
export function formatManilaDate(date?: Date, formatStr = 'yyyy-MM-dd'): string {
  const manilaDate = toManila(date);
  // Use formatters that read UTC values, since toManila() stores Manila time in UTC fields.
  // date-fns `format` reads local fields, so we need to account for that.
  // Simplest approach: use Intl for the default case, date-fns for custom formats
  // by creating a date that will have the right local values when interpreted as UTC.
  //
  // Since toManila() returns a Date with Manila time in its UTC slots,
  // we shift it so the *local* slots have Manila time.
  const offset = manilaDate.getTimezoneOffset() * 60_000;
  const shifted = new Date(manilaDate.getTime() + offset);
  return format(shifted, formatStr);
}

/**
 * Get the Manila CALENDAR date of an instant as a 'YYYY-MM-DD' string.
 * Uses the en-CA locale (which formats as YYYY-MM-DD) pinned to Asia/Manila.
 *
 * Single source of truth for "what Manila calendar date is this instant" —
 * `getManilaToday()` is the `date = now` specialization, and callers that need
 * the Manila date of a SPECIFIC instant (e.g. trial-start math) pass `date`.
 * Consolidating here keeps every Manila-date-key derivation byte-identical.
 *
 * @param date - The instant to resolve (defaults to now)
 * @returns YYYY-MM-DD in Asia/Manila
 */
export function getManilaDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MANILA_TZ }).format(date);
}

/**
 * Get today's date in Manila timezone as a YYYY-MM-DD string.
 * Used for daily boundaries (circuit breaker, query limits, daily spend caps).
 */
export function getManilaToday(): string {
  return getManilaDateKey();
}

/**
 * Get the current Manila timestamp as an ISO-like string.
 * Format: YYYY-MM-DDTHH:mm:ss+08:00
 */
export function getManilaTimestamp(): string {
  const d = toManila();
  const pad = (n: number): string => String(n).padStart(2, '0');

  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hour = pad(d.getUTCHours());
  const minute = pad(d.getUTCMinutes());
  const second = pad(d.getUTCSeconds());

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`;
}

/**
 * Generate a SQL fragment for converting a column to Manila timezone.
 * For use in Supabase raw queries / `.rpc()` calls.
 *
 * @param column - The column name to convert (e.g., 'created_at')
 * @returns SQL fragment like `created_at AT TIME ZONE 'Asia/Manila'`
 */
export function toManilaSQL(column: string): string {
  return `${column} AT TIME ZONE 'Asia/Manila'`;
}
