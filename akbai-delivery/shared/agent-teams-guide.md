# AKBai Agent Teams — Usage Guide
> **Last updated:** 2026-03-28 | **For:** Anton (solo founder)
> Quick reference for running agent teams across /build, /sprint, /review, and /deploy workflows.

---

## How It Works

Agent teams are multiple Claude Code instances working together — one **team lead** (PM) coordinates **teammates** who communicate via shared task lists and direct messages. Each teammate has its own context window and reads the relevant SKILL.md for its role.

**Your workflow barely changes.** The commands you already use (`/sprint`, `/build`, `/review`, `/deploy`) now automatically spawn teams for medium/large tasks. Small tasks still run sequentially in one session.

---

## Day-to-Day Workflow

### Before (old model)
```
/sprint → approve plan → /build [feature] → /test → /review
```

### After (with agent teams)
```
/sprint → approve plan → /build [feature] → (team handles test+review internally) → you live test
```

The key difference: `/build` on M/L features spawns a coordinated team. You interact with the **PM lead** and it handles the rest.

---

## Keyboard Shortcuts (in-process mode — VS Code)

| Key | Action |
|-----|--------|
| **Shift+Down** | Cycle to next teammate |
| **Enter** | View a teammate's session |
| **Escape** | Interrupt a teammate's current turn |
| **Ctrl+T** | Toggle the shared task list |
| **Type** | Send a message to whichever teammate you're viewing |

---

## Running /build

### Step 1: Invoke /build
```
/build [feature name]
```

### Step 2: Claude decides team size automatically

| Feature Size | What Happens | Example |
|-------------|-------------|---------|
| **S-feature** (<3 files, bug fix) | Runs sequentially, no team | `/build fix login redirect` |
| **M-feature** (3-10 files, UI) | Spawns 4 teammates + PM lead | `/build dashboard expense card` |
| **L-feature** (10+ files, cross-cutting) | Spawns 5-6 teammates + PM lead | `/build Ang Umaga Mo` |

### Step 3: PM selects teammates using this checklist

```
1. Does it touch UI?              → build-ux
2. Is it a NEW feature?           → build-po (scope validation)
3. New tables?                    → build-data
4. Claude API/prompts?            → build-ai
5. Significant Taglish copy?      → build-marketing
6. Auth/payments/PII?             → review-security
7. Always:                        → build-architect + build-engineer + build-qa
```

### Step 4: Quality gates execute automatically

```
po approves scope
  → architect finalizes ADR
    → data delivers schema + RLS
      → engineer implements
        → ux reviews UI components
          → qa runs all tests
            → PM compiles deliverables for you
```

### Step 5: You live test (15-30 min)

When PM reports "all green, ready for live testing" — run the dev server and click through.

---

## Running /sprint

### Step 1: Plan the sprint
```
/sprint
```
Same as before. Review and approve the plan.

### Step 2: Team spawns after approval

The PM creates a team with:
- **build-po** — validates sprint scope at the start, then goes idle
- **2-3 stream workers** — one per parallel workstream (each reads relevant SKILL.md files)
- **build-qa** — runs post-merge test suite
- **deploy-ops** — checks operational readiness (if sprint ships to prod)

### Step 3: Monitor or let it run

You can check progress with **Shift+Down** or just wait for the PM to report results.

---

## Running /review

```
/review
```

For PRs with 5+ files, spawns: **review-security** + **build-qa** + **build-ux** (if UI changes)

Each reviews from their own lens in parallel. PM compiles consolidated findings.

---

## Running /deploy

```
/deploy
```

Spawns: **build-qa** + **review-security** + **deploy-ops**

All four (including devops lead) must report GREEN before deploy proceeds.

---

## The 12 Agent Roster

| Agent | Skill | When Included |
|-------|-------|---------------|
| `build-architect` | solutions-architect | ALL builds (core) |
| `build-data` | data-architect | New/changed tables |
| `build-engineer` | fullstack-engineer | ALL builds (core) |
| `build-qa` | qa-engineer | ALL builds (core) |
| `build-ux` | ux-designer | Any UI work |
| `build-po` | product-owner | New features |
| `build-ai` | ai-engineer | Claude API features |
| `build-marketing` | marketing-lead | Content-heavy Taglish |
| `review-security` | security-compliance | Auth, payments, PII |
| `deploy-devops` | devops-engineer | Deploy workflows |
| `deploy-ops` | ops-lead | Operational readiness |
| `team-lead` | project-manager | Always the lead |

---

## Practical Examples with AKBai Builds

### Build 5: Ang Umaga Mo (Morning Briefing)
```
/build Ang Umaga Mo
```
**Team:** po + architect + ai + engineer + qa
- `po` validates: Pro-only, MCTD 5/5, direct Maria Moment
- `ai` designs: morning briefing prompt, Taglish greeting patterns
- `engineer` implements: cron trigger, API route, chat bubbles
- `qa` tests: UTC+8 timezone, Pro tier gate, Taglish output

### Build 6: Deadline Watcher (BIR Calendar)
```
/build Deadline Watcher
```
**Team:** po + architect + data + engineer + ux + qa
- `data` designs: bir_deadlines table, notification schedule
- `ux` reviews: deadline cards, push notification copy, urgency levels
- `qa` tests: weekend rollover, Philippine holidays, timezone

### Build 7: Reply Drafter
```
/build Reply Drafter
```
**Team:** po + architect + ai + engineer + marketing + qa
- `marketing` reviews: brand pillar alignment in auto-generated replies
- `ai` designs: reply drafting prompt, tone matching

---

## Steering the Team

| What you want | What to do |
|---|---|
| Check what a teammate is doing | **Shift+Down** to cycle, **Enter** to view |
| Redirect a teammate | Shift+Down to them, type your instruction |
| Ask PM for status | Type: "What's the current status?" |
| Force sequential (skip team) | "Build this sequentially, no team needed" |
| Force a team on a small task | "Create an agent team for this — I want security reviewing it" |
| Stop a teammate | **Escape** to interrupt, or ask PM to shut them down |

---

## Token Cost Reality

| Mode | Cost | When |
|------|------|------|
| Sequential (S) | 1x | Bug fixes, config |
| Team 4+lead (M) | ~4x | Multi-file UI features |
| Team 5-6+lead (L) | ~5-6x | Cross-cutting builds |

**Mitigations:** Short-lived roles (po, marketing) go idle early. Support agents use Sonnet/Haiku (cheaper). S-features skip teams entirely.

**Rule of thumb:** If it touches <3 files → no team. If 3+ files → team pays for itself in speed and quality.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Teammates not appearing | Press **Shift+Down** — they may be running but not visible |
| Too many permission prompts | Pre-approve common tools in settings before spawning |
| Teammate stopped on error | Shift+Down to view, give instructions, or ask PM to spawn a replacement |
| PM started coding instead of delegating | Say: "Wait for your teammates to complete their tasks" |
| File conflict between teammates | Tell PM: "Reassign file boundaries — two agents are touching the same file" |
