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
// normalizeEmail — Case/whitespace-insensitive email comparison key (G8)
// Email local-parts are case-insensitive in practice and providers fold
// case; a raw === comparison let "Anton@akbai.ph" or " anton@akbai.ph "
// slip past (false negative) or, worse, fail to match the configured admin.
// Returns null for missing emails so callers never match on empty string.
// ============================================================

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

// ============================================================
// isAdmin — Check if a user ID belongs to the admin account
// Reads the user's email from Supabase auth and compares
// against the ADMIN_EMAIL environment variable.
// ============================================================

export async function isAdmin(userId: string): Promise<boolean> {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  if (!adminEmail) {
    return false;
  }

  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    return false;
  }

  // Require a confirmed email when GoTrue exposes the field — an unconfirmed
  // address must never be trusted for admin elevation. Older payloads without
  // the field fall through to the email match (no regression).
  if (
    'email_confirmed_at' in data.user &&
    !data.user.email_confirmed_at
  ) {
    return false;
  }

  const userEmail = normalizeEmail(data.user.email);
  return userEmail !== null && userEmail === adminEmail;
}

// ============================================================
// isAdminEmail — Lightweight check when email is already known.
// Avoids a Supabase call when the email is available from the session.
// ============================================================

export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const candidate = normalizeEmail(email);
  if (!adminEmail || !candidate) {
    return false;
  }
  return candidate === adminEmail;
}
