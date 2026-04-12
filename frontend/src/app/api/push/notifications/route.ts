/**
 * Notifications API Route — GET/PATCH in-app notification log
 * Feature: Push Notifications (Gap B6)
 * Role: Lists recent notifications for the notification bell dropdown
 *       and allows marking individual notifications as read.
 *
 * Flow: Auth check → GET returns recent 20 (unread first) / PATCH sets read_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { MarkReadSchema } from '@/lib/push/schemas';
import type { NotificationRow } from '@/lib/push/types';

// ============================================================
// GET — List recent notifications (last 20, unread first)
// ============================================================

export async function GET() {
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const { data: notifications } = await svc
      .from('notifications')
      .select('id, user_id, notification_type, title, body, url, read_at, created_at')
      .eq('user_id', DEV_USER.id)
      .is('deleted_at', null)
      .order('read_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false })
      .limit(20);

    // Count unread
    const { count } = await svc
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', DEV_USER.id)
      .is('deleted_at', null)
      .is('read_at', null);

    return NextResponse.json({
      success: true,
      data: {
        notifications: (notifications ?? []) as NotificationRow[],
        unread_count: count ?? 0,
      },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated', message_tl: 'Kailangan mag-login muna.' } },
      { status: 401 }
    );
  }

  const { data: notifications, error: queryError } = await supabase
    .from('notifications')
    .select('id, user_id, notification_type, title, body, url, read_at, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('read_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(20);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Query failed', message_tl: 'Hindi makuha ang notifications. Subukan muli.' } },
      { status: 500 }
    );
  }

  // Count unread
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .is('read_at', null);

  return NextResponse.json({
    success: true,
    data: {
      notifications: (notifications ?? []) as NotificationRow[],
      unread_count: count ?? 0,
    },
  });
}

// ============================================================
// PATCH — Mark a notification as read
// ============================================================

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = MarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          message_tl: 'Mali ang data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { id } = parsed.data;

  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const { data: updated, error: updateError } = await svc
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', DEV_USER.id)
      .is('deleted_at', null)
      .select('id, read_at')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found', message_tl: 'Hindi makita ang notification.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated', message_tl: 'Kailangan mag-login muna.' } },
      { status: 401 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id, read_at')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found', message_tl: 'Hindi makita ang notification.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
