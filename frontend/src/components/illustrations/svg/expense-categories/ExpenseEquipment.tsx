interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseEquipment({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Equipment expenses"
      className={className}
    >
      {/* Gear/cog outer */}
      <path
        d="M20 6L22.5 8.5L26 7.5L27 11L30.5 12L30 15.5L33 18L31 21L33 24L30 26.5L30.5 30L27 31L26 34.5L22.5 33.5L20 36L17.5 33.5L14 34.5L13 31L9.5 30L10 26.5L7 24L9 21L7 18L10 15.5L9.5 12L13 11L14 7.5L17.5 8.5L20 6Z"
        fill="hsl(var(--primary-container))"
        stroke="hsl(var(--on-surface))"
        strokeWidth="0.8"
        opacity="0.25"
      />
      {/* Gear inner circle */}
      <circle cx="20" cy="21" r="7" fill="hsl(var(--surface-container))" />
      {/* Gear center hole */}
      <circle cx="20" cy="21" r="3" fill="hsl(var(--primary-container))" />
      {/* Gear center dot */}
      <circle cx="20" cy="21" r="1.2" fill="#f59e0b" />
      {/* Wrench */}
      <path
        d="M5 33L15 23"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Wrench head */}
      <path
        d="M14 24C14 24 17 22 18 23C19 24 17 27 17 27L14 24Z"
        fill="#f59e0b"
      />
      {/* Wrench handle end */}
      <circle cx="5" cy="33" r="2" fill="#d97706" />
      {/* Screwdriver */}
      <rect x="30" y="28" width="2.5" height="9" rx="1" fill="hsl(var(--tertiary))" opacity="0.8" transform="rotate(-30 31.25 32.5)" />
      {/* Screwdriver tip */}
      <rect x="28" y="26" width="1.5" height="4" rx="0.3" fill="hsl(var(--on-surface))" opacity="0.4" transform="rotate(-30 28.75 28)" />
      {/* Screwdriver handle grip lines */}
      <rect x="33" y="32" width="1.8" height="0.8" rx="0.2" fill="hsl(var(--surface-container))" opacity="0.4" transform="rotate(-30 33.9 32.4)" />
      <rect x="33.5" y="33.5" width="1.8" height="0.8" rx="0.2" fill="hsl(var(--surface-container))" opacity="0.4" transform="rotate(-30 34.4 33.9)" />
    </svg>
  );
}
