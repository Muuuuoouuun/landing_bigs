import React, { useMemo } from 'react';

const DataIntelligence = () => {

  // Information gathering into the center (No radial lines, just free floating text moving in)
  const gatheringParticles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 350 + Math.random() * 250; // start mostly outside the center
      const startX = 300 + Math.cos(angle) * distance;
      const startY = 300 + Math.sin(angle) * distance;
      
      const texts = ["01", "10", "DATA", "NODE", "SYNC", "11", "AI", "0x00"];
      const text = texts[Math.floor(Math.random() * texts.length)];
      
      return (
        <text
          key={`gather-${i}`}
          x="0" y="0"
          fontSize={6 + Math.random() * 6} 
          fill={Math.random() > 0.8 ? "#cc9900" : "#00df45"} 
          opacity="0"
          className="gather-particle"
          style={{
            '--startX': `${startX}px`,
            '--startY': `${startY}px`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${7 + Math.random() * 8}s` // Slower gathering speed
          }}
        >
          {text}
        </text>
      )
    });
  }, []);

  // Generate dense ASCII lines for the precise brain shape filling
  const asciiLines = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => {
      // Extremely dense 01 pattern to look like hacker terminal
      let str = "";
      for(let j = 0; j < 180; j++) str += Math.random() > 0.4 ? "0" : "1";
      return (
        <text 
          key={`ascii-${i}`} 
          x="-50" 
          y={i * 3.5} 
          fontSize="4" 
          fontFamily="monospace" 
          fill="url(#asciiGrad)" 
          className="ascii-brain-line"
          style={{ animationDelay: `${Math.random() * 6}s`, letterSpacing: '0.2px' }}
        >
          {str}
        </text>
      )
    });
  }, []);

  // Precise Brain Silhouette SVG Path
  const brainPath = "M200.7 75.3c-23-4-45-2-63.6 8.3-25.2 13.9-39.7 39.5-39.7 67.5 0 9.2 1.8 18.2 5.5 26.6-18 11.2-30.8 30.7-33.1 53.6-2.5 24.3 6.9 48.6 25 64.9 2.2 2 4.6 3.9 7 5.7-4 13.8-2.6 30 5.4 44.3 12.8 22.8 39.6 34.6 64.6 33.6 8.4 12.9 21.6 21.5 36.7 24.5 17.6 3.5 35.8-1 49.8-11.5 13.5 10 31.6 13.8 48.6 10 17.8-4 32.3-15.5 40.2-31.2 5.7.5 11.5.2 17.1-1.1 23-5.3 41-22.6 46.8-45.7 3.5-13.8 1.5-27.7-4.4-39.7 15.6-10.4 26.9-27.6 29.8-47.5 3.3-22.3-4.5-44.1-20.9-58.8 2.2-12.8.2-26.6-6.6-38.6-10.8-19.1-30.6-31-52.9-32.9-10.3-.9-20.6 1-30 5.3-16.7-18.4-40.3-29.4-65.7-30.7-22.7-1.2-44.5 7.1-59.7 23.4z";

  return (
    <section className="section bg-dark text-white reveal" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Inline styles for specialized motion */}
      <style>
        {`
          .gather-particle {
            animation: gatherMotion linear infinite;
            text-shadow: 0 0 5px currentColor;
          }
          @keyframes gatherMotion {
            0% { transform: translate(var(--startX), var(--startY)) scale(1.5); opacity: 0; filter: blur(2px); }
            20% { opacity: 0.6; filter: blur(0px); }
            80% { opacity: 0.8; }
            100% { transform: translate(300px, 300px) scale(0.2); opacity: 0; filter: blur(4px); }
          }

          .ascii-brain-line {
            animation: brainPulse 6s ease-in-out infinite alternate;
          }
          @keyframes brainPulse {
            0% { opacity: 0.2; }
            100% { opacity: 0.9; filter: drop-shadow(0 0 4px rgba(0,223,69,0.8)); }
          }

          .brain-contour {
            animation: dashMove 30s linear infinite;
          }
          .brain-contour-reverse {
            animation: dashMove 40s linear infinite reverse;
          }
          @keyframes dashMove {
            to { stroke-dashoffset: 800; }
          }
        `}
      </style>

      <div className="container grid-2" style={{ alignItems: 'center' }}>
        <div className="di-content reveal delay-100" style={{ zIndex: 2, position: 'relative' }}>
          <div className="section-label" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>DATA & INTELLIGENCE</div>
          <h2 className="section-title text-white">바람에 흩어지던 지식들,<br/>본사의 거대한 자산이 되다.</h2>
          <p className="section-subcopy" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.6' }}>
            매일 쏟아지는 수만 번의 상호작용과 수업 기록들.<br/>
            이제 강사의 로컬 PC에 머물지 않고, 클래스인 클라우드 위에서<br/>
            본사만의 견고한 교육 지식 DB로 영구히 축적됩니다.
          </p>
          <ul className="mt-4 flex-column gap-3" style={{ fontSize: '0.9rem' }}>
            <li className="flex gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}><span style={{ color: '#cc9900' }}>✦</span> 모든 판서 및 교재 데이터의 클라우드 중앙화</li>
            <li className="flex gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}><span style={{ color: '#cc9900' }}>✦</span> 학생들의 학습 패턴 정밀 분석 대시보드</li>
            <li className="flex gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}><span style={{ color: '#cc9900' }}>✦</span> 지점별 교육 퀄리티 인사이트 추출</li>
          </ul>
        </div>
        
        <div className="di-visual reveal delay-300" style={{ zIndex: 1, position: 'relative', height: '100%', minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <svg viewBox="0 0 600 600" width="100%" height="100%" className="knowledge-svg" style={{ overflow: 'visible', position: 'relative', zIndex: 3 }}>
            <defs>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              <linearGradient id="asciiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00df45" stopOpacity="0.9" />
                <stop offset="80%" stopColor="#005a1c" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00df45" stopOpacity="0.1" />
              </linearGradient>

              {/* Exact Brain Mapped Clip Path, scaled by 1.7 to make it significantly larger */}
              <clipPath id="brainClip">
                <path d={brainPath} transform="translate(-135, -135) scale(1.7)" />
              </clipPath>
            </defs>
            
            {/* Background Atmosphere - very faint pulsing core */}
            <circle cx="300" cy="300" r="160" fill="#00df45" opacity="0.03" filter="url(#heavyGlow)" className="core-pulse" />
            
            {/* Information Gathering Particles (Outer Layer) */}
            <g>
              {gatheringParticles}
            </g>

            {/* Scaled ASCII Brain */}
            <g>
              {/* ASCII Masked Content - Text that perfectly fills the larger brain shape */}
              <g clipPath="url(#brainClip)">
                {/* Background tint to give volume */}
                <path d={brainPath} transform="translate(-135, -135) scale(1.7)" fill="rgba(0, 38, 26, 0.5)" />
                {asciiLines}
              </g>

              {/* Glowing Brain Outline Details wrapping the scaled brain */}
              <path 
                d={brainPath} 
                transform="translate(-135, -135) scale(1.7)" 
                fill="none" 
                stroke="#00df45" 
                strokeWidth="2.5" 
                strokeDasharray="40 120" 
                opacity="0.8"
                filter="url(#softGlow)"
                className="brain-contour"
              />
              <path 
                d={brainPath} 
                transform="translate(-135, -135) scale(1.7)" 
                fill="none" 
                stroke="#cc9900" 
                strokeWidth="1.5" 
                strokeDasharray="10 80" 
                opacity="0.5"
                className="brain-contour-reverse"
              />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default DataIntelligence;
