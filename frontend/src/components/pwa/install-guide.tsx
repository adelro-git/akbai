/**
 * PWA Install Guide — Platform-specific "Add to Home Screen" instructions
 * Feature: PWA Install Guide (Sprint 12, Gaps B7+D9)
 * Role: Shows step-by-step install instructions tailored to iOS/Android/Desktop
 *
 * Flow: Detect platform via usePwaInstall → render platform-specific steps
 *       → on Android, offer native prompt if available
 *
 * Dependencies: hooks/use-pwa-install.ts, Lucide icons
 * Tested by: QA — platform detection, render variants, install prompt
 */

'use client';

import { Share, SquarePlus, Smartphone, Download, Monitor, Check } from 'lucide-react';
import { usePwaInstall, type Platform } from '@/hooks/use-pwa-install';

// ============================================================
// Props
// ============================================================

interface InstallGuideProps {
  /** Optional: called when user taps "Skip" or "Sige na" */
  onDismiss?: () => void;
  /** Whether to show the dismiss/skip button (default: true) */
  showDismiss?: boolean;
  /** Variant: "onboarding" is compact, "settings" is full */
  variant?: 'onboarding' | 'settings';
}

// ============================================================
// Main Component
// ============================================================

export default function InstallGuide({
  onDismiss,
  showDismiss = true,
  variant = 'settings',
}: InstallGuideProps) {
  const { platform, isInstalled, canPrompt, promptInstall } = usePwaInstall();

  // --- Already installed: show confirmation ---
  if (isInstalled) {
    return (
      <div
        className="bg-tertiary-container rounded-2xl p-4 flex items-center gap-3"
        data-testid="install-guide-installed"
      >
        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-container-lowest">
          <Check className="w-5 h-5 text-tertiary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">
            Naka-install na ang AKBai
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Mahahanap mo si Kai sa home screen mo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="install-guide"
      data-platform={platform}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-primary-container/20">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-on-surface">
            I-add ang AKBai sa home screen mo
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Para mas mabilis mong ma-access si Kai
          </p>
        </div>
      </div>

      {/* Platform-specific instructions */}
      <PlatformSteps platform={platform} canPrompt={canPrompt} promptInstall={promptInstall} />

      {/* Dismiss button */}
      {showDismiss && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm text-on-surface-variant font-medium min-h-[44px] rounded-xl hover:bg-surface-container transition-colors"
          data-testid="install-guide-dismiss"
        >
          {variant === 'onboarding' ? 'Mamaya na lang' : 'I-dismiss'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// Platform-Specific Step Components
// ============================================================

interface PlatformStepsProps {
  platform: Platform;
  canPrompt: boolean;
  promptInstall: () => Promise<boolean>;
}

function PlatformSteps({ platform, canPrompt, promptInstall }: PlatformStepsProps) {
  if (platform === 'ios') return <IOSSteps />;
  if (platform === 'android') return <AndroidSteps canPrompt={canPrompt} promptInstall={promptInstall} />;
  return <DesktopSteps />;
}

// ============================================================
// iOS Steps — Share → Add to Home Screen
// ============================================================

function IOSSteps() {
  return (
    <div
      className="bg-surface-container rounded-2xl p-4 flex flex-col gap-4"
      data-testid="install-steps-ios"
    >
      <InstallStep
        stepNumber={1}
        icon={<Share className="w-4 h-4 text-primary" />}
        title="I-tap ang Share button"
        description="Yung icon na may arrow pataas sa baba ng Safari"
      />
      <InstallStep
        stepNumber={2}
        icon={<SquarePlus className="w-4 h-4 text-primary" />}
        title={'I-tap ang "Add to Home Screen"'}
        description="I-scroll pababa kung hindi mo makita agad"
      />
      <InstallStep
        stepNumber={3}
        icon={<Check className="w-4 h-4 text-primary" />}
        title={'I-tap ang "Add"'}
        description="Lalabas na si AKBai sa home screen mo"
      />
    </div>
  );
}

// ============================================================
// Android Steps — Native prompt or manual instructions
// ============================================================

interface AndroidStepsProps {
  canPrompt: boolean;
  promptInstall: () => Promise<boolean>;
}

function AndroidSteps({ canPrompt, promptInstall }: AndroidStepsProps) {
  if (canPrompt) {
    return (
      <div
        className="bg-surface-container rounded-2xl p-4 flex flex-col gap-4"
        data-testid="install-steps-android-prompt"
      >
        <p className="text-sm text-on-surface">
          Pwede mo nang i-install ang AKBai nang diretso.
        </p>
        <button
          type="button"
          onClick={() => { promptInstall(); }}
          className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all min-h-[44px] flex items-center justify-center gap-2"
          data-testid="install-prompt-btn"
        >
          <Download className="w-5 h-5" />
          I-install ang AKBai
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-surface-container rounded-2xl p-4 flex flex-col gap-4"
      data-testid="install-steps-android-manual"
    >
      <InstallStep
        stepNumber={1}
        icon={<Smartphone className="w-4 h-4 text-primary" />}
        title="I-tap ang menu ng Chrome"
        description="Yung tatlong tuldok sa kanang itaas"
      />
      <InstallStep
        stepNumber={2}
        icon={<Download className="w-4 h-4 text-primary" />}
        title={'I-tap ang "Install app" o "Add to Home screen"'}
        description="Lalabas ang confirmation dialog"
      />
      <InstallStep
        stepNumber={3}
        icon={<Check className="w-4 h-4 text-primary" />}
        title={'I-tap ang "Install"'}
        description="Mahahanap mo na si AKBai sa home screen mo"
      />
    </div>
  );
}

// ============================================================
// Desktop Steps — Address bar install icon
// ============================================================

function DesktopSteps() {
  return (
    <div
      className="bg-surface-container rounded-2xl p-4 flex flex-col gap-4"
      data-testid="install-steps-desktop"
    >
      <InstallStep
        stepNumber={1}
        icon={<Monitor className="w-4 h-4 text-primary" />}
        title="Hanapin ang install icon sa address bar"
        description="Karaniwang may icon na monitor o download sa kanan ng URL bar"
      />
      <InstallStep
        stepNumber={2}
        icon={<Download className="w-4 h-4 text-primary" />}
        title={'I-click ang "Install"'}
        description="Mag-o-open ang AKBai bilang sariling window"
      />
    </div>
  );
}

// ============================================================
// Reusable Step Row
// ============================================================

interface InstallStepProps {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function InstallStep({ stepNumber, icon, title, description }: InstallStepProps) {
  return (
    <div className="flex items-start gap-3" data-testid={`install-step-${stepNumber}`}>
      <div className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-primary-container/15">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
      </div>
    </div>
  );
}
