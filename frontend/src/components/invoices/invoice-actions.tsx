'use client';

/**
 * Invoice Actions — status transition + download buttons
 * Feature: Invoice Cards (Build 8)
 * Role: Action bar that changes based on current invoice status
 *
 * draft  → Send, Edit, Delete
 * sent   → Mark Paid, Cancel
 * viewed → Mark Paid, Cancel
 * overdue → Mark Paid, Cancel
 * paid   → Download PDF only
 * cancelled → (no actions)
 *
 * Dependencies: Invoice status, API calls for status updates
 */

import { useState, useCallback } from 'react';
import { Send, CheckCircle, XCircle, Download, Pencil, Trash2 } from 'lucide-react';
import type { InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Types
// ============================================================

interface InvoiceActionsProps {
  invoiceId: string;
  status: InvoiceStatus;
  onStatusChange: (newStatus: InvoiceStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ============================================================
// Component
// ============================================================

export default function InvoiceActions({
  invoiceId,
  status,
  onStatusChange,
  onEdit,
  onDelete,
}: InvoiceActionsProps) {
  const [loading, setLoading] = useState(false);

  // --- Status transition handler ---
  const handleStatusChange = useCallback(async (newStatus: InvoiceStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        onStatusChange(newStatus);
      }
    } catch {
      // Error handled silently for now
    } finally {
      setLoading(false);
    }
  }, [invoiceId, onStatusChange]);

  // --- PDF download handler ---
  const handleDownloadPdf = useCallback(() => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  }, [invoiceId]);

  // --- Render actions based on status ---
  return (
    <div className="flex flex-wrap gap-2" data-testid="invoice-actions">
      {/* Draft actions */}
      {status === 'draft' && (
        <>
          <button
            onClick={() => handleStatusChange('sent')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors disabled:opacity-50"
            type="button"
            data-testid="action-send"
          >
            <Send className="w-4 h-4" />
            I-send
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
              type="button"
              data-testid="action-edit"
            >
              <Pencil className="w-4 h-4" />
              I-edit
            </button>
          )}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
            type="button"
            data-testid="action-download"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 bg-error-container text-destructive text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
              type="button"
              data-testid="action-delete"
            >
              <Trash2 className="w-4 h-4" />
              I-delete
            </button>
          )}
        </>
      )}

      {/* Sent / Viewed / Overdue actions */}
      {(status === 'sent' || status === 'viewed' || status === 'overdue') && (
        <>
          <button
            onClick={() => handleStatusChange('paid')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-tertiary-container text-on-primary text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors disabled:opacity-50"
            type="button"
            data-testid="action-mark-paid"
          >
            <CheckCircle className="w-4 h-4" />
            Bayad na
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
            type="button"
            data-testid="action-download"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleStatusChange('cancelled')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-error-container text-destructive text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors disabled:opacity-50"
            type="button"
            data-testid="action-cancel"
          >
            <XCircle className="w-4 h-4" />
            I-cancel
          </button>
        </>
      )}

      {/* Paid — download only */}
      {status === 'paid' && (
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-1.5 bg-surface-container-high text-on-surface text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
          type="button"
          data-testid="action-download"
        >
          <Download className="w-4 h-4" />
          I-download ang PDF
        </button>
      )}

      {/* Cancelled — no actions */}
    </div>
  );
}
