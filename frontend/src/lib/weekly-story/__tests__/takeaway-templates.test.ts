// ============================================================
// takeaway-templates.test.ts — Phase 7 D6 tonal rotation determinism.
// ============================================================

import { describe, it, expect } from 'vitest';
import { dayOfYear, pickTone, pickTakeaway } from '../takeaway-templates';

describe('dayOfYear', () => {
  it('returns 1 for January 1st', () => {
    expect(dayOfYear('2026-01-01')).toBe(1);
  });

  it('returns the right ordinal for late dates', () => {
    expect(dayOfYear('2026-12-31')).toBe(365);
    // 2024 is a leap year — Dec 31 is day 366.
    expect(dayOfYear('2024-12-31')).toBe(366);
  });
});

describe('pickTone — deterministic mod-3 rotation', () => {
  it('returns the same tone for the same date', () => {
    const a = pickTone('2026-04-22');
    const b = pickTone('2026-04-22');
    expect(a).toBe(b);
  });

  it('cycles across three days', () => {
    const tones = new Set([
      pickTone('2026-04-20'),
      pickTone('2026-04-21'),
      pickTone('2026-04-22'),
    ]);
    expect(tones.size).toBe(3);
    expect([...tones].every((t) => ['energetic', 'observant', 'celebratory'].includes(t))).toBe(true);
  });
});

describe('pickTakeaway', () => {
  const positiveStory = {
    kita_centavos: 100000, // ₱1,000
    gastos_centavos: 30000, // ₱300
    tubo_centavos: 70000, // ₱700
  };
  const flatStory = {
    kita_centavos: 50000,
    gastos_centavos: 50000,
    tubo_centavos: 0,
  };
  const negativeStory = {
    kita_centavos: 30000,
    gastos_centavos: 100000,
    tubo_centavos: -70000,
  };

  it('emits Filipino-frame copy for energetic positive', () => {
    const t = pickTakeaway('energetic', positiveStory, 'Maria');
    expect(t).toMatch(/Ginalingan mo/);
    expect(t).toMatch(/Maria/);
    expect(t).toMatch(/Tubo/);
  });

  it('emits balanced copy for observant flat', () => {
    const t = pickTakeaway('observant', flatStory, 'Jose');
    expect(t).toMatch(/Pantay/);
  });

  it('emits caring copy for celebratory negative', () => {
    const t = pickTakeaway('celebratory', negativeStory, 'Boss');
    expect(t).toMatch(/Hindi madali/);
    expect(t).toMatch(/Boss/);
  });

  it('falls back to "Boss" when name is empty', () => {
    const t = pickTakeaway('energetic', positiveStory, '');
    expect(t).toMatch(/Boss/);
  });

  it('formats peso amounts with PHP currency', () => {
    const t = pickTakeaway('observant', positiveStory, 'Maria');
    // "PHP" or "₱" depending on environment ICU; the helper uses en-PH which
    // commonly outputs "₱". Either is acceptable — assert the digits.
    expect(t).toMatch(/1,000/);
    expect(t).toMatch(/300/);
  });
});
