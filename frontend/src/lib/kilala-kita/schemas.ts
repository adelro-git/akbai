import { z } from 'zod';

// ============================================================
// Enums
// ============================================================

export const BusinessTypeEnum = z.enum([
  'food_baking',
  'online_selling',
  'freelance_creative',
  'sari_sari_retail',
  'other',
]);

/** Phase 2 types — not selectable in onboarding yet, but valid in DB */
export const BusinessTypeExtendedEnum = z.enum([
  'food_baking',
  'online_selling',
  'freelance_creative',
  'sari_sari_retail',
  'food_carinderia',
  'service_salon',
  'other',
]);

export const IncomeRangeEnum = z.enum([
  'below_50k',
  '50k_150k',
  '150k_500k',
  'above_500k',
]);

export const PainPointEnum = z.enum([
  'receipt_tracking',
  'bir_compliance',
  'customer_messages',
  'knowing_earnings',
]);

// ============================================================
// Types
// ============================================================

export type BusinessType = z.infer<typeof BusinessTypeEnum>;
export type BusinessTypeExtended = z.infer<typeof BusinessTypeExtendedEnum>;
export type IncomeRange = z.infer<typeof IncomeRangeEnum>;
export type PainPoint = z.infer<typeof PainPointEnum>;

// ============================================================
// Per-Step Schemas
// ============================================================

export const OnboardingStep1Schema = z.object({
  step: z.literal(1),
  display_name: z.string().trim().min(1, 'Kailangan ng pangalan.').max(100),
});

export const OnboardingStep2Schema = z.object({
  step: z.literal(2),
  business_type: BusinessTypeEnum,
});

export const OnboardingStep3Schema = z.object({
  step: z.literal(3),
  income_range: IncomeRangeEnum,
});

export const OnboardingStep4Schema = z.object({
  step: z.literal(4),
  primary_pain: PainPointEnum,
});

export const OnboardingStep5Schema = z.object({
  step: z.literal(5),
  bir_consent: z.boolean(),
});

// Discriminated union for the API
export const OnboardingStepSchema = z.discriminatedUnion('step', [
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
  OnboardingStep5Schema,
]);

export type OnboardingStepPayload = z.infer<typeof OnboardingStepSchema>;

// ============================================================
// Onboarding State (GET response)
// ============================================================

export interface OnboardingState {
  onboarding_step: number;
  onboarding_completed: boolean;
  display_name: string | null;
  business_type: string | null;
  income_range: string | null;
  primary_pain: string | null;
  bir_consent: boolean | null;
}
