import React from 'react';

const MidPageCTA = ({ onOpenConsultation }) => {
  return (
    <section className="section text-center section-fade-from-dark" style={{ padding: '7rem 1.5rem', backgroundColor: 'var(--color-primary-dark)', position: 'relative', overflow: 'hidden', '--fade-from': '#060a0f' }}>
      {/* 배경 그로우 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%', height: '120%',
        background: 'radial-gradient(ellipse, rgba(22,94,69,0.25) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none',
      }}></div>
      {/* 대각선 스트라이프 패턴 */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)',
        pointerEvents: 'none', zIndex: 0,
      }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'rgba(204, 153, 0, 0.15)',
          border: '1px solid rgba(204, 153, 0, 0.3)',
          borderRadius: '9999px',
          padding: '0.35rem 0.9rem',
          fontSize: '0.78rem', fontWeight: '700',
          color: '#e6b800',
          letterSpacing: '0.06em',
          marginBottom: '1.5rem',
        }}>
          1:1 무료 컨설팅
        </div>

        <h2 className="mb-2" style={{ color: 'white', fontSize: '2.75rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
          우리 학원도 바로 적용이 가능할까요?
        </h2>
        <p className="mb-6" style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.2rem', lineHeight: '1.75' }}>
          다지점 학원 운영 전문가가 귀원의 상황에 맞는<br />
          통합 솔루션을 제안해 드립니다.
        </p>
        <button
          className="btn btn-primary"
          style={{ fontSize: '1.15rem', padding: '1.1rem 2.5rem' }}
          onClick={onOpenConsultation}
        >
          1:1 도입 컨설팅 예약
        </button>
      </div>
    </section>
  );
};

export default MidPageCTA;
