# NPC RA 10173 — Data Classification Matrix (AKBai)
> Used by: security-compliance skill. Companion to `npc-checklist.md` §10.
> Last updated: 2026-05-29 (Sprint 18 — Pre-Launch legal drafts)
> Source: RA 10173 (Data Privacy Act of 2012), NPC Circulars 2016-01..05, project-context.md §9, gap-registry.md A2 + D11

---

## ⚠️ DRAFT — NOT LEGAL ADVICE
This classification matrix supports the Privacy Policy and PIA drafts. It requires
review & sign-off by a licensed Philippine attorney before AKBai relies on it for
NPC RA 10173 compliance (Gap A2: "Engage a PH tech lawyer — do not self-draft").
Retention periods and legal-basis assignments marked **[CONFIRM]** are provisional.

---

## How to read this matrix

- **Sensitivity** uses RA 10173's tiers: **Sensitive Personal Information (SPI)** —
  highest protection; **Personal Information (PI)** — standard; **Non-personal /
  pseudonymous** — anonymized or keyed to a non-identifying token.
- Under RA 10173, **financial information is treated as sensitive personal
  information** in the Philippine context, which is why AKBai's transaction,
  receipt, and BIR data sit in the SPI tier.
- **Legal basis** options: Consent (§12/§13), Contract performance, Legitimate
  interest. SPI generally requires **consent** unless another §13 ground applies.
- **Processor** = where the data physically lives / who else touches it (see
  npc-checklist.md §5 for the DPA tracker).

---

## 1. Data Classification Matrix

| # | Data category | Examples | Sensitivity (RA 10173) | Purpose | Legal basis | Processor(s) / location | Retention **[CONFIRM]** |
|---|---------------|----------|------------------------|---------|-------------|--------------------------|--------------------------|
| C1 | **Identity** | Email, display name | PI | Account creation, magic-link/OTP sign-in | Consent + Contract | Supabase Auth + `users` (off-PH) | Active + 1 yr post-churn, then purge |
| C2 | **Contact** | Email (for reminders), push token | PI | BIR/payment reminders, transactional email, push notifications | Consent + Contract | Supabase, email provider (Resend), FCM/APNs token in `push_subscriptions` | Active + 1 yr post-churn; push token deleted on opt-out / sign-out |
| C3 | **Business profile** | Business name, type, income range | PI (income range borderline-SPI **[CONFIRM]**) | Personalise Kai, surface correct BIR deadlines | Consent | Supabase `business_profiles` (off-PH) | Active + 1 yr post-churn |
| C4 | **Business financials** | Daily sales, expenses, amounts (centavos), categories, invoices, costing | **SPI** (financial info) | Cash-flow summaries, trends, reports, invoicing | Consent + Contract | Supabase `transactions`, `daily_check_in`, invoice/costing tables (off-PH) | Active + 1 yr post-churn (BIR record norms may favour longer) **[CONFIRM]** |
| C5 | **Receipt images & OCR text** | Photos of receipts, extracted text | **SPI** (financial info; images may contain incidental PII of third parties) | Convert receipts → structured expenses | Consent | Supabase Storage + `receipts`; OCR text sent to **Anthropic** for parsing | Active + 1 yr post-churn **[CONFIRM]** |
| C6 | **BIR information** | Tax type, registration status, deadlines | **SPI** (financial/tax info) | BIR deadline calendar + reminders | Consent | Supabase `business_profiles` / `bir_deadlines` (off-PH) | Active + 1 yr post-churn **[CONFIRM — possibly longer for tax records]** |
| C7 | **Chat content (Kai)** | Messages exchanged with the AI | PI / potentially SPI (user may type financial detail) | Generate replies, briefings, continuity | Consent + Contract | Supabase `ka_conversations`; message text sent to **Anthropic (Claude API)** | Active + 90 days post-churn, then purge |
| C8 | **Device & usage** | Feature usage, session data, device type, crash traces | Non-personal / pseudonymous (scrub PII) | Stability, product improvement, abuse prevention | Legitimate interest | **PostHog** (analytics), **Sentry** (crash) | Per processor defaults; PII scrubbed pre-send **[CONFIRM retention windows]** |
| C9 | **Payment / subscription** | Tier, entitlement status, store transaction id | PI (status only — NOT card data) | Unlock paid features, billing reconciliation | Contract | Supabase `subscriptions` + `revenuecat_events`; **RevenueCat + Apple/Google** (card data never reaches AKBai) | Active + 1 yr post-churn; store-side per Apple/Google/RevenueCat policy |

**Notes**
- **C9 — no card numbers:** AKBai never stores payment-method numbers. Apple
  App Store, Google Play, and RevenueCat handle the actual payment instrument.
  Only a **pseudonymous app_user_id** (= `users.id::text`) is shared with
  RevenueCat — no name, email, or phone. This is a key NPC data-minimisation win.
- **Cross-border transfer:** C1–C7 and C9 involve processors that store data
  **outside the Philippines** (Supabase, Anthropic, RevenueCat, Sentry, PostHog).
  RA 10173 requires adequate protection or consent for cross-border transfer —
  document the legal basis per transfer in the PIA and disclose in the Privacy
  Policy (§5). **[CONFIRM Supabase data region at sign-off.]**
- **Anthropic training:** C5 + C7 are sent to Anthropic. Privacy Policy relies on
  Anthropic's commitment not to train on API customer data — **[verify current
  Anthropic API data-use terms at sign-off.]**
- **Soft-delete invariant:** every table carries `deleted_at`. Deletion =
  soft-delete now → hard purge within 7 days (RA 10173 erasure right). Processor
  deletion (Anthropic, Sentry, PostHog, RevenueCat) must also be requested.

---

## 2. Compliance gaps before launch (checklist)

Blocking items (HARD GATES — no user data collection until done):

- [ ] **A2** — Privacy Policy + Terms of Service reviewed & signed off by a PH
      tech lawyer (drafts at `frontend/src/app/(legal)/privacy` + `/terms`).
- [ ] **NPC registration** filed (AKBai processes SPI → registration required).
- [ ] **DPO** (Anton) designated and registered with NPC; contact published in
      the Privacy Policy.
- [ ] **PIA** completed before processing begins — map every C1–C9 flow.
- [ ] **Consent mechanism** live: explicit opt-in checkbox + stored timestamp +
      policy version at onboarding (npc-checklist.md item 1.5).
- [ ] **DPAs executed** with all C-row processors: Supabase, Anthropic,
      RevenueCat, Apple, Google, Sentry, PostHog, email provider.

Configuration / engineering items:

- [ ] **D11 — retention enforcement**: confirm exact periods per C-row with
      counsel, then implement the monthly purge cron (currently provisional:
      financials 1 yr / chat 90 days post-churn).
- [ ] **Sentry PII scrubbing** verified on (C8) error payloads.
- [ ] **PostHog** event properties audited — no PI in (C8) analytics events.
- [ ] **Data-subject-rights tooling**: data export (access + portability) and the
      7-day deletion flow; `unregisterNativePush()` is currently a Sprint 19 stub
      (C2 push-token erasure gap — tracked in Sprint 16 DRIFT-6).
- [ ] **Cross-border transfer basis** documented per processor; confirm Supabase
      data region.
- [ ] **Breach notification** capability ready (72-hour NPC window).

Open questions for Anton + counsel:

- Exact retention period for **financial/BIR records (C4/C5/C6)** — does BIR
  record-keeping practice argue for longer than 1 year?
- Is **income range (C3)** SPI or PI in NPC's view?
- Registered **entity name** (DTI/SEC) and **NPC registration number** for the
  Privacy Policy footer.
- Confirmed **DPO + privacy contact email** addresses.
- Whether a **cookie-consent banner** is required for the web build.
