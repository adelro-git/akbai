'use client';

import { type ReactNode } from 'react';
import { Kai, type KaiExpression } from '@/components/illustrations/kai';
import { PaperNote } from '@/components/ui/paper-note';
import SampaguitaProgress from './sampaguita-progress';

// ============================================================
// Phase 6 — Onboarding shell (kumustahan frame).
// Wraps each wizard step: sampaguita stepper at top, then a Kai
// expression beside a tilted PaperNote speech bubble carrying the
// step prompt, then the step's form content slot, then the CTA.
// ============================================================

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  expression: KaiExpression;
  prompt: ReactNode;
  /** Optional subtitle rendered under the prompt (e.g., privacy reassurance). */
  promptSubtitle?: ReactNode;
  /** Form content (inputs, selectors). The CTA is rendered by the caller. */
  children: ReactNode;
  /** Tilt direction of the prompt PaperNote — alternates per step for warmth. */
  tilt?: 'left' | 'right';
}

export default function OnboardingShell({
  step,
  totalSteps = 5,
  expression,
  prompt,
  promptSubtitle,
  children,
  tilt = 'left',
}: OnboardingShellProps) {
  return (
    <div className="flex flex-col gap-6" data-testid={`onboarding-step-${step}`}>
      <SampaguitaProgress current={step} total={totalSteps} />

      <div className="flex items-end gap-3">
        <div className="flex-shrink-0">
          <Kai expression={expression} size={72} animated />
        </div>
        <PaperNote
          tilt={tilt}
          padding="md"
          tape={tilt === 'left' ? 'right' : 'left'}
          className="flex-1 max-w-full"
          data-testid={`onboarding-prompt-${step}`}
        >
          <p className="font-serif text-lg leading-snug text-on-surface">{prompt}</p>
          {promptSubtitle && (
            <p className="mt-1.5 text-xs text-on-surface-variant">{promptSubtitle}</p>
          )}
        </PaperNote>
      </div>

      {children}
    </div>
  );
}
