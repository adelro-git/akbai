'use client';

/**
 * Reply Input — Customer message input + context + tone selector (Build 7)
 *
 * Uses useRef + onClick pattern (React 19 controlled input bug).
 * Mobile-first layout with touch-friendly tone selector buttons.
 */

import { useRef } from 'react';
import { Send } from 'lucide-react';
import type { ReplyTone } from '@/lib/reply-drafter/types';

// ============================================================
// Tone Options
// ============================================================

const TONE_OPTIONS: { value: ReplyTone; label: string; emoji: string }[] = [
  { value: 'friendly', label: 'Friendly', emoji: '😊' },
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '✌️' },
];

// ============================================================
// Props
// ============================================================

interface ReplyInputProps {
  onSubmit: (customerMessage: string, context: string, tone: ReplyTone) => void;
  loading: boolean;
  selectedTone: ReplyTone;
  onToneChange: (tone: ReplyTone) => void;
}

// ============================================================
// Component
// ============================================================

export default function ReplyInput({
  onSubmit,
  loading,
  selectedTone,
  onToneChange,
}: ReplyInputProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const message = messageRef.current?.value?.trim() ?? '';
    const context = contextRef.current?.value?.trim() ?? '';

    if (!message) return;

    onSubmit(message, context, selectedTone);
  };

  return (
    <div className="space-y-4" data-testid="reply-input">
      {/* Customer Message */}
      <div>
        <label
          htmlFor="customer-message"
          className="block text-on-surface text-sm font-bold mb-1.5"
        >
          Customer message
        </label>
        <textarea
          id="customer-message"
          ref={messageRef}
          placeholder="I-paste dito ang message ng customer mo..."
          rows={4}
          maxLength={2000}
          disabled={loading}
          className="w-full rounded-xl bg-surface-container p-3 text-on-surface text-sm placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-primary-container/50 disabled:opacity-50"
          data-testid="customer-message-input"
        />
      </div>

      {/* Optional Context */}
      <div>
        <label
          htmlFor="reply-context"
          className="block text-on-surface text-sm font-bold mb-1.5"
        >
          Ano ang background nito?{' '}
          <span className="font-normal text-outline">(optional)</span>
        </label>
        <textarea
          id="reply-context"
          ref={contextRef}
          placeholder="e.g., Regular customer, nag-order ng 2 boxes ng cupcakes kahapon"
          rows={2}
          maxLength={500}
          disabled={loading}
          className="w-full rounded-xl bg-surface-container p-3 text-on-surface text-sm placeholder:text-outline resize-none focus:outline-none focus:ring-2 focus:ring-primary-container/50 disabled:opacity-50"
          data-testid="reply-context-input"
        />
      </div>

      {/* Tone Selector */}
      <div>
        <p className="text-on-surface text-sm font-bold mb-2">Tone ng reply</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Reply tone">
          {TONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selectedTone === option.value}
              onClick={() => onToneChange(option.value)}
              disabled={loading}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                selectedTone === option.value
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              } disabled:opacity-50`}
              data-testid={`tone-${option.value}`}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-container text-on-primary font-bold rounded-xl py-3.5 text-sm transition-colors hover:bg-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        data-testid="draft-reply-button"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            Si Kai ay nagdi-draft...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Draft Reply
          </>
        )}
      </button>
    </div>
  );
}
