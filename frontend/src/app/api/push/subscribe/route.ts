/**
 * Push Subscribe API Route — Save push subscription to database
 * Feature: Push Notifications (Gap B6)
 * Role: Receives a Web Push subscription from the browser and persists it.
 *       Also ensures default notification preferences exist for the user.
 *
 * Flow: Auth check → validate body → soft-delete existing same-endpoint
 *       → insert new subscription → ensure default preferences → respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { SubscribePushSchema } from '@/lib/push/schemas';
import { NOTIFICATION_TYPES } from '@/lib/push/types';

// ============================================================
// Helper — ensure default notification preferences exist
// Creates one row per notification type with enabled=true
// if the user doesn't already have preferences.
// ============================================================

async function ensureDefaultPreferences(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<void> {
  for (const notifType of NOTIFICATION_TYPES) {
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('notification_type', notifType)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) {
      await supabase.from('notification_preferences').insert({
        user_id: userId,
        notification_type: notifType,
        enabled: true,
      });
    }
  }
}

// ============================================================
// POST — Save push subscription
// ============================================================

export async function POST(req: NextRequest) {
  // --- Parse body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = SubscribePushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          message_tl: 'Mali ang subscription data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const { endpoint, p256dh_key, auth_key } = parsed.data;

  // --- Dev bypass: use service client ---
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const userId = DEV_USER.id;

    // Soft-delete existing subscription with same endpoint
    await svc
      .from('push_subscriptions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .is('deleted_at', null);

    // Insert new subscription
    const { error: insertError } = await svc
      .from('push_subscriptions')
      .insert({ user_id: userId, endpoint, p256dh_key, auth_key });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Insert failed', message_tl: 'Hindi ma-save ang subscription. Subukan muli.' } },
        { status: 500 }
      );
    }

    await ensureDefaultPreferences(svc, userId);
    return NextResponse.json({ success: true, data: { subscribed: true } }, { status: 201 });
  }

  // --- Auth check ---
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

  // --- Soft-delete existing subscription with same endpoint ---
  await supabase
    .from('push_subscriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
    .is('deleted_at', null);

  // --- Insert new subscription ---
  const { error: insertError } = await supabase
    .from('push_subscriptions')
    .insert({ user_id: user.id, endpoint, p256dh_key, auth_key });

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Insert failed', message_tl: 'Hindi ma-save ang subscription. Subukan muli.' } },
      { status: 500 }
    );
  }

  // --- Ensure default notification preferences exist ---
  const svc = createServiceClient();
  await ensureDefaultPreferences(svc, user.id);

  return NextResponse.json({ success: true, data: { subscribed: true } }, { status: 201 });
}
