Read and follow the complete workflow defined in:
`akbai-delivery/skills/project-manager/commands/sprint/SKILL.md`

For role context, also read:
`akbai-delivery/skills/project-manager/SKILL.md`

All file paths in the command SKILL.md are relative to `akbai-delivery/`.

---

## Agent Team Execution (after plan approval)

After Anton approves the sprint plan, execute using an agent team:

1. Create an agent team named `sprint-[N]`
2. Spawn `build-po` teammate to validate sprint scope (MCTD scoring, gap alignment)
3. After `po` validates scope, spawn stream teammates (2-3 streams, one per parallel workstream)
   - Each stream worker reads the SKILL.md files relevant to its assigned tasks
   - Assign file boundaries to prevent conflicts between streams
4. Spawn `build-qa` teammate for post-merge verification
5. If sprint ships to production, spawn `deploy-ops` teammate for operational readiness
6. Create shared task list from sprint plan with dependencies between streams
7. Monitor progress. Resolve cross-stream conflicts. Reassign work if a stream gets stuck.
8. After all streams complete: `qa` runs full test suite (`npx vitest` + `npm run test:e2e`)
9. `ops` checks operational readiness (if present) — traffic light report
10. Fix failures by assigning to relevant stream teammate
11. Report to Anton for live testing (15-30 min click-through)
12. Clean up the team

### Stream Worker Selection
Each stream teammate reads whichever SKILL.md files its tasks require:
- UI tasks → read `fullstack-engineer/SKILL.md` + `ux-designer/references/design-system.md`
- Schema tasks → read `data-architect/SKILL.md`
- AI tasks → read `ai-engineer/SKILL.md`
- Security tasks → read `security-compliance/SKILL.md`

User input: $ARGUMENTS
