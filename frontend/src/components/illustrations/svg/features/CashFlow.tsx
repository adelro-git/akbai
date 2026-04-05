interface IllustrationProps {
  size?: number;
  className?: string;
}

export function CashFlow({ size = 64, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Saan Napunta expense tracking"
      className={className}
    >
      {/* Wallet body */}
      <rect
        x="8" y="16" width="40" height="32" rx="4"
        fill="hsl(var(--primary-container))"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* Wallet flap */}
      <path
        d="M8 24C8 20 10 16 14 16H44C46 16 48 18 48 20V24H8Z"
        fill="hsl(var(--primary))"
        opacity="0.8"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1.5"
      />
      {/* Wallet clasp */}
      <rect x="36" y="30" width="12" height="10" rx="2" fill="hsl(var(--surface))" stroke="hsl(var(--on-surface))" strokeWidth="1" />
      <circle cx="42" cy="35" r="3" fill="hsl(var(--primary-container))" stroke="hsl(var(--on-surface))" strokeWidth="1" />

      {/* Peso coin popping out */}
      <circle cx="52" cy="20" r="10" fill="hsl(var(--tertiary))" stroke="hsl(var(--on-surface))" strokeWidth="1.5" />
      <text
        x="52" y="24"
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="white"
      >₱</text>

      {/* Small sparkle accent */}
      <path d="M56 8L57 11L60 12L57 13L56 16L55 13L52 12L55 11Z" fill="hsl(var(--primary-container))" opacity="0.8" />
    </svg>
  );
}
