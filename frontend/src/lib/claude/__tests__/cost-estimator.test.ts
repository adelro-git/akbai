import { describe, it, expect } from 'vitest';
import { estimateCost, calculateActualCost } from '../cost-estimator';

describe('estimateCost', () => {
  it('calculates Haiku cost correctly', () => {
    // 2000 input tokens, 512 output tokens
    // Input: (2000 / 1_000_000) * 0.80 = 0.0016
    // Output: (512 / 1_000_000) * 4.00 = 0.002048
    // Total: 0.003648
    const cost = estimateCost('claude-haiku-4-5-20251001', 2000, 512);
    expect(cost).toBeCloseTo(0.003648, 6);
  });

  it('calculates Sonnet cost correctly', () => {
    // 2000 input tokens, 512 output tokens
    // Input: (2000 / 1_000_000) * 3.00 = 0.006
    // Output: (512 / 1_000_000) * 15.00 = 0.00768
    // Total: 0.01368
    const cost = estimateCost('claude-sonnet-4-6', 2000, 512);
    expect(cost).toBeCloseTo(0.01368, 5);
  });

  it('returns 0 for zero tokens', () => {
    const cost = estimateCost('claude-haiku-4-5-20251001', 0, 0);
    expect(cost).toBe(0);
  });

  it('Sonnet is more expensive than Haiku for same token counts', () => {
    const haikuCost = estimateCost('claude-haiku-4-5-20251001', 1000, 256);
    const sonnetCost = estimateCost('claude-sonnet-4-6', 1000, 256);
    expect(sonnetCost).toBeGreaterThan(haikuCost);
  });

  it('scales linearly with token count', () => {
    const cost1k = estimateCost('claude-haiku-4-5-20251001', 1000, 0);
    const cost2k = estimateCost('claude-haiku-4-5-20251001', 2000, 0);
    expect(cost2k).toBeCloseTo(cost1k * 2, 10);
  });

  it('handles large token counts (morning briefing — 1024 output)', () => {
    // Typical morning briefing: Sonnet, 2000 input, 1024 output
    // Input: (2000 / 1_000_000) * 3.00 = 0.006
    // Output: (1024 / 1_000_000) * 15.00 = 0.01536
    // Total: 0.02136
    const cost = estimateCost('claude-sonnet-4-6', 2000, 1024);
    expect(cost).toBeCloseTo(0.02136, 5);
  });
});

describe('calculateActualCost', () => {
  it('calculates actual Haiku cost from response usage', () => {
    // Real response: 1500 input, 230 output
    // Input: (1500 / 1_000_000) * 0.80 = 0.0012
    // Output: (230 / 1_000_000) * 4.00 = 0.00092
    // Total: 0.00212
    const cost = calculateActualCost('claude-haiku-4-5-20251001', 1500, 230);
    expect(cost).toBeCloseTo(0.00212, 5);
  });

  it('calculates actual Sonnet cost from response usage', () => {
    // Real response: 1800 input, 350 output
    // Input: (1800 / 1_000_000) * 3.00 = 0.0054
    // Output: (350 / 1_000_000) * 15.00 = 0.00525
    // Total: 0.01065
    const cost = calculateActualCost('claude-sonnet-4-6', 1800, 350);
    expect(cost).toBeCloseTo(0.01065, 5);
  });

  it('actual cost should be less than or equal to estimate (for same input, lower output)', () => {
    // Estimate assumes max_tokens for output; actual is typically less
    const estimated = estimateCost('claude-sonnet-4-6', 2000, 512);
    const actual = calculateActualCost('claude-sonnet-4-6', 2000, 300); // Actual output < max
    expect(actual).toBeLessThan(estimated);
  });

  it('returns 0 for zero tokens', () => {
    const cost = calculateActualCost('claude-haiku-4-5-20251001', 0, 0);
    expect(cost).toBe(0);
  });

  it('cost is always a positive number for non-zero tokens', () => {
    const cost = calculateActualCost('claude-sonnet-4-6', 1, 1);
    expect(cost).toBeGreaterThan(0);
  });
});
