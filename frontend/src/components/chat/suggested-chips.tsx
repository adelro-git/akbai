'use client'

// ============================================================
// SuggestedChips — horizontal scroll row above the chat composer
// Phase 8c (ADR-016): fetches GET /api/chat/suggestions and renders
// 4 conversational-Filipino chip pills. Tap = insert + send via the
// parent's handleSend(). Row hides when the composer is focused.
// ============================================================

import { useEffect, useState } from 'react'
import type { ChatSuggestion } from '@/lib/chat/suggestions/types'
import { trackChatSuggestionTapped } from '@/lib/posthog/events'

interface SuggestedChipsProps {
  /** Parent supplies the same handleSend used by the composer. */
  onSelect: (text: string) => void
  /** True while a Kai response is in-flight — chips disabled. */
  loading: boolean
  /** True when the composer has focus — row scrolls off. */
  composerFocused: boolean
}

const COLD_START_FALLBACK: ChatSuggestion[] = [
  { id: 'cold_start_expenses', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
  { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
  { id: 'cold_start_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
  { id: 'cold_start_capture', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
]

export default function SuggestedChips({ onSelect, loading, composerFocused }: SuggestedChipsProps) {
  const [chips, setChips] = useState<ChatSuggestion[]>(COLD_START_FALLBACK)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadChips() {
      try {
        const res = await fetch('/api/chat/suggestions', { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (json?.success && Array.isArray(json.data?.suggestions)) {
          setChips(json.data.suggestions)
        }
      } catch {
        // Silent fall-through to COLD_START_FALLBACK already in state.
      } finally {
        if (!cancelled) setFetched(true)
      }
    }
    loadChips()
    return () => {
      cancelled = true
    }
  }, [])

  if (composerFocused) return null

  return (
    <div
      className="flex-shrink-0 px-4 pt-2 pb-1"
      data-testid="chat-suggested-chips"
      aria-label="Mga suggested na tanong para kay Kai"
      data-fetched={fetched ? 'true' : 'false'}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none snap-x">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={loading}
            onClick={() => {
              trackChatSuggestionTapped(chip.id, chip.intent)
              onSelect(chip.text_tl)
            }}
            className="flex-shrink-0 snap-start min-h-[44px] px-3.5 py-2 rounded-full bg-surface-container-lowest text-on-surface text-[13px] font-semibold ring-1 ring-inset ring-outline-variant/[0.24] hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid={`chat-chip-${chip.id}`}
            data-intent={chip.intent}
          >
            {chip.text_tl}
          </button>
        ))}
      </div>
    </div>
  )
}
