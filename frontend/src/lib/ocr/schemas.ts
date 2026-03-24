// AKBai Sprint 4 — Zod schemas for OCR receipt extraction
// Validates Claude's JSON output before returning to caller.
// Source of truth: ocr-pipeline.md §5

import { z } from 'zod';

// --- Claude API Response Schemas ---

/** Schema for a single line item in Claude's extraction output. */
export const ClaudeReceiptItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unit_price_centavos: z.number().int().nonnegative().nullable(),
  total_centavos: z.number().int().nonnegative(),
});

/** Schema for per-field confidence scores (0.0–1.0). */
export const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(1),
  store_name: z.number().min(0).max(1),
  date: z.number().min(0).max(1),
  total: z.number().min(0).max(1),
  items: z.number().min(0).max(1),
});

/** Schema for the full receipt extraction from Claude's JSON response. */
export const ClaudeReceiptExtractionSchema = z.object({
  store_name: z.string().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  items: z.array(ClaudeReceiptItemSchema).min(0),
  subtotal_centavos: z.number().int().nonnegative().nullable(),
  tax_centavos: z.number().int().nonnegative().nullable(),
  total_centavos: z.number().int().nonnegative(),
  payment_method: z
    .enum(['cash', 'gcash', 'maya', 'card', 'bank_transfer', 'other'])
    .nullable(),
  category: z.string().nullable(),
  confidence: ConfidenceSchema,
  raw_text_excerpt: z.string().max(500),
  warnings: z.array(z.string()),
  tin: z.string().nullable().optional(),
  receipt_number: z.string().nullable().optional(),
});

export type ClaudeReceiptExtractionParsed = z.infer<typeof ClaudeReceiptExtractionSchema>;

// --- Request Validation Schemas ---

/** Schema for OCR API route request validation (FormData fields). */
export const OcrRequestSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024, {
    message: 'Image must be under 10MB',
  }),
});

// --- Receipt Field Schema ---

/** Schema for a single extracted receipt field with confidence. */
export const ReceiptFieldSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.null()]),
  confidence: z.enum(['high', 'medium', 'low']),
  raw: z.string(),
});

/** Schema for a receipt line item. All money values in centavos. */
export const ReceiptItemFieldSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unitPrice: z.number().int(),
  total: z.number().int(),
});

/** Schema for the full ReceiptParseResult returned by parseReceipt(). */
export const ReceiptParseResultSchema = z.object({
  success: z.boolean(),
  fields: z.object({
    merchant: ReceiptFieldSchema,
    date: ReceiptFieldSchema,
    total: ReceiptFieldSchema,
    subtotal: ReceiptFieldSchema.optional(),
    vat: ReceiptFieldSchema.optional(),
    tin: ReceiptFieldSchema.optional(),
    items: z.array(ReceiptItemFieldSchema).optional(),
    receiptNumber: ReceiptFieldSchema.optional(),
  }),
  rawText: z.string(),
  model: z.enum(['haiku', 'sonnet']),
  processingTimeMs: z.number(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }),
  errors: z.array(z.string()).optional(),
});
