import React from 'react';
// Images — place files in src/assets/ and uncomment imports when ready:
// import problem1 from '../assets/problem_1.png';
// import problem2 from '../assets/problem_2.png';
// import problem3 from '../assets/problem_3.png';

const problems = [
  {
    num: '01',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: '블랙박스가 된 지점 관리',
    desc: '본사는 개별 학원 수업의 질과 현황을 실시간으로 파악할 수 없습니다. 현장의 보고에만 의존하게 됩니다.',
    stat: '67%',
    statDesc: '다지점 본사가 지점 수업 현황을 제때 파악하지 못한다고 응답',
    accentColor: '#ff6b6b',
    glowColor: 'rgba(255,107,107,0.08)',
    image: null, // replace with problem1 when ready
  },
  {
    num: '02',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: '섞여버린 관리 권한',
    desc: '원장, 강사, 보조의 열람 및 제어 권한을 툴 단위로 명확히 분리할 수 없어 정보 유출 및 보안 사고 위험이 높습니다.',
    stat: '3.2×',
    statDesc: '권한 미분리 학원의 내부 정보 유출 사고 발생률 — 체계적 분리 기관 대비',
    accentColor: '#ffd93d',
    glowColor: 'rgba(255,217,61,0.06)',
    image: null, // replace with problem2 when ready
  },
  {
    num: '03',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    title: '흩어진 데이터와 프로세스',
    desc: '출결, 수업 기록, 과제 등이 각기 다른 메신저와 툴에 분산되어 있어, 통합적인 자산화와 분석이 불가능합니다.',
    stat: '89%',
    statDesc: '강사 이탈 후 수업 자료 및 운영 기록 손실을 경험한 학원 비율',
    accentColor: '#4ecdc4',
    glowColor: 'rgba(78,205,196,0.06)',
    image: null, // replace with problem3 when ready
  },
];

const ProblemOverview = () => {
  return (
    <section className="section theme-dark" id="problem" style={{
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#060a0f',
      padding: '10rem 0',
    }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(22,94,69,0.18) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,107,107,0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(78,205,196,0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">Problem</div>
        <h2 className="section-title">다지점을 운영하는 학원 본사가<br />직면하는 구조적 한계점</h2>
        <p className="section-subcopy">
          학생과 강사가 늘어날수록, 파편화된 도구로는 운영 통제력을 잃게 됩니다.
        </p>
      </div>

      <div className="container grid-3" style={{ position: 'relative', zIndex: 1 }}>
        {problems.map((p, i) => (
          <div
            key={i}
            className="card glass-panel-dark text-left reveal"
            style={{
              animationDelay: `${(i + 1) * 0.1}s`,
              border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
              overflow: 'hidden',
              background: `radial-gradient(circle at top right, ${p.glowColor} 0%, rgba(255,255,255,0.015) 60%)`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${p.accentColor}, transparent)` }} />

            {/* Number watermark */}
            <div style={{
              position: 'absolute', top: '-0.5rem', right: '1.25rem',
              fontSize: '5rem', fontWeight: '900', color: 'rgba(255,255,255,0.025)',
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            }}>{p.num}</div>

            <div style={{ flex: 1 }}>
              <div className="card-icon" style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: p.accentColor,
                width: '52px', height: '52px',
              }}>
                {p.icon}
              </div>

              <h3 className="card-title" style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.75rem' }}>{p.title}</h3>
              <p className="card-desc" style={{ color: 'var(--color-text-mutated-dark)', lineHeight: '1.7', marginBottom: '1.5rem' }}>{p.desc}</p>

              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                paddingTop: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: p.image ? '1.5rem' : 0,
              }}>
                <span style={{ fontSize: '2.25rem', fontWeight: '900', color: p.accentColor, lineHeight: 1, flexShrink: 0 }}>{p.stat}</span>
                <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', margin: 0 }}>{p.statDesc}</p>
              </div>
            </div>

            {/* Image slot — only renders when image is provided */}
            {p.image && (
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginTop: '0.5rem',
                border: `1px solid ${p.accentColor}22`,
              }}>
                <img
                  src={p.image}
                  alt={p.title}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 'inherit',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProblemOverview;
