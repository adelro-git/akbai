interface IllustrationProps {
  size?: number;
  className?: string;
}

export function BirDeadlines({ size = 64, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="BIR deadline reminders"
      className={className}
    >
      {/* Calendar body */}
      <rect x="8" y="14" width="40" height="40" rx="4" fill="hsl(var(--surface))" />
      <rect x="8" y="14" width="40" height="40" rx="4" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.12" />

      {/* Calendar header */}
      <rect x="8" y="14" width="40" height="12" rx="4" fill="hsl(var(--primary-container))" />
      <rect x="8" y="22" width="40" height="4" fill="hsl(var(--primary-container))" />

      {/* Binding rings */}
      <rect x="18" y="10" width="3.5" height="8" rx="1.75" fill="hsl(var(--on-surface))" opacity="0.25" />
      <rect x="34" y="10" width="3.5" height="8" rx="1.75" fill="hsl(var(--on-surface))" opacity="0.25" />

      {/* Month text */}
      <rect x="18" y="18" width="20" height="2.5" rx="1" fill="hsl(var(--on-surface))" opacity="0.25" />

      {/* Day grid - Row 1 */}
      <rect x="12" y="30" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="19" y="30" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="26" y="30" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="33" y="30" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="40" y="30" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />

      {/* Day grid - Row 2 */}
      <rect x="12" y="37" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="19" y="37" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      {/* Highlighted deadline day */}
      <rect x="26" y="37" width="5" height="5" rx="1.5" fill="hsl(var(--tertiary))" opacity="0.3" />
      <circle cx="28.5" cy="39.5" r="1" fill="hsl(var(--tertiary))" />
      <rect x="33" y="37" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="40" y="37" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />

      {/* Day grid - Row 3 */}
      <rect x="12" y="44" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="19" y="44" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="26" y="44" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />
      <rect x="33" y="44" width="5" height="5" rx="1.5" fill="hsl(var(--surface-container))" />

      {/* Bell icon overlay */}
      <circle cx="52" cy="14" r="10" fill="hsl(var(--tertiary))" />
      {/* Bell shape */}
      <path
        d="M49 14 Q49 10 52 9 Q55 10 55 14 L56 16 L48 16Z"
        fill="white"
      />
      <rect x="48" y="16" width="8" height="1.5" rx="0.75" fill="white" />
      <circle cx="52" cy="18.5" r="1.2" fill="white" />
      {/* Bell clapper highlight */}
      <circle cx="52" cy="9" r="0.8" fill="white" />
    </svg>
  );
}
