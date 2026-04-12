'use client';

/**
 * Invoice Preview — visual preview of what the invoice looks like
 * Feature: Invoice Cards (Build 8)
 * Role: Read-only preview matching the PDF layout, shown on detail page
 *
 * Matches the PDF generator's layout but rendered as React/Tailwind.
 * BIR disclaimer included at the bottom.
 *
 * Dependencies: money.ts, InvoiceWithItems type
 */

import { centavosToPeso } from '@/lib/utils/money';
import StatusBadge from './status-badge';
import type { InvoiceWithItems } from '@/lib/invoices/types';

// ============================================================
// Types
// ============================================================

interface InvoicePreviewProps {
  invoice: InvoiceWithItems;
  businessName?: string;
}

// ============================================================
// Date Formatter
// ============================================================

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================
// Component
// ============================================================

export default function InvoicePreview({ invoice, businessName }: InvoicePreviewProps) {
  const activeItems = invoice.items.filter((item) => !item.deleted_at);

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 space-y-5" data-testid="invoice-preview">
      {/* --- Header: Business + Invoice Number --- */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-primary text-lg font-extrabold">
            {businessName ?? 'My Business'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-on-surface text-xl font-extrabold">INVOICE</p>
          <p className="text-on-surface-variant text-xs mt-0.5">{invoice.invoice_number}</p>
          <div className="mt-1">
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      {/* --- Client + Dates --- */}
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Bill To
          </p>
          <p className="text-on-surface text-sm font-semibold">{invoice.client_name}</p>
          {invoice.client_email && (
            <p className="text-on-surface-variant text-xs">{invoice.client_email}</p>
          )}
          {invoice.client_phone && (
            <p className="text-on-surface-variant text-xs">{invoice.client_phone}</p>
          )}
          {invoice.client_address && (
            <p className="text-on-surface-variant text-xs mt-1">{invoice.client_address}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Date
          </p>
          <p className="text-on-surface text-xs">{formatLongDate(invoice.invoice_date)}</p>
          {invoice.due_date && (
            <>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-2 mb-1">
                Due Date
              </p>
              <p className="text-on-surface text-xs">{formatLongDate(invoice.due_date)}</p>
            </>
          )}
        </div>
      </div>

      {/* --- Line Items Table --- */}
      <div>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-2 border-b-2 border-primary-container/30">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Item</p>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider text-right w-16">Qty</p>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider text-right w-24">Amount</p>
        </div>

        {/* Table rows */}
        {activeItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto_auto] gap-2 py-2.5"
          >
            <div>
              <p className="text-on-surface text-sm">{item.description}</p>
              <p className="text-on-surface-variant text-xs">
                {centavosToPeso(item.unit_price_centavos)} x {item.quantity} {item.unit}
              </p>
            </div>
            <p className="text-on-surface text-sm text-right w-16">{item.quantity}</p>
            <p className="text-on-surface text-sm font-semibold text-right w-24">
              {centavosToPeso(item.total_centavos)}
            </p>
          </div>
        ))}
      </div>

      {/* --- Totals --- */}
      <div className="flex justify-end">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-sm text-on-surface-variant">
            <span>Subtotal</span>
            <span>{centavosToPeso(invoice.subtotal_centavos)}</span>
          </div>
          {invoice.discount_centavos > 0 && (
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Discount</span>
              <span>-{centavosToPeso(invoice.discount_centavos)}</span>
            </div>
          )}
          {invoice.tax_amount_centavos > 0 && (
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Tax ({invoice.tax_rate_pct}%)</span>
              <span>{centavosToPeso(invoice.tax_amount_centavos)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-extrabold text-primary pt-2 border-t-2 border-primary-container/30 mt-1">
            <span>Total</span>
            <span>{centavosToPeso(invoice.total_centavos)}</span>
          </div>
        </div>
      </div>

      {/* --- Notes --- */}
      {invoice.notes && (
        <div className="bg-surface-container-low rounded-xl p-3">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Notes
          </p>
          <p className="text-on-surface-variant text-sm">{invoice.notes}</p>
        </div>
      )}

      {/* --- Paid/Sent timestamps --- */}
      {invoice.paid_at && (
        <p className="text-tertiary text-xs font-semibold text-center">
          Binayaran noong {new Date(invoice.paid_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}
      {invoice.sent_at && !invoice.paid_at && (
        <p className="text-on-surface-variant text-xs text-center">
          Na-send noong {new Date(invoice.sent_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {/* --- BIR Disclaimer --- */}
      <p className="text-on-surface-variant text-xs text-center italic pt-2">
        Ito ay gabay lamang, hindi tax advice.
      </p>
    </div>
  );
}
