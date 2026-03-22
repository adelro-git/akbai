# AKBai — Architecture Decision Record Log
> Append new ADRs to this file. Never delete or renumber existing ADRs.
> Current highest: ADR-007
> Last updated: 2026-03-22

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
