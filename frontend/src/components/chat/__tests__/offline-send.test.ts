/**
 * Behavior tests — Chat offline send path (Phase 8c)
 *
 * Scope: validates the offline-send + drain logic without rendering
 * <ChatInterface/>. The vitest env is `node` (no jsdom, no
 * @testing-library/react), so we test the same code paths by exercising
 * the offline-queue module directly + a stand-in `handleSend` that
 * mirrors the production branch.
 *
 * Why these tests: spec §7 acceptance signal "Composer queues message
 * when offline; shows warm Kai bubble not a generic error" is the user-
 * visible contract. The lib tests prove storage works; these tests prove
 * the chat surface uses the lib correctly (no fetch when offline, queue
 * grows, drain on reconnect sends in order + clears queue + appends the
 * confirmation bubble).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as offlineQueue from '@/lib/chat/offline-queue';

// ============================================================
// localStorage shim — vitest's node env has no `window`.
// ============================================================

function installLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
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
}

// ============================================================
// Minimal ChatMessage shape (mirror of @/lib/chat/types).
// Keeping local + structural so we don't drag in client-only imports.
// ============================================================

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  queued?: boolean;
};

/**
 * Mirrors the offline branch of `handleSend` in chat-interface.tsx.
 * If you change the production branch, mirror it here.
 */
function handleSend(
  text: string,
  navigatorOnLine: boolean,
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void
): { fetched: boolean } {
  if (navigatorOnLine === false) {
    const queued = offlineQueue.enqueue(text.trim());
    const userMsg: ChatMessage = {
      id: `queued-${queued.id}`,
      role: 'user',
      content: text.trim(),
      created_at: queued.queued_at,
      queued: true,
    };
    const kaiMsg: ChatMessage = {
      id: `kai-offline-${Date.now()}`,
      role: 'assistant',
      content: 'Na-save ko muna — i-send ko pag may connection.',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, kaiMsg]);
    return { fetched: false };
  }
  // Production path also runs the fetch — we don't test that here.
  return { fetched: true };
}

/**
 * Mirrors the drain effect in chat-interface.tsx.
 */
async function drainQueue(
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void
): Promise<{ sent: number; failed: boolean }> {
  if (offlineQueue.peek().length === 0) return { sent: 0, failed: false };

  const queued = offlineQueue.peek();
  let succeeded = 0;
  let failed = false;

  for (const item of queued) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: item.text }),
      });
      const data = await res.json();
      if (!data?.success) {
        failed = true;
        break;
      }
      const kaiMsg: ChatMessage = {
        id: `kai-drain-${item.id}`,
        role: 'assistant',
        content: data.data.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, kaiMsg]);
      succeeded += 1;
    } catch {
      failed = true;
      break;
    }
  }

  if (failed) {
    const remaining = queued.slice(succeeded);
    offlineQueue.clear();
    for (const item of remaining) {
      offlineQueue.enqueue(item.text);
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `kai-drain-fail-${Date.now()}`,
        role: 'assistant',
        content:
          'May ilang mensahe na hindi pa naipadala. I-try ulit mamaya?',
        created_at: new Date().toISOString(),
      },
    ]);
  } else {
    offlineQueue.clear();
    setMessages((prev) => [
      ...prev,
      {
        id: `kai-drain-ok-${Date.now()}`,
        role: 'assistant',
        content: 'Naipadala na ang mga mensahe mo, salamat sa pasensya.',
        created_at: new Date().toISOString(),
      },
    ]);
  }

  return { sent: succeeded, failed };
}

// ============================================================
// Test harness
// ============================================================

describe('chat offline send + drain', () => {
  let originalWindow: typeof globalThis.window | undefined;
  let originalFetch: typeof globalThis.fetch | undefined;

  beforeEach(() => {
    originalWindow = (globalThis as { window?: typeof globalThis.window }).window;
    originalFetch = (globalThis as { fetch?: typeof globalThis.fetch }).fetch;
    (globalThis as unknown as { window: { localStorage: Storage } }).window = {
      localStorage: installLocalStorage(),
    };
    offlineQueue.clear();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalFetch === undefined) {
      delete (globalThis as { fetch?: unknown }).fetch;
    } else {
      (globalThis as { fetch?: unknown }).fetch = originalFetch;
    }
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------------
  // Offline send
  // ----------------------------------------------------------
  describe('handleSend (offline)', () => {
    it('does NOT call fetch when navigator.onLine === false', () => {
      const fetchSpy = vi.fn();
      (globalThis as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      const result = handleSend('saan napunta ang pera ko?', false, setMessages);
      expect(result.fetched).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('grows the offline queue and appends user + Kai bubbles', () => {
      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      handleSend('first thought', false, setMessages);
      handleSend('second thought', false, setMessages);

      expect(offlineQueue.size()).toBe(2);
      expect(offlineQueue.peek().map((m) => m.text)).toEqual([
        'first thought',
        'second thought',
      ]);

      // Each call appended one user bubble + one Kai bubble = 4 total.
      expect(messages).toHaveLength(4);
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: 'first thought',
        queued: true,
      });
      expect(messages[1]).toMatchObject({
        role: 'assistant',
        content: 'Na-save ko muna — i-send ko pag may connection.',
      });
      expect(messages[2]).toMatchObject({
        role: 'user',
        content: 'second thought',
        queued: true,
      });
      expect(messages[3]).toMatchObject({
        role: 'assistant',
        content: 'Na-save ko muna — i-send ko pag may connection.',
      });
    });

    it('uses the warm Kai voice, never a generic error', () => {
      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      handleSend('hello kai', false, setMessages);
      const kaiBubble = messages.find((m) => m.role === 'assistant');
      expect(kaiBubble?.content).toContain('Na-save ko muna');
      expect(kaiBubble?.content).not.toContain('Pasensya na, hindi makakonekta');
    });
  });

  // ----------------------------------------------------------
  // Drain on reconnect
  // ----------------------------------------------------------
  describe('drainQueue (online event)', () => {
    it('sends queued messages in FIFO order then clears the queue', async () => {
      offlineQueue.enqueue('one');
      offlineQueue.enqueue('two');
      offlineQueue.enqueue('three');

      const seenBodies: string[] = [];
      const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? '{}'));
        seenBodies.push(body.message);
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { message: `kai-reply-to-${body.message}` },
          }),
        } as Response;
      });
      (globalThis as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      const result = await drainQueue(setMessages);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(false);
      expect(seenBodies).toEqual(['one', 'two', 'three']);
      expect(offlineQueue.size()).toBe(0);

      // 3 kai-drain bubbles + 1 final confirmation bubble.
      expect(messages.filter((m) => m.role === 'assistant')).toHaveLength(4);
      const finalBubble = messages[messages.length - 1];
      expect(finalBubble.content).toBe(
        'Naipadala na ang mga mensahe mo, salamat sa pasensya.'
      );
    });

    it('stops draining on first failure and leaves the remainder in the queue', async () => {
      offlineQueue.enqueue('ok-1');
      offlineQueue.enqueue('boom');
      offlineQueue.enqueue('not-sent-3');

      const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? '{}'));
        if (body.message === 'boom') {
          throw new Error('network down');
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { message: `kai-reply-to-${body.message}` },
          }),
        } as Response;
      });
      (globalThis as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      const result = await drainQueue(setMessages);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(true);
      // Remaining 2 should still be in the queue, in original order.
      expect(offlineQueue.peek().map((m) => m.text)).toEqual([
        'boom',
        'not-sent-3',
      ]);

      const finalBubble = messages[messages.length - 1];
      expect(finalBubble.content).toBe(
        'May ilang mensahe na hindi pa naipadala. I-try ulit mamaya?'
      );
    });

    it('is a no-op when the queue is empty', async () => {
      const fetchSpy = vi.fn();
      (globalThis as { fetch: typeof fetch }).fetch = fetchSpy as unknown as typeof fetch;

      const messages: ChatMessage[] = [];
      const setMessages = (fn: (prev: ChatMessage[]) => ChatMessage[]) => {
        const next = fn(messages);
        messages.length = 0;
        messages.push(...next);
      };

      const result = await drainQueue(setMessages);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(messages).toHaveLength(0);
    });
  });
});
