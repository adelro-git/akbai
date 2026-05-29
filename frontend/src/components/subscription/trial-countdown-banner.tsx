'use client';

/**
 * TrialCountdownBanner — visible 7-day free-trial countdown (Sprint 18, §11 gate)
 * Feature: Pre-Launch Readiness
 * Role: From day 1, show how many trial days are left; nudge harder on the final
 *       day; and once the trial has expired, surface the PaywallModal. The actual
 *       feature-locking is enforced server-side — this banner is the VISIBLE prompt
 *       that satisfies "Trial-countdown banner visible from day 1, days-remaining
 *       updates daily, paywall trigger at day 7."
 *
 * Visibility rules:
 *   - Paid tiers (starter / pro / business / scale): renders null. The countdown
 *     only matters while the user is on the free trial.
 *   - Trialing (day 1..6): amber info banner, "May [N] araw na lang sa free trial mo."
 *   - Final day (1 day remaining): stronger amber nudge + explicit subscribe CTA.
 *   - Expired (day 8+): renders the destructive-toned prompt AND opens the
 *     PaywallModal (source='manual') so the user can subscribe immediately.
 *
 * Pattern parity with chat/free-tier-banner.tsx:
 *   - tonal background (No-Line Rule), shadow-ambient, design tokens (no hex)
 *   - role="alert" / "status" so screen readers announce the countdown
 *   - mobile-first, 44px min touch target on the CTA, no truncation at 375px
 *
 * Trial state source: pass `trialState` from computeTrialState(subscription.started_at)
 *   — see lib/subscriptions/trial.ts. The parent (PM-wired dashboard/layout) fetches
 *   the subscription row server-side and computes the state, keeping this component
 *   a pure presentational client component.
 *
 * i18n: copy lives under the `trialCountdown` namespace (keys reported to PM — this
 *   stream does not edit messages/*.json).
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PaywallModal } from './paywall-modal';
import type { TrialState } from '@/lib/subscriptions/trial';

// ============================================================
// Props
// ============================================================

export interface TrialCountdownBannerProps {
  /** Derived trial state from computeTrialState(subscription.started_at). */
  trialState: TrialState;
  /**
   * The user's subscription tier. Paid tiers suppress the banner entirely —
   * the countdown is only meaningful while the user is still on the free trial.
   */
  tier: string;
}

// Tiers that have already paid: never show a trial countdown to them.
const PAID_TIERS = new Set(['starter', 'pro', 'business', 'scale']);

// ============================================================
// Component
// ============================================================

export function TrialCountdownBanner({ trialState, tier }: TrialCountdownBannerProps) {
  const t = useTranslations('trialCountdown');
  const [paywallOpen, setPaywallOpen] = useState(false);

  // --- Paid tiers: nothing to count down. ---
  if (PAID_TIERS.has(tier)) return null;

  const { daysRemaining, expired } = trialState;

  // --- Expired (day 8+): destructive prompt + paywall trigger. ---
  if (expired) {
    return (
      <>
        <div
          className="mx-4 mb-2 rounded-xl bg-error-container/30 px-4 py-3 shadow-ambient"
          data-testid="trial-countdown-expired"
          role="alert"
        >
          <p className="text-sm font-medium text-on-surface">{t('expired.title')}</p>
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-primary underline underline-offset-2"
            data-testid="trial-countdown-expired-cta"
          >
            {t('expired.cta')}
          </button>
        </div>

        <PaywallModal
          open={paywallOpen}
          source="manual"
          onClose={() => setPaywallOpen(false)}
        />
      </>
    );
  }

  // --- Final day (1 day remaining): stronger nudge + subscribe CTA. ---
  if (daysRemaining <= 1) {
    return (
      <>
        <div
          className="mx-4 mb-2 rounded-xl bg-primary-container/15 px-4 py-3 shadow-ambient"
          data-testid="trial-countdown-final-day"
          role="alert"
        >
          <p className="text-sm font-medium text-on-surface">{t('finalDay.title')}</p>
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-primary underline underline-offset-2"
            data-testid="trial-countdown-final-day-cta"
          >
            {t('finalDay.cta')}
          </button>
        </div>

        <PaywallModal
          open={paywallOpen}
          source="manual"
          onClose={() => setPaywallOpen(false)}
        />
      </>
    );
  }

  // --- Active trial (day 1..6, 2-7 days remaining): amber info banner. ---
  return (
    <div
      className="mx-4 mb-2 rounded-xl bg-primary-container/10 px-4 py-3 shadow-ambient"
      data-testid="trial-countdown-active"
      role="status"
    >
      <p className="text-sm font-medium text-on-surface-variant">
        {t('active.message', { count: daysRemaining })}
      </p>
    </div>
  );
}

export default TrialCountdownBanner;
