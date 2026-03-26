'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { markSignOutAsUserInitiated } from '@/lib/supabase/session-watcher'
import Image from 'next/image'
import MessageList from './message-list'
import ChatInput from './chat-input'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatInterfaceProps {
  initialMessages: ChatMessage[]
  userEmail: string
}

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Kumusta! Ako si Kai, ang iyong AI business partner. Paano kita matutulungan ngayon po?',
  created_at: new Date().toISOString(),
}

export default function ChatInterface({
  initialMessages,
  userEmail,
}: ChatInterfaceProps) {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.length > 0 ? initialMessages : [WELCOME_MSG]
  )
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        const kaiMsg: ChatMessage = {
          id: `kai-${Date.now()}`,
          role: 'assistant',
          content: data.data.message,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, kaiMsg])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content:
              data.error?.message_tl || 'May nangyaring mali. Pakiulit ulit.',
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
            'Pasensya na, hindi makakonekta. Check mo ang iyong internet connection.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    markSignOutAsUserInitiated()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-dvh bg-background" data-testid="chat-interface">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant/20 pt-safe">
        <div className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-primary-container/30 flex items-center justify-center bg-primary-container/10">
            <img
              src="/icons/mark-honey.png"
              alt="Kai"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-on-surface leading-tight">Kai</h1>
            <p className="text-[10px] text-on-surface-variant leading-tight">AKBai Business Partner</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-on-surface-variant hover:text-on-surface text-xs py-1.5 px-3 rounded-lg hover:bg-outline-variant/10 transition-colors"
          data-testid="sign-out-btn"
        >
          Mag-sign out
        </button>
      </header>

      <MessageList messages={messages} loading={loading} bottomRef={bottomRef} />

      <ChatInput onSend={handleSend} loading={loading} />
    </div>
  )
}
