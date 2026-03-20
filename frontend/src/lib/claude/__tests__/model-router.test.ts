import { describe, it, expect } from 'vitest';
import { selectModel, getMaxTokens } from '../model-router';
import type { KAFeature } from '../types';

describe('selectModel', () => {
  it('returns Haiku for free tier regardless of feature', () => {
    const features: KAFeature[] = [
      'general_chat', 'resibo_scanner', 'morning_briefing',
      'reply_drafter', 'classify_expense', 'classify_intent',
    ];
    for (const feature of features) {
      expect(selectModel('free', feature)).toBe('claude-haiku-4-5-20251001');
    }
  });

  it('returns Sonnet for pro tier general_chat', () => {
    expect(selectModel('pro', 'general_chat')).toBe('claude-sonnet-4-6');
  });

  it('returns Sonnet for pro tier morning_briefing', () => {
    expect(selectModel('pro', 'morning_briefing')).toBe('claude-sonnet-4-6');
  });

  it('returns Haiku for pro tier resibo_scanner', () => {
    expect(selectModel('pro', 'resibo_scanner')).toBe('claude-haiku-4-5-20251001');
  });

  it('returns Haiku for business tier classify_intent', () => {
    expect(selectModel('business', 'classify_intent')).toBe('claude-haiku-4-5-20251001');
  });
});

describe('getMaxTokens', () => {
  it('returns 1024 for morning_briefing', () => {
    expect(getMaxTokens('morning_briefing')).toBe(1024);
  });

  it('returns 1024 for resibo_scanner', () => {
    expect(getMaxTokens('resibo_scanner')).toBe(1024);
  });

  it('returns 512 for general_chat', () => {
    expect(getMaxTokens('general_chat')).toBe(512);
  });
});
