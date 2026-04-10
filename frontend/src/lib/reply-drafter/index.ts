/**
 * Reply Drafter — Barrel export (Build 7, updated Sprint 12)
 *
 * Sprint 12: Reply drafting is now integrated into Kai Chat.
 * The standalone page and API route have been removed.
 * This module provides guardrails, intent detection, and prompt helpers
 * that the chat API route reuses.
 */

export { assembleReplyPrompt, parseReplyResponse } from './prompt';
export { validateReplyInput, validateReplyOutput, SAFE_FALLBACK_MESSAGE } from './guardrails';
export { detectReplyDraftIntent, REPLY_DISCLAIMER } from './intent-detector';
export { ReplyDraftRequestSchema } from './schemas';
export type { ReplyDraftInput } from './schemas';
export type {
  ReplyTone,
  ReplyDraftRequest,
  ReplyDraftData,
  ReplyDraftResponse,
  ReplyOption,
  ValidationResult,
} from './types';
