/**
 * Deadline Notification Cron — Drives BIR 7/3/1-day push reminders.
 * Feature: Push Notifications (Gap B6) + Resilience scheduling (Sprint 18, §11)
 * Role: The scheduled entry point that finally INVOKES the 7/3/1-day push
 *       logic which has existed (lib/push/deadline-triggers.ts) but was never
 *       called. Runs once daily on Vercel Cron at 01:00 UTC (09:00 PHT).
 *
 * Flow: Vercel Cron GET → verify Authorization: Bearer ${CRON_SECRET}
 *       (constant-time, fail-closed) → service-role client →
 *       find distinct users with an upcoming, non-deleted deadline →
 *       triggerDeadlineNotifications(userId) per user (it applies the
 *       7/3/1-day window + notified-flag dedup internally) →
 *       JSON summary { processed, sent, skipped }.
 *
 * Why this route exists on the web backend (not the Capacitor bundle):
 *   This is a server-only API route. `next.config` pageExtensions excludes
 *   api routes from the static export, so it ships only to Vercel — exactly
 *   where the cron scheduler lives. Safe.
 *
 * Security invariants (resilience stream, AKBai non-negotiable #4):
 *   - CRON_SECRET is server-only. Compared constant-time against the
 *     Authorization Bearer token. Fail-closed (401) when the header is
 *     missing/malformed/mismatched OR when CRON_SECRET is unset (misconfig).
 *     Mirrors the constant-time pattern in the RevenueCat webhook handler.
 *   - Service-role client (bypasses RLS) — cron has no user session and must
 *     read every user's deadlines.
 *   - Errors are caught and returned as a sanitized 500 (never leak secrets
 *     or stack details to the response body).
 *
 * Dependencies: lib/push/deadline-triggers.triggerDeadlineNotifications,
 *               lib/supabase/service.createServiceClient.
 * Tested by:    frontend/src/app/api/cron/deadline-notifications/__tests__/route.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { triggerDeadlineNotifications } from '@/lib/push/deadline-triggers';

// This route must run on the Node.js runtime (service-role key, web-push) and
// must never be statically cached — it has a live side effect each invocation.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// Auth — constant-time Bearer compare against CRON_SECRET.
// Fail-closed: any missing/blank/mismatched token OR unset env → false.
// Mirror of the RevenueCat webhook verifier (constant-time, no early
// length-leak beyond the unavoidable length check).
// ============================================================

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[Cron:deadline-notifications] CRON_SECRET not configured');
    return false;
  }

  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    console.warn('[Cron:deadline-notifications] Missing or malformed Authorization header');
    return false;
  }

  const token = auth.slice('Bearer '.length);

  // --- Constant-time comparison ---
  if (token.length !== expected.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

// ============================================================
// GET Handler — Vercel Cron entry point.
// ============================================================

export async function GET(req: NextRequest) {
  // --- Auth gate (fail-closed 401) ---
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing cron credentials.',
          message_tl: 'Hindi awtorisado ang request na ito.',
        },
      },
      { status: 401 },
    );
  }

  try {
    const supabase = createServiceClient();

    // --- Find candidate users ---
    // We only need the distinct set of users who have at least one upcoming,
    // non-deleted deadline. triggerDeadlineNotifications re-queries each user's
    // deadlines and decides per-row whether a 7/3/1-day push is due (and
    // de-dupes via the notified_* flags), so the route's only job here is to
    // enumerate who to process. Selecting just user_id keeps the scan cheap.
    const { data: rows, error } = await supabase
      .from('bir_deadlines')
      .select('user_id')
      .eq('status', 'upcoming')
      .is('deleted_at', null);

    if (error) {
      // DB read failure — sanitized 500, log the detail server-side only.
      console.error('[Cron:deadline-notifications] Failed to load candidate users:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CRON_QUERY_FAILED',
            message: 'Failed to load deadline candidates.',
            message_tl: 'May problema sa pagkuha ng mga deadline. Susubukan ulit bukas.',
          },
        },
        { status: 500 },
      );
    }

    // --- Dedupe to distinct user IDs ---
    const userIds = Array.from(
      new Set((rows ?? []).map((r: { user_id: string }) => r.user_id)),
    );

    // --- Drive the existing 7/3/1-day trigger per user ---
    let processed = 0;
    let sent = 0;
    let skipped = 0;

    for (const userId of userIds) {
      try {
        const result = await triggerDeadlineNotifications(userId);
        processed += 1;
        sent += result.sent;
        // "skipped" = a user we processed but who had nothing due / nothing sent.
        if (result.sent === 0) {
          skipped += 1;
        }
      } catch (userErr) {
        // One user failing must not abort the whole batch. Count it as skipped
        // and continue; the next daily run will retry (notified flags are only
        // set on successful send inside the trigger).
        const msg = userErr instanceof Error ? userErr.message : 'unknown error';
        console.error(
          `[Cron:deadline-notifications] User ${userId} failed — skipping:`,
          msg,
        );
        skipped += 1;
      }
    }

    console.log(
      `[Cron:deadline-notifications] Done — processed=${processed} sent=${sent} skipped=${skipped}`,
    );

    return NextResponse.json(
      { success: true, data: { processed, sent, skipped } },
      { status: 200 },
    );
  } catch (err) {
    // Catch-all — never leak internals to the response body.
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[Cron:deadline-notifications] Unhandled error:', msg);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRON_INTERNAL_ERROR',
          message: 'Cron job failed.',
          message_tl: 'May hindi inaasahang problema sa cron job.',
        },
      },
      { status: 500 },
    );
  }
}
