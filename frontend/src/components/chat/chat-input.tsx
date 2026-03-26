'use client'

import { useRef } from 'react'
import { Send } from 'lucide-react'
import { trackChatMessageSent } from '@/lib/posthog/events'

interface ChatInputProps {
  onSend: (text: string) => void
  loading: boolean
}

export default function ChatInput({ onSend, loading }: ChatInputProps) {
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
      className="flex-shrink-0 bg-surface-container border-t border-outline-variant/20 px-4 py-3 pb-safe"
      data-testid="chat-input-bar"
    >
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Mag-usap kay Kai..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-2xl px-4 py-2.5 text-on-surface placeholder-on-surface-variant text-sm resize-none min-h-[44px] max-h-[120px] focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 transition-colors disabled:opacity-50"
          data-testid="chat-text-input"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="w-11 h-11 rounded-full bg-primary-container hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="chat-send-btn"
          aria-label="Send message"
        >
          <Send size={16} className="text-on-primary" />
        </button>
      </div>
    </div>
  )
}
