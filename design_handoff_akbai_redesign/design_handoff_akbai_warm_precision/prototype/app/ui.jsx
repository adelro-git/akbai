/* global React */
// AKBai — shared UI primitives for the Warm Precision mobile app
const { useState, useEffect, useRef } = React;

// Respect reduced motion
const REDUCED = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Count-up peso figure (§6: 600ms once, on first paint) ──
function PesoNum({ value, size = 'md', short = false, prefix = '₱', countUp = true, white = false, className = '' }) {
  const enabled = countUp && !REDUCED && !window.__AKB_NOCOUNT;
  const [n, setN] = useState(enabled ? 0 : value);
  const started = useRef(false);
  useEffect(() => {
    if (!enabled) { setN(value); return; }
    if (started.current) { setN(value); return; }
    started.current = true;
    const dur = 600, t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const fmt = (x) => {
    if (short) {
      if (Math.abs(x) >= 1000000) return prefix + (x / 1000000).toFixed(1) + 'M';
      if (Math.abs(x) >= 1000) return prefix + (x / 1000).toFixed(1) + 'K';
      return prefix + Math.round(x);
    }
    return prefix + Math.round(x).toLocaleString('en-PH');
  };
  const cls = ['num', `num-${size}`, white ? 'num-white' : '', className].filter(Boolean).join(' ');
  return (
    <span className={cls} aria-label={`${Math.round(value).toLocaleString('en-PH')} piso`}>
      {fmt(n)}
    </span>
  );
}

// ── Status tag ──
function Tag({ kind = 'neutral', children }) {
  return <span className={`tag tag-${kind}`}>{children}</span>;
}

// ── Hand-drawn squiggle under greeting ──
function Squiggle({ width = 116 }) {
  return (
    <svg className="squiggle" width={width} height="7" viewBox="0 0 116 7" fill="none" aria-hidden="true">
      <path d="M2 4 Q11 -1 20 4 T38 4 T56 4 T74 4 T92 4 T110 4"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ── Section label with optional accent ──
function SectionLabel({ children, accent }) {
  return (
    <div className="section-label">
      <span className="label">{children}</span>
      {accent}
    </div>
  );
}

// ── Tiny inline Kai avatar disc (chrome use, 22–32px) ──
function KaiDisc({ size = 32, expression = 'happy' }) {
  return (
    <span style={{
      display: 'inline-flex', width: size + 6, height: size + 6,
      borderRadius: '50%', background: 'var(--secondary)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Kai size={size} expression={expression} animated={false} />
    </span>
  );
}

// ── Floating petals (≤6 nodes, motion-gated) — home hero ambient only ──
function FloatingPetals() {
  if (REDUCED) return null;
  const petals = [
    { l: '12%', d: '0s',   s: 9,  dur: '11s' },
    { l: '34%', d: '2.5s', s: 7,  dur: '13s' },
    { l: '58%', d: '5s',   s: 10, dur: '10s' },
    { l: '78%', d: '1.5s', s: 6,  dur: '14s' },
    { l: '88%', d: '6.5s', s: 8,  dur: '12s' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
      {petals.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', left: p.l, top: '-12px',
          width: p.s, height: p.s, borderRadius: '50% 0 50% 50%',
          background: 'rgba(245,179,71,0.5)',
          animation: `petal-fall ${p.dur} linear ${p.d} infinite`,
        }} />
      ))}
      <style>{`@keyframes petal-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        12% { opacity: 0.7; }
        100% { transform: translateY(240px) rotate(280deg); opacity: 0; }
      }`}</style>
    </div>
  );
}

Object.assign(window, { PesoNum, Tag, Squiggle, SectionLabel, KaiDisc, FloatingPetals, REDUCED });
