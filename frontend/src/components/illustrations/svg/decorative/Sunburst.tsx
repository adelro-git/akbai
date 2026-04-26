// ============================================================
// Sunburst — Phase 4 motif (radial sun-rays around Kai mark)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// 12 honey-yellow rays (long+short alternation) at low opacity.
// pointer-events-none baked in (background-only motif).
// ============================================================
const RAY_LINES: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
  { x1: 165, y1: 100, x2: 188, y2: 100 },
  { x1: 156.6, y1: 135, x2: 172.5, y2: 151.6 },
  { x1: 135, y1: 156.6, x2: 151.6, y2: 172.5 },
  { x1: 100, y1: 165, x2: 100, y2: 188 },
  { x1: 65, y1: 156.6, x2: 48.4, y2: 172.5 },
  { x1: 43.4, y1: 135, x2: 27.5, y2: 151.6 },
  { x1: 35, y1: 100, x2: 12, y2: 100 },
  { x1: 43.4, y1: 65, x2: 27.5, y2: 48.4 },
  { x1: 65, y1: 43.4, x2: 48.4, y2: 27.5 },
  { x1: 100, y1: 35, x2: 100, y2: 12 },
  { x1: 135, y1: 43.4, x2: 151.6, y2: 27.5 },
  { x1: 156.6, y1: 65, x2: 172.5, y2: 48.4 },
];

export type SunburstProps = {
  /** Pixel size (square). Default 200. Source repo example was 200x200. */
  size?: number;
  /** Outer opacity. Default 0.3. Source repo used 0.45 light / 0.5 honey. */
  opacity?: number;
  /** Ray stroke color. Default honey-bright. */
  color?: string;
  className?: string;
};

export function Sunburst({
  size = 200,
  opacity = 0.3,
  color = '#f5b347',
  className,
}: SunburstProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={`pointer-events-none ${className ?? ''}`}
      style={{ opacity }}
    >
      <g stroke={color} strokeWidth="2.2" strokeLinecap="round">
        {RAY_LINES.map((ray, i) => (
          <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
        ))}
      </g>
    </svg>
  );
}
