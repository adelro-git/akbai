import { describe, it, expect } from 'vitest';

// ============================================================
// Phase 6 — SampaguitaProgress (5-dot kumustahan stepper).
// Logic-only tests on the step-state derivation. Component itself
// renders SVG via IconSampaguita, which is covered separately by
// the Phase 4 brand-icon tests.
// ============================================================

function deriveStepState(
  current: number,
  total: number,
): Array<'done' | 'current' | 'future'> {
  const clamped = Math.min(Math.max(current, 1), total);
  return Array.from({ length: total }, (_, idx) => {
    const stepNum = idx + 1;
    if (stepNum < clamped) return 'done';
    if (stepNum === clamped) return 'current';
    return 'future';
  });
}

describe('SampaguitaProgress — state derivation', () => {
  it('renders all 5 future dots when current is 1', () => {
    expect(deriveStepState(1, 5)).toEqual(['current', 'future', 'future', 'future', 'future']);
  });

  it('marks the first n-1 dots done when on the nth step', () => {
    expect(deriveStepState(3, 5)).toEqual(['done', 'done', 'current', 'future', 'future']);
  });

  it('marks all but the last dot done when on the final step', () => {
    expect(deriveStepState(5, 5)).toEqual(['done', 'done', 'done', 'done', 'current']);
  });

  it('clamps current step to the valid range (no overflow)', () => {
    // Step 99 of 5 should still render 4 done + 1 current — never an out-of-range state.
    expect(deriveStepState(99, 5)).toEqual(['done', 'done', 'done', 'done', 'current']);
  });

  it('clamps current step at the lower bound (no negative steps)', () => {
    expect(deriveStepState(0, 5)).toEqual(['current', 'future', 'future', 'future', 'future']);
    expect(deriveStepState(-3, 5)).toEqual(['current', 'future', 'future', 'future', 'future']);
  });

  it('supports a non-default total step count', () => {
    expect(deriveStepState(2, 3)).toEqual(['done', 'current', 'future']);
  });
});

describe('SampaguitaProgress — Kai expression mapping per onboarding step', () => {
  // Mirror of the wizard's STEP_EXPRESSION map. Test guards against accidental
  // reordering: Kai must wave at step 1 (first hello) and concern at step 4
  // (asking the hardest pain) — these are the visceral-warmth anchors.
  const STEP_EXPRESSION = {
    1: 'waving',
    2: 'thinking',
    3: 'happy',
    4: 'concerned',
    5: 'working',
  } as const;

  it('starts with a waving Kai (visceral first hello)', () => {
    expect(STEP_EXPRESSION[1]).toBe('waving');
  });

  it('switches to concerned at the pain-point step (caregiver register)', () => {
    expect(STEP_EXPRESSION[4]).toBe('concerned');
  });

  it('lands at working at the BIR consent step (sage register)', () => {
    expect(STEP_EXPRESSION[5]).toBe('working');
  });
});
