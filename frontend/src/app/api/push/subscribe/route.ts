/**
 * Push Subscribe API Route — Save push subscription to database
 * Feature: Push Notifications (Gap B6) + Native Push (Sprint 16, Gap G4 mitigation)
 * Role: Receives a push subscription from the browser (Web Push) or the
 *       Capacitor app (FCM/APNs native token) and persists it. Also ensures
 *       default notification preferences exist for the user.
 *
 * Flow: Auth check → validate body (discriminated on `platform`)
 *       → branch on platform:
 *           web    → soft-delete existing same-endpoint    → insert
 *           native → soft-delete existing same-native_token → insert
 *                    (writes the FCM token into BOTH `native_token` AND `endpoint`
 *                     to satisfy the NOT NULL endpoint column carried over from
 *                     migration 018 — architect §3 recommendation)
 *       → ensure default preferences → respond.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §3.
 * Schema reference:    migration 020_push_subscriptions_platform_extension.sql.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { SubscribePushSchema, type SubscribePushPayload } from '@/lib/push/schemas';
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
// Helper — build the insert/upsert payload for one push_subscriptions row,
// branching on the discriminator. Web rows ship VAPID columns; native rows
// ship `native_token` + `device_id` AND duplicate the token into `endpoint`
// (architect §3 — the endpoint column stayed NOT NULL after migration 020,
// so we satisfy it with the same FCM/APNs token).
// ============================================================

type PushInsertRow = {
  user_id: string;
  platform: 'web' | 'android' | 'ios';
  endpoint: string;
  p256dh_key: string | null;
  auth_key: string | null;
  native_token: string | null;
  device_id: string | null;
};

function buildInsertRow(userId: string, payload: SubscribePushPayload): PushInsertRow {
  if (payload.platform === 'web') {
    return {
      user_id: userId,
      platform: 'web',
      endpoint: payload.endpoint,
      p256dh_key: payload.p256dh_key,
      auth_key: payload.auth_key,
      native_token: null,
      device_id: null,
    };
  }
  // Native (android | ios) — token goes into BOTH columns.
  return {
    user_id: userId,
    platform: payload.platform,
    endpoint: payload.native_token,
    p256dh_key: null,
    auth_key: null,
    native_token: payload.native_token,
    device_id: payload.device_id ?? null,
  };
}

// ============================================================
// Helper — soft-delete any existing row that would collide with the new
// insert. Web collides on (user_id, endpoint, platform='web'); native
// collides on (user_id, native_token). These match the two partial unique
// indexes added by migration 020.
// ============================================================

type SupabaseLike = {
  from: (table: string) => {
    update: (values: { deleted_at: string }) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            is: (col: string, val: null) => Promise<unknown>;
          };
          is: (col: string, val: null) => Promise<unknown>;
        };
      };
    };
  };
};

async function softDeleteCollidingRow(
  supabase: SupabaseLike,
  userId: string,
  payload: SubscribePushPayload
): Promise<void> {
  const deletedAt = new Date().toISOString();
  const update = supabase
    .from('push_subscriptions')
    .update({ deleted_at: deletedAt });

  if (payload.platform === 'web') {
    await update
      .eq('user_id', userId)
      .eq('endpoint', payload.endpoint)
      .eq('platform', 'web')
      .is('deleted_at', null);
  } else {
    await update
      .eq('user_id', userId)
      .eq('native_token', payload.native_token)
      .is('deleted_at', null);
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

  const payload = parsed.data;

  // --- Dev bypass: use service client ---
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const userId = DEV_USER.id;

    await softDeleteCollidingRow(svc as unknown as SupabaseLike, userId, payload);

    const { error: insertError } = await svc
      .from('push_subscriptions')
      .insert(buildInsertRow(userId, payload));

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

  // --- Soft-delete colliding row (web: same endpoint; native: same native_token) ---
  await softDeleteCollidingRow(supabase as unknown as SupabaseLike, user.id, payload);

  // --- Insert new subscription ---
  const { error: insertError } = await supabase
    .from('push_subscriptions')
    .insert(buildInsertRow(user.id, payload));

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
