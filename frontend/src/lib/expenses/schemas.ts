/**
 * Expenses Zod Schemas — validation for transaction API inputs
 *
 * All amounts are in centavos (integer). UI converts peso → centavos before calling API.
 */

import { z } from 'zod';
import { EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, ALL_CATEGORY_KEYS } from './categories';

// ─── Enums ───────────────────────────────────────────────────────────

export const TransactionTypeEnum = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const TransactionSourceEnum = z.enum(['manual', 'check_in', 'ocr', 'import']);
export type TransactionSource = z.infer<typeof TransactionSourceEnum>;

// ─── Create Transaction ──────────────────────────────────────────────

export const CreateTransactionSchema = z
  .object({
    type: TransactionTypeEnum,
    amount: z.number().int().positive('Amount must be positive.'),
    category: z.string().min(1),
    description: z.string().max(500).optional(),
    transaction_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
      .optional(),
    source: TransactionSourceEnum.optional(), // defaults to 'manual'
    source_ref_id: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'expense') return EXPENSE_CATEGORY_KEYS.includes(data.category);
      if (data.type === 'income') return INCOME_CATEGORY_KEYS.includes(data.category);
      return false;
    },
    { message: 'Invalid category for transaction type.', path: ['category'] }
  );

export type CreateTransactionPayload = z.infer<typeof CreateTransactionSchema>;

// ─── Update Transaction ──────────────────────────────────────────────

export const UpdateTransactionSchema = z
  .object({
    amount: z.number().int().positive().optional(),
    category: z.string().min(1).optional(),
    description: z.string().max(500).optional(),
    transaction_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.')
      .optional(),
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.category !== undefined ||
      data.description !== undefined ||
      data.transaction_date !== undefined,
    { message: 'Walang data na i-update.' }
  );

export type UpdateTransactionPayload = z.infer<typeof UpdateTransactionSchema>;

// ─── Query Params ────────────────────────────────────────────────────

export const ExpensesQuerySchema = z.object({
  type: TransactionTypeEnum.optional(),
  category: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM shorthand
});

export type ExpensesQuery = z.infer<typeof ExpensesQuerySchema>;
