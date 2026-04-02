# AKBai — BIR Knowledge Base
> Used by: ai-engineer, security-compliance, fullstack-engineer (Build 6 Deadline Watcher)
> Source: BIR.gov.ph public data, TRAIN Law (RA 10963), RMC 20-2026
> Last verified: 2026-04-02 | Tax year: 2025–2026 rules
> **⚠️ DISCLAIMER: This file is reference material for KA's domain knowledge. All tax-related outputs to users MUST include the BIR disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."**

---

## 1. BIR Forms by Business Type

### AKBai Persona → Forms Mapping

| Business Type | AKBai Persona | Tax Option | Required Forms | Filing Frequency |
|--------------|---------------|------------|----------------|------------------|
| Sole proprietor (non-VAT, graduated, OSD) | Maria, Jose, Andoy | Graduated rates + OSD | 1701Q, 1701A, 2551Q | Quarterly ITR, Annual ITR, Quarterly percentage tax |
| Sole proprietor (non-VAT, graduated, itemized) | Maria, Jose, Andoy | Graduated rates + itemized deductions | 1701Q, **1701**, 2551Q | Quarterly ITR, Annual ITR (Form 1701, not 1701A), Quarterly percentage tax |
| Sole proprietor (non-VAT, 8% flat) | Ana | 8% flat tax | 1701Q, 1701A | Quarterly ITR, Annual ITR (exempt from 2551Q) |
| Sole proprietor (VAT-registered) | Jose (if >₱3M) | Graduated rates + VAT | 1701Q, 1701A, 2550Q | Quarterly ITR, Annual ITR, Quarterly VAT |
| Corporation | (Phase 3+) | Corporate rates | 1702Q, 1702, 2551Q | Quarterly ITR, Annual ITR, Quarterly percentage tax |

### Form Descriptions (KA should know these)

| Form | Full Name | Who Files | Frequency |
|------|-----------|-----------|-----------|
| **1701Q** | Quarterly Income Tax Return (Individuals) | All self-employed / sole proprietors | Q1, Q2, Q3 (no Q4 — covered by annual) |
| **1701A** | Annual Income Tax Return (Purely Business/Profession) | Sole proprietors using 8% flat or OSD | Annually |
| **1701** | Annual Income Tax Return (Individuals) | Individuals with business/professional income using **itemized deductions** (purely self-employed OR mixed income) | Annually |
| **2551Q** | Quarterly Percentage Tax Return | Non-VAT taxpayers using graduated rates (NOT 8% flat) | Quarterly |
| **2550Q** | Quarterly VAT Return | VAT-registered taxpayers (gross >₱3M) | Quarterly |
| **2550M** | Monthly VAT Declaration | Quarterly 2550Q is now the **mandatory default** since January 1, 2023 (per RMC 5-2023); monthly 2550M remains an **optional additional filing** with no penalty for switching (clarified by RMC 52-2023) | Monthly (optional) |
| **1702Q** | Quarterly Income Tax Return (Corporations) | Corporations | Q1, Q2, Q3 |
| **1702** | Annual Income Tax Return (Corporations) | Corporations | Annually |
| **2307** | Certificate of Creditable Tax Withheld at Source | Issued by **payer** (withholding agent) to **payee** (income earner) to document EWT withheld | Per transaction or monthly — payee attaches to quarterly/annual ITR as tax credit |

### Key Rule: 8% Flat Tax Exempts from 2551Q
If a non-VAT individual taxpayer opts for 8% flat tax, they are **exempt** from filing BIR Form 2551Q (percentage tax). The 8% rate replaces both graduated income tax AND 3% percentage tax.

### Key Rule: Form 1701-MS (Micro/Small Taxpayers — RMC 20-2026)
RMC 20-2026 allows micro and small taxpayers to use **Form 1701-MS** (a simplified annual return) regardless of what their COR says. EOPT definitions: **micro** = gross sales < ₱3M; **small** = gross sales ₱3M to < ₱20M.

**⚠️ Electronic filing gap (confirmed as of April 2026):** BIR Form 1701-MS is NOT available in eBIRForms (v7.9.5.0) or eFPS. Per Deloitte Tax@Hand (Mar 19, 2026) and BIR RDO advisories, the form must be downloaded manually from bir.gov.ph. The workaround per RMC 20-2026: micro and small individual taxpayers can file using 1701 or 1701A electronically with no penalty, regardless of what their COR says. They are NOT required to update their COR to include 1701-MS. KA should guide users toward electronic filing via 1701A.

---

## 2. Filing Deadline Calendar

### Quarterly Income Tax (1701Q / 1702Q)
Filed Q1–Q3 only. No Q4 quarterly — the annual return covers the full year.

| Quarter | Period Covered | Deadline |
|---------|---------------|----------|
| Q1 | January – March | **May 15** |
| Q2 | April – June | **August 15** |
| Q3 | July – September | **November 15** |

### How Quarterly Income Tax (1701Q) Is Computed
Quarterly income tax is computed on **cumulative year-to-date income**, not just the quarter's income. Tax paid in prior quarters is credited against the current quarter's liability. Example: if Q1 tax due = ₱10,000 and Q2 cumulative tax due = ₱25,000, the Q2 payment = ₱25,000 − ₱10,000 = ₱15,000. This is a common confusion point for MSMEs — KA should explain this clearly.

### Annual Income Tax (1701A / 1701 / 1702)

| Taxable Year | Deadline |
|-------------|----------|
| 2025 | **April 15, 2026** |
| 2026 | **April 15, 2027** |

### Quarterly Percentage Tax (2551Q) — Non-VAT, Graduated Rates Only
Filed for the quarter just ended, due on the 25th of the month after the quarter closes.

| Quarter | Period Covered | Deadline |
|---------|---------------|----------|
| Q4 (prev year) | October – December | **January 25** |
| Q1 | January – March | **April 25** |
| Q2 | April – June | **July 25** |
| Q3 | July – September | **October 25** |

### Quarterly VAT Return (2550Q) — VAT-Registered Only
Same pattern as 2551Q — due on the 25th of the month after the quarter closes.

| Quarter | Period Covered | Deadline |
|---------|---------------|----------|
| Q4 (prev year) | October – December | **January 25** |
| Q1 | January – March | **April 25** |
| Q2 | April – June | **July 25** |
| Q3 | July – September | **October 25** |

### Month-by-Month Summary (All Business Types)

| Month | What's Due | Forms |
|-------|-----------|-------|
| **January** | Q4 percentage tax / Q4 VAT return, Annual compliance (bind books by Jan 15) | 2551Q, 2550Q |
| **February** | — | (No major deadlines) |
| **March** | — | (No major deadlines) |
| **April** | Annual ITR (Apr 15) + Q1 percentage tax / Q1 VAT return (Apr 27*) | 1701A/1701, 2551Q, 2550Q |
| **May** | Q1 quarterly income tax | 1701Q |
| **June** | — | (No major deadlines) |
| **July** | Q2 percentage tax / Q2 VAT return (Jul 27*) | 2551Q, 2550Q |
| **August** | Q2 quarterly income tax (Aug 17*) | 1701Q |
| **September** | — | (No major deadlines) |
| **October** | Q3 percentage tax / Q3 VAT return (Oct 26*) | 2551Q, 2550Q |
| **November** | Q3 quarterly income tax (Nov 16*) | 1701Q |
| **December** | — | (Year-end prep: organize records for annual filing) |

*Adjusted from original date due to weekend; see §2 Deadline Adjustments above.

### Deadline Rules
- If deadline falls on a **weekend or holiday**, it moves to the **next business day**
- BIR may issue **extensions via RMC** (Revenue Memorandum Circular) — check BIR.gov.ph
- Payment and filing happen on the **same deadline** (file and pay together)
- Late filing penalties: **25% surcharge** (or 10% for micro/small under EOPT Act; **50% if willful neglect or fraud** regardless of size) + **12% annual interest** per TRAIN Law (or 6% for micro/small under EOPT Act) + compromise penalty
- **Note:** BIR's penalties page (bir.gov.ph/penalties) still shows 20% interest (pre-TRAIN). The 12% rate (double the 6% BSP legal interest) is the legally current rate per Sec. 249 as amended by RA 10963. KA should cite the TRAIN Law rate but note the discrepancy if users question it.

### 2026 Deadline Adjustments (Weekend/Holiday Rollover)

Several 2026 deadlines fall on weekends and automatically move to the next business day:

| Original Deadline | Day | Adjusted To | Form(s) |
|------------------|-----|------------|---------|
| April 15 | Wednesday | **No change** | 1701A, 1701 (Annual ITR) |
| April 25 | Saturday | **April 27 (Monday)** | 2551Q, 2550Q (Q1) |
| May 15 | Friday | **No change** | 1701Q (Q1) |
| July 25 | Saturday | **July 27 (Monday)** | 2551Q, 2550Q (Q2) |
| August 15 | Saturday | **August 17 (Monday)** | 1701Q (Q2) |
| October 25 | Sunday | **October 26 (Monday)** | 2551Q, 2550Q (Q3) |
| November 15 | Sunday | **November 16 (Monday)** | 1701Q (Q3) |
| January 25, 2027 | Monday | **No change** | 2551Q, 2550Q (Q4 2026) |

### 2026 Philippine Public Holidays (Proclamation No. 1006)
> Used by Build 6 (Deadline Watcher) for rollover logic and test fixtures.

**Regular Holidays:**
| Date | Day | Holiday |
|------|-----|---------|
| January 1 | Thursday | New Year's Day |
| March 20 | Friday | Eid'l Fitr (Proclamation 1189) |
| April 2 | Thursday | Maundy Thursday |
| April 3 | Friday | Good Friday |
| April 9 | Thursday | Araw ng Kagitingan |
| May 1 | Friday | Labor Day |
| June 12 | Friday | Independence Day |
| August 31 | Monday | National Heroes Day |
| November 30 | Monday | Bonifacio Day |
| December 25 | Friday | Christmas Day |
| December 30 | Wednesday | Rizal Day |

**Special Non-Working Holidays:**
| Date | Day | Holiday |
|------|-----|---------|
| February 17 | Tuesday | Chinese New Year |
| April 4 | Saturday | Black Saturday |
| August 21 | Friday | Ninoy Aquino Day |
| November 1 | Sunday | All Saints' Day |
| November 2 | Monday | All Souls' Day |
| December 8 | Tuesday | Feast of the Immaculate Conception |
| December 24 | Thursday | Christmas Eve |
| December 31 | Thursday | Last Day of the Year |

**Special Working Day:** February 25 (Wednesday) — EDSA People Power Revolution Anniversary

**Eid'l Adha:** Date not yet proclaimed (expected ~June 7, 2026 based on Islamic calendar).

### Push Notification Sequence (Build 6 — Deadline Watcher)
For each deadline, KA sends reminders at:
- **7 days before** — "Heads up: [form] is due on [date]. Handa ka na ba?"
- **3 days before** — "3 days na lang para sa [form]. Kailangan mo ng tulong sa computation?"
- **1 day before** — "Bukas na ang deadline ng [form]! File na para walang penalty."
- **Day of** (morning) — "Today ang deadline ng [form]. I-file mo na ngayon."

---

## 3. Tax Rate Tables

### A. 8% Flat Tax (Self-Employed / Professionals)

**Eligibility:**
- Non-VAT registered individual
- Gross sales/receipts ≤ ₱3,000,000/year
- Must elect 8% option (not automatic — stated on 1701Q)

**Computation:**
```
Tax = (Gross Sales − ₱250,000) × 8%
```

**Example (Ana — freelance creative, ₱1,200,000/year gross):**
```
Tax = (₱1,200,000 − ₱250,000) × 8% = ₱76,000
```

**Key rules:**
- ₱250,000 exemption/reduction applies **only if purely self-employed** (no compensation income)
- If mixed-income earner: 8% applies on gross sales **without** the ₱250,000 reduction (the reduction is applied on the compensation side)
- **No itemized deductions** — 8% is on gross, not net
- **Replaces both** graduated income tax AND 3% percentage tax (exempt from 2551Q)

### B. Graduated Income Tax Rates (TRAIN Law — effective 2023 onwards, applies through 2026)

| Annual Taxable Income | Tax Due |
|----------------------|---------|
| ₱0 – ₱250,000 | **0%** (Exempt) |
| ₱250,001 – ₱400,000 | **15%** of excess over ₱250,000 |
| ₱400,001 – ₱800,000 | ₱22,500 + **20%** of excess over ₱400,000 |
| ₱800,001 – ₱2,000,000 | ₱102,500 + **25%** of excess over ₱800,000 |
| ₱2,000,001 – ₱8,000,000 | ₱402,500 + **30%** of excess over ₱2,000,000 |
| Over ₱8,000,000 | ₱2,202,500 + **35%** of excess over ₱8,000,000 |

**Deduction options (choose one):**
- **Itemized deductions** — actual documented expenses
- **Optional Standard Deduction (OSD)** — 40% of gross sales/receipts (no documentation needed)

### C. VAT (Value Added Tax)

| Item | Rate |
|------|------|
| Output VAT | **12%** on gross sales |
| Input VAT | Credit for VAT paid on purchases |
| Net VAT payable | Output VAT − Input VAT |

### D. Percentage Tax (Non-VAT)

| Item | Rate |
|------|------|
| Percentage tax (2551Q) | **3%** of gross sales/receipts |
| Who pays | Non-VAT taxpayers using graduated rates (NOT 8% flat) |

### E. Expanded Withholding Tax (EWT) — BIR Form 2307

**What is EWT?** The payer (client/customer/platform) withholds a percentage of the payment and remits it to BIR on behalf of the payee (income earner). The payee receives a **BIR Form 2307** (Certificate of Creditable Tax Withheld at Source) as proof. The withheld amount is a **tax credit** — deducted from the payee's income tax due on their quarterly/annual ITR.

**EWT Rates (RR 2-98 as amended):**

| Income Type | EWT Rate | Classification | Examples |
|------------|----------|----------------|----------|
| Professional fees (PRC-regulated profession, gross ≤ ₱3M) | **5%** | Individual practicing a profession regulated by PRC | CPAs, lawyers, architects, engineers, doctors, dentists |
| Professional fees (PRC-regulated profession, gross > ₱3M) | **10%** | Individual practicing a profession regulated by PRC, exceeding ₱3M gross | Same as above but higher-earning |
| Contractor/subcontractor income | **2%** | Business services, non-PRC-regulated | Interior design firms (PSIC 82990), construction, cleaning services, IT contractors, marketing agencies |
| Platform seller withholding (e-marketplace) | **1%** | Electronic marketplace operators withholding on sellers (per RR 16-2023) | Shopee, Lazada withholding on seller payouts |

**Key distinctions for KA:**
- **Professional vs contractor** is determined by whether the profession is **PRC-regulated** (Professional Regulation Commission), NOT by the nature of the work. Interior design is NOT PRC-regulated — it's classified as business services (typically PSIC 82990), so the 2% rate applies.
- **PSIC code** (Philippine Standard Industrial Classification) on the COR is the authoritative indicator of business classification for withholding purposes.
- The **payer** (client) is the withholding agent — they're responsible for remitting and issuing the 2307.
- The **payee** (service provider) claims the withheld amount as a tax credit on their ITR.

**How EWT credits work:**
```
Example: Maria hires a freelance photographer (business service, 2% EWT)
Payment: ₱50,000
EWT withheld: ₱50,000 × 2% = ₱1,000
Photographer receives: ₱49,000 + BIR Form 2307
Photographer claims ₱1,000 as tax credit on their 1701Q/1701A
```

**Platform seller context (Jose persona):**
Shopee/Lazada withhold **1%** EWT on seller payouts (per RR 16-2023). The platform issues 2307 certificates — usually downloadable from the seller dashboard. Jose should:
1. Download 2307 certificates from platform seller center
2. Track total EWT withheld per quarter
3. Claim as tax credit on 1701Q quarterly and 1701A annual filings

**When is a business the withholding agent?**
A business becomes a withholding agent when it pays for professional services or contractor work. Key trigger: if your business pays another individual or company for services, you may need to withhold EWT and issue a 2307. This is common but often missed by MSMEs.

---

## 4. VAT Threshold Rules

### The ₱3,000,000 Threshold

| Gross Sales/Receipts | Tax Status | Consequence |
|---------------------|------------|-------------|
| ≤ ₱3,000,000 | Non-VAT | Can choose 8% flat OR graduated rates + 3% percentage tax |
| > ₱3,000,000 | **Mandatory VAT registration** | Must register as VAT, charge 12% output VAT, file 2550Q quarterly |

### When KA Should Alert Users (Build 6 Integration)
- **At ₱2,400,000 (80% of threshold):** "Malapit ka na sa ₱3M VAT threshold. Kung lumampas ka, kailangan mo ng VAT registration. Magkonsulta sa CPA para sa best approach."
- **At ₱2,700,000 (90%):** Stronger warning with CPA referral
- **At ₱3,000,000+:** "Lampas ka na sa ₱3M. Legally, kailangan mo ng VAT registration sa BIR. Kumonsulta agad sa CPA."

### VAT Registration Process (for KA awareness — NOT advice)
1. File BIR Form 1905 (update registration)
2. Get updated COR reflecting VAT registration
3. Start charging 12% VAT on all sales
4. File 2550Q quarterly (instead of 2551Q)

**Note:** The ₱500 annual registration fee (Form 0605) was **abolished effective January 22, 2024** under the EOPT Act (RA 11976). KA should NOT remind users to pay this fee.

### Key VAT Facts for KA
- VAT is **on top of** the selling price (not included unless explicitly stated)
- Input VAT (VAT paid on purchases) can be **credited** against output VAT
- Net VAT payable = Output VAT − Input VAT
- VAT is filed and paid **quarterly** via 2550Q

---

## 5. Common BIR Mistakes by Persona

### Maria (Home Baker / Food Seller — ₱80K–₱250K/month)
- **Forgetting quarterly deadlines** — focused on daily operations, BIR deadlines sneak up. KA's Deadline Watcher (Build 6) directly solves this.
- **Not keeping receipts for purchases** — buys ingredients in palengke (wet market) without OR. Makes it hard to claim itemized deductions. KA can suggest OSD (40% flat deduction) as alternative.
- **Not knowing which form to file** — confused between 1701Q and 2551Q. Doesn't know she might be eligible for 8% flat tax.
- **Not separating personal and business expenses** — uses one GCash for everything. KA's expense tracking helps here.
- **Approaching VAT threshold unknowingly** — if Maria's baking business grows past ₱250K/month consistently, she may cross ₱3M annual. KA should monitor and alert.
- **Not issuing 2307 when paying subcontractors** — if Maria hires a freelance delivery driver or food photographer, she may be required to withhold EWT and issue a 2307. Most MSMEs don't know they can be withholding agents.

### Jose (Online Seller — Shopee/Lazada)
- **Miscalculating VAT on platform sales** — Shopee/Lazada already withhold expanded withholding tax (EWT). Jose may not know this counts toward his tax. Can lead to double-counting or under-reporting.
- **Not tracking input tax credits** — pays VAT on inventory purchases but doesn't claim credits on 2550Q. Overpays VAT.
- **Late filing of 2550Q** — quarterly VAT return due on the 25th. If VAT-registered, missing this means 25% surcharge + interest.
- **Confusing gross sales with net sales** — Shopee shows gross, but after commissions and fees, actual income is lower. BIR taxes on gross receipts, not net profit.
- **Not declaring COD payments** — Cash-on-delivery payments may not show in GCash/bank. Still taxable income.
- **Not downloading 2307 certificates from platform** — Shopee/Lazada issue 2307s for the 1% EWT they withhold. These are usually in the Seller Center Finance section. Jose needs to download and attach these to quarterly/annual ITR to claim the tax credit. Missing 2307s = overpaying tax.

### Ana (Freelance Creative — ₱25K–₱80K/month)
- **Thinking 8% flat tax allows deductions** — it does NOT. 8% is on gross income (minus ₱250K). No itemized deductions, no OSD. If Ana has high expenses, graduated rates + itemized deductions might actually be cheaper.
- **Not knowing quarterly filing schedule** — thinks "annual return" means she only files once a year. 1701Q is due Q1-Q3 even on 8% flat.
- **Not filing when income is low** — BIR requires quarterly filing **regardless of income** as long as you're registered. Zero-income quarters still need filing.
- **Mixed income confusion** — if Ana has a part-time job + freelance, the ₱250K reduction on 8% doesn't apply to the freelance side (it's applied to compensation income instead).
- **Not collecting 2307 from clients** — when Ana's clients withhold EWT (5% if PRC-regulated profession, 2% if contractor), they should issue a 2307. Ana needs to collect these and claim as tax credits. Many freelancers don't ask for 2307s and end up double-paying.

### Andoy (Sari-Sari / Micro-Retail — ₱500–₱3,000/day)
- **Not being registered at all** — many sari-sari stores operate informally. BIR registration is required for any business earning income. KA should gently guide toward formalization, not guilt.
- **Mixing personal and business income** — all money goes into one pocket or one GCash wallet. No separation means no visibility into actual business profit.
- **Not knowing about the 8% option** — if Andoy's annual gross is under ₱3M (likely for most sari-sari), 8% flat is the simplest path. One form (1701Q quarterly + 1701A annual), no percentage tax.
- **Cash basis means no paper trail** — customers pay cash, suppliers paid cash. Andoy may not have receipts for either side. Makes compliance very difficult without help.

---

## 6. BIR Terminology Glossary

> Cross-referenced with `shared/glossary.md`. This section adds deeper tax context.

| Term | Filipino Usage | English Definition | KA Context |
|------|---------------|-------------------|------------|
| **TIN** | "TIN number ko" | Taxpayer Identification Number — unique 9-12 digit ID | Required for all BIR transactions. KA can store but never display full TIN. |
| **COR** | "Certificate of Registration" | BIR Certificate of Registration — proves business is BIR-registered | Must be displayed in place of business. COR is one-time. The ₱500 annual registration fee was **abolished** under EOPT Act (Jan 2024) — KA should NOT remind users to pay it. |
| **OR** | "Oficial Resibo" / "Official Receipt" | BIR-registered sequentially-numbered receipt for services | AKBai needs BIR legal sign-off before generating OR numbers (Gap D3). |
| **SI** | "Sales Invoice" | Document for sale of goods (vs. OR for services) | Required for VAT-registered sellers. |
| **VAT** | "VAT" (used as-is) | Value Added Tax — 12% on gross sales when registered | Triggered when gross > ₱3M/year. Jose persona's primary concern. |
| **Percentage Tax** | "percentage tax" or "3%" | 3% tax on gross for non-VAT graduated-rate taxpayers | Not applicable if using 8% flat tax option. |
| **EWT** | "withholding tax" | Expanded Withholding Tax — withheld by payer and remitted to BIR | Rates: 2% (contractors), 5% (professionals ≤ ₱3M), 10% (professionals > ₱3M), 1% (e-marketplace). Withheld amount = tax credit on ITR. See §3E. |
| **2307** | "2307" or "withholding certificate" | BIR Form 2307 — Certificate of Creditable Tax Withheld at Source | Issued by payer to payee as proof of EWT withheld. Payee attaches to ITR to claim tax credit. |
| **PSIC** | "PSIC code" | Philippine Standard Industrial Classification — industry code on COR | Determines business classification for EWT rate purposes. E.g., 82990 = Other Business Support Services (2% EWT). |
| **RDO** | "RDO ko" | Revenue District Office — local BIR office where taxpayer is registered | Transfer of RDO needed if business moves to a different city. |
| **ITR** | "ITR" | Income Tax Return — generic term for 1701Q/1701A/1701/1702Q/1702 | KA uses the specific form number, not just "ITR." |
| **OSD** | "OSD" | Optional Standard Deduction — 40% of gross sales as deduction | Alternative to tracking every single receipt. Good suggestion for Maria/Andoy. |
| **TRAIN Law** | "TRAIN" | Tax Reform for Acceleration and Inclusion (RA 10963) | Basis for current tax brackets. Took effect in 2018, latest brackets from 2023 onwards. |
| **RMC** | "RMC" | Revenue Memorandum Circular — BIR guidance on specific tax rules | Can change deadlines, forms, or interpretation. KA should note when rules are based on specific RMCs. |
| **eFPS** | "eFPS" | Electronic Filing and Payment System — online filing via BIR portal | Required for some taxpayers. Most MSMEs can use eBIRForms instead. |
| **eBIRForms** | "eBIRForms" | BIR's offline filing software — download, fill, submit | More common for individual taxpayers and small businesses. |

---

## 6b. 2026 Regulatory Updates

### BIR Audit Resumption (RMC 8-2026, RMO 1-2026)
BIR lifted the nationwide suspension of tax audits effective early 2026. Key rules:
- Only **one electronic Letter of Authority (eLA)** per taxpayer per taxable year
- Consolidation of pending eLAs began March 4, 2026 (RMC 14-2026)
- MSMEs should expect increased audit activity in 2026
- KA should NOT advise on audits but can note: "Paalala: mas active ang BIR sa tax audits ngayong 2026. I-organize mo ang records mo."

### Cross-Border Services (RMC 24-2026)
Clarifies that cross-border services are NOT automatically taxable in the Philippines. BIR revenue officers must prove 4 elements before assessing tax. Relevant for **Ana persona** (freelancers with foreign clients) — reduces anxiety about foreign-sourced income.

### ORUS Books of Accounts (RMC 4-2026)
All taxpayers must register books of accounts via BIR's Online Registration and Update System (ORUS). Manual registration at RDO is only allowed when ORUS is down (must show error screenshot). Deadlines were extended in January 2026 due to system issues.

### eBIRForms v7.9.5.0
Current version as of April 2026. Supports all forms for CY 2025 AITR filing. Available at bir.gov.ph/ebirforms. Form 1701-MS is NOT included — see §1 note.

### BIR Withholding Tax Calculator
BIR now has an official withholding tax calculator at bir.gov.ph/wtcalculator. KA can reference this when users ask about EWT computation.

---

## 7. How This File Connects to the Codebase

### Current (Reference)
- Source material for TAX_SCOPE in `scopes.ts` — enriches boundary rules with actual data
- Feeds Build 6 (Deadline Watcher) — calendar data drives push notification scheduling
- Informs Kilala Kita (Build 1) — business type → inferred BIR obligations

### Build 1 Integration
- Forms-by-business-type mapping (§1) → injected into `business-context.ts` Layer 2.5 (see design spec in `context_update.md`)
- KA can infer: "Maria is a food seller → she likely needs 1701Q quarterly and 1701A annually"

### Build 6 Integration (Deadline Watcher)
- Deadline calendar (§2) → stored in `bir_deadlines` Supabase table or constants file
- Push notification sequence (§2) → drives the 7/3/1-day reminder logic
- VAT threshold alerts (§4) → triggered by cumulative gross income tracking

### Regression Testing
- 5 test cases to verify KA uses correct forms:
  1. Maria (food seller, non-VAT) → mentions 1701Q, 1701A, possibly 2551Q
  2. Jose (online seller, VAT) → mentions 1701Q, 1701A, 2550Q
  3. Ana (freelancer, 8% flat) → mentions 1701Q, 1701A, does NOT mention 2551Q
  4. Andoy (sari-sari, unregistered) → guides toward registration, mentions 8% option
  5. Any user approaching ₱3M → mentions VAT threshold alert

---

## Sources

### Primary (BIR official)
- [BIR Interactive Tax Calendar 2026](https://www.bir.gov.ph/tax-reminder) — replaced printed PDF calendars per RMC 110-2025
- [RMC 20-2026 Full Text (BIR CDN)](https://bir-cdn.bir.gov.ph/BIR/pdf/RMC%2020-2026.pdf) — AITR filing guidelines for CY 2025

### Tax calendars & deadline references
- [PwC 2026 Tax Calendar](https://www.pwc.com/ph/en/client-accounting-services/2026-tax-calendar.html) — month-by-month BIR, SEC, and agency deadlines
- [Grant Thornton 2026 Tax Calendar](https://www.grantthornton.com.ph/insights/publications/tax-calendar/2026-tax-calendar/) — comprehensive alternative calendar

### Rate tables & tax guides
- [PwC Philippines Tax Summary](https://taxsummaries.pwc.com/philippines/individual/taxes-on-personal-income) — graduated rates, 8% flat tax (reviewed Dec 2025)
- [Taxumo BIR Tax Table 2026](https://www.taxumo.com/blog/bir-tax-table-2026/) — rates + SSS/PhilHealth/Pag-IBIG contribution tables

### RMC & compliance guides
- [CloudCFO: RMC 20-2026 AITR Filing Guidelines](https://cloudcfo.ph/blog/bir-aitr-filing-guidelines-cy-2025/) — detailed RMC 20-2026 breakdown
- [Taxumo: RMC 20-2026 Explainer](https://help.taxumo.com/en/articles/14107192-understanding-rmc-20-2026-key-updates-for-bir-forms-1701ms-1701-and-1701a)
- [2026 BIR Annual Compliance Checklist](https://www.aureadalaw.com/post/2026-bir-annual-compliance-checklist-philippines-inventory-list-loose-leaf-alphalist-and-itr-d)
- [BIR Compliance Philippines 2026 Guide](https://philippinehubpartners.com/bir-tax-compliance-philippines-2026-guide/)
- [CloudCFO: RR 29-2025 De Minimis Benefits Update](https://cloudcfo.ph/blog/ph-tax-update-2026-rr-29-2025-de-minimis-benefits/) — updated employee benefit limits effective Jan 2026

### New sources added April 2026
- [Deloitte Tax@Hand: AITR Filing Guidelines CY 2025](https://www.taxathand.com/article/41066/Philippines/2026/Annual-income-tax-return-filing-and-payment-guidelines-for-calendar-year-2025-issued)
- [Triple-i Consulting 2026 Tax Calendar](https://www.tripleiconsulting.com/2026-tax-calendar-for-bir-compliance-philippines/)
- [Reyes Tacandong & Co. RMC Summaries](https://www.reyestacandong.com/)
- [IGD & Associates BIR Circular Analysis](https://igd-associates.com/)
- [BIR Withholding Tax Calculator](https://www.bir.gov.ph/wtcalculator)
- [CloudCFO: BIR Audit Resumption](https://cloudcfo.ph/blog/bir-audit-resumption-and-new-rules/)
- [RMC 24-2026 Analysis (Reyes Tacandong)](https://www.reyestacandong.com/rmc-no-24-2026/)
