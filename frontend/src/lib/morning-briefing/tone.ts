/**
 * Morning Briefing — D6 Tonal Rotation
 * Feature: Phase 7 Kumustahan hero (locked 2026-04-26)
 * Role: Deterministic tone selection so the same user sees the same tone
 *       for the same Manila calendar day.
 *
 * Selection rule: dayOfYear(briefing_date) % 3
 *   0 -> energetic   (punchy, action-leaning)
 *   1 -> observant   (calm, noticing)
 *   2 -> celebratory (warm, recognising progress)
 *
 * Why dayOfYear (not date hash): predictable rotation across the calendar so
 * the cadence feels natural — three-day cycle with clean weekly drift. No
 * RNG, no timezone wobble — `briefingDate` is already a Manila YYYY-MM-DD.
 */

import type { MorningTone } from './types';

const TONE_BY_INDEX: readonly MorningTone[] = [
  'energetic',
  'observant',
  'celebratory',
] as const;

/**
 * 1-indexed day of year (Jan 1 = 1) for a YYYY-MM-DD string interpreted as
 * a Manila calendar date. Implemented in UTC arithmetic to avoid host-tz drift —
 * the input is already Manila-localised.
 */
export function dayOfYear(briefingDate: string): number {
  const d = new Date(briefingDate + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid briefingDate (expected YYYY-MM-DD): ${briefingDate}`);
  }
  const startOfYear = Date.UTC(d.getUTCFullYear(), 0, 1);
  const diffMs = d.getTime() - startOfYear;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Pick the tone for a given Manila calendar date.
 * Deterministic — same date always produces the same tone.
 */
export function pickTone(briefingDate: string): MorningTone {
  const idx = (dayOfYear(briefingDate) - 1) % TONE_BY_INDEX.length;
  // dayOfYear is >= 1, so (dayOfYear - 1) >= 0 — % is safe (non-negative)
  return TONE_BY_INDEX[idx];
}
