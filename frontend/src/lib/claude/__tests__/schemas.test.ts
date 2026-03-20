import { describe, it, expect } from 'vitest';
import { ChatRequestSchema } from '../schemas';

describe('ChatRequestSchema', () => {
  it('accepts valid message with default feature', () => {
    const result = ChatRequestSchema.safeParse({ message: 'Magkano ang sales ko?' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.feature).toBe('general_chat');
      expect(result.data.message).toBe('Magkano ang sales ko?');
    }
  });

  it('accepts valid message with explicit feature', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Scan this receipt',
      feature: 'resibo_scanner',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.feature).toBe('resibo_scanner');
    }
  });

  it('accepts all valid feature values', () => {
    const features = [
      'general_chat', 'resibo_scanner', 'morning_briefing',
      'reply_drafter', 'classify_expense', 'classify_intent',
    ];
    for (const feature of features) {
      const result = ChatRequestSchema.safeParse({ message: 'test', feature });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty message', () => {
    const result = ChatRequestSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects message over 2000 chars', () => {
    const result = ChatRequestSchema.safeParse({ message: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts message at exactly 2000 chars', () => {
    const result = ChatRequestSchema.safeParse({ message: 'a'.repeat(2000) });
    expect(result.success).toBe(true);
  });

  it('accepts message at exactly 1 char', () => {
    const result = ChatRequestSchema.safeParse({ message: 'a' });
    expect(result.success).toBe(true);
  });

  it('rejects missing message field', () => {
    const result = ChatRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid feature value', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'test',
      feature: 'invalid_feature',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-string message', () => {
    const result = ChatRequestSchema.safeParse({ message: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts Taglish message with special characters', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Magkano ang gastos ko sa ₱? Paki-check ang 1701Q ko.',
    });
    expect(result.success).toBe(true);
  });

  it('handles null message', () => {
    const result = ChatRequestSchema.safeParse({ message: null });
    expect(result.success).toBe(false);
  });
});
