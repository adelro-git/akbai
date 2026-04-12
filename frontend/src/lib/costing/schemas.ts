/**
 * Costing Card Zod Schemas — validation for costing card API inputs
 *
 * All amounts are in centavos (integer). UI converts peso to centavos before calling API.
 */

import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────

export const CostingCardItemTypeEnum = z.enum([
  'ingredient',
  'labor',
  'overhead',
  'packaging',
  'other',
]);
export type CostingCardItemTypeValue = z.infer<typeof CostingCardItemTypeEnum>;

// ─── Create Costing Card Item ────────────────────────────────────────

export const CreateCostingCardItemSchema = z.object({
  item_name: z.string().min(1, 'Kailangan ng item name.').max(200),
  item_type: CostingCardItemTypeEnum.optional(), // defaults to 'ingredient'
  quantity: z.number().positive('Quantity must be positive.').default(1),
  unit: z.string().max(50).optional(),
  unit_cost_centavos: z
    .number()
    .int('Amount must be whole centavos.')
    .nonnegative('Cost cannot be negative.'),
});

export type CreateCostingCardItemPayload = z.infer<typeof CreateCostingCardItemSchema>;

// ─── Create Costing Card ─────────────────────────────────────────────

export const CreateCostingCardSchema = z.object({
  product_name: z.string().min(1, 'Kailangan ng product name.').max(200),
  product_category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  target_margin_pct: z
    .number()
    .min(0, 'Margin cannot be negative.')
    .max(99.99, 'Margin cannot exceed 99.99%.')
    .optional(),
  selling_price_centavos: z
    .number()
    .int('Price must be whole centavos.')
    .nonnegative('Price cannot be negative.')
    .optional(),
  monthly_fixed_costs_centavos: z
    .number()
    .int('Amount must be whole centavos.')
    .nonnegative()
    .optional(),
  yield_quantity: z.number().int().positive('Yield must be at least 1.').optional(),
  yield_unit: z.string().max(50).optional(),
  items: z.array(CreateCostingCardItemSchema).min(1, 'Kailangan ng kahit isang item.'),
});

export type CreateCostingCardPayload = z.infer<typeof CreateCostingCardSchema>;

// ─── Update Costing Card ─────────────────────────────────────────────

export const UpdateCostingCardSchema = z
  .object({
    product_name: z.string().min(1).max(200).optional(),
    product_category: z.string().max(100).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    target_margin_pct: z.number().min(0).max(99.99).optional(),
    selling_price_centavos: z.number().int().nonnegative().nullable().optional(),
    monthly_fixed_costs_centavos: z.number().int().nonnegative().optional(),
    yield_quantity: z.number().int().positive().optional(),
    yield_unit: z.string().max(50).optional(),
    items: z.array(CreateCostingCardItemSchema).min(1).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'Walang data na i-update.' }
  );

export type UpdateCostingCardPayload = z.infer<typeof UpdateCostingCardSchema>;
