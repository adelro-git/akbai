/**
 * RevenueCat Webhook Handler — Receives IAP event callbacks from RevenueCat.
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 *
 * Flow: RevenueCat POST → verify Authorization Bearer → parse + Zod →
 *       idempotent insert (event_id PRIMARY KEY) → re-compute tier via
 *       REST → set_user_tier_v2 RPC → mark processed → 200 OK (permanent)
 *       / 5xx (transient).
 *
 * Security invariants (architect §3 + §10):
 *   - Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH> constant-time compared.
 *     Fail-closed on missing env var (server misconfig).
 *   - Service role client (bypasses RLS) for all DB writes; matches
 *     Xendit handler line 196 pattern.
 *   - NEVER writes directly to subscriptions.tier. All tier writes go
 *     through the set_user_tier_v2 SECURITY DEFINER RPC. CI grep guard
 *     in the engineer review: this file MUST contain ZERO matches for
 *     `.from('subscriptions').update(`.
 *
 * Retry semantics (P5 — idempotent recovery, no paid-upgrade loss):
 *   - PERMANENT / non-retryable conditions → 200 OK so RevenueCat does NOT
 *     retry (anti-retry-storm): bad signature, invalid JSON, Zod failure
 *     (incl. unknown/ignored event types), log-only events, environment
 *     skips, and any event already fully processed (deduped).
 *   - TRANSIENT / unexpected failures of the downstream tier write (e.g. the
 *     set_user_tier_v2 RPC throwing, REST entitlement lookup throwing) → 5xx
 *     so RevenueCat retries with backoff. Without this, a transient RPC
 *     failure would silently lose a paid-tier upgrade (the event row exists
 *     but processed_at stays NULL and RevenueCat never re-delivers).
 *
 * Idempotency (Gap G2 + P5 recovery):
 *   - INSERT INTO revenuecat_events (event_id PRIMARY KEY). The row is only
 *     stamped processed_at AFTER handleEvent() succeeds, so the row's
 *     processed_at is the authoritative "this event's side-effects landed"
 *     marker.
 *   - On a duplicate insert (PG '23505') we look up the existing row:
 *       · processed_at IS NULL → a prior delivery inserted the row but its
 *         tier write never completed (transient crash / RPC failure). We
 *         REPROCESS handleEvent(), then stamp processed_at, and return 200.
 *         This is the no-data-loss recovery path.
 *       · processed_at IS NOT NULL → already fully handled → dedup, 200 OK
 *         with { deduped: true }.
 *   - This is event-envelope-level dedup (not row-level). One event may
 *     produce zero, one, or many writes; the event boundary is the safe
 *     idempotency surface.
 *
 * Environment guard (architect §3 line 481):
 *   - SANDBOX events in NODE_ENV=production are skipped (Sprint 19 sandbox
 *     testing must never mutate production rows).
 *   - PRODUCTION events always proceed.
 *   - SANDBOX events in NODE_ENV=development proceed (local + staging).
 *
 * Event-type routing (architect §3 line 458 table):
 *   - INITIAL_PURCHASE / NON_RENEWING_PURCHASE → set_user_tier_v2 with
 *     p_reset_started_at=true (mark new subscription start)
 *   - RENEWAL / PRODUCT_CHANGE / CANCELLATION / EXPIRATION /
 *     BILLING_ISSUE / UNCANCELLATION → set_user_tier_v2 with
 *     p_reset_started_at=false (preserve started_at)
 *   - SUBSCRIBER_ALIAS / TRANSFER / TEST → log only, no tier write
 *
 * Dependencies: Supabase service client, RevenueCat REST entitlement lookup,
 *               set_user_tier_v2 RPC (migration 022).
 * Tested by:    frontend/src/app/api/webhooks/revenuecat/__tests__/route.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { RevenueCatEventSchema, type RevenueCatEvent } from '@/lib/iap/schemas';
import { fetchEntitlementsFromRevenueCat } from '@/lib/iap/server-entitlements';
import { verifyBearer } from '@/lib/security/constant-time';

// ============================================================
// Signature Verification — Bearer token constant-time compare
// Mirror of Xendit handler lines 40-62. RevenueCat uses the
// standard Authorization header; Xendit uses x-callback-token.
// ============================================================

function verifyWebhookSignature(req: NextRequest): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) {
    console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH not configured');
    return false;
  }

  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    console.warn('[RevenueCat Webhook] Missing or malformed Authorization header');
    return false;
  }

  // Constant-time Bearer compare via the shared security primitive. The two
  // guards above stay here so the handler's log lines (missing env →
  // console.error, malformed header → console.warn) are preserved exactly;
  // verifyBearer re-checks both fail-closed, then constant-time compares the
  // token against REVENUECAT_WEBHOOK_AUTH.
  return verifyBearer(auth, expected);
}

// ============================================================
// Event-type routing — dispatch a parsed RevenueCat event to
// the appropriate side-effect (tier write or log-only).
// ============================================================

// Event types that imply a fresh subscription start. Architect §3
// table: INITIAL_PURCHASE + NON_RENEWING_PURCHASE both reset
// `started_at` because they represent a brand-new active entitlement.
const RESET_STARTED_AT_EVENTS: ReadonlySet<RevenueCatEvent['type']> = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
]);

// Event types that are informational only — no tier write.
const LOG_ONLY_EVENTS: ReadonlySet<RevenueCatEvent['type']> = new Set([
  'SUBSCRIBER_ALIAS',
  'TRANSFER',
  'TEST',
]);

async function handleEvent(
  serviceClient: ReturnType<typeof createServiceClient>,
  event: RevenueCatEvent,
): Promise<void> {
  // --- Environment guard: reject sandbox events when running in prod ---
  // Sprint 19 sandbox testing MUST NOT mutate production rows. This is
  // the only defence; RevenueCat itself does not segregate by env on the
  // webhook destination — both prod and sandbox events arrive at the
  // same URL with the same Authorization secret.
  if (process.env.NODE_ENV === 'production' && event.environment !== 'PRODUCTION') {
    console.log(
      `[RevenueCat Webhook] Skipping ${event.environment} event ${event.id} in production`,
    );
    return;
  }

  // --- Log-only events ---
  if (LOG_ONLY_EVENTS.has(event.type)) {
    console.log(
      `[RevenueCat Webhook] ${event.type} for ${event.app_user_id} — logged, no tier write`,
    );
    return;
  }

  // --- Re-compute canonical entitlements via REST ---
  // We NEVER trust the event's product_id alone because a user may
  // hold Starter (lifetime) AND Pro simultaneously; only the full
  // entitlement map tells us which is currently active. The REST
  // call is the single source of truth — Sprint 17 fallback returns
  // 'free' when REVENUECAT_REST_API_KEY is not configured.
  const entitlements = await fetchEntitlementsFromRevenueCat(event.app_user_id);

  const reset = RESET_STARTED_AT_EVENTS.has(event.type);

  // --- Authoritative tier write via SECURITY DEFINER RPC ---
  // The RPC is the only sanctioned path for tier writes per ADR-005 +
  // migration 022. Direct UPDATE on subscriptions.tier is FORBIDDEN in
  // this file (engineer grep guard before commit).
  const { error: rpcError } = await serviceClient.rpc('set_user_tier_v2', {
    p_user_id: event.app_user_id,
    p_tier: entitlements.tier,
    p_expires_at: entitlements.expires_at,
    p_revenuecat_app_user_id: event.app_user_id,
    p_reset_started_at: reset,
  });

  if (rpcError) {
    console.error(
      `[RevenueCat Webhook] set_user_tier_v2 failed for ${event.app_user_id}:`,
      rpcError.message,
    );
    throw new Error(`set_user_tier_v2 failed: ${rpcError.message}`);
  }

  console.log(
    `[RevenueCat Webhook] ${event.type} → tier=${entitlements.tier} for user ${event.app_user_id} (reset_started_at=${reset})`,
  );
}

// ============================================================
// processAndMark — run the downstream side-effects for an event,
// then stamp processed_at ONLY on success (P5). Shared by the
// first-delivery path and the unprocessed-duplicate recovery path.
//
// Any throw from handleEvent (transient RPC/REST failure) propagates
// up so the caller can return 5xx; processed_at is NOT stamped, so a
// later re-delivery will retry via the recovery path.
//
// A failure to *stamp* processed_at after a successful handleEvent is
// non-fatal here: the tier write already landed (idempotent — it just
// re-resolves entitlements), so a re-delivery would safely reprocess.
// We log it as a warning rather than throw, to avoid forcing a retry
// of an already-applied tier write.
// ============================================================

async function processAndMark(
  serviceClient: ReturnType<typeof createServiceClient>,
  event: RevenueCatEvent,
): Promise<void> {
  await handleEvent(serviceClient, event);

  const { error: updateError } = await serviceClient
    .from('revenuecat_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('event_id', event.id);

  if (updateError) {
    console.error(
      `[RevenueCat Webhook] Failed to mark event ${event.id} processed:`,
      updateError.message,
    );
    // Non-fatal — the tier write already landed and handleEvent is
    // idempotent, so a future re-delivery will reconcile cleanly.
  }
}

// ============================================================
// POST Handler — Main webhook entry point
// Permanent/non-retryable conditions → 200 OK (no retry storm).
// Transient downstream failures → Sentry + log + 5xx (RevenueCat
// retries with backoff so a paid-upgrade is never silently lost).
// ============================================================

export async function POST(req: NextRequest) {
  console.log('[RevenueCat Webhook] Received callback');

  // --- Signature verification (silent 200 on failure) ---
  if (!verifyWebhookSignature(req)) {
    console.warn('[RevenueCat Webhook] Signature verification failed');
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 },
    );
  }

  // --- JSON parse (silent 200 on failure) ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.warn('[RevenueCat Webhook] Invalid JSON body');
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 },
    );
  }

  // --- Zod envelope validation (silent 200 on failure) ---
  const parsed = RevenueCatEventSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('[RevenueCat Webhook] Invalid payload structure:', parsed.error.flatten());
    return NextResponse.json(
      { success: true, data: { received: true } },
      { status: 200 },
    );
  }

  const { event } = parsed.data;
  console.log(
    `[RevenueCat Webhook] Processing ${event.type} event ${event.id} for user ${event.app_user_id}`,
  );

  try {
    const serviceClient = createServiceClient();

    // ----- Idempotent insert (Gap G2 + P5 recovery) -----
    // event_id is PRIMARY KEY on revenuecat_events; PG '23505' is the
    // duplicate-key error code. The row is inserted with processed_at=NULL
    // and only stamped AFTER handleEvent() succeeds, so processed_at is the
    // authoritative "side-effects landed" marker.
    const { error: insertError } = await serviceClient
      .from('revenuecat_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        app_user_id: event.app_user_id,
        event_at: new Date(event.event_timestamp_ms).toISOString(),
        payload: event,
        processed_at: null,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        // ----- Duplicate delivery: dedup OR recover (P5) -----
        // Look up the existing row. If it was never fully processed
        // (processed_at IS NULL — a prior delivery crashed/failed before
        // the tier write landed), REPROCESS so a paid upgrade is not lost.
        // If it is already processed, dedup as before.
        const { data: existing, error: lookupError } = await serviceClient
          .from('revenuecat_events')
          .select('processed_at')
          .eq('event_id', event.id)
          .single();

        if (lookupError) {
          // Could not read the existing row — treat as transient so
          // RevenueCat retries rather than silently dropping the event.
          console.error(
            `[RevenueCat Webhook] Duplicate-row lookup failed for ${event.id}:`,
            lookupError.message,
          );
          throw new Error(`Duplicate-row lookup failed: ${lookupError.message}`);
        }

        if (existing?.processed_at) {
          console.log(`[RevenueCat Webhook] Duplicate event ${event.id} — deduped`);
          return NextResponse.json(
            { success: true, data: { received: true, deduped: true } },
            { status: 200 },
          );
        }

        // Unprocessed duplicate → recover by reprocessing. A throw here
        // (transient RPC/REST failure) propagates to the catch → 5xx.
        console.warn(
          `[RevenueCat Webhook] Re-delivered UNPROCESSED event ${event.id} — reprocessing`,
        );
        await processAndMark(serviceClient, event);
        return NextResponse.json(
          { success: true, data: { received: true, reprocessed: true } },
          { status: 200 },
        );
      }
      // Other insert DB error — transient/unexpected → 5xx so RevenueCat
      // retries with backoff (the event was NOT recorded, so re-delivery
      // is the only way to recover it).
      console.error('[RevenueCat Webhook] Event insert failed:', insertError.message);
      throw new Error(`Event insert failed: ${insertError.message}`);
    }

    // ----- First delivery: downstream tier write + mark processed -----
    // A throw here (transient RPC/REST failure) propagates to the catch →
    // 5xx. The row exists with processed_at=NULL, so a re-delivery hits the
    // unprocessed-duplicate recovery branch above.
    await processAndMark(serviceClient, event);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[RevenueCat Webhook] Error processing ${event.type}:`, message);

    // --- Sentry capture (dynamic import, optional dep) ---
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    Sentry?.captureException(err, {
      tags: {
        source: 'revenuecat-webhook',
        event_type: event.type,
        environment: event.environment,
      },
      extra: {
        event_id: event.id,
        app_user_id: event.app_user_id,
      },
    });

    // Transient/unexpected downstream failure → 5xx so RevenueCat retries
    // with backoff. The event row (if inserted) stays processed_at=NULL and
    // the retry recovers it; a paid-tier upgrade is never silently lost.
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Transient failure processing webhook; retry expected.',
          message_tl: 'May pansamantalang problema sa pag-proseso; uulitin ito.',
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, data: { received: true } },
    { status: 200 },
  );
}
