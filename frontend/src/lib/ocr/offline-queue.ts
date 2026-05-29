/**
 * Resibo Scanner — Offline scan queue
 * Feature: Sprint 18 Pre-Launch — §11 acceptance signal "receipt capture
 *   works offline, queues locally, syncs on reconnect".
 * Role: localStorage-backed FIFO of receipt scans captured while offline (or
 *       that failed to reach /api/ocr with a network error) so the Maria
 *       persona (spotty connectivity — markets, jeepney, weak signal) never
 *       loses a captured resibo. Drained by ScannerFlow on `'online'`.
 *
 * Mirrors the chat offline queue (`lib/chat/offline-queue.ts`) intentionally:
 *   same localStorage mechanism, same SSR guards, same corruption handling,
 *   same FIFO eviction cap. The chat queue stores plain text; this queue
 *   stores a base64 image data URL + receipt metadata, so the cap is smaller
 *   (images are heavy) and a content-hash dedup guard is added — a double-tap
 *   on "Gamitin ito" while offline must not enqueue the same resibo twice.
 *
 * Storage: localStorage key `akbai_ocr_offline_queue_v1`. Versioned so a future
 *   schema change can ship a migration shim without colliding with stale data.
 *
 * Capacity: 20 scans. Images (~quality-85 JPEG dataUrls) run ~200-500KB each;
 *   20 keeps the localStorage payload comfortably under the ~5MB origin quota
 *   while covering any realistic single-session offline market run. On overflow
 *   the oldest is silently dropped (FIFO eviction).
 *
 * Dedup: each scan carries a `content_key` (caller passes a stable hash of the
 *   image bytes, falling back to dataUrl length+prefix). Enqueuing a scan whose
 *   content_key already sits in the queue is a no-op that returns the existing
 *   entry — protects against double-submits and online/offline race re-queues.
 *
 * SSR safety: every read/write is guarded by `typeof window === 'undefined'`.
 *   `enqueue` still constructs + returns the QueuedScan on SSR (caller chooses
 *   what to do with it) but does not attempt the localStorage write.
 *
 * Corruption: if `JSON.parse` throws on a poisoned key, we `console.warn`,
 *   clear the corrupted key, and treat the queue as empty. Better to lose a
 *   queued scan than to brick the scanner surface.
 */

// ============================================================
// Types — public API
// ============================================================

/** Metadata captured alongside the image for a queued scan. */
export interface QueuedScanMeta {
  /** Original capture filename, e.g. `resibo-1716960000000.jpg`. */
  filename: string;
  /** Image MIME type, e.g. `image/jpeg`. */
  mime_type: string;
}

export interface QueuedScan {
  id: string;
  /** Base64 data URL of the captured receipt image (replayed into a File on flush). */
  image_data_url: string;
  /** Stable content key for dedup — hash/length-prefix of the image bytes. */
  content_key: string;
  /** Capture metadata used to reconstruct the File on flush. */
  meta: QueuedScanMeta;
  /** ISO 8601 UTC — when the scan was captured/queued while offline. */
  queued_at: string;
  /**
   * F1: how many flush attempts this scan has survived. Incremented on every
   * `'retry'` outcome (transient network failure). When it reaches
   * MAX_FLUSH_ATTEMPTS the scan is dropped so a permanently-stuck capture can't
   * loop forever re-spending Claude OCR budget on every reconnect/mount.
   * Legacy entries (queued before this field existed) read back as 0.
   */
  attempts: number;
}

/**
 * Outcome the caller returns from `flushScanQueue`'s replay fn. Distinguishes a
 * permanent removal (saved, or an unrecoverable parse/dup that must NOT loop)
 * from a transient failure that should stay queued for the next reconnect.
 *
 *   'saved'  — submitted + persisted server-side; remove from queue.
 *   'drop'   — unrecoverable (OCR unreadable / duplicate); remove WITHOUT a save.
 *   'retry'  — transient (no signal / server hiccup); keep + bump attempts.
 *
 * A thrown error from the replay fn is treated as 'retry' (fail-safe — never
 * silently lose a capture on an unexpected throw).
 */
export type FlushOutcome = 'saved' | 'drop' | 'retry';

/**
 * Replay function the caller supplies to `flushScanQueue`. Receives one queued
 * scan and resolves with a FlushOutcome. Resolving 'saved'/'drop' removes the
 * scan; 'retry' (or a thrown error) keeps it for the next flush, up to the
 * attempt cap.
 */
export type SubmitScanFn = (scan: QueuedScan) => Promise<FlushOutcome>;

export interface FlushResult {
  /** Scans that submitted successfully and were removed from the queue. */
  succeeded: number;
  /** Scans that stayed queued for a later retry (transient failure, under cap). */
  failed: number;
  /** Scans removed WITHOUT a save: unrecoverable parse/dup, or cap exceeded. */
  dropped: number;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'akbai_ocr_offline_queue_v1';
const MAX_QUEUE_SIZE = 20;

/**
 * F1: max transient retries before a scan is dropped from the queue. A scan
 * that keeps failing to submit (e.g. server consistently 5xx-ing, or an image
 * the OCR can never read) must not re-OCR on every reconnect forever — that
 * both wedges the queue and re-spends Claude OCR budget. After this many
 * 'retry' outcomes the scan is dropped and the caller is told (via FlushResult)
 * so it can surface a "paki-scan ulit" notice.
 */
const MAX_FLUSH_ATTEMPTS = 3;

// ============================================================
// Internal helpers — storage + ID gen
// ============================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Generate a stable client-side id for a queued scan. Prefer
 * `crypto.randomUUID` (evergreen browsers + Node 19+) with a Math.random
 * fallback for ancient WebViews.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Derive a stable dedup key from an image data URL when the caller doesn't
 * supply one. Not cryptographically strong — a length + head/tail sample is
 * enough to catch identical-capture double-submits without hashing megabytes.
 */
function deriveContentKey(dataUrl: string): string {
  const len = dataUrl.length;
  const head = dataUrl.slice(0, 64);
  const tail = dataUrl.slice(-64);
  return `${len}:${head}:${tail}`;
}

/**
 * Read the queue from localStorage. On parse failure: warn, clear the
 * corrupted key, return []. Never throws.
 */
function readQueue(): QueuedScan[] {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Shape drift — wipe and start fresh.
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    // Light validation — drop entries missing required fields rather than
    // failing the whole read.
    return parsed
      .filter(
        (s): s is QueuedScan =>
          typeof s === 'object' &&
          s !== null &&
          typeof (s as QueuedScan).id === 'string' &&
          typeof (s as QueuedScan).image_data_url === 'string' &&
          typeof (s as QueuedScan).content_key === 'string' &&
          typeof (s as QueuedScan).queued_at === 'string' &&
          typeof (s as QueuedScan).meta === 'object' &&
          (s as QueuedScan).meta !== null &&
          typeof (s as QueuedScan).meta.filename === 'string' &&
          typeof (s as QueuedScan).meta.mime_type === 'string'
      )
      // F1: backfill `attempts` for legacy entries queued before the field
      // existed (and coerce any corrupted non-number to 0). Never NaN.
      .map((s) => ({
        ...s,
        attempts:
          typeof s.attempts === 'number' && Number.isFinite(s.attempts)
            ? s.attempts
            : 0,
      }));
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[ocr-offline-queue] Corrupted queue payload — clearing.');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage might be unavailable (private mode quota); swallow. */
    }
    return [];
  }
}

function writeQueue(queue: QueuedScan[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* Quota exceeded or storage unavailable — silently drop. The user's
       in-memory scanner state still reflects the capture; we just can't
       persist it across reload. */
  }
}

// ============================================================
// Public API
// ============================================================

export interface EnqueueScanInput {
  /** Base64 data URL of the captured receipt image. */
  imageDataUrl: string;
  /** Capture metadata used to reconstruct the File on flush. */
  meta: QueuedScanMeta;
  /**
   * Optional stable content key for dedup (e.g. a SHA hash of the image bytes).
   * Falls back to a length + head/tail sample of the data URL.
   */
  contentKey?: string;
}

/**
 * Push a new scan onto the tail of the queue. Returns the constructed
 * QueuedScan even on SSR (caller may want the id) but only persists on the
 * browser.
 *
 * Dedup: if a scan with the same `content_key` is already queued, this is a
 * no-op that returns the existing entry — a double-tap can't double-queue.
 *
 * FIFO-evicts the head if the cap would be exceeded.
 */
export function enqueueScan(input: EnqueueScanInput): QueuedScan {
  const contentKey = input.contentKey ?? deriveContentKey(input.imageDataUrl);

  const scan: QueuedScan = {
    id: generateId(),
    image_data_url: input.imageDataUrl,
    content_key: contentKey,
    meta: input.meta,
    queued_at: new Date().toISOString(),
    attempts: 0,
  };

  if (!isBrowser()) return scan;

  const queue = readQueue();

  // Dedup guard — identical capture already queued.
  const existing = queue.find((s) => s.content_key === contentKey);
  if (existing) return existing;

  queue.push(scan);

  // FIFO eviction: drop oldest until at or below cap. Loop in case prior
  // writes (e.g. cross-tab) had already pushed us above the cap.
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.shift();
  }

  writeQueue(queue);
  return scan;
}

/**
 * Read the queue without mutating. FIFO order. Returns [] on SSR.
 */
export function listScans(): QueuedScan[] {
  return readQueue();
}

/**
 * Current queue length. Returns 0 on SSR.
 */
export function scanQueueSize(): number {
  return readQueue().length;
}

/**
 * Remove a single scan by id. No-op if absent or on SSR.
 */
export function removeScan(id: string): void {
  if (!isBrowser()) return;
  const queue = readQueue();
  const next = queue.filter((s) => s.id !== id);
  if (next.length === queue.length) return; // nothing removed
  writeQueue(next);
}

/**
 * Drop everything. Safe to call on SSR (no-op).
 */
export function clearScans(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* swallow — see writeQueue rationale */
  }
}

/**
 * Persist a new `attempts` count for a single scan. No-op if the scan is gone
 * or on SSR. Used by flush to record a transient failure so the attempt cap
 * survives a reload.
 */
function setScanAttempts(id: string, attempts: number): void {
  if (!isBrowser()) return;
  const queue = readQueue();
  let changed = false;
  const next = queue.map((s) => {
    if (s.id === id && s.attempts !== attempts) {
      changed = true;
      return { ...s, attempts };
    }
    return s;
  });
  if (changed) writeQueue(next);
}

/**
 * Replay every queued scan through `submitFn` in FIFO order. Outcome-driven:
 *
 *   'saved' / 'drop' → removed from the queue immediately (succeeded / dropped).
 *   'retry' (or a thrown error) → attempts++ and kept for the next flush, UNLESS
 *     the bump reaches MAX_FLUSH_ATTEMPTS, in which case the scan is dropped so a
 *     permanently-failing capture can't loop forever re-spending OCR budget.
 *
 * Returns counts of succeeded vs failed (still-queued) vs dropped. Returns a
 * zeroed result on SSR or an empty queue without invoking submitFn.
 *
 * Why per-scan removal rather than drain-then-replay: a flush can be cut short
 * by losing signal again mid-sync. Removing on each success guarantees we never
 * re-submit an already-saved resibo even if the page reloads mid-flush.
 */
export async function flushScanQueue(submitFn: SubmitScanFn): Promise<FlushResult> {
  if (!isBrowser()) return { succeeded: 0, failed: 0, dropped: 0 };

  const queue = readQueue();
  if (queue.length === 0) return { succeeded: 0, failed: 0, dropped: 0 };

  let succeeded = 0;
  let failed = 0;
  let dropped = 0;

  for (const scan of queue) {
    let outcome: FlushOutcome;
    try {
      outcome = await submitFn(scan);
    } catch {
      // An unexpected throw is fail-safe-treated as a transient retry — never
      // silently lose a capture on an unhandled error.
      outcome = 'retry';
    }

    if (outcome === 'saved') {
      removeScan(scan.id);
      succeeded++;
      continue;
    }

    if (outcome === 'drop') {
      removeScan(scan.id);
      dropped++;
      continue;
    }

    // outcome === 'retry' — bump attempts; drop if we've hit the cap.
    const nextAttempts = scan.attempts + 1;
    if (nextAttempts >= MAX_FLUSH_ATTEMPTS) {
      removeScan(scan.id);
      dropped++;
    } else {
      setScanAttempts(scan.id, nextAttempts);
      failed++;
    }
  }

  return { succeeded, failed, dropped };
}

// ============================================================
// Test-only exports — exposed for vitest assertions. Not consumed by app
// code; kept in the public surface so tests don't need an `__internal__`
// import path (mirrors lib/chat/offline-queue.ts).
// ============================================================

/** @internal — exposes the localStorage key name for test assertions. */
export const _STORAGE_KEY = STORAGE_KEY;

/** @internal — exposes the cap for test assertions. */
export const _MAX_QUEUE_SIZE = MAX_QUEUE_SIZE;

/** @internal — exposes the per-scan flush-attempt cap for test assertions. */
export const _MAX_FLUSH_ATTEMPTS = MAX_FLUSH_ATTEMPTS;
