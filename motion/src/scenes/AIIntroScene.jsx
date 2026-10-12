import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, SpeedLines } from '../components/Background';
import { Flash, LensStreak, Shake, Shockwave, SliceGlitch } from '../components/Fx';
import { KineticText } from '../components/Kinetic';

// Content runs 56 frames (global 380–436); the extra 8 frames are the outgoing light-wipe.
export const AI_INTRO_DURATION = 64;
// "쌓인 데이터 위에서," builds over the data core, then AI slams on the beat (global 408).
const HIT = 28;
const CORE = { x: 960, y: 500 };
const GLYPHS = ['출결', '판서', '발화', '과제', '평가', '01', '10', 'REC', 'DATA', '0x3F'];

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

/** Data streaming into a growing core — the accumulated class data the AI is built on. */
const DataCore = () => {
  const frame = useCurrentFrame();
  const build = ip(frame, [0, HIT], [0, 1], EASE.in);
  const out = ip(frame, [HIT - 1, HIT + 1], [1, 0]);
  const phase = frame / 26 + build * build * 0.9;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`rotate(${frame * 2.2} ${CORE.x} ${CORE.y})`}>
          <circle cx={CORE.x} cy={CORE.y} r={150 + build * 30} fill="none" stroke={C.green} strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="3 12" />
        </g>
        <g transform={`rotate(${-frame * 1.4} ${CORE.x} ${CORE.y})`}>
          <circle cx={CORE.x} cy={CORE.y} r={230 - build * 40} fill="none" stroke={C.greenSoft} strokeOpacity={0.25} strokeWidth={1} strokeDasharray="40 30" />
        </g>
      </svg>
      {Array.from({ length: 54 }).map((_, i) => {
        const a = random(`dc-a-${i}`) * Math.PI * 2;
        const f = (phase * (0.8 + random(`dc-s-${i}`) * 0.6) + random(`dc-p-${i}`)) % 1;
        const r = 760 * (1 - f) + 40;
        const x = CORE.x + Math.cos(a) * r * 1.25;
        const y = CORE.y + Math.sin(a) * r * 0.7;
        const o = ip(r, [40, 120, 620, 800], [0, 1, 0.8, 0]);
        const gold = random(`dc-c-${i}`) > 0.82;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${0.6 + (1 - f) * 0.8})`,
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 15,
              color: gold ? C.gold : C.greenSoft,
              opacity: o * (0.35 + build * 0.65),
              whiteSpace: 'nowrap',
              textShadow: `0 0 10px ${gold ? C.gold : C.green}`,
            }}
          >
            {GLYPHS[i % GLYPHS.length]}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: CORE.x - 180,
          top: CORE.y - 180,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,255,236,0.95) 0%, rgba(0,223,69,0.7) 16%, rgba(0,223,69,0.16) 44%, rgba(0,223,69,0) 70%)',
          transform: `scale(${0.45 + build * 0.55 + Math.sin(frame * 0.9) * 0.03})`,
          mixBlendMode: 'screen',
        }}
      />
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
      <SpeedLines progress={ip(frame, [HIT, AI_INTRO_DURATION], [0, 1], EASE.out)} opacity={ip(frame, [HIT, HIT + 3, HIT + 18], [0, 0.9, 0.35])} />
      <Dust count={30} seed="ai-dust" opacity={0.5} speed={3} />

      <Shake events={[{ at: HIT, amp: 34, dur: 16 }]}>
        <CoreRings />
        <DataCore />

        {/* bridge line: the AI is built on the data management just accumulated */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 190 }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 66, color: C.white, letterSpacing: '-0.03em' }}>
            <KineticText
              text="쌓인 데이터 위에서,"
              mode="blur"
              delay={3}
              stagger={0.8}
              duration={8}
              exitAt={HIT - 3}
              exitDuration={4}
              exitStagger={0.2}
              charColor={(i) => (i >= 3 && i <= 5 ? C.green : undefined)}
            />
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
