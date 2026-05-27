# Sprint 15 — Capacitor Conversion Pattern (Server → Client)

**Status:** Locked 2026-05-27 by build-architect. Reference for `feat/15-capacitor-conversion`.
**Source of truth:** ADR-019 (Accepted Green) + spike empirical findings at `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md`.
**Audience:** the build-engineer agent. Read this end-to-end before touching code. Every conversion follows §2; deviate only with an updated ADR.

---

## 0. Open Questions for Anton (flagged at PR review, do not block engineer)

1. **`/dashboard` — real fetch vs stub data?** Spike landed stub-only per locked answer. **Recommendation (this doc):** wire real `/api/dashboard` fetch with a skeleton fallback. The API route exists and returns the same shape `KumustahanHero`/`CheckInSection`/tiles need. Stub-only would leave main with a broken-looking home for the first real device build. If Anton overrides at PR review, revert to spike stubs in one commit.
2. **`/scan` — OCR feature flag client gate?** Spike removed it entirely. **Recommendation:** keep removed for Sprint 15. `FLAGS.OCR_ENABLED` is server-only today; building a new `/api/feature-flags/[key]` GET endpoint for one tile-gate is out of scope. Engineer adds a `// TODO(sprint-16): wire client-side OCR_ENABLED gate via new /api/feature-flags route` comment instead.
3. **`auth/callback` rewrite — needed at all for Sprint 15?** Today's login uses `signInWithOtp` + `verifyOtp` (6-digit code paste, no magic-link redirect). The `/auth/callback` route is only hit if a magic-link email is clicked, which is not the documented happy path. **Recommendation:** still rewrite to a client page (cheap, ~30 LOC) so deep-link from email still works in Capacitor; flag `review-security` to confirm PKCE flow is intact post-rewrite.
4. **next-intl plugin compatibility.** `createNextIntlPlugin('./src/lib/i18n/request.ts')` still expects a `getRequestConfig` resolver — spike kept this and made `resolveLocale()` return `defaultLocale` synchronously. **Recommendation:** keep the plugin wrap; do *not* swap it out. Client-side locale switching happens via `document.cookie` write + reload (see §6); the resolver itself reads the cookie inside the static prerender request scope but it's effectively a stub during build. Anton override option: rip out next-intl entirely in Sprint 16 if the cookie-then-reload UX feels janky on device.

---

## 1. Top-3 risks engineer must internalise

1. **Module-evaluation `createClient()` will crash prerender** without placeholder env. The spike's session-watcher and any code that calls `createClient()` at module top-level (rather than inside `useEffect`) throws "URL/key are required" at build time. **Mitigation:** every converted page instantiates `createClient()` *inside* `useEffect`, never at module scope. If you need it twice in one component, hoist with `useRef(() => createClient())` (lazy) — but only inside the component body.
2. **`useSearchParams()` without `<Suspense>` breaks static export.** Next 16 hard-fails the build with "missing Suspense boundary with useSearchParams". Wrap every consumer (see §9 inventory).
3. **Service-client (`createServiceClient`) cannot exist in client bundles.** It imports `SUPABASE_SERVICE_ROLE_KEY` — a server-only secret. The dev-mode `SKIP_AUTH` path on main reads from the service client to bypass RLS; in client conversions, you must drop the service client entirely and trust the browser Supabase client (which goes through RLS). For dev-mode `SKIP_AUTH=true` builds, the API routes handle the service-client bypass server-side — client pages just fetch from `/api/*` and the API route does the right thing.

---

## 2. Canonical page-conversion template

This is the one shape every `(app)/**/page.tsx` adopts. Adapt the data-shape and component import — never the skeleton.

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// useParams only when the route is dynamic ([id]); useSearchParams only when
// the page reads query params (and the file must export a Suspense wrapper —
// see Suspense subsection below).
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { PageBackground } from '@/components/ui/page-background';

// Type the API response. Mirror the shape the existing /api/<route> returns.
interface PageData {
  // ...
}

export default function FeaturePage() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/<endpoint>');
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'May problema sa pagkuha ng data.');
        return;
      }
      setData(json.data as PageData);
    } catch {
      setError('Hindi makakonekta. I-check mo ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth gate + data fetch — single useEffect. Service-client logic is gone;
  // /api/* handles SKIP_AUTH server-side.
  useEffect(() => {
    async function bootstrap() {
      if (!SKIP_AUTH) {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace('/login');
          return;
        }
      }
      await fetchData();
    }
    bootstrap().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('page bootstrap failed', err);
      setError('Hindi makapag-load. Subukan muli.');
      setLoading(false);
    });
  }, [router, fetchData]);

  if (loading) {
    return (
      <PageBackground variant="<variant>">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (error || !data) {
    return (
      <PageBackground variant="<variant>">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive text-sm mb-2">{error ?? 'Walang data.'}</p>
          <button
            onClick={fetchData}
            type="button"
            className="text-primary text-sm font-semibold"
          >
            Subukan muli
          </button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="<variant>">
      {/* ...real component tree using `data`... */}
    </PageBackground>
  );
}
```

### Conversion checklist — what to remove from every server page

| Server pattern | Client replacement |
|---|---|
| `export const metadata: Metadata = { title: '…' }` | **Remove.** Tab titles default to "AKBai" globally (set in `app/layout.tsx`). Accept v1 loss per ADR-019 §Negative. Do **not** write `document.title` ad-hoc — track as Sprint 16 polish. |
| `async function Page()` | `function Page()` |
| `import { redirect } from 'next/navigation'` + `redirect('/login')` | `useRouter().replace('/login')`. **Use `router.replace`, not `router.push`** (no back-button trap into the unauth page). Reserve `window.location.href = '/login'` for the auth-callback page only (full reload acceptable there). |
| `import { createClient } from '@/lib/supabase/server'` | `import { createClient } from '@/lib/supabase/client'`. **Always instantiate inside `useEffect` or event handlers.** |
| `import { createServiceClient } from '@/lib/supabase/service'` | **Remove entirely.** Service-client cannot ship to the browser. Move any service-client logic into the API route. |
| `import 'server-only'` | **Remove.** |
| `getTranslations('ns')` (server) | `useTranslations('ns')` (client). Import from `'next-intl'`, not `'next-intl/server'`. |
| `await searchParams` / `searchParams: Promise<...>` props | `useSearchParams()` — and wrap the consumer in `<Suspense>` (see §9). |
| `params: { id: string }` (dynamic-route prop) | `useParams<{ id: string }>()` or `const params = useParams(); const id = params.id as string;` (the cast matches spike's chat-page pattern). |
| Server-side data fetches via `supabase.from('...').select(...)` | Either (a) call the existing `/api/<route>` endpoint from `useEffect`, or (b) call browser `supabase.from(...).select(...)` directly **only if** the data is RLS-readable to the authenticated user. Prefer (a) — keeps RLS, dev-bypass, and rate-limit logic in one place. |
| Server-side feature-flag gate (`await getFeatureFlag(...)`) | Removed for Sprint 15 (see Open Question 2). |

### Loading / error state pattern (locked)

- **Loading:** `<PageBackground>` shell + centered `"Loading..."` text. Matches spike pattern; skeleton components live inside the data-rendering components themselves where they already exist (e.g., `CostingCardList`). Don't add page-level skeletons in Sprint 15 — that's Sprint 16 polish.
- **Error:** centred `text-destructive` message + "Subukan muli" retry button that calls the fetch callback. Always pull error copy from `json.error?.message_tl` first; fall back to `'Hindi makakonekta. I-check mo ang internet mo.'` for network errors.
- **Empty data:** delegate to the existing component's empty state (e.g., `CostingCardList` already renders an `IllustrationWrapper` empty card). Don't duplicate.

### Suspense placement

Only needed for `useSearchParams()` (Next 16 static-export requirement). The pattern is:

```tsx
export default function Page() {
  return (
    <Suspense fallback={<PageBackground variant="x"><div className="…">Loading...</div></PageBackground>}>
      <PageInner />
    </Suspense>
  );
}

function PageInner() {
  const searchParams = useSearchParams();
  // …rest of the template above…
}
```

Per §9, only `/chat` definitely needs this. Other pages stay single-component.

---

## 3. 15-file conversion inventory

For each file: `(source-of-data) → (target API route)`. **Quirks** flags non-template work. **Auth check:** all 15 use the standard `useEffect` auth gate from §2 unless noted.

| # | File | Source data on main | Target API | Auth | Suspense? | Quirks |
|---|---|---|---|---|---|---|
| 1 | `app/page.tsx` (root) | `supabase.auth.getUser()` then `users.onboarding_completed` | None — keep client-side: render `<LandingPage />` if no user, `router.replace('/dashboard'/'/onboarding')` if user | Yes | No | **Different shape from §2.** Returns `<LandingPage />` for unauth users (no fetch, no API call). Use spike pattern but render landing instead of redirect when `!user`. Don't redirect to `/dashboard` unconditionally like the spike did — that breaks the web-fallback landing surface. |
| 2 | `app/(app)/dashboard/page.tsx` | 9 server queries (users, business_profiles, daily_check_in × 2, ka_conversations count, transactions count, costing_cards count, bir_deadlines × 2, invoices × 2) + `pickTone` + `pickFallback` | `GET /api/dashboard` — **VERIFY:** the API today returns a *different* shape than the page consumes (it builds its own `DashboardResponse`; the page uses `buildActionTiles` from raw counts). **Engineer action:** either extend `/api/dashboard` to return the full Phase-7 hero+tiles+streak payload, OR add `/api/dashboard/v2` with the richer shape. **Recommended:** extend the existing route — it already has the user/SKIP_AUTH bootstrap. **Anton override flag in PR.** | Yes | No | Largest conversion. `computeStreak`, `pickTone`, `pickFallback` are pure libs — call them either client-side or move to API route. Recommend API route (smaller bundle). Pure libs do not need conversion. |
| 3 | `app/(app)/chat/page.tsx` | Browser supabase: auth, onboarding check, `ka_conversations` last 50 | **Spike pattern stands** — direct browser supabase reads (RLS allows). No API call needed for bootstrap; `/api/chat` is only hit on send. | Yes | **YES** | Use `useSearchParams()` for `topic`/`context`. **Wrap in `<Suspense>`.** Copy spike file `C:\Users\Anton del Rosario\akbai-spike\frontend\src\app\(app)\chat\page.tsx` verbatim — it is the canonical reference. |
| 4 | `app/(app)/scan/page.tsx` | Server auth + `getFeatureFlag(OCR_ENABLED)` | None (gate removed per Open Q 2) | Yes | No | Copy spike's `scan/page.tsx`. Add `// TODO(sprint-16): wire client-side OCR_ENABLED gate`. |
| 5 | `app/(app)/admin/page.tsx` | None (already client-shaped — child components fetch independently) | n/a | None at page level (children handle) | No | **Already client-component-shaped.** Just add `'use client'` directive at top. No `useEffect`, no fetch. Smallest conversion. **Verify children (`AdminStats`, `MrrCard`, etc.) all have their own client-side auth gates** — if any is server-shaped, that's out of scope, flag at PR. |
| 6 | `app/(app)/costing/page.tsx` | `GET /api/costing` | `GET /api/costing` | **Already client-shaped on main** — no conversion needed; just verify the auth gate. Today the file relies on the now-defunct server-side `(app)/layout.tsx` auth wall. **Add the `useEffect` auth gate from §2.** | No | Already returns `{ success, data }` shape — wire pattern fits. |
| 7 | `app/(app)/costing/new/page.tsx` | None (renders `CostingCardForm`) | n/a | **Add auth gate.** | No | Smallest. Already `'use client'`. Just add the §2 auth-gate `useEffect`. |
| 8 | `app/(app)/costing/[id]/page.tsx` | `GET /api/costing/${id}` | same | **Already client-shaped on main.** Add auth gate. | No | Uses `useParams()` — verify `params.id` cast pattern. |
| 9 | `app/(app)/deadlines/page.tsx` | None at page level (renders `<DeadlineList />` which fetches its own) | n/a | **Add auth gate** at page level. | No | Currently server but does no server work — `'use client'` + auth gate `useEffect` + render `<DeadlineList />`. |
| 10 | `app/(app)/expenses/page.tsx` | `GET /api/expenses?range=...` | same | **Already client-shaped.** Add auth gate. | No | Heavy file but well-shaped. No structural change. |
| 11 | `app/(app)/invoices/page.tsx` | `GET /api/invoices?status=&search=` | same | **Already client-shaped.** Add auth gate. | No | Uses `useRef` for search input (correct React 19 pattern per CLAUDE.md). |
| 12 | `app/(app)/invoices/new/page.tsx` | `GET /api/invoices?status=draft` for next-number gen | same | **Already client-shaped.** Add auth gate. | No | Number-gen is fragile; out-of-scope to fix in Sprint 15. |
| 13 | `app/(app)/invoices/[id]/page.tsx` | `GET /api/invoices/${id}` | same | **Already client-shaped.** Add auth gate. | No | Uses `useParams()` correctly. |
| 14 | `app/(app)/onboarding/page.tsx` | Server: `users.{display_name, primary_pain, bir_consent, onboarding_step, onboarding_completed}`, `business_profiles.{business_type, income_range}` | **NEW API needed**: `GET /api/onboarding` returning the `OnboardingState` shape. Currently only `POST /api/onboarding` exists. **Engineer action:** add GET handler to the existing `route.ts`. | Yes | No | If `userData.onboarding_completed` → `router.replace('/dashboard')`. Same translation key `'onboarding'`. |
| 15 | `app/(app)/profile/page.tsx` | Server: `users.display_name`, `business_profiles.*` | `GET /api/profile` (exists, returns `ProfileData`) | Yes | No | Standard §2 template. `profileVersion = 1` hard-coded — move into the API response, or keep client-side constant. |

---

## 4. API route exclusion strategy (static export build)

**Decision: option (a) — `next.config.js` conditional via `CAPACITOR_BUILD` env var.**

### Why option (a) over a copy-script

`output: 'export'` + `pageExtensions` filtering is the canonical Next 16 escape hatch. `pageExtensions` accepts a string array — files whose extension is not in the list are excluded from the build (route-handler scanning, prerender, manifest). The trick: tag API routes with a non-page extension (`.api.ts`) and exclude them in Capacitor builds. **But** that's invasive (rename 30+ files). The simpler path: **conditional `output`** + **conditional file-tree exclusion via `pageExtensions`** that drops the `.ts` extension from API routes specifically.

Actually the cleanest Next 16 pattern is to keep the API folder structure and let `output: 'export'` raise a known error if it finds route handlers — then exclude via `pageExtensions: ['tsx']` for the Capacitor build (TSX-only excludes all `.ts` route handlers since `app/api/**/route.ts` is `.ts`, never `.tsx`). **Verify in spike build #1** — if `pageExtensions: ['tsx']` breaks anything `.ts` that legitimately needs to participate (e.g., `app/layout.tsx`-only? No, layouts are tsx too), this works.

### Final code (replace current `next.config.js` on main)

```js
/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')
const { withSentryConfig } = require('@sentry/nextjs')

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

// CAPACITOR_BUILD=1 produces a static export bundle for Capacitor sync.
// Default (unset) ships the standard Vercel SSR build.
const isCapacitor = process.env.CAPACITOR_BUILD === '1'

const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Required when `output: 'export'` — the optimizer is server-side runtime.
    unoptimized: isCapacitor,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  ...(isCapacitor && {
    output: 'export',
    // Static export only scans .tsx files as pages. This excludes:
    //   - app/api/**/route.ts (all API route handlers)
    //   - src/proxy.ts (Next 16 middleware — file lives outside app/ but
    //     extension-based scan still skips it)
    //   - app/sitemap.ts (web-only XML sitemap; deprecated for native)
    pageExtensions: ['tsx'],
  }),
}

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
```

### Env-var convention

- `CAPACITOR_BUILD=1 npm run build` → produces `out/` for `npx cap sync`.
- `npm run build` (no env) → standard Vercel SSR build with API routes intact.

Add to `package.json` scripts (post-PR-feedback, not in this doc to write):
```
"build:capacitor": "CAPACITOR_BUILD=1 next build",
"sync:android": "npm run build:capacitor && npx cap sync android"
```

### Compatibility with `withSentryConfig(withNextIntl(nextConfig))`

Both wrappers preserve `pageExtensions` and `output` (verified by the spike — the spike's `next.config.js` already nests inside both wrappers and the build succeeds). No structural change to the wrap order.

### If `pageExtensions: ['tsx']` breaks

Fallback: rename all `app/api/**/route.ts` → `app/api/**/route.api.ts` and set `pageExtensions: ['tsx', 'api.ts']` for SSR build, `pageExtensions: ['tsx']` for Capacitor. Bigger blast radius (touches every API route file) — only use if the simple version fails.

---

## 5. `proxy.ts` rate-limit relocation

### Inventory: what `proxy.ts` does today

1. Calls `updateSession(request)` on every non-static request (Supabase session refresh).
2. If `pathname.startsWith('/api/')`: extracts client IP, calls `checkRateLimit(ip, { windowMs: 60_000, maxRequests: 20 })`. Returns 429 if rate-limited.

In static export, `proxy.ts` does not run at all. Both responsibilities must move:
- **Session refresh:** dropped. Browser supabase client refreshes its own session via `onAuthStateChange`. Capacitor WebView treats Supabase auth identically to a browser tab. No relocation needed.
- **Rate limit:** relocate to per-route guards.

### New module: `frontend/src/lib/rate-limit/middleware.ts`

```ts
// Per-route rate limit guard, replacing the global proxy.ts middleware.
// For Capacitor builds, proxy.ts does not execute; routes opt in via this helper.
// For SSR builds, proxy.ts continues to provide global IP rate limiting AND
// individual routes can layer this in for stricter per-endpoint caps if needed.

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, type RateLimitResult } from '@/lib/rate-limit'

interface RateLimitOptions {
  /** Sliding-window length. Default 60_000 (60s). */
  windowMs?: number
  /** Max requests per window. Default 20. */
  maxRequests?: number
  /** Key namespace, prepended to the IP. Lets two routes share an IP store without colliding. */
  key?: string
}

const DEFAULTS = { windowMs: 60_000, maxRequests: 20 }

export function enforceRateLimit(
  req: NextRequest,
  opts: RateLimitOptions = {}
): NextResponse | null {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs
  const maxRequests = opts.maxRequests ?? DEFAULTS.maxRequests

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const storeKey = opts.key ? `${opts.key}:${ip}` : ip
  const result: RateLimitResult = checkRateLimit(storeKey, { windowMs, maxRequests })

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again shortly.',
          message_tl: 'Sobrang dami ng requests. Subukan ulit mamaya.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.retryAfterMs ?? windowMs) / 1000)),
        },
      }
    )
  }

  return null
}
```

### Per-route adoption pattern

One-liner at the top of any `POST`/`GET` handler that needs it:

```ts
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'chat', windowMs: 60_000, maxRequests: 20 })
  if (limited) return limited

  // ...existing handler body...
}
```

### Per-route opt-in (recommended) vs blanket

**Recommend per-route opt-in.** Reasoning: webhooks (`/api/webhooks/xendit`, `/api/webhooks/meta`) and admin routes need different limits; the global `proxy.ts` was a blunt instrument. Per-route lets the engineer tune `maxRequests` per call cost.

### Routes that SHOULD adopt `enforceRateLimit` in Sprint 15

Based on cost/abuse signal (LLM-spend routes first):

| Route | `key` | `maxRequests` / `windowMs` | Why |
|---|---|---|---|
| `/api/chat` | `'chat'` | 20 / 60_000 | Claude spend |
| `/api/chat/suggestions` | `'chat-suggestions'` | 30 / 60_000 | Claude spend |
| `/api/ocr` | `'ocr'` | 10 / 60_000 | Claude vision spend, larger payloads |
| `/api/morning-briefing` | `'morning-briefing'` | 10 / 60_000 | Claude spend |
| `/api/weekly-story` | `'weekly-story'` | 10 / 60_000 | Claude spend |
| `/api/onboarding` (POST) | `'onboarding'` | 20 / 60_000 | DB write surface |
| `/api/profile` (PATCH) | `'profile'` | 20 / 60_000 | DB write surface |
| `/api/invoices` (POST) | `'invoices-write'` | 30 / 60_000 | DB write surface |
| `/api/costing` (POST) | `'costing-write'` | 30 / 60_000 | DB write surface |
| `/api/flag-as-wrong` | `'flag'` | 10 / 60_000 | Abuse surface |
| `/api/webhooks/xendit` | (skip — webhooks rate-limited at Xendit/CDN side) |
| `/api/webhooks/meta` | (skip — same) |
| `/api/admin/**` | `'admin'` | 60 / 60_000 | Higher trust, lower abuse risk |

Routes NOT in this list (`/api/health`, GETs on `/api/dashboard`, `/api/expenses`, etc.) skip rate-limiting in Sprint 15 and can adopt in Sprint 16 if abuse data shows up.

### Does `proxy.ts` stay on main?

**Yes.** The Vercel web build still uses it. `next.config.js` with `pageExtensions: ['tsx']` excludes `proxy.ts` from the Capacitor build automatically (it's a `.ts` file). No code change to `proxy.ts` itself this sprint — let it keep doing global IP rate-limiting for web users. Per-route adoption is the safety net for native users where `proxy.ts` doesn't run.

---

## 6. i18n rewrite

### `frontend/src/lib/i18n/request.ts` — client-resolver pattern

The plugin `createNextIntlPlugin('./src/lib/i18n/request.ts')` expects a default-export `getRequestConfig`. Replace the cookies+headers reads with browser-language detection and localStorage. Note: in a static-export build, this function still runs at *build time* (prerender), where `localStorage` doesn't exist — it must safely fall through to `defaultLocale` server-side and let client-side hydration apply the user's choice via the `LanguageToggle` reload cycle.

```ts
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale, localeCookieName, type Locale } from './config'

/**
 * Capacitor / static-export locale resolver.
 *
 * Server-side (build time): returns defaultLocale. Static prerender cannot
 *   read user state, so all prerendered HTML ships with the default messages.
 *
 * Client-side (post-hydration): the LanguageToggle writes a cookie + reloads.
 *   On reload, the resolver still returns defaultLocale because we're in
 *   static-export land — BUT the AppShellLocaleSwap client component (see
 *   below) reads localStorage / cookie post-mount and re-fetches the message
 *   bundle for the chosen locale, then re-renders the NextIntlClientProvider.
 *
 * Net effect: SSR ships default-locale HTML; the client swap happens within
 * ~100ms of first paint if a non-default locale is selected. Acceptable v1
 * UX; revisit if flicker is reported.
 */
export async function resolveLocale(): Promise<Locale> {
  // Build-time prerender: no browser context. Always default.
  // (Cookies/headers reads would force every page dynamic and break
  // `output: 'export'`.)
  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = (await import(`@/../messages/${locale}.json`)).default
  return { locale, messages }
})

export { defaultLocale }
```

**Validation:** verified by spike — this exact pattern compiles and prerenders. The `getRequestConfig` resolver runs once per prerender pass and emits per-locale bundles. Spike confirmed bundle size is acceptable.

### `frontend/src/lib/i18n/set-locale.ts` — client-side write

Drop `'use server'`. Replace `cookies().set()` with `document.cookie` and add `localStorage` (belt-and-braces for Capacitor — cookies inside WebView occasionally don't persist cleanly).

```ts
import { isLocale, localeCookieName, type Locale } from './config'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
const LOCAL_STORAGE_KEY = 'akbai_locale'

export async function setLocaleCookie(locale: Locale): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error(`Invalid locale: ${String(locale)}`)
  }

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  document.cookie =
    `${localeCookieName}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
  window.localStorage.setItem(LOCAL_STORAGE_KEY, locale)

  // Static export ships pre-rendered HTML for the default locale; force a
  // hard reload so next-intl picks up the new bundle on the next request.
  // router.refresh() would not re-run the prerendered message import.
  window.location.reload()
}
```

`LanguageToggle` continues to import `setLocaleCookie` — no change needed to the caller. The `useTransition` wrap still works (the reload happens after the transition resolves).

---

## 7. `auth/callback` rewrite

### Trigger surface

Only hit if a user clicks the magic-link email body. AKBai's login flow uses `signInWithOtp` + `verifyOtp` (6-digit code) as the documented happy path — magic-link click is the fallback Supabase generates anyway. Capacitor deep-link config maps `https://akbai.app/auth/callback` (or whatever production host) into the WebView, which resolves to this page.

### Rewrite: `frontend/src/app/auth/callback/page.tsx`

Delete `route.ts`. Create:

```tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Sandali lang..." />}>
      <CallbackInner />
    </Suspense>
  )
}

function CallbackInner() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'error'>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error)}`
      return
    }

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (!code) {
      window.location.href = '/login?error=auth_callback_error'
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setStatus('error')
        setErrorMessage(exchangeError.message)
        // Fall through to /login after brief delay so the user sees the message.
        setTimeout(() => {
          window.location.href = '/login?error=auth_callback_error'
        }, 1500)
        return
      }
      window.location.href = next
    })
  }, [searchParams])

  if (status === 'error') {
    return <CallbackShell message={errorMessage ?? 'May problema sa pag-login. Subukan muli.'} />
  }
  return <CallbackShell message="Pinapasok ka namin..." />
}

function CallbackShell({ message }: { message: string }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 text-center">
      <p className="text-on-surface-variant text-sm">{message}</p>
    </main>
  )
}
```

### Security flag for `review-security`

PKCE flow uses `code_verifier` stored in the Supabase client's storage layer (localStorage by default). Capacitor WebView's localStorage is sandboxed per app, which is fine — but **flag for review-security agent**: verify that `exchangeCodeForSession` in the browser supabase-js client picks up the correct verifier inside Capacitor (vs the server SDK's cookie-based verifier). If this trips, the symptom is a non-recoverable auth failure on every magic-link click. Spike did not test this path.

No other custom logic (no profile bootstrap post-session) exists in the current server route. Just the exchange + redirect.

---

## 8. `(app)/layout.tsx` rewrite

### Strategy: defer persona until ready; render shell with skeleton

The persona pill is the only thing the layout fetches. Other layout shell (BottomNav, SidebarNav, SessionGuard) doesn't depend on it. Pass `persona={null}` for unresolved state and let `SidebarNav` render a placeholder pill (existing component behaviour — confirm). Hard-skeleton the persona-dependent affordances until the API returns.

```tsx
'use client'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/dashboard/bottom-nav'
import SidebarNav from '@/components/dashboard/sidebar-nav'
import SessionGuard from '@/components/auth/session-guard'

interface PersonaData {
  name: string | null
  tagline: string | null
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [persona, setPersona] = useState<PersonaData | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadPersona() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) {
          if (!cancelled) setPersona({ name: null, tagline: null })
          return
        }
        const json = await res.json()
        if (cancelled) return
        if (json.success && json.data) {
          // /api/profile returns { display_name, business_name, business_type, ... }
          // The original loadPersona() mapped business_name || display_name as
          // the "name" and business_type → translated tagline. The translation
          // happens client-side via useTranslations now; we ship raw values and
          // SidebarNav handles the i18n lookup.
          setPersona({
            name: json.data.business_name ?? json.data.display_name ?? null,
            tagline: json.data.business_type ?? null,
          })
        } else {
          setPersona({ name: null, tagline: null })
        }
      } catch {
        if (!cancelled) setPersona({ name: null, tagline: null })
      }
    }
    loadPersona()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <SessionGuard />
      <SidebarNav persona={persona ?? { name: null, tagline: null }} />
      <div className="tablet:ml-60">{children}</div>
      <BottomNav />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `,
        }}
      />
    </>
  )
}
```

### Caveats

- **`SidebarNav` must accept `null` name/tagline** and render a placeholder pill (e.g., "Boss" / "Mga gawain") without flashing empty space. **Verify the component already handles this** — if not, that's a 10-LOC change in the same PR.
- **`/api/profile` shape:** the route returns `business_type` as a raw code (`'food_baking'`, `'other:beadwork'`). The original `loadPersona()` translated this via `getTranslations('nav')` server-side. **Engineer action:** move the translation into `SidebarNav` (use `useTranslations('nav')` there) so the layout doesn't import next-intl.
- **`metadata` export:** drop. PWA manifest is still served via `public/manifest.json` referenced from `app/layout.tsx` (root). The `(app)` layout's metadata was redundant.
- **Tablet/desktop layout shift:** `tablet:ml-60` applies before persona resolves — no shift since width doesn't depend on persona.

---

## 9. Suspense audit

Files that read `useSearchParams()` (or `useParams()` for dynamic routes — note: `useParams` does NOT require Suspense, only `useSearchParams` does):

| File | Reads | Suspense required? |
|---|---|---|
| `app/(app)/chat/page.tsx` | `useSearchParams()` for `topic`, `context` | **YES** — wrap inner component |
| `app/auth/callback/page.tsx` | `useSearchParams()` for `code`, `next`, `error` | **YES** — wrap inner component |
| `app/(app)/costing/[id]/page.tsx` | `useParams()` only | No |
| `app/(app)/invoices/[id]/page.tsx` | `useParams()` only | No |

Two files, two Suspense wrappers. No other consumers across the 15.

---

## 10. What to drop

- **`frontend/src/app/sitemap.ts`** — delete. Web-only; static native bundle does not need an XML sitemap. The Vercel SSR build path also doesn't need it strictly — sitemap was a SEO crawler aid that's irrelevant inside Capacitor. **Drop it from main entirely as part of Sprint 15.** Anton override: if SEO traffic matters for the public landing (Sprint 18+), restore as a build-time-only generator that emits a file to `public/sitemap.xml`.

---

## 11. Order of operations recommendation for engineer

To compile cleanly at each step (avoid the spike's 9-iteration build loop):

1. Update `next.config.js` first (§4). Do NOT yet set `CAPACITOR_BUILD=1`. Default web build must continue to pass.
2. Create `lib/rate-limit/middleware.ts` (§5). Add to one route (`/api/chat`) first as a smoke; the rest after page conversions land.
3. Rewrite `lib/i18n/request.ts` and `lib/i18n/set-locale.ts` (§6). Web build still passes because the resolver returns `defaultLocale` which is valid.
4. Delete `app/sitemap.ts` (§10).
5. Rewrite `app/(app)/layout.tsx` (§8). Run `npm run build` (web) — should still pass.
6. Convert pages in this order (smallest-blast-radius first):
   1. `app/(app)/admin/page.tsx` (add `'use client'` only)
   2. `app/(app)/costing/new/page.tsx` (already client; add auth gate)
   3. `app/(app)/deadlines/page.tsx`
   4. `app/(app)/scan/page.tsx` (copy spike)
   5. `app/(app)/chat/page.tsx` (copy spike)
   6. `app/(app)/costing/page.tsx`, `[id]/page.tsx`
   7. `app/(app)/invoices/page.tsx`, `new/page.tsx`, `[id]/page.tsx`
   8. `app/(app)/expenses/page.tsx`
   9. `app/(app)/profile/page.tsx`
   10. `app/(app)/onboarding/page.tsx` (after `GET /api/onboarding` is added)
   11. `app/(app)/dashboard/page.tsx` (after `/api/dashboard` shape extension)
   12. `app/page.tsx` (root)
7. Rewrite `auth/callback` (§7): delete `route.ts`, add `page.tsx`.
8. Per-route rate-limit adoption (§5 table) — batch into one commit after all pages compile.
9. Run `CAPACITOR_BUILD=1 npm run build` for the first time. Expect 0-2 iteration build loop (vs spike's 9 — the spike was discovery, this is execution).

---

## 12. References

- Spike findings: `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md`
- Spike code (canonical examples): `C:\Users\Anton del Rosario\akbai-spike\frontend\src\app\(app)\{chat,dashboard,scan}\page.tsx`
- ADR-019 (Accepted): `akbai-delivery/skills/solutions-architect/references/architecture-decisions.md` §1098
- API design reference: `akbai-delivery/skills/solutions-architect/references/api-design.md`
- Tech stack: `akbai-delivery/shared/tech-stack.md`

---

## 13. Hand-off

- **build-data:** no schema changes for Sprint 15. No new migrations. Skip.
- **build-engineer:** read this doc end-to-end; produce all 15+ files following §2 template, §3 inventory, §11 ordering. Each conversion is mechanical once the template is internalised.
- **build-qa:** test plan — for each of 15 pages, verify (a) `'use client'` renders without auth in SKIP_AUTH=true env, (b) auth redirect on no-session works in non-SKIP_AUTH builds, (c) error states show "Subukan muli" retry, (d) loading state appears for >0ms, (e) Suspense wrappers don't break SSR fallback. Specifically smoke `/chat?topic=2550M` (deadline deep-link) and verify `parseDeadlineContext` runs client-side.
- **review-security:** **flag in §7** — verify `exchangeCodeForSession` PKCE flow works in Capacitor WebView's localStorage sandbox. This is the only auth surface this sprint changes.
- **build-ux:** no UI changes per sprint scope. Skip.
- **build-ai:** no prompt changes. Skip.
