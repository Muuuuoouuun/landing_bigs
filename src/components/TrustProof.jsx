import React from 'react';
// Logo images — place files in src/assets/ and uncomment when ready:
// import logo1 from '../assets/trust_logo_1.png';
// import logo2 from '../assets/trust_logo_2.png';
// import logo3 from '../assets/trust_logo_3.png';
// import logo4 from '../assets/trust_logo_4.png';
// import logo5 from '../assets/trust_logo_5.png';
// import logo6 from '../assets/trust_logo_6.png';
// import logo7 from '../assets/trust_logo_7.png';

const bigStats = [
  { value: '1,000+', label: '도입 기관 수', sub: '전국 다지점 학원 네트워크' },
  { value: '99.9%', label: '서버 가동률', sub: '연간 무중단 스트리밍 SLA' },
  { value: '24 / 7', label: '기술 지원', sub: '전담 CSM 실시간 대응' },
];

const proofItems = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: '정보 보안 규정 완비',
    desc: '직급별 권한 분리 아키텍처 및 데이터 암호화로 내부 유출 리스크를 원천 차단합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: '99.9% 무중단 인프라',
    desc: '글로벌 CDN 기반 스트리밍 서버로 수업 중 끊김·튕김 없는 안정적 운영을 보장합니다.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: '전담 CSM 온보딩 지원',
    desc: '도입부터 안정화까지 전담 고객 성공팀이 밀착 파트너십으로 운영 전환을 책임집니다.',
  },
];

// Brand entries: set logo to imported image when files are available
const brands = [
  { name: '○○ 학원그룹', logo: null },
  { name: '△△ 에듀',     logo: null },
  { name: '◇◇ 어학원',   logo: null },
  { name: '□□ 입시학원', logo: null },
  { name: '★★ 교육',     logo: null },
  { name: '◎◎ 아카데미', logo: null },
  { name: '●● 학습관',   logo: null },
];

const TrustProof = () => {
  return (
    <section className="section bg-light" style={{ paddingBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(11,61,43,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">Enterprise Proof</div>
        <h2 className="section-title">검증된 안정성,<br />엔터프라이즈를 위한 무결점 인프라</h2>
        <p className="section-subcopy">
          수천 개의 데이터베이스와 스트리밍 환경, 최고의 교육 브랜드들이 상시적으로 증명합니다.
        </p>
      </div>

      {/* Big Stats */}
      <div className="container reveal" style={{ position: 'relative', zIndex: 1, marginBottom: '3.5rem' }}>
        <div className="trust-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {bigStats.map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '2.5rem 1.5rem',
              background: 'white', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 20px rgba(11,61,43,0.06)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #0b3d2b, #165e45)' }} />
              <div style={{
                fontSize: '3rem', fontWeight: '900', lineHeight: 1,
                background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', marginBottom: '0.5rem',
              }}>{s.value}</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#2b3036', marginBottom: '0.25rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-mutated)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee — logo image if provided, otherwise text pill */}
      <div className="marquee-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="marquee-content">
          {[...brands, ...brands].map((brand, idx) => (
            <div className="marquee-item" key={idx} style={{ width: '220px' }}>
              {brand.logo ? (
                <div style={{
                  padding: '0.6rem 1.25rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '52px',
                }}>
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    style={{
                      maxHeight: '32px', maxWidth: '140px',
                      objectFit: 'contain',
                      filter: 'grayscale(100%)',
                      opacity: 0.6,
                      transition: 'filter 0.3s, opacity 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'grayscale(100%)'; e.currentTarget.style.opacity = '0.6'; }}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  color: '#9da4b0',
                  whiteSpace: 'nowrap',
                }}>{brand.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Proof Cards */}
      <div className="container trust-proof-grid section" style={{ position: 'relative', zIndex: 1 }}>
        {proofItems.map((item, i) => (
          <div key={i} className="proof-box reveal" style={{
            flexDirection: 'column', alignItems: 'flex-start', gap: '1rem',
            padding: '2rem', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 12px rgba(11,61,43,0.05)',
            background: 'white',
            animationDelay: `${i * 0.1}s`,
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(11,61,43,0.08) 0%, rgba(11,61,43,0.04) 100%)',
              border: '1px solid rgba(11,61,43,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary)', flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#2b3036', marginBottom: '0.4rem' }}>{item.title}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-mutated)', lineHeight: '1.65', margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustProof;
