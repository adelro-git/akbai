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
          {/* Mobile: only PottedPlant. Desktop: full set */}
          <div
            className="absolute bottom-8 left-4 z-0 opacity-[0.08] dark:opacity-[0.03] pointer-events-none"
            aria-hidden="true"
          >
            <PottedPlant size={60} />
          </div>
          <div
            className="absolute top-4 right-4 z-0 opacity-[0.05] dark:opacity-[0.03] rotate-180 pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <AmberSwoosh width={120} height={60} />
          </div>
          <div
            className="absolute bottom-0 right-0 z-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none hidden md:block"
            aria-hidden="true"
          >
            <CitylineSilhouette width={200} height={40} />
          </div>
        </>
      );

    case 'login':
      return (
        <>
          <div
            className="absolute top-8 right-8 z-0 opacity-[0.08] dark:opacity-[0.03] pointer-events-none"
            aria-hidden="true"
          >
            <SparkleAccent size={48} />
          </div>
          <div
            className="absolute top-1/3 left-0 z-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
            aria-hidden="true"
          >
            <AmberSwoosh width={100} height={50} />
          </div>
        </>
      );

    case 'onboarding':
      return (
        <div
          className="absolute top-4 right-4 z-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <SparkleAccent size={32} />
        </div>
      );

    case 'chat':
      return (
        <div
          className="absolute top-4 right-4 z-0 opacity-[0.03] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <SparkleAccent size={24} />
        </div>
      );

    case 'expenses':
      return (
        <div
          className="absolute top-0 left-0 right-0 z-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <AmberSwoosh width={160} height={80} />
        </div>
      );

    case 'deadlines':
      return (
        <div
          className="absolute top-4 right-4 z-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <SparkleAccent size={20} />
        </div>
      );

    case 'profile':
      return (
        <div
          className="absolute bottom-8 right-4 z-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <PottedPlant size={48} />
        </div>
      );

    case 'offline':
      return (
        <div
          className="absolute bottom-0 left-0 right-0 z-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
          aria-hidden="true"
        >
          <CitylineSilhouette width={200} height={40} />
        </div>
      );

    default:
      return null;
  }
}
