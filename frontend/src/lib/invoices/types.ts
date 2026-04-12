/**
 * Invoice Types — invoice cards for MSME billing
 *
 * Maria creates invoices for catering orders or bulk cake orders.
 * Status lifecycle: draft -> sent -> viewed -> paid -> overdue -> cancelled.
 * All monetary values are INTEGER centavos (non-negotiable).
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled';

// ─── Row Types ───────────────────────────────────────────────────────

/** Single line item within an invoice */
export interface InvoiceItem {
  id: string;
  user_id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_centavos: number;
  total_centavos: number;
  costing_card_id: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Invoice header (without line items) */
export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  subtotal_centavos: number;
  discount_centavos: number;
  tax_rate_pct: number;
  tax_amount_centavos: number;
  total_centavos: number;
  status: InvoiceStatus;
  sent_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  payment_transaction_id: string | null;
  pdf_storage_path: string | null;
  notes: string | null;
  internal_notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Invoice with nested line items — used for detail views */
export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}
