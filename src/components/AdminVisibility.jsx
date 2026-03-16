import React from 'react';
import dashboardUi from '../assets/hero_dashboard_ui.png';

const topStats = [
  { value: '1,000+', label: '전국 지점 모니터링' },
  { value: '0.3초', label: '평균 데이터 응답 속도' },
  { value: '100%', label: '수업 데이터 보존율' },
];

const points = [
  {
    num: '01',
    badge: '실시간',
    badgeColor: '#00c853',
    title: '전 지점 실시간 원격 모니터링',
    desc: '현재 열려있는 클래스 상태, 튕김, 출결 현황을 스크린 하나에서 확인. 본사는 지점 원장에게 전화할 필요 없이 모든 상황을 통제합니다.',
    // 3D monitor/dashboard icon
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Base shadow */}
        <ellipse cx="40" cy="72" rx="22" ry="4" fill="rgba(0,200,83,0.12)" />
        {/* Monitor body */}
        <rect x="12" y="14" width="56" height="38" rx="6" fill="url(#g1_body)" stroke="url(#g1_stroke)" strokeWidth="1.5" />
        {/* Screen */}
        <rect x="16" y="18" width="48" height="30" rx="3" fill="url(#g1_screen)" />
        {/* Screen grid lines */}
        <line x1="16" y1="28" x2="64" y2="28" stroke="rgba(0,200,83,0.15)" strokeWidth="0.5" />
        <line x1="16" y1="38" x2="64" y2="38" stroke="rgba(0,200,83,0.15)" strokeWidth="0.5" />
        <line x1="32" y1="18" x2="32" y2="48" stroke="rgba(0,200,83,0.1)" strokeWidth="0.5" />
        <line x1="48" y1="18" x2="48" y2="48" stroke="rgba(0,200,83,0.1)" strokeWidth="0.5" />
        {/* Live dot */}
        <circle cx="22" cy="23" r="2.5" fill="#00c853">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <text x="27" y="25" fontSize="5" fill="rgba(255,255,255,0.7)" fontWeight="600">LIVE</text>
        {/* Bar chart on screen */}
        <rect x="20" y="35" width="5" height="11" rx="1" fill="rgba(0,200,83,0.5)" />
        <rect x="27" y="31" width="5" height="15" rx="1" fill="rgba(0,200,83,0.7)" />
        <rect x="34" y="37" width="5" height="9" rx="1" fill="rgba(0,200,83,0.4)" />
        <rect x="41" y="29" width="5" height="17" rx="1" fill="#00c853" />
        <rect x="48" y="33" width="5" height="13" rx="1" fill="rgba(0,200,83,0.6)" />
        <rect x="55" y="36" width="5" height="10" rx="1" fill="rgba(0,200,83,0.45)" />
        {/* Stand */}
        <path d="M36 52 L36 58 L30 64 L50 64 L44 58 L44 52" fill="url(#g1_stand)" />
        {/* Stand base */}
        <rect x="28" y="63" width="24" height="3" rx="1.5" fill="url(#g1_stand)" />
        <defs>
          <linearGradient id="g1_body" x1="12" y1="14" x2="68" y2="52">
            <stop offset="0%" stopColor="#1a3a2e" />
            <stop offset="100%" stopColor="#0d2820" />
          </linearGradient>
          <linearGradient id="g1_stroke" x1="12" y1="14" x2="68" y2="52">
            <stop offset="0%" stopColor="rgba(0,200,83,0.4)" />
            <stop offset="100%" stopColor="rgba(0,200,83,0.15)" />
          </linearGradient>
          <linearGradient id="g1_screen" x1="16" y1="18" x2="64" y2="48">
            <stop offset="0%" stopColor="#0a1f16" />
            <stop offset="100%" stopColor="#071510" />
          </linearGradient>
          <linearGradient id="g1_stand" x1="36" y1="52" x2="44" y2="66">
            <stop offset="0%" stopColor="#1a3a2e" />
            <stop offset="100%" stopColor="#0d2018" />
          </linearGradient>
        </defs>
      </svg>
    ),
    glowColor: 'rgba(0,200,83,0.25)',
    accentColor: '#00c853',
  },
  {
    num: '02',
    badge: '수 초 내',
    badgeColor: '#e6b800',
    title: '지점 및 강사 퍼포먼스 리포트',
    desc: '강사별, 지점별 통계 데이터를 바탕으로 운영 효율성을 비교 분석. 어떤 반의 학생 참여도가 가장 높은지 직관적으로 비교합니다.',
    // 3D chart/analytics icon
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="40" cy="72" rx="22" ry="4" fill="rgba(230,184,0,0.12)" />
        {/* Document base - 3D perspective */}
        <path d="M16 12 L58 12 L64 18 L64 66 L22 66 L16 60 Z" fill="url(#g2_doc)" stroke="url(#g2_stroke)" strokeWidth="1.2" />
        {/* Side face for 3D */}
        <path d="M16 12 L16 60 L22 66 L22 18 Z" fill="rgba(230,184,0,0.08)" stroke="rgba(230,184,0,0.15)" strokeWidth="0.5" />
        {/* Top face for 3D */}
        <path d="M16 12 L58 12 L64 18 L22 18 Z" fill="rgba(230,184,0,0.06)" stroke="rgba(230,184,0,0.12)" strokeWidth="0.5" />
        {/* Pie chart */}
        <circle cx="43" cy="34" r="11" fill="none" stroke="rgba(230,184,0,0.15)" strokeWidth="1" />
        <path d="M43 23 A11 11 0 0 1 52.5 39 L43 34 Z" fill="#e6b800" opacity="0.8" />
        <path d="M43 23 A11 11 0 0 0 33 39 L43 34 Z" fill="rgba(230,184,0,0.4)" />
        <path d="M33 39 A11 11 0 0 0 52.5 39 L43 34 Z" fill="rgba(230,184,0,0.2)" />
        <circle cx="43" cy="34" r="4" fill="#0d2018" />
        {/* Line chart below */}
        <polyline points="28,52 34,48 40,54 46,46 52,50 58,44" fill="none" stroke="#e6b800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <polyline points="28,56 34,54 40,58 46,52 52,55 58,50" fill="none" stroke="rgba(230,184,0,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        {/* Star badge */}
        <circle cx="58" cy="16" r="8" fill="#e6b800" opacity="0.9" />
        <text x="58" y="19" fontSize="9" fill="#0d2018" fontWeight="800" textAnchor="middle">★</text>
        <defs>
          <linearGradient id="g2_doc" x1="16" y1="12" x2="64" y2="66">
            <stop offset="0%" stopColor="#1a2e1e" />
            <stop offset="100%" stopColor="#0d2018" />
          </linearGradient>
          <linearGradient id="g2_stroke" x1="16" y1="12" x2="64" y2="66">
            <stop offset="0%" stopColor="rgba(230,184,0,0.35)" />
            <stop offset="100%" stopColor="rgba(230,184,0,0.1)" />
          </linearGradient>
        </defs>
      </svg>
    ),
    glowColor: 'rgba(230,184,0,0.2)',
    accentColor: '#e6b800',
  },
  {
    num: '03',
    badge: '영구 보관',
    badgeColor: '#00c853',
    title: '데이터 본사 중앙 통제 자산화',
    desc: '강사 개인의 화상 툴이 아닌, 본사 시스템 내에 모든 수업 자료 재생산 및 보관. 강사가 이탈해도 수업 자산은 고스란히 남습니다.',
    // 3D shield/vault icon
    icon: (
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="40" cy="72" rx="20" ry="4" fill="rgba(0,200,83,0.12)" />
        {/* Shield body */}
        <path d="M40 8 L62 18 L62 42 C62 56 52 64 40 70 C28 64 18 56 18 42 L18 18 Z" fill="url(#g3_shield)" stroke="url(#g3_stroke)" strokeWidth="1.5" />
        {/* Inner shield reflection */}
        <path d="M40 14 L56 22 L56 41 C56 52 48 58 40 63 C32 58 24 52 24 41 L24 22 Z" fill="rgba(0,200,83,0.06)" stroke="rgba(0,200,83,0.1)" strokeWidth="0.5" />
        {/* Lock body */}
        <rect x="32" y="34" width="16" height="14" rx="3" fill="url(#g3_lock)" stroke="rgba(0,200,83,0.4)" strokeWidth="1" />
        {/* Lock shackle */}
        <path d="M35 34 L35 28 C35 24 37.5 22 40 22 C42.5 22 45 24 45 28 L45 34" fill="none" stroke="rgba(0,200,83,0.5)" strokeWidth="2" strokeLinecap="round" />
        {/* Keyhole */}
        <circle cx="40" cy="39" r="2" fill="#00c853" />
        <rect x="39.25" y="40" width="1.5" height="4" rx="0.5" fill="#00c853" />
        {/* Sparkle effects */}
        <circle cx="26" cy="30" r="1.5" fill="#00c853" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="54" cy="26" r="1" fill="#00c853" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="50" cy="50" r="1.2" fill="#00c853" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" begin="1s" />
        </circle>
        <defs>
          <linearGradient id="g3_shield" x1="18" y1="8" x2="62" y2="70">
            <stop offset="0%" stopColor="#1a3a2e" />
            <stop offset="50%" stopColor="#0d2820" />
            <stop offset="100%" stopColor="#0a1f16" />
          </linearGradient>
          <linearGradient id="g3_stroke" x1="18" y1="8" x2="62" y2="70">
            <stop offset="0%" stopColor="rgba(0,200,83,0.5)" />
            <stop offset="50%" stopColor="rgba(0,200,83,0.25)" />
            <stop offset="100%" stopColor="rgba(0,200,83,0.1)" />
          </linearGradient>
          <linearGradient id="g3_lock" x1="32" y1="34" x2="48" y2="48">
            <stop offset="0%" stopColor="#142e24" />
            <stop offset="100%" stopColor="#0a1f16" />
          </linearGradient>
        </defs>
      </svg>
    ),
    glowColor: 'rgba(0,200,83,0.2)',
    accentColor: '#00c853',
  },
];

const AdminVisibility = () => {
  return (
    <section
      className="section reveal"
      id="features"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-primary-dark)',
        color: 'white',
      }}
    >
      {/* Background decorations */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', right: '-5%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(230,184,0,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(22,94,69,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle grid pattern overlay — enhanced */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(0,200,83,0.5), rgba(230,184,0,0.5), transparent)',
      }} />

      {/* Header */}
      <div className="container section-header center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{
          backgroundColor: 'rgba(0,200,83,0.12)',
          color: '#00c853',
          borderColor: 'rgba(0,200,83,0.3)',
        }}>Admin Dashboard</div>
        <h2 className="section-title" style={{ color: 'white' }}>
          현장에 묻지 마세요.<br />본사 대시보드에서 완벽한 가시성을 확보하십시오.
        </h2>
        <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.6)' }}>
          여러 지점, 복수 강사 환경에서도 시스템 접속 한 번으로<br />실시간 운영 현황을 파악하고 제어할 수 있습니다.
        </p>
      </div>

      {/* Top Stats Bar */}
      <div className="container reveal" style={{ marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
        <div className="admin-stats-bar" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem',
        }}>
          {topStats.map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '1.5rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                fontSize: '2rem', fontWeight: '900',
                background: 'linear-gradient(135deg, #ffffff 0%, #00c853 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: '0.25rem',
              }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Image */}
      <div className="container reveal" style={{ marginBottom: '5rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 80px rgba(0,200,83,0.1), 0 20px 60px rgba(0,0,0,0.4)',
          position: 'relative',
        }}>
          <img
            src={dashboardUi}
            alt="Admin Dashboard"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          {/* Subtle green glow overlay at edges */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,200,83,0.05) 0%, transparent 20%, transparent 80%, rgba(0,200,83,0.03) 100%)',
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }} />
        </div>
      </div>

      {/* Vertical Roadmap */}
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="admin-roadmap" style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          {/* Connecting vertical line */}
          <div className="admin-roadmap-line" style={{
            position: 'absolute',
            left: '54px',
            top: '40px',
            bottom: '40px',
            width: '2px',
            background: 'linear-gradient(180deg, rgba(0,200,83,0.5), rgba(230,184,0,0.4), rgba(0,200,83,0.5))',
            zIndex: 0,
          }}>
            {/* Animated pulse dots along the line */}
            <div style={{
              position: 'absolute', left: '-3px', width: '8px', height: '8px',
              borderRadius: '50%', background: '#00c853',
              animation: 'roadmapPulse 3s ease-in-out infinite',
              boxShadow: '0 0 12px rgba(0,200,83,0.6)',
            }} />
          </div>

          {points.map((p, i) => (
            <div
              key={i}
              className="reveal admin-roadmap-item"
              style={{
                display: 'flex',
                gap: '2.5rem',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1,
                marginBottom: i < points.length - 1 ? '3rem' : 0,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* 3D Icon */}
              <div style={{
                width: '110px',
                height: '110px',
                flexShrink: 0,
                position: 'relative',
              }}>
                {/* Glow behind icon */}
                <div style={{
                  position: 'absolute',
                  inset: '-15%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${p.glowColor} 0%, transparent 70%)`,
                  filter: 'blur(10px)',
                  pointerEvents: 'none',
                }} />
                {/* Icon container with 3D effect */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                  border: `1px solid ${p.accentColor}25`,
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px',
                  position: 'relative',
                  transform: 'perspective(400px) rotateY(-5deg)',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 ${p.accentColor}15`,
                }}>
                  {p.icon}
                </div>
              </div>

              {/* Content card */}
              <div style={{
                flex: 1,
                padding: '2rem 2.25rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = `${p.accentColor}30`;
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), 0 0 40px ${p.glowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
              >
                {/* Subtle accent gradient in top-right */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '120px', height: '120px',
                  background: `radial-gradient(circle at top right, ${p.glowColor} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  opacity: 0.5,
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Number + Badge row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.875rem',
                  }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: 'rgba(255,255,255,0.2)',
                      letterSpacing: '0.08em',
                    }}>STEP {p.num}</span>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      background: `${p.badgeColor}18`,
                      color: p.badgeColor,
                      border: `1px solid ${p.badgeColor}35`,
                      whiteSpace: 'nowrap',
                    }}>{p.badge}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '0.75rem',
                    lineHeight: '1.35',
                    letterSpacing: '-0.02em',
                  }}>{p.title}</h3>

                  {/* Description */}
                  <p style={{
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: '1.75',
                    fontSize: '0.95rem',
                    margin: 0,
                  }}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminVisibility;
