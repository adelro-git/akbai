# Resibo Scanner OCR Prompt — Build 0 Deliverable

**Evaluation:** eval-1-ocr-prompt
**Iteration:** iteration-1
**Status:** Complete
**Date:** March 15, 2026

---

## What's Inside

This folder contains the complete system prompt and output schema for AKBai's **Resibo Scanner** — the receipt OCR feature that is Build 3 of Phase 1.

### Files

**`resibo-scanner-prompt.md`** (578 lines)
- Complete system prompt for Claude Haiku Vision
- Full output schema with Zod validation code
- Confidence scoring rubric
- Edge case handling for 8 common receipt types (crumpled, handwritten, thermal fade, GCash, etc.)
- Implementation notes for the API route
- Testing checklist

---

## Key Design Decisions

### 1. **Haiku, Not Sonnet**
Receipt OCR is a structured extraction task — the model reads text and fills a fixed schema. This doesn't require Sonnet's reasoning. Haiku handles it reliably at ~1/10th the cost.

**Cost math:**
- Haiku: ~₱0.16 per scan ($0.0028 USD)
- 50 scans/month (Pro tier) = ₱8/month = 2% of ₱399 revenue
- If we used Sonnet: ₱34.50/month = 8.6% of revenue (unnecessary)

### 2. **Confidence is Conservative**
`overall_confidence` is the **minimum** of date, total, and items — not an average. If the total is uncertain, the whole scan is flagged even if store name is crystal clear. This protects users from silent errors on the most critical field.

### 3. **Never Invent Amounts**
Every financial figure in the extraction must come from the image. If the total is unreadable, we don't guess — we flag it and ask the user. "Hindi ko makita nang maayos yung total — i-type mo manually?" is always better than a hallucinated amount.

### 4. **All Amounts in Centavos**
Consistency across the platform. ₱34.50 = 3450 centavos. This prevents floating-point errors and makes calculations deterministic.

### 5. **Explicit Warnings for Edge Cases**
The prompt includes specific guidance for 8 common Philippine receipt scenarios:
- Crumpled/folded receipts from sari-sari stores
- Handwritten amounts on thermal paper
- Faded thermal receipts
- GCash/Maya screenshots
- Mixed-language receipts (Filipino + English + Chinese)
- Partially cut-off photos
- Multiple receipts in one photo

Each has a handling strategy that's graceful — never failing silently.

---

## System Prompt Structure

The prompt follows AKBai's assembly pattern but is self-contained (no separate [CORE_IDENTITY] block because this is a task-specific OCR call, not a conversational KA response).

```
[TASK: RESIBO_SCANNER_OCR]
├─ CRITICAL RULES (precision, no invention, centavos, ISO dates)
├─ REQUIRED OUTPUT FORMAT (JSON schema with all fields)
├─ EXTRACTION RULES (9 sections: store_name through warnings)
│  ├─ Monetary amounts (all in centavos)
│  ├─ Confidence scoring (1.0 = clear, 0.5 = medium, <0.5 = flag)
│  ├─ Warnings (crumpled, handwritten, fade, cutoff, etc.)
│  ├─ Raw text excerpt (first 200 chars for debugging)
│  └─ Special cases (GCash/Maya, crumpled, handwritten, faded)
└─ DELIVERY (JSON only, no explanation)
```

---

## Output Schema (Zod)

The Zod schema in the markdown is production-ready TypeScript. Copy it directly into `/lib/zod/receipt.ts`:

```typescript
const ReceiptExtractionSchema = z.object({
  store_name: z.string().max(255).nullable().default(null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  items: z.array(ReceiptItemSchema).default([]),
  subtotal_centavos: z.number().int().nonnegative().nullable().default(null),
  tax_centavos: z.number().int().nonnegative().nullable().default(null),
  total_centavos: z.number().int().nonnegative(),  // REQUIRED
  payment_method: z.enum(['cash', 'gcash', 'maya', 'card', 'bank_transfer', 'other']).nullable().default(null),
  category: z.string().max(100).nullable().default(null),
  confidence: ConfidenceSchema,
  raw_text_excerpt: z.string().max(200).default(''),
  warnings: z.array(z.string()).default([]),
});
```

This validates:
- Date format (YYYY-MM-DD only)
- All amounts as non-negative integers (centavos)
- Payment method enum (strict)
- Confidence scores 0.0–1.0
- Warnings as string array (for UX display)

---

## Integration Checklist

### API Route (`/app/api/resibo/scan/route.ts`)

- [ ] Import `ReceiptExtractionSchema` from `/lib/zod/receipt.ts`
- [ ] Download image from Supabase Storage (server-side, using service role)
- [ ] Base64 encode the JPEG
- [ ] Call Claude Haiku Vision with the prompt from this document
- [ ] Extract JSON from response (handle markdown code block)
- [ ] Validate with Zod; if validation fails, retry once with "Please respond in valid JSON format"
- [ ] Return `{ success: true, data: validated }` on success
- [ ] Return graceful error on validation failure (never expose raw parsing errors to user)

### Client Review Card

- [ ] Display each field with its value
- [ ] Fields with confidence < 0.8 get amber warning badge
- [ ] Fields with confidence < 0.5 get red warning badge + "I-check po ito"
- [ ] Show `raw_text_excerpt` for user reference (helps verify handwritten amounts)
- [ ] Allow tap-to-edit any field
- [ ] Prominent "Save" and "Cancel" buttons
- [ ] Deduplication check before saving (same amount + date ±30 minutes)

### KA Message Adaptation

- [ ] Overall ≥ 0.8: "Na-scan ko na — check mo kung tama lahat bago i-save natin."
- [ ] Overall 0.5–0.79: "Na-scan ko na, pero may mga hindi ko masyadong nabasa. I-check mo po yung naka-highlight."
- [ ] Overall < 0.5: "Medyo malabo — maraming hindi mabasa. I-check po lahat ng fields."

### Cost & Circuit Breaker

- [ ] Log every scan to `daily_api_spend` table with cost ($0.0028 per scan)
- [ ] Check circuit breaker before calling Claude (prevent runaway costs)
- [ ] If circuit breaker trips: "Marami nang na-process natin today — bukas ulit tayo mag-scan."

---

## Testing Before Production

This prompt should be tested against the Build 0 Taglish regression test library (20–30 cases). Minimum test set:

1. **High-quality receipt** (printed, clear, complete) → confidence ≥ 0.8
2. **Crumpled receipt** (folds, creases) → confidence 0.5–0.7, warning in list
3. **Handwritten total** (thermal paper with handwriting) → confidence 0.3–0.5, warning flagged
4. **Faded thermal** (old receipt, text very light) → confidence < 0.5
5. **GCash screenshot** (payment record, digital) → payment_method: "gcash", confidence ≥ 0.8
6. **Partial cutoff** (photo cuts off bottom) → warning: "may naputol"
7. **Multiple receipts** (two receipts in one photo) → extract largest, warning: "multiple receipts"
8. **Mixed language** (English + Filipino + Chinese) → all text extracted, confidence reflects readability

After testing, update the prompt changelog in `/skills/ai-engineer/references/prompt-library.md` with the test results.

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2026-03-15 | Build 0 | Initial version for Build 3 (Resibo Scanner) |

---

## Related Documents

- **ocr-pipeline.md** — Full pipeline spec (camera to Supabase)
- **prompt-library.md** — Versioned prompts for all AI features
- **ai-guardrails.md** — BIR disclaimers, hallucination prevention, confidence rules
- **project-context.md** — Unit economics, tier structure, KA persona

---

## Questions?

This prompt is designed to work with:
- **Model:** claude-haiku-4-5 (Vision)
- **Image format:** JPEG, base64-encoded, max 1200px longest side
- **max_tokens:** 1024
- **Temperature:** Default (1.0)
- **No system parameter** — prompt is self-contained in user message

If you need to modify the prompt for new edge cases or add new extraction fields, follow the versioning rules in SKILL.md (patch for typos, minor for new capabilities, major for behavior changes). Always run against regression tests before shipping.
