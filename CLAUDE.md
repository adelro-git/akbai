# AKBai — Claude Code Project Instructions

## What Is AKBai
Mobile-first PWA AI business partner for Filipino MSMEs. Solo founder (Anton), 10–15 hrs/sprint.
Current phase: 0A (Legal Foundation). No application code yet.

## Master Brief
For full product context, read: `AKBAI_MASTER_BRIEF.md` (root)

## Shared Context (read when relevant to the task)
These files ground every skill and command:
- `akbai-delivery/shared/project-context.md` — Product overview, phases, personas, constraints
- `akbai-delivery/shared/tech-stack.md` — Canonical stack (Next.js 14, Supabase, Claude API, Xendit)
- `akbai-delivery/shared/gap-registry.md` — 29 gaps, 10 CRITICAL hard gates
- `akbai-delivery/shared/glossary.md` — Product, business, technical, Taglish terms
- `akbai-delivery/shared/brand-context.md` — Brand identity, voice pillars, colors, typography

## Skill System
12 role-based skills in `akbai-delivery/skills/`. Each has a SKILL.md with role context,
decision trees, and reference files. 15 slash commands are wired via `.claude/commands/`.

When a slash command is invoked, the command file tells you which SKILL.md files to read.
Follow the workflow defined in the command's SKILL.md.

### Skill Routing Table
| Skill | Path | Triggers |
|-------|------|----------|
| project-manager | skills/project-manager/ | sprint, plan, backlog, status, priorities, phase gates |
| solutions-architect | skills/solutions-architect/ | architecture, system design, API design, ADRs, "how should we build" |
| data-architect | skills/data-architect/ | schema, migrations, RLS policies, Supabase tables |
| fullstack-engineer | skills/fullstack-engineer/ | implement, build, component, API route, fix bug, "code this" |
| ai-engineer | skills/ai-engineer/ | system prompt, Claude API, OCR, KA persona, model routing, Build 0 |
| qa-engineer | skills/qa-engineer/ | test, QA, regression, coverage, Vitest, Playwright |
| security-compliance | skills/security-compliance/ | NPC, BIR, privacy, RLS audit, data classification |
| devops-engineer | skills/devops-engineer/ | deploy, CI/CD, monitoring, Sentry, incident |
| ux-designer | skills/ux-designer/ | UI copy, Taglish, empty states, mobile-first, PWA install UX |
| marketing-lead | skills/marketing-lead/ | GTM, waitlist, content, SEO, build-in-public |
| product-owner | skills/product-owner/ | feature prioritization, sense check, phase gate assessment |
| ops-lead | skills/ops-lead/ | operations, metrics, MRR, support playbook, daily rhythm |

## Non-Negotiable Rules
1. **RLS on every Supabase table** — `auth.uid() = user_id`. No exceptions.
2. **Soft-delete only** — `deleted_at TIMESTAMPTZ NULL` on every table. No hard deletes.
3. **TypeScript strict** — No `any` types. Zod schemas on all API inputs.
4. **Server-side API keys only** — ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY never in client code.
5. **Taglish UI copy** — Natural Filipino-English code-switching. No corporate filler.
6. **Mobile-first, dark theme** — Ink (#07101e) background. Plus Jakarta Sans font.
7. **KA speaks first** — Proactive AI, not reactive chatbot.
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
| New Taglish pattern discovered | `skills/ux-designer/references/taglish-copy-guide.md` — add example |
| Sprint completed | Ask Anton if sprint learnings should update any skill files |
| Convention established or changed | Relevant skill's SKILL.md or references — document the convention |

### How to Update
- Keep updates concise — add/modify specific sections, don't rewrite entire files
- Add a "Last updated: [date]" line when modifying shared context files
- For gap-registry.md: change status column, add resolution date and notes
- For architecture-decisions.md: append new ADR entries, don't modify existing ones
- When uncertain whether to update, ask Anton: "Should I update [file] with [learning]?"

## Key Paths
- Project root: `/home/user/akbai/`
- Plugin root: `/home/user/akbai/akbai-delivery/`
- Shared context: `/home/user/akbai/akbai-delivery/shared/`
- Skills: `/home/user/akbai/akbai-delivery/skills/`
- Commands: `/home/user/akbai/.claude/commands/`
- Master brief: `/home/user/akbai/AKBAI_MASTER_BRIEF.md`
