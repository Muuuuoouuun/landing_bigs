import React, { useState, useEffect } from 'react';

/**
 * mode: 'consultation' | 'demo'
 */
const CONFIG = {
  consultation: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
      </svg>
    ),
    title: '1:1 도입 상담 신청',
    subtitle: '다지점 운영 전문가가 귀원의 상황에 맞는\n맞춤형 통합 솔루션을 제안해 드립니다.',
    submitLabel: '상담 신청하기',
    successTitle: '상담 신청이 완료되었습니다!',
    successDesc: '담당 컨설턴트가 영업일 기준 1일 이내로\n입력하신 연락처로 연락드립니다.',
    showMessage: true,
    messagePlaceholder: '현재 사용 중인 툴이나 궁금하신 점을 자유롭게 적어주세요.',
    messageLabel: '문의 내용',
    privacyText: '입력하신 정보는 상담 목적으로만 사용됩니다.',
  },
  demo: {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: '관리자 데모 시연 요청',
    subtitle: '클래스인 엔터프라이즈 관리자 대시보드를\n직접 체험해보실 수 있습니다.',
    submitLabel: '데모 요청하기',
    successTitle: '데모 요청이 완료되었습니다!',
    successDesc: '담당자가 확인 후 데모 일정을 안내드립니다.\n입력하신 연락처로 연락드리겠습니다.',
    showMessage: true,
    messagePlaceholder: '희망 데모 일정이나 특별히 보고 싶은 기능이 있으면 적어주세요.',
    messageLabel: '요청 사항',
    privacyText: '입력하신 정보는 데모 시연 안내 목적으로만 사용됩니다.',
  },
};

const InquiryModal = ({ isOpen, onClose, mode = 'consultation' }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', academy: '', branches: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const cfg = CONFIG[mode] || CONFIG.consultation;

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
    setForm({ name: '', phone: '', email: '', academy: '', branches: '', message: '' });
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
        className="modal-card"
        style={{
          backgroundColor: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          width: '100%', maxWidth: '480px',
          maxHeight: '90vh', overflowY: 'auto',
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
                background: mode === 'demo'
                  ? 'linear-gradient(135deg, #165e45 0%, #22c55e 100%)'
                  : 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
              }}>
                {cfg.icon}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0d1b12', lineHeight: '1.3' }}>
                {cfg.title}
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#667085', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {cfg.subtitle}
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
                    이메일
                  </label>
                  <input
                    type="email" placeholder="example@academy.com"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    style={inputStyle(false)}
                    onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                    onBlur={(e) => e.target.style.borderColor = '#d0d5dd'}
                  />
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

                {cfg.showMessage && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem', color: '#344054' }}>
                      {cfg.messageLabel}
                    </label>
                    <textarea
                      placeholder={cfg.messagePlaceholder}
                      value={form.message}
                      onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                      rows={3}
                      style={{
                        ...inputStyle(false),
                        resize: 'vertical',
                        minHeight: '80px',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0b3d2b'}
                      onBlur={(e) => e.target.style.borderColor = '#d0d5dd'}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: mode === 'demo'
                    ? 'linear-gradient(135deg, #165e45 0%, #22c55e 100%)'
                    : 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
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
                {cfg.submitLabel}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#98a2b3', marginTop: '0.875rem' }}>
                {cfg.privacyText}
              </p>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: mode === 'demo'
                ? 'linear-gradient(135deg, #165e45 0%, #22c55e 100%)'
                : 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', color: '#0d1b12' }}>
              {cfg.successTitle}
            </h2>
            <p style={{ color: '#667085', lineHeight: '1.7', marginBottom: '2rem', whiteSpace: 'pre-line' }}>
              {cfg.successDesc}
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

export default InquiryModal;
