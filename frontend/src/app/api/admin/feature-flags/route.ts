/**
 * Admin Feature Flags API — List users with flags + toggle individual flags
 * Feature: Admin Dashboard (Gap D10)
 * Role: Wraps existing setFeatureFlag() for admin UI. GET returns all users
 *       with their current feature_flags JSONB. PATCH toggles a single flag.
 *
 * Auth: Requires admin email match
 * Dependencies: createServiceClient(), setFeatureFlag() from feature-flags/admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin/auth';
import { setFeatureFlag } from '@/lib/feature-flags/admin';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';
import { ToggleFeatureFlagSchema } from '@/lib/admin/schemas';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

// ============================================================
// adminAuthCheck — Shared auth for GET and PATCH
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
// GET — List all users with their feature flags
// ============================================================

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'admin', windowMs: 60_000, maxRequests: 60 });
  if (limited) return limited;

  const authResult = await adminAuthCheck();
  if (authResult instanceof NextResponse) return authResult;

  const service = createServiceClient();

  const { data: users, error } = await service
    .from('users')
    .select('id, email, full_name, feature_flags')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch users.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: users ?? [] });
}

// ============================================================
// PATCH — Toggle a feature flag for a specific user
// Wraps the existing setFeatureFlag() utility.
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

  const parsed = ToggleFeatureFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'userId (uuid), flag (string), and value (boolean) required.',
        },
      },
      { status: 400 }
    );
  }

  try {
    await setFeatureFlag(parsed.data.userId, parsed.data.flag, parsed.data.value);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'FLAG_UPDATE_FAILED', message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: parsed.data.userId,
      flag: parsed.data.flag,
      value: parsed.data.value,
    },
  });
}
