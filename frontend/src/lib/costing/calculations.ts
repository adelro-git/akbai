/**
 * Costing Card Calculations — business logic for margin & pricing
 *
 * Pure functions that compute total cost, suggested price, actual margin,
 * and break-even quantity. All monetary values are INTEGER centavos.
 * These are used by both the API (server-side recalculation) and the UI
 * (instant client-side previews as Maria edits line items).
 */

import type { CostingCardItem } from './types';
import type { CreateCostingCardItemPayload } from './schemas';

// ─── Total Cost ─────────────────────────────────────────────────────

/**
 * Per-line displayed total = quantity * unit_cost_centavos, rounded to
 * integer centavos.
 *
 * Rounding policy: this is the ROW-LEVEL figure shown next to each line
 * item, so it must be a whole centavo value Maria can read. The CARD
 * total, however, is NOT the sum of these rounded rows — see
 * calculateTotalCost — because summing per-line rounded values lets
 * fractional quantities accumulate per-row rounding drift (e.g. three
 * lines each off by +0.4 centavo would push the card total a full
 * centavo off the true sum). Use this only for display.
 *
 * Accepts either full CostingCardItem rows (from DB) or
 * CreateCostingCardItemPayload (from form input) — both have
 * quantity and unit_cost_centavos.
 */
export function calculateItemTotalCost(quantity: number, unitCostCentavos: number): number {
  return Math.round(quantity * unitCostCentavos);
}

/**
 * Calculate the aggregate total cost across all line items.
 *
 * Rounding policy: sum the EXACT (unrounded) quantity * unit_cost products
 * and Math.round ONCE at the end. This keeps the stored card total an
 * integer centavo value while avoiding the per-line rounding drift that
 * would occur if we summed calculateItemTotalCost() results — that drift
 * makes the card total diverge from the true sum when quantities are
 * fractional. Downstream margin / break-even use this exact-then-rounded
 * total.
 */
export function calculateTotalCost(
  items: Pick<CostingCardItem, 'quantity' | 'unit_cost_centavos'>[] | CreateCostingCardItemPayload[]
): number {
  const exactTotal = items.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    return sum + qty * item.unit_cost_centavos;
  }, 0);
  return Math.round(exactTotal);
}

// ─── Suggested Price ────────────────────────────────────────────────

/**
 * Calculate the selling price that achieves the target margin.
 *
 * Formula: price = totalCost / (1 - targetMarginPct / 100)
 * Example: ₱500 cost at 40% margin target → ₱500 / 0.60 = ₱833.33 → 83333 centavos
 *
 * Returns integer centavos. Returns null if margin >= 100% (impossible).
 */
export function calculateSuggestedPrice(
  totalCostCentavos: number,
  targetMarginPct: number
): number | null {
  if (targetMarginPct >= 100 || targetMarginPct < 0) return null;
  if (totalCostCentavos <= 0) return 0;

  const price = totalCostCentavos / (1 - targetMarginPct / 100);
  return Math.round(price);
}

// ─── Actual Margin ──────────────────────────────────────────────────

/**
 * Calculate the actual margin percentage given selling price and total cost.
 *
 * Formula: margin = (price - cost) / price * 100
 * Example: ₱850 price, ₱500 cost → (850-500)/850*100 = 41.18%
 *
 * Returns percentage with 2 decimal places. Returns null if price is 0.
 */
export function calculateActualMargin(
  sellingPriceCentavos: number,
  totalCostCentavos: number
): number | null {
  if (sellingPriceCentavos <= 0) return null;

  const margin = ((sellingPriceCentavos - totalCostCentavos) / sellingPriceCentavos) * 100;
  return Math.round(margin * 100) / 100; // 2 decimal places
}

// ─── Break-Even Quantity ────────────────────────────────────────────

/**
 * Calculate how many units Maria needs to sell to cover fixed costs.
 *
 * Formula: breakEven = fixedCosts / (pricePerUnit - costPerUnit)
 * Example: ₱5,000 fixed costs, ₱100 price, ₱60 cost → 5000/40 = 125 units
 *
 * Returns integer (rounded up — you can't sell half a cake).
 * Returns null if contribution margin is zero or negative (can never break even).
 */
export function calculateBreakEven(
  fixedCostsCentavos: number,
  pricePerUnitCentavos: number,
  costPerUnitCentavos: number
): number | null {
  const contributionMargin = pricePerUnitCentavos - costPerUnitCentavos;
  if (contributionMargin <= 0) return null;
  if (fixedCostsCentavos <= 0) return 0;

  return Math.ceil(fixedCostsCentavos / contributionMargin);
}

// ─── Per-Unit Cost ──────────────────────────────────────────────────

/**
 * Calculate cost per unit given total cost and yield quantity.
 * Returns integer centavos.
 */
export function calculateCostPerUnit(
  totalCostCentavos: number,
  yieldQuantity: number
): number {
  if (yieldQuantity <= 0) return totalCostCentavos;
  return Math.round(totalCostCentavos / yieldQuantity);
}
