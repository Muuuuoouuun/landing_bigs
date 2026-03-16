import React, { useEffect, useRef, useState } from 'react';

const CURVE = 'M 80,240 C 145,240 178,205 233,198 C 288,191 315,148 387,125 C 455,103 492,28 540,20';
const AREA  = `${CURVE} L 540,258 L 80,258 Z`;

const PTS = [
  { x: 80,  y: 240, label: '1~2지점',  pct: '10%',  note: '괜찮아 보임',  color: '#4ecdc4' },
  { x: 233, y: 198, label: '3~5지점',  pct: '30%',  note: '균열 시작',    color: '#ffd93d' },
  { x: 387, y: 125, label: '6~10지점', pct: '63%',  note: '운영 혼란',    color: '#ff9f43' },
  { x: 540, y: 20,  label: '11지점+',  pct: '100%', note: '⚠ 시스템 마비', color: '#ff6b6b' },
];

const RiskCurveChart = () => {
  const containerRef = useRef(null);
  const pathRef      = useRef(null);
  const [visible, setVisible] = useState(false);
  const [pathLen, setPathLen] = useState(900);

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.25 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <p style={{
        fontSize: '0.78rem', fontWeight: '700', color: 'rgba(255,255,255,0.28)',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem', textAlign: 'center',
      }}>
        지점 수 증가에 따른 운영 부채 곡선
      </p>

      <svg viewBox="0 0 620 280" style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="whyNowFillGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4ecdc4" stopOpacity="0.12" />
            <stop offset="50%"  stopColor="#ff9f43" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="whyNowLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4ecdc4" />
            <stop offset="38%"  stopColor="#ffd93d" />
            <stop offset="68%"  stopColor="#ff9f43" />
            <stop offset="100%" stopColor="#ff6b6b" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {[0, 25, 50, 75, 100].map((pct, i) => {
          const y = 20 + (1 - pct / 100) * 238;
          return (
            <g key={i}>
              <line x1="68" y1={y} x2="558" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x="60" y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="sans-serif">{pct}%</text>
            </g>
          );
        })}

        {/* Y axis rotated label */}
        <text transform="rotate(-90)" x="-130" y="14" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.18)" fontFamily="sans-serif" letterSpacing="1">운영 리스크 수준</text>

        {/* X axis */}
        <line x1="68" y1="258" x2="558" y2="258" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

        {/* Fill area */}
        <path
          d={AREA}
          fill="url(#whyNowFillGrad)"
          style={{
            opacity: visible ? 1 : 0,
            transition: visible ? 'opacity 1.4s ease 1.2s' : 'none',
          }}
        />

        {/* Main curve */}
        <path
          ref={pathRef}
          d={CURVE}
          fill="none"
          stroke="url(#whyNowLineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: visible ? 0 : pathLen,
            transition: visible ? 'stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1) 0.1s' : 'none',
          }}
        />

        {/* Data points */}
        {PTS.map((pt, i) => (
          <g
            key={i}
            style={{
              transform: visible ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${pt.x}px ${pt.y}px`,
              transition: visible ? `transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.9 + i * 0.18}s` : 'none',
            }}
          >
            <circle cx={pt.x} cy={pt.y} r="16" fill={pt.color} opacity="0.08" />
            <circle cx={pt.x} cy={pt.y} r="8"  fill={pt.color} opacity="0.2"  />
            <circle cx={pt.x} cy={pt.y} r="4"  fill={pt.color} />
            <text x={pt.x} y={pt.y - 20} textAnchor="middle" fontSize="10.5" fill={pt.color} fontWeight="700" fontFamily="sans-serif">{pt.pct}</text>
            <text x={pt.x} y="275" textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.38)" fontWeight="600" fontFamily="sans-serif">{pt.label}</text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {PTS.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pt.color, boxShadow: `0 0 6px ${pt.color}` }} />
            <span style={{ fontSize: '0.72rem', color: pt.color, fontWeight: '600' }}>{pt.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhyNow = () => {
  return (
    <section className="section theme-dark" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#060a0f', padding: '10rem 0' }}>
      <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(22,94,69,0.15) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(204,153,0,0.1) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }}></div>

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ backgroundColor: 'rgba(204,153,0,0.12)', color: 'var(--color-accent)', borderColor: 'rgba(204,153,0,0.25)' }}>Why Now</div>
        <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 800 }}>
          학원의 성장을 가로막는<br />보이지 않는 <span style={{ color: 'var(--color-accent)' }}>'운영 부채'</span>
        </h2>
        <p className="section-subcopy" style={{ fontSize: '1.2rem' }}>
          단일 학원에서는 넘어갈 수 있었던 불편함이,<br />다지점 체계에서는 시스템 마비로 이어집니다.
        </p>
      </div>

      {/* Risk Curve Chart */}
      <div className="container reveal delay-200" style={{ position: 'relative', zIndex: 1, marginBottom: '4rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
        }}>
          <RiskCurveChart />

          <div style={{
            marginTop: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'rgba(255,107,107,0.06)',
            border: '1px solid rgba(255,107,107,0.15)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '1.6' }}>
              운영 부채는 복리로 쌓입니다. <strong style={{ color: '#ff6b6b' }}>지점 수가 2배 늘면 운영 리스크는 4배 증가</strong>합니다.
              체계 없는 확장은 결국 본사 전체를 위기에 빠뜨립니다.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="container reveal delay-200" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

          <div className="glass-panel-dark" style={{ padding: '3rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9da4b0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#9da4b0' }}>작을 때는 넘어가던 문제</h3>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {['지점별 자체 도구 사용 허용 가능', '체계 없는 관리자 권한 공유', '엑셀 수동 취합 보고라도 가능', '강사 개인 계정에 자료 보관'].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: '#667085', fontSize: '1.05rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#667085', flexShrink: 0 }}></div>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0,223,69,0.25)', backgroundColor: 'rgba(0,38,26,0.4)', boxShadow: '0 0 80px rgba(0,223,69,0.08) inset, 0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00df45, #cc9900)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,223,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00df45', boxShadow: '0 0 20px rgba(0,223,69,0.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>커지면 본사 리스크가 되는 문제</h3>
            </div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {[
                '본사의 지점 통제력 마비 및 서비스 편차 심화',
                '보안 및 학생/운영 데이터 유출 리스크 증대',
                '본사 표준화 및 퀄리티 컨트롤 실패',
                '강사 퇴사 시 학원 자산(수업 자료/기록) 소실',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', color: 'white', fontSize: '1.05rem' }}>
                  <div style={{ color: '#00df45', marginTop: '3px', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span style={{ fontWeight: 500 }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyNow;
