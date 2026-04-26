// ============================================================
// CapizPattern — Phase 4 motif (background tile referencing capiz windowpanes)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Tiled 60x60 SVG pattern at low opacity. Heritage Filipino architecture motif.
// pointer-events-none baked in — never receives pointer events.
// ============================================================
import { useId } from 'react';

export type CapizPatternProps = {
  /** Background opacity. Default 0.18 (light theme); designer used 0.35 in repo demos. */
  opacity?: number;
  className?: string;
};

export function CapizPattern({ opacity = 0.18, className }: CapizPatternProps) {
  const patternId = useId();
  return (
    <svg
      width="100%"
      height="100%"
      aria-hidden="true"
      className={`pointer-events-none ${className ?? ''}`}
      style={{ opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="transparent" />
          <rect x="6" y="6" width="22" height="22" rx="3" fill="#fef3d9" stroke="#f0be6a" strokeWidth="0.8" opacity="0.6" />
          <rect x="32" y="6" width="22" height="22" rx="3" fill="#fdf5e2" stroke="#f0be6a" strokeWidth="0.8" opacity="0.5" />
          <rect x="6" y="32" width="22" height="22" rx="3" fill="#fdf5e2" stroke="#f0be6a" strokeWidth="0.8" opacity="0.5" />
          <rect x="32" y="32" width="22" height="22" rx="3" fill="#fef3d9" stroke="#f0be6a" strokeWidth="0.8" opacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
