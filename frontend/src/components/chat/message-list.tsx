'use client'

import { RefObject, useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import ChatBubble from './chat-bubble'
import type { ChatMessage } from './chat-interface'
import { getEstimatedWait } from '@/lib/claude/loading-estimator'
import type { KAFeature, UserTier } from '@/lib/claude/types'

interface MessageListProps {
  messages: ChatMessage[]
  loading: boolean
  bottomRef: RefObject<HTMLDivElement | null>
  feature?: KAFeature
  tier?: UserTier
}

/** Threshold in ms after which we show the long-wait message. */
const LONG_WAIT_MS = 5000;

/** Distance from bottom (px) at which the scroll-to-bottom button appears. */
const SCROLL_THRESHOLD = 150;

export default function MessageList({ messages, loading, bottomRef, feature = 'general_chat', tier = 'free' }: MessageListProps) {
  const [showLongWait, setShowLongWait] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading) {
      setShowLongWait(false)
      return
    }

    const timer = setTimeout(() => {
      setShowLongWait(true)
    }, LONG_WAIT_MS)

    return () => clearTimeout(timer)
  }, [loading])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollBtn(distanceFromBottom > SCROLL_THRESHOLD)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const estimate = getEstimatedWait(feature, tier)

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto px-4 py-4 space-y-3"
        data-testid="message-list"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-end gap-2" data-testid="loading-indicator">
            <div className="w-7 h-7 rounded-full bg-primary-container/10 ring-1 ring-primary-container/30 flex-shrink-0 flex items-center justify-center">
              <img
                src="/icons/mark-honey.png"
                alt="Kai"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary-container animate-bounce" />
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5" data-testid="loading-message">
                {showLongWait ? estimate.longWaitMessageTl : estimate.messageTl}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-primary-container hover:bg-primary flex items-center justify-center shadow-ambient transition-all min-h-[44px] min-w-[44px]"
          aria-label="Scroll to bottom"
          data-testid="scroll-to-bottom-btn"
        >
          <ChevronDown size={20} className="text-on-primary" />
        </button>
      )}
    </div>
  )
}
