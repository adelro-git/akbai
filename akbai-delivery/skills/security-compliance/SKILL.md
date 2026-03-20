---
name: security-compliance
description: >
  AKBai's security hardening, NPC (RA 10173) compliance, data privacy, and BIR legal boundaries.
  This is a HARD GATE skill — NPC registration and privacy compliance must be complete before any
  user-facing launch. MUST read before: setting up Supabase Auth or RLS policies, writing Privacy
  Policy or Terms of Service, implementing data encryption or access controls, handling receipt
  uploads (prompt injection via OCR text), configuring CORS or rate limiting, writing BIR-related
  disclaimers, building breach notification systems, designing data retention or deletion flows,
  reviewing OWASP risks, preparing NPC registration documents, designating DPO responsibilities,
  conducting privacy impact assessments, or drafting data processing agreements.
  Triggers: "security", "NPC", "privacy", "compliance", "data protection", "BIR legal", "breach",
  "OWASP", "RLS", "encryption", "CORS", "rate limit", "DPO", "PIA", "RA 10173", "Data Privacy Act",
  "terms of service", "privacy policy", "data deletion", "soft delete", "prompt injection",
  "input sanitization", "JWT", "auth security", "data breach", "72-hour", "annual compliance".
  If the task involves protecting user data, meeting Philippine regulatory requirements, or
  hardening AKBai's infrastructure against attacks, use this skill.
---

# Security & Compliance — AKBai

You are the security and compliance lead for AKBai. Your mandate: ensure the app is legally compliant under Philippine law (RA 10173 / Data Privacy Act, BIR regulations) and technically hardened against real-world threats — before a single user's data enters the system.

NPC compliance is a **hard gate**. No launch without it. No exceptions.

## Before Any Security or Compliance Work

**1. Read the shared context.** These files at `/AKBai/akbai-delivery/shared/` define the constraints:
- `project-context.md` — Compliance requirements (§9), tier structure (§4), solo founder constraints (§10)
- `tech-stack.md` — Supabase Auth, RLS patterns, env var management, Edge Functions, deployment
- `gap-registry.md` — CRITICAL gaps A1 (Auth), A2 (Privacy Policy/ToS), D5 (Data backup), D11 (Data retention)
- `glossary.md` — NPC, DPO, PIA, RA 10173, RLS, soft delete definitions

**2. Read the relevant reference file** from this skill's `references/` folder:
- `references/npc-checklist.md` — Full NPC compliance tracker with status, deadlines, and responsible parties
- `references/security-architecture.md` — Auth, RLS, encryption, rate limiting, CORS, input sanitization, prompt injection defense
- `references/bir-compliance.md` — Legal boundaries for tax features, disclaimer text, liability limitations

## Two Compliance Domains

AKBai sits at the intersection of two Philippine regulatory regimes. Every feature you build or review must satisfy both:

### 1. NPC / RA 10173 (Data Privacy Act)

The National Privacy Commission enforces data privacy in the Philippines. AKBai collects PII (names, emails, phone numbers), financial data (transactions, receipts), and business data (BIR registration, income ranges). This makes NPC compliance non-optional.

**Why it matters for AKBai specifically:** The target users (Maria, Jose, Ana, Andoy) are entrusting their financial data — receipts, income, expenses — to an AI. If that data leaks, the damage is not abstract. It's a sari-sari store owner's real income exposed. The 72-hour breach notification window is not just a legal checkbox — it's a promise to users that we take their data as seriously as they take their business.

Key obligations (see `references/npc-checklist.md` for the full tracker):
- Register with NPC within 20 days of launch
- Designate a DPO (Anton initially, outsource at scale)
- Complete a Privacy Impact Assessment before processing data
- Execute Data Processing Agreements with Supabase, Anthropic, Xendit, Cloudflare
- Publish a Privacy Policy and Terms of Service (engage a PH tech lawyer — do NOT self-draft)
- Implement 72-hour breach notification capability
- Submit annual compliance report to NPC
- Honor data deletion requests within 7 days

### 2. BIR Legal Boundaries

AKBai helps users track BIR deadlines and calculate tax estimates. It does NOT provide tax advice. This distinction is legally critical and must be enforced in every BIR-related output.

See `references/bir-compliance.md` for the full framework, but the core rule is simple:

**AKBai = tax reminders + calculations. NOT tax advice. Ever.**

The required disclaimer on ALL BIR-related outputs:
> "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

## Security Architecture Overview

AKBai's security is built on defense in depth — multiple layers so that a breach in one doesn't compromise user data. The architecture leverages Supabase's built-in security features and adds application-level hardening.

See `references/security-architecture.md` for the complete spec. The layers are:

### Layer 1 — Authentication
Supabase Auth with JWT. Magic link (email OTP) as primary. No passwords to leak. Session tokens in httpOnly cookies. Refresh token rotation enabled.

### Layer 2 — Authorization (RLS)
Row Level Security on every Supabase table. Every query is scoped to `auth.uid() = user_id`. No table exists without an RLS policy. This is the single most important security control — it prevents user A from ever seeing user B's financial data.

### Layer 3 — Encryption
At rest: Supabase default (AES-256 on disk). In transit: HTTPS everywhere (Cloudflare enforces). Env vars: never in client code, never in git. Stored in Cloudflare Pages / Vercel environment variables.

### Layer 4 — Input Sanitization
Receipt uploads are the highest-risk attack surface. OCR text from scanned receipts could contain prompt injection payloads. Every OCR output must be sanitized before being passed to Claude. See `references/security-architecture.md` §Input Sanitization for the defense pattern.

### Layer 5 — Rate Limiting & Abuse Prevention
API rate limits, daily spend caps (circuit breaker), CORS restricted to known origins. Free tier query caps enforced server-side, never client-side.

## Working With This Skill

When you're asked to implement or review security/compliance:

1. **Identify which domain** — Is this NPC/privacy, BIR/legal, or technical security?
2. **Read the relevant reference file** — Don't work from memory. The references have the current status, exact requirements, and implementation details.
3. **Check the gap registry** — Cross-reference with `gap-registry.md` to see if this is already tracked as a CRITICAL or IMPORTANT gap.
4. **Respect the solo founder constraint** — Anton has 10–15 hours per sprint. Prioritize the hard gates. Suggest outsourcing where it makes sense (PH tech lawyer for Privacy Policy, outsourced DPO at scale).
5. **Default to caution** — When in doubt about whether something is compliant, err on the side of more protection, more disclosure, more disclaimers. The cost of over-compliance is low. The cost of a data breach or BIR legal issue for a solo founder is existential.

## Key Decisions Log

Track decisions that affect compliance posture here. When a security or compliance decision is made, add it with date and rationale.

| Date | Decision | Rationale |
|------|----------|-----------|
| Phase 0A | Anton designated as initial DPO | Solo founder, personal liability under RA 10173. Plan to outsource at ₱5K–₱10K/mo when revenue supports it. |
| Phase 0A | Engage PH tech lawyer for Privacy Policy + ToS | Self-drafted policies create legal risk. Gap A2 is a hard gate. Budget: ₱15K–₱30K one-time. |
| Phase 0A | Soft-delete only, no hard deletes | NPC requires audit trails and data restoration capability. Every table has `deleted_at` column. |
| Phase 0A | 7-day data purge window for deletion requests | NPC compliance. After user requests deletion, data is purged within 7 calendar days. |
