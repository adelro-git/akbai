'use client'

// ============================================================
// ChatInterface — /chat page client root
// Phase 8c (HYBRIDIZE per A2): adopts the new Kai top-bar (32px Kai
// avatar + Fraunces "Kai" + sage status dot + "Nandito ako para sa'yo"
// caption), keeps the in-bubble Kai illustration treatment, mounts a
// suggested-question chip row above the composer, and wraps the
// composer in a light paper-note CTA styling. Branded "Chat with Kai"
// header is preserved as <h1 sr-only> for screen readers.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { markSignOutAsUserInitiated } from '@/lib/supabase/session-watcher'
import { MoreVertical } from 'lucide-react'
import { Kai } from '@/components/illustrations/kai/kai'
import MessageList from './message-list'
import ChatInput from './chat-input'
import DisclaimerBanner from './disclaimer-banner'
import FreeTierBanner from './free-tier-banner'
import SuggestedChips from './suggested-chips'
import { PaywallModal } from '@/components/subscription/paywall-modal'
import * as offlineQueue from '@/lib/chat/offline-queue'
import { clearScans } from '@/lib/ocr/offline-queue'
import type { ChatMessage } from '@/lib/chat/types'

// Re-export so existing consumers (e.g. tests, sibling components) that
// import `ChatMessage` from this file continue to work.
export type { ChatMessage }

export type DeadlineContext = {
  formCode: string
  daysUntilDue: number
}

interface ChatInterfaceProps {
  initialMessages: ChatMessage[]
  userEmail: string
  /** Optional ADR-017 deadline deeplink context. */
  deadlineContext?: DeadlineContext | null
}

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Kumusta! Ako si Kai, ang iyong AI business partner. Paano kita matutulungan ngayon?',
  created_at: new Date().toISOString(),
}

const SENTINEL_DEADLINE_OPEN = '__deadline_context_open__'

export default function ChatInterface({
  initialMessages,
  userEmail: _userEmail,
  deadlineContext = null,
}: ChatInterfaceProps) {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0 ? initialMessages : [WELCOME_MSG]
  )
  const [loading, setLoading] = useState(false)
  const [queriesUsed, setQueriesUsed] = useState(0)
  const [composerFocused, setComposerFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Sprint 17 (architect §4 line 679 / §8 batch 3 line 1061): a 429
  // response from /api/chat with error `free_tier_limit` opens the
  // unified <PaywallModal source="chat" />. The chat session resumes
  // after the user closes the paywall (state is preserved).
  const [paywallOpen, setPaywallOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const seededRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ADR-017: when arriving with a deadlineContext and no prior conversation,
  // POST the sentinel so Kai opens. Composer stays empty (Kai-speaks-first).
  useEffect(() => {
    if (!deadlineContext || seededRef.current) return
    if (initialMessages.length > 0) {
      seededRef.current = true
      return
    }
    seededRef.current = true
    const ctx: DeadlineContext = deadlineContext

    let cancelled = false
    async function seed() {
      setLoading(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: SENTINEL_DEADLINE_OPEN,
            feature: 'general_chat',
            deadlineContext,
          }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data?.success) {
          const kaiMsg: ChatMessage = {
            id: `kai-${Date.now()}`,
            role: 'assistant',
            content: data.data.message,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => {
            // Replace the welcome bubble with Kai's deadline-aware open.
            const filtered = prev.filter((m) => m.id !== 'welcome')
            return [...filtered, kaiMsg]
          })
          if (typeof data.data.queriesUsedToday === 'number') {
            setQueriesUsed(data.data.queriesUsedToday)
          }
          trackSeed(ctx, true)
        } else {
          trackSeed(ctx, false)
          setMessages((prev) => [
            ...prev,
            {
              id: `seed-fail-${Date.now()}`,
              role: 'assistant',
              content:
                'Ay, hindi ko ma-buksan ang topic. Magtanong ka lang — nandito ako.',
              created_at: new Date().toISOString(),
            },
          ])
        }
      } catch {
        if (!cancelled) trackSeed(ctx, false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    seed()
    return () => {
      cancelled = true
    }
  }, [deadlineContext, initialMessages.length])

  async function handleSend(text: string) {
    if (!text.trim() || loading) return
    const trimmed = text.trim()

    // ----------------------------------------------------------
    // Offline path — `pattern:filipino-mobile-data-resilience`
    // Detect lost connectivity BEFORE the fetch so the user gets a
    // warm "Na-save ko muna" Kai bubble instead of a generic error
    // when their jeepney loses signal. Their typed text is persisted
    // to localStorage and drained on the next `'online'` event.
    // ----------------------------------------------------------
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const queued = offlineQueue.enqueue(trimmed)
      const userMsg: ChatMessage = {
        id: `queued-${queued.id}`,
        role: 'user',
        content: trimmed,
        created_at: queued.queued_at,
        queued: true,
      }
      const kaiMsg: ChatMessage = {
        id: `kai-offline-${Date.now()}`,
        role: 'assistant',
        content: 'Na-save ko muna — i-send ko pag may connection.',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg, kaiMsg])
      return
    }

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          ...(deadlineContext ? { deadlineContext } : {}),
        }),
      })

      const data = await res.json()

      // ----------------------------------------------------------
      // Sprint 17 (architect §4 line 679): catch 429 / free_tier_limit
      // before the generic error branch. The chat session stays open
      // — the user can resume after upgrading.
      // ----------------------------------------------------------
      if (res.status === 429 && data?.error?.code === 'free_tier_limit') {
        setPaywallOpen(true)
        // Do NOT push an error bubble — the paywall IS the response.
      } else if (data.success) {
        const kaiMsg: ChatMessage = {
          id: `kai-${Date.now()}`,
          role: 'assistant',
          content: data.data.message,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, kaiMsg])
        if (typeof data.data.queriesUsedToday === 'number') {
          setQueriesUsed(data.data.queriesUsedToday)
        } else {
          setQueriesUsed((prev) => prev + 1)
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content:
              data.error?.message_tl || 'Ay, mali pala — pakiulit ulit po.',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            'Pasensya na, hindi makakonekta. I-check mo muna ang internet connection mo.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // Offline queue drain — fire on `'online'` event AND on mount if
  // the user came back online before the page mounted. Sends each
  // queued message in FIFO order via the existing /api/chat POST.
  // On any send failure we stop draining and leave the remainder in
  // the queue so the user can retry later (no infinite loop).
  // ============================================================
  const drainingRef = useRef(false)
  const drainQueue = useCallback(async () => {
    if (drainingRef.current) return
    if (typeof window === 'undefined') return
    if (offlineQueue.peek().length === 0) return

    drainingRef.current = true
    try {
      const queued = offlineQueue.peek()
      let succeeded = 0
      let failed = false

      for (const item of queued) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: item.text,
              ...(deadlineContext ? { deadlineContext } : {}),
            }),
          })
          const data = await res.json()
          if (!data?.success) {
            failed = true
            break
          }
          const kaiMsg: ChatMessage = {
            id: `kai-drain-${item.id}`,
            role: 'assistant',
            content: data.data.message,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, kaiMsg])
          if (typeof data.data.queriesUsedToday === 'number') {
            setQueriesUsed(data.data.queriesUsedToday)
          } else {
            setQueriesUsed((prev) => prev + 1)
          }
          succeeded += 1
        } catch {
          failed = true
          break
        }
      }

      if (failed) {
        // Re-queue the unsent tail so the user can retry. We popped
        // none — `peek()` is non-mutating — so just slice from the
        // original queue and overwrite.
        const remaining = queued.slice(succeeded)
        offlineQueue.clear()
        for (const item of remaining) {
          offlineQueue.enqueue(item.text)
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
        ])
      } else {
        offlineQueue.clear()
        setMessages((prev) => [
          ...prev,
          {
            id: `kai-drain-ok-${Date.now()}`,
            role: 'assistant',
            content:
              'Naipadala na ang mga mensahe mo, salamat sa pasensya.',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } finally {
      drainingRef.current = false
    }
  }, [deadlineContext])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // On mount: if we came back online before the page mounted, drain now.
    if (navigator.onLine && offlineQueue.peek().length > 0) {
      void drainQueue()
    }

    function onOnline() {
      void drainQueue()
    }
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('online', onOnline)
    }
  }, [drainQueue])

  async function handleSignOut() {
    markSignOutAsUserInitiated()
    // F5 (security): captured offline receipt images + queued chat drafts sit
    // unencrypted in localStorage. Wipe them on sign-out so a session's PII
    // (resibo photos, message text) never outlives that session on a shared
    // device. Best-effort — both clears are no-throw SSR-safe no-ops. Mirrors
    // profile-view.tsx.
    clearScans()
    offlineQueue.clear()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-dvh" data-testid="chat-interface">
      <h1 className="sr-only">Chat with Kai</h1>

      {/* Top bar — Warm Precision (.chat-topbar): translucent surface fade,
          pale-honey avatar disc, Fraunces "Kai" (wp-h3), teal status dot. */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-sm pt-safe"
        data-testid="chat-topbar"
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-9 h-9 rounded-full overflow-hidden bg-secondary-container flex items-center justify-center flex-shrink-0"
            data-testid="chat-topbar-avatar"
          >
            <Kai expression={loading ? 'thinking' : 'happy'} size={30} />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="wp-h3 font-serif text-[17px]">Kai</span>
              <span
                className="w-[7px] h-[7px] rounded-full bg-sage-deep motion-reduce:animate-none animate-pulse"
                data-testid="chat-topbar-status"
                aria-label="Online"
              />
            </div>
            <span className="text-[12px] font-semibold text-sage-deep">
              Nandito ako para sa&apos;yo
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-ink-soft hover:bg-honey-cream/40 transition-colors"
            aria-label="Mga options"
            data-testid="chat-topbar-menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 min-w-[160px] rounded-xl bg-surface-container-lowest shadow-ambient-lg p-1.5">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                data-testid="sign-out-btn"
              >
                Mag-sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <DisclaimerBanner />

      <MessageList messages={messages} loading={loading} bottomRef={bottomRef} />

      <FreeTierBanner
        queriesUsed={queriesUsed}
        tier="free"
        onUpgrade={() => setPaywallOpen(true)}
      />

      <SuggestedChips
        onSelect={handleSend}
        loading={loading}
        composerFocused={composerFocused}
      />

      {/* Composer — Warm Precision (.chat-composer): translucent surface bar
          with a top tonal hairline; the recessed field + gradient send button
          live inside ChatInput. */}
      <div className="flex-shrink-0 px-3 pt-2 pb-safe bg-surface/90 backdrop-blur-md ring-1 ring-inset ring-outline-variant/[0.18]">
        <ChatInput
          onSend={handleSend}
          loading={loading}
          onFocusChange={setComposerFocused}
        />
      </div>

      {/* Sprint 17 paywall — opens on 429 free_tier_limit or banner tap. */}
      <PaywallModal
        open={paywallOpen}
        source="chat"
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  )
}

function trackSeed(ctx: DeadlineContext, success: boolean) {
  if (typeof window === 'undefined') return
  // Lazy import to avoid SSR issues with posthog-js.
  import('@/lib/posthog/events')
    .then(({ trackDeadlineChatSeeded }) =>
      trackDeadlineChatSeeded(ctx.formCode, ctx.daysUntilDue, success)
    )
    .catch(() => {
      /* no-op — analytics failure is silent */
    })
}
