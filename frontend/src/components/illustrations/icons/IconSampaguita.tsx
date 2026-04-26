// ============================================================
// IconSampaguita — Phase 4 brand icon (Sampaguita decoration)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// 5-petal national flower used as small accent token in copy / chips / streak markers.
// Phase 1 design-system rule: kept tiny — small token, never garlanded.
// ============================================================
import type { IconProps } from './IconResibo';

export function IconSampaguita({ size = 16, className, color, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      role="img"
      className={className}
      {...rest}
    >
      <ellipse
        cx="10"
        cy="5"
        rx="2.8"
        ry="4"
        fill="#fff"
        stroke={color ?? '#e89b2f'}
        strokeWidth="0.6"
      />
      <ellipse
        cx="10"
        cy="5"
        rx="2.8"
        ry="4"
        fill="#fff"
        stroke={color ?? '#e89b2f'}
        strokeWidth="0.6"
        transform="rotate(72 10 10)"
      />
      <ellipse
        cx="10"
        cy="5"
        rx="2.8"
        ry="4"
        fill="#fff"
        stroke={color ?? '#e89b2f'}
        strokeWidth="0.6"
        transform="rotate(144 10 10)"
      />
      <ellipse
        cx="10"
        cy="5"
        rx="2.8"
        ry="4"
        fill="#fff"
        stroke={color ?? '#e89b2f'}
        strokeWidth="0.6"
        transform="rotate(216 10 10)"
      />
      <ellipse
        cx="10"
        cy="5"
        rx="2.8"
        ry="4"
        fill="#fff"
        stroke={color ?? '#e89b2f'}
        strokeWidth="0.6"
        transform="rotate(288 10 10)"
      />
      <circle cx="10" cy="10" r="1.6" fill="#f5b347" />
    </svg>
  );
}
