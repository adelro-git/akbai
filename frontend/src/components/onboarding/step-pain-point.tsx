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
      <div className="bg-kai-card rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-white text-base leading-relaxed">
          Ano ang pinakamasakit sa ulo mo sa negosyo,{' '}
          <span className="text-honey font-semibold">{firstName}</span>?
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
                ? 'border-honey bg-honey/10 ring-1 ring-honey'
                : 'border-white/10 bg-kai-card-alt hover:border-white/20'
            }`}
          >
            <span className="text-2xl">{pain.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{pain.label}</p>
              <p className="text-slate-400 text-xs">{pain.description}</p>
            </div>
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
