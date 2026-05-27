/**
 * Chat Suggestions — Shared types
 * Feature: Phase 8c — `/api/chat/suggestions` rule-based chips (ADR-016)
 * Role: Single source of truth for the chip shape consumed by the route,
 *       the cache, the rule generators, and the chat client.
 *
 * Why these specific intents:
 *   - `expenses` / `deadlines` / `invoices` / `pricing` map 1:1 to the four
 *     core MSME pain-pillars in the product brief.
 *   - `expense_capture` is a narrower sibling of `expenses` reserved for the
 *     "I-record ang gastos" capture-funnel chip; ai-engineer uses it later
 *     to bias Kai toward the scanner CTA instead of a category breakdown.
 */

// ============================================================
// ChatSuggestion — one chip pill
// ============================================================

export type ChatSuggestionIntent =
  | 'expenses'
  | 'deadlines'
  | 'invoices'
  | 'pricing'
  | 'expense_capture';

export interface ChatSuggestion {
  /** Stable rule key — `recent_receipts`, `cold_start_pricing`, etc. */
  id: string;
  /** Display string in conversational Filipino. */
  text_tl: string;
  /** Routing hint for downstream handlers. */
  intent: ChatSuggestionIntent;
}

// ============================================================
// API envelope — mirrors the project-wide `{success, data|error}` shape
// ============================================================

export type ChatSuggestionsResponse =
  | {
      success: true;
      data: {
        suggestions: ChatSuggestion[];
        /** True if served from the in-process Map. False on a cache miss
         *  (rules ran) or when the cold-start fallback is used after a
         *  DB error. */
        cached: boolean;
      };
    }
  | {
      success: false;
      error: { code: string; message: string; message_tl: string };
    };
