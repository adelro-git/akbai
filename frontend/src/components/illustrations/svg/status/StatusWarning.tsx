interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusWarning({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Warning"
      className={className}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="18" fill="#f59e0b" />
      {/* Exclamation mark line */}
      <rect x="18" y="11" width="4" height="13" rx="2" fill="#1c1c18" />
      {/* Exclamation mark dot */}
      <circle cx="20" cy="29" r="2.5" fill="#1c1c18" />
    </svg>
  );
}
