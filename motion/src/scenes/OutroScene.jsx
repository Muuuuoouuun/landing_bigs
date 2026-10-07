import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridFloor, SpeedLines } from '../components/Background';
import { Flash, LensStreak } from '../components/Fx';
import { KineticText } from '../components/Kinetic';

export const OUTRO_DURATION = 60;
const LOGO_W = 820;
const LOGO_H = Math.round((LOGO_W * 469) / 1800);
const LOGO_TOP = 300;

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = ip(frame, [4, 18], [0, 1], EASE.inOut);
  const logoScale = ip(frame, [4, OUTRO_DURATION], [1.12, 1], EASE.out);
  const sweep = ip(frame, [14, 34], [-30, 130], EASE.smooth);
  const glow = ip(frame, [16, 22, 40], [0, 1, 0.55]);
  const cta = spring({ frame: frame - 32, fps, config: { damping: 13, stiffness: 170 } });
  const converge = ip(frame, [0, 14], [1, 0], EASE.in);

  return (
    <AbsoluteFill style={{ background: C.bgDeep, overflow: 'hidden' }}>
      <BaseBackground glowY={40} glow={0.12 + glow * 0.12} />
      <GridFloor opacity={0.25} speed={2} top={62} />
      <Dust count={40} seed="outro-dust" opacity={0.55} speed={0.6} />
      <SpeedLines cy={LOGO_TOP + LOGO_H / 2} progress={converge} opacity={converge} seed="outro-sl" />

      {/* logo with wipe reveal + specular sweep (glow on the outer layer so clip-path never crops it) */}
      <div
        style={{
          position: 'absolute',
          left: 960 - LOGO_W / 2,
          top: LOGO_TOP,
          width: LOGO_W,
          height: LOGO_H,
          transform: `scale(${logoScale})`,
          filter: `drop-shadow(0 0 ${24 + glow * 36}px rgba(4,188,9,${0.2 + glow * 0.35}))`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(-10% ${(1 - reveal) * 100}% -10% 0)` }}>
          <Img src={staticFile('classin-logo.png')} style={{ width: LOGO_W, height: LOGO_H, borderRadius: 0 }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${sweep - 14}%, rgba(255,255,255,0.95) ${sweep}%, transparent ${sweep + 14}%)`,
              WebkitMaskImage: `url(${staticFile('classin-logo-white.png')})`,
              maskImage: `url(${staticFile('classin-logo-white.png')})`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              mixBlendMode: 'screen',
            }}
          />
        </div>
        {/* leading edge of the wipe */}
        {reveal > 0 && reveal < 1 && (
          <div
            style={{
              position: 'absolute',
              top: -40,
              bottom: -40,
              left: `${reveal * 100}%`,
              width: 4,
              background: '#fff',
              boxShadow: `0 0 30px 8px ${C.green}`,
            }}
          />
        )}
      </div>

      <AbsoluteFill style={{ alignItems: 'center', top: LOGO_TOP + LOGO_H + 70 }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 64, color: C.white, letterSpacing: '-0.035em' }}>
          <KineticText text="모든 지점을, 하나의 기준으로." mode="rise" delay={16} stagger={1.1} duration={14} charColor={(i) => (i >= 8 && i <= 13 ? C.green : undefined)} />
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 21,
            color: C.mute,
            marginTop: 26,
            letterSpacing: `${ip(frame, [24, OUTRO_DURATION], [0.18, 0.34])}em`,
          }}
        >
          <KineticText text="CLASSIN ENTERPRISE · AI EDUCATION OPERATING SYSTEM" mode="blur" delay={24} stagger={0.35} duration={10} />
        </div>
        <div
          style={{
            marginTop: 40,
            padding: '16px 34px',
            borderRadius: 999,
            border: `1.5px solid ${C.green}`,
            background: 'rgba(0,223,69,0.1)',
            color: C.white,
            fontFamily: FONT.sans,
            fontWeight: 700,
            fontSize: 26,
            transform: `scale(${cta})`,
            opacity: Math.min(1, cta * 1.4),
            boxShadow: `0 0 ${30 * cta}px rgba(0,223,69,0.35)`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          도입 상담 · 데모 신청
          <span style={{ color: C.green, fontSize: 28 }}>→</span>
        </div>
      </AbsoluteFill>

      <LensStreak at={16} y={LOGO_TOP + LOGO_H / 2} dur={22} width={1900} />
      <Flash at={17} duration={8} peak={0.15} color={C.greenSoft} />
    </AbsoluteFill>
  );
};
