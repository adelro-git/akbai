/**
 * Invoice Status Badge — color-coded pill showing invoice status
 * Feature: Invoice Cards (Build 8)
 * Role: Visual indicator of invoice lifecycle status
 *
 * Colors follow design system tokens (no hardcoded hex):
 * - draft: surface-container-high + on-surface-variant
 * - sent: primary-container tint
 * - viewed: tertiary-container tint
 * - paid: tertiary (green/teal)
 * - overdue: destructive
 * - cancelled: on-surface-variant (muted)
 */

import type { InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Status Config — label + Tailwind classes
// ============================================================

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; classes: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-surface-container-high text-on-surface-variant',
  },
  sent: {
    label: 'Na-send na',
    classes: 'bg-primary-container/20 text-primary',
  },
  viewed: {
    label: 'Nakita na',
    classes: 'bg-tertiary-container/20 text-tertiary',
  },
  paid: {
    label: 'Bayad na',
    classes: 'bg-tertiary-container/20 text-tertiary',
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-error-container text-destructive',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-surface-container-high text-on-surface-variant',
  },
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
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes} ${className ?? ''}`}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}
