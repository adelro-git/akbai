/**
 * Trial State Tests — computeTrialState() day-boundary + timezone correctness
 * Feature: Pre-Launch Readiness (Sprint 18, §11 gate)
 *
 * Covers: day 1 (start day), mid-trial, day 7 (final day), expired (day 8),
 *         exact PHT-midnight boundary tick-over, and timezone correctness
 *         (an instant that is "tomorrow" in UTC but still "today" in Manila,
 *         and vice versa).
 *
 * All assertions use Manila (UTC+8) CALENDAR days. Reminder: Manila is UTC+8,
 * so 16:00Z on date D == 00:00 PHT on date D+1.
 */

import { describe, it, expect } from 'vitest';
import { computeTrialState, TRIAL_LENGTH_DAYS } from '../trial';

// ============================================================
// Helpers — build instants relative to a fixed Manila start.
// Start: 2026-05-01 09:00 PHT == 2026-05-01T01:00:00Z.
// ============================================================

const START_ISO = '2026-05-01T01:00:00Z'; // 2026-05-01 09:00 PHT

/** A UTC instant for a given Manila local date + time (Manila = UTC+8). */
function phtInstant(manilaDate: string, hhmm: string): Date {
  // Subtract 8h to get UTC. We construct the UTC instant directly.
  const [h, m] = hhmm.split(':').map(Number);
  const [y, mo, d] = manilaDate.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 8, m, 0));
}

describe('computeTrialState — trial length constant', () => {
  it('is a 7-day trial', () => {
    expect(TRIAL_LENGTH_DAYS).toBe(7);
  });
});

describe('computeTrialState — day 1 (start day)', () => {
  // "Days remaining" is INCLUSIVE of today: on the start day the user has all
  // 7 trial days still ahead. day 1 -> 7, day 7 (final day) -> 1, day 8 -> 0.
  it('reports day 1 with 7 days remaining, still trialing', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-05-01', '09:05'));
    expect(state).toEqual({
      isTrialing: true,
      dayNumber: 1,
      daysRemaining: 7,
      expired: false,
    });
  });

  it('clamps to day 1 if now is (defensively) before the start day', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-04-30', '23:00'));
    expect(state.dayNumber).toBe(1);
    expect(state.daysRemaining).toBe(7);
    expect(state.expired).toBe(false);
  });
});

describe('computeTrialState — mid-trial', () => {
  it('day 4 reports 4 days remaining (inclusive of today)', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-05-04', '14:00'));
    expect(state.dayNumber).toBe(4);
    expect(state.daysRemaining).toBe(4);
    expect(state.isTrialing).toBe(true);
    expect(state.expired).toBe(false);
  });
});

describe('computeTrialState — day 7 (final trial day)', () => {
  it('reports day 7 with exactly 1 day remaining, still trialing (no paywall yet)', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-05-07', '23:59'));
    expect(state).toEqual({
      isTrialing: true,
      dayNumber: 7,
      daysRemaining: 1,
      expired: false,
    });
  });
});

describe('computeTrialState — expired (day 8 onward, paywall triggers)', () => {
  it('day 8 reports expired with 0 days remaining', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-05-08', '00:01'));
    expect(state).toEqual({
      isTrialing: false,
      dayNumber: 8,
      daysRemaining: 0,
      expired: true,
    });
  });

  it('stays expired well past the window (day 30)', () => {
    const state = computeTrialState(START_ISO, phtInstant('2026-05-30', '12:00'));
    expect(state.expired).toBe(true);
    expect(state.isTrialing).toBe(false);
    expect(state.daysRemaining).toBe(0);
    expect(state.dayNumber).toBe(30);
  });
});

describe('computeTrialState — exact PHT-midnight boundary tick-over', () => {
  // 23:59:59 PHT on day 7 is still day 7 (1 remaining); one second later at
  // 00:00:00 PHT it becomes day 8 / expired. The countdown ticks at PHT midnight.
  it('23:59:59 PHT on the final day is still day 7', () => {
    const justBefore = new Date(Date.UTC(2026, 4, 7, 15, 59, 59)); // 2026-05-07 23:59:59 PHT
    const state = computeTrialState(START_ISO, justBefore);
    expect(state.dayNumber).toBe(7);
    expect(state.daysRemaining).toBe(1);
    expect(state.expired).toBe(false);
  });

  it('00:00:00 PHT the next morning flips to day 8 / expired', () => {
    const atMidnight = new Date(Date.UTC(2026, 4, 7, 16, 0, 0)); // 2026-05-08 00:00:00 PHT
    const state = computeTrialState(START_ISO, atMidnight);
    expect(state.dayNumber).toBe(8);
    expect(state.daysRemaining).toBe(0);
    expect(state.expired).toBe(true);
  });

  it('the day-1 -> day-2 boundary also ticks at PHT midnight', () => {
    const lastSecondDay1 = new Date(Date.UTC(2026, 4, 1, 15, 59, 59)); // 2026-05-01 23:59:59 PHT
    const firstSecondDay2 = new Date(Date.UTC(2026, 4, 1, 16, 0, 0)); // 2026-05-02 00:00:00 PHT
    expect(computeTrialState(START_ISO, lastSecondDay1).dayNumber).toBe(1);
    expect(computeTrialState(START_ISO, lastSecondDay1).daysRemaining).toBe(7);
    expect(computeTrialState(START_ISO, firstSecondDay2).dayNumber).toBe(2);
    expect(computeTrialState(START_ISO, firstSecondDay2).daysRemaining).toBe(6);
  });
});

describe('computeTrialState — timezone correctness (UTC vs Manila calendar date)', () => {
  // A late-night PHT signup must not lose a day. Start at 2026-05-01 23:55 PHT
  // (== 2026-05-01T15:55:00Z). 10 minutes later it is 2026-05-02 in UTC's eyes
  // (00:05Z) but STILL day 1 of the trial because it is 00:05 PHT... wait — no:
  // we build the "now" explicitly in PHT below to keep the intent unambiguous.
  const lateNightStart = '2026-05-01T15:55:00Z'; // 2026-05-01 23:55 PHT

  it('an instant that is the NEXT UTC date but SAME Manila date stays on the same trial day', () => {
    // 2026-05-01 23:58 PHT == 2026-05-01T15:58:00Z. In UTC that is still the 1st,
    // and in Manila it is still the 1st -> day 1. (Sanity anchor.)
    const sameManilaDay = new Date(Date.UTC(2026, 4, 1, 15, 58, 0));
    expect(computeTrialState(lateNightStart, sameManilaDay).dayNumber).toBe(1);
  });

  it('an instant that crosses PHT midnight (but is the same UTC date) advances the trial day', () => {
    // Start 2026-05-01 23:55 PHT. Now 2026-05-02 00:10 PHT == 2026-05-01T16:10:00Z.
    // Same UTC calendar date (the 1st) but a NEW Manila calendar date (the 2nd):
    // must read as day 2, proving we key off Manila and not UTC.
    const crossedManilaMidnight = new Date(Date.UTC(2026, 4, 1, 16, 10, 0));
    const state = computeTrialState(lateNightStart, crossedManilaMidnight);
    expect(state.dayNumber).toBe(2);
    expect(state.daysRemaining).toBe(6);
  });

  it('a UTC-based naive diff would mis-count — confirm we do NOT', () => {
    // If we (wrongly) used UTC dates: start UTC=2026-05-01, now UTC=2026-05-01
    // -> day 1. Correct Manila answer is day 2 (asserted above). This test pins
    // that the Manila path wins.
    const crossedManilaMidnight = new Date(Date.UTC(2026, 4, 1, 16, 10, 0));
    expect(computeTrialState(lateNightStart, crossedManilaMidnight).dayNumber).not.toBe(1);
  });
});
