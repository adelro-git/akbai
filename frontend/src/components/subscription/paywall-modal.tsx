'use client';

/**
 * PaywallModal — post-trial gate paywall (Sprint 17, Gap G2).
 *
 * Renders 3 tier cards (Starter ₱299 lifetime / Pro Monthly ₱499 /
 * Pro Annual ₱4,999) on native, plus a restore link in the footer.
 * On web (PWA) renders the "Open in app" fallback with no purchase
 * buttons (Apple + Google billing policy compliance — payments must
 * go through StoreKit / Play Billing, not Stripe/web).
 *
 * Sources (passed as `source` prop):
 *   'chat' | 'morning_briefing' | 'weekly_story' | 'reply_drafter'
 *   | 'scan_limit' | 'manual'
 *
 * State machine:
 *   open=false                  → renders null
 *   open=true, native           → 3 tier cards + restore link
 *   open=true, web              → web fallback CTA (no purchase buttons)
 *   tier-card tap               → setPurchasing(productId), purchasePackage
 *     → status='success'        → onUpgraded?.(tier), onClose()
 *     → status='cancelled'      → setPurchasing(null) (silently stay open)
 *     → status='error'          → setErrorKey(messageKey), setPurchasing(null)
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §4 lines 690-787.
 *
 * Modal primitive: vitest runs in node env (no jsdom), and the
 * existing dialog.jsx Radix wrapper assumes a DOM. To stay testable
 * + keep the bundle thin, we use a fixed-overlay div with role="dialog"
 * + aria-modal — same pattern as check-in-modal.tsx (Sprint 7+).
 * Escape-to-close is wired via a keydown listener while open=true.
 */

import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { purchasePackage } from '@/lib/iap/purchase';
import { PaywallTierCard, TIER_TO_PRODUCT_ID } from './paywall-tier-card';
import type { PaywallTier } from './paywall-tier-card';
import { RestorePurchasesLink } from './restore-purchases-link';

// ============================================================
// Types
// ============================================================

export type PaywallSource =
  | 'chat'
  | 'morning_briefing'
  | 'weekly_story'
  | 'reply_drafter'
  | 'scan_limit'
  | 'manual';

export interface PaywallModalProps {
  open: boolean;
  source: PaywallSource;
  onClose: () => void;
  onUpgraded?: (tier: 'pro' | 'starter') => void;
  /** Override `Capacitor.isNativePlatform()` for tests. Real callers omit. */
  forceNative?: boolean;
}

// ============================================================
// Pure handlers — exported for test isolation. Given a PurchaseResult
// (returned from purchasePackage), dispatches the right side-effects.
// ============================================================

export interface PurchaseDispatchCallbacks {
  setPurchasing: (productId: string | null) => void;
  setErrorKey: (key: string | null) => void;
  onClose: () => void;
  onUpgraded?: (tier: 'pro' | 'starter') => void;
}

export function handlePurchaseResult(
  result:
    | { status: 'success'; tier: 'pro' | 'starter' }
    | { status: 'cancelled' }
    | { status: 'error'; messageKey: string },
  cb: PurchaseDispatchCallbacks,
): void {
  cb.setPurchasing(null);

  if (result.status === 'success') {
    cb.onUpgraded?.(result.tier);
    cb.onClose();
    return;
  }
  if (result.status === 'cancelled') {
    // Silent — paywall stays open per architect §7 + the discriminated-union
    // contract in lib/iap/purchase.ts.
    return;
  }
  // status === 'error'
  cb.setErrorKey(result.messageKey);
}

// ============================================================
// Component
// ============================================================

export function PaywallModal({
  open,
  source,
  onClose,
  onUpgraded,
  forceNative,
}: PaywallModalProps) {
  const tTitle = useTranslations('paywall.title');
  const tBody = useTranslations('paywall.body');
  const tCta = useTranslations('paywall.cta');
  const tWebFallback = useTranslations('paywall.web_fallback');

  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Resolve native vs web. `forceNative` is a test seam.
  const isNative = forceNative ?? Capacitor.isNativePlatform();

  // --- Escape-to-close while open ---
  useEffect(() => {
    if (!open) return;
    if (typeof window === 'undefined') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // --- Tier-card tap → SDK purchase → result dispatch ---
  const handlePurchase = useCallback(
    async (tier: PaywallTier) => {
      if (purchasing) return; // double-tap guard
      const productId = TIER_TO_PRODUCT_ID[tier];
      setPurchasing(productId);
      setErrorKey(null);
      const result = await purchasePackage(productId);
      handlePurchaseResult(result, {
        setPurchasing,
        setErrorKey,
        onClose,
        onUpgraded,
      });
    },
    [purchasing, onClose, onUpgraded],
  );

  // Restore-link success handler — close the paywall on a successful restore.
  const handleRestoreSuccess = useCallback(
    (tier: 'pro' | 'starter') => {
      onUpgraded?.(tier);
      onClose();
    },
    [onClose, onUpgraded],
  );

  // Toast hook for the restore link. We surface the messageKey via the
  // local errorKey state so the rendered toast strip is the same as the
  // purchase-error path; build-marketing voice-reviews the keys later.
  const handleRestoreToast = useCallback(
    (key: string) => {
      setErrorKey(key);
    },
    [],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="paywall-modal"
      data-source={source}
      data-native={isNative ? 'true' : 'false'}
    >
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
        data-testid="paywall-modal-backdrop"
      />

      {/* ── Centered dialog ── */}
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-ambient-lg"
        role="dialog"
        aria-modal="true"
        aria-label={tTitle(source)}
      >
        {/* ── Close button (Apple a11y — aria-label required) ── */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:opacity-80 transition-opacity"
          aria-label={tCta('close')}
          data-testid="paywall-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Source-keyed title ── */}
        <h2
          className="text-on-surface text-lg font-bold leading-tight pr-12"
          data-testid="paywall-modal-title"
        >
          {tTitle(source)}
        </h2>

        {/* ── Body sub-line under cards (always rendered for context) ── */}
        <p
          className="mt-2 text-xs text-on-surface-variant"
          data-testid="paywall-modal-body"
        >
          {tBody('starter_only')}
        </p>

        {/* ── Native branch: 3 tier cards + restore ── */}
        {isNative && (
          <div className="mt-5 flex flex-col gap-3" data-testid="paywall-modal-native-content">
            <PaywallTierCard
              tier="starter"
              onPurchase={() => handlePurchase('starter')}
              purchasing={purchasing === TIER_TO_PRODUCT_ID.starter}
            />
            <PaywallTierCard
              tier="pro_monthly"
              onPurchase={() => handlePurchase('pro_monthly')}
              purchasing={purchasing === TIER_TO_PRODUCT_ID.pro_monthly}
            />
            <PaywallTierCard
              tier="pro_annual"
              onPurchase={() => handlePurchase('pro_annual')}
              purchasing={purchasing === TIER_TO_PRODUCT_ID.pro_annual}
            />

            {/* ── Restore link (Apple Guideline 3.1.1 — must be visible) ── */}
            <div className="mt-2 flex justify-center">
              <RestorePurchasesLink
                onSuccess={handleRestoreSuccess}
                onToast={handleRestoreToast}
              />
            </div>
          </div>
        )}

        {/* ── Web branch: open-in-app fallback (NO purchase buttons) ── */}
        {!isNative && (
          <div
            className="mt-5 rounded-xl bg-surface-container p-5"
            data-testid="paywall-modal-web-fallback"
          >
            <h3
              className="text-on-surface text-base font-bold"
              data-testid="paywall-modal-web-fallback-title"
            >
              {tWebFallback('title')}
            </h3>
            <p
              className="mt-2 text-sm text-on-surface-variant"
              data-testid="paywall-modal-web-fallback-body"
            >
              {tWebFallback('body')}
            </p>

            <div className="mt-4 flex gap-3" data-testid="paywall-modal-store-badges">
              {/* Store badges — text-only placeholders to keep the bundle
                  lean; real badge assets land in a follow-up commit. */}
              <span
                className="inline-flex items-center justify-center rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
                aria-label="App Store"
                data-testid="paywall-modal-app-store"
              >
                App Store
              </span>
              <span
                className="inline-flex items-center justify-center rounded-lg bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface"
                aria-label="Google Play Store"
                data-testid="paywall-modal-play-store"
              >
                Play Store
              </span>
            </div>

            {/* Restore link still rendered on web — it just emits a
                web_only toast. Per architect §4 line 770 the link MUST
                be visible on both surfaces. */}
            <div className="mt-4 flex justify-center">
              <RestorePurchasesLink
                onSuccess={handleRestoreSuccess}
                onToast={handleRestoreToast}
              />
            </div>
          </div>
        )}

        {/* ── Inline error toast (purchase + restore failures both land here) ── */}
        {errorKey && (
          <div
            className="mt-4 rounded-xl bg-error-container/30 px-4 py-3"
            role="alert"
            data-testid="paywall-modal-error"
            data-message-key={errorKey}
          >
            <p className="text-sm text-on-error-container">{errorKey}</p>
          </div>
        )}
      </div>
    </div>
  );
}
