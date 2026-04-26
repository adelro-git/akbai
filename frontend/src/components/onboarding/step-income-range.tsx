'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { IncomeRange } from '@/lib/kilala-kita/schemas';
import { cn } from '@/lib/utils';

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
  initialValue,
}: StepIncomeRangeProps) {
  const t = useTranslations('onboarding.step3');
  const tCommon = useTranslations('common');
  const [selected, setSelected] = useState<IncomeRange | null>(
    (initialValue as IncomeRange) ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    onComplete(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        {INCOME_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => setSelected(range.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-4 rounded-2xl border text-center transition-all min-h-[60px]',
              selected === range.value
                ? 'border-honey bg-honey-pale/60 ring-2 ring-honey/40'
                : 'border-outline-soft/40 bg-surface-container-lowest hover:border-honey/40',
            )}
          >
            <p className="text-on-surface font-semibold text-sm">{range.label}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selected}
        className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? tCommon('loading') : t('cta')}
      </button>
    </div>
  );
}
