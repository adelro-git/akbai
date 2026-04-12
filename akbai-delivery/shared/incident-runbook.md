# AKBai --- Incident Response Runbook
> For: Anton (solo founder) | Last updated: 2026-04-12

## Severity Levels
- P0: App completely down (all users affected)
- P1: Critical feature broken (payments, auth, AI chat)
- P2: Non-critical feature degraded (push notifications, admin dashboard)
- P3: Cosmetic / low-impact issue

## Detection
- Sentry alerts (errors@sentry.io)
- UptimeRobot notifications (when configured)
- /api/health endpoint returns 503
- User reports via support channels

## Response Protocol

### P0/P1: App Down or Critical Feature Broken
1. Check /api/health --- identify which dependency is down (Supabase, Anthropic, Xendit)
2. Check Sentry for error spike
3. If Supabase: check status.supabase.com, verify project is running
4. If Anthropic: check API status, verify budget cap not hit ($150/mo)
5. If Xendit: check dashboard, verify webhook endpoint responding
6. If code bug: revert last deployment via Vercel dashboard
7. Post status update (where?)
8. Fix and deploy

### P2: Feature Degraded
1. Investigate in Sentry
2. Determine if fix can wait until next sprint
3. If urgent: hotfix branch, deploy
4. If not urgent: add to sprint backlog

## Rollback Procedure
1. Go to Vercel dashboard -> Deployments
2. Find last working deployment
3. Click "Promote to Production"
4. Verify /api/health returns 200

## Communication
- During incident: update status page (when available)
- After resolution: write brief postmortem in sprint-history.md

## Contacts
- Supabase support: dashboard.supabase.com
- Anthropic status: status.anthropic.com
- Xendit support: dashboard.xendit.co
- Vercel support: vercel.com/support
