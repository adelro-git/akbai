'use client';

/**
 * Daily Check-In Modal — Bottom-sheet style modal for evening habit
 * Feature: Daily Check-In (Build 2 — Sprint 5)
 * Role: Capture mood + optional daily sales/expenses via 60-second flow
 *
 * Flow: User taps CTA → modal slides up → selects mood → enters ₱ amounts
 *       → submits → POST /api/dashboard → modal closes → dashboard refreshes
 *
 * Uses useRef + onClick pattern (React 19 convention, not onChange/onSubmit)
 * Money entered as pesos, converted to centavos before API call.
 */

import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { pesoToCentavos } from '@/lib/utils/money';
import { trackDailyCheckInCompleted } from '@/lib/posthog/events';

// ============================================================
// Mood Options — 5 emoji choices for business mood
// ============================================================

interface MoodOption {
  value: string;
  emoji: string;
  label: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: 'bongga', emoji: '🔥', label: 'Bongga' },
  { value: 'okay', emoji: '😊', label: 'Okay' },
  { value: 'steady', emoji: '😐', label: 'Steady' },
  { value: 'hirap', emoji: '😰', label: 'Hirap' },
  { value: 'grabe', emoji: '💀', label: 'Grabe' },
];

// ============================================================
// Component Props
// ============================================================

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================
// CheckInModal Component
// ============================================================

export default function CheckInModal({ isOpen, onClose, onSuccess }: CheckInModalProps) {
  const salesRef = useRef<HTMLInputElement>(null);
  const expensesRef = useRef<HTMLInputElement>(null);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Reset form state when modal opens/closes ---
  const resetForm = useCallback(() => {
    setSelectedMood(null);
    setIsSubmitting(false);
    setError(null);
    if (salesRef.current) salesRef.current.value = '';
    if (expensesRef.current) expensesRef.current.value = '';
  }, []);

  // --- Submit check-in via POST /api/dashboard ---
  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Read values from refs (useRef + onClick pattern)
      const salesValue = salesRef.current?.value?.trim() ?? '';
      const expensesValue = expensesRef.current?.value?.trim() ?? '';

      // Convert peso inputs to centavos
      const salesPeso = salesValue ? parseFloat(salesValue) : undefined;
      const expensesPeso = expensesValue ? parseFloat(expensesValue) : undefined;

      // Validate: no negative values
      if (salesPeso !== undefined && (isNaN(salesPeso) || salesPeso < 0)) {
        setError('Hindi valid ang sales amount.');
        setIsSubmitting(false);
        return;
      }
      if (expensesPeso !== undefined && (isNaN(expensesPeso) || expensesPeso < 0)) {
        setError('Hindi valid ang expenses amount.');
        setIsSubmitting(false);
        return;
      }

      const body: Record<string, unknown> = {};
      if (selectedMood) body.mood = selectedMood;
      if (salesPeso !== undefined) body.sales_amount = pesoToCentavos(salesPeso);
      if (expensesPeso !== undefined) body.expenses_amount = pesoToCentavos(expensesPeso);

      const res = await fetch('/api/dashboard', {
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

      // Track PostHog event
      trackDailyCheckInCompleted(
        salesPeso !== undefined,
        expensesPeso !== undefined,
      );

      resetForm();
      onSuccess();
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
      setIsSubmitting(false);
    }
  }, [selectedMood, resetForm, onSuccess]);

  // --- Close handler ---
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      data-testid="check-in-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={handleClose}
        data-testid="check-in-backdrop"
      />

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-t-2xl p-6 pb-8 animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Daily check-in"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
          aria-label="Close"
          data-testid="check-in-close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <h2 className="text-on-surface text-lg font-bold mb-1">
          Kumusta ang araw mo?
        </h2>
        <p className="text-on-surface-variant text-sm mb-5">
          Quick check-in lang — 60 seconds!
        </p>

        {/* --- Mood Selector --- */}
        <div className="mb-5">
          <p className="text-on-surface text-sm font-semibold mb-3">Mood ng negosyo</p>
          <div className="flex gap-2 justify-between">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl min-w-[56px] transition-colors ${
                  selectedMood === mood.value
                    ? 'bg-primary-container/20 ring-2 ring-primary-container'
                    : 'bg-surface-container'
                }`}
                data-testid={`mood-${mood.value}`}
                type="button"
              >
                <span className="text-2xl" role="img" aria-label={mood.label}>
                  {mood.emoji}
                </span>
                <span className="text-xs text-on-surface-variant">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- Sales Input --- */}
        <div className="mb-4">
          <label
            htmlFor="check-in-sales"
            className="block text-on-surface text-sm font-semibold mb-1.5"
          >
            Sales ngayong araw
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
              ₱
            </span>
            <input
              ref={salesRef}
              id="check-in-sales"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-surface-container-low rounded-xl pl-8 pr-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container"
              data-testid="check-in-sales"
            />
          </div>
        </div>

        {/* --- Expenses Input --- */}
        <div className="mb-5">
          <label
            htmlFor="check-in-expenses"
            className="block text-on-surface text-sm font-semibold mb-1.5"
          >
            Gastos ngayong araw
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
              ₱
            </span>
            <input
              ref={expensesRef}
              id="check-in-expenses"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-surface-container-low rounded-xl pl-8 pr-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container"
              data-testid="check-in-expenses"
            />
          </div>
        </div>

        {/* --- Error Message --- */}
        {error && (
          <p className="text-error text-sm mb-3 text-center" data-testid="check-in-error">
            {error}
          </p>
        )}

        {/* --- Submit Button --- */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-container text-on-primary font-semibold rounded-xl py-3.5 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="check-in-submit"
          type="button"
        >
          {isSubmitting ? 'Sine-save...' : 'I-save ang check-in'}
        </button>
      </div>
    </div>
  );
}
