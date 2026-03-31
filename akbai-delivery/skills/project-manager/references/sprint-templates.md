# AKBai — Sprint Templates
> For project-manager skill — use these templates for formal sprint outputs

> **Updated Sprint 4:** Templates now use Agent Size + Anton Time estimation model.
> **Updated Sprint 8:** Agent teams replace worktree-isolated agents as the primary execution model. The PM spawns coordinated teammates who communicate via shared task lists. See `shared/agent-teams-guide.md` for full usage guide.

---

## Sprint Plan Template

```markdown
# Sprint [NUMBER] Plan — [START DATE] to [END DATE]
**Phase:** [Current Phase]
**Sprint Goal:** [One sentence — what does "done" look like for this sprint?]
**Capacity:** [X] hours (adjust if holiday, travel, or energy)

## Tasks (ordered by priority — work top-down)

| # | Task | Agent Size | Anton Time | Priority | Stream | Confidence |
|---|------|------------|------------|----------|--------|------------|
| 1 | [Task title] | S | 0.5 hr | CRITICAL gap A2 | A | High |
| 2 | [Task title] | M | 1 hr | Phase gate G1.3 | B | Medium |
| 3 | [Task title] | S | 0.5 hr | Phase gate G1.4 | A | High |
| 4 | [Task title] | S | 0.25 hr | Tech debt | B | High |
| 5 | [Task title] | M | 1.5 hr | Phase gate G2.1 | Sequential | Low |

**Total Anton time:** [X] hrs / [X] hrs capacity
**Buffer:** [X] hrs unallocated (aim for 2–3 hrs buffer per sprint)

## Parallel Streams

| Stream | Tasks | Branch | Can Run Simultaneously? |
|--------|-------|--------|------------------------|
| A | 1, 3 | claude/sprint{N}-stream-a | Yes — no shared files |
| B | 2, 4 | claude/sprint{N}-stream-b | Yes — no shared files |
| Sequential | 5 | (after A, B merge) | No — depends on Tasks 1-4 |

**Multi-session plan:** Streams A and B can be assigned to separate Claude Code sessions for maximum throughput.

---

### Task 1: [Task title] (Agent: S | Anton: 0.5 hr)
**Why:** [Which gap/gate this addresses and why it's this priority]
- [ ] [Concrete sub-step 1 — specific action with defined output]
- [ ] [Concrete sub-step 2]
- [ ] [Concrete sub-step 3]
- [ ] [Concrete sub-step 4]
**Done when:** [One-line definition of done for this task]

### Task 2: [Task title] (Agent: M | Anton: 1 hr)
**Why:** [Which gap/gate this addresses and why it's this priority]
- [ ] [Concrete sub-step 1]
- [ ] [Concrete sub-step 2]
- [ ] [Concrete sub-step 3]
- [ ] [Concrete sub-step 4]
- [ ] [Concrete sub-step 5]
**Done when:** [One-line definition of done for this task]
**Depends on:** Task 1

### Task 3: [Task title] (Agent: S | Anton: 0.5 hr)
**Why:** [Which gap/gate this addresses]
- [ ] [Concrete sub-step 1]
- [ ] [Concrete sub-step 2]
- [ ] [Concrete sub-step 3]
**Done when:** [One-line definition of done for this task]

[... repeat for each task ...]

---

## Risks & Dependencies
- [External dependency: e.g., "Waiting on lawyer review — may delay Task 2"]
- [Technical risk: e.g., "First time working with Xendit API — Task 4 confidence is Low"]

## Sprint Definition of Done
- [ ] [Criterion 1 — e.g., "DTI registration filed and receipt in hand"]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
```

---

## Sprint Review Template

```markdown
# Sprint [NUMBER] Review — [END DATE]
**Sprint Goal:** [Original goal from plan]
**Verdict:** [ACHIEVED / PARTIALLY ACHIEVED / MISSED]

## Completed
| # | Task | Agent Size | Anton Time (planned) | Anton Time (actual) | Notes |
|---|------|------------|---------------------|---------------------|-------|
| 1 | [Task] | S | 0.5 hr | 0.25 hr | [Any learnings] |
| 2 | [Task] | M | 1 hr | 1.5 hr | [Took longer because...] |

## Not Completed
| # | Task | Reason | Carry Over? |
|---|------|--------|-------------|
| 3 | [Task] | [Blocked by X] | Yes — Sprint [N+1] |
| 4 | [Task] | [Deprioritized] | No — back to backlog |

## Metrics
- **Planned hours:** [X]
- **Actual hours logged:** [X]
- **Completion rate:** [X/Y tasks] ([Z]%)
- **Velocity trend:** [Increasing / Stable / Decreasing vs. last sprint]

## Phase Gate Progress
- **Current phase:** [Phase X]
- **Gate criteria met:** [X/Y]
- **Estimated sprints to gate:** [N]

## Key Learnings
- [What went well]
- [What took longer than expected and why]
- [What to do differently next sprint]
```

---

## Sprint Retro Template

```markdown
# Sprint [NUMBER] Retro — [DATE]

## What Went Well
- [Thing that worked — be specific, not generic]
- [Another thing]

## What Didn't Go Well
- [Problem — be honest, not blame-y]
- [Another problem]

## Action Items
| # | Action | Owner | Due By |
|---|--------|-------|--------|
| 1 | [Specific action — not "do better"] | Anton | Sprint [N+1] |
| 2 | [Another action] | Anton | Sprint [N+1] |

## Energy Check
**How sustainable was this sprint?**
- [ ] Felt good — could maintain this pace
- [ ] A bit stretched — need to protect buffer next sprint
- [ ] Burned out — reduce scope next sprint

**Saturday utilization:** [Used for AKBai / Partly used / Skipped]
**Evening consistency:** [X out of 10 evenings used]
```

---

## Phase Gate Assessment Template

```markdown
# Phase Gate Assessment: [Phase X] → [Phase Y]
**Date:** [DATE]
**Assessed by:** project-manager skill

## Gate Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| G[X].1 | [Criterion name] | ✅ DONE | [Specific evidence] |
| G[X].2 | [Criterion name] | 🔄 IN PROGRESS | [What remains + ETA] |
| G[X].3 | [Criterion name] | ❌ NOT STARTED | [Why + proposed plan] |
| G[X].4 | [Criterion name] | 🚫 BLOCKED | [Blocker + escalation] |

## Verdict: [GO / CONDITIONAL GO / NO-GO]

**Rationale:** [2–3 sentences explaining the verdict]

### If CONDITIONAL GO:
- **Carryover items:** [List items with completion dates]
- **Risk if carryover slips:** [What breaks if these aren't done]

### If NO-GO:
- **Remediation sprint plan:**
  1. [Task to unblock criterion X — est. Y hrs]
  2. [Task to unblock criterion Z — est. Y hrs]
- **Estimated time to re-assess:** [N weeks]
- **Escalation needed:** [Yes/No — if yes, which skill]
```

---

## Backlog Template

```markdown
# AKBai Backlog — [DATE]
**Phase:** [Current Phase]
**Total items:** [X] / 20 max
**Top 10 estimated hours:** [X] hrs (~[N] sprints)

## Tier 1: CRITICAL Gaps
| # | Item | Size | Phase | Gap Ref |
|---|------|------|-------|---------|
| 1 | [Item] | M | 0A | A1 |

## Tier 2: Phase Gate Features
| # | Item | Size | Phase | Gate Ref |
|---|------|------|-------|----------|
| 5 | [Item] | L | 0B | G2.1 |

## Tier 3: User Requests
| # | Item | Size | Source | Date Added |
|---|------|------|--------|------------|
| 10 | [Item] | S | Interview #3 | 2026-04-01 |

## Tier 4: Tech Debt / Nice-to-Have
| # | Item | Size | Rationale |
|---|------|------|-----------|
| 15 | [Item] | XS | Cleanup from Sprint 2 |

## Icebox (deferred — not counted in 20-item cap)
- [Item] — deferred because [reason]
```

---

## Quick Status Template (for casual "where are we?" questions)

```markdown
**Sprint [N]:** [X/Y tasks done] | Agent: [X/Y complete] | Anton review: [X/Y approved]
**Anton time:** [Z hrs used / W hrs planned]
**Phase [X]:** [N/M gate criteria met]
**CRITICAL gaps:** [N/8 resolved]
**Streams:** [A: done | B: in progress | Sequential: blocked]
**On track?** [Yes / At risk — reason / Behind — reason]
**Next up:** [Highest priority unfinished task] | **Anton action needed:** [review/test/decision/none]
```
