'use client';

// ============================================================
// LoginBanner — query-param-driven notice above the login form
// Sprint 16 fix-up (UX gap 1): the (app) layout hard-redirects to
// `/login?error=biometric_failed` after 3 consecutive biometric
// failures (architect §4 + §7 #3); the login page must explain
// the silent sign-out, otherwise it reads as a crash. This is the
// load-bearing Apple Guideline 4.2 reviewer signal.
//
// Also handles `?error=auth_callback_error` emitted by the
// /auth/callback page (Sprint 15) — same surface, different copy.
//
// Conversational Filipino (CLAUDE.md rule 5): Filipinized verbs
// (i-login), second-position enclitic, no "this time/again" English
// hedges. Architect-locked strings come from architect §4 and a
// copy-guide-aligned auth_callback_error message.
//
// Style (design-system.md): No-Line Rule. surface-container-lowest
// background + shadow-ambient for elevation; a secondary-container
// chip for the warning glyph — NOT an error-container chip, because
// this is "we signed you out for your safety", not "you failed".
//
// Behaviour:
//   - Auto-dismiss after 8s (visible but not sticky).
//   - Dismiss early when the user starts interacting with the page
//     (any keydown — typing the OTP triggers it) OR taps the X.
//   - One-shot per pageload: dismiss clears the param from the URL
//     so a refresh doesn't re-show it.
// ============================================================

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, ShieldAlert } from 'lucide-react';

// ============================================================
// Pure decision function — extracted so we can unit-test the
// query-param → banner-state mapping without rendering React.
// Returning a discriminated union keeps the consumer exhaustive.
// ============================================================

export type LoginBannerKind = 'biometric_failed' | 'auth_callback_error';

export type LoginBannerDecision =
  | { show: true; kind: LoginBannerKind; headline: string; body: string }
  | { show: false };

export function decideLoginBanner(errorParam: string | null): LoginBannerDecision {
  if (errorParam === 'biometric_failed') {
    // Architect §4-locked copy. Filipino syntactic frame:
    // "Sobrang dami" (intensifier-first, common spoken FIL), VSO
    // "I-login mo ulit", enclitic "mo" in second position.
    return {
      show: true,
      kind: 'biometric_failed',
      headline: 'Na-sign out ka muna para sa safety mo',
      body: 'Sobrang dami ng failed na biometric. I-login mo ulit gamit ang OTP.',
    };
  }
  if (errorParam === 'auth_callback_error') {
    // Copy-guide-aligned (auth section §11). Filipinized "i-login",
    // enclitic "ka" in second position, "ulit" as the natural
    // Filipino "again" (not "again" English).
    return {
      show: true,
      kind: 'auth_callback_error',
      headline: 'Hindi nagana ang link',
      body: 'Mag-login ka ulit gamit ang OTP code.',
    };
  }
  return { show: false };
}

// ============================================================
// LoginBanner — Suspense-wrapped public export. The inner
// component reads useSearchParams() which Next 16 static-export
// requires under <Suspense> (see sprint-15-conversion-pattern §9).
// ============================================================

export default function LoginBanner() {
  return (
    <Suspense fallback={null}>
      <LoginBannerInner />
    </Suspense>
  );
}

function LoginBannerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorParam = searchParams.get('error');
  const decision = decideLoginBanner(errorParam);
  const [dismissed, setDismissed] = useState(false);

  // ----------------------------------------------------------
  // Auto-dismiss (8s) + early dismiss on first keydown.
  // Both clear the `?error=` param so a refresh doesn't re-show.
  // ----------------------------------------------------------
  useEffect(() => {
    if (!decision.show || dismissed) return;

    const clear = () => {
      setDismissed(true);
      // Remove the ?error= param without a navigation jump. We
      // rebuild the param string from the existing searchParams
      // so we don't drop unrelated ones a future caller might add.
      const next = new URLSearchParams(searchParams.toString());
      next.delete('error');
      const qs = next.toString();
      router.replace(qs ? `/login?${qs}` : '/login');
    };

    const timer = window.setTimeout(clear, 8000);
    const onKey = () => clear();
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [decision.show, dismissed, router, searchParams]);

  if (!decision.show || dismissed) return null;

  return (
    <div
      // surface-container-lowest + shadow-ambient = "lifted focal
      // card" per design-system.md §Elevation. No border (No-Line Rule).
      className="bg-surface-container-lowest shadow-ambient rounded-2xl px-4 py-3.5 flex items-start gap-3"
      data-testid="login-banner"
      data-banner-kind={decision.kind}
      role="status"
      aria-live="polite"
    >
      <div
        // Secondary-container chip — warm, not alarming. The shield
        // glyph reads as "safety", aligned with the headline framing.
        className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container"
        aria-hidden
      >
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold text-on-surface leading-snug"
          data-testid="login-banner-headline"
        >
          {decision.headline}
        </p>
        <p
          className="mt-1 text-[13px] text-on-surface-variant leading-snug"
          data-testid="login-banner-body"
        >
          {decision.body}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Isara"
        // 44px hit area per design-system.md mobile tap-target floor.
        // Negative offset keeps the X visually in the corner without
        // stretching the card padding.
        className="flex-shrink-0 -mt-1 -mr-1 w-11 h-11 inline-flex items-center justify-center text-on-surface-variant"
        data-testid="login-banner-close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
