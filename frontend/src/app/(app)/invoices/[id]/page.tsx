'use client';

/**
 * Invoice Detail Page — view single invoice with actions
 * Feature: Invoice Cards (Build 8)
 * Role: Display invoice preview with status-dependent action buttons
 *
 * Fetches invoice with line items, renders InvoicePreview + InvoiceActions.
 * Status transitions (send, mark paid, cancel) update in real-time.
 *
 * Dependencies: InvoicePreview, InvoiceActions, API: GET/PATCH/DELETE /api/invoices/[id]
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import InvoicePreview from '@/components/invoices/invoice-preview';
import InvoiceActions from '@/components/invoices/invoice-actions';
import type { InvoiceWithItems, InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Page Component
// ============================================================

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch invoice ---
  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang invoice.');
        return;
      }

      setInvoice(json.data);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  // --- Status change handler ---
  const handleStatusChange = useCallback((newStatus: InvoiceStatus) => {
    if (!invoice) return;
    setInvoice({
      ...invoice,
      status: newStatus,
      ...(newStatus === 'sent' ? { sent_at: new Date().toISOString() } : {}),
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
      ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
    });
  }, [invoice]);

  // --- Edit handler ---
  const handleEdit = useCallback(() => {
    router.push(`/invoices/${invoiceId}/edit`);
  }, [invoiceId, router]);

  // --- Delete handler ---
  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/invoices');
      }
    } catch {
      // Error handled silently
    }
  }, [invoiceId, router]);

  return (
    <div className="min-h-dvh pb-20 md:pb-6" data-testid="invoice-detail-page">
      {/* ── Back button ── */}
      <header className="px-4 pt-5 pb-3 md:px-8 md:pt-8">
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center gap-1.5 text-on-surface-variant text-sm font-semibold p-2 -ml-2 rounded-lg min-h-[44px]"
          type="button"
        >
          <ArrowLeft className="w-4 h-4" />
          Mga Invoice
        </button>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={fetchInvoice} className="mt-2 text-primary text-sm font-semibold" type="button">
            Subukan muli
          </button>
        </div>
      )}

      {/* ── Invoice Detail ── */}
      {invoice && !loading && !error && (
        <div className="px-4 md:px-8 space-y-4">
          {/* Actions */}
          <InvoiceActions
            invoiceId={invoiceId}
            status={invoice.status}
            onStatusChange={handleStatusChange}
            onEdit={invoice.status === 'draft' ? handleEdit : undefined}
            onDelete={invoice.status === 'draft' ? handleDelete : undefined}
          />

          {/* Preview */}
          <InvoicePreview invoice={invoice} />
        </div>
      )}
    </div>
  );
}
