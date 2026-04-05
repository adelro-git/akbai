interface IllustrationProps {
  size?: number;
  className?: string;
}

export function Freelance({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Freelance business"
      className={className}
    >
      {/* Laptop base */}
      <rect x="4" y="36" width="30" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.8" />
      {/* Laptop bottom */}
      <path d="M6 36 L8 34 L28 34 L30 36Z" fill="hsl(var(--surface-container))" />
      {/* Laptop screen body */}
      <rect x="7" y="16" width="22" height="18" rx="2" fill="hsl(var(--surface-container))" />
      {/* Laptop screen */}
      <rect x="9" y="18" width="18" height="14" rx="1" fill="hsl(var(--surface))" />

      {/* Code lines on screen */}
      <rect x="11" y="20" width="10" height="1.5" rx="0.5" fill="hsl(var(--tertiary))" opacity="0.8" />
      <rect x="11" y="23" width="14" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />
      <rect x="11" y="26" width="8" height="1.5" rx="0.5" fill="hsl(var(--primary-container))" opacity="0.8" />
      <rect x="11" y="29" width="12" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.7" />

      {/* Coffee cup */}
      <rect x="36" y="28" width="8" height="10" rx="2" fill="#d4954a" />
      {/* Cup rim */}
      <rect x="35" y="27" width="10" height="2" rx="1" fill="#e8b06a" />
      {/* Cup handle */}
      <path
        d="M44 31 Q47 31 47 34 Q47 37 44 37"
        stroke="#d4954a"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Coffee surface */}
      <ellipse cx="40" cy="30" rx="3" ry="1" fill="#8B5E34" opacity="0.7" />

      {/* Steam from coffee */}
      <path
        d="M39 24 Q37.5 21 39 19"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M42 23 Q40.5 20 42 18"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
