/**
 * Expenses — CSV export
 * Feature: Sprint 18 Pre-Launch — §11 acceptance signal "CSV export works on
 *   both platforms". This module is the platform-agnostic core: a pure
 *   transactions → CSV string function. The UI layer wraps it in a Blob +
 *   anchor download (web/PWA today; native @capacitor/filesystem save is a
 *   follow-up — see PM report).
 *
 * Why pure: the same string must be testable in node, downloadable in the
 *   browser, and (later) written to disk natively. Keeping all the escaping +
 *   formatting here means one place to get RFC-4180 quoting right.
 *
 * Money: amounts arrive as integer centavos (AKBai canonical) and are emitted
 *   as plain peso decimals (e.g. 3450 → "34.50") — no ₱ glyph, no thousands
 *   separators, so the column re-imports cleanly into Excel / Google Sheets.
 *
 * Dates: `transaction_date` is already a Manila-local YYYY-MM-DD calendar date
 *   (stored that way by /api/expenses). We surface it as-is in an ISO column
 *   and add a human "Petsa (UTC+8)" column formatted via lib/timezone so the
 *   exported file is unambiguously Manila-time regardless of the device clock.
 */

import { formatManilaDate } from '@/lib/timezone';
import { getCategoryLabel } from '@/lib/expenses/categories';
import { centavosToPlainDecimal } from '@/lib/utils/money';

// ============================================================
// Input shape — the subset of a transaction row needed for export.
// Mirrors the /api/expenses GET row (see transaction-list.tsx).
// ============================================================

export interface ExportableTransaction {
  /** YYYY-MM-DD, Manila-local calendar date. */
  transaction_date: string;
  /** 'income' | 'expense' (kept as string to match the API row). */
  type: string;
  category: string;
  description: string | null;
  /** Integer centavos. */
  amount: number;
  /** 'manual' | 'ocr' | 'check_in' etc. */
  source: string;
}

// ============================================================
// Column definition — deterministic order. Header labels are the
// user-facing column titles in conversational Filipino (technical terms in
// English: "ISO", "CSV" stay as-is).
// ============================================================

const COLUMNS = [
  'Petsa',
  'Petsa (UTC+8)',
  'Uri',
  'Kategorya',
  'Paliwanag',
  'Halaga (PHP)',
  'Pinagmulan',
] as const;

// ============================================================
// Helpers
// ============================================================

/**
 * RFC-4180 field escaping: a field that contains a comma, double-quote, CR, or
 * LF must be wrapped in double quotes, and any inner double-quote is doubled.
 * Everything else passes through untouched.
 */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Formula-injection guard (OWASP) for USER-CONTROLLED text fields. A field whose
 * first character is `= + - @` (or a leading tab/CR some apps treat as a formula
 * lead) is prefixed with a single quote so Excel / Google Sheets / LibreOffice
 * render it as literal text instead of executing it as a formula.
 *
 * Applied to free-text columns ONLY (description, category) — never to the
 * numeric amount column, whose legitimate leading `-` (negative peso) must be
 * preserved as a real number.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** RFC-4180 escape for a user-controlled TEXT field, with formula-injection guard. */
function escapeCsvText(value: string): string {
  return escapeCsvField(neutralizeFormula(value));
}

/** Map the stored `type` to a Filipino label for the "Uri" column. */
function typeLabel(type: string): string {
  if (type === 'income') return 'Kita';
  if (type === 'expense') return 'Gastos';
  return type;
}

/** Map the stored `source` to a Filipino label for the "Pinagmulan" column. */
function sourceLabel(source: string): string {
  switch (source) {
    case 'manual':
      return 'Manu-mano';
    case 'ocr':
      return 'Na-scan';
    case 'check_in':
      return 'Check-in';
    default:
      return source;
  }
}

/** Format a YYYY-MM-DD calendar date for the human "Petsa (UTC+8)" column. */
function humanManilaDate(isoDate: string): string {
  // Parse the calendar date at Manila midnight, then format in Manila tz.
  const d = new Date(`${isoDate}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return isoDate; // defensive: bad date passes through
  return formatManilaDate(d, 'MMM dd, yyyy');
}

// ============================================================
// Public API
// ============================================================

/**
 * Convert a list of transactions to an RFC-4180 CSV string.
 *
 * - Always emits the header row (even for an empty list).
 * - Rows preserve the input order (caller decides sort).
 * - Lines are CRLF-joined per RFC-4180.
 *
 * @param transactions Rows to export (amounts in integer centavos).
 * @returns A CSV document as a single string.
 */
export function transactionsToCsv(transactions: ExportableTransaction[]): string {
  const lines: string[] = [];

  // Header
  lines.push(COLUMNS.map(escapeCsvField).join(','));

  // Rows
  for (const tx of transactions) {
    const row = [
      escapeCsvField(tx.transaction_date),
      escapeCsvField(humanManilaDate(tx.transaction_date)),
      escapeCsvField(typeLabel(tx.type)),
      // Category + description are user/OCR-controlled → formula-injection guard.
      escapeCsvText(getCategoryLabel(tx.category)),
      escapeCsvText(tx.description ?? ''),
      escapeCsvField(centavosToPlainDecimal(tx.amount)),
      escapeCsvField(sourceLabel(tx.source)),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\r\n');
}

// ============================================================
// Test-only export — column header order, for assertions.
// ============================================================

/** @internal — the deterministic header row, for test assertions. */
export const _CSV_COLUMNS = COLUMNS;
