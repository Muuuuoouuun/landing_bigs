import React from 'react';
import { interpolate } from 'remotion';
import { noise2D } from '@remotion/noise';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { C, EASE, SHADOW, alpha, ip } from '../theme';
import { FONT, preloadHand } from '../fonts';

/*
 * A ClassIn-style live classroom with a handwritten whiteboard lesson.
 * Every board carries the same HQ problem card (x² − 4x + 3 = 0); underneath, one of nine
 * solution methods is written out line by line with a pen, and every method lands on the same
 * answer. Everything is driven by `t` (lesson clock in frames), so any copy can run on its own
 * clock — the 3×3 sync shot gives each branch a different method and a slightly different pace.
 */

export const PROBLEM = 'x² − 4x + 3 = 0';
const ANSWER = '∴ x = 1 또는 x = 3';

// Nine roads to the same answer, one per branch in the 3×3 shot (index 4 is the hero class).
// A line is an array of segments: plain text, { frac: [numerator, denominator] } or { sqrt: radicand }.
export const SOLUTIONS = [
  { name: '인수분해', color: C.green, ink: C.greenInk, lines: [['(x − 1)(x − 3) = 0']] },
  { name: '근의 공식', color: C.blue, ink: C.blueInk, size: 48, lines: [['x = ', { frac: [['4 ± ', { sqrt: '16 − 12' }], '2'] }], ['  = ', { frac: ['4 ± 2', '2'] }]] },
  { name: '짝수 공식', color: C.gold, ink: C.goldInk, lines: [['x = 2 ± ', { sqrt: '2² − 3' }], ['  = 2 ± 1']] },
  { name: '근과 계수', color: C.coral, ink: C.coral, lines: [['α + β = 4,  αβ = 3'], ['→ 1 + 3 = 4,  1 × 3 = 3']] },
  { name: '완전제곱식', color: C.violet, ink: C.violetInk, lines: [['(x − 2)² − 1 = 0'], ['x − 2 = ±1']] },
  { name: '치환', color: C.blue, ink: C.blueInk, lines: [['x = t + 2  →  t² − 1 = 0'], ['t = ±1']] },
  { name: '인수정리', color: C.green, ink: C.greenInk, lines: [['f(1) = 1 − 4 + 3 = 0'], ['→ (x − 1)(x − 3) = 0']] },
  { name: '판별식', color: C.violet, ink: C.violetInk, size: 52, lines: [['D = 16 − 12 = 4 > 0'], ['x = ', { frac: ['4 ± 2', '2'] }]] },
  { name: '묶어서 인수분해', color: C.gold, ink: C.goldInk, lines: [['x² − x − 3x + 3 = 0'], ['x(x − 1) − 3(x − 1) = 0']] },
];
const HERO_METHOD = 4;
const HERO_MENU = [0, 1, 4, 3]; // the method list on the hero board (완전제곱식 is being written)

const flatten = (seg) => {
  if (typeof seg === 'string') return seg;
  if (Array.isArray(seg)) return seg.map(flatten).join('');
  if (seg.frac) return seg.frac.map(flatten).join('');
  return flatten(seg.sqrt);
};
const LESSON_TEXT = [ANSWER, ...SOLUTIONS.flatMap((s) => s.lines.map(flatten))].join('') + '√∴';
preloadHand(LESSON_TEXT);

// Lesson clock (frames): the card lands, the method tag pops, then one line every 8 frames.
const CARD_AT = 2;
const TAG_AT = 10;
const WRITE_AT = 13;
const LINE = 8;
export const answerDoneAt = (method) => WRITE_AT + SOLUTIONS[method].lines.length * LINE + 7;

const TOOLS = ['pen', 'marker', 'eraser', 'shape', 'text', 'laser', 'ruler'];

// navy board ink at a given strength
const inkA = (a) => `rgba(23,35,60,${a})`;

const ToolIcon = ({ kind, active }) => {
  const s = active ? C.green : inkA(0.55);
  const common = { fill: 'none', stroke: s, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'pen':
      return <path d="M5 19 L6 14 L15 5 L19 9 L10 18 Z M13 7 L17 11" {...common} />;
    case 'marker':
      return <path d="M6 18 L9 12 L15 6 L18 9 L12 15 Z M5 20 H12" {...common} />;
    case 'eraser':
      return <path d="M5 15 L12 8 L18 14 L13 19 H8 Z M9 11 L15 17" {...common} />;
    case 'shape':
      return (
        <>
          <rect x="4" y="11" width="8" height="8" rx="1" {...common} />
          <circle cx="15" cy="8" r="4" {...common} />
        </>
      );
    case 'text':
      return <path d="M6 6 H18 M12 6 V19 M9 19 H15" {...common} />;
    case 'laser':
      return (
        <>
          <circle cx="12" cy="12" r="3" fill={s} />
          <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21" {...common} />
        </>
      );
    default:
      return <path d="M4 16 L16 4 L20 8 L8 20 Z M8 12 L10 14 M11 9 L13 11 M14 6 L16 8" {...common} />;
  }
};

const Avatar = ({ hue }) => (
  <svg width="44" height="40" viewBox="0 0 44 40">
    <circle cx="22" cy="14" r="8" fill="rgba(255,255,255,0.95)" />
    <path d="M6 40 C8 27 36 27 38 40 Z" fill={`hsla(${hue},60%,98%,0.8)`} />
  </svg>
);

// pastel camera tiles (mint · sky · butter · lavender · aqua · rose)
const TILES = [
  { name: '강사', hue: 140, a: '#CDEFD9', b: '#9FDAB8' },
  { name: '학생 1', hue: 210, a: '#DCE8FF', b: '#B3CBF6' },
  { name: '학생 2', hue: 40, a: '#FFEBCB', b: '#F5D093' },
  { name: '학생 3', hue: 270, a: '#E7E0FF', b: '#C7B9F6' },
  { name: '학생 4', hue: 180, a: '#D3F2F0', b: '#A3DDD8' },
  { name: '학생 5', hue: 345, a: '#FFE0E6', b: '#F4BCC8' },
];

const clock = (t) => {
  const s = 24 * 60 + 13 + Math.floor(t / 30);
  return `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/* ---------------- handwriting ---------------- */
/** Renders a handwritten math segment: text, stacked fraction or square root. */
const Ink = ({ seg }) => {
  if (Array.isArray(seg)) return seg.map((s, i) => <Ink key={i} seg={s} />);
  if (typeof seg === 'string') return <span style={{ whiteSpace: 'pre' }}>{seg}</span>;
  if (seg.frac) {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', fontSize: '0.74em', lineHeight: 1.02, margin: '0 0.1em' }}>
        <span>
          <Ink seg={seg.frac[0]} />
        </span>
        <span style={{ alignSelf: 'stretch', height: '0.08em', background: 'currentColor', borderRadius: 3, margin: '0.05em 0' }} />
        <span>
          <Ink seg={seg.frac[1]} />
        </span>
      </span>
    );
  }
  return (
    <span style={{ whiteSpace: 'pre' }}>
      √<span style={{ borderTop: '0.07em solid currentColor', paddingTop: '0.02em' }}>
        <Ink seg={seg.sqrt} />
      </span>
    </span>
  );
};

/** Marker pen whose tip sits on (left, top) of its container. */
const PenTip = ({ left }) => (
  <svg width="52" height="66" viewBox="-14 -58 52 66" style={{ position: 'absolute', left, top: '64%', transform: 'translate(-14px, -58px)', overflow: 'visible', pointerEvents: 'none' }}>
    <circle r={9} fill={alpha(C.green, 0.22)} style={{ filter: 'blur(3px)' }} />
    <g transform="rotate(28)">
      <path d="M0 0 L5 -9 L5 -52 L-5 -52 L-5 -9 Z" fill="#FFFFFF" stroke={inkA(0.35)} strokeWidth={1} />
      <rect x={-5} y={-52} width={10} height={9} fill={C.green} />
    </g>
  </svg>
);

/** One written line: revealed left → right as the pen travels, with a slight hand tilt. */
const InkLine = ({ seg, p, color, tilt = 0, pen, children }) => (
  <div style={{ position: 'relative', display: 'inline-block', transform: `rotate(${tilt}deg)`, color }}>
    <div style={{ clipPath: `inset(-40% ${(1 - p) * 100}% -40% -6%)`, whiteSpace: 'nowrap' }}>
      <Ink seg={seg} />
    </div>
    {children}
    {pen && p > 0.02 && p < 0.98 && <PenTip left={`${p * 100}%`} />}
  </div>
);

// student's loop around the answer (in a 600×100 box stretched over the answer line)
const LOOP = (() => {
  const pts = [];
  for (let k = 0; k <= 56; k++) {
    const a = -0.5 + (k / 56) * Math.PI * 2.12;
    const r = 1 + 0.05 * Math.sin(a * 3);
    pts.push(`${k === 0 ? 'M' : 'L'} ${(300 + Math.cos(a) * 300 * r).toFixed(1)} ${(50 + Math.sin(a) * 50 * r).toFixed(1)}`);
  }
  return pts.join(' ');
})();
const LOOP_LEN = getLength(LOOP);

export const ClassroomWindow = ({ t = 60, title = '고2 수학 · 심화반', branch = '강남', live = true, method = HERO_METHOD, detail = 1 }) => {
  const sol = SOLUTIONS[method];
  const pop = (start) => ip(t, [start, start + 5], [0, 1], EASE.back);
  const hand = pop(20);
  const card = ip(t, [CARD_AT, CARD_AT + 6], [0, 1], EASE.out);
  const tag = pop(TAG_AT);
  const rows = [...sol.lines, [ANSWER]];
  const writeP = (i) => ip(t, [WRITE_AT + i * LINE, WRITE_AT + i * LINE + 7], [0, 1], EASE.linear);
  const doneAt = answerDoneAt(method);
  const check = pop(doneAt + 1);
  const highlight = ip(t, [doneAt + 1, doneAt + 6], [0, 1], EASE.out);
  const writing = rows.findIndex((_, i) => writeP(i) > 0 && writeP(i) < 1);
  const size = sol.size ?? 56;
  // hero-only extras: student loop around the answer, cursor, method list, chat bubble
  const loopDraw = ip(t, [doneAt + 2, doneAt + 10], [0, 1], EASE.inOut);
  const loop = evolvePath(loopDraw, LOOP);
  const cursorIn = ip(t, [doneAt - 3, doneAt + 2], [0, 1], EASE.out) * ip(t, [doneAt + 12, doneAt + 17], [1, 0]);
  const loopTip = getPointAtLength(LOOP, Math.max(0.01, LOOP_LEN * loopDraw));
  const cursor = {
    left: interpolate(cursorIn, [0, 1], [150, -6 + (112 * loopTip.x) / 600], { extrapolateRight: 'clamp' }),
    top: interpolate(cursorIn, [0, 1], [-260, -22 + (144 * loopTip.y) / 100], { extrapolateRight: 'clamp' }),
  };

  return (
    <div
      style={{
        width: 900,
        height: 540,
        borderRadius: 18,
        overflow: 'hidden',
        background: C.surface,
        border: `1.5px solid ${C.line}`,
        boxShadow: SHADOW.float,
        fontFamily: FONT.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* top bar */}
      <div
        style={{
          height: 42,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          borderBottom: `1px solid ${C.hair}`,
          background: C.surfaceAlt,
          flexShrink: 0,
        }}
      >
        <span style={{ color: C.brand, fontWeight: 900, fontSize: 19, letterSpacing: '-0.02em' }}>ClassIn</span>
        <span style={{ width: 1, height: 16, background: C.line }} />
        <span style={{ color: C.ink, fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{ color: C.greenInk, fontSize: 12, fontWeight: 700, background: C.mint, borderRadius: 6, padding: '2px 8px' }}>{branch}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: C.mute, fontSize: 12, fontWeight: 600 }}>참여 24명</span>
        {/* signal bars */}
        <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
          {[4, 7, 10, 12].map((h) => (
            <span key={h} style={{ width: 3, height: h, background: C.green, borderRadius: 1 }} />
          ))}
        </span>
        {live && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: FONT.mono, fontSize: 13, color: C.mute }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.coral, boxShadow: `0 0 0 3px ${alpha(C.coral, 0.18)}`, opacity: Math.floor(t / 10) % 2 ? 0.45 : 1 }} />
            REC {clock(t)}
          </span>
        )}
      </div>

      {/* video strip */}
      <div style={{ display: 'flex', gap: 8, padding: '9px 14px', flexShrink: 0 }}>
        {TILES.map((tile, k) => {
          const speaking = k === 0;
          const level = speaking ? 0.35 + 0.65 * Math.abs(noise2D('spk', t * 0.4, 0)) : 0;
          const raised = k === 3 && hand > 0.01;
          return (
            <div
              key={tile.name}
              style={{
                flex: 1,
                height: 62,
                borderRadius: 9,
                background: `linear-gradient(145deg, ${tile.a}, ${tile.b})`,
                border: speaking ? `2px solid ${alpha(C.green, 0.55 + level * 0.45)}` : `1px solid ${C.hair}`,
                boxShadow: speaking ? `0 0 0 ${3 * level}px ${alpha(C.green, 0.18)}` : undefined,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Avatar hue={tile.hue} />
              <span style={{ position: 'absolute', left: 7, bottom: 4, fontSize: 10.5, fontWeight: 700, color: inkA(0.72) }}>{tile.name}</span>
              {speaking && (
                <span style={{ position: 'absolute', right: 7, bottom: 6, display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                  {[0, 1, 2, 3].map((b) => (
                    <span
                      key={b}
                      style={{
                        width: 3,
                        borderRadius: 1,
                        background: C.green,
                        height: `${20 + 80 * Math.abs(noise2D(`lv-${b}`, t * 0.5, b))}%`,
                      }}
                    />
                  ))}
                </span>
              )}
              {raised && (
                <span
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 6,
                    padding: '1px 6px',
                    borderRadius: 6,
                    background: C.gold,
                    color: C.white,
                    fontSize: 10,
                    fontWeight: 800,
                    transform: `scale(${hand})`,
                  }}
                >
                  손들기
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* whiteboard */}
      <div style={{ flex: 1, margin: '0 14px 14px', borderRadius: 12, position: 'relative', overflow: 'hidden', background: '#FCFDFF', border: `1px solid ${C.hair}` }}>
        {/* faint board grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(63,124,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(63,124,240,0.06) 1px, transparent 1px)',
            backgroundSize: '29px 29px',
            backgroundPosition: '6px 6px',
          }}
        />

        {/* tool rail */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 12,
            padding: 5,
            borderRadius: 10,
            background: C.surface,
            border: `1px solid ${C.hair}`,
            boxShadow: SHADOW.soft,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          {TOOLS.map((k, i) => (
            <div
              key={k}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: i === 0 ? C.mint : 'transparent',
                border: `1px solid ${i === 0 ? C.green : 'transparent'}`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <ToolIcon kind={k} active={i === 0} />
              </svg>
            </div>
          ))}
          <div style={{ height: 1, background: C.line, margin: '2px 3px' }} />
          {[C.green, C.gold, C.coral, C.ink].map((c, i) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, margin: '1px auto', boxShadow: i === 0 ? `0 0 0 2px #FFFFFF, 0 0 0 3.5px ${c}` : undefined }} />
          ))}
        </div>

        {/* lesson tab */}
        <div
          style={{
            position: 'absolute',
            left: 58,
            top: 12,
            padding: '4px 10px',
            borderRadius: 7,
            background: C.surface,
            border: `1px solid ${C.hair}`,
            boxShadow: SHADOW.soft,
            fontSize: 12.5,
            fontWeight: 700,
            color: C.mute,
          }}
        >
          <span style={{ color: C.greenInk }}>3차시</span> · 이차방정식의 풀이
        </div>

        {/* HQ problem card — identical on every board */}
        <div
          style={{
            position: 'absolute',
            left: 58,
            top: 50,
            height: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px 0 8px',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.line}`,
            boxShadow: SHADOW.soft,
            opacity: card,
            transform: `translateY(${(1 - card) * -14}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ padding: '5px 10px', borderRadius: 8, background: C.green, color: C.white, fontSize: 15, fontWeight: 800 }}>문제</span>
          <span style={{ fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: C.ink, letterSpacing: '-0.01em' }}>{PROBLEM}</span>
          <span style={{ fontSize: 17, fontWeight: 600, color: C.inkSoft }}>의 해를 구하시오.</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.greenInk, background: C.mint, borderRadius: 6, padding: '3px 7px' }}>본사 공통 문항</span>
        </div>

        {/* method tag */}
        <div
          style={{
            position: 'absolute',
            left: 72,
            top: 114,
            padding: '4px 12px',
            borderRadius: 999,
            background: alpha(sol.color, 0.14),
            color: sol.ink,
            fontSize: 16,
            fontWeight: 800,
            transform: `scale(${tag})`,
            transformOrigin: 'left center',
            opacity: Math.min(1, tag * 1.5),
          }}
        >
          풀이 · {sol.name}
        </div>

        {/* the written solution */}
        <div style={{ position: 'absolute', left: 76, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, fontFamily: FONT.hand, fontSize: size, lineHeight: 1.12 }}>
          {rows.map((seg, i) => {
            const isAnswer = i === rows.length - 1;
            return (
              <InkLine key={i} seg={seg} p={writeP(i)} color={isAnswer ? C.greenInk : C.ink} tilt={[-0.8, 0.5, -0.4][i % 3]} pen={writing === i}>
                {isAnswer && (
                  <>
                    {/* highlighter swipe under the answer */}
                    <span style={{ position: 'absolute', left: '-2%', bottom: '10%', height: '24%', width: `${highlight * 104}%`, background: alpha(C.gold, 0.3), borderRadius: 6, zIndex: -1 }} />
                    <span
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 14px)',
                        top: '50%',
                        width: 38,
                        height: 38,
                        marginTop: -19,
                        borderRadius: 19,
                        background: C.green,
                        color: C.white,
                        fontFamily: FONT.sans,
                        fontSize: 22,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: `scale(${check})`,
                      }}
                    >
                      ✓
                    </span>
                    {detail > 0.01 && (
                      <>
                        <svg viewBox="0 0 600 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-6%', top: '-22%', width: '112%', height: '144%', overflow: 'visible', opacity: detail }}>
                          <path d={LOOP} fill="none" stroke={C.coral} strokeWidth={3.4} strokeLinecap="round" strokeDasharray={loop.strokeDasharray} strokeDashoffset={loop.strokeDashoffset} />
                        </svg>
                        {cursorIn > 0.01 && (
                          <svg width="80" height="48" viewBox="0 0 80 48" style={{ position: 'absolute', left: `${cursor.left}%`, top: `${cursor.top}%`, overflow: 'visible', opacity: cursorIn * detail }}>
                            <path d="M0 0 L0 20 L5.5 15 L9.5 24 L13 22.5 L9 13.8 L16 13.5 Z" fill={C.gold} stroke="#FFFFFF" strokeWidth={1.4} />
                            <g transform="translate(16 22)">
                              <rect width={58} height={20} rx={6} fill={C.gold} />
                              <text x={29} y={14.5} fill="#FFFFFF" fontSize={11.5} fontWeight={800} textAnchor="middle" fontFamily={FONT.sans}>
                                학생 2
                              </text>
                            </g>
                          </svg>
                        )}
                      </>
                    )}
                  </>
                )}
              </InkLine>
            );
          })}
        </div>

        {/* hero board: the same problem's solution methods */}
        {detail > 0.01 && (
          <div
            style={{
              position: 'absolute',
              right: 14,
              top: 50,
              width: 212,
              padding: '12px 12px 10px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.95)',
              border: `1px solid ${C.hair}`,
              boxShadow: SHADOW.card,
              opacity: ip(t, [4, 8], [0, 1]) * detail,
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 800, color: C.greenInk, letterSpacing: '0.1em', marginBottom: 6 }}>같은 문제 · 풀이 방법</div>
            {HERO_MENU.map((m, i) => {
              const active = m === method;
              const done = active && t >= doneAt;
              return (
                <div
                  key={m}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 30,
                    padding: '0 8px',
                    borderRadius: 8,
                    background: active ? alpha(SOLUTIONS[m].color, 0.12) : 'transparent',
                    fontSize: 14.5,
                    fontWeight: active ? 800 : 600,
                    color: active ? C.ink : C.mute,
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 9, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? SOLUTIONS[m].color : C.surfaceAlt, color: active ? C.white : C.dim }}>{i + 1}</span>
                  {SOLUTIONS[m].name}
                  {active && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: done ? C.greenInk : SOLUTIONS[m].ink }}>{done ? '✓ 완료' : '판서 중'}</span>}
                </div>
              );
            })}
            <div style={{ marginTop: 4, padding: '0 8px', fontSize: 11.5, fontWeight: 600, color: C.dim }}>+ 다른 풀이 5가지</div>
          </div>
        )}

        {/* hand-raise / chat bubble */}
        {detail > 0.01 && (
          <div
            style={{
              position: 'absolute',
              right: 14,
              bottom: 52,
              padding: '8px 12px',
              borderRadius: '12px 12px 4px 12px',
              background: '#FFF4DF',
              border: `1px solid ${alpha(C.gold, 0.5)}`,
              boxShadow: SHADOW.soft,
              fontSize: 13,
              fontWeight: 700,
              color: C.ink,
              transform: `translateY(${(1 - hand) * 12}px) scale(${0.9 + 0.1 * hand})`,
              opacity: hand * ip(t, [48, 54], [1, 0]) * detail,
            }}
          >
            <span style={{ color: C.goldInk }}>학생 3</span> · 근의 공식으로도 풀 수 있나요?
          </div>
        )}

        {/* page indicator */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 12,
            padding: '3px 10px',
            borderRadius: 6,
            background: C.surface,
            border: `1px solid ${C.hair}`,
            fontFamily: FONT.mono,
            fontSize: 12,
            color: C.mute,
          }}
        >
          3 / 12
        </div>
      </div>
    </div>
  );
};
