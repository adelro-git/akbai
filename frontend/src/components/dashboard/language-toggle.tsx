'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setLocaleCookie } from '@/lib/i18n/set-locale';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

// ============================================================
// Phase 5 — Language toggle pill (FIL / EN)
// Sidebar bottom + compact mobile affordance in More drawer.
// Wires next-intl `useLocale` to the `setLocaleCookie` server action.
// ============================================================

interface LanguageToggleProps {
  /** Compact rendering for the More drawer (less padding). */
  compact?: boolean;
  className?: string;
}

export default function LanguageToggle({ compact = false, className }: LanguageToggleProps) {
  const locale = useLocale();
  const t = useTranslations('language');
  const [pending, startTransition] = useTransition();

  function handleSwitch(next: Locale) {
    if (!isLocale(next) || next === locale) return;
    startTransition(() => {
      void setLocaleCookie(next);
    });
  }

  const containerClass = cn(
    'inline-flex items-center gap-1 rounded-full bg-surface-container/60 p-1',
    compact ? 'w-full justify-center' : '',
    pending ? 'opacity-70' : '',
    className,
  );

  return (
    <div
      className={containerClass}
      role="group"
      aria-label={t('aria')}
      data-testid="language-toggle"
      aria-busy={pending || undefined}
    >
      <PillButton
        active={locale === 'fil'}
        onClick={() => handleSwitch('fil')}
        disabled={pending}
        testId="lang-fil"
        label={t('filipino')}
        compact={compact}
      />
      <PillButton
        active={locale === 'en'}
        onClick={() => handleSwitch('en')}
        disabled={pending}
        testId="lang-en"
        label={t('english')}
        compact={compact}
      />
    </div>
  );
}

interface PillButtonProps {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  testId: string;
  label: string;
  compact: boolean;
}

function PillButton({ active, onClick, disabled, testId, label, compact }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-pressed={active}
      className={cn(
        'rounded-full font-semibold transition-colors min-h-[36px]',
        compact ? 'flex-1 px-3 py-1.5 text-sm' : 'px-3.5 py-1.5 text-xs',
        active
          ? 'bg-honey-deep text-white shadow-sm'
          : 'text-on-surface-variant hover:bg-surface-container-high/60',
      )}
    >
      {label}
    </button>
  );
}
