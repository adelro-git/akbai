// ============================================================
// week-bounds.test.ts — Phase 7 Manila ISO-week boundary helpers.
// ============================================================

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-22', // Wednesday for default tests
}));

import {
  enumerateWeekDates,
  getMondayOf,
  getSundayOf,
  getManilaWeekBounds,
  FIL_DAY_LABELS,
} from '../week-bounds';

describe('getMondayOf / getSundayOf', () => {
  it('returns the same Monday when given a Monday', () => {
    // 2026-04-20 is a Monday.
    expect(getMondayOf('2026-04-20')).toBe('2026-04-20');
    expect(getSundayOf('2026-04-20')).toBe('2026-04-26');
  });

  it('walks back to Monday from a Wednesday', () => {
    expect(getMondayOf('2026-04-22')).toBe('2026-04-20');
    expect(getSundayOf('2026-04-22')).toBe('2026-04-26');
  });

  it('treats Sunday as the END of the prior Monday-based week', () => {
    // 2026-04-26 Sunday — Monday should be 2026-04-20.
    expect(getMondayOf('2026-04-26')).toBe('2026-04-20');
    expect(getSundayOf('2026-04-26')).toBe('2026-04-26');
  });

  it('walks across a month boundary correctly', () => {
    // 2026-05-01 is a Friday — Monday-of is 2026-04-27.
    expect(getMondayOf('2026-05-01')).toBe('2026-04-27');
    expect(getSundayOf('2026-05-01')).toBe('2026-05-03');
  });

  it('walks across a year boundary correctly', () => {
    // 2026-01-02 is a Friday — Monday-of is 2025-12-29.
    expect(getMondayOf('2026-01-02')).toBe('2025-12-29');
    expect(getSundayOf('2026-01-02')).toBe('2026-01-04');
  });
});

describe('getManilaWeekBounds', () => {
  it('uses getManilaToday() when no argument is passed', () => {
    const { week_start, week_end } = getManilaWeekBounds();
    expect(week_start).toBe('2026-04-20');
    expect(week_end).toBe('2026-04-26');
  });

  it('honors an explicit `today` override', () => {
    const { week_start, week_end } = getManilaWeekBounds('2026-04-26');
    expect(week_start).toBe('2026-04-20');
    expect(week_end).toBe('2026-04-26');
  });
});

describe('enumerateWeekDates', () => {
  it('returns 7 sequential entries Mon..Sun', () => {
    const dates = enumerateWeekDates('2026-04-20');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-04-20');
    expect(dates[6]).toBe('2026-04-26');
  });

  it('crosses a month boundary cleanly', () => {
    const dates = enumerateWeekDates('2026-04-27');
    expect(dates[0]).toBe('2026-04-27');
    expect(dates[4]).toBe('2026-05-01');
    expect(dates[6]).toBe('2026-05-03');
  });
});

describe('FIL_DAY_LABELS', () => {
  it('maps Mon..Sun to Filipino abbreviations', () => {
    expect(FIL_DAY_LABELS).toEqual(['Lun', 'Mar', 'Miy', 'Hue', 'Bie', 'Sab', 'Lin']);
  });
});
