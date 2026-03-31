/**
 * Reply Drafter — Prompt assembly (Build 7)
 *
 * Builds the system prompt for Claude to generate customer reply drafts.
 * Separate from the main prompt assembler because reply drafting has
 * a distinct output format (2 options, copy-paste ready).
 */

import type { ReplyTone } from './types';

// ============================================================
// Tone Descriptions — mapped to natural Taglish instructions
// ============================================================

const TONE_INSTRUCTIONS: Record<ReplyTone, string> = {
  friendly:
    'Warm and approachable. Use casual Taglish, emoji sparingly (1-2 max). Like replying to a suki.',
  professional:
    'Polite and business-like. Clean Taglish or English. No emoji. Like replying to a new corporate client.',
  casual:
    'Super chill and conversational. Heavy Taglish, like chatting with a kaibigan. Emoji okay (2-3 max).',
};

// ============================================================
// System Prompt Builder
// ============================================================

/**
 * Assemble the system prompt for reply drafting.
 *
 * @param businessType - The user's business type (e.g., 'food_baking', 'online_selling')
 * @param tone - Desired reply tone
 * @returns Complete system prompt string
 */
export function assembleReplyPrompt(
  businessType: string | null,
  tone: ReplyTone
): string {
  const toneInstruction = TONE_INSTRUCTIONS[tone];
  const businessContext = businessType
    ? `The user runs a ${businessType.replace(/_/g, ' ')} business.`
    : 'The user runs a small business (type not specified).';

  return `You are Kai, the AI business partner of AKBai. You are helping a Filipino MSME owner draft a reply to a customer message.

${businessContext}

TASK:
1. Read the customer message carefully.
2. Generate exactly 2 reply options — one shorter (1-2 sentences), one more detailed (2-3 sentences).
3. Both replies should be ready to copy-paste directly into Messenger, Viber, or WhatsApp.

TONE: ${toneInstruction}

OUTPUT FORMAT — follow this EXACTLY:
REPLY_1: [shorter reply here]
REPLY_2: [longer/more detailed reply here]

RULES:
- Use natural Taglish (Filipino-English code-switching). Not translated English. Not pure Filipino.
- Match the customer's language register — if they wrote in pure English, reply in English. If Taglish, reply in Taglish.
- Keep REPLY_1 to 1-2 sentences max. Keep REPLY_2 to 2-3 sentences max.
- Customers don't read walls of text in DMs. Be concise.
- NEVER make commitments the user hasn't authorized: no refund promises, no discount offers, no specific delivery dates.
- NEVER pretend to be someone else. You are drafting for the business owner.
- If pricing is mentioned but no price context is provided, say something like "let me check" instead of inventing a price.
- Do NOT include any prefixes like "Option 1:" or "Here's a draft:" — just the reply text after REPLY_1: and REPLY_2:.
- Phase 1: Output is text for manual copy-paste. Do not attempt API integrations.`;
}

// ============================================================
// Response Parser — extracts reply options from Claude output
// ============================================================

/**
 * Parse Claude's response into structured reply options.
 * Expects the format: REPLY_1: ... REPLY_2: ...
 *
 * @param rawResponse - Raw text from Claude
 * @param tone - The requested tone (attached to each reply)
 * @returns Array of reply options (usually 2)
 */
export function parseReplyResponse(
  rawResponse: string,
  tone: ReplyTone
): { text: string; tone: string }[] {
  const replies: { text: string; tone: string }[] = [];

  // Extract REPLY_1 and REPLY_2 using markers
  const reply1Match = rawResponse.match(/REPLY_1:\s*([\s\S]*?)(?=REPLY_2:|$)/);
  const reply2Match = rawResponse.match(/REPLY_2:\s*([\s\S]*?)$/);

  if (reply1Match?.[1]?.trim()) {
    replies.push({ text: reply1Match[1].trim(), tone });
  }

  if (reply2Match?.[1]?.trim()) {
    replies.push({ text: reply2Match[1].trim(), tone });
  }

  // Fallback: if parsing failed, treat the whole response as one reply
  if (replies.length === 0 && rawResponse.trim()) {
    replies.push({ text: rawResponse.trim(), tone });
  }

  return replies;
}
