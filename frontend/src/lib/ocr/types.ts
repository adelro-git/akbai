// AKBai Sprint 4 — OCR pipeline types for Resibo Scanner
// Gap E1: Receipt OCR spike — types for field extraction, parsing, and spike testing

/** A single extracted field from a receipt with confidence metadata. */
export interface ReceiptField {
  /** Field name, e.g., 'merchant', 'date', 'total' */
  field: string;
  /** Extracted value — string, number (centavos for money), or null if unreadable */
  value: string | number | null;
  /** Model's confidence in the extraction */
  confidence: 'high' | 'medium' | 'low';
  /** Raw text extracted from the receipt for this field */
  raw: string;
}

/** A single line item from a receipt. All money values in centavos. */
export interface ReceiptItemField {
  name: string;
  quantity: number;
  /** Unit price in centavos */
  unitPrice: number;
  /** Line total in centavos */
  total: number;
}

/** Structured fields extracted from a receipt. All money values in centavos. */
export interface ReceiptFields {
  merchant: ReceiptField;
  /** ISO date string (YYYY-MM-DD) */
  date: ReceiptField;
  /** Total amount in centavos */
  total: ReceiptField;
  /** Subtotal in centavos (before tax) */
  subtotal?: ReceiptField;
  /** VAT amount in centavos (12% in PH) */
  vat?: ReceiptField;
  /** Merchant TIN (Tax Identification Number) */
  tin?: ReceiptField;
  /** Individual line items */
  items?: ReceiptItemField[];
  /** Receipt/OR number */
  receiptNumber?: ReceiptField;
}

/** Result of parsing a single receipt image through the OCR pipeline. */
export interface ReceiptParseResult {
  success: boolean;
  fields: ReceiptFields;
  /** Full raw text extracted from the receipt */
  rawText: string;
  /** Which Claude model was used for extraction */
  model: 'haiku' | 'sonnet';
  /** Time taken to process in milliseconds */
  processingTimeMs: number;
  /** Token usage from the Claude API call */
  tokenUsage: { input: number; output: number };
  /** Any errors encountered during parsing */
  errors?: string[];
}

/** Result of running a single receipt through the OCR spike test harness. */
export interface OcrSpikeResult {
  receiptId: string;
  imagePath: string;
  result: ReceiptParseResult;
  /** Accuracy scores — filled in during manual review or against ground truth */
  accuracy?: {
    merchant: boolean;
    date: boolean;
    total: boolean;
    vat: boolean;
    tin: boolean;
    /** Overall accuracy score (0-100) */
    overallScore: number;
  };
}

/** Ground truth data for spike accuracy measurement. */
export interface GroundTruth {
  /** Receipt ID matching the image filename (without extension) */
  receiptId: string;
  /** Expected merchant name */
  merchant: string | null;
  /** Expected date in YYYY-MM-DD format */
  date: string | null;
  /** Expected total in centavos */
  totalCentavos: number | null;
  /** Expected VAT in centavos */
  vatCentavos: number | null;
  /** Expected merchant TIN */
  tin: string | null;
}

/** Raw JSON schema that Claude returns — before transformation to ReceiptParseResult. */
export interface ClaudeReceiptExtraction {
  store_name: string | null;
  date: string | null;
  items: ClaudeReceiptItem[];
  subtotal_centavos: number | null;
  tax_centavos: number | null;
  total_centavos: number;
  payment_method:
    | 'cash' | 'gcash' | 'maya' | 'card'
    | 'bank_transfer' | 'other' | null;
  category: string | null;
  confidence: {
    overall: number;
    store_name: number;
    date: number;
    total: number;
    items: number;
  };
  raw_text_excerpt: string;
  warnings: string[];
  tin?: string | null;
  receipt_number?: string | null;
}

/** A single item in Claude's receipt extraction output. */
export interface ClaudeReceiptItem {
  name: string;
  quantity: number | null;
  unit_price_centavos: number | null;
  total_centavos: number;
}

/** Supported MIME types for receipt images. */
export type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/** Maximum image size in bytes (10MB). */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for receipt uploads. */
export const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
