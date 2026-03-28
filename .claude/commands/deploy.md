Read and follow the complete workflow defined in:
`akbai-delivery/skills/devops-engineer/commands/deploy/SKILL.md`

For role context, also read:
`akbai-delivery/skills/devops-engineer/SKILL.md`

All file paths in the command SKILL.md are relative to `akbai-delivery/`.

---

## Agent Team Execution

For production deployments, use an agent team for parallel safety checks:

1. Create an agent team named `deploy-[date]`
2. Spawn teammates: `build-qa` + `review-security` + `deploy-ops`
3. Run parallel pre-deploy checks:
   - **You (devops lead):** Migration safety, env var verification, Vercel build config
   - **`build-qa`:** Full test suite (`npx vitest` + `npm run test:e2e`)
   - **`review-security`:** Final RLS audit on changed tables, API key scan, NPC compliance
   - **`deploy-ops`:** Monitoring config, support playbook, deployment guide, operational readiness
4. ALL four must report GREEN to proceed. If ANY reports RED → halt deploy, fix first.
5. Deploy to production
6. Post-deploy verification:
   - Sentry release tag with commit SHA
   - UptimeRobot monitoring active
   - Smoke test production URL
   - PostHog events flowing
7. Clean up the team

User input: $ARGUMENTS
