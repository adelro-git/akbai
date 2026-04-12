/**
 * BIR Deadline Push Triggers — Generate push notifications for upcoming deadlines
 * Feature: Push Notifications (Gap B6)
 * Role: Checks a user's upcoming BIR deadlines and sends push notifications
 *       at 7/3/1 day windows. Uses existing deadline notification logic from
 *       lib/deadlines/notifications.ts and extends it with push delivery.
 *
 * Flow: Fetch user's deadlines → getUpcomingNotifications() → build push payloads
 *       → send via sendPushToUser() → update notified flags on deadline rows
 *
 * Dependencies: lib/deadlines/notifications.ts, lib/push/send.ts, Supabase service client
 * IMPORTANT: Server-side only — uses service client for DB access
 */

import { createServiceClient } from '@/lib/supabase/service';
import { getManilaToday } from '@/lib/timezone';
import { getUpcomingNotifications } from '@/lib/deadlines/notifications';
import { sendPushToUser } from './send';
import type { DeadlineRow } from '@/lib/deadlines/types';
import type { DeadlineNotification } from '@/lib/deadlines/types';
import type { PushPayload } from './types';

// ============================================================
// Push Notification Text — conversational Filipino messages
// Different tone per urgency level (7d = gentle, 3d = urgent, 1d = action)
// ============================================================

export function buildDeadlinePushText(
  notification: DeadlineNotification
): { title: string; body: string } {
  const { form_name, due_date, notification_type } = notification;

  // Format due_date for display (e.g., "April 15")
  const dateObj = new Date(due_date + 'T00:00:00');
  const displayDate = dateObj.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
  });

  switch (notification_type) {
    case '7d':
      return {
        title: `BIR Deadline Reminder`,
        body: `Reminder: May deadline ka sa ${form_name} sa ${displayDate}. Handa ka na ba?`,
      };
    case '3d':
      return {
        title: `BIR Deadline: 3 Araw Na Lang!`,
        body: `3 araw na lang bago ang deadline ng ${form_name} mo. Huwag kalimutan!`,
      };
    case '1d':
      return {
        title: `BIR Deadline Bukas Na!`,
        body: `Bukas na ang deadline ng ${form_name}! I-file na ngayon.`,
      };
  }
}

// ============================================================
// Trigger Deadline Notifications — main entry point
// Fetches user's deadlines, determines which need push notifications,
// sends them, and marks the deadline rows as notified.
// ============================================================

export async function triggerDeadlineNotifications(
  userId: string
): Promise<{ sent: number; notifications: Array<{ form_name: string; type: string }> }> {
  const supabase = createServiceClient();
  const today = getManilaToday();

  // --- Fetch user's upcoming deadlines ---
  const { data: deadlines } = await supabase
    .from('bir_deadlines')
    .select('id, user_id, form_name, due_date, description, status, notified_7d, notified_3d, notified_1d, created_at, updated_at')
    .eq('user_id', userId)
    .eq('status', 'upcoming')
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (!deadlines || deadlines.length === 0) {
    return { sent: 0, notifications: [] };
  }

  // --- Determine which deadlines need notifications ---
  const upcomingNotifications = getUpcomingNotifications(
    deadlines as DeadlineRow[],
    today
  );

  if (upcomingNotifications.length === 0) {
    return { sent: 0, notifications: [] };
  }

  // --- Send push for each notification ---
  let totalSent = 0;
  const sentNotifications: Array<{ form_name: string; type: string }> = [];

  for (const notification of upcomingNotifications) {
    const { title, body } = buildDeadlinePushText(notification);
    const payload: PushPayload = {
      title,
      body,
      icon: '/icons/icon-192.png',
      url: '/deadlines',
      tag: `bir-deadline-${notification.deadline_id}-${notification.notification_type}`,
    };

    const result = await sendPushToUser(userId, payload, 'bir_deadline');
    totalSent += result.sent;

    // --- Update notified flag on the deadline row ---
    const flagColumn = `notified_${notification.notification_type}` as
      | 'notified_7d'
      | 'notified_3d'
      | 'notified_1d';

    await supabase
      .from('bir_deadlines')
      .update({
        [flagColumn]: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notification.deadline_id);

    sentNotifications.push({
      form_name: notification.form_name,
      type: notification.notification_type,
    });
  }

  return { sent: totalSent, notifications: sentNotifications };
}
