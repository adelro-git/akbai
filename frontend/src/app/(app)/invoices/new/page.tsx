'use client';

/**
 * New Invoice Page — create a new invoice
 * Feature: Invoice Cards (Build 8)
 * Role: Fetch a generated invoice number, render the invoice form
 *
 * On mount, generates the next invoice number via the API.
 * Then renders InvoiceForm with the pre-generated number.
 *
 * Dependencies: InvoiceForm, API: POST /api/invoices
 */

import { useState, useEffect } from 'react';
import InvoiceForm from '@/components/invoices/invoice-form';

// ============================================================
// Page Component
// ============================================================

export default function NewInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Generate invoice number on mount ---
  useEffect(() => {
    async function generateNumber() {
      try {
        // Use current date to generate number format: INV-YYYYMM-NNN
        const today = new Date().toISOString().slice(0, 10);
        const yearMonth = today.slice(0, 7).replace('-', '');

        // Fetch existing invoices to find the next number
        const res = await fetch(`/api/invoices?status=draft`);
        const json = await res.json();

        if (json.success) {
          const invoices = json.data?.invoices ?? [];
          const prefix = `INV-${yearMonth}-`;
          const existing = invoices
            .map((inv: { invoice_number: string }) => inv.invoice_number)
            .filter((num: string) => num.startsWith(prefix))
            .map((num: string) => parseInt(num.slice(prefix.length), 10))
            .filter((n: number) => !isNaN(n));

          const maxSeq = existing.length > 0 ? Math.max(...existing) : 0;
          setInvoiceNumber(`${prefix}${String(maxSeq + 1).padStart(3, '0')}`);
        } else {
          // Fallback: generate from timestamp
          setInvoiceNumber(`INV-${yearMonth}-001`);
        }
      } catch {
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        setInvoiceNumber(`INV-${yearMonth}-001`);
      } finally {
        setLoading(false);
      }
    }

    generateNumber();
  }, []);

  if (loading || !invoiceNumber) {
    return (
      <div className="min-h-dvh pb-20 px-4 pt-5">
        <p className="text-on-surface-variant text-sm text-center py-10">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-20 md:pb-6 px-4 pt-5 md:px-8 md:pt-8" data-testid="new-invoice-page">
      <InvoiceForm invoiceNumber={invoiceNumber} />
    </div>
  );
}
