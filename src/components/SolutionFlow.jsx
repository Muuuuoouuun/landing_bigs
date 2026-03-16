import React from 'react';

const steps = [
  {
    num: '01',
    title: '본사의 기준 설정',
    desc: '과정, 반, 강사 권한 등 지점을 아우르는 통합 세팅 아키텍처 구축.',
    stat: '평균 2일',
    statLabel: '전사 세팅 완료',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
    bg: 'white',
    numColor: 'var(--color-primary)',
  },
  {
    num: '02',
    title: '통일된 수업 진행',
    desc: '지점 소속 강사들이 본사 세팅 기준 내에서 표준화된 툴킷으로 수업.',
    stat: '품질 편차',
    statLabel: '제로화',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    bg: '#fdfdfc',
    numColor: 'var(--color-primary)',
  },
  {
    num: '03',
    title: '실시간 데이터 통제',
    desc: '모든 출결, 과제, 평가 데이터가 본사 중앙 서버로 즉각 수집됨.',
    stat: '실시간',
    statLabel: '데이터 수집',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    bg: 'var(--color-primary-dark)',
    numColor: 'var(--color-accent)',
    dark: true,
  },
];

const SolutionFlow = () => {
  return (
    <section className="section section-fade-from-dark section-fade-to-dark" id="solution" style={{
      background: 'linear-gradient(180deg, #faf9f6 0%, #f0f5f2 100%)',
      paddingBottom: '12rem',
      position: 'relative',
      overflow: 'hidden',
      '--fade-from': '#06261a',
      '--fade-to': '#06261a',
    }}>
      {/* Background watermark numbers */}
      <div style={{ position: 'absolute', top: '6rem', left: '2%', fontSize: '18rem', fontWeight: '900', color: 'rgba(11,61,43,0.025)', lineHeight: 1, userSelect: 'none', zIndex: 0 }}>01</div>
      <div style={{ position: 'absolute', top: '32rem', right: '2%', fontSize: '18rem', fontWeight: '900', color: 'rgba(11,61,43,0.025)', lineHeight: 1, userSelect: 'none', zIndex: 0 }}>02</div>
      <div style={{ position: 'absolute', top: '58rem', left: '2%', fontSize: '18rem', fontWeight: '900', color: 'rgba(11,61,43,0.025)', lineHeight: 1, userSelect: 'none', zIndex: 0 }}>03</div>

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">Solution Flow</div>
        <h2 className="section-title">복잡한 지점 운영을 통합하는<br />단 하나의 시스템 워크플로우</h2>
        <p className="section-subcopy">
          권한 설정부터 수업 모니터링까지. 흩어진 과정을 단일 플랫폼에 연결합니다.
        </p>
      </div>

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 1 }}>
        {steps.map((s, i) => (
          <div
            key={i}
            className="card reveal solution-flow-card-sticky"
            style={{
              position: 'sticky',
              top: `${120 + i * 32}px`,
              zIndex: i + 1,
              backgroundColor: s.bg,
              border: s.dark ? 'none' : '1px solid var(--color-border)',
              boxShadow: s.dark ? 'var(--shadow-glow-strong)' : 'var(--shadow-xl)',
              color: s.dark ? 'white' : 'inherit',
            }}
          >
            <div className="solution-flow-card-content" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Step icon */}
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px', flexShrink: 0,
                background: s.dark
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, rgba(11,61,43,0.08) 0%, rgba(11,61,43,0.04) 100%)',
                border: s.dark ? `2px solid var(--color-accent)` : '2px solid var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.dark ? 'var(--color-accent)' : 'var(--color-primary)',
                fontSize: '2rem',
              }}>
                {s.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: s.numColor, letterSpacing: '0.1em', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  STEP {s.num}
                </div>
                <h3 className="card-title" style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: s.dark ? 'white' : 'inherit' }}>{s.title}</h3>
                <p className="card-desc" style={{ fontSize: '1.1rem', color: s.dark ? 'rgba(255,255,255,0.75)' : 'var(--color-text-mutated)' }}>{s.desc}</p>
              </div>

              {/* Mini stat badge */}
              <div className="solution-flow-stat-badge" style={{
                flexShrink: 0, textAlign: 'center',
                padding: '1.25rem 1.75rem',
                background: s.dark ? 'rgba(255,255,255,0.08)' : 'rgba(11,61,43,0.05)',
                border: s.dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(11,61,43,0.12)',
                borderRadius: 'var(--radius-lg)',
                minWidth: '140px',
              }}>
                <div style={{
                  fontSize: '1.6rem', fontWeight: '900', lineHeight: 1,
                  color: s.dark ? 'var(--color-accent)' : 'var(--color-primary)',
                  marginBottom: '0.25rem',
                }}>{s.stat}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: '600', color: s.dark ? 'rgba(255,255,255,0.5)' : 'var(--color-text-mutated)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.statLabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SolutionFlow;
