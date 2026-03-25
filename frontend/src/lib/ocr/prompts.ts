// ============================================================
// System Prompt: Resibo Scanner OCR Extraction (Spike Version)
// Feature: Resibo Scanner (Sprint 4 — Gap E1 OCR Spike)
// Model: claude-haiku-4-5 (Vision) — fallback to claude-sonnet-4-6
// Version: 0.1.0 (spike)
// Last changed: 2026-03-24
//
// Purpose: Extract structured receipt data from Filipino receipt images.
// Output: JSON → Zod validation → confidence scoring
// Guardrails: Confidence thresholds per field, centavo money format
// Dependencies: parse-receipt.ts, schemas.ts
// ============================================================

/**
 * OCR extraction prompt for Filipino receipts.
 * Designed for Claude Vision (Haiku or Sonnet).
 *
 * Handles common PH receipt formats:
 * - SM/Robinson/Puregold POS receipts
 * - Shopee/Lazada waybills and invoices
 * - Sari-sari store handwritten receipts
 * - Thermal faded prints
 * - GCash/Maya digital payment screenshots
 * - BIR-registered OR (Official Receipt) forms
 */
export const RECEIPT_OCR_PROMPT = `You are processing a receipt image for AKBai's Resibo Scanner.

TASK: Extract the following fields from the receipt image into structured JSON.
Be precise — this data will be stored as a financial record.

REQUIRED OUTPUT FORMAT (JSON only — no markdown, no explanation):
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
    "overall": number,
    "store_name": number,
    "date": number,
    "total": number,
    "items": number
  },
  "raw_text_excerpt": string,
  "warnings": string[],
  "tin": string | null,
  "receipt_number": string | null
}

EXTRACTION RULES:
1. All monetary amounts MUST be in centavos (₱34.50 = 3450, ₱1,200.00 = 120000). Never pesos as decimals.
2. Dates in ISO 8601 (YYYY-MM-DD). If only month/day visible, use current year.
   If ambiguous (e.g., 03/04 could be March 4 or April 3), prefer DD/MM for PH receipts but flag in warnings.
3. If a field is unreadable or missing, set to null and lower its confidence score.
4. Add warnings for: crumpled/blurry areas, handwritten amounts, thermal fade,
   partial text cutoff, suspected duplicate items, mixed languages.
5. Category suggestions: "food_ingredients", "packaging", "utilities", "transport",
   "supplies", "equipment", "services", "personal", "other".
6. For GCash/Maya screenshots: extract transaction ID as receipt_number, amount, and timestamp.
7. Look for the merchant TIN (Tax Identification Number) — typically formatted as XXX-XXX-XXX-XXX or XXX-XXX-XXX-000.
8. Look for receipt/OR number — labeled as "OR#", "Receipt No.", "Invoice No.", "SI#", or "Resibo".

PHILIPPINE RECEIPT TERMS (Tagalog/Filipino):
- "Kabuuang Halaga" or "KABUUAN" = Total
- "Buwis" = Tax
- "Petsa" = Date
- "Bilang" = Number/Count
- "Presyo" = Price
- "Halaga" = Amount/Value
- "Pagbabayad" = Payment
- "Sukli" = Change
- "VAT" = 12% Value Added Tax
- "Vatable Sales" = Sales subject to VAT
- "VAT Exempt Sales" = Sales exempt from VAT
- "Zero Rated Sales" = Sales with 0% VAT
- "SC/PWD Discount" = Senior Citizen / PWD discount

CONFIDENCE SCORING:
- 1.0 = clearly printed, fully readable, unambiguous
- 0.8+ = high confidence, minor issues (slight blur, small font)
- 0.5-0.79 = medium confidence — user should verify
- <0.5 = low confidence — field likely wrong, flag prominently

If overall confidence < 0.5, prepend this to warnings:
"Low confidence scan — maraming hindi mabasa. I-check po ang lahat ng fields."

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation text.`;

/**
 * Retry prompt appended when first attempt returns invalid JSON.
 * Used for one structured retry before falling back to error.
 */
export const RECEIPT_OCR_RETRY_SUFFIX = `

Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the schema above. No markdown, no explanation — just the JSON.`;
