/**
 * Unit tests — Expenses CSV export (Sprint 18 §11)
 *
 * Contract:
 *   - Always emits the header row, even for an empty list.
 *   - RFC-4180 escaping: fields with comma / quote / newline get quoted, inner
 *     quotes doubled.
 *   - Amounts are integer centavos → fixed 2-decimal peso (no ₱, no grouping).
 *   - Deterministic column order; rows preserve input order.
 *
 * Why these tests: a broken CSV is silent data corruption — a stray unescaped
 * comma shifts every downstream column in Excel and the MSME owner files the
 * wrong number with BIR. The escaping + money cases are the load-bearing ones.
 */

import { describe, it, expect } from 'vitest';
import {
  transactionsToCsv,
  _CSV_COLUMNS,
  type ExportableTransaction,
} from '../csv';

function tx(overrides: Partial<ExportableTransaction> = {}): ExportableTransaction {
  return {
    transaction_date: '2026-05-29',
    type: 'expense',
    category: 'ingredients',
    description: 'Sangkap',
    amount: 12345, // ₱123.45
    source: 'manual',
    ...overrides,
  };
}

describe('lib/expenses/csv — transactionsToCsv', () => {
  // ----------------------------------------------------------
  // Header
  // ----------------------------------------------------------
  describe('header', () => {
    it('emits the header row for an empty list (and nothing else)', () => {
      const csv = transactionsToCsv([]);
      expect(csv).toBe(_CSV_COLUMNS.join(','));
      // Single line — no trailing data rows.
      expect(csv.split('\r\n')).toHaveLength(1);
    });

    it('header is the first line and matches the deterministic column order', () => {
      const csv = transactionsToCsv([tx()]);
      const [header] = csv.split('\r\n');
      expect(header).toBe('Petsa,Petsa (UTC+8),Uri,Kategorya,Paliwanag,Halaga (PHP),Pinagmulan');
    });
  });

  // ----------------------------------------------------------
  // Escaping (RFC-4180)
  // ----------------------------------------------------------
  describe('escaping', () => {
    it('quotes a field containing a comma', () => {
      const csv = transactionsToCsv([tx({ description: 'Rice, sugar, oil' })]);
      const dataLine = csv.split('\r\n')[1];
      expect(dataLine).toContain('"Rice, sugar, oil"');
    });

    it('quotes a field with a double-quote and doubles the inner quote', () => {
      const csv = transactionsToCsv([tx({ description: 'Said "fresh"' })]);
      const dataLine = csv.split('\r\n')[1];
      expect(dataLine).toContain('"Said ""fresh"""');
    });

    it('quotes a field containing a newline (keeps it intact, not split)', () => {
      const csv = transactionsToCsv([tx({ description: 'line1\nline2' })]);
      // The embedded newline must live inside a quoted field, so the document
      // has header + 1 logical row spread over 2 physical lines.
      const physicalLines = csv.split('\r\n');
      expect(physicalLines[0]).toBe(_CSV_COLUMNS.join(','));
      expect(csv).toContain('"line1\nline2"');
    });

    it('does not quote a plain field with no special characters', () => {
      const csv = transactionsToCsv([tx({ description: 'Sangkap' })]);
      const dataLine = csv.split('\r\n')[1];
      expect(dataLine).toContain(',Sangkap,');
      expect(dataLine).not.toContain('"Sangkap"');
    });

    it('renders a null description as an empty field', () => {
      const csv = transactionsToCsv([tx({ description: null })]);
      const dataLine = csv.split('\r\n')[1];
      // Paliwanag column is empty: two adjacent commas around the slot.
      expect(dataLine).toContain('Ingredients / Sangkap,,123.45');
    });
  });

  // ----------------------------------------------------------
  // Money — centavos → peso decimal
  // ----------------------------------------------------------
  describe('money formatting', () => {
    it('formats whole pesos with trailing .00', () => {
      const csv = transactionsToCsv([tx({ amount: 345000 })]); // ₱3,450.00
      expect(csv.split('\r\n')[1]).toContain(',3450.00,');
    });

    it('formats sub-peso centavos with zero-padded fraction', () => {
      const csv = transactionsToCsv([tx({ amount: 5 })]); // ₱0.05
      expect(csv.split('\r\n')[1]).toContain(',0.05,');
    });

    it('formats the canonical ₱34.50 example as 34.50', () => {
      const csv = transactionsToCsv([tx({ amount: 3450 })]);
      expect(csv.split('\r\n')[1]).toContain(',34.50,');
    });

    it('does not use a thousands separator (re-import safe)', () => {
      const csv = transactionsToCsv([tx({ amount: 123456789 })]); // ₱1,234,567.89
      expect(csv.split('\r\n')[1]).toContain(',1234567.89,');
    });

    it('handles negative amounts', () => {
      const csv = transactionsToCsv([tx({ amount: -3450 })]);
      expect(csv.split('\r\n')[1]).toContain(',-34.50,');
    });

    it('formats zero as 0.00', () => {
      const csv = transactionsToCsv([tx({ amount: 0 })]);
      expect(csv.split('\r\n')[1]).toContain(',0.00,');
    });
  });

  // ----------------------------------------------------------
  // Labels + order
  // ----------------------------------------------------------
  describe('labels + order', () => {
    it('maps type/source to Filipino labels', () => {
      const csv = transactionsToCsv([
        tx({ type: 'income', source: 'check_in' }),
      ]);
      const line = csv.split('\r\n')[1];
      expect(line).toContain(',Kita,');
      expect(line).toContain(',Check-in');
    });

    it('uses the Taglish category label, not the raw key', () => {
      const csv = transactionsToCsv([tx({ category: 'transport' })]);
      expect(csv.split('\r\n')[1]).toContain('Transportation / Pamasahe');
    });

    it('preserves input row order', () => {
      const csv = transactionsToCsv([
        tx({ description: 'first' }),
        tx({ description: 'second' }),
        tx({ description: 'third' }),
      ]);
      const lines = csv.split('\r\n');
      expect(lines).toHaveLength(4); // header + 3
      expect(lines[1]).toContain('first');
      expect(lines[2]).toContain('second');
      expect(lines[3]).toContain('third');
    });

    it('surfaces the raw ISO date and a Manila-formatted date column', () => {
      const csv = transactionsToCsv([tx({ transaction_date: '2026-05-29' })]);
      const line = csv.split('\r\n')[1];
      expect(line.startsWith('2026-05-29,')).toBe(true);
      expect(line).toContain('May 29, 2026');
    });
  });
});
