// AKBai Build 0 — 6-layer system prompt assembler
// Source: prompt-library.md §8

import type { DomainScope, KAFeature, PromptAssemblyInput } from './types';
import { CORE_PERSONA_PROMPT } from './prompts/core-persona';
import { SCOPE_PROMPTS } from './prompts/scopes';
import { FEATURE_PROMPTS } from './prompts/features';

/** Default domain scopes per feature when none are explicitly provided. */
const DEFAULT_SCOPES: Record<KAFeature, DomainScope[]> = {
  general_chat: ['tax', 'financial'],
  resibo_scanner: ['financial'],
  morning_briefing: ['tax', 'financial'],
  reply_drafter: ['communication'],
  classify_expense: ['financial'],
  classify_intent: [],
};

/** Simple template interpolation for a fixed set of variables. */
function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Assembles the system prompt from 4 layers:
 *   1. Core Persona (always)
 *   2. Domain Scopes (per feature or explicit)
 *   3. Feature Context (with template vars)
 *   4. User Context (if available)
 *
 * Layers 5–6 (conversation history + current message) go in the `messages`
 * array, not in the system prompt.
 */
export function assembleSystemPrompt(input: PromptAssemblyInput): string {
  const layers: string[] = [];

  // Layer 1 — Core Persona (always included)
  layers.push(CORE_PERSONA_PROMPT);

  // Layer 2 — Domain Scopes
  const scopes = input.scopes ?? DEFAULT_SCOPES[input.feature];
  for (const scope of scopes) {
    layers.push(SCOPE_PROMPTS[scope]);
  }

  // Layer 3 — Feature Context with template variable substitution
  const templateVars: Record<string, string> = {
    user_first_name: input.userContext?.firstName ?? 'ka-partner',
    business_type: input.userContext?.businessType ?? 'business',
    tier: input.userContext?.tier ?? 'free',
    bir_status: input.userContext?.birRegistered ? 'BIR-registered' : 'Not yet BIR-registered',
    briefing_data_json: input.dataContext ?? '{}',
  };
  layers.push(interpolate(FEATURE_PROMPTS[input.feature], templateVars));

  // Layer 4 — User Context (if available)
  if (input.userContext) {
    const ctx = input.userContext;
    layers.push(
      `[USER_CONTEXT]
Name: ${ctx.firstName ?? 'Unknown'}
Business type: ${ctx.businessType ?? 'Not specified'}
Tier: ${ctx.tier}
BIR registered: ${ctx.birRegistered ? 'Yes' : 'No'}`
    );
  }

  // Layer 4c — Deadline Context (Phase 9b, ADR-017)
  // Prepended only when arriving via the /deadlines deeplink so Kai opens
  // the conversation already aware of the form and remaining days.
  if (input.deadlineContext) {
    const { formCode, daysUntilDue } = input.deadlineContext;
    const urgency =
      daysUntilDue >= 0
        ? `huling ${daysUntilDue} araw`
        : `lipas na ng ${Math.abs(daysUntilDue)} araw`;
    layers.push(
      `[DEADLINE_CONTEXT]
The user has navigated here from the BIR deadline list. They want to discuss:
Form: ${formCode}
Days until due: ${daysUntilDue} (${urgency})
Speak first. Acknowledge the form by name, confirm how many days remain in conversational Filipino,
and offer concrete next steps ("I-prepare ko na ang numero mo?" / "Gusto mo bang i-walk-through ko ang form?").
Do not give tax advice — gabay lamang, hindi tax advice. Defer to CPA for official guidance.`
    );
  }

  // Layer 4b — Output Format Hint (optional, non-breaking)
  // Appended last so it overrides any format guidance baked into the feature
  // block. Used by morning_briefing (Phase 7) for the tagline JSON shape.
  if (input.outputFormatHint && input.outputFormatHint.trim().length > 0) {
    layers.push(input.outputFormatHint.trim());
  }

  return layers.join('\n\n---\n\n');
}
