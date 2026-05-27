/**
 * Push Unsubscribe API Route — Soft-delete push subscription
 * Feature: Push Notifications (Gap B6) + Native Push (Sprint 16, Gap G4 mitigation)
 * Role: Removes a user's push subscription by setting deleted_at.
 *       Called when the user toggles off notifications or the browser/native
 *       token is rotated.
 *
 * Flow: Auth check → validate body (discriminated on `platform`)
 *       → branch on platform:
 *           web    → soft-delete row where (user_id, endpoint, platform='web')
 *           native → soft-delete row where (user_id, native_token)
 *       → respond.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §3.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { UnsubscribePushSchema, type UnsubscribePushPayload } from '@/lib/push/schemas';

// ============================================================
// Helper — soft-delete the matching subscription row.
// Web uses endpoint; native uses native_token. Both filter on user_id +
// deleted_at IS NULL so a stale row never blocks the new subscribe.
// ============================================================

type SupabaseLike = {
  from: (table: string) => {
    update: (values: { deleted_at: string }) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            is: (col: string, val: null) => Promise<{ error: unknown }>;
          };
          is: (col: string, val: null) => Promise<{ error: unknown }>;
        };
      };
    };
  };
};

async function softDeleteSubscription(
  supabase: SupabaseLike,
  userId: string,
  payload: UnsubscribePushPayload
): Promise<{ error: unknown }> {
  const deletedAt = new Date().toISOString();
  const update = supabase
    .from('push_subscriptions')
    .update({ deleted_at: deletedAt });

  if (payload.platform === 'web') {
    return update
      .eq('user_id', userId)
      .eq('endpoint', payload.endpoint)
      .eq('platform', 'web')
      .is('deleted_at', null);
  }
  return update
    .eq('user_id', userId)
    .eq('native_token', payload.native_token)
    .is('deleted_at', null);
}

// ============================================================
// POST — Soft-delete push subscription
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

  const payload = parsed.data;

  // --- Dev bypass ---
  if (SKIP_AUTH) {
    const svc = createServiceClient();
    await softDeleteSubscription(svc as unknown as SupabaseLike, DEV_USER.id, payload);
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
  const { error: updateError } = await softDeleteSubscription(
    supabase as unknown as SupabaseLike,
    user.id,
    payload
  );

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Update failed', message_tl: 'Hindi ma-update ang subscription. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { unsubscribed: true } });
}
