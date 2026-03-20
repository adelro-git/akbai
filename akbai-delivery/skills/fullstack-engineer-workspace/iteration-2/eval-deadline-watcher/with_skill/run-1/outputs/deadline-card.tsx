/**
 * BIR Deadline Watcher — Deadline Card Component
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Client-side card that displays a single deadline with urgency visual state
 *
 * Flow: Receives deadline object → compute days remaining → determine color
 *       (green >7d, amber 3-7d, red ≤3d) → render form type, due date,
 *       days remaining badge, and filed/unfiled status
 *
 * Design: Mobile-first card with 44px+ touch targets, Tailwind only,
 *         responsive color state based on deadline proximity
 */

'use client';

import { useMemo } from 'react';
import type { Deadline } from '@/lib/utils/zod-schemas/deadline-types';

interface DeadlineCardProps {
  deadline: Deadline;
}

interface ComputedDeadlineState {
  daysRemaining: number;
  isOverdue: boolean;
  urgencyColor: 'green' | 'amber' | 'red';
  urgencyLabel: string;
  daysLabel: string;
}

// ============================================================
// Helper: Compute days remaining and urgency state
// ============================================================
function computeDeadlineState(dueDateString: string): ComputedDeadlineState {
  const dueDate = new Date(dueDateString);
  const today = new Date();

  // Normalize to midnight (ignore time component)
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffMs = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  // Determine urgency state based on days remaining
  let urgencyColor: 'green' | 'amber' | 'red' = 'green';
  let urgencyLabel = 'On track';

  if (isOverdue) {
    urgencyColor = 'red';
    urgencyLabel = 'Overdue';
  } else if (daysRemaining <= 3) {
    urgencyColor = 'red';
    urgencyLabel = 'Critical — file now';
  } else if (daysRemaining <= 7) {
    urgencyColor = 'amber';
    urgencyLabel = 'Due soon';
  }

  const daysLabel =
    daysRemaining === 0
      ? 'Due today'
      : daysRemaining === 1
      ? 'Due tomorrow'
      : isOverdue
      ? `${Math.abs(daysRemaining)} days overdue`
      : `${daysRemaining} days remaining`;

  return {
    daysRemaining,
    isOverdue,
    urgencyColor,
    urgencyLabel,
    daysLabel,
  };
}

// ============================================================
// Component: DeadlineCard with urgency-driven color state
// ============================================================
export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const deadlineState = useMemo(
    () => computeDeadlineState(deadline.due_date),
    [deadline.due_date]
  );

  // --- Color Mapping: Urgency state to Tailwind classes ---
  // Green (>7 days): normal state, light styling
  // Amber (3-7 days): warning state, amber accent
  // Red (≤3 days): critical state, red accent
  const urgencyColorMap = {
    green: {
      badgeBg: 'bg-teal-light/20',
      badgeText: 'text-teal-light',
      borderColor: 'border-card-alt',
      accentColor: 'text-teal-light',
    },
    amber: {
      badgeBg: 'bg-yellow-400/20',
      badgeText: 'text-yellow-400',
      borderColor: 'border-yellow-400/30',
      accentColor: 'text-yellow-400',
    },
    red: {
      badgeBg: 'bg-red-500/20',
      badgeText: 'text-red-400',
      borderColor: 'border-red-500/30',
      accentColor: 'text-red-400',
    },
  };

  const colors = urgencyColorMap[deadlineState.urgencyColor];

  // --- Format: Due date display (e.g., "March 15, 2026") ---
  const formattedDate = new Date(deadline.due_date).toLocaleDateString(
    'en-PH',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl bg-card border ${colors.borderColor}
                   p-4 min-h-touch transition-all duration-200`}
    >
      {/* --- Header: Form Type and Status Badge --- */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <h3 className="text-base font-bold text-white">
            BIR {deadline.form_type}
          </h3>
          <p className={`text-sm font-semibold ${colors.accentColor}`}>
            {deadlineState.urgencyLabel}
          </p>
        </div>

        {/* --- Status Badge: Filed/Unfiled state --- */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            deadline.filed
              ? 'bg-teal-light/20 text-teal-light'
              : 'bg-gray-700/40 text-gray-300'
          }`}
        >
          {deadline.filed ? '✓ Filed' : 'Unfiled'}
        </div>
      </div>

      {/* --- Body: Due Date and Days Remaining --- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Due date
          </p>
          <p className="text-sm font-medium text-white">
            {formattedDate}
          </p>
        </div>

        {/* --- Days Badge: Urgency-colored badge with days remaining --- */}
        <div
          className={`flex items-center justify-center min-w-[70px] min-h-touch rounded-lg
                       ${colors.badgeBg} border border-current`}
        >
          <div className="flex flex-col items-center gap-1">
            <p className={`text-lg font-bold ${colors.badgeText}`}>
              {Math.abs(deadlineState.daysRemaining)}
            </p>
            <p className={`text-xs font-semibold ${colors.badgeText}`}>
              {deadlineState.isOverdue ? 'overdue' : 'days'}
            </p>
          </div>
        </div>
      </div>

      {/* --- Footer: Days remaining label --- */}
      <p className="text-xs text-gray-400 pt-2 border-t border-gray-700/50">
        {deadlineState.daysLabel}
      </p>

      {/* --- Filed timestamp: Show when marked as filed --- */}
      {deadline.filed && deadline.filed_at && (
        <p className="text-xs text-teal-light/70">
          Filed on{' '}
          {new Date(deadline.filed_at).toLocaleDateString('en-PH')}
        </p>
      )}
    </div>
  );
}
