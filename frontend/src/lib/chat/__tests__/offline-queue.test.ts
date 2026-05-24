/**
 * Unit tests — Offline composer queue (Phase 8c)
 *
 * Contract:
 *   - localStorage key: `akbai_chat_offline_queue_v1`
 *   - FIFO order on enqueue / dequeueAll / peek
 *   - 50-message cap; overflow drops the oldest (FIFO eviction)
 *   - SSR-safe: every public fn must tolerate `typeof window === 'undefined'`
 *   - Corrupted localStorage payload → clears key + returns empty + warns
 *
 * Why these tests: this lib is the persistence layer for "user typed a
 * thought, lost signal". A bug here means data loss for Maria — the
 * highest-impact failure on the whole offline-resilience path. The cap
 * eviction is the safety valve so a malformed loop can never blow past
 * localStorage quota.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as queue from '../offline-queue';

// ============================================================
// Minimal in-memory localStorage shim for vitest's node env.
// (vitest.config.ts uses environment: 'node', no jsdom).
// ============================================================

function installLocalStorage(): Storage {
  const store = new Map<string, string>();
  const ls: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
  };
  return ls;
}

describe('lib/chat/offline-queue', () => {
  let originalWindow: typeof globalThis.window | undefined;

  beforeEach(() => {
    originalWindow = (globalThis as { window?: typeof globalThis.window }).window;
    // Install a minimal `window` with localStorage for browser-mode tests.
    (globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: installLocalStorage(),
    };
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------------
  // enqueue
  // ----------------------------------------------------------
  describe('enqueue', () => {
    it('stores the message to localStorage with id + text + queued_at', () => {
      const msg = queue.enqueue('hello kai');
      expect(msg.text).toBe('hello kai');
      expect(typeof msg.id).toBe('string');
      expect(msg.id.length).toBeGreaterThan(0);
      expect(typeof msg.queued_at).toBe('string');
      // ISO 8601 sanity
      expect(new Date(msg.queued_at).toISOString()).toBe(msg.queued_at);

      const raw = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage.getItem(queue._STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(msg);
    });

    it('returns the message even when localStorage write would be a no-op (still constructs)', () => {
      const msg = queue.enqueue('whatever');
      expect(msg).toMatchObject({ text: 'whatever' });
    });
  });

  // ----------------------------------------------------------
  // peek + size
  // ----------------------------------------------------------
  describe('peek + size', () => {
    it('peek returns FIFO order without mutating', () => {
      queue.enqueue('first');
      queue.enqueue('second');
      queue.enqueue('third');

      const snap = queue.peek();
      expect(snap.map((m) => m.text)).toEqual(['first', 'second', 'third']);

      // Mutating snap should not mutate the underlying queue.
      snap.pop();
      expect(queue.size()).toBe(3);
      expect(queue.peek().map((m) => m.text)).toEqual(['first', 'second', 'third']);
    });

    it('size returns the current queue length', () => {
      expect(queue.size()).toBe(0);
      queue.enqueue('a');
      expect(queue.size()).toBe(1);
      queue.enqueue('b');
      expect(queue.size()).toBe(2);
    });
  });

  // ----------------------------------------------------------
  // dequeueAll + clear
  // ----------------------------------------------------------
  describe('dequeueAll + clear', () => {
    it('dequeueAll returns FIFO then empties the queue', () => {
      queue.enqueue('one');
      queue.enqueue('two');
      const drained = queue.dequeueAll();
      expect(drained.map((m) => m.text)).toEqual(['one', 'two']);
      expect(queue.size()).toBe(0);
      expect(queue.peek()).toEqual([]);
    });

    it('dequeueAll on empty queue returns []', () => {
      expect(queue.dequeueAll()).toEqual([]);
    });

    it('clear() empties the queue', () => {
      queue.enqueue('x');
      queue.enqueue('y');
      queue.clear();
      expect(queue.size()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // Overflow / FIFO eviction
  // ----------------------------------------------------------
  describe('overflow', () => {
    it('drops the oldest entry when enqueuing past the 50-message cap', () => {
      for (let i = 0; i < queue._MAX_QUEUE_SIZE; i++) {
        queue.enqueue(`msg-${i}`);
      }
      expect(queue.size()).toBe(queue._MAX_QUEUE_SIZE);
      expect(queue.peek()[0]?.text).toBe('msg-0');

      // The 51st enqueue must drop msg-0.
      queue.enqueue('overflow-msg');

      expect(queue.size()).toBe(queue._MAX_QUEUE_SIZE);
      const after = queue.peek();
      expect(after[0]?.text).toBe('msg-1');
      expect(after[after.length - 1]?.text).toBe('overflow-msg');
    });
  });

  // ----------------------------------------------------------
  // SSR safety — `window === undefined`
  // ----------------------------------------------------------
  describe('SSR safety', () => {
    beforeEach(() => {
      delete (globalThis as { window?: unknown }).window;
    });

    it('enqueue still constructs + returns a message on SSR (no throw)', () => {
      const msg = queue.enqueue('ssr-msg');
      expect(msg.text).toBe('ssr-msg');
      expect(typeof msg.id).toBe('string');
    });

    it('dequeueAll returns [] on SSR', () => {
      expect(queue.dequeueAll()).toEqual([]);
    });

    it('peek returns [] on SSR', () => {
      expect(queue.peek()).toEqual([]);
    });

    it('size returns 0 on SSR', () => {
      expect(queue.size()).toBe(0);
    });

    it('clear is a no-op on SSR (no throw)', () => {
      expect(() => queue.clear()).not.toThrow();
    });
  });

  // ----------------------------------------------------------
  // Corrupted localStorage payload
  // ----------------------------------------------------------
  describe('corrupted payload', () => {
    it('treats unparseable JSON as empty + clears the corrupted key + warns', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ls = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage;
      ls.setItem(queue._STORAGE_KEY, '{not valid json');

      const snap = queue.peek();
      expect(snap).toEqual([]);
      expect(ls.getItem(queue._STORAGE_KEY)).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('drops non-array payloads (shape drift) without warning', () => {
      const ls = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage;
      ls.setItem(queue._STORAGE_KEY, JSON.stringify({ not: 'an array' }));

      expect(queue.peek()).toEqual([]);
      expect(ls.getItem(queue._STORAGE_KEY)).toBeNull();
    });

    it('filters out individual entries missing required fields', () => {
      const ls = (globalThis as unknown as { window: { localStorage: Storage } })
        .window.localStorage;
      ls.setItem(
        queue._STORAGE_KEY,
        JSON.stringify([
          { id: 'a', text: 'good', queued_at: new Date().toISOString() },
          { id: 'b', text: 42 }, // bad shape
          null,
          { id: 'c', text: 'also good', queued_at: new Date().toISOString() },
        ])
      );

      const snap = queue.peek();
      expect(snap.map((m) => m.id)).toEqual(['a', 'c']);
    });
  });
});
