import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, SpeedLines } from '../components/Background';
import { Flash, LensStreak, Shake, Shockwave, SliceGlitch } from '../components/Fx';
import { KineticText } from '../components/Kinetic';

export const AI_INTRO_DURATION = 44;
const HIT = 12;

const AI_GLYPH = {
  fontFamily: FONT.sans,
  fontWeight: 900,
  fontSize: 560,
  lineHeight: 1,
  letterSpacing: '-0.06em',
};

const isVerb = (i) => (i >= 4 && i <= 5) || (i >= 8 && i <= 11) || (i >= 14 && i <= 18);

const CoreRings = () => {
  const frame = useCurrentFrame();
  const o = ip(frame, [HIT, HIT + 8], [0, 1]);
  const s = ip(frame, [HIT, HIT + 14], [0.6, 1], EASE.out);
  const ticks = Array.from({ length: 72 });
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${s})` }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`rotate(${frame * 1.6} 960 500)`}>
          <circle cx={960} cy={500} r={360} fill="none" stroke={C.green} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="2 14" />
        </g>
        <g transform={`rotate(${-frame * 0.9} 960 500)`}>
          {ticks.map((_, k) => {
            const a = (k / ticks.length) * Math.PI * 2;
            const long = k % 6 === 0;
            const r1 = 400;
            const r2 = long ? 428 : 412;
            return (
              <line
                key={k}
                x1={960 + Math.cos(a) * r1}
                y1={500 + Math.sin(a) * r1}
                x2={960 + Math.cos(a) * r2}
                y2={500 + Math.sin(a) * r2}
                stroke={long ? C.green : 'rgba(255,255,255,0.35)'}
                strokeWidth={long ? 2.5 : 1}
              />
            );
          })}
          <path d="M 960 70 A 430 430 0 0 1 1390 500" fill="none" stroke={C.greenSoft} strokeWidth={3} strokeLinecap="round" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const AIIntroScene = () => {
  const frame = useCurrentFrame();
  const slam = ip(frame, [HIT, HIT + 6], [2.4, 1], EASE.in);
  const settle = ip(frame, [HIT + 6, HIT + 12], [0.96, 1], EASE.out);
  const scale = frame < HIT + 6 ? slam : settle;
  const glitch = ip(frame, [HIT, HIT + 10], [1, 0], EASE.out) * (frame >= HIT ? 1 : 0);
  const split = ip(frame, [HIT, HIT + 14], [26, 2], EASE.out);
  const sheen = ip(frame, [HIT, AI_INTRO_DURATION], [-40, 140], EASE.smooth);

  return (
    <AbsoluteFill style={{ background: C.bgDeep, overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: ip(frame, [HIT - 2, HIT + 4], [0, 1]) }}>
        <BaseBackground glowY={46} glow={0.28} />
      </AbsoluteFill>
      <SpeedLines progress={ip(frame, [HIT, AI_INTRO_DURATION], [0, 1], EASE.out)} opacity={ip(frame, [HIT, HIT + 3, 30], [0, 0.9, 0.35])} />
      <Dust count={30} seed="ai-dust" opacity={0.5} speed={3} />

      <Shake events={[{ at: HIT, amp: 34, dur: 16 }]}>
        <CoreRings />

        {/* lead-in line */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 64, color: C.white, letterSpacing: '-0.02em' }}>
            <KineticText text="그리고 이제," mode="blur" delay={2} stagger={0.8} duration={6} exitAt={HIT - 2} exitDuration={4} exitStagger={0.2} />
          </div>
        </AbsoluteFill>

        {/* AI — the slam */}
        {frame >= HIT && (
          <SliceGlitch amount={glitch} slices={12} seed="ai">
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
              <div style={{ position: 'relative', transform: `scale(${scale})` }}>
                {/* chromatic fringe layers sit behind the gradient glyphs */}
                {[
                  ['rgba(255,40,90,0.9)', -split],
                  ['rgba(0,230,255,0.9)', split],
                ].map(([color, dx]) => (
                  <div
                    key={color}
                    style={{ ...AI_GLYPH, position: 'absolute', inset: 0, color, transform: `translateX(${dx}px)`, mixBlendMode: 'screen', opacity: ip(split, [2, 10], [0.25, 1]) }}
                  >
                    AI
                  </div>
                ))}
                <div
                  style={{
                    ...AI_GLYPH,
                    position: 'relative',
                    backgroundImage: `linear-gradient(105deg, ${C.white} 0%, ${C.white} ${sheen - 18}%, #c9ffd9 ${sheen - 6}%, ${C.green} ${sheen}%, #c9ffd9 ${sheen + 6}%, ${C.white} ${sheen + 18}%, ${C.white} 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    filter: 'drop-shadow(0 0 60px rgba(0,223,69,0.45))',
                  }}
                >
                  AI
                </div>
              </div>
            </AbsoluteFill>
          </SliceGlitch>
        )}

        {/* payoff line */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 150 }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 52, color: C.white, letterSpacing: '-0.03em' }}>
            <KineticText text="수업을 읽고, 평가하고, 관리합니다." mode="pop" delay={HIT + 7} stagger={0.7} charColor={(i) => (isVerb(i) ? C.green : undefined)} />
          </div>
        </AbsoluteFill>
      </Shake>

      <Shockwave at={HIT} y={500} maxR={1200} dur={22} rings={3} />
      <LensStreak at={HIT} y={500} dur={20} />
      <Flash at={HIT} duration={8} peak={1} />
    </AbsoluteFill>
  );
};
