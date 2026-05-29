/**
 * Unit tests — Money utilities (lib/utils/money)
 *
 * Money is INTEGER centavos throughout AKBai (₱34.50 = 3450); peso conversion
 * is a UI / export concern handled here, the single source of truth.
 *
 * `centavosToPlainDecimal` is the load-bearing one: it backs the CSV export
 * column, so its fixed-2-decimal, no-glyph, no-grouping, sign-correct contract
 * is what keeps an exported file re-importing cleanly into Excel / Sheets and
 * keeps a legitimate negative amount as a real number (not a formula).
 */

import { describe, it, expect } from 'vitest';
import { centavosToPeso, pesoToCentavos, centavosToPlainDecimal } from '../money';

describe('centavosToPeso', () => {
  it('formats with ₱ glyph, grouping, and 2 decimals', () => {
    expect(centavosToPeso(345000)).toBe('₱3,450.00');
  });

  it('formats the canonical ₱34.50 example', () => {
    expect(centavosToPeso(3450)).toBe('₱34.50');
  });
});

describe('pesoToCentavos', () => {
  it('rounds pesos to integer centavos', () => {
    expect(pesoToCentavos(34.5)).toBe(3450);
    expect(pesoToCentavos(0.05)).toBe(5);
  });
});

describe('centavosToPlainDecimal', () => {
  it('formats whole pesos with trailing .00', () => {
    expect(centavosToPlainDecimal(345000)).toBe('3450.00');
  });

  it('formats the canonical ₱34.50 example as 34.50', () => {
    expect(centavosToPlainDecimal(3450)).toBe('34.50');
  });

  it('zero-pads sub-peso centavos', () => {
    expect(centavosToPlainDecimal(5)).toBe('0.05');
  });

  it('formats zero as 0.00', () => {
    expect(centavosToPlainDecimal(0)).toBe('0.00');
  });

  it('preserves a leading minus for negative amounts', () => {
    expect(centavosToPlainDecimal(-3450)).toBe('-34.50');
    expect(centavosToPlainDecimal(-5)).toBe('-0.05');
  });

  it('emits no thousands separator (re-import safe)', () => {
    expect(centavosToPlainDecimal(123456789)).toBe('1234567.89');
  });

  it('truncates a fractional centavo input (defensive — should be integer)', () => {
    // Inputs are canonically integers; if a fractional sneaks in, truncate
    // toward zero so we never produce a 3-decimal or NaN string.
    expect(centavosToPlainDecimal(3450.9)).toBe('34.50');
    expect(centavosToPlainDecimal(-3450.9)).toBe('-34.50');
  });
});
