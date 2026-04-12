import { describe, it, expect } from 'vitest';
import {
  CostingCardItemTypeEnum,
  CreateCostingCardItemSchema,
  CreateCostingCardSchema,
  UpdateCostingCardSchema,
} from '../schemas';

// ─── CostingCardItemTypeEnum ─────────────────────────────────────────

describe('CostingCardItemTypeEnum', () => {
  it('accepts all valid item types', () => {
    for (const t of ['ingredient', 'labor', 'overhead', 'packaging', 'other']) {
      expect(CostingCardItemTypeEnum.parse(t)).toBe(t);
    }
  });

  it('rejects invalid item types', () => {
    expect(() => CostingCardItemTypeEnum.parse('materials')).toThrow();
    expect(() => CostingCardItemTypeEnum.parse('')).toThrow();
  });
});

// ─── CreateCostingCardItemSchema ─────────────────────────────────────

describe('CreateCostingCardItemSchema', () => {
  const validItem = {
    item_name: 'All-purpose flour',
    unit_cost_centavos: 4500,
  };

  it('accepts valid item with minimal fields', () => {
    const result = CreateCostingCardItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('accepts item with all optional fields', () => {
    const result = CreateCostingCardItemSchema.safeParse({
      ...validItem,
      item_type: 'ingredient',
      quantity: 2.5,
      unit: 'kg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty item name', () => {
    const result = CreateCostingCardItemSchema.safeParse({
      ...validItem,
      item_name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer centavos', () => {
    const result = CreateCostingCardItemSchema.safeParse({
      ...validItem,
      unit_cost_centavos: 45.50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative cost', () => {
    const result = CreateCostingCardItemSchema.safeParse({
      ...validItem,
      unit_cost_centavos: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ─── CreateCostingCardSchema ─────────────────────────────────────────

describe('CreateCostingCardSchema', () => {
  const validCard = {
    product_name: 'Chocolate Cake (8-inch)',
    items: [
      { item_name: 'Flour', unit_cost_centavos: 4500 },
      { item_name: 'Cocoa powder', unit_cost_centavos: 12000 },
    ],
  };

  it('accepts valid costing card with items', () => {
    const result = CreateCostingCardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it('accepts card with all optional fields', () => {
    const result = CreateCostingCardSchema.safeParse({
      ...validCard,
      product_category: 'cakes',
      description: 'Standard 8-inch chocolate cake recipe',
      target_margin_pct: 40,
      selling_price_centavos: 85000,
      monthly_fixed_costs_centavos: 500000,
      yield_quantity: 8,
      yield_unit: 'slice',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing product name', () => {
    const result = CreateCostingCardSchema.safeParse({
      items: [{ item_name: 'Flour', unit_cost_centavos: 4500 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = CreateCostingCardSchema.safeParse({
      product_name: 'Cake',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer selling price', () => {
    const result = CreateCostingCardSchema.safeParse({
      ...validCard,
      selling_price_centavos: 850.50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects margin over 99.99%', () => {
    const result = CreateCostingCardSchema.safeParse({
      ...validCard,
      target_margin_pct: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative margin', () => {
    const result = CreateCostingCardSchema.safeParse({
      ...validCard,
      target_margin_pct: -5,
    });
    expect(result.success).toBe(false);
  });
});

// ─── UpdateCostingCardSchema ─────────────────────────────────────────

describe('UpdateCostingCardSchema', () => {
  it('accepts partial update with product name', () => {
    const result = UpdateCostingCardSchema.safeParse({ product_name: 'Updated Cake' });
    expect(result.success).toBe(true);
  });

  it('accepts update with new items', () => {
    const result = UpdateCostingCardSchema.safeParse({
      items: [{ item_name: 'Sugar', unit_cost_centavos: 3000 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty update', () => {
    const result = UpdateCostingCardSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
