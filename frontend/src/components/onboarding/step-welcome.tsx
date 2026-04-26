'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';

interface StepWelcomeProps {
  onComplete: (displayName: string) => void;
  loading: boolean;
  initialName?: string | null;
}

export default function StepWelcome({ onComplete, loading, initialName }: StepWelcomeProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('onboarding.step1');
  const tCommon = useTranslations('common');

  // Pre-fill if resuming
  if (nameRef.current && initialName && !nameRef.current.value) {
    nameRef.current.value = initialName;
  }

  const handleSubmit = () => {
    const name = nameRef.current?.value?.trim() ?? '';
    if (!name) return;
    onComplete(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={nameRef}
        type="text"
        placeholder={t('placeholder')}
        defaultValue={initialName ?? ''}
        autoFocus
        maxLength={100}
        onKeyDown={handleKeyDown}
        data-testid="onboarding-name-input"
        className="w-full bg-surface-container-lowest border border-outline-soft/40 rounded-2xl px-4 py-3.5 text-on-surface placeholder-on-surface-variant/70 focus:border-honey/60 focus:ring-2 focus:ring-honey/30 transition-colors min-h-[48px]"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? tCommon('loading') : t('cta')}
      </button>
    </div>
  );
}
