/**
 * Feature Flag Middleware — API route guard helper
 * Feature: Feature Flags (Sprint 5)
 * Role: Provides withFeatureFlag() helper for gating API routes behind
 *       feature flags. Returns a Taglish 403 message when blocked.
 *
 * Usage in an API route:
 *   const allowed = await withFeatureFlag(FLAGS.OCR_ENABLED)(userId);
 *   if (!allowed) return NextResponse.json(
 *     { error: FEATURE_BLOCKED_MESSAGE }, { status: 403 }
 *   );
 */

import { getFeatureFlag } from './index';

// ============================================================
// Taglish message shown when a feature is not yet available
// ============================================================
export const FEATURE_BLOCKED_MESSAGE =
  'Hindi pa available ang feature na ito. Stay tuned!';

// ============================================================
// withFeatureFlag — curried helper for API route guards
// ============================================================

export function withFeatureFlag(flagName: string) {
  return async (userId: string): Promise<boolean> => {
    return getFeatureFlag(userId, flagName);
  };
}
