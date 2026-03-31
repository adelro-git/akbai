# BIR Compliance & Legal Boundaries — AKBai
> Used by: security-compliance, ai-engineer, product-owner, fullstack-engineer
> Last updated: 2026-03-31 | Source: Roadmap v14, Project Context §9, Brand Context (KA persona rules)
> This document defines what AKBai CAN and CANNOT do regarding BIR/tax-related features.

---

## Table of Contents
1. [The Core Rule](#1-the-core-rule)
2. [What AKBai CAN Do (Tax Reminders)](#2-what-akbai-can-do-tax-reminders)
3. [What AKBai CANNOT Do (Tax Advice)](#3-what-akbai-cannot-do-tax-advice)
4. [Disclaimer Requirements](#4-disclaimer-requirements)
5. [Liability Limitations](#5-liability-limitations)
6. [BIR Deadline Feature Boundaries](#6-bir-deadline-feature-boundaries)
7. [OR Number Generation (Gap D3)](#7-or-number-generation-gap-d3)
8. [KA Response Patterns for BIR Topics](#8-ka-response-patterns-for-bir-topics)
9. [Terms of Service BIR Provisions](#9-terms-of-service-bir-provisions)
10. [Edge Cases & Escalation Rules](#10-edge-cases--escalation-rules)

---

## 1. The Core Rule

**AKBai provides tax reminders and calculations. It does NOT provide tax advice.**

This is a legal boundary, not a product decision. In the Philippines, providing tax advice without proper accreditation (CPA license or BIR accreditation as a tax agent) is illegal. AKBai is a software tool — it reminds, calculates, and organizes. It does not advise, recommend, or interpret tax law.

The distinction matters because:
- **Tax reminder:** "Maria, ang deadline ng Quarterly Income Tax Return (BIR Form 1701Q) mo ay sa April 15."
- **Tax advice:** "Maria, mas maganda kung mag-file ka ng 8% flat tax kesa graduated rates."

The first is a calendar notification. The second is professional advice that requires a CPA. AKBai does the first. Never the second.

---

## 2. What AKBai CAN Do (Tax Reminders)

These features are legally safe because they present factual information without interpretation or recommendation.

| Feature | What It Does | Legal Basis |
|---------|-------------|-------------|
| **Deadline Watcher** | Displays BIR filing deadlines based on user's registered business type | Factual calendar data from public BIR Revenue Regulations |
| **Deadline notifications** | Sends 7/3/1-day push notifications before filing deadlines | Time-based reminders, no different from a calendar app |
| **Income/expense tracking** | Records and categorizes transactions the user enters or scans | Data entry tool — user provides the data, AKBai stores it |
| **Tax computation display** | Shows computed tax amounts based on user's recorded income | Mathematical calculation, not advice. Always with disclaimer. |
| **BIR form identification** | Tells user which BIR form to file based on their business type | Public information from BIR website (Revenue Memorandum Circulars) |
| **VAT threshold monitoring** | Alerts user when gross receipts approach ₱3M threshold | Factual threshold from NIRC. Alert only, no recommendation. |
| **Morning Briefing (BIR section)** | Includes upcoming BIR deadlines in Ang Umaga Mo card | Summary of existing tracked deadlines |
| **EWT rate display** | Shows EWT withholding rates (2%, 5%, 10%, 1%) based on income type classification | Public data from RR 2-98 as amended. Rate schedule, not advice. |
| **Form 2307 explanation** | Explains what a 2307 is, who issues it, and how to claim the tax credit | Factual description of a BIR form and its purpose |
| **PSIC-based classification display** | Shows user's PSIC code from COR and the corresponding EWT rate category | Factual mapping from public BIR classification data |

---

## 3. What AKBai CANNOT Do (Tax Advice)

These are explicitly out of scope. If KA is asked to do any of these, it must deflect to "Kumonsulta sa CPA."

| Prohibited Action | Why It's Prohibited | KA Response |
|-------------------|---------------------|-------------|
| Recommend tax regime (8% flat vs graduated) | Professional tax advice | "Depende po ito sa sitwasyon mo. Mas maganda kumonsulta sa CPA para sa tamang tax regime." |
| Advise on deductible expenses | Requires professional judgment | "Hindi po ako makapag-advise kung ano ang pwedeng i-deduct. Ang CPA mo po ang makakatulong dito." |
| Interpret BIR rulings or circulars | Legal interpretation | "Para sa interpretasyon ng BIR rulings, kumonsulta po sa inyong CPA o tax consultant." |
| File taxes on behalf of user | Requires BIR accreditation as tax agent | Not a feature. Users file their own taxes. |
| Guarantee tax computation accuracy | Creates liability | Always show disclaimer. Computations are estimates only. |
| Advise on tax penalties or amnesty | Professional advice | "May tax amnesty program ang BIR, pero kumonsulta muna sa CPA bago mag-apply." |
| Recommend timing of asset purchases for tax benefit | Tax planning = tax advice | Redirect to CPA. |
| Advise on business structure for tax optimization | Professional advice | "Kung gusto mong malaman kung mas ok ba ang sole proprietorship o corporation tax-wise, ang CPA mo po ang best na kausapin." |
| Determine if a specific engagement is contractor vs professional for EWT | Requires professional judgment on classification | "Depende po ito sa BIR registration at PSIC code. Kumonsulta sa CPA para sa tamang withholding rate." |
| Advise whether withholding was applied correctly | Tax compliance assessment | "Hindi po ako makapag-verify kung tama ang withholding. I-check mo sa CPA mo ang 2307 na natanggap mo." |

---

## 4. Disclaimer Requirements

### Primary BIR Disclaimer (Required on ALL Tax-Related Outputs)

This exact Taglish disclaimer must appear on every output that touches BIR, tax, or financial computation:

```
Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
```

### Where It Must Appear

| Context | Placement | Format |
|---------|-----------|--------|
| KA chat response (BIR topic) | End of every BIR-related message | Italic text, smaller font |
| Deadline Watcher screen | Persistent footer | Static text, always visible |
| Tax computation display | Below computation result | Bold, with CPA icon |
| Morning Briefing (BIR section) | Below BIR deadline cards | Italic text |
| Invoice/receipt with tax computation | Footer of document | Standard legal disclaimer text |
| PDF export (any financial report) | Footer of every page | Standard legal disclaimer text |
| Email notifications (BIR deadlines) | Footer of email | Standard text |

### Persistent In-App Disclaimer

In addition to the per-output disclaimer, the chat UI must display a persistent disclaimer visible at all times:

```
AKBai provides informational guidance only — hindi ito professional financial or tax advice.
```

This appears as a subtle but always-visible banner in the chat interface, not per-message.

### Financial Disclaimer (System Prompt)

The system prompt includes this non-negotiable line:

```
Paalala: Ang guidance na ito ay informational lang. I-verify mo sa iyong accountant o CPA bago mag-file.
```

---

## 5. Liability Limitations

### What AKBai Is NOT Liable For

These must be explicitly stated in the Terms of Service:

1. **BIR deadline miscalculations** — AKBai sources deadlines from publicly available BIR Revenue Regulations, but BIR may issue special extensions, regional variations, or ad-hoc changes. Users are responsible for verifying deadlines independently.

2. **Tax computation errors** — Computations are based on data the user enters. Garbage in = garbage out. AKBai does not verify the accuracy of user-entered income or expenses.

3. **Penalties or interest from late filing** — Even if Deadline Watcher fails to notify, the user bears responsibility for their own BIR compliance.

4. **Changes in tax law** — If BIR issues new regulations after AKBai's deadline database was last updated, AKBai is not liable for outdated information.

5. **OCR errors on receipts** — Receipt scanning uses AI (Claude Haiku Vision) which has a non-zero error rate. Users must verify scanned amounts before relying on them.

### User Acknowledgments (Onboarding)

During Kilala Kita onboarding (Step 3 — BIR consent), the user must explicitly acknowledge:

```
[ ] Naiintindihan ko na ang AKBai ay gabay lang para sa BIR deadlines at computations.
    Hindi ito tax advice at hindi liable ang AKBai sa anumang pagkakamali sa tax filing ko.
```

This checkbox must be stored with timestamp and version in `user_consents` table:
```sql
INSERT INTO user_consents (user_id, consent_type, version, consented_at)
VALUES (auth.uid(), 'bir_disclaimer', '1.0', NOW());
```

---

## 6. BIR Deadline Feature Boundaries

### Data Source
BIR deadlines are sourced from:
- BIR Revenue Regulations (public documents)
- BIR Revenue Memorandum Circulars (public documents)
- National Internal Revenue Code (NIRC) statutory deadlines

AKBai does NOT subscribe to a real-time BIR API (none exists). Deadlines are maintained in the `bir_deadlines` table and updated manually when BIR issues new regulations.

### BIR Update Protocol
When BIR announces deadline changes (common during holidays, calamities, or pandemics):
1. Anton (or future ops team) monitors BIR announcements
2. Update `bir_deadlines` table with new dates + source RMC number
3. Push notification to affected users: "May update sa BIR deadline. [New date]. Source: RMC No. [X]."
4. Log the update in audit trail

### What Deadline Watcher Shows
- Filing deadline date
- BIR form number and name
- Who needs to file (business type matching)
- Countdown (days remaining)
- Notification sequence: 7 days, 3 days, 1 day before

### What Deadline Watcher Does NOT Show
- Whether the user has already filed (AKBai has no BIR e-filing integration)
- Penalties for late filing (this veers into advice territory)
- Recommended filing strategy or timing

---

## 7. OR Number Generation (Gap D3)

**Status: CRITICAL — requires BIR legal sign-off before implementation.**

BIR requires that Official Receipts (OR) carry sequentially numbered receipt numbers from a registered OR series. Before AKBai can auto-generate OR numbers in Invoice Cards:

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Legal review: Can a software tool generate OR numbers? | ⬜ | Engage PH tax lawyer. This is not clear-cut. |
| 7.2 | If yes: determine BIR registration requirements for AKBai as receipt-generating software | ⬜ | May need BIR accreditation as Computerized Accounting System (CAS) |
| 7.3 | If no: Invoice Cards generate "Billing Statement" or "Sales Invoice" instead of OR | ⬜ | Fallback that avoids OR numbering entirely |
| 7.4 | Document decision and legal basis | ⬜ | Add to Key Decisions Log in SKILL.md |

**Current recommendation:** Ship Invoice Cards WITHOUT OR numbering in Phase 1. Label outputs as "Billing Statement" or "Unofficial Receipt." Pursue BIR CAS accreditation in Phase 2 if user demand warrants it.

---

## 8. KA Response Patterns for BIR Topics

When KA responds to BIR-related questions, follow these patterns exactly. Each pattern includes the mandatory disclaimer.

### Pattern: Deadline Reminder
```
Maria, reminder po — ang deadline ng [Form Name] ([Form Number]) mo ay sa [Date].
[Days] days na lang. Handa ka na ba?

_Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo._
```

### Pattern: Tax Computation Display
```
Based sa records mo, eto ang estimated tax computation mo:

Gross Income: ₱[amount]
Allowable Deductions: ₱[amount]
Taxable Income: ₱[amount]
Estimated Tax Due: ₱[amount]

⚠️ Estimate lang po ito. I-verify sa CPA bago mag-file.

_Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo._
```

### Pattern: Tax Question Redirect
When user asks something AKBai cannot answer (tax advice territory):
```
Magandang tanong po, [Name]. Pero hindi po ako makapag-advice tungkol sa [topic].
Para sa tamang sagot, mas maganda po kumonsulta sa CPA o accredited tax consultant.

Ang kaya ko po gawin:
• I-track ang BIR deadlines mo
• I-compute ang estimated tax based sa records mo
• I-remind ka bago mag-deadline

_Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo._
```

### Pattern: VAT Threshold Alert
```
Heads up po, [Name] — ang total gross receipts mo this year ay ₱[amount] na.
Malapit na sa ₱3,000,000 VAT threshold.

Pag lumampas dito, required na po ang VAT registration sa BIR.
Kumonsulta sa CPA mo para sa next steps.

_Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo._
```

---

## 9. Terms of Service BIR Provisions

The following provisions must appear in the Terms of Service. These are guidance for the PH tech lawyer drafting the actual document — the lawyer should adapt the language to be legally precise.

### Provision 1: Nature of Service
AKBai provides financial tracking, tax deadline reminders, and computational tools. AKBai does not provide tax advice, accounting services, or professional financial counsel. AKBai is not a Certified Public Accountant (CPA), tax agent, or accredited tax consultant.

### Provision 2: User Responsibility
Users are solely responsible for their own BIR compliance, including but not limited to: filing tax returns on time, paying correct tax amounts, maintaining proper business records, and complying with all applicable BIR Revenue Regulations.

### Provision 3: No Guarantee of Accuracy
Tax computations provided by AKBai are estimates based on data entered by the user. AKBai does not guarantee the accuracy, completeness, or timeliness of any computation, deadline, or financial information displayed in the application.

### Provision 4: Limitation of Liability
AKBai shall not be liable for any direct, indirect, incidental, or consequential damages arising from: missed BIR deadlines, incorrect tax computations, penalties assessed by BIR, or any action taken or not taken based on information provided by AKBai.

### Provision 5: Third-Party Consultation
AKBai strongly encourages users to consult a licensed CPA or accredited tax consultant for all tax-related decisions, interpretations of tax law, and filing of tax returns.

### Provision 6: Changes to BIR Regulations
AKBai makes reasonable efforts to keep BIR deadline information current but does not guarantee real-time updates. Users should independently verify deadlines with BIR, especially during periods when BIR commonly issues extensions (holidays, calamities, pandemic).

---

## 10. Edge Cases & Escalation Rules

### When the Line Gets Blurry

Some user questions fall in a gray area. Here's how to handle them:

| User Question | Classification | KA Response Approach |
|--------------|---------------|---------------------|
| "Kailan ang deadline ko?" | ✅ Safe — factual lookup | Provide deadline from bir_deadlines table + disclaimer |
| "Magkano ang tax ko?" | ✅ Safe — computation | Show estimated computation from records + disclaimer |
| "Anong form ang i-file ko?" | ✅ Safe — factual | Identify form based on business type + disclaimer |
| "Dapat ba akong mag-VAT register?" | ⛔ Advice — redirect | Show current gross receipts vs threshold, redirect to CPA |
| "Pwede ko ba i-deduct 'to?" | ⛔ Advice — redirect | Cannot advise on deductibility, redirect to CPA |
| "Ano ang penalty kung late ako?" | ⚠️ Gray area | Can state statutory penalty rates (public info) but not advise on avoidance. Add disclaimer. |
| "Mas ok ba 8% flat tax o graduated?" | ⛔ Advice — redirect | Cannot recommend tax regime, redirect to CPA |
| "Bakit ganito kalaki ang tax ko?" | ⚠️ Gray area | Can explain the computation steps, but not advise on reducing it. Add disclaimer. |
| "May tax amnesty ba ngayon?" | ⚠️ Gray area | Can confirm existence of publicly announced programs, but cannot advise on eligibility or application. Redirect to CPA. |
| "Magkano ang withholding tax sa client ko?" | ⚠️ Gray area | Can show the EWT rate schedule (2%/5%/10%) and explain contractor vs professional distinction. Can note user's PSIC code if known. But cannot determine which rate definitively applies to a specific engagement — redirect to CPA for classification. Add disclaimer. |
| "Kailangan ko ba mag-issue ng 2307?" | ⚠️ Gray area | Can explain when a business becomes a withholding agent (when paying for services). Cannot advise whether a specific payment requires withholding — redirect to CPA. Add disclaimer. |
| "Tama ba ang 2307 na binigay sa akin?" | ⛔ Advice — redirect | Cannot verify correctness of withholding. Redirect to CPA. |

### Escalation Principle
When in doubt: **show the data, don't interpret it.** KA can always display numbers, dates, and form names. KA can never say "you should" or "I recommend" regarding tax matters. If a response starts veering into "you should," stop and redirect to CPA.
