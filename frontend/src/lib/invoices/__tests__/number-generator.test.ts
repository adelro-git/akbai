import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateInvoiceNumber, parseInvoiceNumber } from '../number-generator';

// ============================================================
// Mock timezone — deterministic "today" for the no-date path
// ============================================================

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-15',
}));

// ============================================================
// Supabase mock — the query chain is a thenable that resolves to
// { data, error }. generateInvoiceNumber now fetches ALL candidate
// rows (no .order/.limit/.maybeSingle), so the terminal awaited value
// is the chain itself resolving to the rows we hand it.
// ============================================================

function makeDb(rows: Array<{ invoice_number: string | null }> | null) {
  // Each builder method returns the chain; the chain is awaited directly.
  const chain: Record<string, unknown> = {};
  const result = { data: rows, error: null };
  for (const m of ['select', 'eq', 'like', 'is']) {
    chain[m] = vi.fn(() => chain);
  }
  // Make the chain awaitable (thenable) like a Supabase query builder.
  (chain as { then: unknown }).then = (resolve: (v: typeof result) => unknown) =>
    Promise.resolve(result).then(resolve);

  const db = {
    from: vi.fn(() => chain),
  };
  return db as unknown as SupabaseClient;
}

// ─── generateInvoiceNumber ───────────────────────────────────────────

describe('generateInvoiceNumber', () => {
  it('starts at -001 when no invoices exist for the month', async () => {
    const db = makeDb([]);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-01');
    expect(result).toBe('INV-202604-001');
  });

  it('starts at -001 when query returns null data', async () => {
    const db = makeDb(null);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-01');
    expect(result).toBe('INV-202604-001');
  });

  it('increments past the existing max sequence', async () => {
    const db = makeDb([
      { invoice_number: 'INV-202604-001' },
      { invoice_number: 'INV-202604-002' },
      { invoice_number: 'INV-202604-003' },
    ]);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-12');
    expect(result).toBe('INV-202604-004');
  });

  it('defaults to today (Manila) when no invoiceDate given', async () => {
    const db = makeDb([]);
    const result = await generateInvoiceNumber(db, 'user-1');
    // getManilaToday() mocked to 2026-04-15 -> yearMonth 202604
    expect(result).toBe('INV-202604-001');
  });

  // ── E4 regression: lexical DB ordering used to return the wrong "max" once a
  //    month exceeded 999 invoices ("...-999" sorts AFTER "...-1000" as strings),
  //    producing a duplicate. With numeric max computed in JS, the next number
  //    after -1000 is -1001, NOT a duplicate of an existing one. ──
  it('computes numeric max so the next after -1000 is -1001 (E4)', async () => {
    // Rows arrive in arbitrary order; the lexical max would be "-999".
    const db = makeDb([
      { invoice_number: 'INV-202604-998' },
      { invoice_number: 'INV-202604-999' },
      { invoice_number: 'INV-202604-1000' },
    ]);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-20');
    expect(result).toBe('INV-202604-1001');
  });

  it('ignores unparseable suffixes and skips null invoice_numbers', async () => {
    const db = makeDb([
      { invoice_number: 'INV-202604-005' },
      { invoice_number: null },
      { invoice_number: 'INV-202604-garbage' },
    ]);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-20');
    expect(result).toBe('INV-202604-006');
  });

  it('keeps zero-padding to at least 3 digits', async () => {
    const db = makeDb([{ invoice_number: 'INV-202604-009' }]);
    const result = await generateInvoiceNumber(db, 'user-1', '2026-04-20');
    expect(result).toBe('INV-202604-010');
  });
});

// ─── parseInvoiceNumber ──────────────────────────────────────────────

describe('parseInvoiceNumber', () => {
  it('parses a standard 3-digit invoice number', () => {
    expect(parseInvoiceNumber('INV-202604-003')).toEqual({
      yearMonth: '202604',
      sequence: 3,
    });
  });

  it('parses a 4-digit suffix (>999 invoices in a month)', () => {
    expect(parseInvoiceNumber('INV-202604-1001')).toEqual({
      yearMonth: '202604',
      sequence: 1001,
    });
  });

  it('returns null for a malformed invoice number', () => {
    expect(parseInvoiceNumber('NOT-AN-INVOICE')).toBeNull();
  });
});
