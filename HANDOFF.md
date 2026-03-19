# HANDOFF.md — AKBai Scaffold → Phase 1 Build
> Bridges Emergent scaffold output → Claude Code Phase 1 builds.
> Fill in all `[FILL: ...]` fields immediately after Emergent Session 1 completes.
> Last updated: _________________ | Filled in by: Anton del Rosario

---

## Part 1 — What Emergent Built

### Deployment
| Field | Value |
|-------|-------|
| Production URL | `[FILL: Vercel/Cloudflare Pages URL]` |
| Supabase Project URL | `[FILL: https://[project-ref].supabase.co]` |
| Supabase Project ID | `[FILL: project ref string]` |
| Git repository | `[FILL: GitHub repo URL]` |
| Branch strategy | `[FILL: e.g. main = production, dev = staging]` |
| Node.js version | `[FILL: e.g. 20.x]` |
| Next.js version | `[FILL: confirm 14.x App Router]` |

### Auth
| Field | Value |
|-------|-------|
| Auth method | `[FILL: confirm email OTP / magic link]` |
| Session duration | `[FILL: e.g. 7 days]` |
| Redirect after login | `[FILL: e.g. /chat or /dashboard]` |
| Social login | None — intentionally excluded |
| Password auth | None — intentionally excluded |

### Database Schema (fill in after inspecting Supabase)

**Table: `users`** (extends `auth.users`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | FK → auth.users(id) |
| `[FILL: column]` | `[FILL: type]` | `[FILL: note]` |
| `[FILL: column]` | `[FILL: type]` | `[FILL: note]` |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**Table: `business_profiles`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users(id) |
| `[FILL: column]` | `[FILL: type]` | `[FILL: note]` |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**Table: `ka_conversations`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → users(id) |
| `role` | enum | 'user' \| 'assistant' |
| `content` | text | message body |
| `domain` | varchar | default 'general' |
| `[FILL: any added columns]` | `[FILL: type]` | `[FILL: note]` |
| `created_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**RLS status** (run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` to verify)
| Table | RLS Enabled? | Policy confirmed? |
|-------|-------------|------------------|
| users | `[FILL: YES / NO]` | `[FILL: YES / NO]` |
| business_profiles | `[FILL: YES / NO]` | `[FILL: YES / NO]` |
| ka_conversations | `[FILL: YES / NO]` | `[FILL: YES / NO]` |

> ⚠️ If any table shows NO — stop. Fix RLS before writing any application code. Missing RLS on financial data is a RA 10173 (Data Privacy Act) violation.

### `/api/chat` Endpoint
| Field | Value |
|-------|-------|
| Route | `/api/chat` |
| Method | POST |
| Claude model used | `[FILL: confirm claude-sonnet-4-6]` |
| System prompt version | `[FILL: "basic scaffold prompt" or describe if custom]` |
| Context window (messages fetched) | `[FILL: e.g. last 20 messages]` |
| Auth check present? | `[FILL: YES / NO]` |
| API key location | `[FILL: confirm server-side env var only, not NEXT_PUBLIC_]` |
| Messages persisted to DB? | `[FILL: YES / NO]` |

### Environment Variables Confirmed in Production
```env
ANTHROPIC_API_KEY=             [FILL: set? YES/NO]
NEXT_PUBLIC_SUPABASE_URL=      [FILL: set? YES/NO]
NEXT_PUBLIC_SUPABASE_ANON_KEY= [FILL: set? YES/NO]
SUPABASE_SERVICE_ROLE_KEY=     [FILL: set? YES/NO — confirm NOT NEXT_PUBLIC_]
XENDIT_SECRET_KEY=             stubbed (not used yet)
XENDIT_WEBHOOK_TOKEN=          stubbed (not used yet)
SENTRY_DSN=                    stubbed (not used yet)
NEXT_PUBLIC_POSTHOG_KEY=       stubbed (not used yet)
RESEND_API_KEY=                stubbed (not used yet)
```

### PWA Status
| Item | Status |
|------|--------|
| `manifest.json` present | `[FILL: YES / NO]` |
| Service worker registered | `[FILL: YES / NO]` |
| App icon (512x512) in manifest | `[FILL: YES / NO — should be AKBai_Icon_512.png]` |
| "Add to Home Screen" tested on iOS | `[FILL: YES / NO / NOT YET]` |
| "Add to Home Screen" tested on Android | `[FILL: YES / NO / NOT YET]` |

---

## Part 2 — What Was Intentionally Left Out

The following were explicitly excluded from the Emergent scaffold. Do not treat their absence as a bug.

### Features Not Built (by design)
- **Kilala Kita** — 5-step hybrid onboarding flow (Build 1)
- **Dashboard** — Business health cards, cash position, task list (Build 2)
- **Resibo Scanner** — Camera → Claude Haiku Vision → expense card (Build 3)
- **Saan Napunta** — Expense dashboard with categorized spend (Build 4)
- **Ang Umaga Mo** — Morning Briefing proactive card (Build 5)
- **Deadline Watcher** — BIR compliance calendar + push notification sequence (Build 6)
- **Reply Drafter** — KA drafts customer DM replies (Build 7)
- **Costing Cards + Invoice Cards** — Margin calculator, invoicing, PDF export (Build 8)
- **Xendit payment integration** — Subscription billing, GCash payments
- **Free tier query limits** — 10/day enforcement not implemented
- **Receipt scanning / OCR** — Claude Haiku Vision not wired up
- **Domain-expandable system prompt** — Modular scope sections ([TAX_SCOPE], etc.) not implemented
- **Circuit breaker** — Daily Claude API spend cap not implemented
- **Feature flag system** — Boolean column in users table not added
- **Sentry / PostHog** — Error monitoring and analytics not wired (env vars only stubbed)
- **Resend / email** — Transactional email not configured
- **Multi-seat / team features** — Business tier functionality
- **Admin observability** — No Retool or Supabase dashboard

### Intentional Simplifications
- **System prompt is basic** — The scaffold uses a minimal KA persona prompt. Build 0 (AI Scope Definition) will replace this with the domain-expandable architecture before any feature build.
- **No Kilala Kita = no personalization** — Kai does not know the user's business type, income, or BIR status yet. All responses are generic until Build 1 completes.
- **No UTC+8 enforcement** — Timestamps are stored in UTC. Timezone display logic is a Phase 1 Day 1 task (Gap A3).
- **No session expiry UX** — Expired sessions show a raw error or redirect, not a graceful Taglish re-auth prompt (Gap D6).

---

## Part 3 — Known Issues to Watch For

These are gaps from the official gap registry (`/AKBai/akbai-delivery/shared/gap-registry.md`) that are now active risk items because the scaffold is live. Address in the order listed.

### 🔴 CRITICAL — Must fix before any real user accesses the app

| Gap | Description | Fix In |
|-----|-------------|--------|
| A1 | Auth must be fully working end-to-end — test OTP delivery, session persistence, protected route redirect | Immediately post-scaffold |
| D1 | Yahoo Mail OTP deliverability — Supabase default SendGrid has poor PH delivery rates. Many target users have Yahoo Mail. Configure custom SMTP with a warmed domain. | Before Phase 0B waitlist signup goes live |
| A3 | UTC+8 timezone enforcement — all BIR deadlines, timestamps, push notifications must display in Asia/Manila | Phase 1 Day 1 before any date-related feature |
| A4 | Sentry error monitoring — zero production visibility without this. Set up with source maps. | Before first beta user |
| A5 | PostHog analytics — required to measure all 8 Sense Check Gate signals. Must be live from Day 1. | Before first beta user |
| E1 | Resibo OCR technical spike — test Claude Haiku Vision on 10–15 real Filipino receipts before marketing receipt scanning. Hard gate before Build 3. | Phase 0A, 1 afternoon effort |

### 🟡 IMPORTANT — Address during Phase 1 builds (not blockers for scaffold)

| Gap | Description | Fix In |
|-----|-------------|--------|
| B1 | AI loading states — Claude takes 3–10s. Blank screen = broken app perception. Taglish loading indicator required. | Build 1 |
| B3 | Onboarding recovery — Kilala Kita must be resumable if user drops mid-flow | Build 1 |
| B5 | Empty states — all Dashboard cards and Chat history need Taglish empty state copy | Build 2 |
| B7 | iOS PWA install prompt — no native banner on iOS. Explicit guide required in onboarding + Settings. | Phase 1 launch |
| C1 | Receipt deduplication — hash-based dedup before saving scanned receipts | Build 3 |
| D2 | Xendit webhook idempotency — must deduplicate by payment_id before crediting subscriptions | Build 4 |
| D6 | Session expiry UX — graceful Taglish re-auth prompt, not a raw error | Build 3 |
| E3 | Onboarding rate-limit exemption — free-tier 10/day query limit must NOT apply during Kilala Kita | Build 1, architecture layer |

### Design Gates (non-negotiable before Phase 1 launch)

| Gate | Description | Owner Skill |
|------|-------------|-------------|
| Build 0 (HARD GATE) | AI Scope Definition & domain-expandable system prompt architecture. Nothing ships before this. | `ai-engineer` |
| Trust Recovery Pattern | "Flag as Wrong" mechanism + persistent in-app financial disclaimer | `ux-designer` + `ai-engineer` |
| Taglish Style Guide + Prompt Regression Tests | 20–30 case test library, run on every system prompt or model change | `qa-engineer` + `ai-engineer` |
| Offline UX Minimum | Taglish offline message, cached Morning Briefing, queued actions | `ux-designer` + `fullstack-engineer` |
| Feature Flag System | Boolean column in `users` table, checked in middleware before every feature | `data-architect` + `fullstack-engineer` |
| 4-Layer Data Isolation | RLS + user-scoped system prompt + conversation isolation + profile versioning | `security-compliance` + `data-architect` |
| Domain-Expandable Architecture | Modular prompt scope sections, domain-tagged conversations, redirect logging | `ai-engineer` + `solutions-architect` |

---

## Part 4 — What Claude Code Builds Next (All 5 Pillars)

AKBai covers 5 business operation pillars. Every Phase 1 build maps to one or more pillars. The scaffold touches none of them — it is the foundation they all sit on.

### The 5 Pillars
1. **Financial Tracking** — Receipts, expenses, cash flow, costing, invoicing
2. **BIR Compliance** — Deadline calendar, tax type detection, calculation aids, disclaimer-compliant guidance
3. **Customer Communications** — DM reply drafting, follow-up suggestions, message tone matching
4. **Daily Operations** — Morning briefing, task prioritization, cash position at a glance
5. **Task Prioritisation** — KA surfaces what needs action today, in order of urgency

---

### Pre-Build Sequence (before any pillar work)

**⛔ BUILD 0 — AI Scope Definition & System Prompt Architecture**
> Hard gate. Nothing else starts until this is done.

| Item | Detail |
|------|--------|
| What it does | Defines in-scope and out-of-scope boundaries for KA. Implements domain-expandable prompt architecture with modular scope sections: `[TAX_SCOPE]`, `[COMMUNICATION_SCOPE]`, `[FINANCIAL_SCOPE]`, `[OPS_SCOPE]`. Adds BIR financial disclaimer. Establishes Taglish tone rules in the system prompt. Logs out-of-scope redirects for demand signal. |
| Why it's a hard gate | Every subsequent build's AI output quality depends on the system prompt architecture. Building features on a weak system prompt means rebuilding AI behavior later — expensive. |
| Skills to activate | `ai-engineer` (primary) + `solutions-architect` + `product-owner` |
| Shared context to read | `project-context.md`, `brand-context.md`, `tech-stack.md` |
| Estimated effort | 2–3 days (evenings/weekend) |
| Output | Production-ready system prompt in `/lib/claude/system-prompt.ts`, modular scope loader, prompt regression test suite (20–30 cases) |

---

### Build 1 — Kilala Kita (Onboarding)
> Pillar: All 5 (sets the personalization layer everything else runs on)

| Item | Detail |
|------|--------|
| What it does | 5-step hybrid onboarding flow: (1) business type, (2) income range, (3) primary pain, (4) BIR registration consent, (5) data bootstrap from existing records. Writes to `business_profiles` table. Personalizes KA's system prompt context for all future interactions. |
| Key UX constraints | Must be resumable mid-flow (Gap B3). Rate-limit counter must NOT start until after this step completes (Gap E3). Progress indicator required. |
| Skills to activate | `ux-designer` (primary) + `fullstack-engineer` + `data-architect` |
| Shared context to read | `project-context.md` (§5 Build 1), `brand-context.md`, `gap-registry.md` (B3, E3) |
| Estimated effort | 1 sprint (10–15 hrs) |
| Output | `/app/(app)/onboarding/` route group, Kilala Kita step components, `business_profiles` table populated on completion |

---

### Build 2 — Dashboard (Home Tab)
> Pillar: Daily Operations, Financial Tracking

| Item | Detail |
|------|--------|
| What it does | Business health at a glance. Cards: cash position (placeholder until Build 4), recent sales trend, upcoming BIR deadlines, task list from KA. Home tab of the PWA — the screen Maria sees every morning after installing. |
| Key UX constraints | All cards must have Taglish empty states (Gap B5). Cards use Teal (#20C9A0) for financial data per brand rules. Mobile-first layout — no sidebar, bottom tab nav. |
| Skills to activate | `fullstack-engineer` (primary) + `ux-designer` + `data-architect` |
| Shared context to read | `project-context.md` (§5 Build 2), `brand-context.md`, `gap-registry.md` (B5) |
| Estimated effort | 1 sprint |
| Output | `/app/(app)/dashboard/` page, Dashboard card components, bottom nav component |

---

### Build 3 — Resibo Scanner
> Pillar: Financial Tracking

| Item | Detail |
|------|--------|
| What it does | Camera → Claude Haiku Vision (`claude-haiku-4-5`) → structured expense card with merchant, amount, date, category. Cost: ₱0.16/scan ($0.0028 × ~57 PHP/USD). User confirms before saving. |
| Key constraints | Receipt deduplication by hash before saving (Gap C1). Scan count tracked per user per month (Pro: 50, Business: 80). OCR technical spike (Gap E1) must be completed before this build starts. Haiku, not Sonnet, for cost control. |
| Skills to activate | `ai-engineer` (primary) + `fullstack-engineer` + `qa-engineer` |
| Shared context to read | `project-context.md` (§5 Build 3), `tech-stack.md`, `gap-registry.md` (C1, E1) |
| Estimated effort | 1.5 sprints (OCR accuracy work is the long tail) |
| Output | `/app/(app)/scanner/` route, Haiku Vision API route at `/api/scan`, `receipts` table with Supabase Storage for images, dedup logic |

---

### Build 4 — Saan Napunta (Expense Dashboard)
> Pillar: Financial Tracking, Daily Operations

| Item | Detail |
|------|--------|
| What it does | Categorized expense breakdown by month. Spending trends. Cash flow visibility — the "Kumikita ka ba?" screen. KA proactively flags unusual spending jumps. Feeds into the Morning Briefing (Build 5). |
| Key constraints | All date display must be UTC+8 (Gap A3). Subscription grace period logic also activates here (Gap C2 — Xendit webhook idempotency). |
| Skills to activate | `fullstack-engineer` (primary) + `data-architect` + `ux-designer` |
| Shared context to read | `project-context.md` (§5 Build 4), `tech-stack.md`, `gap-registry.md` (A3, C2, D2) |
| Estimated effort | 1 sprint |
| Output | `/app/(app)/expenses/` route, expense aggregation queries, category schema, UTC+8 display utility |

---

### Build 5 — Ang Umaga Mo (Morning Briefing)
> Pillar: Daily Operations

| Item | Detail |
|------|--------|
| What it does | KA proactively sends a daily briefing card. Content: yesterday's income, today's BIR deadlines, cash position, top task. Generated by Claude Sonnet 4 from the user's actual data. Triggers at a user-configured morning time (default 8AM PHT). |
| Key constraints | Notification timing must use UTC+8 (Gap B6). Briefing must be cached for offline access (design gate: Offline UX Minimum). Supabase cron or Edge Function for scheduling. |
| Skills to activate | `ai-engineer` (primary) + `fullstack-engineer` + `ops-lead` |
| Shared context to read | `project-context.md` (§5 Build 5), `gap-registry.md` (B6), `tech-stack.md` |
| Estimated effort | 1 sprint |
| Output | Morning Briefing generation prompt in `/lib/claude/`, Supabase scheduled Edge Function, Push notification configuration, cached briefing in `ka_conversations` with `domain = 'morning_brief'` |

---

### Build 6 — Deadline Watcher
> Pillar: BIR Compliance

| Item | Detail |
|------|--------|
| What it does | BIR compliance calendar personalized to the user's business type and registration status (set in Kilala Kita). Push notification sequence: 7-day, 3-day, 1-day reminders for every relevant deadline. Deadlines sourced from a Supabase-maintained lookup table, not hardcoded. |
| Key constraints | All BIR outputs carry the required disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo." Gap D3 (OR number legality) is relevant here — do not auto-generate official receipt numbers without legal sign-off. |
| Skills to activate | `fullstack-engineer` (primary) + `data-architect` + `security-compliance` |
| Shared context to read | `project-context.md` (§5 Build 6, §9), `gap-registry.md` (A3, B6, D3) |
| Estimated effort | 1.5 sprints (BIR deadline data entry is the long tail) |
| Output | `bir_deadlines` lookup table, `/app/(app)/deadlines/` route, push notification logic, BIR disclaimer component |

---

### Build 7 — Reply Drafter
> Pillar: Customer Communications

| Item | Detail |
|------|--------|
| What it does | User pastes a customer DM. KA drafts a reply matching the tone and context. Phase 1: manual copy-paste. Phase 2: Meta Messenger API (requires Meta App Review — submit dummy webhook now, Gap E2). Supports: order inquiries, payment follow-ups, complaints, resupply questions. |
| Key constraints | Draft is always presented for user review and edit before sending — human in the loop, always. KA never sends on the user's behalf in Phase 1. |
| Skills to activate | `ai-engineer` (primary) + `fullstack-engineer` + `ux-designer` |
| Shared context to read | `project-context.md` (§5 Build 7), `brand-context.md` (voice examples), `gap-registry.md` (E2) |
| Estimated effort | 1 sprint |
| Output | `/app/(app)/reply-drafter/` route, reply generation prompt in `/lib/claude/`, copy-to-clipboard UX, `domain = 'comms'` tagging in conversations |

---

### Build 8 — Costing Cards + Invoice Cards
> Pillar: Financial Tracking

| Item | Detail |
|------|--------|
| What it does | **Costing Cards:** Input ingredients/costs → KA calculates unit cost, suggested selling price, and margin. **Invoice Cards:** Create invoices with line items, due date, and payment instructions. Track payment status (paid / unpaid / overdue). Export as PDF. |
| Key constraints | Gap D3 (OR number legality) applies to invoice numbering — no auto-sequenced OR numbers without BIR sign-off. Use "Invoice #" terminology until legal cleared. PDF export requires server-side generation (not browser print). |
| Skills to activate | `fullstack-engineer` (primary) + `data-architect` + `ux-designer` |
| Shared context to read | `project-context.md` (§5 Build 8), `gap-registry.md` (D3), `tech-stack.md` |
| Estimated effort | 2 sprints |
| Output | `/app/(app)/costing/` and `/app/(app)/invoices/` routes, `cost_cards` and `invoices` tables, PDF generation via server-side route |

---

## Part 5 — Skill File Activation Map

Quick reference: which skill SKILL.md files to load at the start of each Claude Code session.

| Build | Task | Load These Skills (in order) |
|-------|------|------------------------------|
| Pre-work | Read gap registry, update phase status | `project-manager` |
| **Build 0** | System prompt + AI scope | `ai-engineer` → `solutions-architect` → `product-owner` |
| **Build 1** | Kilala Kita onboarding | `ux-designer` → `fullstack-engineer` → `data-architect` |
| **Build 2** | Dashboard | `fullstack-engineer` → `ux-designer` → `data-architect` |
| **Build 3** | Resibo Scanner | `ai-engineer` → `fullstack-engineer` → `qa-engineer` |
| **Build 4** | Saan Napunta | `fullstack-engineer` → `data-architect` → `ux-designer` |
| **Build 5** | Ang Umaga Mo | `ai-engineer` → `fullstack-engineer` → `ops-lead` |
| **Build 6** | Deadline Watcher | `fullstack-engineer` → `data-architect` → `security-compliance` |
| **Build 7** | Reply Drafter | `ai-engineer` → `fullstack-engineer` → `ux-designer` |
| **Build 8** | Costing + Invoices | `fullstack-engineer` → `data-architect` → `ux-designer` |
| Any build | Database schema / migrations | `data-architect` → `security-compliance` |
| Any build | Deployment, CI/CD, monitoring | `devops-engineer` |
| Any build | Testing, prompt regression | `qa-engineer` → `ai-engineer` |
| Phase 1 end | Sense Check Gate | `product-owner` → `project-manager` → `marketing-lead` |

**How to use this table in Claude Code:**
At the start of each session, read the shared context files first, then load the listed SKILL.md files in order. Example for Build 3:
```
Read: /AKBai/akbai-delivery/shared/project-context.md
Read: /AKBai/akbai-delivery/shared/tech-stack.md
Read: /AKBai/akbai-delivery/shared/gap-registry.md
Skill: ai-engineer  →  /AKBai/akbai-delivery/skills/ai-engineer/SKILL.md
Skill: fullstack-engineer  →  /AKBai/akbai-delivery/skills/fullstack-engineer/SKILL.md
Skill: qa-engineer  →  /AKBai/akbai-delivery/skills/qa-engineer/SKILL.md
```

---

## Part 6 — Handoff Checklist (Complete Before First Build Session)

Before writing any Phase 1 code, confirm every item below:

### Scaffold Verification
- [ ] Production URL is live and reachable on mobile browser
- [ ] Login via email OTP works end-to-end (email received, link works, session persists)
- [ ] Chat screen loads after auth
- [ ] Can type a message and receive a Kai response
- [ ] Conversation persists on page refresh
- [ ] RLS is confirmed enabled on all 3 scaffold tables
- [ ] `ANTHROPIC_API_KEY` is server-side only (verified in Vercel/Cloudflare env vars)
- [ ] `.env.example` is committed to repo with all required var stubs
- [ ] PWA manifest and service worker are present

### Gap Registry Pre-Check
- [ ] Gap D1 addressed — OTP deliverability to Yahoo Mail tested or custom SMTP configured
- [ ] Gap A4 addressed — Sentry installed with source maps before inviting any beta user
- [ ] Gap A5 addressed — PostHog installed and baseline events firing
- [ ] Gap E1 addressed — Resibo OCR technical spike completed (≥85% field accuracy on Filipino receipts)
- [ ] Gap E2 addressed — Meta webhook dummy endpoint submitted for App Review (1 hour effort)

### Before Writing Build 0 Code
- [ ] Taglish Style Guide drafted (formal doc in `/AKBai/project/` or as a Claude Code artifact)
- [ ] Prompt regression test suite started (minimum 10 cases covering: out-of-scope queries, BIR disclaimer enforcement, Taglish tone, number formatting with ₱)
- [ ] Feature flag column (`feature_flags jsonb` or boolean columns) added to `users` table

### Phase Tracking
- [ ] Update `Current Phase` field in `/AKBai/akbai-delivery/shared/project-context.md` from "Phase 0A" to correct current phase
- [ ] Update this HANDOFF.md with all `[FILL: ...]` values
- [ ] Commit updated gap registry with any new gaps found during scaffold review

---

## Notes
> Use this section to capture anything that doesn't fit above — Emergent-specific quirks, architectural decisions made during the build session, gotchas discovered, or deferred items.

```
[FILL: notes from Emergent Session 0 architecture review]

[FILL: notes from Emergent Session 1 build]

[FILL: notes from Emergent Session 2 fixes, if applicable]

[FILL: any gaps added to registry after scaffold review]
```

---

*This document is living. Update it at the start and end of every build session.*
*Next document to read after this: `/AKBai/akbai-delivery/shared/project-context.md` → then activate the skill for Build 0.*
