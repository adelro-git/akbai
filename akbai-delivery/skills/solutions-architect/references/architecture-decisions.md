# AKBai — Architecture Decision Record Log
> Append new ADRs to this file. Never delete or renumber existing ADRs.
> Current highest: ADR-020
> Last updated: 2026-05-29 (Sprint 18 — ADR-020 added: reviewer demo-access + offline scan-queue patterns; Gap G7 code-side GREEN / 1716 tests. ADR-019 surface stays Accepted Green.)

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
| ADR-014 | SKIP_AUTH client consistency across server pages and API routes | Accepted | 2026-04-26 |
| ADR-015 | Frontend Redesign Phase 7 — `/api/weekly-story` endpoint shape | Accepted | 2026-04-26 |
| ADR-016 | Frontend Redesign Phase 8 — `/api/chat/suggestions` rule-based chips | Accepted | 2026-04-28 |
| ADR-017 | Frontend Redesign Phase 9 — Deadline → Chat deeplink contract | Accepted | 2026-04-28 |
| ADR-018 | Native mobile pivot via Capacitor + IAP (deprecate Xendit) | Accepted | 2026-05-24 |
| ADR-019 | Capacitor wrapping pattern (Sprint 14 spike findings) | Accepted (Green) — Sprint 15 conversion (Gap G1) + Sprint 16 plugins (Gap G4) both landed on main | 2026-05-27 |
| ADR-020 | Reviewer demo-access + offline scan-queue patterns (Sprint 18 pre-launch) | Accepted | 2026-05-29 |

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

---

## ADR-014: SKIP_AUTH Client Consistency Across Server Pages and API Routes

**Status:** Accepted
**Date:** 2026-04-26

**Context:**
Frontend Redesign Phase 6 smoke testing surfaced a defect: `(app)/onboarding/page.tsx` rendered the wizard "fresh" while `/api/onboarding` rejected every step with a 400 `ALREADY_COMPLETED`. Root cause: under `SKIP_AUTH=true` (dev mode), the page used the RLS-protected `createClient()` from `@/lib/supabase/server`, which has no real session and so RLS returned an empty result for `users`. The page treated `userData?.onboarding_completed` as `undefined` and rendered the wizard. Meanwhile `/api/onboarding/route.ts` already followed the dashboard pattern of `db = SKIP_AUTH ? createServiceClient() : supabase`, bypassing RLS and reading the actual prior-run state. Page and API disagreed about whether the user was onboarded.

The dashboard page already had this idiom right; the onboarding page was the outlier. Without an explicit rule, future server pages will repeat the same mistake.

**Decision:**

For any server component that:
1. Reads from Supabase, **and**
2. Has a corresponding API route that writes to the same row(s), **and**
3. Renders or redirects based on that row's state,

The page **must** use the same client-resolution pattern as its sibling API route under `SKIP_AUTH`:

```ts
const supabase = await createClient();
// ...auth resolution (SKIP_AUTH ? DEV_USER : supabase.auth.getUser())...
const db = SKIP_AUTH ? createServiceClient() : supabase;
// Use `db` for all queries that mirror API behavior.
```

The auth resolution itself stays as-is (the `SKIP_AUTH` branch returns `DEV_USER` directly without consulting the auth client). What changes is the **data** client used after auth — under `SKIP_AUTH`, both page and API read via the service role to bypass RLS and read DEV_USER's actual state.

**Why this matters:**
- Dev experience: walking the same flow end-to-end shouldn't surface ghost state where the page says "fresh" and the API says "completed."
- Production-safety: this is `SKIP_AUTH`-scoped only. In production (`SKIP_AUTH !== 'true'`), both page and API use the auth-bound client and inherit RLS exactly as before.
- Pattern consistency: any reviewer touching a new server page will see the established two-client idiom and copy it.

**Alternatives Considered:**
- **Make `createClient()` return the service client under `SKIP_AUTH`:** rejected — too magical. The auth client should always honor RLS; the choice to bypass RLS belongs at the call site so reviewers can see exactly when RLS is dropped.
- **Always use service client server-side:** rejected — production server components should respect RLS so a regression in user authorization fails closed, not silently leaks data.
- **Keep the bug and document a "reset DEV_USER between runs" workflow:** rejected — friction every new contributor would re-discover.

**Consequences:**
- **Positive:** dev-mode flows behave identically to production for state-driven server pages. The `frontend/scripts/reset-dev-onboarding.mjs` helper (committed `a748cea`) exists for state reset, not as a workaround for client-mismatch bugs.
- **Migration cost:** none in this ADR — the only known violator (`(app)/onboarding/page.tsx`) was fixed in commit `a72cf0c`. New server pages adopt the pattern by default.
- **Audit:** every existing server page that reads from a table mutated by an API route should confirm it uses the `db = SKIP_AUTH ? createServiceClient() : supabase` idiom. As of 2026-04-26: `(app)/dashboard/page.tsx`, `(app)/profile/page.tsx`, and `(app)/onboarding/page.tsx` all match.

**Validation:**
- Manual: under `SKIP_AUTH=true`, the user state seen by `GET /onboarding` must equal the state seen by `POST /api/onboarding` for the same DEV_USER.
- Smoke test: `node --env-file=.env.local scripts/reset-dev-onboarding.mjs` then walk the wizard end-to-end without 400s.

**Related:**
- Frontend Redesign Phase 6 commit `a72cf0c` (the fix that motivated this ADR)
- `frontend/scripts/reset-dev-onboarding.mjs` (the dev reset helper, separate from the consistency rule)
- `dev-auth.ts` defines `SKIP_AUTH` and `DEV_USER`

---

## ADR-015: Frontend Redesign Phase 7 — `/api/weekly-story` Endpoint Shape

**Status:** Accepted
**Date:** 2026-04-26

**Context:**
Phase 7 of the frontend redesign ships the flagship home (`/dashboard`) including the Kuwento ng Linggo card — a 3-column KPI grid (Kita / Gastos / Tubo), 7-day banig bar chart, and a Kai takeaway paper-note. Phase 2 synthesis Q1 (locked 2026-04-26) committed to **one source of truth** for the weekly-story payload: home renders KPI grid + chart + takeaway only; the future `/kuwento` route (Phase 10) renders the same payload plus narrative paragraphs. Phase 10 will additionally introduce a `weekly_stories` cache table + Sunday 6 AM Vercel cron (Q10 resolution) and swap the takeaway from a static template to LLM-generated narrative.

Phase 7 must therefore add `/api/weekly-story` *now* (so the home Kuwento card has a typed contract to consume), but with the cache + cron + LLM deferred to Phase 10. The endpoint must compute on-request from existing tables (`transactions`, `daily_check_in`) without introducing a new schema dependency.

**Decision:**

A single new GET route `frontend/src/app/api/weekly-story/route.ts` returning a typed payload that both home (Phase 7) and `/kuwento` (Phase 10) consume.

### 1. Route shape

```ts
// types: frontend/src/lib/weekly-story/types.ts
export type WeeklyStoryDay = {
  date: string;            // YYYY-MM-DD (Manila)
  day_label: string;       // 'Lun', 'Mar', 'Miy', 'Hue', 'Bie', 'Sab', 'Lin'
  kita_centavos: number;
  gastos_centavos: number;
};

export type WeeklyStory = {
  week_start: string;      // YYYY-MM-DD (Monday, Manila)
  week_end: string;        // YYYY-MM-DD (Sunday, Manila)
  kita_centavos: number;
  gastos_centavos: number;
  tubo_centavos: number;   // kita - gastos (can be negative)
  daily_breakdown: WeeklyStoryDay[];  // length 7, Mon..Sun
  peak_day_index: number | null;      // 0..6, null if no kita
  takeaway: string;        // tonal-rotated static template (Phase 7); LLM (Phase 10)
  tone: 'energetic' | 'observant' | 'celebratory';  // D6 rotation
};

export type WeeklyStoryResponse =
  | { available: true; story: WeeklyStory; cached: boolean }
  | { available: false; reason: 'no_data' | 'error'; cached: false; message_tl: string };
```

### 2. Auth + RLS (per ADR-014)

```ts
const supabase = await createClient();
let userId: string;
if (SKIP_AUTH) {
  userId = DEV_USER.id;
} else {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return 401;
  userId = data.user.id;
}
const db = SKIP_AUTH ? createServiceClient() : supabase;
```

Mirrors `/api/morning-briefing` exactly. Production reads honor RLS; dev mode bypasses RLS to stay consistent with the page-level read pattern.

### 3. Aggregation logic (Phase 7 — no LLM, no cache table)

- **Week boundaries:** ISO week, Monday-start, Manila timezone. `getManilaToday()` from `@/lib/timezone` + a `getManilaWeekBounds(today)` helper that returns `{ week_start, week_end }`.
- **Kita / Gastos / Tubo:** sum `transactions.amount` (already in centavos per project rule 6) for the user grouped by `transactions.type` (`income` / `expense`) where `transaction_date BETWEEN week_start AND week_end` and `deleted_at IS NULL`. Schema match — see `lib/morning-briefing/aggregate.ts` for the canonical query shape.
- **Daily breakdown:** group transactions by `transaction_date`, render 7 entries (Mon..Sun). Days with no transactions get `{ kita: 0, gastos: 0 }`.
- **Peak day:** index of the daily entry with the highest `kita`; null if all days are 0.
- **No data state:** if zero transactions exist for the week, return `{ available: false, reason: 'no_data', message_tl: 'Wala pang ginagalaw ngayong linggo. Mag-scan ka ng resibo o mag-check-in para makita ang Kuwento mo.' }`.

### 4. Tonal rotation (D6) — static templates in Phase 7

Three tones: `energetic`, `observant`, `celebratory`. Tone selected daily via `dayOfYear % 3` deterministic rotation (no randomness — same user sees same tone within a calendar day).

Templates live in `frontend/src/lib/weekly-story/takeaway-templates.ts` keyed by tone × week-shape (positive tubo / flat / negative). Sample shape:

```
energetic_positive: "Ginalingan mo this week, {name}! Tubo: {tubo}. Tuloy lang."
observant_positive: "Pumasok ang {kita} this week. Gastos: {gastos}. Net: {tubo}."
celebratory_positive: "Wow, {tubo} tubo this week! Mas mataas pa sa {previous_week_tubo}."
```

`name` falls back to "Boss" if unset. Peso amounts formatted with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`. No tax claims, no advice — pure observation per Phase 1 conversational-Filipino-copy-guide.

### 5. Caching

- **Phase 7:** none. Each call recomputes from `transactions` + `daily_check_in`. Acceptable because the home only calls once per page render and the queries are indexed. No `weekly_stories` table.
- **Phase 10:** Vercel cron Sunday 6 AM Manila pre-generates and writes to `weekly_stories(user_id, week_start, payload JSONB, generated_at)`. The route checks the cache first; on hit returns instantly; on miss computes on the fly (cron may have failed for this user). The on-the-fly path is the Phase 7 logic, unchanged.

### 6. No tier gating

Unlike `/api/morning-briefing` (Pro+ only), `/api/weekly-story` is **available to all tiers** (free included). The Kuwento card is a core home moment — gating it would defeat the home's emotional purpose. Cost is zero at scale: pure DB aggregation, no LLM. When Phase 10 adds LLM-generated narratives, **only the narrative paragraphs are tier-gated**, not the KPI grid + chart + takeaway.

### 7. Error path

Any DB error → `{ available: false, reason: 'error', message_tl: 'Pasensya, may problema sa Kuwento ngayon. Try mo ulit mamaya.' }`. Console-error logged, never throws to the client. Home Kuwento card renders a graceful empty state when `available: false`.

### 8. Component structure

```
frontend/src/
  lib/weekly-story/
    types.ts                  -- WeeklyStory, WeeklyStoryDay, WeeklyStoryResponse
    aggregate.ts              -- aggregateWeeklyStory(db, userId): WeeklyStory
    takeaway-templates.ts     -- pickTakeaway(tone, story, name): string
    week-bounds.ts            -- getManilaWeekBounds(date): { week_start, week_end }
  app/api/weekly-story/
    route.ts                  -- GET handler (auth, aggregate, format response)
```

The aggregation is testable in isolation (vitest). The route orchestrates auth + aggregate + format.

**Alternatives Considered:**

- **Compose home Kuwento card from `/api/expenses` + dashboard aggregations** (Path B in the Phase 7 brief): rejected. Two consumers (home + `/kuwento`) end up with different aggregation paths, drifting subtly. Q1 resolution explicitly requires one source of truth. Phase 7 owning the stub is cheaper than retrofitting the unified endpoint in Phase 10 while migrating home consumers.
- **Add `weekly_stories` cache table in Phase 7:** rejected. The cache is only valuable when LLM narrative generation is expensive (Phase 10 with cron). Phase 7's pure-DB aggregation is fast enough that caching adds complexity without payoff. Phase 10 owns the table + cron together as a coherent unit.
- **Reuse `/api/morning-briefing` cache layer (extend `daily_check_in.briefing_content` to also store weekly stories):** rejected. The two payloads have different cadences (daily vs weekly) and different tier rules (Pro+ vs all-tier). Conflating them would require versioning logic and tier-mismatch handling. A separate route is cleaner.
- **Serve weekly story as a Server Component data prop (no API route):** rejected. The Kuwento card is also consumed by the future `/kuwento` page (Phase 10) and a dedicated drawer entry from chrome — having a typed JSON endpoint enables both server-rendered and client-revalidated consumption (TanStack Query persists the home payload offline).

**Consequences:**

- **Positive:**
  - One source of truth for weekly-story data; no aggregation drift between home and `/kuwento`.
  - Phase 10 work reduces to: add `weekly_stories` table migration, add Sunday cron, swap `takeaway-templates.ts` for an LLM call. Route surface remains stable.
  - All tiers see the Kuwento card, reinforcing the home's emotional purpose without paywall friction.
  - Aggregation logic in `lib/weekly-story/aggregate.ts` is reusable for any future weekly-cadence feature.
- **Negative:**
  - Phase 7 ships an API route that has no cache layer — every page render hits Postgres. At Phase 0A scale (< 50 users) this is fine; at scale Phase 10's cron pre-generation absorbs the load.
  - Static-template takeaway in Phase 7 is less expressive than the LLM version. Acceptable tradeoff: D6 tonal rotation is preserved (variety), and Phase 10 swaps templates → LLM without changing the API contract.

**Validation:**

- Vitest: `frontend/src/lib/weekly-story/__tests__/aggregate.test.ts` — week-boundary edge cases (Sunday boundary, no data, only-income, only-expense, mixed), tonal selection determinism (same `dayOfYear` → same tone), peak-day selection.
- Vitest: `frontend/src/app/api/weekly-story/__tests__/route.test.ts` — auth gating, error path, RLS bypass under SKIP_AUTH.
- Playwright: home Kuwento card renders with mocked `/api/weekly-story` payload; both `available: true` and `available: false` states.
- TypeScript strict — no `any`, Zod-validated response from the client.

**Related:**
- Phase 2 synthesis Q1 + Q10 (locked 2026-04-26)
- ADR-011 (morning-briefing caching pattern — Phase 10 cron mirrors this)
- ADR-014 (SKIP_AUTH consistency rule for the auth/RLS scaffolding)

**Review Trigger:**
- When Phase 10 adds the `weekly_stories` cache table and Sunday cron — confirm the route signature stays unchanged and only the data-source path changes (cache hit vs compute-on-fly).
- If the takeaway templates start looking forced or overly repetitive across the 3 tones — that's an early signal Phase 10's LLM swap should land sooner.

---

## ADR-016: Frontend Redesign Phase 8 — `/api/chat/suggestions` Rule-Based Chips

**Status:** Accepted
**Date:** 2026-04-28

**Context:**
Phase 8 (`/chat` HYBRIDIZE per A2) adds a horizontal row of suggested-question chips above the composer. Q4 resolution (locked 2026-04-26) committed to **rule-based DB queries (no LLM)**, **30-minute server-side cache**, **4 chips minimum**, and **~$0/month cost at any scale**. The chips bridge the cold-start barrier — a new user who opens chat with no prompt sees four concrete questions Kai can answer, three personalized to their state and one evergreen. Tier scope: **Free + Pro + Business** — chat is universal, the chips are too.

**Decision:**

A new `GET /api/chat/suggestions` endpoint that returns 4 chip strings derived from rule-based queries against `transactions` and `bir_deadlines`, cached 30 minutes per user in-process.

### 1. Route shape

```ts
// types: frontend/src/lib/chat/suggestions/types.ts
export type ChatSuggestion = {
  id: string;        // stable rule key, e.g. 'recent_receipts', 'evergreen_pricing'
  text_tl: string;   // "I-summarize ang gastos this week"
  intent: 'expenses' | 'deadlines' | 'invoices' | 'pricing' | 'expense_capture';
};

export type ChatSuggestionsResponse =
  | { success: true; data: { suggestions: ChatSuggestion[]; cached: boolean } }
  | { success: false; error: { code: string; message: string; message_tl: string } };
```

Always exactly 4 entries. Order: personalized rules (high-signal first) → evergreen filler.

### 2. Auth + RLS (per ADR-014)

Same idiom as `/api/chat`: `createClient()` for auth, `db = SKIP_AUTH ? createServiceClient() : supabase` for queries. Production reads honor RLS; dev mode bypasses to stay consistent with the chat page.

### 3. Rule set (Q4 verbatim, ordered by priority)

```
R1. recent_receipts:    transactions(source='ocr', created_at >= now()-24h, deleted_at IS NULL) >= 3
                        → "I-summarize ang gastos ngayong linggo"       (intent: expenses)
R2. upcoming_deadline:  bir_deadlines(status='upcoming', due_date BETWEEN today AND today+7d, deleted_at IS NULL) LIMIT 1
                        → "Ano ang {form_name}?"                         (intent: deadlines)
R3. overdue_invoice:    invoices(status='overdue', deleted_at IS NULL) EXISTS
                        → "Sinong may utang pa?"                         (intent: invoices)
R4. evergreen (always): "Magkano dapat presyo ng produkto ko?"          (intent: pricing)
```

Cold-start fallback (no user data, no rules fire) — fixed 4-chip set, locked verbatim:
1. "Saan napunta ang pera ko?" (expenses)
2. "Kailan ang BIR deadline?" (deadlines)
3. "Magkano dapat presyo?" (pricing)
4. "I-record ang gastos" (expense_capture)

R3 is opportunistic — if `invoices` table doesn't exist yet (Phase 10), the rule is skipped silently and R4 + cold-start fillers backfill.

### 4. Caching — in-process Map, 30-minute TTL, per-user key

```ts
// frontend/src/lib/chat/suggestions/cache.ts
const cache = new Map<string, { suggestions: ChatSuggestion[]; expiresAt: number }>();
const TTL_MS = 30 * 60 * 1000;
// Hard cap: 10_000 entries (DDoS valve, mirror proxy.ts rate-limit pattern from ADR-005).
```

Cache key: `user.id`. Cold start on Vercel cold boot is acceptable — first request post-cold-start runs the rules, subsequent requests within 30 min hit cache. No Redis/Vercel KV (over-engineered for ~5 SQL queries that are already index-covered).

Cache invalidation: TTL only. The chips are explicitly low-stakes (`<= 30 min` staleness is fine — a receipt scanned at 10:01 doesn't need to flip the chip set until 10:31). Webhook-style invalidation is rejected as too much machinery for the payoff.

### 5. Performance + cost

- 3 indexed Postgres queries on cache miss; 0 on hit. Indexes already exist (`idx_transactions_user_date`, `idx_bir_deadlines_user_due`).
- p95 cache-miss latency target: < 80ms. Cache-hit: < 5ms.
- Zero Claude API calls. Cost stays at Supabase query rate (effectively $0 at Phase 0–1 scale).

### 6. Error path

Any DB error → return cold-start fallback (4 chips) with `cached: false`. The chip row should never break the chat page; degrading to the fixed default is the right failure mode.

### 7. Component structure

```
frontend/src/
  lib/chat/suggestions/
    types.ts            -- ChatSuggestion, response types
    rules.ts            -- runRule(db, userId): ChatSuggestion | null per R1..R4
    cache.ts            -- in-process Map, get/set/evict, TTL
    index.ts            -- buildSuggestions(db, userId): ChatSuggestion[]
  app/api/chat/suggestions/
    route.ts            -- GET handler (auth, cache check, rule run, response)
```

Rule logic is testable in isolation (vitest, mocked db). Cache eviction is unit-tested. Route orchestrates.

**Alternatives Considered:**

- **LLM-generated suggestions (Haiku call per visit):** rejected. Adds Claude spend per chat-page render, breaks the circuit-breaker budget, and the Q4 resolution explicitly forbade it. Rule-based gives deterministic, debuggable output at zero variable cost.
- **Vercel Edge Cache (CDN-level cache headers):** rejected. The response is per-user (rules depend on `user.id`), and CDN caching keyed by Set-Cookie/Authorization is more brittle than an in-process Map for a single-instance Vercel deploy. Revisit if Phase 2 multi-instance scaling makes in-process caching unsafe.
- **Database-backed cache (`chat_suggestions_cache` table):** rejected. Adds a migration, RLS policies, and a write path for what is effectively a memoized SELECT. In-process Map is simpler and resets cleanly.
- **Realtime invalidation (Supabase channel listening to `transactions` inserts):** rejected. Added complexity with no user-visible win — chips refreshing within 30 min of a receipt scan is sufficient.

**Consequences:**

- **Positive:** Zero LLM cost, deterministic chip output, easy to unit-test (rules are pure functions of db state), trivially debuggable (look at the cache, look at the rules). All tiers see the same chip behaviour — no tier-gating logic in the route.
- **Negative:** In-process cache resets on Vercel cold starts (acceptable — first user post-cold-start triggers re-computation, subsequent users in same instance hit cache). Hardcoded rule set means new chip ideas require code changes, not config — accept this until Phase 2+ when a chips registry might earn its keep.
- **Migration cost:** none — no new tables, no new columns. Reads only.

**Related Gaps:** none directly. Gap A5 (PostHog) instrumentation in `posthog.capture('chat_suggestion_tapped', { id, intent })` is engineer's call to add at the click site.

**Review Trigger:** If chip variety feels stale across sessions (same 4 chips every time), promote to a chips registry table with weighted-random selection. If Vercel scales to multiple instances and cache hit-rate drops below 50%, swap the Map for Vercel KV (still cheaper than LLM).

---

## ADR-017: Frontend Redesign Phase 9 — Deadline → Chat Deeplink Contract

**Status:** Accepted
**Date:** 2026-04-28

**Context:**
Phase 9 `/deadlines` (A5 ADOPT HANDOFF) adds two tap targets that should "open chat with this deadline already on Kai's mind": (a) any deadline row, and (b) the pre-deadline `<PaperNote>` callout for items ≤ 7 days away. Q7 resolution (locked 2026-04-26) committed to **`/chat?topic={form_code}&context=deadline-{N}d`** as the URL contract, with a system-prompt context block prepended so Kai opens the conversation already aware of the form and how many days remain. This ADR locks the contract so engineer + ai can build the read side and assembler extension without ambiguity.

**Decision:**

### 1. URL contract

```
/chat?topic={form_code}&context=deadline-{N}d
```

- `form_code` — uppercase BIR form identifier matching `bir_deadlines.form_name`. Examples: `2551Q`, `1701Q`, `1601C`, `1604C`. Validated against a known-set allowlist (engineer maintains it in `lib/bir/forms.ts`); unknown values fall through to a context-free chat.
- `N` — integer days until due. Range: `-30..30` clamped. `0` = due today; negative values = overdue (e.g. `deadline--3d` for 3 days overdue, encoded as `deadline-${N}d` where N is a signed int — so URL form is `deadline=-3d` literally, two dashes). Engineer encodes via `encodeURIComponent` if needed; spec is `${N}d` where N is the signed integer.
- Both params optional. If only `topic` is present → context block uses just the form. If only `context` is present (no topic) → context block is dropped (insufficient signal). If neither → identical to plain `/chat`.

### 2. Param parsing — server component, not client

The chat page (`app/(app)/chat/page.tsx`) is a Server Component that reads `searchParams` and passes a typed `deadlineContext: DeadlineContext | null` prop into the chat client component. Rationale:

- Server-side parsing means validation (form-code allowlist, N-range clamp) runs once on render, not on every keystroke in the client.
- The first system prompt is assembled server-side anyway (existing `/api/chat` POST flow); reading params on the server lets us seed the conversation row with the deadline context in one round-trip, instead of POSTing from the client to "tell" the server about a URL it could've read itself.
- Bookmarkable + shareable — the URL is the source of truth.

```ts
// app/(app)/chat/page.tsx (Server Component)
type DeadlineContext = { formCode: string; daysUntilDue: number };

function parseDeadlineContext(searchParams: URLSearchParams): DeadlineContext | null {
  const topic = searchParams.get('topic');
  const ctx = searchParams.get('context');
  if (!topic || !ctx) return null;
  if (!isKnownFormCode(topic)) return null;
  const match = ctx.match(/^deadline(-?\d+)d$/);
  if (!match) return null;
  const days = Math.max(-30, Math.min(30, parseInt(match[1], 10)));
  return { formCode: topic, daysUntilDue: days };
}
```

### 3. System-prompt assembler extension

Extend `PromptAssemblyInput` (`lib/claude/types.ts`) with a new optional field:

```ts
export interface PromptAssemblyInput {
  // ...existing fields
  deadlineContext?: { formCode: string; daysUntilDue: number };
}
```

`assembleSystemPrompt()` adds a new **Layer 4c — Deadline Context** between the existing Layer 4 (User Context) and Layer 4b (Output Format Hint), prepended only when `deadlineContext` is truthy:

```
[DEADLINE_CONTEXT]
The user has navigated here from the BIR deadline list. They want to discuss:
Form: {formCode}
Days until due: {daysUntilDue} ({urgency_label})
Speak first. Acknowledge the form by name, confirm how many days remain in conversational Filipino,
and offer concrete next steps ("I-prepare ko na ang numero mo?" / "Gusto mo bang i-walk-through ko ang form?").
Do not give tax advice — gabay lamang, hindi tax advice. Defer to CPA for official guidance.
```

`urgency_label` = `'huling N araw'` if `daysUntilDue >= 0` else `'lipas na ng N araw'`.

### 4. Conversation seeding — Kai speaks first

When `deadlineContext` is present and the chat page renders for the first time (no existing conversation in the URL session), the page **server-side fetches `/api/chat` with a sentinel user-message** to make Kai open the conversation. The composer is **NOT pre-filled** (per project rule 7 — "Kai speaks first, proactive AI not reactive chatbot").

Concretely:

- Page detects `deadlineContext != null` and no recent conversation row tagged with this form_code.
- Page issues a server-side POST to `/api/chat` with body `{ message: '__deadline_context_open__', feature: 'general_chat', deadlineContext: { formCode, daysUntilDue } }`. The sentinel string is recognised by the chat route as a "Kai opens" trigger.
- `/api/chat` skips persisting the sentinel as a user message (filter at the insert step), but does pass `deadlineContext` into `assembleSystemPrompt()`. Claude's response is saved as a normal assistant message and rendered.
- Subsequent user messages in the session continue to include the deadline context block until the user navigates away (URL changes).

If the sentinel POST fails (network, Claude error), the chat page degrades to a plain chat with the URL params still readable — a visible toast says "Hindi na-open ni Kai ang topic, magtanong ka muna." User can ask manually.

### 5. Chat route changes (`app/api/chat/route.ts`)

- Extend `ChatRequestSchema` to include optional `deadlineContext: { formCode, daysUntilDue }`.
- Validate against the same form-code allowlist + N range as the page parser.
- Pass through to `assembleSystemPrompt({ ..., deadlineContext })`.
- Sentinel `__deadline_context_open__` triggers: skip user-message insert, set `feature: 'general_chat'`, ensure `deadlineContext` is present (else 400). Single sentinel handler — keeps the public API surface unchanged.

### 6. Tier scope

Available to **all tiers** (Free + Pro + Business). Deadlines and BIR guidance are universal — the deeplink doesn't change tier gating, it just pre-seeds context. Free-tier circuit breaker still applies (the sentinel "Kai opens" call counts as 1 query).

### 7. PostHog instrumentation

Two new events (engineer adds at click sites):

```
deadline_chat_opened      properties: { source: 'row'|'callout', form_code, days_until_due }
deadline_chat_seeded      properties: { form_code, days_until_due, success: true|false }
```

`opened` fires on tap (source = which UI element). `seeded` fires from the sentinel POST result.

**Alternatives Considered:**

- **Pre-fill the composer with a question instead of Kai speaking first:** rejected. Violates project rule 7. The composer pre-fill pattern is fine for "I'm asking Kai a question" flows; the deadline tap is "I want Kai's help with X" — Kai should lead.
- **Use a session-scoped server cookie instead of URL params:** rejected. URL is the contract — bookmarkable, shareable, copy-pasteable into PostHog event properties. Cookies hide the state.
- **POST body field instead of URL params (client-only chat page that POSTs context on mount):** rejected. Adds a client→server round-trip after the page already loaded, and breaks bookmarkability. Server Component reading `searchParams` is one less network hop.
- **A dedicated `/chat/deadline/[form_code]` route segment:** rejected. Dynamic route segments couple the URL to the deadline use case; query params keep `/chat` as the single chat surface and `topic` extensible to future contexts (e.g., `/chat?topic=invoice&context=overdue-{id}` later).
- **Inject the deadline context as a synthetic user message instead of system-prompt block:** rejected. Pollutes conversation history with a non-user-typed message and would render as a user bubble unless special-cased. System-prompt layer is the canonical place for "things Kai knows before responding."

**Consequences:**

- **Positive:** One URL contract serves both row taps and callout taps. Server-side parsing means validation lives in one place. The assembler extension is purely additive — existing callers without `deadlineContext` are unaffected. Kai-speaks-first preserves the brand voice on entry. The contract extends naturally to other domain deeplinks (Phase 10 invoice tap, future Phase costing tap) without re-architecture.
- **Negative:** The sentinel `__deadline_context_open__` string is a magic value coupling page and route. Documented in this ADR + the route's JSDoc; engineer must guard insertion of this string from real user messages (sanitizer treats it as a reserved token). Each deadline tap costs 1 Claude call (Haiku for free, Sonnet for Pro+) — at ~₱0.05/call this is acceptable variable cost, capped by circuit breaker.
- **Migration cost:** zero schema changes. Code-only: types + assembler + route + chat page param read + two click handlers in `/deadlines`.

**Related Gaps:** none directly. Tier-gating (Gap-related) handled by existing circuit-breaker path. RLS unchanged (chat queries already user-scoped).

**Review Trigger:**
- When Phase 10 adds invoice deeplinks (`/chat?topic=invoice&context=overdue-{id}`) — confirm the assembler `[DEADLINE_CONTEXT]` block generalises to a `[TOPIC_CONTEXT]` block or split into typed blocks per topic family.
- If the sentinel "Kai opens" pattern becomes flaky (sentinel leaks to user-visible message, cost spikes from accidental loops), replace with an explicit `?seed=true` flag and a separate `/api/chat/seed` route.
- If the URL contract leaks to social shares with PII — review whether `topic`/`context` need a HMAC signature in Phase 2.

---

## ADR-018: Native Mobile Pivot via Capacitor + IAP (deprecate Xendit)

**Status:** Accepted
**Date:** 2026-05-24
**Sprint:** 13

**Context:**

AKBai was built as a Next.js 16 PWA with planned Xendit subscription billing. Pre-launch (no live users, Xendit wired but `XENDIT_SECRET_KEY` never set), the founder reviewed Tarsi — a Filipino personal-finance app by Bryl Lim that hit #1 on the PH App Store within 48 hours of March 2026 launch and earned ₱1M+ in <30 days. Tarsi's success raised three questions:

1. Should AKBai pivot from PWA to native mobile (App Store + Google Play) for distribution, trust signal, and iOS push reliability?
2. Should AKBai change pricing model (Tarsi-style impulse-buy lifetime) to lower activation friction?
3. Should AKBai's brand identity evolve from a static logo mark into a full character?

Research (codebase audit, Tarsi competitive intel, mobile deployment paths, IAP regulatory state May 2026) surfaced several misconceptions in the original pivot premise — most notably that stores do **not** eliminate payment-gateway work (they replace one gateway with two store-specific SDKs), and that PH distribution dynamics in fact favor web links over store installs in many cases. But store distribution does deliver real wins: trust signal for a financial app, App Store search/charts discoverability (Tarsi's actual moat), iOS push reliability (web push on iOS is broken), and home-screen install rates.

The economics of unit per-user costs (Claude API spend grows with active usage) ruled out pure one-time pricing — a Tarsi-style ₱299-only model bleeds money on power users. Hybrid Starter+Pro threads the needle.

The brand audit revealed AKBai already has a stronger mascot foundation than Tarsi's tarsier (name etymology *akbay* = arm around the shoulder, full voice/archetype/mark all shipped) — what's missing is character extension (body, expressions, scenarios). A new mascot would dilute existing equity; evolving Kai builds on it.

**Decision:**

Pivot to native mobile via **Capacitor** (web codebase wrapped in iOS + Android native shells, ~90% code reuse). Replace Xendit with **In-App Purchase via RevenueCat SDK** (wraps Apple StoreKit 2 + Google Play Billing). Adopt **hybrid pricing**: 7-day free trial → ₱299 lifetime Starter (non-consumable IAP, capped to non-AI features) → ₱499/mo or ₱4,999/yr Pro subscription (auto-renewing IAP, all AI features). **Evolve Kai** from a static mark into a full illustrated character with 8+ expression poses via **Gemini image generation** (Anton-driven prompt iteration against a locked Character DNA preamble — supersedes the original "commissioned Filipino illustrator" plan, saving ~₱30-80k + 2-3 weeks external lead time, decided same day 2026-05-24).

Execution sequencing (confirmed 2026-05-24): **Sprint 13 = Frontend Redesign Phase 8-9 close-out** (no pivot work — clean stable codebase first). **Sprint 14 = pivot foundations + 1-day Capacitor spike + decision gate.** Sprints 15-18 = production native build, IAP integration, native polish, store assets + Pre-Launch Feature Readiness Gate. Sprint 19 = soft launch + Tarsi-style organic distribution motion (founder-led TikTok/FB) + first iteration. Total pivot: 6 sprints (14-19), with Sprint 13 redesign close-out preceding.

**Alternatives Considered:**

- **Stay PWA-only, ship Xendit, measure adoption first:** Lowest velocity cost (0 sprints) but loses iOS push reliability, store trust signal, store discoverability. PWA install rates in PH unmeasured — pivot is pre-emptive. Rejected because pre-launch is the cheapest moment to decide (no live customers to migrate). Kept as fallback if Sprint 13 Capacitor spike fails.

- **React Native / Expo full rewrite:** True native UI, best performance for animations and complex camera UX. 8-12 sprints of UI rewrite — kills velocity and provides no upside for a bookkeeping app (no 120fps needs). Rejected as overkill for solo founder.

- **PWABuilder / TWA (Trusted Web Activity) shortcut:** Cheapest path to Play Store (~1 sprint) but Google Play tolerates this only marginally; Apple App Store likely rejects (Guideline 4.2 "minimum functionality"). Rejected because financial app rejection risk too high.

- **Flutter rewrite:** Dart learning curve + total code rewrite. No code reuse from current TypeScript/React codebase. Rejected for solo founder.

- **Hand-written native iOS + Android shells calling existing Next.js backend:** Best native UX long-term, but 10-15 sprints for solo founder, requires hiring or outsourcing. Capacitor is the pragmatic version of this without the engineering depth requirement.

- **Pure one-time pricing (₱299 lifetime, Tarsi-clone):** Maximum impulse-buy adoption, simplest IAP integration (no subscription complexity). Rejected because AKBai active users hit Claude API daily — per-user costs grow indefinitely, breaking unit economics. Subscription is required to protect margins on power users.

- **Pure subscription pricing (no Starter):** Cleaner business model, higher LTV per active user. Rejected because it imports the full activation friction Tarsi avoided. Hybrid Starter+Pro gives the impulse buy AND the subscription revenue.

- **Introduce a new mascot (turtle, sarimanok, maya bird, etc.):** Would dilute existing Kai brand equity (logo, name etymology, voice, archetype, ~6 months of brand investment already shipped). Rejected. Evolve Kai instead.

- **Continue building features only, defer pivot to post-launch:** Highest near-term velocity. Rejected because (a) post-launch pivot costs 10x once paying customers exist, and (b) pre-launch is the unique window where Xendit can be abandoned with zero migration cost.

**Consequences:**

**Positive:**
- ~90% code reuse via Capacitor wrap — preserves 559+ test baseline, all business logic, all AI integrations, all Supabase RLS, all Tailwind/UI work
- Pre-Launch Feature Readiness Gate (Sprint 17) explicitly prevents shipping half-baked features under store branding
- Hybrid pricing model captures both impulse-buy (Tarsi-style) AND subscription-LTV segments
- Kai character evolution leverages existing brand foundation (cheapest brand investment available)
- Six-sprint pivot is bounded — clear sprint definitions, clear decision gates per sprint
- Xendit deprecation has zero migration cost (no live customers)
- RevenueCat SDK saves ~1 sprint vs raw StoreKit 2 + Play Billing integration

**Negative:**
- 6 sprints of split focus between pivot work and continuing feature development (mitigated by Feature Continuation Track in every pivot sprint per plan §10)
- Apple Guideline 4.2 webview rejection risk — medium likelihood, mitigated by native camera + push + biometric integrations from Sprint 15
- Replace one payment gateway (Xendit) with two store-specific SDKs (StoreKit 2 + Play Billing, unified via RevenueCat) — net same complexity, different vendor
- 15-30% store revenue cut (vs Xendit's ~3% transaction fee) — acceptable trade for trust + distribution + zero gateway maintenance
- Server components in `frontend/src/app/(app)/*/page.tsx` (~18 files, 40% of pages) require conversion to client components for Capacitor static export
- `proxy.ts` middleware (in-memory rate limiting) won't run in static export — must move to backend API guards or Cloudflare Worker (Month 7+ plan brought forward)
- Service worker (`sw.js`) + PWA manifest deprecated — Capacitor handles offline natively
- External lead times constrain timeline floor: Apple App Store first review (24-48hr + 1 rejection cycle plausible). Illustrator lead time eliminated by Gemini approach (was 2-3 weeks in original plan); residual risk is character-consistency drift across Gemini generations (mitigated by locked Character DNA preamble in `kai-gemini-prompts.md`).

**Migration cost:**
- Code: Sprint 15 conversion of ~18 server-component files + `proxy.ts` relocation (~10 hrs). Sprint 16 swap `getUserMedia` → Capacitor Camera + push + biometric (~10 hrs).
- Schema: minor — add `iap_platform` column to `subscription_status` (`'apple' | 'google' | 'xendit_legacy'`)
- Existing Xendit webhook handler kept dormant; can be removed in Sprint 17 cleanup
- No data migration (no live customers)

**Related Gaps:** G1-G7 (new Category G in `gap-registry.md`). D2 (Xendit webhook idempotency) deferred — replaced by G2 (IAP webhook idempotency via RevenueCat).

**Affected files (Sprint 14+ implementation):**
- `frontend/next.config.js` — add `output: 'export'`, `images: { unoptimized: true }` (file is `.js` not `.ts` — Sentry plugin wraps in CommonJS; drift caught in Sprint 14 spike 2026-05-27)
- `frontend/src/app/(app)/*/page.tsx` — convert ~18 server components to client (exact list pending Sprint 14 spike inventory)
- `frontend/src/proxy.ts` — relocate or deprecate rate limiting
- `frontend/src/app/(app)/scan/page.tsx` + `frontend/src/components/scanner/camera-capture.tsx` — route is `/scan` (drift caught Sprint 14); swap `getUserMedia` → `@capacitor/camera` in Sprint 16
- `frontend/src/lib/payments/` — adapt subscription lifecycle for IAP events (RevenueCat webhooks)
- `frontend/src/app/api/webhooks/xendit/route.ts` — deprecate, remove in Sprint 17
- New: `frontend/src/app/api/iap/webhook/route.ts` — RevenueCat webhook handler
- New: `frontend/src/lib/iap/` — RevenueCat client wrapper + entitlement reconciliation
- New: `capacitor.config.ts`, `ios/` Xcode project, `android/` Android Studio project
- `frontend/public/manifest.json`, `frontend/public/sw.js` — deprecated (kept for web fallback)
- `akbai-delivery/shared/{project-context,tech-stack,sprint-history,gap-registry,brand-context}.md` — updated this sprint
- `akbai-delivery/skills/ux-designer/references/kai-character-brief.md` — new this sprint
- `akbai-delivery/skills/ux-designer/references/kai-gemini-prompts.md` — new this sprint (Gemini prompt library, Character DNA preamble + 8 pose prompts; supersedes external illustrator workflow)
- `AKBAI_MASTER_BRIEF.md` — updated Sprint 13 (commit 1a1f1c6)

**Review Trigger:**
- End of Sprint 14: if Capacitor spike fails the "feels like a real app" sniff test on real device → abort pivot, fall back to PWA (sprint renumbered 2026-05-24 — was Sprint 13 in original ADR draft, rescoped same day when Sprint 13 became redesign close-out)
- End of Sprint 18: if Pre-Launch Feature Readiness Gate (plan §11) is RED on any item → defer public release to Sprint 19+
- 30 days post-launch: review actual conversion (Trial → Starter vs Trial → Pro vs Starter → Pro) against assumptions. If Starter dominates and Pro upgrade rate <10%, revisit pricing tiers.
- Apple/Google revenue cuts shift materially: if EU DMA-style alternative payment becomes viable in PH with materially lower commission, reconsider external web checkout as Pro-tier billing path.
- If a paying user base develops (>500 active) before Sprint 18: Xendit deferral reconsidered as a web-only backup billing channel for Pro users who prefer GCash.

**Full plan reference:** `C:\Users\Anton del Rosario\.claude\plans\lets-review-our-approach-tidy-harp.md` — 6-sprint execution plan, parallel-session playbook, Pre-Launch Feature Readiness Gate, risk register, doc-update schedule. This ADR captures the architectural decision; the plan captures the execution details.

---

## ADR-019: Capacitor Wrapping Pattern (Sprint 14 Spike Findings)

**Status:** Accepted (🟢 Green — spike completed 2026-05-27; on-device smoke remaining as Sprint 15 first-30-min verification, not blocking promotion)
**Date:** 2026-05-27
**Sprint:** 14
**Branch:** `feat/capacitor-spike` (throwaway worktree at `C:\Users\Anton del Rosario\akbai-spike`, final commit `c5926b6` — do not merge); ADR ships on `chore/14-foundations` → `main`
**Supersedes:** None
**Related:** ADR-018 (Native Mobile Pivot via Capacitor + IAP)

**Context:**

ADR-018 locked the strategic pivot from Next.js PWA to native iOS + Android via Capacitor, with ~90% code reuse as the load-bearing assumption. ADR-018 deliberately left the technical pattern undefined — "how does the codebase actually become a Capacitor app?" — pending a 1-day Sprint 14 spike. This ADR captures the wrapping pattern validated by that spike and is the source of truth for Sprint 15's full conversion work.

Three things ADR-018 left open:
1. Can Next.js 16 App Router produce a static export (`output: 'export'`) that Capacitor can consume, given the codebase ships server components, server-side Supabase auth (`createClient()` + `redirect()`), middleware (`proxy.ts` rate limiting), Sentry-wrapped config (`withSentryConfig(withNextIntl(...))`), and dynamic searchParams handlers (`/chat?topic=...&context=...`)?
2. What conversion cost does the server-component-to-client-component migration actually impose? ADR-018 estimated ~18 server pages × 12-15 hrs total; the spike measures this for the first time.
3. Does the resulting WebView-wrapped app feel like a real native app on a real device (Pixel 5), or does it fail the "this is just a website in a box" sniff test that drives Apple Guideline 4.2 rejection risk?

The spike is deliberately throwaway: minimal viable conversion of 3 representative routes (`/dashboard`, `/chat`, `/scan`), Android binary production, and a 10-minute smoke test. The point is "fail fast if it's broken" — not to ship production code.

**Decision:**

AKBai adopts the following Capacitor wrapping pattern. All four parts are load-bearing; deviating from any one breaks the others.

1. **Static export configuration.** `frontend/next.config.js` (note: `.js`, not `.ts` — the file is CommonJS because of the Sentry plugin wrapper) gains `output: 'export'` and `images.unoptimized: true` at the inner `nextConfig` level, **inside** the existing `withSentryConfig(withNextIntl(nextConfig))` wrap. Both plugin wrappers are compatible with static export and stay in place. The `out/` directory produced by `npm run build` is the Capacitor `webDir`.

2. **Client-component conversion strategy.** Every server component under `frontend/src/app/(app)/**/page.tsx` that calls `cookies()`, `createClient()` (server Supabase), or `redirect()` from `next/navigation` is converted by:
   - Adding `'use client'` as the first line
   - Removing `export const metadata` (incompatible with client components — tab titles handled in the `<head>` via Capacitor's native shell or accepted as a minor loss)
   - Replacing `async function Page()` with `function Page()`
   - Moving server Supabase auth into a `useEffect` using the browser Supabase client from `@/lib/supabase/client`, with `window.location.href = '/login'` (or `router.push('/login')`) replacing the server-side `redirect()`
   - Moving any server-side data fetching (streak compute, deadline context resolution, etc.) into client-side `useEffect` calls against existing `/api/*` routes (the API routes themselves are unchanged — they're hosted remotely on Vercel and called from the Capacitor WebView over HTTPS)
   - Removing `import 'server-only'` directives

3. **Capacitor init parameters.** `npx cap init AKBai com.akbai.app --web-dir=out` produces `frontend/capacitor.config.ts` with `appId: 'com.akbai.app'`, `appName: 'AKBai'`, `webDir: 'out'`. Android platform added via `npx cap add android` (produces `frontend/android/` Gradle project). iOS platform added via `npx cap add ios` on macOS only (produces `frontend/ios/` Xcode project) — Windows machines cannot produce the `.ipa`. Bundle ID `com.akbai.app` is locked here and becomes the App Store + Play Store identifier; do not change without coordinated re-registration in both stores.

4. **Sync workflow.** Every build produces both web and native artifacts via the sequence `npm run build && npx cap sync`. `cap sync` copies `out/` into `android/app/src/main/assets/public/` (and the iOS equivalent), then triggers native Gradle / Xcode dependency resolution. Release artifacts: Android `.aab` via `cd android; .\gradlew bundleRelease`; iOS `.ipa` via Xcode Archive (Mac required). Debug variants (`bundleDebug`, `assembleDebug`) used for emulator/device smoke testing; release variants require signing keystore (Android) and Apple Developer cert (iOS).

5. **What gets deprecated.** `frontend/src/proxy.ts` (rate-limiting middleware) does not run in static export — it must be relocated to backend API guards or Cloudflare Worker (Month 7+ plan brought forward). `frontend/public/manifest.json` and `frontend/public/sw.js` (PWA assets) are kept on disk for web-fallback users but are no longer the primary distribution surface. `next-pwa` is fully deprecated (already gone from `tech-stack.md`).

**Alternatives Considered:**

- **Keep server components via runtime SSR shim.** Some patterns (e.g., Capacitor + Express sidecar, or a runtime Next.js node server bundled into the app shell) preserve server components but require shipping a Node runtime inside the app bundle, ballooning binary size 50-100 MB and breaching the <30 MB Pre-Launch Gate target. Also defeats Capacitor's `webDir`-as-static-bundle assumption, complicating Apple review (a Node process running inside the app raises Guideline 2.5.6 questions about executable code). **Rejected.** The conversion cost (~18 pages, ~12-15 hrs in Sprint 15) is bounded; the SSR shim cost is unbounded.

- **Full SPA rewrite (drop Next.js entirely, switch to Vite + React Router).** Cleanest static-export story, no server-component conversion needed because there are none. But discards ~6 months of Next.js-specific work: i18n via `next-intl`'s App Router integration, the `(auth)/(app)/(features)/` route group conventions documented in `tech-stack.md`, Sentry's Next.js plugin, all the existing route boilerplate. Estimated 6-10 sprints of rewrite vs ADR-018's 6-sprint pivot total. **Rejected.** The conversion cost beats the rewrite cost by an order of magnitude.

- **PWABuilder / TWA (Trusted Web Activity) shortcut.** ADR-018 already considered and rejected this for App Store risk — repeating here only because the spike could have surfaced a "Capacitor too painful, fall back to TWA" path. The spike instead confirms Capacitor is tractable, so TWA stays rejected. Plus, TWA delivers Android-only — iOS is the harder market to crack and TWA gives nothing there.

- **Hybrid: keep server components for the web build, generate a separate static-export build only for Capacitor.** Two builds (web SSR + native static) from one codebase via conditional `next.config.js`. Technically possible but doubles the test surface, doubles the deploy pipeline, and the bifurcation tends to drift (a server-only feature lands in the web build and silently breaks the next mobile build). **Rejected for solo founder.** Single build pipeline (`output: 'export'` always on) is the maintainable shape. Web fallback users get the same static bundle hosted on Vercel; they lose nothing meaningful (no SSR features in actual use besides auth redirects, which client-side guards handle).

**Consequences:**

**Positive:**
- ~90% code reuse target preserved — all business logic, all Claude AI integration, all Supabase RLS, all Tailwind / Shadcn / illustration assets, all 1290+ tests carry forward unchanged
- Single build pipeline — `npm run build` produces `out/`, which feeds both Vercel web deploy and Capacitor `cap sync`
- API routes hosted remotely on Vercel are untouched — the Capacitor app calls `/api/*` over HTTPS, identical to a browser
- Sentry continues to capture errors via the existing `withSentryConfig` wrap (native crashes need additional iOS dSYM / Android ProGuard upload work — tracked in Pre-Launch Gate §11 P0)
- TanStack Query + Persister offline behavior works identically inside a Capacitor WebView
- Pattern is reversible: if the pivot is later aborted, removing `output: 'export'` and reverting the 3 spike-converted pages restores the PWA build with zero data-layer changes

**Negative:**
- ~18 server-component pages in `(app)/**/page.tsx` require client conversion in Sprint 15 — the exact count is confirmed by the spike's Step 3 inventory (recorded in `SPIKE_FINDINGS.md`)
- `metadata` exports are lost from all converted pages — tab titles become generic "AKBai" everywhere unless replaced by client-side `document.title` writes or Capacitor's native title APIs (acceptable for v1; track as polish item)
- `proxy.ts` middleware does not run in static export — rate limiting must move to backend API route guards (extra ~2-3 hrs of work in Sprint 15, originally planned for Month 7 Cloudflare Worker migration)
- Service worker (`sw.js`) and PWA manifest are deprecated for the native build path — TanStack Persister covers offline caching; Capacitor handles offline shell loading natively
- Static export discards Next.js Image optimization — `images.unoptimized: true` means raw image bytes ship in the bundle. Bundle size discipline (image audit, locale-bundle pruning, R8/ProGuard on Android) becomes a Sprint 15-16 task to hit the <30 MB target
- iOS builds require macOS access — no workaround. Sprint 17 will need a Mac (cloud or borrowed) for IAP testing on iOS; Sprint 14 spike defers iOS entirely per Anton 2026-05-27

**Migration cost (Sprint 15 budget):**
- Server-component → client-component conversions: ~18 pages × 30-45 min each = 10-13 hrs (the spike's 3 conversions calibrate this estimate; actual count and per-page time logged in `SPIKE_FINDINGS.md`)
- `proxy.ts` rate-limit relocation: 2-3 hrs
- Bundle-size audit + first round of trimming (image formats, unused locale bundles, tree-shake check): 2-3 hrs
- Smoke testing per platform: 2 hrs
- **Total: ~16-21 hrs.** Fits Sprint 15's 10 pivot hrs + 4-5 feature hrs ceiling **only if** the spike's actual per-page time stays in the 30-45 min band. If the spike reports 60+ min per page, Sprint 15 spills into Sprint 16 and the timeline floor moves out by 1 sprint.

**Spike-Specific Findings (Sprint 14, completed 2026-05-27)**

- **Verdict:** 🟢 GREEN — pattern + binary both validated; on-device smoke pending Anton's Pixel 5 install.
- **Static-export bundle:** 13 MB / 169 files / 8 prerendered routes (`/`, `/_not-found`, `/chat`, `/dashboard`, `/landing`, `/login`, `/offline`, `/scan`).
- **Android `.aab` (debug):** 15 MB at `frontend/android/app/build/outputs/bundle/debug/app-debug.aab` — half the 30 MB Pre-Launch Gate budget; comfortable headroom for the 7 remaining `(app)/*` page conversions Sprint 15 will add.
- **Android `.apk` (debug):** 15 MB at `frontend/android/app/build/outputs/apk/debug/app-debug.apk` — installable on Pixel 5 via `adb install`.
- **iOS `.ipa`:** deferred to Sprint 17 per Anton 2026-05-27 (no Mac available; Sprint 17 IAP testing needs Mac anyway).
- **Apple Developer Program enrollment:** not yet (defer to Sprint 17). **Google Play Console enrollment:** not yet (Sprint 16/17 before first internal test track upload).
- **Cold start (Pixel 5, median of 3):** pending — Anton's on-device smoke. APK is ready for `adb install`.
- **`/chat` Capacitor-WebView smoke (send message → real Claude reply → history persists):** pending Anton; spike build uses placeholder Supabase env baked at build-time, so full Claude smoke needs a real-env rebuild (procedure in `SPIKE_FINDINGS.md` §Build for real env).
- **`/scan` Capacitor-WebView smoke (camera permission prompt + UI launch):** pending Anton.
- **Navigation feel (60fps scroll, <300ms tap response, hardware-back works):** pending Anton.
- **"Feels real" qualitative verdict:** pending Anton.
- **Server-page conversion inventory:** 4 done in spike (`/`, `/chat`, `/dashboard`, `/scan`). 7 remaining `(app)/*` `page.tsx` files (`admin`, `costing` ×3, `deadlines`, `expenses`, `invoices` ×3, `onboarding`, `profile`) currently disabled via `_underscore_spike_disabled/` prefix. Sprint 15 reactivates and converts each. Plus: `app/auth/callback/route.ts` rewrite (Supabase magic-link → client `exchangeCodeForSession`), `app/(app)/layout.tsx` (server `loadPersona` → client `useEffect`), `lib/i18n/request.ts` (replace `cookies()`/`headers()`-based locale resolution with browser-language + localStorage), `lib/i18n/set-locale.ts` (`'use server'` action → `document.cookie` write — done in spike with reload), `app/sitemap.ts` (drop from app dir; web-only). Total Sprint 15 conversion cost: ~7 pages + 4 infra rewrites = bounded.
- **Toolchain install (one-time per machine, reproducible):** JDK 17 + JDK 21 (Capacitor 8 wants source-level 21) via `winget install Microsoft.OpenJDK.{17,21}`. Android cmdline-tools downloaded from `dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip` and unpacked to `C:\Users\Anton del Rosario\android-sdk\cmdline-tools\latest\`. `sdkmanager --licenses` (accept all) then `sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"`. Total install ~3 GB.
- **Corporate-TLS chain caveat:** this Windows machine sits behind a TLS interceptor whose root CA isn't in Node/Java/curl bundled bundles. npm: `NODE_OPTIONS=--use-system-ca`. Java: export Windows root certs (`Cert:\LocalMachine\Root` → 62 `.cer` files), import all via `keytool` into a writable cacerts copy at `C:/tmp/cacerts21`, then `JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStore=C:/tmp/cacerts21 -Djavax.net.ssl.trustStorePassword=changeit`. curl: `-k` for one-shot Gradle distro download. Gradle wrapper points at local distro mirror (`file:///C:/Users/Anton%20del%20Rosario/gradle-dist/gradle-8.14.3-all.zip`) as a belt-and-braces fallback — committed to the spike branch and works.
- **Build command that produced the binary:** see `SPIKE_FINDINGS.md` §Toolchain install §5. 47-second clean `bundleDebug`.
- **Total time spent:** agent ~3 hrs wall-clock (across 2 attempts; attempt #1 exited prematurely on background-task misunderstanding, attempt #2 ran end-to-end), Anton ~5 min upfront answers + on-device smoke still pending.

**Affected files (Sprint 14 spike + Sprint 15 full conversion):**

Spike (3 files + capacitor scaffolding, throwaway branch):
- `frontend/next.config.js` — add `output: 'export'` + `images.unoptimized: true`
- `frontend/src/app/(app)/dashboard/page.tsx` — convert to client component (stub data)
- `frontend/src/app/(app)/chat/page.tsx` — convert to client component (real `/api/chat` wiring)
- `frontend/src/app/(app)/scan/page.tsx` — convert to client component (camera launch smoke)

New files created by spike:
- `frontend/capacitor.config.ts`
- `frontend/android/` (entire Gradle project, gitignored)
- `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md` (engineer creates at Step 9)

Sprint 15 full conversion targets (estimated; exact list pending spike Step 3 inventory):
- `frontend/src/app/(app)/admin/page.tsx`
- `frontend/src/app/(app)/costing/page.tsx`, `/new/page.tsx`, `/[id]/page.tsx`
- `frontend/src/app/(app)/deadlines/page.tsx`
- `frontend/src/app/(app)/expenses/page.tsx`
- `frontend/src/app/(app)/invoices/page.tsx`, `/new/page.tsx`, `/[id]/page.tsx`
- `frontend/src/app/(app)/onboarding/page.tsx`
- `frontend/src/app/(app)/profile/page.tsx`
- (Plus any `(auth)/*` server pages — to be audited in Sprint 15)
- `frontend/src/proxy.ts` — relocate rate limiting to API route guards
- `frontend/public/manifest.json`, `frontend/public/sw.js` — deprecated (kept for web fallback)

**Review Trigger:**

- **End of Sprint 14 spike:** If the spike's decision gate is RED (binary won't build, app crashes on launch, or webview is unusable on Pixel 5) → this ADR is REJECTED, ADR-018's review trigger fires (abort pivot, fall back to PWA), and a follow-up ADR documents the rejection.
- **End of Sprint 15:** If actual per-page conversion time exceeds 60 min median → re-budget Sprint 16, push iOS work and Pre-Launch Gate forward by 1 sprint.
- **Apple App Store Guideline 4.2 rejection in Sprint 18 review cycle:** If Apple rejects the build as "minimum functionality / repackaged website" → invoke ADR-018's mitigation (native camera + push + biometric from Sprint 16 should already be in place; if not, that's the gap to close), resubmit. Second rejection → escalate to "consider TWA-only on Android + defer iOS to Phase 2".
- **Bundle size exceeds 30 MB at Sprint 17:** Yellow flag — bundle-trimming work added to Sprint 17. Red flag (>50 MB) → re-open this ADR.

**Full plan reference:** `C:\Users\Anton del Rosario\.claude\plans\lets-review-our-approach-tidy-harp.md` §4 (Sprint 14), §5 (Sprint 15 Conversion), §11 (Pre-Launch Feature Readiness Gate). This ADR captures the Capacitor-specific wrapping pattern; the plan captures sprint-by-sprint execution.

**Engineer pickup:** `C:\Users\Anton del Rosario\akbai-spike\SPIKE_PLAN.md` is the step-by-step plan for the spike itself. ADR-019 (this document) is what gets promoted from Draft → Accepted after the spike's decision gate returns GREEN.

**Sprint 15 close-out (2026-05-27):** Full conversion shipped to `main` via PR #33. Gap G1 RESOLVED. 15 server → client page conversions + 5 infra rewrites + `CAPACITOR_BUILD=1` env-conditional `next.config.js` + per-route `enforceRateLimit()` opt-in. Bundle: `.aab` = 14.62 MB, `.apk` = 15.35 MB (both ~50% under <30 MB ceiling). All 4 architect "Open Questions for Anton" defaults held at PR review. **Canonical implementation pattern for future Capacitor work:** `akbai-delivery/skills/solutions-architect/references/sprint-15-conversion-pattern.md` — read this when adding new `(app)/*` pages, designing new `/api/*` rate-limit tiers, or extending the Capacitor build target.

**Sprint 16 close-out (2026-05-27):** Surface polish layer shipped to `main` via PR #35. **Gap G4 (Apple Guideline 4.2 rejection risk) IMPLEMENTED** — full close-out at Sprint 18 Pre-Launch Gate review. 5 Capacitor plugins integrated on top of the Sprint 15 conversion: `@capacitor/camera@8.2.0` (native `Camera.getPhoto` on `/scan` with `getUserMedia` web fallback), `@capacitor/push-notifications@8.1.1` (FCM/APNs via discriminated-union Zod on `/api/push/subscribe`; deferred prompt on `/deadlines` first-view-within-14-days), `@aparajita/capacitor-biometric-auth@10.0.0` (substituted from architect-spec `@capacitor-community/biometric-auth` which doesn't exist on npm — same API; onboarding step 6.25, `(app)/layout.tsx` app-open guard with 3-strike OTP fallback via `@capacitor/preferences`, `/profile` toggle), `@capacitor/app@8.1.0` (deep link `com.akbai.app://auth/callback`), `@sentry/capacitor@4.0.0` (native crash SDK alongside `@sentry/nextjs`; ProGuard `minifyEnabled true` + `scripts/upload-symbols.{ps1,sh}` configured for Sprint 19 execution). Plus migrations 020 (push_subscriptions platform extension) + 021 (users biometric columns). Bundle: `.aab` = **20.75 MB** (+6.13 MB vs Sprint 15; **31% under 30 MB ceiling, under <22 MB sprint target**); `.apk` = 24.39 MB. **1427/1427 tests passing.** All 5 architect Open Questions held at PR review. Security pass MINOR ISSUES only (no blockers). UX B+ voice grade. **Canonical implementation pattern for future Capacitor plugin work:** `akbai-delivery/skills/solutions-architect/references/sprint-16-native-plugin-pattern.md` — read this when adding new Capacitor plugins, designing native-vs-web fallback branches, or wiring native crash symbolication.

---

## ADR-020: Reviewer Demo-Access + Offline Scan-Queue Patterns (Sprint 18 Pre-Launch)

**Status:** Accepted
**Date:** 2026-05-29
**Sprint:** 18
**Branch:** `feat/18-prelaunch-readiness`
**Related:** ADR-005 (fail-closed security defaults), ADR-014 (SKIP_AUTH client consistency), ADR-018/019 (Capacitor pivot), Gap G7 (Pre-Launch Feature Readiness Gate)

**Context:**

The Sprint 18 Pre-Launch Feature Readiness Gate (Gap G7, plan §11) required two patterns that touch the trust boundary and needed an explicit, reusable decision so future work doesn't re-derive them ad hoc:

1. **Reviewer/guest access.** App Store + Play Console reviewers must be able to exercise the full app without creating a real account or making a real purchase — but a login-bypass route is an auth-bypass attack surface if it ever ships enabled. AKBai already has a dev-auth `SKIP_AUTH` bypass (ADR-014 scope); the reviewer path must be at least as fail-closed, and clearly distinct from it.
2. **Offline receipt scanning.** MSMEs pack orders on intermittent LTE (Offline UX is Design Gate #5). A receipt scanned offline must be queued and reconciled later — but a naive queue is a poisoning and replay vector (the Sprint 18 security pass found exactly this: C1/C3 queue poisoning, C4 replay, C5 mis-classified retriable errors, M1 cross-account image leakage on sign-out).

**Decision:**

### Part A — Reviewer demo-access: triple-gated, fail-closed, off-by-default

A dedicated `/api/demo-login` route backed by a single seeded demo account (`seed-demo-account.sql`). It is NOT a variant of `SKIP_AUTH` — `SKIP_AUTH` is a dev-only ergonomic that returns `DEV_USER` without a real session; the demo route issues a real Supabase session for one specific seeded account so reviewers exercise the genuine auth-bound app. Three gates, all required (any one missing → reject, fail-closed):

1. **Env gate** — a server-side flag (`AKBAI_DEMO_MODE_ENABLED`, never `NEXT_PUBLIC_*`) must be explicitly `true`. Unset = disabled. Production builds leave it unset except a deliberate store-review artifact.
2. **Account gate** — the route only authenticates the seeded demo `user_id`; it never accepts an arbitrary email/identifier. The demo account is RLS-scoped and soft-deletable like any user; its data is disposable and PII-free.
3. **Environment gate** — refuse in production `NODE_ENV` unless the env gate is deliberately set (mirrors the Sprint 17 RevenueCat SANDBOX-in-prod environment guard).

The login button that calls the route is itself gated behind the same env flag. Release-blocking checklist item: confirm `AKBAI_DEMO_MODE_ENABLED` AND `SKIP_AUTH`/`NEXT_PUBLIC_SKIP_AUTH` are off in the production native artifact before any store submission. Canonical security writeup: `security-architecture.md` §10.5.

### Part B — Offline scan-queue: validate-before-enqueue, attempt-capped, deduped, fail-isolated

`lib/ocr/offline-queue.ts` queues receipt scans captured while offline and flushes them when connectivity returns. Invariants (each maps to a fixed Sprint 18 review finding):

- **Validate before save** — an item is schema-validated (Zod) before it enters the queue; malformed input never persists (closes C1/C3 poisoning). The queue stores only well-formed scan intents.
- **Per-item attempt cap** — each item carries an attempt counter; a permanently-failing item is dropped after the cap rather than retried forever (prevents an indefinitely-stuck queue).
- **Dedup** — the same scan enqueued twice (double-tap, retry-on-flaky-network) collapses to one entry via a content/idempotency key (closes C4 replay).
- **Retriable vs terminal error classification** — transport/5xx/timeout AND non-JSON OCR responses are retriable; schema/validation failures are terminal-drop. (Sprint 18 fixed C5: a non-JSON OCR error was wrongly treated as terminal.)
- **Clear-on-sign-out** — sign-out wipes the queue and any persisted offline images so no prior user's data survives an account switch on a shared device (closes M1). This is the offline analog of RLS: queue contents are user-scoped at the device layer.

Durable offline image persistence depends on `@capacitor/filesystem` (install deferred to Sprint 19); the policy logic above is in place and tested now. The offline scan queue was forked from the existing chat offline queue and is tracked as convergence debt (Sprint 18 action item #2) — a future ADR may unify them once both stabilize.

**Alternatives Considered:**

- **Reuse `SKIP_AUTH` for reviewers.** Rejected — `SKIP_AUTH` bypasses real auth entirely and returns a synthetic `DEV_USER` with no real session; reviewers need to exercise the genuine RLS-bound app, and conflating the two would make the dev bypass a store-shipped surface. Keeping them distinct keeps each one's blast radius clear.
- **No env gate, rely on a hard-to-guess route path.** Rejected — security by obscurity; a route that issues sessions must be gated by an explicit secret/flag and fail closed.
- **Best-effort offline queue (enqueue raw, validate on flush).** Rejected — lets malformed/hostile items persist (poisoning), and defers failures to flush time where they're harder to attribute. Validate-before-enqueue keeps the queue clean and failures local to the capture.
- **Silent drop on any flush error.** Rejected — loses legitimate scans on transient network failures. The retriable/terminal split preserves real work while bounding retries.

**Consequences:**

**Positive:**
- Reviewers get a real, full-app demo session with zero risk of a shipped auth bypass (fail-closed, off-by-default, triple-gated).
- The offline queue encodes each security finding as an invariant, so a refactor can't silently reintroduce poisoning/replay/leakage; the test suite (test-strategy.md §9 Sprint 18 extension) pins them.
- Both patterns reuse existing AKBai conventions (fail-closed per ADR-005, environment guard per Sprint 17 G2, user-scoping per RLS) rather than inventing new mechanisms.

**Negative / debt:**
- `AKBAI_DEMO_MODE_ENABLED` adds another release-checklist toggle to verify before submission (alongside `SKIP_AUTH`).
- The offline scan queue duplicates the chat offline queue (convergence debt, action item #2) and durable image storage is inert until `@capacitor/splash-screen`/`@capacitor/filesystem` are installed in Sprint 19.
- Constant-time bearer compare for the cron route (`CRON_SECRET`) is now duplicated across Xendit + RevenueCat + cron handlers (action item #1) — a shared helper is the obvious cleanup.

**Review Trigger:**
- If a second reviewer/guest scenario appears (e.g., a time-boxed public demo), revisit whether the single-seeded-account model needs to generalize — but keep fail-closed + triple-gate as non-negotiable.
- When the chat offline queue and scan offline queue are converged (action item #2), supersede Part B's "forked queue" note with the unified abstraction.
- If `@capacitor/filesystem` proves unreliable for image persistence on device (Sprint 19 on-device QA), reconsider the durable-storage layer (IndexedDB blob vs native filesystem).
