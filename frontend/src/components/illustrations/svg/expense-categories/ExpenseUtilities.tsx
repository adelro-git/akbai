interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseUtilities({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Utilities expenses"
      className={className}
    >
      {/* Bulb glass */}
      <path
        d="M20 4C14.5 4 10 8.5 10 14C10 18.5 13 21 14 23H26C27 21 30 18.5 30 14C30 8.5 25.5 4 20 4Z"
        fill="#fbbf24"
        opacity="0.85"
      />
      {/* Inner glow */}
      <path
        d="M20 7C16.5 7 13.5 10 13.5 14C13.5 17 15.5 19 16 20H24C24.5 19 26.5 17 26.5 14C26.5 10 23.5 7 20 7Z"
        fill="#fde68a"
        opacity="0.6"
      />
      {/* Filament */}
      <path
        d="M17 16L19 12L21 16L23 12"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Bulb base screw */}
      <rect x="14" y="23" width="12" height="2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.6" />
      <rect x="15" y="25" width="10" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="16" y="26.5" width="8" height="1.5" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.6" />
      <rect x="17" y="28" width="6" height="1.5" rx="0.75" fill="hsl(var(--on-surface))" opacity="0.5" />
      {/* Light rays */}
      <rect x="19.25" y="1" width="1.5" height="2.5" rx="0.75" fill="#fbbf24" opacity="0.5" />
      <rect x="8" y="7" width="2.5" height="1.5" rx="0.75" fill="#fbbf24" opacity="0.4" transform="rotate(-40 9.25 7.75)" />
      <rect x="29.5" y="7" width="2.5" height="1.5" rx="0.75" fill="#fbbf24" opacity="0.4" transform="rotate(40 30.75 7.75)" />
      {/* Peso sign */}
      <circle cx="33" cy="30" r="5" fill="hsl(var(--tertiary))" opacity="0.85" />
      <text
        x="33"
        y="33"
        textAnchor="middle"
        fill="hsl(var(--surface-container))"
        fontSize="7"
        fontWeight="bold"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}
