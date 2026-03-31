Read and follow the complete workflow defined in:
`akbai-delivery/skills/solutions-architect/commands/build/SKILL.md`

This command chains multiple skills. In **team mode**, skills run as parallel teammates.
In **sequential mode**, skills chain in a single session.

## Step 0: Decide — Team Mode or Sequential

Evaluate the feature complexity:
- **S-feature** (<3 files, 1 skill, bug fix/config): Run **sequential** in this session.
- **M/L-feature** (3+ files, multiple skills, new feature): Use **agent team**.

---

## Team Mode (M/L features)

You (PM) are the team lead. Select teammates from this roster:

**Always include:** `build-architect`, `build-engineer`, `build-qa`

**Include if the feature...**
- Touches UI components → `build-ux` (mandatory — Sprint 5 proved 17+ violations slip past engineers)
- Is a NEW feature (not a fix) → `build-po` (validates scope + tier + acceptance criteria first)
- Needs new/changed tables → `build-data` (schema + migration + RLS)
- Involves Claude API/prompts → `build-ai` (system prompts, model routing, guardrails)
- Touches auth/payments/PII → `review-security` (RLS audit, NPC check)
- Has significant Taglish copy → `build-marketing` (brand pillar alignment)

Target: 4-5 teammates. Max 6.

### Team Workflow
1. Create an agent team named `build-[feature-slug]`
2. Spawn selected teammates
3. Create shared task list with dependency chain (see team-lead agent for templates)
4. Enforce quality gates in order:
   - `po` approves scope → `architect` finalizes ADR
   - ADR approved → `data` delivers schema (if on team)
   - Schema ready → `engineer` implements
   - Implementation done → `ux` reviews UI (if on team)
   - UX approved → `qa` runs full test suite
   - All tests green → compile deliverables for Anton
5. Compile deliverables summary
6. Clean up the team

---

## Sequential Mode (S features)

Chain skills in sequence within this session:
1. **solutions-architect** — Architecture & ADR (`akbai-delivery/skills/solutions-architect/SKILL.md`)
2. **data-architect** — Schema design (`akbai-delivery/skills/data-architect/SKILL.md`)
3. **fullstack-engineer** — Implementation (`akbai-delivery/skills/fullstack-engineer/SKILL.md`)
4. **qa-engineer** — Test generation (`akbai-delivery/skills/qa-engineer/SKILL.md`)

Read each skill's SKILL.md when that phase of the workflow is reached.
All file paths in command SKILL.md are relative to `akbai-delivery/`.

User input: $ARGUMENTS
