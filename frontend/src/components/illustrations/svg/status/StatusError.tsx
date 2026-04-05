interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusError({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Error"
      className={className}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="18" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
      {/* X mark */}
      <path
        d="M14 14L26 26"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 14L14 26"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
