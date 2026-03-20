# AKBai — NPC Compliance Reference (RA 10173)
> Privacy-by-design checklist, data classification, retention, deletion, and breach protocol.
> Last updated: March 2026 | Source: Roadmap v13, RA 10173 (Data Privacy Act of 2012), NPC Circulars

---

## Table of Contents

1. [Overview: RA 10173 and AKBai](#1-overview)
2. [Data Classification Matrix](#2-data-classification-matrix)
3. [Privacy-by-Design Checklist](#3-privacy-by-design-checklist)
4. [Consent and Transparency](#4-consent-and-transparency)
5. [Data Subject Rights](#5-data-subject-rights)
6. [Retention Policy](#6-retention-policy)
7. [Deletion and Purge Protocol](#7-deletion-and-purge-protocol)
8. [Breach Notification Protocol](#8-breach-notification-protocol)
9. [DPO Responsibilities](#9-dpo-responsibilities)
10. [NPC Registration Checklist](#10-npc-registration-checklist)
11. [Technical Controls Summary](#11-technical-controls-summary)

---

## 1. Overview

**RA 10173** (Data Privacy Act of 2012) is the Philippine law governing personal data processing. It applies to AKBai because the app collects, stores, and processes personal information of Filipino data subjects (MSME owners).

**Why this matters for AKBai specifically:**
- AKBai handles **financial data** (transactions, receipts, invoices) — classified as sensitive by business context even if not "sensitive personal information" under RA 10173's strict definition.
- AKBai processes **tax identification numbers** (BIR TIN) — directly linked to individual identity.
- AKBai uses **AI (Claude)** to process user data — adds a data processing layer that requires transparency.
- AKBai is a **solo-founder operation** — the DPO is also the developer, the support team, and the CEO. Compliance must be practical, not theoretical.

**Key NPC obligations:**
- Register with the NPC within 20 days of commencing data processing
- Designate a Data Protection Officer (DPO)
- Conduct a Privacy Impact Assessment (PIA)
- Publish a Privacy Policy and obtain informed consent
- Implement reasonable security measures
- Report breaches within 72 hours
- Honor data subject rights (access, correction, erasure)

---

## 2. Data Classification Matrix

Every column in the AKBai database is classified into one of three categories. This classification determines encryption requirements, access logging, retention periods, and breach notification scope.

### PII (Personal Identifiable Information)

| Table | Column | Why PII |
|-------|--------|---------|
| users | first_name | Directly identifies person |
| users | email | Directly identifies person |
| users | phone | Directly identifies person |
| businesses | business_name | May contain personal name (sole proprietor) |
| businesses | bir_tin | Tax ID — directly linked to identity |
| businesses | address, city, province | Location data |
| invoices | client_name | Third-party PII |
| invoices | client_email | Third-party PII |
| invoices | client_phone | Third-party PII |
| ka_conversations | content (user messages) | May contain PII shared in conversation |

**PII rules:**
- Encrypted at rest (Supabase default AES-256)
- Access logged in audit_log
- Subject to deletion requests (7-day purge window)
- Never included in analytics events
- Never sent to third parties without explicit consent
- Never logged in plaintext in application logs (Sentry, PostHog)

### Financial Data

| Table | Column | Classification |
|-------|--------|---------------|
| transactions | amount, type, category | Financial |
| receipts | items, subtotal, tax_amount, total_amount | Financial |
| invoices | items, subtotal, tax_amount, total_amount | Financial |
| daily_entries | total_sales, total_expenses | Financial |
| subscriptions | tier, xendit_subscription_id | Financial |

**Financial data rules:**
- Encrypted at rest (Supabase default)
- RLS scoped to user_id — no cross-user access possible
- Never exposed in analytics in identifiable form
- Retained for BIR compliance minimum (10 years for tax records — but AKBai is not a BIR-authorized system, so the user's actual tax records are with their CPA/BIR)
- AKBai retention: same as PII (deleted on account deletion + 7 days)

### Analytics / System Data

| Table | Column | Classification |
|-------|--------|---------------|
| ka_conversations | model_used, input_tokens, output_tokens | Analytics |
| daily_api_spend | all columns | System |
| webhook_events | all columns | System |
| redirect_logs | query_text, detected_domain | Analytics |
| audit_log | action, resource_type (but NOT actor details post-deletion) | Compliance |

**Analytics rules:**
- Anonymized where possible (no user_id in aggregate analytics)
- PostHog events must not contain PII
- System tables are service-role only
- Audit log is retained indefinitely (anonymized after user deletion)

---

## 3. Privacy-by-Design Checklist

These controls are built into AKBai's architecture from the start — not bolted on later.

### Database Layer
- [ ] RLS enabled on every table with user_id scoping
- [ ] Soft-delete on all user-facing tables (deleted_at column)
- [ ] Audit columns on all tables (created_at, updated_at)
- [ ] No table without a documented data classification
- [ ] Service role key restricted to server-side code only
- [ ] Supabase Storage RLS mirrors database RLS (user_id prefix)

### Application Layer
- [ ] All Claude API calls server-side only
- [ ] No PII in URL parameters or query strings
- [ ] No PII in browser console logs (production)
- [ ] No PII in Sentry error reports (scrub before sending)
- [ ] No PII in PostHog analytics events
- [ ] User-facing error messages in Taglish, never exposing system internals
- [ ] Session expiry with graceful re-authentication (gap D6)

### AI Layer
- [ ] Claude system prompt includes data handling instructions
- [ ] User data sent to Claude is scoped to the authenticated user only
- [ ] Claude responses are validated (Zod) before storage
- [ ] Conversation history is user-isolated (no cross-user context leakage)
- [ ] AI-generated outputs carry disclaimer ("Ito ay gabay lamang...")

### Consent Layer
- [ ] Explicit consent checkbox before any data collection (Kilala Kita step 1)
- [ ] Privacy Policy link accessible from every screen (footer)
- [ ] Terms of Service acceptance logged with timestamp
- [ ] Receipt scanning consent (camera permission + data processing)
- [ ] BIR data processing consent (specific opt-in during onboarding)

### Operational Layer
- [ ] Data backup enabled (Supabase PITR on paid plan)
- [ ] Tested restore procedure documented
- [ ] Incident response runbook written (gap D7)
- [ ] DPO designated (Anton initially)
- [ ] NPC registration completed within 20 days of launch

---

## 4. Consent and Transparency

### What Users Must Know Before Data Collection

The Privacy Policy must clearly state, in Taglish:

1. **What data is collected** — name, email, phone, business details, BIR TIN, transactions, receipts, chat history
2. **Why it's collected** — to provide AI-powered business management, BIR deadline tracking, financial insights
3. **How it's processed** — stored in Supabase (cloud database), processed by Claude AI (Anthropic) for insights and OCR
4. **Who has access** — only the user (via RLS), Anton as DPO/admin for support, Anthropic (as AI processor, per their data policy)
5. **How long it's kept** — as long as the account is active, plus 7 days after deletion request
6. **How to delete it** — Settings → Delete Account, 7-day recovery window, then permanent purge
7. **Rights under RA 10173** — access, correction, erasure, objection, data portability

### Consent Points in the User Journey

| Moment | Consent Collected | Method |
|--------|------------------|--------|
| Signup | Privacy Policy + ToS acceptance | Checkbox + timestamp |
| Kilala Kita Step 1 | Data processing consent | Explicit opt-in |
| BIR TIN entry | Tax data processing consent | Specific opt-in with explanation |
| First receipt scan | Camera + AI processing consent | Permission prompt + explanation |
| Push notifications | Notification consent | Browser permission prompt |

### Third-Party Data Processors

AKBai shares data with these processors. Each must be disclosed in the Privacy Policy:

| Processor | Data Shared | Purpose |
|-----------|------------|---------|
| Supabase (AWS) | All database data | Database hosting, auth, storage |
| Anthropic (Claude) | User messages, receipt images, business context | AI processing, OCR |
| Xendit | Payment method, subscription details | Payment processing |
| Sentry | Error reports (PII-scrubbed) | Error monitoring |
| PostHog | Usage events (anonymized) | Product analytics |
| Cloudflare | Request metadata | CDN, DDoS protection |

---

## 5. Data Subject Rights

RA 10173 grants these rights. AKBai must have technical capability to fulfill each one.

### Right to Access
**What:** User can request a copy of all personal data AKBai holds about them.
**Implementation:** Settings → "Download My Data" → generates a JSON/CSV export of all user-owned tables.
**Timeline:** Must respond within 10 days (NPC guidance).
**Technical:** Query all user-owned tables WHERE user_id = auth.uid(), package as downloadable file.

### Right to Correction
**What:** User can correct inaccurate personal data.
**Implementation:** Settings → Edit Profile. For transaction corrections: edit individual records in Saan Napunta.
**Technical:** Standard UPDATE operations through RLS-protected endpoints.

### Right to Erasure
**What:** User can request deletion of all personal data.
**Implementation:** Settings → Delete Account → 7-day soft-delete → permanent purge.
**Technical:** See data-flows.md §9 (Data Deletion Flow) for full protocol.
**Exceptions:** Audit log entries are anonymized (actor_id set to NULL), not deleted.

### Right to Object
**What:** User can object to specific processing activities.
**Implementation:** Phase 1: users can disable specific features (receipt scanning, morning briefing) via Settings.
**Technical:** Feature flags in users.feature_flags JSONB.

### Right to Data Portability
**What:** User can receive their data in a structured, machine-readable format.
**Implementation:** Same as Right to Access — JSON/CSV export.
**Technical:** Standard data export endpoint, same as access request.

---

## 6. Retention Policy

| Data Category | Retention Period | Basis |
|---|---|---|
| Active user PII | Account lifetime | Consent (active service) |
| Active user financial data | Account lifetime | Consent + legitimate interest (service provision) |
| Deleted user data (soft-delete) | 7 days post-deletion request | Recovery window |
| Deleted user data (post-purge) | Permanently erased | Right to erasure fulfilled |
| Audit log entries | Indefinite (anonymized post-deletion) | Legitimate interest (compliance, security) |
| Analytics data | 2 years (anonymized) | Legitimate interest (product improvement) |
| Webhook events | 1 year | Legitimate interest (debugging, reconciliation) |
| Redirect logs | 1 year (anonymized) | Legitimate interest (product roadmap) |
| Conversation history | Account lifetime (deleted with account) | Consent |

### Retention Enforcement

A monthly cron job handles automated retention:

```
Monthly retention cron (1st of month, 3AM PHT)
  │
  ├─ Purge users past 7-day window:
  │    Hard-delete all data for users WHERE deleted_at < (now() - interval '7 days')
  │
  ├─ Clean old webhook events:
  │    DELETE FROM webhook_events WHERE created_at < (now() - interval '1 year')
  │
  ├─ Anonymize old redirect logs:
  │    UPDATE redirect_logs SET user_id = NULL
  │    WHERE created_at < (now() - interval '1 year') AND user_id IS NOT NULL
  │
  └─ Log retention actions to audit_log
```

---

## 7. Deletion and Purge Protocol

See `data-flows.md` §9 for the full technical flow. Key compliance points:

1. **Immediate soft-delete** on user request — all user data becomes invisible via RLS (deleted_at IS NOT NULL).
2. **7-day recovery window** — user can undo by logging in. This is a user-friendly measure, not an NPC requirement.
3. **Permanent purge after 7 days** — hard-delete from all tables, remove files from Storage, delete Auth user.
4. **Audit log anonymization** — actor_id and ip_address set to NULL. The log entry itself is retained (what happened, when, what resource type) but de-identified.
5. **Confirmation to user** — email notification when purge is complete: "Ang data mo ay na-delete na permanently."

### What's NOT Deleted

- Anonymized audit log entries (compliance requirement)
- Anonymized aggregate analytics already sent to PostHog
- Xendit payment records (Xendit retains these per their policy — AKBai removes the link)

---

## 8. Breach Notification Protocol

RA 10173 requires notification to NPC within 72 hours if a breach involves sensitive personal information or is likely to cause damage.

### Breach Response Timeline

```
Hour 0: Breach detected or suspected
  │
  ├─ IMMEDIATE (within 1 hour):
  │    ├─ Contain the breach (revoke compromised keys, disable affected endpoints)
  │    ├─ Document what happened (timestamp, scope, affected tables)
  │    ├─ Assess: which data categories affected? (PII? Financial? Both?)
  │    └─ Determine number of affected users
  │
  ├─ Hours 1-24: Assessment
  │    ├─ Root cause analysis
  │    ├─ Determine if NPC notification required:
  │    │    Required if: PII or sensitive data involved AND ≥ 100 affected individuals
  │    │    OR: real risk of serious harm regardless of number
  │    ├─ Draft NPC notification (see template below)
  │    ├─ Draft affected user notification
  │    └─ Implement fix for the vulnerability
  │
  ├─ Hours 24-48: Notification preparation
  │    ├─ Finalize NPC notification
  │    ├─ Prepare user communications (Taglish, warm but transparent)
  │    └─ Test the fix
  │
  └─ Hour 72 (HARD DEADLINE): Submit to NPC
       ├─ File NPC Breach Notification Form
       ├─ Notify affected users (email + in-app)
       └─ Document everything in incident log
```

### NPC Breach Notification Contents

The NPC notification must include:
1. Nature of the breach (what happened)
2. Personal data involved (which data categories)
3. Number of affected data subjects
4. Likely consequences
5. Measures taken to address the breach
6. Measures taken to mitigate harm
7. Contact information of DPO

### User Breach Notification Template (Taglish)

```
Subject: Mahalagang Paalala Tungkol sa Iyong AKBai Account

Hi [first_name],

Gusto naming ipaalam sa iyo na may napansin kaming security incident
na posibleng nakaapekto sa ilan sa datos mo sa AKBai.

Ano ang nangyari: [brief description]
Anong data ang affected: [list affected data types]
Ano ang ginawa namin: [remediation steps]

Para sa karagdagang proteksyon, inirerekomenda namin na:
- [action items for the user]

Kung may tanong ka, i-contact mo kami sa [support email].

Pasensya na po sa abala, at thank you sa tiwala mo sa AKBai.

— Anton, DPO
AKBai
```

### Solo-Founder Breach Response Reality

Anton is the entire incident response team. Practical considerations:

- **Detection:** Sentry alerts + UptimeRobot + PostHog anomaly detection are the early warning system. Set up aggressive alerts.
- **During work hours (Globe):** The breach competes with day job. The 72-hour NPC window is tight. Pre-drafted templates and a documented runbook (gap D7) are essential.
- **Weekend detection:** Better — Anton has more availability. But still need phone alerts, not just email.
- **Legal support:** Engage a PH tech lawyer before launch (Phase 0A) who can be called during a breach. Don't try to handle NPC notification alone.

---

## 9. DPO Responsibilities

**Designated DPO:** Anton del Rosario (initial)
**Personal liability:** Yes — RA 10173 Section 36 imposes personal liability on the DPO for negligent data handling.

### DPO Duties

1. Monitor compliance with RA 10173 and NPC issuances
2. Serve as contact point for NPC and data subjects
3. Conduct or oversee Privacy Impact Assessments
4. Advise on data protection obligations
5. Manage data subject requests (access, correction, erasure)
6. Oversee breach response
7. Maintain records of processing activities

### Practical DPO Tasks (Solo Founder)

| Task | Frequency | Time Estimate |
|------|-----------|---------------|
| Review audit logs for anomalies | Weekly | 15 min |
| Process data subject requests | As needed | 30 min each |
| Update Privacy Policy (if processing changes) | Per feature launch | 1 hour |
| NPC registration maintenance | Annual | 2 hours |
| Privacy Impact Assessment updates | Per major feature | 2-3 hours |
| Breach response | As needed (hopefully never) | 8-40 hours |

### Phase 2 DPO Consideration

When AKBai reaches 200+ users, consider:
- Outsourced DPO service (₱5,000-₱15,000/month for a virtual DPO)
- This reduces personal liability and provides expert guidance
- Budget this into Phase 2 operational costs

---

## 10. NPC Registration Checklist

Must be completed within 20 days of processing personal data (i.e., before or immediately at launch).

- [ ] Create NPC Online account (privacy.gov.ph)
- [ ] Complete Registration Form for Personal Information Controllers (PICs)
- [ ] Designate DPO (Anton del Rosario initially)
- [ ] Submit organizational details (business registration, DTI/SEC)
- [ ] Declare data processing systems:
  - System 1: User Accounts (PII: name, email, phone, business details)
  - System 2: Financial Records (transactions, receipts, invoices)
  - System 3: AI Processing (Claude API — third-party processor)
  - System 4: Payment Processing (Xendit — third-party processor)
- [ ] Declare third-party processors (Supabase, Anthropic, Xendit, Sentry, PostHog, Cloudflare)
- [ ] Submit Privacy Policy URL
- [ ] Submit Privacy Impact Assessment summary
- [ ] Pay registration fee (if applicable)
- [ ] Receive NPC Certificate of Registration
- [ ] Display NPC registration seal in app (required)

---

## 11. Technical Controls Summary

Quick reference for implementing NPC compliance in the Supabase schema:

| Control | Implementation | Table/Feature |
|---------|---------------|---------------|
| Encryption at rest | Supabase default (AES-256) | All tables |
| Access control | RLS policies (user_id scoped) | All user tables |
| Audit trail | audit_log table (append-only) | Cross-table |
| Soft-delete | deleted_at column | All user tables |
| Data minimization | Only collect what's needed per feature | Schema design |
| Consent tracking | Timestamp + version on consent events | users table + consent_events |
| Right to access | Data export endpoint (JSON/CSV) | API route |
| Right to erasure | Soft-delete → 7-day purge → hard-delete | Deletion flow |
| Breach detection | Sentry + UptimeRobot + PostHog | Monitoring stack |
| DPO contact | In-app footer + Privacy Policy | UI |
| Third-party oversight | Data processing agreements with all processors | Legal/contracts |
| PII scrubbing | Sentry beforeSend hook, PostHog sanitizer | Application config |
| Anonymization | audit_log actor_id nulled post-deletion | Purge cron |

### Missing Controls (To Build)

These are identified but not yet implemented:

- [ ] `consent_events` table — track individual consent actions with timestamps and versions
- [ ] Data export endpoint — for Right to Access / Data Portability
- [ ] PII scrubbing in Sentry `beforeSend` hook
- [ ] PostHog event sanitizer (strip PII before sending)
- [ ] Monthly retention cron job
- [ ] 7-day purge cron job
- [ ] NPC registration seal in app UI
