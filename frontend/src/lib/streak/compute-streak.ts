// ============================================================
// compute-streak.ts — Phase 7 daily-check-in streak helper
// Pure module (no side effects, no IO). Vitest-tested.
//
// Used by /(app)/dashboard/page.tsx to compute the streak count handed to
// CheckInSection's PaperNote invite. The single-query approximation is
// intentional for Phase 7 — we walk consecutively from today backwards
// through a date-list until the first gap. Caps at 30 to keep render math
// small; deeper streak logic ships with the streak-card share surface in
// Phase 11+ (Q12 pivot).
//
// Inputs:
//   - dates: array of YYYY-MM-DD strings (Manila) — the user's
//     daily_check_in.check_in_date values, ORDER BY check_in_date DESC
//   - today: YYYY-MM-DD (Manila) — the boundary the walk starts from
//
// Output: { streak, status }
//   - status === 'fresh'   → no check-in today AND no check-in yesterday;
//                            streak is whatever it was (could be 0).
//   - status === 'active'  → check-in either today or yesterday (a streak
//                            in progress); streak counts unbroken days.
//   - status === 'reset'   → streak just broke (no today, no yesterday, but
//                            a non-zero previous streak existed somewhere
//                            further back). Phase 7 uses this to swap the
//                            invite copy to home.checkin.resetCopy.
// ============================================================

export type StreakStatus = 'fresh' | 'active' | 'reset';

export type StreakResult = {
  streak: number;
  status: StreakStatus;
};

/**
 * Subtract n days from a YYYY-MM-DD string. Manila boundaries are governed
 * by the caller — this helper just shifts the calendar date numerically.
 */
function dateMinusDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STREAK_CAP = 30;

/**
 * Walk consecutive YYYY-MM-DD entries backward from `today` and return the
 * streak count + status. Caller passes the user's full check_in_date list
 * in DESC order (or any order — we Set-ify); we do the date arithmetic.
 */
export function computeStreak(dates: string[], today: string): StreakResult {
  const dateSet = new Set(dates);
  const yesterday = dateMinusDays(today, 1);

  const hasToday = dateSet.has(today);
  const hasYesterday = dateSet.has(yesterday);

  // No check-in today AND no check-in yesterday → either fresh (no prior
  // streak) or reset (prior streak existed and broke).
  if (!hasToday && !hasYesterday) {
    return {
      streak: 0,
      status: dateSet.size === 0 ? 'fresh' : 'reset',
    };
  }

  // Walk backward from `today` (if hasToday) or `yesterday` (if only
  // yesterday exists) until the first gap.
  let cursor = hasToday ? today : yesterday;
  let count = 0;
  while (dateSet.has(cursor) && count < STREAK_CAP) {
    count += 1;
    cursor = dateMinusDays(cursor, 1);
  }

  return {
    streak: count,
    status: 'active',
  };
}
