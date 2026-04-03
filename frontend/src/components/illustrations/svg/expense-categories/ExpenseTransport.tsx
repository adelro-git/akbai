interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseTransport({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Transportation expenses"
      className={className}
    >
      {/* Jeepney body */}
      <rect x="5" y="14" width="30" height="14" rx="2" fill="hsl(var(--primary-container))" />
      {/* Jeepney roof */}
      <rect x="4" y="11" width="32" height="4" rx="1.5" fill="#f59e0b" />
      {/* Roof rack rails */}
      <rect x="6" y="9.5" width="28" height="2" rx="1" fill="#d97706" />
      {/* Characteristic front face */}
      <rect x="5" y="14" width="4" height="14" rx="1" fill="#e8a308" />
      {/* Windshield */}
      <rect x="6" y="15.5" width="2.5" height="5" rx="0.5" fill="hsl(var(--surface-container))" />
      {/* Side windows */}
      <rect x="12" y="16" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      <rect x="19" y="16" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      <rect x="26" y="16" width="5" height="4" rx="0.8" fill="hsl(var(--surface-container))" />
      {/* Bumper stripe */}
      <rect x="5" y="25" width="30" height="2" rx="0.5" fill="#d97706" />
      {/* Rear opening */}
      <rect x="31" y="17" width="3" height="8" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.15" />
      {/* Left wheel */}
      <circle cx="12" cy="30" r="3" fill="hsl(var(--on-surface))" opacity="0.7" />
      <circle cx="12" cy="30" r="1.5" fill="hsl(var(--surface-container))" />
      {/* Right wheel */}
      <circle cx="28" cy="30" r="3" fill="hsl(var(--on-surface))" opacity="0.7" />
      <circle cx="28" cy="30" r="1.5" fill="hsl(var(--surface-container))" />
      {/* Headlight */}
      <circle cx="7" cy="24" r="1.2" fill="#fbbf24" />
      {/* Ground line */}
      <rect x="3" y="32.5" width="34" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.1" />
    </svg>
  );
}
