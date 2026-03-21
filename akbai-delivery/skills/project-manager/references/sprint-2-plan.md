# Sprint 2 Plan — 2026-03-21 to 2026-04-04
**Phase:** 0A — Build 0 Complete, Pre-Build 1 Knowledge Foundation
**Sprint Goal:** Create the 4 KA domain knowledge files so Build 1 (Kilala Kita) can deliver the "Maria Moment" — KA's first response that proves it actually understands the user's business.
**Capacity:** 12 hours (conservative — context writing is collaborative and draining)

## Tasks (ordered by priority — work top-down)

| # | Task | Size | Est. Hrs | Priority | Dependencies | Confidence |
|---|------|------|----------|----------|--------------|------------|
| 1 | BIR Knowledge Base | M | 3 | CRITICAL — blocks Build 6, informs Build 1 | None | High |
| 2 | MSME Business Knowledge | M | 3 | HIGH — enables the "Maria Moment" personalization | None (parallel with Task 1) | Medium |
| 3 | Kilala Kita Onboarding Context | S | 2 | HIGH — directly needed for Build 1 | Tasks 1 + 2 (derives from both) | Medium |
| 4 | Taglish Manual Population | M | 2.5 | MEDIUM — Design Gate #3 prerequisite | None (parallel) | Low |
| 5 | Scopes Enrichment + Gap Registry Update | XS | 1 | HIGH — wires knowledge into runtime | Tasks 1 + 2 + 3 | High |

**Total estimated:** 11.5 hrs / 12 hrs capacity
**Buffer:** 0.5 hrs (tight — but tasks are well-scoped content work, not coding)

---

### Task 1: BIR Knowledge Base (M — 3 hrs)
**Why:** CRITICAL gap — KA can't track deadlines it doesn't know. Blocks Build 6 (Deadline Watcher) and informs Build 1 personalization. 90% researchable from public BIR data.
**Path:** `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md`

- [ ] Research BIR.gov.ph for current filing forms by business type (sole prop non-VAT, sole prop VAT, 8% flat tax, corporation) and draft the forms-to-business-type mapping table
- [ ] Build the month-by-month filing deadline calendar with standard BIR patterns (15th, 20th, 25th) and annual/quarterly specifics
- [ ] Draft tax rate tables (8% flat, graduated brackets, VAT 12%, percentage tax 3%) and VAT threshold rules (₱3M)
- [ ] Write "Common BIR Mistakes by Persona" section — one paragraph each for Maria, Jose, Ana, Andoy with their specific pitfalls
- [ ] Draft BIR Terminology Glossary — Filipino-English terms (TIN, COR, OR, SI, VAT, percentage tax, withholding tax, RDO)
- [ ] Add "Last verified: 2026-03-XX | Tax year: 2026" header — flag any rules that changed recently via RMCs
- [ ] **Anton review:** Cross-check 5 random deadlines against BIR.gov.ph RMCs for accuracy

**Done when:** File exists with all 6 sections populated, Anton has reviewed the forms-by-business-type mapping and confirmed accuracy.

---

### Task 2: MSME Business Knowledge (M — 3 hrs)
**Why:** KA needs to understand each business type's economics to deliver the "Maria Moment." Without this, KA can ask the right questions but can't give meaningful first responses. This is the most collaborative file — Anton's MSME network knowledge is the primary source.
**Path:** `akbai-delivery/skills/ai-engineer/references/msme-business-knowledge.md`

- [ ] Claude drafts the Food/Baking Business Profile structure (cost structure, revenue patterns, cash flow, expense categories, blind spots, pain timing) using market research data
- [ ] **Anton validates and corrects** the Food/Baking numbers — especially cost structure percentages and seasonal peaks (this is Maria's profile, the primary persona)
- [ ] Draft Online Selling Business Profile — platform fees (Shopee 5-8%, Lazada), margins (15-30%), delayed settlements, GCash reconciliation challenges
- [ ] Draft Freelance/Creative Profile — project-based income, 8% flat tax, invoice cycles (net 15/30), late payment rates
- [ ] Draft Sari-Sari/Retail Profile (lighter — Phase 3 persona) — daily cash flow, utang dynamics, inventory/spoilage
- [ ] Write "Common Across All Filipino MSMEs" section — GCash, Facebook as sales channel, seasonal patterns, personal/business mixing
- [ ] **Anton validates** all 4 business profiles — flag any numbers that feel off from his MSME network experience

**Done when:** All 5 sections populated with specific numbers (not vague ranges), Anton has signed off on at least the Food/Baking and Online Selling profiles.

---

### Task 3: Kilala Kita Onboarding Context (S — 2 hrs)
**Why:** Directly needed for Build 1. Defines what KA knows after each onboarding step and the 16 first-response templates (4 business types × 4 pain points). First impression is everything — this is the "Maria Moment."
**Path:** `akbai-delivery/skills/ai-engineer/references/kilala-kita-context.md`
**Depends on:** Tasks 1 + 2 (needs BIR form mappings and business type knowledge to derive KA's inference logic)

- [ ] Map the Step-by-Step KA Knowledge progression — what KA now knows/infers after each of the 5 onboarding steps (business type → income range → pain point → BIR consent)
- [ ] Draft all 16 first-response templates (4 business types × 4 pain points) — 1–2 line Taglish openings demonstrating KA "gets" the user
- [ ] Document Personalization Variables — which variables are stored in user profile and how they flow to the prompt assembler (business_type, income_range, primary_pain, bir_consent)
- [ ] Write Escalation to CPA Timing rules — when KA suggests professional help per business type (₱3M threshold, first-time filing, complex structure)
- [ ] **Anton reviews all 16 first-response templates** for Taglish naturalness and approves/edits — these are the most important copy in the product

**Done when:** All 16 first-response templates written and approved by Anton. KA knowledge map covers all 5 onboarding steps.

---

### Task 4: Taglish Manual Population (M — 2.5 hrs)
**Why:** Design Gate #3 prerequisite. The existing `taglish-manual.md` has 10 section headers but all say "Awaiting entries." This feeds the prompt regression test library and ensures KA speaks naturally.
**Path:** `akbai-delivery/skills/ux-designer/references/taglish-manual.md`
**Depends on:** None (parallel — can work on this any evening)

- [ ] Populate §1 Greetings and Openers — 8-10 do/don't pairs with context (e.g., time-of-day greetings, first-time vs. returning user)
- [ ] Populate §2 Financial Amounts and Numbers — 6-8 pairs (₱ formatting, Taglish number patterns, "libo" vs "thousand")
- [ ] Populate §3 BIR and Tax Topics — 8-10 pairs (compliance tone, disclaimer integration, fear-reducing language)
- [ ] Populate §4-7 (Error Messages, Empty States, Confirmations, Asking Permission) — 4-8 pairs each, following the existing copy guide patterns from `brand-context.md`
- [ ] Populate §8 Push Notifications — 6-8 pairs (urgency without panic, BIR deadline sequence tone)
- [ ] Populate §9 Button Labels and CTAs — approved labels list and §10 Words/Phrases to Always/Never Use — 10+ entries each
- [ ] **Anton reads 10 random entries aloud** — do they sound natural to a Filipino ear? Iterate on any that feel forced.

**Done when:** All 10 sections have real entries (not placeholders). Anton has read at least 10 entries aloud and confirmed naturalness.

---

### Task 5: Scopes Enrichment + Gap Registry Update (XS — 1 hr)
**Why:** Wires the knowledge from Tasks 1-3 into the runtime system. Updates gap-registry.md to reflect resolved knowledge prerequisites.
**Depends on:** Tasks 1, 2, 3 (needs knowledge files completed and reviewed first)

- [ ] Add BIR form-to-business-type mapping to TAX_SCOPE in `frontend/src/lib/claude/prompts/scopes.ts` — keep it tight (~100-150 tokens), not the full knowledge base
- [ ] Add common BIR mistake warnings per business type to TAX_SCOPE (1-2 lines each)
- [ ] Update `akbai-delivery/shared/gap-registry.md` — add a note under Design Gate #3 that knowledge prerequisites (BIR KB, MSME KB, Kilala Kita context) are resolved with date
- [ ] Write 3 integration test prompts: (1) Maria asks about BIR deadlines → KA should mention 1701Q, (2) Jose asks about profit → KA should mention platform fees, (3) Ana asks about tax → KA should mention 8% flat tax. Verify responses are substantive using the new knowledge.

**Done when:** `scopes.ts` enriched with BIR mapping, gap-registry updated, 3 test prompts verified.

---

## Risks & Dependencies

- **Anton co-write dependency (Tasks 2, 3, 4):** Three of five tasks need Anton's domain expertise and Taglish ear. Unlike Sprint 1 (mostly Claude-draftable code), this sprint is collaborative. If Anton can't review in-sprint, Tasks 2-4 will carry over incomplete.
- **BIR data accuracy (Task 1):** BIR rules change via Revenue Memorandum Circulars. The knowledge base must note which tax year's rules it captures and include a "last verified" date. Claude can draft from public data, but Anton should spot-check 5 deadlines.
- **Taglish naturalness (Task 4):** Lowest confidence task. Claude can draft Taglish patterns, but the "sounds natural to a Filipino ear" test requires Anton. Budget extra iteration time here.
- **Task 3 depends on Tasks 1+2:** Kilala Kita context derives from BIR knowledge + MSME business knowledge. Don't start Task 3 until at least draft versions of Tasks 1+2 exist.

## Recommended Work Order

```
Evening 1: Task 1 (BIR KB — Claude drafts, mostly research)
Evening 2: Task 2 (MSME KB — Claude drafts structure, Anton fills in)
Evening 3: Task 3 (Kilala Kita — derive from Tasks 1+2, draft 16 templates)
Evening 4: Task 4 (Taglish Manual — most collaborative, read aloud)
Evening 5: Task 5 (Scopes enrichment — quick wiring + 3 test prompts)
```

Tasks 1 and 4 can run in parallel if you prefer, since Task 4 has no dependencies.

## Sprint Definition of Done

- [ ] 4 knowledge files created and populated (bir-knowledge-base.md, msme-business-knowledge.md, kilala-kita-context.md, taglish-manual.md)
- [ ] Anton has reviewed BIR forms mapping + food/baking cost structure + 16 first-response templates + 10 Taglish entries
- [ ] `scopes.ts` enriched with BIR form-to-business-type mapping
- [ ] `gap-registry.md` updated with knowledge prerequisite resolution
- [ ] 3 integration test prompts written and verified — KA responses are substantive (not just boundary rules)

## Known Carryover (Not in This Sprint)

- **E1 — Resibo OCR spike test (CRITICAL):** Still unresolved from Sprint 1. Test Haiku Vision on 10-15 real Filipino receipts. Should be Sprint 3 priority.
- **Business-Type Context Loader implementation:** Design spec is in `context_update.md`. Implementation deferred to Build 1 sprint.
