---
name: sprint
description: "Generate a 10–15 hour sprint plan sized for Anton's evenings + weekends. Ask the user about current phase, carryover tasks, priorities, and any blockers. Use project-context.md for phase status, gap-registry.md for CRITICAL gaps, and phase-gates.md for gate criteria. Output a sprint goal, 3–5 tasks (max 4 hrs each), itemized checklists (3–7 sub-steps per task), priority rationale, dependencies, and Definition of Done. Trigger when user asks: sprint plan, what should I work on, next tasks, planning, sprint, upcoming work, or capacity check."
---

# /sprint — Sprint Plan Generation

## Before Starting

You are helping Anton (solo founder, 10–15 hrs/sprint, evenings + weekends) plan his next sprint. Read these files to ground yourself:

1. **`shared/project-context.md`** — Product overview, phase structure, solo founder constraints (§10)
2. **`shared/gap-registry.md`** — 29 total gaps, 10 CRITICAL hard gates that block progress
3. **`references/phase-gates.md`** — Go/No-Go criteria for phase transitions
4. **`references/sprint-templates.md`** — Sprint plan template (use this for output format)
5. **`references/roadmap-context.md`** — Milestones and build order

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

### Step 3: Check for Carryover
Ask Anton directly:
> "Any tasks carried over from last sprint? And what's your top priority for this sprint — should we focus on [CRITICAL gap], phase gate prep, or something else?"

Carryover tasks get priority unless explicitly deprioritized.

### Step 4: Generate 3–5 Tasks
Based on capacity (10–15 hrs) and priorities:
- Each task max 4 hours (fits in an evening or partial Saturday)
- Total across all tasks should be 11–13 hrs (leave 2–3 hrs buffer)
- Prioritize top-down: CRITICAL gaps → phase gate features → user requests → tech debt
- For each task, include:
  - **Title** — what's being built/fixed
  - **Size** — XS (0.5–1 hr), S (1–2 hrs), M (2–3 hrs), L (3–4 hrs) — never XL
  - **Estimated hours**
  - **Priority rationale** — which gap/gate this addresses and why
  - **Dependencies** — does this task depend on another task, or on external input (lawyer, BIR, API access)?
  - **Confidence level** — High / Medium / Low (based on clarity of requirements and unknowns)

### Step 5: Break Each Task into an Itemized Checklist
This is **critical** — Anton works in short evening blocks and needs to know exactly what "next" means without re-reading context.

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
- Task table (# | Task | Size | Est. Hrs | Priority | Dependencies | Confidence)
- Detailed breakdown for each task (title, why it matters, itemized checklist, done-when condition)
- Risks & dependencies section
- Sprint Definition of Done (3–5 criteria that define sprint success)

---

## Task Sizing Guidance

| Size | Hours | Characteristics | Examples |
|------|-------|-----------------|----------|
| **XS** | 0.5–1 | Config changes, doc updates, small fixes | "Update phase field in project-context.md", "Fix typo in sprint template" |
| **S** | 1–2 | Single-file changes, short research, draft writing | "Read Xendit docs and list webhook types", "Draft Privacy Policy outline" |
| **M** | 2–3 | Multi-file features, integration work, design decisions | "Build Kilala Kita form component", "Design system prompt architecture" |
| **L** | 3–4 | Complex features, architecture work, requires longer focus | "Implement receipt scanner with Haiku Vision", "Build dashboard data pipeline" |
| **XL** | 4+ | **NEVER PROPOSE THIS.** Break it down. | (Never) |

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
**Capacity:** 10–15 hours

## Tasks (ordered by priority)
| # | Task | Size | Est. Hrs | Priority | Dependencies | Confidence |
|---|------|------|----------|----------|--------------|------------|
| 1 | [Task] | S | 2 | CRITICAL gap A1 | None | High |
| 2 | [Task] | M | 3 | Phase gate G1.3 | Task 1 | Medium |
| ... |

**Total estimated:** X hrs / Y hrs capacity

### Task 1: [Title] (S — 2 hrs)
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
- [ ] Phase gate criteria checked for current/next phase
- [ ] 3–5 tasks selected, each ≤ 4 hrs
- [ ] Total hours 11–13 (2–3 hr buffer from 15 hr capacity)
- [ ] Each task has an itemized checklist (3–7 sub-steps)
- [ ] External dependencies called out
- [ ] Task dependencies mapped
- [ ] Confidence levels assigned (High/Medium/Low)
- [ ] Output formatted per `references/sprint-templates.md`
- [ ] Sprint goal is one sentence
- [ ] Definition of Done has 3–5 criteria
