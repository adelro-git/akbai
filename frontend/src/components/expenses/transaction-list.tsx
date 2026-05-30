'use client';

/**
 * Transaction List — displays individual transactions grouped by date.
 * Taglish labels, centavo→peso display, category badges.
 */

import { Trash2 } from 'lucide-react';
import Money from '@/components/ui/money';
import { getCategoryLabel } from '@/lib/expenses/categories';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  source: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', weekday: 'short' });
}

function sourceLabel(source: string): string | null {
  if (source === 'check_in') return 'Check-in';
  if (source === 'ocr') return 'Scanned';
  return null;
}

export default function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center" data-testid="transaction-list-empty">
        <p className="text-on-surface-variant text-sm">
          Wala pang transactions ngayong buwan.
        </p>
        <p className="text-outline text-xs mt-1">
          Mag-add ng gastos o kita para makita dito.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const existing = grouped.get(tx.transaction_date);
    if (existing) {
      existing.push(tx);
    } else {
      grouped.set(tx.transaction_date, [tx]);
    }
  }

  return (
    <div className="space-y-4" data-testid="transaction-list">
      {Array.from(grouped.entries()).map(([date, txns]) => (
        <div key={date}>
          <p className="text-on-surface-variant text-xs font-semibold mb-2 uppercase tracking-wider">
            {formatDateLabel(date)}
          </p>
          <div className="space-y-1.5">
            {txns.map((tx) => {
              const isIncome = tx.type === 'income';
              const badge = sourceLabel(tx.source);

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 min-h-[52px]"
                  data-testid={`tx-row-${tx.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-on-surface text-sm font-semibold truncate">
                        {getCategoryLabel(tx.category)}
                      </p>
                      {badge && (
                        <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high rounded-md px-1.5 py-0.5">
                          {badge}
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-on-surface-variant text-xs truncate mt-0.5">
                        {tx.description}
                      </p>
                    )}
                  </div>

                  <Money
                    centavos={isIncome ? tx.amount : -tx.amount}
                    size="sm"
                    signed
                    countUp={false}
                  />

                  {onDelete && tx.source === 'manual' && (
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-outline hover:text-destructive hover:bg-error-container/30 transition-colors"
                      aria-label="Delete transaction"
                      data-testid={`tx-delete-${tx.id}`}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
