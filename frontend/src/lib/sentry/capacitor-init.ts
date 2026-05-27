'use client';

/**
 * Sentry Capacitor — native crash SDK init.
 *
 * Feature: Native Crash Symbolication Pipeline (Sprint 16)
 * Role: Initialises @sentry/capacitor alongside the existing
 *       @sentry/nextjs SDK so we capture native Java/Swift crashes
 *       OUTSIDE the WebView (e.g., Android plugin failures, iOS
 *       UIKit crashes) which the JS SDK by design cannot see.
 *
 * Coexistence with @sentry/nextjs (architect §6 + risk #4):
 *   - Same DSN → same Sentry project (per architect Open Q 4).
 *   - `sdk.name:sentry.capacitor` saved search disambiguates from
 *     `sdk.name:sentry.javascript.nextjs` in the dashboard.
 *   - We pass NO sibling-init function to Sentry.init(...), which
 *     suppresses the bundled @sentry/browser/Sentry.init wrap and
 *     prevents double-capture of JS errors. @sentry/nextjs already
 *     hooks window.onerror; @sentry/capacitor stays NATIVE-ONLY.
 *
 * IMPORTANT: This module is a no-op on web (Capacitor.isNativePlatform() === false).
 *            The dynamic import avoids pulling @sentry/capacitor's
 *            native-bridge code into the Vercel/PWA bundle.
 *
 * Symbolication: ProGuard mapping (Android) + dSYM (iOS) upload is
 *                CONFIGURED in Sprint 16 (gradle minifyEnabled, the
 *                upload-symbols scripts), EXECUTED in Sprint 19 with a
 *                real SENTRY_AUTH_TOKEN in CI. See architect §6 risk #5.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §6.
 */

import { Capacitor } from '@capacitor/core';

let initialised = false;

export async function initSentryCapacitor(): Promise<void> {
  // --- Web no-op: @sentry/nextjs covers JS errors; native SDK irrelevant ---
  if (!Capacitor.isNativePlatform()) return;

  // --- Idempotent: a second init call would re-register the native bridge ---
  if (initialised) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // No DSN configured (dev local, smoke build, etc.) — skip silently.
    // Production builds set this via Vercel env; capacitor production
    // builds set it via .env.production at static-export time.
    return;
  }

  try {
    // Dynamic import keeps the @sentry/capacitor native binding out of
    // the web bundle. The module sits unloaded until we reach native
    // execution.
    const SentryCapacitor = await import('@sentry/capacitor');

    SentryCapacitor.init({
      dsn,
      // enableNative=true is the load-bearing config: it activates the
      // native crash handler (NSException on iOS, uncaught Throwable on
      // Android). Without it the SDK is just a duplicate of the JS SDK.
      enableNative: true,
      environment: process.env.NODE_ENV,
      // Mirror the JS SDK's release-environment shape for grouping.
      release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
      // Sample rate matches @sentry/nextjs (low for solo-founder budget).
      tracesSampleRate: 0.1,
      // No sibling init function supplied → @sentry/capacitor does not
      // wrap @sentry/browser, so no JS-event double-capture. See risk #4
      // in architect §1.
    });

    initialised = true;
  } catch (err) {
    // Init failure is non-fatal — @sentry/nextjs is still capturing JS
    // errors. Log to console (not Sentry itself — that would be circular).
    // eslint-disable-next-line no-console
    console.error('[sentry-capacitor] native init failed', err);
  }
}

// ============================================================
// Test-only — reset the module-level guard so vitest can re-run init.
// Not part of the public API; do NOT call from app code.
// ============================================================

export function __resetSentryCapacitorInitForTests(): void {
  initialised = false;
}
