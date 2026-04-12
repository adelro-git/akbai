/**
 * Costing Card Types — product cost breakdown for MSME pricing
 *
 * Costing cards let Maria break down her recipe/product costs (ingredients,
 * labor, overhead, packaging) to calculate true margins and suggested prices.
 * All monetary values are INTEGER centavos (non-negotiable).
 */

// ─── Enums ───────────────────────────────────────────────────────────

/** Line item cost category */
export type CostingCardItemType =
  | 'ingredient'
  | 'labor'
  | 'overhead'
  | 'packaging'
  | 'other';

// ─── Row Types ───────────────────────────────────────────────────────

/** Single cost line item within a costing card */
export interface CostingCardItem {
  id: string;
  user_id: string;
  costing_card_id: string;
  item_name: string;
  item_type: CostingCardItemType;
  quantity: number;
  unit: string;
  unit_cost_centavos: number;
  total_cost_centavos: number;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Costing card header (without line items) */
export interface CostingCard {
  id: string;
  user_id: string;
  product_name: string;
  product_category: string | null;
  description: string | null;
  total_cost_centavos: number;
  overhead_centavos: number;
  labor_centavos: number;
  packaging_centavos: number;
  selling_price_centavos: number | null;
  suggested_price_centavos: number | null;
  target_margin_pct: number;
  actual_margin_pct: number | null;
  break_even_qty: number | null;
  monthly_fixed_costs_centavos: number;
  yield_quantity: number;
  yield_unit: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Costing card with nested line items — used for detail views */
export interface CostingCardWithItems extends CostingCard {
  items: CostingCardItem[];
}
