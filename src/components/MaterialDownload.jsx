import React, { useState } from 'react';

const materials = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: '다지점 운영 전략 가이드',
    desc: '2~50개 지점 규모별 운영 체계 수립 전략과 본사 통제력 확보 방법론',
    tag: 'PDF · 32p',
    fileName: 'ClassIn_다지점운영전략가이드.pdf',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: '클래스인 기능 소개서',
    desc: '엔터프라이즈 핵심 기능 데모 화면과 실제 활용 시나리오 상세 안내',
    tag: 'PDF · 28p',
    fileName: 'ClassIn_기능소개서.pdf',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: '도입 성공 사례집',
    desc: '입시학원·어학원·프랜차이즈 등 업종별 도입 사례와 정량적 성과 분석',
    tag: 'PDF · 18p',
    fileName: 'ClassIn_도입성공사례집.pdf',
  },
];

const MaterialDownload = ({ onOpenModal }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleDownload = (fileName) => {
    // 실제 파일 경로로 교체 필요 — 현재는 placeholder
    const link = document.createElement('a');
    link.href = `/downloads/${fileName}`;
    link.download = fileName;
    link.click();
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError('올바른 이메일 형식을 입력해주세요.'); return; }
    setEmailError('');
    setSubscribed(true);
  };

  return (
    <section
      className="section"
      style={{
        backgroundColor: 'var(--color-primary-dark)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '70%', height: '140%',
        background: 'radial-gradient(ellipse, rgba(22,94,69,0.3) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(204,153,0,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Gold gradient overlay + dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(145deg, rgba(204,153,0,0.04) 0%, transparent 40%, rgba(22,94,69,0.04) 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(204,153,0,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="section-header center reveal" style={{ textAlign: 'center' }}>
          <div
            className="section-label"
            style={{
              backgroundColor: 'rgba(204,153,0,0.15)',
              color: 'var(--color-accent)',
              borderColor: 'rgba(204,153,0,0.3)',
            }}
          >
            Free Download
          </div>
          <h2 className="section-title" style={{ color: 'white' }}>
            도입 검토에 필요한 자료,<br />무료로 받아보세요
          </h2>
          <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.65)' }}>
            내부 보고와 의사결정에 바로 활용할 수 있는 핵심 자료를 보내드립니다.
          </p>
        </div>

        {/* Material Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          maxWidth: '960px',
          margin: '0 auto 3rem',
        }} className="material-grid">
          {materials.map((m, i) => (
            <div
              key={i}
              className="reveal"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '2rem 1.75rem',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                animationDelay: `${i * 0.1}s`,
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(204,153,0,0.2) 0%, rgba(204,153,0,0.08) 100%)',
                border: '1px solid rgba(204,153,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-accent)',
                marginBottom: '1.25rem',
              }}>
                {m.icon}
              </div>

              {/* Tag */}
              <span style={{
                display: 'inline-block',
                fontSize: '0.72rem', fontWeight: '700',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.06em',
                marginBottom: '0.625rem',
                textTransform: 'uppercase',
              }}>
                {m.tag}
              </span>

              {/* Title */}
              <h3 style={{
                fontSize: '1.15rem', fontWeight: '700',
                color: 'white',
                marginBottom: '0.625rem', lineHeight: '1.35',
              }}>
                {m.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: '1.6',
                margin: 0,
                flex: 1,
              }}>
                {m.desc}
              </p>

              {/* Individual download button */}
              <button
                onClick={() => handleDownload(m.fileName)}
                style={{
                  marginTop: '1.25rem',
                  width: '100%',
                  padding: '0.65rem 1rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'var(--color-accent-light, #e6b800)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(204,153,0,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(204,153,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                무료 다운로드
              </button>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="reveal" style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '2rem 2.5rem',
          }}>
            {!subscribed ? (
              <>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>
                  전체 자료 + 운영 인사이트 받기
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  이메일을 입력하시면 위 자료 전체와 함께<br />
                  다지점 운영 뉴스레터를 무료로 보내드립니다.
                </p>
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="email"
                    placeholder="이메일 주소 입력"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      fontSize: '0.95rem',
                      border: `1px solid ${emailError ? '#e53935' : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(0,223,69,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = emailError ? '#e53935' : 'rgba(255,255,255,0.2)'}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 16px rgba(11,61,43,0.3)',
                      transition: 'filter 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.target.style.filter = 'brightness(1.15)'; e.target.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.target.style.filter = ''; e.target.style.transform = ''; }}
                  >
                    구독하기
                  </button>
                </form>
                {emailError && (
                  <p style={{ fontSize: '0.78rem', color: '#e53935', marginTop: '0.5rem', textAlign: 'left' }}>{emailError}</p>
                )}
                <p style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  스팸 없이, 월 1~2회 운영 인사이트만 보내드립니다. 언제든 구독 해제 가능.
                </p>
              </>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0b3d2b 0%, #22c55e 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '0.5rem' }}>
                  구독이 완료되었습니다!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                  입력하신 이메일로 전체 자료와 함께<br />
                  다지점 운영 뉴스레터를 보내드리겠습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaterialDownload;
