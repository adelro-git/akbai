/**
 * Admin Users API — List all users with subscription and activity data
 * Feature: Admin Dashboard (Gap D10)
 * Role: Provides user list for admin user table. Uses service client
 *       to bypass RLS and read across all users.
 *
 * Auth: Requires admin email match via isAdmin()
 * Dependencies: createServiceClient(), createClient() for auth
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin/auth';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

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

export async function GET() {
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
  const { data: authUsers } = await service.auth.admin.listUsers();
  const signInMap = new Map<string, string | null>();
  if (authUsers?.users) {
    for (const au of authUsers.users) {
      signInMap.set(au.id, au.last_sign_in_at ?? null);
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
