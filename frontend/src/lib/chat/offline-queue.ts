/**
 * Chat — Offline composer queue
 * Feature: Phase 8c — `pattern:filipino-mobile-data-resilience` (spec §7
 *   acceptance signal "Composer queues message when offline; shows warm
 *   Kai bubble not a generic error")
 * Role: localStorage-backed FIFO of messages typed while offline so the
 *       Maria persona (spotty connectivity — markets, jeepney, weak signal)
 *       never loses a thought. Drained by chat-interface on `'online'`.
 *
 * Storage: localStorage key `akbai_chat_offline_queue_v1`. Versioned so a
 *   future schema change (e.g. add `retryCount`) can ship a migration shim
 *   without colliding with stale data on returning devices.
 *
 * Capacity: 50 messages. On overflow the oldest is silently dropped (FIFO
 *   eviction). 50 is well past realistic single-session offline volume but
 *   keeps the localStorage payload under ~10KB.
 *
 * SSR safety: every read/write is guarded by `typeof window === 'undefined'`.
 *   `enqueue` still constructs + returns the QueuedMessage on SSR (caller
 *   chooses what to do with it) but does not attempt the localStorage write.
 *
 * Corruption: if `JSON.parse` throws on a poisoned key, we `console.warn`,
 *   clear the corrupted key, and treat the queue as empty. Better to lose
 *   queued messages than to brick the chat surface.
 */

// ============================================================
// Types — public API
// ============================================================

export interface QueuedMessage {
  id: string;
  text: string;
  /** ISO 8601 UTC — when the user pressed send while offline. */
  queued_at: string;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'akbai_chat_offline_queue_v1';
const MAX_QUEUE_SIZE = 50;

// ============================================================
// Internal helpers — storage + ID gen
// ============================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Generate a stable client-side id for a queued message. Prefer
 * `crypto.randomUUID` (available in all evergreen browsers + Node 19+)
 * with a Math.random fallback for ancient WebViews.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Read the queue from localStorage. On parse failure: warn, clear the
 * corrupted key, return []. Never throws.
 */
function readQueue(): QueuedMessage[] {
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
    // Light validation — drop any entries missing required fields rather
    // than failing the whole read.
    return parsed.filter(
      (m): m is QueuedMessage =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as QueuedMessage).id === 'string' &&
        typeof (m as QueuedMessage).text === 'string' &&
        typeof (m as QueuedMessage).queued_at === 'string'
    );
  } catch {
    // eslint-disable-next-line no-console
    console.warn('[offline-queue] Corrupted queue payload — clearing.');
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage might be unavailable (private mode quota); swallow. */
    }
    return [];
  }
}

function writeQueue(queue: QueuedMessage[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* Quota exceeded or storage unavailable — silently drop. The user's
       in-memory chat state still shows their message; we just can't
       persist across reload. */
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Push a new message onto the tail of the queue. Returns the constructed
 * QueuedMessage even on SSR (caller may want the id for the optimistic
 * bubble) but only persists on the browser. FIFO-evicts the head if the
 * 50-message cap would be exceeded.
 */
export function enqueue(text: string): QueuedMessage {
  const msg: QueuedMessage = {
    id: generateId(),
    text,
    queued_at: new Date().toISOString(),
  };

  if (!isBrowser()) return msg;

  const queue = readQueue();
  queue.push(msg);

  // FIFO eviction: drop oldest until at or below cap. Loop in case prior
  // writes (e.g. cross-tab) had already pushed us above the cap.
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.shift();
  }

  writeQueue(queue);
  return msg;
}

/**
 * Pop the entire queue: returns the messages in FIFO order and clears
 * storage in the same call. Caller is responsible for the actual sends.
 * Returns [] on SSR.
 */
export function dequeueAll(): QueuedMessage[] {
  if (!isBrowser()) return [];
  const queue = readQueue();
  if (queue.length === 0) return [];
  clear();
  return queue;
}

/**
 * Read the queue without mutating. FIFO order. Returns [] on SSR.
 */
export function peek(): QueuedMessage[] {
  return readQueue();
}

/**
 * Current queue length. Returns 0 on SSR.
 */
export function size(): number {
  return readQueue().length;
}

/**
 * Drop everything. Safe to call on SSR (no-op).
 */
export function clear(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* swallow — see writeQueue rationale */
  }
}

// ============================================================
// Test-only export — exposed for vitest assertions.
// Not consumed by app code. Kept in the public surface intentionally
// so tests don't need a separate `__internal__` import path.
// ============================================================

/** @internal — exposes the localStorage key name for test assertions. */
export const _STORAGE_KEY = STORAGE_KEY;

/** @internal — exposes the cap for test assertions. */
export const _MAX_QUEUE_SIZE = MAX_QUEUE_SIZE;
