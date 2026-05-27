# AKBai — Claude Code Project Instructions

## What Is AKBai
Mobile-first native mobile (iOS + Android via Capacitor) AI business partner for Filipino MSMEs. Solo founder (Anton), 10–15 hrs/sprint.
Current phase: 0B — Native Mobile Pivot. **Sprint 16 (Native Surface Polish) CLOSED 🟢 GREEN 2026-05-27 (PR #35 + #36).** Gap G4 (Apple Guideline 4.2 mitigation) IMPLEMENTED — full close-out at Sprint 18 Pre-Launch Gate review. 5 Capacitor plugins integrated (`@capacitor/camera`, `@capacitor/push-notifications`, `@aparajita/capacitor-biometric-auth`, `@capacitor/app` deep linking, `@sentry/capacitor` native crash). `.aab` = **20.75 MB** (31% under <30 MB Pre-Launch Gate). **1427 tests passing.** Next: Sprint 17 — RevenueCat IAP integration (Gap G2).

## Master Brief
For full product context, read: `AKBAI_MASTER_BRIEF.md` (root)

## Shared Context (read when relevant to the task)
These files ground every skill and command:
- `akbai-delivery/shared/project-context.md` — Product overview, phases, personas, constraints
- `akbai-delivery/shared/tech-stack.md` — Canonical stack (Next.js 16, Supabase, Claude API, Xendit)
- `akbai-delivery/shared/gap-registry.md` — 29 gaps, 10 CRITICAL hard gates
- `akbai-delivery/shared/sprint-history.md` — Sprint plans, retros, velocity, unresolved action items (living document)
- `akbai-delivery/shared/glossary.md` — Product, business, technical, conversational Filipino terms
- `akbai-delivery/shared/brand-context.md` — Brand identity, voice pillars, colors, typography

## Skill System & Agent Teams
12 role-based skills in `akbai-delivery/skills/`. Each has a SKILL.md with role context,
decision trees, and reference files. 16 slash commands are wired via `.claude/commands/`.
12 agent definitions in `.claude/agents/` map each skill to a reusable agent for team workflows.

When a slash command is invoked, the command file tells you which SKILL.md files to read.
Follow the workflow defined in the command's SKILL.md.

### Agent Teams (primary execution model — Sprint 8+)
For M/L features, `/build` spawns an **agent team** — multiple Claude Code instances
coordinated by the PM lead. The PM selects teammates from the roster based on the task.
For full usage guide, see: `akbai-delivery/shared/agent-teams-guide.md`

**Team size:** 4-5 teammates + PM lead (max 6). S-features run sequentially (no team).

**PM decision checklist (which agents to include):**
1. Does it touch UI? → `build-ux`
2. Is it a NEW feature? → `build-po`
3. New tables? → `build-data`
4. Claude API/prompts? → `build-ai`
5. Significant conversational Filipino copy? → `build-marketing`
6. Auth/payments/PII? → `review-security`
7. Always: `build-architect` + `build-engineer` + `build-qa`

### Agent Roster
| Agent | Skill | Role |
|-------|-------|------|
| `build-architect` | solutions-architect | ADRs, API design (core) |
| `build-data` | data-architect | Schema, migrations, RLS |
| `build-engineer` | fullstack-engineer | Implementation (core) |
| `build-qa` | qa-engineer | Testing (core) |
| `build-ux` | ux-designer | UI/design system review |
| `build-po` | product-owner | Scope validation, MCTD scoring |
| `build-ai` | ai-engineer | System prompts, Kai persona |
| `build-marketing` | marketing-lead | Conversational Filipino copy, brand pillars |
| `review-security` | security-compliance | RLS audit, NPC, auth |
| `deploy-devops` | devops-engineer | CI/CD, deployment |
| `deploy-ops` | ops-lead | Operational readiness |
| `team-lead` | project-manager | Team orchestrator |

### Skill Routing Table (for slash commands)
| Skill | Path | Triggers |
|-------|------|----------|
| project-manager | skills/project-manager/ | sprint, plan, backlog, status, priorities, phase gates |
| solutions-architect | skills/solutions-architect/ | architecture, system design, API design, ADRs, "how should we build" |
| data-architect | skills/data-architect/ | schema, migrations, RLS policies, Supabase tables |
| fullstack-engineer | skills/fullstack-engineer/ | implement, build, component, API route, fix bug, "code this" |
| ai-engineer | skills/ai-engineer/ | system prompt, Claude API, OCR, Kai persona, model routing, Build 0 |
| qa-engineer | skills/qa-engineer/ | test, QA, regression, coverage, Vitest, Playwright |
| security-compliance | skills/security-compliance/ | NPC, BIR, privacy, RLS audit, data classification |
| devops-engineer | skills/devops-engineer/ | deploy, CI/CD, monitoring, Sentry, incident |
| ux-designer | skills/ux-designer/ | UI copy, conversational Filipino, empty states, mobile-first, PWA install UX |
| marketing-lead | skills/marketing-lead/ | GTM, waitlist, content, SEO, build-in-public |
| product-owner | skills/product-owner/ | feature prioritization, sense check, phase gate assessment |
| ops-lead | skills/ops-lead/ | operations, metrics, MRR, support playbook, daily rhythm |

## Non-Negotiable Rules
1. **RLS on every Supabase table** — `auth.uid() = user_id`. No exceptions.
2. **Soft-delete only** — `deleted_at TIMESTAMPTZ NULL` on every table. No hard deletes.
3. **TypeScript strict** — No `any` types. Zod schemas on all API inputs.
4. **Server-side API keys only** — ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY never in client code.
5. **Conversational Filipino UI copy** — Filipino syntactic frame (VSO word order, second-position enclitic pronouns, Filipino conjunctions/prepositions/time adverbs) + English retained only for technical/BIR terms, Filipinized verbs with i-/mag-/na- affixes (i-save, i-scan, na-scan), brand names, and numbers. No English SVO constructions, no "check mo if" (use "kung"), no "based sa" (use "ayon sa"), no "this week/last month" (use "ngayong linggo/nakaraang buwan"), no "yung" for definite objects (use "ang"), no bare English verbs. Enclitics go after the first stressed word: "bago natin i-save", not "bago i-save natin". No corporate filler, no formal Tagalog.
6. **Mobile-first, light theme default** — Surface (#fdf9f2) background, dark mode available. Plus Jakarta Sans font.
7. **Kai speaks first** — Proactive AI, not reactive chatbot.
8. **No tax advice** — BIR disclaimer on all tax-related outputs.
9. **Claude Sonnet for reasoning, Haiku for lightweight** — Route to cheapest capable model.
10. **UTC+8 (Asia/Manila)** — All user-facing timestamps.

## Session Learning Protocol
After completing significant work (finishing a build, resolving a gap, making an architecture
decision, or discovering something that changes how we work), UPDATE the relevant files:

### What to Update & When
| Trigger | Files to Update |
|---------|----------------|
| Gap resolved or status changed | `shared/gap-registry.md` — mark resolved, add date |
| Phase transition | `shared/project-context.md` §6 — update current phase |
| Architecture decision made | `skills/solutions-architect/references/architecture-decisions.md` — add ADR |
| New schema created/modified | `skills/data-architect/references/supabase-schema.md` — update schema |
| System prompt written/changed | `skills/ai-engineer/references/prompt-library.md` — add version entry |
| Build completed | `shared/project-context.md` — update "What's Built" section |
| Tech stack decision changed | `shared/tech-stack.md` — update with rationale |
| New test pattern established | `skills/qa-engineer/references/test-strategy.md` — add pattern |
| Deployment config changed | `skills/devops-engineer/references/deployment-guide.md` — update |
| New conversational Filipino pattern discovered | `skills/ux-designer/references/conversational-filipino-copy-guide.md` — add example |
| Sprint planned (`/sprint`) | `shared/sprint-history.md` — append sprint plan entry (automated by command) |
| Sprint completed (`/retro`) | `shared/sprint-history.md` — update sprint outcomes, append retro, update velocity (automated by command) |
| Sprint completed | MANDATORY: Run post-sprint update checklist (see below). Update ALL relevant skill SKILL.md and reference files before closing the sprint. |
| Convention established or changed | Relevant skill's SKILL.md or references — document the convention |

### Post-Sprint Update Checklist (Mandatory — enforced by /retro)
After every sprint retro, check ALL of the following. For each "Yes", update the file before closing:

- [ ] Did we discover a new development pattern or convention? → Update relevant skill's SKILL.md
- [ ] Did we resolve or change a gap? → Update `shared/gap-registry.md`
- [ ] Did we ship a new build or feature? → Update `shared/project-context.md` §What's Built
- [ ] Did we create or modify a schema/migration? → Update `skills/data-architect/references/supabase-schema.md`
- [ ] Did we add new tests or establish test patterns? → Update `skills/qa-engineer/references/test-strategy.md`
- [ ] Did we change deployment config or env vars? → Update `skills/devops-engineer/references/deployment-guide.md`
- [ ] Did we write or change AI prompts? → Update `skills/ai-engineer/references/prompt-library.md`
- [ ] Did we discover conversational Filipino copy patterns? → Update `skills/ux-designer/references/conversational-filipino-copy-guide.md`
- [ ] Did we make architecture decisions? → Update `skills/solutions-architect/references/architecture-decisions.md`
- [ ] Did the development workflow itself change? → Update PM skill files and sprint templates

This checklist is the governance mechanism that prevents skill drift over time. Do not skip it.

### How to Update
- Keep updates concise — add/modify specific sections, don't rewrite entire files
- Add a "Last updated: [date]" line when modifying shared context files
- For gap-registry.md: change status column, add resolution date and notes
- For architecture-decisions.md: append new ADR entries, don't modify existing ones
- When uncertain whether to update, ask Anton: "Should I update [file] with [learning]?"

## Architecture
- **App code:** `/frontend/src/` — Next.js 16 App Router, TypeScript strict, React 19
- **API routes:** `/frontend/src/app/api/` — All Claude API calls server-side via `@anthropic-ai/sdk`
- **No separate backend.** No Python. No FastAPI. Everything runs in Next.js.
- **Middleware:** `proxy.ts` with `export async function proxy()` (Next.js 16 convention, NOT `middleware.ts`)
- **Forms:** Use `useRef` + `onClick` (React 19 controlled input bug — `onChange`/`onSubmit` unreliable)
- **Money:** Integers in centavos (₱34.50 = 3450). Display conversion at UI layer only.

## Branch Workflow

```
main        ← stable milestones (merge via PR after sprint/build completion)
  └── dev   ← active development (Claude Code sessions branch off here)
        └── claude/*  ← per-session branches (merge back to dev via PR, then delete)
```

**Rules for Claude Code sessions:**
1. **Branch off `dev`** (or `main` if `dev` doesn't exist) — never work directly on `main`
2. **Before ending a session:** push your `claude/*` branch and create a PR to merge into `main`
3. **Context lives in files, not branches** — `sprint-history.md`, `project-context.md`, and `gap-registry.md` are the source of truth across sessions
4. **New session startup:** read `shared/sprint-history.md` for latest sprint context, `shared/project-context.md` for phase status

## Key Paths
- Project root: `/home/user/akbai/`
- App code: `/home/user/akbai/frontend/src/`
- Plugin root: `/home/user/akbai/akbai-delivery/`
- Shared context: `/home/user/akbai/akbai-delivery/shared/`
- Skills: `/home/user/akbai/akbai-delivery/skills/`
- Commands: `/home/user/akbai/.claude/commands/`
- Agents: `/home/user/akbai/.claude/agents/`
- Migrations: `/home/user/akbai/frontend/supabase/migrations/`
- Master brief: `/home/user/akbai/AKBAI_MASTER_BRIEF.md`
- Agent teams guide: `/home/user/akbai/akbai-delivery/shared/agent-teams-guide.md`
