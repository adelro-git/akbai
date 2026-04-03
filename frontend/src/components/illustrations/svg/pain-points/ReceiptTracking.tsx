interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ReceiptTracking({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Receipt tracking"
      className={className}
    >
      {/* Receipt 3 (back) */}
      <rect x="18" y="6" width="18" height="28" rx="1.5" fill="hsl(var(--surface-container))" opacity="0.6" />
      <rect x="20" y="10" width="10" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.1" />
      <rect x="20" y="13" width="13" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.1" />

      {/* Receipt 2 (middle) */}
      <rect x="12" y="9" width="18" height="30" rx="1.5" fill="hsl(var(--surface))" />
      <rect x="12" y="9" width="18" height="30" rx="1.5" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.15" />
      <rect x="14" y="13" width="8" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.12" />
      <rect x="14" y="16" width="14" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.12" />
      <rect x="14" y="19" width="10" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.12" />
      <rect x="14" y="22" width="12" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.12" />
      {/* Jagged bottom edge */}
      <path d="M12 39 L13.5 37 L15 39 L16.5 37 L18 39 L19.5 37 L21 39 L22.5 37 L24 39 L25.5 37 L27 39 L28.5 37 L30 39Z" fill="hsl(var(--surface))" />

      {/* Receipt 1 (front) */}
      <rect x="6" y="12" width="18" height="30" rx="1.5" fill="hsl(var(--surface))" />
      <rect x="6" y="12" width="18" height="30" rx="1.5" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.2" />
      {/* Receipt lines */}
      <rect x="8" y="16" width="10" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="8" y="19" width="14" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="8" y="22" width="8" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="8" y="25" width="12" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="8" y="28" width="6" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="16" y="28" width="5" height="1.5" rx="0.5" fill="hsl(var(--primary-container))" opacity="0.7" />
      {/* Jagged bottom */}
      <path d="M6 42 L7.5 40 L9 42 L10.5 40 L12 42 L13.5 40 L15 42 L16.5 40 L18 42 L19.5 40 L21 42 L22.5 40 L24 42Z" fill="hsl(var(--surface))" />

      {/* Magnifying glass */}
      <circle cx="36" cy="32" r="7" stroke="hsl(var(--tertiary))" strokeWidth="2.5" fill="none" />
      <circle cx="36" cy="32" r="7" fill="hsl(var(--tertiary))" opacity="0.1" />
      <line x1="41" y1="37" x2="45" y2="42" stroke="hsl(var(--tertiary))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
