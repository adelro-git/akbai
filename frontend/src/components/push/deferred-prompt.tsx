'use client';

/**
 * DeferredPrompt — Native push permission deferred-prompt UI
 * Feature: Native Push Notifications (Sprint 16, Gap G4 mitigation)
 * Role: Contextual in-app card asking the user to enable native push BEFORE
 *       firing the OS permission dialog. Apple Guideline 4.5.4 + Google Play
 *       both reject apps that prompt for push on first launch without context;
 *       this card is the explanation surface that turns a cold OS prompt into
 *       a contextual one.
 *
 * Trigger contract (architect §3 Open Q 2 recommendation (a)):
 *   - User is on /deadlines AND
 *   - At least one deadline is due within 14 days AND
 *   - Capacitor.isNativePlatform() is true (web continues with existing
 *     Web Push register path via lib/push/register.ts) AND
 *   - localStorage flag `akbai_push_prompted_at` is absent (one-shot).
 *
 * Two outcomes:
 *   - Primary  → registerNativePush() (fires the OS dialog), sets `akbai_push_prompted_at`
 *   - Dismiss  → sets `akbai_push_dismissed_at` (Sprint 19 hardening: 30-day re-prompt grace)
 *
 * Conversational Filipino copy locked per architect §3 + copy guide §3 (Filipino
 * syntactic frame: VSO, second-position enclitics, Filipinized verbs, no English SVO).
 *
 * Reference: sprint-16-native-plugin-pattern.md §3 (permission UX flow).
 */

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { registerNativePush } from '@/lib/push/capacitor-push';

// ============================================================
// LocalStorage keys — one-shot prompt + dismissed-at audit.
// Exported so tests can clear them between cases.
// ============================================================

export const PUSH_PROMPTED_AT_KEY = 'akbai_push_prompted_at';
export const PUSH_DISMISSED_AT_KEY = 'akbai_push_dismissed_at';

// ============================================================
// Helper — should the card render at all?
// Pure function so tests can drive it without rendering React.
// Inputs: imminent-deadline signal, Capacitor.isNativePlatform() result,
// localStorage snapshot. Returning a discriminated reason makes the
// telemetry easier to reason about (Sprint 17 analytics will log this).
// ============================================================

export type DeferredPromptDecision =
  | { show: true }
  | { show: false; reason: 'not-native' | 'no-imminent-deadline' | 'already-prompted' };

export function shouldShowDeferredPrompt(input: {
  hasImminentDeadline: boolean;
  isNative: boolean;
  promptedAt: string | null;
}): DeferredPromptDecision {
  if (!input.isNative) return { show: false, reason: 'not-native' };
  if (!input.hasImminentDeadline) return { show: false, reason: 'no-imminent-deadline' };
  if (input.promptedAt) return { show: false, reason: 'already-prompted' };
  return { show: true };
}

// ============================================================
// Component props — fed by the parent (/deadlines page) which already
// computes the within-14-days signal from its deadlines fetch.
// ============================================================

interface DeferredPromptProps {
  /** True if the user has at least one deadline due within 14 days. */
  hasImminentDeadline: boolean;
}

// ============================================================
// DeferredPrompt — banner-style card. Mobile-first; matches /deadlines
// surface (rounded-2xl, surface-container-low, ambient shadow).
// ============================================================

export default function DeferredPrompt({ hasImminentDeadline }: DeferredPromptProps) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Decide on mount + when imminent-deadline signal flips on ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const decision = shouldShowDeferredPrompt({
      hasImminentDeadline,
      isNative: Capacitor.isNativePlatform(),
      promptedAt: window.localStorage.getItem(PUSH_PROMPTED_AT_KEY),
    });

    setVisible(decision.show);
  }, [hasImminentDeadline]);

  if (!visible) return null;

  // --- Primary CTA: fire the OS prompt via registerNativePush() ---
  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await registerNativePush();
      // Mark prompted regardless of grant — we only ever ask once.
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PUSH_PROMPTED_AT_KEY, new Date().toISOString());
      }
      if (!result.success) {
        setError(
          result.error ??
            'Hindi naka-rehistro ang push notifications mo. Subukan muli sa Settings.'
        );
        setBusy(false);
        return;
      }
      // On grant the listener inside capacitor-push.ts handles the POST.
      setVisible(false);
    } catch {
      setError('Hindi naka-rehistro ang push notifications mo. Subukan muli sa Settings.');
      setBusy(false);
    }
  };

  // --- Secondary CTA: dismiss for now (Sprint 19 hardens with a 30-day grace) ---
  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PUSH_DISMISSED_AT_KEY, new Date().toISOString());
    }
    setVisible(false);
  };

  return (
    <div
      className="mb-4 rounded-2xl bg-surface-container-low shadow-ambient px-4 py-4"
      data-testid="push-deferred-prompt"
      role="region"
      aria-label="Push notifications prompt"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full bg-honey-cream flex items-center justify-center text-honey-deep"
          aria-hidden
        >
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-semibold text-on-surface mb-1 leading-snug"
            data-testid="push-prompt-headline"
          >
            Gusto mo bang i-paalala ng AKBai ang BIR deadlines mo?
          </h3>
          <p
            className="text-[13px] text-ink-soft leading-snug"
            data-testid="push-prompt-body"
          >
            Magpapadala kami ng notification 7 araw, 3 araw, at 1 araw bago mag-due
            ang mga form mo. Puwede mong i-off kahit kailan sa Settings.
          </p>
          {error && (
            <p
              className="mt-2 text-[12px] text-red-600"
              data-testid="push-prompt-error"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="inline-flex items-center justify-center min-h-[44px] px-4 bg-honey-deep text-white text-[13px] font-semibold rounded-xl shadow-ambient disabled:opacity-60"
              data-testid="push-prompt-enable"
            >
              {busy ? 'Saglit lang...' : 'Sige, paalalahanan mo ako'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              disabled={busy}
              className="inline-flex items-center justify-center min-h-[44px] px-3 text-[13px] font-medium text-on-surface-variant disabled:opacity-60"
              data-testid="push-prompt-dismiss"
            >
              Hindi, salamat
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={busy}
          aria-label="Isara"
          className="flex-shrink-0 -mt-1 -mr-1 w-9 h-9 inline-flex items-center justify-center text-on-surface-variant disabled:opacity-60"
          data-testid="push-prompt-close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
