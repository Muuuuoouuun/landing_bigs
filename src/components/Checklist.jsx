import React, { useState } from 'react';

const checkItems = [
  {
    id: 1,
    text: '지점별 수업 품질이 들쭉날쭉하다',
    sub: '같은 브랜드인데 지점마다 교육 수준이 다르다는 학부모 피드백이 있다.',
  },
  {
    id: 2,
    text: '본사에서 각 지점 현황을 실시간으로 파악하기 어렵다',
    sub: '출결, 수납, 상담 현황을 확인하려면 지점장에게 일일이 보고받아야 한다.',
  },
  {
    id: 3,
    text: '강사 퇴사 시 수업 자료와 학생 데이터가 함께 사라진다',
    sub: '강사 개인 기기에 교재·녹화·학생 기록이 저장되어 있어 통제가 안 된다.',
  },
  {
    id: 4,
    text: '신규 지점을 오픈할 때마다 시스템 세팅에 수주가 걸린다',
    sub: '기존 지점의 운영 체계를 복제할 수 없어 매번 처음부터 구축한다.',
  },
  {
    id: 5,
    text: '지점별로 다른 툴을 사용해 데이터 통합이 안 된다',
    sub: 'A지점은 엑셀, B지점은 별도 프로그램 — 전사 리포트를 뽑을 수 없다.',
  },
  {
    id: 6,
    text: '역할별 접근 권한 관리가 되지 않는다',
    sub: '지점장·강사·본사 관리자 모두 같은 수준의 시스템 접근 권한을 갖고 있다.',
  },
];

const Checklist = () => {
  const [checked, setChecked] = useState({});

  const toggle = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const total = checkItems.length;

  const getMessage = () => {
    if (checkedCount === 0) return null;
    if (checkedCount <= 2)
      return { text: '초기 단계입니다. 지금 체계를 잡으면 확장이 수월해집니다.', color: '#e6b800' };
    if (checkedCount <= 4)
      return { text: '다지점 운영 리스크가 누적되고 있습니다. 통합 시스템 도입을 권장합니다.', color: '#ff9f43' };
    return { text: '즉시 운영 체계 정비가 필요합니다. 지금 바로 상담을 받아보세요.', color: '#ff6b6b' };
  };

  const message = getMessage();

  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #faf9f6 0%, #f5f3ee 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Diagonal line texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(11,61,43,0.015) 30px, rgba(11,61,43,0.015) 31px)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="container">
        {/* Header */}
        <div className="section-header center reveal" style={{ textAlign: 'center' }}>
          <div className="section-label">Self-Checklist</div>
          <h2 className="section-title">
            우리 학원, 이런 문제 겪고 있지 않으신가요?
          </h2>
          <p className="section-subcopy">
            해당 항목이 많을수록 통합 운영 시스템 도입이 시급합니다.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="reveal" style={{
          maxWidth: '720px',
          margin: '0 auto 3rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: 'var(--color-text-mutated)',
            }}>
              진단 결과
            </span>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: checkedCount > 4 ? '#ff6b6b' : checkedCount > 2 ? '#ff9f43' : 'var(--color-primary)',
              transition: 'color 0.3s',
            }}>
              {checkedCount} / {total}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--color-border)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(checkedCount / total) * 100}%`,
              height: '100%',
              background: checkedCount > 4
                ? 'linear-gradient(90deg, #ff9f43, #ff6b6b)'
                : checkedCount > 2
                ? 'linear-gradient(90deg, #e6b800, #ff9f43)'
                : 'linear-gradient(90deg, #0b3d2b, #165e45)',
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s',
            }} />
          </div>

          {/* Result Message */}
          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: `${message.color}12`,
              border: `1px solid ${message.color}30`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              animation: 'fadeInUp 0.3s ease forwards',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={message.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: message.color, lineHeight: '1.5' }}>
                {message.text}
              </span>
            </div>
          )}
        </div>

        {/* Checklist Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          maxWidth: '900px',
          margin: '0 auto',
        }} className="checklist-grid">
          {checkItems.map((item, i) => {
            const isChecked = !!checked[item.id];
            return (
              <div
                key={item.id}
                className="reveal"
                onClick={() => toggle(item.id)}
                style={{
                  padding: '1.5rem 1.5rem 1.5rem 1.25rem',
                  borderRadius: '14px',
                  border: `1.5px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: isChecked ? 'rgba(11, 61, 43, 0.04)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  animationDelay: `${i * 0.06}s`,
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isChecked) {
                    e.currentTarget.style.borderColor = 'rgba(11, 61, 43, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(11, 61, 43, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isChecked) {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '7px',
                  border: `2px solid ${isChecked ? 'var(--color-primary)' : '#d0d5dd'}`,
                  backgroundColor: isChecked ? 'var(--color-primary)' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  transition: 'all 0.2s',
                }}>
                  {isChecked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: isChecked ? 'var(--color-primary)' : 'var(--color-text-main)',
                    marginBottom: '0.35rem',
                    lineHeight: '1.4',
                    transition: 'color 0.2s',
                  }}>
                    {item.text}
                  </p>
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-mutated)',
                    lineHeight: '1.55',
                    margin: 0,
                  }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Checklist;
