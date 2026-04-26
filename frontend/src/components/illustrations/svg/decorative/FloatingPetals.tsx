// ============================================================
// FloatingPetals — Phase 4 motif (sampaguita petals drifting top-to-bottom)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Pure decoration. Reduced-motion gating happens globally.
// SSR-safe deterministic stagger: petal i has delay i*1.2s and duration i*0.8 + 8s.
// pointer-events-none baked in.
// ============================================================
export type FloatingPetalsProps = {
  /** Number of petals to render. Default 10. Spec recommends ≤12 for perf budget. */
  count?: number;
  className?: string;
};

export function FloatingPetals({ count = 10, className }: FloatingPetalsProps) {
  // Cap to a reasonable maximum so a caller can't accidentally blow the perf budget.
  const safeCount = Math.max(1, Math.min(count, 16));
  const petals = Array.from({ length: safeCount }, (_, i) => i);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {petals.map((i) => {
        // Even-step horizontal distribution — push first/last petals away from edges.
        const leftPercent = ((i + 0.5) / safeCount) * 100;
        // Deterministic vary on petal size and timing so SSR matches client render.
        const sizePx = 7 + (i % 3) + (i % 2);
        const delay = `${(i * 1.2).toFixed(2)}s`;
        const duration = `${(i * 0.8 + 8).toFixed(2)}s`;
        return (
          <span
            key={i}
            className="absolute top-0 animate-petal-drift"
            style={{
              left: `${leftPercent}%`,
              width: `${sizePx}px`,
              height: `${sizePx}px`,
              borderRadius: '50% 50% 50% 0',
              background: 'radial-gradient(circle at 30% 30%, #fff, #fdf0d4)',
              border: '1px solid rgba(232,155,47,0.5)',
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        );
      })}
    </div>
  );
}
