/**
 * Payment Types — payment records for invoices and subscriptions
 *
 * Covers both invoice payments (customer pays Maria) and subscription billing
 * (Maria pays AKBai). Resolves Gap D2 (Xendit webhook idempotency).
 * All monetary values are INTEGER centavos (non-negotiable).
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type PaymentType = 'invoice_payment' | 'subscription_payment';

export type PaymentMethod =
  | 'gcash'
  | 'credit_card'
  | 'bank_transfer'
  | 'cash'
  | 'other';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';

// ─── Row Types ───────────────────────────────────────────────────────

/** Payment record */
export interface Payment {
  id: string;
  user_id: string;
  payment_type: PaymentType;
  xendit_payment_id: string | null;
  xendit_invoice_id: string | null;
  payment_method: string | null;
  amount_centavos: number;
  currency: string;
  status: PaymentStatus;
  invoice_id: string | null;
  subscription_id: string | null;
  transaction_id: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
