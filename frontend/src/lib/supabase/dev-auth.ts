/**
 * Dev-only auth bypass — lets you skip OTP login when NEXT_PUBLIC_SKIP_AUTH=true.
 * NEVER enable this in production.
 */

import type { User } from '@supabase/supabase-js'

export const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

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
