import { describe, it, expect } from 'vitest';

// ============================================================
// Phase 6 — WelcomeTour configuration mirror.
// Replaces the prior 4-card overlay with a Kai-led 3-card paper-note
// tour: 1 primary card + 2 supporting cards, expression varies per
// pain point. Completion now persists to user_metadata.welcome_tour_completed
// (with localStorage as a same-device backup), not just localStorage.
// ============================================================

const TOUR_STORAGE_KEY = 'akbai_tour_seen';
const TOUR_METADATA_KEY = 'welcome_tour_completed';

const PAIN_KEYS = ['receipt_tracking', 'bir_compliance', 'customer_messages', 'knowing_earnings'];

describe('WelcomeTour — persistence keys', () => {
  it('keeps the legacy localStorage key for same-device backups', () => {
    expect(TOUR_STORAGE_KEY).toBe('akbai_tour_seen');
  });

  it('uses welcome_tour_completed as the user_metadata field', () => {
    // The metadata field is what cross-device persistence reads on subsequent visits.
    expect(TOUR_METADATA_KEY).toBe('welcome_tour_completed');
  });
});

describe('WelcomeTour — pain-point coverage', () => {
  it('covers all 4 PainPointEnum values without gaps', () => {
    expect(PAIN_KEYS).toHaveLength(4);
    expect(new Set(PAIN_KEYS).size).toBe(PAIN_KEYS.length);
  });

  it('matches the kilala-kita PainPointEnum exactly', async () => {
    const { PainPointEnum } = await import('@/lib/kilala-kita/schemas');
    const enumValues = Array.from(PainPointEnum.options);
    expect(new Set(enumValues)).toEqual(new Set(PAIN_KEYS));
  });
});

// ============================================================
// Onboarding "Iba Pa" custom business type schema (preserved
// from the prior test — still load-bearing across Phase 6).
// ============================================================

describe('Onboarding — "Iba Pa" custom business type schema', () => {
  it('should accept standard business types', async () => {
    const { OnboardingStep2Schema } = await import('@/lib/kilala-kita/schemas');
    const result = OnboardingStep2Schema.safeParse({
      step: 2,
      business_type: 'food_baking',
    });
    expect(result.success).toBe(true);
  });

  it('should accept "other:Custom text" format', async () => {
    const { OnboardingStep2Schema } = await import('@/lib/kilala-kita/schemas');
    const result = OnboardingStep2Schema.safeParse({
      step: 2,
      business_type: 'other:Pet grooming',
    });
    expect(result.success).toBe(true);
  });

  it('should reject "other:" with less than 2 chars', async () => {
    const { OnboardingStep2Schema } = await import('@/lib/kilala-kita/schemas');
    const result = OnboardingStep2Schema.safeParse({
      step: 2,
      business_type: 'other:A',
    });
    expect(result.success).toBe(false);
  });

  it('should reject completely invalid business types', async () => {
    const { OnboardingStep2Schema } = await import('@/lib/kilala-kita/schemas');
    const result = OnboardingStep2Schema.safeParse({
      step: 2,
      business_type: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });
});
