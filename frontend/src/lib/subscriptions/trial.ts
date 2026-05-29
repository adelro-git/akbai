/**
 * Trial State — pure helpers for the 7-day free-trial countdown (Sprint 18, §11 gate)
 * Feature: Pre-Launch Readiness — trial-countdown banner + day-7 paywall trigger
 * Role: Given a trial start timestamp, derive day number / days-remaining / expiry
 *       using Asia/Manila (UTC+8) CALENDAR-DAY boundaries — not raw 24h windows.
 *
 * Why calendar-day math (not elapsed milliseconds):
 *   The §11 gate says "days-remaining updates daily" and "paywall trigger at day 7".
 *   A user who signs up at 23:55 PHT should NOT lose a day five minutes later at
 *   midnight PHT if we counted raw 24h windows from the signup instant. Instead we
 *   compare Manila CALENDAR dates: Day 1 is the signup day, Day 2 is the next Manila
 *   midnight, etc. This makes the countdown tick over exactly at PHT midnight, which
 *   is what users see and what the gate expects.
 *
 * Trial start source (where startedAtISO comes from):
 *   The `subscriptions` table (migration 003) has
 *   `started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, written when the row is created
 *   by the `handle_new_user()` trigger at signup. When `status = 'trialing'`,
 *   `started_at` IS the trial start. Pass `subscription.started_at` (ISO string) here.
 *
 * No React, no `'use client'`, no Supabase — pure functions so they are trivially
 * testable in the node vitest env and importable from Server Components.
 */

import { getManilaDateKey } from '@/lib/timezone';

// ============================================================
// Trial length — 7 days of full (capped) access before the paywall.
// project-context.md §4 / Sprint 18 §11 gate.
// ============================================================

export const TRIAL_LENGTH_DAYS = 7 as const;

// ============================================================
// TrialState — derived view of where a user sits in their trial.
// Type kept LOCAL to this file (subscriptions/types.ts is owned by the
// subscriptions stream this sprint — see Sprint 18 stream boundary).
// ============================================================

export interface TrialState {
  /** True while the user is still inside the 7-day window (day 1..7, not expired). */
  isTrialing: boolean;
  /**
   * 1-based day index in Manila calendar days.
   *   Day 1 = the signup day, Day 7 = final trial day, 8+ = past the window.
   * Always >= 1 (a `now` before the start day is clamped to day 1).
   */
  dayNumber: number;
  /**
   * Manila days still left in the trial, INCLUSIVE of the current day, floored
   * at 0. Day 1 -> 7 remaining, Day 7 (last day) -> 1 remaining, Day 8 -> 0.
   * Inclusive because the banner reads "May [N] araw na lang" — on the final
   * day that should say "1 araw na lang" (today is your last day), not "0".
   * `daysRemaining <= 0` means the trial is over.
   */
  daysRemaining: number;
  /** True once the 7-day window has fully elapsed (day 8 onward). */
  expired: boolean;
}

// ============================================================
// Manila CALENDAR date of an instant — see getManilaDateKey() in
// lib/timezone.ts (the single source of truth). Trial math keys off the
// Manila calendar date of both the start instant and `now`, with the clock
// injectable via the Date arg for deterministic tests.
// ============================================================
// manilaDateKeyToOrdinal — convert a YYYY-MM-DD Manila date string to a
// day ordinal (days since the Unix epoch). Pure integer arithmetic on the
// calendar parts, so it is immune to the runtime's local timezone and to
// DST (Manila has no DST, but this is belt-and-suspenders).
// ============================================================

function manilaDateKeyToOrdinal(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  // Date.UTC gives a deterministic epoch-ms for midnight UTC of that calendar
  // date; dividing by ms-per-day yields a stable integer day ordinal. We only
  // ever DIFFERENCE two ordinals, so the choice of UTC midnight is irrelevant.
  const ms = Date.UTC(year, month - 1, day);
  return Math.floor(ms / 86_400_000);
}

// ============================================================
// computeTrialState — the one exported entry point.
//   startedAtISO — subscription.started_at (ISO timestamp).
//   now          — injectable clock for tests; defaults to real now.
// ============================================================

export function computeTrialState(startedAtISO: string, now: Date = new Date()): TrialState {
  // Resolve both instants to their Manila CALENDAR date, then diff the days.
  const startKey = getManilaDateKey(new Date(startedAtISO));
  const nowKey = getManilaDateKey(now);

  const startOrdinal = manilaDateKeyToOrdinal(startKey);
  const nowOrdinal = manilaDateKeyToOrdinal(nowKey);

  // Elapsed Manila calendar days since the start day (0 on the start day).
  // Clamp to 0 so a clock that is somehow before the start day reads as day 1.
  const elapsedDays = Math.max(0, nowOrdinal - startOrdinal);

  const dayNumber = elapsedDays + 1; // 1-based: start day = day 1
  const daysRemaining = Math.max(0, TRIAL_LENGTH_DAYS - elapsedDays);
  const expired = daysRemaining <= 0;

  return {
    isTrialing: !expired,
    dayNumber,
    daysRemaining,
    expired,
  };
}
