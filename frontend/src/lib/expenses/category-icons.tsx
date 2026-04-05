'use client';

import {
  ExpenseFood,
  ExpenseTransport,
  ExpenseUtilities,
  ExpenseSupplies,
  ExpenseRent,
  ExpenseSalary,
  ExpenseMarketing,
  ExpenseInventory,
  ExpenseEquipment,
  ExpenseMisc,
} from '@/components/illustrations/svg';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  ingredients: ExpenseFood,
  supplies: ExpenseSupplies,
  transport: ExpenseTransport,
  utilities: ExpenseUtilities,
  rent: ExpenseRent,
  labor: ExpenseSalary,
  packaging: ExpenseInventory,
  marketing: ExpenseMarketing,
  tax_fee: ExpenseMisc,
  other_expense: ExpenseMisc,
};

export function CategoryIcon({ categoryKey, size = 20 }: { categoryKey: string; size?: number }) {
  const Icon = CATEGORY_ICON_MAP[categoryKey];
  if (!Icon) return null;
  return <Icon size={size} />;
}
