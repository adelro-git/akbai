# HANDOVER.md — AKBai Comprehensive Build Handover

> Consolidated handover document combining the pre-build scaffold template (main branch) with the completed Emergent build output (akbai-app-dev branch).
> **Last updated:** 2026-03-19 | **Owner:** Anton del Rosario

---

## Part 1 — What Emergent Built

### Deployment

| Field | Value |
|-------|-------|
| Production URL | Not yet deployed to production (Emergent local dev only) |
| Supabase Project URL | `https://naxjmwjrhzenjqburejl.supabase.co` |
| Supabase Project ID | `naxjmwjrhzenjqburejl` |
| Git repository | `https://github.com/adelro-git/akbai` |
| Branch strategy | `main` = plugin/brand/project assets; `akbai-app-dev` = Emergent application code |
| Node.js version | 20.x |
| Next.js version | 16.2.0 (App Router, Turbopack) |

### Auth

| Field | Value |
|-------|-------|
| Auth method | Supabase Email OTP + Magic Link |
| Session duration | Supabase default (JWT-based, refresh tokens) |
| Redirect after login | `/chat` |
| Social login | None — intentionally excluded |
| Password auth | None — intentionally excluded |

### Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js 16 PWA scaffold | Done | App Router, TypeScript, Turbopack |
| Supabase Auth (Email OTP) | Done | Magic link + OTP code flow |
| Login page (2-step) | Done | Email entry then OTP code entry |
| Auth callback route | Done | Handles magic link redirects |
| Auth middleware (proxy.ts) | Done | Redirects unauthenticated users |
| Chat interface UI | Done | Mobile-first, full-height, typing indicator |
| AI Chat endpoint (`/api/chat`) | Done | Claude Sonnet 4-6 via Emergent LLM key |
| Kai system prompt | Done | Taglish personality, BIR scope, disclaimers |
| Conversation persistence | Done | Stored in Supabase `ka_conversations` table |
| PWA manifest + service worker | Done | `manifest.json`, `sw.js`, app icons |
| Dashboard placeholder | Done | Redirects to chat for now |
| FastAPI backend proxy | Done | Routes `/api/*` to Next.js, handles `/api/chat` directly |
| SQL migration file | Done | All tables, RLS policies, triggers |

### Database Schema (Supabase PostgreSQL)

Already created via `001_initial_schema.sql`. All tables have RLS enabled.

**Table: `users`** (extends `auth.users`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, FK to auth.users(id) |
| `display_name` | text | User display name |
| `phone` | text | Phone number |
| `feature_flags` | jsonb | Default `'{}'` |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**Table: `business_profiles`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to users(id) |
| `business_name` | text | Business name |
| `business_type` | text | Type of business |
| `income_range` | text | Income bracket |
| `bir_registered` | boolean | Default false |
| `profile_version` | integer | Default 1 |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**Table: `ka_conversations`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to users(id) |
| `role` | message_role enum | 'user' or 'assistant' |
| `content` | text | Message body (NOT NULL) |
| `domain` | varchar(50) | Default 'general' |
| `created_at` | timestamptz | auto |
| `deleted_at` | timestamptz | soft-delete |

**RLS Policies:** All tables enforce `auth.uid() = user_id` for SELECT/INSERT/UPDATE. The backend uses the service role key to bypass RLS for server-side operations.

**Triggers:**
- `on_auth_user_created` — auto-inserts into `public.users` on signup
- `on_users_updated` / `on_business_profiles_updated` — auto-updates `updated_at`

### `/api/chat` Endpoint

| Field | Value |
|-------|-------|
| Route | `POST /api/chat` (FastAPI — primary) |
| Claude model | `claude-sonnet-4-6` |
| System prompt | Taglish Kai persona with BIR scope + disclaimers |
| Context window | Fetches conversation history from `ka_conversations` |
| Auth check | Extracts Supabase JWT from SSR cookies (`sb-<ref>-auth-token`) |
| API key location | Server-side env var (`EMERGENT_LLM_KEY` — needs migration to `ANTHROPIC_API_KEY`) |
| Messages persisted | Yes, both user message and Kai response stored |
| Errors | 401 (no auth), 400 (empty message), 500 (server error) |

### Architecture

```
Browser (Mobile PWA)
  |
  |-- Static assets --> Next.js (port 3000)
  |-- /api/chat --> FastAPI (port 8001) --> Claude Sonnet via emergentintegrations
  +-- /api/* (other) --> FastAPI (port 8001) --> proxies to Next.js (port 3000)
```

**Tech Stack:**

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16.2.0 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 3.4 + Shadcn/UI components |
| Font | Plus Jakarta Sans (via next/font/google) |
| Auth | Supabase Auth (Email OTP / Magic Link) |
| Database | Supabase PostgreSQL with Row-Level Security |
| AI | Claude `claude-sonnet-4-6` via `emergentintegrations` Python library |
| Backend | FastAPI (Python) — handles AI chat + proxies other routes to Next.js |
| PWA | Custom `manifest.json` + `sw.js` |
| Deployment Target | Vercel (frontend), or self-hosted |

### Key Architectural Decisions

1. **AI chat runs on FastAPI (Python), not Next.js** — The Emergent LLM library (`emergentintegrations`) is Python-only. The FastAPI `/api/chat` endpoint handles auth, conversation history, and AI calls. Registered BEFORE the catch-all proxy route.

2. **Login form uses uncontrolled inputs (refs) instead of React state** — React 19 + Next.js 16 has issues with controlled inputs where `onChange`/`onInput` don't reliably update state. Uses `useRef` and `type="button"` + `onClick` (no `<form onSubmit>`).

3. **Next.js middleware uses `proxy.ts`** — Next.js 16 convention requires `proxy.ts` (not `middleware.ts`) with a `proxy()` export (not `middleware()`).

4. **Route groups for page organization** — Pages organized under `(app)/` (authenticated) and `(auth)/` (public) route groups.

### File Structure (akbai-app-dev branch)

```
/
|-- backend/
|   |-- .env                          # Backend env vars (Supabase, Emergent key)
|   |-- server.py                     # FastAPI: /api/chat handler + proxy to Next.js
|   |-- requirements.txt              # Python dependencies
|   +-- tests/
|       +-- test_akbai_api.py         # API tests
|
|-- frontend/
|   |-- .env.local                    # Frontend env vars (Supabase keys)
|   |-- next.config.js                # Next.js config (Turbopack, origins, images)
|   |-- tailwind.config.js            # Tailwind with AKBai brand colors
|   |-- package.json                  # Node dependencies
|   |-- tsconfig.json                 # TypeScript config
|   |-- vercel.json                   # Vercel deployment config
|   |
|   |-- public/
|   |   |-- manifest.json             # PWA manifest
|   |   |-- sw.js                     # Service worker
|   |   +-- icons/ (icon-192.png, icon-512.png)
|   |
|   |-- supabase/
|   |   +-- migrations/
|   |       +-- 001_initial_schema.sql  # Full DB schema (already run)
|   |
|   +-- src/
|       |-- proxy.ts                  # Next.js 16 middleware (auth redirects)
|       |-- app/
|       |   |-- layout.tsx            # Root layout (font, PWA meta, SW registration)
|       |   |-- page.tsx              # Root "/" — redirects to /chat or /login
|       |   |-- globals.css           # Tailwind base + AKBai CSS variables
|       |   |-- (auth)/login/page.tsx # Login page
|       |   |-- (app)/layout.tsx      # App group layout
|       |   |-- (app)/chat/page.tsx   # Chat page (server component, loads history)
|       |   |-- (app)/dashboard/page.tsx # Dashboard placeholder
|       |   |-- api/chat/route.ts     # Next.js API fallback (not primary)
|       |   +-- auth/callback/route.ts # Supabase magic link callback
|       |
|       |-- components/
|       |   |-- auth/login-form.tsx    # Login form (uncontrolled, ref-based)
|       |   |-- chat/ (chat-interface.tsx, chat-input.tsx, chat-bubble.tsx, message-list.tsx)
|       |   +-- ui/ (Shadcn/UI components)
|       |
|       +-- lib/supabase/ (client.ts, server.ts, middleware.ts)
|
|-- memory/PRD.md                     # Product Requirements Document
+-- test_reports/ (iteration_1-4.json)
```

### Environment Variables

**Backend (`backend/.env`):**

| Variable | Value/Status |
|----------|-------------|
| `SUPABASE_URL` | Set (naxjmwjrhzenjqburejl.supabase.co) |
| `SUPABASE_PUBLISHABLE_KEY` | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Set |
| `EMERGENT_LLM_KEY` | Set (Emergent-only; replace with ANTHROPIC_API_KEY) |
| `MONGO_URL` / `DB_NAME` | Emergent platform requirement (remove for production) |

**Frontend (`frontend/.env.local`):**

| Variable | Value/Status |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Set |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Set (server-side only, not NEXT_PUBLIC_) |
| `ANTHROPIC_API_KEY` | Placeholder (needs real key) |

**Stubbed (not configured yet):** XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN, SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, RESEND_API_KEY

### PWA Status

| Item | Status |
|------|--------|
| `manifest.json` present | YES |
| Service worker registered | YES |
| App icon (512x512) in manifest | YES |
| "Add to Home Screen" tested on iOS | NOT YET |
| "Add to Home Screen" tested on Android | NOT YET |

### Testing

- Backend tests: `backend/tests/test_akbai_api.py`
- Test reports: `test_reports/iteration_1.json` through `iteration_4.json`
- Latest results (iteration 4): 100% backend (11/11), 100% frontend
- Manual testing required: Full OTP login flow (needs real email + Supabase)

---

## Part 2 — What Was Intentionally Left Out

The following were explicitly excluded from the Emergent scaffold. Do not treat their absence as a bug.

### Features Not Built (by design)

- **Kilala Kita** — 5-step hybrid onboarding flow (Build 1)
- **Dashboard** — Business health cards, cash position, task list (Build 2)
- **Resibo Scanner** — Camera to Claude Haiku Vision to expense card (Build 3)
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

- **System prompt is basic** — Minimal KA persona prompt. Build 0 (AI Scope Definition) will replace this with the domain-expandable architecture before any feature build.
- **No Kilala Kita = no personalization** — Kai does not know the user's business type, income, or BIR status yet. All responses are generic until Build 1 completes.
- **No UTC+8 enforcement** — Timestamps stored in UTC. Timezone display logic is a Phase 1 Day 1 task (Gap A3).
- **No session expiry UX** — Expired sessions show a raw error or redirect, not a graceful Taglish re-auth prompt (Gap D6).

---

## Part 3 — Known Issues & Gotchas

### Critical Technical Issues

1. **React 19 controlled inputs** — `<input value={state} onChange={...}>` does NOT reliably update state in Next.js 16 / React 19 production builds. Login form rewritten to use uncontrolled refs (`useRef`) + `type="button"` + `onClick`. Apply same pattern for any new forms.

2. **`emergentintegrations` is Emergent-only** — Works only with the Emergent Universal Key inside the Emergent platform. For production, replace with the official `anthropic` Python SDK:
   ```python
   # Replace this (Emergent):
   from emergentintegrations.llm.chat import LlmChat, UserMessage
   chat = LlmChat(api_key=key, session_id=sid, system_message=prompt)
   chat.with_model("anthropic", "claude-sonnet-4-6")
   response = await chat.send_message(UserMessage(text=msg))

   # With this (official Anthropic SDK):
   import anthropic
   client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
   response = client.messages.create(
       model="claude-sonnet-4-6",
       max_tokens=512,
       system=system_prompt,
       messages=[{"role": "user", "content": msg}]
   )
   kai_response = response.content[0].text
   ```

3. **Supabase SSR cookies** — Project ref is `naxjmwjrhzenjqburejl`. Cookies named `sb-naxjmwjrhzenjqburejl-auth-token` may be chunked (`.0`, `.1`, etc.) for large sessions. The FastAPI backend handles both formats.

4. **Next.js middleware naming** — Must be `proxy.ts` with `export async function proxy()` (not `middleware.ts`). Next.js 16 convention.

5. **Turbopack root** — `next.config.js` sets `turbopack.root` to `__dirname` to fix workspace root resolution issues.

6. **`allowedDevOrigins`** — Emergent uses dynamic cluster hostnames. Remove from `next.config.js` for production.

### Gap Registry Active Risk Items

#### CRITICAL — Must fix before any real user accesses the app

| Gap | Description | Fix In |
|-----|-------------|--------|
| A1 | Auth must be fully working end-to-end — test OTP delivery, session persistence, protected route redirect | Immediately post-scaffold |
| D1 | Yahoo Mail OTP deliverability — Supabase default SendGrid has poor PH delivery rates. Configure custom SMTP with a warmed domain. | Before Phase 0B waitlist |
| A3 | UTC+8 timezone enforcement — all BIR deadlines, timestamps, push notifications must display in Asia/Manila | Phase 1 Day 1 |
| A4 | Sentry error monitoring — zero production visibility without this. Set up with source maps. | Before first beta user |
| A5 | PostHog analytics — required to measure all 8 Sense Check Gate signals. | Before first beta user |
| E1 | Resibo OCR technical spike — test Claude Haiku Vision on 10-15 real Filipino receipts. Hard gate before Build 3. | Phase 0A, 1 afternoon |

#### IMPORTANT — Address during Phase 1 builds

| Gap | Description | Fix In |
|-----|-------------|--------|
| B1 | AI loading states — Claude takes 3-10s. Taglish loading indicator required. | Build 1 |
| B3 | Onboarding recovery — Kilala Kita must be resumable if user drops mid-flow | Build 1 |
| B5 | Empty states — all Dashboard cards and Chat history need Taglish empty state copy | Build 2 |
| B7 | iOS PWA install prompt — no native banner on iOS. Explicit guide required. | Phase 1 launch |
| C1 | Receipt deduplication — hash-based dedup before saving scanned receipts | Build 3 |
| D2 | Xendit webhook idempotency — deduplicate by payment_id | Build 4 |
| D6 | Session expiry UX — graceful Taglish re-auth prompt | Build 3 |
| E3 | Onboarding rate-limit exemption — free-tier 10/day limit must NOT apply during Kilala Kita | Build 1 |

### Design Gates (non-negotiable before Phase 1 launch)

| Gate | Description | Owner Skill |
|------|-------------|-------------|
| Build 0 (HARD GATE) | AI Scope Definition & domain-expandable system prompt architecture | `ai-engineer` |
| Trust Recovery Pattern | "Flag as Wrong" mechanism + persistent financial disclaimer | `ux-designer` + `ai-engineer` |
| Taglish Style Guide + Prompt Regression Tests | 20-30 case test library on every prompt/model change | `qa-engineer` + `ai-engineer` |
| Offline UX Minimum | Taglish offline message, cached Morning Briefing, queued actions | `ux-designer` + `fullstack-engineer` |
| Feature Flag System | Boolean column in `users` table, checked in middleware | `data-architect` + `fullstack-engineer` |
| 4-Layer Data Isolation | RLS + user-scoped prompt + conversation isolation + profile versioning | `security-compliance` + `data-architect` |
| Domain-Expandable Architecture | Modular prompt scopes, domain-tagged conversations, redirect logging | `ai-engineer` + `solutions-architect` |

---

## Part 4 — Migration Guide: Emergent to Production

### Step 1: Replace AI integration

- Remove `emergentintegrations` from `requirements.txt`
- Install `anthropic` (`pip install anthropic`)
- Update `server.py` to use official Anthropic SDK (see code snippet in Part 3)
- Set `ANTHROPIC_API_KEY` env var with your real key

### Step 2: Deploy frontend to Vercel

- Push the `/frontend` directory
- Set env vars in Vercel dashboard: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- `vercel.json` already included

### Step 3: Deploy backend separately (if needed)

- FastAPI backend handles `/api/chat` with AI + Supabase
- Can be deployed to Railway, Render, Fly.io, etc.
- OR move chat logic back into Next.js API route (`/api/chat/route.ts`) using the official Anthropic TypeScript SDK for single deployment

### Step 4: Remove Emergent-specific config

- Remove `allowedDevOrigins` from `next.config.js`
- Remove `MONGO_URL`, `DB_NAME` from backend `.env`
- Remove the FastAPI proxy catch-all if consolidating into Next.js

---

## Part 5 — What Claude Code Builds Next (All 5 Pillars)

### The 5 Pillars

1. **Financial Tracking** — Receipts, expenses, cash flow, costing, invoicing
2. **BIR Compliance** — Deadline calendar, tax type detection, calculation aids, disclaimer-compliant guidance
3. **Customer Communications** — DM reply drafting, follow-up suggestions, message tone matching
4. **Daily Operations** — Morning briefing, task prioritization, cash position at a glance
5. **Task Prioritisation** — KA surfaces what needs action today, in order of urgency

### Pre-Build Sequence (HARD GATE)

**BUILD 0 — AI Scope Definition & System Prompt Architecture**

| Item | Detail |
|------|--------|
| What it does | Defines in-scope/out-of-scope boundaries for KA. Implements domain-expandable prompt architecture with modular scope sections. Adds BIR financial disclaimer. Establishes Taglish tone rules. Logs out-of-scope redirects. |
| Why it's a hard gate | Every subsequent build's AI quality depends on the system prompt architecture. |
| Skills | `ai-engineer` (primary) + `solutions-architect` + `product-owner` |
| Effort | 2-3 days (evenings/weekend) |
| Output | Production-ready system prompt in `/lib/claude/system-prompt.ts`, modular scope loader, prompt regression test suite (20-30 cases) |

### Build 1 — Kilala Kita (Onboarding) | All 5 pillars

5-step hybrid onboarding: business type, income range, primary pain, BIR registration consent, data bootstrap. Must be resumable mid-flow (Gap B3). Rate-limit counter must NOT start until after completion (Gap E3). Effort: 1 sprint (10-15 hrs).

### Build 2 — Dashboard (Home Tab) | Daily Operations, Financial Tracking

Business health at a glance: cash position, recent sales trend, upcoming BIR deadlines, task list from KA. All cards need Taglish empty states (Gap B5). Mobile-first layout with bottom tab nav. Effort: 1 sprint.

### Build 3 — Resibo Scanner | Financial Tracking

Camera to Claude Haiku Vision to structured expense card. Cost: ~P0.16/scan. Receipt dedup by hash (Gap C1). OCR spike (Gap E1) must complete first. Effort: 1.5 sprints.

### Build 4 — Saan Napunta (Expense Dashboard) | Financial Tracking, Daily Operations

Categorized expense breakdown, spending trends, cash flow visibility. UTC+8 display (Gap A3). Xendit webhook idempotency (Gap D2). Effort: 1 sprint.

### Build 5 — Ang Umaga Mo (Morning Briefing) | Daily Operations

Daily proactive briefing card from KA: yesterday's income, today's BIR deadlines, cash position, top task. Cached for offline. Supabase cron for scheduling. Effort: 1 sprint.

### Build 6 — Deadline Watcher | BIR Compliance

BIR calendar personalized to business type. Push notification sequence: 7-day, 3-day, 1-day reminders. Deadlines from Supabase lookup table. BIR disclaimer required on all outputs. Effort: 1.5 sprints.

### Build 7 — Reply Drafter | Customer Communications

Paste customer DM, KA drafts reply matching tone. Phase 1: manual copy-paste. Human in the loop always. Effort: 1 sprint.

### Build 8 — Costing Cards + Invoice Cards | Financial Tracking

Costing: input costs, get unit cost + margin. Invoicing: line items, due date, payment status. PDF export (server-side). No auto-sequenced OR numbers without BIR sign-off. Effort: 2 sprints.

---

## Part 6 — Skill File Activation Map

| Build | Task | Load These Skills (in order) |
|-------|------|------------------------------|
| Pre-work | Read gap registry, update phase status | `project-manager` |
| **Build 0** | System prompt + AI scope | `ai-engineer` then `solutions-architect` then `product-owner` |
| **Build 1** | Kilala Kita onboarding | `ux-designer` then `fullstack-engineer` then `data-architect` |
| **Build 2** | Dashboard | `fullstack-engineer` then `ux-designer` then `data-architect` |
| **Build 3** | Resibo Scanner | `ai-engineer` then `fullstack-engineer` then `qa-engineer` |
| **Build 4** | Saan Napunta | `fullstack-engineer` then `data-architect` then `ux-designer` |
| **Build 5** | Ang Umaga Mo | `ai-engineer` then `fullstack-engineer` then `ops-lead` |
| **Build 6** | Deadline Watcher | `fullstack-engineer` then `data-architect` then `security-compliance` |
| **Build 7** | Reply Drafter | `ai-engineer` then `fullstack-engineer` then `ux-designer` |
| **Build 8** | Costing + Invoices | `fullstack-engineer` then `data-architect` then `ux-designer` |
| Any build | Database schema / migrations | `data-architect` then `security-compliance` |
| Any build | Deployment, CI/CD, monitoring | `devops-engineer` |
| Any build | Testing, prompt regression | `qa-engineer` then `ai-engineer` |
| Phase 1 end | Sense Check Gate | `product-owner` then `project-manager` then `marketing-lead` |

---

## Part 7 — Plugin Status (akbai-delivery)

The akbai-delivery plugin lives on the `main` branch at `/akbai-delivery/`.

| Metric | Value |
|--------|-------|
| Version | 0.2.0 |
| Skills | 12 (all complete) |
| Commands | 15 (all complete) |
| Phase | commands-complete |

**Skills:** ai-engineer, data-architect, devops-engineer, fullstack-engineer, marketing-lead, ops-lead, product-owner, project-manager, qa-engineer, security-compliance, solutions-architect, ux-designer

**Commands:** sprint, standup, gap-check, retro, build, review, test, deploy, incident, sense-check, schema, prompt, copy, compliance, metrics

---

## Part 8 — Brand / Design

| Token | Value |
|-------|-------|
| Background (Ink) | `#07101e` |
| Card | `#0d1a2e` |
| Card Alt | `#111f36` |
| Warm Honey (CTAs) | `#F59E0B` |
| Honey Deep | `#D97706` |
| User Bubble | `#1a2a42` |
| Teal | `#20C9A0` |
| Font | Plus Jakarta Sans |
| Language | Taglish (Filipino-English mix) |
| Theme | Dark only |

Logo images loaded from GitHub: `https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/`

---

## Part 9 — Handoff Checklist

### Scaffold Verification

- [ ] Production URL is live and reachable on mobile browser
- [ ] Login via email OTP works end-to-end
- [ ] Chat screen loads after auth
- [ ] Can type a message and receive a Kai response
- [ ] Conversation persists on page refresh
- [ ] RLS confirmed enabled on all 3 scaffold tables
- [ ] `ANTHROPIC_API_KEY` is server-side only
- [ ] `.env.example` committed to repo
- [ ] PWA manifest and service worker present

### Gap Registry Pre-Check

- [ ] Gap D1 — OTP deliverability to Yahoo Mail tested or custom SMTP configured
- [ ] Gap A4 — Sentry installed with source maps
- [ ] Gap A5 — PostHog installed and baseline events firing
- [ ] Gap E1 — Resibo OCR technical spike completed (at least 85% field accuracy)
- [ ] Gap E2 — Meta webhook dummy endpoint submitted

### Before Writing Build 0 Code

- [ ] Taglish Style Guide drafted
- [ ] Prompt regression test suite started (minimum 10 cases)
- [ ] Feature flag column added to `users` table

### Phase Tracking

- [ ] Update `Current Phase` in shared context files
- [ ] Commit updated gap registry with any new gaps

---

## Part 10 — Quick Start

```bash
# Frontend (from akbai-app-dev branch)
cd frontend
yarn install
yarn dev  # Starts on port 3000

# Backend (from akbai-app-dev branch)
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Open http://localhost:3000
```

For the AI chat to work, you MUST either:
1. Replace `EMERGENT_LLM_KEY` with a real Anthropic key, OR
2. Swap `emergentintegrations` for the official `anthropic` SDK

---

*This document is living. Update it at the start and end of every build session.*
*Next: read `/AKBai/akbai-delivery/shared/project-context.md`, then activate the skill for Build 0.*
