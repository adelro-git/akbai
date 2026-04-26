import { describe, it, expect } from 'vitest';
import { isLocale, locales, defaultLocale } from '@/lib/i18n/config';

// ============================================================
// Phase 5 — LanguageToggle pill (FIL/EN). The component itself
// composes next-intl + the `setLocaleCookie` server action.
// We test the locale guard the toggle relies on so it can never
// dispatch an invalid locale, plus the supported set.
// ============================================================

describe('LanguageToggle — locale guard', () => {
  it('accepts the two supported locales', () => {
    expect(isLocale('fil')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('rejects unknown locales', () => {
    expect(isLocale('tl')).toBe(false);
    expect(isLocale('es')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('exposes exactly two locales — chrome cannot grow without a code change', () => {
    expect(locales).toHaveLength(2);
    expect(locales).toEqual(['fil', 'en']);
  });

  it('defaults to Filipino (the brand language)', () => {
    expect(defaultLocale).toBe('fil');
  });
});
