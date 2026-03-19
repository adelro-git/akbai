// components/features/deadlines/deadline-card.tsx
// Interactive card showing BIR deadline with status and days remaining

'use client';

import { formatDistanceToNow, parse, isPast } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import type { BirDeadline } from '@/lib/utils/zod-schemas/deadline';

interface DeadlineCardProps {
  deadline: BirDeadline;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  // Parse the due_date (ISO 8601 date string: YYYY-MM-DD)
  const dueDateObj = parse(deadline.due_date, 'yyyy-MM-dd', new Date());

  // Convert to Manila timezone for display
  const manilaZone = 'Asia/Manila';
  const zonedDueDate = toZonedTime(dueDateObj, manilaZone);

  // Calculate days remaining
  const now = toZonedTime(new Date(), manilaZone);
  const daysRemaining = Math.ceil(
    (zonedDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine status color based on days remaining
  let statusColor = 'text-teal-light';
  let bgColor = 'bg-card';

  if (daysRemaining <= 3 && daysRemaining > 0 && !deadline.filed) {
    statusColor = 'text-red-400';
    bgColor = 'bg-red-900/20';
  } else if (daysRemaining <= 7 && daysRemaining > 3 && !deadline.filed) {
    statusColor = 'text-amber-400';
    bgColor = 'bg-amber-900/20';
  }

  // Format the due date for display
  const formattedDate = format(zonedDueDate, 'MMM dd, yyyy', { timeZone: manilaZone });

  // Determine days remaining label
  const daysLabel =
    daysRemaining <= 0
      ? 'Overdue'
      : daysRemaining === 1
        ? '1 day left'
        : `${daysRemaining} days left`;

  return (
    <div
      className={`
        rounded-xl p-4 border border-gray-700/50
        transition-all duration-300
        ${bgColor}
        min-h-touch
      `}
    >
      {/* Header: Form type and filed badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-semibold text-white">
          BIR {deadline.form_type}
        </h3>
        {deadline.filed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-light/20 px-2.5 py-0.5">
            <span className="h-2 w-2 rounded-full bg-teal-light" />
            <span className="text-xs font-semibold text-teal-light">Filed</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/30 px-2.5 py-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Unfiled</span>
          </span>
        )}
      </div>

      {/* Due date */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Due Date
        </p>
        <p className="text-sm text-gray-200">{formattedDate}</p>
      </div>

      {/* Days remaining */}
      <div className="flex items-baseline gap-2">
        <p className={`text-sm font-semibold ${statusColor}`}>
          {daysLabel}
        </p>
        {daysRemaining <= 0 && !deadline.filed && (
          <span className="text-xs text-red-400/70">
            (Due was {formatDistanceToNow(zonedDueDate, { addSuffix: true })})
          </span>
        )}
      </div>

      {/* CTA: Mark as filed (if not already filed) */}
      {!deadline.filed && (
        <button
          className="
            mt-4 w-full min-h-touch
            rounded-lg bg-gradient-to-r from-honey-light to-honey-deep
            px-4 py-2 text-center text-xs font-semibold text-white
            transition-opacity duration-200 active:opacity-80
          "
        >
          Mark as Filed
        </button>
      )}
    </div>
  );
}
