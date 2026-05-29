/**
 * Demo (App Store / Play reviewer) access — shared config.
 * Feature: Reviewer demo bypass (Sprint 18, Gap §11 P0).
 *
 * Single source of truth for the demo account identity and the two
 * independent gating flags. Keeping this here means the API route, the
 * login button, and the tests all agree on the same values.
 *
 * SECURITY MODEL (fail-closed, AKBai non-negotiable #4):
 *   This is an AUTH SURFACE. It must NOT weaken real-user authentication
 *   and must be INERT by default. Two separate flags must BOTH be set for
 *   the demo path to do anything:
 *
 *     - DEMO_MODE_ENABLED (server-only) — gates the /api/demo-login route.
 *       When unset/!== 'true', the route returns 404 (looks non-existent)
 *       and NO demo sign-in can ever happen, regardless of the client.
 *     - NEXT_PUBLIC_DEMO_MODE (public) — gates whether the login page even
 *       renders the demo button. Cosmetic only; the server flag is the real
 *       enforcement. A normal production build leaves BOTH unset, so the
 *       demo path is completely invisible AND completely dead.
 *
 *   The demo account is a REAL Supabase auth.users row with a REAL password
 *   (DEMO_ACCOUNT_PASSWORD). The route signs it in via the normal password
 *   grant — it does NOT mint fake sessions or bypass Supabase auth. The only
 *   thing skipped is the email OTP round-trip (reviewers cannot receive it).
 *   Arbitrary emails are NEVER accepted — only the fixed DEMO_EMAIL below.
 */

/** The one and only account the demo path may ever sign in. Hard-coded — never user-supplied. */
export const DEMO_EMAIL = 'demo@akbai.app' as const;

/**
 * Server-side enforcement flag. The /api/demo-login route is fully inert
 * (404) unless this is exactly the string 'true'. Server-only — never read
 * in client code.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE_ENABLED === 'true';
}

/**
 * Public flag controlling whether the login page renders the demo button.
 * Cosmetic gate only — even if a normal user forced this true, the server
 * route would still reject them (DEMO_MODE_ENABLED is independent and
 * server-only). NEXT_PUBLIC_* is inlined at build time.
 */
export function isDemoButtonVisible(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Constant-time string equality. Used to compare the requested email against
 * DEMO_EMAIL without leaking, via timing, how many leading characters matched.
 * Length is compared first (unavoidable) but no early-exit on content.
 * Mirrors the constant-time pattern in the cron / RevenueCat verifiers.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Is `email` the demo account email? Normalises case/whitespace the same way
 * Supabase does (lowercase, trimmed) BEFORE the constant-time compare, so the
 * comparison is against a single canonical form. Returns false for anything
 * that is not exactly the demo email.
 */
export function isDemoEmail(email: string): boolean {
  const normalised = email.trim().toLowerCase();
  return constantTimeEquals(normalised, DEMO_EMAIL);
}
