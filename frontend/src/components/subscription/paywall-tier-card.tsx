'use client';

/**
 * PaywallTierCard — single tier card rendered 3x inside PaywallModal.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution).
 * Role:    Reusable tier offer card. Reads conversational Filipino copy
 *          from messages/fil.json via next-intl `useTranslations`. The
 *          three tier identifiers — 'starter' | 'pro_monthly' | 'pro_annual' —
 *          map to ProductIds in @/lib/iap/purchase (PRODUCT_TO_TIER).
 *
 * Design:  Mobile-first tonal card on surface-container-lowest. Plus
 *          Jakarta Sans, no borders (No-Line Rule), shadow-ambient,
 *          44px minimum touch target on CTA. `highlighted=true` (default
 *          for pro_annual) renders a primary-container outline ring +
 *          "Pinaka-sulit" badge.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §4 lines 690-751.
 */

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

// ============================================================
// Types
// ============================================================

export type PaywallTier = 'starter' | 'pro_monthly' | 'pro_annual';

export interface PaywallTierCardProps {
  tier: PaywallTier;
  /** When true, card renders the "Pinaka-sulit" badge + ring outline. Defaults true for pro_annual only. */
  highlighted?: boolean;
  /** Click handler — paywall modal wires this to purchasePackage(productId). */
  onPurchase: () => void;
  /** True while a purchase is in flight; disables the CTA so the user can't double-tap. */
  purchasing: boolean;
  /** Test id passthrough so the test suite can target a specific card without DOM rendering. */
  testId?: string;
}

// ============================================================
// Tier → product id binding. Keeps the SKU constants colocated with
// the card so a wrong-id wiring is a one-file blast radius.
// PRODUCT_TO_TIER in @/lib/iap/purchase.ts is the inverse map.
// ============================================================

export const TIER_TO_PRODUCT_ID: Record<PaywallTier, string> = {
  starter: 'akbai_starter_lifetime',
  pro_monthly: 'akbai_pro_monthly',
  pro_annual: 'akbai_pro_annual',
};

// ============================================================
// Component
// ============================================================

export function PaywallTierCard({
  tier,
  highlighted,
  onPurchase,
  purchasing,
  testId,
}: PaywallTierCardProps) {
  const t = useTranslations('paywall.cards');
  const tBadge = useTranslations('paywall.badge');

  // pro_annual is the default-highlighted card per architect §4 line 745.
  const isHighlighted = highlighted ?? tier === 'pro_annual';

  // Bullets is a string-array key. next-intl exposes raw via t.raw().
  const bullets = (t.raw(`${tier}.bullets`) as string[]) ?? [];

  // The starter card has an additional "Walang Kai sa Starter" note.
  // Other cards do not. We detect by attempting t.raw().
  let note: string | null = null;
  try {
    const candidate = t.raw(`${tier}.note`);
    if (typeof candidate === 'string') note = candidate;
  } catch {
    note = null;
  }

  return (
    <div
      className={`relative rounded-2xl bg-surface-container-lowest p-5 shadow-ambient ${
        isHighlighted ? 'ring-2 ring-primary-container' : ''
      }`}
      data-testid={testId ?? `paywall-tier-card-${tier}`}
      data-tier={tier}
      data-highlighted={isHighlighted ? 'true' : 'false'}
    >
      {/* ── "Pinaka-sulit" badge (annual default) ── */}
      {isHighlighted && (
        <span
          className="absolute -top-2 right-4 rounded-full bg-primary-container px-3 py-1 text-[11px] font-bold text-on-primary-container shadow-ambient"
          data-testid={`paywall-tier-card-${tier}-badge`}
        >
          {tBadge('most_worth_it')}
        </span>
      )}

      {/* ── Headline ── */}
      <h3
        className="text-on-surface text-lg font-bold leading-tight"
        data-testid={`paywall-tier-card-${tier}-title`}
      >
        {t(`${tier}.title`)}
      </h3>

      {/* ── Sub-headline (price) ── */}
      <p
        className="mt-1 text-sm text-on-surface-variant"
        data-testid={`paywall-tier-card-${tier}-subtitle`}
      >
        {t(`${tier}.subtitle`)}
      </p>

      {/* ── Bullet list ── */}
      <ul className="mt-4 space-y-2">
        {bullets.map((bullet, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2"
            data-testid={`paywall-tier-card-${tier}-bullet-${idx}`}
          >
            <Check
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-tertiary"
              aria-hidden="true"
            />
            <span className="text-sm text-on-surface-variant">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* ── Optional bottom note (Starter only by default) ── */}
      {note && (
        <p
          className="mt-3 text-[12px] italic text-on-surface-variant"
          data-testid={`paywall-tier-card-${tier}-note`}
        >
          {note}
        </p>
      )}

      {/* ── CTA button — 44px min height per Sprint 16 mobile rule ── */}
      <button
        type="button"
        onClick={onPurchase}
        disabled={purchasing}
        className="mt-5 w-full min-h-[44px] rounded-xl bg-primary-container py-3 text-sm font-bold text-on-primary-container transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
        data-testid={`paywall-tier-card-${tier}-cta`}
        aria-label={t(`${tier}.cta`)}
      >
        {purchasing ? '…' : t(`${tier}.cta`)}
      </button>
    </div>
  );
}
