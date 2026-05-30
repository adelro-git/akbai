/* global React, Kai, Tag, SectionLabel */

function DeadlinesScreen({ lang }) {
  const t = lang === 'fil' ? {
    title: 'Mga Deadline', sub: 'BIR filing reminders',
    nextDue: 'Susunod na deadline', daysLeft: 'araw na lang', prepare: 'I-prepare natin',
    body: '3 araw na lang bago ang 2551Q mo. Wag kang mag-alala \u2014 i-prepare natin ngayon ang numero mo.',
    upcoming: 'Mga paparating', disclaimer: 'Hindi ito legal na payo. Kumonsulta sa accountant mo para sa katiyakan.',
    items: [
      { code: '0619E', name: 'Withholding (Expanded)', mon: 'DIS', day: 10, days: 9 },
      { code: '1701Q', name: 'Income Tax (Quarterly)', mon: 'DIS', day: 15, days: 14 },
      { code: '2550M', name: 'VAT (Monthly)', mon: 'DIS', day: 20, days: 19 },
    ],
    due: '2551Q', dueName: 'Percentage Tax (Quarterly)',
  } : {
    title: 'Deadlines', sub: 'BIR filing reminders',
    nextDue: 'Next deadline', daysLeft: 'days left', prepare: 'Let\u2019s prepare it',
    body: 'Just 3 days until your 2551Q. Don\u2019t worry \u2014 let\u2019s prep your numbers now.',
    upcoming: 'Upcoming', disclaimer: 'This isn\u2019t legal advice. Check with your accountant to be sure.',
    items: [
      { code: '0619E', name: 'Withholding (Expanded)', mon: 'DEC', day: 10, days: 9 },
      { code: '1701Q', name: 'Income Tax (Quarterly)', mon: 'DEC', day: 15, days: 14 },
      { code: '2550M', name: 'VAT (Monthly)', mon: 'DEC', day: 20, days: 19 },
    ],
    due: '2551Q', dueName: 'Percentage Tax (Quarterly)',
  };

  return (
    <div className="screen">
      <h1 className="h1" style={{ fontSize: 26 }}>{t.title}</h1>
      <div className="body-variant" style={{ marginBottom: 16 }}>{t.sub}</div>

      {/* Next-due highlighted card — concerned Kai + warm amber */}
      <div className="card-float enter" style={{ padding: 18, background: 'linear-gradient(165deg, #fff6e4 0%, #fdecc8 100%)', boxShadow: 'var(--el-3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--warning)' }} />
        <div className="label" style={{ color: 'var(--primary)', marginBottom: 12 }}>{t.nextDue}</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="kai-bob" style={{ flexShrink: 0 }}><Kai size={66} expression="concerned" animated={false} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="h2" style={{ fontSize: 20 }}>{t.due}</span>
              <Tag kind="overdue">{3} {t.daysLeft}</Tag>
            </div>
            <div className="body-variant" style={{ marginTop: 2 }}>{t.dueName}</div>
          </div>
        </div>
        <div className="body" style={{ marginTop: 14, color: 'var(--on-surface)' }}>{t.body}</div>
        <button className="btn btn-primary" style={{ marginTop: 14 }}>{t.prepare}</button>
      </div>

      {/* Upcoming list */}
      <SectionLabel>{t.upcoming}</SectionLabel>
      <div className="card enter enter-1" style={{ padding: '6px 14px' }}>
        {t.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: i ? '1px solid var(--outline-variant)' : 'none' }}>
            <div className="datechip">
              <div className="dc-mon" style={{ background: 'var(--c-high)', color: 'var(--on-variant)' }}>{it.mon}</div>
              <div className="dc-day">{it.day}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="h3" style={{ fontSize: 16 }}>{it.code}</span>
              </div>
              <div className="body-variant" style={{ fontSize: 13 }}>{it.name}</div>
            </div>
            <Tag kind="neutral">{it.days} {t.daysLeft}</Tag>
          </div>
        ))}
      </div>

      {/* Persistent disclaimer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 18, padding: '0 4px' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="8" cy="8" r="7" fill="none" stroke="var(--on-faint)" strokeWidth="1.3" /><path d="M8 4.5v0.2M8 7v4.5" stroke="var(--on-faint)" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <div style={{ fontSize: 12, lineHeight: '17px', color: 'var(--on-faint)' }}>{t.disclaimer}</div>
      </div>
    </div>
  );
}

window.DeadlinesScreen = DeadlinesScreen;
