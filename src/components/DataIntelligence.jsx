import React, { useMemo } from 'react';

const DataIntelligence = () => {

  // Information gathering into the center
  const gatheringParticles = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 250 + Math.random() * 250; 
      const startX = 300 + Math.cos(angle) * distance;
      const startY = 300 + Math.sin(angle) * distance;
      
      const texts = ["01", "10", "DATA", "NODE", "SYNC", "11", "AI", "0x00"];
      const text = texts[Math.floor(Math.random() * texts.length)];
      
      return (
        <text
          key={`gather-${i}`}
          x="0" y="0"
          fontSize={6 + Math.random() * 8} 
          fill={Math.random() > 0.8 ? "#cc9900" : "#00df45"} 
          opacity="0"
          className="gather-particle"
          style={{
            '--startX': `${startX}px`,
            '--startY': `${startY}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${7 + Math.random() * 8}s` 
          }}
        >
          {text}
        </text>
      )
    });
  }, []);

  return (
    <section className="section bg-dark text-white reveal" style={{ 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#030806', // 딥 다크 포레스트 블랙
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      padding: '8rem 0'
    }}>
      {/* Background Image Container - Right Aligned to prevent stretching/blurring */}
      <div style={{
        position: 'absolute',
        top: 0, 
        right: '-5%', // Overflow slightly to right
        width: '65%', // Limit width so it doesn't stretch across ultrawide monitors
        height: '100%',
        backgroundImage: 'url("/bg-data-intelligence.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center left',
        backgroundRepeat: 'no-repeat',
        opacity: 0.75, // Soft blend
        zIndex: 0,
        mixBlendMode: 'screen'
      }} />

      {/* Smooth Gradient Overlay to blend from pure background color into the image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(90deg, #030806 0%, #030806 35%, rgba(3,8,6,0.6) 65%, rgba(3,8,6,0) 100%)',
        zIndex: 1
      }} />

      {/* Dark fade on top and bottom to seamlessly merge with other sections */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '150px',
        background: 'linear-gradient(180deg, #030806 0%, rgba(3,8,6,0) 100%)',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, width: '100%', height: '150px',
        background: 'linear-gradient(0deg, #030806 0%, rgba(3,8,6,0) 100%)',
        zIndex: 1
      }} />

      {/* Inline styles for specialized motion */}
      <style>
        {`
          .gather-particle {
            animation: gatherMotion linear infinite;
            text-shadow: 0 0 5px currentColor;
          }
          @keyframes gatherMotion {
            0% { transform: translate(var(--startX), var(--startY)) scale(1.5); opacity: 0; filter: blur(3px); }
            20% { opacity: 0.8; filter: blur(0px); }
            80% { opacity: 0.8; filter: blur(0px); }
            100% { transform: translate(300px, 300px) scale(0.2); opacity: 0; filter: blur(4px); }
          }
        `}
      </style>

      <div className="container grid-2" style={{ alignItems: 'center', position: 'relative', zIndex: 10 }}>
        
        {/* Left Content Column */}
        <div className="di-content reveal delay-100" style={{ paddingRight: '2rem' }}>
          <div className="section-label" style={{ 
            backgroundColor: 'rgba(0,223,69,0.1)', 
            color: '#00df45', 
            border: '1px solid rgba(0,223,69,0.2)',
            backdropFilter: 'blur(8px)',
            marginBottom: '1.5rem',
            padding: '0.4rem 1rem',
            display: 'inline-block'
          }}>
            DATA & INTELLIGENCE
          </div>
          
          <h2 className="section-title text-white" style={{ fontSize: '2.75rem', lineHeight: '1.25', fontWeight: '800' }}>
            바람에 흩어지던 지식들,<br/>
            본사의 <span style={{ color: '#00df45' }}>거대한 자산</span>이 되다.
          </h2>
          
          <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: '1.6', marginTop: '1.5rem', fontWeight: 500 }}>
            매일 쏟아지는 수만 번의 상호작용과 수업 기록들.<br/>
            이제 강사의 로컬 PC에 머물지 않고, 클래스인 클라우드 위에서<br/>
            본사만의 견고한 교육 지식 DB로 영구히 축적됩니다.
          </p>
          
          <ul className="mt-4 flex-column gap-3" style={{ fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem' }}>
            <li className="flex gap-2 align-items-center" style={{ color: 'white', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#00df45', fontSize: '1.2rem', flexShrink: 0 }}>✦</span> 
              <span>모든 판서 및 교재 데이터의 클라우드 중앙화</span>
            </li>
            <li className="flex gap-2 align-items-center" style={{ color: 'white', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#00df45', fontSize: '1.2rem', flexShrink: 0 }}>✦</span> 
              <span>학생들의 학습 패턴 정밀 분석 대시보드</span>
            </li>
            <li className="flex gap-2 align-items-center" style={{ color: 'white', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#00df45', fontSize: '1.2rem', flexShrink: 0 }}>✦</span> 
              <span>지점별 교육 퀄리티 인사이트 실시간 추출</span>
            </li>
          </ul>
        </div>
        
        {/* Right Visual Overlay Column */}
        <div className="di-visual reveal delay-300" style={{ position: 'relative', height: '100%', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Subtle glowing center to emphasize the brain's core */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '200px', height: '200px', background: 'rgba(0,223,69,0.15)',
            filter: 'blur(50px)', borderRadius: '50%', zIndex: 1
          }} />

          {/* Flowing Data Particles SVG right over the image's brain center */}
          <svg viewBox="0 0 600 600" width="100%" height="100%" style={{ overflow: 'visible', position: 'relative', zIndex: 3 }}>
            <g>
              {gatheringParticles}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default DataIntelligence;
