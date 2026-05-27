'use client';

/**
 * Purchase + restore wrappers — convert RevenueCat errors into
 * conversational Filipino string keys (build-marketing voice-reviews
 * the messages downstream).
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Single entry point for paywall purchases + Apple Guideline
 *          3.1.1 restore link. The PaywallModal (batch 3) calls
 *          purchasePackage() on tier-card tap and restorePurchases()
 *          on the "May dating purchase ka na?" link.
 *
 * Error categorisation:
 *   userCancelled === true → silent { status: 'cancelled' }  (idle paywall)
 *   NETWORK_ERROR          → 'iap.error.network'
 *   PAYMENT_PENDING_ERROR  → 'iap.error.pending'   (Apple SCA / parental approval)
 *   INVALID_CREDENTIALS    → 'iap.error.invalid'   (card declined, fraud check)
 *   PAYMENT_NOT_ALLOWED    → 'iap.error.invalid'
 *   STORE_PROBLEM_ERROR    → 'iap.error.store_unavailable'
 *   UNKNOWN                → 'iap.error.unknown'
 *
 * DRIFT vs architect §2 lines 247-342: the architect's switch matched
 * `rcErr.code` against the ENUM NAMES (`'NETWORK_ERROR'` etc.) but
 * `@revenuecat/purchases-typescript-internal-esm` exposes the code
 * as the NUMERIC-STRING value of the enum (`'10'` for NETWORK_ERROR,
 * `'20'` for PAYMENT_PENDING_ERROR — see errors.d.ts line 16 / 26).
 * We accept BOTH forms so vitest can drive the switch with either
 * the human-readable name (tests) or the SDK's numeric code (real
 * runtime errors). Sprint 17 batch 2 review-security may want to
 * audit this dual-form acceptance.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §2 (lines 247-342).
 */

import { Capacitor } from '@capacitor/core';
import type { IapTier } from './entitlements';
import { PRO_ENTITLEMENT_ID, STARTER_ENTITLEMENT_ID } from './entitlements';

// ============================================================
// Result discriminated union — paywall consumer pattern-matches
// on `status` to decide UX:
//   'success'   → show success toast + close paywall
//   'cancelled' → silently re-render paywall (user tapped cancel)
//   'error'     → toast keyed by messageKey via next-intl
// ============================================================

export type PurchaseResult =
  | { status: 'success'; tier: 'pro' | 'starter' }
  | { status: 'cancelled' }
  | { status: 'error'; messageKey: string };

// ============================================================
// Product-id → tier map. Source-of-truth for the SKU-to-feature
// binding; if Anton renames a product in App Store Connect /
// Play Console, update HERE (and the RevenueCat dashboard).
// ============================================================

export const PRODUCT_TO_TIER: Record<string, 'pro' | 'starter'> = {
  akbai_pro_monthly: 'pro',
  akbai_pro_annual: 'pro',
  akbai_starter_lifetime: 'starter',
};

// ============================================================
// Error-code normaliser — accepts both the enum name (used by
// tests + the SDK's TypeScript enum) and the numeric-string value
// (what real SDK errors expose at runtime; see DRIFT note in
// module docblock). Returns the canonical name we switch on.
// ============================================================

const NUMERIC_TO_NAME: Record<string, string> = {
  '2': 'STORE_PROBLEM_ERROR',
  '10': 'NETWORK_ERROR',
  '11': 'INVALID_CREDENTIALS_ERROR',
  '20': 'PAYMENT_PENDING_ERROR',
  '3': 'PAYMENT_NOT_ALLOWED_ERROR',
};

function normaliseErrorCode(raw: string | undefined): string {
  if (!raw) return 'UNKNOWN';
  if (raw in NUMERIC_TO_NAME) return NUMERIC_TO_NAME[raw];
  return raw;
}

// ============================================================
// purchasePackage — paywall tap → SDK purchase → tier resolution.
// ============================================================

export async function purchasePackage(productId: string): Promise<PurchaseResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'error', messageKey: 'iap.error.web_only' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');

    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    if (!currentOffering) {
      return { status: 'error', messageKey: 'iap.error.store_unavailable' };
    }

    const pkg = currentOffering.availablePackages.find(
      (p) => p.product.identifier === productId,
    );
    if (!pkg) {
      return { status: 'error', messageKey: 'iap.error.product_not_found' };
    }

    await Purchases.purchasePackage({ aPackage: pkg });

    // Tier derived from product id — the SDK's MakePurchaseResult does
    // expose customerInfo.entitlements but we'd then re-do the
    // entitlements.ts read; cheaper to map the product id directly
    // since we just confirmed the purchase succeeded.
    return {
      status: 'success',
      tier: PRODUCT_TO_TIER[productId] ?? 'pro',
    };
  } catch (err) {
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    const rcErr = err as {
      code?: string;
      userCancelled?: boolean;
      message?: string;
    };

    // User cancellation is NOT an error per architect §7 — silent
    // return, no Sentry capture.
    if (rcErr.userCancelled) return { status: 'cancelled' };

    // Tag Sentry with the source + the normalised code so the dashboard
    // saved-search can isolate per-failure-mode counts.
    const normalisedCode = normaliseErrorCode(rcErr.code);
    Sentry?.captureException(err, {
      tags: {
        source: 'revenuecat-purchase',
        code: normalisedCode,
      },
    });

    switch (normalisedCode) {
      case 'NETWORK_ERROR':
        return { status: 'error', messageKey: 'iap.error.network' };
      case 'PAYMENT_PENDING_ERROR':
        return { status: 'error', messageKey: 'iap.error.pending' };
      case 'INVALID_CREDENTIALS_ERROR':
      case 'PAYMENT_NOT_ALLOWED_ERROR':
        return { status: 'error', messageKey: 'iap.error.invalid' };
      case 'STORE_PROBLEM_ERROR':
        return { status: 'error', messageKey: 'iap.error.store_unavailable' };
      default:
        return { status: 'error', messageKey: 'iap.error.unknown' };
    }
  }
}

// ============================================================
// restorePurchases — Apple Guideline 3.1.1 mandate. The PaywallModal
// footer + /profile Settings row both call this. Returns:
//   success(pro)     → user had Pro entitlement (still active)
//   success(starter) → user had Starter (no Pro)
//   error(nothing)   → no prior entitlement found
//   error(unknown)   → SDK throw
// ============================================================

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'error', messageKey: 'iap.error.web_only' };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();

    if (customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]) {
      return { status: 'success', tier: 'pro' };
    }
    if (customerInfo.entitlements.active[STARTER_ENTITLEMENT_ID]) {
      return { status: 'success', tier: 'starter' };
    }
    return { status: 'error', messageKey: 'iap.error.nothing_to_restore' };
  } catch (err) {
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, {
      tags: { source: 'revenuecat-restore' },
    });
    return { status: 'error', messageKey: 'iap.error.unknown' };
  }
}

// Re-export IapTier so paywall + tests can `import type { IapTier }`
// from this module instead of remembering it lives in entitlements.ts.
export type { IapTier };
