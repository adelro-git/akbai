'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Kai, type KaiExpression } from '@/components/illustrations/kai';
import { PaperNote } from '@/components/ui/paper-note';
import { createClient } from '@/lib/supabase/client';
import {
  ResiboScanner,
  BirCompliance,
  CustomerMessages,
  KnowingEarnings,
} from '@/components/illustrations/svg';

// Backwards-compat localStorage key. Read on mount as a fallback for users who
// completed the tour before the user_metadata switch landed.
const TOUR_STORAGE_KEY = 'akbai_tour_seen';
// User metadata key — written via supabase.auth.updateUser().
const TOUR_METADATA_KEY = 'welcome_tour_completed';

// ============================================================
// Phase 6 — Kai-led 3-card paper-note welcome tour.
// Replaces the prior modal overlay with: a Kai expression header,
// a primary PaperNote card (driven by the user's pain point) and
// 2 supporting paper-note cards. Completion persists to
// user_metadata.welcome_tour_completed via supabase.auth.updateUser
// + localStorage as a same-device backup.
// ============================================================

interface FeatureCard {
  icon: React.ReactNode;
  i18nTitleKey: string;
  i18nDescKey: string;
  href: string;
}

interface FeatureSet {
  expression: KaiExpression;
  primary: FeatureCard;
  supporting: [FeatureCard, FeatureCard];
}

const PAIN_TO_FEATURES: Record<string, FeatureSet> = {
  receipt_tracking: {
    expression: 'happy',
    primary: {
      icon: <ResiboScanner size={28} className="text-honey-deep" />,
      i18nTitleKey: 'cards.expensesPrimary.title',
      i18nDescKey: 'cards.expensesPrimary.description',
      href: '/expenses',
    },
    supporting: [
      {
        icon: <KnowingEarnings size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.saanNapunta.title',
        i18nDescKey: 'cards.saanNapunta.description',
        href: '/expenses',
      },
      {
        icon: <CustomerMessages size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.kausapKai.title',
        i18nDescKey: 'cards.kausapKai.description',
        href: '/chat',
      },
    ],
  },
  bir_compliance: {
    expression: 'working',
    primary: {
      icon: <BirCompliance size={28} className="text-honey-deep" />,
      i18nTitleKey: 'cards.birPrimary.title',
      i18nDescKey: 'cards.birPrimary.description',
      href: '/chat',
    },
    supporting: [
      {
        icon: <CustomerMessages size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.kausapKai.title',
        i18nDescKey: 'cards.kausapKai.description',
        href: '/chat',
      },
      {
        icon: <ResiboScanner size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.trackExpenses.title',
        i18nDescKey: 'cards.trackExpenses.description',
        href: '/expenses',
      },
    ],
  },
  customer_messages: {
    expression: 'thinking',
    primary: {
      icon: <CustomerMessages size={28} className="text-honey-deep" />,
      i18nTitleKey: 'cards.messagesPrimary.title',
      i18nDescKey: 'cards.messagesPrimary.description',
      href: '/chat',
    },
    supporting: [
      {
        icon: <ResiboScanner size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.trackExpenses.title',
        i18nDescKey: 'cards.trackExpenses.description',
        href: '/expenses',
      },
      {
        icon: <BirCompliance size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.birReminders.title',
        i18nDescKey: 'cards.birReminders.description',
        href: '/chat',
      },
    ],
  },
  knowing_earnings: {
    expression: 'celebrating',
    primary: {
      icon: <KnowingEarnings size={28} className="text-honey-deep" />,
      i18nTitleKey: 'cards.earningsPrimary.title',
      i18nDescKey: 'cards.earningsPrimary.description',
      href: '/expenses',
    },
    supporting: [
      {
        icon: <ResiboScanner size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.saanNapunta.title',
        i18nDescKey: 'cards.saanNapunta.description',
        href: '/expenses',
      },
      {
        icon: <CustomerMessages size={20} className="text-honey-deep" />,
        i18nTitleKey: 'cards.kausapKai.title',
        i18nDescKey: 'cards.kausapKai.description',
        href: '/chat',
      },
    ],
  },
};

const DEFAULT_FEATURES = PAIN_TO_FEATURES.knowing_earnings;

interface WelcomeTourProps {
  primaryPain?: string | null;
  firstName?: string;
  /** Server-supplied initial completion flag (from supabase user_metadata). */
  initiallyCompleted?: boolean;
}

export default function WelcomeTour({
  primaryPain,
  firstName,
  initiallyCompleted = false,
}: WelcomeTourProps) {
  const router = useRouter();
  const t = useTranslations('welcomeTour');
  const [visible, setVisible] = useState(false);

  const features = (primaryPain && PAIN_TO_FEATURES[primaryPain]) || DEFAULT_FEATURES;

  useEffect(() => {
    if (initiallyCompleted) return;
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [initiallyCompleted]);

  const persistCompletion = useCallback(async () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      /* best-effort */
    }
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.auth.updateUser({
          data: { ...data.user.user_metadata, [TOUR_METADATA_KEY]: true },
        });
      }
    } catch {
      /* dev-mode SKIP_AUTH or offline — localStorage carries the flag */
    }
  }, []);

  const handleGo = useCallback(async () => {
    await persistCompletion();
    router.push(features.primary.href);
    router.refresh();
  }, [persistCompletion, router, features.primary.href]);

  const handleSkip = useCallback(async () => {
    setVisible(false);
    await persistCompletion();
  }, [persistCompletion]);

  if (!visible) return null;

  const greetingName = firstName ?? 'Boss';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[16px] bg-black/30 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={t('aria')}
      data-testid="welcome-tour-modal"
    >
      <div className="w-full max-w-md flex flex-col gap-5">
        <header className="flex items-end gap-3">
          <Kai expression={features.expression} size={88} animated />
          <PaperNote
            tilt="left"
            tape="right"
            padding="md"
            tone="honey"
            className="flex-1"
          >
            <p className="font-serif text-lg leading-snug">
              {t('greeting', { name: greetingName })}
            </p>
            <p className="mt-1 text-xs">{t('subtitle')}</p>
          </PaperNote>
        </header>

        <PaperNote
          tilt="right"
          padding="md"
          className="flex flex-col gap-3"
          data-testid="welcome-tour-primary"
        >
          <div className="w-12 h-12 rounded-2xl bg-honey-pale/70 flex items-center justify-center">
            {features.primary.icon}
          </div>
          <p className="font-serif text-base font-semibold leading-snug text-on-surface">
            {t(features.primary.i18nTitleKey)}
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {t(features.primary.i18nDescKey)}
          </p>
        </PaperNote>

        <div className="grid grid-cols-2 gap-3">
          {features.supporting.map((feat, idx) => (
            <PaperNote
              key={feat.i18nTitleKey}
              tilt={idx === 0 ? 'left' : 'right'}
              padding="sm"
              className="flex flex-col gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-honey-pale/60 flex items-center justify-center">
                {feat.icon}
              </div>
              <p className="font-semibold text-on-surface text-xs">{t(feat.i18nTitleKey)}</p>
              <p className="text-on-surface-variant text-[11px] leading-snug">
                {t(feat.i18nDescKey)}
              </p>
            </PaperNote>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleGo}
            className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all min-h-[48px]"
            data-testid="welcome-tour-go-btn"
          >
            {t('primaryCta')}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-on-surface-variant hover:text-on-surface text-sm py-2.5 transition-colors"
            data-testid="welcome-tour-skip-btn"
          >
            {t('skipCta')}
          </button>
        </div>
      </div>
    </div>
  );
}
