# Sentry Setup for AKBai — Complete Implementation Guide

**Status:** Ready for Phase 1 deployment
**Severity:** CRITICAL (Gap A4)
**Timeline:** 1–2 hours to completion
**Owner:** DevOps Engineer (you, with Vercel and Sentry account access)

---

## Executive Summary

Sentry is a CRITICAL hard gate before your first beta user sees AKBai. Without error tracking, production bugs are invisible — users hit crashes, you don't know, trust evaporates. For a financial app handling receipts and real GCash payments, this is unacceptable.

This guide walks you through a complete, production-ready Sentry setup from scratch. It covers:

1. **Account creation & project initialization** (10 min)
2. **SDK installation and configuration** (15 min)
3. **Integration with Vercel** (10 min)
4. **Release tagging strategy** (5 min)
5. **Alert rules for Phase 1** (10 min)
6. **Custom tags & context for AKBai** (10 min)
7. **Verification & testing** (10 min)

By the end, you'll have:
- Sentry capturing all production errors automatically
- Release tags linking errors to exact commits
- P0/P1 alerts routing to your phone (Slack + email + SMS)
- Custom tags for fast triage (feature, tier, transaction type)
- A health check integrated into your deployment pipeline

---

## Phase 1 Architecture Context

Before setup, understand where Sentry fits in AKBai's monitoring stack:

```
┌─────────────────────────────────────────────────┐
│  Sentry (ERROR TRACKING)                        │
│  • Runtime exceptions, unhandled errors         │
│  • Performance monitoring (20% sample)          │
│  • Session replays (10% normal, 100% on error) │
│  • Source maps for production debugging        │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ↓                 ↓
   ┌────────────┐  ┌─────────────┐
   │ PostHog    │  │ UptimeRobot │
   │ (analytics)│  │ (uptime)    │
   └────────────┘  └─────────────┘
```

**Your job:** Sentry catches "something broke" (runtime errors). PostHog catches "something changed" (user behavior). UptimeRobot catches "something is down" (external ping). Together, they give you the full picture.

---

## Part 1: Account Setup (10 min)

### Step 1A: Create Sentry Organization & Project

1. Go to [sentry.io](https://sentry.io) and **Sign Up** (free tier is fine for Phase 1)
2. Create organization name: `akbai` (or `akbai-ph`)
3. Create project:
   - **Framework:** Next.js
   - **Project name:** `akbai-pwa` (or just `akbai`)
   - **Team:** Default (you)
   - **Alert configuration:** Skip for now (we'll customize later)

4. After creation, Sentry will show you a **Project DSN**. This looks like:
   ```
   https://[public-key]@[sentry-domain]/[project-id]
   ```
   Copy this. You'll need it in Step 2A below.

### Step 1B: Generate Auth Token for Source Maps

Sentry's free tier requires manual source map uploads OR a paid plan for automatic uploads. For simplicity in Phase 1, you'll use Sentry's CLI to upload source maps after each build.

1. In Sentry dashboard, go to **Settings** → **Organization** → **Auth Tokens**
2. Create new token with scopes: `project:read`, `project:write`, `releases:write`
3. Copy the token. You'll add this to Vercel as `SENTRY_AUTH_TOKEN`.

### Step 1C: Create Slack Integration (Optional, Recommended)

To get P0/P1 alerts to your phone via Slack:

1. In Sentry, go to **Settings** → **Integrations** → Search "Slack"
2. Click **Install** (you'll be redirected to your Slack workspace)
3. Approve the integration
4. Back in Sentry, create a new channel: `#akbai-alerts` or use existing `#alerts`
5. You'll configure alert routing to this channel in Part 5

---

## Part 2: SDK Installation & Configuration (15 min)

### Step 2A: Install Sentry SDK

In your AKBai Next.js project root:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

This command:
- Installs `@sentry/nextjs` and required dependencies
- Creates `sentry.client.config.ts` (browser errors)
- Creates `sentry.server.config.ts` (server errors)
- Creates `sentry.edge.config.ts` (Edge Function errors)
- Auto-updates `next.config.js` to wrap your config

### Step 2B: Configure Client-Side Sentry

Edit `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Your Sentry DSN from Step 1A
  dsn: process.env.SENTRY_DSN,

  // Environment: "production", "preview", "development"
  // Vercel sets VERCEL_ENV automatically
  environment: process.env.VERCEL_ENV || "development",

  // Release tag: links errors to exact Git commits
  // Vercel sets VERCEL_GIT_COMMIT_SHA automatically
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Sample 100% of errors in Phase 1
  // (Free tier = 5K events/mo; AKBai with 50 users = ~500 errors/mo avg)
  sampleRate: 1.0,

  // Performance monitoring: sample 20% of transactions (page loads, API calls)
  // This helps identify slow features early
  tracesSampleRate: 0.2,

  // Session replay: capture user sessions when errors occur
  // 10% normal traffic + 100% on errors = debugging tool for crash reports
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false, // Keep readable for support debugging
      blockAllMedia: false,
    }),
  ],

  // Ignore known noise to keep error list clean
  ignoreErrors: [
    // Browser extensions (not your app's fault)
    "ResizeObserver loop limit exceeded",
    // Common network errors from intermittent 4G
    "Failed to fetch",
    "NetworkError",
    "Load failed",
    // PWA/service worker noise
    "Non-Error promise rejection captured",
  ],

  // Strip personally identifiable info before sending to Sentry
  beforeSend(event, hint) {
    // Remove IP addresses
    if (event.request) {
      delete event.request.url;
      delete event.request.headers?.["User-Agent"];
    }

    // Remove user emails from context
    if (event.user) {
      delete event.user.ip_address;
      // Keep user.id for triage, but remove email
      if (event.user.email) {
        delete event.user.email;
      }
    }

    return event;
  },

  // Allow traces to be sent even if sampleRate is 100%
  allowUrls: [/https:\/\/(localhost|.*\.vercel\.app|your-domain\.com)/],
});
```

### Step 2C: Configure Server-Side Sentry

Edit `sentry.server.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Server-side sampling: 100% for errors, 20% for transactions
  sampleRate: 1.0,
  tracesSampleRate: 0.2,
});
```

### Step 2D: Configure Edge Function Sentry (if using Edge Functions)

Edit `sentry.edge.config.ts`:

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

---

## Part 3: Vercel Integration (10 min)

### Step 3A: Add Environment Variables to Vercel

1. Go to **Vercel Dashboard** → **AKBai Project** → **Settings** → **Environment Variables**
2. Add these variables:
   - **Key:** `SENTRY_DSN`
     **Value:** (your DSN from Step 1A, e.g., `https://xxx@sentry.io/yyy`)
     **Environments:** Production, Preview, Development
   - **Key:** `SENTRY_AUTH_TOKEN`
     **Value:** (your auth token from Step 1B)
     **Environments:** Production only (needed for build)
3. Save.

### Step 3B: Verify next.config.js Was Updated

After the `@sentry/wizard` install, your `next.config.js` should look like:

```javascript
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  // ... your existing Next.js config
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry configuration
  org: "akbai",
  project: "akbai-pwa",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true, // Suppress Sentry logs during build
  hideSourceMaps: true, // Don't expose source maps publicly (security)
});
```

This wraps your Next.js build to:
1. Auto-collect source maps after build
2. Upload them to Sentry (using `SENTRY_AUTH_TOKEN`)
3. Delete local source maps from the deployment
4. Strip source maps from the browser (security)

### Step 3C: Test the Build

```bash
npm run build
```

You should see output like:
```
> Next.js build successful
> Sentry: 2 release files uploaded
```

If you see "Sentry: 0 release files uploaded", check that:
- `SENTRY_AUTH_TOKEN` is set in `.env.local` or Vercel
- Your Sentry auth token has `releases:write` scope
- `SENTRY_DSN` is set

---

## Part 4: Release Tagging & Source Maps (5 min)

Every production deploy should create a Sentry release. This links errors to the exact Git commit that introduced them.

### How It Works

1. **Build time:** Sentry wizard uploads source maps to release `[commit-sha]`
2. **Error time:** Browser JavaScript reports error with source map URL
3. **Sentry:** Maps minified error back to original source code line
4. **Postmortem:** You see error with exact file, line number, and commit hash

### No Additional Setup Needed

Vercel automatically sets `VERCEL_GIT_COMMIT_SHA` in the build environment. Your `sentry.*.config.ts` files already use this as the release tag. The Sentry wizard configured the rest.

**That's it.** Source maps are handled automatically.

---

## Part 5: Alert Rules (10 min)

Alerts are useless if they don't reach you. Configure them in Sentry to route critical issues to your phone.

### Step 5A: Create Alert Rules in Sentry

Go to **Alerts** → **Alert Rules** → **Create Alert Rule**

Create these 5 rules:

#### Rule 1: Payment Errors (P0 — Immediate)

```
Trigger:
  • Tag: transaction.type equals "payment"
  • AND event level equals "error"
  • AND any new event

For each alert:
  • Send email notification
  • Send to Slack: #akbai-alerts
  • [If Slack mobile enabled] Instantly notified on your phone
```

**Why:** Xendit webhook failures mean users pay but don't get access. This is a revenue-blocking bug.

#### Rule 2: Auth Failures Spike (P1 — 1 hour)

```
Trigger:
  • Tag: category equals "auth"
  • AND event level equals "error"
  • AND more than 5 events in 10 minutes

For each alert:
  • Send email notification
  • Send to Slack: #akbai-alerts
```

**Why:** Multiple login failures = app won't accept users = core feature down.

#### Rule 3: High Error Rate (P1 — 1 hour)

```
Trigger:
  • Spike in error rate
  • AND error rate > 5% (more than 5 out of 100 requests fail)
  • AND for 15 minutes

For each alert:
  • Send email notification
  • Send to Slack: #akbai-alerts
```

**Why:** Sudden spike means a deploy or dependency broke something widespread.

#### Rule 4: New Unhandled Exception (P2 — Next available)

```
Trigger:
  • A new event occurred for an error that Sentry hasn't seen before

For each alert:
  • Send email notification (no Slack — too noisy)
```

**Why:** Track novel bugs to prioritize fixes. Email is sufficient for P2.

#### Rule 5: API Performance Degradation (P2)

```
Trigger:
  • Transaction exceeds 10 seconds
  • AND transaction name contains "api"

For each alert:
  • Send email notification
```

**Why:** Slow APIs frustrate users on 4G. Flag them for optimization.

### Step 5B: Set Up Slack Channel

In the Sentry UI, after you've installed the Slack integration:

1. **Alerts** → **Alert Rules**
2. For rules sending to Slack, ensure the channel is `#akbai-alerts` (or create it)
3. In **Slack** → **Preferences**, enable mobile push notifications for the channel

Now Slack alerts ping your phone instantly.

### Step 5C: SMS Alerts (via UptimeRobot)

Sentry free tier doesn't support SMS. Instead:
- UptimeRobot (Part of your monitoring stack) sends SMS for uptime alerts
- Use Slack mobile push for Sentry error alerts
- If you need SMS for P0 errors specifically, upgrade Sentry to paid ($26/mo) OR rely on Slack notifications

---

## Part 6: Custom Tags & Context for AKBai (10 min)

Generic error messages aren't enough. You need AKBai-specific context to debug faster.

### Step 6A: Define Custom Tags

Add these tags to errors for fast triage:

```typescript
// Example: in API routes
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  const { user_id, tier } = req.body;

  // Tag errors with feature and tier
  Sentry.setTag("feature", "resibo-scanner");
  Sentry.setTag("tier", tier); // "free", "pro", "business"
  Sentry.setTag("transaction.type", "payment"); // for Xendit errors
  Sentry.setTag("business_type", user?.business_type); // "home_seller", "online_seller", etc.

  // Add additional context
  Sentry.setContext("business", {
    type: user?.business_type,
    onboarding_complete: user?.onboarding_complete,
    subscription_status: subscription?.status,
  });

  try {
    // ... your API logic
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

### Step 6B: Apply to Key API Routes

Apply custom tags to these critical endpoints:

1. **Receipt Scanning** (`/api/resibo/scan`):
   ```typescript
   Sentry.setTag("feature", "resibo-scanner");
   Sentry.setTag("scan_result", "success" | "failed");
   Sentry.setContext("scan", { duration_ms, confidence_score });
   ```

2. **Payment/Subscription** (`/api/webhooks/xendit`):
   ```typescript
   Sentry.setTag("transaction.type", "payment");
   Sentry.setTag("payment_status", "success" | "failed");
   Sentry.setContext("payment", { amount, method, subscription_id });
   ```

3. **KA Conversation** (`/api/ka/chat`):
   ```typescript
   Sentry.setTag("feature", "ka-chat");
   Sentry.setTag("model", "haiku" | "sonnet");
   Sentry.setContext("conversation", { domain, message_count });
   ```

4. **Authentication** (`/api/auth/*`):
   ```typescript
   Sentry.setTag("category", "auth");
   Sentry.setContext("auth", { method, provider });
   ```

### Step 6C: Error Boundaries for Frontend

Wrap feature-critical components in Sentry error boundaries:

```typescript
// app/(app)/dashboard/page.tsx
import { withProfiler } from "@sentry/nextjs";

function DashboardPage() {
  return (
    // ...
  );
}

// Attach performance monitoring + error tracking
export default withProfiler(DashboardPage);
```

---

## Part 7: Verification & Testing (10 min)

### Step 7A: Verify Setup in Development

```bash
npm run dev
```

Open `http://localhost:3000` and check browser console. You should see:
```
Sentry Logger: Sentry's instrumentationStartTime is older than the provided unix timestamp.
```

This is normal. It means Sentry is active.

### Step 7B: Trigger a Test Error

Create a test page to verify Sentry captures errors:

```typescript
// app/test/sentry-error/page.tsx
"use client";

import * as Sentry from "@sentry/nextjs";

export default function TestSentryError() {
  const handleError = () => {
    throw new Error("Test error: This should appear in Sentry");
  };

  const handleAsync = async () => {
    setTimeout(() => {
      throw new Error("Test async error");
    }, 100);
  };

  return (
    <div>
      <h1>Sentry Test Page</h1>
      <button onClick={handleError}>Throw Sync Error</button>
      <button onClick={handleAsync}>Throw Async Error</button>
      <button
        onClick={() => {
          Sentry.captureMessage("Manual test message", "info");
        }}
      >
        Send Manual Message
      </button>
    </div>
  );
}
```

Navigate to `/test/sentry-error` and click a button. After 1–2 minutes, check your Sentry dashboard — the error should appear.

### Step 7C: Verify Production Setup

After your first production deploy to Vercel:

1. **Check Sentry dashboard:** Issues → should show "akbai-pwa" project
2. **Check release:** Releases → should list your commit SHA
3. **Check source maps:** Click an issue → the error line should show original source code, not minified `[e] is not defined`

If source maps aren't working, verify:
- `hideSourceMaps: true` in `next.config.js`
- `SENTRY_AUTH_TOKEN` is set in Vercel production environment
- Build logs show "Sentry: X release files uploaded"

### Step 7D: Test Alert Routing

Manually trigger an alert:

1. In Sentry, create a **Test Alert**:
   - **Issues** → select any issue → **Alerts** → **Create Alert**
   - Send to Slack `#akbai-alerts`
   - Verify you receive a Slack message on your phone

2. For SMS, test via UptimeRobot (Part of your broader monitoring stack, outside Sentry)

---

## Part 8: Integration with Your CI/CD Pipeline

Add a pre-deploy health check to your Vercel deployment:

Create `scripts/pre-deploy-check.sh`:

```bash
#!/bin/bash
set -e

echo "Pre-deploy checks..."

# Check Sentry DSN is configured
if [ -z "$SENTRY_DSN" ]; then
  echo "ERROR: SENTRY_DSN not set"
  exit 1
fi

# Check build succeeded (Sentry uploaded source maps)
npm run build

echo "✓ Pre-deploy checks passed"
```

Add to `package.json`:

```json
{
  "scripts": {
    "pre-deploy": "bash scripts/pre-deploy-check.sh",
    "build": "next build"
  }
}
```

Update Vercel's build settings:
- **Framework:** Next.js
- **Build Command:** `npm run pre-deploy`
- **Output Directory:** `.next`

---

## Part 9: Maintenance Checklist

### Daily (2 min)

```
□ Sentry Dashboard: Any new unresolved critical issues?
□ Slack #akbai-alerts: Any alerts overnight?
```

### Weekly (10 min)

```
□ Sentry: Review error trend (increasing/decreasing?)
□ Sentry: Are errors being properly tagged and grouped?
□ Sentry: Any blind spots (features with no errors)? → Add instrumentation
□ Verify alert thresholds still make sense
```

### Monthly (20 min)

```
□ Review free tier usage: Error events, replays, storage
□ Evaluate if paid tier needed (unlikely before Phase 2)
□ Rotate Sentry auth token (optional but recommended for security)
□ Document any recurring error patterns in Gap Registry
```

---

## Part 10: Troubleshooting

### Problem: "Sentry: 0 release files uploaded"

**Cause:** Auth token missing or invalid

**Fix:**
1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel production environment
2. Check token has `releases:write` scope in Sentry
3. Redeploy

### Problem: Errors appear in Sentry but source maps don't work (shows minified code)

**Cause:** Source maps not uploaded or linked to release

**Fix:**
1. Check build log: does it say "Sentry: X release files uploaded"?
2. If not, verify `SENTRY_AUTH_TOKEN`
3. If yes, manually upload:
   ```bash
   npm install -g @sentry/cli
   sentry-cli releases files <release> upload-sourcemaps ./.next
   ```

### Problem: Too many errors in Sentry (alert fatigue)

**Fix:**
1. Increase `ignoreErrors` in `sentry.client.config.ts` for known noise
2. Increase error rate threshold in alerts (e.g., 5% → 10%)
3. Reduce `sampleRate` from 1.0 to 0.5 or lower (but only in Phase 2+, keep at 1.0 for Phase 1)
4. Remove low-priority alert rules

### Problem: Slack alerts not arriving

**Fix:**
1. Check Slack integration is installed in Sentry: **Settings** → **Integrations**
2. Verify `#akbai-alerts` channel exists in your Slack workspace
3. Check Slack app permissions: Sentry should have "post to #akbai-alerts"
4. Test with manual alert (see Part 7D)

---

## Environment Variables Summary

Add these to Vercel (Settings → Environment Variables):

| Key | Value | Scope |
|-----|-------|-------|
| `SENTRY_DSN` | Your Sentry project DSN | Production + Preview + Development |
| `SENTRY_AUTH_TOKEN` | Your Sentry auth token (keep secure!) | Production only |

Add to `.env.local` for local development (do NOT commit):

```
SENTRY_DSN=https://[key]@[sentry-domain]/[project-id]
```

---

## Cost Summary

| Tier | Free Limit | Cost |
|------|-----------|------|
| Errors/mo | 5,000 | Free |
| Session replays | 50/month | Free |
| Team members | 1 | Free |
| When to upgrade | >5K errors/mo | $26/mo (Team) |

**Phase 1 projection:** ~500 errors/month with 50 users. You'll stay within free tier.

---

## Next Steps (After This Setup)

1. **Merge this to main** — commit Sentry config changes
2. **Deploy to Vercel production** — Sentry DSN automatically picked up from env vars
3. **Verify in Sentry dashboard** — errors appear within 1–2 min
4. **Check release page** — your commit SHA should be listed under Releases
5. **Smoke test the app** — trigger an error, confirm it appears in Sentry
6. **Invite beta testers** — now you have error tracking for real user traffic

---

## Success Criteria (Gate A4 — Complete)

✅ Sentry project created and linked to AKBai
✅ SDK installed in Next.js with client + server + edge configs
✅ `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` in Vercel environment
✅ Build step uploads source maps automatically
✅ 5+ alert rules configured and routing to Slack + email
✅ Custom tags (feature, tier, transaction type) implemented in key routes
✅ Test error manually thrown and captured in Sentry
✅ Production deploy confirmed: errors appear with source maps
✅ Slack #akbai-alerts receives P0/P1 notifications on your phone

---

## Support

- **Sentry docs:** [docs.sentry.io](https://docs.sentry.io)
- **Sentry + Next.js:** [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs)
- **Troubleshooting:** [sentry.io/support](https://sentry.io/support)

**You're now ready to launch to beta users with confidence. Errors won't be invisible anymore.**
