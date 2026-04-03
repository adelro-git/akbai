interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KaConcerned({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Kai is concerned"
      className={className}
    >
      {/* Golden C-shape body */}
      <path
        d="M30 8C18 8 10 16 10 24C10 32 18 40 30 40C32 40 33 39 33 38C33 37 32 36 30 36C20.5 36 14 30 14 24C14 18 20.5 12 30 12C32 12 33 11 33 10C33 9 32 8 30 8Z"
        fill="#f59e0b"
      />
      {/* Shading */}
      <path
        d="M30 12C20.5 12 14 18 14 24C14 26 14.8 28 16 29.5C17 26 21 20 30 18C32 17.5 33 15 33 14C33 13 32 12 30 12Z"
        fill="#d97706"
        opacity="0.4"
      />
      {/* Left eye */}
      <circle cx="22" cy="22" r="2" fill="#1c1c18" />
      {/* Right eye */}
      <circle cx="30" cy="22" r="2" fill="#1c1c18" />
      {/* Concerned eyebrows - slightly furrowed */}
      <path d="M20 18L24 17" stroke="#1c1c18" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M28 17L32 18" stroke="#1c1c18" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Slightly downturned mouth */}
      <path
        d="M22 30C24 28 28 28 30 30"
        stroke="#1c1c18"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sweat drop */}
      <path
        d="M35 14C35 14 37 17 37 18.5C37 19.9 36.1 21 35 21C33.9 21 33 19.9 33 18.5C33 17 35 14 35 14Z"
        fill="#93c5fd"
        opacity="0.7"
      />
    </svg>
  );
}
