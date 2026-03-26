import { describe, it, expect } from 'vitest';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORY_KEYS,
  INCOME_CATEGORY_KEYS,
  ALL_CATEGORY_KEYS,
  getCategoryDef,
  getCategoryLabel,
} from '../categories';

describe('Expense Categories', () => {
  it('has 10 expense categories', () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(10);
  });

  it('has 3 income categories', () => {
    expect(INCOME_CATEGORIES).toHaveLength(3);
  });

  it('all expense categories have unique keys', () => {
    const keys = new Set(EXPENSE_CATEGORY_KEYS);
    expect(keys.size).toBe(EXPENSE_CATEGORIES.length);
  });

  it('all income categories have unique keys', () => {
    const keys = new Set(INCOME_CATEGORY_KEYS);
    expect(keys.size).toBe(INCOME_CATEGORIES.length);
  });

  it('no overlap between expense and income category keys', () => {
    const overlap = EXPENSE_CATEGORY_KEYS.filter((k) => INCOME_CATEGORY_KEYS.includes(k));
    expect(overlap).toEqual([]);
  });

  it('ALL_CATEGORY_KEYS includes all expense and income keys', () => {
    expect(ALL_CATEGORY_KEYS).toHaveLength(
      EXPENSE_CATEGORY_KEYS.length + INCOME_CATEGORY_KEYS.length
    );
  });

  it('every category has label, icon, and color', () => {
    for (const cat of [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]) {
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toBeTruthy();
    }
  });
});

describe('getCategoryDef', () => {
  it('returns expense category by key', () => {
    const cat = getCategoryDef('ingredients');
    expect(cat).toBeDefined();
    expect(cat?.label).toContain('Sangkap');
  });

  it('returns income category by key', () => {
    const cat = getCategoryDef('sales');
    expect(cat).toBeDefined();
    expect(cat?.label).toContain('Benta');
  });

  it('returns undefined for unknown key', () => {
    expect(getCategoryDef('nonexistent')).toBeUndefined();
  });
});

describe('getCategoryLabel', () => {
  it('returns Taglish label for known category', () => {
    expect(getCategoryLabel('transport')).toContain('Pamasahe');
  });

  it('returns raw key for unknown category', () => {
    expect(getCategoryLabel('unknown_cat')).toBe('unknown_cat');
  });
});
