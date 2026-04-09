/**
 * Deadline Notification Logic — In-app notification tracking
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9, Task 6)
 * Role: Determines which deadlines need in-app notifications based on
 *       days until due and the notified_7d/3d/1d flags. No push
 *       notifications — this is in-app only.
 */

import type { DeadlineRow, DeadlineNotification } from './types';

// ============================================================
// Calculate days until a deadline from a reference date
// ============================================================

/**
 * Calculate the number of days from referenceDate to the deadline's due_date.
 * Negative values mean the deadline is overdue.
 */
export function daysUntilDeadline(dueDate: string, referenceDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const ref = new Date(referenceDate + 'T00:00:00');
  const diffMs = due.getTime() - ref.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================
// Generate Taglish notification message
// ============================================================

function buildNotificationMessage(
  formName: string,
  daysUntil: number,
  notificationType: '7d' | '3d' | '1d'
): string {
  switch (notificationType) {
    case '7d':
      return `Heads up, Boss! May ${formName} filing ka sa loob ng ${daysUntil} araw. Handa ka na ba?`;
    case '3d':
      return `Malapit na ang deadline ng ${formName}! ${daysUntil} days na lang. Gawin na natin 'to.`;
    case '1d':
      return `Bukas na ang deadline ng ${formName}! I-file na natin para walang penalty.`;
  }
}

// ============================================================
// Main: Get upcoming notifications that haven't been shown yet
// ============================================================

/**
 * Check a list of deadlines and return notifications that should be shown.
 * Only returns notifications for deadlines that:
 * 1. Have status 'upcoming' (not filed/overdue/na)
 * 2. Are within the notification window (7d, 3d, or 1d)
 * 3. Haven't already been notified for that window
 *
 * @param deadlines - Array of deadline rows from the database
 * @param today - Reference date in YYYY-MM-DD format (Manila timezone)
 * @returns Array of notifications to show
 */
export function getUpcomingNotifications(
  deadlines: DeadlineRow[],
  today: string
): DeadlineNotification[] {
  const notifications: DeadlineNotification[] = [];

  for (const deadline of deadlines) {
    // Only notify for upcoming deadlines
    if (deadline.status !== 'upcoming') continue;

    const daysLeft = daysUntilDeadline(deadline.due_date, today);

    // Skip if already past (overdue deadlines handled separately)
    if (daysLeft < 0) continue;

    // Determine the most specific notification window and check if already notified.
    // Priority: 1d > 3d > 7d. If within a window but already notified for it,
    // do NOT fall through to a less specific window.
    if (daysLeft <= 1) {
      if (!deadline.notified_1d) {
        notifications.push({
          deadline_id: deadline.id,
          form_name: deadline.form_name,
          due_date: deadline.due_date,
          days_until: daysLeft,
          notification_type: '1d',
          message: buildNotificationMessage(deadline.form_name, daysLeft, '1d'),
        });
      }
    } else if (daysLeft <= 3) {
      if (!deadline.notified_3d) {
        notifications.push({
          deadline_id: deadline.id,
          form_name: deadline.form_name,
          due_date: deadline.due_date,
          days_until: daysLeft,
          notification_type: '3d',
          message: buildNotificationMessage(deadline.form_name, daysLeft, '3d'),
        });
      }
    } else if (daysLeft <= 7) {
      if (!deadline.notified_7d) {
        notifications.push({
          deadline_id: deadline.id,
          form_name: deadline.form_name,
          due_date: deadline.due_date,
          days_until: daysLeft,
          notification_type: '7d',
          message: buildNotificationMessage(deadline.form_name, daysLeft, '7d'),
        });
      }
    }
  }

  // Sort by urgency (fewest days first)
  notifications.sort((a, b) => a.days_until - b.days_until);

  return notifications;
}
