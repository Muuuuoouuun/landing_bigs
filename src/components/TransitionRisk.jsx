import React from 'react';

const pillars = [
  {
    num: '01',
    title: '기존 데이터 마이그레이션 대행',
    desc: '엑셀, 카톡 단톡방, 타 LMS에 흩어진 원생 DB와 수업 기록을 클래스인이 직접 추출·정제·이관합니다. 원장님은 손 하나 대지 않으셔도 됩니다.',
    points: ['엑셀 / 카톡 / 타 LMS 데이터 이관 지원', '원생·강사·반 정보 정합성 검증', '이관 누락 0건 보장 체크리스트'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    num: '02',
    title: '강사 단체 온보딩 교육',
    desc: '수백 명 규모의 강사진도 직급별 맞춤 세미나로 일괄 교육합니다. "새 시스템 못 쓰겠다"는 현장 저항을 도입 첫 주에 해소합니다.',
    points: ['수백 명 강사 일괄 단체 교육 진행', '원장 / 강사 / 조교 직급별 커리큘럼', '교육 영상·매뉴얼 영구 제공'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    num: '03',
    title: '지점 단계적 롤아웃',
    desc: '한 번에 전 지점을 갈아엎지 않습니다. 한 지점 파일럿으로 안정성을 검증한 뒤, 검증된 운영안을 전 지점으로 확대하는 단계적 타임라인을 설계합니다.',
    points: ['1개 지점 파일럿 운영 → 리스크 사전 검증', '검증된 플레이북으로 전 지점 확대', '본사 일정에 맞춘 롤아웃 타임라인 합의'],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
    ),
  },
];

const TransitionRisk = () => {
  return (
    <section className="section theme-dark" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#06090e', padding: '10rem 0' }}>
      <style>{`
        .transition-card {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
        }
        .transition-card:hover {
          transform: translateY(-8px);
          border-color: rgba(0,223,69,0.35) !important;
          box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 60px rgba(0,223,69,0.08) inset;
        }
        .transition-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .transition-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background ambient lighting */}
      <div style={{ position: 'absolute', top: '5%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(22,94,69,0.16) 0%, transparent 70%)', filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(204,153,0,0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ backgroundColor: 'rgba(204,153,0,0.12)', color: 'var(--color-accent)', borderColor: 'rgba(204,153,0,0.25)' }}>Zero-Risk Transition</div>
        <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 800 }}>
          "갈아타다 실패할까봐"<br />
          그 <span style={{ color: '#00df45' }}>전환 리스크</span>를 먼저 제거합니다
        </h2>
        <p className="section-subcopy" style={{ fontSize: '1.2rem' }}>
          대형 학원이 시스템 도입을 망설이는 진짜 이유는 기능이 아니라 '전환 실패'입니다.<br />
          클래스인은 이관, 교육, 확대의 모든 단계를 전담 팀이 책임지고 함께합니다.
        </p>
      </div>

      <div className="container transition-grid reveal delay-200" style={{ position: 'relative', zIndex: 1 }}>
        {pillars.map((p, i) => (
          <div
            key={i}
            className="transition-card glass-panel-dark reveal"
            style={{
              animationDelay: `${i * 0.12}s`,
              padding: '2.75rem 2.25rem',
              border: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00df45, rgba(0,223,69,0.1))' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(0,223,69,0.1)',
                border: '1px solid rgba(0,223,69,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00df45',
                boxShadow: '0 8px 24px rgba(0,223,69,0.12), inset 0 0 20px rgba(0,223,69,0.08)',
              }}>
                {p.icon}
              </div>
              <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em', lineHeight: 1 }}>{p.num}</span>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.9rem', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{p.title}</h3>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.75', marginBottom: '1.75rem' }}>{p.desc}</p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: 'auto' }}>
              {p.points.map((pt, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.92rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                    background: 'rgba(0,223,69,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#00df45',
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Reassurance footer note */}
      <div className="container reveal delay-300" style={{ position: 'relative', zIndex: 1, marginTop: '3rem' }}>
        <div style={{
          padding: '1.5rem 2rem',
          background: 'rgba(0,223,69,0.05)',
          border: '1px solid rgba(0,223,69,0.18)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', textAlign: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00df45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.6' }}>
            전환 전 과정은 <strong style={{ color: '#00df45' }}>전담 CSM이 1:1로 동행</strong>합니다. 도입 실패 시 책임지는 파트너십을 약속드립니다.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransitionRisk;
