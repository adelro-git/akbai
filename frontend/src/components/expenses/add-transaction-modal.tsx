'use client';

/**
 * Add Transaction Modal — bottom-sheet for manual expense/income entry.
 * Uses useRef + onClick pattern (React 19 convention).
 * Money entered as pesos, converted to centavos before API call.
 */

import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { pesoToCentavos } from '@/lib/utils/money';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/expenses/categories';
import { getManilaToday } from '@/lib/timezone';
import { trackExpenseAdded } from '@/lib/posthog/events';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'expense' | 'income';
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'expense',
}: AddTransactionModalProps) {
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const [txType, setTxType] = useState<'expense' | 'income'>(defaultType);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const resetForm = useCallback(() => {
    setTxType(defaultType);
    setSelectedCategory(null);
    setIsSubmitting(false);
    setError(null);
    setShowDatePicker(false);
    if (amountRef.current) amountRef.current.value = '';
    if (descriptionRef.current) descriptionRef.current.value = '';
    if (dateRef.current) dateRef.current.value = '';
  }, [defaultType]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const amountStr = amountRef.current?.value?.trim() ?? '';
      const description = descriptionRef.current?.value?.trim() ?? '';
      const dateVal = dateRef.current?.value?.trim() ?? '';

      // Validate amount
      if (!amountStr) {
        setError('Kailangan ng amount.');
        setIsSubmitting(false);
        return;
      }
      const amountPeso = parseFloat(amountStr);
      if (isNaN(amountPeso) || amountPeso <= 0) {
        setError('Hindi valid ang amount.');
        setIsSubmitting(false);
        return;
      }

      // Validate category
      if (!selectedCategory) {
        setError('Pumili ng category.');
        setIsSubmitting(false);
        return;
      }

      const body: Record<string, unknown> = {
        type: txType,
        amount: pesoToCentavos(amountPeso),
        category: selectedCategory,
        source: 'manual',
      };

      if (description) body.description = description;
      if (dateVal) body.transaction_date = dateVal;

      const res = await fetch('/api/expenses', {
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
      trackExpenseAdded(txType, selectedCategory);

      resetForm();
      onSuccess();
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
      setIsSubmitting(false);
    }
  }, [txType, selectedCategory, resetForm, onSuccess]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="add-transaction-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={handleClose}
        data-testid="add-transaction-backdrop"
      />

      {/* Centered dialog */}
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Add transaction"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant"
          aria-label="Close"
          data-testid="add-transaction-close"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <h2 className="text-on-surface text-lg font-bold mb-1">
          Mag-add ng Transaction
        </h2>
        <p className="text-on-surface-variant text-xs mb-4">
          I-record ang gastos o kita mo
        </p>

        {/* Type toggle */}
        <div className="flex gap-2 mb-4" data-testid="type-toggle">
          <button
            onClick={() => { setTxType('expense'); setSelectedCategory(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              txType === 'expense'
                ? 'bg-primary-container text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
            type="button"
            data-testid="type-expense"
          >
            Gastos
          </button>
          <button
            onClick={() => { setTxType('income'); setSelectedCategory(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              txType === 'income'
                ? 'bg-tertiary-container text-on-tertiary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
            type="button"
            data-testid="type-income"
          >
            Kita
          </button>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <label
            htmlFor="tx-amount"
            className="block text-on-surface text-sm font-semibold mb-1.5"
          >
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
              ₱
            </span>
            <input
              ref={amountRef}
              id="tx-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-surface-container-low rounded-xl pl-8 pr-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container"
              data-testid="tx-amount"
            />
          </div>
        </div>

        {/* Category selector */}
        <div className="mb-3">
          <p className="text-on-surface text-sm font-semibold mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2" data-testid="category-selector">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-primary-container/20 ring-2 ring-primary-container text-on-surface'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
                type="button"
                data-testid={`cat-${cat.key}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description input */}
        <div className="mb-3">
          <label
            htmlFor="tx-description"
            className="block text-on-surface text-sm font-semibold mb-1.5"
          >
            Description (optional)
          </label>
          <input
            ref={descriptionRef}
            id="tx-description"
            type="text"
            maxLength={500}
            placeholder="e.g., Bigas sa palengke"
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container"
            data-testid="tx-description"
          />
        </div>

        {/* Date — defaults to today, always visible */}
        <div className="mb-4">
          <label
            htmlFor="tx-date"
            className="block text-on-surface text-sm font-semibold mb-1.5"
          >
            Petsa
          </label>
          <input
            ref={dateRef}
            id="tx-date"
            type="date"
            defaultValue={getManilaToday()}
            className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary-container"
            data-testid="tx-date"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-destructive text-sm mb-3 text-center" data-testid="tx-error">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-container text-on-primary font-semibold rounded-xl py-3.5 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="tx-submit"
          type="button"
        >
          {isSubmitting ? 'Sine-save...' : 'I-save'}
        </button>
      </div>
    </div>
  );
}
