---
name: retro
description: "Sprint retrospective with structured action items. Ask Anton about: what worked well, what didn't work, what surprised him, what he'd change. Generate a retro with What Worked (keep doing), What Didn't Work (stop/change), What We Learned (insights), and Action Items (specific, assignable, with due dates tied to next sprint). Check if action items should become gap-registry entries. Use sprint-templates.md retro format. Trigger when user asks: retro, retrospective, what went well, improvements, lessons learned, how did it go, what we should change, or end of sprint reflection."
---

# /retro — Sprint Retrospective Generator

## Before Starting

You are facilitating a sprint retrospective with Anton (solo founder, 10–15 hrs/sprint, evenings + weekends). A good retro is honest, forward-looking, and produces 2–3 concrete action items for next sprint. Read these files:

1. **`shared/project-context.md`** — Phase, solo founder constraints (§10), break-even timeline
2. **`shared/gap-registry.md`** — 29 gaps, 10 CRITICAL hard gates (some action items may become gap entries)
3. **`shared/sprint-history.md`** — Living sprint/retro log. Read: current sprint's planned tasks, previous retro action items, velocity patterns
4. **`references/sprint-templates.md`** — Retro template (use this for output format)
5. **`references/phase-gates.md`** — Phase gate criteria (context for readiness concerns)

---

## Workflow

### Step 1: Set Retro Context
- Read `shared/sprint-history.md` — find the current sprint entry under **## Sprint Log**
- Which sprint just ended? (e.g., Sprint 5, Week of March 17)
- How many hours did Anton allocate vs. use?
- What was the sprint goal from the plan?
- Did we hit it? Partially? Miss it?

Use the sprint plan from `sprint-history.md` as the source of truth — we're comparing plan vs. reality. If the sprint wasn't logged there, ask Anton for the details.

### Step 2: Gather Honest Feedback

Ask Anton these four questions — let him think and answer honestly. Don't rush:

> "Retro time. Answer these however you want — short or long, I just need honest:
>
> 1. **What went well this sprint?** (Something that worked — and be specific. Not 'got stuff done' but 'the checklist format made it easy to pick up mid-week work.')
>
> 2. **What didn't go well?** (Something that didn't work or took longer than expected. Be honest — no blame, just what slowed us down.)
>
> 3. **What surprised you?** (Something unexpected, good or bad.)
>
> 4. **If you could change one thing for next sprint, what would it be?** (One improvement.)"

Wait for real answers. If Anton gives vague responses, probe:
- Instead of "got more done," ask: "What helped you get more done? Was it the task format, fewer interruptions, smaller task sizes?"
- Instead of "things took longer," ask: "Which task took longer and why? Was it unclear requirements, a technical blocker, or just underestimated?"

This is the most important step. A retro without honest feedback is just ceremony.

### Step 3: Synthesize Themes

Look for patterns across Anton's answers:

**Positive patterns:**
- "The checklist format really helped" + "I picked up work in evening blocks" → **Theme: Structure + Modularity work well**
- "Finished Task 1 early" + "Task 2 was straightforward" → **Theme: Well-scoped tasks are efficient**

**Negative patterns:**
- "Task 3 and Task 4 both had unclear requirements" + "Kept asking questions mid-work" → **Theme: Need better upfront specs**
- "Saturday didn't happen" + "Friday was exhausting" → **Theme: Evening + weekend pattern unsustainable this week**

**Surprises:**
- Good surprises: "Thought X would take 4 hrs, took 2" → **Action: Reprioritize task sizing**
- Bad surprises: "Supabase went down for 2 hours" → **Action: Add dependency monitoring task (gap D4)**

### Step 4: Generate "What Worked" Section

List 2–4 specific things that went well. Be concrete.

**Good:**
- Itemized checklists let me pick up work mid-week without re-reading context
- Privacy Policy draft was clearer than expected after lawyer feedback
- Researching Xendit API in 1 block instead of 3 short ones — longer focus = faster progress

**Not good:**
- We got stuff done
- Meetings were useful
- Made progress

### Step 5: Generate "What Didn't Work" Section

List 2–4 specific challenges. Don't blame — just observe.

**Good:**
- Two tasks (System Prompt + BIR Scope) had overlapping requirements — should have sequenced them
- Estimated 2 hrs for OTP testing, took 4 hrs (unexpected Yahoo Mail PH delay on Supabase)
- Saturday block didn't happen (work travel) — left us 4 hrs short of capacity

**Not good:**
- Things were hard
- I didn't manage time well
- Estimates were wrong (no context)

### Step 6: Generate "What We Learned" Section

Extract 1–3 insights from the sprint. These become the basis for next sprint improvements.

**Examples:**
- **Learning:** Yahoo Mail PH has known deliverability issues with default Supabase SendGrid. This is a gap-registry entry (D1) that blocks Phase 1. Needs custom SMTP domain + warming.
- **Learning:** Longer work blocks (3–4 hrs) are more efficient than 1–2 hr evening sessions for integration work. May need to schedule Saturday more rigorously.
- **Learning:** Tasks that depend on external input (lawyer, BIR, Xendit) need a "waiting state" clearly marked in sprint plan, or they consume mental energy without progress.

### Step 7: Generate Action Items

These are 2–3 **specific, assignable** improvements for next sprint. Each action item must:
- Start with a verb (fix, add, change, schedule, clarify, test)
- Be small enough to do in one sprint (not "improve communication" but "send sprint plan to security-compliance skill for 48-hr pre-review")
- Have a due date (Sprint N+1, or specific date)
- Have an owner (Anton, or delegate/escalate if needed)

**Good action items:**
- Fix: Clarify task requirements in sprint plan before sprint starts (add 30-min planning session with product-owner skill). Due: Sprint N+1.
- Add: Schedule Saturday work block on calendar (2 hrs min for integration work). Due: Week 1, Sprint N+1.
- Change: For Phase 1 tasks with external dependencies, mark them with "WAITING" status and don't count them against capacity. Due: Sprint N+1 planning.

**Not good action items:**
- "Do better estimates" (vague)
- "Improve focus" (not actionable)
- "Get more done" (outcome, not action)

### Step 8: Check for New Gap Entries

Read `shared/gap-registry.md`. If any action items reveal new gaps or should be promoted to the gap registry:

- **OTP deliverability (gap D1)** — Did Anton surface this? If so, is it already in the registry? (Yes — it's D1, CRITICAL.)
- **Custom SMTP domain for Yahoo Mail** — Is this a sub-task of D1 or a new gap? (Sub-task of D1.)
- **External dependency handling pattern** — Is this a gap or a process improvement? (Process improvement for next sprint.)

If an action item is a NEW gap (not in registry):
- Ask Anton: "Should we add this to the gap-registry.md or is it just a process improvement for this sprint?"
- If gap: assign it a gap ID (next available in its category), severity, and "When to Fix" date
- If process improvement: just note it in the action item

### Step 9: Generate Sprint Retro Output

Use the template from `references/sprint-templates.md`. Structure:

```markdown
# Sprint [N] Retro — [DATE]

## What Went Well
- [Specific thing 1]
- [Specific thing 2]
- [Specific thing 3]

## What Didn't Go Well
- [Challenge 1 with context]
- [Challenge 2 with context]

## What We Learned
- [Insight 1]
- [Insight 2]

## Action Items
| # | Action | Owner | Due By | Notes |
|---|--------|-------|--------|-------|
| 1 | [Specific action] | Anton | Sprint N+1 | [Context] |
| 2 | [Specific action] | Anton | Sprint N+1 | [Context] |

## Energy Check
**Sustainability:** [Felt good / Bit stretched / Burned out]
**Saturday block:** [Used / Partly used / Skipped]
**Evening consistency:** [X out of 10 evenings]
**Recommendation for next sprint:** [Adjust scope / Keep pace / Increase scope / Take a break]
```

### Step 10: Energy Sanity Check

Before closing, ask Anton:

> "Real talk: how sustainable was this?
> - Felt good, could do this every sprint?
> - A bit stretched — need to protect buffer next sprint?
> - Burned out — reduce scope next sprint?"

This matters. A founder who burns out stops shipping. Better to hit 60% of a sustainable sprint than 100% of an unsustainable one and then crash.

### Step 11: Save Retro to History

**MANDATORY** — After the retro is finalized, update `shared/sprint-history.md`:

1. **Update the Sprint Log entry** for this sprint:
   - Change task statuses from `PLANNED` to `DONE` / `PARTIAL` / `DROPPED` with notes
   - Fill in "Actual hours used" and "Sprint outcome"
   - Add "What was built" summary (key files/features shipped)

2. **Append to Retro Log** — Add a new entry under **## Retro Log** with:
   - What Went Well (2–4 items)
   - What Didn't Go Well (2–4 items)
   - What We Learned (1–3 insights)
   - Action Items table (# | Action | Owner | Due By | Status | Notes)
   - Energy Check (sustainability, Saturday block, evening consistency, recommendation)

3. **Update Velocity & Patterns table** — Fill in actual hours, tasks done, and goal hit for this sprint. Add any new emerging patterns observed.

4. **Update Unresolved Action Items** — Add new action items from this retro. Mark any previously pending items that were resolved during this sprint as `DONE`.

This ensures the next session has full retro context without reconstructing from memory or git history.

---

## Action Item Rules

### What makes a good action item?

1. **Specific** — "Clarify task scope with product-owner skill before sprint" not "Get better requirements"
2. **Assignable** — "Anton to schedule 30-min planning with PM skill Monday" — clear who and when
3. **Doable in one sprint** — Not "redesign the whole onboarding" but "test iOS PWA install flow and document gaps"
4. **Measurable** — "Complete" is clear, not "improve"
5. **Tied to next sprint** — "Sprint N+1" or "Week 1 of next sprint" or "By March 30"

### Action items can delegate

If Anton identifies an action that should go to a specialist skill, delegate explicitly:

**Example:**
- **Action:** Evaluate system prompt resilience (flag-as-wrong recovery patterns)
- **Owner:** ai-engineer skill
- **Due:** Sprint N+1 pre-sprint review
- **Context:** Retro revealed unclear error messages caused churn in feedback tests. Need better recovery UX.

But Anton stays in the loop — he approves the delegation and gets results.

---

## When to Add to Gap Registry

If an action item reveals a NEW gap (not already in gap-registry.md):

| Signal | Severity | Gap Action |
|--------|----------|-----------|
| "Yahoo Mail OTP never arrived" | CRITICAL | Add/update D1 — OTP deliverability to Yahoo Mail PH |
| "Spent 2 hrs on Xendit webhook idempotency, still unclear" | CRITICAL | Already D2; mark as "clarify requirements" action item |
| "Settings screen doesn't let users update profile" | IMPORTANT | New gap B4 — Profile update flow (already in registry) |
| "Three tasks ran over because requirements weren't clear" | IMPORTANT | New gap: "Require 48-hr pre-review of sprint specs with product-owner skill before sprint kickoff" |

If you identify a new gap:
1. Propose it to Anton: "This feels like a blocker for future sprints. Want me to add it to gap-registry.md?"
2. If yes: assign category (A/B/C/D/E), severity (CRITICAL/IMPORTANT/PLAN), and "When to Fix" phase
3. If no: just note it as a process improvement in this sprint

---

## Example Retro (Filled Out)

```markdown
# Sprint 3 Retro — March 19, 2026

## What Went Well
- Itemized checklists made it easy to pick up work on Tuesday/Wednesday after skipping Monday
- Separating "design" tasks (Privacy Policy outline) from "implementation" tasks made estimation more accurate
- Xendit webhook research was clearer when blocked into a single 3-hr Saturday session instead of three 1-hr evening fragments

## What Didn't Go Well
- Two tasks depended on external input (lawyer review of Privacy Policy, BIR response on OR numbering). These blocked progress but were hard to communicate as "waiting" in the sprint plan.
- Yahoo Mail OTP test revealed Supabase default SendGrid has known delivery issues for Yahoo PH. Wasn't flagged as a blocker until Wednesday — cost 2 hrs debugging.
- Saturday block was skipped (work travel). Estimated 15 hrs but used 11 hrs.

## What We Learned
- External dependency tasks need a clear "waiting state" in sprint plan — not counted against capacity, but tracked separately
- OTP deliverability to Yahoo Mail PH (gap D1, CRITICAL) is more complex than anticipated. Custom SMTP domain + warm-up needed — can't launch without this
- Longer focus blocks (3+ hrs) are more efficient for integration work than evening 1–2 hr fragments. May need to schedule Saturday more consistently

## Action Items
| # | Action | Owner | Due By | Notes |
|---|--------|-------|--------|-------|
| 1 | Clarify task requirements with product-owner skill 48 hrs before sprint kickoff (20-min call) | Anton | Sprint 4 pre-planning | Prevents mid-sprint surprises; worth the upfront investment |
| 2 | Schedule Saturday 2–4 PM as "reserved for integration work only" (not available for interruptions) | Anton | Week 1, Sprint 4 | Improves focus blocks for Xendit, API, multi-file work |
| 3 | Add sub-task to gap D1: "Test custom SMTP domain + warm-up procedure with SendGrid or Amazon SES" | Anton + ai-engineer escalation | Sprint 4 | OTP deliverability is blocking Phase 1 launch. Needs PoC this sprint. |

## Energy Check
**Sustainability:** A bit stretched — Saturday was off, so used only 11/15 hrs but still felt packed.
**Saturday block:** Skipped (work travel)
**Evening consistency:** 6 out of 10 evenings (Mon, Tue, Wed, Thu — Friday and Sunday off)
**Recommendation for next sprint:** Keep scope at 12–13 hrs max (not 15). Some sprints will have travel or family stuff. Better to under-commit than burn out.
```

---

## Anti-Patterns to Avoid

- **Don't let retro be a complaint session.** Keep the tone forward-looking: "Here's what happened; here's what we'll do differently."
- **Don't create action items without assignees or due dates.** A fuzzy action item is a non-action.
- **Don't skip the energy check.** If Anton is burned out, reducing scope is better than pushing harder. Sustainable > fast.
- **Don't add a new gap to the registry without Anton's buy-in.** Ask: "Should this be a gap or just a process fix?"
- **Don't ignore "What Went Well."** These are your operating principles. Double down on them.

---

## Escalation Rules

If the retro surfaces issues you can't resolve with project-manager skill:

| Blocker Type | Escalate To | Example |
|-------------|------------|---------|
| Technical unknowns (Xendit, Supabase, Claude API) | **fullstack-engineer** | "Xendit webhook idempotency is still unclear; need PoC" |
| Data privacy or compliance question | **security-compliance** | "OTP deliverability issue — does this delay our NPC filing?" |
| Unclear feature scope or product decisions | **product-owner** | "What should profile update flow look like?" |
| System design or architecture | **solutions-architect** | "Should system prompt modular scopes be tested per-scope or end-to-end?" |

Include in your escalation: what the issue is, why it matters, and when you need an answer (next sprint pre-planning? Within this week?).

---

## Quick Checklist Before Output

- [ ] Retro covers the actual sprint that just ended (not theoretical)
- [ ] "What Went Well" is specific (not generic praise)
- [ ] "What Didn't Work" is honest (not defensive)
- [ ] "What We Learned" has 1–3 actionable insights
- [ ] Action items are specific, assignable, and due-dated
- [ ] Energy check is honest (sustainability matters)
- [ ] New gaps (if any) are proposed and approved by Anton
- [ ] Output formatted per `references/sprint-templates.md`
- [ ] Tone is forward-looking (not blame-y)
- [ ] Action items are 2–3 (not 10)
- [ ] Retro appended to `shared/sprint-history.md` (Step 11)
- [ ] Sprint Log entry updated with actual outcomes (Step 11)
- [ ] Velocity & Patterns table updated
- [ ] Unresolved Action Items section updated
