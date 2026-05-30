'use client';

/**
 * Invoice List — displays invoices as tappable cards
 * Feature: Invoice Cards (Build 8)
 * Role: List view with status badges, customer name, total, date
 *
 * Mobile-first: single-column cards. Desktop: wider cards with more info.
 * No divider lines (design system: tonal layering only).
 *
 * Dependencies: StatusBadge, money.ts
 */

import Link from 'next/link';
import StatusBadge from './status-badge';
import Money from '@/components/ui/money';
import type { Invoice } from '@/lib/invoices/types';

// ============================================================
// Types
// ============================================================

interface InvoiceListProps {
  invoices: Invoice[];
}

// ============================================================
// Date Formatter
// ============================================================

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ============================================================
// Component
// ============================================================

export default function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="invoice-list">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="block bg-surface-container-lowest rounded-2xl p-4 transition-colors hover:bg-surface-container-low active:bg-surface-container"
          data-testid={`invoice-card-${invoice.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: client name + invoice number */}
            <div className="flex-1 min-w-0">
              <p className="text-on-surface text-sm font-semibold truncate">
                {invoice.client_name}
              </p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {invoice.invoice_number}
              </p>
            </div>

            {/* Right: total + status */}
            <div className="text-right shrink-0">
              <Money centavos={invoice.total_centavos} size="sm" countUp={false} />
              <div className="mt-1">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Bottom: dates */}
          <div className="flex items-center gap-3 mt-2 text-on-surface-variant text-xs">
            <span>{formatShortDate(invoice.invoice_date)}</span>
            {invoice.due_date && (
              <>
                <span>-</span>
                <span>Due: {formatShortDate(invoice.due_date)}</span>
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
