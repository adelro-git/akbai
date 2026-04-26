'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PainPoint } from '@/lib/kilala-kita/schemas';
import {
  ReceiptTracking,
  BirCompliance,
  CustomerMessages,
  KnowingEarnings,
} from '@/components/illustrations/svg';
import { cn } from '@/lib/utils';

interface StepPainPointProps {
  onComplete: (painPoint: PainPoint) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const PAIN_POINTS: {
  value: PainPoint;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'receipt_tracking',
    label: 'Nawawala ang mga resibo ko',
    description: 'Gastos na hindi na-track',
    icon: <ReceiptTracking size={28} />,
  },
  {
    value: 'bir_compliance',
    label: 'Nahihirapan sa BIR',
    description: 'Deadlines, forms, tax filing',
    icon: <BirCompliance size={28} />,
  },
  {
    value: 'customer_messages',
    label: 'Hindi makahabol sa messages',
    description: 'DMs, orders, inquiries',
    icon: <CustomerMessages size={28} />,
  },
  {
    value: 'knowing_earnings',
    label: 'Hindi ko alam kung kumikita ba',
    description: 'Sales vs. actual profit',
    icon: <KnowingEarnings size={28} />,
  },
];

export default function StepPainPoint({
  onComplete,
  loading,
  initialValue,
}: StepPainPointProps) {
  const t = useTranslations('onboarding.step4');
  const tCommon = useTranslations('common');
  const [selected, setSelected] = useState<PainPoint | null>(
    (initialValue as PainPoint) ?? null,
  );

  const handleContinue = () => {
    if (!selected) return;
    onComplete(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2.5">
        {PAIN_POINTS.map((pain) => (
          <button
            key={pain.value}
            type="button"
            onClick={() => setSelected(pain.value)}
            className={cn(
              'flex items-center gap-3 w-full text-left p-3.5 rounded-2xl border transition-all min-h-[60px]',
              selected === pain.value
                ? 'border-honey bg-honey-pale/60 ring-2 ring-honey/40'
                : 'border-outline-soft/40 bg-surface-container-lowest hover:border-honey/40',
            )}
          >
            <span className="flex items-center justify-center w-9 h-9 flex-shrink-0">
              {pain.icon}
            </span>
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
        className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? tCommon('loading') : t('cta')}
      </button>
    </div>
  );
}
