import React, { useState, useEffect } from 'react';

const MaterialDownloadModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ name: '', phone: '', academy: '', branches: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = '이름을 입력해주세요.';
    if (!form.phone.trim()) e.phone = '연락처를 입력해주세요.';
    if (!form.academy.trim()) e.academy = '학원명을 입력해주세요.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const handleClose = () => {
    setForm({ name: '', phone: '', academy: '', branches: '' });
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: `1px solid ${hasError ? '#e53935' : '#d0d5dd'}`,
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#2b3036',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s',
  });

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(10, 14, 20, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          width: '100%', maxWidth: '480px',
          padding: '2.5rem',
          position: 'relative',
          animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid #eaecf0', backgroundColor: '#f9fafb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1.1rem', color: '#667085',
          }}
        >×</button>

        {!submitted ? (
          <>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0d1b12', lineHeight: '1.3' }}>
                클래스인 도입 자료 받아보기
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#667085', lineHeight: '1.6' }}>
                다지점 학원 운영 전략 가이드와 클래스인 기능 소개서를<br />
                무료로 보내드립니다.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem', color: '#344054' }}>
                    담당자 이름 <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="홍길동"
                    value={form.name}
                    onChange={(e) => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                    style={inputStyle(errors.name)}
                    onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                    onBlur={(e) => e.target.style.borderColor = errors.name ? '#e53935' : '#d0d5dd'}
                  />
                  {errors.name && <p style={{ fontSize: '0.8rem', color: '#e53935', marginTop: '0.25rem' }}>{errors.name}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem', color: '#344054' }}>
                    연락처 <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="tel" placeholder="010-0000-0000"
                    value={form.phone}
                    onChange={(e) => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
                    style={inputStyle(errors.phone)}
                    onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                    onBlur={(e) => e.target.style.borderColor = errors.phone ? '#e53935' : '#d0d5dd'}
                  />
                  {errors.phone && <p style={{ fontSize: '0.8rem', color: '#e53935', marginTop: '0.25rem' }}>{errors.phone}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem', color: '#344054' }}>
                    학원명 <span style={{ color: '#e53935' }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="○○학원"
                    value={form.academy}
                    onChange={(e) => { setForm(p => ({ ...p, academy: e.target.value })); setErrors(p => ({ ...p, academy: '' })); }}
                    style={inputStyle(errors.academy)}
                    onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                    onBlur={(e) => e.target.style.borderColor = errors.academy ? '#e53935' : '#d0d5dd'}
                  />
                  {errors.academy && <p style={{ fontSize: '0.8rem', color: '#e53935', marginTop: '0.25rem' }}>{errors.academy}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem', color: '#344054' }}>
                    운영 지점 수
                  </label>
                  <select
                    value={form.branches}
                    onChange={(e) => setForm(p => ({ ...p, branches: e.target.value }))}
                    style={{ ...inputStyle(false), appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', cursor: 'pointer' }}
                    onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                    onBlur={(e) => e.target.style.borderColor = '#d0d5dd'}
                  >
                    <option value="">선택해주세요 (선택)</option>
                    <option value="1-2">1~2개</option>
                    <option value="3-5">3~5개</option>
                    <option value="6-10">6~10개</option>
                    <option value="11+">11개 이상</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(11,61,43,0.3)',
                  transition: 'filter 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.target.style.filter = 'brightness(1.12)'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.target.style.filter = ''; e.target.style.transform = ''; }}
              >
                자료 무료 받기
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#98a2b3', marginTop: '0.875rem' }}>
                입력하신 정보는 자료 발송 목적으로만 사용됩니다.
              </p>
            </form>
          </>
        ) : (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', color: '#0d1b12' }}>
              신청이 완료되었습니다!
            </h2>
            <p style={{ color: '#667085', lineHeight: '1.7', marginBottom: '2rem' }}>
              담당자가 확인 후 빠른 시일 내로<br />
              입력하신 연락처로 자료를 전달드립니다.
            </p>
            <button
              onClick={handleClose}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '1rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialDownloadModal;
