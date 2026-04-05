'use client';

import { RevenueUp, RevenueDown } from '@/components/illustrations/svg';
import { centavosToPeso } from '@/lib/utils/money';

interface ExpensesSummaryProps {
  totalIncome: number;   // centavos
  totalExpenses: number; // centavos
  net: number;           // centavos
}

export default function ExpensesSummary({ totalIncome, totalExpenses, net }: ExpensesSummaryProps) {
  const isPositive = net > 0;
  const isNeutral = net === 0;

  return (
    <div data-testid="expenses-summary">
      {/* Net amount — big number */}
      <div className="mb-3">
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">
          Net this month
        </p>
        <p
          className={`text-2xl font-extrabold ${
            isNeutral
              ? 'text-on-surface'
              : isPositive
                ? 'text-tertiary'
                : 'text-destructive'
          }`}
          data-testid="net-amount"
        >
          {isPositive ? '+' : ''}{centavosToPeso(net)}
        </p>
      </div>

      {/* Income / Expenses row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <RevenueUp size={14} />
            <span className="text-on-surface-variant text-xs">Kita</span>
          </div>
          <p className="text-on-surface text-sm font-bold" data-testid="total-income">
            {centavosToPeso(totalIncome)}
          </p>
        </div>

        <div className="w-px bg-outline-variant/20" />

        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <RevenueDown size={14} />
            <span className="text-on-surface-variant text-xs">Gastos</span>
          </div>
          <p className="text-on-surface text-sm font-bold" data-testid="total-expenses">
            {centavosToPeso(totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
}
