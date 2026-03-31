/**
 * Reply Drafter — Guardrails (Build 7, Task 9)
 *
 * Input validation: checks message length, emptiness, prompt injection.
 * Output validation: catches unauthorized commitments, impersonation,
 * financial/legal advice in generated replies.
 */

import type { ValidationResult } from './types';

// ============================================================
// Constants
// ============================================================

const MAX_MESSAGE_LENGTH = 2000;

/** Safe fallback when output validation fails. */
export const SAFE_FALLBACK_MESSAGE =
  "Hindi ko ma-draft 'to kasi may sensitive content. I-review mo muna ang message, Boss.";

// ============================================================
// Prompt Injection Patterns
// ============================================================

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (?:all |your |previous )?(?:instructions|rules|prompts)/i,
  /you are (?:now |no longer )/i,
  /(?:reveal|show|display|print) (?:your |the )?(?:system )?prompt/i,
  /(?:act|pretend|behave) (?:as|like) /i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\/?(?:system|prompt|instructions?)>/i,
  /forget (?:everything|all|your)/i,
  /override (?:your |all )?(?:rules|instructions)/i,
];

// ============================================================
// Output Violation Patterns
// ============================================================

/** Unauthorized commitment patterns — replies must not promise these. */
const COMMITMENT_PATTERNS: RegExp[] = [
  /(?:full |100%?\s*)?refund/i,
  /(?:free |complimentary )\w+/i,
  /(?:guarantee|guaranteed|we guarantee)/i,
  /(?:\d+%?\s*(?:off|discount))/i,
  /(?:money.?back)/i,
  /(?:deliver(?:y|ed)?.*(?:within|by|before)\s+\d)/i,
];

/** Impersonation patterns — reply must not pretend to be a specific person. */
const IMPERSONATION_PATTERNS: RegExp[] = [
  /(?:^|\s)I am (?!the owner|the seller|from )\w+\s+\w+/i,
  /(?:^|\s)my name is \w+/i,
  /(?:^|\s)this is \w+\s+\w+ (?:speaking|here|from)/i,
];

/** Financial/legal advice patterns. */
const ADVICE_PATTERNS: RegExp[] = [
  /(?:legal(?:ly)?|law|attorney|lawyer)\s+(?:advice|recommend|suggest)/i,
  /(?:tax|BIR)\s+(?:advice|recommend|should\s+file)/i,
  /(?:you\s+should\s+(?:sue|file\s+a\s+(?:case|complaint)))/i,
  /(?:investment|invest\s+in)/i,
];

// ============================================================
// Input Validation
// ============================================================

/**
 * Validate a customer message before sending to Claude.
 *
 * Checks:
 * 1. Not empty
 * 2. Not too long (max 2000 chars)
 * 3. No obvious prompt injection attempts
 */
export function validateReplyInput(message: string): ValidationResult {
  // Check 1: Not empty
  if (!message || message.trim().length === 0) {
    return { valid: false, reason: 'Message is empty' };
  }

  // Check 2: Length limit
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      reason: `Message too long — ${message.length} chars, max ${MAX_MESSAGE_LENGTH}`,
    };
  }

  // Check 3: Prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return {
        valid: false,
        reason: 'Message contains potentially harmful instructions',
      };
    }
  }

  return { valid: true };
}

// ============================================================
// Output Validation
// ============================================================

/**
 * Validate a generated reply before showing to the user.
 *
 * Checks:
 * 1. No unauthorized commitments (refunds, discounts, delivery guarantees)
 * 2. No impersonation (claiming to be someone specific)
 * 3. No financial/legal advice
 */
export function validateReplyOutput(reply: string): ValidationResult {
  // Check 1: Unauthorized commitments
  for (const pattern of COMMITMENT_PATTERNS) {
    if (pattern.test(reply)) {
      return {
        valid: false,
        reason: `Reply contains unauthorized commitment: ${pattern.source}`,
      };
    }
  }

  // Check 2: Impersonation
  for (const pattern of IMPERSONATION_PATTERNS) {
    if (pattern.test(reply)) {
      return {
        valid: false,
        reason: 'Reply contains impersonation — claiming to be a specific person',
      };
    }
  }

  // Check 3: Financial/legal advice
  for (const pattern of ADVICE_PATTERNS) {
    if (pattern.test(reply)) {
      return {
        valid: false,
        reason: 'Reply contains financial or legal advice',
      };
    }
  }

  return { valid: true };
}
