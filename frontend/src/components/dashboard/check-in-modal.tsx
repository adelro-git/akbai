'use client';

/**
 * Daily Check-In Modal — centered dialog for evening habit
 * Feature: Daily Check-In (Build 2) + Category prompt (Sprint 7)
 *
 * 2-step flow:
 *   Step 1: Mood + ₱ sales/expenses
 *   Step 2: "Saan napunta?" category picker (only if expenses entered)
 *   → POST /api/dashboard → modal closes → dashboard refreshes
 */

import { useRef, useState, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { pesoToCentavos, centavosToPeso } from '@/lib/utils/money';
import { trackDailyCheckInCompleted } from '@/lib/posthog/events';
import { EXPENSE_CATEGORIES } from '@/lib/expenses/categories';
import { KaCelebrating, KaHappy, KaThinking, KaConcerned } from '@/components/illustrations/svg';
import { CategoryIcon } from '@/lib/expenses/category-icons';

// ============================================================
// Mood Options
// ============================================================

const MOOD_OPTIONS: { value: string; icon: React.ReactNode; label: string }[] = [
  { value: 'bongga', icon: <KaCelebrating size={28} />, label: 'Bongga' },
  { value: 'okay', icon: <KaHappy size={28} />, label: 'Okay' },
  { value: 'steady', icon: <KaThinking size={28} />, label: 'Steady' },
  { value: 'hirap', icon: <KaConcerned size={28} />, label: 'Hirap' },
  { value: 'grabe', icon: <KaConcerned size={28} className="opacity-70" />, label: 'Grabe' },
];

// ============================================================
// Props
// ============================================================

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasExistingCheckIn?: boolean;
}

// ============================================================
// Component
// ============================================================

export default function CheckInModal({ isOpen, onClose, onSuccess, hasExistingCheckIn = false }: CheckInModalProps) {
  const salesRef = useRef<HTMLInputElement>(null);
  const expensesRef = useRef<HTMLInputElement>(null);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: category picker state
  const [step, setStep] = useState<1 | 2>(1);
  const [salesCentavos, setSalesCentavos] = useState<number | undefined>(undefined);
  const [expensesCentavos, setExpensesCentavos] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('other_expense');

  const resetForm = useCallback(() => {
    setSelectedMood(null);
    setIsSubmitting(false);
    setError(null);
    setStep(1);
    setSalesCentavos(undefined);
    setExpensesCentavos(0);
    setSelectedCategory('other_expense');
    if (salesRef.current) salesRef.current.value = '';
    if (expensesRef.current) expensesRef.current.value = '';
  }, []);

  // --- API call (plain function, not useCallback — avoids stale closure issues) ---
  async function doSubmit(
    sales: number | undefined,
    expenses: number | undefined,
    category: string,
    mood: string | null,
  ) {
    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {};
      if (mood) body.mood = mood;
      if (sales !== undefined) body.sales_amount = sales;
      if (expenses !== undefined) {
        body.expenses_amount = expenses;
        body.expense_category = category;
      }

      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi ma-save ang check-in. Subukan muli.');
        setIsSubmitting(false);
        return;
      }

      trackDailyCheckInCompleted(sales !== undefined, expenses !== undefined);
      resetForm();
      onSuccess();
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
      setIsSubmitting(false);
    }
  }

  // --- Step 1: Validate + either go to step 2 or submit ---
  const handleStep1 = useCallback(async () => {
    setError(null);

    const salesValue = salesRef.current?.value?.trim() ?? '';
    const expensesValue = expensesRef.current?.value?.trim() ?? '';

    const salesPeso = salesValue ? parseFloat(salesValue) : undefined;
    const expensesPeso = expensesValue ? parseFloat(expensesValue) : undefined;

    if (salesPeso !== undefined && (isNaN(salesPeso) || salesPeso < 0)) {
      setError('Hindi valid ang sales amount.');
      return;
    }
    if (expensesPeso !== undefined && (isNaN(expensesPeso) || expensesPeso < 0)) {
      setError('Hindi valid ang expenses amount.');
      return;
    }

    const savedSales = salesPeso ? pesoToCentavos(salesPeso) : undefined;
    setSalesCentavos(savedSales);

    // If expenses entered, go to step 2 for category
    if (expensesPeso && expensesPeso > 0) {
      setExpensesCentavos(pesoToCentavos(expensesPeso));
      setStep(2);
      return;
    }

    // No expenses — submit directly
    await doSubmit(savedSales, undefined, 'other_expense', selectedMood);
  }, [selectedMood]);

  // --- Step 2: Submit with category ---
  const handleStep2 = useCallback(async () => {
    await doSubmit(salesCentavos, expensesCentavos, selectedCategory, selectedMood);
  }, [salesCentavos, expensesCentavos, selectedCategory, selectedMood]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="check-in-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={handleClose}
        data-testid="check-in-backdrop"
      />

      {/* Centered dialog */}
      <div
        className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
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

        {/* ── STEP 1: Mood + Amounts ── */}
        {step === 1 && (
          <>
            <h2 className="text-on-surface text-lg font-bold mb-1">
              Kumusta ang araw mo?
            </h2>
            <p className="text-on-surface-variant text-xs mb-4">
              Quick check-in lang — 60 seconds!
            </p>

            {/* Overwrite warning */}
            {hasExistingCheckIn && (
              <div className="bg-primary-container/10 rounded-xl px-3 py-2.5 mb-4">
                <p className="text-on-surface text-xs font-semibold">
                  May check-in ka na for today.
                </p>
                <p className="text-on-surface-variant text-[11px]">
                  Ma-o-overwrite ang existing data kapag nag-save ka ulit.
                </p>
              </div>
            )}

            {/* Mood Selector */}
            <div className="mb-4">
              <p className="text-on-surface text-sm font-semibold mb-2">Mood ng negosyo</p>
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
                    <span className="flex items-center justify-center">
                      {mood.icon}
                    </span>
                    <span className="text-xs text-on-surface-variant">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Input */}
            <div className="mb-3">
              <label htmlFor="check-in-sales" className="block text-on-surface text-sm font-semibold mb-1.5">
                Sales ngayong araw
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">₱</span>
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

            {/* Expenses Input */}
            <div className="mb-4">
              <label htmlFor="check-in-expenses" className="block text-on-surface text-sm font-semibold mb-1.5">
                Gastos ngayong araw
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">₱</span>
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

            {/* Error */}
            {error && (
              <p className="text-destructive text-sm mb-3 text-center" data-testid="check-in-error">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleStep1}
              disabled={isSubmitting}
              className="w-full bg-primary-container text-on-primary font-semibold rounded-xl py-3.5 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="check-in-submit"
              type="button"
            >
              {isSubmitting ? 'Sine-save...' : 'Next'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </button>
          </>
        )}

        {/* ── STEP 2: Category Picker ── */}
        {step === 2 && (
          <>
            <h2 className="text-on-surface text-lg font-bold mb-1">
              Saan napunta ang gastos?
            </h2>
            <p className="text-on-surface-variant text-xs mb-4">
              {centavosToPeso(expensesCentavos)} — pumili ng category
            </p>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat.key
                      ? 'bg-primary-container/20 ring-2 ring-primary-container text-on-surface'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                  type="button"
                >
                  <CategoryIcon categoryKey={cat.key} size={16} />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-destructive text-sm mb-3 text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-surface-container text-on-surface-variant font-semibold rounded-xl py-3 transition-colors"
                type="button"
              >
                Back
              </button>
              <button
                onClick={handleStep2}
                disabled={isSubmitting}
                className="flex-1 bg-primary-container text-on-primary font-semibold rounded-xl py-3 transition-colors hover:bg-primary disabled:opacity-50"
                data-testid="check-in-save"
                type="button"
              >
                {isSubmitting ? 'Sine-save...' : 'I-save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
