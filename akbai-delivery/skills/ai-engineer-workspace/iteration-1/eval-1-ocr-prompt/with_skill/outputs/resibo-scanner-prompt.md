# AKBai Resibo Scanner — System Prompt & Output Schema

**Version:** 1.0.0
**Model:** claude-haiku-4-5 (Vision)
**Last Updated:** March 2026
**Purpose:** Receipt OCR extraction for Filipino MSME expenses. Extracts structured financial data from photos of paper receipts, thermal paper receipts, and payment screenshots (GCash/Maya).

---

## Table of Contents

1. [Complete System Prompt](#complete-system-prompt)
2. [Output Schema (TypeScript/Zod)](#output-schema-typescriptzod)
3. [Confidence Scoring Rules](#confidence-scoring-rules)
4. [Edge Cases & Handling](#edge-cases--handling)
5. [Implementation Notes](#implementation-notes)

---

## Complete System Prompt

This is the full prompt delivered to Claude Haiku Vision in a single user message. It contains task instructions and output format specification, but no system role parameter (task-specific prompts like OCR don't use the `system` parameter in the Claude API call).

```
[TASK: RESIBO_SCANNER_OCR]

You are processing a receipt image for AKBai's Resibo Scanner feature. Your task is
to extract structured financial data from the image into JSON format.

CRITICAL RULES:
- Be precise — this data becomes a financial record
- Extract ONLY what you see in the image — never invent or estimate
- All monetary amounts must be in centavos (₱34.50 = 3450 centavos)
- Dates must be ISO 8601 format (YYYY-MM-DD)
- Return valid JSON only — wrap in code block if needed
- Confidence scores reflect how clearly each field was readable (0.0 to 1.0)

REQUIRED OUTPUT FORMAT (JSON):

{
  "store_name": string | null,
  "date": "YYYY-MM-DD" | null,
  "items": [
    {
      "name": string,
      "quantity": number | null,
      "unit_price_centavos": number | null,
      "total_centavos": number
    }
  ],
  "subtotal_centavos": number | null,
  "tax_centavos": number | null,
  "total_centavos": number,
  "payment_method": "cash" | "gcash" | "maya" | "card" | "bank_transfer" | "other" | null,
  "category": string | null,
  "confidence": {
    "overall": number,       // 0.0 to 1.0, minimum of date/total/items
    "store_name": number,
    "date": number,
    "total": number,
    "items": number
  },
  "raw_text_excerpt": string,  // First 200 characters of raw OCR text
  "warnings": string[]         // Human-readable issues found
}

EXTRACTION RULES:

1. STORE NAME
   - Extract the business name from the receipt header or footer
   - If unclear, set to null and lower confidence
   - Examples: "SM Supermarket", "Puregold", "Sari-Sari ni Maria"

2. DATE
   - Format: YYYY-MM-DD (ISO 8601)
   - Prefer reading the date from receipt
   - If only month/day visible, assume current year
   - If date is ambiguous (e.g., 03/04 could be March 4 or April 3):
     Use DD/MM interpretation for Philippine receipts but flag in warnings
   - If no date readable, set to null
   - Confidence: 1.0 if clearly printed, 0.5 if handwritten, 0.0 if missing

3. ITEMS
   - Extract each line item from the receipt
   - Each item requires: name (string), total_centavos (required number)
   - Optional: quantity (number), unit_price_centavos (number)
   - If line item is unclear, still include it but lower confidence
   - Examples:
     {"name": "Flour 1kg", "quantity": 2, "unit_price_centavos": 12500, "total_centavos": 25000}
     {"name": "Baking soda", "quantity": null, "unit_price_centavos": null, "total_centavos": 1500}

4. MONETARY AMOUNTS (all in centavos)
   - ₱34.50 = 3450 centavos
   - ₱1,200 = 120000 centavos
   - Convert any amount to centavos (multiply pesos by 100)
   - subtotal_centavos: sum of items before tax/fees
   - tax_centavos: any tax or VAT amount added
   - total_centavos: final amount due (REQUIRED — never null)
   - If total is unreadable, attempt to calculate from subtotal + tax
   - If still unreadable, set to 0 and flag prominently

5. PAYMENT METHOD
   - "cash" — Cash payment noted
   - "gcash" — GCash transaction (look for GCash header/logo)
   - "maya" — Maya/Paymaya transaction
   - "card" — Credit/debit card (look for Visa/Mastercard logo)
   - "bank_transfer" — Bank deposit noted
   - "other" — Other method noted but not recognized
   - null — Payment method not visible
   - For GCash/Maya screenshots: category auto-set to payment type

6. CATEGORY (Expense classification suggestion)
   - food_ingredients: Raw materials for food/baking
   - packaging: Boxes, bags, containers, labels
   - utilities: Electricity, water, internet, phone load
   - transport: Gas, Grab, delivery, shipping
   - supplies: Office supplies, cleaning, consumables
   - equipment: Tools, appliances, machines (>₱1,000)
   - services: Professional fees, subscriptions, repairs
   - rent: Store/kitchen/warehouse rental
   - personal: Non-business expenses tracked by user
   - other: Does not fit above categories
   - Note: Can suggest category based on store name + items

7. CONFIDENCE SCORING
   - 1.0 = clearly printed, fully readable, no ambiguity
   - 0.8–0.99 = high confidence, minor issues (slight blur, small font)
   - 0.5–0.79 = medium confidence — field is readable but has issues (handwritten, partially faded)
   - 0.0–0.49 = low confidence — field is likely wrong or unreadable

   Per-field scoring:
   - store_name: 1.0 if clear, 0.5 if partially visible, 0.0 if unreadable
   - date: 1.0 if clearly printed, 0.5 if handwritten, 0.0 if missing
   - total: 1.0 if clearly printed, 0.3 if handwritten, 0.0 if missing/unreadable
   - items: 1.0 if all items clear, 0.7 if some items unclear, 0.3 if heavily blurred

   overall: Calculate as the MINIMUM of date, total, items (conservative)
   - If overall < 0.5, flag warning: "Low confidence scan — may have errors"

8. WARNINGS (Human-readable list)
   Add to warnings array for:
   - "Crumpled/folded receipt — some text may be missed"
   - "Handwritten amount — double-check this field"
   - "Thermal paper fade — text is fading, confidence lower"
   - "Partial text cutoff — receipt may not be fully captured"
   - "Multiple receipts in photo — only the largest extracted"
   - "Mixed languages detected — all text extracted regardless"
   - "Date is ambiguous — could be DD/MM or MM/DD"
   - "Low confidence scan — verify all fields before saving"

9. RAW TEXT EXCERPT
   - Include the first 200 characters of raw OCR text from the receipt
   - Helps user verify the extraction by seeing what the model read
   - Example: "SM Supermarket — National Foodcenter Branch 123\nABCDE..."

SPECIAL CASES:

GCash/Maya Screenshots:
- Look for transaction ID, amount, sender/receiver names, timestamp
- Treat as payment record (payment_method: "gcash" or "maya")
- Extract amount and date from screenshot
- Store name can be the receiver's name or business name
- Category can be auto-set to "gcash_payment" or similar

Crumpled/Faded Receipts:
- If overall confidence < 0.3, confidence scoring is critical
- Flag prominently in warnings
- User should consider manual entry

Handwritten Amounts:
- Mark with lower confidence (0.3–0.5 range)
- Add warning: "Handwritten amount — i-verify mo"
- Show raw_text_excerpt so user can compare

No Date on Receipt:
- Set date to null
- Add warning: "No date found — using today's date is best practice"
- User will fill in during review

Missing Total:
- If subtotal and tax are visible, calculate total_centavos = subtotal + tax
- If only some items visible, sum those
- If truly no total visible anywhere, set to 0 and flag prominently

---

[DELIVERY]

Extract the receipt data above. Respond ONLY with valid JSON, optionally in a code block.
Do not include any explanation or additional text — just the JSON.

If you cannot parse the image (e.g., it's not a receipt), return:
{
  "error": "image_not_receipt",
  "message": "Hindi nakita ang receipt sa image"
}
```

---

## Output Schema (TypeScript/Zod)

This is the exact Zod schema used for validation on the server. Derived from this schema are the TypeScript types for the entire pipeline.

### Zod Schema

```typescript
import { z } from 'zod';

/**
 * Single line item from a receipt
 */
const ReceiptItemSchema = z.object({
  name: z.string().min(1, 'Item name required'),
  quantity: z.number().positive().nullable().default(null),
  unit_price_centavos: z.number().int().nonnegative().nullable().default(null),
  total_centavos: z.number().int().nonnegative('Must be non-negative'),
});

type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

/**
 * Confidence scores per field
 */
const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(1).default(0),
  store_name: z.number().min(0).max(1).default(0),
  date: z.number().min(0).max(1).default(0),
  total: z.number().min(0).max(1).default(0),
  items: z.number().min(0).max(1).default(0),
});

type ConfidenceScores = z.infer<typeof ConfidenceSchema>;

/**
 * Main receipt extraction output
 */
const ReceiptExtractionSchema = z.object({
  store_name: z.string().max(255).nullable().default(null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').nullable().default(null),
  items: z.array(ReceiptItemSchema).default([]),
  subtotal_centavos: z.number().int().nonnegative().nullable().default(null),
  tax_centavos: z.number().int().nonnegative().nullable().default(null),
  total_centavos: z.number().int().nonnegative('Must be non-negative'),
  payment_method: z
    .enum(['cash', 'gcash', 'maya', 'card', 'bank_transfer', 'other'])
    .nullable()
    .default(null),
  category: z.string().max(100).nullable().default(null),
  confidence: ConfidenceSchema,
  raw_text_excerpt: z.string().max(200).default(''),
  warnings: z.array(z.string()).default([]),
});

type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export { ReceiptExtractionSchema, ReceiptItemSchema, ConfidenceSchema };
export type { ReceiptExtraction, ReceiptItem, ConfidenceScores };
```

### Usage in API Route

```typescript
// /app/api/resibo/scan/route.ts (simplified excerpt)

import { ReceiptExtractionSchema } from '@/lib/zod/receipt';

export async function POST(req: Request) {
  // ... auth, tier check, image download ...

  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: RESIBO_SCANNER_PROMPT, // From prompt-library.md
          },
        ],
      },
    ],
  });

  // Extract JSON from response
  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // Retry once with explicit JSON format instruction
    const retryResponse = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: RESIBO_SCANNER_PROMPT + '\n\nPlease respond in valid JSON format only.',
            },
          ],
        },
      ],
    });
    // ... try parsing retry response ...
  }

  const rawJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  // Validate with Zod
  try {
    const validated = ReceiptExtractionSchema.parse(rawJson);
    return Response.json({ success: true, data: validated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Resibo] Zod validation failed:', error.issues);
      return Response.json(
        {
          success: false,
          error: {
            code: 'OCR_PARSE_FAIL',
            message: 'Failed to parse receipt — try again or enter manually',
            message_tl: 'Hindi ma-process ang receipt — subukan ulit o i-type manually.',
          },
        },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

---

## Confidence Scoring Rules

### Confidence Per Field

| Field | 0.9–1.0 | 0.8–0.89 | 0.5–0.79 | <0.5 |
|-------|---------|----------|----------|------|
| **store_name** | Clearly printed brand name | Minor obscuration | Partially visible | Unreadable |
| **date** | Clear, printed date | Small font but readable | Handwritten date | Missing/illegible |
| **total** | Large, clear amount | Normal size, readable | Handwritten, faded | Missing/unreadable |
| **items** | All items clear, quantities visible | Some items clear | Several items unclear | Mostly blurred |

### Overall Confidence Calculation

```typescript
confidence.overall = Math.min(confidence.date, confidence.total, confidence.items);
```

The overall score is **conservative**: it's the minimum of the three critical fields. If the total is uncertain, the whole scan is flagged even if store name and items are clear.

### Confidence-Driven UI & KA Messages

**High Confidence (≥ 0.8):**
- UI: No warning badges
- KA: "Na-scan ko na yung receipt mo — check mo kung tama lahat bago i-save natin."

**Medium Confidence (0.5–0.79):**
- UI: Amber warning badges on uncertain fields
- KA: "Na-scan ko na, pero may mga field na hindi ko masyadong nabasa nang maayos. I-check mo po yung mga naka-highlight."

**Low Confidence (< 0.5):**
- UI: Red warning badges, prominent "I-check po" label
- KA: "Medyo malabo yung receipt — maraming hindi mabasa. I-check po lahat ng fields bago i-save."

---

## Edge Cases & Handling

### 7a. Crumpled or Folded Receipts

**Symptom:** Haiku returns partial text, low confidence on items, multiple warnings about unreadable sections.

**Handling:**
- Set `items` confidence to 0.3–0.5
- Add warning: "May nakatiklop na parte ng receipt — baka may items na hindi na-scan."
- Allow user to manually add missing items during review
- Don't silently truncate items array — show what was found

### 7b. Missing Date

**Symptom:** `date` is null or confidence < 0.3.

**Handling:**
- Set date to null (not today's date) — user fills in during review
- Add warning: "Walang date sa receipt — i-enter mo ang date."
- UI should highlight this field for user action
- Do NOT assume today's date server-side

### 7c. Handwritten Amounts

**Symptom:** `total_centavos` or item amounts have confidence 0.3–0.5, warnings mention handwriting.

**Handling:**
- Extract the best-guess amount
- Set confidence to 0.4
- Add warning: "Handwritten yung amount — i-verify mo nang mabuti."
- Show `raw_text_excerpt` alongside extracted amount so user can compare visually
- Allow manual override during review

### 7d. Thermal Paper Fade

**Symptom:** Entire receipt is low confidence (< 0.5), multiple null fields, faded appearance.

**Handling:**
- If `overall_confidence < 0.3`, add warning: "Medyo faded na yung thermal paper — maraming hindi mabasa."
- Suggest manual entry: "Mas madali kung i-type na lang natin manually. Gusto mo?"
- Do not force user through OCR review if scan is too poor — offer manual entry path

### 7e. GCash/Maya Screenshots

**Symptom:** Image is a digital payment screenshot instead of paper receipt.

**Handling:**
- Extract transaction details: amount, timestamp, sender/receiver
- Set `payment_method` to "gcash" or "maya"
- Set `store_name` to receiver's name/business (if visible)
- Look for transaction ID in the screenshot
- Digital text is typically high-confidence (0.9–1.0)
- Category can default to "gcash_payment" or "maya_payment"

### 7f. Mixed Language Receipts

**Symptom:** Receipt has Filipino, English, and sometimes Chinese text (common in sari-sari stores).

**Handling:**
- Haiku handles multilingual text natively — no special processing needed
- Extract item names and descriptions in whatever language they appear
- Confidence is not reduced for language mixing
- Include all languages in `raw_text_excerpt`

### 7g. Partial Text Cutoff (Photo Not Fully Captured)

**Symptom:** Photo doesn't capture the entire receipt — top/bottom/side is cut off.

**Handling:**
- Extract what's visible
- Add warning: "Mukhang hindi kumpleto yung photo — baka may naputol sa {{top/bottom/side}}."
- If `total_centavos` is cut off and can't be calculated, flag prominently
- Show user the `raw_text_excerpt` so they can see what was cut

### 7h. Multiple Receipts in One Photo

**Symptom:** User photographs two or more receipts side by side or overlapping.

**Handling:**
- Extract the most prominent/largest receipt
- Set all confidence scores lower (0.3–0.5 range)
- Add warning: "May dalawang receipt sa photo — yung mas malaki lang ang na-scan. I-scan mo separately yung iba."
- Never try to merge two receipts into one extraction

---

## Implementation Notes

### API Call Pattern

```typescript
const response = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64,  // Base64-encoded JPEG
          },
        },
        {
          type: 'text',
          text: RESIBO_SCANNER_PROMPT,
        },
      ],
    },
  ],
});
```

**Important parameters:**
- `model`: Always `claude-haiku-4-5` — Vision + Cost optimized
- `max_tokens`: 1024 — sufficient for receipt extraction (typical response: 300–600 tokens)
- `temperature`: Omit (default 1.0) — Structured extraction doesn't need low temperature
- **No `system` parameter** — OCR prompts are self-contained in the user message

### Image Compression (Client-Side)

Before upload, compress to:
- Max 1200px on longest side
- 85% JPEG quality
- Resulting file typically <500KB
- Smaller images process faster through Vision API

### Cost per Scan

- Input: ~800 tokens + image ≈ $0.002
- Output: ~400 tokens ≈ $0.0016
- **Total: ~₱0.16 per scan** (at 57.2 PHP/USD)

This is already built into the Pro tier ₱399/mo (50 scans = ₱8 AI cost).

### Zod Validation Retry

If Zod validation fails:
1. Log the raw response + error for debugging
2. Retry once with appended instruction: "Please respond in valid JSON format only."
3. If retry also fails, return graceful error to client
4. Never attempt to "fix" malformed JSON — let user retry or enter manually

### Deduplication Check

Before saving to transactions table, check for potential duplicates:

```sql
SELECT id, store_name, total_centavos, date, created_at
FROM receipts
WHERE user_id = $1
  AND total_centavos = $2
  AND date = $3
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '30 minutes'
```

If match found: show existing receipt + ask user "Duplicate ba ito, o iba?"

### Circuit Breaker

Every scan is logged to `daily_api_spend` table with:
- `scan_cost_usd` (in this case, ~$0.0028)
- `user_id` and `date`
- Prevents runaway costs

If circuit breaker trips, degrade gracefully:
- "Marami nang na-process natin today — bukas ulit tayo mag-scan, okay? Pwede mo pa ring i-check ang records mo."

---

## Testing & Validation Checklist

Before shipping any changes to this prompt:

- [ ] Run against 5–10 test receipt images (paper, thermal, GCash, crumpled)
- [ ] Verify all JSON outputs pass Zod validation
- [ ] Check that confidence scores are conservative (overall ≤ min of critical fields)
- [ ] Verify BIR-related warnings are present (no auto-calculation of tax due)
- [ ] Confirm no financial amounts are fabricated (all are from visible receipt)
- [ ] Test edge case: missing total (should be null or calculated, never invented)
- [ ] Verify GCash/Maya screenshots extract payment_method correctly
- [ ] Confirm raw_text_excerpt captures actual receipt text
- [ ] Run prompt through injection defense test (user tries to override persona)
- [ ] Verify response is JSON only — no extra explanation text
