/**
 * Tests for Deadline Notification Logic
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 */

import { describe, it, expect } from 'vitest';
import { getUpcomingNotifications, daysUntilDeadline } from '../notifications';
import type { DeadlineRow } from '../types';

// ============================================================
// Helper — create a mock deadline row
// ============================================================

function mockDeadline(overrides: Partial<DeadlineRow> = {}): DeadlineRow {
  return {
    id: 'dl-1',
    user_id: 'user-1',
    form_name: '1701Q',
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

// ============================================================
// daysUntilDeadline
// ============================================================

describe('daysUntilDeadline', () => {
  it('returns positive days for future deadline', () => {
    expect(daysUntilDeadline('2026-04-15', '2026-04-10')).toBe(5);
  });

  it('returns 0 for same day', () => {
    expect(daysUntilDeadline('2026-04-15', '2026-04-15')).toBe(0);
  });

  it('returns negative for overdue deadline', () => {
    expect(daysUntilDeadline('2026-04-15', '2026-04-18')).toBe(-3);
  });

  it('returns 1 for tomorrow', () => {
    expect(daysUntilDeadline('2026-04-15', '2026-04-14')).toBe(1);
  });

  it('returns 7 for exactly 7 days away', () => {
    expect(daysUntilDeadline('2026-04-15', '2026-04-08')).toBe(7);
  });
});

// ============================================================
// getUpcomingNotifications — 7-day window
// ============================================================

describe('getUpcomingNotifications — 7d notifications', () => {
  it('returns 7d notification when within 7 days and not notified', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-10');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].notification_type).toBe('7d');
    expect(notifications[0].form_name).toBe('1701Q');
  });

  it('does NOT return 7d notification if already notified', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', notified_7d: true })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-10');

    expect(notifications).toHaveLength(0);
  });

  it('does NOT return notification for deadlines > 7 days away', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-20' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-10');

    expect(notifications).toHaveLength(0);
  });
});

// ============================================================
// getUpcomingNotifications — 3-day window
// ============================================================

describe('getUpcomingNotifications — 3d notifications', () => {
  it('returns 3d notification when within 3 days and not notified', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-13');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].notification_type).toBe('3d');
  });

  it('does NOT return 3d if already notified', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', notified_3d: true })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-13');

    expect(notifications).toHaveLength(0);
  });
});

// ============================================================
// getUpcomingNotifications — 1-day window
// ============================================================

describe('getUpcomingNotifications — 1d notifications', () => {
  it('returns 1d notification when due tomorrow', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].notification_type).toBe('1d');
  });

  it('returns 1d notification when due today', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-15');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].notification_type).toBe('1d');
    expect(notifications[0].days_until).toBe(0);
  });

  it('does NOT return 1d if already notified', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', notified_1d: true })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications).toHaveLength(0);
  });

  // --- B1 regression: due-today must NOT say "bukas" (due tomorrow) ---
  it('due-today (daysLeft===0) message says it is due TODAY, not bukas', () => {
    const deadlines = [mockDeadline({ form_name: '2551Q', due_date: '2026-04-15' })];
    const [n] = getUpcomingNotifications(deadlines, '2026-04-15');

    expect(n.notification_type).toBe('1d');
    expect(n.message).toContain('Ngayong araw');
    expect(n.message).toContain('2551Q');
    expect(n.message).not.toContain('Bukas');
  });

  it('due-tomorrow (daysLeft===1) message still says "Bukas na"', () => {
    const deadlines = [mockDeadline({ form_name: '2551Q', due_date: '2026-04-15' })];
    const [n] = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(n.notification_type).toBe('1d');
    expect(n.message).toContain('Bukas na');
  });

  // --- B1: due-today reminder must still fire even if notified_1d was already
  // set by the day-before send (single-flag suppression bug). ---
  it('still fires the due-today reminder even when notified_1d is already true', () => {
    const deadlines = [
      mockDeadline({ form_name: '2551Q', due_date: '2026-04-15', notified_1d: true }),
    ];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-15');

    expect(notifications).toHaveLength(1);
    expect(notifications[0].notification_type).toBe('1d');
    expect(notifications[0].days_until).toBe(0);
    expect(notifications[0].message).toContain('Ngayong araw');
  });
});

// ============================================================
// getUpcomingNotifications — status filtering
// ============================================================

describe('getUpcomingNotifications — status filtering', () => {
  it('skips filed deadlines', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', status: 'filed' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications).toHaveLength(0);
  });

  it('skips overdue-status deadlines', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', status: 'overdue' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications).toHaveLength(0);
  });

  it('skips na deadlines', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15', status: 'na' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications).toHaveLength(0);
  });

  it('skips past deadlines (days < 0)', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-10' })];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-15');

    expect(notifications).toHaveLength(0);
  });
});

// ============================================================
// getUpcomingNotifications — multiple deadlines
// ============================================================

describe('getUpcomingNotifications — multiple deadlines', () => {
  it('returns notifications for multiple deadlines', () => {
    const deadlines = [
      mockDeadline({ id: 'dl-1', form_name: '1701Q', due_date: '2026-04-15' }),
      mockDeadline({ id: 'dl-2', form_name: '2551Q', due_date: '2026-04-13' }),
    ];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-12');

    expect(notifications).toHaveLength(2);
  });

  it('sorts by urgency (fewest days first)', () => {
    const deadlines = [
      mockDeadline({ id: 'dl-1', form_name: '1701Q', due_date: '2026-04-20' }),
      mockDeadline({ id: 'dl-2', form_name: '2551Q', due_date: '2026-04-15' }),
    ];
    const notifications = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(notifications[0].form_name).toBe('2551Q');
    expect(notifications[1].form_name).toBe('1701Q');
  });
});

// ============================================================
// getUpcomingNotifications — Taglish messages
// ============================================================

describe('getUpcomingNotifications — messages', () => {
  it('7d message includes form name and days', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const [n] = getUpcomingNotifications(deadlines, '2026-04-10');

    expect(n.message).toContain('1701Q');
    expect(n.message).toContain('5');
  });

  it('3d message includes urgency language', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const [n] = getUpcomingNotifications(deadlines, '2026-04-13');

    expect(n.message).toContain('Malapit');
  });

  it('1d message includes bukas', () => {
    const deadlines = [mockDeadline({ due_date: '2026-04-15' })];
    const [n] = getUpcomingNotifications(deadlines, '2026-04-14');

    expect(n.message).toContain('Bukas');
  });
});
