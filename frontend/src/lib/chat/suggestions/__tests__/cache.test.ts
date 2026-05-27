/**
 * Unit tests — In-process suggestions cache (ADR-016 §4)
 *
 * Cache contract:
 *   - In-process Map<userId, { suggestions, expiresAt }>
 *   - TTL = 30 minutes
 *   - 10_000-entry hard cap (DDoS valve, mirrors proxy.ts rate-limit pattern)
 *   - Cache invalidation: TTL only (no webhook-based busting)
 *
 * Why these tests: cache bugs degrade UX silently (chip row stale) AND can
 * cause memory leaks at scale (Vercel cold-start memory budget). The cap
 * eviction is the safety net — if it doesn't work, a misbehaving caller can
 * push the function instance into OOM.
 *
 * Engineer is expected to expose:
 *   getSuggestions(userId): ChatSuggestion[] | null
 *   setSuggestions(userId, suggestions): void
 *   clearCache(): void  (test helper)
 *   _cacheSize(): number  (test helper) — optional, can be replaced by
 *     stress-pushing 10_001 entries and asserting at least one earlier key
 *     has been evicted.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { ChatSuggestion } from '../types';
import * as cacheMod from '../cache';

// Modules now exist (engineer shipped Phase 8c). Vitest's `require()` shim
// does not resolve TS files, so the original try/catch describeIfPresent
// always took the skip branch — replaced with a plain static import.
const describeIfPresent = describe;

const sampleSuggestions: ChatSuggestion[] = [
  { id: 'recent_receipts', text_tl: 'I-summarize ang gastos ngayong linggo', intent: 'expenses' },
  { id: 'upcoming_deadline', text_tl: 'Ano ang 2551Q?', intent: 'deadlines' },
  { id: 'overdue_invoice', text_tl: 'Sinong may utang pa?', intent: 'invoices' },
  { id: 'evergreen_pricing', text_tl: 'Magkano dapat presyo ng produkto ko?', intent: 'pricing' },
];

describeIfPresent('lib/chat/suggestions/cache', () => {
  const USER_A = '00000000-0000-0000-0000-00000000000a';
  const USER_B = '00000000-0000-0000-0000-00000000000b';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-28T08:00:00.000Z'));
    cacheMod?.clearCache?.();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null on cache miss', () => {
    expect(cacheMod!.getSuggestions(USER_A)).toBeNull();
  });

  it('returns stored suggestions on cache hit within TTL', () => {
    cacheMod!.setSuggestions(USER_A, sampleSuggestions);
    expect(cacheMod!.getSuggestions(USER_A)).toEqual(sampleSuggestions);
  });

  it('returns null after TTL (30 minutes) expires', () => {
    cacheMod!.setSuggestions(USER_A, sampleSuggestions);
    // Advance 29:59 — still cached
    vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000);
    expect(cacheMod!.getSuggestions(USER_A)).toEqual(sampleSuggestions);
    // Advance another 2 seconds — past TTL
    vi.advanceTimersByTime(2 * 1000);
    expect(cacheMod!.getSuggestions(USER_A)).toBeNull();
  });

  it('isolates cache entries per user (RLS-equivalent at cache layer)', () => {
    cacheMod!.setSuggestions(USER_A, sampleSuggestions);
    expect(cacheMod!.getSuggestions(USER_B)).toBeNull();
  });

  it('overwrites stale entries on re-set within TTL', () => {
    cacheMod!.setSuggestions(USER_A, sampleSuggestions);
    const fresh: ChatSuggestion[] = [
      { id: 'evergreen_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
      { id: 'cold_start_a', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
      { id: 'cold_start_b', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
      { id: 'cold_start_d', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
    ];
    cacheMod!.setSuggestions(USER_A, fresh);
    expect(cacheMod!.getSuggestions(USER_A)).toEqual(fresh);
  });

  it('enforces 10_000-entry hard cap (DDoS valve)', () => {
    // Push 10_001 distinct user IDs. Implementation strategy is engineer's
    // choice (FIFO, LRU, or naive clear-on-cap); the only invariant that
    // matters is that map size never exceeds the cap.
    for (let i = 0; i < 10_001; i++) {
      cacheMod!.setSuggestions(`user-${i.toString().padStart(6, '0')}`, sampleSuggestions);
    }
    const sizeFn = (cacheMod as unknown as { _cacheSize?: () => number })._cacheSize;
    if (typeof sizeFn === 'function') {
      expect(sizeFn()).toBeLessThanOrEqual(10_000);
    } else {
      // If engineer doesn't export _cacheSize, assert the earliest key was evicted.
      expect(cacheMod!.getSuggestions('user-000000')).toBeNull();
    }
  });
});
