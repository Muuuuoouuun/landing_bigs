import React from 'react';

const SecondaryCTA = ({ onOpenModal }) => {
  return (
    <section className="section" style={{ padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '60%', background: 'radial-gradient(ellipse at 50% 100%, rgba(11,61,43,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="container secondary-cta-wrap">

        {/* 아이콘 */}
        <div className="secondary-cta-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>

        {/* 텍스트 */}
        <div className="secondary-cta-text">
          <div className="section-label" style={{ marginBottom: '0.875rem' }}>도입 자료</div>
          <h2>우리 학원과 비슷한 사례가 있을까요?</h2>
          <p>
            다지점 입시 학원부터 프랜차이즈 어학원까지.<br />
            클래스인을 통해 본사 통제력을 확보한 성공 사례와<br />
            도입 가이드를 무료로 받아보세요.
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="secondary-cta-actions">
          <button
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 1.75rem' }}
            onClick={onOpenModal}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            자료 받아보기
          </button>
          <button
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 1.75rem' }}
          >
            도입 사례 확인하기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
};

export default SecondaryCTA;
