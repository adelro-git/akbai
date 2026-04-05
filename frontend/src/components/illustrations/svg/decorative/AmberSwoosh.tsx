interface AmberSwooshProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AmberSwoosh({ width = 200, height = 100, className }: AmberSwooshProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Back swoosh layer - lower opacity */}
      <path
        d="M0 80C30 60 60 20 100 30C140 40 160 80 200 50"
        stroke="#f59e0b"
        strokeWidth="20"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* Front swoosh layer - slightly higher opacity */}
      <path
        d="M0 60C40 40 70 10 110 25C150 40 170 70 200 40"
        stroke="#f59e0b"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
