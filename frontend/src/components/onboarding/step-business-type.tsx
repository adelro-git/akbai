'use client';

import { useState } from 'react';
import type { BusinessType } from '@/lib/kilala-kita/schemas';

interface StepBusinessTypeProps {
  onComplete: (businessType: BusinessType) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const BUSINESS_TYPES: { value: BusinessType; label: string; description: string; icon: string }[] = [
  {
    value: 'food_baking',
    label: 'Food / Baking',
    description: 'Lutong bahay, pastries, kakanin',
    icon: '🍰',
  },
  {
    value: 'online_selling',
    label: 'Online Selling',
    description: 'Shopee, Lazada, Facebook, TikTok',
    icon: '📦',
  },
  {
    value: 'freelance_creative',
    label: 'Freelance / Creative',
    description: 'Design, writing, dev, VA',
    icon: '💻',
  },
  {
    value: 'sari_sari_retail',
    label: 'Sari-Sari / Retail',
    description: 'Tindahan, retail, reselling',
    icon: '🏪',
  },
  {
    value: 'other',
    label: 'Iba Pa',
    description: 'Salon, services, farming, etc.',
    icon: '✨',
  },
];

export default function StepBusinessType({
  onComplete,
  loading,
  firstName,
  initialValue,
}: StepBusinessTypeProps) {
  const [selected, setSelected] = useState<BusinessType | null>(
    (initialValue as BusinessType) ?? null
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
          Nice to meet you, <span className="text-primary-container font-semibold">{firstName}</span>! Ano ang
          negosyo mo?
        </p>
      </div>

      {/* Business type cards */}
      <div className="grid gap-3">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setSelected(type.value)}
            className={`flex items-center gap-3 w-full text-left p-4 rounded-xl border transition-all ${
              selected === type.value
                ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container'
                : 'border-outline-variant/30 bg-surface-container-high hover:border-outline-variant/50'
            }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <div>
              <p className="text-on-surface font-semibold text-sm">{type.label}</p>
              <p className="text-on-surface-variant text-xs">{type.description}</p>
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
