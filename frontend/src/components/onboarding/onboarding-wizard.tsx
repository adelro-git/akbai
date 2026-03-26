'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import StepWelcome from './step-welcome';
import StepBusinessType from './step-business-type';
import StepIncomeRange from './step-income-range';
import StepPainPoint from './step-pain-point';
import StepBirConsent from './step-bir-consent';
import { trackOnboardingStarted, trackOnboardingCompleted } from '@/lib/posthog/events';
import type { OnboardingState, BusinessType, IncomeRange, PainPoint } from '@/lib/kilala-kita';

interface OnboardingWizardProps {
  initialState: OnboardingState;
}

export default function OnboardingWizard({ initialState }: OnboardingWizardProps) {
  const router = useRouter();
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

        // Step 5 returns the first KA message
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
    []
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
    [saveStep]
  );

  const handleStep2 = useCallback(
    async (businessType: BusinessType, otherText?: string) => {
      // When "Iba Pa" is selected and user specifies a custom type,
      // store as "other:{userInput}" so downstream can display it.
      const valueToSave = businessType === 'other' && otherText
        ? `other:${otherText}`
        : businessType;
      const ok = await saveStep(2, { business_type: valueToSave });
      if (ok) {
        setSavedData((prev) => ({ ...prev, business_type: valueToSave }));
        setCurrentStep(3);
      }
    },
    [saveStep]
  );

  const handleStep3 = useCallback(
    async (incomeRange: IncomeRange) => {
      const ok = await saveStep(3, { income_range: incomeRange });
      if (ok) {
        setSavedData((prev) => ({ ...prev, income_range: incomeRange }));
        setCurrentStep(4);
      }
    },
    [saveStep]
  );

  const handleStep4 = useCallback(
    async (primaryPain: PainPoint) => {
      const ok = await saveStep(4, { primary_pain: primaryPain });
      if (ok) {
        setSavedData((prev) => ({ ...prev, primary_pain: primaryPain }));
        setCurrentStep(5);
      }
    },
    [saveStep]
  );

  const handleStep5 = useCallback(
    async (birConsent: boolean) => {
      const ok = await saveStep(5, { bir_consent: birConsent });
      if (ok) {
        trackOnboardingCompleted(savedData.business_type ?? 'unknown');
        setCurrentStep(6); // Show first message screen
      }
    },
    [saveStep, savedData.business_type]
  );

  const progressPct = Math.min(((currentStep - 1) / 5) * 100, 100);

  // Step 6: Show first KA message then redirect
  if (currentStep === 6 && firstMessage) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4">
          <p className="text-on-surface text-base leading-relaxed">{firstMessage}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            router.push('/dashboard');
            router.refresh();
          }}
          className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all"
        >
          Simulan na natin!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-container rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step counter */}
      <p className="text-outline text-xs font-medium">
        Step {Math.min(currentStep, 5)} ng 5
      </p>

      {/* Error */}
      {error && (
        <div className="bg-error-container/20 border border-on-error-container/20 rounded-xl p-3">
          <p className="text-on-error-container text-sm">{error}</p>
        </div>
      )}

      {/* Steps */}
      {currentStep === 1 && (
        <StepWelcome
          onComplete={handleStep1}
          loading={loading}
          initialName={savedData.display_name}
        />
      )}
      {currentStep === 2 && (
        <StepBusinessType
          onComplete={handleStep2}
          loading={loading}
          firstName={firstName}
          initialValue={savedData.business_type}
        />
      )}
      {currentStep === 3 && (
        <StepIncomeRange
          onComplete={handleStep3}
          loading={loading}
          firstName={firstName}
          initialValue={savedData.income_range}
        />
      )}
      {currentStep === 4 && (
        <StepPainPoint
          onComplete={handleStep4}
          loading={loading}
          firstName={firstName}
          initialValue={savedData.primary_pain}
        />
      )}
      {currentStep === 5 && (
        <StepBirConsent
          onComplete={handleStep5}
          loading={loading}
          firstName={firstName}
        />
      )}
    </div>
  );
}
