/**
 * Reply Drafter — Intent Detection (Sprint 12)
 * Feature: Reply Drafter via Kai Chat
 * Role: Determines if a user's chat message is a reply-drafting request
 *       so the chat API can route to the reply_drafter feature prompt
 *       and apply reply-drafter guardrails.
 *
 * Uses keyword matching + structural heuristics (quoted customer text).
 * Exported for use by the chat API route and for unit testing.
 */

// ============================================================
// Reply-Draft Intent Keyword Patterns
// ============================================================

const REPLY_DRAFT_KEYWORDS: RegExp[] = [
  /\b(?:draft|gawa|i-draft|mag-draft)\b.*\breply\b/i,
  /\breply\b.*\b(?:draft|gawa|i-draft|mag-draft)\b/i,
  /\b(?:i-reply|mag-reply|sagutin|i-sagot|replyan)\b/i,
  /\b(?:pano|paano)\b.*\b(?:reply|sagot|respond)\b/i,
  /\b(?:help|tulungan)\b.*\b(?:reply|sagot|respond)\b/i,
  /\bcustomer\b.*\b(?:message|msg|chat|DM|dm)\b/i,
  /\b(?:message|msg|chat|DM|dm)\b.*\bcustomer\b/i,
  /\b(?:reply|sagot|respond)\b.*\b(?:customer|buyer|client)\b/i,
  /\b(?:customer|buyer|client)\b.*\b(?:reply|sagot|respond)\b/i,
];

// ============================================================
// Structural Heuristics
// ============================================================

/** Heuristic: message contains quoted text (likely a pasted customer message). */
const QUOTED_TEXT_PATTERN = /["\u201C\u201D]([^"\u201C\u201D]{10,}?)["\u201C\u201D]/;

// ============================================================
// Intent Detector
// ============================================================

/**
 * Detect if the user intends to draft a reply to a customer message.
 * Returns true when keywords or structural cues indicate reply-drafting intent.
 *
 * Detection strategies:
 * 1. Explicit keyword patterns (e.g., "i-draft ng reply", "help me reply to customer")
 * 2. Quoted text (10+ chars) combined with a reply-adjacent word
 */
export function detectReplyDraftIntent(message: string): boolean {
  // Strategy 1: Check explicit keyword patterns
  const hasKeyword = REPLY_DRAFT_KEYWORDS.some((pattern) => pattern.test(message));
  if (hasKeyword) return true;

  // Strategy 2: Quoted customer message + reply-adjacent word
  const hasQuotedText = QUOTED_TEXT_PATTERN.test(message);
  const hasReplyWord = /\b(?:reply|sagot|respond|i-reply|replyan)\b/i.test(message);
  if (hasQuotedText && hasReplyWord) return true;

  return false;
}

/** Reply-draft disclaimer appended to all reply-draft responses in chat. */
export const REPLY_DISCLAIMER =
  'Ito ay draft lang — i-review at i-edit mo bago i-send sa customer mo.';
