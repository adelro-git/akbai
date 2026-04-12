/**
 * Admin Auth Helper — Email-based admin verification
 * Feature: Admin Dashboard (Gap D10)
 * Role: Checks user email against ADMIN_EMAIL env var.
 *       Reusable across all admin API routes and the admin layout guard.
 *
 * Dependencies: ADMIN_EMAIL env var, Supabase service client
 */

import { createServiceClient } from '@/lib/supabase/service';

// ============================================================
// isAdmin — Check if a user ID belongs to the admin account
// Reads the user's email from Supabase auth and compares
// against the ADMIN_EMAIL environment variable.
// ============================================================

export async function isAdmin(userId: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return false;
  }

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    return false;
  }

  return data.user.email === adminEmail;
}

// ============================================================
// isAdminEmail — Lightweight check when email is already known.
// Avoids a Supabase call when the email is available from the session.
// ============================================================

export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) {
    return false;
  }
  return email === adminEmail;
}
