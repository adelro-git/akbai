'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResiboScanner, BirCompliance, CustomerMessages, KnowingEarnings } from '@/components/illustrations/svg';

const TOUR_STORAGE_KEY = 'akbai_tour_seen';

interface FeatureHighlight {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

/**
 * Map each pain point to a prioritized feature to lead them to,
 * plus supporting features they should also know about.
 */
const PAIN_TO_FEATURES: Record<string, { primary: FeatureHighlight; supporting: FeatureHighlight[] }> = {
  receipt_tracking: {
    primary: {
      icon: <ResiboScanner size={28} className="text-primary" />,
      title: 'Track ang gastos mo',
      description: 'I-record ang expenses mo araw-araw sa check-in o manual entry — para lagi mong alam saan napupunta ang pera.',
      href: '/expenses',
    },
    supporting: [
      {
        icon: <KnowingEarnings size={20} className="text-primary" />,
        title: 'Saan Napunta?',
        description: 'Category breakdown ng gastos mo.',
        href: '/expenses',
      },
      {
        icon: <CustomerMessages size={20} className="text-primary" />,
        title: 'Kausapin si Kai',
        description: 'Tanungin si Kai tungkol sa negosyo mo.',
        href: '/chat',
      },
    ],
  },
  bir_compliance: {
    primary: {
      icon: <BirCompliance size={28} className="text-primary" />,
      title: 'Hindi mo na makakalimutan ang BIR',
      description: 'Si Kai ang mag-re-remind sa lahat ng tax deadlines mo — para walang penalty.',
      href: '/chat',
    },
    supporting: [
      {
        icon: <CustomerMessages size={20} className="text-primary" />,
        title: 'Tanungin si Kai',
        description: 'I-ask ang BIR questions mo kay Kai.',
        href: '/chat',
      },
      {
        icon: <ResiboScanner size={20} className="text-primary" />,
        title: 'Track expenses',
        description: 'Para ready ka sa tax filing.',
        href: '/expenses',
      },
    ],
  },
  customer_messages: {
    primary: {
      icon: <CustomerMessages size={28} className="text-primary" />,
      title: 'Si Kai ang katuwang mo sa messages',
      description: 'Pa-draft kay Kai ang replies sa customers mo — professional at natural Filipino.',
      href: '/chat',
    },
    supporting: [
      {
        icon: <ResiboScanner size={20} className="text-primary" />,
        title: 'Track expenses',
        description: 'I-log ang gastos habang busy ka.',
        href: '/expenses',
      },
      {
        icon: <BirCompliance size={20} className="text-primary" />,
        title: 'BIR reminders',
        description: 'Auto reminders para sa deadlines.',
        href: '/chat',
      },
    ],
  },
  knowing_earnings: {
    primary: {
      icon: <KnowingEarnings size={28} className="text-primary" />,
      title: 'Alamin kung kumikita ka',
      description: 'I-check-in ang sales at gastos mo araw-araw — sa expenses mo makikita ang buong picture.',
      href: '/expenses',
    },
    supporting: [
      {
        icon: <ResiboScanner size={20} className="text-primary" />,
        title: 'Saan Napunta?',
        description: 'Detailed breakdown ng expenses.',
        href: '/expenses',
      },
      {
        icon: <CustomerMessages size={20} className="text-primary" />,
        title: 'Kausapin si Kai',
        description: 'Tanungin kung magkano ang net mo.',
        href: '/chat',
      },
    ],
  },
};

const DEFAULT_FEATURES = PAIN_TO_FEATURES['knowing_earnings'];

interface WelcomeTourProps {
  primaryPain?: string | null;
  firstName?: string;
}

/**
 * Post-onboarding welcome tour — personalized based on pain point.
 * Shows the most relevant feature first with a CTA to go there directly.
 */
export default function WelcomeTour({ primaryPain, firstName }: WelcomeTourProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const features = (primaryPain && PAIN_TO_FEATURES[primaryPain]) || DEFAULT_FEATURES;

  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  function handleGo() {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // best-effort
    }
    // Navigate first — keep modal visible as a loading state so dashboard doesn't flash
    router.push(features.primary.href);
    router.refresh();
  }

  function handleSkip() {
    setVisible(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // best-effort
    }
  }

  if (!visible) return null;

  const greeting = firstName ? `Handa ka na, ${firstName}!` : 'Handa ka na!';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[20px] bg-black/20"
      data-testid="welcome-tour-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="bg-surface rounded-2xl p-6 mx-4 max-w-md w-full shadow-ambient-lg flex flex-col gap-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-on-surface">{greeting}</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Base sa sinabi mo, eto ang pinakamakakatulong sa&apos;yo:
          </p>
        </div>

        {/* Primary feature — highlighted */}
        <div
          className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-5 flex flex-col gap-3"
          data-testid="welcome-tour-primary"
        >
          <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center">
            {features.primary.icon}
          </div>
          <p className="text-on-surface font-bold text-base">{features.primary.title}</p>
          <p className="text-on-surface-variant text-sm leading-relaxed">{features.primary.description}</p>
        </div>

        {/* Supporting features */}
        <div className="flex gap-3" data-testid="welcome-tour-supporting">
          {features.supporting.map((feat) => (
            <div
              key={feat.title}
              className="flex-1 bg-surface-container-low rounded-xl p-3 flex flex-col gap-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <p className="text-on-surface font-semibold text-xs">{feat.title}</p>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGo}
            className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all min-h-[44px]"
            data-testid="welcome-tour-go-btn"
          >
            Tara, subukan na natin!
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-on-surface-variant hover:text-on-surface text-sm py-2 transition-colors"
            data-testid="welcome-tour-skip-btn"
          >
            Explore ko muna
          </button>
        </div>
      </div>
    </div>
  );
}
