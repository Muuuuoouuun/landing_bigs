import React, { useState } from 'react';
import scenarioVisual from '../assets/scenario_visual.png';

const scenarios = [
  {
    tab: '시나리오 1: 표준화 배포',
    steps: [
      { title: '본사 커리큘럼 배포', desc: '새로운 학기, 본사 관리자가 커리큘럼과 필수 교재를 시스템 중앙에 업로드합니다.' },
      { title: '전 지점 신규 반 동일 세팅 반영', desc: '각 지점 원장은 설정된 세팅을 복제하여 1시간 만에 새로운 반 구조를 생성합니다.' },
      { title: '실시간 본사 모니터링', desc: '업데이트된 기준으로 전국의 반들이 오차 없이 열리고 진행되는지 본사가 한눈에 확인합니다.' },
    ],
    result: { icon: '📊', value: '1시간', label: '전 지점 표준화 세팅 완료' },
  },
  {
    tab: '시나리오 2: 대체 강사 대응',
    steps: [
      { title: '갑작스러운 강사 부재 발생', desc: '수업 2시간 전, 담당 강사가 지각하거나 피치 못할 사정으로 결근합니다.' },
      { title: '임시 권한 대체 강사 부여', desc: '본사나 지점 원장이 클릭 몇 번으로 대체 강사에게 해당 반의 일일 제어 권한을 양도합니다.' },
      { title: '기존 환경 그대로 수업 진행', desc: '대체 강사는 이전 강사가 올려둔 자료와 진도표에 그대로 접속하여 수업 공백을 최소화합니다.' },
    ],
    result: { icon: '⚡', value: '0분', label: '수업 공백 시간' },
  },
  {
    tab: '시나리오 3: 비상 개입',
    steps: [
      { title: '지점 내 수업 품질 저하 실시간 탐지', desc: '화면 상에서 특정 지점 모 반의 튕김 현상 또는 강제 종료 이력 빈도를 탐지합니다.' },
      { title: '본사 대시보드 경고 알림', desc: '해당 이슈가 본사 시스템 중앙 관제 화면에 알럿(Alert) 처리됩니다.' },
      { title: '원격 참관 및 즉시 개입', desc: '본사의 시스템 관리팀이 원격으로 세션을 조사하고 즉각적으로 기술 지원을 전개합니다.' },
    ],
    result: { icon: '🛡️', value: '4분', label: '이슈 감지 → 개입 평균 소요 시간' },
  },
];

const Scenarios = () => {
  const [activeTab, setActiveTab] = useState(0);
  const current = scenarios[activeTab];

  return (
    <section className="section bg-light reveal">
      <div className="container section-header">
        <div className="section-label">Use Cases</div>
        <h2 className="section-title">다지점 학원 현장에서 만나는<br />진짜 운영 시나리오 해결법</h2>
        <p className="section-subcopy" style={{ maxWidth: '800px' }}>
          정책 변동, 잦은 강사 교체, 커리큘럼 이탈. 복잡한 현실에서 시스템이 어떻게 작동하는지 증명합니다.
        </p>
      </div>

      <div className="container scenario-container">
        {/* Mobile select */}
        <select
          className="scenario-mobile-select"
          value={activeTab}
          onChange={e => setActiveTab(Number(e.target.value))}
        >
          {scenarios.map((s, i) => (
            <option key={i} value={i}>{s.tab}</option>
          ))}
        </select>

        <div className="scenario-tabs">
          {scenarios.map((s, i) => (
            <div
              key={i}
              className={`scenario-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {s.tab}
            </div>
          ))}
        </div>

        <div className="scenario-content">
          <div className="scenario-timeline">
            {current.steps.map((step, i) => (
              <div key={i} className="timeline-step">
                <div className="step-dot"></div>
                <div>
                  <h4 className="mb-1">{step.title}</h4>
                  <p className="card-desc">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Result stat */}
            <div style={{
              marginTop: '2rem',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(11,61,43,0.06) 0%, rgba(11,61,43,0.02) 100%)',
              border: '1px solid rgba(11,61,43,0.12)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: '1.25rem',
            }}>
              <span style={{ fontSize: '2rem' }}>{current.result.icon}</span>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary)', lineHeight: 1 }}>{current.result.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-mutated)', marginTop: '0.2rem' }}>{current.result.label}</div>
              </div>
            </div>
          </div>

          <div className="scenario-visual" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at center, rgba(11,61,43,0.05) 0%, transparent 60%)', zIndex: 0 }}></div>
            <div className="glass-panel" style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1, position: 'relative', boxShadow: 'var(--shadow-xl)' }}>
              <img src={scenarioVisual} alt="Scenario Visual" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '2rem', right: '3rem', zIndex: 2 }}>
              <div className="section-label" style={{ backgroundColor: 'var(--color-primary-dark)', color: 'white', margin: 0, boxShadow: 'var(--shadow-lg)' }}>
                Scenario {activeTab + 1} Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Scenarios;
