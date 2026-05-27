/**
 * Chat Suggestions — Orchestrator
 * Feature: Phase 8c — `/api/chat/suggestions` rule-based chips (ADR-016 §7)
 * Role: Runs R1..R4 in priority order, takes the first non-null hits, and
 *       back-fills from the cold-start set so the response is always exactly
 *       four chips. Pure (sequential) orchestration — caching + auth live in
 *       the route layer.
 *
 * Why dedup-by-intent instead of dedup-by-id: a personalized rule and a
 * cold-start chip can target the same MSME concern (e.g. R4 evergreen
 * pricing vs `cold_start_pricing`). Showing both would burn a chip slot
 * on duplicated intent — better to keep the personalized version and pull
 * a different cold-start chip into the empty slot.
 */

import type { ChatSuggestion } from './types';
import {
  runRecentReceipts,
  runUpcomingDeadline,
  runOverdueInvoice,
  runEvergreenPricing,
} from './rules';

type DbLike = { from: (table: string) => unknown };

// ============================================================
// Cold-start fallback — locked verbatim per ADR-016 §3.
// Voice-manual conformant; build-ux-approved chip strings.
// ============================================================

const COLD_START_FALLBACK: ChatSuggestion[] = [
  { id: 'cold_start_expenses',  text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
  { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?',  intent: 'deadlines' },
  { id: 'cold_start_pricing',   text_tl: 'Magkano dapat presyo?',     intent: 'pricing' },
  { id: 'cold_start_capture',   text_tl: 'I-record ang gastos',       intent: 'expense_capture' },
];

/**
 * Returns the cold-start chip set. Used by the route handler as the
 * unconditional fallback when DB orchestration fails.
 */
export function getColdStartFallback(): ChatSuggestion[] {
  return COLD_START_FALLBACK.map((c) => ({ ...c }));
}

// ============================================================
// Build the 4-chip suggestion list for a user.
// Priority: R1 (recent_receipts) → R2 (upcoming_deadline) → R3
// (overdue_invoice) → R4 (evergreen_pricing). Then back-fill from
// cold-start in declaration order, skipping any intent we've already
// surfaced so users don't see two pricing chips, etc.
// ============================================================

export async function buildSuggestions(
  db: DbLike,
  userId: string
): Promise<ChatSuggestion[]> {
  // Run rules sequentially. If a rule throws, treat as null — every rule
  // is wrapped to swallow its own errors, but defense in depth here keeps
  // a single misbehaving rule from sinking the whole chip row.
  const personalized: ChatSuggestion[] = [];

  for (const rule of [
    runRecentReceipts,
    runUpcomingDeadline,
    runOverdueInvoice,
    runEvergreenPricing,
  ]) {
    try {
      const chip = await rule(db, userId);
      if (chip) personalized.push(chip);
    } catch {
      // Skip this rule and continue with the next one.
    }
  }

  // Back-fill if we still don't have 4. Skip cold-start chips whose intent
  // already appears in the personalized set so we don't ship duplicate
  // pricing / expenses chips.
  const seenIntents = new Set(personalized.map((c) => c.intent));
  const seenIds = new Set(personalized.map((c) => c.id));

  for (const fallback of COLD_START_FALLBACK) {
    if (personalized.length >= 4) break;
    if (seenIntents.has(fallback.intent)) continue;
    if (seenIds.has(fallback.id)) continue;
    personalized.push({ ...fallback });
    seenIntents.add(fallback.intent);
    seenIds.add(fallback.id);
  }

  // Defensive: if every personalized rule and every cold-start chip shares
  // intents (impossible with the current rule set, but guards future
  // drift), pad from the raw cold-start list ignoring intent dedup so we
  // still hit 4. Empty result is unacceptable for the chip row.
  for (const fallback of COLD_START_FALLBACK) {
    if (personalized.length >= 4) break;
    if (seenIds.has(fallback.id)) continue;
    personalized.push({ ...fallback });
    seenIds.add(fallback.id);
  }

  return personalized.slice(0, 4);
}
