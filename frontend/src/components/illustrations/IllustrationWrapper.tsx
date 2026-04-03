import Image from 'next/image';

type IllustrationCategory = 'hero' | 'onboarding' | 'empty-state' | 'status' | 'celebration';

interface IllustrationWrapperProps {
  src: string;
  alt: string;
  category?: IllustrationCategory;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

const CATEGORY_DEFAULTS: Record<IllustrationCategory, { width: number; height: number }> = {
  hero: { width: 600, height: 338 },
  onboarding: { width: 300, height: 300 },
  'empty-state': { width: 240, height: 180 },
  status: { width: 200, height: 150 },
  celebration: { width: 280, height: 210 },
};

export function IllustrationWrapper({
  src,
  alt,
  category = 'empty-state',
  width,
  height,
  priority = false,
  className,
}: IllustrationWrapperProps) {
  const defaults = CATEGORY_DEFAULTS[category];
  const w = width ?? defaults.width;
  const h = height ?? defaults.height;

  return (
    <div
      className={[
        'relative inline-flex items-center justify-center',
        'dark:brightness-[0.85] dark:saturate-[0.9]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Image
        src={`/illustrations/${src}`}
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}
