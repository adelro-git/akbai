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
import { verifyBearer } from '@/lib/security/constant-time';

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

  // G4 fix: constant-time Bearer compare via the shared security primitive
  // (same as the cron + RevenueCat routes). A plain `!==` short-circuits on the
  // first differing byte, leaking — via timing — how many leading bytes of a
  // guessed key were correct. verifyBearer is fail-closed (unset secret →
  // false) and does not early-exit on content.
  if (!verifyBearer(authHeader, serviceRoleKey)) {
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

  // G7 fix: sendPushToUser → getVapidConfig() throws when VAPID env vars are
  // missing (and other transient send-path errors can surface too). An unhandled
  // throw here would bubble up as an opaque framework 500 with no structured
  // body. Wrap it so callers always get the route's { success, error } envelope.
  try {
    const result = await sendPushToUser(user_id, payload, notification_type);

    return NextResponse.json({
      success: true,
      data: { sent: result.sent, total: result.total },
    });
  } catch (error: unknown) {
    console.error('[push/send] sendPushToUser failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PUSH_SEND_FAILED',
          message: 'Hindi naipadala ang push notification. Subukan ulit mamaya.',
        },
      },
      { status: 500 }
    );
  }
}
