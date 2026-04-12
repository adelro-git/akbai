/**
 * Push Notification Types — Type definitions for push notification infrastructure
 * Feature: Push Notifications (Gap B6)
 * Role: Defines notification types, subscription shapes, preferences,
 *       and push payloads used across the push lib, API routes, and UI.
 */

// ============================================================
// Notification Types — categories of push notifications AKBai sends
// ============================================================

export const NOTIFICATION_TYPES = [
  'bir_deadline',
  'payment_reminder',
  'weekly_recap',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Display labels for notification types (conversational Filipino) */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  bir_deadline: 'BIR Deadlines',
  payment_reminder: 'Payment Reminders',
  weekly_recap: 'Weekly Recap',
};

/** Descriptions for notification type toggles (conversational Filipino) */
export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  bir_deadline: 'Mga reminder bago mag-deadline',
  payment_reminder: 'Paalala sa mga bayarin',
  weekly_recap: 'Buod ng linggo mo',
};

// ============================================================
// Push Subscription Data — what we store from the browser's PushSubscription
// ============================================================

export interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

// ============================================================
// Notification Preference — per-type toggle stored in DB
// ============================================================

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Push Payload — shape sent to the service worker via web-push
// ============================================================

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

// ============================================================
// Notification Row — in-app notification log stored in DB
// ============================================================

export interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

// ============================================================
// Push Subscription Row — shape returned from the database
// ============================================================

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  created_at: string;
}
