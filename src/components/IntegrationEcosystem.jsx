import React from 'react';

// SVG icon paths for each integration type (Feather-style)
const ICONS = {
  erp:    <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
  pay:    <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  lms:    <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  sms:    <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  video:  <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
  attend: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
};

// Variation in R (radius), angle, size, and styling
const nodes = [
  { label: 'ERP / CRM',   sub: '원생 및 DB 연동', angle: 260, r: 230, color: '#4ecdc4', iconKey: 'erp',   size: 'lg' },
  { label: '결제 / PG',   sub: '다중 수강료 결제', angle: 325, r: 280, color: '#ffd93d', iconKey: 'pay',   size: 'md' },
  { label: 'LMS / VOD',   sub: '학습 및 성취도',  angle: 30,  r: 215, color: '#a78bfa', iconKey: 'lms',   size: 'lg' },
  { label: '알림톡 / SMS', sub: '자동 발송 파이프라인',angle: 90, r: 285, color: '#f97316', iconKey: 'sms',   size: 'md' },
  { label: '화상 클래스',  sub: '실시간 스트리밍',  angle: 150, r: 220, color: '#00df45', iconKey: 'video', size: 'lg' },
  { label: '스마트 출결',  sub: '안면/QR 인증',    angle: 200, r: 290, color: '#ff6b6b', iconKey: 'attend',size: 'sm' },
];

const IntegrationEcosystem = () => {
  return (
    <section className="section theme-dark" style={{ backgroundColor: '#06090e', position: 'relative', overflow: 'hidden', padding: '8rem 0' }}>
      <style>{`
        .eco-node-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .eco-node-hover:hover {
          transform: translate(-50%, -50%) translateY(-12px) scale(1.05) !important;
          z-index: 50 !important;
        }
        .eco-node-inner {
          transition: all 0.4s ease;
        }
        .eco-node-hover:hover .eco-node-inner {
          box-shadow: 0 24px 48px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 0 40px var(--hover-color) !important;
          background: rgba(10, 15, 25, 0.85) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        .eco-node-icon {
          transition: transform 0.4s ease;
        }
        .eco-node-hover:hover .eco-node-icon {
          transform: scale(1.15) rotate(5deg);
        }
        
        .glow-pulse {
          animation: glowPulse 4s infinite alternate ease-in-out;
        }
        @keyframes glowPulse {
          0% { filter: blur(30px) opacity(0.6); transform: scale(0.9); }
          100% { filter: blur(40px) opacity(1); transform: scale(1.2); }
        }

        .spin-slow {
          animation: spin 30s linear infinite;
        }
        .spin-slow-reverse {
          animation: spinReverse 25s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          to { transform: rotate(-360deg); }
        }

        /* Responsive override for diagram */
        .eco-diagram-wrap {
          position: relative;
          width: 700px;
          height: 700px;
          flex-shrink: 0;
        }
        @media (max-width: 1200px) {
          .eco-diagram-wrap { transform: scale(0.85); transform-origin: center right; }
        }
        @media (max-width: 900px) {
          .integration-layout { flex-direction: column !important; }
          .eco-diagram-wrap { transform: scale(0.6); transform-origin: center top; margin-bottom: -100px; }
          .integration-list { padding-left: 0 !important; max-width: 100% !important; margin-top: -50px; text-align: center; }
          .integration-list h3 { text-align: center; }
        }
        @media (max-width: 600px) {
          .eco-diagram-wrap { transform: scale(0.45); margin-bottom: -200px; }
        }
      `}</style>

      {/* Background ambient lighting */}
      <div style={{ position: 'absolute', top: '50%', left: '40%', transform: 'translate(-50%,-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(11,61,43,0.25) 0%, rgba(22,94,69,0.05) 40%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(204,153,0,0.08) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1, marginBottom: '4rem' }}>
        <div className="section-label" style={{ backgroundColor: 'rgba(204,153,0,0.15)', color: '#ffd93d', borderColor: 'rgba(204,153,0,0.3)', letterSpacing: '0.1em' }}>ECOSYSTEM API</div>
        <h2 className="section-title">기존 레거시와 경계 없는 통합,<br />무한히 확장되는 운영 생태계</h2>
        <p className="section-subcopy">
          사용 중인 결제 모듈, ERP, 알림 서비스들을 버리지 마세요.<br />
          엔터프라이즈 코어를 중심으로 모든 파편화된 데이터가 하나로 실시간 동기화됩니다.
        </p>
      </div>

      <div className="container reveal delay-200 integration-layout" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Left Diagram */}
        <div className="eco-diagram-wrap">
          
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 700 700">
            {/* Multi-layered orbital rings */}
            <circle cx="350" cy="350" r="230" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
            <circle cx="350" cy="350" r="285" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" strokeDasharray="4 12" />
            <circle cx="350" cy="350" r="320" stroke="rgba(255,255,255,0.015)" strokeWidth="1" fill="none" />
            
            {/* Tech grid background pattern around core */}
            <path d="M 350 150 L 350 550 M 150 350 L 550 350" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="10 10"/>

            {/* Glowing connecting lines */}
            {nodes.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              const x1 = 350 + (node.r - 20) * Math.cos(rad);
              const y1 = 350 + (node.r - 20) * Math.sin(rad);
              return (
                <g key={`line-group-${i}`}>
                  {/* Base light dashed line */}
                  <line x1="350" y1="350" x2={x1} y2={y1} stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 6" />
                  {/* Data gradient flow line */}
                  <line x1="350" y1="350" x2={x1} y2={y1} stroke={`url(#flow-grad-${i})`} strokeWidth="4" opacity="0.8" />
                </g>
              );
            })}

             {/* Gradients */}
             <defs>
              {nodes.map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x1 = 350 + node.r * Math.cos(rad);
                const y1 = 350 + node.r * Math.sin(rad);
                return (
                  <linearGradient id={`flow-grad-${i}`} x1="350" y1="350" x2={x1} y2={y1} gradientUnits="userSpaceOnUse" key={`grad-${i}`}>
                    <stop offset="0%" stopColor="#00df45" stopOpacity="0" />
                    <stop offset="40%" stopColor="#00df45" stopOpacity="0.4" />
                    <stop offset="100%" stopColor={node.color} stopOpacity="0.8" />
                  </linearGradient>
                )
              })}
            </defs>

            {/* Animated Data Particles */}
            {nodes.map((node, i) => {
              const rad = (node.angle * Math.PI) / 180;
              // Stop data particle just before the node box
              const x2 = 350 + (node.r - 60) * Math.cos(rad);
              const y2 = 350 + (node.r - 60) * Math.sin(rad);
              // Alternate direction to show two-way sync
              const flowIn = i % 2 !== 0; 
              const pathD = flowIn ? `M ${x2} ${y2} L 350 350` : `M 350 350 L ${x2} ${y2}`;

              return (
                <circle key={`particle-${i}`} r="3.5" fill="#fff" filter={`drop-shadow(0 0 8px ${node.color})`}>
                  <animateMotion dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                    <mpath><path d={pathD} /></mpath>
                  </animateMotion>
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.5}s`} />
                </circle>
              );
            })}
          </svg>

          {/* Premium Center Core */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '240px', height: '240px',
            zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Spinning decorative orbit rings */}
            <div className="spin-slow" style={{ position: 'absolute', inset: '-15px', borderRadius: '50%', border: '2px dashed rgba(0,223,69,0.3)', borderTopColor: 'rgba(0,223,69,0.8)' }} />
            <div className="spin-slow-reverse" style={{ position: 'absolute', inset: '-35px', borderRadius: '50%', border: '1px solid rgba(204,153,0,0.15)', borderBottomColor: 'rgba(204,153,0,0.7)' }} />
            
            {/* Main Core Node */}
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'radial-gradient(135deg, #113828 0%, #061810 50%, #020a06 100%)',
              border: '2px solid rgba(0,223,69,0.5)',
              boxShadow: '0 0 80px rgba(0,223,69,0.25), inset 0 0 40px rgba(0,223,69,0.4), inset 0 0 10px rgba(255,255,255,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Inner ambient glow pulse */}
              <div className="glow-pulse" style={{ position: 'absolute', width: '130px', height: '130px', background: 'rgba(0,223,69,0.5)', borderRadius: '50%' }} />
              
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0b3d2b 0%, #22c55e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontWeight: '900', fontSize: '1.75rem', color: 'white', letterSpacing: '0.05em', textShadow: '0 2px 10px rgba(0,223,69,0.5)' }}>ClassIn</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#22c55e', letterSpacing: '0.2em', marginTop: '0.4rem', textTransform: 'uppercase' }}>Core Hub</div>
              </div>
            </div>
          </div>

          {/* Orbit Nodes */}
          {nodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const cx = 350 + node.r * Math.cos(rad);
            const cy = 350 + node.r * Math.sin(rad);
            
            const isLg = node.size === 'lg';
            const isMd = node.size === 'md';
            
            // Varied sizing based on node 'size' property
            const minW = isLg ? '160px' : isMd ? '140px' : '125px';
            const pad = isLg ? '1.1rem 1.4rem' : isMd ? '0.8rem 1.1rem' : '0.6rem 0.9rem';
            const iconSize = isLg ? '42px' : isMd ? '34px' : '28px';
            const svgSize = isLg ? '22' : isMd ? '18' : '15';
            const fontTitle = isLg ? '1.05rem' : isMd ? '0.9rem' : '0.8rem';
            const fontSub = isLg ? '0.8rem' : isMd ? '0.75rem' : '0.7rem';

            return (
              <div
                key={`node-${i}`}
                className="eco-node-hover"
                style={{
                  position: 'absolute',
                  left: `${(cx / 700) * 100}%`,
                  top: `${(cy / 700) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  zIndex: 20,
                  '--hover-color': `${node.color}40`,
                }}
              >
                <div className="eco-node-inner" style={{
                  background: 'rgba(7, 11, 18, 0.75)',
                  border: `1.5px solid ${node.color}33`,
                  borderTop: `2px solid ${node.color}99`,
                  borderRadius: '18px',
                  padding: pad,
                  boxShadow: `0 12px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 20px ${node.color}15`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  minWidth: minW,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  {/* Icon */}
                  <div className="eco-node-icon" style={{
                    width: iconSize, height: iconSize, borderRadius: '12px',
                    background: `linear-gradient(135deg, ${node.color}15, ${node.color}33)`,
                    border: `1px solid ${node.color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 12px ${node.color}33, inset 0 2px 4px rgba(255,255,255,0.2)`
                  }}>
                    <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={node.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[node.iconKey]}
                    </svg>
                  </div>
                  <div style={{ fontSize: fontTitle, fontWeight: '800', color: 'white', lineHeight: 1.2, marginTop: '0.4rem', letterSpacing: '-0.02em' }}>{node.label}</div>
                  <div style={{ fontSize: fontSub, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{node.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Info List */}
        <div className="integration-list" style={{ flex: 1, paddingLeft: '5rem', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '1.2rem', lineHeight: '1.3' }}>
            다양한 도구들을 품는<br />
            <span style={{ 
              background: 'linear-gradient(135deg, #00df45 0%, #22c55e 100%)', 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>초일류 허브 플랫폼</span>
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
            ClassIn Enterprise Core는 어떠한 폐쇄성도 강요하지 않습니다. 강력한 양방향 API를 통해 얽힌 솔루션들을 한 곳에서 거버넌스합니다.
          </p>

          <ul className="integration-list-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {nodes.map((node, i) => (
              <li key={`list-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${node.color}15, ${node.color}25)`,
                  border: `1px solid ${node.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={node.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[node.iconKey]}
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>{node.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '0.1rem', fontWeight: '500' }}>{node.sub}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
};

export default IntegrationEcosystem;
