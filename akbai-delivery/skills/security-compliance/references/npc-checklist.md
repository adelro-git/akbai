# NPC Compliance Checklist — AKBai
> Used by: security-compliance skill
> Last updated: March 2026 | Source: RA 10173, NPC Circular 2016-01 through 2016-05, Roadmap v14 §9
> Status legend: ⬜ NOT STARTED | 🔲 IN PROGRESS | ✅ COMPLETE

---

## Table of Contents
1. [Pre-Launch Hard Gates](#1-pre-launch-hard-gates)
2. [Registration & Documentation](#2-registration--documentation)
3. [Data Protection Officer](#3-data-protection-officer)
4. [Privacy Impact Assessment](#4-privacy-impact-assessment)
5. [Data Processing Agreements](#5-data-processing-agreements)
6. [User-Facing Policies](#6-user-facing-policies)
7. [Breach Notification Protocol](#7-breach-notification-protocol)
8. [Ongoing Compliance](#8-ongoing-compliance)
9. [Data Subject Rights](#9-data-subject-rights)
10. [Data Classification](#10-data-classification)

---

## 1. Pre-Launch Hard Gates

These items block launch. No user data may be collected until all are complete.

| # | Item | Status | Deadline | Owner | Notes |
|---|------|--------|----------|-------|-------|
| 1.1 | NPC Registration filed | ⬜ | Phase 0A Week 3 | Anton | File via NPC online portal. Required within 20 days of commencing data processing. |
| 1.2 | DPO designated and registered with NPC | ⬜ | Phase 0A Week 3 | Anton | Anton as initial DPO. Register via NPC DPO registration form. |
| 1.3 | Privacy Policy published | ⬜ | Phase 0A Week 4 | PH Tech Lawyer | Gap A2. Do NOT self-draft. Budget ₱15K–₱30K. Must include all RA 10173 required disclosures. |
| 1.4 | Terms of Service published | ⬜ | Phase 0A Week 4 | PH Tech Lawyer | Same engagement as Privacy Policy. Must cover BIR disclaimer, liability limitations. |
| 1.5 | Consent mechanism live (checkbox + timestamp) | ⬜ | Build 1 (Kilala Kita) | Fullstack Engineer | Explicit opt-in checkbox during onboarding. Store consent timestamp + version in `user_consents` table. |
| 1.6 | Privacy Impact Assessment complete | ⬜ | Phase 0A Week 4 | Anton + Lawyer | Required before any personal data processing begins. |

---

## 2. Registration & Documentation

### NPC Registration (NPC Circular 2016-03)
- **Who must register:** Personal information controllers (PICs) and personal information processors (PIPs) that process personal data of at least 1,000 individuals, or process sensitive personal information (which includes financial data)
- **AKBai qualifies** because it processes financial data (sensitive personal information under RA 10173)
- **Filing:** Online via NPC Registration System (https://privacy.gov.ph)
- **Timeline:** Must register within 20 days of commencing operations or processing
- **Renewal:** Annual — set a calendar reminder for re-registration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Create NPC account | ⬜ | Use official AKBai business email |
| 2.2 | Prepare registration form (NPC Form PIC-01) | ⬜ | Requires: business registration, DPO details, data processing description |
| 2.3 | Submit registration | ⬜ | Online submission. Keep confirmation receipt. |
| 2.4 | Receive NPC Registration Number | ⬜ | Display in Privacy Policy footer |
| 2.5 | Set annual renewal reminder | ⬜ | Calendar: re-register annually |

---

## 3. Data Protection Officer

### DPO Designation (NPC Circular 2016-01)

RA 10173 requires a designated DPO for organizations processing sensitive personal information. The DPO has personal liability under the law.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Designate Anton as initial DPO | ⬜ | Solo founder constraint. Personal liability acknowledged. |
| 3.2 | Register DPO with NPC | ⬜ | Submit via NPC DPO registration form. Include contact details. |
| 3.3 | Publish DPO contact in Privacy Policy | ⬜ | Required: DPO name, email, contact method. |
| 3.4 | Plan DPO outsourcing at scale | ⬜ | Budget ₱5K–₱10K/month. Trigger: when user count exceeds 200 or at Phase 2. |
| 3.5 | DPO training/certification | ⬜ | NPC offers free online training modules. Complete before launch. |

### DPO Responsibilities
- Monitor compliance with RA 10173 and NPC issuances
- Advise on privacy impact assessments
- Serve as contact point for NPC and data subjects
- Manage breach notification process
- Maintain Records of Processing Activities (ROPA)

---

## 4. Privacy Impact Assessment

### PIA Requirements (NPC Circular 2017-01)

A PIA documents what personal data AKBai collects, why, how it's processed, who has access, and what risks exist. It must be completed before processing begins.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Map all data flows (collection → storage → processing → deletion) | ⬜ | Include: onboarding, receipt scanning, KA conversations, BIR tracking |
| 4.2 | Identify all personal data collected | ⬜ | See §10 Data Classification below |
| 4.3 | Document lawful basis for each processing activity | ⬜ | Primarily: consent + contract performance |
| 4.4 | Assess risks to data subjects | ⬜ | Financial data exposure, identity theft, tax information leak |
| 4.5 | Document security measures | ⬜ | Reference security-architecture.md |
| 4.6 | Document data sharing with third parties | ⬜ | Supabase, Anthropic, Xendit, Cloudflare, Resend |
| 4.7 | Draft PIA report | ⬜ | Use NPC PIA template if available. Engage lawyer for review. |
| 4.8 | Submit PIA to NPC (if required) | ⬜ | NPC may require submission for certain processing activities. Confirm with lawyer. |

---

## 5. Data Processing Agreements

### DPA Requirements (NPC Circular 2016-02)

AKBai uses third-party processors for data storage, AI processing, payments, and email. Each requires a Data Processing Agreement.

| # | Processor | Service | Status | Notes |
|---|-----------|---------|--------|-------|
| 5.1 | Supabase | Database, Auth, Storage | ⬜ | Review Supabase DPA. Verify data center location (ensure adequate protection for cross-border transfer). |
| 5.2 | Anthropic | AI processing (Claude API) | ⬜ | Receipt text + user queries sent to Claude. Review Anthropic's data usage policy — confirm no training on user data. |
| 5.3 | Xendit | Payment processing | ⬜ | Payment data handled by Xendit. Review their DPA and PCI DSS compliance. |
| 5.4 | Cloudflare | CDN, deployment, DNS | ⬜ | Request metadata may transit Cloudflare edge nodes. Review Cloudflare DPA. |
| 5.5 | Resend | Transactional email | ⬜ | Email addresses + names shared for delivery. Review Resend DPA. |
| 5.6 | Sentry | Error monitoring | ⬜ | May capture PII in error payloads. Configure Sentry to scrub sensitive data before sending. |
| 5.7 | PostHog | Analytics | ⬜ | Anonymize where possible. Review PostHog's self-hosted vs cloud DPA. |

### Cross-Border Transfer Considerations
RA 10173 restricts cross-border transfer of personal data unless the receiving country has adequate data protection, or the data subject consents. Most of AKBai's processors (Supabase, Anthropic, Cloudflare) store data outside the Philippines. Document the legal basis for each transfer in the PIA.

---

## 6. User-Facing Policies

### Privacy Policy Requirements (RA 10173 §16)

The Privacy Policy must disclose:

| # | Required Disclosure | Status | Notes |
|---|---------------------|--------|-------|
| 6.1 | Identity and contact details of PIC (AKBai) | ⬜ | |
| 6.2 | DPO contact information | ⬜ | |
| 6.3 | Types of personal data collected | ⬜ | PII, financial, business data — see §10 |
| 6.4 | Purpose of each processing activity | ⬜ | Onboarding, receipt scanning, BIR tracking, AI conversations, billing |
| 6.5 | Lawful basis for processing | ⬜ | Consent, contract performance, legitimate interest |
| 6.6 | Third parties data is shared with | ⬜ | List all processors from §5 |
| 6.7 | Data retention periods | ⬜ | Active: while subscribed. Churned: 1 year, then purge. Gap D11. |
| 6.8 | Data subject rights (access, correction, deletion, portability) | ⬜ | |
| 6.9 | How to exercise rights (contact method, expected response time) | ⬜ | 7-day deletion window |
| 6.10 | Automated decision-making disclosure | ⬜ | AI-generated insights, receipt classification |
| 6.11 | Cross-border transfer disclosure | ⬜ | |
| 6.12 | Cookie/tracking disclosure | ⬜ | PostHog, any analytics |
| 6.13 | Policy update notification mechanism | ⬜ | Email notification for material changes |

### Terms of Service Key Provisions
- BIR disclaimer (see bir-compliance.md)
- Limitation of liability for AI-generated outputs
- User responsibility for tax filing
- Acceptable use policy
- Subscription terms (auto-renewal, cancellation)
- Intellectual property (user owns their data)

---

## 7. Breach Notification Protocol

### 72-Hour Window (RA 10173 §20(f), NPC Circular 2016-04)

AKBai must notify NPC and affected data subjects within 72 hours of discovering a personal data breach that is likely to result in serious harm.

| # | Action | Timeline | Owner | Status |
|---|--------|----------|-------|--------|
| 7.1 | Breach detection mechanism | Pre-launch | DevOps | ⬜ Sentry alerts, Supabase audit logs, UptimeRobot |
| 7.2 | Breach assessment template | Pre-launch | DPO (Anton) | ⬜ Severity, scope, data types, affected users |
| 7.3 | NPC notification template | Pre-launch | Lawyer | ⬜ Use NPC prescribed form |
| 7.4 | User notification template (Taglish) | Pre-launch | Anton | ⬜ Plain language, what happened, what we're doing, what they should do |
| 7.5 | Incident response runbook | Pre-launch | Anton | ⬜ Gap D7. Detect → contain → assess → notify → remediate → post-mortem |
| 7.6 | Breach log (maintained even if no breach occurs) | Ongoing | DPO | ⬜ Required for annual compliance report |

### Breach Notification Workflow
```
Detection (Sentry/logs/user report)
  → Hour 0: Contain the breach (revoke access, patch vulnerability)
  → Hour 0-6: Assess scope (which users, what data, how accessed)
  → Hour 6-24: Draft NPC notification + user notification
  → Hour 24-48: Legal review of notifications
  → Hour 48-72: Submit to NPC + notify affected users
  → Day 3+: Remediation + post-mortem
```

---

## 8. Ongoing Compliance

These are not one-time tasks — they recur on a schedule.

| # | Task | Frequency | Next Due | Status |
|---|------|-----------|----------|--------|
| 8.1 | Annual NPC compliance report | Yearly | 1 year post-launch | ⬜ |
| 8.2 | NPC registration renewal | Yearly | 1 year post-registration | ⬜ |
| 8.3 | Review and update Privacy Policy | Annually or on material change | Launch + 12 months | ⬜ |
| 8.4 | Review and update PIA | Annually or on new processing activity | Launch + 12 months | ⬜ |
| 8.5 | DPO training refresh | Annually | 1 year post-launch | ⬜ |
| 8.6 | Review DPAs with processors | Annually | 1 year post-launch | ⬜ |
| 8.7 | Data retention enforcement (purge churned users after retention period) | Monthly cron | Ongoing | ⬜ |
| 8.8 | Security audit (RLS policies, env vars, access logs) | Quarterly | Phase 1 M3 | ⬜ |
| 8.9 | Breach log review (even if empty) | Quarterly | Ongoing | ⬜ |

---

## 9. Data Subject Rights

RA 10173 grants data subjects (AKBai users) the following rights. AKBai must implement mechanisms to honor each.

| Right | RA 10173 Section | Implementation | Status |
|-------|-------------------|---------------|--------|
| Right to be informed | §16 | Privacy Policy at onboarding | ⬜ |
| Right to access | §16(e) | Data export feature (JSON/CSV) | ⬜ |
| Right to object | §16(c) | Opt-out of non-essential processing | ⬜ |
| Right to erasure/blocking | §16(d) | 7-day purge flow. Soft-delete → hard purge after 7 days. | ⬜ |
| Right to rectification | §16(e) | Profile edit in settings (Gap B4) | ⬜ |
| Right to data portability | §18 | Export user data in machine-readable format | ⬜ |
| Right to damages | §16(f) | Addressed in Terms of Service (limitation of liability) | ⬜ |
| Right to file a complaint | §16(g) | NPC complaint contact in Privacy Policy | ⬜ |

### Deletion Flow
```
User requests deletion (Settings → Delete Account)
  → Immediate: Soft-delete all user records (set deleted_at)
  → Day 1-3: Send confirmation email with undo option
  → Day 7: Hard purge all user data from Supabase
  → Day 7: Request data deletion from processors (Anthropic, Sentry, PostHog)
  → Day 7: Confirm deletion to user via email
```

---

## 10. Data Classification

AKBai processes the following categories of data. Each category has specific handling rules under RA 10173.

### Sensitive Personal Information (highest protection)
Financial data falls under sensitive personal information in the Philippine context. Stricter consent and security requirements apply.

| Data Type | Examples | Storage | Encryption | RLS | Retention |
|-----------|----------|---------|------------|-----|-----------|
| Financial transactions | Income, expenses, amounts | Supabase `transactions` | At rest (AES-256) | user_id scoped | Active subscription + 1 year post-churn |
| Receipt data | Scanned receipt images + OCR text | Supabase Storage + `receipts` | At rest | user_id scoped | Active subscription + 1 year post-churn |
| BIR information | Tax type, registration status, deadlines | Supabase `businesses`, `bir_deadlines` | At rest | user_id scoped | Active subscription + 1 year post-churn |
| Payment data | Subscription status (NOT card numbers — Xendit handles) | Supabase `subscriptions` | At rest | user_id scoped | Active subscription + 1 year post-churn |

### Personal Information (standard protection)
| Data Type | Examples | Storage | Encryption | RLS | Retention |
|-----------|----------|---------|------------|-----|-----------|
| Identity | Name, email, phone | Supabase `users` | At rest | user_id scoped | Active subscription + 1 year post-churn |
| Business profile | Business name, type, income range | Supabase `businesses` | At rest | user_id scoped | Active subscription + 1 year post-churn |
| KA conversations | Chat history with AI | Supabase `ka_conversations` | At rest | user_id scoped | Active subscription + 90 days post-churn |

### Non-Personal / Anonymized
| Data Type | Examples | Storage | Notes |
|-----------|----------|---------|-------|
| Feature analytics | Page views, feature usage, session duration | PostHog | Anonymize where possible. No PII in event properties. |
| Error logs | Stack traces, API errors | Sentry | Configure PII scrubbing. No user data in error payloads. |
| Aggregate metrics | MRR, user count, churn rate | Admin dashboard | No individual-level data |
