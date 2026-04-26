/* global React, Kai, KaiBubble, UserBubble, TypingBubble, PERSONAS, COPY, genExpenses, SAMPLE_RECEIPTS, WEEK_DATA, formatPeso, pesoShort */
const { useState: uiUseState, useEffect: uiUseEffect, useRef: uiUseRef, useMemo: uiUseMemo } = React;

// ──────────── Reusable UI ────────────
function Card({ children, style = {}, onClick, className = '' }) {
  return (
    <div onClick={onClick} className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

function Chip({ children, color = 'honey', onClick, active = false, style = {} }) {
  const palette = {
    honey: { bg: active ? 'var(--honey)' : 'var(--honey-pale)', text: active ? 'white' : 'var(--honey-deep)' },
    sage: { bg: active ? 'var(--sage-deep)' : 'var(--sage-pale)', text: active ? 'white' : 'var(--sage-deep)' },
    rose: { bg: active ? 'var(--rose)' : 'var(--rose-pale)', text: active ? 'white' : '#9a4a2e' },
    neutral: { bg: active ? 'var(--ink)' : 'var(--surface-low)', text: active ? 'white' : 'var(--ink-soft)' },
  }[color];
  return (
    <button onClick={onClick} style={{
      background: palette.bg, color: palette.text,
      padding: '6px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
      transition: 'all 0.15s',
      ...style,
    }}>{children}</button>
  );
}

function SectionLabel({ children, color = 'var(--ink-faint)' }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
      textTransform: 'uppercase', color,
    }}>{children}</div>
  );
}

// Sparkles — tiny decorative stars, scattered
function Sparkles({ color = 'var(--honey-dark)' }) {
  return (
    <svg width="100%" height="100%" style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
    }} viewBox="0 0 100 100" preserveAspectRatio="none">
      <g fill={color} opacity="0.45">
        <path d="M88 12 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z"/>
        <circle cx="6" cy="20" r="1.2"/>
        <path d="M10 86 l0.8 2.5 l2.5 0.8 l-2.5 0.8 l-0.8 2.5 l-0.8 -2.5 l-2.5 -0.8 l2.5 -0.8 z"/>
        <circle cx="94" cy="78" r="1"/>
        <path d="M50 4 l0.6 1.8 l1.8 0.6 l-1.8 0.6 l-0.6 1.8 l-0.6 -1.8 l-1.8 -0.6 l1.8 -0.6 z"/>
      </g>
    </svg>
  );
}

// ───── Ambient Kai floating — smaller, illustration-matched ─────
function AmbientKai({ state = 'idle', onTap, thought }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 24, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
    }}>
      {thought && (
        <div className="pop-in" style={{
          background: '#ffffff',
          padding: '10px 14px',
          borderRadius: '16px 16px 4px 16px',
          boxShadow: 'var(--shadow-card)',
          maxWidth: 220, fontSize: 12.5, lineHeight: 1.45,
          border: '1px solid var(--outline-soft)',
          color: 'var(--ink)',
        }}>{thought}</div>
      )}
      <button onClick={onTap} className="kai-float" style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-lifted), 0 0 0 1px var(--outline-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <Kai size={48}
          expression={state === 'thinking' ? 'thinking' : state === 'celebrate' ? 'celebrate' : 'happy'}
          animated/>
      </button>
    </div>
  );
}

// ───── Bar chart — softer ─────
function MiniBarChart({ data, height = 80, copy }) {
  const max = Math.max(...data.map(d => Math.max(d.rev, d.exp)));
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height, padding: '0 2px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: height - 18 }}>
            <div style={{
              width: 7, height: `${(d.rev / max) * 100}%`, minHeight: 3,
              background: 'var(--honey)',
              borderRadius: '3px 3px 0 0',
            }}/>
            <div style={{
              width: 7, height: `${(d.exp / max) * 100}%`, minHeight: 3,
              background: '#e5ddc9',
              borderRadius: '3px 3px 0 0',
            }}/>
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 700 }}>{d.day}</div>
        </div>
      ))}
    </div>
  );
}

// ───── Donut ─────
function DonutChart({ data, size = 140, total, copy }) {
  const palette = ['#f5b347', '#e89b2f', '#97b39d', '#eb9a7e', '#b8a6c2', '#c87b14'];
  let cumulative = 0;
  const r = size / 2 - 16;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f4ecd9" strokeWidth="20"/>
      {data.map((d, i) => {
        const frac = d.amount / total;
        const start = cumulative * 2 * Math.PI - Math.PI / 2;
        const end = (cumulative + frac) * 2 * Math.PI - Math.PI / 2;
        cumulative += frac;
        const large = frac > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);
        return (
          <path key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none" stroke={palette[i % palette.length]}
            strokeWidth="20" strokeLinecap="butt"/>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontWeight="800"
        fill="var(--ink-faint)" style={{ letterSpacing: '0.1em' }}>TOTAL</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ink)">
        {pesoShort(total)}
      </text>
    </svg>
  );
}

// Legacy Sunburst (kept for compat — just render nothing now)
function Sunburst() { return null; }

Object.assign(window, { Card, Chip, SectionLabel, Sparkles, Sunburst, AmbientKai, MiniBarChart, DonutChart });
