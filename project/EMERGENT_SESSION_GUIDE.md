# EMERGENT_SESSION_GUIDE.md
> AKBai scaffold build playbook for Emergent (100-credit Standard session)
> Created: March 19, 2026 | Author: Anton del Rosario

---

## Credit Budget Overview

| Session | Purpose | Est. Credits | Notes |
|---------|---------|-------------|-------|
| Session 0 | Architecture alignment (no build) | 1–2 | Ask questions, confirm stack, output design doc only |
| Session 1 | Build the scaffold | 5–10 | PWA shell, auth, chat UI, DB schema, /api/chat endpoint, deployment |
| Session 2 | Fixes only (if needed) | 5–10 | Mobile layout issues, auth bugs, deployment failures only |
| **Total** | | **~16–22** | Well within 100-credit budget. ~78 credits remain as buffer. |

Do NOT spend the remaining credits on features. They are reserved for Phase 1 build sessions.

---

## Session 0 — Architecture Alignment (No Build)

### What to Upload
| File | Location |
|------|----------|
| `AKBAI_MASTER_BRIEF.md` | `/AKBai/AKBAI_MASTER_BRIEF.md` |
| `solutions-architect/SKILL.md` | `/AKBai/akbai-delivery/skills/solutions-architect/SKILL.md` |
| `data-architect/SKILL.md` | `/AKBai/akbai-delivery/skills/data-architect/SKILL.md` |

### Opening Prompt
```
Read the master brief fully. Do not build anything yet.

Output a system design document for the AKBai scaffold only — the shell, auth,
database schema, and one Claude API endpoint.

Confirm that your proposed stack choices align with the skill files (solutions-architect
and data-architect). Flag any conflicts or ambiguities you find.

Ask clarifying questions before Session 1 begins. Do not write code.
```

### Expected Output
- A confirmed architecture document covering: PWA structure, auth flow, DB schema (with RLS policies listed), API route design, environment variable map, deployment target
- A list of clarifying questions (answer these before Session 1)
- No code — architecture doc only

### What to Watch For
- Any suggestion to use MongoDB, Firebase, or a database other than **Supabase (PostgreSQL)** → correct it. AKBai is Supabase-only.
- Any suggestion to use OpenAI → correct it. The AI brain is **Claude Sonnet 4 (`claude-sonnet-4-6`)** via `@anthropic-ai/sdk`.
- Any architecture that puts the Anthropic or Supabase service role key in client-side code → block it immediately.
- Any suggestion to add App Router layouts, middleware, or patterns inconsistent with **Next.js 14 App Router** → flag it.

---

## Session 1 — Build the Scaffold

### What to Upload
| File | Location |
|------|----------|
| `AKBAI_MASTER_BRIEF.md` | `/AKBai/AKBAI_MASTER_BRIEF.md` |
| `fullstack-engineer/SKILL.md` | `/AKBai/akbai-delivery/skills/fullstack-engineer/SKILL.md` |
| `ux-designer/SKILL.md` | `/AKBai/akbai-delivery/skills/ux-designer/SKILL.md` |
| `brand-context.md` | `/AKBai/akbai-delivery/shared/brand-context.md` |

> **Note:** Also include the architecture doc output from Session 0 as an additional upload if Emergent supports it.

### Opening Prompt
```
Build the AKBai scaffold as defined in the master brief Emergent scope section.

Requirements:
1. Mobile-first Next.js 14 PWA shell (App Router, TypeScript strict, Tailwind CSS, Shadcn/UI, next-pwa with manifest and service worker)
2. User auth via Supabase Auth — email OTP / magic link. Protected routes redirect unauthenticated users.
3. Taglish chat UI shell styled per brand-context.md — dark Ink background (#07101e), Warm Honey accents (#F59E0B), Plus Jakarta Sans font, rounded chat bubbles, KA avatar on assistant messages
4. Supabase (PostgreSQL) schema with RLS, soft-delete (deleted_at), and audit columns (created_at, updated_at) for these three tables:
   - users (extends auth.users)
   - ka_conversations (user_id FK, role, content, domain)
   - business_profiles (user_id FK, business_name, business_type, income_range, bir_registered)
5. One working Claude Sonnet 4 API endpoint at /api/chat — server-side only, authenticates user, fetches last 20 messages for context, calls claude-sonnet-4-6 via @anthropic-ai/sdk, persists messages, returns response
6. Vercel deployment config with .env.example stub

Stop after this. Do not add features beyond this scope. See the "DO NOT BUILD" list in the master brief.
```

### Acceptance Criteria (Definition of Done)
Check every item before accepting the Session 1 output:

- [ ] App opens on a mobile browser URL
- [ ] Login/signup screen appears with email OTP flow
- [ ] After auth, user lands on chat screen
- [ ] User can type a message and tap send
- [ ] Message reaches `/api/chat`, which calls `claude-sonnet-4-6`
- [ ] Kai response appears in a styled chat bubble (branded, Taglish system prompt active)
- [ ] Conversation persists in Supabase — messages survive a page refresh
- [ ] PWA manifest present — "Add to Home Screen" prompt available
- [ ] Service worker present (basic offline shell, not full offline mode)
- [ ] RLS is enabled on all three database tables
- [ ] `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-side only (not in `NEXT_PUBLIC_` vars)
- [ ] `.env.example` file present with all required variable stubs
- [ ] App builds and deploys successfully

### What to Watch For in Session 1 Output
- **MongoDB / Firebase / any non-Supabase DB** → reject, request correction
- **API key in client code** → immediate security flag, must be fixed before accepting
- **Hard deletes** (any `DELETE FROM` without soft-delete pattern) → reject
- **Missing RLS** on any table → reject. Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` to verify
- **OpenAI imports** → reject, must use `@anthropic-ai/sdk` with `claude-sonnet-4-6`
- **Cold grey backgrounds or MUI/Bootstrap styling** → ask for restyling to match brand (Ink, Warm Honey, Plus Jakarta Sans)
- **Extra features built** (receipt scanning, BIR deadlines, expense dashboards, etc.) → flag as scope creep

---

## Session 2 — Fixes Only (if needed)

### Trigger This Session If
- Mobile layout is broken (text overflows, keyboard covers input, chat doesn't scroll)
- Auth flow fails (OTP not received, session not persisting, redirect not working)
- `/api/chat` endpoint errors (500s, missing API key binding, context not loading)
- Deployment fails or env vars not binding correctly in Vercel
- RLS policies are missing or incorrect

### What NOT to Fix in Session 2
- Do not add features
- Do not refactor working code for style preferences
- Do not add monitoring (Sentry, PostHog) — those are Phase 1 tasks
- Do not improve the system prompt — the basic KA prompt from the master brief is sufficient for the scaffold

### Opening Prompt Template
```
This is a fix-only session for the AKBai scaffold. Here are the specific bugs to address:

[LIST BUGS HERE — be specific: include error messages, screen recordings, or browser console output]

Do not add any new features. Only fix the listed issues. Confirm each fix with a test before marking it done.
```

---

## What Happens After Emergent

Once the scaffold passes all acceptance criteria in Session 1 (or after Session 2 fixes), the scaffold becomes the working codebase for Phase 1 MVP builds.

The next steps — done manually by Anton using the akbai-delivery plugin in Claude Code — are:

1. **Read gap-registry.md** to identify any new technical gaps surfaced by the scaffold
2. **Run Build 0** (AI Scope Definition) using the `ai-engineer` skill — define in-scope/out-of-scope boundaries, modular system prompt architecture, financial disclaimer, Taglish tone rules
3. **Run Build 1** (Kilala Kita onboarding) using `ux-designer` + `fullstack-engineer` + `data-architect`
4. **Continue through Builds 2–8** per the build order in `AKBAI_MASTER_BRIEF.md` Section 3

The akbai-delivery plugin skills are in `/AKBai/akbai-delivery/skills/`. The shared context files in `/AKBai/akbai-delivery/shared/` are the starting context for every new session.

---

## Quick Reference: Files to Know

| Need to... | Read this file |
|-----------|----------------|
| Understand the full product | `/AKBai/akbai-delivery/shared/project-context.md` |
| Check the canonical stack | `/AKBai/akbai-delivery/shared/tech-stack.md` |
| Check open gaps and hard gates | `/AKBai/akbai-delivery/shared/gap-registry.md` |
| Look up a term (Taglish, product, tech) | `/AKBai/akbai-delivery/shared/glossary.md` |
| Get brand colors / voice / typography | `/AKBai/akbai-delivery/shared/brand-context.md` |
| Get the full single entry-point brief | `/AKBai/AKBAI_MASTER_BRIEF.md` |
| See the Emergent build playbook | `/AKBai/project/EMERGENT_SESSION_GUIDE.md` ← you are here |
