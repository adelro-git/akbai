# Sprint 17 — RevenueCat IAP Integration Pattern

**Status:** Locked 2026-05-27 by build-architect. Reference for `feat/17-revenuecat-iap`.
**Source of truth:** ADR-018 (Native Mobile Pivot + IAP via RevenueCat, Accepted 2026-05-24 — `architecture-decisions.md` §996-1094) + Sprint 13 tier-model lock (`project-context.md` §4) + Sprint 16 native-plugin pattern (`sprint-16-native-plugin-pattern.md`) + this doc.
**Audience:** build-engineer (3 sequential batches per §9) + build-data (1-2 migrations per §8) + review-security (4 audit surfaces per §10). Read this end-to-end before touching code. The web-fallback gating pattern from Sprint 16 (`Capacitor.isNativePlatform()` branch at every native call site) is the **precedent** for client work; the Xendit webhook handler (`frontend/src/app/api/webhooks/xendit/route.ts` lines 40-228) is the **precedent** for server work. Deviate only with an updated ADR.

Resolves **Gap G2 (CRITICAL)** — IAP webhook idempotency. Replaces dormant Xendit handler as the authoritative billing pipeline.

---

## 0. Open Questions for Anton (flagged at PR review, do NOT block engineer)

Engineer ships my recommendation; Anton overrides at PR review if he prefers the alternative. None of these block batch 1 from starting.

1. **Sandbox vs production env-var split — one RevenueCat project with two API keys, vs two separate projects?** RevenueCat's recommended pattern is **one project, environment-scoped API keys**. Apple and Google sandbox purchases are auto-routed by the SDK to the same project's "sandbox" event stream (separable in the dashboard via the `environment` field on each event); production purchases hit the same project's "production" stream. Two paths:
   - **(a) Recommendation: one RevenueCat project, single pair of Apple+Google API keys per environment.** Env vars `NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY` and `NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY` resolve at static-export time. Sprint 17 ships **placeholder strings** (e.g. `rcb_placeholder_apple_sprint17`) since Apple/Google sandbox enrollment is Sprint 19 work. The webhook differentiates sandbox vs prod via `event.environment` (`'SANDBOX' | 'PRODUCTION'`) — sandbox events are logged but **do not** update real tier rows in production (gated by `process.env.NODE_ENV !== 'production' || event.environment === 'PRODUCTION'`).
   - (b) Alternative: two separate RevenueCat projects (`akbai-sandbox`, `akbai-prod`) with four env vars total (`*_APPLE_API_KEY_SANDBOX`, `*_APPLE_API_KEY_PROD`, …). Cleaner isolation but doubles the dashboard surface, the webhook URL count, and the secret rotation cadence.
   - **Why (a):** matches RevenueCat docs §"Environments" exactly, halves the secret-management surface, and the `event.environment` field already gives us the per-event partition. The webhook handler ships the env-gate condition this sprint so Sprint 19 sandbox testing doesn't accidentally mutate prod rows.

2. **Trial-expiration timing — real-time webhook event vs polling job?** A 7-day free trial ends at a known timestamp (`subscriptions.expires_at` set on user signup); the question is who flips the user from trial-tier features back to gated state at that exact moment. Two paths:
   - **(a) Recommendation: rely on client-side `getCustomerInfo()` re-check + server-side tier read on every gated route.** RevenueCat does NOT send a webhook event when a trial expires without converting — Apple/Google emit `EXPIRATION` only when the user actually moves out of an entitlement, and a trial-only user with no conversion just falls off the entitlement list on Apple/Google's side. The honest model: every gated server route (`/api/chat`, `/api/morning-briefing`, etc., see §3) already reads `subscriptions.tier` on each request. Trial expiry is a function of `expires_at < NOW()` on read, not a webhook-driven write. The client refreshes `getCustomerInfo()` on every paywall display (cheap, cached by RevenueCat SDK).
   - (b) Alternative: write a Supabase cron job (pg_cron or Vercel Cron) that scans `subscriptions WHERE status='trialing' AND expires_at < NOW()` every 5 minutes and calls `set_user_tier(user_id, 'free')`. Adds a moving part and a new failure mode (cron stalls → users keep trial access past expiry).
   - **Why (a):** the gated routes already enforce the tier read pattern; no new infra. Sprint 17 adds `expires_at < NOW()` checks inside the existing tier-gate branches (3 lines in `/api/chat`, 3 in `/api/morning-briefing`, 3 in `/api/ocr`). Cron is over-engineering for a property that's already a read-time predicate.

3. **Lifetime-Starter + Pro coexistence state machine — fallback-to-Starter on Pro cancellation?** A user can hold Starter (₱299 lifetime non-consumable IAP) AND Pro (auto-renew IAP) simultaneously. Apple/Google IAP lets both purchases stack; RevenueCat exposes both entitlements. When Pro is cancelled or expires, what tier does the row revert to?
   - **(a) Recommendation: fallback to Starter when Starter entitlement is still active.** State machine: `entitlement_set = compute_entitlements(customer)` returns the highest-tier active entitlement. `pro_active → tier='pro'`. `starter_active && !pro_active → tier='starter'`. `!starter_active && !pro_active → tier='free'`. Webhook handler computes this on every event (not just the event that fired) by calling `getCustomerInfo()` server-side — see §2 architecture. This is the only correct read: a `CANCELLATION` event for Pro doesn't tell us whether Starter is still active; only the full entitlement set does.
   - (b) Alternative: always fall back to `free` on Pro cancellation, treat Starter as a separate "lifetime feature unlock" flag (e.g., a new `users.starter_lifetime BOOLEAN` column). Simpler tier reads but loses the unified `subscriptions.tier` source of truth.
   - **Why (a):** keeps `subscriptions.tier` as the single source of truth (matches the existing `getCustomerInfo` server check pattern in §6); avoids a parallel "has-purchased-starter-ever" column which would need its own RLS and trigger story. Cost: webhook handler does one extra RevenueCat REST call per event (the SDK's server-side `getCustomerInfo` lookup) — cheap, idempotent.

4. **Webhook URL exposure — restrict by IP allowlist or rely on shared-secret only?** RevenueCat publishes a static IP allowlist for webhook callers (current list at https://www.revenuecat.com/docs/integrations/webhooks/sample-events#ip-allowlist). The shared-secret check is the primary defense (constant-time compare against `Authorization: Bearer …`). Two paths:
   - **(a) Recommendation: shared-secret only this sprint; IP allowlist deferred to Sprint 19 if abuse surfaces.** The Xendit handler relies on shared-secret only and has been in dev-mode for months without incident. Vercel + Cloudflare Pages both let us add an IP allowlist via WAF rules later (no code change required). Adding an in-route IP check now means parsing `X-Forwarded-For` correctly through the Vercel/Cloudflare proxy chain — non-trivial and easy to misimplement (a single wrong header trust = bypassable allowlist).
   - (b) Alternative: in-route IP allowlist using `req.headers.get('x-forwarded-for')`. Defense-in-depth but adds maintenance (RevenueCat changes IPs, our code lags, webhooks silently 200-bounce while looking healthy).
   - **Why (a):** shared-secret + constant-time compare + 200-always-OK is the canonical webhook hardening pattern (see Xendit handler line 40-62). IP allowlist belongs at the edge layer, not in the route. Track an Sprint-19 task to wire it as a Vercel WAF rule when production traffic starts.

5. **Should we extend `set_user_tier()` to handle expiration-aware fallback, or write a new RPC?** Current `set_user_tier(p_user_id UUID, p_tier TEXT, p_expires_at TIMESTAMPTZ DEFAULT NULL)` (migration 003 lines 73-88) does a straight `UPDATE subscriptions SET tier, expires_at, status='active', started_at=NOW(), updated_at=NOW()`. The `started_at=NOW()` part is **load-bearing wrong** for renewals — it overwrites the original purchase date on every renewal event, breaking tenure-based features later (loyalty discounts, retention cohort reports). Two paths:
   - **(a) Recommendation: write `set_user_tier_v2(p_user_id, p_tier, p_expires_at, p_xendit_subscription_id_or_revenuecat_app_user_id TEXT DEFAULT NULL, p_reset_started_at BOOLEAN DEFAULT false)`.** New parameter `p_reset_started_at` makes the `started_at = NOW()` behavior **opt-in** (true for `INITIAL_PURCHASE` / `NON_RENEWING_PURCHASE`, false for `RENEWAL` / `PRODUCT_CHANGE` / `CANCELLATION` / `EXPIRATION`). Keep `set_user_tier` v1 untouched — Xendit lifecycle tests still pass, no breakage. Existing app code that reads `subscriptions.started_at` continues to work; new RevenueCat path uses v2.
   - (b) Alternative: modify `set_user_tier` in place by adding the new parameter as optional + default `true` (preserve current callers). Lower-friction but mixes the new and legacy invocation surfaces — harder to grep, harder to audit which call site does what.
   - **Why (a):** the existing `set_user_tier` is called from one place (manual admin SQL per ADR-005); v2 lets us audit RevenueCat call sites separately. v2 also accepts the RevenueCat `app_user_id` (which equals `users.id::text`) as an opaque audit field if Anton wants the column added in migration 023 (see §8). Build-data writes the SQL function in migration 022 alongside the events table; v2 is SECURITY DEFINER identical to v1.

---

## 1. Top-5 risks engineer must internalise

1. **Webhook idempotency is THE load-bearing invariant.** RevenueCat retries every webhook on any non-2xx response — up to 12 attempts over ~72 hours per their docs. Without per-event-UUID dedup, a 50ms network blip during downstream `set_user_tier_v2()` call → retry storm → user's tier gets downgraded then re-upgraded then downgraded across the storm window. **Mitigation:** every event handler starts with `INSERT INTO revenuecat_events (event_id, …) ON CONFLICT DO NOTHING RETURNING *`. If `RETURNING *` returns zero rows → already processed → return `{ success: true, deduped: true }` 200 OK and SKIP downstream work. The Xendit handler's `recordPayment` `upsert(…, { ignoreDuplicates: true })` pattern (`record-payment.ts` lines 41-79) is the precedent; we extend it to the event-envelope level instead of just the payment row level. Resolves Gap G2.

2. **Tier writes go through `set_user_tier_v2()` RPC ONLY — never direct UPDATEs to `subscriptions`.** The existing Xendit `lifecycle.ts` (`activateSubscription`, `cancelSubscription`, `renewSubscription`) writes directly via `serviceClient.from('subscriptions').update(…)` — that's a Sprint 8 anti-pattern that survived Sprint 13's deprecation only because Xendit is dormant. RevenueCat MUST NOT inherit it. The subscriptions table has SELECT-only RLS (migration 003 line 32-34); service role bypasses RLS but the architectural invariant (per ADR-005) is that all tier mutations route through the RPC so audit logging, started_at preservation, and the (still-undeployed) `protect_feature_flags()` semantics stay centralized. **review-security audits this** per §10.

3. **`Purchases.configure()` runs once per app open, NEVER per paywall render.** `@revenuecat/purchases-capacitor` documents the configure call as idempotent in practice but expensive (native bridge handshake, network call to RevenueCat servers to hydrate `customerInfo`). Sprint 16 established the same pattern for `initSentryCapacitor()` (module-level `initialised` boolean; `frontend/src/lib/sentry/capacitor-init.ts` line 35 + 42). Mirror exactly: `frontend/src/lib/iap/configure.ts` exports `initRevenueCat()` with `let configured = false` at module scope. Call site: `(app)/layout.tsx` `useEffect` once on mount, AFTER `supabase.auth.getSession()` resolves the user (we need `user.id` for `Purchases.logIn(user.id)`).

4. **Web fallback must show "Open in app to purchase" CTA, NOT a broken paywall.** RevenueCat is native-only — `@revenuecat/purchases-capacitor` plugin throws on import in a browser context. Every IAP entry point sits behind `if (Capacitor.isNativePlatform()) { … } else { /* web fallback */ }`. The web fallback for the paywall is a Filipino-copy card that says "I-download mo ang AKBai app para mag-upgrade" with a deep link to the App Store / Play Store listing (placeholder URLs Sprint 17; real listings Sprint 19). Same pattern as Sprint 16 §1 risk #1.

5. **Apple Guideline 3.1.1 requires a visible "Restore purchases" link.** Apple reject any IAP app that doesn't expose a non-destructive restore path. Placement: paywall modal footer + `/profile` Settings row. Failure mode if missed: app review reject cycle (1-2 weeks delay). Implementation: `Purchases.restorePurchases()` is the SDK call; on success it triggers the same `getCustomerInfo()` → server reconciliation path as `purchasePackage()`. UX: show a `Sandali, kinukumpirma namin ang purchases mo…` spinner overlay, then `Naka-restore na ang purchases mo!` toast on success. Sprint 16 BiometricOverlay (`frontend/src/components/auth/biometric-overlay.tsx`) is the visual precedent for the overlay shape.

---

## 2. `@revenuecat/purchases-capacitor` client integration pattern

### Current state inventory (post-Sprint-16)

- `(app)/layout.tsx` — client component since Sprint 15. Already has `useEffect` blocks for biometric guard (lines 134-206), deep-link listener (212-220), Sentry native init (226-228). Adds a 4th `useEffect` for RevenueCat init.
- No existing IAP code on disk. No `/api/webhooks/revenuecat/` route. No `lib/iap/` directory. No `revenuecat_events` table. Sprint 17 lands all of this net-new.
- `/api/subscriptions/route.ts` already exposes the tier read shape consumed by client; no change to this route's contract — the IAP integration just changes the **writer** side (RevenueCat webhook), not the reader side.
- **Tier enum drift surfaced during audit:** `frontend/src/lib/subscriptions/types.ts` line 16 has `SubscriptionTierEnum = z.enum(['free', 'pro', 'business', 'scale'])` — this is the Build 8 Xendit-era enum and contradicts the Sprint 13 lock (`['free', 'starter', 'pro']`). Sprint 17 must extend it to `['free', 'starter', 'pro', 'business', 'scale']` and add a deprecation comment on `business`/`scale` (Phase 2/3 forward-references — they remain valid enum members but RevenueCat never writes them). See §8 schema notes.

### Decision

A single `frontend/src/lib/iap/configure.ts` module owns the SDK lifecycle. A second `frontend/src/lib/iap/entitlements.ts` module wraps `getCustomerInfo()` into a `getEntitlements()` helper. A third `frontend/src/lib/iap/purchase.ts` module wraps `purchasePackage()` + `restorePurchases()` with conversational Filipino error mapping. The `(app)/layout.tsx` `useEffect` calls `initRevenueCat()` once on mount after auth resolves; PaywallModal calls `getEntitlements()` on open + `purchasePackage()` on tier-card tap.

### Env-var contract (Sprint 17 placeholder, Sprint 19 real values)

```
NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY    = rcb_placeholder_apple_sprint17
NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY   = rcb_placeholder_google_sprint17
REVENUECAT_WEBHOOK_AUTH                 = placeholder_webhook_secret_sprint17_change_before_prod
```

The `NEXT_PUBLIC_*` keys ship in the static export bundle (they're public anyway per RevenueCat docs — the API keys identify the app, not the developer). `REVENUECAT_WEBHOOK_AUTH` is server-only (no `NEXT_PUBLIC_` prefix); it's read inside the `/api/webhooks/revenuecat/route.ts` handler. Sprint 19 swaps all three to real values via Vercel env + `.env.production` at static-export time.

### `frontend/src/lib/iap/configure.ts` new module

```ts
'use client';

/**
 * RevenueCat configuration — call once per app open.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Native-only IAP SDK init. Web path is a no-op; the PWA
 *          fallback paywall displays an "Open in app to purchase" CTA
 *          (see §3 / PaywallModal web branch).
 *
 * Sentry: errors during configure are tagged source='revenuecat-configure'
 *         (see §7).
 *
 * IMPORTANT: idempotent via module-level `configured` boolean — second call
 *            short-circuits. Pattern mirrors initSentryCapacitor()
 *            (lib/sentry/capacitor-init.ts line 35).
 */

import { Capacitor } from '@capacitor/core';

let configured = false;

export async function initRevenueCat(supabaseUserId: string | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // web no-op
  if (configured) return;                    // idempotent

  // No user yet → defer; the (app)/layout.tsx useEffect re-fires after auth.
  if (!supabaseUserId) return;

  const apiKey =
    Capacitor.getPlatform() === 'ios'
      ? process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY;

  if (!apiKey) {
    // No key in env (dev local, smoke build) — skip silently. Same shape
    // as initSentryCapacitor's DSN-missing branch (capacitor-init.ts §44-50).
    return;
  }

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    await Purchases.configure({
      apiKey,
      appUserID: supabaseUserId, // RevenueCat app_user_id == users.id (UUID string)
    });
    if (process.env.NODE_ENV !== 'production') {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    configured = true;
  } catch (err) {
    // Sentry instrumentation per §7
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, { tags: { source: 'revenuecat-configure' } });
    // eslint-disable-next-line no-console
    console.error('[iap] RevenueCat configure failed', err);
  }
}

// Test-only — reset module guard for vitest re-runs (mirrors capacitor-init.ts).
export function __resetRevenueCatForTests(): void {
  configured = false;
}
```

### `(app)/layout.tsx` extension

Add a 4th `useEffect` after the existing Sentry init block (lines 226-228). The init call needs `user.id` from Supabase auth; fetch it in the same `useEffect` (the persona load `useEffect` at lines 134-206 already calls `/api/profile`, but `supabaseUserId` isn't part of that payload — we need a separate `supabase.auth.getUser()` to surface the ID).

```tsx
// Sprint 17 — RevenueCat configure on app open (architect §2).
// Native-only; web no-op. Runs once after auth resolves; the idempotent
// guard inside initRevenueCat() makes accidental re-fires safe.
useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;
  let cancelled = false;
  async function configure() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      await initRevenueCat(user?.id ?? null);
    } catch (err) {
      // Non-fatal — paywall will defer-init on first display.
      // eslint-disable-next-line no-console
      console.error('[iap] layout configure failed', err);
    }
  }
  void configure();
  return () => { cancelled = true; };
}, []);
```

### `frontend/src/lib/iap/entitlements.ts` helper

```ts
'use client';

/**
 * Entitlement check — wraps Purchases.getCustomerInfo() with a
 * single canonical predicate set the paywall + tier-gated screens
 * consume. The TIER mapping (RevenueCat entitlement id → AKBai tier)
 * is the load-bearing contract; if Anton renames an entitlement in
 * the RevenueCat dashboard, update this file ONCE.
 *
 * Entitlement IDs (locked Sprint 17, configured in RevenueCat dashboard
 * Sprint 19):
 *   pro_unlimited   → Pro Monthly OR Pro Annual active subscription
 *   starter_lifetime → ₱299 non-consumable IAP (lifetime)
 *
 * Tier resolution priority: pro > starter > free (per architect Open Q 3).
 */

import { Capacitor } from '@capacitor/core';
import type { SubscriptionTier } from '@/lib/subscriptions/types';

export type Entitlements = {
  tier: SubscriptionTier;
  proExpiresAt: string | null;
  starterPurchasedAt: string | null;
  isNative: boolean;
};

const PRO_ENTITLEMENT_ID = 'pro_unlimited';
const STARTER_ENTITLEMENT_ID = 'starter_lifetime';

export async function getEntitlements(): Promise<Entitlements> {
  if (!Capacitor.isNativePlatform()) {
    return { tier: 'free', proExpiresAt: null, starterPurchasedAt: null, isNative: false };
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.getCustomerInfo();

    const proEnt = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];
    const starterEnt = customerInfo.entitlements.active[STARTER_ENTITLEMENT_ID];

    if (proEnt) {
      return {
        tier: 'pro',
        proExpiresAt: proEnt.expirationDate ?? null,
        starterPurchasedAt: starterEnt?.latestPurchaseDate ?? null,
        isNative: true,
      };
    }
    if (starterEnt) {
      return {
        tier: 'starter',
        proExpiresAt: null,
        starterPurchasedAt: starterEnt.latestPurchaseDate ?? null,
        isNative: true,
      };
    }
    return { tier: 'free', proExpiresAt: null, starterPurchasedAt: null, isNative: true };
  } catch (err) {
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, { tags: { source: 'revenuecat-entitlements' } });
    // Failure mode: assume free (gated routes will reject by their server
    // tier read; client-side this just shows the paywall again — safe).
    return { tier: 'free', proExpiresAt: null, starterPurchasedAt: null, isNative: true };
  }
}
```

### `frontend/src/lib/iap/purchase.ts` — purchase + restore wrappers

```ts
'use client';

/**
 * Purchase + restore wrappers — convert RevenueCat errors into
 * conversational Filipino string keys (see §3 / build-marketing
 * voice-review later).
 *
 * Error categorisation:
 *   USER_CANCELLED    → silent return (idle paywall state)
 *   NETWORK_ERROR     → 'iap.error.network'
 *   PAYMENT_PENDING   → 'iap.error.pending'   (App Store SCA / parental approval)
 *   PAYMENT_INVALID   → 'iap.error.invalid'   (card declined, fraud check)
 *   STORE_PROBLEM     → 'iap.error.store_unavailable'
 *   UNKNOWN           → 'iap.error.unknown'
 */

import { Capacitor } from '@capacitor/core';

export type PurchaseResult =
  | { status: 'success'; tier: 'pro' | 'starter' }
  | { status: 'cancelled' }
  | { status: 'error'; messageKey: string };

const PRODUCT_TO_TIER: Record<string, 'pro' | 'starter'> = {
  'akbai_pro_monthly':  'pro',
  'akbai_pro_annual':   'pro',
  'akbai_starter_lifetime': 'starter',
};

export async function purchasePackage(productId: string): Promise<PurchaseResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'error', messageKey: 'iap.error.web_only' };
  }

  try {
    const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    if (!currentOffering) {
      return { status: 'error', messageKey: 'iap.error.store_unavailable' };
    }
    const pkg = currentOffering.availablePackages.find(
      (p) => p.product.identifier === productId,
    );
    if (!pkg) {
      return { status: 'error', messageKey: 'iap.error.product_not_found' };
    }

    await Purchases.purchasePackage({ aPackage: pkg });

    return { status: 'success', tier: PRODUCT_TO_TIER[productId] ?? 'pro' };
  } catch (err) {
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    const rcErr = err as { code?: string; userCancelled?: boolean; message?: string };

    if (rcErr.userCancelled) return { status: 'cancelled' };

    // Tag for Sentry but classify for UX
    Sentry?.captureException(err, { tags: { source: 'revenuecat-purchase', code: rcErr.code ?? 'unknown' } });

    switch (rcErr.code) {
      case 'NETWORK_ERROR':       return { status: 'error', messageKey: 'iap.error.network' };
      case 'PAYMENT_PENDING_ERROR': return { status: 'error', messageKey: 'iap.error.pending' };
      case 'INVALID_CREDENTIALS_ERROR':
      case 'PAYMENT_NOT_ALLOWED_ERROR':
        return { status: 'error', messageKey: 'iap.error.invalid' };
      case 'STORE_PROBLEM_ERROR': return { status: 'error', messageKey: 'iap.error.store_unavailable' };
      default:                    return { status: 'error', messageKey: 'iap.error.unknown' };
    }
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'error', messageKey: 'iap.error.web_only' };
  }
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active['pro_unlimited']) {
      return { status: 'success', tier: 'pro' };
    }
    if (customerInfo.entitlements.active['starter_lifetime']) {
      return { status: 'success', tier: 'starter' };
    }
    return { status: 'error', messageKey: 'iap.error.nothing_to_restore' };
  } catch (err) {
    const Sentry = await import('@sentry/capacitor').catch(() => null);
    Sentry?.captureException(err, { tags: { source: 'revenuecat-restore' } });
    return { status: 'error', messageKey: 'iap.error.unknown' };
  }
}
```

### Conversational Filipino copy — string keys

build-marketing voice-reviews these later. Below is the intent + draft copy for each key. Final wording is build-marketing's call.

| Key | Intent | Draft (build-marketing reviews) |
|---|---|---|
| `iap.error.network`         | Network failure mid-purchase | `"Walang koneksyon. Subukan mo ulit kapag may signal ka na."` |
| `iap.error.pending`         | Apple/Google approval pending (SCA, parental) | `"Sandali, kinukumpleto pa ng store ang bayad mo. Babalik kami sa'yo mamaya."` |
| `iap.error.invalid`         | Card declined / fraud check | `"Hindi natanggap ng store ang bayad. Tingnan mo ang payment method mo."` |
| `iap.error.store_unavailable` | App Store / Play offline | `"Hindi available ang store ngayon. Subukan mo ulit mamaya."` |
| `iap.error.product_not_found` | SKU not configured (Sprint 19 issue) | `"Wala pa kaming makitang plano para sa account mo. Subukan mo ulit mamaya."` |
| `iap.error.nothing_to_restore` | Restore tapped, no prior purchase | `"Wala kaming nakitang dating purchase. Bumili ka muna ng plano."` |
| `iap.error.web_only`        | User tapped purchase on PWA | `"Para mag-bayad, i-download mo muna ang AKBai app sa App Store o Play Store."` |
| `iap.error.unknown`         | Catch-all | `"May pumalpak. Subukan mo ulit, o mag-message sa amin sa support."` |
| `iap.success.purchase`      | Successful purchase | `"Yes! Welcome sa Pro. I-explore mo na lahat ng features."` |
| `iap.success.restore`       | Successful restore | `"Naka-restore na ang purchases mo. I-enjoy ulit ang mga features mo."` |

Copy follows CLAUDE.md non-negotiable #5: VSO frame, second-position enclitics (`mo ulit`, `kami sa'yo`), Filipinized verbs (`i-download`, `mag-bayad`), no English SVO constructions.

---

## 3. Webhook architecture — `/api/webhooks/revenuecat/route.ts` (NEW route)

### Decision

A single POST route at `frontend/src/app/api/webhooks/revenuecat/route.ts` handles all RevenueCat events. Shape mirrors the Xendit handler (`/api/webhooks/xendit/route.ts`) exactly:

1. Verify `Authorization: Bearer <shared-secret>` header with constant-time compare → silent 200 on mismatch
2. Parse JSON body; Zod-validate envelope shape → silent 200 on parse failure
3. Idempotency check: `INSERT INTO revenuecat_events … ON CONFLICT (event_id) DO NOTHING RETURNING id` → if zero rows returned, 200 OK with `{ deduped: true }`, skip downstream
4. Route by `event.type` → dispatch to handler
5. Each handler computes the full entitlement state by calling RevenueCat REST API (`GET /v1/subscribers/{app_user_id}`) — never trust the single event's tier inference
6. Call `set_user_tier_v2(p_user_id, p_tier, p_expires_at, p_revenuecat_app_user_id, p_reset_started_at)` via Supabase RPC
7. Mark `revenuecat_events.processed_at = NOW()`
8. Return 200 OK regardless of any internal failure (log to Sentry; RevenueCat retry would only thrash)

### Signature verification

RevenueCat's webhook dashboard lets you set an arbitrary `Authorization` header value. The webhook handler reads `req.headers.get('authorization')` (lowercased per Web standard), strips the `Bearer ` prefix, and constant-time compares to `process.env.REVENUECAT_WEBHOOK_AUTH`.

```ts
function verifyWebhookSignature(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) {
    console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_AUTH not configured');
    return false;
  }
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
```

Mirror of Xendit handler lines 40-62. The Xendit handler reads `x-callback-token` directly; RevenueCat uses the standard `Authorization` header → standard `Bearer` prefix handling.

### Event UUID idempotency

RevenueCat sends a UUID (`event.id`) on every event. Idempotency key is exactly this field. The new `revenuecat_events` table (§8 migration 022) has `event_id TEXT PRIMARY KEY`. The handler attempts insert via Supabase JS:

```ts
const { data: inserted, error: insertError } = await serviceClient
  .from('revenuecat_events')
  .insert({
    event_id: event.id,
    event_type: event.type,
    app_user_id: event.app_user_id,
    event_at: new Date(event.event_timestamp_ms).toISOString(),
    payload: event,
    processed_at: null,
  })
  .select('event_id')
  .single();

if (insertError) {
  // Postgres duplicate-key error code is '23505'. Supabase JS surfaces
  // this as PostgrestError.code = '23505'. Treat as "already processed":
  if (insertError.code === '23505') {
    console.log(`[RevenueCat Webhook] Duplicate event ${event.id} — deduped`);
    return NextResponse.json(
      { success: true, data: { received: true, deduped: true } },
      { status: 200 },
    );
  }
  // Other DB error — log + 200 OK (don't retry, don't trust the cache)
  console.error('[RevenueCat Webhook] Event insert failed:', insertError.message);
  return NextResponse.json(
    { success: true, data: { received: true } },
    { status: 200 },
  );
}
```

This is the **event-envelope-level** dedup. The Xendit handler's `recordPayment` upsert is **payment-row-level** dedup; for RevenueCat we go up one level because an event may produce zero, one, or many DB writes — the safe boundary is the event itself.

After downstream processing succeeds, mark the row processed:

```ts
await serviceClient
  .from('revenuecat_events')
  .update({ processed_at: new Date().toISOString() })
  .eq('event_id', event.id);
```

Failure to mark processed is logged but non-fatal — a future event for the same user will reconcile the tier regardless.

### Event types and tier-mapping

RevenueCat sends these event types (canonical list per their docs). For each, the handler does:

| Event type | Trigger | Action |
|---|---|---|
| `INITIAL_PURCHASE` | First-time purchase of any product | Re-compute entitlements via REST → `set_user_tier_v2(user_id, computed_tier, computed_expires_at, app_user_id, p_reset_started_at=true)` |
| `RENEWAL` | Auto-renew subscription period extended | Re-compute → `set_user_tier_v2(…, p_reset_started_at=false)` (preserve `started_at`) |
| `PRODUCT_CHANGE` | User upgraded/downgraded (e.g. Monthly→Annual) | Re-compute → `set_user_tier_v2(…, p_reset_started_at=false)` |
| `CANCELLATION` | User cancelled auto-renew (entitlement still active until period end) | NO immediate tier change. Re-compute and write — entitlement may still be active until `expires_at`. Log for analytics. |
| `EXPIRATION` | Subscription period ended without renewal | Re-compute → `set_user_tier_v2(…, computed_tier=falls back per Open Q 3, p_reset_started_at=false)` |
| `BILLING_ISSUE` | Payment failed; entered grace period | Re-compute (likely still active); status field on `subscriptions` updated to `'grace_period'`. RevenueCat handles grace internally — DO NOT downgrade yet. |
| `NON_RENEWING_PURCHASE` | Lifetime non-consumable purchased (Starter ₱299) | Re-compute → `set_user_tier_v2(user_id, computed_tier, p_expires_at=NULL, app_user_id, p_reset_started_at=true)` |
| `SUBSCRIBER_ALIAS` | User identity merge (e.g. anonymous → authenticated) | Log only this sprint. Sprint 19+ when alias scenarios surface. |
| `TRANSFER` | Entitlement transferred between users | Log only this sprint. Edge case; not in launch scope. |
| `UNCANCELLATION` | User re-enabled auto-renew before period end | Re-compute (status reverts to active). Log + write. |
| `TEST` | RevenueCat dashboard "send test event" | Log + return 200; never touch tier rows. |

The handler logic:

```ts
async function handleEvent(
  serviceClient: ReturnType<typeof createServiceClient>,
  event: RevenueCatEvent,
): Promise<void> {
  // Reject events from the wrong environment (Sprint 19 sandbox testing
  // must NOT mutate production rows; see Open Q 1).
  if (process.env.NODE_ENV === 'production' && event.environment !== 'PRODUCTION') {
    console.log(`[RevenueCat Webhook] Skipping ${event.environment} event in production`);
    return;
  }

  // SUBSCRIBER_ALIAS / TRANSFER / TEST: log only, no tier write
  if (event.type === 'SUBSCRIBER_ALIAS' || event.type === 'TRANSFER' || event.type === 'TEST') {
    console.log(`[RevenueCat Webhook] ${event.type} — logged, no tier write`);
    return;
  }

  // Compute the canonical entitlement state via RevenueCat REST.
  // We NEVER trust the event's product_id alone for tier inference because
  // a user may hold Starter (lifetime) AND Pro simultaneously — only the
  // full entitlement list tells us which is currently active.
  const entitlements = await fetchEntitlementsFromRevenueCat(event.app_user_id);

  const reset = event.type === 'INITIAL_PURCHASE' || event.type === 'NON_RENEWING_PURCHASE';

  await serviceClient.rpc('set_user_tier_v2', {
    p_user_id: event.app_user_id,           // UUID string; cast happens server-side
    p_tier: entitlements.tier,              // 'free' | 'starter' | 'pro'
    p_expires_at: entitlements.expires_at,  // ISO or null
    p_revenuecat_app_user_id: event.app_user_id,
    p_reset_started_at: reset,
  });
}
```

### `fetchEntitlementsFromRevenueCat()` — server-side REST lookup

```ts
async function fetchEntitlementsFromRevenueCat(
  appUserId: string,
): Promise<{ tier: SubscriptionTier; expires_at: string | null }> {
  // GET https://api.revenuecat.com/v1/subscribers/{app_user_id}
  // Auth: Bearer <REVENUECAT_REST_API_KEY> (DIFFERENT from the webhook auth secret;
  //       Sprint 19 generates this in the RevenueCat dashboard under "API keys → Server").
  const apiKey = process.env.REVENUECAT_REST_API_KEY;
  if (!apiKey) {
    // No REST key configured (Sprint 17 placeholder env). Fall back to
    // the event's own entitlement_ids list — less authoritative but works
    // for Sprint 17 acceptance (engineer doesn't have a live key).
    return fallbackFromEvent(appUserId);
  }

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error(`[RevenueCat Webhook] REST lookup failed for ${appUserId}: ${res.status}`);
    return { tier: 'free', expires_at: null };
  }
  const json = await res.json() as RevenueCatSubscriberResponse;
  const active = json.subscriber.entitlements ?? {};
  const pro = active['pro_unlimited'];
  const starter = active['starter_lifetime'];

  if (pro && new Date(pro.expires_date) > new Date()) {
    return { tier: 'pro', expires_at: pro.expires_date };
  }
  if (starter) {
    return { tier: 'starter', expires_at: null };
  }
  return { tier: 'free', expires_at: null };
}
```

The fallback path (Sprint 17 acceptance — no REST key) infers tier from `event.product_id` alone. This is **less authoritative** but lets the webhook be testable end-to-end this sprint:

```ts
function fallbackFromEvent(appUserId: string): { tier: SubscriptionTier; expires_at: string | null } {
  // Pure fallback — caller resolves entitlements without the REST call.
  // Sprint 17 acceptance only; Sprint 19 REST key removes this branch.
  return { tier: 'free', expires_at: null };
}
```

Engineer can leave the fallback intentionally weak (returns 'free') since the inline `handleEvent` does the per-event product_id read directly when the REST key isn't set — see batch 2 acceptance criteria.

### `app_user_id` → `users.id` mapping

When the client calls `Purchases.configure({ apiKey, appUserID: supabaseUserId })`, RevenueCat stores `app_user_id = supabaseUserId` (a UUID string). All webhook events from that user include `event.app_user_id` matching that string. The webhook handler casts `event.app_user_id` to UUID for the `set_user_tier_v2` RPC call (Postgres handles the implicit cast since `users.id` is `UUID PRIMARY KEY`).

**Mapping is opaque to RevenueCat.** They don't validate that the string is a UUID; they treat it as a string identifier. If `Purchases.configure()` is called without `appUserID`, RevenueCat generates an anonymous `$RCAnonymousID:xxxx` string — those events MUST be ignored or aliased server-side (out of scope for Sprint 17; defer to Sprint 19 if anonymous-purchase scenarios surface).

### Zod envelope shape

```ts
// frontend/src/lib/iap/schemas.ts
export const RevenueCatEventSchema = z.object({
  api_version: z.string(),
  event: z.object({
    id: z.string().uuid(),
    type: z.enum([
      'INITIAL_PURCHASE', 'RENEWAL', 'CANCELLATION', 'EXPIRATION',
      'BILLING_ISSUE', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE',
      'SUBSCRIBER_ALIAS', 'TRANSFER', 'UNCANCELLATION', 'TEST',
    ]),
    event_timestamp_ms: z.number().int().positive(),
    app_user_id: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    product_id: z.string().optional(),
    period_type: z.enum(['NORMAL', 'TRIAL', 'INTRO']).optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']),
    expiration_at_ms: z.number().int().nullable().optional(),
    purchased_at_ms: z.number().int().optional(),
    store: z.enum(['APP_STORE', 'PLAY_STORE', 'STRIPE', 'PROMOTIONAL']).optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).nullable().optional(),
  }).passthrough(),
});
export type RevenueCatEvent = z.infer<typeof RevenueCatEventSchema>['event'];
```

`.passthrough()` is intentional — RevenueCat adds fields over time, we don't want to fail-closed on a forward-compatible payload addition.

### POST handler skeleton

```ts
export async function POST(req: NextRequest) {
  console.log('[RevenueCat Webhook] Received callback');

  if (!verifyWebhookSignature(req)) {
    console.warn('[RevenueCat Webhook] Signature verification failed');
    return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    console.warn('[RevenueCat Webhook] Invalid JSON body');
    return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
  }

  const parsed = RevenueCatEventSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('[RevenueCat Webhook] Invalid payload structure:', parsed.error.flatten());
    return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
  }

  const { event } = parsed.data;
  console.log(`[RevenueCat Webhook] Processing ${event.type} event ${event.id} for user ${event.app_user_id}`);

  try {
    const serviceClient = createServiceClient();

    // ----- Idempotent insert (Gap G2 resolution) -----
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
        return NextResponse.json({ success: true, data: { received: true, deduped: true } }, { status: 200 });
      }
      // Log + return 200 (no retry storm)
      console.error('[RevenueCat Webhook] Event insert failed:', insertError.message);
      return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
    }

    // ----- Downstream tier write -----
    await handleEvent(serviceClient, event);

    await serviceClient
      .from('revenuecat_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[RevenueCat Webhook] Error processing ${event.type}:`, message);
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    Sentry?.captureException(err, { tags: { source: 'revenuecat-webhook' } });
  }

  return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
}
```

---

## 4. Paywall UX — placement, components, copy

### Existing tier-gate inventory

Grep'd `frontend/src/` for tier checks. Sprint 17 routes the existing upgrade prompts through a unified `<PaywallModal />` instead of the generic `<UpgradePrompt />` card (`components/subscription/upgrade-prompt.tsx`). Sites to update:

| File | Current gate | Sprint 17 change |
|---|---|---|
| `frontend/src/app/api/chat/route.ts` line 238 | `tier === 'free'` → `KA_ERROR_MESSAGES.free_tier_limit` | Server stays as-is (returns 429 with `free_tier_limit` error). Client-side `<ChatInterface>` catches the 429 and opens `<PaywallModal source="chat" />`. |
| `frontend/src/app/api/morning-briefing/route.ts` line 324 | `tier === 'free'` → 200 with `reason: 'tier_required'` | Server stays as-is. Client `<MorningBriefingCard>` reads `reason='tier_required'` and renders `<PaywallModal source="morning_briefing" />` instead of generic upgrade card. |
| `frontend/src/app/api/ocr/route.ts` line 128-138 | Circuit breaker by tier (free=0 scans) | Free tier scan limit is enforced server-side via `SCAN_LIMITS.free=0`. Client `<ScannerFlow>` triggers paywall when API returns scan-limit-exceeded. |
| `frontend/src/components/chat/free-tier-banner.tsx` | Free tier inline banner | Keep the banner (in-flow nudge), but the `/pricing` link (line 30) becomes `onClick → open PaywallModal`. Drop the dead `/pricing` href. |
| `frontend/src/components/subscription/upgrade-prompt.tsx` | Generic CTA card | Replace internal `onUpgrade` callback default with PaywallModal open. Keep the card visual; just change what the button does. |
| `frontend/src/components/dashboard/morning-briefing-card.tsx` | Reads `reason='tier_required'`, renders upgrade prompt | Wire `<PaywallModal source="morning_briefing" />`. |
| `frontend/src/app/api/weekly-story/route.ts` | (tier check exists — same shape) | Same as morning-briefing. |
| `frontend/src/app/api/chat/suggestions/route.ts` | (tier check exists) | Same as chat. |

These are 5 surfaces routing to one PaywallModal. The modal is created net-new at `frontend/src/components/subscription/paywall-modal.tsx`.

### `<PaywallModal />` component shape

```tsx
'use client';

/**
 * PaywallModal — post-trial gate paywall. 3 tier cards + restore link.
 *
 * Sources (passed as `source` prop, logged to PostHog for funnel analysis):
 *   'chat' | 'morning_briefing' | 'weekly_story' | 'reply_drafter' | 'scan_limit'
 *   | 'manual'  (user tapped "Upgrade" in /profile)
 *
 * Web fallback: when !Capacitor.isNativePlatform(), shows "Open in app to
 *               purchase" with App Store + Play Store icons. No purchase
 *               buttons rendered.
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { purchasePackage, restorePurchases } from '@/lib/iap/purchase';
import { getEntitlements } from '@/lib/iap/entitlements';

type PaywallSource = 'chat' | 'morning_briefing' | 'weekly_story' | 'reply_drafter' | 'scan_limit' | 'manual';

interface PaywallModalProps {
  open: boolean;
  source: PaywallSource;
  onClose: () => void;
  onUpgraded?: (tier: 'pro' | 'starter') => void;
}

export function PaywallModal({ open, source, onClose, onUpgraded }: PaywallModalProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // …purchase handlers, restore handler, error toast, 3-card grid…
}
```

### 3 tier cards (locked Sprint 13 model)

Card 1: **Starter ₱299 lifetime**
- Headline: "Starter"
- Subheadline: "₱299 lifetime — bayad mo isang beses lang"
- Bullets: "100 receipt scans kada buwan", "BIR deadline reminders", "Basic reports + CSV export"
- Bottom note: "Walang Kai chat sa Starter — i-Pro mo kung gusto mo"
- CTA: "Kunin ang Starter"

Card 2: **Pro Monthly ₱499/mo**
- Headline: "Pro Monthly"
- Subheadline: "₱499 kada buwan"
- Bullets: "Lahat sa Starter +", "Unlimited Kai chat", "Morning briefing araw-araw", "Kuwento ng linggo", "Reply drafter para sa customers"
- CTA: "Kunin ang Pro"

Card 3: **Pro Annual ₱4,999/yr** (default-highlighted card)
- Headline: "Pro Annual"
- Subheadline: "₱4,999 kada taon — save ka ng halos ₱990"
- Same bullets as Pro Monthly
- Badge: "Pinaka-sulit" (Most worth it)
- CTA: "Kunin ang Pro Annual"

Below the cards: a smaller **Restore purchases link** in Filipino: `"May dating purchase ka na? I-restore mo dito."` — Apple Guideline 3.1.1 requirement.

### Conversational Filipino copy — paywall string keys

| Key | Intent | Draft (build-marketing reviews) |
|---|---|---|
| `paywall.title.chat`              | Trial-expired → chat gate | `"Naka-max ka na sa free trial. Mag-upgrade para tuloy ang chat kay Kai."` |
| `paywall.title.morning_briefing`  | Trial-expired → briefing gate | `"Para sa daily briefing mo, i-Pro mo ang account."` |
| `paywall.title.weekly_story`      | Trial-expired → kuwento gate | `"Para sa Kuwento ng Linggo, i-Pro mo ang account."` |
| `paywall.title.reply_drafter`     | Trial-expired → reply drafter gate | `"Para i-draft ni Kai ang reply mo, i-Pro mo ang account."` |
| `paywall.title.scan_limit`        | Free tier scan limit hit | `"Naubos na ang scans mo. I-Starter mo for ₱299 lifetime o i-Pro mo para sa unlimited."` |
| `paywall.title.manual`            | User tapped "Upgrade" in /profile | `"Pumili ka ng plano para sa AKBai."` |
| `paywall.body.starter_only`       | Sub-line under cards | `"Walang Kai sa Starter — kung gusto mo ng chat, kunin ang Pro."` |
| `paywall.cta.restore`             | Restore link | `"May dating purchase ka na? I-restore mo dito."` |
| `paywall.cta.close`               | Close button (X) | aria-label: `"Isara ang paywall"` |
| `paywall.web_fallback.title`      | PWA branch headline | `"Para mag-bayad, gamitin mo ang app."` |
| `paywall.web_fallback.body`       | PWA branch body | `"I-download mo ang AKBai mula sa App Store o Play Store para i-upgrade ang account mo."` |

Apple-specific: the restore link MUST be visible (not collapsed into a "More" drawer) on the paywall modal AND on `/profile`. Engineer adds both.

### Lifetime-Starter + Pro coexistence state machine

Open Q 3 (a) recommendation locked. State table:

| RevenueCat entitlements active | Computed tier | Notes |
|---|---|---|
| `pro_unlimited` only | `pro` | Standard Pro user |
| `pro_unlimited` + `starter_lifetime` | `pro` | Pro supersedes; starter is dormant insurance |
| `starter_lifetime` only | `starter` | Lifetime user who never went Pro |
| Neither | `free` | Trial expired, never converted |
| `pro_unlimited` cancelled but `expires_at > NOW()` | `pro` | Grace until period end |
| `pro_unlimited` cancelled and `expires_at < NOW()`, `starter_lifetime` active | `starter` | Fallback (Open Q 3 (a)) |
| `pro_unlimited` cancelled and `expires_at < NOW()`, no starter | `free` | Full downgrade |

The `fetchEntitlementsFromRevenueCat()` function (§3) implements this table. The webhook handler routes every event through this resolver; the client `getEntitlements()` returns the same shape from `Purchases.getCustomerInfo()`. **Single source of truth: RevenueCat entitlements; AKBai's `subscriptions.tier` is the cached projection.**

---

## 5. Schema migration shape (build-data hand-off)

Two migrations this sprint. Migration numbering: next sequential after `021_users_biometric_columns.sql` is `022`; if another migration lands first on `dev`, adjust to `023` etc. (per `feedback_migration_numbering` rule).

### Migration A (022): `revenuecat_events` table + `set_user_tier_v2()` RPC

**Filename intent:** `022_revenuecat_events.sql`

**Schema:**

```sql
-- ============================================================
-- Migration 022: revenuecat_events + set_user_tier_v2()
-- Feature: RevenueCat IAP webhook idempotency (Sprint 17, Gap G2 resolution)
-- Purpose: Persist every RevenueCat webhook event keyed by event UUID
--          for idempotent processing. The PRIMARY KEY enforces dedup;
--          ON CONFLICT DO NOTHING is the load-bearing invariant per
--          architect §3. Also adds set_user_tier_v2() RPC: tier writes
--          must route through this function (not direct UPDATEs).
--
-- Owning tables:
--   - public.revenuecat_events (NEW)
--   - public.subscriptions     (existing, no schema change)
--
-- RLS: revenuecat_events is service-role-only — NO user SELECT policy.
--      This is an internal audit log; users never read their own events.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  event_id     TEXT        PRIMARY KEY,                                 -- RevenueCat event UUID
  event_type   TEXT        NOT NULL,                                    -- 'INITIAL_PURCHASE' | 'RENEWAL' | ...
  app_user_id  TEXT        NOT NULL,                                    -- users.id::text (RevenueCat treats as opaque)
  event_at     TIMESTAMPTZ NOT NULL,                                    -- from event.event_timestamp_ms
  payload      JSONB       NOT NULL,                                    -- full event envelope
  processed_at TIMESTAMPTZ NULL,                                        -- set after downstream tier write
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ NULL                                         -- soft-delete invariant (CLAUDE.md rule 2)
);

ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

-- NO user-side SELECT policy. Service role bypasses RLS.
-- If a future feature needs user-side reads, add a policy then; default deny.

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user_event_at
  ON public.revenuecat_events(app_user_id, event_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_unprocessed
  ON public.revenuecat_events(event_at DESC)
  WHERE processed_at IS NULL AND deleted_at IS NULL;

COMMENT ON TABLE  public.revenuecat_events IS
  'RevenueCat webhook event log. Primary key (event_id) provides idempotency. Sprint 17 / Gap G2 resolution.';
COMMENT ON COLUMN public.revenuecat_events.app_user_id IS
  'Equal to users.id::text. RevenueCat treats this as opaque; we cast for the FK lookup.';
COMMENT ON COLUMN public.revenuecat_events.processed_at IS
  'Null until downstream set_user_tier_v2() succeeds. Re-processable via the unprocessed-events index.';
```

**`set_user_tier_v2()` RPC:**

```sql
CREATE OR REPLACE FUNCTION public.set_user_tier_v2(
  p_user_id                   UUID,
  p_tier                      TEXT,
  p_expires_at                TIMESTAMPTZ DEFAULT NULL,
  p_revenuecat_app_user_id    TEXT        DEFAULT NULL,
  p_reset_started_at          BOOLEAN     DEFAULT false
) RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET tier                      = p_tier,
      expires_at                = p_expires_at,
      status                    = CASE
                                    WHEN p_tier = 'free' THEN 'cancelled'
                                    ELSE 'active'
                                  END,
      started_at                = CASE
                                    WHEN p_reset_started_at THEN NOW()
                                    ELSE started_at
                                  END,
      xendit_subscription_id    = CASE
                                    WHEN p_revenuecat_app_user_id IS NOT NULL
                                    THEN COALESCE(xendit_subscription_id, p_revenuecat_app_user_id)
                                    ELSE xendit_subscription_id
                                  END,
      updated_at                = NOW()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_user_tier_v2 IS
  'Sprint 17 — RevenueCat tier write. p_reset_started_at=true only on INITIAL_PURCHASE / NON_RENEWING_PURCHASE. v1 (set_user_tier) preserved for legacy Xendit callsites.';
```

**Note on `p_revenuecat_app_user_id`:** I'm overloading the existing `subscriptions.xendit_subscription_id` column to hold the RevenueCat app_user_id (which == users.id::text). This avoids migration 023 (a dedicated column) unless Anton wants the explicit column for clarity — see Open Q 5 / §8 alternative.

### Migration B (023, OPTIONAL — Open Q 5 b): dedicated `revenuecat_app_user_id` column on subscriptions

```sql
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS revenuecat_app_user_id TEXT NULL;

COMMENT ON COLUMN public.subscriptions.revenuecat_app_user_id IS
  'RevenueCat app_user_id == users.id::text. Sprint 17 audit field; future Sprint 19 reverse-lookups will read this directly.';

CREATE INDEX IF NOT EXISTS idx_subscriptions_revenuecat_app_user_id
  ON public.subscriptions(revenuecat_app_user_id)
  WHERE deleted_at IS NULL AND revenuecat_app_user_id IS NOT NULL;
```

**Recommendation: SKIP migration B for Sprint 17.** `app_user_id == users.id::text` makes a dedicated column redundant — every reverse lookup can use `subscriptions.user_id` directly. The `xendit_subscription_id` overload in migration A is a stopgap; if Anton finds it confusing at PR review, add migration B in a follow-up sprint. Engineer doesn't depend on it for Sprint 17 acceptance.

### `subscriptions.tier` enum extension

**Critical finding from codebase audit:** `frontend/src/lib/subscriptions/types.ts` line 16 has `SubscriptionTierEnum = z.enum(['free', 'pro', 'business', 'scale'])` — the Build 8 Xendit-era enum. The Sprint 13 tier-model lock (`project-context.md` §4) requires `'free' | 'starter' | 'pro'`. There is currently NO Postgres-level `tier` check constraint (migration 003 declares `tier TEXT NOT NULL DEFAULT 'free'` with no enum), so the DB accepts any string — meaning the enum mismatch is a TypeScript-only issue, not a DB constraint failure.

**Sprint 17 fix:**

```ts
// frontend/src/lib/subscriptions/types.ts line 16 (Sprint 17 patch)
export const SubscriptionTierEnum = z.enum(['free', 'starter', 'pro', 'business', 'scale']);
//                                                    ^^^^^^^^^ — new
//                                                                       ^^^^^^^^^^^^^^^^^^^^^^ — Phase 2/3 forward refs, kept for backwards compat
```

Engineer adds the `'starter'` value to the enum **in the same PR** as the webhook code (batch 2). Build-data confirms no DB migration is needed (the column is plain `TEXT` already).

**Optional hardening (build-data may include in migration 022):** add a CHECK constraint to lock the enum:

```sql
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IN ('free', 'starter', 'pro', 'business', 'scale'));
```

Recommend INCLUDE this CHECK in migration 022. Catches future writer-side typos at the DB layer.

### Surprise found during audit: `subscriptions` schema drift

`frontend/src/lib/subscriptions/lifecycle.ts` writes columns that don't appear in `frontend/supabase/migrations/003_subscriptions_table.sql`:

- `xendit_customer_id`
- `payment_method`
- `current_period_start`
- `current_period_end`
- `scan_limit`
- `scans_used_this_period`
- `grace_period_end`
- `grace_notifications_sent`
- `cancelled_at`

These must have been added via a migration outside the `frontend/supabase/migrations/` directory (or via Supabase Studio direct SQL). Build-data should **verify the production schema matches** before writing migration 022 — if any of these columns are missing in prod, the existing Xendit code is already broken, and Sprint 17 inherits the gap. Recommend: build-data runs `\d subscriptions` against the staging Supabase project as the first step of the migration prep.

This same drift applies to `protect_feature_flags()` trigger: referenced in `project-context.md` line 177 + `gap-registry.md` line 85 as "deployed Sprint 3 (Security Hardening, 2026-03-20)" but I cannot grep its CREATE TRIGGER definition in any migration file. **Recommend Sprint 17 build-data ALSO confirms** the trigger exists on `users.feature_flags` in prod, and re-creates it (idempotently with `CREATE OR REPLACE`) if missing. This is risk #2 in §1 — RevenueCat MUST NOT bypass the trigger if it's load-bearing.

---

## 6. Existing security architecture INTERSECTION

| Invariant | Source | Sprint 17 compliance |
|---|---|---|
| `subscriptions` table SELECT-only RLS | migration 003 line 32-34 | Webhook handler uses `createServiceClient()` (bypasses RLS). Matches Xendit handler line 196. **Zero new RLS bypasses introduced.** |
| `set_user_tier()` RPC = authoritative tier-write path | ADR-005 + migration 003 line 73-88 | Sprint 17 adds `set_user_tier_v2()` as an extension, NOT a bypass. RevenueCat handler calls v2 only; never direct UPDATE. Existing Xendit `lifecycle.ts` direct-UPDATE pattern is acknowledged as legacy debt (Sprint 17 carry-over item, see §11). |
| `protect_feature_flags()` trigger prevents user-side tier manipulation | ADR-005 + project-context line 177 | RevenueCat handler writes via SECURITY DEFINER RPC. Trigger is column-level on `users.feature_flags`; RevenueCat writes touch `subscriptions.tier`, not `users.feature_flags`. **Zero intersection.** Build-data still verifies the trigger exists per §5 audit finding. |
| RLS on every Supabase table (CLAUDE.md rule 1) | CLAUDE.md non-negotiable #1 | New `revenuecat_events` table has RLS ENABLED, no SELECT/INSERT/UPDATE policies → effectively service-role-only access. Compliant. |
| Soft-delete only (CLAUDE.md rule 2) | CLAUDE.md non-negotiable #2 | `revenuecat_events.deleted_at TIMESTAMPTZ NULL` per §5. No DELETE policy. |
| TypeScript strict + Zod on API inputs (CLAUDE.md rule 3) | CLAUDE.md non-negotiable #3 | `RevenueCatEventSchema` per §3 validates the webhook body. No `any` types in `lib/iap/`. |
| Server-side API keys only (CLAUDE.md rule 4) | CLAUDE.md non-negotiable #4 | `REVENUECAT_WEBHOOK_AUTH` and `REVENUECAT_REST_API_KEY` server-only (no `NEXT_PUBLIC_` prefix). `NEXT_PUBLIC_REVENUECAT_*_API_KEY` are the public client-init keys per RevenueCat spec (these identify the app, not the developer — same as Stripe publishable keys). Compliant. |

---

## 7. Sentry coverage extension

Webhook errors must surface in Sentry with route-specific tagging. Pattern matches Sprint 16 §6.

### Server-side (`@sentry/nextjs`)

```ts
// in /api/webhooks/revenuecat/route.ts catch block
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(err, {
  tags: {
    source: 'revenuecat-webhook',
    event_type: event?.type ?? 'unknown',
    environment: event?.environment ?? 'unknown',
  },
  extra: {
    event_id: event?.id,
    app_user_id: event?.app_user_id,
  },
});
```

Saved search for the Sentry dashboard: `tags.source:revenuecat-webhook`. Sprint 17 Sprint 19 will be the first time real events arrive (sandbox testing); the saved search is set up Sprint 17 so the data has a destination.

### Client-side (`@sentry/capacitor` + `@sentry/nextjs`)

Tagging conventions for client IAP errors (already wired in `lib/iap/configure.ts`, `entitlements.ts`, `purchase.ts` per §2 code snippets):

- `source: 'revenuecat-configure'`     — `initRevenueCat()` failures
- `source: 'revenuecat-entitlements'`  — `getEntitlements()` failures
- `source: 'revenuecat-purchase'`      — `purchasePackage()` failures (+ `code` tag for the RC error code)
- `source: 'revenuecat-restore'`       — `restorePurchases()` failures

These match the Sprint 16 `[sentry-capacitor]` convention in `frontend/src/lib/sentry/capacitor-init.ts`.

### What doesn't go to Sentry

`PurchasesError` with `userCancelled: true` is a **user cancellation**, NOT an error — return `{ status: 'cancelled' }` and do not call `captureException`. Mirrors Sprint 16 camera-cancel handling (`startNativeCamera` catch in §2 of the Sprint 16 doc).

---

## 8. Engineer batch boundaries

**Lesson from Sprint 16 retro DRIFT #7:** architect bundled camera + deep-link in one batch; PM split them across batches 1 + 3, causing minor coordination friction. Sprint 17 prevents this by being **explicit** about which files land in which batch. PM may NOT split or merge these batches without an updated ADR.

### Batch 1: Client IAP foundations

Lowest risk. No schema, no webhook, no server changes. Pure client-side scaffolding behind native gates.

Files engineer creates / modifies:

1. `npm install --save @revenuecat/purchases-capacitor` (verify bundle delta ~1-2 MB AAB; check against Sprint 16 baseline 20.75 MB)
2. **NEW:** `frontend/src/lib/iap/configure.ts` (per §2)
3. **NEW:** `frontend/src/lib/iap/entitlements.ts` (per §2)
4. **NEW:** `frontend/src/lib/iap/purchase.ts` (per §2)
5. **NEW:** `frontend/src/lib/iap/schemas.ts` (per §3 RevenueCatEventSchema — define here even though it's only consumed by the webhook in batch 2, so the types live alongside other IAP code)
6. **MODIFY:** `frontend/src/app/(app)/layout.tsx` — add 4th `useEffect` calling `initRevenueCat()` after auth (per §2)
7. Smoke: web `npm run build` MUST pass; Capacitor static export (`CAPACITOR_BUILD=1`) MUST pass; AAB / APK debug build under 22 MB (Sprint 16 ceiling) or 23 MB if RevenueCat AAB delta runs slightly heavy.

Tests batch 1 adds:
- `lib/iap/__tests__/configure.test.ts` — web no-op, idempotent guard, env-key resolution, error capture
- `lib/iap/__tests__/entitlements.test.ts` — tier resolution priority (pro > starter > free); web returns isNative=false
- `lib/iap/__tests__/purchase.test.ts` — error code mapping, cancellation path silent, restore happy/empty paths

Expected: +25-35 tests vs Sprint 16 baseline of 1427.

### Batch 2: Webhook + schema migration

Schema-touching batch. Build-data writes migration 022 BEFORE engineer starts.

Files engineer creates / modifies:

1. **Wait for build-data:** migration 022 merged to `dev`/`main`; staging schema confirmed.
2. **NEW:** `frontend/src/app/api/webhooks/revenuecat/route.ts` (per §3 — full POST handler)
3. **MODIFY:** `frontend/src/lib/subscriptions/types.ts` — extend `SubscriptionTierEnum` to include `'starter'` (per §5).
4. **NEW:** `frontend/src/lib/iap/server-entitlements.ts` — `fetchEntitlementsFromRevenueCat()` REST helper (server-only; no `'use client'`).
5. Smoke: full vitest suite green; the webhook handler test (next item) is the load-bearing new coverage.

Tests batch 2 adds:
- `app/api/webhooks/revenuecat/__tests__/route.test.ts` — signature ok/fail, JSON parse fail, Zod fail, idempotent insert (first event 200/inserted, duplicate event 200/deduped), event-type routing (INITIAL_PURCHASE → set_user_tier_v2 called with `p_reset_started_at=true`, RENEWAL → false, etc.), environment guard (sandbox event in prod NODE_ENV → skip)
- `lib/iap/__tests__/server-entitlements.test.ts` — REST happy path, REST 401/404, expired pro falls back to starter, no entitlements → free

Expected: +35-50 tests.

### Batch 3: Paywall UX

Highest user-visible touch. No new schema. Depends on batches 1 + 2 client modules.

Files engineer creates / modifies:

1. **NEW:** `frontend/src/components/subscription/paywall-modal.tsx` (per §4)
2. **NEW:** `frontend/src/components/subscription/paywall-tier-card.tsx` (3-card grid lives in one shared component, called 3x with different props)
3. **NEW:** `frontend/src/components/subscription/restore-purchases-link.tsx` (reusable; mounted in PaywallModal + `/profile`)
4. **MODIFY:** `frontend/src/components/chat/free-tier-banner.tsx` — replace `/pricing` href with PaywallModal trigger
5. **MODIFY:** `frontend/src/components/subscription/upgrade-prompt.tsx` — replace default onUpgrade with PaywallModal trigger
6. **MODIFY:** `frontend/src/components/dashboard/morning-briefing-card.tsx` — wire PaywallModal on `reason='tier_required'`
7. **MODIFY:** `frontend/src/components/chat/chat-interface.tsx` — catch 429 with `free_tier_limit` error → open PaywallModal
8. **MODIFY:** `frontend/src/app/(app)/profile/page.tsx` — add Settings row "May dating purchase ka na? I-restore mo." + manual paywall trigger
9. **MODIFY:** `messages/fil.json` + `messages/en.json` — add all paywall.* and iap.error.* / iap.success.* string keys per §2 + §4

Tests batch 3 adds:
- `components/subscription/__tests__/paywall-modal.test.tsx` — open/close, source-keyed title, web vs native branches, tier-card tap → purchase flow mock
- `components/subscription/__tests__/restore-purchases-link.test.tsx` — happy path, empty restore, error toast
- `components/chat/__tests__/chat-interface.test.ts` — 429 catch opens paywall
- `components/dashboard/__tests__/morning-briefing-card.test.ts` — tier_required reason opens paywall

Expected: +30-40 tests.

**Total Sprint 17 test delta: +90-125 tests over Sprint 16 baseline 1427.** Sprint 17 should land at 1517-1552 passing.

---

## 9. Order of operations recommendation for engineer

Three sequential batches per §8. Smallest-blast-radius first.

1. **Architect (this doc) → build-data:** migration 022 (events table + set_user_tier_v2 RPC + tier CHECK constraint). Build-data confirms the `subscriptions` schema drift (§5) is benign before touching the column.
2. **build-data → engineer batch 1:** client IAP foundations. No DB changes touched yet from the client side.
3. **engineer batch 1 → engineer batch 2:** webhook + Zod + REST helper. The webhook can be smoke-tested via curl or `gh api` with a mock event body once batch 2 lands.
4. **engineer batch 2 → engineer batch 3:** paywall UX. The PaywallModal triggers the client-side purchase path landed in batch 1 + relies on the entitlement mapping landed in batch 1.
5. **engineer → build-marketing:** voice-review the ~22 conversational Filipino string keys defined in §2 + §4. Marketing may rewrite freely within the established constraints; engineer applies the rewrites in a follow-up commit.
6. **engineer → review-security:** four audit surfaces per §10.
7. **engineer → build-qa:** full vitest + Capacitor build smoke + bundle-size regression.
8. **build-qa → PM gate:** Decision-gate GREEN if AAB stays under 23 MB AND 1517+ tests pass AND review-security MINOR or better.

### Bundle-size guard

`frontend/src/lib/__tests__/bundle-size-guard.test.ts` ceiling was 22 MB at Sprint 16 close. Sprint 17 adds `@revenuecat/purchases-capacitor` (~1-2 MB AAB delta per the SDK's documented native binding sizes — Apple StoreKit weak-linked, Google Play Billing dependency). **Update the ceiling to 23 MB** in batch 1 final commit. If AAB lands over 23 MB at QA, fail-batch and flag for architect re-review (potential ProGuard rule tuning).

---

## 10. Security flags for review-security agent

Four audit surfaces this sprint. Each is independent; review-security can do them in any order.

1. **Webhook idempotency end-to-end.** Verify (a) `revenuecat_events.event_id` is PRIMARY KEY (catches duplicate UUIDs at DB layer); (b) the `INSERT … ON CONFLICT (event_id) DO NOTHING` pattern correctly returns the `23505` error code path and 200-OK-skips downstream; (c) `processed_at` is only set after `set_user_tier_v2` succeeds (so a partial failure leaves the event re-processable); (d) no path can write to `subscriptions.tier` outside `set_user_tier_v2`. Grep `frontend/src/app/api/webhooks/revenuecat/` for any direct `.from('subscriptions').update(` — should be zero matches.

2. **Webhook signature verification.** Verify (a) `verifyWebhookSignature()` constant-time compare (mirrors Xendit pattern line 54-62); (b) missing `REVENUECAT_WEBHOOK_AUTH` env returns false (fail-closed); (c) missing `Authorization` header returns false; (d) malformed `Bearer ` prefix doesn't bypass the compare; (e) signature failure ALWAYS returns 200 OK (no retry storm). Test method: vitest cases per case.

3. **Env-var environment guard.** Verify the `process.env.NODE_ENV === 'production' && event.environment !== 'PRODUCTION'` branch (per §3) correctly drops sandbox events arriving at the production webhook. Sprint 19 sandbox testing must NOT mutate prod tier rows. Test: a `SANDBOX` event with `NODE_ENV='production'` mock returns early; same event with `NODE_ENV='development'` proceeds.

4. **`subscriptions` write-path audit.** Verify (a) ZERO direct UPDATEs to `subscriptions.tier` in `/api/webhooks/revenuecat/` (all writes go through the RPC); (b) `set_user_tier_v2` is SECURITY DEFINER (matches v1); (c) the `p_reset_started_at` parameter is correctly `true` only for `INITIAL_PURCHASE` + `NON_RENEWING_PURCHASE`, `false` for all other events. Test: grep + a vitest matrix mapping event_type → expected `p_reset_started_at` value.

**Carry-over from Sprint 16:** the PKCE `code_verifier` retrieval in Capacitor sandboxed localStorage was punted to Sprint 19 device smoke. Sprint 17 does not need to re-audit this — flagged here only so review-security doesn't accidentally re-open it.

---

## 11. References

- ADR-018 (Native Mobile Pivot via Capacitor + IAP, Accepted 2026-05-24): `akbai-delivery/skills/solutions-architect/references/architecture-decisions.md` §996-1094
- ADR-019 (Capacitor Wrapping Pattern, Accepted Green Sprint 14): `akbai-delivery/skills/solutions-architect/references/architecture-decisions.md` §1098+
- Sprint 16 native plugin pattern (the shape this doc mirrors): `akbai-delivery/skills/solutions-architect/references/sprint-16-native-plugin-pattern.md`
- Sprint 15 conversion pattern (`Capacitor.isNativePlatform()` precedent): `akbai-delivery/skills/solutions-architect/references/sprint-15-conversion-pattern.md`
- Xendit webhook precedent (signature verify + always-200 + idempotent insert): `frontend/src/app/api/webhooks/xendit/route.ts` lines 1-228
- Payment recording precedent (idempotent upsert pattern): `frontend/src/lib/payments/record-payment.ts` lines 34-79
- Subscriptions schema source of truth: `frontend/supabase/migrations/003_subscriptions_table.sql`
- Tier-model lock (Sprint 13 close-out): `akbai-delivery/shared/project-context.md` §4
- Gap registry G2: `akbai-delivery/shared/gap-registry.md` §G2
- Tech stack (RevenueCat plugin reference): `akbai-delivery/shared/tech-stack.md` §43
- Conversational Filipino copy guide: `akbai-delivery/skills/ux-designer/references/conversational-filipino-copy-guide.md`
- Sentry capacitor init (idempotent module-singleton precedent): `frontend/src/lib/sentry/capacitor-init.ts` lines 35-90
- `(app)/layout.tsx` (insertion point for `initRevenueCat()` useEffect): `frontend/src/app/(app)/layout.tsx` lines 226-228 (existing Sentry useEffect; RevenueCat init follows the same pattern)

---

## 12. Acceptance criteria (what "done" looks like per batch)

### Batch 1 — Client IAP foundations
- `npm install --save @revenuecat/purchases-capacitor` succeeds (Windows + corporate-TLS recipe from Sprint 14 still works; if `--use-system-ca` flag needed, document in CONTRIBUTING.md per Sprint 16 carry-over item)
- `frontend/src/lib/iap/{configure,entitlements,purchase,schemas}.ts` files exist
- `(app)/layout.tsx` has new useEffect calling `initRevenueCat(user?.id)`
- Web build (Vercel target, no `CAPACITOR_BUILD`) PASSES
- Capacitor static export (`CAPACITOR_BUILD=1`) PASSES; AAB under 23 MB
- Vitest 1452-1462 tests passing (Sprint 16 baseline 1427 + 25-35 batch-1 tests)

### Batch 2 — Webhook + schema
- Migration 022 applied to staging; `revenuecat_events` table + `set_user_tier_v2()` RPC + tier CHECK constraint visible in `\d subscriptions` and `\df set_user_tier*`
- `frontend/src/app/api/webhooks/revenuecat/route.ts` exists; passes signature + idempotency + dispatch tests
- `frontend/src/lib/subscriptions/types.ts` SubscriptionTierEnum extended to include `'starter'`
- `frontend/src/lib/iap/server-entitlements.ts` exists
- curl smoke test: a hand-crafted INITIAL_PURCHASE event POSTed to the webhook returns 200 + writes the row to `revenuecat_events`. A duplicate POST returns 200 + `deduped: true`.
- Vitest 1487-1512 tests passing (batch 1 + 35-50 batch-2 tests)

### Batch 3 — Paywall UX
- PaywallModal renders 3 tier cards (Starter ₱299 / Pro Monthly ₱499 / Pro Annual ₱4,999) on native
- Web fallback shows "Open in app" CTA (no purchase buttons)
- Restore link visible in PaywallModal footer AND `/profile`
- 5 existing tier-gate surfaces route to PaywallModal (chat, morning briefing, weekly story, reply drafter, scan limit)
- 22 conversational Filipino string keys land in `messages/fil.json` (English fallbacks in `messages/en.json`)
- Vitest 1517-1552 tests passing (batches 1 + 2 + 30-40 batch-3 tests)

### Sprint 17 gate (PM decision)
- Bundle: AAB under 23 MB, APK under 30 MB
- Tests: 1517+ passing
- Security review: MINOR ISSUES or better (no CRITICAL findings)
- All 5 Open Questions either held at default or overridden by Anton at PR review
- Gap G2 marked IMPLEMENTED (full close-out at Sprint 18 Pre-Launch Gate review when real RevenueCat dashboard + sandbox testing + iOS Info.plist land)
- Sprint history entry + post-sprint doc sweep + new ADR-020 (RevenueCat webhook idempotency pattern) appended to `architecture-decisions.md`

---

## 13. Hand-off

- **build-data:**
  - Migration 022 first (`revenuecat_events` + `set_user_tier_v2()` + tier CHECK). DDL is idempotent (`IF NOT EXISTS` on table/columns/indexes; `CREATE OR REPLACE` on the function).
  - **BEFORE** writing the migration: run `\d subscriptions` against staging and confirm the columns enumerated in §5 ("Surprise found during audit") exist. If any are missing, surface immediately to PM — Xendit code is already broken and we need to know before Sprint 17 doubles down.
  - **ALSO confirm** the `protect_feature_flags()` trigger exists on `users.feature_flags` in prod (gap-registry G2's `protect_feature_flags` claim). If missing, re-deploy via the migration alongside 022.
  - Do NOT write rollback migrations — record rollback notes in the migration file header per Sprint 16 §8 pattern.
  - Migration 023 (dedicated `revenuecat_app_user_id` column on subscriptions) is OPTIONAL — recommend skip per Open Q 5 (a). If Anton overrides, add it after 022 lands.

- **build-engineer:**
  - Read this doc end-to-end. Three batches per §8 + §9. Each batch waits on the previous; batch 2 waits on build-data.
  - Every RevenueCat client call sits behind `Capacitor.isNativePlatform()` — no exceptions (per §1 risk 4).
  - All tier writes route through `set_user_tier_v2()` RPC — NEVER direct UPDATE on `subscriptions` (per §1 risk 2, §6 invariant).
  - Webhook ALWAYS returns 200 OK (per §1 risk 1; mirrors Xendit handler).
  - Conversational Filipino copy is in `messages/fil.json` — drafts in §2/§4 are intent only; build-marketing voice-reviews and may rewrite.
  - Bundle-size sanity check after each batch.

- **build-marketing:**
  - Voice-review ~22 conversational Filipino string keys per §2 + §4. Verify VSO syntax + second-position enclitics + Filipinized verbs (`i-upgrade`, `i-restore`, `mag-bayad`). Rewrite as needed; engineer applies in follow-up commit. Apple-mandated "Restore purchases" phrasing is non-negotiable in placement; wording is flexible.

- **build-qa:**
  - Bundle-size growth target: AAB under 23 MB ceiling (Sprint 16 closed at 20.75 MB; +1-2 MB headroom for RevenueCat SDK).
  - Vitest baseline 1427 → target 1517+ passing.
  - Plugin-mock test pattern continues from Sprint 16: every test touching `@revenuecat/purchases-capacitor` mocks `Capacitor.isNativePlatform()` (default false for web tests, true for native-path tests).
  - Webhook smoke matrix: 5 event types × {first-event, duplicate-event} + signature-fail + Zod-fail + environment-guard = 12 happy/sad path cases.
  - Update bundle-size guard test ceiling to 23 MB per §9 final smoke.

- **build-ux:**
  - Skip this sprint UNLESS Anton wants paywall visual review. The 3-card grid follows the existing tonal-card vocabulary (`bg-surface-container-low`, rounded-2xl, 44px tap targets, No-Line Rule per Sprint 16). PaywallModal is a `<dialog>` or `<Drawer>` (Vaul, per Sprint 5 chrome) — engineer picks based on existing chrome patterns.

- **review-security:**
  - 4 audit surfaces per §10: webhook idempotency, signature verification, environment guard, write-path audit.
  - The write-path audit is THE one that could fail — grep `frontend/src/app/api/webhooks/revenuecat/` for `.from('subscriptions').update(` must return zero hits.

- **build-ai:** skip (no prompt changes this sprint).
