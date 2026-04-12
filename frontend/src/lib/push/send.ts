/**
 * Push Notification Send Utility — Server-side push delivery via web-push
 * Feature: Push Notifications (Gap B6)
 * Role: Sends Web Push notifications to a user's subscribed devices,
 *       checks notification preferences, handles expired subscriptions,
 *       and logs to the in-app notifications table.
 *
 * Flow: Look up subscriptions → check preferences → send via web-push
 *       → handle 410 Gone (soft-delete expired) → log to notifications table
 *
 * Dependencies: web-push npm package, VAPID env vars, Supabase service client
 * IMPORTANT: Server-side only — never import in client code
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
// Send Push to a Single Subscription — low-level web-push call
// Returns true if sent, false if subscription expired (410 Gone)
// ============================================================

async function sendToSubscription(
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<{ sent: boolean; expired: boolean }> {
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
// Send Push to User — main entry point for sending notifications
// Checks preferences, delivers to all active subscriptions,
// cleans up expired ones, and logs to notifications table.
// ============================================================

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  notificationType: NotificationType
): Promise<{ sent: number; total: number }> {
  const supabase = createServiceClient();

  // --- Check notification preference — skip if disabled ---
  const { data: prefRow } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .is('deleted_at', null)
    .maybeSingle();

  // If no preference row exists, default is enabled (send it)
  if (prefRow && !prefRow.enabled) {
    return { sent: 0, total: 0 };
  }

  // --- Fetch active push subscriptions ---
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh_key, auth_key, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, total: 0 };
  }

  // --- Send to each subscription, track results ---
  let sentCount = 0;
  const expiredIds: string[] = [];

  for (const sub of subscriptions) {
    const result = await sendToSubscription(sub, payload);
    if (result.sent) sentCount++;
    if (result.expired) expiredIds.push(sub.id);
  }

  // --- Soft-delete expired subscriptions ---
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
