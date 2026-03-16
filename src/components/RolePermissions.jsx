import React from 'react';

const roles = [
  {
    num: '01',
    title: '본사 최고관리자',
    color: '#0b3d2b',
    bg: 'linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)',
    iconColor: '#165e45',
    lightBg: 'rgba(11,61,43,0.06)',
    border: 'rgba(11,61,43,0.2)',
    perms: [
      { label: '전사 통계 및 리포트 열람', ok: true },
      { label: '전 지점 관리자 권한 부여', ok: true },
      { label: '시스템 글로벌 세팅 제어', ok: true },
      { label: '커리큘럼 중앙 배포', ok: true },
      { label: '수업 직접 진행', ok: false },
    ],
    desc: '기관 전체 통계 열람, 모든 권한 부여 및 시스템 글로벌 세팅 제어.',
  },
  {
    num: '02',
    title: '지점 관리자 (원장)',
    color: '#165e45',
    bg: 'linear-gradient(135deg, #165e45 0%, #22c55e 100%)',
    iconColor: '#1e7a5a',
    lightBg: 'rgba(22,94,69,0.06)',
    border: 'rgba(22,94,69,0.2)',
    perms: [
      { label: '소속 지점 통계 열람', ok: true },
      { label: '지점 강사 배정 및 관리', ok: true },
      { label: '지점 내 반 스케줄 관리', ok: true },
      { label: '타 지점 데이터 열람', ok: false },
      { label: '글로벌 권한 설정', ok: false },
    ],
    desc: '소속 지점 내 강사 및 수업 스케줄 관리, 지점 로컬 뷰 통계 열람.',
  },
  {
    num: '03',
    title: '정규 강사',
    color: '#b07d00',
    bg: 'linear-gradient(135deg, #cc9900 0%, #facc15 100%)',
    iconColor: '#d97706',
    lightBg: 'rgba(204,153,0,0.06)',
    border: 'rgba(204,153,0,0.2)',
    perms: [
      { label: '담당 반 수업 운영', ok: true },
      { label: '수업 자료 업로드', ok: true },
      { label: '담당 반 출결 관리', ok: true },
      { label: '타 강사 반 접근', ok: false },
      { label: '지점 통계 열람', ok: false },
    ],
    desc: '할당된 본인 수업 운영, 자료 업로드, 해당 반에 대한 한정적 관리 권한.',
  },
  {
    num: '04',
    title: '보조 / 조교',
    color: '#475569',
    bg: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
    iconColor: '#64748b',
    lightBg: 'rgba(74,85,104,0.06)',
    border: 'rgba(74,85,104,0.18)',
    perms: [
      { label: '수업 내 출결 보조', ok: true },
      { label: '채점 보조 기능', ok: true },
      { label: '수업 제어 권한', ok: false },
      { label: '자료 업로드', ok: false },
      { label: '통계 열람', ok: false },
    ],
    desc: '수업 내 출결 보조, 채점 등 제한된 보조 기능만 접근 (메인 제어 불가).',
  },
];

const Icons = {
  hq: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  branch: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  teacher: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  assist: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
};

const VLine = ({ height = '30px', color = '#cbd5e1', animated = false, delay = '0s' }) => (
  <div style={{ width: '2px', height, background: color, position: 'relative', overflow: 'hidden' }}>
    {animated && <div style={{ 
      position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', 
      background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,1), transparent)',
      animation: `flowVertical 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite ${delay}`
    }} />}
  </div>
);

const OrgNode = ({ role, title, subtitle, gradient, shadowColor, compact, icon }) => (
  <div className="org-node-card-up" style={{
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    borderRadius: compact ? '16px' : '20px',
    padding: compact ? '1.25rem' : '1.5rem',
    width: compact ? '190px' : '280px',
    boxShadow: `0 10px 30px -10px ${shadowColor}, 0 0 0 1px rgba(0,0,0,0.05) inset, 0 4px 6px -4px rgba(0,0,0,0.02)`,
    display: 'flex',
    flexDirection: compact ? 'column' : 'row',
    alignItems: 'center',
    gap: compact ? '0.75rem' : '1.25rem',
    zIndex: 2,
    cursor: 'default',
    '--hover-shadow': shadowColor
  }}>
    <div className="node-icon-wrap" style={{
      width: compact ? '48px' : '52px', 
      height: compact ? '48px' : '52px', 
      borderRadius: '14px',
      background: gradient, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'white', 
      flexShrink: 0,
      boxShadow: `0 8px 16px -6px ${shadowColor}, inset 0 2px 4px rgba(255,255,255,0.2)`
    }}>
      {icon}
    </div>
    <div style={{ textAlign: compact ? 'center' : 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: compact ? 'center' : 'flex-start' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: gradient.includes('#0b3d2b') ? '#0b3d2b' : gradient.includes('#cc9900') ? '#b07d00' : gradient.includes('#475569') ? '#475569' : '#165e45', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.04)', borderRadius: '6px', letterSpacing: '0.05em' }}>RO {role}</span>
      </div>
      <h4 style={{ margin: '0.4rem 0 0.15rem', fontSize: compact ? '0.95rem' : '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: compact ? '0.75rem' : '0.85rem', fontWeight: 600, color: '#64748b' }}>{subtitle}</p>
    </div>
  </div>
);

const ModernOrgChart = () => {
  return (
    <div style={{ position: 'relative', padding: '2rem 1rem 3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      
      {/* Background Decorative Elements for Schematic feel */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(22,94,69,0.03) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(204,153,0,0.03) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="org-chart-wrapper-up" style={{ minWidth: '920px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        
        {/* Level 1: HQ */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <OrgNode 
            role="01" title="본사 최고관리자" subtitle="전사 통합 제어권" 
            gradient="linear-gradient(135deg, #0b3d2b 0%, #165e45 100%)" 
            shadowColor="rgba(11,61,43,0.3)"
            icon={Icons.hq}
          />
          {/* Animated Line down */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VLine height="40px" color="rgba(22,94,69,0.3)" animated delay="0s" />
          </div>
        </div>

        {/* Level 2 & 3: Branches */}
        <div style={{ display: 'flex', width: '100%', maxWidth: '900px', justifyContent: 'center', position: 'relative' }}>
          {/* Horizontal connecting line - animated! */}
          <div style={{ position: 'absolute', top: 0, left: '25%', width: '50%', height: '2px', background: 'rgba(22,94,69,0.2)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: '-50%', width: '200%', height: '100%', background: 'linear-gradient(to right, transparent, rgba(22,94,69,0.9), transparent)', animation: 'flowHorizontal 3s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.5s' }} />
          </div>
          
          {/* Branch A */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
             <VLine height="30px" color="rgba(22,94,69,0.2)" animated delay="0.8s" />
             <OrgNode 
               role="02" title="지점 관리자 A" subtitle="지점 로컬 제어권" 
               gradient="linear-gradient(135deg, #165e45 0%, #22c55e 100%)" 
               shadowColor="rgba(22,94,69,0.25)"
               icon={Icons.branch}
             />
             <VLine height="40px" color="rgba(204,153,0,0.3)" animated delay="1.2s" />
             
             {/* Branch A Teachers */}
             <div style={{ display: 'flex', position: 'relative', width: '100%', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: '28%', width: '44%', height: '2px', background: 'rgba(204,153,0,0.2)' }} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <VLine height="30px" color="rgba(204,153,0,0.2)" />
                   <OrgNode 
                     role="03" title="정규 강사" subtitle="운영 및 자료 관리" 
                     gradient="linear-gradient(135deg, #cc9900 0%, #facc15 100%)" 
                     shadowColor="rgba(204,153,0,0.25)"
                     compact
                     icon={Icons.teacher}
                   />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <VLine height="30px" color="rgba(74,85,104,0.2)" />
                   <OrgNode 
                     role="04" title="보조 / 조교" subtitle="출결 및 채점" 
                     gradient="linear-gradient(135deg, #475569 0%, #94a3b8 100%)" 
                     shadowColor="rgba(74,85,104,0.2)"
                     compact
                     icon={Icons.assist}
                   />
                </div>
             </div>
          </div>

          {/* Branch B */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
             <VLine height="30px" color="rgba(22,94,69,0.2)" animated delay="1.1s" />
             <OrgNode 
               role="02" title="지점 관리자 B" subtitle="지점 로컬 제어권" 
               gradient="linear-gradient(135deg, #165e45 0%, #22c55e 100%)" 
               shadowColor="rgba(22,94,69,0.25)"
               icon={Icons.branch}
             />
             <VLine height="40px" color="rgba(204,153,0,0.3)" animated delay="1.5s" />
             
             {/* Branch B Teachers */}
             <div style={{ display: 'flex', position: 'relative', width: '100%', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: '28%', width: '44%', height: '2px', background: 'rgba(204,153,0,0.2)' }} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <VLine height="30px" color="rgba(204,153,0,0.2)" />
                   <OrgNode 
                     role="03" title="정규 강사" subtitle="운영 및 자료 관리" 
                     gradient="linear-gradient(135deg, #cc9900 0%, #facc15 100%)" 
                     shadowColor="rgba(204,153,0,0.25)"
                     compact
                     icon={Icons.teacher}
                   />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <VLine height="30px" color="rgba(74,85,104,0.2)" />
                   <OrgNode 
                     role="04" title="보조 / 조교" subtitle="출결 및 채점" 
                     gradient="linear-gradient(135deg, #475569 0%, #94a3b8 100%)" 
                     shadowColor="rgba(74,85,104,0.2)"
                     compact
                     icon={Icons.assist}
                   />
                </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const RolePermissions = () => {
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, #faf9f6 0%, #f2f5f3 100%)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes flowVertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes flowHorizontal {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .org-node-card-up {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        .org-node-card-up:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 24px 48px -12px var(--hover-shadow), 0 0 0 1px rgba(0,0,0,0.05) inset !important;
          z-index: 10;
        }
        .org-node-card-up:hover .node-icon-wrap {
          transform: scale(1.1) rotate(5deg);
        }
        .node-icon-wrap {
          transition: transform 0.3s ease;
        }
        .role-card-upgraded {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        .role-card-upgraded:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.1);
          border-color: rgba(0,0,0,0.05);
        }
        .role-card-upgraded::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 6px;
          background: var(--card-color);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .role-card-upgraded:hover::before {
          transform: scaleX(1);
        }
        .role-card-upgraded:hover .role-num-badge {
          transform: scale(1.1);
          box-shadow: 0 12px 24px -6px var(--card-shadow);
        }
        .role-num-badge, .role-check-icon {
          transition: all 0.3s ease;
        }
        .role-card-upgraded:hover .role-check-icon {
          transform: scale(1.15);
        }
        .role-grid-upgraded {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
        }
        @media(max-width: 1024px) {
          .role-grid-upgraded { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width: 600px) {
          .role-grid-upgraded { grid-template-columns: 1fr; }
        }
      `}</style>
      
      {/* Background accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #0b3d2b, #165e45, #cc9900, #475569)' }} />

      <div className="container section-header center reveal">
        <div className="section-label">Role-Based Access Control</div>
        <h2 className="section-title">엔터프라이즈 보안의 핵심,<br />세밀한 직급별 권한 분리 구조</h2>
        <p className="section-subcopy">
          본사 관리자, 지점 원장, 강사. 섞이면 안 되는 역할과 권한을<br />
          체계적으로 분할하여 보안과 효율을 동시에 극대화합니다.
        </p>
      </div>

      {/* Upgraded Org Chart */}
      <div className="container reveal" style={{ marginBottom: '5rem' }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-2xl)',
          padding: '0',
          boxShadow: '0 25px 50px -12px rgba(11,61,43,0.08), 0 0 0 1px rgba(0,0,0,0.02) inset',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle grid background for structural feel */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(11,61,43,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none' }} />
          
          <div style={{ padding: '3rem 2.5rem 0', position: 'relative', zIndex: 2 }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '800', color: '#0b3d2b', letterSpacing: '0.05em', margin: 0 }}>
              조직 권한 계층 아키텍처
            </h3>
            <p style={{ textAlign: 'center', fontSize: '0.95rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>ClassIn Enterprise Access Flow Diagram</p>
          </div>
          
          <div className="role-org-chart-wrap" style={{ position: 'relative', zIndex: 2 }}>
            <ModernOrgChart />
          </div>
        </div>
      </div>

      {/* Upgraded Role Cards Grid */}
      <div className="container role-grid-upgraded">
        {roles.map((role, i) => (
          <div key={i} className="role-card-upgraded reveal" style={{ 
            animationDelay: `${i * 0.1}s`, 
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem 2rem 2rem',
            '--card-color': role.color,
            '--card-shadow': role.lightBg,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div className="role-num-badge" style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: role.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '900', fontSize: '1.25rem',
                boxShadow: `0 12px 24px -6px ${role.lightBg}`
              }}>
                {role.num}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '800', color: role.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Role Level</p>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', background: 'rgba(0,0,0,0.03)', padding: '0.3rem 0.8rem', borderRadius: '20px', display: 'inline-block' }}>Access Profile</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>{role.title}</h3>
            </div>

            {/* Permission List */}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px dashed var(--color-border)', marginBottom: '1.5rem', flex: 1 }}>
              {role.perms.map((p, j) => (
                <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '1rem' }}>
                  <span className="role-check-icon" style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: p.ok ? role.color : 'rgba(239,68,68,0.1)',
                    color: p.ok ? 'white' : '#ef4444',
                    boxShadow: p.ok ? `0 6px 12px -2px ${role.lightBg}` : 'none'
                  }}>
                    {p.ok
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </span>
                  <span style={{ color: p.ok ? '#1e293b' : '#94a3b8', fontWeight: p.ok ? '600' : '400', textDecoration: p.ok ? 'none' : 'line-through' }}>{p.label}</span>
                </li>
              ))}
            </ul>

            {/* Desc */}
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
              {role.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RolePermissions;
