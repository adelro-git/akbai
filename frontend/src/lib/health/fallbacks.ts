/**
 * Dependency Fallback Messages — Conversational Filipino error messages
 * Feature: Dependency Health Checks (Gap D4)
 * Role: Provide warm, specific fallback messages when dependencies are unreachable
 *
 * These messages follow the KA voice: conversational Filipino, warm, actionable.
 * Pattern matches existing KA_ERROR_MESSAGES in lib/claude/errors.ts.
 */

import type { DependencyErrorType } from './types';

// ============================================================
// Fallback Messages — One per dependency + general fallback
// Each message tells the user what happened and what to do next.
// ============================================================

export const DEPENDENCY_FALLBACK_MESSAGES: Record<DependencyErrorType, string> = {
  supabase_down:
    'Sandali lang po, nagkaproblema sa connection natin — subukan mo ulit maya-maya.',
  anthropic_down:
    'Pasensya na po, hindi muna available si Kai ngayon — subukan mo ulit sa ilang minuto.',
  xendit_down:
    'Sandali lang po, may problema sa payment system natin — subukan mo ulit maya-maya.',
  general_error:
    'May problema po tayo ngayon — sinusubukan naming ayusin ito.',
} as const;

// ============================================================
// getDependencyFallback — Select the right message for a given error type.
// Falls back to general_error if the type is unknown.
// ============================================================

export function getDependencyFallback(errorType: DependencyErrorType): string {
  return DEPENDENCY_FALLBACK_MESSAGES[errorType];
}

// ============================================================
// identifyDependencyError — Detect which dependency failed from
// an error message or error object. Used in catch blocks to map
// generic errors to specific fallback messages.
// ============================================================

export function identifyDependencyError(error: unknown): DependencyErrorType {
  if (!(error instanceof Error)) {
    return 'general_error';
  }

  const msg = error.message.toLowerCase();

  // --- Supabase indicators ---
  if (
    msg.includes('supabase') ||
    msg.includes('postgrest') ||
    msg.includes('pgrst') ||
    msg.includes('database') ||
    msg.includes('connection refused')
  ) {
    return 'supabase_down';
  }

  // --- Anthropic indicators ---
  if (
    msg.includes('anthropic') ||
    msg.includes('claude') ||
    msg.includes('overloaded') ||
    msg.includes('api_error') ||
    msg.includes('rate_limit')
  ) {
    return 'anthropic_down';
  }

  // --- Xendit indicators ---
  if (msg.includes('xendit') || msg.includes('payment')) {
    return 'xendit_down';
  }

  return 'general_error';
}
