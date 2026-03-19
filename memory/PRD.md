# AKBai PRD — Project Memory

**Last Updated:** 2026-03-19  
**Session:** Session 1 (Scaffold Build)  
**Owner:** Anton del Rosario  
**Repo:** https://github.com/adelro-git/akbai

---

## Problem Statement
Build a mobile-first PWA — AKBai, an AI business partner ("Kai") for Filipino MSMEs.  
Kai speaks in Taglish (Filipino-English), is warm, competent, and proactive.  
Target: micro/small business owners in the Philippines who need help with BIR compliance, income tracking, and cash flow.

---

## Architecture
- **Framework:** Next.js 16.2.0 (App Router, Turbopack)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Auth:** Supabase Auth (email OTP / magic link)
- **Database:** Supabase Postgres (RLS on all tables)
- **AI:** Claude `claude-sonnet-4-6` via `@anthropic-ai/sdk` (server-side only)
- **PWA:** manifest.json + custom sw.js
- **Deployment Target:** Vercel

**Key Technical Notes:**
- Emergent environment uses FastAPI proxy on port 8001 → forwards /api/* to Next.js on port 3000
- Next.js 16 convention: `proxy.ts` (not `middleware.ts`) + `proxy()` function (not `middleware()`)
- Route groups disabled for Next.js 16 Turbopack (workspace root bug); pages are flat
- Supabase key format: `sb_publishable_*` (anon) + `sb_secret_*` (service role)

---

## Brand
- **Background (Ink):** `#07101e`
- **Card:** `#0d1a2e`
- **Card Alt:** `#111f36`
- **Warm Honey:** `#F59E0B` (CTAs)
- **Honey Deep:** `#D97706`
- **User Bubble:** `#1a2a42`
- **Teal:** `#20C9A0`
- **Font:** Plus Jakarta Sans
- **Language:** Taglish (Filipino-English mix)

---

## Session History

### Session 0 — Architecture Alignment (Done)
- Read full repo (AKBAI_MASTER_BRIEF.md, EMERGENT_SESSION_GUIDE.md, tech-stack.md, etc.)
- Output architecture document (DB schema, API design, env map, deployment plan)
- Confirmed stack, answered clarifying questions

### Session 1 — Scaffold Build (Done, 2026-03-19)
**Built:**
- Next.js 16 app replacing React CRA in /app/frontend/
- FastAPI proxy (server.py) forwarding /api/* → Next.js port 3000
- Supabase Auth integration (@supabase/ssr) — email OTP
- Login page with 2-step flow (email → OTP code entry)
- Chat interface UI — mobile-first, full-height, KA avatar, typing indicator
- /api/chat POST endpoint — Claude Sonnet 4 with Taglish system prompt
- Conversation history saved to ka_conversations (Supabase)
- Auth guard on /chat and /dashboard
- PWA manifest.json + custom sw.js
- SQL migration: /app/frontend/supabase/migrations/001_initial_schema.sql
- Root /: redirects to /chat (authenticated) or /login (unauthenticated)

**Test Results (Iteration 1):** 85% pass rate
- All routing, branding, UI tests: PASS
- OTP flow: BLOCKED (SQL tables not yet initialized, Anthropic key missing)

---

## Environment Variables
```
# /app/frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://naxjmwjrhzenjqburejl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vdo0T7PEMpeFWkT2iY8izg_7-EujaT3
SUPABASE_SERVICE_ROLE_KEY=sb_secret_urV6pg4nf1UpEZeyb-yKXg_nlubuThv
ANTHROPIC_API_KEY=your-anthropic-api-key-here  ← NEEDS REPLACEMENT
```

---

## What's Implemented ✅
- [x] Next.js 16 App Router with TypeScript strict
- [x] Tailwind + Shadcn/UI + AKBai brand colors
- [x] Plus Jakarta Sans font (next/font/google)
- [x] PWA manifest + service worker
- [x] Supabase Auth — email OTP login form
- [x] Auth guard (proxy.ts → redirects unauthenticated users)
- [x] /api/chat POST endpoint with Kai system prompt
- [x] Chat interface (chat bubbles, typing indicator, auto-scroll)
- [x] Conversation history persistence (ka_conversations table)
- [x] SQL migration file for Supabase
- [x] FastAPI proxy for Emergent environment /api/* routing
- [x] .env.example for Vercel deployment

---

## Pending Actions (For Anton)
1. **Run SQL migration** in Supabase SQL Editor:
   - File: `/app/frontend/supabase/migrations/001_initial_schema.sql`
   - URL: https://naxjmwjrhzenjqburejl.supabase.co/project/default/sql
2. **Enable Email OTP** in Supabase: Authentication → Providers → Email → Enable OTP
3. **Get Anthropic API key** from console.anthropic.com → add to .env.local:
   `ANTHROPIC_API_KEY=sk-ant-api03-...`
4. **Download PWA icons** from GitHub repo `/brand/Logo Files/`:
   - `AKBai_Icon_512.png` → save as `/public/icons/icon-512.png`
   - Create 192x192 variant → save as `/public/icons/icon-192.png`
5. **Vercel deployment**: Deploy with env vars set in Vercel dashboard

---

## Backlog / Phased Roadmap

### Session 2 — Fixes & Polish
- Add Supabase auth callback route for magic link fallback
- Add loading skeleton for chat page
- Test full auth flow once SQL tables are initialized

### Build 0 — AI Scope Definition (Phase 1 start)
- Skill: ai-engineer + product-owner
- Define Kai's exact capabilities, disclaimers, domain boundaries
- Add conversation domain tagging

### Build 1 — Kilala Kita (User Onboarding)
- Skill: ux-designer + fullstack-engineer
- Business profile setup form
- First-run onboarding with Kai introduction

### Build 2 — Dashboard
- Skill: fullstack-engineer + data-architect
- Transaction list, income/expense summary
- Integration with ka_conversations for financial insights

### Build 3-8 — Features per Roadmap
- BIR calendar, PDF reports, offline support, etc.

---

## P0 / P1 / P2 Features Remaining
**P0 (Blocking):**
- SQL migration not run yet
- Anthropic API key not configured
- Email OTP not verified end-to-end

**P1 (Session 2):**
- Auth callback route for magic links
- PWA icons (download from GitHub repo)
- Full chat flow test with real Anthropic key

**P2 (Build 1+):**
- Business profile onboarding
- Dashboard
- Transaction tracking
- BIR compliance features
