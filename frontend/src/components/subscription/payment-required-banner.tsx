/**
 * Payment Required Banner — Amber warning shown during grace period
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Alert users that their payment failed and subscription will downgrade
 *
 * Shows conversational Filipino message with days remaining.
 * Taps on the banner navigate to payment resolution.
 *
 * Design: Uses secondary-container background (amber) with on-surface text.
 * No borders (No-Line Rule). Tonal layering for separation.
 * Minimum 44px touch target for mobile.
 */

'use client';

import type { GracePeriodResult } from '@/lib/subscriptions/types';

// ============================================================
// Props
// ============================================================

interface PaymentRequiredBannerProps {
  gracePeriod: GracePeriodResult;
  onResolvePayment?: () => void;
}

// ============================================================
// Component — Amber banner with grace period countdown
// ============================================================

export function PaymentRequiredBanner({
  gracePeriod,
  onResolvePayment,
}: PaymentRequiredBannerProps) {
  // --- Don't render if not in grace period ---
  if (!gracePeriod.inGracePeriod) {
    return null;
  }

  const daysText = gracePeriod.daysRemaining === 1
    ? '1 araw'
    : `${gracePeriod.daysRemaining} araw`;

  return (
    <div
      role="alert"
      className="mx-4 mt-3 rounded-xl bg-secondary-container px-4 py-3 min-h-[44px] flex items-center gap-3"
    >
      {/* --- Warning Icon --- */}
      <div className="flex-shrink-0 text-on-secondary-container">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>

      {/* --- Message --- */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-secondary-container leading-snug">
          May problema sa payment mo
        </p>
        <p className="text-xs text-on-secondary-container/80 mt-0.5">
          {daysText} na lang bago ma-downgrade ang account mo sa Free.
        </p>
      </div>

      {/* --- CTA Button --- */}
      {onResolvePayment && (
        <button
          type="button"
          onClick={onResolvePayment}
          className="flex-shrink-0 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs transition-colors hover:opacity-90 active:opacity-80"
        >
          Ayusin
        </button>
      )}
    </div>
  );
}
