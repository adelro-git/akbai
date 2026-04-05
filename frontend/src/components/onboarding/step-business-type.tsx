'use client';

import { useState, useRef } from 'react';
import type { BusinessType } from '@/lib/kilala-kita/schemas';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { FoodBaking, OnlineSelling, Freelance, RetailSariSari, SparkleAccent } from '@/components/illustrations/svg';

interface StepBusinessTypeProps {
  onComplete: (businessType: BusinessType, otherText?: string) => void;
  loading: boolean;
  firstName: string;
  initialValue?: string | null;
}

const BUSINESS_TYPES: { value: BusinessType; label: string; description: string; icon: React.ReactNode }[] = [
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
    label: 'Iba Pa',
    description: 'Salon, services, farming, etc.',
    icon: <SparkleAccent size={28} />,
  },
];

export default function StepBusinessType({
  onComplete,
  loading,
  firstName,
  initialValue,
}: StepBusinessTypeProps) {
  // Parse initial value: if starts with "other:", pre-fill the text field
  const parsedInitial = initialValue?.startsWith('other:')
    ? 'other'
    : (initialValue as BusinessType | null);
  const parsedOtherText = initialValue?.startsWith('other:')
    ? initialValue.slice(6)
    : '';

  const [selected, setSelected] = useState<BusinessType | null>(
    parsedInitial ?? null
  );
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
    <div className="flex flex-col gap-6">
      {/* Step header illustration — full width */}
      <div className="flex justify-center w-full">
        <IllustrationWrapper
          src="onboarding/business-type.webp"
          alt="Choose your business type"
          category="onboarding"
          className="w-full max-w-full"
        />
      </div>

      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4">
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
            <span className="flex items-center justify-center w-8 h-8">{type.icon}</span>
            <div>
              <p className="text-on-surface font-semibold text-sm">{type.label}</p>
              <p className="text-on-surface-variant text-xs">{type.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* "Iba pa" text input — shown when "other" is selected */}
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
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder-on-surface-variant text-sm focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30 transition-colors min-h-[44px]"
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
        className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Sine-save...' : 'Sunod'}
      </button>
    </div>
  );
}
