/**
 * Tests for BIR Deadline Push Triggers
 * Feature: Push Notifications (Gap B6)
 * Tests the push notification text generation for 7d/3d/1d windows.
 * The actual push delivery is tested via API route tests (mocked).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildDeadlinePushText } from '../deadline-triggers';
import type { DeadlineNotification, DeadlineRow } from '@/lib/deadlines/types';

// ============================================================
// Mocks — sendPushToUser, supabase service client, timezone.
// Used only by the triggerDeadlineNotifications() tests (G1/G2). The pure
// buildDeadlinePushText tests below do not depend on these.
// ============================================================

const mockSendPushToUser = vi.fn();
vi.mock('../send', () => ({
  sendPushToUser: (...args: unknown[]) => mockSendPushToUser(...args),
}));

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-15',
}));

// Mutable seams the trigger tests plant.
const mockDeadlineRows: DeadlineRow[] = [];
const mockFlagUpdate = vi.fn();
// Result returned by the bir_deadlines .update().eq() chain (lets us simulate
// a flag-write failure for the G2 logging path).
const mockFlagUpdateResult: { error: unknown } = { error: null };

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === 'bir_deadlines') {
        return {
          // Read chain: .select().eq().eq().is().order()
          select: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  order: async () => ({ data: mockDeadlineRows, error: null }),
                }),
              }),
            }),
          }),
          // Write chain: .update().eq()
          update: (values: Record<string, unknown>) => ({
            eq: async (col: string, id: string) => {
              mockFlagUpdate(values, col, id);
              return { error: mockFlagUpdateResult.error };
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

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

// ============================================================
// triggerDeadlineNotifications — notified-flag gating (G1/G2)
// ============================================================

function mockDeadlineRow(overrides: Partial<DeadlineRow> = {}): DeadlineRow {
  return {
    id: 'dl-1',
    user_id: 'user-1',
    form_name: '1701Q',
    // getManilaToday() is mocked to 2026-04-15, so this is due TODAY (1d window).
    due_date: '2026-04-15',
    description: 'Quarterly Income Tax Return',
    status: 'upcoming',
    notified_7d: false,
    notified_3d: false,
    notified_1d: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

async function importTriggers() {
  return import('../deadline-triggers');
}

describe('triggerDeadlineNotifications — notified-flag gating (G1/G2)', () => {
  beforeEach(() => {
    mockSendPushToUser.mockReset();
    mockFlagUpdate.mockReset();
    mockDeadlineRows.length = 0;
    mockFlagUpdateResult.error = null;
  });

  it('sets the notified flag when sent > 0', async () => {
    mockDeadlineRows.push(mockDeadlineRow());
    mockSendPushToUser.mockResolvedValue({ sent: 1, total: 1 });

    const { triggerDeadlineNotifications } = await importTriggers();
    const result = await triggerDeadlineNotifications('user-1');

    expect(mockSendPushToUser).toHaveBeenCalledOnce();
    expect(mockFlagUpdate).toHaveBeenCalledOnce();
    const [values] = mockFlagUpdate.mock.calls[0];
    expect((values as Record<string, unknown>).notified_1d).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.notifications).toHaveLength(1);
  });

  // --- G1 regression: do NOT set the flag when nothing was delivered
  // (no subs / preference disabled / all failed), or the reminder is lost. ---
  it('does NOT set the notified flag when sent === 0', async () => {
    mockDeadlineRows.push(mockDeadlineRow());
    mockSendPushToUser.mockResolvedValue({ sent: 0, total: 0 });

    const { triggerDeadlineNotifications } = await importTriggers();
    const result = await triggerDeadlineNotifications('user-1');

    expect(mockSendPushToUser).toHaveBeenCalledOnce();
    expect(mockFlagUpdate).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    // Nothing recorded as sent → eligible for re-send next cron.
    expect(result.notifications).toHaveLength(0);
  });

  // --- G2: a flag-write failure AFTER a successful send is logged, not thrown
  // (at-least-once: the push went out; the next cron may harmlessly re-send). ---
  it('logs but does not throw when the flag write fails after a successful send', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockDeadlineRows.push(mockDeadlineRow());
    mockSendPushToUser.mockResolvedValue({ sent: 1, total: 1 });
    mockFlagUpdateResult.error = { message: 'write conflict' };

    const { triggerDeadlineNotifications } = await importTriggers();
    const result = await triggerDeadlineNotifications('user-1');

    expect(mockFlagUpdate).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();
    // Send still counts even though the flag write failed.
    expect(result.sent).toBe(1);
    expect(result.notifications).toHaveLength(1);
    errorSpy.mockRestore();
  });

  it('returns early with sent=0 when the user has no upcoming deadlines', async () => {
    // mockDeadlineRows left empty.
    const { triggerDeadlineNotifications } = await importTriggers();
    const result = await triggerDeadlineNotifications('user-1');

    expect(mockSendPushToUser).not.toHaveBeenCalled();
    expect(mockFlagUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, notifications: [] });
  });
});
