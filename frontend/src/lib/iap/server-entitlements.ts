/**
 * RevenueCat REST entitlement lookup — server-only helper.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Resolves the canonical tier for a given app_user_id by
 *          hitting RevenueCat's `GET /v1/subscribers/{app_user_id}`
 *          REST endpoint. The webhook handler (route.ts) calls this
 *          on every non-trivial event so we never trust the single
 *          event's product_id alone for tier inference — a user may
 *          hold Starter (lifetime) AND Pro simultaneously, and only
 *          the full entitlement list tells us which is currently
 *          active.
 *
 * State machine (architect §4 "Lifetime-Starter + Pro coexistence"):
 *   pro_unlimited active (not expired)              → 'pro'
 *   pro_unlimited active + starter_lifetime         → 'pro' (Pro supersedes)
 *   starter_lifetime active, no live pro            → 'starter'
 *   pro_unlimited expired, starter_lifetime active  → 'starter' (fallback)
 *   nothing active                                  → 'free'
 *
 * API contract:
 *   GET https://api.revenuecat.com/v1/subscribers/{app_user_id}
 *   Auth: Bearer <REVENUECAT_REST_API_KEY>  (DIFFERENT from
 *         REVENUECAT_WEBHOOK_AUTH; this key is generated in the
 *         RevenueCat dashboard under "API keys → Server").
 *   Response shape: { subscriber: { entitlements: { [id]: { expires_date, ... } } } }
 *
 * Sprint 17 fallback (no REST key configured):
 *   When REVENUECAT_REST_API_KEY is missing, returns { tier: 'free',
 *   expires_at: null }. This is acceptable for Sprint 17 acceptance
 *   per architect §3 line 555 — Sprint 19 sandbox testing provisions
 *   the real key and exercises the full REST path.
 *
 * Sentry tagging: `source: 'revenuecat-rest-lookup'` on failure.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §3 (lines 512-557).
 *
 * SERVER-ONLY: do NOT add 'use client'. Importing this module from
 * client code would leak the REVENUECAT_REST_API_KEY env var into
 * the bundle (Next.js would refuse, but the import is still wrong).
 */

import type { SubscriptionTier } from '@/lib/subscriptions/types';
import { PRO_ENTITLEMENT_ID, STARTER_ENTITLEMENT_ID } from './entitlements';

// ============================================================
// Subscriber JSON response shape (subset). RevenueCat returns
// far more than this; we read the entitlements map only.
// `expires_date` is an ISO-8601 string OR null (for non-
// consumable lifetime entitlements like starter_lifetime).
// ============================================================

export interface RevenueCatEntitlement {
  expires_date: string | null;
  purchase_date?: string;
  product_identifier?: string;
}

export interface RevenueCatSubscriberResponse {
  subscriber: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    original_app_user_id?: string;
    first_seen?: string;
  };
}

// ============================================================
// Resolved entitlement — the shape the webhook handler passes
// straight into `set_user_tier_v2(p_tier, p_expires_at, ...)`.
// ============================================================

export interface ResolvedEntitlements {
  tier: SubscriptionTier;
  expires_at: string | null;
}

// ============================================================
// Sprint 17 fallback — no REST key configured. Returns 'free'
// per architect §3 line 555. The webhook handler still records
// the event in revenuecat_events; Sprint 19 sandbox testing
// replays unprocessed events once the REST key is provisioned.
// ============================================================

function fallbackFromEvent(): ResolvedEntitlements {
  return { tier: 'free', expires_at: null };
}

// ============================================================
// Sentry capture (dynamic import to keep the cold-start cost
// of this module low — Sentry is only loaded on the failure path).
// ============================================================

async function captureToSentry(err: unknown, context: { appUserId: string; status?: number }): Promise<void> {
  const Sentry = await import('@sentry/nextjs').catch(() => null);
  Sentry?.captureException(err, {
    tags: { source: 'revenuecat-rest-lookup' },
    extra: context,
  });
}

// ============================================================
// fetchEntitlementsFromRevenueCat — canonical tier resolver
// ============================================================

export async function fetchEntitlementsFromRevenueCat(
  appUserId: string,
): Promise<ResolvedEntitlements> {
  const apiKey = process.env.REVENUECAT_REST_API_KEY;

  // --- Sprint 17 acceptance path: no REST key → safe fallback ---
  if (!apiKey) {
    console.warn(
      '[RevenueCat REST] REVENUECAT_REST_API_KEY not configured — falling back to tier=free (Sprint 17 acceptance)',
    );
    return fallbackFromEvent();
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );
  } catch (err) {
    // --- Network failure: log to Sentry + fall back to 'free' ---
    console.error(`[RevenueCat REST] fetch threw for ${appUserId}:`, err);
    await captureToSentry(err, { appUserId });
    return { tier: 'free', expires_at: null };
  }

  if (!res.ok) {
    // --- 401 / 404 / 5xx: log + fall back to 'free' ---
    console.error(
      `[RevenueCat REST] lookup failed for ${appUserId}: HTTP ${res.status}`,
    );
    await captureToSentry(new Error(`RevenueCat REST ${res.status}`), {
      appUserId,
      status: res.status,
    });
    return { tier: 'free', expires_at: null };
  }

  let json: RevenueCatSubscriberResponse;
  try {
    json = (await res.json()) as RevenueCatSubscriberResponse;
  } catch (err) {
    console.error(`[RevenueCat REST] invalid JSON for ${appUserId}:`, err);
    await captureToSentry(err, { appUserId });
    return { tier: 'free', expires_at: null };
  }

  // --- Resolve tier from entitlements map ---
  const active = json.subscriber?.entitlements ?? {};
  const pro = active[PRO_ENTITLEMENT_ID];
  const starter = active[STARTER_ENTITLEMENT_ID];

  const now = Date.now();
  const proIsLive = !!pro && (pro.expires_date == null || new Date(pro.expires_date).getTime() > now);

  // pro_unlimited live (with or without starter dormant) → 'pro'
  if (proIsLive && pro) {
    return { tier: 'pro', expires_at: pro.expires_date };
  }

  // starter_lifetime active (non-consumable, never expires) → 'starter'
  // Also covers the "pro expired, starter active" fallback (architect §4).
  if (starter) {
    return { tier: 'starter', expires_at: null };
  }

  // No active entitlements → 'free'
  return { tier: 'free', expires_at: null };
}
