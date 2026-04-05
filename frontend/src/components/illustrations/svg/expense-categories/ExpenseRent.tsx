interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseRent({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Rent expenses"
      className={className}
    >
      {/* Building body */}
      <rect x="8" y="10" width="20" height="24" rx="1.5" fill="hsl(var(--primary-container))" stroke="hsl(var(--on-surface))" strokeWidth="1.2" opacity="0.7" />
      {/* Roof / awning */}
      <path
        d="M5 10L20 3L35 10H5Z"
        fill="#f59e0b"
      />
      {/* Awning bottom edge */}
      <rect x="5" y="10" width="30" height="2" rx="0.5" fill="#d97706" />
      {/* Window row 1 */}
      <rect x="11" y="14" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      <rect x="20" y="14" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      {/* Window row 2 */}
      <rect x="11" y="20" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      <rect x="20" y="20" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      {/* Door */}
      <rect x="15" y="27" width="6" height="7" rx="1" fill="#d97706" />
      <circle cx="19.5" cy="31" r="0.7" fill="#fbbf24" />
      {/* Signboard */}
      <rect x="10" y="6" width="16" height="3" rx="0.8" fill="hsl(var(--surface-container))" opacity="0.8" />
      {/* Key icon overlay */}
      <circle cx="33" cy="28" r="5" fill="hsl(var(--tertiary))" opacity="0.85" />
      {/* Key shape */}
      <circle cx="32" cy="26.5" r="2" fill="none" stroke="hsl(var(--surface-container))" strokeWidth="1.3" />
      <rect x="33.5" y="26" width="4" height="1.2" rx="0.3" fill="hsl(var(--surface-container))" />
      <rect x="36" y="27.2" width="1.2" height="1.5" rx="0.3" fill="hsl(var(--surface-container))" />
      <rect x="34.5" y="27.2" width="1.2" height="1.2" rx="0.3" fill="hsl(var(--surface-container))" />
    </svg>
  );
}
