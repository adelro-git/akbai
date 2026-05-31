/**
 * Dev-only auth bypass — lets you skip OTP login when NEXT_PUBLIC_SKIP_AUTH=true.
 * NEVER enable this in production.
 *
 * Production guard (A2 + G6): NEXT_PUBLIC_SKIP_AUTH is a build-time public env
 * var, so a leaked/forgotten "true" would otherwise disable admin auth AND
 * force-enable every gated feature flag in a production build. We pin the flag
 * so it can ONLY ever be true OUTSIDE production — the env opt-in is ANDed with
 * a NODE_ENV !== 'production' guard, and (when present) Vercel's VERCEL_ENV must
 * also not be 'production'. In prod, SKIP_AUTH is hard-false regardless of the
 * public flag. Dev/local behavior is unchanged.
 */

import type { User } from '@supabase/supabase-js'

// --- Non-production environment check (build-time + runtime safe) ---
// NODE_ENV is the primary gate. VERCEL_ENV ('production' | 'preview' |
// 'development') is an extra belt-and-suspenders check on Vercel; when it is
// unset (local, CI, other hosts) it cannot accidentally re-enable the bypass.
const isNonProduction =
  process.env.NODE_ENV !== 'production' &&
  process.env.VERCEL_ENV !== 'production'

export const SKIP_AUTH =
  isNonProduction && process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

/** Fake user object used when auth is bypassed */
export const DEV_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dev@akbai.test',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
}
