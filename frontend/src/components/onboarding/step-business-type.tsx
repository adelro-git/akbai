'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { BusinessType } from '@/lib/kilala-kita/schemas';
import {
  FoodBaking,
  OnlineSelling,
  Freelance,
  RetailSariSari,
  SparkleAccent,
} from '@/components/illustrations/svg';
import { cn } from '@/lib/utils';

interface StepBusinessTypeProps {
  onComplete: (businessType: BusinessType, otherText?: string) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const BUSINESS_TYPES: {
  value: BusinessType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'food_baking',
    label: 'Food / Baking',
    description: 'Lutong bahay, pastries, kakanin',
    icon: <FoodBaking size={28} />,
  },
  {
    value: 'online_selling',
    label: 'Online Selling',
    description: 'Shopee, Lazada, Facebook, TikTok',
    icon: <OnlineSelling size={28} />,
  },
  {
    value: 'freelance_creative',
    label: 'Freelance / Creative',
    description: 'Design, writing, dev, VA',
    icon: <Freelance size={28} />,
  },
  {
    value: 'sari_sari_retail',
    label: 'Sari-Sari / Retail',
    description: 'Tindahan, retail, reselling',
    icon: <RetailSariSari size={28} />,
  },
  {
    value: 'other',
    label: 'Iba pa',
    description: 'Salon, services, farming, etc.',
    icon: <SparkleAccent size={28} />,
  },
];

export default function StepBusinessType({
  onComplete,
  loading,
  initialValue,
}: StepBusinessTypeProps) {
  const t = useTranslations('onboarding.step2');
  const tCommon = useTranslations('common');

  // Parse initial value: if starts with "other:", pre-fill the text field
  const parsedInitial = initialValue?.startsWith('other:')
    ? 'other'
    : (initialValue as BusinessType | null);
  const parsedOtherText = initialValue?.startsWith('other:')
    ? initialValue.slice(6)
    : '';

  const [selected, setSelected] = useState<BusinessType | null>(parsedInitial ?? null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const [otherText, setOtherText] = useState(parsedOtherText);
  const [otherError, setOtherError] = useState<string | null>(null);

  const isOtherSelected = selected === 'other';
  const otherTextValid = otherText.trim().length >= 2 && otherText.trim().length <= 100;

  const handleContinue = () => {
    if (!selected) return;

    if (isOtherSelected) {
      const trimmed = otherText.trim();
      if (trimmed.length < 2) {
        setOtherError('Kailangan ng at least 2 characters.');
        return;
      }
      if (trimmed.length > 100) {
        setOtherError('Maximum 100 characters lang.');
        return;
      }
      setOtherError(null);
      onComplete(selected, trimmed);
    } else {
      onComplete(selected);
    }
  };

  const canContinue = selected !== null && (!isOtherSelected || otherTextValid);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2.5">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setSelected(type.value)}
            className={cn(
              'flex items-center gap-3 w-full text-left p-3.5 rounded-2xl border transition-all min-h-[60px]',
              selected === type.value
                ? 'border-honey bg-honey-pale/60 ring-2 ring-honey/40'
                : 'border-outline-soft/40 bg-surface-container-lowest hover:border-honey/40',
            )}
          >
            <span className="flex items-center justify-center w-9 h-9 flex-shrink-0">
              {type.icon}
            </span>
            <div>
              <p className="text-on-surface font-semibold text-sm">{type.label}</p>
              <p className="text-on-surface-variant text-xs">{type.description}</p>
            </div>
          </button>
        ))}
      </div>

      {isOtherSelected && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label
            htmlFor="other-business-type"
            className="text-on-surface-variant text-xs font-medium"
          >
            Anong klaseng negosyo?
          </label>
          <input
            id="other-business-type"
            ref={otherInputRef}
            type="text"
            value={otherText}
            onChange={(e) => {
              setOtherText(e.target.value);
              setOtherError(null);
            }}
            placeholder="e.g. Pet grooming, Laundry shop"
            maxLength={100}
            className="w-full bg-surface-container-lowest border border-outline-soft/40 rounded-2xl px-4 py-3 text-on-surface placeholder-on-surface-variant text-sm focus:border-honey/60 focus:ring-2 focus:ring-honey/30 transition-colors min-h-[44px]"
            data-testid="other-business-type-input"
          />
          {otherError && (
            <p className="text-destructive text-xs" data-testid="other-business-type-error">
              {otherError}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !canContinue}
        className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? tCommon('loading') : t('cta')}
      </button>
    </div>
  );
}
