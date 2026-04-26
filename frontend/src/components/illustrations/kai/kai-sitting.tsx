// ============================================================
// KaiSitting — Phase 4 hero version of the Kai mark
// ADR-013: 168x168 default, circular clip, ambient drop-shadow. Uses Next/Image
// with `priority` so it can join LCP on the home Kumustahan hero.
// `animated` wraps in `animate-kai-breathe` (reduced-motion gates globally).
// ============================================================
import Image from 'next/image';

export type KaiSittingProps = {
  size?: number;
  animated?: boolean;
  className?: string;
};

export function KaiSitting({ size = 168, animated = false, className }: KaiSittingProps) {
  const image = (
    <Image
      src="/icons/kai-mark.png"
      alt="Kai"
      width={size}
      height={size}
      priority
      className="block object-contain"
      style={{ borderRadius: '50%', width: `${size}px`, height: `${size}px` }}
    />
  );
  return (
    <span
      className={`inline-block shadow-ambient-lg ${animated ? 'animate-kai-breathe' : ''} ${className ?? ''}`}
      style={{ borderRadius: '50%', width: `${size}px`, height: `${size}px` }}
    >
      {image}
    </span>
  );
}
