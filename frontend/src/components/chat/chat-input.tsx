'use client'

import { useState, useRef } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  loading: boolean
}

export default function ChatInput({ onSend, loading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || loading) return
    onSend(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
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
      className="flex-shrink-0 bg-kai-card border-t border-white/5 px-4 py-3 pb-safe"
      data-testid="chat-input-bar"
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Mag-usap kay Kai..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-kai-card-alt border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-slate-500 text-sm resize-none min-h-[42px] max-h-[120px] focus:border-honey/50 focus:ring-1 focus:ring-honey/30 transition-colors disabled:opacity-50"
          data-testid="chat-text-input"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="w-10 h-10 rounded-full bg-honey hover:bg-honey-deep flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="chat-send-btn"
          aria-label="Send message"
        >
          <Send size={16} className="text-ink" />
        </button>
      </form>
    </div>
  )
}
