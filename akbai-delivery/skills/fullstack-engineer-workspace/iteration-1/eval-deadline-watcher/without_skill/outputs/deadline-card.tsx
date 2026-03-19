'use client';

import { format, isToday, isTomorrow } from 'date-fns';
import { fil } from 'date-fns/locale';
import { AlertCircle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';

interface DeadlineCardProps {
  id: string;
  formType: string;
  formName: string;
  dueDate: string;
  daysRemaining: number;
  isFiled: boolean;
  description?: string;
  onMarkFiled?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DeadlineCard({
  id,
  formType,
  formName,
  dueDate,
  daysRemaining,
  isFiled,
  description,
  onMarkFiled,
  onDelete,
}: DeadlineCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Determine priority color based on days remaining
  const getPriorityStyles = () => {
    if (isFiled) {
      return {
        background: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        badgeColor: 'bg-green-100 text-green-800',
        badgeIcon: <CheckCircle2 className="w-4 h-4" />,
      };
    }

    if (daysRemaining <= 3) {
      return {
        background: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        badgeColor: 'bg-red-100 text-red-800',
        badgeIcon: <AlertCircle className="w-4 h-4" />,
      };
    }

    if (daysRemaining <= 7) {
      return {
        background: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        badgeColor: 'bg-amber-100 text-amber-800',
        badgeIcon: <Clock className="w-4 h-4" />,
      };
    }

    return {
      background: 'bg-white',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      badgeIcon: <Calendar className="w-4 h-4" />,
    };
  };

  const styles = getPriorityStyles();

  // Format the due date
  const dueDateObj = new Date(dueDate);
  let formattedDate = format(dueDateObj, 'MMM d, yyyy', { locale: fil });

  if (isToday(dueDateObj)) {
    formattedDate = 'Today';
  } else if (isTomorrow(dueDateObj)) {
    formattedDate = 'Tomorrow';
  }

  // Get status badge text
  const getStatusBadge = () => {
    if (isFiled) {
      return 'Filed';
    }
    if (daysRemaining <= 0) {
      return 'Overdue';
    }
    return 'Unfiled';
  };

  // Handle mark as filed
  const handleMarkFiled = async () => {
    if (!onMarkFiled) return;

    setIsLoading(true);
    try {
      await onMarkFiled(id);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete || !window.confirm(`Delete ${formName}?`)) return;

    setIsLoading(true);
    try {
      await onDelete(id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${styles.background} ${styles.borderColor} rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-sm`}
    >
      {/* Header: Form Type and Status Badge */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
              {formType}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{formName}</h3>
        </div>

        {/* Status Badge */}
        <div
          className={`${styles.badgeColor} flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium`}
        >
          {styles.badgeIcon}
          <span>{getStatusBadge()}</span>
        </div>
      </div>

      {/* Description (if provided) */}
      {description && (
        <p className="mb-3 text-xs text-gray-600 line-clamp-2">{description}</p>
      )}

      {/* Due Date and Days Remaining */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{formattedDate}</span>
        </div>

        {/* Days Remaining Progress */}
        {!isFiled && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className={`h-2 rounded-full ${getProgressBarColor(daysRemaining)}`} />
            </div>
            <span className={`text-xs font-semibold ${styles.textColor}`}>
              {daysRemaining <= 0
                ? 'Overdue'
                : daysRemaining === 1
                  ? '1 day left'
                  : `${daysRemaining} days left`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isFiled && (
          <button
            onClick={handleMarkFiled}
            disabled={isLoading}
            className="flex-1 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Mark Filed'}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="flex-1 rounded-md border-2 border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:border-gray-200 disabled:bg-gray-50"
        >
          {isLoading ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

/**
 * Helper function to get progress bar color based on days remaining
 */
function getProgressBarColor(daysRemaining: number): string {
  if (daysRemaining <= 3) {
    return 'bg-red-400';
  }
  if (daysRemaining <= 7) {
    return 'bg-amber-400';
  }
  return 'bg-green-400';
}
