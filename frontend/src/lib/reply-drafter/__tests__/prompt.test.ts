import { describe, it, expect } from 'vitest';
import { assembleReplyPrompt, parseReplyResponse } from '../prompt';

// ============================================================
// assembleReplyPrompt — deterministic, no API calls
// ============================================================

describe('assembleReplyPrompt', () => {
  it('includes the business type when provided', () => {
    const prompt = assembleReplyPrompt('food_baking', 'friendly');
    expect(prompt).toContain('food baking');
  });

  it('uses fallback text when business type is null', () => {
    const prompt = assembleReplyPrompt(null, 'friendly');
    expect(prompt).toContain('type not specified');
  });

  it('includes friendly tone instructions', () => {
    const prompt = assembleReplyPrompt('online_selling', 'friendly');
    expect(prompt).toContain('Warm and approachable');
    expect(prompt).toContain('suki');
  });

  it('includes professional tone instructions', () => {
    const prompt = assembleReplyPrompt('online_selling', 'professional');
    expect(prompt).toContain('Polite and business-like');
    expect(prompt).toContain('corporate client');
  });

  it('includes casual tone instructions', () => {
    const prompt = assembleReplyPrompt('online_selling', 'casual');
    expect(prompt).toContain('Super chill');
    expect(prompt).toContain('kaibigan');
  });

  it('includes REPLY_1 and REPLY_2 format instructions', () => {
    const prompt = assembleReplyPrompt('food_baking', 'friendly');
    expect(prompt).toContain('REPLY_1:');
    expect(prompt).toContain('REPLY_2:');
  });

  it('includes guardrail rules about commitments', () => {
    const prompt = assembleReplyPrompt('food_baking', 'friendly');
    expect(prompt).toContain('NEVER make commitments');
    expect(prompt).toContain('refund');
    expect(prompt).toContain('discount');
  });

  it('mentions Taglish in the rules', () => {
    const prompt = assembleReplyPrompt('food_baking', 'friendly');
    expect(prompt).toContain('Taglish');
  });

  it('mentions Phase 1 copy-paste limitation', () => {
    const prompt = assembleReplyPrompt('food_baking', 'friendly');
    expect(prompt).toContain('Phase 1');
    expect(prompt).toContain('copy-paste');
  });

  it('replaces underscores with spaces in business type', () => {
    const prompt = assembleReplyPrompt('online_selling', 'friendly');
    expect(prompt).toContain('online selling');
    expect(prompt).not.toContain('online_selling');
  });
});

// ============================================================
// parseReplyResponse — extracts structured replies from raw text
// ============================================================

describe('parseReplyResponse', () => {
  it('parses standard REPLY_1 / REPLY_2 format', () => {
    const raw = 'REPLY_1: Hi po! Available pa ang cupcakes.\nREPLY_2: Hello! Yes, we still have cupcakes available. Would you like to order?';
    const replies = parseReplyResponse(raw, 'friendly');
    expect(replies).toHaveLength(2);
    expect(replies[0].text).toContain('Available pa ang cupcakes');
    expect(replies[0].tone).toBe('friendly');
    expect(replies[1].text).toContain('Would you like to order');
    expect(replies[1].tone).toBe('friendly');
  });

  it('parses multiline REPLY_1 and REPLY_2', () => {
    const raw = `REPLY_1: Hi po! Available pa.\nSalamat sa pag-inquire!\nREPLY_2: Hello! Yes available. Please let me know your order details.`;
    const replies = parseReplyResponse(raw, 'professional');
    expect(replies).toHaveLength(2);
    expect(replies[0].text).toContain('Salamat');
    expect(replies[1].tone).toBe('professional');
  });

  it('falls back to full response when no markers found', () => {
    const raw = 'Just a plain reply without markers.';
    const replies = parseReplyResponse(raw, 'casual');
    expect(replies).toHaveLength(1);
    expect(replies[0].text).toBe('Just a plain reply without markers.');
    expect(replies[0].tone).toBe('casual');
  });

  it('returns empty array for empty response', () => {
    const replies = parseReplyResponse('', 'friendly');
    expect(replies).toHaveLength(0);
  });

  it('returns empty array for whitespace-only response', () => {
    const replies = parseReplyResponse('   \n  ', 'friendly');
    expect(replies).toHaveLength(0);
  });

  it('handles REPLY_1 only (no REPLY_2)', () => {
    const raw = 'REPLY_1: Just one reply option here.';
    const replies = parseReplyResponse(raw, 'friendly');
    expect(replies.length).toBeGreaterThanOrEqual(1);
    expect(replies[0].text).toContain('Just one reply');
  });

  it('preserves the requested tone on all replies', () => {
    const raw = 'REPLY_1: First\nREPLY_2: Second';
    const replies = parseReplyResponse(raw, 'professional');
    for (const reply of replies) {
      expect(reply.tone).toBe('professional');
    }
  });
});
