import { describe, it, expect } from 'vitest';
import { getEstimatedWait } from '../loading-estimator';
import type { KAFeature } from '../types';

describe('getEstimatedWait', () => {
  it('returns correct ranges for general_chat free tier', () => {
    const estimate = getEstimatedWait('general_chat', 'free');
    expect(estimate.minSeconds).toBe(2);
    expect(estimate.maxSeconds).toBe(4);
    expect(estimate.messageTl).toContain('2-4');
  });

  it('returns correct ranges for general_chat pro tier (Sonnet)', () => {
    const estimate = getEstimatedWait('general_chat', 'pro');
    expect(estimate.minSeconds).toBe(3);
    expect(estimate.maxSeconds).toBe(5);
    expect(estimate.messageTl).toContain('3-5');
  });

  it('returns correct ranges for resibo_scanner (always 5-8s)', () => {
    const estimateFree = getEstimatedWait('resibo_scanner', 'free');
    expect(estimateFree.minSeconds).toBe(5);
    expect(estimateFree.maxSeconds).toBe(8);

    const estimatePro = getEstimatedWait('resibo_scanner', 'pro');
    expect(estimatePro.minSeconds).toBe(5);
    expect(estimatePro.maxSeconds).toBe(8);
  });

  it('returns correct ranges for morning_briefing', () => {
    const estimate = getEstimatedWait('morning_briefing', 'free');
    expect(estimate.minSeconds).toBe(3);
    expect(estimate.maxSeconds).toBe(5);
  });

  it('all features return a non-empty messageTl string', () => {
    const features: KAFeature[] = [
      'general_chat',
      'resibo_scanner',
      'morning_briefing',
      'reply_drafter',
      'classify_expense',
      'classify_intent',
    ];

    for (const feature of features) {
      const estimate = getEstimatedWait(feature, 'free');
      expect(estimate.messageTl).toBeTruthy();
      expect(estimate.messageTl.length).toBeGreaterThan(0);
      expect(estimate.longWaitMessageTl).toBeTruthy();
      expect(estimate.longWaitMessageTl.length).toBeGreaterThan(0);
    }
  });

  it('all features return positive min/max seconds', () => {
    const features: KAFeature[] = [
      'general_chat',
      'resibo_scanner',
      'morning_briefing',
      'reply_drafter',
      'classify_expense',
      'classify_intent',
    ];

    for (const feature of features) {
      const estimate = getEstimatedWait(feature, 'free');
      expect(estimate.minSeconds).toBeGreaterThan(0);
      expect(estimate.maxSeconds).toBeGreaterThan(estimate.minSeconds);
    }
  });

  it('longWaitMessageTl contains conversational Filipino text for all features', () => {
    const estimate = getEstimatedWait('general_chat', 'free');
    expect(estimate.longWaitMessageTl).toContain('Medyo matagal');
    expect(estimate.longWaitMessageTl).toContain('sandali');
  });
});
