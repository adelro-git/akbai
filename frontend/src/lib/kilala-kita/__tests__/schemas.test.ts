import { describe, it, expect } from 'vitest';
import {
  OnboardingStepSchema,
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
  OnboardingStep5Schema,
  BusinessTypeEnum,
  IncomeRangeEnum,
  PainPointEnum,
} from '../schemas';

// ============================================================
// Enum validation
// ============================================================

describe('BusinessTypeEnum', () => {
  it('should accept all Phase 1 business types', () => {
    const types = ['food_baking', 'online_selling', 'freelance_creative', 'sari_sari_retail', 'other'];
    types.forEach((type) => {
      expect(BusinessTypeEnum.safeParse(type).success).toBe(true);
    });
  });

  it('should reject invalid business types', () => {
    expect(BusinessTypeEnum.safeParse('invalid_type').success).toBe(false);
    expect(BusinessTypeEnum.safeParse('').success).toBe(false);
    expect(BusinessTypeEnum.safeParse(123).success).toBe(false);
  });

  it('should reject Phase 2 types in Phase 1 enum', () => {
    expect(BusinessTypeEnum.safeParse('food_carinderia').success).toBe(false);
    expect(BusinessTypeEnum.safeParse('service_salon').success).toBe(false);
  });
});

describe('IncomeRangeEnum', () => {
  it('should accept all income ranges', () => {
    const ranges = ['below_50k', '50k_150k', '150k_500k', 'above_500k'];
    ranges.forEach((range) => {
      expect(IncomeRangeEnum.safeParse(range).success).toBe(true);
    });
  });

  it('should reject invalid income ranges', () => {
    expect(IncomeRangeEnum.safeParse('0_50k').success).toBe(false);
    expect(IncomeRangeEnum.safeParse('above_1m').success).toBe(false);
  });
});

describe('PainPointEnum', () => {
  it('should accept all pain points', () => {
    const pains = ['receipt_tracking', 'bir_compliance', 'customer_messages', 'knowing_earnings'];
    pains.forEach((pain) => {
      expect(PainPointEnum.safeParse(pain).success).toBe(true);
    });
  });

  it('should reject invalid pain points', () => {
    expect(PainPointEnum.safeParse('marketing').success).toBe(false);
  });
});

// ============================================================
// Step 1: Welcome + Name
// ============================================================

describe('OnboardingStep1Schema', () => {
  it('should accept valid name', () => {
    const result = OnboardingStep1Schema.safeParse({ step: 1, display_name: 'Maria' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Maria');
    }
  });

  it('should trim whitespace from name', () => {
    const result = OnboardingStep1Schema.safeParse({ step: 1, display_name: '  Maria  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Maria');
    }
  });

  it('should reject empty name', () => {
    const result = OnboardingStep1Schema.safeParse({ step: 1, display_name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only name', () => {
    const result = OnboardingStep1Schema.safeParse({ step: 1, display_name: '   ' });
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = OnboardingStep1Schema.safeParse({ step: 1, display_name: longName });
    expect(result.success).toBe(false);
  });

  it('should accept Filipino names with special characters', () => {
    const names = ['Maria dela Cruz', 'José', 'Niña', 'Juan-Carlo'];
    names.forEach((name) => {
      expect(OnboardingStep1Schema.safeParse({ step: 1, display_name: name }).success).toBe(true);
    });
  });

  it('should reject wrong step number', () => {
    const result = OnboardingStep1Schema.safeParse({ step: 2, display_name: 'Maria' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Step 2: Business Type
// ============================================================

describe('OnboardingStep2Schema', () => {
  it('should accept valid business type', () => {
    const result = OnboardingStep2Schema.safeParse({ step: 2, business_type: 'food_baking' });
    expect(result.success).toBe(true);
  });

  it('should reject missing business_type', () => {
    const result = OnboardingStep2Schema.safeParse({ step: 2 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid business_type', () => {
    const result = OnboardingStep2Schema.safeParse({ step: 2, business_type: 'farming' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Step 3: Income Range
// ============================================================

describe('OnboardingStep3Schema', () => {
  it('should accept valid income range', () => {
    const result = OnboardingStep3Schema.safeParse({ step: 3, income_range: '50k_150k' });
    expect(result.success).toBe(true);
  });

  it('should reject missing income_range', () => {
    const result = OnboardingStep3Schema.safeParse({ step: 3 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Step 4: Pain Point
// ============================================================

describe('OnboardingStep4Schema', () => {
  it('should accept valid pain point', () => {
    const result = OnboardingStep4Schema.safeParse({ step: 4, primary_pain: 'receipt_tracking' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid pain point', () => {
    const result = OnboardingStep4Schema.safeParse({ step: 4, primary_pain: 'hiring' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Step 5: BIR Consent
// ============================================================

describe('OnboardingStep5Schema', () => {
  it('should accept true consent', () => {
    const result = OnboardingStep5Schema.safeParse({ step: 5, bir_consent: true });
    expect(result.success).toBe(true);
  });

  it('should accept false consent', () => {
    const result = OnboardingStep5Schema.safeParse({ step: 5, bir_consent: false });
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean consent', () => {
    const result = OnboardingStep5Schema.safeParse({ step: 5, bir_consent: 'yes' });
    expect(result.success).toBe(false);
  });

  it('should reject missing consent', () => {
    const result = OnboardingStep5Schema.safeParse({ step: 5 });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Discriminated Union
// ============================================================

describe('OnboardingStepSchema (discriminated union)', () => {
  it('should route to correct schema based on step number', () => {
    expect(OnboardingStepSchema.safeParse({ step: 1, display_name: 'Maria' }).success).toBe(true);
    expect(OnboardingStepSchema.safeParse({ step: 2, business_type: 'food_baking' }).success).toBe(true);
    expect(OnboardingStepSchema.safeParse({ step: 3, income_range: 'below_50k' }).success).toBe(true);
    expect(OnboardingStepSchema.safeParse({ step: 4, primary_pain: 'bir_compliance' }).success).toBe(true);
    expect(OnboardingStepSchema.safeParse({ step: 5, bir_consent: true }).success).toBe(true);
  });

  it('should reject step 1 payload sent as step 2', () => {
    const result = OnboardingStepSchema.safeParse({ step: 2, display_name: 'Maria' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid step numbers', () => {
    expect(OnboardingStepSchema.safeParse({ step: 0 }).success).toBe(false);
    expect(OnboardingStepSchema.safeParse({ step: 6 }).success).toBe(false);
    expect(OnboardingStepSchema.safeParse({ step: -1 }).success).toBe(false);
  });

  it('should reject missing step field', () => {
    expect(OnboardingStepSchema.safeParse({ display_name: 'Maria' }).success).toBe(false);
  });
});
