/**
 * Invoice Zod Schemas — validation for invoice API inputs
 *
 * All amounts are in centavos (integer). UI converts peso to centavos before calling API.
 */

import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────

export const InvoiceStatusEnum = z.enum([
  'draft',
  'sent',
  'viewed',
  'paid',
  'overdue',
  'cancelled',
]);
export type InvoiceStatusValue = z.infer<typeof InvoiceStatusEnum>;

// ─── Create Invoice Item ─────────────────────────────────────────────

export const CreateInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Kailangan ng item description.').max(500),
  quantity: z.number().positive('Quantity must be positive.').default(1),
  unit: z.string().max(50).optional(),
  unit_price_centavos: z
    .number()
    .int('Price must be whole centavos.')
    .nonnegative('Price cannot be negative.'),
  costing_card_id: z.string().uuid().optional(),
});

export type CreateInvoiceItemPayload = z.infer<typeof CreateInvoiceItemSchema>;

// ─── Create Invoice ──────────────────────────────────────────────────

export const CreateInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Kailangan ng invoice number.').max(50),
  invoice_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
    .optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
    .nullable()
    .optional(),
  client_name: z.string().min(1, 'Kailangan ng client name.').max(200),
  client_email: z.string().email('Invalid email format.').optional(),
  client_phone: z.string().max(30).optional(),
  client_address: z.string().max(500).optional(),
  discount_centavos: z
    .number()
    .int('Discount must be whole centavos.')
    .nonnegative('Discount cannot be negative.')
    .optional(),
  tax_rate_pct: z
    .number()
    .min(0, 'Tax rate cannot be negative.')
    .max(99.99, 'Tax rate cannot exceed 99.99%.')
    .optional(),
  notes: z.string().max(2000).optional(),
  internal_notes: z.string().max(2000).optional(),
  items: z.array(CreateInvoiceItemSchema).min(1, 'Kailangan ng kahit isang line item.'),
});

export type CreateInvoicePayload = z.infer<typeof CreateInvoiceSchema>;

// ─── Update Invoice ──────────────────────────────────────────────────

export const UpdateInvoiceSchema = z
  .object({
    invoice_number: z.string().min(1).max(50).optional(),
    invoice_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
      .optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
      .nullable()
      .optional(),
    client_name: z.string().min(1).max(200).optional(),
    client_email: z.string().email().nullable().optional(),
    client_phone: z.string().max(30).nullable().optional(),
    client_address: z.string().max(500).nullable().optional(),
    discount_centavos: z.number().int().nonnegative().optional(),
    tax_rate_pct: z.number().min(0).max(99.99).optional(),
    notes: z.string().max(2000).nullable().optional(),
    internal_notes: z.string().max(2000).nullable().optional(),
    items: z.array(CreateInvoiceItemSchema).min(1).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'Walang data na i-update.' }
  );

export type UpdateInvoicePayload = z.infer<typeof UpdateInvoiceSchema>;

// ─── Update Invoice Status ───────────────────────────────────────────

export const UpdateInvoiceStatusSchema = z.object({
  status: InvoiceStatusEnum,
});

export type UpdateInvoiceStatusPayload = z.infer<typeof UpdateInvoiceStatusSchema>;
