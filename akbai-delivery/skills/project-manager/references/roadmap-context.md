# AKBai — Roadmap Context (Condensed)
> Source: Roadmap v13, Financial Model v5, Operations Roadmap v6
> For project-manager skill — use for scheduling and timeline decisions

---

## Timeline Overview

| Phase | Duration | Calendar (Est.) | Key Milestone |
|-------|----------|-----------------|---------------|
| 0A — Legal Foundation | Weeks 1–4 | Mar–Apr 2026 | 5 legal items complete |
| 0B — Demand Validation | Weeks 4–10 | Apr–May 2026 | 100 waitlist signups |
| 1 — MVP Build | Months 1–6 | Jun–Nov 2026 | 20 paying Pro users, ₱6K–₱10K MRR |
| 2 — Growth | Months 6–12 | Dec 2026–May 2027 | 80 paying users, ₱30K–₱50K MRR |
| 3 — Agent Builder | Month 12+ | Jun 2027+ | 200 paying, ₱100K–₱200K MRR |

**Note:** "Month 1" for Phase 1 begins after Phase 0B gate is passed, not from a fixed calendar date. All dates above are estimates based on starting Phase 0A in March 2026.

---

## Phase 0A — Legal Foundation (Weeks 1–4)

Sprint capacity: ~2–3 sprints (20–45 hrs total)

**Deliverables:**
1. DTI or SEC business registration filed
2. BIR Certificate of Registration obtained
3. NPC pre-compliance setup (DPO designation, Privacy Impact Assessment draft)
4. IP/Trademark filing for "AKBai" initiated
5. Privacy Policy + Terms of Service drafted (engage PH tech lawyer — do NOT self-draft)

**Parallel work (non-blocking):**
- Data backup strategy (Supabase PITR enabled) — Gap D5
- Data retention policy draft — Gap D11
- Authentication architecture design (email OTP via Supabase Auth) — Gap A1

**External dependencies:**
- PH tech lawyer engagement (Privacy Policy, OR legality review)
- DTI/SEC processing time (2–4 weeks)
- BIR processing time (1–3 weeks after DTI/SEC)

---

## Phase 0B — Demand Validation (Weeks 4–10)

Sprint capacity: ~3 sprints (30–45 hrs total)

**Deliverables:**
1. Brand identity complete (KA visual system) — DONE (Brand Kit v1.0 delivered)
2. Landing page live with waitlist signup (no product domain yet — use a temporary solution)
3. 5–6 SEO Taglish articles published (target: "BIR deadline", "negosyo tips", "receipt tracking")
4. 10 founder interviews completed (target personas: Maria, Jose, Ana, Andoy)
5. 100+ waitlist signups (zero paid ads — organic only)

**Parallel work (non-blocking):**
- Build 0: AI Scope Definition & System Prompt Architecture (design phase)
- Tech stack setup: Next.js project init, Supabase project creation
- Competitive monitoring

---

## Phase 1 — MVP Build (Months 1–6)

Sprint capacity: ~12 sprints (120–180 hrs total)

**Build Order (strict sequence — each build depends on the previous):**

| Build | Feature | Est. Sprints | Key Dependencies |
|-------|---------|-------------|-----------------|
| Build 0 | AI Scope & System Prompt Architecture | 1 | HARD GATE — must complete before Build 1 |
| Build 1 | Kilala Kita (Onboarding) | 1–2 | Auth (Gap A1), Supabase schema |
| Build 2 | Dashboard | 1–2 | Build 1 (needs user profile data) |
| Build 3 | Resibo Scanner | 2 | Claude API key, Build 1 |
| Build 4 | Saan Napunta (Expenses) | 1–2 | Build 3 (needs transaction data) |
| Build 5 | Ang Umaga Mo (Morning Briefing) | 1 | Build 2 + Build 4 |
| Build 6 | Deadline Watcher | 1 | BIR calendar data, notification system |
| Build 7 | Reply Drafter | 1 | Build 0 system prompt |
| Build 8 | Costing + Invoice Cards | 2 | Build 3 + Build 4 |

**Pre-launch checklist (before first beta user):**
- All 8 CRITICAL gaps resolved (gap-registry.md)
- All 8 Design Gates complete (gap-registry.md)
- Sentry + PostHog live (Gaps A4, A5)
- UTC+8 timezone enforcement verified (Gap A3)
- Feature flag system in place
- 4-Layer data isolation verified
- UAT environment with 15–20 invited testers

**Phase 1 targets:** 50 registered users, 20 paying Pro (₱399/mo), ₱6K–₱10K MRR

---

## Phase 2 — Growth (Months 6–12)

**Key launches:**
- Business tier (₱899/mo, multi-seat up to 5: Owner, Accountant, Viewer)
- WhatsApp Business API integration
- Referral program + micro-influencer program
- Churn recovery / dunning flow
- Beta-to-paid migration (loyalty rate for Phase 0C pilot users)

**Operations builds (from Ops Roadmap v6):**
- OPS 0: Monitoring stack (Sentry, PostHog, UptimeRobot)
- OPS 1: Billing (Xendit subscription lifecycle)
- OPS 2: Admin dashboard (Retool or Supabase dashboard)
- OPS 3: Support triage
- OPS 4: BIR calendar automation
- OPS 5: Data ingestion pipeline
- OPS 5B: GSheets OAuth (Business tier)

**Phase 2 targets:** 200 registered users, 80 paying (Pro + Business), ₱30K–₱50K MRR

---

## Phase 3 — Agent Builder Platform (Month 12+)

- Custom AI behaviors via Taglish conversation
- Scale tier launch (₱1,499/mo)
- API integrations
- **Targets:** 500+ users, 200 paying, ₱100K–₱200K MRR

---

## Key Financial Milestones

| Milestone | Target | Metric |
|-----------|--------|--------|
| First paying user | Phase 1, Month 2 | ₱399 MRR |
| Break-even | Month 7 | Revenue covers all costs |
| Y1 end-of-year | Month 12 | 399 users, ₱110K net profit |
| Pro LTV | Ongoing | ₱9,975 (25-month avg lifetime) |
| Blended CAC | Ongoing | ₱110 |

---

## Sprint Capacity Reference

| Block | Hours | Best For |
|-------|-------|----------|
| Weekday evening | 2–3 hrs | Focused coding, writing, research |
| Saturday | 4–6 hrs | Architecture, complex features, design decisions |
| Sunday | 0 (rest) | No planned work — buffer for overruns only |
| Sprint total | 10–15 hrs | 3–5 tasks per sprint |
| Max single task | 4 hrs | Saturday-only for L-size tasks |
