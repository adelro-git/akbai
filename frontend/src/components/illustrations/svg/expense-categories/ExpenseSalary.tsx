interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseSalary({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Salary expenses"
      className={className}
    >
      {/* Person 1 - head */}
      <circle cx="13" cy="12" r="4.5" fill="hsl(var(--primary-container))" />
      {/* Person 1 - shoulders/body */}
      <path
        d="M4 30C4 23 7.5 19 13 19C18.5 19 22 23 22 30H4Z"
        fill="hsl(var(--primary-container))"
      />
      {/* Person 1 - face detail */}
      <circle cx="13" cy="12" r="3.2" fill="#f59e0b" opacity="0.5" />
      {/* Person 2 - head (slightly behind) */}
      <circle cx="24" cy="14" r="4" fill="hsl(var(--on-surface))" opacity="0.2" />
      {/* Person 2 - shoulders/body */}
      <path
        d="M16 32C16 26 19 22 24 22C29 22 32 26 32 32H16Z"
        fill="hsl(var(--on-surface))"
        opacity="0.2"
      />
      {/* Person 2 - face detail */}
      <circle cx="24" cy="14" r="2.8" fill="hsl(var(--on-surface))" opacity="0.12" />
      {/* Peso coin */}
      <circle cx="34" cy="10" r="5" fill="hsl(var(--tertiary))" opacity="0.85" />
      <circle cx="34" cy="10" r="3.5" fill="hsl(var(--tertiary))" />
      <text
        x="34"
        y="13"
        textAnchor="middle"
        fill="hsl(var(--surface-container))"
        fontSize="7"
        fontWeight="bold"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ₱
      </text>
      {/* Coin shine */}
      <path
        d="M31 7.5C31.5 7 32.5 6.5 33.5 6.5"
        stroke="hsl(var(--surface-container))"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      {/* Ground line */}
      <rect x="2" y="31" width="30" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.08" />
    </svg>
  );
}
