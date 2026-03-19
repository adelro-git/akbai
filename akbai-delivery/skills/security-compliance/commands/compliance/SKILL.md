---
name: /compliance
description: >
  Run a compliance check by type: NPC (National Privacy Commission / RA 10173), BIR (Bureau
  of Internal Revenue legal boundaries), or SECURITY (data isolation, input validation, secrets
  management). Outputs: compliance status table (COMPLIANT / NON-COMPLIANT / PARTIAL / NOT
  APPLICABLE) + severity + action items + deadline recommendations. CRITICAL: read gap-registry.md
  before running. Triggers: "compliance", "NPC check", "BIR review", "security audit", "data
  privacy", "legal compliance", "compliance gate".
---

# /compliance — Run Compliance Check

Run a structured compliance audit by type. Outputs compliance status table + action items + severity + deadline.

## Before Starting

Read these shared context files:
- `/AKBai/akbai-delivery/shared/project-context.md` — §9 Compliance Requirements, BIR persona rules, personas
- `/AKBai/akbai-delivery/shared/gap-registry.md` — 10 CRITICAL gates + 16 IMPORTANT gates. Pay special attention to Category A (Hard Pre-Launch Gates), Category D (Operational), and Category E (Pre-Build Checklist). Critical items: A1 (Auth), A2 (Privacy Policy), D1 (OTP deliverability), D2 (Webhook idempotency), D3 (OR number generation legality), E3 (Onboarding rate-limit exemption)
- `/AKBai/akbai-delivery/shared/glossary.md` — Technical terms (RLS, soft delete, audit columns, service role key), NPC/BIR/DTI/SEC definitions
- `/AKBai/akbai-delivery/shared/tech-stack.md` — Architecture principles (RLS, server-side only API calls, soft-delete, circuit breaker, feature flags)

Also read:
- `../references/security-framework.md` (if exists) — AKBai's security architecture, threat model, response protocols
- `../references/pia-checklist.md` (if exists) — Privacy Impact Assessment template and completion status
- `../references/compliance-roadmap.md` (if exists) — Timeline for NPC registration, legal sign-offs, audit readiness

## Workflow

### 1. Parse the Type Argument

User provides a type. Parse as one of:
- **"npc"** — National Privacy Commission compliance (RA 10173 Data Privacy Act)
- **"bir"** — BIR legal review and boundaries
- **"security"** — Technical security audit (data isolation, API safety, secrets, CSRF/XSS)

If no type provided, ask which audit to run.

### 2. NPC Compliance Check ("npc" type)

**What we're checking:** Legal compliance under Philippine Republic Act 10173 (Data Privacy Act). AKBai must register with NPC within 20 days of launch and maintain compliance for all user data handling.

**Checklist:**

| Item | Status | Details |
|------|--------|---------|
| **NPC Registration filed** | ☐ | Has AKBai submitted the Data Processing Entity (DPE) registration form to NPC? (GAP A2 related) Deadline: within 20 days of soft launch. Status: [PENDING / IN PROGRESS / REGISTERED / NOT STARTED] |
| **DPO (Data Protection Officer) designated** | ☐ | Is a DPO formally appointed? Currently: Anton (personal liability under RA 10173). Plan: outsourced DPO at scale (Phase 2+). Status: [DESIGNATED / PENDING DELEGATION] |
| **Privacy Policy published and live** | ☐ | Does AKBai have a live, published Privacy Policy that covers: (1) data collected, (2) why, (3) retention period, (4) user rights, (5) breach notification protocol? Lawyer-drafted, not self-drafted (GAP A2). Status: [LIVE / DRAFT / NOT STARTED]. If DRAFT: include in checklist. |
| **Terms of Service live** | ☐ | Do AKBai ToS explicitly cover: (1) acceptable use, (2) limitation of liability, (3) dispute resolution, (4) termination policy? Lawyer-drafted. Status: [LIVE / DRAFT / NOT STARTED]. |
| **Explicit Data Consent Checkbox** | ☐ | Before any data collection (signup), does AKBai show a mandatory checkbox: "I agree to AKBai's Privacy Policy and Terms of Service"? Checkbox MUST be unchecked by default. Status: [IMPLEMENTED / DESIGNED / NOT STARTED] |
| **Privacy Impact Assessment (PIA)** | ☐ | Has a formal PIA been completed? PIA documents: (1) what data is collected, (2) why, (3) how it's processed, (4) risks, (5) mitigations. Required before NPC registration. Status: [COMPLETED / DRAFT / NOT STARTED]. If DRAFT: include in action items. |
| **Data Retention Policy defined** | ☐ | Does AKBai have a clear retention window? E.g., "User data retained for 1 year after subscription end; then soft-deleted (not restored)." Required in Privacy Policy and enforced in system (soft-delete with automated purge). Status: [DEFINED / DRAFTED / NOT STARTED]. |
| **7-Day User Deletion Workflow** | ☐ | If a user requests deletion, can AKBai delete ALL PII within 7 days? This includes: (1) name, email, phone, (2) soft-delete transactions, (3) remove from payment system (Xendit records). Status: [AUTOMATED / MANUAL / NOT IMPLEMENTED]. Effort to implement: ~4 hours (delete API endpoint + Xendit API call) |
| **Data Processing Agreement (DPA) templates** | ☐ | If AKBai uses third-party processors (Supabase, Claude API, Xendit, Resend), do we have DPA templates in place? Required for vendor compliance. Status: [REVIEWED / PENDING / NOT STARTED]. Action: Check Supabase DPA, Anthropic DPA, Xendit ToS, Resend ToS for data processor clauses. |
| **Breach Notification Protocol (72-hour window)** | ☐ | Does AKBai have a documented protocol for data breaches? Must notify NPC within 72 hours if a breach occurs. Protocol should include: (1) detect, (2) assess scope, (3) notify Anton, (4) file NPC notice, (5) notify affected users. Status: [DOCUMENTED / DRAFT / NOT STARTED]. Effort: 1–2 hours to draft. |
| **Encryption at rest for PII & Financial data** | ☐ | Are sensitive fields encrypted in Supabase? PII (name, email, phone) and Financial (amounts, receipt data) should be encrypted at rest using Supabase's native encryption or app-layer encryption. Status: [ENCRYPTED / PARTIALLY / NOT ENCRYPTED]. If NOT: Supabase supports Prisma + libsodium; ~1 day effort. |
| **Access logs / audit trail** | ☐ | Does Supabase log all data access? Audit logs required for NPC compliance. Supabase audit logs are available via replication or API. Status: [ENABLED / NOT CHECKED / NOT ENABLED]. Action: Enable Supabase audit logs (Settings > Audit Logs). |
| **Right to Data Portability** | ☐ | Can users export their data? Users have a right to download their data in machine-readable format (e.g., JSON, CSV). Status: [IMPLEMENTED / DESIGNED / NOT STARTED]. Effort: ~3 hours (create export endpoint + CSV generator). |

**Output format for NPC check:**

```markdown
## NPC / RA 10173 Compliance Audit

**Run date:** [date]
**Auditor note:** This is pre-launch readiness. All 12 items below are CRITICAL gates. Phase 0A must complete items 1–3 (registration, DPO, Privacy Policy). Phase 1 must complete all 12 before any user data goes live.

| # | Item | Status | Severity | Action Items | Deadline |
|---|------|--------|----------|--------------|----------|
| 1 | NPC Registration | NOT STARTED | 🔴 CRITICAL | File DPE registration form with NPC. Requires: business registration, DPO proof, Privacy Policy, PIA. | End of Phase 0A (Week 4) |
| 2 | DPO Designation | DESIGNATED (Anton) | 🔴 CRITICAL | Anton designated as interim DPO. Plan outsourced DPO at Phase 2. Create DPO job description + liability insurance review. | Phase 0A (immediate) |
| 3 | Privacy Policy | DRAFT | 🔴 CRITICAL | Engage PH tech lawyer to finalize. Must cover: data types, retention, user rights, breach protocol, 3rd-party sharing. | Week 2 Phase 0A |
| 4 | Terms of Service | DRAFT | 🔴 CRITICAL | Include: limitations of liability, dispute resolution, acceptable use policy. Lawyer-drafted. | Week 2 Phase 0A |
| 5 | Consent Checkbox | NOT STARTED | 🔴 CRITICAL | Design explicit opt-in checkbox (unchecked by default) before signup. Wire into Supabase auth. | Build 1 (Phase 1) |
| 6 | Privacy Impact Assessment | DRAFT | 🟡 IMPORTANT | Complete PIA template. Submit to NPC with registration application. | Phase 0A Week 3 |
| 7 | Data Retention Policy | DRAFTED | 🟡 IMPORTANT | Define retention window (recommend: 1 year post-churn, then soft-delete). Enforce via scheduled Supabase job. | Phase 1 Build 2 |
| 8 | 7-Day Deletion Workflow | NOT IMPLEMENTED | 🔴 CRITICAL | Build user deletion API endpoint (DELETE /user/:id). Soft-delete all user records + call Xendit to remove payment profile. Test end-to-end. | Build 6 Phase 1 |
| 9 | DPA Review | NOT STARTED | 🟡 IMPORTANT | Review Supabase, Claude API, Xendit, Resend data processor agreements. Document in compliance file. | Phase 0A |
| 10 | Breach Protocol | NOT DRAFTED | 🟡 IMPORTANT | Write incident response runbook: detect → assess → notify NPC (72hr window) → notify users. Practice mock breach. | Pre-launch Phase 1 |
| 11 | Encryption at Rest | NOT ENCRYPTED | 🟡 IMPORTANT | Evaluate: Supabase native encryption vs. app-layer (libsodium + Prisma). Encrypt name, email, phone, transaction amounts. | Build 3–4 Phase 1 |
| 12 | Access Logs / Audit Trail | NOT CHECKED | 🟡 IMPORTANT | Enable Supabase audit logs in project settings. Ensure audit retention >= 90 days. | Phase 0A |

**Summary:**
- **CRITICAL items:** 6 (registration, DPO, Privacy Policy, ToS, consent, deletion workflow)
- **IMPORTANT items:** 6 (PIA, retention policy, DPA review, breach protocol, encryption, audit)
- **Blocking items for Phase 1 launch:** All 12 (NPC registration must be REGISTERED before first user)
- **Lawyer engagement needed:** YES (Privacy Policy + ToS + PIA review)

**Recommendation:** Engage tech lawyer NOW (end of Phase 0A). Lawyer can draft Privacy Policy, ToS, and PIA template in parallel while you complete technical gates (auth, consent checkbox, deletion endpoint). Budget: ₱50K–₱100K for full legal package.
```

### 3. BIR Compliance Check ("bir" type)

**What we're checking:** Legal boundaries for tax-related features. AKBai calculates, reminds, and tracks — but does NOT provide tax advice. Boundaries are crucial to protect from liability.

**Checklist:**

| Item | Status | Details |
|------|--------|---------|
| **BIR Disclaimer on all tax outputs** | ☐ | Every message about BIR deadlines, calculations, or filing requirements includes: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo." (This is guidance only, not tax advice. Consult a CPA for official advice.) Status: [IMPLEMENTED / DESIGNED / NOT STARTED] |
| **OR (Official Receipt) number generation legality** | ☐ | BIR requires Official Receipts to be sequentially numbered from a registered OR series. Can AKBai auto-generate OR numbers? Has BIR approved this? Status: [BIR APPROVED / PENDING REVIEW / NOT STARTED] (GAP D3 — CRITICAL gate). This blocks Build 8 (Automated Self-Invoicing feature). |
| **Tax calculation accuracy verified** | ☐ | Have all tax calculations been tested against BIR guidelines? Examples: 8% flat tax for freelancers, VAT on sales >₱3M, graduated rates, deadline calendars. Status: [TESTED / SPOT-CHECKED / NOT VERIFIED]. Action: Test against 5 real scenarios from each persona. |
| **BIR deadline data accuracy** | ☐ | Are all BIR deadlines (1701Q, 1701, 1702Q, etc.) correct for 2026? Deadline calendar sourced from official BIR website (not guesses). Status: [SOURCED FROM BIR / OUTDATED / UNKNOWN SOURCE]. Update quarterly. |
| **No unauthorized tax advice boundary** | ☐ | Does KA avoid giving tax strategy advice? Examples of BANNED: "You should switch to 8% flat tax," "File quarterly instead of annually." Examples of OK: "Your gross receipts are ₱3.2M — BIR threshold is ₱3M, so you may be eligible for VAT registration." Status: [BOUNDARY DEFINED / UNCLEAR / NOT DEFINED]. Effort: 1 hour to write boundary doc. |
| **BIR registration status tracking** | ☐ | Does AKBai ask users about their BIR Certificate of Registration (COR) during onboarding (Kilala Kita)? Can KA surface which business registrations are missing? Status: [TRACKED / PARTIALLY / NOT TRACKED]. |
| **Tax form reminders match BIR calendar** | ☐ | Do BIR deadline notifications (1701Q, 1701, 1702Q, 2307, 2316, etc.) match the official calendar? Status: [VERIFIED / ASSUMED / NOT CHECKED]. Action: Cross-check against birs.gov.ph calendar. |
| **Disclaimer visibility in chat UI** | ☐ | Is the BIR disclaimer persistent and visible in every tax-related message? Or buried in small text where users miss it? Status: [VISIBLE / HARD TO FIND / NOT SHOWN]. Requirement: must appear in same message or immediately after, not 5 screens down. |

**Output format for BIR check:**

```markdown
## BIR Legal Compliance Audit

**Run date:** [date]
**Auditor note:** AKBai's BIR features are high-liability areas. Non-compliance can result in: (1) BIR penalties to users, (2) AKBai liability if calculations are wrong, (3) reputational damage. All items below are IMPORTANT gates for Phase 1 launch.

| # | Item | Status | Severity | Action Items | Deadline |
|---|------|--------|----------|--------------|----------|
| 1 | BIR Disclaimer on all outputs | DESIGNED | 🟡 IMPORTANT | Standard disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo." Implement in Deadline Watcher (Build 4), Morning Briefing (Build 5). | Build 4–5 Phase 1 |
| 2 | OR number generation approval | NOT STARTED | 🔴 CRITICAL | Must get BIR legal sign-off before auto-generating OR numbers (Build 8 feature). Engage BIR through legal counsel OR submit proof that OR numbers are sourced from pre-registered series. | Build 7 Phase 1 (before Build 8 ships) |
| 3 | Tax calculation accuracy verified | SPOT-CHECKED | 🟡 IMPORTANT | Create test cases: Maria (8% flat tax, ₱150K revenue), Jose (VAT registration, ₱5M sales), Ana (8% flat, freelancer), Andoy (sari-sari, graduated rates). Verify calculations match BIR tables. | Build 3 Phase 1 |
| 4 | BIR deadline data accuracy | OUTDATED | 🔴 CRITICAL | Current calendar is 2025 data. Update all deadlines for 2026. Source from birs.gov.ph. Review quarterly (Jan, Apr, Jul, Oct). | Week 1 Phase 1 (immediate) |
| 5 | No unauthorized tax advice boundary | NOT DEFINED | 🟡 IMPORTANT | Document: "KA can surface data; KA cannot recommend strategy." Examples: OK = "You hit ₱3M; VAT applies." NOT OK = "You should file quarterly." Write boundary doc + train testers. | Pre-Build 3 Phase 1 |
| 6 | BIR registration status tracking | NOT TRACKED | 🟡 IMPORTANT | Add to Kilala Kita (Build 1): "Have you registered with BIR?" If NO, flag as onboarding gap + link to BIR registration guide. | Build 1 Phase 1 |
| 7 | Tax form reminders match calendar | PARTIALLY | 🟡 IMPORTANT | Cross-check Deadline Watcher calendar (Build 4 feature) against birs.gov.ph. Verify: 1701Q, 1701, 1702Q, 2307, 2316 deadlines. | Build 4 Phase 1 |
| 8 | Disclaimer visibility in chat UI | NOT DESIGNED | 🟡 IMPORTANT | BIR disclaimers must be in the same chat bubble or immediately after (not scrolled away). Design pattern: [Tax info] + [Disclaimer in smaller text]. | Build 4 Phase 1 |

**Summary:**
- **CRITICAL items:** 2 (OR approval, deadline accuracy)
- **IMPORTANT items:** 6 (disclaimer, tax advice boundary, registration tracking, form accuracy, visibility)
- **Blocking items for Phase 1 launch:** OR approval + deadline accuracy + disclaimer + boundary definition
- **Legal engagement needed:** YES (BIR sign-off on OR generation; possibly engage via external counsel)

**Recommendation:** Before Build 3 ships, run through tax accuracy test cases with a CPA or tax expert (1–2 hours consultation, ₱2K–₱5K). Engage BIR through legal counsel for OR approval (2–3 weeks turnaround).
```

### 4. Security Audit Check ("security" type)

**What we're checking:** Technical data isolation, input validation, secrets management, CSRF/XSS protection, authentication, session management. This is architectural security (not penetration testing).

**Checklist:**

| Item | Status | Details |
|------|--------|---------|
| **RLS (Row-Level Security) on all tables** | ☐ | Every Supabase table has an RLS policy that scopes queries to `auth.uid() = user_id` or equivalent. No exceptions. Audit: run `SELECT policy_name, table_name FROM pg_policies` to verify. Status: [ALL TABLES / PARTIAL / NONE] (GAP related: RLS requirement in tech-stack.md). |
| **Soft-delete on all user data** | ☐ | Every table has a `deleted_at TIMESTAMPTZ NULL` column. Hard deletes are prohibited (violates NPC compliance). Queries filter `WHERE deleted_at IS NULL` everywhere. Status: [ALL TABLES / PARTIAL / NONE] |
| **Audit columns on all tables** | ☐ | Every table has `created_at` and `updated_at` columns, auto-updated via trigger. Required for compliance audit trails. Status: [ALL TABLES / PARTIAL / NONE] |
| **Input validation (Zod) on all API routes** | ☐ | Every API route validates input using Zod schemas before processing. No raw `req.body` access. Status: [ALL ROUTES / PARTIAL / NONE]. Effort: 1–2 hours if not done. |
| **API keys never in client code** | ☐ | Claude API key, Supabase service role key, Xendit API key — NEVER in `NEXT_PUBLIC_*` env vars or client bundles. All API calls are server-side only. Status: [SERVER-SIDE ONLY / MIXED / KEYS EXPOSED]. If exposed: rotate immediately. |
| **Service role key protection** | ☐ | Supabase service role key (highest privilege) is ONLY in server-side API routes or Edge Functions. Not in `next.config.js`, not in client components. Status: [PROTECTED / SEMI-EXPOSED / EXPOSED]. |
| **Prompt injection defense** | ☐ | All user input is escaped before being sent to Claude API. System prompt is fixed server-side, not user-controlled. Status: [DEFENDED / PARTIALLY / NOT DEFENDED]. Effort: 0 if proper API usage patterns. |
| **Authentication flow security** | ☐ | Supabase Auth handles session management. Sessions are httpOnly cookies (not localStorage). CSRF token middleware on state-changing requests. Status: [SECURE / SEMI-SECURE / NOT SECURE]. Verify: set `secureCookies: true` in Supabase client config. |
| **CSRF protection on form submissions** | ☐ | Form submissions (subscription changes, profile updates) include CSRF token. `next/navigation` handles this automatically in App Router. Status: [PROTECTED / UNCLEAR / UNPROTECTED]. |
| **XSS protection (sanitization)** | ☐ | User-provided text (transaction notes, receipt data) is sanitized before rendering in UI. Shadcn/UI does this automatically; verify no `dangerouslySetInnerHTML` in custom code. Status: [PROTECTED / PARTIAL / UNPROTECTED]. |
| **Data classification implemented** | ☐ | Data is classified as: PII (name, email, phone), Financial (amounts, receipt details), or Analytics (feature usage, anonymized). Each class has appropriate encryption/access rules. Status: [CLASSIFIED / PARTIAL / NOT CLASSIFIED]. Mapping: PII → encrypted, Financial → RLS + encrypted, Analytics → anonymized where possible. |
| **Secrets management (env vars)** | ☐ | All secrets are in `.env.local` (never committed) or Vercel Secrets dashboard. Rotate regularly. Status: [VERCEL DASHBOARD / .ENV LOCAL / EXPOSED]. |
| **Rate limiting on sensitive endpoints** | ☐ | Authentication endpoints (login, signup), payment webhooks, and Claude API calls are rate-limited to prevent brute-force or DDoS. Status: [IMPLEMENTED / PARTIAL / NOT IMPLEMENTED]. Effort: ~2 hours (middleware + Supabase).  |
| **Session expiry handled gracefully** | ☐ | When session expires mid-use, app shows graceful Taglish re-authentication prompt (not raw error). Status: [IMPLEMENTED / DESIGNED / NOT HANDLED]. |
| **API spend circuit breaker** | ☐ | Daily Claude API spend is capped (target: ~$5/day initially). When exceeded, app gracefully degrades (shows cached or offline response) instead of crashing. Status: [IMPLEMENTED / DESIGNED / NOT IMPLEMENTED]. (Gap D from tech-stack.md) |

**Output format for Security check:**

```markdown
## Security Audit

**Run date:** [date]
**Auditor note:** This audit covers architectural security (data isolation, API safety, secrets). It does NOT include penetration testing or cryptographic deep-dives. For those, hire external pen tester.

| # | Item | Status | Severity | Action Items | Deadline |
|---|------|--------|----------|--------------|----------|
| 1 | RLS on all tables | PARTIAL (3 of 7) | 🔴 CRITICAL | Audit: `SELECT policy_name, table_name FROM pg_policies;` Implement RLS on: transactions, receipts, invoices, custom_behaviors. | Pre-launch Phase 1 |
| 2 | Soft-delete on all tables | NOT IMPLEMENTED | 🔴 CRITICAL | Add `deleted_at TIMESTAMPTZ NULL DEFAULT NULL` to all tables. Create migration. Update all queries to filter `WHERE deleted_at IS NULL`. | Build 2 Phase 1 |
| 3 | Audit columns on all tables | ALL TABLES | ✅ OK | All tables have `created_at, updated_at` with trigger. No action needed. | — |
| 4 | Input validation (Zod) | PARTIAL (8 of 12) | 🟡 IMPORTANT | Add Zod schema to: /api/receipt, /api/transaction, /api/invoice endpoints. | Build 3 Phase 1 |
| 5 | API keys server-side only | MIXED | 🔴 CRITICAL | Scan codebase: `grep -r "NEXT_PUBLIC_CLAUDE"` Check no API keys in client. Rotate all exposed keys immediately. | Immediate |
| 6 | Service role key protection | PROTECTED | ✅ OK | Service role key only in API routes. No exposure detected. | — |
| 7 | Prompt injection defense | DEFENDED | ✅ OK | User input escaped before API call. System prompt fixed server-side. | — |
| 8 | Authentication (httpOnly cookies) | SECURE | ✅ OK | Supabase Auth configured with httpOnly + secure flags. CSRF token middleware active. | — |
| 9 | CSRF on form submissions | PROTECTED | ✅ OK | Next.js App Router handles CSRF automatically for POST/PUT/DELETE. | — |
| 10 | XSS protection (sanitization) | PARTIAL | 🟡 IMPORTANT | Audit custom components for `dangerouslySetInnerHTML`. Shadcn/UI safe by default. | Build 3 Phase 1 |
| 11 | Data classification | DESIGNED | 🟡 IMPORTANT | Document mapping: PII (name, email) → encrypt; Financial (amounts) → RLS; Analytics → anonymize. Enforce in code. | Build 2 Phase 1 |
| 12 | Secrets in env vars | VERCEL DASHBOARD | ✅ OK | All secrets stored in Vercel Environment Variables. No .env.local files in Git. | — |
| 13 | Rate limiting | NOT IMPLEMENTED | 🟡 IMPORTANT | Add rate limiting middleware: 10 requests/minute per IP on /api/auth/*. 50 requests/minute on /api/claude/*. Use Supabase PostgREST rate limiting or custom middleware. | Build 3 Phase 1 |
| 14 | Session expiry UX | DESIGNED (NOT BUILT) | 🟡 IMPORTANT | Design graceful re-auth modal. Build as part of B6 (UX gap). Test mid-use expiry flow. | Build 3 Phase 1 |
| 15 | Circuit breaker on API spend | DESIGNED (NOT BUILT) | 🟡 IMPORTANT | Implement: track daily spend in `daily_api_spend` table. Hard cap $5/day. Show user: "Daily query limit reached; try again tomorrow." | Build 5 Phase 1 |

**Summary:**
- **CRITICAL items:** 3 (RLS, soft-delete, API keys)
- **IMPORTANT items:** 7 (Zod validation, XSS, data classification, rate limiting, session UX, circuit breaker, audit columns)
- **OK items:** 5
- **Blocking items for Phase 1 launch:** All CRITICAL items + API key rotation
- **External audit recommended:** YES (hire pen tester for Phase 2, not Phase 1 — too early in build)

**Recommendation:** Fix all CRITICAL items before Build 1 ships to beta. IMPORTANT items can be completed incrementally in Builds 2–5. Track in sprint backlog.
```

### 5. Output Summary Table

After running the audit, provide a one-page summary:

```markdown
## Compliance Audit Summary

| Type | Total Items | ✅ Compliant | ⚠️ Partial | ❌ Non-Compliant | Blocking Gate? | Next Step |
|------|-----------|-----------|---------|-----------------|----------------|-----------|
| **NPC** | 12 | 1 | 3 | 8 | YES | Engage tech lawyer; complete Phase 0A checklist |
| **BIR** | 8 | 2 | 3 | 3 | YES | Verify deadline data; get OR approval |
| **Security** | 15 | 8 | 4 | 3 | YES | Fix RLS + soft-delete + API keys |
| **TOTAL** | 35 | 11 | 10 | 14 | **YES** | 14 action items across 3 areas |

**Critical Path (must fix before Phase 1 launch):**
1. ✅ NPC registration filed + Privacy Policy live
2. ✅ All BIR deadlines verified for 2026
3. ✅ All API keys removed from client code
4. ✅ RLS policies on all production tables
5. ✅ Soft-delete schema added to all tables

**Timeline:**
- **Phase 0A (Week 1–4):** Items 1–2 (NPC, BIR baseline)
- **Phase 1 Build 0–1 (Week 1–2):** Items 3–5 (Security foundations)
- **Phase 1 Build 2–6 (Week 3–12):** Remaining gaps (detailed in checklists above)
- **Pre-launch (Week 13):** Final compliance sign-off

**Audit conducted by:** [Name]
**Date:** [Date]
**Next audit:** [Date + 30 days or post-major change]
```

### 6. Cross-Skill Handoffs

If you need:
- **UX copy for compliance messaging?** Delegate to `/copy` command in ux-designer.
- **Architecture review for security gates?** Delegate to solutions-architect or fullstack-engineer.
- **BIR expert advice?** Flag for Anton to engage external tax consultant.
- **Legal review on Privacy Policy?** Flag for Anton to engage tech lawyer.

Otherwise, own the audit end-to-end.

## Tips for Success

1. **Read gap-registry.md first.** It lists all 10 CRITICAL gates. Cross-reference with this checklist.
2. **Run audits quarterly,** or after major feature ships. Compliance drifts easily.
3. **NPC and BIR require legal engagement.** Estimate ₱50K–₱150K for PH tech lawyer + tax consultant.
4. **Security gates can mostly be self-audited** (except pen testing, which is Phase 2+).
5. **Use this skill before every launch decision.** Phase 0A gate → compliance check. Phase 1 pre-launch → compliance check. Phase 2 → compliance check.
6. **Document every item.** Screenshots, URLs, commit hashes. Required for audit trail.
7. **When in doubt, escalate to legal.** Better to spend ₱2K on a lawyer's email than ₱200K on a regulatory fine.

## Example Run: NPC Check for Phase 0A

```
User: "Run compliance type:npc"

Response:
[Generates full NPC table as shown in §2 above, customized to current status]

Summary:
- 12 items to complete
- 3 are Phase 0A gates (registration, DPO, Privacy Policy)
- 9 are Phase 1 gates (consent UI, deletion endpoint, encryption, etc.)
- Lawyer engagement: URGENT (Privacy Policy + PIA must be drafted this week)
- Blocking status: Phase 1 cannot proceed without NPC registration certificate

Action items this sprint:
1. Engage lawyer (today)
2. Complete PIA template (by Wednesday)
3. Design consent checkbox UI (by Friday)
4. Submit NPC registration application (by end of Phase 0A)
```
