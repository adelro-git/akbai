/* global React, Kai, PesoNum, Tag, SectionLabel, PERSONAS, WEEK_DATA, genExpenses */

const CAT_COLORS = { supplies: '#d97706', utilities: '#006b54', transport: '#855300', rent: '#9a4a2e', marketing: '#c0392b', misc: '#8a7558' };

function ExpensesScreen({ persona, lang }) {
  const p = PERSONAS[persona];
  const exp = genExpenses(persona).slice().sort((a, b) => b.amount - a.amount);
  const total = exp.reduce((a, c) => a + c.amount, 0);
  const week = WEEK_DATA[persona];
  const maxExp = Math.max(...week.map(d => d.exp));
  const peakIdx = week.reduce((bi, d, i, arr) => d.exp > arr[bi].exp ? i : bi, 0);
  const top = exp[0];

  const catName = (c) => ({
    fil: { supplies: 'Paninda', utilities: 'Kuryente/Tubig', transport: 'Pamasahe', rent: 'Upa', marketing: 'Ads', misc: 'Iba pa' },
    en:  { supplies: 'Supplies', utilities: 'Utilities', transport: 'Transport', rent: 'Rent', marketing: 'Ads', misc: 'Other' },
  }[lang][c] || c);

  const t = lang === 'fil' ? {
    title: 'Saan Napunta ang Pera?', month: 'Nobyembre', total: 'Kabuuang gastos', totalShort: 'Gastos',
    insight: `Pinakamalaki ngayong buwan: ${catName(top.cat)}. Tumaas ng 18% kaysa noong nakaraang buwan.`,
    daily: 'Pang-araw-araw na gastos', breakdown: 'Hatian ng gastos',
  } : {
    title: 'Where did the money go?', month: 'November', total: 'Total spent', totalShort: 'Spent',
    insight: `Biggest this month: ${catName(top.cat)}. Up 18% from last month.`,
    daily: 'Daily spending', breakdown: 'Spending breakdown',
  };

  // donut geometry
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  const segs = exp.map(c => {
    const frac = c.amount / total;
    const seg = { ...c, dash: frac * C, off: offset };
    offset += frac * C;
    return seg;
  });

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="h1" style={{ fontSize: 26 }}>{t.title}</h1>
        <span className="chip">{t.month} ▾</span>
      </div>

      {/* Donut card */}
      <div className="card enter">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
            <svg width="148" height="148" viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="74" cy="74" r={R} fill="none" stroke="var(--c-high)" strokeWidth="20" />
              {segs.map((s, i) => (
                <circle key={i} cx="74" cy="74" r={R} fill="none" stroke={CAT_COLORS[s.cat]} strokeWidth="20"
                  strokeDasharray={`${Math.max(0, s.dash - 2)} ${C}`} strokeDashoffset={-s.off} strokeLinecap="butt" />
              ))}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="label" style={{ fontSize: 9 }}>{t.totalShort}</span>
              <PesoNum value={total} size="md" short />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {exp.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span className="cat-dot" style={{ background: CAT_COLORS[c.cat] }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{catName(c.cat)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-faint)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(c.pct)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kai insight callout */}
      <div className="card enter enter-1" style={{ marginTop: 14, background: 'var(--secondary)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0 }}><Kai size={36} expression="happy" animated={false} /></span>
        <div className="body" style={{ color: 'var(--on-surface)' }}>{t.insight}</div>
      </div>

      {/* Category breakdown with banig bars */}
      <SectionLabel>{t.breakdown}</SectionLabel>
      <div className="card enter enter-2">
        {exp.map((c, i) => (
          <div className="cat-row" key={i}>
            <span className="cat-dot" style={{ background: CAT_COLORS[c.cat] }} />
            <span className="cat-name">{catName(c.cat)}</span>
            <div className="cat-track">
              <div className="cat-fill" style={{ width: `${c.pct}%`, background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 4px), ${CAT_COLORS[c.cat]}` }} />
            </div>
            <PesoNum value={c.amount} size="sm" short countUp={false} />
          </div>
        ))}
      </div>

      {/* 7-day strip */}
      <SectionLabel>{t.daily}</SectionLabel>
      <div className="card enter enter-3">
        <div className="bars">
          {week.map((d, i) => (
            <div className="bar-col" key={i}>
              <div className={`bar${i === peakIdx ? ' peak' : ''}`} style={{ height: `${Math.max(6, (d.exp / maxExp) * 100)}%`, background: i === peakIdx ? undefined : 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 5px), linear-gradient(180deg, #f0c878, #e6b86a)' }} />
              <span className="bar-day">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="bar-baseline" />
      </div>
    </div>
  );
}

window.ExpensesScreen = ExpensesScreen;
