'use client';

/**
 * RevenueCat configuration — call once per app open.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Native-only IAP SDK init. Web path is a no-op; the PWA
 *          fallback paywall (Sprint 17 batch 3) displays an
 *          "Open in app to purchase" CTA instead of a broken
 *          purchase button.
 *
 * Sentry: errors during configure are tagged source='revenuecat-configure'
 *         so the Sentry dashboard can isolate them (architect §7).
 *
 * IMPORTANT: idempotent via module-level `configured` boolean — a second
 *            call short-circuits. Pattern mirrors initSentryCapacitor()
 *            (lib/sentry/capacitor-init.ts line 35). The (app)/layout.tsx
 *            useEffect is the one canonical caller; PaywallModal calls
 *            this defensively on first display in case the layout init
 *            failed.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §2 (lines 79-145).
 */

import { Capacitor } from '@capacitor/core';

// ============================================================
// Module-level idempotency guard. Reset via __resetRevenueCatForTests()
// in vitest setup. Mirrors capacitor-init.ts `initialised` boolean.
// ============================================================

let configured = false;

export async function initRevenueCat(supabaseUserId: string | null): Promise<void> {
  // --- Web no-op: RevenueCat is native-only; the PWA paywall is a
  //     "download the app" CTA, not a purchase button. ---
  if (!Capacitor.isNativePlatform()) return;

  // --- Idempotent: a second configure() would re-handshake the native
  //     bridge and re-fetch customerInfo unnecessarily. ---
  if (configured) return;

  // --- No user yet → defer. The (app)/layout.tsx useEffect re-fires
  //     after the auth session resolves; until then we have no
  //     appUserID to pass to Purchases.configure. ---
  if (!supabaseUserId) return;

  // --- Platform-keyed API key. Apple + Google keys are public per
  //     RevenueCat docs (they identify the app, not the developer),
  //     so the NEXT_PUBLIC_ prefix is correct here. Server-only
  //     secrets (webhook auth, REST API key) live in non-public env. ---
  const apiKey =
    Capacitor.getPlatform() === 'ios'
      ? process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

  if (!apiKey) {
    // No key in env (dev local, smoke build, Sprint 17 pre-Sprint-19
    // before real keys land). Skip silently — same shape as the
    // Sentry capacitor-init DSN-missing branch (capacitor-init.ts §44-50).
    return;
  }

  try {
    // Dynamic import keeps the native bridge code out of the web bundle.
    // The module sits unloaded until we reach native execution.
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');

    await Purchases.configure({
      apiKey,
      appUserID: supabaseUserId, // RevenueCat app_user_id == users.id (UUID string)
    });

    if (process.env.NODE_ENV !== 'production') {
      // Verbose RC SDK logs in dev for easier sandbox-event debugging.
      // Production builds keep the default INFO level.
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    configured = true;
  } catch (err) {
    // Failure mode: paywall will defer-init on first display, then
    // surface an `iap.error.unknown` toast to the user. Capture to
    // Sentry with the standardised source tag (architect §7).
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, { tags: { source: 'revenuecat-configure' } });
    // eslint-disable-next-line no-console
    console.error('[iap] RevenueCat configure failed', err);
  }
}

// ============================================================
// Test-only — reset the module-level guard so vitest can re-run
// init scenarios. Not part of the public API; do NOT call from
// app code.
// ============================================================

export function __resetRevenueCatForTests(): void {
  configured = false;
}
