import type { ChatMessage } from './chat-interface'

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div
        className="flex justify-end"
        data-testid={`message-user-${message.id}`}
      >
        <div className="max-w-[78%] bg-user-bubble rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-end gap-2"
      data-testid={`message-kai-${message.id}`}
    >
      <div className="w-7 h-7 rounded-full bg-honey/10 ring-1 ring-honey/30 flex-shrink-0 flex items-center justify-center">
        <img
          src="https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/AKBai_Mark_Honey.png"
          alt="Kai"
          className="w-5 h-5 object-contain"
        />
      </div>
      <div className="max-w-[78%] bg-kai-card rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  )
}
