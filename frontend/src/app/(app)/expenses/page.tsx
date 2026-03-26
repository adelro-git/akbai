'use client';

/**
 * Saan Napunta? — Expenses Dashboard (Build 4 — Sprint 7)
 *
 * Monthly expenses/income view with:
 * - Month picker navigation
 * - Net income/expenses summary
 * - Category breakdown bar chart
 * - Transaction list grouped by date
 * - Add transaction FAB
 *
 * Client component because it manages month state and fetches data dynamically.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { getManilaToday } from '@/lib/timezone';
import { trackExpenseDeleted } from '@/lib/posthog/events';
import MonthPicker from '@/components/expenses/month-picker';
import ExpensesSummary from '@/components/expenses/expenses-summary';
import CategoryChart from '@/components/expenses/category-chart';
import TransactionList from '@/components/expenses/transaction-list';
import AddTransactionModal from '@/components/expenses/add-transaction-modal';

// ============================================================
// Types matching API response
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
// Page Component
// ============================================================

export default function ExpensesPage() {
  // Current month — default to today's month
  const today = getManilaToday(); // YYYY-MM-DD
  const defaultMonth = today.slice(0, 7); // YYYY-MM

  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch expenses for current month
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/expenses?month=${month}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang data.');
        setLoading(false);
        return;
      }

      setData(json.data);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Delete transaction handler
  const handleDelete = useCallback(async (txId: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${txId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        trackExpenseDeleted();
        fetchExpenses(); // Refresh list
      }
    } catch {
      // Silent fail — user can retry
    }
  }, [fetchExpenses]);

  // After adding a new transaction
  const handleAddSuccess = useCallback(() => {
    setIsAddOpen(false);
    fetchExpenses();
  }, [fetchExpenses]);

  // Filter expense-only categories for the chart
  const expenseCategories = data?.summary.by_category.filter((c) => {
    // Only show expense categories in the chart
    const tx = data.transactions.find((t) => t.category === c.category);
    return tx?.type === 'expense';
  }) ?? [];

  return (
    <div
      className="min-h-dvh bg-background pb-24"
      data-testid="expenses-page"
    >
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-on-surface text-xl font-extrabold mb-4">
          Saan Napunta?
        </h1>
        <MonthPicker month={month} onMonthChange={setMonth} />
      </header>

      {/* Loading state */}
      {loading && (
        <div className="px-4 py-10 text-center">
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="px-4 py-10 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={fetchExpenses}
            className="mt-3 text-primary text-sm font-semibold"
            type="button"
          >
            Subukan muli
          </button>
        </div>
      )}

      {/* Data loaded */}
      {data && !loading && !error && (
        <div className="px-4 space-y-5">
          {/* Summary card */}
          <ExpensesSummary
            totalIncome={data.summary.total_income}
            totalExpenses={data.summary.total_expenses}
            net={data.summary.net}
          />

          {/* Category breakdown */}
          {expenseCategories.length > 0 && (
            <section>
              <h2 className="text-on-surface text-sm font-bold mb-3">
                Breakdown ng Gastos
              </h2>
              <CategoryChart data={expenseCategories} />
            </section>
          )}

          {/* Transaction list */}
          <section>
            <h2 className="text-on-surface text-sm font-bold mb-3">
              Mga Transactions
            </h2>
            <TransactionList
              transactions={data.transactions}
              onDelete={handleDelete}
            />
          </section>
        </div>
      )}

      {/* FAB — Add Transaction */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
        aria-label="Add transaction"
        data-testid="add-transaction-fab"
        type="button"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
