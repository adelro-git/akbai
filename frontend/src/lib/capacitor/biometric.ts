'use client';

/**
 * Capacitor Biometric — Face ID / fingerprint as an OPTIONAL second factor
 * Feature: Biometric Second Factor (Sprint 16, Gap G4 mitigation)
 * Role: Native-only re-verification of an EXISTING valid Supabase session
 *       on app open. Biometric NEVER creates a session, NEVER bypasses an
 *       expired session, NEVER replaces the OTP login. Failure ≥3
 *       consecutive times → sign out + redirect to /login (OTP is the
 *       recovery path).
 *
 * IMPORTANT: This module is a no-op on web (Capacitor.isNativePlatform() === false).
 *            All call sites must branch on platform; do NOT import for web flows.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §4 + §7 audit surface #3.
 * Schema reference:    migration 021_users_biometric_columns.sql.
 *
 * DRIFT NOTE (Sprint 16 batch 3):
 *   Architect spec referenced `@capacitor-community/biometric-auth`; that
 *   npm package does not exist. The canonical Capacitor 7+ biometric
 *   plugin on npm is `@aparajita/capacitor-biometric-auth` (v10.0.0,
 *   identical API surface — BiometricAuth.checkBiometry() +
 *   BiometricAuth.authenticate()). Substituted here.
 */

import { Capacitor } from '@capacitor/core';
import {
  BiometricAuth,
  BiometryError,
  BiometryErrorType,
  type CheckBiometryResult,
} from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';

// ============================================================
// Failure counter — persisted in native-secure Preferences (NOT localStorage)
// per architect §4 risk #3. localStorage in the Capacitor WebView is
// reachable from any script in the WebView; @capacitor/preferences hits
// the Android SharedPreferences / iOS UserDefaults layer which is process-
// scoped and not exposed to webview JS injection.
// ============================================================

export const BIOMETRIC_FAILURES_KEY = 'akbai_biometric_failures';
export const MAX_BIOMETRIC_FAILURES = 3;

// ============================================================
// Public — does the device support biometric (and is biometry enrolled)?
// Returns false on web (no native bridge), false on a native device that
// lacks biometric hardware OR has biometric hardware but no enrollment.
// ============================================================

export async function isBiometricSupported(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
    return result.isAvailable === true;
  } catch {
    return false;
  }
}

// ============================================================
// Public — enable biometric: prompts the user to authenticate ONCE to
// confirm enrollment, then PATCHes /api/profile to flip biometric_enabled
// to true. Server-side derives biometric_setup_at = now() on the first
// enable (audit trail).
//
// Returns { success: true } on full success;
//         { success: false, error } on web no-op, denial, cancel, or
//         a /api/profile PATCH failure (network, validation, RLS).
// ============================================================

export async function enableBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Biometric is only available in the AKBai app.' };
  }

  // --- Step 1: confirm the device supports + has biometric enrolled ---
  const supported = await isBiometricSupported();
  if (!supported) {
    return { success: false, error: 'Walang naka-enroll na biometric sa device mo.' };
  }

  // --- Step 2: re-verify with biometric BEFORE persisting ---
  try {
    await BiometricAuth.authenticate({
      reason: 'I-confirm muna namin gamit ang biometric mo bago i-save.',
      cancelTitle: 'Cancel',
      androidTitle: 'AKBai',
      androidSubtitle: 'Gamitin ang biometric mo para i-enable.',
    });
  } catch (err) {
    const code = extractBiometryErrorCode(err);
    if (code === BiometryErrorType.userCancel || code === BiometryErrorType.appCancel) {
      return { success: false, error: 'Na-cancel mo ang biometric.' };
    }
    return { success: false, error: 'Hindi nag-match. Subukan mo ulit.' };
  }

  // --- Step 3: persist preference. Server derives biometric_setup_at server-side. ---
  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biometric_enabled: true }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { error?: { message_tl?: string } }
        | null;
      const message = json?.error?.message_tl ?? 'Hindi ma-save. Subukan muli.';
      return { success: false, error: message };
    }
  } catch {
    return { success: false, error: 'Walang internet. Subukan muli.' };
  }

  // Reset the failure counter on a successful enable.
  await resetFailureCount();
  return { success: true };
}

// ============================================================
// Public — disable biometric. PATCHes /api/profile with biometric_enabled=false.
// biometric_setup_at is left as-is (audit trail per architect §4).
// No biometric re-prompt to disable — the user is already inside the
// app, which already passed the on-open guard. (Sprint 19 hardening
// could add a re-prompt to disable.)
// ============================================================

export async function disableBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Biometric is only available in the AKBai app.' };
  }

  try {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biometric_enabled: false }),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as
        | { error?: { message_tl?: string } }
        | null;
      const message = json?.error?.message_tl ?? 'Hindi ma-save. Subukan muli.';
      return { success: false, error: message };
    }
  } catch {
    return { success: false, error: 'Walang internet. Subukan muli.' };
  }

  // Reset failure counter — leaving stale ≥3 strikes from a previous
  // session would brick a re-enable later.
  await resetFailureCount();
  return { success: true };
}

// ============================================================
// Public — verify biometric on app open. Reads the persisted failure
// counter from native-secure Preferences; increments on failure;
// resets on success.
//
// Returns:
//   { verified: true,  failureCount: 0 }
//   { verified: false, failureCount: N }      ← N may be ≥ MAX_BIOMETRIC_FAILURES
//
// CRITICAL: the caller (e.g. (app)/layout.tsx) is responsible for the
// 3-strike sign-out. This function does NOT call supabase.auth.signOut()
// — that side-effect lives in the layout so the test surface for this
// module stays clean.
// ============================================================

export async function verifyBiometric(): Promise<{
  verified: boolean;
  failureCount: number;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { verified: false, failureCount: 0 };
  }

  try {
    await BiometricAuth.authenticate({
      reason: 'Kumpirmahin natin na ikaw nga.',
      cancelTitle: 'Cancel',
      androidTitle: 'AKBai',
      androidSubtitle: 'Sandali, kinukumpirma ka namin.',
    });
    // Success — reset the counter.
    await resetFailureCount();
    return { verified: true, failureCount: 0 };
  } catch (err) {
    const code = extractBiometryErrorCode(err);
    // userCancel is still a failure for the purpose of the 3-strike
    // counter; an attacker can cancel-and-retry indefinitely otherwise.
    // Treat all error codes as a single failure mode.
    void code;
    const newCount = await incrementFailureCount();
    return { verified: false, failureCount: newCount };
  }
}

// ============================================================
// Public — read the current failure count from Preferences.
// Exposed so the (app)/layout.tsx can surface "attempts remaining"
// without re-running verifyBiometric().
// ============================================================

export async function getFailureCount(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  try {
    const { value } = await Preferences.get({ key: BIOMETRIC_FAILURES_KEY });
    if (!value) return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

// ============================================================
// Public — reset the failure counter. Called on:
//   - successful verifyBiometric()
//   - successful enableBiometric()
//   - successful disableBiometric()
//   - sign-out (called from layout after the 3-strike fallback)
// ============================================================

export async function resetFailureCount(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Preferences.remove({ key: BIOMETRIC_FAILURES_KEY });
  } catch {
    // Preferences may not be configured on a stub-instrumented test;
    // failing to reset is non-fatal (the counter just stays at its
    // old value — the next verify call will overwrite on success).
  }
}

// ============================================================
// Internal — increment failure counter, return new value.
// ============================================================

async function incrementFailureCount(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  const current = await getFailureCount();
  const next = current + 1;
  try {
    await Preferences.set({
      key: BIOMETRIC_FAILURES_KEY,
      value: String(next),
    });
  } catch {
    // Same non-fatal posture as resetFailureCount — the counter may
    // be transiently stale but the next attempt will rectify.
  }
  return next;
}

// ============================================================
// Internal — extract the BiometryErrorType code from a thrown error.
// The plugin throws BiometryError instances (Error subclass with
// .code: BiometryErrorType). Anything else we treat as a generic
// authentication failure. No `any` types per CLAUDE.md.
// ============================================================

function extractBiometryErrorCode(err: unknown): BiometryErrorType {
  if (err instanceof BiometryError) {
    return err.code;
  }
  // Some platforms surface the same shape without instanceof working
  // across module boundaries — fall back to a structural check.
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    const codeStr = (err as { code: string }).code;
    if (Object.values(BiometryErrorType).includes(codeStr as BiometryErrorType)) {
      return codeStr as BiometryErrorType;
    }
  }
  return BiometryErrorType.authenticationFailed;
}
