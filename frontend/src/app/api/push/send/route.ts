/**
 * Push Send API Route — Send push notification to a user (service-role only)
 * Feature: Push Notifications (Gap B6)
 * Role: Internal endpoint for sending push notifications. Protected by
 *       service-role key check — only callable from server-side code or
 *       admin tools, never from the client.
 *
 * Flow: Auth check (service-role) → validate body → send via sendPushToUser → respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { SendPushSchema } from '@/lib/push/schemas';
import { sendPushToUser } from '@/lib/push/send';

// ============================================================
// POST — Send push notification (service-role only)
// ============================================================

export async function POST(req: NextRequest) {
  // --- Service-role auth check ---
  const authHeader = req.headers.get('authorization');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message: 'Service role key not configured' } },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Service-role key required' } },
      { status: 403 }
    );
  }

  // --- Parse body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } },
      { status: 400 }
    );
  }

  const parsed = SendPushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { user_id, notification_type, title, body: notifBody, icon, url, tag } = parsed.data;

  // --- Send push notification ---
  const payload = {
    title,
    body: notifBody,
    icon: icon ?? '/icons/icon-192.png',
    url,
    tag,
  };

  const result = await sendPushToUser(user_id, payload, notification_type);

  return NextResponse.json({
    success: true,
    data: { sent: result.sent, total: result.total },
  });
}
