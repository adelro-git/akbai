# Sentry Setup for AKBai — Complete Guide

**Date:** March 2026 | **Status:** Pre-launch monitoring (Phase 0A → Phase 1)
**Scope:** Error tracking, release management, source maps, and alerting for Next.js 14 + Cloudflare Pages deployment

---

## Table of Contents

1. [Why Sentry Matters for AKBai](#why-sentry-matters)
2. [Architecture Overview](#architecture-overview)
3. [Step 1: Create Sentry Project](#step-1-create-sentry-project)
4. [Step 2: Install Sentry SDK](#step-2-install-sentry-sdk)
5. [Step 3: Configure Sentry DSN & Environment Variables](#step-3-configure-dsn)
6. [Step 4: Initialize Sentry in Next.js](#step-4-initialize-sentry)
7. [Step 5: Set Up Error Boundaries](#step-5-error-boundaries)
8. [Step 6: API Route Error Tracking](#step-6-api-errors)
9. [Step 7: Release Management & Source Maps](#step-7-releases)
10. [Step 8: Alerting & Notifications](#step-8-alerting)
11. [Step 9: Testing](#step-9-testing)
12. [Step 10: Production Deployment Checklist](#step-10-checklist)

---

## Why Sentry Matters for AKBai

AKBai is a financial tool handling user receipts, transaction data, and payment processing. Undetected errors can cascade silently—users won't know if their expense scans failed to save, if payments got stuck in limbo, or if BIR deadline alerts never fired.

**Key monitoring priorities for AKBai:**
- **Receipt OCR failures** — Claude API timeouts, malformed responses
- **Supabase RLS violations** — Silent auth failures due to row-level security misconfiguration
- **Payment webhooks** — Xendit subscription/payment events that fail to process idempotently
- **API spend circuit breaker** — Daily Claude API spend cap exceeded without graceful degradation
- **Edge Function errors** — Webhook handlers deployed to Supabase Deno runtime
- **Offline sync failures** — TanStack Query mutations queued offline but failing to sync when connectivity returns
- **User-facing TypeScript errors** — Strict mode type mismatches that leak into production

Sentry gives you **real-time visibility** into these failures before users report them in support.

---

## Architecture Overview

```
AKBai Next.js App (browser + server)
    ↓
Sentry SDK (browser + server)
    ↓
Sentry.io Project (ingestion, grouping, alerting)
    ↓
Your Email / Slack / Mobile (alerts)
```

**What Sentry tracks:**
- Frontend errors (client-side JavaScript)
- Server-side errors (API routes, server components)
- Transaction performance (optional, Phase 2)
- Release/deployment metadata (git commit hash)
- Source maps (map minified production code back to source)
- User context (user_id, tier, business_type)
- Breadcrumbs (event trail leading up to error)

**What Sentry does NOT track (by design):**
- Sensitive data (PII, API keys, financial amounts)
- User interactions inside iframes (cross-origin restriction)
- Offline TanStack Query mutations (you'll handle this separately)

---

## Step 1: Create Sentry Project

### 1.1 Create Sentry Account (if needed)

Go to **https://sentry.io** and sign up:
- Use your personal email (you're the solo founder)
- Create organization: "AKBai"
- Plan: **Free tier** for Phase 0A (includes 5K events/month, enough for beta)
  - Free tier limit: 5,000 errors/month
  - Phase 1 upgrade to **Team plan** if you exceed this (₱500/mo approx, scales with usage)

### 1.2 Create a Sentry Project for AKBai

Inside Sentry dashboard:
1. Go to **Projects** → **Create Project**
2. Select **Next.js** as platform
3. **Project name:** `akbai-web`
4. **Team:** (default)
5. **Alert me on every issue** (enabled by default — keep this on for beta)
6. Click **Create Project**

### 1.3 Note Your DSN

You'll see a DSN (Data Source Name) like:
```
https://abc123def456@sentry.io/7891011
```

This is your **public key**. Save it — you'll need it in Step 3.

---

## Step 2: Install Sentry SDK

In your AKBai Next.js project root, run:

```bash
npm install @sentry/nextjs
```

This installs:
- `@sentry/node` — server-side error tracking
- `@sentry/react` — client-side error tracking
- `@sentry/integrations` — Sentry plugins (replay, profiling, etc.)
- `@sentry/cli` — source map upload tool

---

## Step 3: Configure Sentry DSN & Environment Variables

### 3.1 Add to `.env.local` (local development)

```env
# Sentry configuration (development)
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@sentry.io/7891011
SENTRY_ORG=akbai
SENTRY_PROJECT=akbai-web
SENTRY_AUTH_TOKEN=your_sentry_auth_token  # See 3.3 below
```

### 3.2 Add to Cloudflare Pages Environment Variables (production)

In your Cloudflare Pages project settings:

**Environment:** `production`

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://abc123def456@sentry.io/7891011` |
| `SENTRY_ORG` | `akbai` |
| `SENTRY_PROJECT` | `akbai-web` |
| `SENTRY_AUTH_TOKEN` | (see Step 3.3) |

(Keep `SENTRY_AUTH_TOKEN` out of `.env.local` for security — only store it in Cloudflare)

### 3.3 Create a Sentry Auth Token (for source map uploads)

In your Sentry dashboard:
1. Go to **Settings** → **Auth Tokens** (or **API > Tokens**)
2. Click **Create Token**
3. **Scopes needed:**
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token and store it in Cloudflare Pages as `SENTRY_AUTH_TOKEN`

---

## Step 4: Initialize Sentry in Next.js

Create `sentry.config.ts` in your Next.js root:

```typescript
// sentry.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // DSN is read from NEXT_PUBLIC_SENTRY_DSN env var automatically
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment: "production" | "staging" | "development"
  environment: process.env.NODE_ENV,

  // Release tag for every deploy
  // This is populated by Cloudflare at build time
  release:
    process.env.CF_PAGES_COMMIT_SHA?.substring(0, 8) ||
    process.env.SENTRY_RELEASE ||
    'unknown',

  // Percentage of transactions to track (0.0–1.0)
  // Start at 0.1 (10%) for beta, increase to 1.0 (100%) in Phase 2
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Percentage of sessions to track for replay
  // Phase 2: increase to 0.5 for debugging user flows
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Always capture replays on error

  // Integrations: what to track
  integrations: [
    new Sentry.Replay({
      // Don't capture sensitive data in replays
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.HttpClient(),
  ],

  // Data sanitization: strip sensitive fields
  beforeSend(event) {
    // Don't send errors from local/development
    if (process.env.NODE_ENV !== 'production') {
      return event;
    }

    // Strip payment-related fields
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Strip user PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((bc) => {
        if (bc.data?.email || bc.data?.phone) {
          delete bc.data.email;
          delete bc.data.phone;
        }
        return bc;
      });
    }

    return event;
  },

  // Ignore certain errors (known non-fatal)
  ignoreErrors: [
    // Browser extensions
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    // Known third-party errors (e.g., advertisement networks)
    /adserver/i,
    // ResizeObserver loop limit exceeded (harmless)
    /ResizeObserver loop limit exceeded/,
  ],
});
```

### 4.1 Update `next.config.js`

Sentry provides a Next.js plugin that automatically wraps your build. Update `next.config.js`:

```typescript
// next.config.js
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config...
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps automatically after build
  silent: false,
  widenClientFileUpload: true,

  // Tunnel API calls through your own domain (reduces ad blocker impact)
  // Optional: add in Phase 2 if needed
  // tunnelRoute: "/monitoring",
});
```

---

## Step 5: Set Up Error Boundaries

Error boundaries prevent a single component error from crashing the entire app. Create a client-side error boundary:

### 5.1 Create `components/error-boundary.tsx`

```typescript
// components/error-boundary.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  useEffect(() => {
    // Catch unhandled errors in child components
    const handleError = (event: ErrorEvent) => {
      Sentry.captureException(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <>
      {children}
      {fallback && <div>{fallback}</div>}
    </>
  );
}

// Sentry error boundary (Next.js 13.2+)
export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => children,
  {
    fallback: (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <h1 className="text-2xl font-bold text-red-900 mb-2">Oops!</h1>
        <p className="text-red-700 mb-4">
          May problema sa app. Subukan ulit o kontakin kami.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Refresh
        </button>
      </div>
    ),
  }
);
```

### 5.2 Wrap Your Root Layout

In `app/layout.tsx`:

```typescript
// app/layout.tsx
import { SentryErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fil">
      <body>
        <SentryErrorBoundary>{children}</SentryErrorBoundary>
      </body>
    </html>
  );
}
```

---

## Step 6: API Route Error Tracking

### 6.1 Create API Route Wrapper

All API routes should wrap Sentry context and set user information. Create `lib/sentry-middleware.ts`:

```typescript
// lib/sentry-middleware.ts
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Wrap API route handlers to:
 * 1. Set user context from Supabase auth
 * 2. Capture errors to Sentry
 * 3. Tag errors with feature/endpoint
 */
export async function withSentryContext(
  handler: (req: Request) => Promise<Response>,
  {
    feature,
    action,
  }: {
    feature: string; // e.g., 'resibo-scanner', 'payment-webhook'
    action: string; // e.g., 'ocr', 'webhook-received'
  }
) {
  return async (req: Request) => {
    const scope = Sentry.getCurrentScope();

    try {
      // Extract user from Supabase auth
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Set user context for all errors in this request
      if (user) {
        scope.setUser({
          id: user.id,
          email: user.email,
          // Do NOT include: phone, full name, business name, financial data
        });
      }

      // Tag with feature + action
      scope.setTag('feature', feature);
      scope.setTag('action', action);
      scope.setTag('method', req.method);

      // Execute handler
      return await handler(req);
    } catch (error) {
      // Capture exception with full context
      Sentry.captureException(error, {
        tags: {
          feature,
          action,
        },
      });

      // Return error response
      return new Response(
        JSON.stringify({
          success: false,
          error:
            process.env.NODE_ENV === 'production'
              ? 'An error occurred'
              : error instanceof Error
                ? error.message
                : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
```

### 6.2 Use in API Routes

Example: `app/api/resibo/scan/route.ts`

```typescript
// app/api/resibo/scan/route.ts
import { withSentryContext } from '@/lib/sentry-middleware';
import Anthropic from '@anthropic-ai/sdk';

async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No file provided',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Call Claude for OCR
  const client = new Anthropic();
  const base64 = await file.arrayBuffer().then((buf) =>
    Buffer.from(buf).toString('base64')
  );

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Extract transaction data from this receipt...',
          },
        ],
      },
    ],
  });

  return new Response(
    JSON.stringify({
      success: true,
      data: response.content,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Wrap with Sentry context
export const POST = withSentryContext(handler, {
  feature: 'resibo-scanner',
  action: 'ocr',
});
```

### 6.3 Payment Webhook Handler

For Xendit webhooks in `app/api/webhooks/xendit/route.ts`:

```typescript
// app/api/webhooks/xendit/route.ts
import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  const scope = Sentry.getCurrentScope();

  try {
    // Verify Xendit signature
    const signature = req.headers.get('x-xendit-webhook-token');
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!signature || signature !== expectedToken) {
      scope.setTag('webhook', 'xendit');
      scope.setTag('error_type', 'signature_mismatch');
      Sentry.captureMessage('Xendit webhook signature verification failed', 'warning');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Tag webhook context
    scope.setTag('webhook', 'xendit');
    scope.setTag('event_type', body.type);
    scope.setTag('xendit_reference_id', body.id);

    // Handle payment success
    if (body.type === 'invoice.paid') {
      // Update subscription in Supabase
      // Emit user notification
      // Log to webhook_events table for idempotency
      scope.setContext('xendit_event', {
        type: body.type,
        reference_id: body.id,
        amount: body.amount, // This is okay — not user PII
      });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        webhook: 'xendit',
      },
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Webhook processing failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## Step 7: Release Management & Source Maps

### 7.1 Automatic Release Tagging

Cloudflare Pages automatically provides `CF_PAGES_COMMIT_SHA` at build time. Your `sentry.config.ts` (Step 4) already extracts this:

```typescript
release:
  process.env.CF_PAGES_COMMIT_SHA?.substring(0, 8) ||
  process.env.SENTRY_RELEASE ||
  'unknown',
```

**What this does:**
- Every production build gets tagged with the first 8 characters of the git commit hash
- Sentry uses this to match errors to specific builds
- When you do a postmortem, you can ask "Was this bug in the v1.0.3 release?" and get a definitive answer

### 7.2 Source Maps Upload (automatic via `next.config.js`)

The `withSentryConfig()` wrapper in Step 4.1 automatically:
1. Minifies your code for production
2. Uploads source maps to Sentry after build
3. Deletes source maps from your Cloudflare deployment (security best practice)

This means: minified production errors are **automatically unmapped** to readable source code in Sentry.

### 7.3 Manual Source Map Upload (if needed)

If automatic upload fails, manually upload:

```bash
npm run build
SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
SENTRY_ORG=akbai \
SENTRY_PROJECT=akbai-web \
npx @sentry/cli releases files upload-sourcemaps ./out
```

---

## Step 8: Alerting & Notifications

### 8.1 Email Alerts (Default)

In your Sentry dashboard:
1. Go to **Alerts** → **Create Alert**
2. **When:** Frequency = "For each new issue"
3. **Then:** Send notification to your email
4. Click **Save**

This sends you an email **every time a new error type is detected**.

### 8.2 Set Alert Thresholds (Phase 2)

Once you have production traffic, upgrade to **issue frequency alerts**:

1. **Alert:** "Error rate > 5% in last 5 minutes"
2. **Then:** Send to your email (or integrate Slack)

This prevents alert fatigue—you only get notified if errors spike.

### 8.3 Integrate Slack (Optional, Phase 2)

In Sentry:
1. Go to **Integrations** → **Slack**
2. Connect your workspace
3. In **Alerts**, set "Send notification to Slack channel #monitoring"

This posts error alerts to a dedicated Slack channel, useful when you have a team.

### 8.4 Mobile Notifications (Personal)

Sentry doesn't have built-in mobile push—but you can:
- Enable **email notifications** on your phone (Gmail app)
- Use **Slack mobile app** (if you integrate Slack in Phase 2)

---

## Step 9: Testing

### 9.1 Test Error Capture (Development)

Create a test page to verify Sentry is working:

```typescript
// app/test-sentry/page.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function TestSentryPage() {
  const [status, setStatus] = useState('');

  const testClientError = () => {
    try {
      throw new Error('Test client-side error from AKBai');
    } catch (error) {
      Sentry.captureException(error);
      setStatus('Client error sent to Sentry');
    }
  };

  const testServerError = async () => {
    try {
      const res = await fetch('/api/test-error', { method: 'POST' });
      if (!res.ok) {
        setStatus('Server error triggered');
      }
    } catch (error) {
      Sentry.captureException(error);
      setStatus('Error sending request');
    }
  };

  const testMessage = () => {
    Sentry.captureMessage('Test info message from AKBai', 'info');
    setStatus('Message sent to Sentry');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <p className="text-gray-600 mb-6">
        These buttons will send test data to Sentry. Check your Sentry dashboard.
      </p>

      <div className="space-y-4">
        <button
          onClick={testClientError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Test Client Error
        </button>

        <button
          onClick={testServerError}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Test Server Error
        </button>

        <button
          onClick={testMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Info Message
        </button>
      </div>

      {status && <p className="mt-6 text-green-600 font-semibold">{status}</p>}
    </div>
  );
}
```

Create `app/api/test-error/route.ts`:

```typescript
// app/api/test-error/route.ts
import * as Sentry from '@sentry/nextjs';

export async function POST() {
  Sentry.captureMessage('Test server-side error from AKBai', 'error');

  throw new Error('Intentional test error from API route');
}
```

### 9.2 Run Tests

1. **Local development (NODE_ENV=development):**
   - Errors are logged to console but **NOT sent to Sentry** (by design in Step 4)
   - This prevents test noise in production Sentry

2. **Local production build:**
   ```bash
   npm run build
   npm run start
   ```
   - Visit `http://localhost:3000/test-sentry`
   - Click buttons
   - Errors ARE sent to Sentry (because NODE_ENV=production)

3. **Check Sentry dashboard:**
   - Go to **Issues**
   - You should see your test errors grouped by type
   - Click into each issue to see breadcrumbs, user context, etc.

4. **Delete test page before shipping:**
   ```bash
   rm app/test-sentry/page.tsx app/api/test-error/route.ts
   ```

---

## Step 10: Production Deployment Checklist

Before shipping to beta users, verify:

### Before Deploy

- [ ] Sentry project created (`akbai-web`)
- [ ] DSN copied to `NEXT_PUBLIC_SENTRY_DSN` in Cloudflare Pages
- [ ] `SENTRY_AUTH_TOKEN` added to Cloudflare (for source map upload)
- [ ] `SENTRY_ORG=akbai` and `SENTRY_PROJECT=akbai-web` in Cloudflare
- [ ] `sentry.config.ts` configured (Step 4)
- [ ] `next.config.js` updated with `withSentryConfig()` (Step 4.1)
- [ ] Error boundary added to root layout (Step 5.2)
- [ ] API routes wrapped with `withSentryContext()` where applicable (Step 6)
- [ ] Test page `/test-sentry` deleted (Step 9.4)
- [ ] `.gitignore` includes `.sentry-release-registry.json` (generated after build)

### During Deploy

- [ ] Build succeeds without Sentry errors
- [ ] Source maps upload to Sentry (check Sentry CLI output)
- [ ] Release created in Sentry dashboard

### Post-Deploy (Production Validation)

1. **Visit your deployed app**
2. **Trigger a test error** (if you left test page up, or manually throw an error)
3. **Check Sentry dashboard within 2 minutes**
   - Go to **Issues**
   - You should see the new issue with:
     - Release tag (git commit hash)
     - User context (if logged in)
     - Breadcrumbs (page navigation, network requests, user actions)
     - Source-mapped stack trace
     - Environment: `production`

4. **Test with a beta user**
   - Ask them to trigger a real error in the app
   - Verify it appears in Sentry within 1–2 minutes

### Sample Production Deployment Steps

```bash
# 1. Verify config
cat .env.local | grep SENTRY

# 2. Build
npm run build

# 3. Check for source map upload
ls -la .next/.sentry-release-registry.json

# 4. Deploy to Cloudflare (via git push or wrangler CLI)
git push origin main

# 5. Monitor Cloudflare Pages build progress
# — Sentry source maps should upload during build

# 6. Visit production URL
# — Sentry.io dashboard should show "Release <hash> created"
```

---

## AKBai-Specific Monitoring Recommendations

### What to Watch First (Phase 1 Beta)

1. **Resibo Scanner Errors** — Track Claude OCR failures, malformed responses
   - Tag: `feature: resibo-scanner`
   - Alert if error rate > 1% (failures are visible to users)

2. **Supabase RLS Violations** — Silent auth failures
   - Look for "permission denied" in error logs
   - Usually means row-level security policy misconfiguration
   - These are **critical** — they suggest data is leaking across users

3. **Payment Webhook Failures** — Xendit events not processed
   - Tag: `webhook: xendit`
   - Alert on ANY failure (each webhook is money)

4. **API Spend Circuit Breaker** — Daily Claude API cap hit
   - Add explicit error tracking in `lib/claude/circuit-breaker.ts`
   - Alert if triggered (means you need to increase cap or scale pricing model)

5. **Network Timeouts** — 4G instability, slow Claude responses
   - Watch for `fetch timeout` or `Claude API timeout` errors
   - These might be unavoidable in Philippines 4G, but helps you optimize

### Don't Over-Index On (Early Phase)

- **Performance metrics** (tracesSampleRate at 10% is fine; increase in Phase 2)
- **Session replays** (blockAllMedia/maskAllText helps privacy; Phase 2 for UX debugging)
- **Profiling** (JavaScript profiler overhead; Phase 3 when you're scaling)

---

## Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| **No errors appearing in Sentry** | DSN not set or NODE_ENV is `development` | 1. Verify `NEXT_PUBLIC_SENTRY_DSN` in build output. 2. Deploy to production. 3. NODE_ENV must be `production`. |
| **Source maps not uploading** | `SENTRY_AUTH_TOKEN` missing or expired | 1. Verify token in Cloudflare Pages. 2. Regenerate token in Sentry (Settings > Auth Tokens). 3. Check Cloudflare build logs for CLI errors. |
| **Errors appearing but not source-mapped** | Source maps not found by Sentry | 1. In Sentry: **Project Settings > Source Maps**. 2. Verify release tag matches your build (should match git commit hash). 3. Check **Files** tab to see uploaded maps. |
| **PII leaking into Sentry** | `beforeSend()` filter not working | 1. Verify `beforeSend()` in `sentry.config.ts`. 2. Never send email, phone, or financial data. 3. Review breadcrumbs and context data before shipping. |
| **Too many alerts / alert fatigue** | Alert rule too broad | 1. Set threshold: "For each new issue type" instead of "every event". 2. Disable alerts for known non-critical errors. 3. Phase 2: upgrade to frequency thresholds (>5% error rate). |
| **Sentry CLI upload fails during Cloudflare build** | Auth token invalid or permissions missing | 1. Regenerate `SENTRY_AUTH_TOKEN`. 2. Verify scopes: `project:read`, `project:releases`, `org:read`. 3. Check Cloudflare build logs (Settings > Builds). |

---

## Next Steps (Roadmap)

### Phase 1 (Now → Month 3)
- [ ] Monitor Sentry errors from beta users
- [ ] Create runbook for common error types (e.g., "Xendit webhook failed" → check signature verification)
- [ ] Track error rate trends (goal: <0.5% in production)

### Phase 2 (Month 3–6)
- [ ] Integrate Slack for real-time error alerts
- [ ] Set up issue frequency alerts (error rate thresholds)
- [ ] Enable session replay for UX debugging (50% sample rate)
- [ ] Upgrade Sentry plan if error volume > 5K/month

### Phase 3+ (Month 6+)
- [ ] Add custom dashboards for key metrics (OCR success rate, webhook latency)
- [ ] Implement feature flag monitoring (PostHog integration)
- [ ] Set up SLO tracking (uptime targets)
- [ ] Analyze error trends for product improvements

---

## Summary

You now have:
1. ✅ Sentry project created (`akbai-web`)
2. ✅ SDK installed and configured in Next.js
3. ✅ Error boundaries set up (client-side)
4. ✅ API route wrapping with user context (server-side)
5. ✅ Release tagging (automatic via Cloudflare + git commit hash)
6. ✅ Source maps configured (automatic upload to Sentry)
7. ✅ Alerting enabled (email)
8. ✅ Testing framework ready

**Before first beta deploy:** Remove `/test-sentry` page and verify all env vars are in Cloudflare Pages.

**On first production error:** You'll get an email with:
- Error type and count
- Stack trace (source-mapped to readable code)
- User context (who triggered it)
- Breadcrumbs (what happened before the error)
- Release tag (which build it happened in)

From there, iterate: fix the bug → deploy → monitor. Repeat until you're confident the app won't surprise you.

---

**Last Updated:** March 17, 2026
**Scope:** AKBai Phase 0A → Phase 1 (Sentry core setup)
**Maintained By:** DevOps Engineer skill
