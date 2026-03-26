---
name: sprint
description: "Generate a multi-agent parallel sprint plan. Tasks are estimated by Agent Size (S/M/L) + Anton Time (hrs for review/testing/decisions). Ask the user about current phase, carryover tasks, priorities, and any blockers. Use project-context.md for phase status, gap-registry.md for CRITICAL gaps, and phase-gates.md for gate criteria. Output a sprint goal, 3–5 tasks with parallel stream assignments, itemized checklists (3–7 sub-steps per task, detailed enough for autonomous agent execution), priority rationale, dependencies, and Definition of Done. Trigger when user asks: sprint plan, what should I work on, next tasks, planning, sprint, upcoming work, or capacity check."
---

# /sprint — Sprint Plan Generation

## Before Starting

You are helping Anton (solo founder) plan his next multi-agent sprint. Agent work compresses into minutes via parallel Claude Code sessions — the real constraint is Anton's review/testing/decision time (estimated 3–6 hrs per sprint). Read these files to ground yourself:

1. **`shared/project-context.md`** — Product overview, phase structure, solo founder constraints (§10)
2. **`shared/gap-registry.md`** — 29 total gaps, 10 CRITICAL hard gates that block progress
3. **`shared/sprint-history.md`** — Living sprint/retro log. Check: last sprint outcome, unresolved action items, carryover tasks, velocity patterns
4. **`references/phase-gates.md`** — Go/No-Go criteria for phase transitions
5. **`references/sprint-templates.md`** — Sprint plan template (use this for output format)
6. **`references/roadmap-context.md`** — Milestones and build order

---

## Workflow

### Step 1: Establish Current State
- Read `shared/project-context.md` §6 "Current Phase" to confirm what phase we're in
- If the phase field says [UPDATE THIS FIELD], ask Anton: "What phase are we in?"
- Confirm with Anton if unclear

### Step 2: Review Blockers & Priorities
- Read `shared/gap-registry.md` and identify any CRITICAL gaps (severity = "**CRITICAL**") that are unresolved for the current phase
- Check `references/phase-gates.md` for current phase — which gate criteria are unmet?
- CRITICAL gaps take absolute priority. Phase gate criteria take second priority.

### Step 2b: Check BIR Knowledge Base Staleness
Read the "Last verified" date from `skills/ai-engineer/references/bir-knowledge-base.md`. If that date is more than 90 days ago (relative to today), automatically add a task to the sprint plan: **"Verify BIR knowledge base"** (Size: S, 1–2 hrs, run `/bir-check`). This task should be included in Step 4 output regardless of other priorities.

### Step 3: Check for Carryover
Read `shared/sprint-history.md` §"Unresolved Action Items" for pending items from previous retros. Also check the last sprint entry for incomplete tasks.

Then ask Anton:
> "From the last retro, these action items are still pending: [list items]. Any other tasks carried over? And what's your top priority for this sprint — should we focus on [CRITICAL gap], phase gate prep, or something else?"

Carryover tasks get priority unless explicitly deprioritized.

### Step 4: Generate 3–5 Tasks
Based on priorities and Anton's available review/testing time (3–6 hrs):
- Agent tasks have no hour ceiling — size them by complexity, not clock time
- Total Anton Time across all tasks should be 3–5 hrs (leave 1 hr buffer from 6 hr cap)
- Prioritize top-down: CRITICAL gaps → phase gate features → user requests → tech debt
- Identify which tasks can run in parallel (no shared file dependencies) vs which have sequential dependencies
- For tasks that can be parallelized, mark them as "PARALLEL-OK" in the dependencies column
- For each task, include:
  - **Title** — what's being built/fixed
  - **Agent Size** — S (single module), M (multi-file feature), L (cross-cutting feature)
  - **Anton Time** — XS (0–0.5 hrs), S (0.5–1 hr), M (1–2 hrs), L (2–3 hrs)
  - **Priority rationale** — which gap/gate this addresses and why
  - **Dependencies** — does this task depend on another task, on external input, or is it PARALLEL-OK?
  - **Confidence level** — High / Medium / Low (based on clarity of requirements and unknowns)

### Step 4b: Plan Parallel Execution
After defining tasks, plan how they execute in parallel:
- **Group tasks into parallel streams** — tasks with no file/dependency overlap can run simultaneously in separate Claude Code sessions
- **Identify sequential chains** — tasks that share files or have a dependency chain MUST run in order
- **For multi-session sprints:** assign independent workstreams to separate sessions, each with its own branch convention (`claude/sprint{N}-{stream}`, e.g., `claude/sprint5-analytics`, `claude/sprint5-ocr`)
- **Worktree isolation:** each parallel agent gets its own worktree, reads the relevant SKILL.md files, and works autonomously — no coordination needed during execution
- **Merge strategy:** parallel branches merge into `dev` independently; sequential tasks merge in order

### Step 5: Break Each Task into an Itemized Checklist
This is **critical** — checklists serve double duty: they guide Anton's review work AND act as agent prompts. Each checklist should be detailed enough for an autonomous agent to execute without further input from Anton.

For each task, create a checklist with 3–7 sub-steps. Each sub-step should be:
- **Specific** — not "research Xendit API" but "read Xendit subscription API docs and list the 4 webhook event types we need to handle"
- **Completable** — one person, one work block, clear done condition
- **Actionable** — start with a verb (read, write, build, test, configure, review, etc.)

Example good checklist:
- [ ] Read `shared/gap-registry.md` category A and list all CRITICAL gaps blocking Build 1
- [ ] Ping BIR helpline for confirmation on OR numbering requirements (gap D3) and document answer in Slack
- [ ] Draft system prompt architecture (modular scope sections) in `docs/system-prompt-v1.md`
- [ ] Review with solutions-architect skill — get feedback in comments
- [ ] Iterate based on feedback and finalize

Example bad checklist:
- [ ] Research system prompt design
- [ ] Build the prompt
- [ ] Test it

### Step 6: Identify Risks & Dependencies
- **External dependencies** — If a task needs a lawyer, accountant, government office, or third-party API access, call it out and estimate the wait time
- **Task dependencies** — Does Task 2 depend on Task 1 being done first?
- **Technical risks** — First-time work, unknowns, or low-confidence tasks

### Step 7: Output Sprint Plan
Use the template from `references/sprint-templates.md`. Include:
- Sprint goal (one sentence — what does "done" look like?)
- Task table (# | Task | Agent Size | Anton Time | Priority | Dependencies | Confidence)
- Parallel streams section (which tasks run together, branch names)
- Detailed breakdown for each task (title, why it matters, itemized checklist, done-when condition)
- Risks & dependencies section
- Sprint Definition of Done (3–5 criteria that define sprint success)

### Step 7b: Run `/build` After Plan Approval

**MANDATORY** — After Anton approves the sprint plan and before agents start executing:

1. Run `/build` to verify the codebase compiles clean
2. If build fails, fix the issue before launching agents — agents should start from a green baseline
3. This catches stale imports, type errors, and config drift before they compound across parallel agent work

### Step 7c: Run `/test` + Playwright Before Declaring Sprint Done

**MANDATORY** — After all agents complete and branches are merged, before saving to history:

1. Run `/test` to verify all unit/integration tests pass post-merge (Vitest)
2. Run `npm run test:e2e` to verify Playwright E2E tests pass (browser smoke + user journeys)
3. If either fails, fix the failures before declaring the sprint done
4. This catches integration issues from parallel merges and regressions agents introduced
5. Anton's live testing (15-30 min) happens AFTER both test suites pass — automated tests gate live testing

**Sprint lifecycle: Plan → Anton approves → `/build` → Agents execute → Merge → `/test` → `test:e2e` → Anton live testing → Save to history**

### Step 8: Save Sprint Plan to History

**MANDATORY** — After Anton approves the sprint plan, append it to `shared/sprint-history.md`:

1. Add a new entry under **## Sprint Log** with:
   - Sprint number, date range, phase, goal, capacity
   - Task table (# | Task | Agent Size | Anton Time | Status | Notes) — all tasks start as `PLANNED`
   - Parallel streams and branch assignments
   - Actual Anton hours: "TBD — updated during retro"
   - Sprint outcome: "IN PROGRESS"
2. Update the **Velocity & Patterns** table with a new row (hours actual and goal hit filled in during retro)
3. Check **Unresolved Action Items** — if any pending items from previous retros are now included as sprint tasks, note that in the action item's Status column (e.g., "PLANNED — Sprint 2 Task #3")

This ensures the next session (or `/retro`) has full context without reconstructing from memory.

---

## Task Sizing Guidance

### Agent Size (complexity of agent work)

| Agent Size | Characteristics | Examples |
|------------|-----------------|----------|
| **S** | Single module, 1–2 files, straightforward implementation | "Add PostHog provider wrapper", "Write RLS policy for one table" |
| **M** | Multi-file feature, API + UI + tests, needs SKILL.md context | "Build Kilala Kita form component", "Design system prompt architecture" |
| **L** | Cross-cutting feature, schema + API + UI + tests + docs | "Implement receipt scanner with Haiku Vision", "Build dashboard data pipeline" |

### Anton Time (review/testing/decision effort)

| Anton Time | Hours | What Anton Does | Examples |
|------------|-------|-----------------|----------|
| **XS** | 0–0.5 | No review needed, auto-merge OK | Config tweaks, doc updates, lint fixes |
| **S** | 0.5–1 | Quick test, skim diff, approve PR | Single-file feature, env var addition |
| **M** | 1–2 | Manual test + decisions needed during or after | Multi-file feature, UX review, API decisions |
| **L** | 2–3 | External setup + iteration (env config, third-party accounts, multi-round review) | SMTP setup, Xendit integration, schema migration review |

---

## Anti-Patterns to Avoid

- **Don't skip the itemized checklist.** A task without concrete sub-steps is useless. If Anton has to re-read context to figure out what's next, it won't work.
- **Don't assign tasks to specific days.** Anton's schedule is flexible. Just prioritize clearly so he knows what to do next.
- **Don't ignore external dependencies.** If a task needs a lawyer or government, say so and estimate the wait.
- **Don't propose "research" tasks without a defined output.** "Research Xendit API" is vague. "Read docs and document the webhook flow" is a task.
- **Don't let unmet phase gate criteria go un-addressed.** If we're blocked by a gate criterion, that becomes a sprint task.

---

## Example Output Structure

```markdown
# Sprint [N] Plan — [START DATE] to [END DATE]
**Phase:** [Current Phase]
**Sprint Goal:** [One sentence]
**Anton Capacity:** 3–6 hours (review/testing/decisions)

## Tasks (ordered by priority)
| # | Task | Agent Size | Anton Time | Priority | Dependencies | Confidence |
|---|------|------------|------------|----------|--------------|------------|
| 1 | [Task] | S | XS | CRITICAL gap A1 | PARALLEL-OK | High |
| 2 | [Task] | M | M | Phase gate G1.3 | Task 1 | Medium |
| ... |

**Total Anton Time:** X hrs / 3–6 hrs capacity

## Parallel Streams
- **Stream A** (`claude/sprintN-streamA`): Tasks 1, 3 (no shared files)
- **Stream B** (`claude/sprintN-streamB`): Tasks 4, 5 (no shared files)
- **Sequential:** Task 2 depends on Task 1, runs after Stream A completes

### Task 1: [Title] (Agent S — Anton XS)
**Why:** [Which gap/gate]
- [ ] [Specific sub-step 1]
- [ ] [Specific sub-step 2]
- [ ] [Specific sub-step 3]
**Done when:** [One-line definition]

[... repeat for each task ...]

## Risks & Dependencies
- [External dependency or technical risk]

## Sprint Definition of Done
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

---

## Escalation Rules

If during sprint planning a blocker emerges that you can't resolve with the project-manager skill, escalate:

| Blocker Type | Escalate To | Example |
|-------------|------------|---------|
| Architecture, system design | **solutions-architect** | "How should system prompt assembly work?" |
| Data privacy, NPC, BIR legal | **security-compliance** | "Is OTP deliverability a blocker for launch?" |
| Feature requirements, scoping | **product-owner** | "What should Free tier limit UX look like?" |
| Frontend/API implementation | **fullstack-engineer** | "How to build resumable onboarding?" |
| DevOps, Sentry, monitoring | **devops-engineer** | "Set up Sentry with source maps" |
| AI prompt, model routing | **ai-engineer** | "Design Build 0 system prompt architecture" |

Include in your escalation: what the blocker is, why it matters, and the deadline (when sprint ends).

---

## Quick Checklist Before Output

- [ ] Current phase confirmed with Anton
- [ ] CRITICAL gaps identified and prioritized
- [ ] BIR knowledge base staleness checked (>90 days → add verify task)
- [ ] Phase gate criteria checked for current/next phase
- [ ] 3–5 tasks selected with Agent Size (S/M/L) and Anton Time (XS/S/M/L)
- [ ] Total Anton Time 3–5 hrs (1 hr buffer from 6 hr capacity)
- [ ] Parallel streams identified (tasks grouped by file/dependency independence)
- [ ] Multi-session plan defined with branch conventions (if applicable)
- [ ] Each task has an itemized checklist (3–7 sub-steps, detailed enough for autonomous agent execution)
- [ ] External dependencies called out
- [ ] Task dependencies mapped
- [ ] Confidence levels assigned (High/Medium/Low)
- [ ] Output formatted per `references/sprint-templates.md`
- [ ] Sprint goal is one sentence
- [ ] Definition of Done has 3–5 criteria
- [ ] `/build` passed after plan approval (Step 7b) — green baseline before agents start
- [ ] `/test` passed after merge (Step 7c) — all Vitest tests green before declaring done
- [ ] `test:e2e` passed after merge (Step 7c) — all Playwright E2E tests green before declaring done
- [ ] Anton live testing completed (15-30 min) after `/test` passes
- [ ] Sprint plan appended to `shared/sprint-history.md` (Step 8)
- [ ] Unresolved action items from previous retros checked and referenced
