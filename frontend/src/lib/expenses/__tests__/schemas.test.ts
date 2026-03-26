import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ExpensesQuerySchema,
  TransactionTypeEnum,
  TransactionSourceEnum,
} from '../schemas';

describe('TransactionTypeEnum', () => {
  it('accepts income and expense', () => {
    expect(TransactionTypeEnum.parse('income')).toBe('income');
    expect(TransactionTypeEnum.parse('expense')).toBe('expense');
  });

  it('rejects invalid types', () => {
    expect(() => TransactionTypeEnum.parse('transfer')).toThrow();
  });
});

describe('TransactionSourceEnum', () => {
  it('accepts all valid sources', () => {
    for (const s of ['manual', 'check_in', 'ocr', 'import']) {
      expect(TransactionSourceEnum.parse(s)).toBe(s);
    }
  });
});

describe('CreateTransactionSchema', () => {
  const validExpense = {
    type: 'expense',
    amount: 3450,
    category: 'ingredients',
  };

  const validIncome = {
    type: 'income',
    amount: 10000,
    category: 'sales',
  };

  it('accepts valid expense', () => {
    const result = CreateTransactionSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('accepts valid income', () => {
    const result = CreateTransactionSchema.safeParse(validIncome);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = CreateTransactionSchema.safeParse({
      ...validExpense,
      description: 'Bigas sa palengke',
      transaction_date: '2026-03-26',
      source: 'manual',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = CreateTransactionSchema.safeParse({ ...validExpense, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = CreateTransactionSchema.safeParse({ ...validExpense, amount: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer amount', () => {
    const result = CreateTransactionSchema.safeParse({ ...validExpense, amount: 34.5 });
    expect(result.success).toBe(false);
  });

  it('rejects income category on expense type', () => {
    const result = CreateTransactionSchema.safeParse({
      ...validExpense,
      category: 'sales', // income category
    });
    expect(result.success).toBe(false);
  });

  it('rejects expense category on income type', () => {
    const result = CreateTransactionSchema.safeParse({
      ...validIncome,
      category: 'ingredients', // expense category
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = CreateTransactionSchema.safeParse({
      ...validExpense,
      transaction_date: '03-26-2026',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateTransactionSchema', () => {
  it('accepts partial update', () => {
    const result = UpdateTransactionSchema.safeParse({ amount: 5000 });
    expect(result.success).toBe(true);
  });

  it('accepts multiple fields', () => {
    const result = UpdateTransactionSchema.safeParse({
      amount: 5000,
      description: 'Updated description',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty update', () => {
    const result = UpdateTransactionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ExpensesQuerySchema', () => {
  it('accepts empty query (all transactions)', () => {
    const result = ExpensesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts month filter', () => {
    const result = ExpensesQuerySchema.safeParse({ month: '2026-03' });
    expect(result.success).toBe(true);
  });

  it('accepts date range', () => {
    const result = ExpensesQuerySchema.safeParse({
      from: '2026-03-01',
      to: '2026-03-31',
    });
    expect(result.success).toBe(true);
  });

  it('accepts type filter', () => {
    const result = ExpensesQuerySchema.safeParse({ type: 'expense' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid month format', () => {
    const result = ExpensesQuerySchema.safeParse({ month: 'March 2026' });
    expect(result.success).toBe(false);
  });
});
