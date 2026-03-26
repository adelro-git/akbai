'use client';

/**
 * FlagButton — "Flag as Wrong" button for assistant (Kai) messages
 * Design Gate 2: Trust Recovery — lets users report incorrect AI responses.
 *
 * Appears below assistant messages only. On click, opens a bottom-sheet
 * with reason selector + optional comment. Submits to POST /api/flag-as-wrong.
 *
 * Uses useRef + onClick pattern (React 19 convention).
 */

import { useState, useRef, useCallback } from 'react';
import { Flag, X } from 'lucide-react';

// ============================================================
// Reason options for flagging
// ============================================================

interface ReasonOption {
  value: string;
  label: string;
}

const FLAG_REASONS: ReasonOption[] = [
  { value: 'wrong_amount', label: 'Wrong amount' },
  { value: 'wrong_date', label: 'Wrong date' },
  { value: 'wrong_info', label: 'Wrong info' },
  { value: 'other', label: 'Iba pa' },
];

// ============================================================
// Component Props
// ============================================================

interface FlagButtonProps {
  messageId: string;
}

// ============================================================
// FlagButton Component
// ============================================================

export default function FlagButton({ messageId }: FlagButtonProps) {
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Reset form state ---
  const resetForm = useCallback(() => {
    setSelectedReason(null);
    setIsSubmitting(false);
    setError(null);
    if (commentRef.current) commentRef.current.value = '';
  }, []);

  // --- Open modal ---
  const handleOpen = useCallback(() => {
    if (submitted) return; // Already flagged this message
    setIsOpen(true);
  }, [submitted]);

  // --- Close modal ---
  const handleClose = useCallback(() => {
    resetForm();
    setIsOpen(false);
  }, [resetForm]);

  // --- Submit flag report ---
  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const commentValue = commentRef.current?.value?.trim() ?? '';

      const body: Record<string, string> = {
        message_id: messageId,
      };
      if (selectedReason) body.reason = selectedReason;
      if (commentValue) body.comment = commentValue;

      const res = await fetch('/api/flag-as-wrong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'May problema. Subukan muli.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmitted(true);
      resetForm();
      setIsOpen(false);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
      setIsSubmitting(false);
    }
  }, [messageId, selectedReason, resetForm]);

  // --- Already flagged state ---
  if (submitted) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-on-surface-variant/60 mt-1"
        data-testid="flag-submitted"
      >
        <Flag size={12} />
        Na-report na
      </span>
    );
  }

  return (
    <>
      {/* Flag trigger button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 text-xs text-on-surface-variant/50 hover:text-on-surface-variant mt-1 min-h-[44px] min-w-[44px] justify-center transition-colors"
        aria-label="Flag this message as wrong"
        data-testid="flag-button"
        type="button"
      >
        <Flag size={12} />
      </button>

      {/* Bottom-sheet modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          data-testid="flag-modal"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={handleClose}
            data-testid="flag-backdrop"
          />

          {/* Bottom sheet */}
          <div
            className="relative w-full max-w-md bg-surface-container-lowest rounded-t-2xl p-6 pb-8 animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-label="Flag as wrong"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
              aria-label="Close"
              data-testid="flag-close"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <h2 className="text-on-surface text-lg font-bold mb-1">
              Ano ang mali?
            </h2>
            <p className="text-on-surface-variant text-sm mb-5">
              Sabihin mo lang para ma-improve namin si Kai.
            </p>

            {/* --- Reason Selector (chips) --- */}
            <div className="mb-5">
              <p className="text-on-surface text-sm font-semibold mb-3">
                Reason
              </p>
              <div className="flex flex-wrap gap-2">
                {FLAG_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors min-h-[44px] ${
                      selectedReason === reason.value
                        ? 'bg-primary-container/20 ring-2 ring-primary-container text-on-surface'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                    data-testid={`flag-reason-${reason.value}`}
                    type="button"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {/* --- Comment Input (optional) --- */}
            <div className="mb-5">
              <label
                htmlFor={`flag-comment-${messageId}`}
                className="block text-on-surface text-sm font-semibold mb-1.5"
              >
                Dagdag na details (optional)
              </label>
              <textarea
                ref={commentRef}
                id={`flag-comment-${messageId}`}
                placeholder="Sabihin mo pa kung ano ang mali..."
                maxLength={500}
                rows={3}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container resize-none placeholder:text-on-surface-variant/50"
                data-testid="flag-comment"
              />
            </div>

            {/* --- Error Message --- */}
            {error && (
              <p
                className="text-destructive text-sm mb-3 text-center"
                data-testid="flag-error"
              >
                {error}
              </p>
            )}

            {/* --- Action Buttons --- */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-surface-container-high text-on-surface-variant font-semibold rounded-xl py-3.5 transition-colors min-h-[44px]"
                data-testid="flag-cancel"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary-container text-on-primary font-semibold rounded-xl py-3.5 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                data-testid="flag-submit"
                type="button"
              >
                {isSubmitting ? 'Nire-report...' : 'I-report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
