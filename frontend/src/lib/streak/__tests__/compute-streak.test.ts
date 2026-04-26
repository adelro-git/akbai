// ============================================================
// compute-streak.test.ts — Phase 7 daily-check-in streak walk.
// ============================================================

import { describe, it, expect } from 'vitest';
import { computeStreak } from '../compute-streak';

describe('computeStreak', () => {
  const today = '2026-04-22'; // Wednesday — exact day doesn't matter

  it('returns fresh + 0 when the user has no check-ins ever', () => {
    expect(computeStreak([], today)).toEqual({ streak: 0, status: 'fresh' });
  });

  it('returns active + 1 when only today exists', () => {
    expect(computeStreak([today], today)).toEqual({ streak: 1, status: 'active' });
  });

  it('returns active + 2 when today and yesterday exist', () => {
    expect(
      computeStreak(['2026-04-22', '2026-04-21'], today),
    ).toEqual({ streak: 2, status: 'active' });
  });

  it('walks back through 5 consecutive days', () => {
    const dates = [
      '2026-04-22',
      '2026-04-21',
      '2026-04-20',
      '2026-04-19',
      '2026-04-18',
    ];
    expect(computeStreak(dates, today)).toEqual({ streak: 5, status: 'active' });
  });

  it('stops at the first gap', () => {
    // Yesterday + a much-earlier orphan run.
    const dates = ['2026-04-21', '2026-04-15', '2026-04-14'];
    expect(computeStreak(dates, today)).toEqual({ streak: 1, status: 'active' });
  });

  it('treats yesterday-only as an active streak (today still in progress)', () => {
    expect(computeStreak(['2026-04-21'], today)).toEqual({ streak: 1, status: 'active' });
  });

  it('returns reset + 0 when yesterday is missing but a prior streak existed', () => {
    // Last check-in was 3 days ago — neither today nor yesterday exists.
    const dates = ['2026-04-19', '2026-04-18'];
    expect(computeStreak(dates, today)).toEqual({ streak: 0, status: 'reset' });
  });

  it('caps the streak at 30 to keep render math small', () => {
    // Generate 60 consecutive days back from today.
    const dates: string[] = [];
    for (let i = 0; i < 60; i += 1) {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    const result = computeStreak(dates, today);
    expect(result.status).toBe('active');
    expect(result.streak).toBe(30);
  });

  it('handles unsorted input lists', () => {
    const dates = ['2026-04-20', '2026-04-22', '2026-04-21'];
    expect(computeStreak(dates, today)).toEqual({ streak: 3, status: 'active' });
  });
});
