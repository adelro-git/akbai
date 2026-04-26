/**
 * Unit Tests — D6 Tonal Rotation
 * Feature: Phase 7 Kumustahan hero (locked 2026-04-26)
 *
 * Verifies determinism (same date → same tone) and boundary correctness
 * (year roll-over, leap year, dayOfYear modulo 3 mapping).
 */

import { describe, it, expect } from 'vitest';
import { pickTone, dayOfYear } from '../tone';

describe('dayOfYear', () => {
  it('returns 1 for January 1st', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
  });

  it('returns 31 for January 31st', () => {
    expect(dayOfYear('2026-01-31')).toBe(31);
  });

  it('returns 32 for February 1st', () => {
    expect(dayOfYear('2026-02-01')).toBe(32);
  });

  it('returns 365 for December 31st in a non-leap year', () => {
    // 2026 is not a leap year
    expect(dayOfYear('2026-12-31')).toBe(365);
  });

  it('returns 366 for December 31st in a leap year', () => {
    // 2024 is a leap year
    expect(dayOfYear('2024-12-31')).toBe(366);
  });

  it('returns 60 for March 1st in a leap year (Feb 29 counted)', () => {
    expect(dayOfYear('2024-03-01')).toBe(61);
  });

  it('throws on invalid date string', () => {
    expect(() => dayOfYear('not-a-date')).toThrow(/Invalid briefingDate/);
  });
});

describe('pickTone', () => {
  // --- Determinism: same date always produces the same tone ---

  it('is deterministic — same date returns the same tone', () => {
    const date = '2026-04-26';
    const a = pickTone(date);
    const b = pickTone(date);
    const c = pickTone(date);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  // --- Modulo-3 mapping: dayOfYear → tone ---

  it('day 1 (Jan 1) → energetic (index 0)', () => {
    // dayOfYear=1, (1-1) % 3 = 0 → 'energetic'
    expect(pickTone('2026-01-01')).toBe('energetic');
  });

  it('day 2 (Jan 2) → observant (index 1)', () => {
    // dayOfYear=2, (2-1) % 3 = 1 → 'observant'
    expect(pickTone('2026-01-02')).toBe('observant');
  });

  it('day 3 (Jan 3) → celebratory (index 2)', () => {
    // dayOfYear=3, (3-1) % 3 = 2 → 'celebratory'
    expect(pickTone('2026-01-03')).toBe('celebratory');
  });

  it('day 4 (Jan 4) → energetic (cycle repeats)', () => {
    // dayOfYear=4, (4-1) % 3 = 0 → 'energetic'
    expect(pickTone('2026-01-04')).toBe('energetic');
  });

  // --- Year boundary: Dec 31 vs Jan 1 ---

  it('rotates correctly across year boundary in non-leap year', () => {
    // 2026-12-31: dayOfYear=365, (365-1) % 3 = 364 % 3 = 1 → observant
    expect(pickTone('2026-12-31')).toBe('observant');
    // 2027-01-01: dayOfYear=1, (1-1) % 3 = 0 → energetic
    expect(pickTone('2027-01-01')).toBe('energetic');
  });

  it('handles leap-year boundary (2024)', () => {
    // 2024-02-29: dayOfYear=60, (60-1) % 3 = 59 % 3 = 2 → celebratory
    expect(pickTone('2024-02-29')).toBe('celebratory');
    // 2024-03-01: dayOfYear=61, (61-1) % 3 = 60 % 3 = 0 → energetic
    expect(pickTone('2024-03-01')).toBe('energetic');
  });

  it('Phase 7 lock day (2026-04-26) maps to a known tone', () => {
    // 2026-04-26: Jan(31)+Feb(28)+Mar(31)+Apr(26) = 116
    // (116-1) % 3 = 115 % 3 = 1 → observant
    expect(pickTone('2026-04-26')).toBe('observant');
    expect(dayOfYear('2026-04-26')).toBe(116);
  });

  // --- All 3 tones appear in any 3-day window ---

  it('produces all three tones in any consecutive 3-day window', () => {
    const tones = new Set([
      pickTone('2026-04-26'),
      pickTone('2026-04-27'),
      pickTone('2026-04-28'),
    ]);
    expect(tones.size).toBe(3);
    expect(tones.has('energetic')).toBe(true);
    expect(tones.has('observant')).toBe(true);
    expect(tones.has('celebratory')).toBe(true);
  });
});
