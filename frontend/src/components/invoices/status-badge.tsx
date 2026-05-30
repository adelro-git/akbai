/**
 * Invoice Status Badge — color-coded pill showing invoice status
 * Feature: Invoice Cards (Build 8)
 * Role: Visual indicator of invoice lifecycle status
 *
 * Warm Precision (spec §5): reconciled onto the shared <Pill> status variants
 * so there is a single tag component (no third parallel badge). The old
 * `bg-tertiary-container/20` / `bg-primary-container/20` fills went near-invisible
 * at the new pale token values — replaced by the solid status-tag tokens:
 * - draft / cancelled → neutral info (surface-container-high + on-surface-variant)
 * - sent → pending (secondary-container + primary)
 * - viewed / paid → positive (tertiary-container + tertiary)
 * - overdue → overdue (error-pale + destructive)
 */

import { Pill } from '@/components/ui/pill';
import type { PillProps } from '@/components/ui/pill';
import type { InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Status Config — label + Pill status variant
// ============================================================

type StatusVariant = NonNullable<PillProps['variant']>;

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Draft', variant: 'info' },
  sent: { label: 'Na-send na', variant: 'pending' },
  viewed: { label: 'Nakita na', variant: 'positive' },
  paid: { label: 'Bayad na', variant: 'positive' },
  overdue: { label: 'Overdue', variant: 'overdue' },
  cancelled: { label: 'Cancelled', variant: 'info' },
};

// ============================================================
// Component
// ============================================================

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Pill
      variant={config.variant}
      size="tag"
      className={className}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </Pill>
  );
}
