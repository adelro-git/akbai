/**
 * Push Registration Module — Client-side Web Push API wrapper
 * Feature: Push Notifications (Gap B6)
 * Role: Handles browser permission requests, PushManager subscribe/unsubscribe,
 *       and syncs subscription state with the backend API.
 *
 * Flow: Check support → request permission → subscribe via PushManager
 *       → POST subscription keys to /api/push/subscribe
 *
 * Dependencies: Service Worker must be registered, VAPID public key from env
 * IMPORTANT: Client-side only — uses browser APIs (Notification, PushManager)
 */

// ============================================================
// Feature Detection — check if push notifications are supported
// ============================================================

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// ============================================================
// Permission State — get current notification permission
// ============================================================

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// ============================================================
// Request Permission — prompt the user for notification permission
// ============================================================

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';

  const result = await Notification.requestPermission();
  return result;
}

// ============================================================
// VAPID Key Conversion — base64url string to Uint8Array
// Required by PushManager.subscribe for applicationServerKey
// ============================================================

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================================
// Subscribe — register push subscription and sync to backend
// ============================================================

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported in this browser.' };
  }

  // --- Request permission if not yet granted ---
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Notification permission not granted.' };
  }

  // --- Get VAPID public key ---
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { success: false, error: 'VAPID public key not configured.' };
  }

  try {
    // --- Get service worker registration ---
    const registration = await navigator.serviceWorker.ready;

    // --- Subscribe via PushManager ---
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });

    // --- Extract keys from subscription ---
    const rawKeys = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh_key = rawKeys.keys?.p256dh ?? '';
    const auth_key = rawKeys.keys?.auth ?? '';

    if (!p256dh_key || !auth_key) {
      return { success: false, error: 'Failed to get subscription keys.' };
    }

    // --- POST to backend ---
    // Sprint 16: explicit `platform: 'web'` discriminator. Web rows still
    // ship the VAPID triple; native rows POST through lib/push/capacitor-push.ts
    // with `platform: 'android' | 'ios'` and `native_token`.
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'web', endpoint, p256dh_key, auth_key }),
    });

    if (!response.ok) {
      return { success: false, error: 'Failed to save subscription to server.' };
    }

    return { success: true };
  } catch (err) {
    console.error('[push] Subscribe error:', err);
    return { success: false, error: 'Failed to subscribe to push notifications.' };
  }
}

// ============================================================
// Unsubscribe — remove push subscription and notify backend
// ============================================================

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true }; // Already unsubscribed
    }

    const endpoint = subscription.endpoint;

    // --- Unsubscribe from browser ---
    await subscription.unsubscribe();

    // --- Notify backend ---
    // Sprint 16: include `platform: 'web'` discriminator (symmetric with subscribe).
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'web', endpoint }),
    });

    return { success: true };
  } catch (err) {
    console.error('[push] Unsubscribe error:', err);
    return { success: false, error: 'Failed to unsubscribe from push notifications.' };
  }
}

// ============================================================
// Check Subscription — is the current browser subscribed?
// ============================================================

export async function isCurrentlySubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
