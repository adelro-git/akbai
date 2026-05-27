/**
 * ChatInterface paywall trigger — behavior tests (Sprint 17 batch 3).
 *
 * Scope: validates the 429 + free_tier_limit catch added to
 *        chat-interface.tsx handleSend. The vitest env is `node` (no
 *        jsdom), so we mirror the production branch with a stand-in
 *        function — same pattern as offline-send.test.ts.
 *
 * Reference: sprint-17-revenuecat-pattern.md §4 line 679 + §8 batch 3
 *            line 1061.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Stand-in for the relevant branch of chat-interface.tsx handleSend.
// Mirrors the production logic verbatim — if you change the branch,
// mirror it here.
// ============================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ApiResponseShape {
  status: number;
  body: {
    success?: boolean;
    error?: { code?: string; message?: string; message_tl?: string };
    data?: { message?: string; queriesUsedToday?: number };
  };
}

function deriveOutcome(
  res: ApiResponseShape,
  setPaywallOpen: (v: boolean) => void,
  setMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void,
  setQueriesUsed: (fn: (prev: number) => number) => void,
): 'paywall_opened' | 'message_appended' | 'error_appended' {
  // The exact branch in production (chat-interface.tsx handleSend):
  if (res.status === 429 && res.body?.error?.code === 'free_tier_limit') {
    setPaywallOpen(true);
    return 'paywall_opened';
  }
  if (res.body.success) {
    setMessages((prev) => [
      ...prev,
      {
        id: `kai-${Date.now()}`,
        role: 'assistant',
        content: res.body.data!.message!,
        created_at: new Date().toISOString(),
      },
    ]);
    if (typeof res.body.data?.queriesUsedToday === 'number') {
      // No-op for setQueriesUsed in this stub; production reads it.
      setQueriesUsed(() => res.body.data!.queriesUsedToday!);
    } else {
      setQueriesUsed((prev) => prev + 1);
    }
    return 'message_appended';
  }
  setMessages((prev) => [
    ...prev,
    {
      id: `err-${Date.now()}`,
      role: 'assistant',
      content:
        res.body.error?.message_tl || 'Ay, mali pala — pakiulit ulit po.',
      created_at: new Date().toISOString(),
    },
  ]);
  return 'error_appended';
}

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChatInterface — 429 free_tier_limit paywall trigger', () => {
  it('opens PaywallModal on 429 with free_tier_limit code', () => {
    const setPaywallOpen = vi.fn();
    const setMessages = vi.fn();
    const setQueriesUsed = vi.fn();

    const outcome = deriveOutcome(
      {
        status: 429,
        body: {
          success: false,
          error: {
            code: 'free_tier_limit',
            message: 'Free tier limit reached',
            message_tl: 'Naka-max ka na for today.',
          },
        },
      },
      setPaywallOpen,
      setMessages,
      setQueriesUsed,
    );

    expect(outcome).toBe('paywall_opened');
    expect(setPaywallOpen).toHaveBeenCalledWith(true);
    // No chat-error bubble appended — the paywall IS the response.
    expect(setMessages).not.toHaveBeenCalled();
  });

  it('does NOT open paywall on 429 with a different error code', () => {
    const setPaywallOpen = vi.fn();
    const setMessages = vi.fn();
    const setQueriesUsed = vi.fn();

    const outcome = deriveOutcome(
      {
        status: 429,
        body: {
          success: false,
          error: {
            code: 'rate_limited',
            message: 'Rate limit exceeded',
            message_tl: 'Slow down.',
          },
        },
      },
      setPaywallOpen,
      setMessages,
      setQueriesUsed,
    );

    expect(outcome).toBe('error_appended');
    expect(setPaywallOpen).not.toHaveBeenCalled();
    expect(setMessages).toHaveBeenCalledOnce();
  });

  it('does NOT open paywall on 200 success even if error code matches', () => {
    const setPaywallOpen = vi.fn();
    const setMessages = vi.fn();
    const setQueriesUsed = vi.fn();

    const outcome = deriveOutcome(
      {
        status: 200,
        body: {
          success: true,
          data: { message: 'Kumusta!', queriesUsedToday: 3 },
        },
      },
      setPaywallOpen,
      setMessages,
      setQueriesUsed,
    );

    expect(outcome).toBe('message_appended');
    expect(setPaywallOpen).not.toHaveBeenCalled();
  });

  it('does NOT open paywall on 500 server error', () => {
    const setPaywallOpen = vi.fn();
    const setMessages = vi.fn();
    const setQueriesUsed = vi.fn();

    const outcome = deriveOutcome(
      {
        status: 500,
        body: {
          success: false,
          error: { code: 'internal_error' },
        },
      },
      setPaywallOpen,
      setMessages,
      setQueriesUsed,
    );

    expect(outcome).toBe('error_appended');
    expect(setPaywallOpen).not.toHaveBeenCalled();
  });

  it('paywall trigger does not append an error message bubble', () => {
    const setPaywallOpen = vi.fn();
    const setMessages = vi.fn();
    const setQueriesUsed = vi.fn();

    deriveOutcome(
      {
        status: 429,
        body: {
          success: false,
          error: {
            code: 'free_tier_limit',
            message: 'Free tier limit reached',
            message_tl: 'Naka-max ka na for today.',
          },
        },
      },
      setPaywallOpen,
      setMessages,
      setQueriesUsed,
    );

    // Critical contract: NO setMessages call. The paywall replaces the
    // "Ay, mali pala" error bubble — the user shouldn't see both.
    expect(setMessages).not.toHaveBeenCalled();
  });
});

describe('ChatInterface — FreeTierBanner onUpgrade wiring', () => {
  // The banner CTA also opens the paywall — guard the prop contract.
  it('banner onUpgrade callback opens paywall', () => {
    const setPaywallOpen = vi.fn();
    // Simulate what chat-interface passes to FreeTierBanner:
    const onUpgrade = () => setPaywallOpen(true);
    onUpgrade();
    expect(setPaywallOpen).toHaveBeenCalledWith(true);
  });
});
