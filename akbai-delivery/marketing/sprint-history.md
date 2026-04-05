# Marketing Sprint History
> Parallel to shared/sprint-history.md. Tracks marketing-specific sprints (M1, M2, ...).
> Last updated: 2026-04-04

---

## M1 -- Infrastructure & Landing Page (2026-04-03 to 2026-04-17)

**Goal:** Deploy marketing infrastructure -- folder structure, agent definitions, landing page, Vercel deploy.
**Anton Time:** 2-3 hrs (review landing page, approve Vercel deploy)

### Task Board

| # | Task | Agent | Size | Status | Notes |
|---|------|-------|------|--------|-------|
| 1 | Create marketing folder structure | marketing-lead | S | DONE | STRATEGY.md, sprint-history, campaigns/, content/, seo/, analytics/ |
| 2 | Create 7 marketing agent definitions | marketing-lead | M | DONE | marketing-lead, content, social, seo, email, tools, analytics |
| 3 | Create /marketing command | marketing-lead | S | DONE | Full routing: sprint, content-batch, tool, metrics, campaign |
| 4 | Build public landing page | marketing-tools | M | DONE | `/landing` route, full component with hero, features, social proof, waitlist form |
| 5 | Add OG tags + JSON-LD | marketing-seo | S | DONE | Organization schema in root layout, OG tags, Twitter cards |
| 6 | Add sitemap + robots.txt | marketing-seo | S | DONE | `sitemap.ts` (2 routes) + `robots.txt` with app route disallows |
| 7 | Wire PostHog waitlist events | marketing-analytics | S | DONE | `trackWaitlistSignup`, `trackLandingPageViewed`, `trackLandingPageCtaClicked` |

### Sprint Metrics
- Tasks completed: 7/7
- Anton hours used: ~1/3 (status audit on 2026-04-04)

### Notes (added 2026-04-04)
- All infrastructure built in initial session on 2026-04-03
- Landing page lives at `/landing` (not a `(public)` route group yet — will scaffold for M2 tools)
- Landing page inherits root layout metadata — good enough for now, custom metadata can be added in M2
- Content directories have `.gitkeep` placeholders — ready for M2 content
- Pending: verify Vercel deployment is live and accessible

---

## Upcoming Sprints (Planned)

### M2 -- Free Tools + First Content (2026-04-17 to 2026-05-01)
**Goal:** Ship BIR Deadline Checker tool, publish first 2 SEO articles, begin Facebook group presence.
**Anton Time:** 3-4 hrs (review articles, start posting in FB groups)

### M3 -- Content Engine + Outreach (2026-05-01 to 2026-05-15)
**Goal:** Content repurposing pipeline operational, active in 3+ FB groups, waitlist email sequence live.
**Anton Time:** 3-4 hrs (content review, group engagement)

### M4 -- SEO Push + Viral Artifacts (2026-05-15 to 2026-05-29)
**Goal:** 5-6 articles published, BIR deadline infographics, TikTok content launch.
**Anton Time:** 3-4 hrs (TikTok recording, content review)

### M5 -- Optimization + 100 Target (2026-05-29 to 2026-06-12)
**Goal:** Conversion optimization, referral mechanics, hit 100 waitlist signups.
**Anton Time:** 2-3 hrs (review metrics, adjust strategy)
