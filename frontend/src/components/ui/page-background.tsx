/**
 * PageBackground — Decorative background wrapper for pages
 *
 * Renders a full-bleed WebP background image at low opacity behind page content.
 * All decorative elements are aria-hidden and pointer-events-none.
 * Opacity is kept subtle (10-15% light, 5-8% dark) so backgrounds don't distract.
 */

import Image from 'next/image';

type PageVariant = 'login' | 'dashboard' | 'onboarding' | 'chat' | 'expenses' | 'deadlines' | 'profile' | 'offline';

interface PageBackgroundProps {
  variant: PageVariant;
  children: React.ReactNode;
}

// Map each variant to its background image config
const BACKGROUND_MAP: Record<PageVariant, { src: string; lightOpacity: number; darkOpacity: number } | null> = {
  login: { src: 'backgrounds/login-storefront.webp', lightOpacity: 0.15, darkOpacity: 0.08 },
  dashboard: { src: 'backgrounds/dashboard-workspace.webp', lightOpacity: 0.12, darkOpacity: 0.06 },
  onboarding: { src: 'backgrounds/onboarding-welcome-bg.webp', lightOpacity: 0.14, darkOpacity: 0.07 },
  chat: { src: 'backgrounds/chat-atmosphere.webp', lightOpacity: 0.10, darkOpacity: 0.05 },
  expenses: { src: 'backgrounds/expenses-financial.webp', lightOpacity: 0.12, darkOpacity: 0.06 },
  deadlines: { src: 'backgrounds/deadlines-bir.webp', lightOpacity: 0.12, darkOpacity: 0.06 },
  profile: { src: 'backgrounds/profile-banner.webp', lightOpacity: 0.14, darkOpacity: 0.07 },
  offline: null,
};

export function PageBackground({ variant, children }: PageBackgroundProps) {
  const bg = BACKGROUND_MAP[variant];

  return (
    <div className="relative min-h-dvh">
      {bg && (
        <>
          {/* Light mode background */}
          <div
            className="fixed inset-0 z-0 pointer-events-none dark:hidden"
            style={{ opacity: bg.lightOpacity }}
            aria-hidden="true"
          >
            <Image
              src={`/illustrations/${bg.src}`}
              alt=""
              fill
              className="object-cover"
              priority={false}
              sizes="100vw"
            />
          </div>
          {/* Dark mode background */}
          <div
            className="fixed inset-0 z-0 pointer-events-none hidden dark:block"
            style={{ opacity: bg.darkOpacity }}
            aria-hidden="true"
          >
            <Image
              src={`/illustrations/${bg.src}`}
              alt=""
              fill
              className="object-cover brightness-[0.85] saturate-[0.9]"
              priority={false}
              sizes="100vw"
            />
          </div>
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
