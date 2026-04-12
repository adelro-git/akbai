/**
 * Push Notification Module — Barrel export
 * Feature: Push Notifications (Gap B6)
 * Role: Re-exports client-safe types and registration functions.
 *       Server-only modules (send.ts, deadline-triggers.ts) are NOT
 *       exported here to prevent accidental client-side imports.
 */

// --- Types (safe for both client and server) ---
export type {
  NotificationType,
  PushSubscriptionData,
  NotificationPreference,
  PushPayload,
  NotificationRow,
  PushSubscriptionRow,
} from './types';

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
} from './types';

// --- Schemas (safe for both client and server) ---
export {
  SubscribePushSchema,
  UnsubscribePushSchema,
  SendPushSchema,
  UpdatePreferencesSchema,
  MarkReadSchema,
} from './schemas';

// --- Client-side registration (browser APIs) ---
export {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isCurrentlySubscribed,
} from './register';
