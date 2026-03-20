# AKBai — Architecture Decision Record Log
> Append new ADRs to this file. Never delete or renumber existing ADRs.
> Current highest: ADR-003
> Last updated: March 2026

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Next.js 14 App Router as frontend framework | Accepted | 2026-03-14 |
| ADR-002 | Supabase as backend platform | Accepted | 2026-03-14 |
| ADR-003 | Xendit as payment processor | Accepted | 2026-03-14 |

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
