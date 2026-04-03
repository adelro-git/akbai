Read and follow the complete workflow defined below. This command coordinates AKBai's marketing workstream using a dedicated marketing agent team.

## Step 0: Read Context

Read these files first to understand the current state:

1. `akbai-delivery/marketing/STRATEGY.md` — Marketing strategy, phases, OKRs, current priorities
2. `akbai-delivery/marketing/sprint-history.md` — Current marketing sprint context, what's been done
3. `akbai-delivery/skills/marketing-lead/SKILL.md` — Marketing skill definition (GTM, content, messaging)
4. `akbai-delivery/shared/brand-context.md` — Brand identity, voice pillars, messaging pillars
5. `akbai-delivery/skills/marketing-lead/references/brand-voice.md` — Katuwang voice guide

---

## Step 1: Parse the Argument

Based on `$ARGUMENTS`, route to the right workflow:

### `/marketing sprint [N]` — Plan and execute marketing sprint N
1. Read STRATEGY.md for current marketing phase and priorities
2. Read sprint-history.md for previous sprint outcomes
3. Plan the sprint: select tasks, estimate effort, assign to marketing agents
4. Use **agent team** mode — you (marketing-lead) are the PM
5. Select teammates based on sprint tasks:
   - Content tasks → `marketing-content`
   - Social media tasks → `marketing-social`
   - SEO tasks → `marketing-seo`
   - Email tasks → `marketing-email`
   - Tool building → `marketing-tools`
   - Metrics/reporting → `marketing-analytics`
6. Target 3-4 teammates, max 5
7. Execute sprint, enforce quality gates (Strategy → Content → Voice → Distribution → Metrics)
8. Update sprint-history.md with outcomes

### `/marketing content-batch` — Batch-create a week's content across channels
1. Read content-calendar.md for this week's planned content
2. Use **agent team** with: `marketing-content` + `marketing-social` (+ `marketing-seo` if blog content)
3. Workflow:
   - marketing-lead approves week's content goals (Strategy gate)
   - marketing-content drafts blog article(s)
   - marketing-social drafts FB posts + TikTok/IG scripts
   - marketing-seo optimizes blog content (if present)
   - marketing-lead reviews all content for voice (Voice gate)
   - Compile batch + recommended publish schedule
4. Deliverable: content batch folder with all pieces ready for Anton to review and publish

### `/marketing tool [name]` — Build a specific free public tool
1. Read STRATEGY.md for tool specifications
2. Use **agent team** with: `marketing-tools` + `marketing-seo`
3. marketing-tools builds the tool following build-engineer code standards
4. marketing-seo adds schema markup, meta tags, OG tags
5. Enforce code quality: TypeScript strict, Zod validation, mobile-first, design system compliance
6. Deliverable: working tool at `frontend/src/app/(public)/tools/[name]/` with waitlist capture

### `/marketing metrics` — Generate channel performance report
1. Activate `marketing-analytics` (short-lived)
2. Query available data sources (PostHog, Supabase, manual tracking)
3. Generate weekly report in `akbai-delivery/marketing/analytics/`
4. Deliver top 3 actionable insights to Anton

### `/marketing campaign [name]` — Plan and execute a specific campaign
1. Read STRATEGY.md for campaign context
2. Use **full agent team** — select all relevant agents based on campaign scope
3. Workflow:
   - marketing-lead defines campaign goals, channels, timeline (Strategy gate)
   - marketing-seo researches keywords and pain points
   - marketing-content creates pillar content (blog article)
   - marketing-social creates channel derivatives (FB posts, TikTok scripts)
   - marketing-email designs email sequence (if campaign includes email)
   - marketing-lead reviews everything for voice (Voice gate)
   - marketing-analytics sets up tracking (Metrics gate)
4. Deliverable: complete campaign package with all content, schedule, and tracking

---

## Marketing Agent Team Roster

| Role | Agent | Model | Include When |
|------|-------|-------|-------------|
| PM/Strategist | `marketing-lead` | Sonnet | Always (you are this agent) |
| Content Writer | `marketing-content` | Sonnet | Blog posts, SEO articles, long-form |
| Social Media | `marketing-social` | Haiku | FB posts, TikTok scripts, IG captions |
| SEO Specialist | `marketing-seo` | Sonnet | Keywords, schema, technical SEO, blog infra |
| Email Designer | `marketing-email` | Haiku | Email sequences, waitlist nurture |
| Tools Engineer | `marketing-tools` | Sonnet | Public tools, landing page, waitlist capture |
| Analytics | `marketing-analytics` | Haiku | Weekly metrics, performance reports |

---

## Quality Gates (Sequential — Non-Negotiable)

1. **Strategy gate:** marketing-lead approves goals/approach before any content is created
2. **Content gate:** Content reviewed for accuracy + brand alignment. No factually wrong BIR info passes.
3. **Voice gate:** Validate Taglish authenticity against brand-voice.md. Calibration test: "Would Maria the home baker think 'para sa'kin 'to'?"
4. **Distribution gate:** Verify publish timeline and channel targeting. No URLs if domain not live.
5. **Metrics gate:** Track results, report weekly. All insights must be actionable.

---

## File Boundary — Marketing vs Build Workstream

The marketing team owns:
- `akbai-delivery/marketing/` — all marketing content, strategy, analytics
- `frontend/src/app/(public)/` — public-facing pages and tools (marketing-tools only)
- `frontend/src/components/public/` — public page components (marketing-tools only)
- `frontend/src/app/api/waitlist/` — waitlist API route (marketing-tools only)

The marketing team does NOT touch:
- `frontend/src/app/(app)/` — authenticated app (build team territory)
- `frontend/src/app/api/` (except waitlist) — app API routes (build team territory)
- `frontend/src/components/features/` — app components (build team territory)
- `akbai-delivery/skills/` (except reading marketing-lead references)

User input: $ARGUMENTS
