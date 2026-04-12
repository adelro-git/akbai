import { describe, it, expect } from 'vitest';
import { centavosToPeso, pesoToCentavos } from '@/lib/utils/money';
import {
  calculateTotalCost,
  calculateSuggestedPrice,
  calculateActualMargin,
  calculateBreakEven,
  calculateCostPerUnit,
} from '@/lib/costing/calculations';

/**
 * Costing Card UI/integration-level tests
 *
 * Tests the business logic flows that the UI components depend on:
 * - Maria's chocolate cake recipe costing scenario
 * - Margin indicator thresholds
 * - Money formatting for costing displays
 * - End-to-end costing card calculation flow
 */

// ─── Real-world scenario: Maria's Chocolate Cake ────────────────────

describe('Maria\'s Chocolate Cake scenario', () => {
  const items = [
    { quantity: 2, unit_cost_centavos: 4500 },   // 2kg flour @ ₱45 = ₱90
    { quantity: 1, unit_cost_centavos: 12000 },  // cocoa powder @ ₱120
    { quantity: 6, unit_cost_centavos: 800 },     // 6 eggs @ ₱8 = ₱48
    { quantity: 1, unit_cost_centavos: 8000 },   // butter @ ₱80
    { quantity: 2, unit_cost_centavos: 5000 },   // 2kg sugar @ ₱50 = ₱100
    { quantity: 1, unit_cost_centavos: 3500 },   // packaging @ ₱35
  ];

  const totalCost = calculateTotalCost(items);
  const yieldQty = 8; // 8 slices

  it('calculates total recipe cost correctly', () => {
    // 9000 + 12000 + 4800 + 8000 + 10000 + 3500 = 47300 centavos = ₱473.00
    expect(totalCost).toBe(47300);
  });

  it('calculates cost per slice', () => {
    const costPerSlice = calculateCostPerUnit(totalCost, yieldQty);
    // 47300 / 8 = 5912.5 → 5913 centavos = ₱59.13
    expect(costPerSlice).toBe(5913);
  });

  it('suggests selling price at 40% margin', () => {
    const suggested = calculateSuggestedPrice(totalCost, 40);
    // 47300 / 0.60 = 78833.33 → 78833
    expect(suggested).toBe(78833);
  });

  it('calculates actual margin when Maria sells at ₱850', () => {
    const margin = calculateActualMargin(85000, totalCost);
    // (85000 - 47300) / 85000 * 100 = 44.35%
    expect(margin).toBe(44.35);
  });

  it('calculates break-even with ₱5,000/month rent', () => {
    const costPerSlice = calculateCostPerUnit(totalCost, yieldQty);
    const pricePerSlice = Math.round(85000 / yieldQty); // ₱106.25 per slice → 10625
    const breakEven = calculateBreakEven(500000, pricePerSlice, costPerSlice);
    // 500000 / (10625 - 5913) = 500000 / 4712 = 106.1 → 107 slices
    expect(breakEven).toBe(107);
  });
});

// ─── Margin indicator thresholds ────────────────────────────────────

describe('Margin indicator thresholds', () => {
  it('healthy margin (>= 30%)', () => {
    const margin = calculateActualMargin(10000, 6000);
    // (10000-6000)/10000*100 = 40%
    expect(margin).not.toBeNull();
    expect(margin!).toBeGreaterThanOrEqual(30);
  });

  it('thin margin (15-29%)', () => {
    const margin = calculateActualMargin(10000, 8000);
    // (10000-8000)/10000*100 = 20%
    expect(margin).not.toBeNull();
    expect(margin!).toBeGreaterThanOrEqual(15);
    expect(margin!).toBeLessThan(30);
  });

  it('danger zone (< 15%)', () => {
    const margin = calculateActualMargin(10000, 9000);
    // (10000-9000)/10000*100 = 10%
    expect(margin).not.toBeNull();
    expect(margin!).toBeLessThan(15);
  });

  it('losing money (negative)', () => {
    const margin = calculateActualMargin(8000, 10000);
    expect(margin).not.toBeNull();
    expect(margin!).toBeLessThan(0);
  });
});

// ─── Money formatting for costing displays ──────────────────────────

describe('Money formatting for costing cards', () => {
  it('formats recipe total cost', () => {
    expect(centavosToPeso(47300)).toBe('₱473.00');
  });

  it('formats suggested price', () => {
    expect(centavosToPeso(78833)).toBe('₱788.33');
  });

  it('formats cost per unit', () => {
    expect(centavosToPeso(5913)).toBe('₱59.13');
  });

  it('converts peso input to centavos', () => {
    expect(pesoToCentavos(473)).toBe(47300);
    expect(pesoToCentavos(59.13)).toBe(5913);
  });

  it('handles zero amounts', () => {
    expect(centavosToPeso(0)).toBe('₱0.00');
    expect(pesoToCentavos(0)).toBe(0);
  });
});

// ─── Edge cases ─────────────────────────────────────────────────────

describe('Costing card edge cases', () => {
  it('single item card', () => {
    const items = [{ quantity: 1, unit_cost_centavos: 10000 }];
    expect(calculateTotalCost(items)).toBe(10000);
  });

  it('very high margin target still gives valid price', () => {
    const price = calculateSuggestedPrice(10000, 90);
    // 10000 / 0.10 = 100000
    expect(price).toBe(100000);
  });

  it('zero percent margin means sell at cost', () => {
    const price = calculateSuggestedPrice(10000, 0);
    expect(price).toBe(10000);
  });

  it('break-even is null when selling below cost', () => {
    const breakEven = calculateBreakEven(100000, 5000, 8000);
    expect(breakEven).toBeNull();
  });
});
