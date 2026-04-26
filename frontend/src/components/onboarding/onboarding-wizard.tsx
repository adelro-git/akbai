'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import StepWelcome from './step-welcome';
import StepBusinessType from './step-business-type';
import StepIncomeRange from './step-income-range';
import StepPainPoint from './step-pain-point';
import StepBirConsent from './step-bir-consent';
import StepBirTaxType from './step-bir-tax-type';
import OnboardingShell from './onboarding-shell';
import InstallGuide from '@/components/pwa/install-guide';
import { KaiSitting, type KaiExpression } from '@/components/illustrations/kai';
import { PaperNote } from '@/components/ui/paper-note';
import { trackOnboardingStarted, trackOnboardingCompleted } from '@/lib/posthog/events';
import type { OnboardingState, BusinessType, IncomeRange, PainPoint } from '@/lib/kilala-kita';
import type { BirTaxType } from '@/lib/deadlines/types';

interface OnboardingWizardProps {
  initialState: OnboardingState;
}

// Kai expression mapping per Phase 6 spec — kumustahan rhythm.
const STEP_EXPRESSION: Record<1 | 2 | 3 | 4 | 5, KaiExpression> = {
  1: 'waving',
  2: 'thinking',
  3: 'happy',
  4: 'concerned',
  5: 'working',
};

// Tilt alternation keeps the paper-note row visually breathing per step.
const STEP_TILT: Record<1 | 2 | 3 | 4 | 5, 'left' | 'right'> = {
  1: 'left',
  2: 'right',
  3: 'left',
  4: 'right',
  5: 'left',
};

export default function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [currentStep, setCurrentStep] = useState(initialState.onboarding_step + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(initialState.display_name ?? '');
  const [firstMessage, setFirstMessage] = useState<string | null>(null);

  // Track onboarding started (once per mount)
  const trackedStart = useRef(false);
  useEffect(() => {
    if (!trackedStart.current) {
      trackOnboardingStarted();
      trackedStart.current = true;
    }
  }, []);

  // Carry forward previously saved values for resumability
  const [savedData, setSavedData] = useState({
    display_name: initialState.display_name,
    business_type: initialState.business_type,
    income_range: initialState.income_range,
    primary_pain: initialState.primary_pain,
  });

  const saveStep = useCallback(
    async (step: number, data: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, ...data }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message_tl ?? 'May nangyaring mali. Subukan muli.');
          return false;
        }

        // Step 5 returns the first Kai message
        if (json.data?.completed && json.data?.firstMessage) {
          setFirstMessage(json.data.firstMessage);
        }

        return true;
      } catch {
        setError('Hindi ma-reach ang server. Subukan muli.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleStep1 = useCallback(
    async (displayName: string) => {
      setFirstName(displayName);
      const ok = await saveStep(1, { display_name: displayName });
      if (ok) {
        setSavedData((prev) => ({ ...prev, display_name: displayName }));
        setCurrentStep(2);
      }
    },
    [saveStep],
  );

  const handleStep2 = useCallback(
    async (businessType: BusinessType, otherText?: string) => {
      const valueToSave =
        businessType === 'other' && otherText ? `other:${otherText}` : businessType;
      const ok = await saveStep(2, { business_type: valueToSave });
      if (ok) {
        setSavedData((prev) => ({ ...prev, business_type: valueToSave }));
        setCurrentStep(3);
      }
    },
    [saveStep],
  );

  const handleStep3 = useCallback(
    async (incomeRange: IncomeRange) => {
      const ok = await saveStep(3, { income_range: incomeRange });
      if (ok) {
        setSavedData((prev) => ({ ...prev, income_range: incomeRange }));
        setCurrentStep(4);
      }
    },
    [saveStep],
  );

  const handleStep4 = useCallback(
    async (primaryPain: PainPoint) => {
      const ok = await saveStep(4, { primary_pain: primaryPain });
      if (ok) {
        setSavedData((prev) => ({ ...prev, primary_pain: primaryPain }));
        setCurrentStep(5);
      }
    },
    [saveStep],
  );

  const handleStep5 = useCallback(
    async (birConsent: boolean) => {
      const ok = await saveStep(5, { bir_consent: birConsent });
      if (ok) {
        if (birConsent) {
          setCurrentStep(5.5);
        } else {
          trackOnboardingCompleted(savedData.business_type ?? 'unknown');
          setCurrentStep(6);
        }
      }
    },
    [saveStep, savedData.business_type],
  );

  const handleBirTaxType = useCallback(
    async (taxType: BirTaxType) => {
      setLoading(true);
      setError(null);
      try {
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bir_registered: true, bir_tax_type: taxType }),
        });
        await fetch('/api/deadlines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tax_type: taxType }),
        });
      } catch {
        // Non-blocking — can be set up later in profile
      }
      setLoading(false);
      trackOnboardingCompleted(savedData.business_type ?? 'unknown');
      setCurrentStep(6);
    },
    [savedData.business_type],
  );

  // Step 6: celebrate then surface the first Kai message + redirect target.
  if (currentStep === 6 && firstMessage) {
    const painpointRedirect: Record<string, string> = {
      bir_compliance: '/deadlines',
      receipt_tracking: '/expenses',
      customer_messages: '/chat',
      knowing_earnings: '/dashboard',
    };
    const redirectTo = painpointRedirect[savedData.primary_pain ?? ''] ?? '/dashboard';

    return (
      <div
        className="flex flex-col gap-6 animate-in fade-in duration-500"
        data-testid="onboarding-celebrate"
      >
        <div className="flex justify-center">
          <KaiSitting size={144} animated />
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-serif text-2xl font-medium text-on-surface">
            {t('celebrate.title', { name: firstName || 'Boss' })}
          </h2>
          <p className="text-on-surface-variant text-sm">{t('celebrate.subtitle')}</p>
        </div>
        <PaperNote tone="honey" tilt="right" tape="left" padding="md" className="self-center">
          <p className="text-sm leading-relaxed">{firstMessage}</p>
        </PaperNote>
        <button
          type="button"
          onClick={() => setCurrentStep(6.5)}
          className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all min-h-[48px]"
        >
          {t('celebrate.cta')}
        </button>
      </div>
    );
  }

  // Step 6.5: PWA install guide (optional, non-blocking).
  if (currentStep === 6.5) {
    const painpointRedirect: Record<string, string> = {
      bir_compliance: '/deadlines',
      receipt_tracking: '/expenses',
      customer_messages: '/chat',
      knowing_earnings: '/dashboard',
    };
    const redirectTo = painpointRedirect[savedData.primary_pain ?? ''] ?? '/dashboard';

    const goToDashboard = () => {
      router.push(redirectTo);
      router.refresh();
    };

    return (
      <div
        className="flex flex-col gap-6 animate-in fade-in duration-500"
        data-testid="onboarding-install-step"
      >
        <InstallGuide onDismiss={goToDashboard} showDismiss variant="onboarding" />
        <button
          type="button"
          onClick={goToDashboard}
          className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all min-h-[48px]"
          data-testid="onboarding-continue-btn"
        >
          Tara na sa dashboard!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-error-container/20 border border-on-error-container/20 rounded-2xl p-3">
          <p className="text-on-error-container text-sm">{error}</p>
        </div>
      )}

      {currentStep === 1 && (
        <ShellWrapper step={1} prompt={t('step1.kaiPrompt')} expression={STEP_EXPRESSION[1]}>
          <StepWelcome
            onComplete={handleStep1}
            loading={loading}
            initialName={savedData.display_name}
          />
        </ShellWrapper>
      )}
      {currentStep === 2 && (
        <ShellWrapper
          step={2}
          prompt={t('step2.kaiPrompt', { name: firstName || 'Boss' })}
          expression={STEP_EXPRESSION[2]}
        >
          <StepBusinessType
            onComplete={handleStep2}
            loading={loading}
            firstName={firstName}
            initialValue={savedData.business_type}
          />
        </ShellWrapper>
      )}
      {currentStep === 3 && (
        <ShellWrapper
          step={3}
          prompt={t('step3.kaiPrompt', { name: firstName || 'Boss' })}
          expression={STEP_EXPRESSION[3]}
        >
          <StepIncomeRange
            onComplete={handleStep3}
            loading={loading}
            firstName={firstName}
            initialValue={savedData.income_range}
          />
        </ShellWrapper>
      )}
      {currentStep === 4 && (
        <ShellWrapper
          step={4}
          prompt={t('step4.kaiPrompt', { name: firstName || 'Boss' })}
          expression={STEP_EXPRESSION[4]}
        >
          <StepPainPoint
            onComplete={handleStep4}
            loading={loading}
            firstName={firstName}
            initialValue={savedData.primary_pain}
          />
        </ShellWrapper>
      )}
      {currentStep === 5 && (
        <ShellWrapper
          step={5}
          prompt={t('step5.kaiPrompt', { name: firstName || 'Boss' })}
          expression={STEP_EXPRESSION[5]}
        >
          <StepBirConsent onComplete={handleStep5} loading={loading} firstName={firstName} />
        </ShellWrapper>
      )}
      {currentStep === 5.5 && (
        <ShellWrapper step={5} prompt={t('step5.kaiPrompt', { name: firstName || 'Boss' })} expression="working">
          <StepBirTaxType onComplete={handleBirTaxType} loading={loading} firstName={firstName} />
        </ShellWrapper>
      )}
    </div>
  );
}

interface ShellWrapperProps {
  step: 1 | 2 | 3 | 4 | 5;
  prompt: string;
  subtitle?: ReactNode;
  expression: KaiExpression;
  children: ReactNode;
}

function ShellWrapper({ step, prompt, subtitle, expression, children }: ShellWrapperProps) {
  return (
    <OnboardingShell
      step={step}
      expression={expression}
      tilt={STEP_TILT[step]}
      prompt={prompt}
      promptSubtitle={subtitle}
    >
      {children}
    </OnboardingShell>
  );
}

