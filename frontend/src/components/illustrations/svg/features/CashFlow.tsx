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
      aria-label="Cash flow tracking"
      className={className}
    >
      {/* Income node (left) */}
      <circle cx="14" cy="32" r="11" fill="hsl(var(--tertiary))" opacity="0.15" />
      <circle cx="14" cy="32" r="8" fill="hsl(var(--tertiary))" opacity="0.25" />
      <text
        x="14"
        y="36"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="hsl(var(--tertiary))"
      >
        ₱
      </text>

      {/* Expense node (right) */}
      <circle cx="50" cy="32" r="11" fill="hsl(var(--primary-container))" opacity="0.2" />
      <circle cx="50" cy="32" r="8" fill="hsl(var(--primary-container))" opacity="0.35" />
      <text
        x="50"
        y="36"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="hsl(var(--primary-container))"
      >
        ₱
      </text>

      {/* Flow arrow: income to center (right) */}
      <path
        d="M25 28 Q32 24 39 28"
        stroke="hsl(var(--tertiary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <path
        d="M37 26 L39 28 L37 30"
        stroke="hsl(var(--tertiary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Flow arrow: center to expense (left, return) */}
      <path
        d="M39 36 Q32 40 25 36"
        stroke="hsl(var(--primary-container))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <path
        d="M27 34 L25 36 L27 38"
        stroke="hsl(var(--primary-container))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Small floating coins / dots along arrows */}
      <circle cx="30" cy="25.5" r="1.5" fill="hsl(var(--tertiary))" opacity="0.4" />
      <circle cx="34" cy="39" r="1.5" fill="hsl(var(--primary-container))" opacity="0.5" />

      {/* Top label: IN */}
      <text
        x="14"
        y="16"
        textAnchor="middle"
        fontSize="7"
        fontWeight="600"
        fill="hsl(var(--tertiary))"
        opacity="0.7"
      >
        IN
      </text>

      {/* Bottom label: OUT */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        fontSize="7"
        fontWeight="600"
        fill="hsl(var(--primary-container))"
        opacity="0.7"
      >
        OUT
      </text>

      {/* Center balance indicator */}
      <rect x="28" y="30" width="8" height="4" rx="2" fill="hsl(var(--surface-container))" />
      <rect x="29.5" y="31" width="5" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.15" />
    </svg>
  );
}
