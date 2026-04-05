interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ResiboScanner({ size = 64, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Resibo receipt scanner"
      className={className}
    >
      {/* Phone body */}
      <rect x="14" y="4" width="28" height="48" rx="4" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="1.5" opacity="0.85" />
      {/* Phone screen */}
      <rect x="17" y="8" width="22" height="40" rx="2" fill="hsl(var(--surface))" />

      {/* Camera viewfinder corners */}
      {/* Top-left */}
      <path d="M20 14 L20 11 L23 11" stroke="hsl(var(--tertiary))" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Top-right */}
      <path d="M36 11 L33 11 L33 14" stroke="hsl(var(--tertiary))" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Bottom-left */}
      <path d="M20 38 L20 41 L23 41" stroke="hsl(var(--tertiary))" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Bottom-right */}
      <path d="M36 41 L33 41 L33 38" stroke="hsl(var(--tertiary))" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Receipt inside viewfinder */}
      <rect x="22" y="13" width="12" height="26" rx="1" fill="hsl(var(--surface-container))" />
      {/* Receipt lines */}
      <rect x="24" y="16" width="8" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="24" y="19" width="6" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="24" y="22" width="7" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="24" y="25" width="5" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="24" y="28" width="8" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      {/* Total line */}
      <rect x="24" y="32" width="4" height="1.2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="29" y="32" width="3" height="1.2" rx="0.5" fill="hsl(var(--primary-container))" />
      {/* Jagged bottom */}
      <path d="M22 39 L23.5 37.5 L25 39 L26.5 37.5 L28 39 L29.5 37.5 L31 39 L32.5 37.5 L34 39Z" fill="hsl(var(--surface-container))" />

      {/* Scan line (animated feel) */}
      <rect x="20" y="26" width="16" height="1.5" rx="0.75" fill="hsl(var(--tertiary))" opacity="0.85" />
      {/* Scan line glow */}
      <rect x="20" y="25" width="16" height="3.5" rx="1" fill="hsl(var(--tertiary))" opacity="0.3" />

      {/* Bottom phone bar */}
      <rect x="24" y="45" width="8" height="1.5" rx="0.75" fill="hsl(var(--on-surface))" opacity="0.7" />

      {/* Floating check badge */}
      <circle cx="50" cy="14" r="7" fill="hsl(var(--tertiary))" />
      <path d="M46.5 14 L49 16.5 L53.5 11.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
