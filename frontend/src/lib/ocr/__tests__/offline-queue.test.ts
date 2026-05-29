/**
 * Unit tests — Resibo Scanner offline queue (Sprint 18 §11)
 *
 * Contract:
 *   - localStorage key: `akbai_ocr_offline_queue_v1`
 *   - FIFO order on enqueue / list
 *   - 20-scan cap; overflow drops the oldest (FIFO eviction)
 *   - Dedup: re-enqueuing an identical content_key is a no-op
 *   - flushScanQueue replays in FIFO order, removes successes, keeps failures
 *   - SSR-safe: every public fn must tolerate `typeof window === 'undefined'`
 *   - Corrupted localStorage payload → clears key + returns empty + warns
 *
 * Why these tests: this lib is the persistence layer for "Maria snapped a
 * resibo at the palengke with no signal". A bug here means a lost receipt —
 * the highest-impact failure on the offline-capture path. The dedup guard and
 * the cap are the safety valves: dedup stops a double-tap double-queue, the cap
 * stops a malformed loop from blowing past the localStorage image quota.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as queue from '../offline-queue';
import type { QueuedScan } from '../offline-queue';

// ============================================================
// Minimal in-memory localStorage shim for vitest's node env.
// (vitest.config.ts uses environment: 'node', no jsdom).
// Mirrors lib/chat/offline-queue.test.ts.
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

// --- Helper: build a distinct enqueue input so each scan has a unique
//     content_key (the default key is derived from the data URL). ---
function input(seed: string): queue.EnqueueScanInput {
  return {
    imageDataUrl: `data:image/jpeg;base64,${seed}AAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
    meta: { filename: `resibo-${seed}.jpg`, mime_type: 'image/jpeg' },
  };
}

function ls(): Storage {
  return (globalThis as unknown as { window: { localStorage: Storage } }).window
    .localStorage;
}

describe('lib/ocr/offline-queue', () => {
  let originalWindow: typeof globalThis.window | undefined;

  beforeEach(() => {
    originalWindow = (globalThis as { window?: typeof globalThis.window }).window;
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
  // enqueueScan
  // ----------------------------------------------------------
  describe('enqueueScan', () => {
    it('stores the scan with id + image_data_url + meta + content_key + queued_at', () => {
      const scan = queue.enqueueScan(input('a'));
      expect(typeof scan.id).toBe('string');
      expect(scan.id.length).toBeGreaterThan(0);
      expect(scan.image_data_url).toContain('data:image/jpeg;base64,');
      expect(scan.meta).toEqual({ filename: 'resibo-a.jpg', mime_type: 'image/jpeg' });
      expect(typeof scan.content_key).toBe('string');
      expect(scan.content_key.length).toBeGreaterThan(0);
      // ISO 8601 sanity
      expect(new Date(scan.queued_at).toISOString()).toBe(scan.queued_at);

      const raw = ls().getItem(queue._STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(scan);
    });

    it('uses a caller-supplied contentKey when provided', () => {
      const scan = queue.enqueueScan({ ...input('a'), contentKey: 'sha-123' });
      expect(scan.content_key).toBe('sha-123');
    });

    it('returns the constructed scan even on SSR (no localStorage write)', () => {
      delete (globalThis as { window?: unknown }).window;
      const scan = queue.enqueueScan(input('ssr'));
      expect(scan.meta.filename).toBe('resibo-ssr.jpg');
      expect(typeof scan.id).toBe('string');
    });
  });

  // ----------------------------------------------------------
  // Dedup
  // ----------------------------------------------------------
  describe('dedup', () => {
    it('does not double-queue a scan with an identical content_key', () => {
      const first = queue.enqueueScan({ ...input('a'), contentKey: 'dup-key' });
      const second = queue.enqueueScan({ ...input('b'), contentKey: 'dup-key' });

      expect(queue.scanQueueSize()).toBe(1);
      // Returns the original entry, not a fresh one.
      expect(second.id).toBe(first.id);
      expect(second.meta.filename).toBe('resibo-a.jpg');
    });

    it('dedups on the derived key when no contentKey is supplied (identical image)', () => {
      const same = input('same');
      queue.enqueueScan(same);
      queue.enqueueScan(same); // identical data URL → identical derived key
      expect(queue.scanQueueSize()).toBe(1);
    });

    it('queues distinct captures separately', () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b'));
      expect(queue.scanQueueSize()).toBe(2);
    });
  });

  // ----------------------------------------------------------
  // listScans + scanQueueSize
  // ----------------------------------------------------------
  describe('listScans + scanQueueSize', () => {
    it('listScans returns FIFO order without mutating', () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b'));
      queue.enqueueScan(input('c'));

      const snap = queue.listScans();
      expect(snap.map((s) => s.meta.filename)).toEqual([
        'resibo-a.jpg',
        'resibo-b.jpg',
        'resibo-c.jpg',
      ]);

      // Mutating the snapshot must not mutate the stored queue.
      snap.pop();
      expect(queue.scanQueueSize()).toBe(3);
    });

    it('scanQueueSize tracks the current length', () => {
      expect(queue.scanQueueSize()).toBe(0);
      queue.enqueueScan(input('a'));
      expect(queue.scanQueueSize()).toBe(1);
      queue.enqueueScan(input('b'));
      expect(queue.scanQueueSize()).toBe(2);
    });
  });

  // ----------------------------------------------------------
  // removeScan + clearScans
  // ----------------------------------------------------------
  describe('removeScan + clearScans', () => {
    it('removeScan drops only the matching id', () => {
      const a = queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b'));
      queue.removeScan(a.id);
      const snap = queue.listScans();
      expect(snap.map((s) => s.meta.filename)).toEqual(['resibo-b.jpg']);
    });

    it('removeScan is a no-op for an unknown id', () => {
      queue.enqueueScan(input('a'));
      queue.removeScan('does-not-exist');
      expect(queue.scanQueueSize()).toBe(1);
    });

    it('clearScans empties the queue', () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b'));
      queue.clearScans();
      expect(queue.scanQueueSize()).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // Overflow / FIFO eviction
  // ----------------------------------------------------------
  describe('overflow', () => {
    it('drops the oldest entry when enqueuing past the cap', () => {
      for (let i = 0; i < queue._MAX_QUEUE_SIZE; i++) {
        queue.enqueueScan(input(`m${i}`));
      }
      expect(queue.scanQueueSize()).toBe(queue._MAX_QUEUE_SIZE);
      expect(queue.listScans()[0]?.meta.filename).toBe('resibo-m0.jpg');

      // One past the cap must drop m0.
      queue.enqueueScan(input('overflow'));

      expect(queue.scanQueueSize()).toBe(queue._MAX_QUEUE_SIZE);
      const after = queue.listScans();
      expect(after[0]?.meta.filename).toBe('resibo-m1.jpg');
      expect(after[after.length - 1]?.meta.filename).toBe('resibo-overflow.jpg');
    });
  });

  // ----------------------------------------------------------
  // flushScanQueue
  // ----------------------------------------------------------
  describe('flushScanQueue', () => {
    it('replays every scan in FIFO order and clears on full success', async () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b'));
      queue.enqueueScan(input('c'));

      const seen: string[] = [];
      const submit = vi.fn(async (s: QueuedScan): Promise<queue.FlushOutcome> => {
        seen.push(s.meta.filename);
        return 'saved';
      });

      const result = await queue.flushScanQueue(submit);

      expect(seen).toEqual(['resibo-a.jpg', 'resibo-b.jpg', 'resibo-c.jpg']);
      expect(result).toEqual({ succeeded: 3, failed: 0, dropped: 0 });
      expect(queue.scanQueueSize()).toBe(0);
    });

    it('keeps transiently-failed scans queued (partial failure) and removes only successes', async () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b')); // this one will fail transiently
      queue.enqueueScan(input('c'));

      const submit = vi.fn(async (s: QueuedScan): Promise<queue.FlushOutcome> => {
        if (s.meta.filename === 'resibo-b.jpg') {
          return 'retry';
        }
        return 'saved';
      });

      const result = await queue.flushScanQueue(submit);

      expect(result).toEqual({ succeeded: 2, failed: 1, dropped: 0 });
      // Only the failed scan remains, still queued for a later retry.
      const remaining = queue.listScans();
      expect(remaining.map((s) => s.meta.filename)).toEqual(['resibo-b.jpg']);
      // Its attempt counter advanced so it can't loop forever.
      expect(remaining[0]?.attempts).toBe(1);
    });

    it('treats a thrown error as a transient retry (fail-safe — keeps the scan)', async () => {
      queue.enqueueScan(input('a'));

      const submit = vi.fn(async (): Promise<queue.FlushOutcome> => {
        throw new Error('unexpected boom');
      });

      const result = await queue.flushScanQueue(submit);

      expect(result).toEqual({ succeeded: 0, failed: 1, dropped: 0 });
      expect(queue.scanQueueSize()).toBe(1);
      expect(queue.listScans()[0]?.attempts).toBe(1);
    });

    it("drops a scan the caller marks 'drop' (unreadable/duplicate) without a save", async () => {
      queue.enqueueScan(input('a'));
      queue.enqueueScan(input('b')); // unrecoverable
      queue.enqueueScan(input('c'));

      const submit = vi.fn(async (s: QueuedScan): Promise<queue.FlushOutcome> => {
        if (s.meta.filename === 'resibo-b.jpg') return 'drop';
        return 'saved';
      });

      const result = await queue.flushScanQueue(submit);

      expect(result).toEqual({ succeeded: 2, failed: 0, dropped: 1 });
      // The dropped scan is gone, not stuck looping.
      expect(queue.scanQueueSize()).toBe(0);
    });

    it('drops a scan after MAX_FLUSH_ATTEMPTS transient retries', async () => {
      queue.enqueueScan(input('a'));

      const submit = vi.fn(async (): Promise<queue.FlushOutcome> => 'retry');

      // Each flush bumps attempts by 1. After (cap - 1) retries it remains
      // queued; the flush that would push it to the cap drops it.
      let lastResult;
      for (let i = 0; i < queue._MAX_FLUSH_ATTEMPTS; i++) {
        lastResult = await queue.flushScanQueue(submit);
      }

      // Final flush dropped it.
      expect(lastResult).toEqual({ succeeded: 0, failed: 0, dropped: 1 });
      expect(queue.scanQueueSize()).toBe(0);
    });

    it('returns a zeroed result and does not call submit on an empty queue', async () => {
      const submit = vi.fn(async (): Promise<queue.FlushOutcome> => 'saved');
      const result = await queue.flushScanQueue(submit);
      expect(submit).not.toHaveBeenCalled();
      expect(result).toEqual({ succeeded: 0, failed: 0, dropped: 0 });
    });

    it('returns a zeroed result on SSR without calling submit', async () => {
      queue.enqueueScan(input('a'));
      delete (globalThis as { window?: unknown }).window;
      const submit = vi.fn(async (): Promise<queue.FlushOutcome> => 'saved');
      const result = await queue.flushScanQueue(submit);
      expect(submit).not.toHaveBeenCalled();
      expect(result).toEqual({ succeeded: 0, failed: 0, dropped: 0 });
    });
  });

  // ----------------------------------------------------------
  // SSR safety — `window === undefined`
  // ----------------------------------------------------------
  describe('SSR safety', () => {
    beforeEach(() => {
      delete (globalThis as { window?: unknown }).window;
    });

    it('enqueueScan still constructs + returns a scan on SSR (no throw)', () => {
      const scan = queue.enqueueScan(input('ssr'));
      expect(scan.meta.filename).toBe('resibo-ssr.jpg');
    });

    it('listScans returns [] on SSR', () => {
      expect(queue.listScans()).toEqual([]);
    });

    it('scanQueueSize returns 0 on SSR', () => {
      expect(queue.scanQueueSize()).toBe(0);
    });

    it('removeScan + clearScans are no-ops on SSR (no throw)', () => {
      expect(() => queue.removeScan('x')).not.toThrow();
      expect(() => queue.clearScans()).not.toThrow();
    });
  });

  // ----------------------------------------------------------
  // Corrupted localStorage payload
  // ----------------------------------------------------------
  describe('corrupted payload', () => {
    it('treats unparseable JSON as empty + clears the key + warns', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      ls().setItem(queue._STORAGE_KEY, '{not valid json');

      expect(queue.listScans()).toEqual([]);
      expect(ls().getItem(queue._STORAGE_KEY)).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('drops non-array payloads (shape drift)', () => {
      ls().setItem(queue._STORAGE_KEY, JSON.stringify({ not: 'an array' }));
      expect(queue.listScans()).toEqual([]);
      expect(ls().getItem(queue._STORAGE_KEY)).toBeNull();
    });

    it('filters out individual entries missing required fields', () => {
      ls().setItem(
        queue._STORAGE_KEY,
        JSON.stringify([
          {
            id: 'a',
            image_data_url: 'data:image/jpeg;base64,xxx',
            content_key: 'k-a',
            meta: { filename: 'good.jpg', mime_type: 'image/jpeg' },
            queued_at: new Date().toISOString(),
          },
          { id: 'b', image_data_url: 42 }, // bad shape
          null,
          {
            id: 'c',
            image_data_url: 'data:image/jpeg;base64,yyy',
            content_key: 'k-c',
            meta: { filename: 'also-good.jpg', mime_type: 'image/jpeg' },
            queued_at: new Date().toISOString(),
          },
        ])
      );

      const snap = queue.listScans();
      expect(snap.map((s) => s.id)).toEqual(['a', 'c']);
    });

    // --- F1: legacy entries queued before `attempts` existed must read back
    //     with attempts = 0, never undefined/NaN (so the cap math is safe). ---
    it('backfills attempts=0 for legacy entries missing the field', () => {
      ls().setItem(
        queue._STORAGE_KEY,
        JSON.stringify([
          {
            id: 'legacy',
            image_data_url: 'data:image/jpeg;base64,xxx',
            content_key: 'k-legacy',
            meta: { filename: 'legacy.jpg', mime_type: 'image/jpeg' },
            queued_at: new Date().toISOString(),
            // no `attempts` field
          },
          {
            id: 'corrupt-attempts',
            image_data_url: 'data:image/jpeg;base64,yyy',
            content_key: 'k-corrupt',
            meta: { filename: 'corrupt.jpg', mime_type: 'image/jpeg' },
            queued_at: new Date().toISOString(),
            attempts: 'not-a-number',
          },
        ])
      );

      const snap = queue.listScans();
      expect(snap.map((s) => s.attempts)).toEqual([0, 0]);
    });
  });
});
