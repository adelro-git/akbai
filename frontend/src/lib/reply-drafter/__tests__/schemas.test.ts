import { describe, it, expect } from 'vitest';
import { ReplyDraftRequestSchema } from '../schemas';

describe('ReplyDraftRequestSchema', () => {
  // ============================================================
  // Valid inputs
  // ============================================================

  it('accepts valid customer message with defaults', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'Magkano po ang cupcakes?',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerMessage).toBe('Magkano po ang cupcakes?');
      expect(result.data.tone).toBe('friendly');
      expect(result.data.context).toBeUndefined();
    }
  });

  it('accepts all valid tone values', () => {
    const tones = ['friendly', 'professional', 'casual'] as const;
    for (const tone of tones) {
      const result = ReplyDraftRequestSchema.safeParse({
        customerMessage: 'test message',
        tone,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tone).toBe(tone);
      }
    }
  });

  it('accepts message with optional context', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'Available pa ba?',
      context: 'Regular customer, nag-order last week',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context).toBe('Regular customer, nag-order last week');
    }
  });

  it('accepts message at exactly 2000 chars', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'a'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('accepts message at exactly 1 char', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'a',
    });
    expect(result.success).toBe(true);
  });

  it('accepts context at exactly 500 chars', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'test',
      context: 'b'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('accepts Taglish message with peso sign', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'Magkano po ang ₱500 set? Available pa ba?',
    });
    expect(result.success).toBe(true);
  });

  // ============================================================
  // Invalid inputs
  // ============================================================

  it('rejects empty customer message', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 2000 chars', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects context over 500 chars', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'test',
      context: 'b'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tone value', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 'test',
      tone: 'angry',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing customerMessage field', () => {
    const result = ReplyDraftRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-string customerMessage', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: 123,
    });
    expect(result.success).toBe(false);
  });

  it('rejects null customerMessage', () => {
    const result = ReplyDraftRequestSchema.safeParse({
      customerMessage: null,
    });
    expect(result.success).toBe(false);
  });
});
