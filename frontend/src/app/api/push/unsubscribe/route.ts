/**
 * Push Unsubscribe API Route — Soft-delete push subscription
 * Feature: Push Notifications (Gap B6)
 * Role: Removes a user's push subscription by setting deleted_at.
 *       Called when user toggles off notifications or browser subscription expires.
 *
 * Flow: Auth check → validate body → soft-delete matching subscription → respond
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { UnsubscribePushSchema } from '@/lib/push/schemas';

// ============================================================
// POST — Soft-delete push subscription by endpoint
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

  const parsed = UnsubscribePushSchema.safeParse(body);
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

  const { endpoint } = parsed.data;

  // --- Dev bypass ---
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    await svc
      .from('push_subscriptions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', DEV_USER.id)
      .eq('endpoint', endpoint)
      .is('deleted_at', null);

    return NextResponse.json({ success: true, data: { unsubscribed: true } });
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

  // --- Soft-delete subscription ---
  const { error: updateError } = await supabase
    .from('push_subscriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
    .is('deleted_at', null);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Update failed', message_tl: 'Hindi ma-update ang subscription. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { unsubscribed: true } });
}
