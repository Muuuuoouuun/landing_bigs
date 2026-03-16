import React from 'react';

const steps = [
  {
    step: 'Step 01',
    badge: 'D-14',
    badgeColor: '#0b3d2b',
    title: '운영 진단 컨설팅',
    desc: '귀원의 현재 툴 사용 현황, 권한 구조, 데이터 흐름을 분석하여 맞춤형 통합 아키텍처를 설계합니다.',
    accent: 'var(--color-primary)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    step: 'Step 02',
    badge: 'D-7',
    badgeColor: '#165e45',
    title: '시스템 글로벌 세팅',
    desc: '기존 원생 DB와 커리큘럼을 이관하고, 지점별 관리자 권한과 보안 수준을 중앙에서 완벽히 세팅합니다.',
    accent: 'var(--color-primary-light)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
  },
  {
    step: 'Step 03',
    badge: 'D-1',
    badgeColor: '#b07d00',
    title: '직급별 맞춤 온보딩',
    desc: '솔루션 도입에 따른 내부 저항을 줄이기 위해, 원장/강사/조교 등 직급별 맞춤형 세미나와 시뮬레이션을 전담 지원합니다.',
    accent: 'var(--color-accent)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    step: 'Step 04',
    badge: 'D+30',
    badgeColor: '#4a5568',
    title: '실시간 전담 관제',
    desc: '개강 후 초기 가장 빈번하게 발생하는 이슈에 대해 우선 순위 핫라인 기술 지원을 가동하여 운영 혼선을 방지합니다.',
    accent: '#64748b',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
      </svg>
    ),
  },
];

const OnboardingProcess = () => {
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f7f9f7 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(11,61,43,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">VIP Onboarding</div>
        <h2 className="section-title">시스템 전환의 리스크 제로화,<br />엔터프라이즈 전담 파트너십</h2>
        <p className="section-subcopy">
          기존 시스템에서 넘어오실 때의 혼란을 막기 위해<br />
          클래스인 전담 CSM 팀이 초기 세팅부터 마이그레이션을 밀착 지원합니다.
        </p>
      </div>

      {/* Steps */}
      <div className="container" style={{ position: 'relative', zIndex: 1, marginTop: '1rem' }}>
        {/* Connector line (desktop only) */}
        <div className="onboarding-connector-line" style={{
          position: 'absolute', top: '72px', left: 'calc(12.5% + 22px)', right: 'calc(12.5% + 22px)',
          height: '2px',
          background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light), var(--color-accent), #64748b)',
          zIndex: 0,
        }} />

        <div className="grid-4" style={{ position: 'relative', zIndex: 1, alignItems: 'flex-start' }}>
          {steps.map((s, i) => (
            <div key={i} className="reveal" style={{ animationDelay: `${i * 0.12}s` }}>
              {/* Icon circle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <div className="onboarding-icon-circle" style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${s.badgeColor} 0%, ${s.badgeColor}cc 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  boxShadow: `0 4px 20px ${s.badgeColor}55`,
                  border: '4px solid white',
                }}>
                  {s.icon}
                </div>
              </div>

              {/* Card */}
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                borderTop: `4px solid ${s.badgeColor}`,
                padding: '1.75rem',
                boxShadow: '0 4px 16px rgba(11,61,43,0.06)',
                height: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: s.badgeColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.step}</span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: '700',
                    background: `${s.badgeColor}14`,
                    color: s.badgeColor,
                    border: `1px solid ${s.badgeColor}33`,
                  }}>{s.badge}</span>
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1a2530' }}>{s.title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-mutated)', lineHeight: '1.7', margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OnboardingProcess;
