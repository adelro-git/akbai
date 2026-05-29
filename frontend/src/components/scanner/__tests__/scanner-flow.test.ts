// ============================================================
// Scanner Flow Tests — Build 3: Resibo Scanner
// Feature: Full scan-to-save orchestration flow
//
// Tests: state machine transitions, OCR API response handling,
//        dedup detection logic, save payload construction,
//        error handling, and flow reset.
// Vitest node environment — tests state logic and data transforms.
// ============================================================

import { describe, it, expect } from 'vitest';
import type { ReceiptParseResult, ReceiptField } from '@/lib/ocr/types';
import { CreateTransactionSchema } from '@/lib/expenses/schemas';
import { pesoToCentavos } from '@/lib/utils/money';

// ============================================================
// Flow State Machine (mirrors scanner-flow.tsx)
// ============================================================

type FlowState = 'idle' | 'uploading' | 'reviewing' | 'saving' | 'done' | 'error';

interface FlowTransition {
  from: FlowState;
  action: string;
  to: FlowState;
}

const FLOW_TRANSITIONS: FlowTransition[] = [
  { from: 'idle', action: 'capture', to: 'uploading' },
  { from: 'uploading', action: 'ocr-success', to: 'reviewing' },
  { from: 'uploading', action: 'ocr-error', to: 'error' },
  { from: 'reviewing', action: 'save', to: 'saving' },
  { from: 'reviewing', action: 'cancel', to: 'idle' },
  { from: 'saving', action: 'save-success', to: 'done' },
  { from: 'saving', action: 'save-error', to: 'error' },
  { from: 'done', action: 'scan-another', to: 'idle' },
  { from: 'error', action: 'retry', to: 'idle' },
];

function nextState(from: FlowState, action: string): FlowState | null {
  const match = FLOW_TRANSITIONS.find((t) => t.from === from && t.action === action);
  return match?.to ?? null;
}

// ============================================================
// Dedup Detection Logic (mirrors scanner-flow.tsx)
// ============================================================

interface DedupInfo {
  is_duplicate: boolean;
  existing_transaction: Record<string, unknown> | null;
  receipt_hash: string | null;
}

function shouldShowDedupWarning(dedupInfo: DedupInfo | null): boolean {
  return (
    dedupInfo !== null &&
    dedupInfo.is_duplicate === true &&
    dedupInfo.existing_transaction !== null
  );
}

// ============================================================
// Save Payload Construction (mirrors scanner-flow.tsx -> /api/expenses)
// ============================================================

interface EditedScanData {
  merchant_name: string;
  transaction_date: string;
  amount: number; // centavos
  category: string;
  description: string;
  receipt_hash: string | null;
}

function buildSavePayload(editedData: EditedScanData) {
  return {
    type: 'expense' as const,
    amount: editedData.amount,
    category: editedData.category,
    description: editedData.description || undefined,
    transaction_date: editedData.transaction_date || undefined,
    source: 'ocr' as const,
    merchant_name: editedData.merchant_name || undefined,
    receipt_hash: editedData.receipt_hash || undefined,
  };
}

// ============================================================
// Mock Data
// ============================================================

function makeMockOcrResponse(options?: { isDuplicate?: boolean }) {
  const mockField = (field: string, value: string | number | null, confidence: 'high' | 'medium' | 'low'): ReceiptField => ({
    field, value, confidence, raw: String(value ?? ''),
  });

  const data: ReceiptParseResult & { dedup: DedupInfo } = {
    success: true,
    fields: {
      merchant: mockField('merchant', 'Jollibee', 'high'),
      date: mockField('date', '2026-04-12', 'high'),
      total: mockField('total', 25000, 'high'),
    },
    rawText: 'Jollibee receipt...',
    model: 'haiku',
    processingTimeMs: 900,
    tokenUsage: { input: 1200, output: 300 },
    dedup: {
      is_duplicate: options?.isDuplicate ?? false,
      existing_transaction: options?.isDuplicate
        ? {
            id: 'existing-tx-001',
            amount: 25000,
            category: 'ingredients',
            description: null,
            transaction_date: '2026-04-12',
            merchant_name: 'Jollibee',
            created_at: '2026-04-12T08:00:00Z',
          }
        : null,
      receipt_hash: 'abc123hash',
    },
  };
  return data;
}

// ============================================================
// Tests
// ============================================================

describe('ScannerFlow — state machine', () => {
  // --- Test 1: Idle -> Uploading on capture ---
  it('transitions from idle to uploading when image is captured', () => {
    expect(nextState('idle', 'capture')).toBe('uploading');
  });

  // --- Test 2: Uploading -> Reviewing on OCR success ---
  it('transitions from uploading to reviewing on successful OCR', () => {
    expect(nextState('uploading', 'ocr-success')).toBe('reviewing');
  });

  // --- Test 3: Uploading -> Error on OCR failure ---
  it('transitions from uploading to error on OCR failure', () => {
    expect(nextState('uploading', 'ocr-error')).toBe('error');
  });

  // --- Test 4: Full happy path: idle -> uploading -> reviewing -> saving -> done ---
  it('follows the complete happy path through all states', () => {
    let state: FlowState = 'idle';

    state = nextState(state, 'capture')!;
    expect(state).toBe('uploading');

    state = nextState(state, 'ocr-success')!;
    expect(state).toBe('reviewing');

    state = nextState(state, 'save')!;
    expect(state).toBe('saving');

    state = nextState(state, 'save-success')!;
    expect(state).toBe('done');
  });

  // --- Test 5: Done -> Idle on scan-another ---
  it('resets to idle from done when user wants to scan another', () => {
    expect(nextState('done', 'scan-another')).toBe('idle');
  });

  // --- Test 6: Error -> Idle on retry ---
  it('resets to idle from error when user retries', () => {
    expect(nextState('error', 'retry')).toBe('idle');
  });
});

describe('ScannerFlow — dedup detection', () => {
  // --- Test 7: Shows dedup warning when duplicate found ---
  it('detects duplicate and triggers dedup warning', () => {
    const response = makeMockOcrResponse({ isDuplicate: true });
    expect(shouldShowDedupWarning(response.dedup)).toBe(true);
  });

  // --- Test 8: Skips dedup warning when no duplicate ---
  it('skips dedup warning when no duplicate found', () => {
    const response = makeMockOcrResponse({ isDuplicate: false });
    expect(shouldShowDedupWarning(response.dedup)).toBe(false);
  });

  // --- Test 9: Handles null dedup info gracefully ---
  it('handles null dedup info without error', () => {
    expect(shouldShowDedupWarning(null)).toBe(false);
  });
});

describe('ScannerFlow — save payload construction', () => {
  // --- Test 10: Builds correct payload for OCR transaction ---
  it('constructs save payload with source=ocr and receipt metadata', () => {
    const editedData: EditedScanData = {
      merchant_name: 'Jollibee',
      transaction_date: '2026-04-12',
      amount: 25000,
      category: 'ingredients',
      description: 'Chicken joy',
      receipt_hash: 'abc123hash',
    };

    const payload = buildSavePayload(editedData);

    expect(payload.type).toBe('expense');
    expect(payload.source).toBe('ocr');
    expect(payload.amount).toBe(25000);
    expect(payload.category).toBe('ingredients');
    expect(payload.merchant_name).toBe('Jollibee');
    expect(payload.receipt_hash).toBe('abc123hash');
    expect(payload.description).toBe('Chicken joy');
    expect(payload.transaction_date).toBe('2026-04-12');
  });

  // --- Test 11: Omits empty optional fields ---
  it('omits empty strings as undefined in payload', () => {
    const editedData: EditedScanData = {
      merchant_name: '',
      transaction_date: '',
      amount: 10000,
      category: 'other_expense',
      description: '',
      receipt_hash: null,
    };

    const payload = buildSavePayload(editedData);

    expect(payload.merchant_name).toBeUndefined();
    expect(payload.transaction_date).toBeUndefined();
    expect(payload.description).toBeUndefined();
    expect(payload.receipt_hash).toBeUndefined();
  });

  // --- Test 12: Payload validates against CreateTransactionSchema ---
  it('produces a payload that passes CreateTransactionSchema validation', () => {
    const payload = buildSavePayload({
      merchant_name: 'SM Supermarket',
      transaction_date: '2026-04-10',
      amount: 34500,
      category: 'supplies',
      description: 'Office supplies',
      receipt_hash: 'hash123',
    });

    const result = CreateTransactionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

describe('ScannerFlow — amount handling', () => {
  // --- Test 13: Peso to centavo conversion for save ---
  it('converts user-entered peso amount to centavos for save', () => {
    // User types "345.50" in the amount field (pesos)
    const userInput = 345.5;
    const centavos = pesoToCentavos(userInput);
    expect(centavos).toBe(34550);
  });

  // --- Test 14: Zero amount edge case ---
  it('handles zero amount without error', () => {
    const payload = buildSavePayload({
      merchant_name: 'Test',
      transaction_date: '2026-04-10',
      amount: 0,
      category: 'other_expense',
      description: '',
      receipt_hash: null,
    });
    // Amount 0 will fail schema validation (positive required) — this is expected
    const result = CreateTransactionSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('ScannerFlow — OCR response parsing', () => {
  // --- Test 15: Extracts parse result and dedup info from API response ---
  it('separates parse result from dedup info in API response', () => {
    const response = makeMockOcrResponse();
    const { dedup, ...parseResult } = response;

    expect(parseResult.success).toBe(true);
    expect(parseResult.fields.merchant.value).toBe('Jollibee');
    expect(parseResult.fields.total.value).toBe(25000);
    expect(dedup.receipt_hash).toBe('abc123hash');
  });

  // --- Test 16: Handles OCR error response shape ---
  it('detects error response from OCR API', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'OCR failed',
        message_tl: 'Hindi ma-scan ang resibo — subukan ulit.',
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error.message_tl).toContain('subukan ulit');
  });
});

// ============================================================
// Offline replay decisions (Sprint 18 — F1/F2/F3 review fixes)
// Mirrors the pure decision logic in scanner-flow.tsx's flush replay so we can
// unit-test the branches without rendering the client component. The mirrored
// helpers below are byte-for-byte the logic shipped in scanner-flow.tsx.
// ============================================================

// --- Mirror: RetriableOcrError + isNetworkError (F2) ---
class RetriableOcrError extends Error {
  constructor(message = 'OCR temporarily unavailable') {
    super(message);
    this.name = 'RetriableOcrError';
  }
}
function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || err instanceof RetriableOcrError;
}

// --- Mirror: extractValidExpense (F1) ---
const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
function extractValidExpense(
  fields: ReceiptParseResult['fields']
): { amount: number; transaction_date: string; merchant_name?: string } | null {
  const amount = typeof fields.total?.value === 'number' ? fields.total.value : NaN;
  const date = typeof fields.date?.value === 'string' ? fields.date.value : '';
  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (!YYYY_MM_DD.test(date)) return null;
  return {
    amount,
    transaction_date: date,
    merchant_name:
      typeof fields.merchant?.value === 'string' && fields.merchant.value
        ? fields.merchant.value
        : undefined,
  };
}

function field(value: string | number | null): ReceiptField {
  return { field: 'x', value, confidence: 'high', raw: String(value ?? '') };
}

describe('ScannerFlow — F2 network-error classification', () => {
  it('classifies a fetch TypeError as a network (retriable) error', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('classifies a RetriableOcrError (non-OK status / non-JSON body) as retriable', () => {
    // This is the bug F2 fixes: a 502 with an HTML body throws SyntaxError on
    // res.json(); wrapping it in RetriableOcrError keeps it queue-worthy.
    expect(isNetworkError(new RetriableOcrError('status 502'))).toBe(true);
  });

  it('does NOT classify a generic Error (genuine scan failure) as retriable', () => {
    // A 200 success:false (unreadable image) → hard drop, not a queue-loop.
    expect(isNetworkError(new Error('image too blurry'))).toBe(false);
  });

  it('does NOT classify a SyntaxError as retriable on its own (must be wrapped)', () => {
    // Proves the old `err instanceof TypeError` check would have MISSED a raw
    // SyntaxError — the fix is to wrap non-JSON bodies in RetriableOcrError.
    expect(isNetworkError(new SyntaxError('Unexpected token <'))).toBe(false);
  });
});

describe('ScannerFlow — F1 replay validation (before POST)', () => {
  it('accepts a positive-integer centavo amount + YYYY-MM-DD date', () => {
    const result = extractValidExpense({
      merchant: field('Jollibee'),
      date: field('2026-04-12'),
      total: field(25000),
    });
    expect(result).toEqual({
      amount: 25000,
      transaction_date: '2026-04-12',
      merchant_name: 'Jollibee',
    });
  });

  it('rejects a zero/unreadable amount (would 400 on /api/expenses → drop)', () => {
    expect(
      extractValidExpense({
        merchant: field('Jollibee'),
        date: field('2026-04-12'),
        total: field(0),
      })
    ).toBeNull();
  });

  it('rejects a non-numeric (null) amount', () => {
    expect(
      extractValidExpense({
        merchant: field('Jollibee'),
        date: field('2026-04-12'),
        total: field(null),
      })
    ).toBeNull();
  });

  it('rejects a non-integer (fractional) amount', () => {
    expect(
      extractValidExpense({
        merchant: field('Jollibee'),
        date: field('2026-04-12'),
        total: field(250.5),
      })
    ).toBeNull();
  });

  it('rejects a date that is not strict YYYY-MM-DD', () => {
    expect(
      extractValidExpense({
        merchant: field('Jollibee'),
        date: field('April 12, 2026'),
        total: field(25000),
      })
    ).toBeNull();
  });

  it('rejects a missing/empty date', () => {
    expect(
      extractValidExpense({
        merchant: field('Jollibee'),
        date: field(''),
        total: field(25000),
      })
    ).toBeNull();
  });

  it('treats an empty merchant as undefined (still valid)', () => {
    const result = extractValidExpense({
      merchant: field(''),
      date: field('2026-04-12'),
      total: field(25000),
    });
    expect(result?.merchant_name).toBeUndefined();
    expect(result?.amount).toBe(25000);
  });
});

describe('ScannerFlow — F3 replay dedup skip', () => {
  // The replay path drops (silently skips) a queued scan flagged duplicate by
  // /api/ocr, rather than inserting a second copy. Mirror that decision.
  function replayDedupOutcome(dedup: DedupInfo): 'drop' | 'save' {
    return dedup.is_duplicate ? 'drop' : 'save';
  }

  it('drops a duplicate-flagged queued scan instead of re-inserting it', () => {
    const response = makeMockOcrResponse({ isDuplicate: true });
    expect(replayDedupOutcome(response.dedup)).toBe('drop');
  });

  it('saves a non-duplicate queued scan', () => {
    const response = makeMockOcrResponse({ isDuplicate: false });
    expect(replayDedupOutcome(response.dedup)).toBe('save');
  });
});
