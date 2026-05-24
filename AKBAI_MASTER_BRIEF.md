# AKBAI_MASTER_BRIEF.md
> **Single entry-point document for AI app builders.**
> Last updated: 2026-05-24 (Sprint 13 — Native Mobile Pivot banner added; full doc rewrite deferred) | Original prepared: 2026-03-19 by Anton del Rosario (Founder)
> Read this ENTIRE file before writing a single line of code.

---

## ⚠️ STATUS UPDATE — 2026-05-24 (Sprint 13)

**Several sections of this brief are now stale.** The product has pivoted in three major ways since the original March 2026 draft. **Authoritative current state lives in `akbai-delivery/shared/project-context.md` and `akbai-delivery/shared/tech-stack.md` — read those FIRST** for current architecture, pricing, and phase status. This brief retains its historical/strategic value (market research, personas, pillar definitions, brand voice) but the platform + pricing sections below are superseded.

**What changed (full plan: `C:\Users\Anton del Rosario\.claude\plans\lets-review-our-approach-tidy-harp.md`):**

1. **Platform pivot — PWA → Native mobile via Capacitor.** AKBai now ships to App Store + Google Play, not just as a PWA. Capacitor wraps the existing Next.js code (~90% reuse) in iOS + Android native shells. Backend (Next.js API routes, Supabase, Claude API) unchanged.

2. **Pricing model rebuilt.** Old: Free / Pro ₱399 / Business ₱899 / Scale ₱1,499 (monthly subscriptions via Xendit). **New: 7-day free trial → ₱299 lifetime Starter (non-consumable IAP, capped to non-AI features) → ₱499/mo or ₱4,999/yr Pro subscription (auto-renewing IAP).** Tarsi-validated impulse-buy starter + subscription-protected unit economics for AI features.

3. **Payment integration — Xendit → App Store / Google Play IAP via RevenueCat SDK.** Xendit code remains on disk but is deferred indefinitely (was never activated — no live customers, zero migration cost). RevenueCat wraps StoreKit 2 + Play Billing in one library, free up to $10K MRR.

4. **Kai character evolution.** Existing Kai mark + persona being extended into a full illustrated character (body, 8+ expressions, scenarios) via Filipino illustrator commission. Brief at `akbai-delivery/skills/ux-designer/references/kai-character-brief.md`. NOT replacing Kai with a new mascot.

**Execution:** Sprints 13-18 (~6-9 weeks compressed, ~12-14 weeks sequential). Pre-launch — no paying users yet.

**This brief will be rewritten end-to-end in a future sprint.** For now, treat Sections 4 (tech stack) and 6 (pricing) as historical. Sections 1 (product summary), 2 (folder structure), 3 (market/personas), 5 (brand voice), 7 (brand quick reference), 8 (known risks) remain authoritative.

**Emergent-scaffold sections removed 2026-05-24 (Sprint 13)** — the Emergent scaffold work is long past; Build 0 through Build 7 have shipped (per `sprint-history.md`). All Emergent-scope guidance is obsolete and has been deleted to prevent confusion. Section numbering after Section 6 has been compacted (old Section 8 → 7, old 9 → 8, old 10 → 9).

---

## 1. Product Summary

AKBai — "Katuwang ng Negosyo Mo" (Your Business Partner) — is a mobile-first Progressive Web App that serves as an AI business partner for Filipino micro, small, and medium enterprises (MSMEs). The product targets 1.1 million digitally-active Filipino business owners whose primary pain points are manual receipt tracking, BIR (Bureau of Internal Revenue) compliance anxiety, zero cash-flow visibility, and hours lost to customer DM management. AKBai is not a chatbot. Its AI persona, "Kai" (short for Katuwang — partner), speaks first, proactively surfaces business insights, and communicates in natural conversational Filipino — a Filipino syntactic frame (VSO word order, second-position enclitic pronouns, Filipino conjunctions and particles) with English retained only for technical/BIR terms, Filipinized verbs (i-save, i-scan, na-scan), brand names, and numbers.

The product is built by a solo founder (Anton del Rosario) working evenings and weekends alongside a day job at Globe Telecom. Sprint capacity is 10–15 hours per two-week sprint. The monetization model uses three tiers: Free (₱0, Haiku-only, 10 queries/day), Pro (₱399/month, 50 receipt scans, full Sonnet access), and Business (₱899/month, 80 scans, multi-seat). Unit economics are strong: Pro LTV of ₱9,975, blended CAC of ₱110, LTV/CAC ratio of 91x, with break-even projected at Month 7 and Year 1 net profit target of ₱110,303.

The project is currently in **Phase 0A — Sprint 13 (Frontend Redesign Phase 8-9 close-out)** as of 2026-05-24. Builds 0-7 have shipped (per `akbai-delivery/shared/sprint-history.md`); Build 8 (Costing + Invoice Cards) remains. The brand identity, market research, financial model, competitive brief, operations playbook, and full product roadmap (v14) are complete. Next milestone: native mobile pivot via Capacitor (Sprints 14-19 per `lets-review-our-approach-tidy-harp.md` plan). Phase 1 targets are 50 registered users, 20 paying Pro subscribers, and ₱6K–₱10K MRR.

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
│   ├── AKBai Brand Book.pdf             ← Full brand guidelines (needs regeneration)
│   ├── generate_logos.py                ← Logo variant generator script
│   └── Logo Files/                      ← Production logo PNGs (Kai face mark)
│       ├── AKBai_Logo_Primary_OnDark.png
│       ├── AKBai_Logo_Primary_OnLight.png
│       ├── AKBai_Logo_Primary_OnGradient.png
│       ├── AKBai_Logo_Stacked_OnDark.png
│       ├── AKBai_Logo_Stacked_OnLight.png
│       ├── AKBai_Logo_Stacked_OnGradient.png
│       ├── AKBai_Icon_512.png           ← PWA icon (dark bg)
│       ├── AKBai_Icon_512_Honey.png
│       ├── AKBai_Icon_512_Light.png
│       ├── AKBai_Mark_Honey.png
│       ├── AKBai_Mark_OnDark.png
│       ├── AKBai_Mark_OnLight.png
│       ├── AKBai_Mark_OnGradient.png
│       ├── logo-transparent.png         ← Mark on transparent bg
│       └── new-logo-source.png          ← Original stacked source
│
├── akbai-delivery/                      ← Claude Code plugin (12 skills, 15 commands)
│   ├── .claude-plugin/plugin.json       ← Plugin manifest
│   ├── shared/                          ← Shared context files (READ THESE FIRST in any session)
│   │   ├── project-context.md           ← Full product briefing (~220 lines)
│   │   ├── tech-stack.md                ← Canonical stack reference (Next.js 14, Supabase, Claude API, etc.)
│   │   ├── gap-registry.md              ← 29 pre-launch gaps, 10 CRITICAL hard gates
│   │   ├── glossary.md                  ← Product, business, technical, and Filipino language terms
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
│   │   ├── qa-engineer/                 ← Testing strategy, conversational Filipino prompt regression
│   │   ├── security-compliance/         ← NPC/RA 10173, data privacy, RLS audit
│   │   ├── solutions-architect/         ← System design, domain-expandable architecture
│   │   └── ux-designer/                 ← Mobile-first UI, PWA install UX, conversational Filipino empty states
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

### Build Order for Phase 1

> **Status update 2026-05-24:** Builds 0-7 have shipped (per `akbai-delivery/shared/sprint-history.md`). Build 8 (Costing + Invoice Cards) is the only remaining build before MVP-complete. Current focus: Sprint 13 (Frontend Redesign Phase 8-9 close-out) → Sprints 14-19 (Native Mobile Pivot). Table below kept for reference.

| Build | Name | What It Does | Depends On |
|-------|------|-------------|------------|
| 0 | AI Scope Definition | System prompt architecture, domain-expandable design, disclaimers | **HARD GATE** — nothing proceeds without this |
| 1 | Kilala Kita | 5-step onboarding (business type, income range, pain, BIR consent, bootstrap) | Build 0 |
| 2 | Dashboard | Business health at a glance (cash, trends, deadlines, tasks) | Build 1 |
| 3 | Resibo Scanner | Camera → Claude Haiku Vision → structured expense card (₱0.16/scan) | Build 2 |
| 4 | Saan Napunta | Expense dashboard with categorized spend and cash flow | Build 3 |
| 5 | Ang Umaga Mo | Morning Briefing — proactive daily summary from Kai | Build 4 |
| 6 | Deadline Watcher | BIR compliance calendar with push notification sequence | Build 5 |
| 7 | Reply Drafter | Kai drafts customer DM replies (manual copy-paste in Phase 1) | Build 5 |
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
| AI (lightweight) | **Claude Haiku** (`claude-haiku-4-5`) | For OCR, classification, free-tier queries. |
| Auth | **Supabase Auth** (magic link / email OTP) | No social login in Phase 1. |
| Payments | **Xendit** (DEPRECATED 2026-05-24 — see `tech-stack.md`) | Replaced by IAP (Apple StoreKit 2 + Google Play Billing via RevenueCat). |
| Deployment | **Vercel** (Phase 1) → **Cloudflare Pages** (Month 7+) | Web backend stays on Vercel during native pivot; mobile app ships to App Store + Play Store. |
| PWA | **next-pwa** (DEPRECATED 2026-05-24 — Capacitor wraps web build for native shells) | Manifest + service worker retained as web fallback. |
| Data fetching | **TanStack Query + Persister** | Offline-first caching. |
| Email | **Resend** | Transactional only. |
| Monitoring | **Sentry** (errors) + **PostHog** (analytics) | Required for production. |

### AI API Call Pattern (Critical for /api/chat endpoint)
```typescript
// /app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(req: Request) {
  // 1. Authenticate user via Supabase session
  // 2. Extract message from request body
  // 3. Fetch user's conversation history from ka_conversations table
  // 4. Assemble system prompt (Kai persona + user context)
  // 5. Call Claude Sonnet 4 API (claude-sonnet-4-6)
  // 6. Store both user message and Kai response in ka_conversations
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
    chat/              # Chat interface with Kai
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

## 5. Agent Teams — How Builds Execute

The akbai-delivery plugin has 12 role-based skills in `akbai-delivery/skills/` and 12 matching agent definitions in `.claude/agents/`. Builds use **agent teams** — the PM lead spawns teammates who work in parallel and communicate via shared task lists.

**How it works:** Run `/build [feature]` and the PM automatically selects the right teammates:

| Build Task | Agent Team Composition |
|-----------|----------------------|
| Build 5: Ang Umaga Mo (morning brief) | po + architect + ai + engineer + qa |
| Build 6: Deadline Watcher | po + architect + data + engineer + ux + qa |
| Build 7: Reply Drafter | po + architect + ai + engineer + marketing + qa |
| Build 8: Costing + Invoices | po + architect + data + engineer + ux + qa |
| Database schema design | architect + data + security |
| RLS & data privacy audit | security + data + qa |
| Deployment & CI/CD | devops + qa + security + ops |
| Sprint planning | PM lead + po + stream workers + qa |

**PM decision checklist (which agents to include):**
1. Touches UI? → `build-ux` | 2. New feature? → `build-po` | 3. New tables? → `build-data`
4. Claude API? → `build-ai` | 5. Significant conversational Filipino copy? → `build-marketing` | 6. Auth/PII? → `review-security`
7. Always: `build-architect` + `build-engineer` + `build-qa`

S-features (bug fixes, config) skip teams and run sequentially. For the full usage guide, see `akbai-delivery/shared/agent-teams-guide.md`.

Each skill has a SKILL.md file in `akbai-delivery/skills/[skill-name]/SKILL.md`. Agent definitions are in `.claude/agents/`.

---

## 6. Key Decisions Already Made — Do Not Override

These decisions have been locked after 14 roadmap iterations, 7 ops playbook versions, and extensive market research. They are non-negotiable:

1. **Conversational Filipino is the product language.** All user-facing text uses a Filipino syntactic frame: VSO word order, second-position enclitic pronouns (e.g., "bago natin i-save", not "bago i-save natin"), Filipino conjunctions (kung, bago, kasi, dahil, kapag) not English ones (if, before, because, when), Filipino prepositions (ayon sa, batay sa) not "based sa", and Filipino time adverbs (ngayong linggo, nakaraang buwan) not "this week/last month". English is retained only for technical/BIR terms (1701Q, VAT, net income), Filipinized verbs with i-/mag-/na- affixes (i-save, i-scan, na-scan, i-track), brand names (GCash, Maya, Shopee), and numbers/currency/dates. Not fully English, not fully formal Tagalog, and critically — not Taglish (English SVO with Filipino vocabulary sprinkled in). This is how the target MSME market communicates naturally.

2. **Kai speaks first.** The AI is proactive, not reactive. It sends the morning briefing before being asked. It flags the BIR deadline before the user remembers. This is the core product differentiator.

3. **Claude API, not OpenAI.** The AI brain is Claude (Sonnet 4 for reasoning, Haiku for lightweight tasks). This was chosen for response quality on Filipino business context and structured output reliability.

4. **Supabase, not Firebase.** Postgres with RLS provides the data isolation model required for financial data. Edge Functions for webhooks only; all other server logic in Next.js API routes.

5. **PWA, not native app.** No App Store listing. Install via "Add to Home Screen." This avoids app review delays and 30% platform fees. PWA install UX is a required design gate.

6. **Vercel (Phase 1) → Cloudflare Pages (Month 7+).** Web backend currently on Vercel free tier. Migration to Cloudflare Pages planned for Month 7+ cost optimization. Do not architect around Vercel-specific features.

7. **Mobile-first, light theme default.** The primary background is Surface (#fdf9f2). Cards are #f1ede7. Text is #1c1c18 (on-surface). Dark mode available via user preference toggle (dark background #07101e, cards #0d1a2e). Never pure black. Never cold greys. Font is Plus Jakarta Sans (Google Fonts).

8. **Shadcn/UI only.** No Material UI, no Bootstrap, no Chakra. Shadcn gives composable primitives with zero unused CSS.

9. **RLS on every table, soft-delete only, audit columns on everything.** This is required for NPC (National Privacy Commission) compliance under RA 10173. Hardcoded from Day 1.

10. **No tax advice.** AKBai provides tax reminders and calculations, never advice. Every BIR-related output carries a disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

11. **No hard deletes of user data.** Soft-delete with `deleted_at` timestamp. 7-day purge window after deletion request per NPC requirements.

12. **Circuit breaker on AI spend.** Daily Claude API spend cap tracked in a Supabase table. When hit, return graceful degradation — not an error.

13. **Brand colors are locked.** Primary: Warm Honey (#F59E0B → #D97706 gradient). Supporting: Teal (#20C9A0, #0FB8D9). Error: Red (#F87171). See Section 7 (Brand Quick Reference) for full color system.

14. **The persona name is "Kai."** The AI persona is named "Kai" — the smart ate/kuya who always has your back.

15. **All Claude API calls are server-side only.** The Anthropic API key is never exposed to the client. All calls go through Next.js API routes.

---

## 7. Brand Quick Reference (for UI Implementation)

### Colors (Light-First — "The Art of Warmth")
| Role | Light Hex | Dark Hex | Use |
|------|-----------|----------|-----|
| Background (primary) | `#fdf9f2` | `#07101e` | Page background (light-first default, dark mode uses #07101e) |
| Card background | `#f1ede7` | `#0d1a2e` | Chat bubbles (Kai), cards |
| Card alt | `#ebe8e1` | `#111f36` | Alternate cards |
| Warm Honey | `#F59E0B` | `#F59E0B` | CTAs, send button, accents, Kai avatar ring |
| Primary action | `#855300` | `#ffb95f` | Primary CTAs, active indicators |
| Teal / Tertiary | `#006b54` | `#43deb4` | Success states, financial data |
| Error Red | `#F87171` | `#F87171` | Error messages |
| Text primary | `#1c1c18` | `#e6e2db` | Main text (on-surface) |
| Text secondary | `#534434` | `#d8c3ad` | Timestamps, labels (on-surface-variant) |

### Typography
- **Font:** Plus Jakarta Sans (Google Fonts) — load weights 400, 500, 600, 700, 800
- **Chat bubbles:** 14px / 400 weight
- **Labels:** 11px / 700 weight
- **Body:** 15px / 400 weight

### Logo
- PWA manifest icon: `AKBai_Icon_512.png` from `/brand/Logo Files/`
- Chat header: `AKBai_Logo_Primary_OnDark.png` or stacked variant
- Kai avatar: `AKBai_Mark_Honey.png` (small, in chat message row)

---

## 8. Known Risks and Gotchas

1. **Supabase RLS is NOT optional.** If you create a table without RLS policies, any authenticated user can read all rows. This is a data privacy violation under Philippine law (RA 10173).

2. **UTC+8 timezone.** All timestamps displayed to users must be in Asia/Manila (UTC+8). Supabase stores in UTC by default. Convert on display.

3. **Service role key leaks.** The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. It must NEVER appear in client-side code or `NEXT_PUBLIC_` environment variables.

4. **Claude API key server-side only.** The `ANTHROPIC_API_KEY` must only be used in `/app/api/` routes, never imported in components or client code.

5. **No official website exists yet.** Do not generate links to any AKBai domain. The app URL will be assigned during deployment.

6. **Yahoo Mail deliverability.** Many Filipino users have Yahoo Mail accounts. Supabase Auth email delivery to Yahoo can fail. This is a known gap (D1 in gap registry) — downgraded to IMPORTANT in Sprint 4 once Supabase built-in email proved reliable for early users. Revisit when custom SMTP / domain purchase.

7. **PWA "Add to Home Screen" on iOS.** iOS Safari does not show native PWA install banners. The manifest and service worker must be present, but the actual install guide UX is a post-scaffold task.

---

## 9. Reference Document Index

| Document | Location | What It Contains |
|----------|----------|-----------------|
| This master brief | `/AKBai/AKBAI_MASTER_BRIEF.md` | Single entry-point (you are reading it) |
| Product context | `/AKBai/akbai-delivery/shared/project-context.md` | Full product briefing (~220 lines) |
| Tech stack | `/AKBai/akbai-delivery/shared/tech-stack.md` | Canonical stack choices with rationale |
| Gap registry | `/AKBai/akbai-delivery/shared/gap-registry.md` | 29 gaps, 10 CRITICAL hard gates |
| Glossary | `/AKBai/akbai-delivery/shared/glossary.md` | All product, business, tech, Filipino language terms |
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
