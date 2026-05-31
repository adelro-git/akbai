// AKBai Sprint 4 — OCR pipeline unit tests (Gap E1 Spike)
// Tests parsing logic with mocked Claude API responses.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractJSON, validateImage } from '../parse-receipt';
import {
  ClaudeReceiptExtractionSchema,
  ReceiptParseResultSchema,
} from '../schemas';
import type { ClaudeReceiptExtraction } from '../types';

// --- Mock Data: Valid receipt extraction ---

const MOCK_VALID_EXTRACTION: ClaudeReceiptExtraction = {
  store_name: 'SM Supermarket Megamall',
  date: '2026-03-20',
  items: [
    {
      name: 'Lucky Me Pancit Canton',
      quantity: 3,
      unit_price_centavos: 1250,
      total_centavos: 3750,
    },
    {
      name: 'Argentina Corned Beef 260g',
      quantity: 1,
      unit_price_centavos: 5500,
      total_centavos: 5500,
    },
    {
      name: 'Joy Dishwashing Liquid 250ml',
      quantity: 2,
      unit_price_centavos: 4900,
      total_centavos: 9800,
    },
  ],
  subtotal_centavos: 19050,
  tax_centavos: 2040,
  total_centavos: 19050,
  payment_method: 'cash',
  category: 'food_ingredients',
  confidence: {
    overall: 0.95,
    store_name: 0.98,
    date: 0.95,
    total: 0.99,
    items: 0.88,
  },
  raw_text_excerpt: 'SM SUPERMARKET\nSM MEGAMALL\nORTIGAS CENTER MANDALUYONG\nTIN: 000-108-276-000\nOR#: 12345678',
  warnings: [],
  tin: '000-108-276-000',
  receipt_number: '12345678',
};

const MOCK_LOW_CONFIDENCE_EXTRACTION: ClaudeReceiptExtraction = {
  store_name: null,
  date: '2026-03-19',
  items: [],
  subtotal_centavos: null,
  tax_centavos: null,
  total_centavos: 15000,
  payment_method: null,
  category: null,
  confidence: {
    overall: 0.35,
    store_name: 0.2,
    date: 0.55,
    total: 0.4,
    items: 0.1,
  },
  raw_text_excerpt: '...malabo...₱150.00...TOTAL...',
  warnings: [
    'Low confidence scan — maraming hindi mabasa. I-check po ang lahat ng fields.',
    'Thermal paper fade detected — maraming hindi mabasa.',
  ],
  tin: null,
  receipt_number: null,
};

const MOCK_MALFORMED_JSON_RESPONSE = `Sure, here's the extracted data:

{
  "store_name": "SM Supermarket",
  "total_centavos": "not_a_number"
}

Hope this helps!`;

// --- extractJSON Tests ---

describe('extractJSON', () => {
  it('extracts raw JSON from plain text', () => {
    const input = '{"store_name": "SM", "total_centavos": 5000}';
    const result = extractJSON(input);
    expect(result).toEqual({ store_name: 'SM', total_centavos: 5000 });
  });

  it('extracts JSON from markdown code block', () => {
    const input = '```json\n{"store_name": "SM", "total_centavos": 5000}\n```';
    const result = extractJSON(input);
    expect(result).toEqual({ store_name: 'SM', total_centavos: 5000 });
  });

  it('extracts JSON from code block without language tag', () => {
    const input = '```\n{"store_name": "SM", "total_centavos": 5000}\n```';
    const result = extractJSON(input);
    expect(result).toEqual({ store_name: 'SM', total_centavos: 5000 });
  });

  it('extracts JSON embedded in surrounding text', () => {
    const input = 'Here is the result:\n{"store_name": "SM", "total_centavos": 5000}\nThat is all.';
    const result = extractJSON(input);
    expect(result).toEqual({ store_name: 'SM', total_centavos: 5000 });
  });

  it('throws when no JSON found', () => {
    expect(() => extractJSON('No JSON here at all.')).toThrow('No JSON found');
  });

  it('throws on invalid JSON', () => {
    expect(() => extractJSON('{invalid json}')).toThrow();
  });
});

// --- validateImage Tests ---

describe('validateImage', () => {
  it('accepts valid JPEG image', () => {
    const buffer = Buffer.alloc(1024); // 1KB
    const result = validateImage(buffer, 'image/jpeg');
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('accepts valid PNG image', () => {
    const buffer = Buffer.alloc(2048);
    const result = validateImage(buffer, 'image/png');
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe('image/png');
  });

  it('accepts valid WebP image', () => {
    const buffer = Buffer.alloc(512);
    const result = validateImage(buffer, 'image/webp');
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe('image/webp');
  });

  it('rejects oversized image (>10MB)', () => {
    const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    expect(() => validateImage(buffer, 'image/jpeg')).toThrow('Image too large');
  });

  it('rejects exactly over 10MB', () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024 + 1); // 10MB + 1 byte
    expect(() => validateImage(buffer, 'image/jpeg')).toThrow('Image too large');
  });

  it('accepts image at exactly 10MB', () => {
    const buffer = Buffer.alloc(10 * 1024 * 1024); // exactly 10MB
    const result = validateImage(buffer, 'image/jpeg');
    expect(result.valid).toBe(true);
  });

  it('rejects empty buffer', () => {
    const buffer = Buffer.alloc(0);
    expect(() => validateImage(buffer, 'image/jpeg')).toThrow('empty');
  });

  it('rejects unsupported MIME type: image/gif', () => {
    const buffer = Buffer.alloc(1024);
    expect(() => validateImage(buffer, 'image/gif')).toThrow('Unsupported image type');
  });

  it('rejects unsupported MIME type: image/tiff', () => {
    const buffer = Buffer.alloc(1024);
    expect(() => validateImage(buffer, 'image/tiff')).toThrow('Unsupported image type');
  });

  it('rejects non-image MIME type', () => {
    const buffer = Buffer.alloc(1024);
    expect(() => validateImage(buffer, 'application/pdf')).toThrow('Unsupported image type');
  });
});

// --- Zod Schema Validation Tests ---

describe('ClaudeReceiptExtractionSchema', () => {
  it('validates a complete extraction', () => {
    const result = ClaudeReceiptExtractionSchema.safeParse(MOCK_VALID_EXTRACTION);
    expect(result.success).toBe(true);
  });

  it('validates extraction with low confidence and null fields', () => {
    const result = ClaudeReceiptExtractionSchema.safeParse(MOCK_LOW_CONFIDENCE_EXTRACTION);
    expect(result.success).toBe(true);
  });

  it('rejects extraction with missing total_centavos', () => {
    const invalid = { ...MOCK_VALID_EXTRACTION, total_centavos: undefined };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction with negative total_centavos', () => {
    const invalid = { ...MOCK_VALID_EXTRACTION, total_centavos: -100 };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction with invalid date format', () => {
    const invalid = { ...MOCK_VALID_EXTRACTION, date: '03/20/2026' };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts extraction with null date', () => {
    const valid = { ...MOCK_VALID_EXTRACTION, date: null };
    const result = ClaudeReceiptExtractionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects extraction with invalid payment_method', () => {
    const invalid = { ...MOCK_VALID_EXTRACTION, payment_method: 'bitcoin' };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction with confidence score > 1', () => {
    const invalid = {
      ...MOCK_VALID_EXTRACTION,
      confidence: { ...MOCK_VALID_EXTRACTION.confidence, overall: 1.5 },
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction with confidence score < 0', () => {
    const invalid = {
      ...MOCK_VALID_EXTRACTION,
      confidence: { ...MOCK_VALID_EXTRACTION.confidence, total: -0.1 },
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates extraction with empty items array', () => {
    const valid = { ...MOCK_VALID_EXTRACTION, items: [] };
    const result = ClaudeReceiptExtractionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects item with empty name', () => {
    const invalid = {
      ...MOCK_VALID_EXTRACTION,
      items: [{ name: '', quantity: 1, unit_price_centavos: 100, total_centavos: 100 }],
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects item with negative total_centavos', () => {
    const invalid = {
      ...MOCK_VALID_EXTRACTION,
      items: [{ name: 'Test', quantity: 1, unit_price_centavos: 100, total_centavos: -50 }],
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts TIN field when present', () => {
    const valid = { ...MOCK_VALID_EXTRACTION, tin: '123-456-789-000' };
    const result = ClaudeReceiptExtractionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts receipt_number when present', () => {
    const valid = { ...MOCK_VALID_EXTRACTION, receipt_number: 'OR-2026-00123' };
    const result = ClaudeReceiptExtractionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

// --- Centavo Conversion Tests ---

describe('centavo money format', () => {
  it('stores ₱34.50 as 3450 centavos', () => {
    const extraction = {
      ...MOCK_VALID_EXTRACTION,
      total_centavos: 3450,
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_centavos).toBe(3450);
    }
  });

  it('stores ₱1,200.00 as 120000 centavos', () => {
    const extraction = {
      ...MOCK_VALID_EXTRACTION,
      total_centavos: 120000,
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_centavos).toBe(120000);
    }
  });

  it('stores ₱0.50 as 50 centavos', () => {
    const extraction = {
      ...MOCK_VALID_EXTRACTION,
      total_centavos: 50,
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_centavos).toBe(50);
    }
  });

  it('allows 0 centavos (free items)', () => {
    const extraction = {
      ...MOCK_VALID_EXTRACTION,
      total_centavos: 0,
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(true);
  });

  it('rejects decimal centavos (must be integer)', () => {
    const extraction = {
      ...MOCK_VALID_EXTRACTION,
      total_centavos: 3450.5,
    };
    const result = ClaudeReceiptExtractionSchema.safeParse(extraction);
    expect(result.success).toBe(false);
  });
});

// --- parseReceipt Integration Tests (mocked Claude API) ---

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

describe('parseReceipt', () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Set API key
    process.env.ANTHROPIC_API_KEY = 'test-key-for-unit-tests';

    // Re-import to get fresh mock
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    mockCreate = vi.fn();
    (Anthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  it('parses a valid receipt with high confidence', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_VALID_EXTRACTION) }],
      usage: { input_tokens: 800, output_tokens: 400 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.model).toBe('haiku');
    expect(result.fields.merchant.value).toBe('SM Supermarket Megamall');
    expect(result.fields.total.value).toBe(19050);
    expect(result.fields.date.value).toBe('2026-03-20');
    expect(result.fields.merchant.confidence).toBe('high');
    expect(result.fields.total.confidence).toBe('high');
    expect(result.tokenUsage.input).toBe(800);
    expect(result.tokenUsage.output).toBe(400);
  });

  it('auto-retries with Sonnet on low Haiku confidence', async () => {
    // First call (Haiku) returns low confidence
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_LOW_CONFIDENCE_EXTRACTION) }],
      usage: { input_tokens: 800, output_tokens: 300 },
    });

    // Second call (Sonnet) returns high confidence
    const sonnetExtraction = {
      ...MOCK_VALID_EXTRACTION,
      confidence: { overall: 0.85, store_name: 0.90, date: 0.88, total: 0.95, items: 0.82 },
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(sonnetExtraction) }],
      usage: { input_tokens: 900, output_tokens: 450 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.model).toBe('sonnet');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid MIME type before API call', async () => {
    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/gif');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some((e) => e.includes('Unsupported image type'))).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects oversized image before API call', async () => {
    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some((e) => e.includes('10MB limit'))).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('handles missing fields gracefully', async () => {
    const minimalExtraction: ClaudeReceiptExtraction = {
      store_name: null,
      date: null,
      items: [],
      subtotal_centavos: null,
      tax_centavos: null,
      total_centavos: 5000,
      payment_method: null,
      category: null,
      confidence: {
        overall: 0.6,
        store_name: 0.1,
        date: 0.2,
        total: 0.7,
        items: 0.1,
      },
      raw_text_excerpt: '₱50.00 TOTAL',
      warnings: ['Minimal data extracted'],
      tin: null,
      receipt_number: null,
    };

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(minimalExtraction) }],
      usage: { input_tokens: 800, output_tokens: 200 },
    });

    // Sonnet fallback (low confidence triggers it)
    const betterExtraction = {
      ...minimalExtraction,
      store_name: 'Unknown Store',
      confidence: { overall: 0.65, store_name: 0.5, date: 0.3, total: 0.75, items: 0.2 },
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(betterExtraction) }],
      usage: { input_tokens: 900, output_tokens: 250 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.fields.merchant.value).toBe('Unknown Store');
    expect(result.fields.date.value).toBeNull();
    expect(result.fields.total.value).toBe(5000);
    expect(result.fields.vat).toBeUndefined();
    expect(result.fields.tin).toBeUndefined();
    expect(result.fields.items).toBeUndefined();
  });

  it('retries once on JSON parse failure then returns error', async () => {
    // First attempt — bad JSON
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I cannot process this image.' }],
      usage: { input_tokens: 800, output_tokens: 50 },
    });

    // Retry — also bad JSON
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, still cannot extract data.' }],
      usage: { input_tokens: 800, output_tokens: 50 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('catches malformed Claude response via Zod validation', async () => {
    const badExtraction = {
      store_name: 'SM',
      total_centavos: 'not_a_number', // Zod will reject this
    };

    // Both attempts return bad schema
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(badExtraction) }],
      usage: { input_tokens: 800, output_tokens: 200 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('returns error when API key is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some((e) => e.includes('ANTHROPIC_API_KEY'))).toBe(true);
  });

  it('forces Sonnet model when specified', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_VALID_EXTRACTION) }],
      usage: { input_tokens: 900, output_tokens: 450 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const imageBuffer = Buffer.alloc(1024);
    const result = await parseReceipt(imageBuffer, 'image/jpeg', { forceModel: 'sonnet' });

    expect(result.success).toBe(true);
    expect(result.model).toBe('sonnet');
    // Should NOT trigger fallback since model was forced
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  // --- C3: accumulate token usage across BOTH calls on a Haiku→Sonnet fallback ---

  it('accumulates token usage across both calls on a Sonnet fallback (C3)', async () => {
    // Haiku: low confidence (triggers fallback)
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_LOW_CONFIDENCE_EXTRACTION) }],
      usage: { input_tokens: 800, output_tokens: 300 },
    });
    // Sonnet: higher confidence (wins)
    const sonnetExtraction = {
      ...MOCK_VALID_EXTRACTION,
      confidence: { overall: 0.85, store_name: 0.9, date: 0.88, total: 0.95, items: 0.82 },
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(sonnetExtraction) }],
      usage: { input_tokens: 900, output_tokens: 450 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.model).toBe('sonnet');
    // Cumulative tokenUsage = Haiku + Sonnet
    expect(result.tokenUsage.input).toBe(800 + 900);
    expect(result.tokenUsage.output).toBe(300 + 450);
    // Per-call breakdown records BOTH models so the route bills each at its rate
    expect(result.tokenUsageBreakdown).toHaveLength(2);
    expect(result.tokenUsageBreakdown?.[0]).toMatchObject({ model: 'haiku', input: 800, output: 300 });
    expect(result.tokenUsageBreakdown?.[1]).toMatchObject({ model: 'sonnet', input: 900, output: 450 });
  });

  it('records a single-call breakdown for a high-confidence Haiku parse (C3)', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_VALID_EXTRACTION) }],
      usage: { input_tokens: 800, output_tokens: 400 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    expect(result.tokenUsageBreakdown).toHaveLength(1);
    expect(result.tokenUsageBreakdown?.[0]).toMatchObject({ model: 'haiku', input: 800, output: 400 });
    expect(result.tokenUsage).toEqual({ input: 800, output: 400 });
  });

  it('bills the Sonnet fallback call even when its result is discarded (C3)', async () => {
    // Haiku low confidence → triggers fallback
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(MOCK_LOW_CONFIDENCE_EXTRACTION) }],
      usage: { input_tokens: 800, output_tokens: 300 },
    });
    // Sonnet returns LOWER overall confidence → Haiku result is kept, but the
    // Sonnet call still consumed tokens and must be billed.
    const worseSonnet = {
      ...MOCK_LOW_CONFIDENCE_EXTRACTION,
      confidence: { ...MOCK_LOW_CONFIDENCE_EXTRACTION.confidence, overall: 0.3 },
    };
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(worseSonnet) }],
      usage: { input_tokens: 900, output_tokens: 250 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    // Haiku result kept...
    expect(result.model).toBe('haiku');
    // ...but BOTH calls billed.
    expect(result.tokenUsageBreakdown).toHaveLength(2);
    expect(result.tokenUsage.input).toBe(800 + 900);
    expect(result.tokenUsage.output).toBe(300 + 250);
  });

  // --- C2: only retry GENUINE parse failures, never API/auth/rate-limit errors ---

  it('does NOT retry on an Anthropic-style API error (status set) (C2)', async () => {
    const apiError = Object.assign(new Error('rate limited'), {
      name: 'RateLimitError',
      status: 429,
    });
    mockCreate.mockRejectedValueOnce(apiError);

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    expect(result.success).toBe(false);
    // No retry — the single failed call is the only call.
    expect(mockCreate).toHaveBeenCalledTimes(1);
    // No tokens were billed (the API call itself threw).
    expect(result.tokenUsage).toEqual({ input: 0, output: 0 });
  });

  it('retries once on a genuine JSON parse failure then bills both calls (C2 + C3)', async () => {
    // Both attempts return non-JSON text → extractJSON throws "No JSON found".
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I cannot read this receipt.' }],
      usage: { input_tokens: 700, output_tokens: 40 },
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Still cannot extract.' }],
      usage: { input_tokens: 720, output_tokens: 45 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    expect(result.success).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    // Both billed calls surfaced for cost recording.
    expect(result.tokenUsage.input).toBe(700 + 720);
    expect(result.tokenUsageBreakdown).toHaveLength(2);
  });

  // --- C7: empty content array must not throw a TypeError ---

  it('handles an empty content array without throwing (C7)', async () => {
    // First call: empty content array (would be content[0].type → TypeError).
    mockCreate.mockResolvedValueOnce({
      content: [],
      usage: { input_tokens: 600, output_tokens: 10 },
    });
    // Retry (No-JSON is retryable): also empty.
    mockCreate.mockResolvedValueOnce({
      content: [],
      usage: { input_tokens: 600, output_tokens: 10 },
    });

    const { parseReceipt } = await import('../parse-receipt');
    const result = await parseReceipt(Buffer.alloc(1024), 'image/jpeg');

    // Degrades to the normal failure path, never a TypeError.
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

// --- ReceiptParseResult Schema Validation ---

describe('ReceiptParseResultSchema', () => {
  it('validates a complete parse result', () => {
    const mockResult = {
      success: true,
      fields: {
        merchant: { field: 'merchant', value: 'SM Supermarket', confidence: 'high', raw: 'SM SUPERMARKET' },
        date: { field: 'date', value: '2026-03-20', confidence: 'high', raw: '2026-03-20' },
        total: { field: 'total', value: 19050, confidence: 'high', raw: '19050' },
      },
      rawText: 'SM SUPERMARKET...',
      model: 'haiku' as const,
      processingTimeMs: 1200,
      tokenUsage: { input: 800, output: 400 },
    };

    const result = ReceiptParseResultSchema.safeParse(mockResult);
    expect(result.success).toBe(true);
  });

  it('validates parse result with optional fields', () => {
    const mockResult = {
      success: true,
      fields: {
        merchant: { field: 'merchant', value: 'SM', confidence: 'high', raw: 'SM' },
        date: { field: 'date', value: '2026-03-20', confidence: 'medium', raw: '03/20' },
        total: { field: 'total', value: 19050, confidence: 'high', raw: '190.50' },
        vat: { field: 'vat', value: 2040, confidence: 'high', raw: '20.40' },
        tin: { field: 'tin', value: '000-108-276-000', confidence: 'high', raw: '000-108-276-000' },
        items: [
          { name: 'Test Item', quantity: 1, unitPrice: 5000, total: 5000 },
        ],
        receiptNumber: { field: 'receiptNumber', value: 'OR-123', confidence: 'high', raw: 'OR-123' },
      },
      rawText: 'SM...',
      model: 'sonnet' as const,
      processingTimeMs: 2500,
      tokenUsage: { input: 900, output: 450 },
      errors: ['Minor blur detected'],
    };

    const result = ReceiptParseResultSchema.safeParse(mockResult);
    expect(result.success).toBe(true);
  });
});
