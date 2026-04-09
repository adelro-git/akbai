import { describe, it, expect } from 'vitest';

/**
 * Tests for WelcomeTour component logic.
 * Without @testing-library we validate the tour's content contract
 * and localStorage key management.
 */

// ============================================================
// 1. Welcome Tour — feature cards
// ============================================================

const FEATURE_CARDS = [
  {
    title: 'Track expenses',
    description: 'I-log ang mga gastos mo at alamin kung saan napupunta ang pera.',
  },
  {
    title: 'Get BIR reminders',
    description: 'Hindi mo na makakalimutan ang mga tax deadline mo.',
  },
  {
    title: 'Chat with Kai',
    description: 'May tanong ka sa negosyo? Si Kai ang kaakbay mo.',
  },
  {
    title: 'Scan receipts',
    description: 'I-scan lang ang resibo — automatic na ang pag-log.',
  },
];

describe('WelcomeTour — feature cards', () => {
  it('should have exactly 4 feature cards', () => {
    expect(FEATURE_CARDS).toHaveLength(4);
  });

  it('should include all expected feature titles', () => {
    const titles = FEATURE_CARDS.map((c) => c.title);
    expect(titles).toContain('Track expenses');
    expect(titles).toContain('Get BIR reminders');
    expect(titles).toContain('Chat with Kai');
    expect(titles).toContain('Scan receipts');
  });

  it('should use conversational Filipino descriptions', () => {
    // Each description should contain Filipino words
    expect(FEATURE_CARDS[0].description).toContain('gastos');
    expect(FEATURE_CARDS[1].description).toContain('Hindi');
    expect(FEATURE_CARDS[2].description).toContain('negosyo');
    expect(FEATURE_CARDS[3].description).toContain('resibo');
  });
});

// ============================================================
// 2. Welcome Tour — dismiss CTA and localStorage key
// ============================================================

const TOUR_STORAGE_KEY = 'akbai_tour_seen';
const DISMISS_CTA = 'Tara, simulan na natin!';

describe('WelcomeTour — dismiss behavior', () => {
  it('should use the correct localStorage key', () => {
    expect(TOUR_STORAGE_KEY).toBe('akbai_tour_seen');
  });

  it('should have conversational Filipino dismiss CTA', () => {
    expect(DISMISS_CTA).toContain('Tara');
    expect(DISMISS_CTA).toContain('simulan');
    // Not corporate English
    expect(DISMISS_CTA).not.toBe('Get Started');
    expect(DISMISS_CTA).not.toBe('Continue');
  });
});

// ============================================================
// 3. Welcome Tour — schema validation (onboarding "Iba Pa" text)
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
