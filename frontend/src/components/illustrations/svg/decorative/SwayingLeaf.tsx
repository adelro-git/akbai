// ============================================================
// SwayingLeaf — Phase 4 motif (3-leaf branch in sage green)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Ambient corner decoration. Source spec called for `leaf-sway` keyframe;
// Phase 3 hasn't shipped that yet so we use `gentle-float` (tonally similar)
// per spec instruction. Globally-gated reduced-motion already disables this.
// ============================================================
export type SwayingLeafProps = {
  /** Pixel size of rendered SVG. Default 60 — viewBox is 60x80 so height scales 1.33x. */
  size?: number;
  className?: string;
};

export function SwayingLeaf({ size = 60, className }: SwayingLeafProps) {
  const heightPx = (size / 60) * 80;
  return (
    <svg
      width={size}
      height={heightPx}
      viewBox="0 0 60 80"
      aria-hidden="true"
      className={`animate-gentle-float ${className ?? ''}`}
      style={{ transformOrigin: 'bottom center' }}
    >
      <path d="M30 78 Q30 50 30 30" stroke="#5a7d62" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 50 Q18 42 16 30 Q28 36 30 45 Z" fill="#97b39d" />
      <path d="M30 42 Q42 34 44 22 Q32 28 30 37 Z" fill="#b7c9ba" />
      <path d="M30 34 Q20 26 18 16 Q28 22 30 30 Z" fill="#97b39d" opacity="0.85" />
    </svg>
  );
}
