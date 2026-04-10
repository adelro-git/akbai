import { describe, it, expect } from 'vitest';
import { detectReplyDraftIntent, REPLY_DISCLAIMER } from '../intent-detector';

// ============================================================
// Positive cases — should detect reply-draft intent
// ============================================================

describe('detectReplyDraftIntent — positive', () => {
  it('detects "i-draft ng reply"', () => {
    expect(detectReplyDraftIntent('Puwede mo ba i-draft ng reply dito?')).toBe(true);
  });

  it('detects "help me reply to customer"', () => {
    expect(detectReplyDraftIntent('Help me reply to this customer message')).toBe(true);
  });

  it('detects "mag-reply" intent', () => {
    expect(detectReplyDraftIntent('Paano mag-reply dito?')).toBe(true);
  });

  it('detects "sagutin" intent', () => {
    expect(detectReplyDraftIntent('Sagutin mo ito para sa akin')).toBe(true);
  });

  it('detects "i-sagot" intent', () => {
    expect(detectReplyDraftIntent('I-sagot mo ang customer ko')).toBe(true);
  });

  it('detects "replyan mo" intent', () => {
    expect(detectReplyDraftIntent('Replyan mo nga itong message')).toBe(true);
  });

  it('detects customer message + DM pattern', () => {
    expect(detectReplyDraftIntent('May customer message sa DM ko, paano ba?')).toBe(true);
  });

  it('detects "draft reply" in English', () => {
    expect(detectReplyDraftIntent('Can you draft a reply for this?')).toBe(true);
  });

  it('detects "paano reply sa customer"', () => {
    expect(detectReplyDraftIntent('Paano reply sa customer na ito?')).toBe(true);
  });

  it('detects "tulungan mo akong mag-reply"', () => {
    expect(detectReplyDraftIntent('Tulungan mo akong mag-reply sa client ko')).toBe(true);
  });

  it('detects "respond to customer"', () => {
    expect(detectReplyDraftIntent('How do I respond to this customer?')).toBe(true);
  });

  it('detects "reply sa buyer"', () => {
    expect(detectReplyDraftIntent('Gawa ng reply sa buyer ko')).toBe(true);
  });

  it('detects quoted text with reply word', () => {
    expect(
      detectReplyDraftIntent('"Magkano po ang 2 dozen cupcakes?" — pano ko i-reply?')
    ).toBe(true);
  });

  it('detects curly-quoted text with reply word', () => {
    expect(
      detectReplyDraftIntent('\u201CMagkano po ang cupcakes niyo?\u201D reply naman')
    ).toBe(true);
  });
});

// ============================================================
// Negative cases — should NOT detect reply-draft intent
// ============================================================

describe('detectReplyDraftIntent — negative', () => {
  it('does not flag general business question', () => {
    expect(detectReplyDraftIntent('Magkano ang sales ko ngayong linggo?')).toBe(false);
  });

  it('does not flag BIR question', () => {
    expect(detectReplyDraftIntent('Kailan ang deadline ng 1701Q?')).toBe(false);
  });

  it('does not flag expense tracking question', () => {
    expect(detectReplyDraftIntent('I-record ko ang gastos ko sa palengke')).toBe(false);
  });

  it('does not flag greeting', () => {
    expect(detectReplyDraftIntent('Kumusta, Kai!')).toBe(false);
  });

  it('does not flag receipt scan request', () => {
    expect(detectReplyDraftIntent('I-scan ko ang receipt ko')).toBe(false);
  });

  it('does not flag short quoted text without reply word', () => {
    // Quoted text under 10 chars should not trigger
    expect(detectReplyDraftIntent('"Hello" — ano ito?')).toBe(false);
  });

  it('does not flag generic mention of messaging without draft/reply intent', () => {
    // Talking about messages in general, not asking to draft a reply
    expect(detectReplyDraftIntent('Ilan na ang messages ko sa Messenger ngayon?')).toBe(false);
  });
});

// ============================================================
// Disclaimer constant
// ============================================================

describe('REPLY_DISCLAIMER', () => {
  it('exports a conversational Filipino disclaimer', () => {
    expect(REPLY_DISCLAIMER).toContain('draft');
    expect(REPLY_DISCLAIMER).toContain('i-review');
  });
});
