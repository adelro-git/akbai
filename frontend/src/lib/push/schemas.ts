/**
 * Push Notification Zod Schemas — validation for all push API inputs
 * Feature: Push Notifications (Gap B6) + Native Push (Sprint 16, Gap G4 mitigation)
 * Role: Zod schemas for subscribe, unsubscribe, send, and preferences endpoints.
 *       These are the single source of truth — TypeScript types are derived via z.infer.
 *
 * Sprint 16 change: SubscribePushSchema + UnsubscribePushSchema are now
 * discriminated unions on `platform`. Web rows ship VAPID keys; native rows
 * ship an FCM/APNs token in `native_token`. See migration 020 + architect
 * reference sprint-16-native-plugin-pattern.md §3.
 */

import { z } from 'zod';
import { NOTIFICATION_TYPES } from './types';

// ============================================================
// POST /api/push/subscribe — save a push subscription
// Discriminated on `platform`: 'web' uses VAPID columns (endpoint +
// p256dh_key + auth_key); 'android' | 'ios' uses native_token + optional
// device_id.
// ============================================================

export const SubscribePushSchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('web'),
    endpoint: z.string().url('Kailangan ng valid push endpoint URL.'),
    p256dh_key: z.string().min(1, 'Kailangan ng p256dh key.'),
    auth_key: z.string().min(1, 'Kailangan ng auth key.'),
  }),
  z.object({
    platform: z.enum(['android', 'ios']),
    native_token: z.string().min(1, 'Kailangan ng native push token.'),
    device_id: z.string().min(1).optional(),
  }),
]);

export type SubscribePushPayload = z.infer<typeof SubscribePushSchema>;

// ============================================================
// POST /api/push/unsubscribe — remove a push subscription
// Discriminated symmetrically with subscribe; web sends `endpoint`,
// native sends `native_token`. Route resolves the row via an OR filter
// (architect §3 engineer recommendation — single route, not split).
// ============================================================

export const UnsubscribePushSchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('web'),
    endpoint: z.string().url('Kailangan ng valid push endpoint URL.'),
  }),
  z.object({
    platform: z.enum(['android', 'ios']),
    native_token: z.string().min(1, 'Kailangan ng native push token.'),
  }),
]);

export type UnsubscribePushPayload = z.infer<typeof UnsubscribePushSchema>;

// ============================================================
// POST /api/push/send — send a push notification (service-role only)
// ============================================================

export const SendPushSchema = z.object({
  user_id: z.string().uuid('Kailangan ng valid user ID.'),
  notification_type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1, 'Kailangan ng title.').max(200),
  body: z.string().min(1, 'Kailangan ng body.').max(500),
  icon: z.string().optional(),
  url: z.string().optional(),
  tag: z.string().optional(),
});

export type SendPushPayload = z.infer<typeof SendPushSchema>;

// ============================================================
// PATCH /api/push/preferences — update notification preference
// ============================================================

export const UpdatePreferencesSchema = z.object({
  notification_type: z.enum(NOTIFICATION_TYPES),
  enabled: z.boolean(),
});

export type UpdatePreferencesPayload = z.infer<typeof UpdatePreferencesSchema>;

// ============================================================
// PATCH /api/push/notifications — mark notification as read
// ============================================================

export const MarkReadSchema = z.object({
  id: z.string().uuid('Kailangan ng valid notification ID.'),
});

export type MarkReadPayload = z.infer<typeof MarkReadSchema>;
