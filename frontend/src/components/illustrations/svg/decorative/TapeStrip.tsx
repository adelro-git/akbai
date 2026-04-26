// ============================================================
// TapeStrip — Phase 4 motif (washi-tape rectangle)
// Source: design_handoff_akbai_redesign/synthesis/repos/motifs.html (B5 approved)
// Filipino home-business note-taking metaphor (taping receipts to fridges/walls).
// This is the canonical visual primitive. Composition wrappers (e.g., paper-note's
// absolute-positioned tape) wrap this and supply layout.
// ============================================================
export type TapeStripProps = {
  /** Rotation in degrees. Default -6 — matches source repo `-3° to 2°` range center. */
  rotation?: number;
  className?: string;
};

export function TapeStrip({ rotation = -6, className }: TapeStripProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block ${className ?? ''}`}
      style={{
        width: '64px',
        height: '18px',
        transform: `rotate(${rotation}deg)`,
        background: 'linear-gradient(180deg, rgba(245,179,71,0.45), rgba(245,179,71,0.25))',
        borderTop: '1px solid rgba(232,155,47,0.5)',
        borderBottom: '1px solid rgba(232,155,47,0.4)',
        boxShadow: '0 1px 3px rgba(168,120,40,0.15)',
      }}
    />
  );
}
