'use client';

/**
 * Capacitor Native Push — register FCM/APNs token, POST to /api/push/subscribe
 * Feature: Native Push Notifications (Sprint 16, Gap G4 mitigation)
 * Role: Native-only push registration. Web path stays in lib/push/register.ts.
 *
 * Flow (native):
 *   PushNotifications.requestPermissions()  → permission grant
 *   → PushNotifications.register()          → triggers the `registration` event
 *   → onRegistration(token)                  → POST /api/push/subscribe with
 *                                              { platform: 'android'|'ios',
 *                                                native_token: token.value }
 *
 * IMPORTANT: This module is a no-op on web (Capacitor.isNativePlatform() === false).
 *            Call sites must branch on platform; do NOT import for web flows.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §3.
 * Schema reference:    migration 020_push_subscriptions_platform_extension.sql.
 */

import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
  type ActionPerformed,
  type RegistrationError,
} from '@capacitor/push-notifications';

// ============================================================
// Listener wiring — bind listeners exactly once per app lifetime.
// Module-level flag is safe because the listeners persist for the WebView's
// lifetime and re-binding would multiply the POST.
// ============================================================

let listenersBound = false;

// ============================================================
// Public — is native push wiring available on this device?
// Mirrors `Capacitor.isNativePlatform()` but exposed as an async helper so
// call sites can `await` it symmetrically with the rest of this module.
// ============================================================

export async function isNativePushSupported(): Promise<boolean> {
  return Capacitor.isNativePlatform();
}

// ============================================================
// Helper — POST the registered FCM/APNs token to /api/push/subscribe with
// the new `platform` discriminator (migration 020 / architect §3). The body
// shape matches SubscribePushSchema's native branch.
// Exported for tests so we can spy on it without faking PushNotifications.
// ============================================================

export async function postNativeToken(token: string): Promise<void> {
  const platform: 'android' | 'ios' =
    Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      native_token: token,
    }),
  });
}

// ============================================================
// Public — register the device for native push.
// Returns:
//   { success: true }                        — registration in flight (the
//                                              POST happens asynchronously
//                                              inside the `registration` event)
//   { success: false, error: '<reason>' }    — web (no-op), denied, or thrown
// ============================================================

export async function registerNativePush(): Promise<{ success: boolean; error?: string }> {
  // --- Web no-op: native plugin throws on import in some browsers; gate first ---
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Native push is only available in the Capacitor build.' };
  }

  try {
    // --- Request permission (iOS implicit; Android 13+ requires runtime grant) ---
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      return { success: false, error: 'Hindi pa naka-allow ang notifications.' };
    }

    // --- Bind listeners exactly once per app lifetime ---
    if (!listenersBound) {
      await PushNotifications.addListener('registration', async (token: Token) => {
        try {
          await postNativeToken(token.value);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[push] native subscribe POST failed', err);
        }
      });

      await PushNotifications.addListener(
        'registrationError',
        (err: RegistrationError) => {
          // eslint-disable-next-line no-console
          console.error('[push] native registration error', err);
        }
      );

      await PushNotifications.addListener(
        'pushNotificationReceived',
        (_n: PushNotificationSchema) => {
          // Foreground delivery — the OS does not display the system banner.
          // Sprint 17 polish: surface an in-app toast. Sprint 16: silent.
        }
      );

      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          const url = action.notification.data?.url;
          if (typeof url === 'string' && url.length > 0) {
            window.location.href = url;
          }
        }
      );

      listenersBound = true;
    }

    // --- Trigger registration; the `registration` listener handles the POST ---
    await PushNotifications.register();

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hindi naka-rehistro ang push notifications mo.';
    // eslint-disable-next-line no-console
    console.error('[push] native register threw', err);
    return { success: false, error: message };
  }
}

// ============================================================
// Public — unregister the device. The plugin doesn't expose a
// one-shot unregister; for Sprint 16 we leave this as a stub. The
// `/profile` preference toggle is the user-facing disable path.
// Sprint 19 hardening: track the cached `native_token` (e.g., in
// @capacitor/preferences) and POST to /api/push/unsubscribe with
// { platform, native_token } to flip the row to deleted_at.
// ============================================================

export async function unregisterNativePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  // TODO(sprint-19): cache the token at register time so we can POST
  //                  to /api/push/unsubscribe here.
}

// ============================================================
// Internal helper — reset the listenersBound flag. Test-only export so
// vitest can re-run the register flow with fresh listener bookkeeping.
// Not part of the public API; do NOT call from app code.
// ============================================================

export function __resetListenersBoundForTests(): void {
  listenersBound = false;
}
