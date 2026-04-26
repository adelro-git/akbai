// ============================================================
// DoodleArrow — Phase 4 motif (hand-drawn pointer)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Used in welcome tour overlay to point at element being introduced.
// Source SVG points "up-right" — we rotate via direction prop:
//   right=0deg, down=90deg, left=180deg, up=270deg.
// ============================================================
export type DoodleArrowDirection = 'left' | 'right' | 'down' | 'up';

export type DoodleArrowProps = {
  /** Direction the arrow points. Default 'right'. */
  direction?: DoodleArrowDirection;
  /** Pixel size (square). Default 24. Source repo used 48px. */
  size?: number;
  /** Stroke color. Default honey-deep (#a1620e) per source repo. */
  color?: string;
  className?: string;
  'aria-label'?: string;
};

const ROTATION: Record<DoodleArrowDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export function DoodleArrow({
  direction = 'right',
  size = 24,
  color = '#a1620e',
  className,
  ...rest
}: DoodleArrowProps) {
  const rotate = ROTATION[direction];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden={!rest['aria-label']}
      role={rest['aria-label'] ? 'img' : undefined}
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      {...rest}
    >
      <path
        d="M5 25 Q15 8 38 18"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 12 L40 18 L34 28"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
