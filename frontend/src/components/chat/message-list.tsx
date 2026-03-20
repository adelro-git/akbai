import { RefObject } from 'react'
import ChatBubble from './chat-bubble'
import type { ChatMessage } from './chat-interface'

interface MessageListProps {
  messages: ChatMessage[]
  loading: boolean
  bottomRef: RefObject<HTMLDivElement>
}

export default function MessageList({ messages, loading, bottomRef }: MessageListProps) {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      data-testid="message-list"
    >
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}

      {loading && (
        <div className="flex items-end gap-2" data-testid="loading-indicator">
          <div className="w-7 h-7 rounded-full bg-honey/10 ring-1 ring-honey/30 flex-shrink-0 flex items-center justify-center">
            <img
              src="https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/AKBai_Mark_Honey.png"
              alt="Kai"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="bg-kai-card rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="flex gap-1 items-center h-4">
              <div className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-honey animate-bounce" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
