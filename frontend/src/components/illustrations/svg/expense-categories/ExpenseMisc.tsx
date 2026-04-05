interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseMisc({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Miscellaneous expenses"
      className={className}
    >
      {/* Coin outer ring */}
      <circle cx="17" cy="22" r="12" fill="hsl(var(--primary-container))" />
      {/* Coin inner ring */}
      <circle cx="17" cy="22" r="10" fill="#f59e0b" />
      {/* Coin inner circle */}
      <circle cx="17" cy="22" r="8" fill="#fbbf24" />
      {/* Coin edge highlight */}
      <path
        d="M9 17C11 13 14.5 12 17 12"
        stroke="#fde68a"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        fill="none"
      />
      {/* Peso symbol */}
      <text
        x="17"
        y="26"
        textAnchor="middle"
        fill="#92400e"
        fontSize="12"
        fontWeight="bold"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ₱
      </text>
      {/* Question mark */}
      <circle cx="33" cy="12" r="7" fill="hsl(var(--tertiary))" opacity="0.85" />
      <text
        x="33"
        y="15.5"
        textAnchor="middle"
        fill="hsl(var(--surface-container))"
        fontSize="11"
        fontWeight="bold"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ?
      </text>
      {/* Floating dots for "misc" feel */}
      <circle cx="30" cy="28" r="1.5" fill="hsl(var(--on-surface))" opacity="0.3" />
      <circle cx="35" cy="24" r="1" fill="hsl(var(--on-surface))" opacity="0.3" />
      <circle cx="28" cy="33" r="1.8" fill="#fbbf24" opacity="0.3" />
      <circle cx="34" cy="32" r="1.2" fill="hsl(var(--tertiary))" opacity="0.2" />
      {/* Small sparkle near coin */}
      <path d="M5 10L5.7 8L6.4 10L8.4 10.7L6.4 11.4L5.7 13.4L5 11.4L3 10.7Z" fill="#fbbf24" opacity="0.5" />
    </svg>
  );
}
