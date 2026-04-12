/**
 * Payment Zod Schemas — validation for payment API inputs
 *
 * Payments are primarily created by the Xendit webhook handler (service role).
 * Manual/cash payments go through an API route that also uses service role.
 * All amounts are in centavos (integer).
 */

import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────

export const PaymentTypeEnum = z.enum(['invoice_payment', 'subscription_payment']);
export type PaymentTypeValue = z.infer<typeof PaymentTypeEnum>;

export const PaymentMethodEnum = z.enum([
  'gcash',
  'credit_card',
  'bank_transfer',
  'cash',
  'other',
]);
export type PaymentMethodValue = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'cancelled',
]);
export type PaymentStatusValue = z.infer<typeof PaymentStatusEnum>;

// ─── Create Payment (Xendit webhook handler — service role) ──────────

export const CreatePaymentSchema = z.object({
  user_id: z.string().uuid(),
  payment_type: PaymentTypeEnum,
  amount_centavos: z
    .number()
    .int('Amount must be whole centavos.')
    .positive('Amount must be positive.'),
  currency: z.string().length(3).default('PHP'),
  payment_method: PaymentMethodEnum.optional(),
  status: PaymentStatusEnum.optional(), // defaults to 'pending'
  xendit_payment_id: z.string().max(200).optional(),
  xendit_invoice_id: z.string().max(200).optional(),
  invoice_id: z.string().uuid().optional(),
  subscription_id: z.string().uuid().optional(),
  paid_at: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreatePaymentPayload = z.infer<typeof CreatePaymentSchema>;

// ─── Record Cash Payment (manual — via API route with service role) ──

export const RecordCashPaymentSchema = z.object({
  invoice_id: z.string().uuid('Kailangan ng valid invoice ID.'),
  amount_centavos: z
    .number()
    .int('Amount must be whole centavos.')
    .positive('Amount must be positive.'),
  notes: z.string().max(2000).optional(),
  paid_at: z
    .string()
    .datetime()
    .optional(),
});

export type RecordCashPaymentPayload = z.infer<typeof RecordCashPaymentSchema>;

// ─── Update Payment Status (webhook status update) ───────────────────

export const UpdatePaymentStatusSchema = z.object({
  status: PaymentStatusEnum,
  paid_at: z.string().datetime().optional(),
  failure_reason: z.string().max(1000).optional(),
});

export type UpdatePaymentStatusPayload = z.infer<typeof UpdatePaymentStatusSchema>;
