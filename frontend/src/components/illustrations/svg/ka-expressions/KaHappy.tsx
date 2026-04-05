interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KaHappy({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Kai is happy"
      className={className}
    >
      {/* Golden C-shape body */}
      <path
        d="M30 8C18 8 10 16 10 24C10 32 18 40 30 40C32 40 33 39 33 38C33 37 32 36 30 36C20.5 36 14 30 14 24C14 18 20.5 12 30 12C32 12 33 11 33 10C33 9 32 8 30 8Z"
        fill="#f59e0b"
        stroke="#92400e"
        strokeWidth="1.5"
      />
      {/* Shading on inner curve */}
      <path
        d="M30 12C20.5 12 14 18 14 24C14 26 14.8 28 16 29.5C17 26 21 20 30 18C32 17.5 33 15 33 14C33 13 32 12 30 12Z"
        fill="#d97706"
        opacity="0.8"
      />
      {/* Left eye */}
      <circle cx="22" cy="22" r="2" fill="#1c1c18" />
      {/* Right eye */}
      <circle cx="30" cy="22" r="2" fill="#1c1c18" />
      {/* Happy smile */}
      <path
        d="M21 28C23 31 29 31 31 28"
        stroke="#1c1c18"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparkle accent top-right */}
      <path
        d="M38 6L39 9L42 10L39 11L38 14L37 11L34 10L37 9Z"
        fill="#fbbf24"
      />
      {/* Small sparkle */}
      <path
        d="M42 16L42.5 17.5L44 18L42.5 18.5L42 20L41.5 18.5L40 18L41.5 17.5Z"
        fill="#fde68a"
      />
    </svg>
  );
}
