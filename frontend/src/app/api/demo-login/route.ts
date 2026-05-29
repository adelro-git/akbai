/**
 * Demo Login API Route — App Store / Play reviewer access.
 * Feature: Reviewer demo bypass (Sprint 18, Gap §11 P0).
 *
 * PROBLEM: AKBai's only login is email OTP / magic-link. Store reviewers
 *   cannot receive that email, so they cannot evaluate the app within the
 *   "60 seconds of install" review window.
 *
 * SOLUTION: A POST route that signs in the SINGLE seeded demo account
 *   (demo@akbai.app) via Supabase's normal email+password grant, skipping
 *   ONLY the email round-trip. It mints a genuine Supabase session and writes
 *   it to the auth cookies through the SSR server client, so the reviewer is
 *   thereafter a fully normal authenticated user (RLS applies, etc.).
 *
 * SECURITY — FAIL-CLOSED, AKBai non-negotiable #4 (this is an AUTH SURFACE):
 *   The route does NOTHING unless DEMO_MODE_ENABLED === 'true' (server-only).
 *   When that flag is unset/false (the production default), the route returns
 *   404 — indistinguishable from a non-existent endpoint — BEFORE reading the
 *   body, touching Supabase, or revealing that a demo account exists.
 *
 *   Even when enabled:
 *     - ONLY the hard-coded DEMO_EMAIL is accepted; the requested email is
 *       compared constant-time. Arbitrary emails are rejected with the SAME
 *       generic 403 (no user enumeration, no "wrong password" vs "no such
 *       user" distinction).
 *     - The demo password lives only in DEMO_ACCOUNT_PASSWORD (server env).
 *       If it is unset, the route fails closed (500 config error) rather than
 *       attempting a blank-password sign-in.
 *     - The route NEVER signs in any email the caller supplies — the password
 *       grant is always run against DEMO_EMAIL, never the request's email.
 *       (The request email is used ONLY to gate, never as the auth identity.)
 *
 *   This does not weaken normal auth: the OTP/magic-link flow is untouched,
 *   and with the flag unset this code path is completely dead in production.
 *
 * Tested by: frontend/src/app/api/demo-login/__tests__/route.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEMO_EMAIL, isDemoModeEnabled, isDemoEmail } from '@/lib/demo/config';

// Server-only route. Must read the live env flag + set auth cookies on each
// call — never statically cached, runs on the Node.js runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A single generic rejection. Reused for every "you can't use this" case so
// the response never reveals WHY (wrong email vs. wrong password vs. anything).
function forbidden() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'DEMO_FORBIDDEN',
        message: 'Demo sign-in is not available.',
        message_tl: 'Hindi available ang demo sign-in.',
      },
    },
    { status: 403 },
  );
}

export async function POST(req: NextRequest) {
  // --- Gate 1: master kill-switch. Unset/false → pretend the route does not
  //     exist. Done FIRST, before reading the body or touching Supabase. ---
  if (!isDemoModeEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found.',
          message_tl: 'Hindi mahanap.',
        },
      },
      { status: 404 },
    );
  }

  // --- Parse body (email is used ONLY to gate, never as the auth identity). ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Malformed body → generic forbidden (no detail leak).
    return forbidden();
  }

  const requestedEmail =
    body && typeof body === 'object' && 'email' in body && typeof (body as { email: unknown }).email === 'string'
      ? (body as { email: string }).email
      : '';

  // --- Gate 2: the requested email MUST be exactly the demo email
  //     (constant-time). Arbitrary emails are never accepted. ---
  if (!isDemoEmail(requestedEmail)) {
    return forbidden();
  }

  // --- Gate 3: the demo password must be configured server-side. Fail closed
  //     rather than attempting an empty-password sign-in. ---
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!demoPassword) {
    console.error('[demo-login] DEMO_MODE_ENABLED is true but DEMO_ACCOUNT_PASSWORD is unset — failing closed.');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DEMO_MISCONFIGURED',
          message: 'Demo mode is misconfigured.',
          message_tl: 'May problema sa demo setup.',
        },
      },
      { status: 500 },
    );
  }

  // --- Sign in the demo account via the normal password grant. The SSR server
  //     client writes the resulting session to the auth cookies, so the caller
  //     becomes a genuine authenticated user. NOTE: we always pass DEMO_EMAIL
  //     here — never the request's email — so only the demo identity can be
  //     authenticated, even if the gate logic above were ever bypassed. ---
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: demoPassword,
  });

  if (signInError) {
    // Most likely the seed has not been run or the password drifted from the
    // env. Log server-side; return a generic forbidden (no enumeration).
    console.error('[demo-login] Demo account sign-in failed:', signInError.message);
    return forbidden();
  }

  return NextResponse.json({ success: true, data: { redirect: '/dashboard' } });
}
