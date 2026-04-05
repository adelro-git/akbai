interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KaWaving({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Kai is waving"
      className={className}
    >
      {/* Golden C-shape body */}
      <path
        d="M28 8C16 8 8 16 8 24C8 32 16 40 28 40C30 40 31 39 31 38C31 37 30 36 28 36C18.5 36 12 30 12 24C12 18 18.5 12 28 12C30 12 31 11 31 10C31 9 30 8 28 8Z"
        fill="#f59e0b"
        stroke="#92400e"
        strokeWidth="1"
      />
      {/* Shading */}
      <path
        d="M28 12C18.5 12 12 18 12 24C12 26 12.8 28 14 29.5C15 26 19 20 28 18C30 17.5 31 15 31 14C31 13 30 12 28 12Z"
        fill="#d97706"
        opacity="0.6"
      />
      {/* Left eye */}
      <circle cx="20" cy="22" r="2" fill="#1c1c18" />
      {/* Right eye */}
      <circle cx="28" cy="22" r="2" fill="#1c1c18" />
      {/* Happy smile */}
      <path
        d="M19 28C21 31 27 31 29 28"
        stroke="#1c1c18"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Waving hand - extending from right side */}
      <path
        d="M33 20C35 18 37 16 38 14"
        stroke="#f59e0b"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hand/palm */}
      <circle cx="38" cy="13" r="3.5" fill="#f59e0b" />
      <circle cx="38" cy="13" r="2.5" fill="#fbbf24" />
      {/* Motion lines */}
      <path d="M41 10L43 8" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M42 14L44 13" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M41 18L43 18" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}
