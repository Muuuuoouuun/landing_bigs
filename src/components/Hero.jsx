import React from 'react';
import heroBg from '../assets/hero_bg_abstract.png';
import dashboardUi from '../assets/hero_dashboard_ui.png';

const Hero = ({ onOpenConsultation, onOpenDemo }) => {
  return (
    <section className="section hero-section theme-dark reveal" id="hero" style={{
      backgroundImage: `url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    }}>
      <div className="hero-overlay" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(6, 26, 18, 0.85) 0%, rgba(10, 14, 20, 0.78) 100%)',
        zIndex: 1
      }}></div>

      <div className="container grid-2" style={{ position: 'relative', zIndex: 2, alignItems: 'center' }}>
        <div className="hero-content flex-column gap-3 reveal delay-100">

          {/* 소셜 프루프 배지 */}
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'rgba(204, 153, 0, 0.15)',
              border: '1px solid rgba(204, 153, 0, 0.35)',
              borderRadius: '9999px',
              padding: '0.35rem 0.9rem',
              fontSize: '0.8rem', fontWeight: '700',
              color: '#e6b800',
              letterSpacing: '0.04em',
            }}>
              <span style={{ fontSize: '0.7rem' }}>✦</span>
              다지점 학원 1,000개 이상 도입
            </div>
          </div>

          {/* ClassIn 로고 */}
          <div className="classin-logo" style={{ alignSelf: 'flex-start' }}>
            <svg width="140" height="38" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="75" fontFamily="Arial, sans-serif" fontSize="85" fontWeight="900" fill="#00df45" letterSpacing="-2">ClassIn</text>
            </svg>
          </div>

          {/* 헤드라인 */}
          <h1 style={{ fontWeight: '900', fontSize: '3.5rem', lineHeight: '1.15', letterSpacing: '-0.04em', color: '#ffffff', margin: 0 }}>
            학원의 규모가 커질수록,<br />
            수업은 도구가 아닌<br />
            <em style={{ fontStyle: 'normal', color: '#00df45' }}>'시스템'</em>으로<br />
            관리되어야 합니다.
          </h1>

          {/* 서브카피 */}
          <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '0.5rem', fontSize: '1.1rem', lineHeight: '1.75' }}>
            다지점 운영, 수백 명의 강사, 복잡한 권한 체계.<br />
            클래스인은 흩어진 단과반과 지점을 본사의 단일 기준으로<br />
            통합하는 엔터프라이즈 교육 운영 시스템입니다.
          </p>

          {/* 스펙 리스트 */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {['무료 도입 컨설팅', '전담 CSM 지원', '14일 무료 체험'].map((item) => (
              <span key={item} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00df45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {item}
              </span>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div className="btn-group">
            <button
              className="btn btn-primary"
              style={{ fontWeight: '700', letterSpacing: '0.02em', fontSize: '1.05rem', padding: '1rem 2rem' }}
              onClick={onOpenConsultation}
            >
              도입 상담 신청
            </button>
            <button
              className="btn"
              style={{
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.55)',
                fontWeight: '600',
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '1.05rem',
                padding: '1rem 2rem',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}
              onClick={onOpenDemo}
            >
              관리자 데모 보기
            </button>
          </div>
        </div>

        <div className="hero-visual reveal delay-300">
          <div className="hero-dashboard-wrapper glass-panel-dark" style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={dashboardUi} alt="Dashboard UI Mockup" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 'inherit' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
