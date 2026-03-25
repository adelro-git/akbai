'use client';

import { useState } from 'react';
import type { PainPoint } from '@/lib/kilala-kita/schemas';

interface StepPainPointProps {
  onComplete: (painPoint: PainPoint) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const PAIN_POINTS: { value: PainPoint; label: string; description: string; icon: string }[] = [
  {
    value: 'receipt_tracking',
    label: 'Nawawala ang mga resibo ko',
    description: 'Gastos na hindi na-track',
    icon: '🧾',
  },
  {
    value: 'bir_compliance',
    label: 'Nahihirapan sa BIR',
    description: 'Deadlines, forms, tax filing',
    icon: '📋',
  },
  {
    value: 'customer_messages',
    label: 'Hindi makahabol sa messages',
    description: 'DMs, orders, inquiries',
    icon: '💬',
  },
  {
    value: 'knowing_earnings',
    label: 'Hindi ko alam kung kumikita ba',
    description: 'Sales vs. actual profit',
    icon: '📊',
  },
];

export default function StepPainPoint({
  onComplete,
  loading,
  firstName,
  initialValue,
}: StepPainPointProps) {
  const [selected, setSelected] = useState<PainPoint | null>(
    (initialValue as PainPoint) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    onComplete(selected);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* KA bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-on-surface text-base leading-relaxed">
          Ano ang pinakamasakit sa ulo mo sa negosyo,{' '}
          <span className="text-primary-container font-semibold">{firstName}</span>?
        </p>
      </div>

      {/* Pain point cards */}
      <div className="grid gap-3">
        {PAIN_POINTS.map((pain) => (
          <button
            key={pain.value}
            type="button"
            onClick={() => setSelected(pain.value)}
            className={`flex items-center gap-3 w-full text-left p-4 rounded-xl border transition-all ${
              selected === pain.value
                ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
            }`}
          >
            <span className="text-2xl">{pain.icon}</span>
            <div>
              <p className="text-on-surface font-semibold text-sm">{pain.label}</p>
              <p className="text-on-surface-variant text-xs">{pain.description}</p>
            </div>
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
