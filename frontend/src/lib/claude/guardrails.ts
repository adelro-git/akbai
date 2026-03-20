// AKBai Build 0 — Guardrails: BIR disclaimer, input sanitizer, output filter
// Source: ai-guardrails.md §2, §6b, §6c

import type { GuardrailResult, OutputFormat } from './types';

// --- BIR Disclaimer (§2) ---

const BIR_TRIGGERS: RegExp[] = [
  /\bBIR\b/i, /\b1701[AQ]?\b/, /\b2551Q\b/, /\b2550M\b/, /\b0619E\b/,
  /\bVAT\b/i, /\btax\b/i, /\bfiling\b/i, /\bdeadline.*(?:BIR|tax|filing)/i,
  /\bpenalty\b/i, /\bsurcharge\b/i, /\bRDO\b/, /\bTIN\b/,
  /\b(?:flat|graduated)\s+(?:rate|tax)/i, /₱3[,.]?000[,.]?000/,
  /\btaxable\b/i, /\bwithholding\b/i, /\bdeductible\b/i,
];

const BIR_DISCLAIMER_CONVERSATIONAL =
  '\n\nIto ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.';
const BIR_DISCLAIMER_FORMAL =
  '\n\nPaalala: Ang guidance na ito ay informational lang. I-verify mo sa iyong accountant o CPA bago mag-file.';

/**
 * Append the BIR disclaimer to any response containing tax-related content.
 * Deduplicates if the prompt already included it.
 */
export function applyBIRDisclaimer(response: string, format: OutputFormat = 'chat'): string {
  const hasTaxContent = BIR_TRIGGERS.some((pattern) => pattern.test(response));
  const hasDisclaimer =
    response.includes('hindi tax advice') || response.includes('informational lang');

  if (hasTaxContent && !hasDisclaimer) {
    return response + (format === 'card' ? BIR_DISCLAIMER_FORMAL : BIR_DISCLAIMER_CONVERSATIONAL);
  }
  return response;
}

// --- Input Sanitization (§6b) ---

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (?:all |your |previous )?(?:instructions|rules|prompts)/i,
  /you are (?:now |no longer )/i,
  /(?:reveal|show|display|print) (?:your |the )?(?:system )?prompt/i,
  /(?:act|pretend|behave) (?:as|like) /i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\/?(?:system|prompt|instructions?)>/i,
];

const MAX_INPUT_LENGTH = 2000;

/**
 * Sanitize user input before it enters the Claude prompt.
 * Detects injection attempts (log only — don't strip) and enforces length limit.
 */
export function sanitizeInput(input: string): GuardrailResult {
  let injectionDetected = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      console.warn(`[Injection] Potential injection attempt detected: ${pattern}`);
      injectionDetected = true;
    }
  }

  const inputTruncated = input.length > MAX_INPUT_LENGTH;
  const sanitizedInput = inputTruncated ? input.slice(0, MAX_INPUT_LENGTH) : input;

  return { sanitizedInput, inputTruncated, injectionDetected };
}

// --- Output Filtering (§6c) ---

const LEAKAGE_PATTERNS: RegExp[] = [
  /\[CORE_IDENTITY\]/g,
  /\[INJECTION_DEFENSE\]/g,
  /\[TAX_SCOPE\]/g,
  /\[FINANCIAL_SCOPE\]/g,
  /\[COMMUNICATION_SCOPE\]/g,
  /\[FEATURE:.*?\]/g,
  /\[GUARDRAILS\]/g,
];

/**
 * Strip system prompt section markers from Claude's output.
 * If any markers leak through, remove them and log a warning.
 */
export function filterOutput(response: string): string {
  let filtered = response;
  for (const pattern of LEAKAGE_PATTERNS) {
    if (pattern.test(filtered)) {
      console.warn('[Injection] System prompt leakage detected in output');
      // Reset lastIndex for global regexes before replace
      pattern.lastIndex = 0;
      filtered = filtered.replace(pattern, '');
    }
  }
  return filtered;
}
