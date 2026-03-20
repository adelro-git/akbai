# AKBai — Feature Matrix
> Used by: product-owner, project-manager, solutions-architect
> Last updated: March 2026 | Source: Roadmap v14, Financial Model v5, Operations Roadmap v6

---

## Phase 1 — MVP Features

| # | Feature | Tier | Build | Dependencies | M | C | T | D | Score | Status |
|---|---------|------|-------|-------------|---|---|---|---|-------|--------|
| 0 | AI Scope Definition & System Prompt Architecture | All | Build 0 | None (HARD GATE) | 2 | 2 | 3 | 5 | 2.8 | Not Started |
| 1 | Kilala Kita (5-step onboarding) | All | Build 1 | Build 0, Auth (A1) | 4 | 3 | 5 | 3 | 3.8 | Not Started |
| 2 | Dashboard (business health at a glance) | All | Build 2 | Build 1, PostHog (A5) | 5 | 2 | 5 | 3 | 4.0 | Not Started |
| 3 | Resibo Scanner (receipt OCR) | Pro+ | Build 3 | Build 1, OCR spike (E1) | 4 | 2 | 5 | 3 | 3.6 | Not Started |
| 4 | Saan Napunta (expense dashboard) | Pro+ | Build 4 | Build 3 (needs receipt data) | 5 | 3 | 5 | 4 | 4.4 | Not Started |
| 5 | Ang Umaga Mo (morning briefing) | Free (teaser) / Pro (full) | Build 5 | Builds 3–4 (needs expense data) | 5 | 3 | 5 | 3 | 4.2 | Not Started |
| 6 | Deadline Watcher (BIR calendar) | Free (basic) / Pro (full sequence) | Build 6 | Build 1 (needs business type) | 4 | 4 | 4 | 4 | 4.0 | Not Started |
| 7 | Reply Drafter (DM reply suggestions) | Pro+ | Build 7 | Build 0 (needs AI scope) | 3 | 3 | 4 | 4 | 3.4 | Not Started |
| 8 | Costing Cards + Invoice Cards | Pro+ | Build 8 | Build 1 (needs business profile) | 4 | 2 | 4 | 4 | 3.6 | Not Started |

### Phase 1 — Supporting Features

| # | Feature | Tier | Phase | Dependencies | M | C | T | D | Score |
|---|---------|------|-------|-------------|---|---|---|---|-------|
| S1 | Daily Check-In (evening modal) | All | Build 2+ | Build 1 | 4 | 4 | 3 | 5 | 4.0 |
| S2 | Weekly Reconciliation (Friday prompt) | All | Build 4+ | S1 (needs daily data) | 3 | 4 | 3 | 4 | 3.4 |
| S3 | Monthly Reconciliation (EOM summary) | Pro+ | Build 5+ | S1, S2 | 5 | 3 | 4 | 3 | 4.0 |
| S4 | Free Tier Limit UX (B2) | Free | Build 3 | Auth (A1) | 2 | 4 | 5 | 5 | 3.6 |
| S5 | AI Loading States (B1) | All | Build 3 | Build 0 | 2 | 5 | 3 | 5 | 3.4 |
| S6 | Empty States — all features (B5) | All | Each build | Per feature | 3 | 4 | 3 | 5 | 3.6 |
| S7 | Flag as Wrong (trust recovery) | All | Build 3 | Build 0 | 3 | 3 | 3 | 5 | 3.4 |
| S8 | Profile Update Flow (B4) | All | Build 3 | Build 1 | 2 | 4 | 2 | 5 | 3.0 |

---

## Phase 2 — Growth Features

| # | Feature | Tier | Dependencies | Notes |
|---|---------|------|-------------|-------|
| P2-1 | Business Tier Launch | Business (₱899) | Phase 1 complete, Sense Check GREEN | Multi-seat (Owner, Accountant, Viewer), GSheets OAuth |
| P2-2 | GSheets OAuth Export | Business | P2-1 | Accountant handoff — export transactions to Google Sheets |
| P2-3 | Multi-Seat Access | Business | P2-1 | Up to 5 seats: Owner (full), Accountant (financials), Viewer (read-only) |
| P2-4 | WhatsApp Business API | Pro+ | Meta API approval (E2 pre-submitted) | Proactive notifications via WhatsApp. Replaces push for key alerts. |
| P2-5 | Referral Loop | All | Phase 1 user base | Referral code → signup → paid conversion tracking |
| P2-6 | Churn Recovery / Dunning | Pro+ | Xendit subscription API | 3-email + push sequence on payment failure. 7-day winback on churn. |
| P2-7 | Micro-Influencer Program | N/A (marketing) | Phase 0B brand identity | 10 MSME creators, ₱500 GCash/month + free Pro |

---

## Phase 3 — Agent Builder Features

| # | Feature | Tier | Dependencies | Notes |
|---|---------|------|-------------|-------|
| P3-1 | Custom Behaviors (Taglish rules) | Pro (3), Biz (10), Scale (unlimited) | Build 0 domain-expandable arch | User-defined triggers via conversation |
| P3-2 | Scale Tier Launch (₱1,499) | Scale | P3-1 | Unlimited behaviors + API integrations |
| P3-3 | API Integrations | Scale | P3-2 | Third-party connections (accounting software, POS) |
| P3-4 | Cross-Channel Outbound | Scale | P2-4 (WhatsApp) | Automated outreach across channels |

---

## Dependency Map

```
Build 0 (AI Scope) ──→ Build 1 (Kilala Kita) ──→ Build 2 (Dashboard)
     │                      │                          │
     │                      ├──→ Build 6 (Deadlines)   ├──→ S1 (Daily Check-In)
     │                      ├──→ Build 8 (Costing)     │
     │                      │                          ├──→ S2 (Weekly Recon)
     ├──→ Build 7 (Reply)   │                          │
     ├──→ S5 (Loading)      │                          └──→ S3 (Monthly Recon)
     └──→ S7 (Flag Wrong)   │
                            └──→ Build 3 (Resibo) ──→ Build 4 (Saan Napunta)
                                      │                      │
                                      │                      └──→ Build 5 (Ang Umaga Mo)
                                      └──→ S4 (Free Limit UX)

CRITICAL GATES (must resolve before dependent builds):
  A1 (Auth)          ──→ Everything
  A5 (PostHog)       ──→ Build 2, Sense Check
  E1 (OCR Spike)     ──→ Build 3
  E3 (Rate Limit)    ──→ Build 1 (onboarding must be exempt from free tier cap)
```

---

## Tier Allocation Summary

| Feature | Free | Pro ₱399 | Business ₱899 | Scale ₱1,499 |
|---------|------|----------|---------------|--------------|
| AI Queries (Haiku) | 10/day | Unlimited | Unlimited | Unlimited |
| AI Queries (Sonnet) | — | Yes | Yes | Yes |
| Receipt Scanning | — | 50/mo | 80/mo | Unlimited |
| Dashboard | Basic | Full | Full | Full |
| Kilala Kita Onboarding | Yes | Yes | Yes | Yes |
| Daily Check-In | Yes | Yes | Yes | Yes |
| Ang Umaga Mo | Teaser (headline) | Full briefing | Full briefing | Full briefing |
| BIR Deadline Watcher | Basic (1 reminder) | 7/3/1-day sequence | 7/3/1-day sequence | 7/3/1-day sequence |
| Saan Napunta | — | Full | Full | Full |
| Reply Drafter | — | Manual copy-paste | Manual copy-paste | Auto-send |
| Costing Cards | — | Yes | Yes | Yes |
| Invoice Cards | — | Yes | Yes | Yes |
| Weekly Reconciliation | Yes | Yes | Yes | Yes |
| Monthly Reconciliation | — | Yes | Yes | Yes |
| GSheets OAuth Export | — | — | Yes | Yes |
| Multi-Seat (up to 5) | — | — | Yes | Yes |
| Custom Behaviors | — | — (Phase 3: 3) | — (Phase 3: 10) | Unlimited |
| API Integrations | — | — | — | Yes |
| Priority Support | — | — | Yes | Yes |
