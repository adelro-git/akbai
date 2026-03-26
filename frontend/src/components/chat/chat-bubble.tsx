import type { ChatMessage } from './chat-interface'
import FlagButton from './flag-button'
import { formatManilaDate } from '@/lib/timezone'

/**
 * Format a message timestamp for display.
 * Uses Manila timezone (UTC+8) and 12-hour format.
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return formatManilaDate(date, 'h:mm a')
  } catch {
    return ''
  }
}

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const timestamp = formatTimestamp(message.created_at)

  if (isUser) {
    return (
      <div
        className="flex flex-col items-end"
        data-testid={`message-user-${message.id}`}
      >
        <div className="max-w-[78%] bg-secondary-container rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-on-secondary-container leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        {timestamp && (
          <span className="text-[10px] text-on-surface-variant mt-1 mr-1" data-testid="message-timestamp">
            {timestamp}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-start gap-2"
      data-testid={`message-kai-${message.id}`}
    >
      <div className="w-7 h-7 rounded-full bg-primary-container/10 ring-1 ring-primary-container/30 flex-shrink-0 flex items-center justify-center mt-0.5">
        <img
          src="/icons/mark-honey.png"
          alt="Kai"
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="flex flex-col max-w-[85%]">
        <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <FlagButton messageId={message.id} />
        {timestamp && (
          <span className="text-[10px] text-on-surface-variant mt-1 ml-1" data-testid="message-timestamp">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  )
}
