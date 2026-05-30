'use client';

/**
 * Invoice Form — create/edit invoice with customer details + line items
 * Feature: Invoice Cards (Build 8)
 * Role: Full invoice creation form with customer info, line items, notes
 *
 * Uses useRef + onClick pattern (React 19 controlled input bug).
 * Prices entered in pesos, converted to centavos before API call.
 *
 * Dependencies: LineItemEditor, money.ts, invoice schemas
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import LineItemEditor, { type LineItemData } from './line-item-editor';
import { pesoToCentavos } from '@/lib/utils/money';
import Money from '@/components/ui/money';

// ============================================================
// Types
// ============================================================

interface InvoiceFormProps {
  /** Pre-generated invoice number */
  invoiceNumber: string;
  /** Pre-filled data for editing (optional) */
  initialData?: {
    client_name: string;
    client_email: string;
    client_phone: string;
    client_address: string;
    invoice_date: string;
    due_date: string;
    discount_pesos: number;
    tax_rate_pct: number;
    notes: string;
    items: LineItemData[];
  };
  /** Editing existing invoice? */
  invoiceId?: string;
}

// ============================================================
// Component
// ============================================================

export default function InvoiceForm({ invoiceNumber, initialData, invoiceId }: InvoiceFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Refs for all form fields (React 19 bug: no onChange/onSubmit) ---
  const clientNameRef = useRef<HTMLInputElement>(null);
  const clientEmailRef = useRef<HTMLInputElement>(null);
  const clientPhoneRef = useRef<HTMLInputElement>(null);
  const clientAddressRef = useRef<HTMLTextAreaElement>(null);
  const invoiceDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const taxRateRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // --- Line items state (managed by LineItemEditor) ---
  const [items, setItems] = useState<LineItemData[]>(
    initialData?.items ?? [
      { description: '', quantity: 1, unit: 'piece', unit_price_centavos: 0 },
    ]
  );

  // --- Computed totals ---
  const subtotalCentavos = items.reduce(
    (sum, item) => sum + item.unit_price_centavos * item.quantity,
    0
  );

  // --- Save handler ---
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    const clientName = clientNameRef.current?.value?.trim() ?? '';
    if (!clientName) {
      setError('Kailangan ng pangalan ng client.');
      setSaving(false);
      return;
    }

    // Check at least one item has a description
    const validItems = items.filter((i) => i.description.trim() !== '');
    if (validItems.length === 0) {
      setError('Kailangan ng kahit isang item na may description.');
      setSaving(false);
      return;
    }

    const discountPesos = parseFloat(discountRef.current?.value ?? '0') || 0;
    const taxRatePct = parseFloat(taxRateRef.current?.value ?? '0') || 0;

    const payload = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDateRef.current?.value || undefined,
      due_date: dueDateRef.current?.value || null,
      client_name: clientName,
      client_email: clientEmailRef.current?.value?.trim() || undefined,
      client_phone: clientPhoneRef.current?.value?.trim() || undefined,
      client_address: clientAddressRef.current?.value?.trim() || undefined,
      discount_centavos: pesoToCentavos(discountPesos),
      tax_rate_pct: taxRatePct,
      notes: notesRef.current?.value?.trim() || undefined,
      items: validItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || undefined,
        unit_price_centavos: item.unit_price_centavos,
        costing_card_id: item.costing_card_id || undefined,
      })),
    };

    try {
      const url = invoiceId ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = invoiceId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi ma-save ang invoice.');
        setSaving(false);
        return;
      }

      // Navigate to the new/updated invoice
      const id = json.data?.id ?? invoiceId;
      router.push(`/invoices/${id}`);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
    } finally {
      setSaving(false);
    }
  }, [invoiceNumber, items, invoiceId, router]);

  // --- Today's date for default ---
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5" data-testid="invoice-form">
      {/* --- Back button + title --- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant"
          type="button"
          aria-label="Bumalik"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-on-surface text-lg font-extrabold">
            {invoiceId ? 'I-edit ang Invoice' : 'Bagong Invoice'}
          </h1>
          <p className="text-on-surface-variant text-xs">{invoiceNumber}</p>
        </div>
      </div>

      {/* --- Customer Details --- */}
      <section className="bg-surface-container-low rounded-2xl p-4 space-y-3">
        <h2 className="text-on-surface text-xs font-bold uppercase tracking-wider">
          Client Details
        </h2>

        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Pangalan ng Client *
          </label>
          <input
            ref={clientNameRef}
            type="text"
            defaultValue={initialData?.client_name ?? ''}
            placeholder="e.g., Maria Santos"
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid="client-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Email
            </label>
            <input
              ref={clientEmailRef}
              type="email"
              defaultValue={initialData?.client_email ?? ''}
              placeholder="email@example.com"
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="client-email"
            />
          </div>
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Phone
            </label>
            <input
              ref={clientPhoneRef}
              type="tel"
              defaultValue={initialData?.client_phone ?? ''}
              placeholder="09XX XXX XXXX"
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="client-phone"
            />
          </div>
        </div>

        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Address
          </label>
          <textarea
            ref={clientAddressRef}
            defaultValue={initialData?.client_address ?? ''}
            placeholder="Address ng client"
            rows={2}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            data-testid="client-address"
          />
        </div>
      </section>

      {/* --- Invoice Dates --- */}
      <section className="bg-surface-container-low rounded-2xl p-4 space-y-3">
        <h2 className="text-on-surface text-xs font-bold uppercase tracking-wider">
          Mga Petsa
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Invoice Date
            </label>
            <input
              ref={invoiceDateRef}
              type="date"
              defaultValue={initialData?.invoice_date ?? today}
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="invoice-date"
            />
          </div>
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Due Date
            </label>
            <input
              ref={dueDateRef}
              type="date"
              defaultValue={initialData?.due_date ?? ''}
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="due-date"
            />
          </div>
        </div>
      </section>

      {/* --- Line Items --- */}
      <section className="bg-surface-container-low rounded-2xl p-4">
        <LineItemEditor items={items} onItemsChange={setItems} />
      </section>

      {/* --- Discount, Tax, Notes --- */}
      <section className="bg-surface-container-low rounded-2xl p-4 space-y-3">
        <h2 className="text-on-surface text-xs font-bold uppercase tracking-wider">
          Iba Pa
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Discount (₱)
            </label>
            <input
              ref={discountRef}
              type="number"
              defaultValue={initialData?.discount_pesos ?? 0}
              min="0"
              step="0.01"
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="discount"
            />
          </div>
          <div>
            <label className="text-on-surface-variant text-xs font-semibold block mb-1">
              Tax Rate (%)
            </label>
            <input
              ref={taxRateRef}
              type="number"
              defaultValue={initialData?.tax_rate_pct ?? 0}
              min="0"
              max="99.99"
              step="0.01"
              className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="tax-rate"
            />
          </div>
        </div>

        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Notes (nakikita ng client)
          </label>
          <textarea
            ref={notesRef}
            defaultValue={initialData?.notes ?? ''}
            placeholder="e.g., Salamat sa order! Please pay via GCash."
            rows={3}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            data-testid="notes"
          />
        </div>
      </section>

      {/* --- Totals Summary --- */}
      <section className="bg-surface-container-low rounded-2xl p-4">
        <div className="space-y-1">
          <div className="flex justify-between items-baseline text-sm text-on-surface-variant">
            <span>Subtotal</span>
            <Money centavos={subtotalCentavos} size="sm" countUp={false} />
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-lg font-extrabold text-on-surface">Total</span>
            <Money centavos={subtotalCentavos} size="md" countUp={false} />
          </div>
          <p className="text-on-surface-variant text-xs pt-1">
            Ang final total ay kasama na ang discount at tax pagka-save.
          </p>
        </div>
      </section>

      {/* --- Error --- */}
      {error && (
        <div className="bg-error-container rounded-xl p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* --- Save Button --- */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary-container text-on-primary text-sm font-semibold rounded-xl py-3.5 min-h-[44px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        type="button"
        data-testid="save-invoice"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Sine-save...' : invoiceId ? 'I-save ang Changes' : 'Gumawa ng Invoice'}
      </button>

      {/* --- BIR Disclaimer --- */}
      <p className="text-on-surface-variant text-xs text-center italic">
        Ito ay gabay lamang, hindi tax advice.
      </p>
    </div>
  );
}
