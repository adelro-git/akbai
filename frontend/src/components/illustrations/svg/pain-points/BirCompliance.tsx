interface IllustrationProps {
  size?: number;
  className?: string;
}

export function BirCompliance({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="BIR tax compliance"
      className={className}
    >
      {/* Calendar body */}
      <rect x="6" y="10" width="36" height="32" rx="3" fill="hsl(var(--surface))" />
      <rect x="6" y="10" width="36" height="32" rx="3" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />

      {/* Calendar header */}
      <rect x="6" y="10" width="36" height="10" rx="3" fill="hsl(var(--primary-container))" />
      <rect x="6" y="17" width="36" height="3" fill="hsl(var(--primary-container))" />

      {/* Binding rings */}
      <rect x="14" y="7" width="3" height="6" rx="1.5" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="31" y="7" width="3" height="6" rx="1.5" fill="hsl(var(--on-surface))" opacity="0.5" />

      {/* Month text placeholder */}
      <rect x="15" y="13" width="18" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.5" />

      {/* Day grid */}
      {/* Row 1 */}
      <rect x="10" y="23" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="16" y="23" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="22" y="23" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="28" y="23" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="34" y="23" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      {/* Row 2 */}
      <rect x="10" y="29" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="16" y="29" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="22" y="29" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="28" y="29" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="34" y="29" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      {/* Row 3 */}
      <rect x="10" y="35" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="16" y="35" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />

      {/* Highlighted deadline day */}
      <rect x="22" y="35" width="4" height="4" rx="1" fill="hsl(var(--tertiary))" opacity="0.6" />

      {/* Checkmark */}
      <path
        d="M30 32 L34 38 L42 24"
        stroke="hsl(var(--tertiary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
