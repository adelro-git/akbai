// ============================================================
// Scan Results Tests — Build 3: Resibo Scanner
// Feature: Editable OCR results display before saving
//
// Tests: field extraction helpers, category validation, amount
//        conversion (centavos <-> pesos), edited data shape.
// Vitest node environment — tests logic and data transforms.
// ============================================================

import { describe, it, expect } from 'vitest';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_KEYS, getCategoryDef } from '@/lib/expenses/categories';
import { centavosToPeso, pesoToCentavos } from '@/lib/utils/money';
import type { ReceiptField, ReceiptParseResult, ReceiptFields } from '@/lib/ocr/types';

// ============================================================
// Helper Logic (mirrors scan-results.tsx internal helpers)
// ============================================================

function fieldString(value: string | number | null): string {
  if (value === null) return '';
  return String(value);
}

function fieldCentavos(value: string | number | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function centavosToInputPeso(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

// ============================================================
// Mock OCR Data
// ============================================================

function makeMockField(field: string, value: string | number | null, confidence: 'high' | 'medium' | 'low'): ReceiptField {
  return { field, value, confidence, raw: String(value ?? '') };
}

function makeMockResult(overrides?: Partial<ReceiptFields>): ReceiptParseResult {
  return {
    success: true,
    fields: {
      merchant: makeMockField('merchant', 'SM Supermarket', 'high'),
      date: makeMockField('date', '2026-04-10', 'high'),
      total: makeMockField('total', 34500, 'medium'),
      ...overrides,
    },
    rawText: 'SM Supermarket...',
    model: 'haiku',
    processingTimeMs: 1200,
    tokenUsage: { input: 1500, output: 400 },
  };
}

// ============================================================
// Tests
// ============================================================

describe('ScanResults — field extraction helpers', () => {
  // --- Test 1: fieldString extracts string values correctly ---
  it('extracts string values from ReceiptField, defaulting null to empty', () => {
    expect(fieldString('SM Supermarket')).toBe('SM Supermarket');
    expect(fieldString(34500)).toBe('34500');
    expect(fieldString(null)).toBe('');
  });

  // --- Test 2: fieldCentavos extracts centavo amounts correctly ---
  it('extracts centavos from ReceiptField value, defaulting non-numbers to 0', () => {
    expect(fieldCentavos(34500)).toBe(34500);
    expect(fieldCentavos('34500')).toBe(34500);
    expect(fieldCentavos(null)).toBe(0);
    expect(fieldCentavos('not-a-number')).toBe(0);
  });

  // --- Test 3: centavosToInputPeso converts for input display ---
  it('converts centavos to peso string without peso sign for input fields', () => {
    expect(centavosToInputPeso(34500)).toBe('345.00');
    expect(centavosToInputPeso(100)).toBe('1.00');
    expect(centavosToInputPeso(0)).toBe('0.00');
    expect(centavosToInputPeso(99)).toBe('0.99');
  });
});

describe('ScanResults — amount conversion roundtrip', () => {
  // --- Test 4: Centavo <-> peso roundtrip is lossless ---
  it('converts centavos to pesos and back without loss', () => {
    const originalCentavos = 34550;
    const pesoStr = centavosToInputPeso(originalCentavos);
    const backToCentavos = pesoToCentavos(parseFloat(pesoStr));
    expect(backToCentavos).toBe(originalCentavos);
  });

  // --- Test 5: Display format uses peso sign and commas ---
  it('formats centavos for UI display with peso sign and thousand separators', () => {
    expect(centavosToPeso(345000)).toContain('3,450.00');
    expect(centavosToPeso(345000)).toContain('₱');
    expect(centavosToPeso(100)).toContain('1.00');
  });
});

describe('ScanResults — category selection', () => {
  // --- Test 6: All expense categories have valid keys and labels ---
  it('provides expense categories with non-empty keys and labels', () => {
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
    for (const cat of EXPENSE_CATEGORIES) {
      expect(cat.key).toBeTruthy();
      expect(cat.label).toBeTruthy();
    }
  });

  // --- Test 7: getCategoryDef returns correct definition ---
  it('looks up category definition by key', () => {
    const ingredients = getCategoryDef('ingredients');
    expect(ingredients).toBeDefined();
    expect(ingredients?.label).toContain('Ingredients');

    const unknown = getCategoryDef('nonexistent');
    expect(unknown).toBeUndefined();
  });

  // --- Test 8: Default category (other_expense) exists ---
  it('includes other_expense as a valid default category', () => {
    expect(EXPENSE_CATEGORY_KEYS).toContain('other_expense');
  });
});

describe('ScanResults — mock OCR data shape', () => {
  // --- Test 9: Mock result has required fields ---
  it('produces valid ReceiptParseResult with merchant, date, and total', () => {
    const result = makeMockResult();
    expect(result.success).toBe(true);
    expect(result.fields.merchant.value).toBe('SM Supermarket');
    expect(result.fields.date.value).toBe('2026-04-10');
    expect(result.fields.total.value).toBe(34500);
  });

  // --- Test 10: Confidence levels are correctly assigned ---
  it('correctly assigns confidence levels per field', () => {
    const result = makeMockResult();
    expect(result.fields.merchant.confidence).toBe('high');
    expect(result.fields.total.confidence).toBe('medium');
  });
});
