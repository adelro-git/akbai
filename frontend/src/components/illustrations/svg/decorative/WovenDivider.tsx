// ============================================================
// WovenDivider — Phase 4 motif (banig-weave 32-segment zigzag)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Replaces the rejected SampaguitaGarland — Phase 1 design-system §6
// Banig is the inclusive primary motif (working-class, unisex).
// ============================================================
const ZIGZAG_SEGMENTS: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
  { x1: 6, y1: 2, x2: 13, y2: 8 },
  { x1: 18.3, y1: 8, x2: 25.3, y2: 2 },
  { x1: 30.6, y1: 2, x2: 37.6, y2: 8 },
  { x1: 42.9, y1: 8, x2: 49.9, y2: 2 },
  { x1: 55.2, y1: 2, x2: 62.2, y2: 8 },
  { x1: 67.5, y1: 8, x2: 74.5, y2: 2 },
  { x1: 79.8, y1: 2, x2: 86.8, y2: 8 },
  { x1: 92.1, y1: 8, x2: 99.1, y2: 2 },
  { x1: 104.4, y1: 2, x2: 111.4, y2: 8 },
  { x1: 116.7, y1: 8, x2: 123.7, y2: 2 },
  { x1: 129, y1: 2, x2: 136, y2: 8 },
  { x1: 141.3, y1: 8, x2: 148.3, y2: 2 },
  { x1: 153.6, y1: 2, x2: 160.6, y2: 8 },
  { x1: 165.9, y1: 8, x2: 172.9, y2: 2 },
  { x1: 178.2, y1: 2, x2: 185.2, y2: 8 },
  { x1: 190.5, y1: 8, x2: 197.5, y2: 2 },
  { x1: 202.8, y1: 2, x2: 209.8, y2: 8 },
  { x1: 215.1, y1: 8, x2: 222.1, y2: 2 },
  { x1: 227.4, y1: 2, x2: 234.4, y2: 8 },
  { x1: 239.7, y1: 8, x2: 246.7, y2: 2 },
  { x1: 252, y1: 2, x2: 259, y2: 8 },
  { x1: 264.3, y1: 8, x2: 271.3, y2: 2 },
  { x1: 276.6, y1: 2, x2: 283.6, y2: 8 },
  { x1: 288.9, y1: 8, x2: 295.9, y2: 2 },
  { x1: 301.2, y1: 2, x2: 308.2, y2: 8 },
  { x1: 313.5, y1: 8, x2: 320.5, y2: 2 },
  { x1: 325.8, y1: 2, x2: 332.8, y2: 8 },
  { x1: 338.1, y1: 8, x2: 345.1, y2: 2 },
  { x1: 350.4, y1: 2, x2: 357.4, y2: 8 },
  { x1: 362.7, y1: 8, x2: 369.7, y2: 2 },
  { x1: 375, y1: 2, x2: 382, y2: 8 },
  { x1: 387.3, y1: 8, x2: 394.3, y2: 2 },
];

export type WovenDividerProps = {
  /** Pixel width of rendered SVG. Default 320. Use preserveAspectRatio="none" so segments fill width. */
  width?: number;
  /** Outer wrapper opacity. Default 0.4. Source repo used 0.55 — choose per surface. */
  opacity?: number;
  className?: string;
};

export function WovenDivider({ width = 320, opacity = 0.4, className }: WovenDividerProps) {
  return (
    <svg
      width={width}
      height={14}
      viewBox="0 0 400 10"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ opacity }}
    >
      <g stroke="#b06410" strokeWidth="1.2" strokeLinecap="round" opacity="0.55">
        {ZIGZAG_SEGMENTS.map((seg, i) => (
          <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} />
        ))}
      </g>
    </svg>
  );
}
