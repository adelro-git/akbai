/**
 * Admin Flags API — List and resolve flag-as-wrong reports
 * Feature: Admin Dashboard (Gap D10)
 * Role: Surfaces AI output reports that users flagged as incorrect.
 *       Admin can review and resolve them.
 *
 * Auth: Requires admin email match
 * Dependencies: createServiceClient(), content_flags table
 *
 * Note: The content_flags table stores user-reported issues with AI outputs.
 *       If it doesn't exist yet, the endpoint returns an empty array gracefully.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin/auth';
import { ResolveFlagSchema } from '@/lib/admin/schemas';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

// ============================================================
// adminAuthCheck — Shared auth check for GET and PATCH
// Returns userId on success, or a NextResponse error on failure.
// ============================================================

async function adminAuthCheck(): Promise<string | NextResponse> {
  if (SKIP_AUTH) {
    return DEV_USER.id;
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } },
      { status: 403 }
    );
  }

  return user.id;
}

// ============================================================
// GET — List unresolved flag-as-wrong reports
// ============================================================

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'admin', windowMs: 60_000, maxRequests: 60 });
  if (limited) return limited;

  const authResult = await adminAuthCheck();
  if (authResult instanceof NextResponse) return authResult;

  const service = createServiceClient();

  const { data: flags, error } = await service
    .from('content_flags')
    .select('id, user_id, message_id, reason, context, resolved, created_at')
    .eq('resolved', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    // Table might not exist yet — return empty array gracefully
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch flags.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: flags ?? [] });
}

// ============================================================
// PATCH — Resolve a flag-as-wrong report
// ============================================================

export async function PATCH(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'admin', windowMs: 60_000, maxRequests: 60 });
  if (limited) return limited;

  const authResult = await adminAuthCheck();
  if (authResult instanceof NextResponse) return authResult;

  // --- Parse and validate body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const parsed = ResolveFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Flag ID (uuid) required.' } },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: updated, error: updateError } = await service
    .from('content_flags')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select('id, resolved, resolved_at')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to resolve flag.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
