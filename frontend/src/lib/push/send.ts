/**
 * Push Notification Send Utility — Server-side push delivery
 * Feature: Push Notifications (Gap B6) + Native Push (Sprint 16, Gap G4 mitigation)
 * Role: Sends Web Push notifications (web rows, via `web-push`) and FCM/APNs
 *       notifications (native rows, via Firebase Admin SDK in Sprint 19).
 *       Checks notification preferences, handles expired Web Push subscriptions,
 *       and logs to the in-app notifications table.
 *
 * Flow: Look up subscriptions → check preferences → branch on `platform`:
 *         platform='web'             → webpush.sendNotification
 *         platform='android'|'ios'   → Sprint 19 Firebase Admin (TODO log + skip)
 *       → handle 410 Gone (soft-delete expired web rows)
 *       → log to notifications table.
 *
 * Dependencies: web-push npm package, VAPID env vars, Supabase service client.
 * Sprint 19: wire `firebase-admin` for the native branch — see TODO below.
 * IMPORTANT: Server-side only — never import in client code.
 */

import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/service';
import type { PushPayload, NotificationType, PushSubscriptionRow } from './types';

// ============================================================
// VAPID Configuration — loaded from environment variables
// ============================================================

function getVapidConfig(): { publicKey: string; privateKey: string; subject: string } {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      'Missing VAPID environment variables. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.'
    );
  }

  return { publicKey, privateKey, subject };
}

// ============================================================
// Send to a single WEB subscription — low-level web-push call.
// Returns sent=true if delivered; expired=true on 410 Gone / 404 Not Found
// so the caller can soft-delete the dead row. Other errors are logged and
// reported as sent=false, expired=false (partial delivery is acceptable).
// ============================================================

async function sendToWebSubscription(
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<{ sent: boolean; expired: boolean }> {
  // Defensive — web rows must have VAPID keys; if they don't, the row is
  // malformed (data drift) and we treat it like an unsendable expired row.
  if (!subscription.p256dh_key || !subscription.auth_key) {
    console.error(
      `[push] web subscription ${subscription.id} missing VAPID keys — skipping.`
    );
    return { sent: false, expired: true };
  }

  const vapid = getVapidConfig();
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { sent: true, expired: false };
  } catch (error: unknown) {
    // --- Handle expired subscription (410 Gone or 404 Not Found) ---
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      return { sent: false, expired: true };
    }
    // Log other errors but don't throw — partial delivery is acceptable
    console.error(
      `[push] Failed to send to subscription ${subscription.id}:`,
      error
    );
    return { sent: false, expired: false };
  }
}

// ============================================================
// Send to a NATIVE subscription — Sprint 16 leaves this as a TODO log
// because Firebase Admin wiring + the real google-services.json land in
// Sprint 19. The subscription row IS persisted today; delivery is just
// soft-skipped. Returning sent=false, expired=false avoids mutating the
// row (no soft-delete) and lets Sprint 19 light up delivery without a
// schema or call-site change.
// ============================================================

async function sendToNativeSubscription(
  subscription: PushSubscriptionRow,
  _payload: PushPayload
): Promise<{ sent: boolean; expired: boolean }> {
  // TODO(sprint-19): wire firebase-admin sendToToken(subscription.native_token, …)
  //                  for android/ios rows. Requires real google-services.json +
  //                  service-account JSON in env (FIREBASE_SERVICE_ACCOUNT_JSON).
  console.warn(
    `[push] skipping native delivery — pending Sprint 19 FCM wiring ` +
      `(subscription id=${subscription.id}, platform=${subscription.platform})`
  );
  return { sent: false, expired: false };
}

// ============================================================
// Send Push to User — main entry point for sending notifications.
// Checks preferences, delivers to all active subscriptions, branches per row
// on `platform`, cleans up expired web rows, and logs to notifications table.
// ============================================================

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  notificationType: NotificationType
): Promise<{ sent: number; total: number }> {
  const supabase = createServiceClient();

  // --- Check notification preference — skip if disabled ---
  const { data: prefRow, error: prefError } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .is('deleted_at', null)
    .maybeSingle();

  // G5 fix (fail SAFE on preference read error): a transient query error yields
  // prefRow === null, which previously fell through to "no row = enabled" and
  // pushed to a user who may well have OPTED OUT. Pushing to an opted-out user
  // on a DB hiccup is the wrong way to fail. So on any preference-read error we
  // treat the preference as DISABLED and skip the send. The reminder is not
  // lost: deadline pushes are at-least-once (the notified flag is only set when
  // sent > 0), so the next cron retries once the DB recovers.
  if (prefError) {
    console.error(
      `[push] notification_preferences read failed for user ${userId} ` +
        `(type=${notificationType}) — failing safe, treating as disabled:`,
      prefError
    );
    return { sent: 0, total: 0 };
  }

  // If no preference row exists, default is enabled (send it). This genuine
  // no-row case is distinct from the error case above (prefError is null here).
  if (prefRow && !prefRow.enabled) {
    return { sent: 0, total: 0 };
  }

  // --- Fetch active push subscriptions ---
  // Sprint 16: explicit `platform`, `native_token`, `device_id` in the SELECT
  // so the branch logic below has everything it needs without a second query.
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh_key, auth_key, created_at, platform, native_token, device_id')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, total: 0 };
  }

  // --- Send to each subscription, branching on platform ---
  let sentCount = 0;
  const expiredIds: string[] = [];

  for (const sub of subscriptions as PushSubscriptionRow[]) {
    const result =
      sub.platform === 'web'
        ? await sendToWebSubscription(sub, payload)
        : await sendToNativeSubscription(sub, payload);
    if (result.sent) sentCount++;
    if (result.expired) expiredIds.push(sub.id);
  }

  // --- Soft-delete expired subscriptions (web 410 / malformed only) ---
  if (expiredIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', expiredIds);
  }

  // --- Log to notifications table for in-app bell ---
  await supabase.from('notifications').insert({
    user_id: userId,
    notification_type: notificationType,
    title: payload.title,
    body: payload.body,
    url: payload.url ?? null,
  });

  return { sent: sentCount, total: subscriptions.length };
}
