# AKBai — Architecture Decision Record Log
> Append new ADRs to this file. Never delete or renumber existing ADRs.
> Current highest: ADR-012
> Last updated: 2026-04-05

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Next.js 14 App Router as frontend framework | Accepted | 2026-03-14 |
| ADR-002 | Supabase as backend platform | Accepted | 2026-03-14 |
| ADR-003 | Xendit as payment processor | Accepted | 2026-03-14 |
| ADR-004 | Build 0 system prompt architecture | Accepted | 2026-03-20 |
| ADR-005 | Security hardening (subscriptions, fail-closed, IP rate limiting) | Accepted | 2026-03-20 |
| ADR-006 | UTC+8 (Asia/Manila) timezone enforcement | Accepted | 2026-03-22 |
| ADR-007 | Sentry error monitoring with @sentry/nextjs | Accepted | 2026-03-22 |
| ADR-008 | Onboarding rate-limit exemption (Gap E3) | Accepted | 2026-03-22 |
| ADR-009 | PostHog for product analytics (Gap A5) | Accepted | 2026-03-24 |
| ADR-010 | Saan Napunta expenses dashboard (Build 4) | Accepted | 2026-03-26 |
| ADR-011 | Ang Umaga Mo morning briefing (Build 5) | Accepted | 2026-03-28 |
| ADR-012 | Reply Drafter integration into Kai Chat | Accepted | 2026-04-05 |
| ADR-013 | Frontend Redesign Phase 4 — Brand Vocabulary component organization | Accepted | 2026-04-26 |

---

## ADR-001: Next.js 14 App Router as Frontend Framework

**Status:** Accepted
**Date:** 2026-03-14

**Context:**
AKBai needs a frontend framework that supports: mobile-first PWA deployment, server-side rendering for performance on Philippine LTE, a single codebase for both UI and API routes (solo founder can't maintain separate frontend/backend repos), and TypeScript for type safety with financial data.

**Decision:**
Use Next.js 14 with the App Router. Server Components by default to minimize client JavaScript. API routes for all server-side logic (Claude API calls, Supabase service role operations). Deploy to Cloudflare Pages.

**Alternatives Considered:**
- **Remix:** Strong server-side story, but smaller ecosystem and less community support for PWA patterns. Cloudflare Pages adapter less mature than Next.js.
- **SvelteKit:** Excellent performance, but smaller talent pool if Anton ever hires. Less ecosystem support for the specific integrations needed (Supabase, Anthropic SDK).
- **Plain React SPA + Express backend:** Two codebases to maintain. Solo founder overhead is doubled. No built-in SSR means worse mobile performance.
- **Next.js Pages Router:** Stable but App Router offers Server Components (critical for bundle size), streaming (useful for AI responses), and is the direction the framework is heading.

**Consequences:**
- Server Components reduce client bundle significantly (target: < 200KB gzipped)
- App Router's `loading.tsx` and `error.tsx` conventions provide structured UX patterns
- API routes live in the same repo — one deploy, one CI pipeline
- Cloudflare Pages has good Next.js support but some edge cases with middleware — may need Vercel fallback
- Learning curve: App Router patterns (Server vs Client Components, data fetching) differ from traditional React

**Review Trigger:** If Cloudflare Pages compatibility becomes a blocking issue, evaluate Vercel as primary host.

---

## ADR-002: Supabase as Backend Platform

**Status:** Accepted
**Date:** 2026-03-14

**Context:**
AKBai needs: a Postgres database with row-level security (financial data isolation), user authentication (email magic link), file storage (receipt images), edge functions for webhooks, and realtime subscriptions (Phase 2 multi-seat). A solo founder can't set up and maintain separate services for each of these.

**Decision:**
Use Supabase as the unified backend platform — Postgres, Auth, Storage, Edge Functions, and Realtime from a single provider. RLS on every table scoped to `auth.uid() = user_id`.

**Alternatives Considered:**
- **Firebase:** No Postgres (Firestore is NoSQL), weaker RLS model, vendor lock-in to Google ecosystem. Financial data benefits from relational modeling and SQL.
- **PlanetScale + Clerk + S3 + separate serverless functions:** Best-of-breed for each concern, but 4+ services to manage, 4+ billing relationships, 4+ potential failure points. Solo founder overhead is prohibitive.
- **Self-hosted Postgres + custom auth:** Maximum control but maximum maintenance. Unacceptable for a solo founder with 10-15 hours per sprint.
- **Neon (serverless Postgres) + Auth0 + Cloudflare R2:** Viable but more moving parts than Supabase. Auth0 free tier is limited. No built-in Edge Functions.

**Consequences:**
- Single dashboard for DB, auth, storage, functions, and realtime — massive operational simplification
- RLS is native to Supabase/Postgres — data isolation enforced at the database layer, not just the application layer
- Edge Functions (Deno runtime) are co-located with the database — low latency for webhook processing
- Vendor dependency: if Supabase has an outage, everything goes down. Mitigate with UptimeRobot monitoring and incident runbook.
- Supabase free tier is generous for MVP. Pro plan ($25/mo) when user count requires it.
- Point-in-time recovery must be explicitly enabled on paid plan before production financial data is stored (Gap D5).

**Review Trigger:** If Supabase pricing becomes > 10% of MRR, evaluate self-hosted Supabase or migration to separate services.

---

## ADR-003: Xendit as Payment Processor

**Status:** Accepted
**Date:** 2026-03-14

**Context:**
AKBai needs subscription billing with GCash as the primary payment method. Target users (Filipino MSMEs) predominantly use GCash for digital payments. The payment processor must support: recurring subscriptions, GCash, credit/debit cards, webhooks for real-time payment status, and be legally operational in the Philippines.

**Decision:**
Use Xendit for all payment processing. GCash as the primary payment method, with credit/debit cards and OTC (over-the-counter) as secondary options. Webhook events processed by a Supabase Edge Function with idempotency protection.

**Alternatives Considered:**
- **Stripe:** Gold standard for developer experience, but GCash support in the Philippines is limited/unavailable. Stripe Atlas is US-focused. Not optimized for Philippine payment methods.
- **PayMongo:** Philippine-native, good GCash support. However, Xendit has broader Southeast Asian presence (useful if AKBai expands regionally) and more mature subscription/recurring billing APIs.
- **Dragonpay:** Established Philippine payment gateway. Supports GCash and OTC. But the developer experience and API design are dated compared to Xendit. Webhook reliability is reported as inconsistent.
- **Manual GCash collection only:** Zero platform fees, but doesn't scale past ~50 users. Acceptable as Phase 0C fallback ("Concierge GCash") while Xendit KYC is pending, but not as the permanent solution.

**Consequences:**
- GCash as primary method aligns with target users' payment habits
- Xendit's subscription API handles recurring billing, retries, and dunning
- Webhook processing needs idempotency protection — Xendit can fire duplicate webhooks on retry (Gap D2, CRITICAL)
- Xendit KYC process may take 2-4 weeks. Concierge GCash is the bridge for early users.
- Transaction fees: ~2.5-3.5% per GCash transaction. Factor into unit economics.
- Xendit SDK has good Node.js support — integrates cleanly with Next.js API routes

**Review Trigger:** If Stripe launches full GCash support in PH, re-evaluate. Stripe's developer experience is superior.

---

## ADR-004: Build 0 System Prompt Architecture

**Status:** Accepted
**Date:** 2026-03-20

**Context:**
AKBai's AI partner (KA/Kai) needs a modular prompt system that supports 6 features (general chat, receipt scanning, morning briefing, reply drafting, expense classification, intent classification), 3 user tiers with different model routing, guardrails (BIR disclaimer, injection defense, output filtering), and a circuit breaker for cost control. The existing `/api/chat/route.ts` had a hardcoded inline system prompt, always used Sonnet, and had no guardrails. Every subsequent build (1–8) depends on this foundation.

**Decision:**
Create a `/lib/claude/` module with 6-layer prompt assembly, model routing, guardrails pipeline, and circuit breaker. Structure:

- **6-layer prompt assembly** (`assemble.ts`): Core Persona → Domain Scopes → Feature Context → User Context (interpolated at runtime). Conversation history and current message are passed in the `messages` array, not the system prompt.
- **Model routing** (`model-router.ts`): Haiku (`claude-haiku-4-5-20251001`) for free tier and extraction tasks (resibo_scanner, classify_expense, classify_intent). Sonnet (`claude-sonnet-4-6`) for pro/business reasoning tasks (general_chat, morning_briefing, reply_drafter).
- **Guardrails pipeline** (`guardrails.ts`): Input sanitization (7 injection patterns, detect-and-log, never reject) → Claude API call → Output filtering (7 leakage patterns) → BIR disclaimer (17 trigger patterns, dedup check).
- **Circuit breaker** (`circuit-breaker.ts`): Daily spend caps ($5 global, $0.50/user), free tier 10-query/day limit. Uses `daily_api_spend` table with `increment_daily_spend` RPC for atomic upsert. Asia/Manila timezone for date boundaries.
- **Domain-expandable design**: Modular scope sections (`[TAX_SCOPE]`, `[FINANCIAL_SCOPE]`, `[COMMUNICATION_SCOPE]`) so Phase 4+ domains (Marketing, HR, Inventory) can be added as new scope entries without rewriting the assembler.

**Alternatives Considered:**
- **Single monolithic system prompt:** Simpler initially but impossible to maintain across 6+ features. No way to route models or apply feature-specific guardrails.
- **LangChain/LlamaIndex orchestration:** Adds heavy dependencies (~50MB+) for functionality we can implement in ~500 lines. Solo founder can't maintain framework upgrades alongside product development.
- **Prompt stored in database:** Enables runtime editing but adds latency (DB read per request), complicates versioning, and is premature — prompt changes are infrequent at this stage.
- **Middleware-based guardrails (separate service):** Better separation of concerns but adds a network hop, a second deployment target, and operational complexity. Inline guardrails in the same module are sufficient for current scale.

**Consequences:**
- All 6 features share the same core persona and guardrails — consistency enforced architecturally
- Model routing saves ~80% on API costs for extraction tasks (Haiku vs Sonnet)
- Circuit breaker prevents runaway costs — hard cap at $5/day global, $0.50/day per user
- Free tier is sustainably limited to 10 queries/day without complex rate limiting infrastructure
- 31 regression tests validate prompt assembly, routing, guardrails, and circuit breaker
- Adding a new feature requires: one entry in `features.ts`, one entry in `DEFAULT_SCOPES`, one entry in `SONNET_FEATURES` (if applicable)
- Adding a new domain scope requires: one entry in `scopes.ts`, update relevant feature defaults in `DEFAULT_SCOPES`

**Review Trigger:** If prompt complexity exceeds ~20KB assembled or feature count exceeds 12, evaluate moving to a prompt registry with versioning and A/B testing support.

---

## ADR-005: Security Hardening — Subscriptions Table, Fail-Closed Circuit Breaker, IP Rate Limiting

**Status:** Accepted
**Date:** 2026-03-20

**Context:**
An external security audit identified 4 vulnerabilities in AKBai's Supabase + Claude API architecture. Three required code changes: (1) user tier stored in a user-writable JSONB column, allowing self-upgrade to Pro; (2) no IP-based rate limiting, enabling mass free account abuse; (3) circuit breaker failing open when Supabase is unavailable, allowing unbounded API spend.

**Decision:**
Three changes, in order of severity:

1. **Subscriptions table isolation:** Create a `subscriptions` table with SELECT-only RLS. Users can read their tier but cannot modify it. Only the service role (backend/Xendit webhook) can write. The `set_user_tier` RPC handles Anton's manual upgrades and future Xendit webhook integration. A `protect_feature_flags()` trigger on the `users` table silently reverts any user-initiated change to `feature_flags`.

2. **Fail-closed circuit breaker:** If `createServiceClient()` fails or `checkCircuitBreaker()` throws, the chat route returns a 503 with a Taglish maintenance message. Previously, these failures silently disabled all spend protection. Additionally, Anton sets a $150/month hard cap in the Anthropic Console as an external safety net.

3. **In-memory IP rate limiting:** A sliding window rate limiter in `proxy.ts` limits `/api/*` routes to 20 requests per minute per IP. Uses an in-memory `Map` (suitable for single-instance Vercel deployment). Includes automatic cleanup and a 10,000-entry hard cap as a DDoS safety valve.

**Alternatives Considered:**
- **Column-level RLS for feature_flags:** PostgreSQL doesn't support column-level RLS. A trigger-based approach is cleaner and achieves the same result.
- **Redis/Vercel KV for rate limiting:** Overkill for Phase 0-1 with a single Vercel instance. The in-memory approach resets on cold starts, which is acceptable (infrequent, and a brief reset is not exploitable).
- **Cloudflare WAF for IP limiting:** The production-grade solution, but AKBai is on Vercel in Phase 1. Documented as the Month 7+ replacement when migrating to Cloudflare Pages.
- **Fail-open with logging:** The previous approach. Rejected because a Supabase outage + fail-open = unbounded Anthropic spend, and a solo founder at a day job cannot respond in real-time.

**Consequences:**
- Tier self-upgrade attack vector is fully closed — subscriptions table is read-only for users
- Circuit breaker failure now blocks AI requests rather than allowing them — brief downtime is preferable to unbounded spend
- IP rate limiting adds a layer of defense against mass account creation abuse
- `set_user_tier` RPC provides a clean interface for both manual and automated tier changes
- In-memory rate limiter has no persistence — limits reset on Vercel cold starts (acceptable tradeoff)
- The `protect_feature_flags` trigger adds minimal overhead to user UPDATE operations

**Review Trigger:** When migrating to Cloudflare Pages (Month 7+), replace in-memory rate limiter with Cloudflare WAF rules. When implementing Xendit webhook handler (Build 4), verify `set_user_tier` RPC integrates cleanly.

---

## ADR-006: UTC+8 (Asia/Manila) Timezone Enforcement

**Status:** Accepted
**Date:** 2026-03-22

**Context:**
AKBai serves Filipino MSMEs whose tax obligations, financial reporting, and business operations all follow Philippine Standard Time (UTC+8). BIR filing deadlines are date-specific in PHT. Daily spend caps in the circuit breaker must reset at midnight Manila time. Morning briefings and push notifications must arrive at the right local hour. The existing codebase had a `getTodayManila()` helper inlined in `circuit-breaker.ts` but no shared utility, creating a risk of inconsistent timezone handling as more features are built.

**Decision:**
Create a shared `@/lib/timezone` module as the single source of truth for all Manila timezone operations. The module provides:

1. **`MANILA_TZ`** constant (`'Asia/Manila'`) — avoid hardcoded timezone strings throughout the codebase
2. **`toManila(date?)`** — converts any Date to a Manila-equivalent Date using `Intl.DateTimeFormat` with `formatToParts`, storing Manila local time in UTC fields for compatibility with `date-fns`
3. **`formatManilaDate(date?, formatStr?)`** — format any date in Manila time using date-fns format strings
4. **`getManilaToday()`** — returns today as `YYYY-MM-DD` in Manila (used for circuit breaker daily boundaries, query limits)
5. **`getManilaTimestamp()`** — returns current Manila time as ISO string with `+08:00` offset
6. **`toManilaSQL(column)`** — returns `column AT TIME ZONE 'Asia/Manila'` SQL fragment for Supabase raw queries

All existing Manila timezone logic (circuit-breaker.ts `getTodayManila()`) has been refactored to use this shared module.

**Alternatives Considered:**
- **Store all dates in UTC, convert at display layer:** Standard practice for global apps, but error-prone for a solo founder codebase — every developer (including AI assistants) must remember to convert. BIR deadlines are inherently PHT dates, not UTC. Rejected as too risky for financial compliance.
- **Use a heavy timezone library (Luxon, Moment-Timezone):** Adds 50-200KB to the bundle for functionality that `Intl.DateTimeFormat` (built into all modern runtimes) handles natively. Rejected — Intl API + date-fns is sufficient and zero additional dependencies.
- **Use `@date-fns/tz` (TZDate):** The date-fns v4 companion package for timezone support. Not installed in the project and adds a dependency. The Intl-based approach achieves the same result with no extra packages. Can revisit if timezone math becomes more complex.

**Consequences:**
- All Manila timezone logic lives in one module — single source of truth, easy to audit
- Circuit breaker, daily spend caps, and query limits all use `getManilaToday()` for consistent daily boundaries
- Future features (morning briefing scheduling, BIR deadline watcher, push notifications) import from the same module
- `toManilaSQL()` ensures Supabase queries consistently apply timezone conversion
- 12 unit tests validate timezone boundary behavior (e.g., 11pm UTC = next day in Manila)
- No additional dependencies — uses built-in `Intl.DateTimeFormat` + existing `date-fns`

**Review Trigger:** If AKBai expands to other ASEAN markets with different timezones, evaluate whether the module should support multiple timezone targets or if per-user timezone preferences are needed.

---

## ADR-007: Sentry Error Monitoring with @sentry/nextjs

**Status:** Accepted
**Date:** 2026-03-22

**Context:**
AKBai has zero production visibility without error monitoring (Gap A4). As a solo founder with a day job, Anton cannot watch logs or monitor a production app in real-time. Errors in production — failed Claude API calls, Supabase timeouts, payment webhook failures — would go undetected until a user complains (or churns). Async error awareness via email/mobile alerts is essential for a solo operator running a financial product.

**Decision:**
Use Sentry via `@sentry/nextjs` with the following configuration:

1. **Client + server initialization** (`sentry.client.config.ts`, `sentry.server.config.ts`): DSN from environment variable, enabled only in production. Low `tracesSampleRate` (0.1) to keep costs within solo founder budget. Session replay disabled (`replaysSessionSampleRate: 0`), error replay at 10%.
2. **Next.js instrumentation** (`instrumentation.ts`): Uses Next.js `register()` hook to load server config for both Node.js and edge runtimes. Exports `onRequestError` for automatic server-side error capture.
3. **Source map uploads** via `withSentryConfig` wrapper in `next.config.js`: Enables readable stack traces in Sentry dashboard. `widenClientFileUpload` ensures all client chunks are uploaded. `silent` mode outside CI to reduce build noise.
4. **Global error boundary** (`src/app/global-error.tsx`): Catches unhandled errors at the app root, reports to Sentry via `captureException`, and shows a Taglish error page with a retry button. Uses AKBai's ink/amber brand colors.
5. **Environment variables**: `NEXT_PUBLIC_SENTRY_DSN` for client+server DSN, `SENTRY_ORG` and `SENTRY_PROJECT` for source map uploads, optional `SENTRY_AUTH_TOKEN` for CI/CD.

**Alternatives Considered:**
- **LogRocket:** Session replay + error tracking in one tool. But heavier SDK (~100KB+), more expensive at scale, and session replay is not a priority for a pre-launch product. Sentry's free tier (5K errors/month) is more than sufficient for Phase 0-1.
- **console.log + Vercel Logs:** Zero cost but no alerting, no aggregation, no stack trace deobfuscation. Requires manually checking the Vercel dashboard — incompatible with a solo founder's async workflow.
- **Bugsnag:** Comparable error monitoring with good Next.js support. Smaller ecosystem than Sentry, fewer integrations, and Sentry's free tier is more generous. No compelling reason to choose Bugsnag over the industry standard.
- **Custom error reporting to Supabase:** Log errors to a Supabase table and build custom alerting. Massive yak-shave for a solo founder — Sentry solves this out of the box with email, Slack, and mobile alerts.

**Consequences:**
- Production errors are visible immediately via Sentry email/mobile alerts — no manual log checking required
- Source maps enable fast debugging with readable stack traces instead of minified code
- Low `tracesSampleRate` (0.1) keeps Sentry within the free tier for early usage
- `global-error.tsx` provides a branded, Taglish error page instead of the default Next.js error screen
- Sentry is disabled in development (`enabled: process.env.NODE_ENV === 'production'`) to avoid noise during local work
- Requires `NEXT_PUBLIC_SENTRY_DSN` to be set in production environment — app works without it but errors go unreported
- `SENTRY_AUTH_TOKEN` needed in CI/CD for source map uploads — without it, stack traces in Sentry will show minified code

**Review Trigger:** If Sentry costs exceed the free tier (5K errors/month), evaluate whether the error volume indicates a real problem (fix the bugs) or if sample rates need further reduction. When AKBai reaches Phase 2 (multi-seat), evaluate adding Sentry user context for per-business error tracking.

---

## ADR-008: Onboarding Rate-Limit Exemption (Gap E3)

**Status:** Accepted
**Date:** 2026-03-22

**Context:**
AKBai's free tier enforces a 10-query/day limit via the circuit breaker (`circuit-breaker.ts` line 54). This limit is checked before every Claude API call in `/api/chat/route.ts`. However, Kilala Kita onboarding uses static templates (not Claude API calls) for the 5-step flow and first KA response. The risk is that if any chat query happens before `onboarding_completed` is set to `true`, it could count toward the daily limit. Gap E3 (CRITICAL) states: "Free tier 10-query/day limit must NOT apply during Kilala Kita onboarding. Users who hit the paywall before the 'Maria Moment' (first actionable insight) will churn."

**Decision:**
Add an optional `onboardingCompleted` parameter to `checkCircuitBreaker()`. When `onboardingCompleted === false`, the free tier 10-query daily limit is bypassed. All other caps (per-user spend, global spend) still apply — this exemption is narrowly scoped to the query counter only, not the cost caps.

Implementation:
1. **`circuit-breaker.ts`** — Add 5th parameter `onboardingCompleted?: boolean`. Modify the free tier check (line 54) to: `if (tier === 'free' && onboardingCompleted !== false && userQueryCount >= 10)`. Safe default: `undefined` (existing callers without the param) still enforces the limit.
2. **`/api/chat/route.ts`** — Extend the `users` query to include `onboarding_completed`. Pass it as the 5th argument to `checkCircuitBreaker()`.
3. **Tests** — 3 new test cases verifying the exemption logic for `false`, `true`, and `undefined` values.

**Alternatives Considered:**
- **Separate onboarding API route that skips the circuit breaker entirely:** Onboarding already uses static templates (no API calls), so this would only apply to post-onboarding pre-dashboard chat. Adds routing complexity for a narrow window of time. Rejected — modifying the existing check is simpler.
- **Set `onboarding_completed` to `true` immediately and reset query counter:** Race condition risk — if onboarding fails mid-flow, the user loses their exemption. Also, resetting counters is a write operation that adds complexity. Rejected.
- **Use a separate `onboarding_queries` counter that doesn't count toward the daily limit:** Adds a new column, a new RPC, and migration for a transient state that only exists during first use. Over-engineered for the problem. Rejected.

**Consequences:**
- Free tier users can chat during onboarding without hitting the 10-query wall
- The exemption is narrowly scoped: only the query counter is bypassed, not the spend caps ($0.50/user, $5 global)
- Safe default behavior: callers without the new parameter (including tests, other API routes) still enforce the limit
- Backward-compatible: no changes to `checkCircuitBreaker` type signature required (optional param with `undefined` default)
- 3 new tests ensure the exemption works correctly and the safe default is verified

**Related Gaps:**
- Addresses Gap E3 (CRITICAL) — Onboarding rate-limit exemption
- Depends on Sprint 3 Task 2 (schema adds `onboarding_completed` column to `users` table)

**Review Trigger:** If additional pre-onboarding features are added that require Claude API calls (e.g., a pre-onboarding assessment), evaluate whether the exemption scope needs to expand beyond just the query counter.

---

## ADR-009: PostHog for Product Analytics (Gap A5)

**Status:** Accepted
**Date:** 2026-03-24

**Context:**
AKBai has no product analytics to measure user behavior, feature adoption, or onboarding completion rates (Gap A5). The 8 Sense Check Gate signals — including onboarding completion rate, return chat sessions, and dashboard engagement — require an analytics baseline before Phase 0C. Without instrumentation, Anton has no data to validate whether the "Maria Moment" (first actionable insight) is actually landing, whether users complete onboarding, or which features drive retention. A solo founder cannot make informed product decisions based on gut feel alone.

**Decision:**
Use PostHog Cloud (free tier, 1M events/month) with a dual-client architecture:

1. **Client-side (`posthog-js`):** Initialized via a `PostHogProvider` React context wrapper in the root layout. Handles automatic pageview capture, user identification via Supabase auth session, and typed event tracking. Project API key (`NEXT_PUBLIC_POSTHOG_KEY`) is a publishable key safe for client-side use. PostHog Cloud host: `https://us.i.posthog.com`.

2. **Server-side (`posthog-node`):** Singleton client created via `getPostHogServer()` for server-side event tracking in API routes and server actions. Uses `POSTHOG_PERSONAL_API_KEY` — a server-side secret that must never be exposed to the client.

3. **Typed event functions:** All event tracking goes through typed wrapper functions in `@/lib/posthog/events.ts`, not raw `posthog.capture()` calls scattered across the codebase. Initial 5 events:
   - `onboarding_started` — user begins Kilala Kita flow
   - `onboarding_completed` — user finishes onboarding (includes `business_type` property)
   - `chat_message_sent` — user sends a message to Kai
   - `dashboard_viewed` — user views dashboard
   - `receipt_scanned` — future OCR feature (includes `success` property)

4. **User identification:** When a Supabase auth session exists, `posthog.identify(user.id)` is called with the user's email as a property. Auth state changes (login/logout) trigger identify/reset respectively.

5. **Development mode:** PostHog debug mode is enabled in development (`posthog.debug()`), which logs events to the console without sending them to PostHog Cloud.

**Alternatives Considered:**
- **Mixpanel:** Comparable product analytics with strong funnel analysis. However, PostHog's free tier is more generous (1M vs 100K events/month), PostHog is open-source (self-hostable if needed later), and PostHog's session recording feature (disabled for now) can be enabled without switching tools.
- **Google Analytics 4:** Free and ubiquitous, but GA4's event model is awkward for product analytics (designed for web marketing, not SaaS feature tracking). No server-side SDK for Node.js. Data retention is limited on the free tier. Privacy concerns with Google data processing for Philippine users.
- **Amplitude:** Strong product analytics, but free tier is limited to 10M events/month with data retention caps. More complex SDK setup than PostHog. No self-hosting option.
- **Custom events to Supabase table:** Zero external dependency, but requires building dashboards, funnels, cohort analysis, and retention charts from scratch. Massive yak-shave for a solo founder — PostHog provides all of these out of the box.
- **No analytics until Phase 1:** Violates the Sense Check Gate requirement. Without a pre-launch analytics baseline, there's no way to measure whether Phase 0C changes improve or regress key metrics.

**Consequences:**
- 5 core events provide an analytics baseline for the 8 Sense Check Gate signals
- Typed event functions prevent typo-based silent failures (e.g., `onboarding_comepleted` would be a compile error)
- PostHog's free tier (1M events/month) is more than sufficient for Phase 0-1 scale
- Minimal bundle impact: posthog-js is ~5KB gzipped, loaded asynchronously
- PostHog Cloud (US region) adds ~50-100ms latency for event ingestion from the Philippines — acceptable for analytics (non-blocking, fire-and-forget)
- User identification links anonymous pre-auth pageviews to authenticated user IDs after login
- Server-side client enables future server-side event tracking (e.g., API route performance, webhook processing) without client-side dependency
- Adding a new event requires: one constant in `EVENTS`, one typed function in `events.ts`, one call at the relevant UI touchpoint

**Related Gaps:**
- Resolves Gap A5 — Analytics baseline (PostHog)

**Review Trigger:** If PostHog event volume approaches 1M/month (unlikely before Phase 2), evaluate paid tier or self-hosting. When session recording is needed for UX research, enable PostHog's built-in recorder instead of adding a separate tool.

---

## ADR-010: Saan Napunta Expenses Dashboard (Build 4)

**Status:** Accepted
**Date:** 2026-03-26

**Context:**
Filipino MSMEs track expenses in notebooks or not at all. AKBai's "Saan Napunta?" feature gives users visibility into spending by category with monthly insights. Build 4 — the first financial data surface beyond the daily check-in. Needs: manual expense/income entry, check-in data integration, category breakdown visualization, and future OCR receipt reconciliation prep.

**Decision:**
1. **`transactions` table** (migration 008): TEXT columns for `type`, `category`, `source` with Zod validation at application layer. 10 expense categories + 3 income categories based on MSME research.
2. **`/api/expenses` route**: Full CRUD (GET with monthly aggregation, POST, PATCH, DELETE soft-delete). Single response returns paginated list + summary.
3. **CSS-only category chart**: Horizontal bars with percentage widths — zero bundle cost.
4. **Check-in → expenses integration**: Dashboard POST creates transactions from check-in financial data with `source: 'check_in'`. Soft-deletes previous check-in transactions on re-submit.
5. **Reconciliation prep** (migration 009): `reconciliation_status` + `reconciled_with_id` columns for future OCR matching.

**Alternatives Considered:**
- **Chart.js/Recharts:** 30-100KB bundle for one bar chart. CSS bars suffice. Rejected.
- **Postgres ENUMs:** Painful to extend via migrations. TEXT + Zod is more flexible. Rejected.
- **Separate income/expense tables:** UNION queries needed. Single table with type discriminator is simpler. Rejected.

**Consequences:**
- Users see spending breakdown by category at a glance
- Check-in data flows into transactions automatically
- Reconciliation schema ready for future OCR matching
- 52+ tests across schemas, categories, API, UI logic
- Dashboard Saan Napunta card now data-driven
- 2 new PostHog events: `expense_added`, `expense_deleted`

**Related Gaps:**
- Addresses Gap B5 (Saan Napunta empty state now shows real data)
- Prep for Gap E1 (reconciliation schema for OCR receipt matching)

**Review Trigger:** When OCR receipt scanning is functional (Gap E1), implement reconciliation UI using `reconciliation_status` and `reconciled_with_id` columns.

---

## ADR-011: Ang Umaga Mo Morning Briefing (Build 5)

**Status:** Accepted
**Date:** 2026-03-28

**Context:**
Build 5 adds "Ang Umaga Mo" -- a proactive morning briefing card on the dashboard that summarizes yesterday's transactions, current cash position, and upcoming BIR deadlines. This is the first feature where KA speaks *first* (proactive AI, not reactive chatbot). The briefing requires a Claude Sonnet call with aggregated financial context, but the content is static for the day -- a user checking the dashboard 5 times should not trigger 5 API calls. The feature is Pro+ only (free tier sees an upgrade CTA). The constraint is no new Supabase tables.

**Decision:**
Five linked decisions covering caching, time gating, tier gating, data flow, and component structure.

### 1. Caching: Extend `daily_check_in` with a `briefing_content` column

Add a nullable `briefing_content TEXT` column to the existing `daily_check_in` table (new migration). The morning briefing API route checks for an existing `daily_check_in` row for today where `briefing_content IS NOT NULL`. If found, return the cached content (zero Claude calls). If not found, aggregate data, call Claude Sonnet, then upsert the row with `briefing_content` set.

This gives exactly one Claude call per user per day. The cache key is the natural `(user_id, check_in_date)` unique constraint already on `daily_check_in`. If the user has not checked in yet today, a row is created with `mood = NULL` and `kai_greeting` set to a default -- the check-in POST later upserts over it without clearing `briefing_content`.

### 2. Time gating: 5AM-12PM Manila window, server-side enforcement

The `/api/morning-briefing` route uses `toManila()` from `@/lib/timezone` to get the current Manila hour. If the hour is outside 5-11 (inclusive, meaning 5:00 AM through 11:59 AM), the route returns a 200 with `{ available: false, reason: 'outside_window' }` and a Taglish message ("Bukas ulit, Boss! Ang Umaga Mo is available 5AM-12PM."). The dashboard card reads this and shows an appropriate state.

This is a soft gate -- the briefing is *generated* only during the window, but a cached briefing from this morning is still *served* outside the window. The time check only blocks the Claude API call, not reads from cache.

### 3. Tier gating: Pro+ only, free tier sees upgrade CTA

The route checks the user's subscription tier (same pattern as `/api/chat/route.ts` -- query `subscriptions` table). Free tier gets a 200 response with `{ available: false, reason: 'tier_required', requiredTier: 'pro' }`. The dashboard card renders an upgrade CTA with Taglish copy ("I-upgrade sa Pro para makita ang Umaga Mo!"). Feature flag `MORNING_BRIEFING_ENABLED` (already defined in `flags.ts`) provides a kill switch.

### 4. Data flow: aggregate -> Claude -> cache -> serve

```
GET /api/morning-briefing
  |-> Auth check (Supabase cookie)
  |-> Feature flag check (MORNING_BRIEFING_ENABLED)
  |-> Tier check (Pro+ required)
  |-> Cache check (daily_check_in.briefing_content for today)
  |   |-> HIT: return cached content (no Claude call)
  |   |-> MISS:
  |       |-> Time window check (5AM-12PM Manila)
  |       |-> Aggregate context:
  |       |     - Yesterday's transactions (from `transactions` table)
  |       |     - Current cash position (sum of all non-deleted transactions)
  |       |     - BIR deadlines next 7 days (hardcoded Phase 0 calendar)
  |       |-> Assemble system prompt (morning_briefing feature)
  |       |-> Claude Sonnet call (max_tokens: 1024)
  |       |-> Output guardrails (BIR disclaimer, output filtering)
  |       |-> Upsert to daily_check_in.briefing_content
  |       |-> Record spend (circuit breaker)
  |       |-> Return briefing
```

The route is GET (idempotent, cacheable) not POST, because the client is reading a briefing, not creating one. The Claude call is a side effect of a cache miss, but the response is deterministic for the day.

### 5. Component structure

```
frontend/src/
  lib/morning-briefing/
    aggregate.ts       -- Fetches and computes summary stats from transactions + deadlines
    types.ts           -- BriefingContext, BriefingResponse, AggregatedData types
  app/api/morning-briefing/
    route.ts           -- GET handler (auth, tier, cache, aggregate, Claude, cache write)
  app/(app)/(features)/dashboard/
    components/
      MorningBriefingCard.tsx  -- Client component: fetch, loading/empty/error/upgrade states
```

The aggregation logic lives in `lib/` (testable in isolation). The API route orchestrates. The card is a client component (needs `useState` for loading states and `useEffect` for fetch-on-mount).

**Alternatives Considered:**

- **New `morning_briefings` table:** Cleaner separation but violates the "no new tables" constraint. The `daily_check_in` extension is pragmatic -- one column addition vs a full table with RLS policies, indexes, and migration. If briefing complexity grows (versioning, A/B testing), a dedicated table can be extracted later.

- **In-memory cache (Map) instead of DB:** Resets on every Vercel cold start. A user's first dashboard visit after a cold start would always trigger a Claude call. With ~20 cold starts/day on Vercel's free tier, this could mean 20 calls/user/day instead of 1. DB caching is the only reliable option.

- **Redis/Vercel KV:** Adds an external dependency and billing relationship for a simple key-value lookup that Postgres handles fine. Over-engineered for Phase 0.

- **POST route instead of GET:** Semantically wrong -- the client is requesting a briefing, not creating a resource. GET allows browser and CDN caching headers in the future. The Claude call on cache miss is an implementation detail, not a client-visible side effect.

- **Generate briefing via cron job (e.g., Supabase pg_cron at 5AM):** Would pre-generate for all Pro users. But at Phase 0 scale (<50 users), the complexity of cron setup, batch processing, and failure handling is not justified. Lazy generation on first visit is simpler and only generates for users who actually open the app.

- **Always serve cached briefing (no time window):** The time window exists to set user expectations -- "Ang Umaga Mo" is a morning ritual, not an all-day feature. Without the window, users might expect fresh briefings at 8PM. The window also naturally limits Claude API calls to morning hours.

**Consequences:**

- One Claude Sonnet call per Pro+ user per day -- cost-efficient, predictable spend
- `daily_check_in` table gains a `briefing_content` column -- minimal schema change, no new RLS policies needed (existing policies cover it)
- Morning briefing and daily check-in share a row -- the check-in upsert must preserve `briefing_content` (use column-specific upsert, not full row replace)
- Free tier users see the card with an upgrade CTA -- drives Pro conversion
- Feature flag provides instant kill switch if costs spike
- Aggregation logic is reusable for future features (weekly/monthly reports)
- Time window means users outside 5AM-12PM see a "come back tomorrow" state -- acceptable for Phase 0, can be relaxed later
- BIR deadlines are hardcoded for Phase 0 (no dynamic deadline table yet) -- sufficient for MVP, aligns with existing gap registry

**Related Gaps:**
- Offline UX (Gap registry item 5): cached briefing_content enables offline display of this morning's briefing

**Review Trigger:** If briefing content needs versioning (A/B testing prompt variants) or if the `daily_check_in` table becomes overloaded with unrelated columns, extract to a dedicated `morning_briefings` table. Also revisit when BIR deadline data moves from hardcoded to a dynamic table (Build 6).

---

## ADR-012: Reply Drafter Integration into Kai Chat

**Status:** Accepted
**Date:** 2026-04-05
**Context:** Sprint 10 live testing

**Decision:**

Integrate the Reply Drafter (Build 7) into the main Kai Chat interface rather than keeping it as a standalone page at `/reply-drafter`.

**Context:**

Reply Drafter was built in Sprint 9 as a standalone feature: `/reply-drafter` page with its own input form, Claude Haiku call, and results display. During Sprint 10 live testing, Anton identified that switching to a separate page to draft customer replies breaks the natural workflow. Users should be able to ask Kai "help me reply to this message" within the existing chat interface.

**Approach (Sprint 11):**

1. Add a "reply draft" intent detection to the chat routing — when user pastes a customer message and asks for a reply, route to the reply drafter prompt + Haiku model
2. Display reply options (short + detailed) as chat cards within the conversation, not a separate page
3. Keep copy-to-clipboard on each reply card
4. Keep output guardrails (no impersonation, commitments, or financial advice)
5. Remove the standalone `/reply-drafter` page and its dashboard card
6. Reuse `lib/reply-drafter/` (prompt, schemas, guardrails) — only the UI layer changes

**Consequences:**

- Better UX: users stay in one interface for all Kai interactions
- Removes a navigation step from the user flow
- Dashboard card for Reply Drafter is removed (one fewer card in the grid)
- Chat interface needs to handle multiple response types (text, reply drafts, briefings)
- `REPLY_DRAFTER_ENABLED` feature flag still works — just gates the chat intent, not a page route

**Review Trigger:** If reply drafting needs more complex input (multiple messages, thread context, customer profile), it may need a dedicated UI again. Revisit if chat interface becomes overloaded with too many card types.

---

## ADR-013: Frontend Redesign Phase 4 — Brand Vocabulary Component Organization

**Status:** Accepted
**Date:** 2026-04-26

**Context:**
Frontend Redesign Phase 4 ports the Kai mark, decorative motifs, and brand icon set approved in the B4/B5 review repos ([`repos/icons.html`](../../../design_handoff_akbai_redesign/synthesis/repos/icons.html), [`repos/motifs.html`](../../../design_handoff_akbai_redesign/synthesis/repos/motifs.html)) into shippable React components. The existing illustration tree at [`frontend/src/components/illustrations/svg/`](../../../frontend/src/components/illustrations/svg/) already contains 48+ SVG illustrations (Kai expressions, expense categories, financial indicators, business types, status). Phase 4 must add new components without parallelizing or fragmenting the tree (Sprint 5 lesson — duplicate components fragmented the dashboard).

**Decision:**
- **Brand icons** (Resibo, Usap, Pera, Kalendaryo, Precio, Invoice, Checkin, SundayStory, Drafts, Sampaguita, plus 5 nav icons) live in a new directory `frontend/src/components/illustrations/icons/` — separate from existing `svg/` to make brand-icon set discoverable without confusing it with illustrations. Each icon is a standalone TSX component exporting a default-named function with `{ size?: number; color?: string; className?: string }` props. `currentColor` is the default fill so palette-context aware styling works.
- **Decorative motifs** (CapizPattern, FloatingPetals, WovenDivider, Squiggle, TapeStrip, SwayingLeaf, Sunburst, DoodleArrow) extend the existing `frontend/src/components/illustrations/svg/decorative/` directory. Each accepts shape-specific props (e.g., `<FloatingPetals count?={number} />`, `<Squiggle width?={number} color?={string} />`).
- **Kai composition** — new `frontend/src/components/illustrations/kai/kai.tsx` provides a single `<Kai expression size animated />` API that maps `expression` to the appropriate `Ka*` component from the existing `svg/ka-expressions/` tree. `KaiSitting` is a separate export — 168×168 hero version that wraps `kai-mark.png` in a circular mask for the home Kumustahan hero. The Kai mark asset is copied from `design_handoff_akbai_redesign/prototype/assets/kai-mark.png` to `frontend/public/icons/kai-mark.png` (canonical location per [`02-decisions.md`](../../../design_handoff_akbai_redesign/synthesis/02-decisions.md) Canonical Kai mark section).
- **Animation gating** — when `animated` is true on Kai, the component composes `animate-kai-bob` or `animate-kai-breathe` (Phase 3 keyframes); reduced-motion already gates these globally.
- **Index file expansion** — `svg/index.ts` re-exports new motifs; new `icons/index.ts` and `kai/index.ts` mirror that pattern.
- **No CSS-in-JS** — every component is plain TSX with Tailwind classes + inline SVG. Inline SVG keeps payload below the Phase 1.5 perf budget (≤ 200KB cold home load) without separate HTTP requests.
- **`lucide-react` retained** — utility roles (close, chevron, settings, search, filter) still come from `lucide-react`. Brand icons replace `lucide-react` only where the role is brand-load-bearing.

**Alternatives Considered:**
- **Inline icons in consumer components:** rejected — would scatter brand SVG across the codebase and make later visual tuning expensive.
- **Single `<BrandIcon name="resibo" />` with switch:** rejected — kills tree-shaking; importing one icon would pull in all 15 SVG strings.
- **Keep brand icons inside `svg/`:** rejected — illustrations and icons have distinct semantics (illustrations are 48–96px decorative, icons are 16–32px functional). Separating directories prevents accidental conflation.
- **Web font with custom glyphs:** rejected — adds a heavy build step and complicates color/animation control.

**Consequences:**
- **Positive:** Phase 5+ screens compose brand iconography from a single, consistent set. Each icon is independently tree-shakable. The Kai mark API is unified (`<Kai expression>`) so Phase 6 onboarding, Phase 7 home, Phase 9 deadlines callout, and Phase 10 Kuwento can swap Kai expressions by name without touching SVG. The motif primitives are inline and small enough that they don't dent the perf budget.
- **Negative:** ~15 new icon files + 6 new motif files = ~21 new TSX files. Discoverability is via `index.ts` re-exports, not file conventions. Reviewers must know to look at `illustrations/icons/` separately from `illustrations/svg/`.
- **Migration cost:** zero in Phase 4 (only adds files). Phase 5+ screens swap `lucide-react` imports for brand icons one-by-one when reskinned.

**Validation:**
- Vitest render tests — every new component renders without throwing, accepts `size` prop, renders correct viewBox.
- TypeScript typecheck — strict, no `any`, all SVG attributes typed.
- Playwright visual-parity test — capture each component at default size, diff against the approved repo HTML rendering ≤ 0.5%. (Build the parity test in Phase 4; harness already configured in `frontend/playwright.config.ts`.)

**Related:**
- Phase 2 verdicts B4 (icons), B5 (motifs) — both signed off 2026-04-26
- Sprint 5 lesson — reuse audit at [`04-reuse-audit.md`](../../../design_handoff_akbai_redesign/synthesis/04-reuse-audit.md) forbids parallel components
