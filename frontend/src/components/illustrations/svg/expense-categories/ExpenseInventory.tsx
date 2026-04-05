interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseInventory({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Inventory expenses"
      className={className}
    >
      {/* Bottom box */}
      <rect x="4" y="18" width="22" height="16" rx="1.5" fill="hsl(var(--primary-container))" stroke="hsl(var(--on-surface))" strokeWidth="0.8" opacity="0.25" />
      {/* Bottom box tape */}
      <rect x="13" y="18" width="4" height="16" rx="0.5" fill="#f59e0b" opacity="0.4" />
      {/* Bottom box front face */}
      <rect x="4" y="26" width="22" height="8" rx="1" fill="#d97706" opacity="0.2" />
      {/* Top box (stacked, offset) */}
      <rect x="10" y="5" width="20" height="14" rx="1.5" fill="#f59e0b" />
      {/* Top box tape */}
      <rect x="18" y="5" width="4" height="14" rx="0.5" fill="#fbbf24" opacity="0.5" />
      {/* Top box lid line */}
      <rect x="10" y="11" width="20" height="1" rx="0.3" fill="#d97706" opacity="0.3" />
      {/* Top box shadow on bottom box */}
      <rect x="10" y="18" width="16" height="2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.2" />
      {/* Price tag */}
      <rect x="28" y="10" width="8" height="12" rx="1.5" fill="hsl(var(--tertiary))" opacity="0.85" />
      {/* Tag hole */}
      <circle cx="32" cy="13" r="1.2" fill="hsl(var(--surface-container))" />
      {/* Tag string */}
      <path d="M30 10L30 7C30 6 31 5.5 32 6" stroke="hsl(var(--on-surface))" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" fill="none" />
      {/* Tag price lines */}
      <rect x="29.5" y="16" width="5" height="1" rx="0.3" fill="hsl(var(--surface-container))" opacity="0.8" />
      <rect x="30.5" y="18.5" width="3" height="1" rx="0.3" fill="hsl(var(--surface-container))" opacity="0.6" />
    </svg>
  );
}
