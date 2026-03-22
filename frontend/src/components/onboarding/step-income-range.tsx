'use client';

import { useState } from 'react';
import type { IncomeRange } from '@/lib/kilala-kita/schemas';

interface StepIncomeRangeProps {
  onComplete: (incomeRange: IncomeRange) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const INCOME_RANGES: { value: IncomeRange; label: string; tagline: string }[] = [
  { value: 'below_50k', label: 'Below ₱50K', tagline: 'Nagsisimula pa lang' },
  { value: '50k_150k', label: '₱50K – ₱150K', tagline: 'Lumalaki na' },
  { value: '150k_500k', label: '₱150K – ₱500K', tagline: 'Malakas na' },
  { value: 'above_500k', label: 'Above ₱500K', tagline: 'Malaki na talaga' },
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
      {/* KA bubble */}
      <div className="bg-kai-card rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-white text-base leading-relaxed">
          Mga magkano ang monthly income ng negosyo mo,{' '}
          <span className="text-honey font-semibold">{firstName}</span>?
        </p>
        <p className="text-slate-400 text-xs mt-1">
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
                ? 'border-honey bg-honey/10 ring-1 ring-honey'
                : 'border-white/10 bg-kai-card-alt hover:border-white/20'
            }`}
          >
            <p className="text-white font-semibold text-sm">{range.label}</p>
            <p className="text-slate-400 text-xs">{range.tagline}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selected}
        className="w-full bg-honey hover:bg-honey-deep text-ink font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Sine-save...' : 'Sunod'}
      </button>
    </div>
  );
}
