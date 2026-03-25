/**
 * Feature Flag Reader — Queries users.feature_flags JSONB via Supabase
 * Feature: Feature Flags (Sprint 5)
 * Role: Read-only access to per-user feature flags. Uses fail-closed
 *       pattern — returns false if flag is missing or query errors.
 *       In SKIP_AUTH dev mode, all flags return true.
 */

import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

// ============================================================
// getFeatureFlag — Check a single flag for a user (fail-closed)
// ============================================================

export async function getFeatureFlag(
  userId: string,
  flagName: string
): Promise<boolean> {
  // --- Dev bypass: all flags enabled in SKIP_AUTH mode ---
  if (SKIP_AUTH) {
    return true;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('feature_flags')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return false;
    }

    const flags = data.feature_flags as Record<string, boolean> | null;
    if (!flags || typeof flags[flagName] !== 'boolean') {
      return false;
    }

    return flags[flagName];
  } catch {
    // Fail-closed: any unexpected error returns false
    return false;
  }
}

// ============================================================
// getAllFeatureFlags — Return all flags for a user
// ============================================================

export async function getAllFeatureFlags(
  userId: string
): Promise<Record<string, boolean>> {
  // --- Dev bypass: return all known flags as true ---
  if (SKIP_AUTH) {
    const { FLAGS } = await import('./flags');
    const devFlags: Record<string, boolean> = {};
    for (const key of Object.values(FLAGS)) {
      devFlags[key] = true;
    }
    return devFlags;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('feature_flags')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return {};
    }

    const flags = data.feature_flags as Record<string, boolean> | null;
    return flags ?? {};
  } catch {
    return {};
  }
}
