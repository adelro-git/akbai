import { describe, it, expect } from 'vitest';
import { ProfilePatchSchema } from '@/app/api/profile/route';
import { BUSINESS_TYPES, INCOME_RANGES, BUSINESS_TYPE_LABELS, INCOME_RANGE_LABELS } from '@/lib/constants/business-options';

// ============================================================
// Tests: ProfilePatchSchema (Zod validation)
// ============================================================

describe('ProfilePatchSchema', () => {
  it('should accept valid business_type update', () => {
    const result = ProfilePatchSchema.safeParse({ business_type: 'food_baking' });
    expect(result.success).toBe(true);
  });

  it('should accept valid income_range update', () => {
    const result = ProfilePatchSchema.safeParse({ income_range: '50k_150k' });
    expect(result.success).toBe(true);
  });

  it('should accept valid display_name update', () => {
    const result = ProfilePatchSchema.safeParse({ display_name: 'Maria' });
    expect(result.success).toBe(true);
  });

  it('should accept valid bir_registered update', () => {
    const result = ProfilePatchSchema.safeParse({ bir_registered: true });
    expect(result.success).toBe(true);
  });

  it('should accept multiple fields at once', () => {
    const result = ProfilePatchSchema.safeParse({
      display_name: 'Maria',
      business_name: 'Maria Cakes',
      business_type: 'food_baking',
      income_range: 'below_50k',
      bir_registered: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty payload', () => {
    const result = ProfilePatchSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid business_type', () => {
    const result = ProfilePatchSchema.safeParse({ business_type: 'not_a_valid_type' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid income_range', () => {
    const result = ProfilePatchSchema.safeParse({ income_range: 'million_pesos' });
    expect(result.success).toBe(false);
  });

  it('should reject empty display_name (min 1 char after trim)', () => {
    const result = ProfilePatchSchema.safeParse({ display_name: '   ' });
    expect(result.success).toBe(false);
  });

  it('should trim display_name', () => {
    const result = ProfilePatchSchema.safeParse({ display_name: '  Maria  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Maria');
    }
  });
});

// ============================================================
// Tests: Business Options constants
// ============================================================

describe('Business Options constants', () => {
  it('should have 5 business types', () => {
    expect(BUSINESS_TYPES).toHaveLength(5);
  });

  it('should have 4 income ranges', () => {
    expect(INCOME_RANGES).toHaveLength(4);
  });

  it('should have a label for every business type value', () => {
    for (const bt of BUSINESS_TYPES) {
      expect(BUSINESS_TYPE_LABELS[bt.value]).toBe(bt.label);
    }
  });

  it('should have a label for every income range value', () => {
    for (const ir of INCOME_RANGES) {
      expect(INCOME_RANGE_LABELS[ir.value]).toBe(ir.label);
    }
  });

  it('should map food_baking to Food / Baking', () => {
    expect(BUSINESS_TYPE_LABELS['food_baking']).toBe('Food / Baking');
  });

  it('should map below_50k to Below PHP50K', () => {
    expect(INCOME_RANGE_LABELS['below_50k']).toContain('50K');
  });
});
