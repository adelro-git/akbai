interface CitylineSilhouetteProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CitylineSilhouette({ width = 300, height = 60, className }: CitylineSilhouetteProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 60"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Skyline silhouette - 7 buildings of varying heights */}
      <path
        d="M0 60V45H20V38H30V45H45V25H55V18H60V25H75V45H90V30H100V22H105V14H110V22H115V30H130V40H145V20H155V12H160V8H165V12H170V20H185V35H200V28H210V22H215V15H220V22H225V28H240V42H255V32H260V26H265V18H270V26H275V32H290V45H300V60Z"
        fill="hsl(var(--on-surface))"
        opacity="0.35"
      />
      {/* Window dots for texture */}
      <rect x="50" y="28" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="50" y="34" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="57" y="28" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="150" y="24" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="156" y="24" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="162" y="24" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="262" y="28" width="2" height="2" fill="hsl(var(--on-surface))" opacity="0.3" />
    </svg>
  );
}
