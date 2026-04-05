/**
 * DotPattern — Repeating dot pattern SVG for subtle background texture
 */

interface IllustrationProps {
  size?: number;
  className?: string;
}

export function DotPattern({ className }: IllustrationProps) {
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="hsl(var(--on-surface))" opacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-pattern)" />
    </svg>
  );
}
