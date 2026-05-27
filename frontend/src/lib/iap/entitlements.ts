'use client';

/**
 * Entitlement check — wraps Purchases.getCustomerInfo() with a
 * single canonical predicate set the paywall + tier-gated screens
 * consume. The TIER mapping (RevenueCat entitlement id → AKBai tier)
 * is the load-bearing contract; if Anton renames an entitlement in
 * the RevenueCat dashboard, update this file ONCE.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Single source of truth for client-side tier reads.
 *          Server-side reads continue to consume `subscriptions.tier`
 *          (the cached projection of these entitlements via the
 *          webhook handler in batch 2).
 *
 * Entitlement IDs (locked Sprint 17, configured in RevenueCat dashboard
 * Sprint 19):
 *   pro_unlimited    → Pro Monthly OR Pro Annual active subscription
 *   starter_lifetime → ₱299 non-consumable IAP (lifetime)
 *
 * Tier resolution priority: pro > starter > free (per architect Open Q 3).
 * Coexistence: a user can hold BOTH entitlements simultaneously; we
 * report 'pro' since Pro supersedes Starter feature-wise, but we
 * still expose `starterPurchasedAt` so /profile can surface the
 * dormant lifetime entitlement.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §2 (lines 175-245).
 */

import { Capacitor } from '@capacitor/core';

// ============================================================
// Local IapTier union — Sprint 17 batch 1 does NOT extend
// SubscriptionTierEnum in @/lib/subscriptions/types (that's
// batch 2 scope per architect §8). We use a local union here
// so the client surface compiles cleanly without the global
// enum touch.
// ============================================================

export type IapTier = 'free' | 'starter' | 'pro';

export type Entitlements = {
  tier: IapTier;
  proExpiresAt: string | null;
  starterPurchasedAt: string | null;
  isNative: boolean;
};

// Constants — exported so tests + the webhook server module can
// share the same literal strings (avoid duplication).
export const PRO_ENTITLEMENT_ID = 'pro_unlimited';
export const STARTER_ENTITLEMENT_ID = 'starter_lifetime';

export async function getEntitlements(): Promise<Entitlements> {
  // --- Web fallback: client-side tier is always 'free' on the PWA.
  //     The PaywallModal web branch shows "Open in app" CTA instead
  //     of purchase buttons. ---
  if (!Capacitor.isNativePlatform()) {
    return {
      tier: 'free',
      proExpiresAt: null,
      starterPurchasedAt: null,
      isNative: false,
    };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();

    const proEnt = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
    const starterEnt = customerInfo.entitlements.active[STARTER_ENTITLEMENT_ID];

    // Resolution order: pro > starter > free. Pro supersedes Starter
    // even when both are active (architect Open Q 3 (a)).
    if (proEnt) {
      return {
        tier: 'pro',
        proExpiresAt: proEnt.expirationDate ?? null,
        starterPurchasedAt: starterEnt?.latestPurchaseDate ?? null,
        isNative: true,
      };
    }
    if (starterEnt) {
      return {
        tier: 'starter',
        proExpiresAt: null,
        starterPurchasedAt: starterEnt.latestPurchaseDate ?? null,
        isNative: true,
      };
    }
    return {
      tier: 'free',
      proExpiresAt: null,
      starterPurchasedAt: null,
      isNative: true,
    };
  } catch (err) {
    // Sentry capture per architect §7. Failure mode: report 'free'
    // — the server tier read (subscriptions.tier) is the authoritative
    // gate for paid features, so a client-side false negative here
    // just re-shows the paywall instead of breaking the user.
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, {
      tags: { source: 'revenuecat-entitlements' },
    });
    return {
      tier: 'free',
      proExpiresAt: null,
      starterPurchasedAt: null,
      isNative: true,
    };
  }
}
