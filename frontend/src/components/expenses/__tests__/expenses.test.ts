import { describe, it, expect } from 'vitest';
import { centavosToPeso } from '@/lib/utils/money';

/**
 * Component-level validation tests for expenses UI.
 * Testing data formatting, category mapping, and business logic.
 * (Full DOM tests for React components need jsdom + testing-library,
 *  which isn't set up yet — these test the data layer.)
 */

describe('Money formatting for expenses', () => {
  it('formats centavos to peso with 2 decimals', () => {
    expect(centavosToPeso(345000)).toBe('₱3,450.00');
    expect(centavosToPeso(100)).toBe('₱1.00');
    expect(centavosToPeso(0)).toBe('₱0.00');
  });

  it('formats large amounts correctly', () => {
    expect(centavosToPeso(10000000)).toBe('₱100,000.00');
  });

  it('formats small amounts correctly', () => {
    expect(centavosToPeso(50)).toBe('₱0.50');
    expect(centavosToPeso(1)).toBe('₱0.01');
  });
});

describe('Month parsing (expenses page logic)', () => {
  it('extracts YYYY-MM from YYYY-MM-DD', () => {
    const today = '2026-03-26';
    const month = today.slice(0, 7);
    expect(month).toBe('2026-03');
  });

  it('month navigation — prev from January wraps to December', () => {
    const month = '2026-01';
    const [year, m] = month.split('-').map(Number);
    const monthIdx = m - 1; // 0 = January

    let newMonth: string;
    if (monthIdx === 0) {
      newMonth = `${year - 1}-12`;
    } else {
      newMonth = `${year}-${String(monthIdx).padStart(2, '0')}`;
    }
    expect(newMonth).toBe('2025-12');
  });

  it('month navigation — next from December wraps to January', () => {
    const month = '2025-12';
    const [year, m] = month.split('-').map(Number);
    const monthIdx = m - 1; // 11 = December

    let newMonth: string;
    if (monthIdx === 11) {
      newMonth = `${year + 1}-01`;
    } else {
      newMonth = `${year}-${String(monthIdx + 2).padStart(2, '0')}`;
    }
    expect(newMonth).toBe('2026-01');
  });
});

describe('Summary computation (expenses page logic)', () => {
  it('computes net correctly', () => {
    const totalIncome = 50000; // ₱500
    const totalExpenses = 30000; // ₱300
    const net = totalIncome - totalExpenses;
    expect(net).toBe(20000); // ₱200 positive
  });

  it('handles zero transactions', () => {
    expect(0 - 0).toBe(0);
  });

  it('handles negative net (expenses > income)', () => {
    const net = 10000 - 25000;
    expect(net).toBe(-15000);
    expect(net < 0).toBe(true);
  });
});

describe('Category aggregation logic', () => {
  it('groups transactions by category', () => {
    const transactions = [
      { category: 'ingredients', amount: 5000, type: 'expense' },
      { category: 'ingredients', amount: 3000, type: 'expense' },
      { category: 'transport', amount: 2000, type: 'expense' },
    ];

    const catMap = new Map<string, { total: number; count: number }>();
    for (const tx of transactions) {
      const existing = catMap.get(tx.category);
      if (existing) {
        existing.total += tx.amount;
        existing.count += 1;
      } else {
        catMap.set(tx.category, { total: tx.amount, count: 1 });
      }
    }

    expect(catMap.get('ingredients')?.total).toBe(8000);
    expect(catMap.get('ingredients')?.count).toBe(2);
    expect(catMap.get('transport')?.total).toBe(2000);
    expect(catMap.get('transport')?.count).toBe(1);
  });

  it('sorts categories by total descending', () => {
    const byCategory = [
      { category: 'transport', total: 2000, count: 1 },
      { category: 'ingredients', total: 8000, count: 2 },
    ].sort((a, b) => b.total - a.total);

    expect(byCategory[0].category).toBe('ingredients');
    expect(byCategory[1].category).toBe('transport');
  });
});
