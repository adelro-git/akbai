// ============================================================
// Squiggle — Phase 4 motif (hand-drawn underline accent)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Used once per screen as a deliberate accent under serif greetings or headlines.
// Default width 120px (FIL); pass 130 for English to compensate visual length.
// ============================================================
export type SquiggleProps = {
  /** Pixel width of rendered SVG. Default 120 (Filipino). Pass 130 for English. */
  width?: number;
  /** Stroke color. Default honey-deep tint (#e89b2f) per source repo. */
  color?: string;
  className?: string;
};

export function Squiggle({ width = 120, color = '#e89b2f', className }: SquiggleProps) {
  return (
    <svg
      width={width}
      height={8}
      viewBox="0 0 80 8"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 5 Q12 1 22 5 T42 5 T62 5 T78 5"
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
