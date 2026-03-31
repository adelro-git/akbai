# Plan: KA Domain Knowledge Base — Context Files Before Build 1

> Saved from Sprint 1 retro + planning session (2026-03-20)
> Use this plan to guide a dedicated context-building session.

## Context

Build 0 (system prompt architecture) is complete. The prompt assembler is wired with 3 domain scopes (tax, financial, communication) in `frontend/src/lib/claude/prompts/scopes.ts`. However, these scopes only contain **boundary rules** (what KA can/cannot do) — not actual domain knowledge.

**The problem:** KA knows it can "track BIR deadlines" but doesn't know when 1701Q is due. It knows Maria is a food seller but has no idea what a typical food seller's cost structure looks like. It has Taglish voice rules but the Taglish manual (`taglish-manual.md`) is 100% placeholder — all 10 sections say "Awaiting entries."

**Why this is a hard gate:** Without domain knowledge, Build 1 (Kilala Kita onboarding) will produce a KA that asks the right questions but can't give meaningful first responses. The "Maria Moment" requires KA to actually know something about Maria's business — not just know its own boundaries.

---

## Files to Create/Populate (4 files)

### File 1: BIR Knowledge Base (CRITICAL — blocks Build 6, informs Build 1)
**Path:** `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md`
**Purpose:** Actual BIR data KA needs to give useful tax reminders
**Est. effort:** 3–4 hrs (research from BIR.gov.ph public data)
**Needs Anton input:** Review for accuracy (data is public)

**Sections:**
1. **BIR Forms by Business Type** — Mapping table: business type → required forms → filing frequency
   - Sole proprietor (non-VAT): 1701Q quarterly, 1701A annual, 2551Q quarterly
   - Sole proprietor (VAT): 2550M monthly, 2550Q quarterly, 1701Q quarterly, 1701A annual
   - 8% flat tax professional: 1701Q quarterly (simplified), 1701A annual
   - Corporation: 1702Q quarterly, 1702 annual, 2551Q quarterly
2. **Filing Deadline Calendar** — Month-by-month: which forms are due, on which day
   - Standard BIR deadline patterns (15th, 20th, 25th)
   - Annual deadlines: April 15 (1701A), etc.
   - Quarterly patterns: April/Aug/Nov 15 for 1701Q
3. **Tax Rate Tables**
   - 8% flat tax: 8% of gross income exceeding ₱250K (no deductions)
   - Graduated rates: 0-250K exempt, 250K-400K 15%, 400K-800K 20%, 800K-2M 25%, 2M-8M 30%, 8M+ 35%
   - VAT: 12% output tax, input tax credits
   - Percentage tax: 3% (for non-VAT, if applicable)
4. **VAT Threshold Rules** — ₱3M gross receipts, registration requirements, consequences
5. **Common BIR Mistakes by Persona**
   - Maria: forgetting quarterly deadlines, not keeping receipts, not knowing which form to file
   - Jose: miscalculating VAT, not tracking input tax credits, late filing of 2550M
   - Ana: thinking 8% flat tax allows deductions (it doesn't), not knowing quarterly schedule
   - Andoy: not being registered at all, mixing personal and business income
6. **BIR Terminology Glossary** — Filipino-English terms (TIN, COR, OR, SI, VAT, percentage tax, withholding tax, RDO)

### File 2: MSME Business Knowledge (HIGH — informs personalization)
**Path:** `akbai-delivery/skills/ai-engineer/references/msme-business-knowledge.md`
**Purpose:** Industry-specific knowledge so KA understands each business type's economics
**Est. effort:** 3–4 hrs (synthesis + Anton's domain knowledge)
**Needs Anton input:** YES — validate margins, cost structures, seasonal patterns

**Sections:**
1. **Food/Baking Business Profile**
   - Typical cost structure: ingredients 40-50%, packaging 5-10%, delivery 10-15%, overhead 5-10%
   - Revenue patterns: order-based, seasonal peaks (Christmas, fiestas, graduation, Valentine's)
   - Common expense categories: ingredients, packaging, delivery fees, utilities, equipment
   - Cash flow pattern: cash out before cash in (buy ingredients → cook → deliver → collect)
   - Common financial blind spots: not tracking delivery costs as expense, underpricing for ingredients inflation
   - Pain timing: end of month (BIR), daily (receipt chaos), peak seasons (DM overload)
2. **Online Selling Business Profile**
   - Platform fee structures: Shopee commission (~5-8%), Lazada commission, COD fees, shipping subsidies
   - Typical margins: 15-30% depending on product category
   - Revenue patterns: campaign spikes (9.9, 11.11, 12.12), steady baseline
   - Cash flow: delayed settlements (Shopee pays 3-7 days after delivery confirmation)
   - GCash reconciliation challenges: batch payments, mixed personal/business
   - Common financial blind spots: not tracking platform fees, not accounting for returns/refunds
3. **Freelance/Creative Business Profile**
   - Income patterns: project-based, variable month to month, feast-or-famine
   - Common rate structures: per-project, retainer, hourly
   - Invoice cycle: net 15 or net 30, common late payment (~40% of clients pay late)
   - Expenses: software subscriptions, internet, equipment
   - Tax: 8% flat tax simplicity (if <₱3M gross), quarterly filing
   - Common blind spots: not invoicing promptly, not tracking time per client
4. **Sari-Sari/Retail Business Profile** (Phase 3 — lighter coverage)
   - Daily cash flow: ₱500–₱3,000/day gross, thin margins (15-25%)
   - Inventory: buy wholesale, sell retail, spoilage risk
   - Utang (credit): 10-20% of sales on credit, significant write-offs
   - Cash/personal money mixing: biggest visibility problem
5. **Common Across All Filipino MSMEs**
   - GCash as primary payment — daily limits, fees, settlement timing
   - Facebook as primary sales channel — DM-based ordering
   - Seasonal patterns: Christmas rush (Oct-Dec), back-to-school (June), fiesta season, Valentine's
   - Common financial blind spots: not separating personal/business, not tracking delivery costs

### File 3: Kilala Kita Onboarding Context (HIGH — directly needed for Build 1)
**Path:** `akbai-delivery/skills/ai-engineer/references/kilala-kita-context.md`
**Purpose:** What KA should know/infer at each onboarding step to give intelligent first responses
**Est. effort:** 2–3 hrs (synthesis from persona docs + business knowledge)
**Needs Anton input:** YES — approve the first KA messages (first impression is everything)

**Sections:**
1. **Step-by-Step KA Knowledge Map** — What KA now knows after each step
   - After Step 2 (business type): inferred BIR form, likely pain points, relevant features
   - After Step 3 (income range): tax complexity, tier fit, VAT proximity
   - After Step 4 (pain point): feature prioritization, Morning Briefing emphasis
   - After Step 5 (BIR consent): full personalization unlocked
2. **First KA Message After Onboarding** — 16 combinations (4 business types × 4 pain points)
   - Each: 1–2 line Taglish opening demonstrating KA "gets" the user
   - Example: Food + Receipt tracking → "Maria, sisimulan ko nang i-organize ang expenses mo. I-scan mo ang first receipt mo — papakita ko sa'yo kung saan napupunta ang pera mo."
   - Example: Online Selling + Knowing earnings → "Jose, tara — i-track natin ang actual profit mo. Hindi lang sales ha — kasama na ang platform fees, shipping, at returns."
3. **Personalization Variables Set by Kilala Kita**
   - Which variables are stored in user profile and how they flow to the prompt assembler
   - How they affect model routing, scope selection, and feature emphasis
4. **Escalation to CPA Timing** — When does KA suggest professional help per business type
   - Income approaching ₱3M → VAT registration conversation
   - First time filing → suggest CPA consultation
   - Complex business structure question → immediate redirect

### File 4: Taglish Manual Population (MEDIUM — Design Gate #3 prerequisite)
**Path:** `akbai-delivery/skills/ux-designer/references/taglish-manual.md` (existing placeholder)
**Purpose:** Populate all 10 empty sections with real do/don't examples
**Est. effort:** 3–4 hrs (creative writing + Anton review)
**Needs Anton input:** YES — his Taglish ear is essential for naturalness

**Sections to populate (all currently "Awaiting entries"):**
1. Greetings and Openers — 8-10 do/don't pairs with context
2. Financial Amounts and Numbers — 6-8 pairs
3. BIR and Tax Topics — 8-10 pairs (critical for compliance tone)
4. Error Messages and Recovery — 6-8 pairs
5. Empty States and Onboarding — 6-8 pairs
6. Confirmations and Success — 4-6 pairs
7. Asking Permission — 4-6 pairs
8. Push Notifications — 6-8 pairs
9. Button Labels and CTAs — approved labels list
10. Words/Phrases to Always/Never Use — 10+ entries each list

---

## How These Files Connect to the Codebase

### Short-term (this session): Reference documents
- Files live in `akbai-delivery/skills/ai-engineer/references/` and `skills/ux-designer/references/`
- They inform prompt writing and are source material for scope enrichment
- The prompt assembler doesn't load them at runtime — they're the "textbook" behind the prompts

### Medium-term (Build 1+): Enrich scope prompts in `scopes.ts`
- Add BIR form-to-business-type mapping directly into TAX_SCOPE
- Add common mistake warnings per business type
- Create business-type-specific context snippets loaded based on user's `business_type`
- Estimated additional tokens per call: ~200-400 (targeted, not full dump)

### Regression testing
- Taglish manual + BIR knowledge → feed into the prompt regression test library (Design Gate #3)
- Test cases verify KA uses correct BIR forms for each business type
- Test cases verify Taglish patterns match the manual

---

## Priority Order

| # | File | Priority | Blocks |
|---|------|----------|--------|
| 1 | BIR Knowledge Base | CRITICAL | Build 6 directly, informs Build 1 personalization |
| 2 | Kilala Kita Context | HIGH | Build 1 — KA's first meaningful responses |
| 3 | MSME Business Knowledge | HIGH | Build 1 quality — the "Maria Moment" needs business depth |
| 4 | Taglish Manual | MEDIUM | Design Gate #3, feeds regression test fixtures |

---

## Session Workflow

When you start the dedicated context-building session, follow this order:

1. **Start with BIR Knowledge Base** — mostly researchable from public BIR data. Claude can draft 90% of this. You review for accuracy.
2. **Then MSME Business Knowledge** — needs your domain knowledge. Claude drafts structure, you fill in real numbers and validate.
3. **Then Kilala Kita Context** — derives from Files 1 + 2. Claude proposes the 16 opening messages, you approve/edit for naturalness.
4. **Finally Taglish Manual** — the most collaborative. Claude drafts entries from the existing copy guide patterns, you validate with your Taglish ear.

After all 4 files are created:
- Enrich `scopes.ts` with key knowledge from File 1 (BIR forms mapping)
- Update `gap-registry.md` to note knowledge prereqs as resolved
- Write 3 integration test prompts to verify KA responses are substantive

---

## Research vs. Anton Co-Write

| File | Public sources | Anton review | Anton co-write |
|------|---------------|-------------|---------------|
| BIR Knowledge Base | 90% (BIR.gov.ph) | Yes — accuracy check | No |
| MSME Business Knowledge | 50% (market research) | Yes — validate all numbers | Yes — his MSME network |
| Kilala Kita Context | 70% (derives from personas) | Yes — approve opening messages | Partially — 16 first messages |
| Taglish Manual | 30% (extend copy guide) | Yes — essential | Yes — provide/validate examples |

---

## Verification Checklist

- [ ] BIR Knowledge Base: Cross-check 5 random deadlines against BIR.gov.ph RMCs
- [ ] MSME Business Knowledge: Anton reviews food/baking cost structure (primary persona)
- [ ] Kilala Kita Context: Walk through 5-step flow — does KA's response at each step feel intelligent?
- [ ] Taglish Manual: Read 10 random entries aloud — do they sound natural to a Filipino ear?
- [ ] Integration check: Write 3 test prompts using new knowledge → verify KA responses are substantive
- [ ] `scopes.ts` enriched with BIR form-to-business-type mapping
- [ ] `gap-registry.md` updated

---

## File 5: Business-Type Context Loader — Design Spec (BUILD 1 PREREQUISITE)

> This section is a **design spec only** — no implementation in this session.
> To be implemented during Build 1 before the Kilala Kita onboarding flow ships.

### Problem

The prompt assembler (`assemble.ts`) currently injects `{{business_type}}` as a string template variable, but all users get the **same** scope content regardless of business type. A food seller and a freelancer see identical TAX_SCOPE and FINANCIAL_SCOPE prompts.

The 4 knowledge files created in this session give KA the *source material*, but without a runtime loader, KA can't use business-type-specific knowledge when talking to users.

### Proposed Architecture

```
assemble.ts (existing)
  ├── Layer 1: Core Persona          (unchanged)
  ├── Layer 2: Domain Scopes         (unchanged — boundary rules)
  ├── Layer 2.5: Business Context    ← NEW LAYER
  │   └── Loads a context snippet based on user's business_type
  ├── Layer 3: Feature Context       (unchanged)
  └── Layer 4: User Context          (unchanged)
```

### New File: `frontend/src/lib/claude/prompts/business-context.ts`

```typescript
// Business-type-specific knowledge snippets injected at Layer 2.5
// Sourced from: msme-business-knowledge.md + bir-knowledge-base.md

export type BusinessType = 'food_baking' | 'online_selling' | 'freelance_creative' | 'sari_sari_retail';

export const BUSINESS_CONTEXT: Record<BusinessType, string> = {
  food_baking: `
    [BUSINESS CONTEXT: Food/Baking]
    - Typical cost structure: ingredients 40-50%, packaging 5-10%, delivery 10-15%
    - Cash flow: cash out before cash in (buy → cook → deliver → collect)
    - BIR: 1701Q quarterly, 1701A annual. If VAT-registered: 2550M monthly
    - Peak seasons: Christmas, fiestas, graduation, Valentine's
    - Common blind spots: not tracking delivery costs, underpricing for inflation
  `,
  online_selling: `...`,   // From msme-business-knowledge.md §2
  freelance_creative: `...`, // From msme-business-knowledge.md §3
  sari_sari_retail: `...`,   // From msme-business-knowledge.md §4 (lighter, Phase 3)
};
```

### Changes to `assemble.ts`

```typescript
// In assemblePrompt():
const layers = [
  CORE_PERSONA,
  ...selectedScopes.map(s => SCOPE_PROMPTS[s]),
  BUSINESS_CONTEXT[input.businessType],  // ← NEW: Layer 2.5
  FEATURE_PROMPTS[input.feature],
  buildUserContext(input),
];
```

### Token Budget

| Layer | Current tokens | With business context |
|-------|---------------|---------------------|
| Core Persona | ~800 | ~800 (unchanged) |
| Scopes (avg 2) | ~600 | ~600 (unchanged) |
| **Business Context** | 0 | **~150-250** (targeted snippets) |
| Feature Prompt | ~300 | ~300 (unchanged) |
| User Context | ~100 | ~100 (unchanged) |
| **Total** | ~1,800 | **~2,000-2,050** |

Acceptable — stays well under the 4K system prompt target.

### Kilala Kita First-Response Integration

The 16 first-response templates (from `kilala-kita-context.md` File 3) should be handled in the onboarding flow itself, **not** in the prompt assembler. Proposed approach:

```typescript
// In the onboarding completion handler:
const firstMessage = getFirstKAMessage(businessType, primaryPainPoint);
// → Returns pre-written Taglish opening from a lookup table
// → This is NOT a Claude API call — it's a static template
```

This avoids spending an API call on a message we can craft perfectly in advance, and ensures the critical first impression is consistent.

### Implementation Checklist (for Build 1)

- [ ] Create `business-context.ts` with snippets extracted from knowledge files
- [ ] Add `BusinessType` to `types.ts`
- [ ] Update `assemble.ts` to inject Layer 2.5
- [ ] Add `businessType` to `PromptAssemblyInput` type
- [ ] Create first-response lookup table for Kilala Kita (16 templates)
- [ ] Write unit tests: correct context loaded per business type
- [ ] Write integration test: full prompt assembly with business context stays under 4K tokens

---

## Key Files Summary

| File | Action |
|------|--------|
| `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md` | **CREATE** |
| `akbai-delivery/skills/ai-engineer/references/msme-business-knowledge.md` | **CREATE** |
| `akbai-delivery/skills/ai-engineer/references/kilala-kita-context.md` | **CREATE** |
| `akbai-delivery/skills/ux-designer/references/taglish-manual.md` | **POPULATE** (existing placeholder) |
| `akbai-delivery/shared/gap-registry.md` | **UPDATE** (note knowledge prereqs) |
| `frontend/src/lib/claude/prompts/scopes.ts` | **ENRICH** (after knowledge files reviewed) |
| `frontend/src/lib/claude/prompts/business-context.ts` | **CREATE in Build 1** (design spec in this doc) |
