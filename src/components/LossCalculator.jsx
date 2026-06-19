import React, { useState } from 'react';

// 투명한 계산 가정 (coefficients)
// 월 낭비 시간(시간) = 지점수 × 4 + 강사수 × 0.8 + 반수 × 0.3
//   - 지점당 본사 취합/대조 4시간, 강사 1명당 수기 관리 0.8시간, 반 1개당 0.3시간
// 월 누락 위험(건) = 강사수 × 0.4 + 반수 × 0.25 (출결·정산·공지 누락 추정)
const calcHours = (branches, teachers, classes) =>
  branches * 4 + teachers * 0.8 + classes * 0.3;
const calcMisses = (teachers, classes) =>
  teachers * 0.4 + classes * 0.25;

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');

const Slider = ({ label, unit, value, min, max, step, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00df45', letterSpacing: '-0.02em' }}>
          {value.toLocaleString('ko-KR')}<span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginLeft: '0.2rem' }}>{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="loss-slider"
        style={{
          width: '100%',
          background: `linear-gradient(90deg, #00df45 0%, #00df45 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );
};

const LossCalculator = () => {
  const [branches, setBranches] = useState(5);
  const [teachers, setTeachers] = useState(40);
  const [classes, setClasses] = useState(80);

  const hours = calcHours(branches, teachers, classes);
  const misses = calcMisses(teachers, classes);

  return (
    <section className="section theme-dark" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#060a0f', padding: '10rem 0' }}>
      <style>{`
        .loss-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
        }
        .loss-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid #00df45;
          box-shadow: 0 4px 12px rgba(0,223,69,0.4);
          transition: transform 0.2s ease;
        }
        .loss-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .loss-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid #00df45;
          box-shadow: 0 4px 12px rgba(0,223,69,0.4);
          cursor: pointer;
        }
        .loss-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .loss-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background ambient lighting */}
      <div style={{ position: 'absolute', top: '8%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(204,153,0,0.1) 0%, transparent 70%)', filter: 'blur(90px)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="container section-header center reveal" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ backgroundColor: 'rgba(204,153,0,0.12)', color: 'var(--color-accent)', borderColor: 'rgba(204,153,0,0.25)' }}>Hidden Cost Estimator</div>
        <h2 className="section-title" style={{ fontSize: '3rem', fontWeight: 800 }}>
          지점이 늘수록<br />
          소리 없이 <span style={{ color: 'var(--color-accent)' }}>새는 비용</span>
        </h2>
        <p className="section-subcopy" style={{ fontSize: '1.2rem' }}>
          귀원의 규모를 입력해 보세요. 수기 관리로 매달 흘려보내는<br />
          운영 시간과 누락 위험을 즉시 추정해 드립니다.
        </p>
      </div>

      <div className="container reveal delay-200" style={{ position: 'relative', zIndex: 1 }}>
        <div className="loss-layout">

          {/* Inputs */}
          <div className="glass-panel-dark" style={{ padding: '2.75rem 2.5rem', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>우리 학원 규모 입력</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2.25rem' }}>슬라이더를 움직이면 결과가 실시간으로 반영됩니다.</p>

            <Slider label="지점 수" unit="개" value={branches} min={1} max={50} step={1} onChange={setBranches} />
            <Slider label="강사 수" unit="명" value={teachers} min={5} max={500} step={5} onChange={setTeachers} />
            <Slider label="운영 반 수" unit="개" value={classes} min={10} max={1000} step={10} onChange={setClasses} />
          </div>

          {/* Results */}
          <div className="glass-panel" style={{
            padding: '2.75rem 2.5rem',
            border: '1px solid rgba(0,223,69,0.25)',
            backgroundColor: 'rgba(0,38,26,0.4)',
            boxShadow: '0 0 80px rgba(0,223,69,0.08) inset, 0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00df45, #cc9900)' }} />

            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.75rem' }}>
              수기 관리 시 월간 추정 손실
            </p>

            {/* Hours */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>월</span>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#00df45', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 30px rgba(0,223,69,0.4)' }}>
                  {fmt(hours)}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>시간 낭비</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.6rem' }}>
                지점 취합·대조, 강사·반 수기 관리에 매달 소요되는 시간
              </p>
            </div>

            {/* Misses */}
            <div style={{ paddingTop: '2rem', borderTop: '1px dashed rgba(255,255,255,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}>월</span>
                <span style={{ fontSize: '3.5rem', fontWeight: 900, color: '#e6b800', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 30px rgba(204,153,0,0.4)' }}>
                  {fmt(misses)}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>건 누락 위험</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.6rem' }}>
                출결·정산·공지 등에서 발생할 수 있는 월간 누락 추정 건수
              </p>
            </div>
          </div>
        </div>

        {/* Formula assumption note */}
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: '1.5rem', textAlign: 'center', lineHeight: '1.7' }}>
          ※ 추정 가정 — 낭비 시간 = 지점수×4h + 강사수×0.8h + 반수×0.3h · 누락 위험 = 강사수×0.4건 + 반수×0.25건.
          실제 수치는 운영 환경에 따라 달라지며, 본사 통합 관리 시 대부분 제거됩니다.
        </p>
      </div>
    </section>
  );
};

export default LossCalculator;
