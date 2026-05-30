/* global React, Kai, KaiHero, PesoNum, Tag, Squiggle, SectionLabel, FloatingPetals, CapizPattern,
   IconResibo, IconUsap, IconKalendaryo, IconPrecio, PERSONAS, WEEK_DATA, formatPeso */

function HomeScreen({ persona, lang, onOpen }) {
  const p = PERSONAS[persona];
  const first = p.name.split(' ')[0];
  const week = WEEK_DATA[persona];
  const wkRev = week.reduce((a, d) => a + d.rev, 0);
  const wkExp = week.reduce((a, d) => a + d.exp, 0);
  const wkProfit = wkRev - wkExp;
  const maxRev = Math.max(...week.map(d => d.rev));
  const peakIdx = week.reduce((bi, d, i, arr) => d.rev > arr[bi].rev ? i : bi, 0);

  const hour = new Date().getHours();
  const tod = hour < 11 ? 'umaga' : hour < 18 ? 'hapon' : 'gabi';
  const G = {
    fil: { umaga: 'Magandang umaga', hapon: 'Magandang hapon', gabi: 'Magandang gabi' },
    en:  { umaga: 'Good morning',    hapon: 'Good afternoon',   gabi: 'Good evening' },
  }[lang][tod];
  const todPill = { fil: { umaga: 'Umaga', hapon: 'Hapon', gabi: 'Gabi' }, en: { umaga: 'Morning', hapon: 'Afternoon', gabi: 'Evening' } }[lang][tod];

  const t = lang === 'fil' ? {
    q: 'Kumusta ang araw mo?',
    saved: 'Nakaipon ka ng', thisWeek: 'ngayong linggo', higher: 'mas mataas kaysa noong nakaraan',
    kuwento: 'Kuwento ng Linggo', date: 'Nob 18 – 24', detalye: 'Buksan ang detalye',
    kita: 'Kita', gastos: 'Gastos', tubo: 'Tubo', dailyKita: 'Araw-araw na kita',
    note: 'Maliit na paalala', noteBody: 'Mas tumipid ka ngayong linggo. Kung tuloy-tuloy, mas malaki ang maiiipon mo sa Disyembre. \u2014 Kai',
    do: 'Anong gagawin natin?',
    a1: 'Scan resibo', a1s: 'Kuhanan ng litrato', a2: 'Kausapin si Kai', a2s: 'Tanong tungkol sa pera',
    a3: 'BIR paalala', a3s: '2 deadline ngayong linggo', a4: 'Tamang presyo', a4s: 'Magkano dapat singil',
  } : {
    q: "How's your day?",
    saved: "You saved", thisWeek: 'this week', higher: 'higher than last week',
    kuwento: 'This Week\u2019s Story', date: 'Nov 18 – 24', detalye: 'Open details',
    kita: 'Income', gastos: 'Spent', tubo: 'Profit', dailyKita: 'Daily income',
    note: 'A small note', noteBody: 'You spent less this week. Keep it up and you\u2019ll save more by December. \u2014 Kai',
    do: 'What shall we do?',
    a1: 'Scan receipt', a1s: 'Snap a photo', a2: 'Talk to Kai', a2s: 'Ask about your money',
    a3: 'BIR reminders', a3s: '2 deadlines this week', a4: 'Right pricing', a4s: 'What to charge',
  };

  return (
    <div className="screen">
      {/* ── Time pill ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <span className="pill-tod">
          <Kai size={14} expression="happy" animated={false} /> {todPill}
        </span>
      </div>

      {/* ── Kumustahan hero (the one personality moment) ── */}
      <div className="card enter" style={{
        background: 'linear-gradient(160deg, var(--secondary) 0%, #fde8c0 100%)',
        borderRadius: 'var(--r-lg)', padding: '20px 20px 22px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}><CapizPattern /></div>
        <FloatingPetals />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="hero-glow" />
            <KaiHero size={94} expression="happy" sparkles={false} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="body-strong" style={{ color: 'var(--primary)', fontSize: 14 }}>{G},</div>
            <div className="h1" style={{ marginTop: 1 }}>{first}!</div>
            <div className="serif-italic" style={{ color: 'var(--primary)', fontSize: 16, marginTop: 6, lineHeight: '20px' }}>{t.q}</div>
            <Squiggle width={100} />
          </div>
        </div>
        <div style={{ position: 'relative', marginTop: 16, fontSize: 15, lineHeight: '22px', color: 'var(--on-surface)' }}>
          {t.saved} <PesoNum value={wkProfit} size="sm" /> {t.thisWeek} — <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{t.higher}</span>.
        </div>
      </div>

      {/* ── Kuwento card: KPIs + banig chart ── */}
      <div className="card enter enter-1" style={{ marginTop: 14 }}>
        <div className="card-header">
          <span style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: '50%', background: 'var(--secondary)', alignItems: 'center', justifyContent: 'center' }}>
            <Kai size={24} expression="happy" animated={false} />
          </span>
          <div className="ch-title">
            <div className="h3">{t.kuwento}</div>
            <div className="label" style={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' }}>{t.date}</div>
          </div>
          <Tag kind="positive">▲ 12%</Tag>
        </div>

        <div className="kpi-row">
          <div className="kpi"><span className="kpi-label">{t.kita}</span><PesoNum value={wkRev} size="md" short /></div>
          <div className="kpi"><span className="kpi-label">{t.gastos}</span><PesoNum value={wkExp} size="md" short /></div>
          <div className="kpi kpi-profit"><span className="kpi-label">{t.tubo}</span><PesoNum value={wkProfit} size="md" short /></div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="label" style={{ marginBottom: 4 }}>{t.dailyKita}</div>
          <div className="bars">
            {week.map((d, i) => (
              <div className="bar-col" key={i}>
                <div className={`bar${i === peakIdx ? ' peak' : ''}`} style={{ height: `${Math.max(6, (d.rev / maxRev) * 100)}%` }} />
                <span className="bar-day">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="bar-baseline" />
        </div>

        <button className="btn-text" style={{ marginTop: 12 }} onClick={() => onOpen('expenses')}>{t.detalye} →</button>
      </div>

      {/* ── Paper-note takeaway from Kai ── */}
      <div className="paper-note enter enter-2" style={{ marginTop: 20 }}>
        <div className="tape" />
        <div className="label" style={{ marginBottom: 4 }}>{t.note}</div>
        <div className="body" style={{ color: 'var(--on-variant)' }}>{t.noteBody}</div>
      </div>

      {/* ── Action grid ── */}
      <SectionLabel>{t.do}</SectionLabel>
      <div className="action-grid">
        <button className="action-tile enter enter-1" onClick={() => onOpen('scan')}>
          <span className="at-icon"><IconResibo size={40} /></span>
          <div><div className="at-title">{t.a1}</div><div className="at-sub">{t.a1s}</div></div>
        </button>
        <button className="action-tile enter enter-2" onClick={() => onOpen('chat')}>
          <span className="at-icon"><IconUsap size={40} /></span>
          <div><div className="at-title">{t.a2}</div><div className="at-sub">{t.a2s}</div></div>
        </button>
        <button className="action-tile enter enter-3" onClick={() => onOpen('deadlines')}>
          <span className="at-badge"><Tag kind="pending">2</Tag></span>
          <span className="at-icon"><IconKalendaryo size={40} /></span>
          <div><div className="at-title">{t.a3}</div><div className="at-sub">{t.a3s}</div></div>
        </button>
        <button className="action-tile tile-plain enter enter-4" onClick={() => onOpen('costing')}>
          <span className="at-icon"><IconPrecio size={40} /></span>
          <div><div className="at-title">{t.a4}</div><div className="at-sub">{t.a4s}</div></div>
        </button>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
