'use client';

import { useState } from 'react';
import type { IncomeRange } from '@/lib/kilala-kita/schemas';

interface StepIncomeRangeProps {
  onComplete: (incomeRange: IncomeRange) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const INCOME_RANGES: { value: IncomeRange; label: string }[] = [
  { value: 'below_50k', label: 'Below ₱50K' },
  { value: '50k_150k', label: '₱50K – ₱150K' },
  { value: '150k_500k', label: '₱150K – ₱500K' },
  { value: 'above_500k', label: 'Above ₱500K' },
];

export default function StepIncomeRange({
  onComplete,
  loading,
  firstName,
  initialValue,
}: StepIncomeRangeProps) {
  const [selected, setSelected] = useState<IncomeRange | null>(
    (initialValue as IncomeRange) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    onComplete(selected);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-on-surface text-base leading-relaxed">
          Mga magkano ang monthly income ng negosyo mo,{' '}
          <span className="text-primary-container font-semibold">{firstName}</span>?
        </p>
        <p className="text-on-surface-variant text-xs mt-1">
          Estimate lang — para ma-customize ang tulong ko sa&apos;yo.
        </p>
      </div>

      {/* Income range chips */}
      <div className="grid grid-cols-2 gap-3">
        {INCOME_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => setSelected(range.value)}
            className={`flex flex-col items-center gap-1 p-4 rounded-xl border text-center transition-all ${
              selected === range.value
                ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
            }`}
          >
            <p className="text-on-surface font-semibold text-sm">{range.label}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selected}
        className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Sine-save...' : 'Sunod'}
      </button>
    </div>
  );
}
