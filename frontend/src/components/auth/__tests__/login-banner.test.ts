// ============================================================
// LoginBanner — decision-function tests (Sprint 16 fix-up)
// Feature: query-param-driven login banner
//
// Scope: locks the truth table for `decideLoginBanner()`, the pure
//        function that maps `?error=` → banner copy. The full React
//        component (Suspense + auto-dismiss + URL-cleanup) is
//        exercised in Playwright e2e for Sprint 17; here we lock
//        the copy + the load-bearing Apple 4.2 reviewer signal
//        (the biometric_failed branch).
//
// Reference: UX gap 1 from Sprint 16 batch-3 review; architect §4
//            (biometric hard-fallback copy).
// ============================================================

import { describe, it, expect } from 'vitest';
import { decideLoginBanner } from '../login-banner';

describe('decideLoginBanner', () => {
  // ===== Load-bearing branch — Apple 4.2 reviewer signal =====
  it('shows biometric_failed copy when ?error=biometric_failed', () => {
    const result = decideLoginBanner('biometric_failed');
    expect(result.show).toBe(true);
    if (!result.show) return; // narrow for TS
    expect(result.kind).toBe('biometric_failed');
    // Architect §4 copy — exact match. Editing this string requires
    // architect sign-off (it's the reviewer-visible explanation for
    // the silent sign-out after 3 failed biometric attempts).
    expect(result.body).toBe(
      'Sobrang dami ng failed na biometric. I-login mo ulit gamit ang OTP.'
    );
    expect(result.headline).toBe('Na-sign out ka muna para sa safety mo');
  });

  // ===== Sprint 15 auth-callback handoff =====
  it('shows auth_callback_error copy when ?error=auth_callback_error', () => {
    const result = decideLoginBanner('auth_callback_error');
    expect(result.show).toBe(true);
    if (!result.show) return;
    expect(result.kind).toBe('auth_callback_error');
    expect(result.body).toBe('Mag-login ka ulit gamit ang OTP code.');
    expect(result.headline).toBe('Hindi nagana ang link');
  });

  // ===== Default: no param, no banner =====
  it('hides when error param is absent (null)', () => {
    expect(decideLoginBanner(null)).toEqual({ show: false });
  });

  // ===== Unknown errors fall through silently =====
  // Defensive: a stray ?error=foo from a typo'd backend redirect
  // should NOT render a generic "something went wrong" — better to
  // be quiet than render English-default copy.
  it('hides for unrecognised error values', () => {
    expect(decideLoginBanner('something_else')).toEqual({ show: false });
    expect(decideLoginBanner('')).toEqual({ show: false });
  });
});
