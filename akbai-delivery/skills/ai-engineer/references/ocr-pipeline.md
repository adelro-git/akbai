# AKBai — OCR Pipeline Specification (Resibo Scanner)
> Full pipeline spec for receipt scanning: camera to Supabase.
> Read this file when implementing, debugging, or extending the Resibo Scanner.
> Last updated: March 2026 | Version: 1.0.0

### How Other Agents Use This File

- **QA agent**: Uses the 6-stage pipeline (§2) to trace where a scan failure occurred. Each stage has documented failure modes and expected error messages — QA can write test cases for each failure path. The edge cases (§7) are a QA test matrix: crumpled receipts, missing dates, handwritten amounts, GCash screenshots, thermal fade, partial cutoff, multiple receipts. The deduplication logic (§8) needs its own test case set. When a user reports "wrong total," QA traces the pipeline: was it Stage 3 (Haiku extraction error), Stage 4 (Zod validation let a bad value through), or Stage 5 (confidence scoring didn't flag it)?
- **PM agent**: Uses the cost model (§9) for budget reporting: per-scan cost (₱0.16), monthly cost per tier, and AI as percentage of revenue. Uses the pipeline architecture diagram (§1) for sprint reports describing what was delivered. The monthly cost table is directly quotable in investor updates.
- **Fullstack-engineer**: This is the implementation blueprint. The step-by-step flow (§2) maps directly to code: Step 3 → Supabase Storage upload function, Step 4 → API route at `/api/resibo/scan`, Step 5 → Zod schema from §5, Step 7 → save route at `/api/resibo/save`. The error handling table (§10) provides exact console log messages and user-facing Taglish messages for each failure mode.

---

## Table of Contents

1. [Pipeline Architecture](#1-pipeline-architecture)
2. [Step-by-Step Flow](#2-step-by-step-flow)
3. [Haiku Vision API Call](#3-haiku-vision-api-call)
4. [Output Schema](#4-output-schema)
5. [Zod Validation](#5-zod-validation)
6. [Confidence Scoring](#6-confidence-scoring)
7. [Edge Cases](#7-edge-cases)
8. [Deduplication](#8-deduplication)
9. [Cost Model](#9-cost-model)
10. [Error Handling](#10-error-handling)

---

## 1. Pipeline Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Camera /    │────▶│  JPEG        │────▶│  Supabase      │
│  Gallery     │     │  Compression │     │  Storage       │
│  (Client)    │     │  (Client)    │     │  (Client→API)  │
└─────────────┘     └──────────────┘     └────────┬───────┘
                                                   │
                                                   ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  User        │◀───│  Confidence  │◀───│  Haiku Vision  │
│  Review Card │     │  + Zod       │     │  API Call      │
│  (Client)    │     │  Validation  │     │  (Server)      │
└──────┬──────┘     └──────────────┘     └────────────────┘
       │ User confirms
       ▼
┌─────────────┐     ┌──────────────┐
│  Supabase    │────▶│  Transaction │
│  receipts    │     │  Created     │
│  table       │     │              │
└─────────────┘     └──────────────┘
```

**Key principle:** The user always reviews and confirms before data is saved to the transactions table. KA shows the extracted data and asks "Tama ba ito?" — never silently saves.

---

## 2. Step-by-Step Flow

### Step 1: Image Capture (Client)

The user taps the scan button, which opens the device camera or gallery picker.

- **Camera**: Uses `<input type="file" accept="image/*" capture="environment">` for mobile PWA. Back camera is default for receipts.
- **Gallery**: Falls back to gallery selection if camera permission is denied.
- **Accepted formats**: JPEG, PNG, HEIC (iOS). Convert everything to JPEG before upload.

### Step 2: Image Compression (Client)

Before uploading, compress the image to reduce storage costs and API input size.

```typescript
// Target: max 1200px on longest side, 85% JPEG quality
// This keeps file size under ~500KB while preserving text readability
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;
```

Compression runs client-side using Canvas API. If the original is already under 500KB, skip compression.

### Step 3: Upload to Supabase Storage (Client → Server)

Upload the compressed JPEG to Supabase Storage in the `receipts` bucket.

```
Path: receipts/{user_id}/{YYYY-MM}/{uuid}.jpg
```

The path includes year-month for easy lifecycle management and cost monitoring. The UUID prevents filename collisions.

- Storage bucket must have RLS policy: user can only write to their own `{user_id}/` prefix
- Set `Cache-Control: private, max-age=31536000` — receipt images are immutable after upload
- Return the storage path (not signed URL) for the API route

### Step 4: Haiku Vision API Call (Server)

The API route `/app/api/resibo/scan/route.ts` handles the Claude API call.

**Pre-flight checks (in order):**
1. Authenticate user (`getUser()`)
2. Verify tier allows scanning (Pro or Business — free tier has 0 scans)
3. Check monthly scan count against tier limit (Pro: 50, Business: 80)
4. Check daily spend cap (circuit breaker)
5. Download the image from Supabase Storage (server-side, using service role key)

**API call pattern:**

```typescript
import Anthropic from '@anthropic-ai/sdk';

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
          text: RESIBO_SCANNER_PROMPT,  // From prompt-library.md §2
        },
      ],
    },
  ],
});
```

**Important parameters:**
- `model`: Always `claude-haiku-4-5` for OCR — cost and speed optimized
- `max_tokens`: 1024 is sufficient for receipt extraction (typical response is 300-600 tokens)
- No `system` parameter for OCR — the task prompt in the user message is self-contained
- `temperature`: Omit (default 1.0) — structured extraction doesn't need low temperature because the prompt is highly constrained

### Step 5: Parse and Validate (Server)

Parse the JSON from Claude's response and validate with Zod. See §5 below for the full schema.

If Zod validation fails:
1. Log the raw response for debugging
2. Attempt a structured retry (one retry only — append "Please respond in valid JSON format" to the prompt)
3. If retry also fails, return a graceful error to the client

### Step 6: Confidence Scoring and Review Card (Client)

The server returns the validated extraction data to the client. The client renders a receipt review card:

- Each field is displayed with its value
- Fields with confidence < 0.8 get a visual warning indicator (amber badge)
- Fields with confidence < 0.5 get a prominent warning (red badge + "I-check po ito")
- User can tap any field to edit it manually
- Prominent "Save" and "Cancel" buttons

KA's message above the card:
- High confidence (≥0.8 overall): "Na-scan ko na yung receipt mo — check mo kung tama lahat bago i-save natin."
- Medium confidence (0.5–0.79): "Na-scan ko na, pero may mga field na hindi ko masyadong nabasa nang maayos. I-check mo po yung mga naka-highlight."
- Low confidence (<0.5): "Medyo malabo yung receipt — maraming hindi mabasa. I-check po lahat ng fields bago i-save."

### Step 7: Save to Database (Server)

When the user confirms, the client sends the (possibly user-edited) data to `/app/api/resibo/save/route.ts`.

This route:
1. Authenticates user
2. Runs deduplication check (§8)
3. Inserts into `receipts` table (metadata + storage path)
4. Inserts into `transactions` table (amount, category, date)
5. Updates `daily_api_spend` with the cost of the scan
6. Returns success with the created transaction ID

---

## 3. Haiku Vision API Call

### Why Haiku, Not Sonnet

Receipt OCR is a structured extraction task — the model reads text from an image and fills a fixed schema. This doesn't require Sonnet's advanced reasoning. Haiku handles it reliably at a fraction of the cost.

| Model | Input (per MTok) | Output (per MTok) | Typical scan cost |
|-------|------------------|---------------------|-------------------|
| Haiku 4.5 | $1.00 | $5.00 | ~$0.0028 (₱0.16) |
| Sonnet 4.6 | $3.00 | $15.00 | ~$0.012 (₱0.69) |

**Pricing reference:** Anthropic uses per-million-token (MTok) pricing. A typical receipt scan uses ~800 input tokens (incl. image) + ~400 output tokens. At Haiku rates: (800/1M × $1.00) + (400/1M × $5.00) ≈ $0.0028 per scan.

At 50 scans/month (Pro tier), Haiku ≈ ₱8/month. Sonnet would be ≈ ₱34.50/month — a meaningful cost difference at scale. The canonical per-scan cost (₱0.16) comes from the Financial Model v5 at 57.2 PHP/USD.

### Image Encoding

- Always base64 encode the JPEG
- Set `media_type: 'image/jpeg'` explicitly
- Keep the image under 1200px longest side (Step 2 compression ensures this)
- Claude Vision accepts up to 5MB base64, but smaller images process faster

### Response Parsing

Claude returns the JSON embedded in its text response. Parse it out:

```typescript
function extractJSON(text: string): unknown {
  // Try to find JSON in markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  // Fall back to finding raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON found in response');
}
```

---

## 4. Output Schema

The OCR extraction returns this structure. Every downstream component (review card, transactions table, expense dashboard) depends on these exact field names.

```typescript
interface ReceiptExtraction {
  store_name: string | null;
  date: string | null;           // ISO 8601: YYYY-MM-DD
  items: ReceiptItem[];
  subtotal_centavos: number | null;
  tax_centavos: number | null;
  total_centavos: number;        // Required — this is the primary financial field
  payment_method:
    | 'cash' | 'gcash' | 'maya' | 'card'
    | 'bank_transfer' | 'other' | null;
  category: string | null;       // Expense category suggestion
  confidence: ConfidenceScores;
  raw_text_excerpt: string;      // First 200 chars of raw text
  warnings: string[];            // Human-readable issues
}

interface ReceiptItem {
  name: string;
  quantity: number | null;
  unit_price_centavos: number | null;
  total_centavos: number;        // Required per item
}

interface ConfidenceScores {
  overall: number;         // 0.0–1.0
  store_name: number;
  date: number;
  total: number;
  items: number;
}
```

---

## 5. Zod Validation

The Zod schema is the source of truth. TypeScript types are derived from it.

```typescript
import { z } from 'zod';

const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unit_price_centavos: z.number().int().nonnegative().nullable(),
  total_centavos: z.number().int().nonnegative(),
});

const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(1),
  store_name: z.number().min(0).max(1),
  date: z.number().min(0).max(1),
  total: z.number().min(0).max(1),
  items: z.number().min(0).max(1),
});

const ReceiptExtractionSchema = z.object({
  store_name: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  items: z.array(ReceiptItemSchema).min(0),
  subtotal_centavos: z.number().int().nonnegative().nullable(),
  tax_centavos: z.number().int().nonnegative().nullable(),
  total_centavos: z.number().int().nonnegative(),
  payment_method: z.enum([
    'cash', 'gcash', 'maya', 'card', 'bank_transfer', 'other'
  ]).nullable(),
  category: z.string().nullable(),
  confidence: ConfidenceSchema,
  raw_text_excerpt: z.string().max(200),
  warnings: z.array(z.string()),
});

type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;
```

### Validation Failure Handling

If the Zod parse fails after the retry:
1. Log the raw response + Zod error for debugging
2. Return to client: `{ success: false, error: { code: "OCR_PARSE_FAIL", message: "Failed to parse receipt", message_tl: "Hindi ma-process ang receipt — subukan ulit o i-type manually." } }`
3. The client shows the error with a manual entry fallback button

---

## 6. Confidence Scoring

Confidence scores drive the UX — they tell the user which fields to trust and which to verify.

### How Haiku Generates Confidence

The system prompt (§2 of prompt-library.md) instructs Haiku to assign confidence per field. The scoring rubric:

| Score | Meaning | UI Treatment |
|-------|---------|--------------|
| 0.9–1.0 | Crystal clear, unambiguous | Green check or no indicator |
| 0.8–0.89 | High confidence, minor issues | No special indicator |
| 0.5–0.79 | Medium — user should verify | Amber warning badge |
| 0.0–0.49 | Low — likely wrong | Red warning badge + "I-check po" |

### Overall Confidence Calculation

The overall confidence is the minimum of the critical fields (date, total, items) — not the average. This is conservative by design: if the total is uncertain, the whole scan should be flagged even if everything else is clear.

```typescript
confidence.overall = Math.min(confidence.date, confidence.total, confidence.items);
```

### Confidence-Based KA Responses

The review card message adapts:

| Overall Confidence | KA Says |
|-------------------|---------|
| ≥ 0.8 | "Na-scan ko na — check mo kung tama lahat bago i-save natin." |
| 0.5–0.79 | "Na-scan ko na, pero may mga hindi ko masyadong nabasa. I-check mo po yung naka-highlight." |
| < 0.5 | "Medyo malabo yung receipt — maraming hindi mabasa. I-check po lahat ng fields." |

---

## 7. Edge Cases

Philippine MSME receipts are messy. The pipeline must handle all of these gracefully.

### 7a. Crumpled or Folded Receipts

- **Symptom**: Haiku returns partial text, low confidence on items
- **Handling**: Flag in warnings: "May nakatiklop na parte ng receipt — baka may items na hindi na-scan." Show manual add button for missing items.

### 7b. Missing Date

- **Symptom**: `date` is null or confidence < 0.5
- **Handling**: Default to today's date with a warning: "Walang date sa receipt — ginamit ko ang today's date. Tama ba?" User can edit.

### 7c. Handwritten Amounts

- **Symptom**: Low confidence on total/items, `warnings` includes handwriting note
- **Handling**: Show the `raw_text_excerpt` alongside the extracted amount so the user can compare. "Handwritten yung amount — ₱{{extracted}}. Tama ba?"

### 7d. Thermal Paper Fade

- **Symptom**: Entire receipt is low confidence, multiple null fields
- **Handling**: If overall confidence < 0.3, suggest manual entry instead: "Medyo faded na yung thermal paper — mas madali kung i-type na lang natin manually. Gusto mo?"

### 7e. GCash/Maya Screenshots

- **Symptom**: Digital payment screenshot instead of paper receipt
- **Handling**: The prompt handles this — category is auto-set to the relevant payment method. Look for transaction ID, amount, and timestamp. These are typically high-confidence since text is digital.

### 7f. Mixed Language Receipts

- **Symptom**: Receipt has Filipino, English, and sometimes Chinese text
- **Handling**: Haiku handles multilingual text natively. No special handling needed — just ensure the items array captures the actual text regardless of language.

### 7g. Partial Text Cutoff

- **Symptom**: Photo doesn't capture the entire receipt
- **Handling**: Flag in warnings: "Mukhang hindi kumpleto yung photo — baka may naputol sa baba/taas." If total is missing, ask user to retake or enter manually.

### 7h. Multiple Receipts in One Photo

- **Symptom**: User photographs two receipts side by side
- **Handling**: Extract the most prominent/largest receipt. Flag in warnings: "May dalawang receipt sa photo — yung mas malaki lang ang na-scan. I-scan mo separately yung isa."

---

## 8. Deduplication

Gap C1 in the gap registry: same receipt can be scanned twice. Deduplication prevents double-counting expenses.

### Deduplication Strategy

Check for potential duplicates before saving to the transactions table:

```sql
SELECT id, store_name, total_centavos, date, created_at
FROM receipts
WHERE user_id = $1
  AND total_centavos = $2
  AND date = $3
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '30 minutes'
```

### Matching Criteria

A potential duplicate is: same user + same total amount + same date + created within 30 minutes. Store name is not part of the match criteria because OCR might extract it differently on a rescan.

### UX for Duplicate Detection

If a potential duplicate is found:
- Show the existing receipt alongside the new scan
- KA says: "Mukhang na-scan mo na ito kanina — same amount at date. Duplicate ba ito, o iba?"
- Options: "Duplicate (don't save)" / "Iba ito (save as new)"

Never silently reject — the user makes the call.

---

## 9. Cost Model

### Per-Scan Cost Breakdown

| Component | Cost (USD) | Cost (PHP @ 57.2) |
|-----------|-----------|-------------------|
| Haiku Vision input (~800 tokens + image @ $1/MTok) | ~$0.0008 | ~₱0.05 |
| Haiku output (~400 tokens @ $5/MTok) | ~$0.0020 | ~₱0.11 |
| Supabase Storage (~300KB) | negligible | negligible |
| **Total per scan** | **~$0.0028** | **~₱0.16** |

### Monthly Cost by Tier

| Tier | Scans/mo | Monthly AI Cost | Monthly Revenue | AI as % of Revenue |
|------|----------|-----------------|-----------------|-------------------|
| Free | 0 | ₱0 | ₱0 | N/A |
| Pro | 50 | ₱8.00 | ₱399 | 2.0% |
| Business | 80 | ₱12.80 | ₱899 | 1.4% |

AI cost is a tiny fraction of revenue — the margin is strong. But this assumes Haiku. Accidentally routing OCR to Sonnet would cost ~₱34.50/month for Pro (8.6% of revenue) — still okay but unnecessarily expensive.

### Tracking

Every scan's cost is logged to the `daily_api_spend` table. Supabase JS client doesn't support atomic increments natively, so use an RPC function:

```sql
-- Supabase RPC function for atomic spend tracking
CREATE OR REPLACE FUNCTION increment_daily_spend(
  p_user_id UUID,
  p_date DATE,
  p_cost_usd DECIMAL,
  p_scan_count INTEGER DEFAULT 0,
  p_query_count INTEGER DEFAULT 0,
  p_briefing_count INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO daily_api_spend (user_id, date, total_cost_usd, scan_count, query_count, briefing_count)
  VALUES (p_user_id, p_date, p_cost_usd, p_scan_count, p_query_count, p_briefing_count)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_cost_usd = daily_api_spend.total_cost_usd + EXCLUDED.total_cost_usd,
    scan_count = daily_api_spend.scan_count + EXCLUDED.scan_count,
    query_count = daily_api_spend.query_count + EXCLUDED.query_count,
    briefing_count = daily_api_spend.briefing_count + EXCLUDED.briefing_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// In the API route, after a successful scan:
await supabase.rpc('increment_daily_spend', {
  p_user_id: userId,
  p_date: today,  // YYYY-MM-DD in Asia/Manila
  p_cost_usd: scanCostUsd,
  p_scan_count: 1,
});
```

---

## 10. Error Handling

Every failure mode has a warm, Taglish user-facing message and an English console log.

| Error | Console Log | User Message (KA) |
|-------|------------|-------------------|
| Camera permission denied | `[Resibo] Camera permission denied` | "Kailangan ng camera access para mag-scan. I-check mo ang settings ng phone mo." |
| Upload failed | `[Resibo] Storage upload failed: ${error}` | "Hindi na-upload yung photo — check mo ang internet connection mo at subukan ulit." |
| Claude API timeout | `[Resibo] Haiku API timeout after 30s` | "Medyo matagal ang processing — subukan ulit mamaya." |
| Claude API error (non-timeout) | `[Resibo] Haiku API error: ${status} ${body}` | "May problema sa scanning — subukan ulit. Kung paulit-ulit, i-type mo na lang manually." |
| Zod validation fail | `[Resibo] Zod parse failed: ${error.issues}` | "Hindi ma-process ang receipt — subukan ulit o i-type manually." |
| Scan limit reached | `[Resibo] Monthly scan limit reached: ${count}/${limit}` | "Naka-{{limit}} scans ka na for this month — next month ulit! Puwede mo pa ring i-type manually." |
| Circuit breaker tripped | `[Resibo] Daily spend cap reached: $${spent}/$${cap}` | "Marami nang na-process natin today — bukas ulit tayo mag-scan." |
| Dedup detected | `[Resibo] Potential duplicate: receipt ${existingId}` | "Mukhang na-scan mo na ito kanina — duplicate ba ito?" |

**Retry policy:** One automatic retry on Claude API timeout or 5xx errors. After that, show the user error message with manual entry fallback. Never retry on 4xx (likely a prompt or input issue).
