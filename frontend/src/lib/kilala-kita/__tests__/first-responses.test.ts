import { describe, it, expect } from 'vitest';
import { getFirstKAMessage } from '../first-responses';
import type { PainPoint } from '../schemas';

const PHASE_1_TYPES = ['food_baking', 'online_selling', 'freelance_creative', 'sari_sari_retail', 'other'];
const PHASE_2_TYPES = ['food_carinderia', 'service_salon'];
const ALL_TYPES = [...PHASE_1_TYPES, ...PHASE_2_TYPES];
const ALL_PAINS: PainPoint[] = ['receipt_tracking', 'bir_compliance', 'customer_messages', 'knowing_earnings'];

// ============================================================
// Template coverage — all 28 combinations
// ============================================================

describe('getFirstKAMessage — template coverage', () => {
  ALL_TYPES.forEach((businessType) => {
    ALL_PAINS.forEach((painPoint) => {
      it(`should return a message for ${businessType} + ${painPoint}`, () => {
        const result = getFirstKAMessage(businessType, painPoint, 'Maria');
        expect(result.message).toBeTruthy();
        expect(result.message.length).toBeGreaterThan(20);
        expect(result.featureNudge).toBeTruthy();
      });
    });
  });
});

// ============================================================
// Name replacement
// ============================================================

describe('getFirstKAMessage — name replacement', () => {
  it('should replace [Name] with actual first name', () => {
    const result = getFirstKAMessage('food_baking', 'receipt_tracking', 'Maria');
    expect(result.message).toContain('Maria');
    expect(result.message).not.toContain('[Name]');
  });

  it('should handle Filipino names with special characters', () => {
    const result = getFirstKAMessage('food_baking', 'bir_compliance', 'Niña');
    expect(result.message).toContain('Niña');
  });

  it('should handle multiple [Name] occurrences in a template', () => {
    // All templates should have [Name] replaced — no leftover placeholders
    ALL_TYPES.forEach((type) => {
      ALL_PAINS.forEach((pain) => {
        const result = getFirstKAMessage(type, pain, 'Jose');
        expect(result.message).not.toContain('[Name]');
      });
    });
  });
});

// ============================================================
// Fallback to "other" templates
// ============================================================

describe('getFirstKAMessage — fallback for unknown types', () => {
  it('should fall back to "other" template for unknown business type', () => {
    const result = getFirstKAMessage('farming', 'receipt_tracking', 'Andoy');
    expect(result.message).toBeTruthy();
    expect(result.message).toContain('Andoy');
  });

  it('should fall back to "other" template for empty business type', () => {
    const result = getFirstKAMessage('', 'knowing_earnings', 'Ana');
    expect(result.message).toBeTruthy();
    expect(result.message).toContain('Ana');
  });
});

// ============================================================
// Feature nudge correctness
// ============================================================

describe('getFirstKAMessage — feature nudge', () => {
  it('should nudge Resibo Scanner for receipt_tracking pain', () => {
    const result = getFirstKAMessage('food_baking', 'receipt_tracking', 'Maria');
    expect(result.featureNudge).toBe('resibo_scanner');
  });

  it('should nudge Deadline Watcher for bir_compliance pain', () => {
    const result = getFirstKAMessage('food_baking', 'bir_compliance', 'Maria');
    expect(result.featureNudge).toBe('deadline_watcher');
  });

  it('should nudge Reply Drafter for customer_messages pain', () => {
    const result = getFirstKAMessage('food_baking', 'customer_messages', 'Maria');
    expect(result.featureNudge).toBe('reply_drafter');
  });

  it('should nudge Dashboard for knowing_earnings pain', () => {
    const result = getFirstKAMessage('food_baking', 'knowing_earnings', 'Maria');
    expect(result.featureNudge).toBe('dashboard');
  });
});

// ============================================================
// Taglish tone — messages should feel natural
// ============================================================

describe('getFirstKAMessage — conversational Filipino tone', () => {
  it('should use ₱ sign (not PHP) in money-related messages', () => {
    // Not all messages mention money, but none should use "PHP"
    ALL_TYPES.forEach((type) => {
      ALL_PAINS.forEach((pain) => {
        const result = getFirstKAMessage(type, pain, 'Maria');
        expect(result.message).not.toContain('PHP');
      });
    });
  });

  it('should not contain corporate filler words', () => {
    const corporateFillers = ['Certainly', 'As an AI', 'I apologize', 'Let me assist'];
    ALL_TYPES.forEach((type) => {
      ALL_PAINS.forEach((pain) => {
        const result = getFirstKAMessage(type, pain, 'Maria');
        corporateFillers.forEach((filler) => {
          expect(result.message).not.toContain(filler);
        });
      });
    });
  });
});
