# AKBai — Monitoring Setup Guide
> Reference for: devops-engineer skill
> Last updated: March 2026
> Source: Tech Stack v1, Gap Registry (A4, A5, D4)

## Table of Contents
1. [Monitoring Philosophy](#1-monitoring-philosophy)
2. [Sentry — Error Tracking](#2-sentry--error-tracking)
3. [PostHog — Analytics & Feature Flags](#3-posthog--analytics--feature-flags)
4. [UptimeRobot — Uptime & Webhook Health](#4-uptimerobot--uptime--webhook-health)
5. [Alert Routing](#5-alert-routing)
6. [Dashboard Checklist](#6-dashboard-checklist)
7. [Cost & Tier Planning](#7-cost--tier-planning)

---

## 1. Monitoring Philosophy

AKBai is run by one person. Monitoring must be:

- **Loud for critical issues** — P0/P1 alerts must reach Anton's phone even during Globe work hours
- **Quiet for noise** — alert fatigue is the enemy of solo-founder ops. Tune thresholds so alerts mean "act now", not "maybe look at this later"
- **Cheap** — all three tools have free tiers that cover AKBai through Phase 1 and likely Phase 2
- **Actionable** — every alert links to context (Sentry issue page, UptimeRobot log, PostHog dashboard) so Anton can diagnose without extra clicks

**Three pillars:**
- Sentry: "something broke" — catches exceptions, unhandled errors, performance issues
- PostHog: "something changed" — tracks user behavior, feature adoption, funnel metrics for Sense Check Gate
- UptimeRobot: "something is down" — external pings confirm the app, API, and Xendit webhook are reachable

---

## 2. Sentry — Error Tracking

### Why Sentry is a CRITICAL Gap (A4)

Without Sentry, production errors are invisible. Users hit bugs, Anton doesn't know, trust erodes. For a financial tool handling receipts and payments, this is unacceptable.

### Setup

**1. Install SDK:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

This creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and updates `next.config.js`.

**2. Configure (sentry.client.config.ts):**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",

  // Release tagging — links errors to specific deploys
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Sample 100% of errors (free tier = 5K events/mo, sufficient for early stage)
  sampleRate: 1.0,

  // Performance monitoring — sample 20% of transactions
  tracesSampleRate: 0.2,

  // Replay (session replay for debugging) — 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Filter out known noise
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop",
    // Network errors from intermittent 4G
    "Failed to fetch",
    "NetworkError",
    "Load failed",
  ],

  beforeSend(event) {
    // Strip PII from error reports
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
```

**3. Server-side config (sentry.server.config.ts):**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  sampleRate: 1.0,
  tracesSampleRate: 0.2,
});
```

**4. Source maps (next.config.js):**

```javascript
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  org: "akbai",
  project: "akbai-pwa",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true, // Don't expose source maps publicly
});
```

### Release Tagging

Every production deploy gets a Sentry release tag. This links errors to the exact commit that introduced them — critical for postmortems.

Vercel automatically sets `VERCEL_GIT_COMMIT_SHA` in the build environment. The Sentry config above uses this as the release tag. No additional setup needed.

### Alert Rules

Configure in Sentry Dashboard → Alerts:

| Alert | Condition | Action | Severity Mapping |
|-------|-----------|--------|-----------------|
| New issue spike | >10 new events in 5 min | Email + Slack | P1 |
| Payment error | Tag `transaction.type:payment` AND new issue | Email + Slack + SMS | P0 |
| Auth failure spike | Tag `category:auth` AND >5 events in 10 min | Email + Slack | P1 |
| Unhandled exception | Any unhandled exception | Email | P2 |
| High error rate | Error rate >5% of transactions in 15 min | Email + Slack | P1 |

### Custom Tags for AKBai

Add these tags to Sentry events for faster triage:

```typescript
// In API routes
Sentry.setTag("feature", "resibo-scanner");
Sentry.setTag("tier", user.subscription_tier); // "free", "pro", "business"
Sentry.setTag("transaction.type", "payment"); // for Xendit-related errors

// In error boundaries
Sentry.setContext("business", {
  type: user.business_type,
  onboarding_complete: user.onboarding_complete,
});
```

---

## 3. PostHog — Analytics & Feature Flags

### Why PostHog is a CRITICAL Gap (A5)

The Sense Check Gate at Month 6 requires 8 measurable signals. Without PostHog from Day 1, there's no data to make the Go/No-Go decision. This isn't optional analytics — it's the instrument panel for the entire product.

### Setup

**1. Install:**

```bash
npm install posthog-js posthog-node
```

**2. Client-side provider (app/providers.tsx):**

```typescript
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      // Privacy-conscious defaults
      mask_all_text: false,
      mask_all_element_attributes: false,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

**3. Server-side (lib/posthog/server.ts):**

```typescript
import { PostHog } from "posthog-node";

const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
});

export default posthog;
```

### Key Events to Track

These events map to the Sense Check Gate signals and core product metrics:

| Event | When | Properties |
|-------|------|-----------|
| `user_signed_up` | After onboarding complete | `business_type`, `income_range`, `referral_source` |
| `receipt_scanned` | After successful OCR | `scan_duration_ms`, `confidence_score`, `tier` |
| `morning_briefing_viewed` | User opens Ang Umaga Mo | `day_of_week`, `time_of_day` |
| `deadline_notification_received` | Push notification delivered | `deadline_type`, `days_before` |
| `reply_drafted` | KA generates a draft reply | `channel` (messenger/manual), `tier` |
| `subscription_started` | Xendit payment success | `tier`, `payment_method` |
| `subscription_cancelled` | User cancels | `tier`, `reason` (if collected), `lifetime_days` |
| `ka_conversation` | Each KA interaction | `domain`, `model` (haiku/sonnet), `tier`, `response_time_ms` |
| `feature_flag_evaluated` | Any flag check | `flag_name`, `value` |
| `upgrade_cta_shown` | Free user hits limit | `trigger` (scan_limit/query_limit/feature_gate) |
| `upgrade_cta_clicked` | User clicks upgrade | `source_cta`, `current_tier` |

### Feature Flags

PostHog feature flags replace the Supabase boolean column approach mentioned in the gap registry (Design Gate #6). PostHog is better because it supports percentage rollouts, user targeting, and instant kill switches without a deploy.

**Key flags for Phase 1:**

| Flag | Purpose | Default |
|------|---------|---------|
| `resibo-scanner-enabled` | Kill switch for receipt scanning | true |
| `morning-briefing-enabled` | Kill switch for Ang Umaga Mo | true |
| `reply-drafter-enabled` | Kill switch for Reply Drafter | true |
| `maintenance-mode` | Show maintenance banner, disable writes | false |
| `new-onboarding-flow` | A/B test alternative onboarding | false (10% rollout) |

**Usage in code:**

```typescript
import { useFeatureFlagEnabled } from "posthog-js/react";

function ResiboScanner() {
  const enabled = useFeatureFlagEnabled("resibo-scanner-enabled");
  if (!enabled) return <MaintenanceBanner feature="Resibo Scanner" />;
  // ... normal component
}
```

---

## 4. UptimeRobot — Uptime & Webhook Health

### Why UptimeRobot (Gap D4)

External uptime monitoring catches issues that Sentry can't — total app outages, DNS failures, SSL expiry, and third-party service outages (Supabase, Xendit). It also serves as the canary for webhook health, which is critical because broken Xendit webhooks mean payments succeed but AKBai doesn't know about them.

### Monitors to Configure

| Monitor | Type | URL/Target | Interval | Alert |
|---------|------|-----------|----------|-------|
| App Home | HTTP(S) | `https://<app-url>/` | 5 min | Email + SMS |
| API Health | HTTP(S) | `https://<app-url>/api/health` | 5 min | Email + SMS |
| Xendit Webhook | HTTP(S) | `https://<app-url>/api/webhooks/xendit` | 5 min | Email + SMS + Slack |
| Supabase API | HTTP(S) | `https://<project>.supabase.co/rest/v1/` | 5 min | Email |
| Sentry Ingest | HTTP(S) | `https://sentry.io/api/0/` | 15 min | Email |

### Health Check Endpoint

Create `/app/api/health/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Check Supabase connectivity
  try {
    const supabase = createClient();
    const { error } = await supabase.from("users").select("count").limit(1);
    checks.supabase = error ? "error" : "ok";
  } catch {
    checks.supabase = "error";
  }

  // Check environment variables present
  checks.env = (
    process.env.ANTHROPIC_API_KEY &&
    process.env.XENDIT_SECRET_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) ? "ok" : "error";

  const allOk = Object.values(checks).every(v => v === "ok");

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
```

UptimeRobot monitors the HTTP status code. 200 = healthy, 503 = degraded → triggers alert.

### Xendit Webhook Health

The Xendit webhook monitor is especially important. If this endpoint goes down:
- Users pay via GCash but their subscription doesn't activate
- AKBai shows "Free tier" to a user who just paid ₱399
- Trust is destroyed instantly

UptimeRobot sends a GET request, but the webhook handler expects POST. Add GET support that returns 200 (health check only):

```typescript
// /app/api/webhooks/xendit/route.ts
export async function GET() {
  return NextResponse.json({ status: "webhook_active" }, { status: 200 });
}

export async function POST(req: Request) {
  // ... actual webhook handler
}
```

---

## 5. Alert Routing

All alerts must reach Anton's phone. Here's the routing matrix:

```
                    ┌──────────┐
                    │  Sentry  │
                    │ (errors) │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    Email (all)    Slack #alerts    SMS (P0 only)
                    (P0 + P1)     via UptimeRobot
                         │
                    ┌────┴─────┐
                    │ PostHog  │
                    │(analytics)│
                    └────┬─────┘
                         │
                    Dashboard only
                  (no push alerts)
                         │
                    ┌────┴──────┐
                    │UptimeRobot│
                    │ (uptime)  │
                    └────┬──────┘
                         │
         ┌───────────────┼──────────┐
         ↓               ↓          ↓
    Email (all)    SMS (all)    Slack #alerts
```

### Slack Setup

Create a Slack workspace (or use an existing one) with an `#akbai-alerts` channel:
- Sentry integration: Sentry → Settings → Integrations → Slack → route P0/P1 alerts to #akbai-alerts
- UptimeRobot integration: UptimeRobot → My Settings → Alert Contacts → Add Slack webhook
- Enable mobile push notifications for #akbai-alerts channel

### SMS Alerts

UptimeRobot free tier supports SMS alerts. Configure Anton's phone number as an alert contact. Sentry does not support SMS on free tier — use the UptimeRobot SMS path for uptime-critical alerts, and Slack mobile push for Sentry error alerts.

---

## 6. Dashboard Checklist

### Daily Check (2 minutes, part of evening routine)

```
□ Sentry: Any new unresolved issues? (Dashboard → Issues → Unresolved)
□ UptimeRobot: All monitors UP? (Dashboard → green/red indicators)
□ PostHog: Traffic normal? (Dashboard → Web Analytics → unique users)
```

### Weekly Check (10 minutes, Sunday evening)

```
□ Sentry: Error trend — increasing, decreasing, stable?
□ PostHog: Feature adoption — which features are users actually using?
□ PostHog: Funnel — signup → onboarding complete → first scan → paid conversion
□ UptimeRobot: Uptime percentage — should be >99.5%
□ Supabase: Database size, row counts, approaching any limits?
□ Vercel: Function invocations, bandwidth — approaching any limits?
```

### Monthly Check (20 minutes, first Sunday)

```
□ All of the above, plus:
□ Cost audit — Vercel, Supabase, Anthropic API, Sentry, PostHog, UptimeRobot bills
□ Security: Rotate any secrets due for rotation (see deployment-guide.md)
□ Dependency update: Review Dependabot PRs, merge non-breaking updates
□ Sense Check Gate signals (Month 6): Review the 8 metrics against targets
```

---

## 7. Cost & Tier Planning

| Tool | Free Tier Limits | When to Upgrade | Paid Tier Cost |
|------|-----------------|-----------------|---------------|
| Sentry | 5K errors/mo, 1 team member | >5K errors/mo or need team access | $26/mo (Team) |
| PostHog | 1M events/mo, 5K session replays | >1M events/mo (unlikely before Phase 3) | $0 for first 1M, then usage-based |
| UptimeRobot | 50 monitors, 5-min interval | Need 1-min intervals or status page | $7/mo (Pro) |

**Phase 1 projected cost: ₱0** — all three tools stay within free tier limits through Phase 1 (50 users) and likely Phase 2 (200 users). Budget for paid tiers starting Month 7+ as part of the break-even calculation.
