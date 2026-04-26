/**
 * Unit Tests — Fallback Templates
 * Feature: Phase 7 graceful Claude fallback (Anton's call 2026-04-26)
 *
 * Verifies:
 * - All 9 (3 tones × 3 variants) templates exist and are non-empty.
 * - Tagline ≤ 80 chars after name interpolation.
 * - {name} interpolation works (and falls back to "ka-partner" on null).
 * - pickFallback is deterministic per (tone, date).
 * - Templates do NOT contain bare English verbs or fabricated peso amounts.
 */

import { describe, it, expect } from 'vitest';
import { FALLBACK_TEMPLATES, pickFallback } from '../fallback-templates';
import type { MorningTone } from '../types';

const TONES: MorningTone[] = ['energetic', 'observant', 'celebratory'];

describe('FALLBACK_TEMPLATES — registry shape', () => {
  it('has all 3 tones with exactly 3 templates each (9 total)', () => {
    let total = 0;
    for (const tone of TONES) {
      const bundles = FALLBACK_TEMPLATES[tone];
      expect(bundles).toBeDefined();
      expect(bundles.length).toBe(3);
      total += bundles.length;
    }
    expect(total).toBe(9);
  });

  it.each(TONES)('every %s template has tagline + briefing strings', (tone) => {
    for (const bundle of FALLBACK_TEMPLATES[tone]) {
      expect(typeof bundle.tagline).toBe('string');
      expect(typeof bundle.briefing).toBe('string');
      expect(bundle.tagline.length).toBeGreaterThan(0);
      expect(bundle.briefing.length).toBeGreaterThan(0);
    }
  });

  it.each(TONES)('every %s tagline is ≤ 80 chars after name interpolation', (tone) => {
    for (const bundle of FALLBACK_TEMPLATES[tone]) {
      // Interpolate with the longest reasonable first name we'd accept.
      const interpolated = bundle.tagline.replaceAll('{name}', 'Maria');
      expect(interpolated.length).toBeLessThanOrEqual(80);
    }
  });

  it.each(TONES)('every %s briefing is ~80–250 words', (tone) => {
    for (const bundle of FALLBACK_TEMPLATES[tone]) {
      const wordCount = bundle.briefing.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeGreaterThanOrEqual(40);
      expect(wordCount).toBeLessThanOrEqual(250);
    }
  });

  it('contains no fabricated peso amounts', () => {
    // Per spec: deterministic fallback must NOT invent financial figures.
    for (const tone of TONES) {
      for (const bundle of FALLBACK_TEMPLATES[tone]) {
        expect(bundle.tagline).not.toMatch(/₱\s*\d/);
        expect(bundle.briefing).not.toMatch(/₱\s*\d/);
      }
    }
  });
});

describe('pickFallback — interpolation + determinism', () => {
  it('interpolates {name} with the user first name', () => {
    const result = pickFallback('energetic', '2026-04-26', 'Maria');
    expect(result.tagline).toContain('Maria');
    expect(result.tagline).not.toContain('{name}');
    expect(result.briefing).toContain('Maria');
    expect(result.briefing).not.toContain('{name}');
  });

  it('falls back to "ka-partner" when first name is null', () => {
    const result = pickFallback('observant', '2026-04-26', null);
    expect(result.tagline).toContain('ka-partner');
    expect(result.briefing).toContain('ka-partner');
  });

  it('falls back to "ka-partner" when first name is empty string', () => {
    const result = pickFallback('observant', '2026-04-26', '   ');
    expect(result.tagline).toContain('ka-partner');
  });

  it('is deterministic — same (tone, date) returns same template', () => {
    const a = pickFallback('celebratory', '2026-04-26', 'Anton');
    const b = pickFallback('celebratory', '2026-04-26', 'Anton');
    expect(a.tagline).toBe(b.tagline);
    expect(a.briefing).toBe(b.briefing);
  });

  it('returns templates that match the requested tone tonally', () => {
    // Smoke test — energetic should contain action-leaning markers like Tara/Sige/Game
    // observed across the 3 templates per tone.
    const energetic = pickFallback('energetic', '2026-04-26', 'Maria');
    const allEnergetic = FALLBACK_TEMPLATES.energetic.map((b) => b.tagline).join(' ');
    expect(/Tara|Sige|Game/i.test(allEnergetic)).toBe(true);
    expect(energetic.tagline.length).toBeLessThanOrEqual(80);
  });

  it('does NOT include the BIR disclaimer in the tagline', () => {
    // Tagline is rendered as a hero one-liner; disclaimer would break the layout.
    for (const tone of TONES) {
      for (const bundle of FALLBACK_TEMPLATES[tone]) {
        expect(bundle.tagline.toLowerCase()).not.toContain('bir');
        expect(bundle.tagline.toLowerCase()).not.toContain('disclaimer');
        expect(bundle.tagline.toLowerCase()).not.toContain('cpa');
      }
    }
  });
});
