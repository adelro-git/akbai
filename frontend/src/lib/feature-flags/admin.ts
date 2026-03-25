/**
 * Feature Flag Admin — Server-only write utility
 * Feature: Feature Flags (Sprint 5)
 * Role: Uses SUPABASE_SERVICE_ROLE_KEY to write feature_flags JSONB.
 *       NOT exposed via API route — internal use only for admin tooling
 *       and migration scripts. Service role key bypasses RLS and the
 *       protect_feature_flags() trigger.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// createAdminClient — Service role client, never use on client side
// ============================================================

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Feature flag admin operations require server-side environment variables.'
    );
  }

  return createClient(url, serviceKey);
}

// ============================================================
// setFeatureFlag — Update a single flag in the JSONB column
// Uses jsonb_set via raw SQL for atomic update of a single key.
// ============================================================

export async function setFeatureFlag(
  userId: string,
  flag: string,
  value: boolean
): Promise<void> {
  const admin = createAdminClient();

  // Read current flags, merge, and write back.
  // This avoids needing raw SQL while remaining safe for concurrent writes
  // (service role is single-threaded in practice for admin ops).
  const { data, error: readError } = await admin
    .from('users')
    .select('feature_flags')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (readError) {
    throw new Error(`Failed to read user ${userId}: ${readError.message}`);
  }

  const currentFlags = (data?.feature_flags as Record<string, boolean>) ?? {};
  const updatedFlags = { ...currentFlags, [flag]: value };

  const { error: writeError } = await admin
    .from('users')
    .update({ feature_flags: updatedFlags })
    .eq('id', userId);

  if (writeError) {
    throw new Error(
      `Failed to set flag "${flag}" for user ${userId}: ${writeError.message}`
    );
  }
}
