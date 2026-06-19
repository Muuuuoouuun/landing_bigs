import React from 'react';

// 따뜻하고 신뢰감 있는 실제 교육/전문 공간 사진 (Unsplash 핫링크)
const heroBg = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=2000&q=85';

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
        background: 'linear-gradient(135deg, rgba(11, 61, 43, 0.86) 0%, rgba(16, 74, 53, 0.74) 100%)',
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
              <text x="0" y="75" fontFamily="Arial, sans-serif" fontSize="85" fontWeight="900" fill="#21a06a" letterSpacing="-2">ClassIn</text>
            </svg>
          </div>

          {/* 헤드라인 */}
          <h1 style={{ fontWeight: '900', fontSize: '3.5rem', lineHeight: '1.15', letterSpacing: '-0.04em', color: '#ffffff', margin: 0 }}>
            지점이 5개를 넘으면,<br />
            원장님 한 명의 눈으로는<br />
            더 이상 <em style={{ fontStyle: 'normal', color: '#21a06a' }}>보이지 않습니다</em>.
          </h1>

          {/* 서브카피 */}
          <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '0.5rem', fontSize: '1.1rem', lineHeight: '1.75' }}>
            흩어진 지점, 수백 명의 강사, 제각각인 운영 기준.<br />
            클래스인은 모든 지점의 수업과 데이터를 본사의 단일 화면으로<br />
            다시 끌어올려, 잃어버린 통제력과 가시성을 되찾아 드립니다.
          </p>

          {/* 스펙 리스트 */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {['무료 도입 컨설팅', '전담 CSM 지원', '14일 무료 체험'].map((item) => (
              <span key={item} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21a06a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              본사 통합 대시보드 1:1 데모
            </button>
          </div>
        </div>

        <div className="hero-visual reveal delay-300">
          <div className="hero-dashboard-wrapper glass-panel-dark" style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&q=85"
              alt="본사 운영 데이터를 검토하는 교육 담당자"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
