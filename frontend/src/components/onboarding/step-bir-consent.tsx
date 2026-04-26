'use client';

import { useTranslations } from 'next-intl';

interface StepBirConsentProps {
  onComplete: (birConsent: boolean) => void;
  loading: boolean;
  firstName: string;
}

export default function StepBirConsent({ onComplete, loading }: StepBirConsentProps) {
  const t = useTranslations('onboarding.step5');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-outline-soft/40 bg-surface-container-lowest p-4 space-y-3">
        <p className="text-on-surface text-sm leading-relaxed">Pag nag-yes ka, gagawin ko ito:</p>
        <ul className="text-on-surface-variant text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-honey-deep mt-0.5">✓</span>
            <span>Automatic BIR deadline reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-honey-deep mt-0.5">✓</span>
            <span>Tax form recommendations ayon sa negosyo mo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-honey-deep mt-0.5">✓</span>
            <span>Filing date alerts (7, 3, at 1 day before)</span>
          </li>
        </ul>
        <p className="text-on-surface-variant text-xs">
          Pwede mo i-change anytime sa Settings. Hindi ito tax advice — gabay lang.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onComplete(false)}
          disabled={loading}
          className="py-3 px-4 rounded-full border border-outline-soft/50 bg-surface-container-lowest text-on-surface font-semibold transition-all hover:border-honey/40 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          {loading ? tCommon('loading') : t('no')}
        </button>
        <button
          type="button"
          onClick={() => onComplete(true)}
          disabled={loading}
          className="py-3 px-4 rounded-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold shadow-ambient transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          {loading ? tCommon('loading') : t('yes')}
        </button>
      </div>
    </div>
  );
}
