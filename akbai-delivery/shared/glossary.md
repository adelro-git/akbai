# AKBai — Glossary
> Used by: all skills
> Last updated: March 2026 | Source: Roadmap v14, Operations Playbook v7, Operations Roadmap v6, Market Research v1.1, Post-Implementation Vision v1
> AKBai-specific terms, Filipino business/tax terms, technical terms, and persona names.

---

## Product Terms

| Term | Definition |
|------|------------|
| **AKBai** | The product. "Katuwang ng Negosyo Mo" (Your Business Partner). Mobile-first PWA for Filipino MSMEs. |
| **Kai** | The AI persona within AKBai. Named after "Katuwang" (partner/collaborator). Kai speaks first, proactively. |
| **Katuwang** | Filipino: "partner" or "collaborator." The core positioning — Kai is a business partner, not a chatbot. |
| **Kilala Kita** | "I Know You" — the 5-step onboarding flow. Sets business type, income range, primary pain. Powers all Kai personalization. Must complete before accessing any feature. |
| **Ang Umaga Mo** | "Your Morning" — the Morning Briefing card. Kai proactively summarizes yesterday's income, today's BIR deadlines, cash position. Pro/Business tier. |
| **Resibo Scanner** | Receipt scanning feature. Camera → Claude Haiku Vision → structured expense card. Cost: ₱0.16/scan. Pro/Business tier exclusive. |
| **Saan Napunta** | "Where Did It Go" — the Expense Dashboard. Categorized spend, monthly trends, cash flow visibility. |
| **Deadline Watcher** | BIR compliance calendar. Deadlines by business type. 7/3/1-day notification sequence (Pro/Business). Free tier gets 1 reminder per filing only. |
| **Invoice Cards** | Create, send, track invoices. PDF export. Pro/Business feature. |
| **Costing Cards** | Ingredient costing, margin calculator for food sellers and bakers. Pro/Business feature. |
| **Reply Drafter** | Kai drafts customer DM replies. Phase 1: manual copy-paste. Phase 2: Meta Messenger API. |
| **Maria Moment** | The target first-value moment: user opens AKBai and sees something true about their business they didn't know before. E.g., "Kumikita ka. ₱18,400 ang net mo this month." |
| **Flag as Wrong** | One-tap action on every AI output card. Sends output + user context to a review log. Hard pre-launch gate — must ship with Phase 1. |
| **Sense Check Gate** | Month 6 Go/No-Go checkpoint based on 8 signals. Gate between Phase 1 and Phase 2. Three outcomes: GREEN (proceed), YELLOW (2–4 weeks more), RED (return to user interviews). |
| **Trust Recovery Pattern** | Pre-designed Kai response pattern for when Kai gets something wrong. Taglish format: acknowledge → take responsibility → explain → offer next step. Design gate. |
| **Circuit Breaker** | Daily Claude API spend cap tracked in Supabase (daily_api_spend table). Hard cap ~$5/day initially. Returns graceful degradation response, not error. |
| **Concierge GCash** | Manual GCash collection fallback for first 20–50 users if Xendit KYC is still pending at launch. |
| **Build 0** | AI Scope Definition & System Prompt Architecture. HARD GATE before Build 1. Defines in-scope/out-of-scope boundaries, financial disclaimer, domain-expandable prompt structure. New in Roadmap v13. |
| **Domain-expandable architecture** | System prompt uses modular scope sections so Phase 4+ domains can be added without rewriting existing prompts. Conversations domain-tagged. Out-of-scope redirects logged. |
| **Custom Behaviors (Phase 3)** | User-taught AI rules via Taglish conversation. E.g., "Every time I receive payment over ₱5,000, remind me to issue an OR." Pro: 3 behaviors, Business: 10, Scale: unlimited. |
| **Daily Check-In** | Evening in-app modal (default 8PM). 60-second habit — captures daily sales + expenses. All tiers. From Ops Roadmap v6. |
| **Weekly Reconciliation** | Every Friday at 9AM. Surfaces missing days from past 7, batch-fill flow. All tiers. |
| **Monthly Reconciliation** | Last day of month. Full summary card: income, expenses, net profit. Shareable to WhatsApp/PDF. |
| **UAT Environment** | User Acceptance Testing with 15-20 invited testers pre-launch. Haiku-only, no payments, no WhatsApp. From Ops Roadmap v6. |

---

## Tier & Pricing Terms

| Term | Definition |
|------|------------|
| **Free Tier** | ₱0/month. 10 queries/day (Haiku only). 1 BIR deadline reminder per filing. Ang Umaga Mo teaser only. No receipt scanning. |
| **Pro Tier** | ₱399/month. 50 scans/month. Sonnet + Haiku. Full feature set. Receipt scanning, full Morning Briefing, full BIR sequence. |
| **Business Tier** | ₱899/month. 80 scans/month. All Pro features + GSheets OAuth + multi-seat (up to 5 team members: Owner, Accountant, Viewer). Phase 2 feature. |
| **Pro Annual** | ₱2,499/year (~48% discount vs monthly ₱4,788). Do NOT actively promote in Phase 1 — collect 3 months retention data first. |
| **Scale Tier** | ₱1,499/month. Phase 3. All Business features + unlimited custom behaviors + API integrations + cross-channel outbound + priority support. |
| **Scan pool** | Shared monthly allowance covering receipt scans + notebook photo uploads. Pro: 50/mo. Business: 80/mo. |
| **Free tier query cap** | 10 AI queries/day for Free users. Resets at midnight. Not advertised — only surfaced when reached. Warm Taglish message shown at limit. |

---

## Filipino Business Terms

| Term | Definition |
|------|------------|
| **MSME** | Micro, Small, and Medium Enterprise. AKBai's target market. 1.1 million digitally-active MSMEs in the Philippines. |
| **BIR** | Bureau of Internal Revenue. The Philippine tax authority. Primary compliance anxiety driver for target users. |
| **BIR COR** | Certificate of Registration from BIR. Required for legal business operation. Specific to a business type. |
| **DTI** | Department of Trade and Industry. Registers sole proprietorships in the Philippines. |
| **SEC** | Securities and Exchange Commission. Registers partnerships and corporations. |
| **NPC** | National Privacy Commission. Enforces RA 10173 (Data Privacy Act). AKBai must register within 20 days of launch. |
| **RA 10173** | Republic Act 10173 — Data Privacy Act of the Philippines. Governs how AKBai handles user PII. |
| **DPO** | Data Protection Officer. Anton serves as initial DPO. Personal liability under RA 10173. Plan for outsourced DPO at scale. |
| **PIA** | Privacy Impact Assessment. NPC-required before launch. Documents what data is collected, why, how processed. |
| **8% flat tax** | Income tax option for self-employed individuals and professionals with gross receipts under ₱3M/year. Popular among freelancers. Ana persona's primary tax method. |
| **Graduated rates** | Standard income tax brackets for sole proprietors/professionals. Applies when gross sales cross ₱3M threshold. AKBai monitors this threshold and recommends CPA consultation. |
| **OR (Official Receipt)** | Oficial Resibo. BIR-registered sequentially-numbered receipt. Required for business transactions. AKBai needs BIR legal sign-off before auto-generating OR numbers. |
| **VAT** | Value Added Tax. 12% on gross receipts exceeding ₱3M/year. Jose persona (Shopee/Lazada seller) primary compliance concern. |
| **GCash** | The dominant mobile wallet in the Philippines. Primary payment method for AKBai subscriptions. Primary income channel for many MSME users. |
| **Maya** | Mobile wallet (formerly PayMaya). Secondary to GCash but common in target market. |
| **Shopee / Lazada** | Major Philippine e-commerce platforms. Jose persona sells primarily here. GCash income reconciliation is a key pain point for online sellers. |
| **Sari-sari store** | A neighborhood convenience store — the archetype of Philippine micro-retail. Andoy persona. |
| **Tindahan** | Filipino: "store." Generic term for a small retail business. |
| **Bodega** | A small warehouse or storage area. Used in context of packing orders in a bodega with intermittent LTE. |

---

## Filipino Language Terms (Taglish Context)

| Term | Usage in AKBai |
|------|---------------|
| **Taglish** | Filipino-English code-switching. Kai's natural voice. Not a stylistic choice — it's how target users actually communicate. |
| **Po** | Filipino honorific (respect marker). Kai uses it naturally — not every sentence, but when appropriate. Always on BIR topics. |
| **Kumikita** | "Earning / profitable." E.g., "Kumikita ka." — Kai's way of saying you're profitable. |
| **Magkano** | "How much." Common in transaction entry prompts. |
| **Kita** | "Earnings / income." Used in Kai financial summaries. |
| **Gastos** | "Expenses." Used in Saan Napunta expense dashboard. |
| **Negosyo** | "Business." Core product vocabulary. |
| **Kababayan** | "Fellow Filipino / compatriot." Kai's relationship with users — like a brilliant kababayan colleague. |
| **Pasensya na** | "I'm sorry / please forgive me." Used in Kai trust recovery responses. |

---

## Technical Terms (AKBai-Specific)

| Term | Definition |
|------|------------|
| **RLS** | Row Level Security. Supabase/Postgres feature. Every AKBai table requires an RLS policy scoped to auth.uid() = user_id. No exceptions. |
| **Soft delete** | Every table has deleted_at TIMESTAMPTZ NULL. Hard deletes are prohibited. Required for NPC compliance (data restoration, audit trails). |
| **Audit columns** | created_at and updated_at on every table. Auto-updated via trigger. |
| **Service role key** | Supabase server-side secret. Never in client-side code. Never in NEXT_PUBLIC_ env vars. Only in API routes and Edge Functions. |
| **Edge Functions** | Supabase Deno runtime. AKBai uses them for webhooks only (Xendit payment events, future WhatsApp). All other logic in Next.js API routes. |
| **User-scoped system prompt** | Claude API calls assembled server-side: (1) Core Kai Persona, (2) User Context (fetched by auth.uid()), (3) Conversation History (per user only), (4) Current Message. Never assembled on client. |
| **Profile versioning** | Business profile increments profile_version on update. Triggers: 10+ transactions, repeated BIR questions, voice usage patterns, revenue crossing a band threshold. |
| **4-Layer data isolation** | RLS (database) + user-scoped system prompt (AI) + conversation isolation (session) + profile versioning (continuous). All four required before production launch. |
| **Feature flags** | Boolean column in Supabase users table. Enables 10% rollouts, beta access tiers, instant kill switches. Must be in place before Phase 1 ships any feature. |
| **daily_api_spend** | Supabase table tracking daily Claude API spend per user/global. Powers the circuit breaker. Hard cap: ~$5/day initial, increases with revenue. |
| **Webhook idempotency** | Xendit webhooks can fire twice on retry. Payment handler must deduplicate by payment_id before processing. Hard gate before Build 4 ships. |
| **Haiku routing** | Free tier users and lightweight tasks (OCR, classification, quick Q&A) routed to claude-haiku-4-5. Cost optimization — Haiku is significantly cheaper than Sonnet. |
| **Sonnet routing** | Pro/Business tier users get claude-sonnet-4-6 for Kai reasoning, morning briefing, reply drafting, and complex analysis. |
| **PWA** | Progressive Web App. AKBai's deployment model. No App Store listing — installed via "Add to Home Screen." next-pwa for offline support. |
| **App Router** | Next.js 14 routing paradigm. Server Components by default. 'use client' only when needed. Feature folders: /app/(features)/[feature-name]/. |

---

## Persona Names

| Name | Type | Age | Primary Pain | Notes |
|------|------|-----|-------------|-------|
| **Maria** | Home baker / food seller | 35–45 | BIR compliance, expense tracking | Primary persona. The "Maria Moment" defines product success. GCash-comfortable, afraid of BIR, manages everything on phone. |
| **Jose** | Online seller (Shopee/Lazada) | 28–35 | GCash income reconciliation, VAT | Digitally native, higher income, VAT-registered complexity. |
| **Ana** | Freelance creative | 25–30 | 8% flat tax, invoice tracking | Professional services, simpler tax but unfamiliar with process. |
| **Andoy** | Sari-sari / micro-retail | 40–55 | Daily cash flow, inventory costing | Traditional retail, lower digital literacy, highest volume of small transactions. |

---

## Phase & Milestone Terms

| Term | Definition |
|------|------------|
| **Phase 0A** | Legal Foundation (Weeks 1–4). Gate: 5 legal items complete. No code before Globe contract clearance. |
| **Phase 0B** | Demand Validation (Weeks 4–10). Gate: 100+ waitlist signups. Brand identity + 5–6 SEO articles + 10 founder interviews. |
| **Phase 0C** | Paid Pilot (referenced in gap registry). 5-user paid pilot to validate willingness to pay before Phase 1 build. |
| **Phase 1** | MVP Build (Months 1–6). Targets: 50 registered users, 20 paying Pro, ₱6K–₱10K MRR. |
| **Phase 2** | Growth (Months 6–12). Targets: 200 users, 80 paying, ₱30K–₱50K MRR. Business tier launch, WhatsApp API, referral loop, churn recovery. |
| **Phase 3** | Agent Builder Platform (Month 12+). Targets: 500+ users, 200 paying, ₱100K–₱200K MRR. Custom behaviors, Scale tier. |
| **Phase 4+** | Domain Expansion (Month 19+). Marketing → Strategy → HR → Inventory. See Post-Implementation Vision v1. |
| **Sense Check Gate** | Month 6 milestone. 8-signal Go/No-Go framework before Phase 2. See project-context.md §6. |
| **Sprint** | 2-week work block. Anton's capacity: 10–15 hours per sprint. |
| **Build 0** | AI Scope Definition & System Prompt Architecture. HARD GATE. Defines scope boundaries, disclaimer, domain-expandable design. New in v13. |
| **Build 1–8** | Feature builds within Phase 1. Build 1: Kilala Kita. Build 2: Dashboard. Builds 3–5: Core features. Build 6–8: Payments, Polish. |
| **OPS Build 0–5B** | Operations infrastructure builds. OPS 0: Monitoring. OPS 1: Billing. OPS 2: Admin. OPS 3: Support. OPS 4: BIR Calendar. OPS 5: Data Ingestion. OPS 5B: GSheets OAuth. |
