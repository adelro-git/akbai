/**
 * Deadline Card — Individual deadline with status badge and action button
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Displays a single BIR deadline with color-coded urgency,
 *       status badge, and "Mark as Filed" action button.
 */

'use client';

import { useState } from 'react';
import { StatusSuccess, StatusError, StatusPending } from '@/components/illustrations/svg';
import type { DeadlineWithUrgency, DeadlineUrgency } from '@/lib/deadlines/types';

// ============================================================
// Urgency styling config
// ============================================================

const URGENCY_STYLES: Record<DeadlineUrgency, { bg: string; border: string; icon: string; badge: string }> = {
  overdue: {
    bg: 'bg-error-container/10',
    border: 'border-l-4 border-l-error',
    icon: 'text-error',
    badge: 'bg-error/15 text-error',
  },
  urgent: {
    bg: 'bg-warning-container/10',
    border: 'border-l-4 border-l-warning',
    icon: 'text-warning',
    badge: 'bg-warning/15 text-on-warning-container',
  },
  normal: {
    bg: 'bg-surface-container',
    border: 'border-l-4 border-l-primary-container',
    icon: 'text-primary-container',
    badge: 'bg-primary-container/15 text-primary-container',
  },
};

// ============================================================
// Status labels (Taglish)
// ============================================================

function getStatusLabel(status: string, daysUntil: number): string {
  if (status === 'filed') return 'Filed na';
  if (status === 'na') return 'N/A';
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil === 0) return 'Due today!';
  if (daysUntil === 1) return 'Bukas na!';
  return `${daysUntil} days left`;
}

// ============================================================
// Component
// ============================================================

interface DeadlineCardProps {
  deadline: DeadlineWithUrgency;
  onMarkFiled: (id: string) => Promise<void>;
}

export default function DeadlineCard({ deadline, onMarkFiled }: DeadlineCardProps) {
  const [loading, setLoading] = useState(false);
  const isFiled = deadline.status === 'filed';
  const urgency = isFiled ? 'normal' : deadline.urgency;
  const styles = URGENCY_STYLES[urgency];

  const handleMarkFiled = async () => {
    setLoading(true);
    try {
      await onMarkFiled(deadline.id);
    } finally {
      setLoading(false);
    }
  };

  // Format due date for display (e.g., "Apr 15, 2026")
  const formattedDate = new Date(deadline.due_date + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-xl p-4 ${styles.bg} ${styles.border} transition-all`}
      data-testid={`deadline-card-${deadline.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon + Info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {isFiled ? (
              <span data-testid="icon-filed"><StatusSuccess size={20} /></span>
            ) : urgency === 'overdue' ? (
              <span data-testid="icon-overdue"><StatusError size={20} /></span>
            ) : (
              <span data-testid="icon-clock"><StatusPending size={20} /></span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-on-surface" data-testid="form-name">
                {deadline.form_name}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isFiled ? 'bg-primary-container/15 text-primary-container' : styles.badge}`}
                data-testid="status-badge"
              >
                {getStatusLabel(deadline.status, deadline.days_until)}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant truncate" data-testid="description">
              {deadline.description}
            </p>

            <p className="text-xs text-on-surface-variant mt-1" data-testid="due-date">
              Due: {formattedDate}
            </p>
          </div>
        </div>

        {/* Right: Action button */}
        {!isFiled && deadline.status !== 'na' && (
          <button
            type="button"
            onClick={handleMarkFiled}
            disabled={loading}
            className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-primary-container/10 text-primary-container text-xs font-semibold px-3 transition-colors hover:bg-primary-container/20 disabled:opacity-40"
            data-testid="mark-filed-btn"
          >
            {loading ? '...' : 'Filed na'}
          </button>
        )}
      </div>
    </div>
  );
}
