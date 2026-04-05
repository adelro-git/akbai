/**
 * PageBackground — Decorative background wrapper for pages
 *
 * Renders absolutely-positioned SVG elements behind page content.
 * All decorative elements are aria-hidden and pointer-events-none.
 * Opacity is kept very subtle (3-8% light, 3% dark).
 */

import { AmberSwoosh, PottedPlant, CitylineSilhouette, SparkleAccent } from '@/components/illustrations/svg';

type PageVariant = 'login' | 'dashboard' | 'onboarding' | 'chat' | 'expenses' | 'deadlines' | 'profile' | 'offline';

interface PageBackgroundProps {
  variant: PageVariant;
  children: React.ReactNode;
}

export function PageBackground({ variant, children }: PageBackgroundProps) {
  return (
    <div className="relative">
      <BackgroundElements variant={variant} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================
// Background Elements — variant-specific decorative SVGs
// ============================================================

function BackgroundElements({ variant }: { variant: PageVariant }) {
  switch (variant) {
    case 'dashboard':
      return (
        <>
          {/* Mobile: PottedPlant + CitylineSilhouette. Desktop: full set */}
          <div
            className="absolute bottom-24 left-4 z-0 opacity-[0.20] dark:opacity-[0.10] pointer-events-none"
            aria-hidden="true"
          >
            <PottedPlant size={120} />
          </div>
          <div
            className="absolute top-4 right-4 z-0 opacity-[0.15] dark:opacity-[0.08] rotate-180 pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <AmberSwoosh width={280} height={140} />
          </div>
          <div
            className="absolute bottom-16 right-0 z-0 opacity-[0.12] dark:opacity-[0.06] pointer-events-none"
            aria-hidden="true"
          >
            <CitylineSilhouette width={400} height={80} />
          </div>
        </>
      );

    case 'login':
      return (
        <>
          <div
            className="absolute top-8 right-8 z-0 opacity-[0.20] dark:opacity-[0.10] pointer-events-none"
            aria-hidden="true"
          >
            <SparkleAccent size={100} />
          </div>
          <div
            className="absolute top-1/3 -left-8 z-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none"
            aria-hidden="true"
          >
            <AmberSwoosh width={240} height={120} />
          </div>
          <div
            className="absolute bottom-8 right-8 z-0 opacity-[0.10] dark:opacity-[0.06] pointer-events-none"
            aria-hidden="true"
          >
            <PottedPlant size={100} />
          </div>
        </>
      );

    case 'onboarding':
      return (
        <>
          <div
            className="absolute top-4 right-4 z-0 opacity-[0.18] dark:opacity-[0.08] pointer-events-none"
            aria-hidden="true"
          >
            <SparkleAccent size={80} />
          </div>
          <div
            className="absolute bottom-8 left-4 z-0 opacity-[0.12] dark:opacity-[0.06] pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <PottedPlant size={90} />
          </div>
        </>
      );

    case 'chat':
      return (
        <div
          className="absolute top-4 right-4 z-0 opacity-[0.10] dark:opacity-[0.05] pointer-events-none"
          aria-hidden="true"
        >
          <SparkleAccent size={60} />
        </div>
      );

    case 'expenses':
      return (
        <>
          <div
            className="absolute top-0 left-0 z-0 opacity-[0.12] dark:opacity-[0.06] pointer-events-none"
            aria-hidden="true"
          >
            <AmberSwoosh width={320} height={160} />
          </div>
          <div
            className="absolute bottom-24 right-4 z-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <PottedPlant size={80} />
          </div>
        </>
      );

    case 'deadlines':
      return (
        <div
          className="absolute top-4 right-4 z-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none"
          aria-hidden="true"
        >
          <SparkleAccent size={60} />
        </div>
      );

    case 'profile':
      return (
        <>
          <div
            className="absolute bottom-24 right-4 z-0 opacity-[0.18] dark:opacity-[0.08] pointer-events-none"
            aria-hidden="true"
          >
            <PottedPlant size={100} />
          </div>
          <div
            className="absolute top-4 left-4 z-0 opacity-[0.10] dark:opacity-[0.06] pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <SparkleAccent size={50} />
          </div>
        </>
      );

    case 'offline':
      return (
        <div
          className="absolute bottom-0 left-0 right-0 z-0 opacity-[0.15] dark:opacity-[0.08] pointer-events-none"
          aria-hidden="true"
        >
          <CitylineSilhouette width={400} height={80} />
        </div>
      );

    default:
      return null;
  }
}
