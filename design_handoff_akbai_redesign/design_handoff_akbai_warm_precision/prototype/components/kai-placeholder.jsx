/* global React */
/* ─────────────────────────────────────────────────────────────
   KAI — PLACEHOLDER for developer handoff.
   This is intentionally NOT the mascot art. It renders a neutral,
   labeled slot so the implementing agent (Claude Code) knows:
     • exactly WHERE the Kai character is placed,
     • at what SIZE,
     • and which EXPRESSION the context calls for.
   Replace <Kai> / <KaiHero> with your real Kai asset set
   (transparent-bg raster, circle-masked). See README → "Kai".

   Expression → context map (from design.md §7):
     waving      onboarding step 1, first-ever home open
     happy       default home greeting, confirmations
     working     scanning a receipt, generating a draft, loading
     thinking    composing a chat reply, computing costing
     concerned   BIR deadline ≤3 days, negative cash flow, errors
     celebrating milestones, streaks, first profit, paid invoice
   ───────────────────────────────────────────────────────────── */

function KaiPlaceholder({ size = 64, expression = 'happy', glow = false, animated = false, style = {} }) {
  const showText = size >= 56;
  const fs = Math.max(7, Math.min(11, size * 0.11));
  return (
    <div style={{
      position: 'relative', width: size, height: size, flexShrink: 0,
      borderRadius: '50%',
      background: 'repeating-linear-gradient(45deg, #efe7d8 0 6px, #f6f0e4 6px 12px)',
      border: '2px dashed #c9b89a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: '#8a7558', fontFamily: 'ui-monospace, Menlo, monospace', textAlign: 'center',
      lineHeight: 1.15, overflow: 'hidden', ...style,
    }}>
      {glow && (
        <div style={{ position: 'absolute', inset: -size * 0.35, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.16) 0%, transparent 65%)', pointerEvents: 'none' }} />
      )}
      <span style={{ position: 'relative', fontWeight: 700, fontSize: fs, letterSpacing: '0.06em' }}>KAI</span>
      {showText && (
        <span style={{ position: 'relative', fontSize: Math.max(6, fs - 2), opacity: 0.75, marginTop: 2 }}>{expression}</span>
      )}
    </div>
  );
}

// Same API surface the app expects.
const Kai = KaiPlaceholder;
function KaiHero({ size = 170, expression = 'happy', sparkles = true }) {
  return <KaiPlaceholder size={size} expression={expression} glow animated />;
}

Object.assign(window, { Kai, KaiHero });
