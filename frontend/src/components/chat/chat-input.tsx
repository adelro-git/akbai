'use client'

// ============================================================
// ChatInput — composer for /chat
// React 19 controlled-input bug → useRef + onClick (project rule).
// Phase 8c: parent wraps in paper-note styling, so this component
// drops its own outer border and surfaces focus state up via
// onFocusChange so SuggestedChips can hide on composer focus.
// ============================================================

import { useRef } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { trackChatMessageSent } from '@/lib/posthog/events'

interface ChatInputProps {
  onSend: (text: string) => void
  loading: boolean
  /** Optional — Phase 8c lift state to hide chips when typing. */
  onFocusChange?: (focused: boolean) => void
}

export default function ChatInput({ onSend, loading, onFocusChange }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const text = textareaRef.current?.value?.trim()
    if (!text || loading) return
    onSend(text)
    trackChatMessageSent()
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`
    }
  }

  return (
    <div
      className="flex items-end gap-2.5 py-2"
      data-testid="chat-composer"
    >
      {/* Recessed input field (.composer-input): surface-container-low, r22,
          holds the attach affordance + the auto-growing textarea. */}
      <div className="flex-1 flex items-end gap-1 bg-surface-container-low rounded-[22px] pl-2 pr-3 py-1">
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-faint hover:bg-surface-container-high/60 transition-colors flex-shrink-0"
          aria-label="I-attach ang larawan"
          data-testid="chat-attach-btn"
          disabled={loading}
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder="Magtanong kay Kai..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-transparent text-on-surface placeholder-on-faint text-[15px] leading-[22px] resize-none min-h-[44px] max-h-[120px] py-2.5 focus:outline-none disabled:opacity-50"
          data-testid="chat-text-input"
        />
      </div>
      {/* Send button (.send-btn): honey-gradient 44px circle, el-2 shadow,
          press-scale; recedes to surface-container-highest when disabled. */}
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-grad-from to-grad-to flex items-center justify-center flex-shrink-0 shadow-el-2 transition-transform active:scale-90 disabled:bg-none disabled:bg-surface-container-highest disabled:shadow-none disabled:cursor-not-allowed"
        data-testid="chat-send-btn"
        aria-label="I-send ang message"
      >
        <Send size={18} className="text-on-primary" />
      </button>
    </div>
  )
}
