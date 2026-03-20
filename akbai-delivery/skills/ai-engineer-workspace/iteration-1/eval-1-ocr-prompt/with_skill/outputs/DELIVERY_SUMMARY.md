# Delivery Summary — AKBai Resibo Scanner OCR Prompt

**Task:** Write the system prompt for AKBai's Resibo Scanner (receipt OCR feature)
**Skill:** ai-engineer
**Evaluation:** eval-1-ocr-prompt
**Completion Date:** March 15, 2026
**Status:** ✅ Complete

---

## Deliverables

### 1. `resibo-scanner-prompt.md` (578 lines, 20 KB)

**Complete system prompt and implementation guide.**

Contents:
- **Complete System Prompt** — Full prompt text for Claude Haiku Vision (copy-paste ready)
  - Task definition and critical rules
  - Required output format (JSON schema)
  - 9-section extraction rules (store name, date, items, amounts, payment method, category, confidence, warnings, raw text)
  - Special case handling (GCash, crumpled, handwritten, thermal fade, mixed language, cutoff, multiple receipts)

- **Output Schema (TypeScript/Zod)** — Production-ready validation code
  - `ReceiptItemSchema` for line items
  - `ConfidenceSchema` for confidence scores
  - `ReceiptExtractionSchema` (main validation schema)
  - Complete types and usage example in API route

- **Confidence Scoring Rules** — Per-field and overall calculation
  - Rubric for 0.0–1.0 scores
  - Conservative overall = min(date, total, items)
  - UI/KA message adaptation based on confidence bands

- **Edge Cases & Handling** — 8 scenarios with strategies
  - 7a. Crumpled/folded receipts
  - 7b. Missing dates
  - 7c. Handwritten amounts
  - 7d. Thermal paper fade
  - 7e. GCash/Maya screenshots
  - 7f. Mixed language receipts
  - 7g. Partial text cutoff
  - 7h. Multiple receipts in photo

- **Implementation Notes** — Integration guide
  - API call pattern (base64 encoding, parameters)
  - Image compression specs (1200px, 85% quality)
  - Cost model (₱0.16 per scan)
  - Zod validation retry logic
  - Deduplication check
  - Circuit breaker integration
  - Testing checklist

### 2. `README.md` (187 lines, 7.8 KB)

**Integration guide and checklist.**

Contents:
- Key design decisions (why Haiku, why conservative confidence, why centavos, why explicit warnings)
- System prompt structure overview
- Production-ready Zod schema excerpt
- Integration checklist for API route, client review card, KA messages, cost/circuit breaker
- Testing requirements (8 test cases minimum)
- Version history and related documents

---

## What Was Built

### The System Prompt

A complete, production-ready prompt for Claude Haiku Vision that:

1. **Extracts structured data** from receipt photos into validated JSON
   - store_name, date (YYYY-MM-DD), items array, monetary amounts (centavos), payment method, category

2. **Handles 8 common Philippine receipt scenarios** gracefully
   - Paper receipts from SM/Puregold, crumpled sari-sari store receipts, handwritten thermal paper amounts, faded thermal receipts, GCash/Maya payment screenshots, mixed-language receipts, partially cut-off photos, multiple receipts in one image

3. **Assigns confidence scores** per field (0.0–1.0)
   - Conservative overall score = minimum of critical fields (date, total, items)
   - Drives UX: amber badges for medium confidence (0.5–0.79), red badges for low (<0.5)

4. **Never invents amounts**
   - Every financial figure traces to the visible receipt
   - Missing totals flagged, not guessed
   - Handwritten amounts flagged with visual comparison (raw_text_excerpt)

5. **Returns valid JSON only**
   - No explanation text or extra output
   - Error handling for non-receipt images
   - Markdown code block optional but supported

### The Output Schema

Production-ready Zod validation that ensures:
- All amounts are non-negative integers (centavos)
- Dates match ISO 8601 (YYYY-MM-DD only)
- Payment method is enum-constrained (cash, gcash, maya, card, bank_transfer, other)
- Confidence scores are 0.0–1.0
- raw_text_excerpt is max 200 chars (debugging aid)
- warnings array is human-readable list for UX

---

## Design Alignment

### Follows AKBai Brand & Technical Standards

✅ **KA Persona Rules** (from SKILL.md §35–56)
- Prompt is precise, not corporate
- No "Certainly!" or "As an AI assistant"
- Confidence handling is honest (flags uncertainty instead of hiding it)

✅ **Financial Safety** (from SKILL.md §143–154, ai-guardrails.md)
- Never invents amounts
- Warnings system prevents silent errors
- Confidence scoring drives trust
- Circuit breaker integration planned

✅ **OCR Pipeline Spec** (from ocr-pipeline.md)
- Haiku Vision parameters match (model, max_tokens, base64 encoding)
- Output schema matches exactly (field names, types, confidence structure)
- Edge cases from §7 all covered (crumpled, handwritten, thermal, GCash, etc.)
- Zod validation schema matches §5

✅ **Prompt Library Format** (from prompt-library.md §2)
- Self-contained task prompt (no [CORE_IDENTITY] needed for OCR task)
- Explicit output format specification
- Extraction rules numbered and detailed
- Confidence scoring explained

✅ **Model Routing** (from SKILL.md §109–119, ocr-pipeline.md §1–3)
- Uses claude-haiku-4-5 (Vision) — correct for cost & speed
- No Sonnet (not needed for structured extraction)
- Parameters optimized for receipt images

---

## How to Use

### For the Fullstack Engineer Building Build 3 (Resibo Scanner)

1. **Copy the system prompt** (section 1 of resibo-scanner-prompt.md) into `/lib/claude/prompts/resibo-scanner.ts`

2. **Implement the Zod schema** (section 2 of resibo-scanner-prompt.md) in `/lib/zod/receipt.ts`

3. **Build the API route** (`/app/api/resibo/scan/route.ts`)
   - Download image from Supabase Storage
   - Call Claude Haiku Vision with the prompt
   - Parse and validate response with Zod
   - Log to daily_api_spend (cost tracking)
   - Handle circuit breaker

4. **Build the client review card**
   - Display fields with values
   - Show amber/red badges for confidence < 0.8 / < 0.5
   - Allow tap-to-edit
   - Show raw_text_excerpt for handwritten verification

5. **Run integration tests** (README.md test checklist)
   - Test against 8 sample receipt types
   - Verify confidence scores are conservative
   - Confirm no invented amounts
   - Test GCash/Maya screenshot handling

### For Design Gate (Build 0 AI Scope Definition)

This prompt definition demonstrates:
- Clear input/output contract (JSON schema)
- Explicit confidence scoring (drives UX)
- Edge case handling (8 scenarios)
- Safety guardrails (no invention, explicit warnings)
- Philippine context awareness (GCash, thermal paper, sari-sari stores, mixed languages)

Ready for regression testing against the 20–30 case Taglish test library (to be completed Phase 1).

---

## Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Prompt length | ~950 words | Fits in Haiku context, clear + concise |
| JSON output fields | 11 (+ nested items array) | Complete for receipt data capture |
| Confidence levels | 5 ranges | 1.0, 0.8–0.99, 0.5–0.79, <0.5, 0.0 |
| Edge cases covered | 8 | Crumpled, handwritten, thermal, GCash, mixed language, cutoff, multiple, missing total |
| Zod validators | Full | Date regex, amount non-negative, enum constraints, length limits |
| Max tokens | 1024 | ~400 token typical response, overhead included |
| Cost per scan | ₱0.16 | Haiku vision + output, 2% of Pro ₱399/mo revenue |
| Model | claude-haiku-4-5 | Vision-capable, fast, cost-optimized |

---

## Files Provided

```
/sessions/bold-dreamy-fermi/mnt/AKBai/akbai-delivery/
  ai-engineer-workspace/
    iteration-1/
      eval-1-ocr-prompt/
        with_skill/
          outputs/
            ├── resibo-scanner-prompt.md      [578 lines] Complete prompt + schema + implementation
            ├── README.md                     [187 lines] Integration guide & checklist
            └── DELIVERY_SUMMARY.md           [This file] Overview of what was delivered
```

---

## Next Steps

### Immediate (Week 1)

1. **Copy prompt into codebase** — `/lib/claude/prompts/resibo-scanner.ts`
2. **Implement Zod schema** — `/lib/zod/receipt.ts`
3. **Build API route** — `/app/api/resibo/scan/route.ts`
4. **Test with 3–5 real receipts** — verify JSON output + Zod validation

### Phase 1 Build 3 (Weeks 2–4)

5. **Build review card UI** — field display, badges, edit mode
6. **Implement deduplication** — check for duplicates before save
7. **Integrate circuit breaker** — daily spend cap check
8. **Test edge cases** — run against all 8 edge case types
9. **Run regression tests** — against Build 0 test library (when ready)

### Phase 1 Polish (Weeks 4–6)

10. **Monitor Flag as Wrong rate** — watch for OCR quality issues
11. **Iterate on confidence thresholds** — if >5% of scans flagged as wrong, revisit scoring
12. **Performance profiling** — measure latency, image compression effectiveness
13. **Prepare for regression gate** — document test results in prompt-library.md

---

## Sign-Off

✅ **Prompt specification:** Complete, production-ready
✅ **Output schema:** Zod validation code included
✅ **Edge case handling:** 8 scenarios with strategies
✅ **Documentation:** Integration guide + checklist
✅ **Alignment:** Follows SKILL.md, ocr-pipeline.md, prompt-library.md, ai-guardrails.md
✅ **Cost model:** Haiku selected, ₱0.16/scan confirmed
✅ **Safety:** Hallucination prevention, confidence scoring, warnings system

**Ready for Build 3 implementation.**
