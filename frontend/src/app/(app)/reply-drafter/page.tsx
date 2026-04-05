'use client';

/**
 * Reply Drafter Page (Build 7)
 *
 * Users paste a customer message and Kai generates 2 reply options.
 * Phase 1: manual copy-paste into Messenger/Viber/WhatsApp.
 *
 * Mobile-first layout following the expenses page pattern.
 */

import { useState, useCallback } from 'react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import ReplyInput from '@/components/reply-drafter/reply-input';
import ReplyResults from '@/components/reply-drafter/reply-results';
import type { ReplyTone, ReplyOption } from '@/lib/reply-drafter/types';

// ============================================================
// Page
// ============================================================

export default function ReplyDrafterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [selectedTone, setSelectedTone] = useState<ReplyTone>('friendly');

  const handleSubmit = useCallback(
    async (customerMessage: string, context: string, tone: ReplyTone) => {
      setLoading(true);
      setError(null);
      setReplies([]);
      setDisclaimer('');

      try {
        const res = await fetch('/api/reply-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerMessage,
            context: context || undefined,
            tone,
          }),
        });

        const json = await res.json();

        if (!json.success) {
          setError(json.error?.message_tl ?? 'Hindi ma-generate ang reply. Subukan muli.');
          return;
        }

        setReplies(json.data.replies);
        setDisclaimer(json.data.disclaimer);
      } catch {
        setError('Hindi makapag-connect. Check ang internet mo.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <div
      className="min-h-dvh bg-background pb-20 md:pb-6"
      data-testid="reply-drafter-page"
    >
      {/* Header */}
      <header className="px-4 pt-5 pb-3 md:px-8 md:pt-8 md:pb-5">
        <h1 className="text-on-surface text-lg md:text-2xl font-extrabold">
          Reply Drafter
        </h1>
        <p className="text-on-surface-variant text-sm mt-0.5">
          I-paste ang message ng customer mo, at si Kai ay mag-draft ng reply para sa&apos;yo!
        </p>
      </header>

      {/* Content — 2-col on desktop */}
      <div className="px-4 md:px-8 md:grid md:grid-cols-[minmax(300px,400px)_1fr] md:gap-6 md:items-start">
        {/* Left: Input form */}
        <div className="bg-surface-container-low rounded-2xl p-4 mb-4 md:mb-0 md:sticky md:top-6">
          <ReplyInput
            onSubmit={handleSubmit}
            loading={loading}
            selectedTone={selectedTone}
            onToneChange={setSelectedTone}
          />
        </div>

        {/* Right: Results */}
        <div>
          {/* Error State */}
          {error && !loading && (
            <div className="bg-destructive/10 rounded-2xl p-4 mb-3" data-testid="reply-error">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          <ReplyResults
            replies={replies}
            disclaimer={disclaimer}
            loading={loading}
          />

          {/* Empty State — shown when no replies yet and not loading */}
          {!loading && replies.length === 0 && !error && (
            <div className="text-center py-10 md:py-20">
              <div className="flex justify-center mb-3">
                <IllustrationWrapper
                  src="empty-states/no-replies.webp"
                  alt="Wala pang mga draft na reply"
                  category="empty-state"
                />
              </div>
              <p className="text-on-surface text-sm font-semibold mb-1">
                Wala pang draft
              </p>
              <p className="text-on-surface-variant text-xs">
                I-paste ang customer message sa kaliwa at i-click ang &quot;Draft Reply&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
