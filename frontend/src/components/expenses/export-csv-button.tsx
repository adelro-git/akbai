'use client';

/**
 * Export CSV Button — client-side download of the current transaction list.
 * Feature: Sprint 18 Pre-Launch — §11 "CSV export works on both platforms".
 *
 * Role: takes the in-memory transactions the expenses page already fetched and
 *       triggers a browser download via a Blob + object-URL anchor. The CSV
 *       string itself is built by the pure `transactionsToCsv` (lib/expenses/
 *       csv.ts) so this component stays a thin UI shell.
 *
 * Platform note (for PM/Anton follow-up): the Blob + anchor path is the
 *   web/PWA MVP and also works inside the Capacitor WebView's browser context.
 *   A first-class native "Save to Files / share sheet" needs
 *   @capacitor/filesystem (+ @capacitor/share) — NOT added here. See PM report.
 *
 * Design: useRef-free (this is a single click handler, no controlled inputs),
 *   honey-deep CTA matching the expenses page buttons, 44px+ touch target.
 *   i18n: label key `expenses.export_csv` (FIL/EN reported to PM).
 */

import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { transactionsToCsv, type ExportableTransaction } from '@/lib/expenses/csv';
import { getManilaToday } from '@/lib/timezone';

interface ExportCsvButtonProps {
  /** Transactions to export — already fetched by the expenses page. */
  transactions: ExportableTransaction[];
  /** Optional className passthrough for layout (page decides placement). */
  className?: string;
  /** Optional override for the download filename stem (no extension). */
  filenameStem?: string;
}

export default function ExportCsvButton({
  transactions,
  className,
  filenameStem,
}: ExportCsvButtonProps) {
  // Disabled-but-visible feedback while the (synchronous, but defensive) build
  // runs; mostly guards against a double-tap kicking off two downloads.
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(() => {
    if (busy || transactions.length === 0) return;
    if (typeof document === 'undefined') return; // SSR guard

    setBusy(true);
    try {
      const csv = transactionsToCsv(transactions);

      // Prepend a UTF-8 BOM so Excel on Windows reads Filipino labels (and any
      // accented merchant names) correctly instead of mojibake.
      const blob = new Blob(['﻿', csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);

      const stem = filenameStem ?? `akbai-gastos-${getManilaToday()}`;
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${stem}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Release the object URL on the next tick so the click has consumed it.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      setBusy(false);
    }
  }, [busy, transactions, filenameStem]);

  const disabled = busy || transactions.length === 0;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled}
      className={
        'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl ' +
        'bg-surface-container-low text-honey-deep font-semibold text-[13px] shadow-ambient ' +
        'transition-colors hover:bg-honey-cream/40 disabled:opacity-50 disabled:pointer-events-none ' +
        (className ?? '')
      }
      data-testid="export-csv-btn"
      aria-label="I-export ang transactions bilang CSV"
    >
      <Download className="w-4 h-4" />
      I-export (CSV)
    </button>
  );
}
