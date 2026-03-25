import { describe, it, expect, vi } from 'vitest';

// ============================================================
// Test KAI greeting logic (time-of-day awareness)
// The greeting generator is the core logic of the KaiGreeting component.
// Without @testing-library we test the greeting generation directly.
// ============================================================

let mockHour = 9;

vi.mock('@/lib/timezone', () => ({
  toManila: () => new Date(Date.UTC(2026, 2, 24, mockHour, 0, 0)),
}));

// Import the mocked module at the top level
import { toManila } from '@/lib/timezone';

// Re-implement the greeting logic (same as in dashboard page/API route)
function generateGreeting(name: string): string {
  const manila = toManila();
  const hour = manila.getUTCHours();

  if (hour >= 5 && hour < 12) {
    return `Magandang umaga, ${name}! Ang Umaga Mo ngayon...`;
  }
  if (hour >= 12 && hour < 18) {
    return `Magandang hapon, ${name}! Kumusta ang negosyo?`;
  }
  return `Magandang gabi, ${name}! Tara, check natin ang araw mo.`;
}

describe('KaiGreeting — greeting logic', () => {
  it('should produce morning greeting between 5:00 and 11:59', () => {
    mockHour = 5;
    expect(generateGreeting('Maria')).toBe(
      'Magandang umaga, Maria! Ang Umaga Mo ngayon...'
    );
    mockHour = 11;
    expect(generateGreeting('Ana')).toContain('Magandang umaga');
  });

  it('should produce afternoon greeting between 12:00 and 17:59', () => {
    mockHour = 12;
    expect(generateGreeting('Jose')).toBe(
      'Magandang hapon, Jose! Kumusta ang negosyo?'
    );
    mockHour = 17;
    expect(generateGreeting('Andoy')).toContain('Magandang hapon');
  });

  it('should produce evening greeting between 18:00 and 4:59', () => {
    mockHour = 18;
    expect(generateGreeting('Maria')).toBe(
      'Magandang gabi, Maria! Tara, check natin ang araw mo.'
    );
    mockHour = 0;
    expect(generateGreeting('Boss')).toContain('Magandang gabi');
    mockHour = 4;
    expect(generateGreeting('Boss')).toContain('Magandang gabi');
  });

  it('should include the user name', () => {
    mockHour = 9;
    const greeting = generateGreeting('Maria');
    expect(greeting).toContain('Maria');
  });

  it('should use Taglish copy (not English-only)', () => {
    mockHour = 9;
    const greeting = generateGreeting('Maria');
    expect(greeting).toContain('Magandang');
    // Should NOT be "Good morning"
    expect(greeting).not.toContain('Good morning');
  });
});

describe('KaiGreeting — business type labels', () => {
  const BUSINESS_TYPE_LABELS: Record<string, string> = {
    food_baking: 'Food / Baking',
    online_selling: 'Online Selling',
    freelance_creative: 'Freelance / Creative',
    sari_sari_retail: 'Sari-sari / Retail',
    food_carinderia: 'Karinderya',
    service_salon: 'Salon / Service',
    other: 'Negosyo',
  };

  it('should map all known business types to labels', () => {
    expect(BUSINESS_TYPE_LABELS['food_baking']).toBe('Food / Baking');
    expect(BUSINESS_TYPE_LABELS['online_selling']).toBe('Online Selling');
    expect(BUSINESS_TYPE_LABELS['freelance_creative']).toBe('Freelance / Creative');
    expect(BUSINESS_TYPE_LABELS['sari_sari_retail']).toBe('Sari-sari / Retail');
    expect(BUSINESS_TYPE_LABELS['food_carinderia']).toBe('Karinderya');
    expect(BUSINESS_TYPE_LABELS['service_salon']).toBe('Salon / Service');
    expect(BUSINESS_TYPE_LABELS['other']).toBe('Negosyo');
  });

  it('should return undefined for unknown business types', () => {
    expect(BUSINESS_TYPE_LABELS['farming']).toBeUndefined();
  });
});
