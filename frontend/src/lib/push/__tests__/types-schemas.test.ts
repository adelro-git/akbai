/**
 * Tests for Push Notification Types & Zod Schemas
 * Feature: Push Notifications (Gap B6)
 * Validates all Zod schemas accept correct input and reject invalid input.
 */

import { describe, it, expect } from 'vitest';
import {
  SubscribePushSchema,
  UnsubscribePushSchema,
  SendPushSchema,
  UpdatePreferencesSchema,
  MarkReadSchema,
} from '../schemas';
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_DESCRIPTIONS } from '../types';

// ============================================================
// NOTIFICATION_TYPES constants
// ============================================================

describe('NOTIFICATION_TYPES', () => {
  it('contains exactly 3 notification types', () => {
    expect(NOTIFICATION_TYPES).toHaveLength(3);
    expect(NOTIFICATION_TYPES).toContain('bir_deadline');
    expect(NOTIFICATION_TYPES).toContain('payment_reminder');
    expect(NOTIFICATION_TYPES).toContain('weekly_recap');
  });

  it('has labels for every notification type', () => {
    for (const t of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_LABELS[t]).toBeDefined();
      expect(typeof NOTIFICATION_TYPE_LABELS[t]).toBe('string');
    }
  });

  it('has descriptions for every notification type', () => {
    for (const t of NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_DESCRIPTIONS[t]).toBeDefined();
      expect(typeof NOTIFICATION_TYPE_DESCRIPTIONS[t]).toBe('string');
    }
  });
});

// ============================================================
// SubscribePushSchema
// ============================================================

describe('SubscribePushSchema', () => {
  // Sprint 16: schema is now a discriminated union on `platform`.
  // Web branch keeps the original VAPID-triple shape; native branch
  // accepts `platform: 'android' | 'ios'` + `native_token` + optional
  // `device_id`. Both branches share `platform` as the load-bearing
  // discriminator (architect §3, migration 020).
  it('validates correct subscribe input (web branch)', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      p256dh_key: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlw5Ke3P-Lx9ysG42RcHqDvN_a5HkWcO1vHVdA',
      auth_key: 'tBHItJI5svbpC7sc3fAhFQ',
    });
    expect(result.success).toBe(true);
  });

  it('rejects web payload missing endpoint', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      p256dh_key: 'key123',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects web payload with invalid endpoint URL', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'not-a-url',
      p256dh_key: 'key123',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects web payload missing p256dh_key', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects web payload missing auth_key', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: 'key123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects web payload with empty p256dh_key', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: '',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  // ===== Sprint 16 native branch =====

  it('validates correct subscribe input (android branch)', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'android',
      native_token: 'fcm-token-abcdef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('validates correct subscribe input (ios branch with device_id)', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'ios',
      native_token: 'apns-token-zyxwvu9876543210',
      device_id: 'device-uuid-abc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects android payload missing native_token', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'android',
    });
    expect(result.success).toBe(false);
  });

  it('rejects android payload with empty native_token', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'android',
      native_token: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects payload missing the platform discriminator', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: 'key123',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects payload with an unknown platform value', () => {
    const result = SubscribePushSchema.safeParse({
      platform: 'windows',
      native_token: 'token',
    });
    expect(result.success).toBe(false);
  });

  it('rejects payload mixing web shape with native platform', () => {
    // platform=android but VAPID columns instead of native_token — invalid.
    const result = SubscribePushSchema.safeParse({
      platform: 'android',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: 'key',
      auth_key: 'auth',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// UnsubscribePushSchema
// ============================================================

describe('UnsubscribePushSchema', () => {
  // Sprint 16: symmetric with SubscribePushSchema — discriminated on
  // `platform`. Web sends `endpoint`; native sends `native_token`.
  it('validates correct unsubscribe input (web branch)', () => {
    const result = UnsubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    });
    expect(result.success).toBe(true);
  });

  it('validates correct unsubscribe input (android branch)', () => {
    const result = UnsubscribePushSchema.safeParse({
      platform: 'android',
      native_token: 'fcm-token-abcdef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('validates correct unsubscribe input (ios branch)', () => {
    const result = UnsubscribePushSchema.safeParse({
      platform: 'ios',
      native_token: 'apns-token-zyxwvu9876543210',
    });
    expect(result.success).toBe(true);
  });

  it('rejects web payload missing endpoint', () => {
    const result = UnsubscribePushSchema.safeParse({ platform: 'web' });
    expect(result.success).toBe(false);
  });

  it('rejects web payload with invalid URL', () => {
    const result = UnsubscribePushSchema.safeParse({
      platform: 'web',
      endpoint: 'bad-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects native payload missing native_token', () => {
    const result = UnsubscribePushSchema.safeParse({ platform: 'android' });
    expect(result.success).toBe(false);
  });

  it('rejects payload missing the platform discriminator', () => {
    const result = UnsubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// SendPushSchema
// ============================================================

describe('SendPushSchema', () => {
  it('validates correct send input', () => {
    const result = SendPushSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      notification_type: 'bir_deadline',
      title: 'BIR Deadline Reminder',
      body: 'May deadline ka sa 1701Q bukas!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = SendPushSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      notification_type: 'weekly_recap',
      title: 'Weekly Recap',
      body: 'Buod ng linggo mo',
      icon: '/icons/icon-192.png',
      url: '/dashboard',
      tag: 'weekly-recap',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing user_id', () => {
    const result = SendPushSchema.safeParse({
      notification_type: 'bir_deadline',
      title: 'Test',
      body: 'Test body',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid user_id (not UUID)', () => {
    const result = SendPushSchema.safeParse({
      user_id: 'not-a-uuid',
      notification_type: 'bir_deadline',
      title: 'Test',
      body: 'Test body',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid notification_type', () => {
    const result = SendPushSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      notification_type: 'invalid_type',
      title: 'Test',
      body: 'Test body',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = SendPushSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      notification_type: 'bir_deadline',
      title: '',
      body: 'Test body',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// UpdatePreferencesSchema
// ============================================================

describe('UpdatePreferencesSchema', () => {
  it('validates correct preference update', () => {
    const result = UpdatePreferencesSchema.safeParse({
      notification_type: 'bir_deadline',
      enabled: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts all notification types', () => {
    for (const t of NOTIFICATION_TYPES) {
      const result = UpdatePreferencesSchema.safeParse({
        notification_type: t,
        enabled: true,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid notification_type', () => {
    const result = UpdatePreferencesSchema.safeParse({
      notification_type: 'fake_type',
      enabled: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing enabled field', () => {
    const result = UpdatePreferencesSchema.safeParse({
      notification_type: 'bir_deadline',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// MarkReadSchema
// ============================================================

describe('MarkReadSchema', () => {
  it('validates correct mark-read input', () => {
    const result = MarkReadSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = MarkReadSchema.safeParse({
      id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = MarkReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
