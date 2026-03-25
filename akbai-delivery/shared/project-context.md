# AKBai — Project Context
> Shared reference for all akbai-delivery skills. Read this first. ~200 lines.
> Last updated: 2026-03-25 | Source: Roadmap v14, Financial Model v5, Market Research v1.1, Ops Playbook v7, Ops Roadmap v6, Competitive Brief v2, Brand Guide v1.0, Post-Implementation Vision v1

---

## 1. Product Overview

**Name:** AKBai ("Katuwang ng Negosyo Mo")
**Type:** Mobile-first PWA — AI business partner for Filipino MSMEs
**Tagline:** "Katuwang ng Negosyo Mo" (Your Business Partner)
**Stage:** Pre-launch / Phase 0 (as of March 2026)
**Founder:** Anton del Rosario (solo founder, day job at Globe Telecom)

AKBai is NOT a chatbot. It is a proactive AI business partner — "KA" (Katuwang) — that surfaces insights, tracks finances, monitors BIR deadlines, and drafts customer communications for Filipino micro and small business owners. KA speaks first. KA acts like a brilliant kababayan colleague, not a corporate tool.

---

## 2. Target Market

**Market:** 1.1 million digitally-active Filipino MSMEs
**Primary pain points:**
- Receipt and expense tracking is manual, error-prone, done in notebooks or scattered photos
- BIR compliance is anxiety-inducing — deadlines are missed, penalties are feared
- Cash flow visibility is near-zero — owners don't know if they're profitable
- Customer communications (DMs, follow-ups) consume hours daily

**Primary persona: Maria** — home-based food seller, 35–45 years old, earns ₱80K–₱250K/month, active on Facebook and Shopee, comfortable with GCash, afraid of BIR, manages everything on her phone. The "Maria Moment" is when she opens AKBai and sees "Kumikita ka. ₱18,400 ang net mo this month" — something true about her business she didn't know, in her language, before it's too late to act on it.

**Full persona set:**
| Persona | Type | Age | Primary Pain |
|---------|------|-----|--------------|
| Maria | Home baker / food seller | 35–45 | BIR compliance, expense tracking |
| Jose | Online seller (Shopee/Lazada) | 28–35 | GCash income reconciliation, VAT |
| Ana | Freelance creative | 25–30 | 8% flat tax, invoice tracking |
| Andoy | Sari-sari / micro-retail | 40–55 | Daily cash flow, inventory costing |

---

## 3. Tech Stack

**Frontend:** Next.js 16 App Router, TypeScript (strict), Tailwind CSS + Shadcn/UI, TanStack Query + Persister (offline-first caching), mobile-first PWA
**Database:** Supabase — Postgres, Auth, Storage, Realtime, Edge Functions
**AI:** Claude API — Haiku (OCR, classification, free tier), Sonnet (KA reasoning, Pro/Business tier)
**Payments:** Xendit — subscription billing, GCash as primary payment method
**Deploy:** Vercel (Phase 1 primary, free tier) → Cloudflare Pages (Month 7+ cost optimization, $5/mo)
**Email:** Resend (transactional — winback sequences, BIR deadline reminders, payment notifications)
**Monitoring:** Sentry (errors), PostHog (analytics), UptimeRobot (uptime)
**Comms:** WhatsApp Business API (Phase 2), Meta Messenger (Phase 1 manual)

**Architecture principles:**
- RLS on every Supabase table (user_id scoped) — no exceptions
- All Claude API calls server-side only — never expose API key to client
- Soft-delete everywhere (deleted_at timestamp) — never hard-delete user data
- Circuit breaker on daily Claude API spend — hard cap to prevent cost overrun
- Feature folders: /app/(features)/[feature-name]/ pattern
- **Domain-expandable architecture:** System prompt uses modular scope sections ([TAX_SCOPE], [COMMUNICATION_SCOPE], etc.) so Phase 4+ domains can be added as configuration changes, not rewrites. Conversation history is domain-tagged. Out-of-scope redirects are logged for demand signal.

---

## 4. Tier Structure

| Tier | Price | Scans/mo | AI Model | Key Features |
|------|-------|----------|----------|--------------|
| Free | ₱0 | 0 | Haiku only | Text queries (10/day), basic BIR deadlines |
| Pro | ₱399/mo | 50 | Sonnet + Haiku | Full feature set, receipt scanning, morning briefing |
| Business | ₱899/mo | 80 | Sonnet + Haiku | GSheets OAuth, multi-seat (up to 5 team members: Owner, Accountant, Viewer), priority support |
| Scale (Phase 3) | ₱1,499/mo | Unlimited | Sonnet + Haiku | All Business + unlimited custom behaviors, API integrations, cross-channel outbound, priority support |

**Pricing roadmap:** Pro ₱449 (Y2), ₱499 (Y3). Business ₱999 (Y2), ₱1,099 (Y3). Scale tier launches Phase 3.

---

## 5. Core MVP Features (Phase 1)

Build order (Build 0 → Build 8):

0. **Build 0: AI Scope Definition & System Prompt Architecture** — HARD GATE before Build 1. Defines in-scope/out-of-scope boundaries, financial disclaimer, Taglish tone, domain-expandable prompt structure with modular scope sections. See Post-Implementation Vision v1 for Phase 4+ expansion.
1. **Kilala Kita** — 5-step hybrid onboarding. Sets business type, income range, primary pain, BIR consent, data bootstrap. Powers all KA personalization.
2. **Dashboard** — Business health at a glance. Cash position, sales trends, BIR deadlines, task list. Home tab of PWA.
3. **Resibo Scanner** — Camera → Claude Haiku Vision → structured expense card. Cost: ₱0.16/scan.
4. **Saan Napunta** — Expense dashboard. Categorized spend, monthly trends, cash flow visibility.
5. **Ang Umaga Mo** — Morning Briefing card. KA proactively summarizes yesterday's income, today's BIR deadlines, cash position.
6. **Deadline Watcher** — BIR compliance calendar. Deadlines by business type. Push notifications (7/3/1-day sequence for Pro).
7. **Reply Drafter** — KA drafts customer DM replies. Phase 1: manual copy-paste. Phase 2: Meta Messenger API.
8. **Costing Cards + Invoice Cards** — Margin calculator + invoice creation/tracking/PDF export.

**Also included in builds (not separate builds):**
- **Daily Check-In** (Build 2 scope) — Evening in-app modal (default 8PM), 60-second habit for daily sales + expenses entry.
- **Weekly Reconciliation** (Build 5 scope) — Friday 9AM prompt, surfaces missing days from past 7.
- **Monthly Reconciliation** (Build 5 scope) — End-of-month summary card, shareable to WhatsApp/PDF.

---

## 6. Phase Structure & Targets

### Phase 0A — Legal Foundation (Weeks 1–4)
- DTI/SEC registration
- BIR Certificate of Registration
- NPC (National Privacy Commission) pre-compliance setup
- IP/trademark filing
- Gate: 5 legal items complete

### Phase 0B — Demand Validation (Weeks 4–10)
- 100+ waitlist signups (zero paid ads)
- Brand identity complete (KA visual system)
- 5–6 SEO Taglish articles published
- 10 founder interviews completed
- Gate: 100 waitlist signups

### Phase 0C — Paid Pilot (Optional, Weeks 8–12)
- 5-user paid pilot at ₱99–₱199 to validate willingness to pay
- Validates: payment flow, support load, Taglish AI accuracy
- Gate: 3+ users willing to continue paying at Phase 1 pricing
- Transition plan: loyalty rate or grandfathering for pilot users (see Gap D8)
- **Note:** Phase 0C may run concurrently with late Phase 0B or early Phase 1. Skip if Phase 0B demand signals are strong enough.

### Phase 1 — MVP Build (Months 1–6)
- Build order: Build 0 (AI Scope) → Build 1 (Kilala Kita) → Build 2 (Dashboard) → Builds 3–5 (Core features) → Build 6–8 (Payments, Polish)
- **Phase 1 targets:** 50 registered users, 20 paying Pro subscribers, ₱6K–₱10K MRR
- Ends with Sense Check Gate (8-signal framework)

### Sense Check Gate (Month 6)
Go/No-Go for Phase 2 based on 8 signals — see product-owner skill.

### Phase 2 — Growth (Months 6–12)
- Business tier launch (₱899/mo, multi-seat up to 5), WhatsApp Business API, referral loop, churn recovery/dunning flow, micro-influencer program
- **Phase 2 targets:** 200 registered users, 80 paying subscribers (Pro + Business), ₱30K–₱50K MRR

### Phase 3 — Agent Builder Platform (Month 12+)
- Custom AI behaviors via Taglish conversation ("Every time I receive payment over ₱5,000, remind me to issue an OR")
- Scale tier launch (₱1,499/mo), unlimited behaviors + API integrations
- **Phase 3 targets:** 500+ users, 200 paying, ₱100K–₱200K MRR

### Phase 4+ — Domain Expansion (Month 19+)
- See Post-Implementation Vision v1. Expansion sequence: Marketing Advisory → Business Strategy → HR → Inventory/Supplier
- Architecture prep done in Build 0 (modular prompts, domain tags, redirect logging)

### Current Phase
> Current: Phase 0A — Build 2 Complete (2026-03-25)
> Build 0 shipped (2026-03-20). Build 1 (Kilala Kita) frontend shipped (Sprint 3, 2026-03-22). Build 2 (Dashboard) complete with check-in, data wiring, profile page (Sprint 5, 2026-03-25). 405 tests passing. Gaps A1, A3, A4, A5, B3, B4, E3 resolved.

### What's Built
- **Build 0 — AI Scope Definition** (2026-03-20): `/frontend/src/lib/claude/` module
  - 6-layer system prompt assembler (`assemble.ts`)
  - Model routing: Haiku for free/extraction, Sonnet for pro/reasoning (`model-router.ts`)
  - Guardrails: BIR disclaimer (17 triggers), input sanitizer (7 injection patterns), output filter (`guardrails.ts`)
  - Circuit breaker: daily spend caps ($5 global, $0.50/user), free tier 10-query limit (`circuit-breaker.ts`)
  - Cost estimator for pre-call budget checks (`cost-estimator.ts`)
  - Taglish error messages with trust recovery pattern (`errors.ts`)
  - Supabase migration: `daily_api_spend` table + `increment_daily_spend` RPC
  - Refactored `/api/chat/route.ts` with Zod validation + full guardrails pipeline
  - Vitest setup with 31 regression tests (all passing)

- **Security Hardening** (2026-03-20): Pre-Build 1 security audit response
  - `subscriptions` table with SELECT-only RLS — tier isolated from user-writable data
  - `protect_feature_flags()` trigger prevents user-side tier manipulation
  - `set_user_tier()` RPC for admin/webhook tier management
  - Fail-closed circuit breaker — 503 if spend tracking unavailable (was fail-open)
  - IP-based rate limiting in `proxy.ts` (20 req/min per IP for `/api/*`)
  - Security audit gaps tracked in gap-registry.md Category F (F1-F4, all resolved)
  - ADR-005 documenting security architecture decisions

- **Sprint 3 — Build 1 Frontend + Infrastructure** (2026-03-22):
  - UTC+8 timezone enforcement: shared `@/lib/timezone` module with `toManila()`, `getManilaToday()`, `formatManilaDate()` — Gap A3 resolved (ADR-006)
  - Kilala Kita onboarding UI: 5-step wizard (6 components), mobile-first light theme (dark mode available), Taglish copy, `useRef`+`onClick` pattern — Gap B3 resolved
  - Onboarding schema: migration 005 (`onboarding_fields`), `/api/onboarding` route, Zod validation, 28 first-response templates
  - Onboarding rate-limit exemption: `checkCircuitBreaker()` `onboardingCompleted` param — Gap E3 resolved (ADR-008)
  - Sentry error monitoring: `@sentry/nextjs` client+server configs, `global-error.tsx`, source map uploads — Gap A4 resolved (ADR-007)
  - Dev-auth bypass for local development (`SKIP_AUTH` + `DEV_USER`)
  - PWA icons (icon-192.png, icon-512.png) added to `/public/icons/`
  - 208 tests passing across all modules

- **Sprint 4 — PostHog, Email, Dashboard Shell, OCR Pipeline** (2026-03-25):
  - PostHog analytics: `posthog-provider.tsx`, `lib/posthog/events.ts` (5 typed events), `lib/posthog/server.ts`, ADR-009 — Gap A5 resolved
  - Email module: `lib/email/templates.ts` (branded Taglish magic link + confirmation), `lib/email/verify.ts` (Yahoo PH detection), `smtp-setup-guide.md` — Gap D1 downgraded to IMPORTANT
  - Build 2 Dashboard shell: `kai-greeting.tsx`, `dashboard-card.tsx`, `empty-state-card.tsx`, `bottom-nav.tsx`, migration 006 (`daily_check_in`), `/api/dashboard` with UTC+8 greeting
  - OCR pipeline: `lib/ocr/` (types, schemas, prompts, parse-receipt with Haiku-first + Sonnet fallback), `/api/ocr`, spike runner — Gap E1 pipeline built, awaiting test images
  - Login page redesigned to match `screen-mockups.html` — Gap A1 (Auth) resolved
  - 8 reference files refreshed, UX alignment (touch targets, theme-color, bubble width)

- **Sprint 5 — Build 2 Completion + Feature Flags + PWA + Branding** (2026-03-25):
  - Daily Check-In: `check-in-modal.tsx`, `check-in-section.tsx`, `money.ts`, migration 007
  - Dashboard data wiring: dynamic `getDashboardCards()`, `DashboardCard` summary prop
  - Profile/Settings: `/profile` page, `/api/profile` (GET+PATCH), dark mode toggle — Gap B4 resolved
  - Feature Flags: `lib/feature-flags/` (4 files) — Design Gate 6 IN PROGRESS
  - PWA: manifest.json enhanced, sw.js v2, `/offline` page — Design Gate 5 IN PROGRESS
  - Branding: local logos, white CTA text, light-first default, dark mode contrast, Taglish copy (22 files)
  - 405 tests passing (68 new + 3 fixed, 0 failures)

---

## 7. Unit Economics (Financial Model v5)

| Metric | Value |
|--------|-------|
| Receipt scan cost | ₱0.16/scan ($0.0028 × 57.2 PHP/USD) |
| Pro LTV | ₱9,975 (25-month avg lifetime) |
| Blended CAC | ₱110 (organic + paid mix) |
| LTV/CAC ratio | 91x |
| Break-even month | Month 7 |
| Y1 net profit target | ₱110,303 |
| Y1 end-of-year users | 399 |
| Pro gross margin | ~85% |

---

## 8. KA Persona — Communication Rules

KA is AKBai's AI personality. **Internal/documentation name: "KA". User-facing name: "Kai"** (the smart ate/kuya who always has your back). Use "Kai" in all UI copy, chat headers, and user-visible text. Use "KA" in code, docs, and internal references.

Every user-facing output must follow these rules:

**Voice:** Warm, hyper-competent, Taglish (Filipino-English mix). Like a brilliant kababayan colleague who happens to know everything about business and taxes.

**Rules:**
- Uses "po" naturally — not every sentence, but when appropriate for warmth
- Speaks first (proactive) — e.g., "Magandang umaga po, Maria! Eto ang update mo ngayon..."
- Short sentences — max 2 lines per chat bubble
- Numbers always in digits (₱18,400 not "eighteen thousand four hundred pesos")
- Peso sign: ₱ always, never "PHP" or "Php"
- Calls users by first name when known

**Never:**
- Tax advice ("Konsultahin ang inyong CPA para sa opisyal na payo")
- Guaranteed financial outcomes
- Corporate-speak or jargon a Maria wouldn't understand
- Robotic filler phrases ("Certainly!", "As an AI...", "I'd be happy to...")
- Condescension or implying the user is doing something wrong

**BIR disclaimer (required on all tax-related outputs):**
"Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

---

## 9. Compliance Requirements

**NPC / RA 10173 (Data Privacy Act):**
- Registration with National Privacy Commission required before launch
- DPO (Data Protection Officer) designation required
- Privacy Policy and Terms of Service must be live at launch
- Data breach notification: 72-hour window to notify NPC
- User data deletion: 7-day purge window after request

**BIR Legal Boundaries:**
- AKBai provides tax reminders and calculations — NOT tax advice
- Disclaimer required on all BIR-related outputs
- No liability for incorrect deadline calculations
- Users responsible for their own filing

**Supabase Data Classification:**
- PII: name, email, phone number, business name → encrypted at rest
- Financial: transaction amounts, receipt data → encrypted at rest, RLS scoped
- Analytics: feature usage, session data → anonymized where possible

---

## 10. Solo Founder Constraints

- Anton works a day job at Globe Telecom (Mon–Fri, standard hours)
- Available for AKBai: evenings (2–3 hrs) and weekends (4–6 hrs Saturday)
- Max single uninterrupted work block: 4 hours
- Sprint capacity: 10–15 hours per 2-week sprint
- Claude Pro plan: token budget matters — keep sessions focused
- No team until Phase 2 (potential freelancer for Design or DevOps)

---

## 11. Source Documents (in /AKBai/Project Documents/)

| Document | Content | Skills That Use It |
|----------|---------|-------------------|
| AKBai_Complete_Roadmap_v14.docx | Full product roadmap, gap registry, feature specs, Build 0 AI Scope + Pre-Build Checklist | project-manager, product-owner, solutions-architect, ai-engineer |
| AKBai_Financial_Model_v5.xlsx | Unit economics, projections, cost model | ops-lead, product-owner |
| AKBai_Market_Research_v1.html (v1.1) | Personas, pain points, competitive landscape, First 100 Users GTM Playbook | marketing-lead, product-owner, ux-designer |
| AKBai_Operations_Playbook_v7.html | UX lifecycle, support triage, ops cadence, data ingestion flows, BIR Update Protocol, Offline UX Design | ops-lead, devops-engineer |
| AKBai_Operations_Roadmap_v6.docx | OPS Builds 0–5B, UAT environment, data ingestion pipeline | project-manager, devops-engineer |
| AKBai_Competitive_Brief_v2.html | 8 pain points, competitor matrix, knowledge base roadmap, competitive moat | marketing-lead, product-owner |
| AKBai_Post_Implementation_Vision_v1.html | Phase 4+ domain expansion (Marketing, Strategy, HR, Inventory) | solutions-architect, ai-engineer, product-owner |
| AKBai_Skills_Utilization_Guide_v1.html | Which skills to use per phase | All skills (meta-reference) |
