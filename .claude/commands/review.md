Read and follow the complete workflow defined in:
`akbai-delivery/skills/fullstack-engineer/commands/review/SKILL.md`

This command chains multiple skills:
1. **fullstack-engineer** — Code quality review (`akbai-delivery/skills/fullstack-engineer/SKILL.md`)
2. **security-compliance** — Security review (`akbai-delivery/skills/security-compliance/SKILL.md`)

Read each skill's SKILL.md when that phase of the review is reached.
All file paths in command SKILL.md are relative to `akbai-delivery/`.

---

## Team Mode (for comprehensive review)

For PRs touching 5+ files or involving security-sensitive code, use an agent team:

1. Create an agent team named `review-[branch]`
2. Spawn teammates based on PR content:
   - **Always:** `review-security` + `build-qa`
   - **If UI changes present:** `build-ux` (design system + Taglish compliance)
3. You (fullstack-engineer lead) review code quality in parallel with teammates
4. Teammates message you with findings organized by severity (Critical / Important / Suggestion)
5. Compile consolidated review with all findings
6. Clean up the team

### Review Lens by Teammate
- **You (lead):** Code patterns, conventions, error handling, TypeScript strictness, no `any` types
- **`review-security`:** RLS policies, API key exposure, auth checks, NPC compliance, input validation
- **`build-qa`:** Test coverage gaps, regression risks, missing edge cases
- **`build-ux`:** Design system violations, Taglish copy quality, mobile-first compliance

For small PRs (<5 files, single concern): skip team mode, review sequentially.

User input: $ARGUMENTS
