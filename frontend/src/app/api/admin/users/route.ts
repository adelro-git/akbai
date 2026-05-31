/**
 * Admin Users API — List all users with subscription and activity data
 * Feature: Admin Dashboard (Gap D10)
 * Role: Provides user list for admin user table. Uses service client
 *       to bypass RLS and read across all users.
 *
 * Auth: Requires admin email match via isAdmin()
 * Dependencies: createServiceClient(), createClient() for auth
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin/auth';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';

// ============================================================
// Types — User row shape returned by this endpoint
// ============================================================

interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  subscription_tier: string | null;
  onboarding_completed: boolean;
  feature_flags: Record<string, boolean> | null;
  created_at: string;
  last_sign_in_at: string | null;
}

// ============================================================
// GET — List all users with tier, onboarding, and activity info
// ============================================================

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'admin', windowMs: 60_000, maxRequests: 60 });
  if (limited) return limited;

  // --- Auth Check: Verify session and admin status ---
  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
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

    userId = user.id;
  }

  // --- Fetch: Read all users via service client (bypasses RLS) ---
  const service = createServiceClient();

  const { data: users, error: queryError } = await service
    .from('users')
    .select('id, email, full_name, business_name, subscription_tier, onboarding_completed, feature_flags, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch users.' } },
      { status: 500 }
    );
  }

  // --- Enrich: Get last sign-in from Supabase Auth admin API ---
  // GoTrue's listUsers() defaults to perPage=50 and does NOT paginate on its
  // own (A1). Without looping, last_sign_in_at is null for every user past the
  // first page. Walk pages until a short page is returned, capped at
  // MAX_AUTH_PAGES so a misbehaving API can't spin us forever.
  const PER_PAGE = 1000;
  const MAX_AUTH_PAGES = 50; // hard ceiling: 50k auth users
  const signInMap = new Map<string, string | null>();

  for (let page = 1; page <= MAX_AUTH_PAGES; page++) {
    const { data: authPage, error: authError } = await service.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });

    if (authError || !authPage?.users || authPage.users.length === 0) {
      break;
    }

    for (const au of authPage.users) {
      signInMap.set(au.id, au.last_sign_in_at ?? null);
    }

    // A short page (fewer than requested) means we've reached the end.
    if (authPage.users.length < PER_PAGE) {
      break;
    }
  }

  const enrichedUsers: AdminUserRow[] = (users ?? []).map((u) => ({
    id: u.id as string,
    email: u.email as string,
    full_name: u.full_name as string | null,
    business_name: u.business_name as string | null,
    subscription_tier: (u.subscription_tier as string) ?? 'free',
    onboarding_completed: (u.onboarding_completed as boolean) ?? false,
    feature_flags: (u.feature_flags as Record<string, boolean>) ?? null,
    created_at: u.created_at as string,
    last_sign_in_at: signInMap.get(u.id as string) ?? null,
  }));

  return NextResponse.json({ success: true, data: enrichedUsers });
}
