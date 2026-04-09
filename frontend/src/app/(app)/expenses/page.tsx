'use client';

/**
 * Saan Napunta? — Expenses Dashboard (Build 4 — Sprint 7)
 *
 * Responsive:
 * - Mobile: Single column, compact, bottom nav
 * - Desktop: 2-column (summary+chart left, transactions right), sidebar nav
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { PageBackground } from '@/components/ui/page-background';
import { getManilaToday } from '@/lib/timezone';
import { trackExpenseDeleted } from '@/lib/posthog/events';
import MonthPicker from '@/components/expenses/month-picker';
import ExpensesSummary from '@/components/expenses/expenses-summary';
import CategoryChart from '@/components/expenses/category-chart';
import TransactionList from '@/components/expenses/transaction-list';
import AddTransactionModal from '@/components/expenses/add-transaction-modal';

// ============================================================
// Types
// ============================================================

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  source: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface ExpensesData {
  transactions: Transaction[];
  summary: {
    total_income: number;
    total_expenses: number;
    net: number;
    by_category: CategorySummary[];
  };
}

// ============================================================
// Page
// ============================================================

export default function ExpensesPage() {
  const today = getManilaToday();
  const defaultMonth = today.slice(0, 7);

  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses?month=${month}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang data.');
        return;
      }
      setData(json.data);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = useCallback(async (txId: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${txId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { trackExpenseDeleted(); fetchExpenses(); }
    } catch { /* retry */ }
  }, [fetchExpenses]);

  const handleAddSuccess = useCallback(() => {
    setIsAddOpen(false);
    fetchExpenses();
  }, [fetchExpenses]);

  const expenseCategories = data?.summary.by_category.filter((c) => {
    const tx = data.transactions.find((t) => t.category === c.category);
    return tx?.type === 'expense';
  }) ?? [];

  const hasData = data && data.transactions.length > 0;

  return (
    <PageBackground variant="expenses">
    <div className="min-h-dvh pb-20 md:pb-6" data-testid="expenses-page">
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 md:px-8 md:pt-8 md:pb-5 md:flex md:items-center md:justify-between">
        <h1 className="text-on-surface text-lg md:text-2xl font-extrabold mb-3 md:mb-0">
          Saan Napunta?
        </h1>
        <div className="md:w-64">
          <MonthPicker month={month} onMonthChange={setMonth} />
        </div>
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={fetchExpenses} className="mt-2 text-primary text-sm font-semibold" type="button">
            Subukan muli
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {data && !loading && !error && !hasData && (
        <div className="px-4 py-10 text-center md:py-20">
          <div className="flex justify-center mb-3">
            <IllustrationWrapper
              src="empty-states/no-expenses.webp"
              alt="No expenses tracked yet"
              category="empty-state"
            />
          </div>
          <p className="text-on-surface text-sm font-semibold mb-1">
            Wala pang transactions
          </p>
          <p className="text-on-surface-variant text-xs mb-4">
            I-record ang gastos o kita mo para makita ang breakdown dito.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl px-5 py-2.5"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Mag-add ng transaction
          </button>
        </div>
      )}

      {/* ── Data: 2-col on desktop, stacked on mobile ── */}
      {data && !loading && !error && hasData && (
        <div className="px-4 md:px-8 md:grid md:grid-cols-[minmax(300px,400px)_1fr] md:gap-6 md:items-start">
          {/* Left column: Summary + Chart */}
          <div className="space-y-3 mb-4 md:mb-0 md:sticky md:top-6">
            <div className="bg-surface-container-low rounded-2xl p-4">
              <ExpensesSummary
                totalIncome={data.summary.total_income}
                totalExpenses={data.summary.total_expenses}
                net={data.summary.net}
              />

              {expenseCategories.length > 0 && (
                <div className="mt-4 pt-3 border-t border-outline-variant/10">
                  <p className="text-on-surface text-xs font-bold mb-2.5 uppercase tracking-wider">
                    Breakdown ng Gastos
                  </p>
                  <CategoryChart data={expenseCategories} />
                </div>
              )}
            </div>

            {/* Desktop: Add button inline */}
            <button
              onClick={() => setIsAddOpen(true)}
              className="hidden md:flex items-center justify-center gap-2 w-full bg-primary-container text-on-primary font-semibold rounded-xl py-3 transition-colors hover:bg-primary"
              type="button"
            >
              <Plus className="w-5 h-5" />
              Mag-add ng Transaction
            </button>
          </div>

          {/* Right column: Transaction list */}
          <div>
            <p className="text-on-surface text-xs font-bold mb-2 uppercase tracking-wider">
              Mga Transactions
            </p>
            <TransactionList
              transactions={data.transactions}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* ── Mobile FAB — above bottom nav ── */}
      {hasData && (
        <button
          onClick={() => setIsAddOpen(true)}
          className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 w-14 h-14 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
          aria-label="Add transaction"
          data-testid="add-transaction-fab"
          type="button"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ── Add Transaction Modal ── */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
    </PageBackground>
  );
}
