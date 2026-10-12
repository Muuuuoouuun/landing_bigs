import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridFloor } from '../components/Background';
import { Flash, LensStreak, Shockwave, rgbSplit } from '../components/Fx';
import { KineticText } from '../components/Kinetic';
import { ChapterPill } from '../components/ChapterPill';

/*
 * ④ 가치 — waste and cost fall while quality and efficiency rise.
 * Content runs 98 frames (global 506–604); the extra 10 frames are the outgoing dip to black.
 * Claims stay qualitative; the two numeric tags (1일, 0건) come from the landing page copy.
 */
export const VALUE_DURATION = 108;
const SLAM = 14; // "품질은 높이고." lands on the beat (global 520)
// Lines draw linearly so every tag lands on an 8th note of the music
// (strikes at 21/28/35/42, the crossing on the beat at 42, checks at 49/56/63/70).
const DRAW = [12, 74];

const X0 = 140;
const X1 = 1780;
const BASE_Y = 950;
const COST = `M ${X0} 540 C 700 560, 1120 880, ${X1} 905`;
const QUALITY = `M ${X0} 905 C 700 885, 1120 565, ${X1} 520`;
const COST_LEN = getLength(COST);
const QUALITY_LEN = getLength(QUALITY);

const drawAt = (frame) => ip(frame, DRAW, [0, 1], EASE.linear);
// frame at which the drawing reaches a given fraction of the line
const reach = (frac) => DRAW[0] + frac * (DRAW[1] - DRAW[0]);
const fracAt = (frame) => (frame - DRAW[0]) / (DRAW[1] - DRAW[0]);

// where the two lines cross (each line sampled once)
const CROSS = (() => {
  const N = 400;
  const cs = Array.from({ length: N + 1 }, (_, i) => getPointAtLength(COST, (COST_LEN * i) / N));
  const qs = Array.from({ length: N + 1 }, (_, i) => getPointAtLength(QUALITY, (QUALITY_LEN * i) / N));
  let best = { d: Infinity, x: 0, y: 0, frac: 0.5 };
  cs.forEach((c, i) => {
    qs.forEach((q) => {
      const d = Math.hypot(c.x - q.x, c.y - q.y);
      if (d < best.d) best = { d, x: (c.x + q.x) / 2, y: (c.y + q.y) / 2, frac: i / N };
    });
  });
  return best;
})();
const CROSS_AT = reach(CROSS.frac);

const COST_TAGS = [
  { text: '지점별 툴 중복 구독', frac: fracAt(17), above: false },
  { text: '교재 중복 제작', frac: fracAt(24), above: true },
  { text: '엑셀 수동 취합', frac: fracAt(31), above: false },
  { text: '강사 이탈 시 자료 유실', frac: fracAt(38), above: true },
].map((tg) => ({ ...tg, ...getPointAtLength(COST, COST_LEN * tg.frac), at: reach(tg.frac) }));

const QUALITY_TAGS = [
  { text: '수업 품질 균일화', frac: fracAt(46), above: false },
  { text: '전 지점 실시간 가시성', frac: fracAt(53), above: true },
  { text: '신규 지점 1일 오픈', frac: fracAt(60), above: false },
  { text: '데이터 손실 0건', frac: fracAt(67), above: true },
].map((tg) => ({ ...tg, ...getPointAtLength(QUALITY, QUALITY_LEN * tg.frac), at: reach(tg.frac) }));

const Tag = ({ tag, kind }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - tag.at;
  if (t < 0) return null;
  const pop = spring({ frame: t, fps, config: { damping: 12, stiffness: 210 } });
  const cost = kind === 'cost';
  const strike = cost ? ip(t, [4, 9], [0, 1], EASE.inOut) : 0;
  const dim = cost ? ip(t, [9, 15], [1, 0.55]) : 1;
  const check = cost ? 0 : spring({ frame: t - 3, fps, config: { damping: 9, stiffness: 240 } });
  const color = cost ? C.gold : C.green;
  const offset = 30;

  return (
    <>
      {/* pin on the line */}
      <div
        style={{
          position: 'absolute',
          left: tag.x - 7,
          top: tag.y - 7,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: '#04130b',
          border: `3px solid ${color}`,
          boxShadow: `0 0 14px ${color}`,
          transform: `scale(${pop})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: tag.x - 1,
          top: tag.above ? tag.y - offset : tag.y + 7,
          width: 2,
          height: offset - 7,
          background: color,
          opacity: 0.6 * pop,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: tag.x,
          top: tag.above ? tag.y - offset : tag.y + offset,
          transform: `translate(-50%, ${tag.above ? '-100%' : '0'}) scale(${0.6 + 0.4 * pop})`,
          transformOrigin: tag.above ? '50% 100%' : '50% 0%',
          opacity: Math.min(1, pop * 1.4) * dim,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px 10px 12px',
          borderRadius: 14,
          whiteSpace: 'nowrap',
          background: cost ? 'rgba(40,30,4,0.92)' : 'rgba(4,34,18,0.92)',
          border: `1.5px solid ${color}`,
          boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 24px ${cost ? 'rgba(230,184,0,0.18)' : 'rgba(0,223,69,0.25)'}`,
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: '-0.02em',
          color: C.white,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: cost ? (strike > 0.5 ? '#ff6b6b' : 'rgba(230,184,0,0.25)') : C.green,
            color: '#04130b',
            fontSize: 16,
            fontWeight: 900,
            transform: cost ? undefined : `scale(${check})`,
          }}
        >
          {cost ? '✕' : '✓'}
        </span>
        <span style={{ position: 'relative' }}>
          {tag.text}
          {cost && (
            <span
              style={{
                position: 'absolute',
                left: -4,
                top: '52%',
                height: 3,
                width: `calc(${strike * 100}% + 8px)`,
                background: '#ff6b6b',
                boxShadow: '0 0 8px #ff6b6b',
                borderRadius: 2,
              }}
            />
          )}
        </span>
      </div>
    </>
  );
};

const Chart = () => {
  const frame = useCurrentFrame();
  const p = drawAt(frame);
  const cost = evolvePath(p, COST);
  const quality = evolvePath(p, QUALITY);
  const costTip = getPointAtLength(COST, Math.max(0.01, COST_LEN * p));
  const qualityTip = getPointAtLength(QUALITY, Math.max(0.01, QUALITY_LEN * p));
  const axes = ip(frame, [8, 16], [0, 1], EASE.out);
  const crossed = frame >= CROSS_AT;
  const marker = ip(frame, [CROSS_AT, CROSS_AT + 8], [0, 1], EASE.out);
  const revealX = X0 + (X1 - X0) * p;
  const drawing = p > 0 && p < 1;

  return (
    <AbsoluteFill>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="val-q" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.green} stopOpacity="0.28" />
            <stop offset="1" stopColor={C.green} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="val-c" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.gold} stopOpacity="0.14" />
            <stop offset="1" stopColor={C.gold} stopOpacity="0" />
          </linearGradient>
          <clipPath id="val-reveal">
            <rect x={X0} y={0} width={revealX - X0} height={1080} />
          </clipPath>
        </defs>

        {/* axes + guides */}
        <g opacity={axes}>
          {[620, 720, 820].map((y) => (
            <line key={y} x1={X0} y1={y} x2={X0 + (X1 - X0) * axes} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}
          <line x1={X0} y1={BASE_Y} x2={X0 + (X1 - X0) * axes} y2={BASE_Y} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          <line x1={X0} y1={BASE_Y} x2={X0} y2={BASE_Y - 460 * axes} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          <text x={X1} y={BASE_Y + 34} fill={C.dim} fontSize={16} fontFamily={FONT.mono} textAnchor="end" letterSpacing="0.2em">
            운영 기간 →
          </text>
        </g>

        {/* "ClassIn 도입" marker at the crossing */}
        {crossed && (
          <g opacity={marker}>
            <line x1={CROSS.x} y1={BASE_Y} x2={CROSS.x} y2={BASE_Y - (BASE_Y - 480) * marker} stroke={C.green} strokeWidth={1.6} strokeDasharray="6 7" />
          </g>
        )}

        {/* area fills, revealed with the lines */}
        <g clipPath="url(#val-reveal)">
          <path d={`${QUALITY} L ${X1} ${BASE_Y} L ${X0} ${BASE_Y} Z`} fill="url(#val-q)" />
          <path d={`${COST} L ${X1} ${BASE_Y} L ${X0} ${BASE_Y} Z`} fill="url(#val-c)" />
        </g>

        {/* lines */}
        {[
          [COST, cost, C.gold],
          [QUALITY, quality, C.green],
        ].map(([d, ev, color]) => (
          <g key={color}>
            <path d={d} fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={14} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} style={{ filter: 'blur(6px)' }} />
            <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          </g>
        ))}

        {/* drawing tips */}
        {drawing &&
          [
            [costTip, C.gold],
            [qualityTip, C.greenSoft],
          ].map(([pt, color]) => (
            <g key={color}>
              <circle cx={pt.x} cy={pt.y} r={16} fill={color} opacity={0.3} style={{ filter: 'blur(4px)' }} />
              <circle cx={pt.x} cy={pt.y} r={7} fill="#fff" stroke={color} strokeWidth={3} />
            </g>
          ))}

        {/* crossing point */}
        {crossed && (
          <g>
            <circle cx={CROSS.x} cy={CROSS.y} r={12 + marker * 8} fill="none" stroke="#fff" strokeWidth={2} opacity={1 - marker * 0.6} />
            <circle cx={CROSS.x} cy={CROSS.y} r={8} fill="#fff" style={{ filter: `drop-shadow(0 0 12px ${C.green})` }} />
          </g>
        )}

        {/* series labels at the start, arrows at the end */}
        <g opacity={axes}>
          <text x={X0 + 18} y={512} fill={C.gold} fontSize={24} fontWeight={800} fontFamily={FONT.sans}>
            비용 · 낭비
          </text>
          <text x={X0 + 18} y={878} fill={C.green} fontSize={24} fontWeight={800} fontFamily={FONT.sans}>
            품질 · 효율
          </text>
        </g>
        {p >= 0.98 && (
          <g opacity={ip(frame, [DRAW[1] - 1, DRAW[1] + 4], [0, 1])}>
            <text x={X1 + 22} y={922} fill={C.gold} fontSize={46} fontWeight={900} fontFamily={FONT.sans}>
              ↓
            </text>
            <text x={X1 + 22} y={538} fill={C.green} fontSize={46} fontWeight={900} fontFamily={FONT.sans}>
              ↑
            </text>
          </g>
        )}
      </svg>

      {crossed && (
        <div
          style={{
            position: 'absolute',
            left: CROSS.x,
            top: 456,
            transform: `translate(-50%, -100%) scale(${0.7 + 0.3 * marker})`,
            opacity: marker,
            padding: '8px 18px',
            borderRadius: 999,
            background: C.green,
            color: '#04130b',
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: 22,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 30px rgba(0,223,69,0.55)`,
          }}
        >
          ClassIn 도입
        </div>
      )}

      {COST_TAGS.map((tg) => (
        <Tag key={tg.text} tag={tg} kind="cost" />
      ))}
      {QUALITY_TAGS.map((tg) => (
        <Tag key={tg.text} tag={tg} kind="quality" />
      ))}
    </AbsoluteFill>
  );
};

export const ValueScene = () => {
  const frame = useCurrentFrame();
  const push = ip(frame, [0, VALUE_DURATION], [1, 1.025], EASE.smooth);
  const split = ip(frame, [SLAM, SLAM + 12], [14, 0], EASE.out) * (frame >= SLAM ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={58} glowY={62} glow={0.14} />
      <GridFloor opacity={0.3} speed={5} top={60} />
      <Dust count={24} seed="value-dust" opacity={0.35} speed={1.2} />

      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Chart />

        <div style={{ position: 'absolute', left: 140, top: 160, width: 900 }}>
          <ChapterPill index="04" label="가치" delay={2} />
          <div style={{ fontFamily: FONT.sans, fontSize: 112, lineHeight: 1.1, letterSpacing: '-0.05em', color: C.white }}>
            <div style={{ fontWeight: 800 }}>
              <KineticText text="비용은 줄이고," mode="rise" delay={4} stagger={1.3} duration={12} charColor={(i) => (i >= 4 && i <= 6 ? C.gold : undefined)} />
            </div>
            <div style={{ fontWeight: 900, textShadow: rgbSplit(split) }}>
              <KineticText text="품질은 높이고." mode="slam" delay={SLAM} stagger={1.2} charColor={(i) => (i >= 4 && i <= 6 ? C.green : undefined)} />
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', right: 140, top: 196, textAlign: 'right' }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 19, letterSpacing: '0.3em', color: C.green, marginBottom: 14 }}>
            <KineticText text="LESS WASTE · MORE QUALITY" mode="scramble" delay={18} stagger={0.4} duration={10} />
          </div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 38, lineHeight: 1.35, color: C.mute, letterSpacing: '-0.03em' }}>
            <KineticText text="관리는 AI가," mode="blur" delay={56} stagger={0.8} duration={10} charColor={(i) => (i >= 4 && i <= 5 ? C.green : undefined)} />
            <br />
            <KineticText text="본사는 결정만." mode="blur" delay={62} stagger={0.8} duration={10} charColor={(i) => (i >= 4 ? C.white : undefined)} />
          </div>
        </div>
      </AbsoluteFill>

      <Flash at={SLAM} duration={4} peak={0.12} color={C.greenSoft} />
      <Flash at={Math.round(CROSS_AT)} duration={6} peak={0.22} color={C.greenSoft} />
      <Shockwave at={Math.round(CROSS_AT)} x={CROSS.x} y={CROSS.y} maxR={520} dur={18} rings={2} />
      <LensStreak at={Math.round(CROSS_AT)} y={CROSS.y} dur={14} />
    </AbsoluteFill>
  );
};
