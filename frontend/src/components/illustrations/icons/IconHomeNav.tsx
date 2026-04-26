// ============================================================
// IconHomeNav — Phase 4 nav icon (bottom-nav Home tab)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// House silhouette with roof + door cut-out + tiny dot above doorway.
// `active` toggles the tab state — inactive: cream + brown stroke;
// active: honey-fill + dark stroke (per source state spec).
// ============================================================
export type NavIconProps = {
  size?: number;
  className?: string;
  active?: boolean;
  'aria-label'?: string;
};

export function IconHomeNav({ size = 26, className, active = false, ...rest }: NavIconProps) {
  const fill = active ? '#f5b347' : '#fef3d9';
  const stroke = active ? '#8a3d0a' : '#b06410';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      className={className}
      {...rest}
    >
      <path
        d="M5 13 L14 5 L23 13 L23 22 Q23 23 22 23 L17 23 L17 17 L11 17 L11 23 L6 23 Q5 23 5 22 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="10" r="1.2" fill={stroke} opacity="0.6" />
    </svg>
  );
}
