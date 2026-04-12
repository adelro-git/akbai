'use client';

/**
 * MarginDisplay — Visual margin indicator
 *
 * Shows the margin percentage with color coding:
 * - Green (tertiary): healthy margin (>= 30%)
 * - Amber (primary-container): thin margin (15-29%)
 * - Red (destructive): losing money or dangerously thin (< 15%)
 */

interface MarginDisplayProps {
  marginPct: number | null;
  size?: 'sm' | 'md' | 'lg';
}

function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-on-surface-variant';
  if (margin >= 30) return 'text-tertiary';
  if (margin >= 15) return 'text-primary-container';
  return 'text-destructive';
}

function getMarginBg(margin: number | null): string {
  if (margin === null) return 'bg-surface-container';
  if (margin >= 30) return 'bg-tertiary/10';
  if (margin >= 15) return 'bg-primary-container/10';
  return 'bg-destructive/10';
}

function getMarginLabel(margin: number | null): string {
  if (margin === null) return 'Walang data';
  if (margin >= 30) return 'Maganda ang margin';
  if (margin >= 15) return 'Manipis ang margin';
  if (margin >= 0) return 'Halos walang tubo';
  return 'Lugi ka dito';
}

const SIZE_MAP = {
  sm: { text: 'text-sm', number: 'text-lg', padding: 'px-2.5 py-1.5' },
  md: { text: 'text-sm', number: 'text-2xl', padding: 'px-3 py-2' },
  lg: { text: 'text-base', number: 'text-3xl', padding: 'px-4 py-3' },
} as const;

export default function MarginDisplay({ marginPct, size = 'md' }: MarginDisplayProps) {
  const color = getMarginColor(marginPct);
  const bg = getMarginBg(marginPct);
  const label = getMarginLabel(marginPct);
  const s = SIZE_MAP[size];

  return (
    <div
      className={`rounded-xl ${bg} ${s.padding} inline-flex flex-col items-center`}
      data-testid="margin-display"
    >
      <span className={`${s.number} font-extrabold ${color}`}>
        {marginPct !== null ? `${marginPct.toFixed(1)}%` : '—'}
      </span>
      <span className={`${s.text} ${color} font-semibold`}>{label}</span>
    </div>
  );
}
