'use client';

import { RevenueUp, RevenueDown } from '@/components/illustrations/svg';
import Money from '@/components/ui/money';

interface ExpensesSummaryProps {
  totalIncome: number;   // centavos
  totalExpenses: number; // centavos
  net: number;           // centavos
}

export default function ExpensesSummary({ totalIncome, totalExpenses, net }: ExpensesSummaryProps) {
  return (
    <div data-testid="expenses-summary">
      {/* Net amount — big number. Always teal + tabular; the +/- sign carries polarity. */}
      <div className="mb-3">
        <p className="wp-label mb-1">Net ngayong buwan</p>
        <div data-testid="net-amount">
          <Money centavos={net} size="lg" signed />
        </div>
      </div>

      {/* Income / Expenses row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <RevenueUp size={14} />
            <span className="text-on-surface-variant text-xs">Kita</span>
          </div>
          <div data-testid="total-income">
            <Money centavos={totalIncome} size="sm" />
          </div>
        </div>

        <div className="w-px bg-outline-variant/20" />

        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <RevenueDown size={14} />
            <span className="text-on-surface-variant text-xs">Gastos</span>
          </div>
          <div data-testid="total-expenses">
            <Money centavos={totalExpenses} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
