# AKBai — Architecture Decision Record Log
> Append new ADRs to this file. Never delete or renumber existing ADRs.
> Current highest: ADR-005
> Last updated: 2026-03-20

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Next.js 14 App Router as frontend framework | Accepted | 2026-03-14 |
| ADR-002 | Supabase as backend platform | Accepted | 2026-03-14 |
| ADR-003 | Xendit as payment processor | Accepted | 2026-03-14 |
| ADR-004 | Build 0 system prompt architecture | Accepted | 2026-03-20 |
| ADR-005 | Security hardening (subscriptions, fail-closed, IP rate limiting) | Accepted | 2026-03-20 |

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
