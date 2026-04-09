/**
 * PageBackground — Decorative background wrapper for pages
 *
 * Renders a full-bleed WebP background image at low opacity behind page content.
 * All decorative elements are aria-hidden and pointer-events-none.
 * Opacity is kept subtle (10-18% light, 5-8% dark) so backgrounds don't distract.
 */

import Image from 'next/image';

type PageVariant = 'login' | 'dashboard' | 'onboarding' | 'chat' | 'expenses' | 'deadlines' | 'profile' | 'offline';

interface PageBackgroundProps {
  variant: PageVariant;
  children: React.ReactNode;
}

// Map each variant to its background image (or null if no image available)
const BACKGROUND_MAP: Record<PageVariant, { src: string; opacity: string } | null> = {
  login: { src: 'backgrounds/login-storefront.webp', opacity: 'opacity-[0.15] dark:opacity-[0.08]' },
  dashboard: { src: 'backgrounds/dashboard-workspace.webp', opacity: 'opacity-[0.12] dark:opacity-[0.06]' },
  onboarding: { src: 'backgrounds/onboarding-welcome-bg.webp', opacity: 'opacity-[0.14] dark:opacity-[0.07]' },
  chat: { src: 'backgrounds/chat-atmosphere.webp', opacity: 'opacity-[0.10] dark:opacity-[0.05]' },
  expenses: { src: 'backgrounds/expenses-financial.webp', opacity: 'opacity-[0.12] dark:opacity-[0.06]' },
  deadlines: { src: 'backgrounds/deadlines-bir.webp', opacity: 'opacity-[0.12] dark:opacity-[0.06]' },
  profile: { src: 'backgrounds/profile-banner.webp', opacity: 'opacity-[0.14] dark:opacity-[0.07]' },
  offline: null,
};

export function PageBackground({ variant, children }: PageBackgroundProps) {
  const bg = BACKGROUND_MAP[variant];

  return (
    <div className="relative min-h-dvh">
      {bg && (
        <div
          className={`fixed inset-0 z-0 pointer-events-none ${bg.opacity}`}
          aria-hidden="true"
        >
          <Image
            src={`/illustrations/${bg.src}`}
            alt=""
            fill
            className="object-cover dark:brightness-[0.85] dark:saturate-[0.9]"
            priority={false}
          />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
