import React from 'react';

const FinalCTA = ({ onOpenModal, onOpenConsultation, onOpenDemo }) => {
  return (
    <section className="section final-cta-section reveal" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%', height: '80%',
        background: 'radial-gradient(circle, rgba(22,94,69,0.35) 0%, transparent 70%)',
        zIndex: 0, animation: 'corePulse 6s infinite alternate'
      }}></div>
      {/* 동심원 링 패턴 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at center, transparent 200px, rgba(22,94,69,0.03) 201px, transparent 203px, transparent 350px, rgba(22,94,69,0.025) 351px, transparent 353px, transparent 500px, rgba(22,94,69,0.02) 501px, transparent 503px)
        `,
        pointerEvents: 'none', zIndex: 0,
      }}></div>

      <div className="container final-cta-content" style={{ position: 'relative', zIndex: 1 }}>
        <h2 className="final-cta-title" style={{ marginTop: '2rem' }}>
          여러 지점의 복잡한 운영,<br />통제 가능한 시스템으로 교체할 시점입니다.
        </h2>
        <p className="final-cta-sub">
          더 이상 단일 기능 도구에 엔터프라이즈의 확장을 맡기지 마세요.<br />
          본사 중심의 완벽한 관리 체계를 체험해보십시오.
        </p>

        <div className="final-cta-btn-group mb-6 reveal delay-200">
          <button
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '1.1rem 2.25rem' }}
            onClick={onOpenConsultation}
          >
            도입 상담 신청
          </button>
          <button
            className="btn"
            style={{
              fontSize: '1.1rem', padding: '1.1rem 2.25rem',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'inherit', cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; }}
            onClick={onOpenDemo}
          >
            관리자 데모 요청
          </button>
          <button
            className="btn-material-dark"
            style={{ fontSize: '1.1rem', padding: '1.1rem 2.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={onOpenModal}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            자료 받아보기
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
