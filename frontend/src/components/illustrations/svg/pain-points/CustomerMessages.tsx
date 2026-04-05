interface IllustrationProps {
  size?: number;
  className?: string;
}

export function CustomerMessages({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Customer messages"
      className={className}
    >
      {/* Main chat bubble */}
      <rect x="4" y="6" width="28" height="18" rx="4" fill="hsl(var(--primary-container))" />
      {/* Bubble tail */}
      <path d="M10 24 L6 30 L16 24Z" fill="hsl(var(--primary-container))" />

      {/* Message lines in main bubble */}
      <rect x="9" y="11" width="16" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="9" y="15" width="12" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="9" y="19" width="18" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.7" />

      {/* Reply bubble */}
      <rect x="18" y="28" width="24" height="12" rx="3" fill="hsl(var(--surface-container))" />
      <rect x="18" y="28" width="24" height="12" rx="3" stroke="hsl(var(--on-surface))" strokeWidth="1.5" opacity="0.7" />
      {/* Reply tail */}
      <path d="M36 40 L40 44 L34 40Z" fill="hsl(var(--surface-container))" />

      {/* Reply text lines */}
      <rect x="22" y="32" width="14" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="22" y="35.5" width="10" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />

      {/* Notification dots */}
      <circle cx="38" cy="10" r="4" fill="hsl(var(--tertiary))" />
      <circle cx="38" cy="10" r="2" fill="hsl(var(--tertiary))" opacity="0.8" />
      <text
        x="38"
        y="12"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="bold"
        fill="white"
      >
        5
      </text>
    </svg>
  );
}
