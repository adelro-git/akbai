interface IllustrationProps {
  size?: number;
  className?: string;
}

export function OnlineSelling({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Online selling business"
      className={className}
    >
      {/* Phone body */}
      <rect x="12" y="4" width="24" height="40" rx="4" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="1.5" opacity="0.7" />
      {/* Phone screen */}
      <rect x="14" y="8" width="20" height="32" rx="2" fill="hsl(var(--surface))" />

      {/* Shopping bag on screen */}
      <rect x="18" y="16" width="12" height="14" rx="2" fill="hsl(var(--primary-container))" />
      {/* Bag handles */}
      <path
        d="M21 16 Q21 12 24 12 Q27 12 27 16"
        stroke="#d4954a"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bag detail line */}
      <rect x="20" y="19" width="8" height="1.5" rx="0.5" fill="#e8b06a" opacity="0.8" />

      {/* Cart badge */}
      <circle cx="32" cy="14" r="5" fill="hsl(var(--tertiary))" />
      <text
        x="32"
        y="16.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="white"
      >
        3
      </text>

      {/* Bottom bar indicator */}
      <rect x="20" y="37" width="8" height="1.5" rx="0.75" fill="hsl(var(--on-surface))" opacity="0.7" />
    </svg>
  );
}
