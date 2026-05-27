// AKBai Build 0 — Shared types for the Claude prompt/guardrails module

/** User subscription tier. Build 0 defaults all users to 'free'. */
export type UserTier = 'free' | 'pro' | 'business';

/** Features that Kai can serve. Each maps to a prompt block + model routing rule. */
export type KAFeature =
  | 'general_chat'
  | 'resibo_scanner'
  | 'morning_briefing'
  | 'reply_drafter'
  | 'classify_expense'
  | 'classify_intent';

/** Domain scopes injected into the system prompt based on feature context. */
export type DomainScope = 'tax' | 'financial' | 'communication';

/** Literal Claude model IDs — Haiku for lightweight, Sonnet for reasoning. */
export type ClaudeModelId =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6';

/** Output format determines disclaimer style. */
export type OutputFormat = 'chat' | 'card';

/** Input to assembleSystemPrompt(). */
export interface PromptAssemblyInput {
  feature: KAFeature;
  scopes?: DomainScope[];
  userContext: UserContext | null;
  /** Optional JSON string with feature-specific data (e.g., morning briefing context) */
  dataContext?: string;
  /**
   * Optional per-call override of the model's expected output format. Appended
   * to the prompt as a separate layer so feature blocks stay reusable. Used by
   * morning_briefing (Phase 7) to request a strict JSON object containing both
   * `briefing` and `tagline` fields. Non-breaking: if omitted, behaviour is
   * unchanged.
   */
  outputFormatHint?: string;
  /**
   * Phase 9b — ADR-017 Layer 4c. Pre-seeds Kai with the BIR form the user
   * navigated from on the /deadlines page. When set, assembler injects a
   * deadline-context block so Kai opens the conversation already aware of
   * the form name and how many days remain.
   */
  deadlineContext?: { formCode: string; daysUntilDue: number };
}

/** User profile data injected into the prompt at runtime. */
export interface UserContext {
  firstName: string | null;
  businessType: string | null;
  tier: UserTier;
  birRegistered: boolean;
}

/** A message from conversation history. */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  domain: string;
}

/** Result from the circuit breaker pre-call check. */
export interface CircuitBreakerResult {
  allowed: boolean;
  reason?: 'global_cap' | 'user_cap';
  remainingUsd?: number;
  warningThresholdReached?: boolean;
}

/** Result from input sanitization. */
export interface GuardrailResult {
  sanitizedInput: string;
  inputTruncated: boolean;
  injectionDetected: boolean;
}
