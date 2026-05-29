// ============================================================
// reconciliation — barrel. Re-exports the pure aggregators + types so
// route handlers and components import from one path:
//   import { computeWeeklyReconciliation } from '@/lib/reconciliation';
// ============================================================

export {
  computeWeeklyReconciliation,
  computeMonthlyReconciliation,
} from './aggregate';

export type {
  ReconciliationDay,
  WeeklyReconciliation,
  MonthlyReconciliation,
  WeeklyReconciliationResponse,
  MonthlyReconciliationResponse,
  ReconciliationCheckIn,
} from './types';
