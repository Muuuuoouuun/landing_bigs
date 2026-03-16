import React from 'react';

// Sparkline: small 96×34 SVG line chart in top-right of each card
const SparkLine = ({ points, color }) => {
  const W = 96, H = 34;
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const toX = x => ((x - minX) / (maxX - minX || 1)) * W;
  const toY = y => H - ((y - minY) / (maxY - minY || 1)) * (H - 4) - 2;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${toX(xs[xs.length - 1]).toFixed(1)},${H} L ${toX(xs[0]).toFixed(1)},${H} Z`;
  const uid = color.replace('#', 'sg');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, display: 'block' }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${uid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={toX(xs[xs.length - 1]).toFixed(1)}
        cy={toY(ys[ys.length - 1]).toFixed(1)}
        r="3" fill={color}
      />
    </svg>
  );
};

const outcomes = [
  {
    num: '01',
    stat: '100%',
    statLabel: '운영 표준화',
    title: '완전한 운영 표준화',
    desc: 'A지점과 B지점의 교육 품질 편차가 사라집니다. 어느 반에 배정되든 단일한 브랜드 교육 경험을 유지합니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    // downward trend = quality variance declining to 0
    sparkPoints: [[0,30],[20,24],[40,16],[60,8],[80,3],[100,0]],
    sparkColor: '#00df45',
    sparkLabel: '품질 편차 감소',
  },
  {
    num: '02',
    stat: '실시간',
    statLabel: '파이프라인 가시성',
    title: '전사 파이프라인 가시성',
    desc: '본사의 블랙박스가 완전히 해소됩니다. 실시간으로 돌아가는 지점의 현황을 즉시 파악 및 제어합니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    // activity pulse / monitoring heartbeat
    sparkPoints: [[0,16],[12,15],[20,4],[30,15],[42,15],[52,5],[62,15],[75,14],[85,7],[95,15],[100,15]],
    sparkColor: '#4ecdc4',
    sparkLabel: '실시간 모니터링',
  },
  {
    num: '03',
    stat: '0건',
    statLabel: '데이터 손실',
    title: '완벽한 데이터 자산 보호',
    desc: '모든 교육 자료와 기록은 철저히 보호되며 본사로 귀속됩니다. 강사 이탈로 인한 데이터 손실을 원천 차단합니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    // declining incident rate → 0
    sparkPoints: [[0,28],[20,22],[40,14],[60,6],[80,2],[100,0]],
    sparkColor: '#a78bfa',
    sparkLabel: '데이터 손실 0건',
  },
  {
    num: '04',
    stat: '1일',
    statLabel: '신규 지점 오픈 준비',
    title: '폭발적 비즈니스 확장성',
    desc: '신규 지점을 내더라도 시스템을 처음부터 짤 필요가 없습니다. 기존 체계를 복제하여 하루 만에 오픈 준비를 끝마칩니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    // setup time declining rapidly
    sparkPoints: [[0,28],[25,20],[50,12],[75,5],[100,1]],
    sparkColor: '#ffd93d',
    sparkLabel: '준비 시간 단축',
  },
];

const ExpectedOutcomes = () => {
  return (
    <section className="section outcomes-section" id="outcomes" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#061f18' }}>
      <div style={{ position: 'absolute', top: '20%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(22,94,69,0.25) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(204,153,0,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      {/* Noise grain texture */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px', pointerEvents: 'none', zIndex: 0 }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ backgroundColor: 'rgba(204,153,0,0.15)', color: 'var(--color-accent)', borderColor: 'rgba(204,153,0,0.3)' }}>Expected Outcomes</div>
        <h2 className="section-title">화상 수업을 넘어,<br />엔터프라이즈 학원 운영 체계의 완성</h2>
        <p className="section-subcopy">
          클래스인 엔터프라이즈 도입으로 확실히 보장받는 4가지 경영적 결과
        </p>
      </div>

      <div className="container grid-2" style={{ position: 'relative', zIndex: 1 }}>
        {outcomes.map((o, i) => (
          <div key={i} className="card outcome-card reveal" style={{ animationDelay: `${i * 0.1}s`, position: 'relative', overflow: 'hidden', padding: '2.5rem' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(22,94,69,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Top row: icon + sparkline + number */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}>
                  {o.icon}
                </div>

                {/* Sparkline in top-right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                  <SparkLine points={o.sparkPoints} color={o.sparkColor} />
                  <span style={{ fontSize: '0.65rem', color: o.sparkColor, fontWeight: '600', opacity: 0.7 }}>{o.sparkLabel}</span>
                </div>
              </div>

              {/* Number badge */}
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>
                  {o.num} / 04
                </span>
              </div>

              {/* Big stat */}
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '3.5rem', fontWeight: '900', lineHeight: 1,
                  background: 'linear-gradient(135deg, #ffffff 0%, var(--color-accent) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{o.stat}</span>
              </div>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                {o.statLabel}
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>{o.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', fontSize: '0.95rem', margin: 0 }}>{o.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpectedOutcomes;
