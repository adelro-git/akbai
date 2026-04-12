/**
 * Push Preferences API Route — GET/PATCH notification preferences
 * Feature: Push Notifications (Gap B6)
 * Role: Returns user's notification preferences (per-type enabled/disabled)
 *       and allows toggling individual notification types on/off.
 *
 * Flow: Auth check → GET returns all preferences / PATCH updates one → respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { UpdatePreferencesSchema } from '@/lib/push/schemas';
import { NOTIFICATION_TYPES } from '@/lib/push/types';
import type { NotificationPreference } from '@/lib/push/types';

// ============================================================
// GET — List all notification preferences for the user
// ============================================================

export async function GET() {
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const { data: prefs } = await svc
      .from('notification_preferences')
      .select('id, user_id, notification_type, enabled, created_at, updated_at')
      .eq('user_id', DEV_USER.id)
      .is('deleted_at', null)
      .order('notification_type');

    return NextResponse.json({
      success: true,
      data: { preferences: (prefs ?? []) as NotificationPreference[] },
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

  const { data: prefs, error: queryError } = await supabase
    .from('notification_preferences')
    .select('id, user_id, notification_type, enabled, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('notification_type');

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Query failed', message_tl: 'Hindi makuha ang preferences. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { preferences: (prefs ?? []) as NotificationPreference[] },
  });
}

// ============================================================
// PATCH — Update a single notification preference
// ============================================================

export async function PATCH(req: NextRequest) {
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

  const parsed = UpdatePreferencesSchema.safeParse(body);
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

  const { notification_type, enabled } = parsed.data;

  // Validate notification_type is in our list
  if (!NOTIFICATION_TYPES.includes(notification_type)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Unknown notification type', message_tl: 'Hindi kilala ang notification type.' } },
      { status: 400 }
    );
  }

  if (SKIP_AUTH) {
    const svc = createServiceClient();
    const { data: updated, error: updateError } = await svc
      .from('notification_preferences')
      .update({ enabled })
      .eq('user_id', DEV_USER.id)
      .eq('notification_type', notification_type)
      .is('deleted_at', null)
      .select('id, notification_type, enabled')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Preference not found', message_tl: 'Hindi makita ang preference.' } },
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
    .from('notification_preferences')
    .update({ enabled })
    .eq('user_id', user.id)
    .eq('notification_type', notification_type)
    .is('deleted_at', null)
    .select('id, notification_type, enabled')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Preference not found', message_tl: 'Hindi makita ang preference.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
