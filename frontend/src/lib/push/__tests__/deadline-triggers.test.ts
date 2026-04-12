/**
 * Tests for BIR Deadline Push Triggers
 * Feature: Push Notifications (Gap B6)
 * Tests the push notification text generation for 7d/3d/1d windows.
 * The actual push delivery is tested via API route tests (mocked).
 */

import { describe, it, expect } from 'vitest';
import { buildDeadlinePushText } from '../deadline-triggers';
import type { DeadlineNotification } from '@/lib/deadlines/types';

// ============================================================
// Helper — create a mock deadline notification
// ============================================================

function mockNotification(overrides: Partial<DeadlineNotification> = {}): DeadlineNotification {
  return {
    deadline_id: 'dl-1',
    form_name: '1701Q',
    due_date: '2026-04-15',
    days_until: 7,
    notification_type: '7d',
    message: 'test message',
    ...overrides,
  };
}

// ============================================================
// buildDeadlinePushText — 7-day notifications
// ============================================================

describe('buildDeadlinePushText — 7d', () => {
  it('generates correct 7d push notification text', () => {
    const notif = mockNotification({
      notification_type: '7d',
      form_name: '1701Q',
      due_date: '2026-04-15',
      days_until: 7,
    });

    const { title, body } = buildDeadlinePushText(notif);

    expect(title).toBe('BIR Deadline Reminder');
    expect(body).toContain('1701Q');
    expect(body).toContain('April 15');
    expect(body).toContain('Handa ka na ba?');
  });

  it('includes form name in 7d body', () => {
    const notif = mockNotification({
      notification_type: '7d',
      form_name: '2551Q',
      due_date: '2026-07-25',
    });

    const { body } = buildDeadlinePushText(notif);
    expect(body).toContain('2551Q');
    expect(body).toContain('July 25');
  });
});

// ============================================================
// buildDeadlinePushText — 3-day notifications
// ============================================================

describe('buildDeadlinePushText — 3d', () => {
  it('generates correct 3d push notification text', () => {
    const notif = mockNotification({
      notification_type: '3d',
      form_name: '1701Q',
      due_date: '2026-04-15',
      days_until: 3,
    });

    const { title, body } = buildDeadlinePushText(notif);

    expect(title).toContain('3 Araw');
    expect(body).toContain('3 araw na lang');
    expect(body).toContain('1701Q');
    expect(body).toContain('Huwag kalimutan!');
  });

  it('includes form name in 3d body', () => {
    const notif = mockNotification({
      notification_type: '3d',
      form_name: '2550Q',
      due_date: '2026-05-15',
    });

    const { body } = buildDeadlinePushText(notif);
    expect(body).toContain('2550Q');
  });
});

// ============================================================
// buildDeadlinePushText — 1-day notifications
// ============================================================

describe('buildDeadlinePushText — 1d', () => {
  it('generates correct 1d push notification text', () => {
    const notif = mockNotification({
      notification_type: '1d',
      form_name: '1701Q',
      due_date: '2026-04-15',
      days_until: 1,
    });

    const { title, body } = buildDeadlinePushText(notif);

    expect(title).toContain('Bukas');
    expect(body).toContain('Bukas na ang deadline');
    expect(body).toContain('1701Q');
    expect(body).toContain('I-file na ngayon');
  });

  it('includes form name in 1d body', () => {
    const notif = mockNotification({
      notification_type: '1d',
      form_name: '1601C',
      due_date: '2026-01-15',
    });

    const { body } = buildDeadlinePushText(notif);
    expect(body).toContain('1601C');
  });
});

// ============================================================
// buildDeadlinePushText — all types produce non-empty results
// ============================================================

describe('buildDeadlinePushText — completeness', () => {
  it('all notification types produce non-empty title and body', () => {
    const types: Array<'7d' | '3d' | '1d'> = ['7d', '3d', '1d'];

    for (const notifType of types) {
      const notif = mockNotification({
        notification_type: notifType,
        form_name: 'TestForm',
        due_date: '2026-06-15',
      });

      const { title, body } = buildDeadlinePushText(notif);

      expect(title.length).toBeGreaterThan(0);
      expect(body.length).toBeGreaterThan(0);
      expect(body).toContain('TestForm');
    }
  });

  it('7d and 3d texts are distinct', () => {
    const notif7d = mockNotification({ notification_type: '7d' });
    const notif3d = mockNotification({ notification_type: '3d' });

    const text7d = buildDeadlinePushText(notif7d);
    const text3d = buildDeadlinePushText(notif3d);

    expect(text7d.body).not.toBe(text3d.body);
    expect(text7d.title).not.toBe(text3d.title);
  });

  it('1d text contains urgency language', () => {
    const notif = mockNotification({ notification_type: '1d' });
    const { body } = buildDeadlinePushText(notif);

    // Should contain urgent Filipino language
    expect(body).toMatch(/Bukas|ngayon|I-file/);
  });
});
