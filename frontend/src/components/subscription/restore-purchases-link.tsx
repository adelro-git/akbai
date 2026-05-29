'use client';

/**
 * RestorePurchasesLink — Apple Guideline 3.1.1 mandated restore CTA.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2).
 * Role:    Reusable inline link mounted in BOTH the PaywallModal footer
 *          AND the /profile Settings row. Tap → restorePurchases() →
 *          toast keyed by the returned messageKey (or success key).
 *
 * Branches:
 *   - Native + restore success(pro)     → toast 'iap.success.restore', then close paywall (if onSuccess provided)
 *   - Native + restore success(starter) → toast 'iap.success.restore', then close paywall (if onSuccess provided)
 *   - Native + nothing_to_restore       → toast 'iap.error.nothing_to_restore' (stay open)
 *   - Native + unknown                  → toast 'iap.error.unknown' (stay open)
 *   - Web                               → toast 'iap.error.web_only'
 *
 * Apple Guideline 3.1.1: the link must be VISIBLE (not collapsed into
 * a "More" drawer) on the paywall AND on /profile. Anton's Sprint 19
 * App Store submission depends on this.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §4 lines 752-770.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { restorePurchases } from '@/lib/iap/purchase';
import type { PurchaseResult } from '@/lib/iap/purchase';

// ============================================================
// Props
// ============================================================

export interface RestorePurchasesLinkProps {
  /** Called on successful restore with the resolved tier. PaywallModal uses this to close. */
  onSuccess?: (tier: 'pro' | 'starter') => void;
  /** Inline toast renderer. The paywall + /profile both provide a toast helper; defaults to alert() so tests can spy. */
  onToast?: (key: string, kind: 'success' | 'error') => void;
  /** Optional className passthrough — paywall footer vs settings row differ. */
  className?: string;
  /** Test id passthrough. */
  testId?: string;
}

// ============================================================
// Pure handler — exported for test isolation. Given a PurchaseResult
// + the optional callbacks, dispatches the toast + onSuccess.
// ============================================================

export function handleRestoreResult(
  result: PurchaseResult,
  onSuccess?: (tier: 'pro' | 'starter') => void,
  onToast?: (key: string, kind: 'success' | 'error') => void,
): void {
  if (result.status === 'success') {
    onToast?.('iap.success.restore', 'success');
    onSuccess?.(result.tier);
    return;
  }
  if (result.status === 'cancelled') {
    // restorePurchases() does not produce 'cancelled' — guard anyway.
    return;
  }
  // status === 'error'
  onToast?.(result.messageKey, 'error');
}

// ============================================================
// Component
// ============================================================

export function RestorePurchasesLink({
  onSuccess,
  onToast,
  className,
  testId,
}: RestorePurchasesLinkProps) {
  const t = useTranslations('paywall.cta');
  const [restoring, setRestoring] = useState(false);

  async function handleTap() {
    if (restoring) return;
    setRestoring(true);
    try {
      const result = await restorePurchases();
      handleRestoreResult(result, onSuccess, onToast);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={restoring}
      className={
        className ??
        'min-h-[44px] text-sm text-on-surface-variant underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50'
      }
      data-testid={testId ?? 'restore-purchases-link'}
    >
      {restoring ? '…' : t('restore')}
    </button>
  );
}
