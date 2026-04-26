/* global React, Kai, Card, Chip, SectionLabel, MiniBarChart, DonutChart, PERSONAS, COPY, genExpenses, WEEK_DATA, SAMPLE_RECEIPTS, formatPeso, pesoShort */
const { useState: useStateSaan } = React;

// ═══════════════ SAAN NAPUNTA — Expense dashboard ═══════════════
function SaanScreen({ persona, copy, lang, density }) {
  const p = PERSONAS[persona];
  const c = COPY[lang];
  const expenses = genExpenses(persona);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const weekData = WEEK_DATA[persona];
  const [range, setRange] = useStateSaan('month');

  const palette = ['#f59e0b', '#d97706', '#1ec89f', '#fb923c', '#ec4899', '#92400e'];
  const categoryEmoji = { supplies: '📦', utilities: '⚡', transport: '🛵', rent: '🏠', food: '🍚', misc: '✨', marketing: '📣' };

  return (
    <div className="scroll" style={{
      flex: 1, overflow: 'auto',
      background: 'linear-gradient(180deg, #fef3c7 0%, #fdf9f2 120px, #fdf9f2 100%)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 10px' }}>
        <SectionLabel>📊 {c.saanNapunta.toUpperCase()}</SectionLabel>
        <div className="serif" style={{ fontSize: 26, fontWeight: 500, color: 'var(--ink)', marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {lang === 'fil' ? 'Heto kung saan napunta ang pera mo.' : 'Here\'s where your money went.'}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {[['week', lang === 'fil' ? 'Linggo' : 'Week'], ['month', lang === 'fil' ? 'Buwan' : 'Month'], ['ytd', lang === 'fil' ? 'Buong Taon' : 'YTD']].map(([k, label]) => (
            <Chip key={k} active={range === k} onClick={() => setRange(k)}>{label}</Chip>
          ))}
        </div>
      </div>

      <div style={{ padding: '6px 14px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Big number + donut */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <DonutChart data={expenses} size={140} total={total} copy={c}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {c.expenses} · {c.thisMonth}
              </div>
              <div className="serif" style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatPeso(total)}
              </div>
              <div style={{ fontSize: 11.5, color: '#b91c1c', fontWeight: 700, marginTop: 4 }}>
                ↗ +4.1% {c.vsLastMonth}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 10, lineHeight: 1.4 }}>
                {lang === 'fil' ? `Kita: ${pesoShort(p.stats.revenue)}` : `Revenue: ${pesoShort(p.stats.revenue)}`}<br/>
                <span style={{ color: '#006b54', fontWeight: 700 }}>{c.profit}: {pesoShort(p.stats.profit)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Category breakdown */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>{lang === 'fil' ? 'Bawat Kategorya' : 'By Category'}</SectionLabel>
            <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 600 }}>Nob 2025</span>
          </div>
          <div>
            {expenses.map((e, i) => (
              <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i > 0 ? '1px solid #f7f3ec' : 'none' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: `${palette[i]}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>{categoryEmoji[e.cat]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{c.categories[e.cat]}</div>
                    <div className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{formatPeso(e.amount)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f7f3ec', overflow: 'hidden' }}>
                      <div style={{ width: `${e.pct}%`, height: '100%', background: palette[i], borderRadius: 3 }}/>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{e.pct.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Kai insight */}
        <Card style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 80%)',
          padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <Kai size={40} expression="thinking" glow/>
          <div style={{ flex: 1 }}>
            <SectionLabel>💡 {lang === 'fil' ? 'NAPANSIN NI KAI' : 'KAI NOTICED'}</SectionLabel>
            <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 6, lineHeight: 1.45, fontWeight: 500 }}>
              {lang === 'fil'
                ? <>Tumaas ng <b>18%</b> ang gastos mo sa <b>{c.categories[expenses[0].cat]}</b> kumpara nung nakaraang buwan. Sulit pa ba yung deal mo sa supplier?</>
                : <>Your <b>{c.categories[expenses[0].cat]}</b> spending is up <b>18%</b> vs. last month. Is your supplier deal still worth it?</>}
            </div>
          </div>
        </Card>

        {/* Week trend */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SectionLabel>{lang === 'fil' ? 'Pang-araw-araw' : 'Daily trend'}</SectionLabel>
            <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 600 }}>{lang === 'fil' ? '7 araw' : '7 days'}</span>
          </div>
          <MiniBarChart data={weekData} height={100} copy={c}/>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { SaanScreen });
