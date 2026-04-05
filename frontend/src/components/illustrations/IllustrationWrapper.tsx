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
  onboarding: { width: 400, height: 400 },
  'empty-state': { width: 320, height: 240 },
  status: { width: 280, height: 210 },
  celebration: { width: 360, height: 270 },
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
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-contain dark:brightness-[0.85] dark:saturate-[0.9] max-w-full h-auto"
      />
    </div>
  );
}
