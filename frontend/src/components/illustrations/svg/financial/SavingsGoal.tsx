interface IllustrationProps {
  size?: number;
  className?: string;
}

export function SavingsGoal({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Savings goal"
      className={className}
    >
      {/* Piggy bank body */}
      <ellipse cx="20" cy="23" rx="13" ry="10" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
      {/* Piggy bank ear */}
      <ellipse cx="11" cy="16" rx="3" ry="4" fill="#d97706" />
      {/* Snout */}
      <ellipse cx="31" cy="23" rx="3.5" ry="2.5" fill="#d97706" />
      {/* Nostril dots */}
      <circle cx="30" cy="22.5" r="0.8" fill="#92400e" />
      <circle cx="32" cy="22.5" r="0.8" fill="#92400e" />
      {/* Eye */}
      <circle cx="15" cy="20" r="1.2" fill="#1c1c18" />
      {/* Legs */}
      <rect x="13" y="30" width="3" height="4" rx="1" fill="#d97706" />
      <rect x="24" y="30" width="3" height="4" rx="1" fill="#d97706" />
      {/* Coin slot */}
      <rect x="17" y="13" width="6" height="1.5" rx="0.75" fill="#92400e" />
      {/* Coin going in */}
      <circle cx="20" cy="9" r="3.5" fill="#fbbf24" />
      <text
        x="20"
        y="11"
        fontSize="5"
        fontWeight="700"
        fill="#92400e"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}
