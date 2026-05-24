/**
 * Chat Suggestions — In-process cache
 * Feature: Phase 8c — `/api/chat/suggestions` rule-based chips (ADR-016 §4)
 * Role: Per-user 30-minute memoization of the chip set so chat-page renders
 *       within the TTL skip the SQL pass entirely (~$0 at any scale).
 *
 * Pattern: identical to `lib/rate-limit.ts` — single-instance Vercel `Map`,
 * 10_000-entry hard cap as a DDoS valve. Cold-start friendly: the first
 * request after a cold boot pays the rule-evaluation cost; everyone in the
 * next 30 min hits the cache. No Redis / KV / DB table per ADR-016 §4
 * (rejected as over-engineering for ~5 indexed selects).
 *
 * Eviction strategy: on `setSuggestions`, if a new key would push us over
 * the cap, delete the oldest entry (insertion order via `Map`). Re-setting
 * an existing key always refreshes its insertion order so an active user
 * is never the eviction candidate ahead of a stale one.
 *
 * TTL invalidation: lazy — `getSuggestions` reads `expiresAt` and returns
 * null for expired entries. No background sweep (would race with Vercel's
 * function lifecycle anyway).
 */

import type { ChatSuggestion } from './types';

// ============================================================
// Constants — TTL and cap
// ============================================================

/** 30 minutes in ms — locked by ADR-016 §4. */
const TTL_MS = 30 * 60 * 1000;

/** Mirrors `lib/rate-limit.ts`'s MAX_ENTRIES. DDoS valve, not a UX limit. */
const MAX_ENTRIES = 10_000;

// ============================================================
// Backing store — keyed by user.id
// ============================================================

interface CacheEntry {
  suggestions: ChatSuggestion[];
  /** Absolute ms timestamp; compared against `Date.now()`. */
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

// ============================================================
// Public API — getSuggestions / setSuggestions
// ============================================================

/**
 * Read a cached suggestion list. Returns null on miss OR after the TTL has
 * elapsed (lazy invalidation — expired entry is removed on read).
 */
export function getSuggestions(userId: string): ChatSuggestion[] | null {
  const entry = store.get(userId);
  if (!entry) return null;

  if (Date.now() >= entry.expiresAt) {
    store.delete(userId);
    return null;
  }

  return entry.suggestions;
}

/**
 * Store a fresh suggestion list. Refreshes insertion order on re-set so
 * recently-active users are not the eviction candidate. Triggers FIFO
 * eviction if we are at the hard cap.
 */
export function setSuggestions(userId: string, suggestions: ChatSuggestion[]): void {
  // Refresh insertion order — delete-then-set keeps `Map` ordering accurate
  // for FIFO eviction below.
  if (store.has(userId)) {
    store.delete(userId);
  } else if (store.size >= MAX_ENTRIES) {
    // Evict the oldest entry (Map iterator yields insertion order).
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }

  store.set(userId, {
    suggestions,
    expiresAt: Date.now() + TTL_MS,
  });
}

// ============================================================
// Test helpers — exported for vitest only (not imported by route)
// ============================================================

/** Reset the entire cache. Used by `cache.test.ts` `beforeEach`. */
export function clearCache(): void {
  store.clear();
}

/** Current entry count. Optional helper for cap-eviction assertions. */
export function _cacheSize(): number {
  return store.size;
}
