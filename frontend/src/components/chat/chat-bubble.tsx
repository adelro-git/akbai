import type { ChatMessage } from './chat-interface'
import FlagButton from './flag-button'
import { formatManilaDate } from '@/lib/timezone'
import { Clock } from 'lucide-react'

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

interface ChatBubbleProps {
  message: ChatMessage
  /**
   * Warm Precision (spec §6): the first/greeting Kai bubble in a thread uses
   * the secondary-container soft fill with no hairline. Caller passes this for
   * the first assistant message; defaults false (standard white Kai bubble).
   */
  warm?: boolean
}

export default function ChatBubble({ message, warm = false }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const timestamp = formatTimestamp(message.created_at)

  if (isUser) {
    return (
      <div
        className="flex flex-col items-end"
        data-testid={`message-user-${message.id}`}
      >
        {/* Warm Precision (spec §6): user bubble = honey gradient + white ink,
            20px radius with a 6px bottom-right notch. Replaces the old
            secondary-container (orange-role) fill per the §1g role swap. */}
        <div className="max-w-[78%] bg-gradient-to-br from-grad-from to-grad-to rounded-[20px] rounded-br-[6px] px-4 py-2.5 shadow-el-2">
          <p className="text-[15px] leading-[21px] font-medium text-on-primary whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        {(timestamp || message.queued) && (
          <div className="flex items-center gap-1 mt-1 mr-1">
            {message.queued && (
              <span
                className="inline-flex items-center text-ink-faint"
                title="Naka-queue — i-send pag may connection"
                aria-label="Naka-queue — i-send pag may connection"
                data-testid="message-queued-indicator"
              >
                <Clock size={12} aria-hidden="true" />
              </span>
            )}
            {timestamp && (
              <span className="text-[10px] text-on-surface-variant" data-testid="message-timestamp">
                {timestamp}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-start gap-2"
      data-testid={`message-kai-${message.id}`}
    >
      <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-container/10 ring-1 ring-primary-container/30 flex-shrink-0 flex items-center justify-center mt-0.5">
        <img
          src="/icons/mark-honey.png"
          alt="Kai"
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="flex flex-col max-w-[85%]">
        {/* Warm Precision (spec §6): Kai bubble = white (surface-container-lowest)
            + 1px ghost hairline via inset ring (No-Line Rule), 20px radius with a
            6px bottom-left notch, 15/21 text. Warm/greeting variant = pale honey
            secondary-container fill, no hairline. */}
        <div
          className={
            warm
              ? 'bg-secondary-container rounded-[20px] rounded-bl-[6px] px-4 py-2.5'
              : 'bg-surface-container-lowest ring-1 ring-inset ring-outline-variant/[0.24] rounded-[20px] rounded-bl-[6px] px-4 py-2.5'
          }
        >
          <p className="text-[15px] leading-[21px] text-on-surface whitespace-pre-wrap break-words">
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
