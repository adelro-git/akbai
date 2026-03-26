'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
  /** Current month in YYYY-MM format */
  month: string;
  onMonthChange: (month: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseMonth(month: string): { year: number; monthIdx: number } {
  const [year, m] = month.split('-').map(Number);
  return { year, monthIdx: m - 1 };
}

function formatMonth(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
}

export default function MonthPicker({ month, onMonthChange }: MonthPickerProps) {
  const { year, monthIdx } = parseMonth(month);

  const handlePrev = () => {
    if (monthIdx === 0) {
      onMonthChange(formatMonth(year - 1, 11));
    } else {
      onMonthChange(formatMonth(year, monthIdx - 1));
    }
  };

  const handleNext = () => {
    if (monthIdx === 11) {
      onMonthChange(formatMonth(year + 1, 0));
    } else {
      onMonthChange(formatMonth(year, monthIdx + 1));
    }
  };

  return (
    <div className="flex items-center justify-between" data-testid="month-picker">
      <button
        onClick={handlePrev}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        aria-label="Previous month"
        data-testid="month-prev"
        type="button"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <h2 className="text-on-surface text-base font-bold" data-testid="month-label">
        {MONTH_NAMES[monthIdx]} {year}
      </h2>

      <button
        onClick={handleNext}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest"
        aria-label="Next month"
        data-testid="month-next"
        type="button"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
