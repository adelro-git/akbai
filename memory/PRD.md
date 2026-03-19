# AKBai PRD — Project Memory

**Last Updated:** 2026-03-19
**Session:** Session 2 Complete + Build 0 Complete
**Owner:** Anton del Rosario
**Repo:** https://github.com/adelro-git/akbai

---

## Problem Statement
Build a mobile-first PWA — AKBai, an AI business partner ("Kai") for Filipino MSMEs.
Kai speaks in Taglish (Filipino-English mix), is warm, competent, and proactive.
Target: micro/small business owners in the Philippines who need help with BIR compliance, income tracking, and cash flow.

---

## Architecture
- **Framework:** Next.js 16.2.0 (App Router, Turbopack)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Auth:** Supabase Auth (email OTP / magic link)
- **Database:** Supabase Postgres (RLS on all tables)
- **AI:** Claude `claude-sonnet-4-6` via `emergentintegrations` (Emergent platform) — replace with official Anthropic SDK for production
- **PWA:** manifest.json + custom sw.js
- **Backend:** FastAPI handles /api/chat directly; proxies other /api/* to Next.js
- **Deployment Target:** Vercel

---

## What's Implemented

- [x] Next.js 16 App Router with TypeScript strict
- [x] Tailwind + Shadcn/UI + AKBai brand colors
- [x] Plus Jakarta Sans font (next/font/google)
- [x] PWA manifest + service worker + app icons
- [x] Supabase Auth — email OTP login form (uncontrolled refs, no form submission)
- [x] Auth guard (proxy.ts → redirects unauthenticated users)
- [x] Auth callback route for magic links
- [x] /api/chat POST endpoint — Claude Sonnet 4-6 with Kai Taglish system prompt
- [x] Chat interface (chat bubbles, typing indicator, auto-scroll)
- [x] Conversation history persistence (ka_conversations table)
- [x] SQL migration file for Supabase (all tables created)
- [x] FastAPI backend: direct /api/chat handler + proxy for other routes
- [x] Dashboard placeholder page
- [x] Vercel deployment config (vercel.json)

---

## Backlog / Phased Roadmap

### Build 1 — Kilala Kita (User Onboarding) — P1
- Business profile setup form
- First-run onboarding with Kai introduction
- Store in business_profiles table

### Build 2 — Dashboard — P1
- Transaction list, income/expense summary
- Integration with ka_conversations for financial insights

### Build 3-8 — Features per Roadmap — P2
- BIR calendar, PDF reports, offline support, payments, etc.

---

## Key Technical Notes
- Login form uses useRef (uncontrolled inputs) + onClick (no form onSubmit) due to React 19 state issues
- emergentintegrations library is Emergent-platform-only; replace with anthropic SDK for production
- See /app/HANDOFF.md for full migration guide
