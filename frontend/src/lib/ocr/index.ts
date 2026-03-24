// AKBai Sprint 4 — OCR module barrel export (Gap E1 Spike)

export { parseReceipt, validateImage, extractJSON, estimateOcrCost, calculateOcrCost } from './parse-receipt';
export { RECEIPT_OCR_PROMPT, RECEIPT_OCR_RETRY_SUFFIX } from './prompts';
export {
  ClaudeReceiptExtractionSchema,
  ClaudeReceiptItemSchema,
  ConfidenceSchema,
  OcrRequestSchema,
  ReceiptFieldSchema,
  ReceiptItemFieldSchema,
  ReceiptParseResultSchema,
} from './schemas';
export type {
  ReceiptField,
  ReceiptItemField,
  ReceiptFields,
  ReceiptParseResult,
  OcrSpikeResult,
  GroundTruth,
  ClaudeReceiptExtraction,
  ClaudeReceiptItem,
  SupportedMimeType,
} from './types';
export { MAX_IMAGE_SIZE_BYTES, SUPPORTED_MIME_TYPES } from './types';
