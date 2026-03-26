import type { ChatMessage } from './chat-interface'
import FlagButton from './flag-button'

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div
        className="flex justify-end"
        data-testid={`message-user-${message.id}`}
      >
        <div className="max-w-[78%] bg-secondary-container rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-on-secondary-container leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
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
          src="https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/AKBai_Mark_Honey.png"
          alt="Kai"
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="max-w-[85%]">
        <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <FlagButton messageId={message.id} />
      </div>
    </div>
  )
}
