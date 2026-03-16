import React from 'react';
import dashboardUi from '../assets/hero_dashboard_ui.png';

const topStats = [
  { value: '1,000+', label: '전국 지점 모니터링' },
  { value: '0.3초', label: '평균 데이터 응답 속도' },
  { value: '100%', label: '수업 데이터 보존율' },
];

const points = [
  {
    num: '01',
    badge: '실시간',
    badgeColor: '#00c853',
    title: '전 지점 실시간 원격 모니터링',
    desc: '현재 열려있는 클래스 상태, 튕김, 출결 현황을 스크린 하나에서 확인. 본사는 지점 원장에게 전화할 필요 없이 모든 상황을 통제합니다.',
  },
  {
    num: '02',
    badge: '수 초 내',
    badgeColor: '#e6b800',
    title: '지점 및 강사 퍼포먼스 리포트',
    desc: '강사별, 지점별 통계 데이터를 바탕으로 운영 효율성을 비교 분석. 어떤 반의 학생 참여도가 가장 높은지 직관적으로 비교합니다.',
  },
  {
    num: '03',
    badge: '영구 보관',
    badgeColor: '#00c853',
    title: '데이터 본사 중앙 통제 자산화',
    desc: '강사 개인의 화상 툴이 아닌, 본사 시스템 내에 모든 수업 자료 재생산 및 보관. 강사가 이탈해도 수업 자산은 고스란히 남습니다.',
  },
];

const AdminVisibility = () => {
  return (
    <section className="section bg-light reveal" id="features" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />

      <div className="container section-header center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label">Admin Dashboard</div>
        <h2 className="section-title">현장에 묻지 마세요.<br />본사 대시보드에서 완벽한 가시성을 확보하십시오.</h2>
        <p className="section-subcopy">
          여러 지점, 복수 강사 환경에서도 시스템 접속 한 번으로<br />실시간 운영 현황을 파악하고 제어할 수 있습니다.
        </p>
      </div>

      {/* Top Stats Bar */}
      <div className="container reveal" style={{ marginBottom: '4rem' }}>
        <div className="admin-stats-bar" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem',
        }}>
          {topStats.map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '1.5rem',
              background: 'white', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 12px rgba(11,61,43,0.05)',
            }}>
              <div style={{
                fontSize: '2rem', fontWeight: '900',
                background: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                marginBottom: '0.25rem',
              }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-mutated)', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky layout */}
      <div className="container admin-sticky-container">
        {/* Dashboard sticky */}
        <div className="admin-mockup-sticky reveal delay-200">
          <div className="hero-dashboard-wrapper glass-panel-dark" style={{
            transform: 'none', minHeight: 'auto', padding: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(0,200,83,0.15), var(--shadow-xl)',
          }}>
            <img src={dashboardUi} alt="Admin Dashboard" style={{ width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 'inherit' }} />
          </div>
        </div>

        {/* Scroll content */}
        <div className="admin-scroll-content">
          {points.map((p, i) => (
            <div key={i} className="visibility-point" style={{ borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>{p.num}. {p.title}</h3>
                <span style={{
                  padding: '0.2rem 0.7rem', borderRadius: '999px',
                  fontSize: '0.72rem', fontWeight: '700',
                  background: `${p.badgeColor}18`,
                  color: p.badgeColor,
                  border: `1px solid ${p.badgeColor}44`,
                  whiteSpace: 'nowrap',
                }}>{p.badge}</span>
              </div>
              <p className="section-subcopy">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminVisibility;
