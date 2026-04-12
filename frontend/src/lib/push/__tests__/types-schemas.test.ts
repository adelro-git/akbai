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
  it('validates correct subscribe input', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      p256dh_key: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlw5Ke3P-Lx9ysG42RcHqDvN_a5HkWcO1vHVdA',
      auth_key: 'tBHItJI5svbpC7sc3fAhFQ',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing endpoint', () => {
    const result = SubscribePushSchema.safeParse({
      p256dh_key: 'key123',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid endpoint URL', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'not-a-url',
      p256dh_key: 'key123',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing p256dh_key', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing auth_key', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: 'key123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty p256dh_key', () => {
    const result = SubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      p256dh_key: '',
      auth_key: 'auth123',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// UnsubscribePushSchema
// ============================================================

describe('UnsubscribePushSchema', () => {
  it('validates correct unsubscribe input', () => {
    const result = UnsubscribePushSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing endpoint', () => {
    const result = UnsubscribePushSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid URL', () => {
    const result = UnsubscribePushSchema.safeParse({
      endpoint: 'bad-url',
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
