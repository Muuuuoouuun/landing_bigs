import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, EASE, alpha, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust } from '../components/Background';
import { Flash, LensStreak } from '../components/Fx';
import { KineticText } from '../components/Kinetic';
import { ChapterPill } from '../components/ChapterPill';

/*
 * ④ 가치 — two glass cases on one floor, told in two acts that follow the music.
 * Tension: the left case is full of waste; on every 8th one block is struck out and the stack sinks
 * to its base (비용은 줄이고,). Release: ClassIn drops into the empty right case as its foundation and
 * quality blocks land on it, one per 8th, until the case is full (품질은 높이고.).
 * Content runs 98 frames (global 632–730); the extra 10 frames are the outgoing dip to white.
 * Claims stay qualitative; the two numeric items (1일, 0건) come from the landing page copy.
 */
export const VALUE_DURATION = 108;
const STRIKES = [21, 28, 35, 42]; // a waste block leaves on each 8th (global 653–674)
const TURN = 42; // the release: ClassIn lands in the right case (global 674)
const RISES = [49, 56, 63, 70]; // a quality block lands on each 8th (global 681–702)
const END = 98; // content ends; the dip to white follows

const TILE_W = 380;
const TILE_H = 72;
const SLOT = TILE_H + 10;
const PAD = 14;
const CASE_W = TILE_W + PAD * 2;
const CASE_H = TILE_H + 4 * SLOT + PAD * 2;
const FLOOR = 880;
const CASE_TOP = FLOOR - CASE_H;
const COST_X = 560;
const QUALITY_X = 1360;
const LOGO_H = 30;

const WASTE = ['지점별 툴 중복 구독', '교재 중복 제작', '엑셀 수동 취합', '강사 이탈 시 자료 유실'];
const GAINS = ['수업 품질 균일화', '전 지점 실시간 가시성', '신규 지점 1일 오픈', '데이터 손실 0건'];

// top edge of a block resting on `below` blocks (0 = the block on the case floor)
const restY = (below) => FLOOR - PAD - TILE_H - below * SLOT;

const BLOCK_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.95), 0 10px 24px rgba(31,52,96,0.08), 0 2px 6px rgba(31,52,96,0.05)';
const TONES = {
  waste: { background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF2EE 100%)', border: `1px solid ${alpha(C.coral, 0.24)}`, color: C.inkSoft, boxShadow: BLOCK_SHADOW },
  gain: { background: 'linear-gradient(180deg, #FFFFFF 0%, #ECF8F1 100%)', border: `1px solid ${alpha(C.green, 0.26)}`, color: C.ink, boxShadow: BLOCK_SHADOW },
  base: { background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F4F9 100%)', border: `1px solid ${C.line}`, color: C.mute, fontWeight: 600, justifyContent: 'center', boxShadow: BLOCK_SHADOW },
  brand: {
    background: `linear-gradient(180deg, #2DBB6A 0%, ${C.green} 55%, #178F4B 100%)`,
    border: `1px solid ${alpha(C.greenInk, 0.45)}`,
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 14px 30px ${alpha(C.green, 0.3)}, 0 2px 6px rgba(31,52,96,0.08)`,
  },
};

const Block = ({ cx, top, tone, style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: cx - TILE_W / 2,
      top,
      width: TILE_W,
      height: TILE_H,
      boxSizing: 'border-box',
      borderRadius: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 22px',
      fontFamily: FONT.sans,
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      whiteSpace: 'nowrap',
      ...TONES[tone],
      ...style,
    }}
  >
    {children}
  </div>
);

// ✕ that fills in as the block is struck (p 0→1), or ✓ that pops in as the block lands
const Mark = ({ waste, p }) => (
  <span
    style={{
      flex: '0 0 32px',
      width: 32,
      height: 32,
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 16,
      fontWeight: 900,
      background: waste ? (p > 0.5 ? C.coral : C.peach) : C.green,
      color: waste && p <= 0.5 ? C.coral : C.white,
      transform: `scale(${waste ? 1 + Math.sin(Math.PI * p) * 0.2 : p})`,
      boxShadow: waste ? undefined : `0 4px 10px ${alpha(C.green, 0.35)}`,
    }}
  >
    {waste ? '✕' : '✓'}
  </span>
);

// A block dropped into a case: falls through the open top, lands exactly on `at`, settles with a squash.
const drop = (frame, at, height) => ({
  visible: frame >= at - 6,
  y: (1 - ip(frame, [at - 6, at], [0, 1], EASE.in)) * -height,
  opacity: ip(frame, [at - 6, at - 4], [0, 1]),
  squash: frame >= at ? interpolate(frame, [at, at + 2, at + 6], [0.93, 1.02, 1], { extrapolateRight: 'clamp' }) : 1,
});

/* Frosted glass vessel, open at the top: body and floor shadow sit behind the blocks, the glass in front. */
const CaseBack = ({ cx, tint }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: cx - CASE_W / 2 - 34,
        width: CASE_W + 68,
        top: FLOOR - 12,
        height: 26,
        borderRadius: '50%',
        background: 'rgba(31,52,96,0.12)',
        filter: 'blur(12px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: cx - CASE_W / 2,
        top: CASE_TOP,
        width: CASE_W,
        height: CASE_H,
        borderRadius: '4px 4px 30px 30px',
        background: `linear-gradient(180deg, rgba(${tint},0) 0%, rgba(${tint},0.12) 45%, rgba(${tint},0.26) 100%)`,
      }}
    />
  </>
);

const CaseFront = ({ cx, id, rim = 0 }) => {
  const x0 = cx - CASE_W / 2;
  const x1 = cx + CASE_W / 2;
  const r = 30;
  const wall = (inset) =>
    `M ${x0 + inset} ${CASE_TOP} L ${x0 + inset} ${FLOOR - r} Q ${x0 + inset} ${FLOOR - inset} ${x0 + r} ${FLOOR - inset} ` +
    `L ${x1 - r} ${FLOOR - inset} Q ${x1 - inset} ${FLOOR - inset} ${x1 - inset} ${FLOOR - r} L ${x1 - inset} ${CASE_TOP}`;
  return (
    <>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`case-${id}`} x1="0" y1={CASE_TOP} x2="0" y2={FLOOR} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.ink} stopOpacity="0" />
            <stop offset="0.3" stopColor={C.ink} stopOpacity="0.12" />
            <stop offset="1" stopColor={C.ink} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d={wall(0)} fill="none" stroke={`url(#case-${id})`} strokeWidth={1.5} />
        <path d={wall(3)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2} />
        {rim > 0 && (
          <g opacity={rim}>
            <path d={wall(0)} fill="none" stroke={C.gold} strokeOpacity={0.5} strokeWidth={8} style={{ filter: 'blur(6px)' }} />
            <path d={wall(0)} fill="none" stroke={C.gold} strokeWidth={2} />
          </g>
        )}
      </svg>
      {/* specular strip down the left wall */}
      <div
        style={{
          position: 'absolute',
          left: x0 + 9,
          top: CASE_TOP + CASE_H * 0.14,
          width: 9,
          height: CASE_H * 0.7,
          borderRadius: 5,
          background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.75) 45%, rgba(255,255,255,0))',
        }}
      />
    </>
  );
};

/* Dimension mark beside a case: a tick at the starting level, a line to the current level, an arrowhead. */
const Measure = ({ x, from, to, color, opacity }) => {
  if (Math.abs(to - from) < 3 || opacity <= 0) return null;
  const dir = to > from ? 1 : -1;
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity }}>
      <line x1={x - 10} x2={x + 10} y1={from} y2={from} stroke={color} strokeWidth={2} strokeOpacity={0.55} />
      <line x1={x} x2={x} y1={from} y2={to} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${x - 9} ${to - 12 * dir} L ${x} ${to} L ${x + 9} ${to - 12 * dir}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* Left case: full of waste, emptied one block per 8th — each struck block lifts out and the stack sinks. */
const CostCase = () => {
  const frame = useCurrentFrame();
  const closed = STRIKES.map((s) => ip(frame, [s + 3, s + 8], [0, 1], EASE.inOut));
  const left = 4 - closed.reduce((a, c) => a + c, 0);
  const shown = ip(frame, [STRIKES[0], STRIKES[0] + 5], [0, 1]);

  return (
    <>
      <CaseBack cx={COST_X} tint="255,214,200" />
      {/* where the stack used to reach */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: shown }}>
        <line x1={COST_X - CASE_W / 2 - 24} x2={COST_X + CASE_W / 2 - 6} y1={restY(4) - 1} y2={restY(4) - 1} stroke={C.coral} strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="6 7" />
      </svg>
      <Block cx={COST_X} top={restY(0)} tone="base">
        필수 운영비
      </Block>
      {WASTE.map((label, j) => {
        const s = STRIKES[j];
        const struck = ip(frame, [s, s + 4], [0, 1], EASE.inOut);
        const out = ip(frame, [s + 2, s + 7], [0, 1], EASE.in);
        if (out >= 1) return null;
        const below = 1 + closed.slice(0, j).reduce((a, c) => a + (1 - c), 0);
        return (
          <Block
            key={label}
            cx={COST_X}
            top={restY(below)}
            tone="waste"
            style={{ opacity: 1 - out, transform: `translateY(${-out * 14}px) scale(${1 + out * 0.05})`, filter: out > 0.02 ? `blur(${out * 6}px)` : undefined }}
          >
            <Mark waste p={struck} />
            <span style={{ position: 'relative', opacity: 1 - struck * 0.35 }}>
              {label}
              {struck > 0 && <span style={{ position: 'absolute', left: -4, top: '54%', height: 3, borderRadius: 2, width: `calc(${struck * 100}% + ${struck * 8}px)`, background: C.coral }} />}
            </span>
          </Block>
        );
      })}
      <CaseFront cx={COST_X} id="cost" />
      <Measure x={COST_X - CASE_W / 2 - 36} from={restY(4)} to={restY(left)} color={C.coral} opacity={shown} />
    </>
  );
};

/* Right case: empty until the release, then ClassIn lands as the foundation and quality stacks on it. */
const QualityCase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = drop(frame, TURN, 230);
  const sweep = ip(frame, [TURN + 1, TURN + 15], [-30, 130], EASE.smooth);
  const landed = RISES.reduce((a, at) => a + ip(frame, [at - 1, at + 2], [0, 1]), 0);
  const sheen = ip(frame, [RISES[3] + 3, RISES[3] + 21], [-20, 120], EASE.smooth);
  const awake = ip(frame, [TURN - 6, TURN], [0.55, 1]);
  const rim = ip(frame, [RISES[3] + 2, RISES[3] + 14], [0, 1]);

  return (
    <>
      <div style={{ opacity: awake }}>
        <CaseBack cx={QUALITY_X} tint="190,233,210" />
      </div>
      {/* the empty slot waiting for its foundation */}
      <div
        style={{
          position: 'absolute',
          left: QUALITY_X - TILE_W / 2,
          top: restY(0),
          width: TILE_W,
          height: TILE_H,
          boxSizing: 'border-box',
          borderRadius: 18,
          border: `1.5px dashed ${alpha(C.green, 0.4)}`,
          opacity: ip(frame, [TURN - 3, TURN], [1, 0]),
        }}
      />
      {base.visible && (
        <Block cx={QUALITY_X} top={restY(0) + base.y} tone="brand" style={{ opacity: base.opacity, transform: `scaleY(${base.squash})`, transformOrigin: '50% 100%' }}>
          <Img src={staticFile('classin-logo-white.png')} style={{ height: LOGO_H, width: (LOGO_H * 1800) / 469 }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sweep - 14}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 14}%)` }} />
        </Block>
      )}
      {GAINS.map((label, g) => {
        const d = drop(frame, RISES[g], 110);
        if (!d.visible) return null;
        const pop = spring({ frame: frame - RISES[g], fps, config: { damping: 10, stiffness: 260 } });
        return (
          <Block key={label} cx={QUALITY_X} top={restY(g + 1) + d.y} tone="gain" style={{ opacity: d.opacity, transform: `scaleY(${d.squash})`, transformOrigin: '50% 100%' }}>
            <Mark p={pop} />
            {label}
          </Block>
        );
      })}
      {/* a slow sheen up the finished stack */}
      {frame > RISES[3] && (
        <div
          style={{
            position: 'absolute',
            left: QUALITY_X - TILE_W / 2,
            top: restY(4),
            width: TILE_W,
            height: restY(0) + TILE_H - restY(4),
            borderRadius: 18,
            background: `linear-gradient(15deg, transparent ${sheen - 16}%, rgba(255,255,255,0.5) ${sheen}%, transparent ${sheen + 16}%)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      <div style={{ opacity: awake }}>
        <CaseFront cx={QUALITY_X} id="quality" rim={rim} />
      </div>
      <Measure x={QUALITY_X + CASE_W / 2 + 36} from={restY(0)} to={restY(landed)} color={C.green} opacity={ip(frame, [RISES[0] - 1, RISES[0] + 3], [0, 1])} />
    </>
  );
};

// One half of the sentence above its case: a light lead-in and a heavy, coloured verb.
const Headline = ({ cx, lead, verb, color, delay }) => (
  <div
    style={{
      position: 'absolute',
      left: cx - 450,
      width: 900,
      top: 236,
      textAlign: 'center',
      fontFamily: FONT.sans,
      fontSize: 100,
      lineHeight: 1.1,
      letterSpacing: '-0.05em',
      color: C.ink,
    }}
  >
    <span style={{ fontWeight: 300 }}>
      <KineticText text={lead} mode="rise" delay={delay} stagger={1.1} duration={13} />
    </span>
    <span style={{ fontWeight: 800, color }}>
      <KineticText text={verb} mode="rise" delay={delay + Array.from(lead).length * 1.1} stagger={1.1} duration={13} />
    </span>
  </div>
);

export const ValueScene = () => {
  const frame = useCurrentFrame();
  // close on the cost case through the tension, then pull back to both cases on the release
  const wide = ip(frame, [TURN - 8, TURN + 10], [0, 1], EASE.inOut);
  const scale = interpolate(wide, [0, 1], [1.1, 1]) * ip(frame, [TURN + 10, END], [1, 1.025], EASE.smooth);
  const tx = interpolate(wide, [0, 1], [200, 0]);
  const floor = ip(frame, [2, 16], [0, 1]);
  const glow = ip(frame, [RISES[3], RISES[3] + 18], [0, 1]);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={30} glowY={64} glow={0.12} color="255,221,206" color2="178,232,203" />
      <Dust count={16} seed="value-dust" opacity={0.25} speed={0.8} />

      <AbsoluteFill style={{ transform: `translateX(${tx}px) scale(${scale})` }}>
        {/* warm light behind the full case */}
        <div
          style={{
            position: 'absolute',
            left: QUALITY_X - 520,
            top: CASE_TOP - 260,
            width: 1040,
            height: 900,
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(C.gold, 0.26)} 0%, ${alpha(C.gold, 0)} 70%)`,
            opacity: glow,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 260,
            width: 1400,
            top: FLOOR,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, ${alpha(C.ink, 0.16)} 18%, ${alpha(C.ink, 0.16)} 82%, transparent)`,
            transform: `scaleX(${floor})`,
          }}
        />

        <CostCase />
        <QualityCase />

        <Headline cx={COST_X} lead="비용은 " verb="줄이고," color={C.coral} delay={3} />
        <Headline cx={QUALITY_X} lead="품질은 " verb="높이고." color={C.green} delay={TURN - 2} />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 922,
            textAlign: 'center',
            fontFamily: FONT.sans,
            fontSize: 38,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: C.mute,
          }}
        >
          <KineticText text="관리는 " mode="blur" delay={58} stagger={0.7} duration={10} />
          <span style={{ color: C.violet, fontWeight: 800 }}>
            <KineticText text="AI가, " mode="blur" delay={60.8} stagger={0.7} duration={10} />
          </span>
          <KineticText text="본사는 " mode="blur" delay={64} stagger={0.7} duration={10} />
          <span style={{ color: C.ink, fontWeight: 800 }}>
            <KineticText text="결정만." mode="blur" delay={66.8} stagger={0.7} duration={10} />
          </span>
        </div>
        <LensStreak at={TURN} y={FLOOR} x={960} dur={16} width={1500} color="232,163,61" core="92,201,142" />
      </AbsoluteFill>

      {/* the chapter marker stays put while the camera moves */}
      <div style={{ position: 'absolute', left: 140, top: 160, width: 400 }}>
        <ChapterPill index="04" label="가치" delay={2} color={C.gold} />
      </div>
      <Flash at={TURN} duration={5} peak={0.16} color={C.white} />
    </AbsoluteFill>
  );
};
