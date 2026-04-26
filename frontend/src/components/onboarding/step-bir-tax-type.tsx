'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BIR_TAX_TYPES,
  BIR_TAX_TYPE_LABELS,
  BIR_TAX_TYPE_DESCRIPTIONS,
  type BirTaxType,
} from '@/lib/deadlines/types';
import { cn } from '@/lib/utils';

interface StepBirTaxTypeProps {
  onComplete: (taxType: BirTaxType) => void;
  loading: boolean;
  firstName: string;
}

export default function StepBirTaxType({ onComplete, loading }: StepBirTaxTypeProps) {
  const t = useTranslations('onboarding.step5');
  const tCommon = useTranslations('common');
  const [selected, setSelected] = useState<BirTaxType | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        {BIR_TAX_TYPES.map((taxType) => (
          <button
            key={taxType}
            type="button"
            onClick={() => setSelected(taxType)}
            data-testid={`onboarding-tax-type-${taxType}`}
            className={cn(
              'flex w-full text-left px-3.5 py-3 rounded-2xl border transition-all min-h-[56px]',
              selected === taxType
                ? 'border-honey bg-honey-pale/60 ring-2 ring-honey/40'
                : 'border-outline-soft/40 bg-surface-container-lowest hover:border-honey/40',
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-on-surface font-medium text-sm">
                {BIR_TAX_TYPE_LABELS[taxType]}
              </span>
              <span className="text-on-surface-variant text-xs">
                {BIR_TAX_TYPE_DESCRIPTIONS[taxType]}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => selected && onComplete(selected)}
        disabled={!selected || loading}
        data-testid="onboarding-tax-type-submit"
        className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? tCommon('loading') : t('cta')}
      </button>
    </div>
  );
}
