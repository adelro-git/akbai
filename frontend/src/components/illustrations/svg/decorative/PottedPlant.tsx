interface IllustrationProps {
  size?: number;
  className?: string;
}

export function PottedPlant({ size = 80, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Pot */}
      <path
        d="M25 52L28 72H52L55 52H25Z"
        fill="#c2703e"
      />
      {/* Pot rim */}
      <rect x="22" y="48" width="36" height="5" rx="2" fill="#d4845a" />
      {/* Pot shadow/detail */}
      <path
        d="M35 52L37 72H52L55 52H35Z"
        fill="#a85d32"
        opacity="0.4"
      />
      {/* Soil */}
      <ellipse cx="40" cy="52" rx="15" ry="2" fill="#8b5e3c" />
      {/* Center leaf (large, upward) */}
      <path
        d="M40 48C40 48 38 30 32 20C32 20 40 25 42 38C42 38 44 25 50 18C50 18 46 32 40 48Z"
        fill="hsl(var(--tertiary))"
      />
      {/* Left leaf */}
      <path
        d="M36 44C36 44 22 36 16 28C16 28 26 34 36 38"
        fill="hsl(var(--tertiary))"
        opacity="0.8"
      />
      <path
        d="M36 44C30 38 22 34 16 28"
        stroke="hsl(var(--tertiary))"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      {/* Right leaf */}
      <path
        d="M44 42C44 42 56 32 64 26C64 26 56 34 44 40"
        fill="hsl(var(--tertiary))"
        opacity="0.7"
      />
      <path
        d="M44 42C52 36 58 30 64 26"
        stroke="hsl(var(--tertiary))"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      {/* Center stem vein */}
      <path
        d="M40 48L37 28"
        stroke="hsl(var(--tertiary))"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M40 48L46 24"
        stroke="hsl(var(--tertiary))"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
