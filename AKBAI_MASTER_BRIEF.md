# AKBAI_MASTER_BRIEF.md
> **Single entry-point document for AI app builders.**
> Last updated: March 19, 2026 | Prepared by: Anton del Rosario (Founder)
> Read this ENTIRE file before writing a single line of code.

---

## EMERGENT SCOPE — READ THIS FIRST

This document is being used in a LIMITED Emergent session (100 credits).
Emergent's ONLY job is to generate a clean scaffold. Do NOT build
business logic, pillar features, or AI reasoning layers.

**BUILD THIS:**
- Next.js 14 PWA shell, mobile-first
- User auth (signup, login, sessions via Supabase Auth magic link / email OTP)
- Basic Taglish chat interface UI shell (text input, message bubbles, KA persona styling)
- Database schema (users, ka_conversations, business_profiles — with RLS on every table)
- One working Claude Sonnet 4 API endpoint at /api/chat (server-side only, no client API key exposure)
- Vercel deployment config (or Cloudflare Pages — see Section 4 for canonical choice)

**DO NOT BUILD:**
- Financial management logic (Saan Napunta, Costing Cards, Invoice Cards)
- BIR/tax rules or compliance features (Deadline Watcher, BIR calendar)
- Any of the 5 pillar features (financial tracking, BIR compliance, customer comms, daily ops, task prioritization)
- Customer communications engine (Reply Drafter, WhatsApp, Messenger)
- Operations or decision-making features (Morning Briefing, reconciliation flows)
- Phase 3 agent customization platform (custom behaviors, Scale tier)
- Xendit payment integration
- Receipt scanning / OCR
- Onboarding flow (Kilala Kita)

**STOP** when a user can open the app on mobile, log in, type a message, and receive a Claude API response in a styled chat bubble. That is the entire Emergent deliverable.

---

## 1. Product Summary

AKBai — "Katuwang ng Negosyo Mo" (Your Business Partner) — is a mobile-first Progressive Web App that serves as an AI business partner for Filipino micro, small, and medium enterprises (MSMEs). The product targets 1.1 million digitally-active Filipino business owners whose primary pain points are manual receipt tracking, BIR (Bureau of Internal Revenue) compliance anxiety, zero cash-flow visibility, and hours lost to customer DM management. AKBai is not a chatbot. Its AI persona, "KA" (short for Katuwang — partner), speaks first, proactively surfaces business insights, and communicates in natural Taglish (Filipino-English code-switching).

The product is built by a solo founder (Anton del Rosario) working evenings and weekends alongside a day job at Globe Telecom. Sprint capacity is 10–15 hours per two-week sprint. The monetization model uses three tiers: Free (₱0, Haiku-only, 10 queries/day), Pro (₱399/month, 50 receipt scans, full Sonnet access), and Business (₱899/month, 80 scans, multi-seat). Unit economics are strong: Pro LTV of ₱9,975, blended CAC of ₱110, LTV/CAC ratio of 91x, with break-even projected at Month 7 and Year 1 net profit target of ₱110,303.

The project is currently in Phase 0A (Legal Foundation). No code has been written yet. The brand identity, market research, financial model, competitive brief, operations playbook, and full product roadmap (v14) are complete. The next milestone is scaffolding a working PWA shell that can be iterated on during Phase 1 (MVP Build, Months 1–6). Phase 1 targets are 50 registered users, 20 paying Pro subscribers, and ₱6K–₱10K MRR.

---

## 2. Folder Structure

```
/AKBai/                                  ← Project root (this file lives here)
│
├── AKBAI_MASTER_BRIEF.md                ← YOU ARE HERE. Single entry-point for AI builders.
│
├── project/                             ← Source-of-truth documents (PDFs, XLSX, HTML)
│   ├── AKBai_Complete_Roadmap_v14.pdf   ← Full product roadmap, gap registry, feature specs, Build 0 scope
│   ├── AKBai_Financial_Model_v5.xlsx    ← Unit economics, 3-year projections, cost model
│   ├── AKBai_Market_Research_v1.pdf     ← Personas, pain points, competitive landscape, GTM playbook
│   ├── AKBai_Operations_Playbook_v7.pdf ← UX lifecycle, support triage, ops cadence, BIR update protocol
│   ├── AKBai_Operations_Roadmap_v6.pdf  ← OPS Builds 0–5B, UAT, data ingestion pipeline
│   ├── AKBai_Competitive_Brief_v2.pdf   ← 8 pain points, competitor matrix, competitive moat
│   ├── AKBai_Post_Implementation_Vision_v1.pdf ← Phase 4+ domain expansion roadmap
│   ├── AKBai_Plugin_Strategy_v1.html    ← Claude Code plugin architecture for delivery
│   └── AKBai_Skills_Utilization_Guide_v1.html  ← Which skills to use per phase (meta-reference)
│
├── brand/                               ← Brand assets (production-ready)
│   ├── AKBai Brand Book.pdf             ← Full brand guidelines
│   └── Logo Files/                      ← Production logo PNGs
│       ├── AKBai_Logo_Primary_OnDark.png
│       ├── AKBai_Logo_Primary_OnLight.png
│       ├── AKBai_Logo_Stacked_OnDark.png
│       ├── AKBai_Logo_Stacked_OnLight.png
│       ├── AKBai_Logo_White.png
│       ├── AKBai_Icon_512.png           ← PWA icon (use this for manifest)
│       ├── AKBai_Icon_512_Honey.png
│       ├── AKBai_Mark_Dark.png
│       ├── AKBai_Mark_Honey.png
│       ├── AKBai_Mark_OnDark.png
│       ├── AKBai_Mark_OnLight.png
│       ├── AKBai_Mark_OnGradient.png
│       └── AKBai_Mark_White.png
│
├── akbai-delivery/                      ← Claude Code plugin (12 skills, 15 commands)
│   ├── .claude-plugin/plugin.json       ← Plugin manifest
│   ├── shared/                          ← Shared context files (READ THESE FIRST in any session)
│   │   ├── project-context.md           ← Full product briefing (~220 lines)
│   │   ├── tech-stack.md                ← Canonical stack reference (Next.js 14, Supabase, Claude API, etc.)
│   │   ├── gap-registry.md              ← 29 pre-launch gaps, 10 CRITICAL hard gates
│   │   ├── glossary.md                  ← Product, business, technical, and Taglish terms
│   │   └── brand-context.md             ← Brand identity, voice pillars, colors, typography
│   ├── skills/                          ← 12 role-based AI skills
│   │   ├── ai-engineer/                 ← Claude API integration, system prompt architecture
│   │   ├── data-architect/              ← Supabase schema, RLS policies, migrations
│   │   ├── devops-engineer/             ← Deployment, CI/CD, monitoring setup
│   │   ├── fullstack-engineer/          ← Next.js pages, components, API routes
│   │   ├── marketing-lead/              ← GTM, content, waitlist strategy
│   │   ├── ops-lead/                    ← Operations playbook execution
│   │   ├── product-owner/              ← Feature prioritization, Sense Check Gate
│   │   ├── project-manager/             ← Sprint planning, gap tracking
│   │   ├── qa-engineer/                 ← Testing strategy, Taglish prompt regression
│   │   ├── security-compliance/         ← NPC/RA 10173, data privacy, RLS audit
│   │   ├── solutions-architect/         ← System design, domain-expandable architecture
│   │   └── ux-designer/                 ← Mobile-first UI, PWA install UX, Taglish empty states
│   └── commands/                        ← 15 slash commands (incremental build)
│
└── Archive/                             ← Previous versions of all documents (do NOT reference for builds)
```

---

## 3. Build Phases and Priorities

### What Has Been Completed (Pre-Code)
- Full product roadmap through Phase 4+ (v14)
- Financial model with 3-year projections (v5)
- Market research with 4 validated personas (v1.1)
- Operations playbook and ops roadmap (v7/v6)
- Competitive analysis (v2)
- Complete brand identity system (logo, colors, typography, voice, templates)
- akbai-delivery plugin scaffolded (12 skills, 15 commands)
- 5 shared context files written and cross-referenced

### Build Order for Phase 1 (Post-Scaffold)
The Emergent scaffold is a prerequisite for this sequence. After Emergent delivers, Anton builds in this order:

| Build | Name | What It Does | Depends On |
|-------|------|-------------|------------|
| 0 | AI Scope Definition | System prompt architecture, domain-expandable design, disclaimers | **HARD GATE** — nothing proceeds without this |
| 1 | Kilala Kita | 5-step onboarding (business type, income range, pain, BIR consent, bootstrap) | Build 0 |
| 2 | Dashboard | Business health at a glance (cash, trends, deadlines, tasks) | Build 1 |
| 3 | Resibo Scanner | Camera → Claude Haiku Vision → structured expense card (₱0.16/scan) | Build 2 |
| 4 | Saan Napunta | Expense dashboard with categorized spend and cash flow | Build 3 |
| 5 | Ang Umaga Mo | Morning Briefing — proactive daily summary from KA | Build 4 |
| 6 | Deadline Watcher | BIR compliance calendar with push notification sequence | Build 5 |
| 7 | Reply Drafter | KA drafts customer DM replies (manual copy-paste in Phase 1) | Build 5 |
| 8 | Costing + Invoice Cards | Margin calculator + invoice creation/tracking/PDF export | Build 5 |

### Phase Milestones
- **Phase 0A** (now): Legal foundation — DTI/SEC, BIR COR, NPC pre-compliance, IP/trademark
- **Phase 0B**: Demand validation — 100+ waitlist, brand live, 5–6 SEO articles, 10 founder interviews
- **Phase 1** (Months 1–6): MVP build → 50 users, 20 paying, ₱6K–₱10K MRR → Sense Check Gate
- **Phase 2** (Months 6–12): Growth → Business tier, WhatsApp API, referral loop → 200 users, ₱30K–₱50K MRR
- **Phase 3** (Month 12+): Agent Builder → custom behaviors, Scale tier → 500+ users, ₱100K–₱200K MRR

---

## 4. Technical Constraints

### Stack (Non-Negotiable)
| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 14 App Router** | Server Components default. `'use client'` only when needed. |
| Language | **TypeScript (strict mode)** | No `any`. All API responses typed via Zod schemas. |
| Styling | **Tailwind CSS only** | No CSS modules, no styled-components, no MUI, no Bootstrap. |
| UI Library | **Shadcn/UI** | Composable, accessible, zero unused CSS. |
| Database | **Supabase** (Postgres + Auth + Storage + Realtime) | RLS on every table. Soft-delete only. Audit columns on everything. |
| AI Brain | **Claude Sonnet 4 via direct API calls** (`claude-sonnet-4-6`) | All calls server-side. Use `@anthropic-ai/sdk`. Never expose API key to client. |
| AI (lightweight) | **Claude Haiku** (`claude-haiku-4-5`) | For OCR, classification, free-tier queries. Not needed for Emergent scaffold. |
| Auth | **Supabase Auth** (magic link / email OTP) | No social login in Phase 1. |
| Payments | **Xendit** | Not in Emergent scope. GCash primary. |
| Deployment | **Cloudflare Pages** | Free M1–M6. If Emergent uses Vercel, that's acceptable for scaffold — will migrate later. |
| PWA | **next-pwa** | Offline support critical. Include manifest + service worker. |
| Data fetching | **TanStack Query + Persister** | Offline-first caching. |
| Email | **Resend** | Not in Emergent scope. |
| Monitoring | **Sentry** (errors) + **PostHog** (analytics) | Not in Emergent scope but env vars should be stubbed. |

### AI API Call Pattern (Critical for /api/chat endpoint)
```typescript
// /app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(req: Request) {
  // 1. Authenticate user via Supabase session
  // 2. Extract message from request body
  // 3. Fetch user's conversation history from ka_conversations table
  // 4. Assemble system prompt (KA persona + user context)
  // 5. Call Claude Sonnet 4 API (claude-sonnet-4-6)
  // 6. Store both user message and KA response in ka_conversations
  // 7. Return response to client
}
```

### Database Rules (Apply from Day 1)
1. **RLS on every table** — `auth.uid() = user_id` policy. No exceptions.
2. **Soft-delete only** — every table has `deleted_at TIMESTAMPTZ NULL`. No hard deletes.
3. **Audit columns** — `created_at` and `updated_at` on every table, auto-updated via trigger.
4. **Service role key server-side only** — never in `NEXT_PUBLIC_` env vars or client code.
5. **user_id foreign key** — every user-owned table references `auth.users(id)`.

### Environment Variables to Stub
```env
ANTHROPIC_API_KEY=           # Required for /api/chat
NEXT_PUBLIC_SUPABASE_URL=    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key (client-safe)
SUPABASE_SERVICE_ROLE_KEY=   # Server-side only, never NEXT_PUBLIC_
XENDIT_SECRET_KEY=           # Stub empty — not used in scaffold
XENDIT_WEBHOOK_TOKEN=        # Stub empty
SENTRY_DSN=                  # Stub empty
NEXT_PUBLIC_POSTHOG_KEY=     # Stub empty
RESEND_API_KEY=              # Stub empty
```

### File/Folder Conventions for Next.js
```
/app/
  (auth)/              # Auth routes (login, signup)
  (app)/               # Authenticated app shell
    dashboard/         # Home tab (empty placeholder for now)
    chat/              # Chat interface with KA
  api/
    chat/route.ts      # Claude Sonnet 4 API endpoint ← THE KEY DELIVERABLE
/components/
  ui/                  # Shadcn/UI atomic components
  chat/                # Chat bubble, message list, input bar
/lib/
  supabase/            # Supabase client (browser + server)
  claude/              # Claude API wrapper
```

---

## 5. Skill Files — Which to Activate for Which Build Task

The akbai-delivery plugin at `/AKBai/akbai-delivery/` has 12 role-based skills. Here is which skill maps to which build task:

| Build Task | Primary Skill | Supporting Skills |
|-----------|---------------|-------------------|
| **Emergent scaffold** (this session) | fullstack-engineer | solutions-architect, devops-engineer |
| Build 0: AI Scope & System Prompt | ai-engineer | solutions-architect, product-owner |
| Build 1: Kilala Kita (onboarding) | ux-designer | fullstack-engineer, data-architect |
| Build 2: Dashboard | fullstack-engineer | ux-designer, data-architect |
| Build 3: Resibo Scanner | ai-engineer | fullstack-engineer, qa-engineer |
| Build 4: Saan Napunta (expenses) | fullstack-engineer | data-architect, ux-designer |
| Build 5: Ang Umaga Mo (morning brief) | ai-engineer | fullstack-engineer, ops-lead |
| Build 6: Deadline Watcher | fullstack-engineer | data-architect, security-compliance |
| Build 7: Reply Drafter | ai-engineer | fullstack-engineer, ux-designer |
| Build 8: Costing + Invoices | fullstack-engineer | data-architect, ux-designer |
| Database schema design | data-architect | security-compliance, solutions-architect |
| RLS & data privacy audit | security-compliance | data-architect |
| Deployment & CI/CD | devops-engineer | fullstack-engineer |
| Sprint planning & gap tracking | project-manager | product-owner |
| Feature prioritization & Sense Check | product-owner | project-manager, marketing-lead |
| GTM & waitlist | marketing-lead | product-owner, ux-designer |
| Testing & prompt regression | qa-engineer | ai-engineer |
| Operations setup | ops-lead | devops-engineer, project-manager |

Each skill has a SKILL.md file in `/AKBai/akbai-delivery/skills/[skill-name]/SKILL.md`. Read the relevant SKILL.md before starting any build task.

---

## 6. Key Decisions Already Made — Do Not Override

These decisions have been locked after 14 roadmap iterations, 7 ops playbook versions, and extensive market research. They are non-negotiable:

1. **Taglish is the product language.** All user-facing text is natural Filipino-English code-switching. Not fully English. Not fully Tagalog. This is how the target market communicates.

2. **KA speaks first.** The AI is proactive, not reactive. It sends the morning briefing before being asked. It flags the BIR deadline before the user remembers. This is the core product differentiator.

3. **Claude API, not OpenAI.** The AI brain is Claude (Sonnet 4 for reasoning, Haiku for lightweight tasks). This was chosen for response quality on Filipino business context and structured output reliability.

4. **Supabase, not Firebase.** Postgres with RLS provides the data isolation model required for financial data. Edge Functions for webhooks only; all other server logic in Next.js API routes.

5. **PWA, not native app.** No App Store listing. Install via "Add to Home Screen." This avoids app review delays and 30% platform fees. PWA install UX is a required design gate.

6. **Cloudflare Pages for deployment.** Free for first 6 months. If Emergent scaffold uses Vercel for convenience, that is acceptable — migration happens later. Do not architect around Vercel-specific features.

7. **Mobile-first, dark theme default.** The primary background is Ink (#07101e). Cards are #0d1a2e. Text is white/warm off-white. Never pure black. Never cold greys. Font is Plus Jakarta Sans (Google Fonts).

8. **Shadcn/UI only.** No Material UI, no Bootstrap, no Chakra. Shadcn gives composable primitives with zero unused CSS.

9. **RLS on every table, soft-delete only, audit columns on everything.** This is required for NPC (National Privacy Commission) compliance under RA 10173. Hardcoded from Day 1.

10. **No tax advice.** AKBai provides tax reminders and calculations, never advice. Every BIR-related output carries a disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

11. **No hard deletes of user data.** Soft-delete with `deleted_at` timestamp. 7-day purge window after deletion request per NPC requirements.

12. **Circuit breaker on AI spend.** Daily Claude API spend cap tracked in a Supabase table. When hit, return graceful degradation — not an error.

13. **Brand colors are locked.** Primary: Warm Honey (#F59E0B → #D97706 gradient). Supporting: Teal (#20C9A0, #0FB8D9). Error: Red (#F87171). See Section 8 for full color system.

14. **The persona name is "Kai" (not "KA" in UI).** KA is the internal name for the AI persona. User-facing, it is "Kai" — the smart ate/kuya who always has your back.

15. **All Claude API calls are server-side only.** The Anthropic API key is never exposed to the client. All calls go through Next.js API routes.

---

## 7. What to Build First in Session 1 (Emergent Scope)

### Deliverable Checklist

Emergent should produce a working scaffold with these 6 components. Check each box before considering the session complete:

- [ ] **Next.js 14 PWA shell** — App Router, TypeScript strict, Tailwind CSS, Shadcn/UI, next-pwa with basic manifest and service worker. Mobile-first layout with Ink (#07101e) background. Plus Jakarta Sans font loaded via Google Fonts.

- [ ] **Supabase Auth** — Email OTP / magic link signup and login. Protected routes that redirect unauthenticated users. Session management with Supabase client (browser + server helpers). No social login.

- [ ] **Database schema** — At minimum, create these tables in Supabase with RLS, soft-delete, and audit columns:
  - `users` (extends auth.users — display_name, phone, created_at, updated_at, deleted_at)
  - `business_profiles` (user_id FK, business_name, business_type, income_range, bir_registered, created_at, updated_at, deleted_at)
  - `ka_conversations` (user_id FK, role enum ['user','assistant'], content text, domain varchar default 'general', created_at, deleted_at)
  > **Note:** The table name is `ka_conversations` (not `conversations`). Use this name consistently across all code.

- [ ] **Chat interface UI** — Mobile-optimized chat screen with:
  - Message bubble list (user messages right-aligned, KA messages left-aligned)
  - Text input bar with send button (fixed to bottom, above keyboard on mobile)
  - KA avatar/icon on assistant messages (use AKBai_Mark_Honey.png or brand color placeholder)
  - Loading state while waiting for Claude response (animated indicator, not blank)
  - Brand styling: Ink background, Warm Honey accents, Plus Jakarta Sans, rounded cards

- [ ] **`/api/chat` endpoint** — Server-side Next.js API route that:
  1. Authenticates the request via Supabase session
  2. Reads the user's message from the request body
  3. Fetches last 20 messages from `ka_conversations` for context
  4. Calls Claude Sonnet 4 (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` with a basic KA system prompt
  5. Stores both user message and KA response in `ka_conversations`
  6. Returns the KA response to the client
  - Basic KA system prompt to use:
    ```
    You are Kai, the AI business partner inside AKBai. You speak in natural Taglish
    (Filipino-English mix). You are warm, competent, and proactive. Use "po" naturally.
    Keep messages short — max 2 lines per response. Use digits for numbers (₱18,400 not
    "eighteen thousand"). Call the user by their first name when known. Never say
    "Certainly!", "As an AI...", or any robotic filler. You are a brilliant kababayan
    colleague, not a corporate chatbot.
    ```

- [ ] **Deployment config** — Vercel or Cloudflare Pages deployment configuration. Include `.env.example` with all environment variable stubs listed in Section 4. Ensure the app builds and deploys successfully.

### Acceptance Criteria (Definition of Done)

The scaffold is complete when:
1. A user can open the app URL on a mobile browser
2. They see a login/signup screen with email OTP
3. After authenticating, they land on a chat screen
4. They can type a message and tap send
5. The message is sent to Claude Sonnet 4 via `/api/chat`
6. A Taglish response from Kai appears in a styled chat bubble
7. The conversation persists in Supabase (refresh the page → messages are still there)
8. The PWA can be installed via "Add to Home Screen" (manifest + service worker are present)

### What NOT to Do

Do not spend credits on any of the following:
- Kilala Kita onboarding flow
- Dashboard with business data cards
- Receipt scanning or image upload
- BIR deadline logic or tax calculations
- Expense categorization
- Morning briefing generation
- Customer reply drafting
- Payment/subscription logic
- Multi-seat or team features
- Complex system prompt with domain scopes (use the basic prompt above)
- Feature flags, circuit breakers, or admin dashboards

These are all Phase 1 builds that will be done incrementally after the scaffold exists.

---

## 8. Brand Quick Reference (for UI Implementation)

### Colors
| Role | Hex | Use |
|------|-----|-----|
| Background (primary) | `#07101e` | Page background |
| Card background | `#0d1a2e` | Chat bubbles (KA), cards |
| Card alt | `#111f36` | Alternate cards |
| Warm Honey | `#F59E0B` | CTAs, send button, accents, KA avatar ring |
| Warm Honey Deep | `#D97706` | Hover states, gradient end |
| Teal | `#20C9A0` | Success states (not needed for scaffold) |
| Error Red | `#F87171` | Error messages |
| User bubble | `#1a2a42` (or similar dark-blue) | User message background |
| Text primary | `#FFFFFF` | Main text |
| Text secondary | `#94A3B8` | Timestamps, labels |

### Typography
- **Font:** Plus Jakarta Sans (Google Fonts) — load weights 400, 500, 600, 700, 800
- **Chat bubbles:** 14px / 400 weight
- **Labels:** 11px / 700 weight
- **Body:** 15px / 400 weight

### Logo
- PWA manifest icon: `AKBai_Icon_512.png` from `/brand/Logo Files/`
- Chat header: `AKBai_Logo_Primary_OnDark.png` or stacked variant
- KA avatar: `AKBai_Mark_Honey.png` (small, in chat message row)

---

## 9. Known Risks and Gotchas

1. **Supabase RLS is NOT optional.** If you create a table without RLS policies, any authenticated user can read all rows. This is a data privacy violation under Philippine law (RA 10173).

2. **UTC+8 timezone.** All timestamps displayed to users must be in Asia/Manila (UTC+8). Supabase stores in UTC by default. Convert on display.

3. **Service role key leaks.** The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. It must NEVER appear in client-side code or `NEXT_PUBLIC_` environment variables.

4. **Claude API key server-side only.** The `ANTHROPIC_API_KEY` must only be used in `/app/api/` routes, never imported in components or client code.

5. **No official website exists yet.** Do not generate links to any AKBai domain. The app URL will be assigned during deployment.

6. **Yahoo Mail deliverability.** Many Filipino users have Yahoo Mail accounts. Supabase Auth email delivery to Yahoo can fail. This is a known gap (D1 in gap registry) but not in Emergent scope.

7. **PWA "Add to Home Screen" on iOS.** iOS Safari does not show native PWA install banners. The manifest and service worker must be present, but the actual install guide UX is a post-scaffold task.

---

## 10. Reference Document Index

| Document | Location | What It Contains |
|----------|----------|-----------------|
| This master brief | `/AKBai/AKBAI_MASTER_BRIEF.md` | Single entry-point (you are reading it) |
| Product context | `/AKBai/akbai-delivery/shared/project-context.md` | Full product briefing (~220 lines) |
| Tech stack | `/AKBai/akbai-delivery/shared/tech-stack.md` | Canonical stack choices with rationale |
| Gap registry | `/AKBai/akbai-delivery/shared/gap-registry.md` | 29 gaps, 10 CRITICAL hard gates |
| Glossary | `/AKBai/akbai-delivery/shared/glossary.md` | All product, business, tech, Taglish terms |
| Brand context | `/AKBai/akbai-delivery/shared/brand-context.md` | Colors, typography, voice, positioning |
| Roadmap v14 | `/AKBai/project/AKBai_Complete_Roadmap_v14.pdf` | Full roadmap, feature specs, Build 0 scope |
| Financial Model v5 | `/AKBai/project/AKBai_Financial_Model_v5.xlsx` | Unit economics, projections |
| Market Research v1 | `/AKBai/project/AKBai_Market_Research_v1.pdf` | Personas, pain points, GTM playbook |
| Operations Playbook v7 | `/AKBai/project/AKBai_Operations_Playbook_v7.pdf` | UX lifecycle, support, data flows |
| Operations Roadmap v6 | `/AKBai/project/AKBai_Operations_Roadmap_v6.pdf` | OPS Builds 0–5B |
| Competitive Brief v2 | `/AKBai/project/AKBai_Competitive_Brief_v2.pdf` | Competitor matrix, moat analysis |
| Post-Implementation Vision | `/AKBai/project/AKBai_Post_Implementation_Vision_v1.pdf` | Phase 4+ domain expansion |
| Skills Utilization Guide | `/AKBai/project/AKBai_Skills_Utilization_Guide_v1.html` | Which skills per phase |
| Brand Book | `/AKBai/brand/AKBai Brand Book.pdf` | Full visual identity guidelines |
| Logo files | `/AKBai/brand/Logo Files/` | All logo variants (PNG) |

---

*End of master brief. If you are an AI app builder reading this document, everything you need to scaffold AKBai is above. Do not guess — read the referenced files if you need more detail on any section.*
