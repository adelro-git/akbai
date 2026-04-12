import { describe, it, expect } from 'vitest';
import {
  calculateItemTotalCost,
  calculateTotalCost,
  calculateSuggestedPrice,
  calculateActualMargin,
  calculateBreakEven,
  calculateCostPerUnit,
} from '../calculations';

// ─── calculateItemTotalCost ─────────────────────────────────────────

describe('calculateItemTotalCost', () => {
  it('multiplies quantity by unit cost', () => {
    expect(calculateItemTotalCost(2, 5000)).toBe(10000); // 2 x ₱50.00 = ₱100.00
  });

  it('handles fractional quantities', () => {
    expect(calculateItemTotalCost(0.5, 10000)).toBe(5000); // 0.5 x ₱100.00 = ₱50.00
  });

  it('rounds to integer centavos', () => {
    // 3 x ₱33.33 = ₱99.99 → 9999 centavos
    expect(calculateItemTotalCost(3, 3333)).toBe(9999);
  });

  it('handles zero quantity', () => {
    expect(calculateItemTotalCost(0, 5000)).toBe(0);
  });
});

// ─── calculateTotalCost ─────────────────────────────────────────────

describe('calculateTotalCost', () => {
  it('sums all item costs', () => {
    const items = [
      { quantity: 2, unit_cost_centavos: 5000 },
      { quantity: 1, unit_cost_centavos: 12000 },
      { quantity: 3, unit_cost_centavos: 1500 },
    ];
    // 10000 + 12000 + 4500 = 26500
    expect(calculateTotalCost(items)).toBe(26500);
  });

  it('handles single item', () => {
    expect(calculateTotalCost([{ quantity: 1, unit_cost_centavos: 8500 }])).toBe(8500);
  });

  it('handles empty array', () => {
    expect(calculateTotalCost([])).toBe(0);
  });

  it('defaults quantity to 1 if missing (CreateCostingCardItemPayload)', () => {
    // CreateCostingCardItemPayload has optional quantity that defaults to 1
    const items = [{ unit_cost_centavos: 5000 }] as { quantity?: number; unit_cost_centavos: number }[];
    expect(calculateTotalCost(items)).toBe(5000);
  });
});

// ─── calculateSuggestedPrice ────────────────────────────────────────

describe('calculateSuggestedPrice', () => {
  it('calculates price for 40% margin', () => {
    // ₱500 cost at 40% margin → ₱500 / 0.60 = ₱833.33 → 83333 centavos
    expect(calculateSuggestedPrice(50000, 40)).toBe(83333);
  });

  it('calculates price for 30% margin (default)', () => {
    // ₱100 cost at 30% margin → ₱100 / 0.70 = ₱142.86 → 14286 centavos
    expect(calculateSuggestedPrice(10000, 30)).toBe(14286);
  });

  it('returns null for 100% margin (impossible)', () => {
    expect(calculateSuggestedPrice(10000, 100)).toBeNull();
  });

  it('returns null for negative margin', () => {
    expect(calculateSuggestedPrice(10000, -5)).toBeNull();
  });

  it('returns 0 for zero cost', () => {
    expect(calculateSuggestedPrice(0, 30)).toBe(0);
  });

  it('calculates correctly for small margins', () => {
    // ₱100 cost at 5% margin → ₱100 / 0.95 = ₱105.26 → 10526 centavos
    expect(calculateSuggestedPrice(10000, 5)).toBe(10526);
  });
});

// ─── calculateActualMargin ──────────────────────────────────────────

describe('calculateActualMargin', () => {
  it('calculates margin percentage', () => {
    // ₱850 price, ₱500 cost → (850-500)/850*100 = 41.18%
    expect(calculateActualMargin(85000, 50000)).toBe(41.18);
  });

  it('returns 0 when price equals cost', () => {
    expect(calculateActualMargin(10000, 10000)).toBe(0);
  });

  it('returns negative margin when losing money', () => {
    // ₱80 price, ₱100 cost → (80-100)/80*100 = -25%
    expect(calculateActualMargin(8000, 10000)).toBe(-25);
  });

  it('returns null when selling price is 0', () => {
    expect(calculateActualMargin(0, 10000)).toBeNull();
  });

  it('rounds to 2 decimal places', () => {
    // ₱300 price, ₱200 cost → (300-200)/300*100 = 33.333...%
    expect(calculateActualMargin(30000, 20000)).toBe(33.33);
  });
});

// ─── calculateBreakEven ─────────────────────────────────────────────

describe('calculateBreakEven', () => {
  it('calculates break-even quantity', () => {
    // ₱5,000 fixed, ₱100 price, ₱60 cost → 5000/40 = 125 units
    expect(calculateBreakEven(500000, 10000, 6000)).toBe(125);
  });

  it('rounds up to nearest integer', () => {
    // ₱1,000 fixed, ₱100 price, ₱70 cost → 1000/30 = 33.33 → 34 units
    expect(calculateBreakEven(100000, 10000, 7000)).toBe(34);
  });

  it('returns null when price equals cost (no contribution margin)', () => {
    expect(calculateBreakEven(100000, 10000, 10000)).toBeNull();
  });

  it('returns null when losing money per unit', () => {
    expect(calculateBreakEven(100000, 5000, 10000)).toBeNull();
  });

  it('returns 0 when no fixed costs', () => {
    expect(calculateBreakEven(0, 10000, 5000)).toBe(0);
  });
});

// ─── calculateCostPerUnit ───────────────────────────────────────────

describe('calculateCostPerUnit', () => {
  it('divides total cost by yield', () => {
    // ₱500 total / 8 slices = ₱62.50 per slice → 6250 centavos
    expect(calculateCostPerUnit(50000, 8)).toBe(6250);
  });

  it('rounds to integer centavos', () => {
    // ₱100 total / 3 pieces = ₱33.333... → 3333 centavos
    expect(calculateCostPerUnit(10000, 3)).toBe(3333);
  });

  it('returns total cost when yield is 1', () => {
    expect(calculateCostPerUnit(50000, 1)).toBe(50000);
  });

  it('returns total cost when yield is 0 (guard)', () => {
    expect(calculateCostPerUnit(50000, 0)).toBe(50000);
  });
});
