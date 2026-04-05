'use client';

import { useState, useRef } from 'react';
import { BIR_TAX_TYPES, BIR_TAX_TYPE_LABELS, BIR_TAX_TYPE_DESCRIPTIONS, type BirTaxType } from '@/lib/deadlines/types';

interface StepBirTaxTypeProps {
  onComplete: (taxType: BirTaxType) => void;
  loading: boolean;
  firstName: string;
}

export default function StepBirTaxType({ onComplete, loading, firstName }: StepBirTaxTypeProps) {
  const [selected, setSelected] = useState<BirTaxType | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-on-surface text-base leading-relaxed">
          Nice, <span className="text-primary-container font-semibold">{firstName}</span>! Anong
          tax type mo sa BIR?
        </p>
      </div>

      {/* Tax type options */}
      <div className="grid gap-2">
        {BIR_TAX_TYPES.map((taxType) => (
          <button
            key={taxType}
            type="button"
            onClick={() => setSelected(taxType)}
            className={`flex w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
              selected === taxType
                ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
            }`}
            data-testid={`onboarding-tax-type-${taxType}`}
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

      {/* Continue button */}
      <button
        ref={submitRef}
        type="button"
        onClick={() => selected && onComplete(selected)}
        disabled={!selected || loading}
        className="w-full py-3 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="onboarding-tax-type-submit"
      >
        {loading ? '...' : 'Sunod'}
      </button>
    </div>
  );
}
