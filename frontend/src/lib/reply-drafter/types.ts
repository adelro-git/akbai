/**
 * Reply Drafter — Type definitions (Build 7)
 *
 * Types for the reply drafting feature. Users paste a customer message
 * and Kai generates 2 Taglish reply options for copy-paste into
 * Messenger/Viber/WhatsApp. Phase 1: manual copy-paste only.
 */

// ============================================================
// Tone Options
// ============================================================

/** Supported reply tones. Default is 'friendly'. */
export type ReplyTone = 'friendly' | 'professional' | 'casual';

// ============================================================
// Request Types
// ============================================================

/** Client request payload for the reply-draft API. */
export interface ReplyDraftRequest {
  customerMessage: string;
  context?: string;
  tone?: ReplyTone;
}

// ============================================================
// Response Types
// ============================================================

/** A single generated reply option. */
export interface ReplyOption {
  text: string;
  tone: string;
}

/** Successful API response data. */
export interface ReplyDraftData {
  replies: ReplyOption[];
  disclaimer: string;
}

/** Standard AKBai error envelope. */
export interface ReplyDraftError {
  code: string;
  message: string;
  message_tl: string;
}

/** Full API response shape. */
export interface ReplyDraftResponse {
  success: boolean;
  data?: ReplyDraftData;
  error?: ReplyDraftError;
}

// ============================================================
// Guardrail Types
// ============================================================

/** Result of input or output validation. */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}
