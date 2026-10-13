import React from 'react';
import { interpolate } from 'remotion';
import { noise2D } from '@remotion/noise';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { C, EASE, SHADOW, alpha, ip } from '../theme';
import { FONT } from '../fonts';

/*
 * A ClassIn-style live classroom with an interactive whiteboard lesson:
 * y = x² − 4x + 3 drawn live, with roots, intercept, axis of symmetry, vertex,
 * a student annotating, a tracing point and a step-by-step derivation.
 * Everything is driven by `t` (lesson clock in frames) so every clone stays in sync.
 */

// Board coordinate system (SVG user units inside the 872×402 board)
const BW = 872;
const BH = 402;
const OX = 176;
const OY = 300;
const UX = 58;
const UY = 40;
const X = (x) => OX + x * UX;
const Y = (y) => OY - y * UY;
const f = (x) => x * x - 4 * x + 3;

const PARABOLA = (() => {
  const pts = [];
  const n = 90;
  for (let k = 0; k <= n; k++) {
    const x = -0.42 + (k / n) * 4.84;
    pts.push(`${k === 0 ? 'M' : 'L'} ${X(x).toFixed(2)} ${Y(f(x)).toFixed(2)}`);
  }
  return pts.join(' ');
})();
const PARABOLA_LEN = getLength(PARABOLA);

// Region where y < 0 (between the roots)
const NEG_REGION = (() => {
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const x = 1 + (k / 40) * 2;
    pts.push(`${k === 0 ? 'M' : 'L'} ${X(x).toFixed(2)} ${Y(f(x)).toFixed(2)}`);
  }
  return `${pts.join(' ')} Z`;
})();

const X_AXIS = `M ${X(-1.3)} ${OY} L ${X(6.6)} ${OY}`;
const Y_AXIS = `M ${OX} ${Y(-1.6)} L ${OX} ${Y(6.3)}`;
const SYMMETRY = `M ${X(2)} ${Y(6.1)} L ${X(2)} ${Y(-1.65)}`;
const CIRCLE_VERTEX = (() => {
  // hand-drawn, slightly open ellipse around the vertex
  const cx = X(2);
  const cy = Y(-1) + 2;
  const pts = [];
  for (let k = 0; k <= 48; k++) {
    const a = -0.6 + (k / 48) * Math.PI * 2.15;
    const r = 1 + 0.06 * Math.sin(a * 3);
    pts.push(`${k === 0 ? 'M' : 'L'} ${(cx + Math.cos(a) * 52 * r).toFixed(1)} ${(cy + Math.sin(a) * 26 * r).toFixed(1)}`);
  }
  return pts.join(' ');
})();

const DERIVATION = [
  { text: 'y = x² − 4x + 3', from: 6, to: 14 },
  { text: '  = (x − 2)² − 1', from: 14, to: 22, mark: true },
  { text: '  = (x − 1)(x − 3)', from: 22, to: 30 },
];

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

export const ClassroomWindow = ({ t = 60, title = '고2 수학 · 심화반', branch = '강남', live = true }) => {
  const axes = ip(t, [0, 8], [0, 1], EASE.inOut);
  const draw = ip(t, [3, 22], [0, 1], EASE.smooth);
  const curve = evolvePath(draw, PARABOLA);
  const tip = getPointAtLength(PARABOLA, Math.max(0.01, PARABOLA_LEN * draw));
  const penOn = draw > 0 && draw < 1;
  const pop = (start) => ip(t, [start, start + 5], [0, 1], EASE.back);
  const sym = ip(t, [18, 26], [0, 1], EASE.inOut);
  const neg = ip(t, [24, 32], [0, 1]);
  const ring = (t % 18) / 18;
  const studentDraw = ip(t, [28, 40], [0, 1], EASE.inOut);
  const studentCircle = evolvePath(studentDraw, CIRCLE_VERTEX);
  const studentIn = ip(t, [24, 30], [0, 1], EASE.out) * ip(t, [44, 50], [1, 0]);
  const studentTip = getPointAtLength(CIRCLE_VERTEX, Math.max(0.01, getLength(CIRCLE_VERTEX) * studentDraw));
  const studentPos = t < 28 ? { x: interpolate(studentIn, [0, 1], [BW - 80, studentTip.x]), y: interpolate(studentIn, [0, 1], [60, studentTip.y]) } : studentTip;
  const traceX = interpolate(t, [32, 56], [0.25, 3.75], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.smooth });
  const traceOn = ip(t, [30, 34], [0, 1]);
  const px = X(traceX);
  const py = Y(f(traceX));
  const hand = pop(20);

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
        {/* graph paper: minor + major grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(63,124,240,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(63,124,240,0.05) 1px, transparent 1px), linear-gradient(rgba(63,124,240,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(63,124,240,0.11) 1px, transparent 1px)',
            backgroundSize: `${UX / 4}px ${UY / 4}px, ${UX / 4}px ${UY / 4}px, ${UX}px ${UY}px, ${UX}px ${UY}px`,
            backgroundPosition: `${OX}px ${OY}px`,
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
          <span style={{ color: C.greenInk }}>3차시</span> · 이차함수의 그래프
        </div>

        <svg viewBox={`0 0 ${BW} ${BH}`} width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <pattern id="cw-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke={C.green} strokeWidth="2" strokeOpacity="0.32" />
            </pattern>
            <marker id="cw-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill={inkA(0.7)} />
            </marker>
          </defs>

          {/* axes */}
          {[X_AXIS, Y_AXIS].map((d) => {
            const ev = evolvePath(axes, d);
            return (
              <path
                key={d}
                d={d}
                stroke={inkA(0.7)}
                strokeWidth={2}
                fill="none"
                strokeDasharray={ev.strokeDasharray}
                strokeDashoffset={ev.strokeDashoffset}
                markerEnd={axes > 0.98 ? 'url(#cw-arrow)' : undefined}
              />
            );
          })}
          <text x={X(6.55)} y={OY + 24} fill={inkA(0.8)} fontSize={17} fontStyle="italic" fontFamily={FONT.sans} opacity={axes}>
            x
          </text>
          <text x={OX + 10} y={Y(6.2)} fill={inkA(0.8)} fontSize={17} fontStyle="italic" fontFamily={FONT.sans} opacity={axes}>
            y
          </text>
          <text x={OX - 18} y={OY + 20} fill={inkA(0.55)} fontSize={14} fontStyle="italic" fontFamily={FONT.sans} opacity={axes}>
            O
          </text>
          {/* ticks + numbers */}
          {[-1, 1, 2, 3, 4, 5, 6].map((n, i) => (
            <g key={`xt${n}`} opacity={ip(t, [2 + i * 0.6, 6 + i * 0.6], [0, 1])}>
              <line x1={X(n)} y1={OY - 5} x2={X(n)} y2={OY + 5} stroke={inkA(0.55)} strokeWidth={1.5} />
              <text x={X(n)} y={OY + 21} fill={inkA(0.5)} fontSize={12.5} textAnchor="middle" fontFamily={FONT.mono}>
                {n}
              </text>
            </g>
          ))}
          {[-1, 1, 2, 3, 4, 5, 6].map((n, i) => (
            <g key={`yt${n}`} opacity={ip(t, [2 + i * 0.6, 6 + i * 0.6], [0, 1])}>
              <line x1={OX - 5} y1={Y(n)} x2={OX + 5} y2={Y(n)} stroke={inkA(0.55)} strokeWidth={1.5} />
              <text x={OX - 12} y={Y(n) + 4} fill={inkA(0.5)} fontSize={12.5} textAnchor="end" fontFamily={FONT.mono}>
                {n}
              </text>
            </g>
          ))}

          {/* y < 0 region */}
          <path d={NEG_REGION} fill="url(#cw-hatch)" opacity={neg} />
          <path d={NEG_REGION} fill={alpha(C.green, 0.07)} opacity={neg} />
          <text x={X(2)} y={OY + 21} fill={C.greenInk} fontSize={13} fontWeight={700} textAnchor="middle" fontFamily={FONT.sans} opacity={neg * (1 - ip(t, [22, 26], [0, 1]))}>
            y&lt;0
          </text>

          {/* axis of symmetry */}
          <clipPath id="cw-sym-clip">
            <rect x={X(2) - 10} y={Y(6.1)} width={20} height={(Y(-1.65) - Y(6.1)) * sym} />
          </clipPath>
          <path d={SYMMETRY} stroke={C.gold} strokeWidth={1.8} strokeDasharray="7 6" fill="none" opacity={0.85} clipPath="url(#cw-sym-clip)" />
          <text x={X(2) + 8} y={Y(5.6)} fill={C.goldInk} fontSize={15} fontWeight={700} fontFamily={FONT.sans} opacity={pop(24)}>
            x = 2
          </text>

          {/* parabola — soft marker bleed + crisp stroke */}
          <path d={PARABOLA} fill="none" stroke={C.green} strokeOpacity={0.18} strokeWidth={11} strokeLinecap="round" strokeDasharray={curve.strokeDasharray} strokeDashoffset={curve.strokeDashoffset} style={{ filter: 'blur(5px)' }} />
          <path d={PARABOLA} fill="none" stroke={C.green} strokeWidth={4.2} strokeLinecap="round" strokeDasharray={curve.strokeDasharray} strokeDashoffset={curve.strokeDashoffset} />
          <text x={X(4.5)} y={Y(4.6)} fill={C.greenInk} fontSize={17} fontWeight={700} fontFamily={FONT.sans} opacity={pop(21)}>
            y = x² − 4x + 3
          </text>

          {/* key points */}
          {[
            { x: 0, y: 3, label: '(0, 3)', at: 12, dx: 10, dy: -8, anchor: 'start' },
            { x: 1, y: 0, label: '(1, 0)', at: 15, dx: -10, dy: 38, anchor: 'end' },
            { x: 3, y: 0, label: '(3, 0)', at: 17, dx: -10, dy: -12, anchor: 'end' },
          ].map((p) => (
            <g key={p.label} opacity={Math.min(1, pop(p.at) * 1.5)}>
              <circle cx={X(p.x)} cy={Y(p.y)} r={6.5 * pop(p.at)} fill="#ffffff" stroke={C.green} strokeWidth={2.5} />
              <text x={X(p.x) + p.dx} y={Y(p.y) + p.dy} fill={inkA(0.85)} fontSize={14} fontWeight={700} textAnchor={p.anchor} fontFamily={FONT.mono}>
                {p.label}
              </text>
            </g>
          ))}

          {/* vertex */}
          <circle cx={X(2)} cy={Y(-1)} r={8 + ring * 22} fill="none" stroke={C.gold} strokeWidth={2} opacity={pop(22) * (1 - ring)} />
          <circle cx={X(2)} cy={Y(-1)} r={8.5 * pop(22)} fill={C.gold} stroke="#FFFFFF" strokeWidth={2.5} style={{ filter: `drop-shadow(0 2px 6px ${alpha(C.gold, 0.55)})` }} />
          <g opacity={pop(23)}>
            <text x={X(2) + 76} y={Y(-1) - 8} fill={C.goldInk} fontSize={16} fontWeight={800} fontFamily={FONT.sans}>
              꼭짓점 (2, −1)
            </text>
            <text x={X(2) + 76} y={Y(-1) + 12} fill={alpha(C.goldInk, 0.8)} fontSize={13} fontWeight={600} fontFamily={FONT.sans}>
              최솟값 −1
            </text>
          </g>

          {/* student annotation */}
          <path d={CIRCLE_VERTEX} fill="none" stroke={C.coral} strokeWidth={3} strokeLinecap="round" strokeDasharray={studentCircle.strokeDasharray} strokeDashoffset={studentCircle.strokeDashoffset} opacity={ip(t, [28, 30], [0, 1]) * ip(t, [56, 62], [1, 0.4])} />

          {/* tracing point P */}
          <g opacity={traceOn}>
            <line x1={px} y1={py} x2={px} y2={OY} stroke={inkA(0.32)} strokeWidth={1.3} strokeDasharray="4 4" />
            <line x1={px} y1={py} x2={OX} y2={py} stroke={inkA(0.32)} strokeWidth={1.3} strokeDasharray="4 4" />
            <circle cx={px} cy={py} r={13} fill={alpha(C.green, 0.16)} />
            <circle cx={px} cy={py} r={6} fill={C.white} stroke={C.green} strokeWidth={3} />
            <g transform={`translate(${px + 14} ${py - 42})`}>
              <rect width={124} height={26} rx={6} fill={C.ink} />
              <text x={10} y={18} fill={C.white} fontSize={13} fontWeight={700} fontFamily={FONT.mono}>
                P({traceX.toFixed(1)}, {f(traceX).toFixed(2)})
              </text>
            </g>
          </g>

          {/* teacher pen tip */}
          {penOn && (
            <g transform={`translate(${tip.x} ${tip.y})`}>
              <circle r={10} fill={alpha(C.green, 0.25)} style={{ filter: 'blur(3px)' }} />
              <g transform="rotate(-35)">
                <path d="M0 0 L5 -9 L5 -52 L-5 -52 L-5 -9 Z" fill="#FFFFFF" stroke={inkA(0.35)} strokeWidth={1} />
                <rect x={-5} y={-52} width={10} height={9} fill={C.green} />
              </g>
            </g>
          )}

          {/* student cursor */}
          {studentIn > 0.01 && (
            <g transform={`translate(${studentPos.x} ${studentPos.y})`} opacity={studentIn}>
              <path d="M0 0 L0 20 L5.5 15 L9.5 24 L13 22.5 L9 13.8 L16 13.5 Z" fill={C.gold} stroke="#FFFFFF" strokeWidth={1.4} />
              <g transform="translate(16 22)">
                <rect width={58} height={20} rx={6} fill={C.gold} />
                <text x={29} y={14.5} fill="#FFFFFF" fontSize={11.5} fontWeight={800} textAnchor="middle" fontFamily={FONT.sans}>
                  학생 2
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* derivation panel */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: 52,
            width: 248,
            padding: '12px 14px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.94)',
            border: `1px solid ${C.hair}`,
            boxShadow: SHADOW.card,
            opacity: ip(t, [4, 8], [0, 1]),
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 800, color: C.greenInk, letterSpacing: '0.12em', marginBottom: 8 }}>풀이 · 꼭짓점 구하기</div>
          {DERIVATION.map((line) => {
            const chars = Array.from(line.text);
            const shown = Math.round(ip(t, [line.from, line.to], [0, chars.length], EASE.linear));
            const underline = line.mark ? ip(t, [line.to, line.to + 6], [0, 1], EASE.out) : 0;
            return (
              <div key={line.text} style={{ position: 'relative', height: 30, fontSize: 19, fontWeight: 600, color: C.ink, whiteSpace: 'pre', fontStyle: 'italic' }}>
                {chars.slice(0, shown).join('')}
                {shown > 0 && shown < chars.length && <span style={{ display: 'inline-block', width: 2, height: 18, background: C.green, marginLeft: 1, verticalAlign: '-2px' }} />}
                {line.mark && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 22,
                      bottom: 3,
                      height: 7,
                      width: `${underline * 150}px`,
                      background: alpha(C.gold, 0.35),
                      borderRadius: 3,
                    }}
                  />
                )}
              </div>
            );
          })}
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              color: C.greenInk,
              opacity: pop(30),
              transform: `scale(${0.8 + 0.2 * pop(30)})`,
              transformOrigin: 'left center',
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: 10, background: C.green, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>✓</span>
            꼭짓점 (2, −1) · 축 x = 2
          </div>
        </div>

        {/* hand-raise / chat bubble */}
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
            opacity: hand * ip(t, [48, 54], [1, 0]),
          }}
        >
          <span style={{ color: C.goldInk }}>학생 3</span> · 축이 왜 x = 2 인가요?
        </div>

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
