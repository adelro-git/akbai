/**
 * RevenueCat Webhook Handler — Receives IAP event callbacks from RevenueCat.
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 *
 * Flow: RevenueCat POST → verify Authorization Bearer → parse + Zod →
 *       idempotent insert (event_id PRIMARY KEY) → re-compute tier via
 *       REST → set_user_tier_v2 RPC → mark processed → 200 OK always.
 *
 * Security invariants (architect §3 + §10):
 *   - Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH> constant-time compared.
 *     Fail-closed on missing env var (server misconfig).
 *   - Service role client (bypasses RLS) for all DB writes; matches
 *     Xendit handler line 196 pattern.
 *   - ALWAYS 200 OK — RevenueCat retries non-2xx for up to 24h; logging
 *     + Sentry is the failure surface, not retry storms.
 *   - NEVER writes directly to subscriptions.tier. All tier writes go
 *     through the set_user_tier_v2 SECURITY DEFINER RPC. CI grep guard
 *     in the engineer review: this file MUST contain ZERO matches for
 *     `.from('subscriptions').update(`.
 *
 * Idempotency (Gap G2):
 *   - INSERT INTO revenuecat_events (event_id PRIMARY KEY) with PG error
 *     code '23505' = duplicate-key → 200 OK with { deduped: true }.
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
// POST Handler — Main webhook entry point
// ALWAYS returns 200 OK. Errors → Sentry + log + 200 OK.
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

    // ----- Idempotent insert (Gap G2 resolution) -----
    // event_id is PRIMARY KEY on revenuecat_events; PG '23505' is the
    // duplicate-key error code. Treat as "already processed" → return
    // 200 OK + { deduped: true } so RevenueCat doesn't retry.
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
        console.log(`[RevenueCat Webhook] Duplicate event ${event.id} — deduped`);
        return NextResponse.json(
          { success: true, data: { received: true, deduped: true } },
          { status: 200 },
        );
      }
      // Other DB error — log + 200 OK (no retry storm)
      console.error('[RevenueCat Webhook] Event insert failed:', insertError.message);
      return NextResponse.json(
        { success: true, data: { received: true } },
        { status: 200 },
      );
    }

    // ----- Downstream tier write -----
    await handleEvent(serviceClient, event);

    // ----- Mark processed (non-fatal failure) -----
    const { error: updateError } = await serviceClient
      .from('revenuecat_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    if (updateError) {
      console.error(
        `[RevenueCat Webhook] Failed to mark event ${event.id} processed:`,
        updateError.message,
      );
      // Non-fatal — a future event for the same user will reconcile tier.
    }
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
  }

  return NextResponse.json(
    { success: true, data: { received: true } },
    { status: 200 },
  );
}
