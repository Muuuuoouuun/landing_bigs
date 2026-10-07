import React from 'react';
import { evolvePath } from '@remotion/paths';
import { C } from '../theme';
import { FONT } from '../fonts';

// Parabola y = (x-2)^2 - 1 drawn on the "blackboard" — the same lesson in every branch.
const ORIGIN_X = 250;
const ORIGIN_Y = 250;
const UX = 72;
const UY = 38;
const PARABOLA = (() => {
  const pts = [];
  for (let k = 0; k <= 60; k++) {
    const x = -0.55 + (k / 60) * 5.1;
    const y = (x - 2) ** 2 - 1;
    pts.push(`${k === 0 ? 'M' : 'L'} ${(ORIGIN_X + x * UX).toFixed(1)} ${(ORIGIN_Y - y * UY).toFixed(1)}`);
  }
  return pts.join(' ');
})();

const TILE_GRADS = [
  ['#1d6b45', '#0b2e1f'],
  ['#2f4f6b', '#132433'],
  ['#5b4a2a', '#2a2214'],
  ['#3d2f5c', '#1b1430'],
  ['#2a5b5b', '#112a2a'],
  ['#5c2f3a', '#2b141a'],
];

/**
 * A ClassIn-style live classroom: top bar, video strip, interactive blackboard.
 * `draw` (0..1) controls the board drawing so every clone stays in sync.
 */
export const ClassroomWindow = ({ draw = 1, typed = 1, vertex = 1, title = '고2 수학 · 심화반', branch = '강남', live = true }) => {
  const curve = evolvePath(draw, PARABOLA);
  const eq = 'y = x² − 4x + 3';
  const eqShown = Array.from(eq).slice(0, Math.round(typed * eq.length)).join('');

  return (
    <div
      style={{
        width: 900,
        height: 540,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#08130e',
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,223,69,0.08)',
        fontFamily: FONT.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* top bar */}
      <div
        style={{
          height: 46,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 14,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <span style={{ color: C.brand, fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em' }}>ClassIn</span>
        <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ color: C.white, fontWeight: 600, fontSize: 16 }}>{title}</span>
        <span
          style={{
            color: C.green,
            fontSize: 13,
            fontWeight: 700,
            border: `1px solid ${C.line}`,
            borderRadius: 6,
            padding: '2px 8px',
          }}
        >
          {branch}
        </span>
        <span style={{ flex: 1 }} />
        {live && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.mono, fontSize: 14, color: C.mute }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: '#ff4d4d', boxShadow: '0 0 10px #ff4d4d' }} />
            REC 00:24:13
          </span>
        )}
      </div>

      {/* video strip */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
        {TILE_GRADS.map(([a, b], k) => (
          <div
            key={k}
            style={{
              flex: 1,
              height: 74,
              borderRadius: 10,
              background: `linear-gradient(145deg, ${a}, ${b})`,
              border: k === 0 ? `2px solid ${C.green}` : '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.22)' }} />
            <span
              style={{
                position: 'absolute',
                left: 8,
                bottom: 5,
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              {k === 0 ? '강사' : `학생 ${k}`}
            </span>
          </div>
        ))}
      </div>

      {/* blackboard */}
      <div style={{ flex: 1, margin: '0 16px 16px', borderRadius: 12, position: 'relative', overflow: 'hidden', background: '#0d261b' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* tool rail */}
        <div style={{ position: 'absolute', left: 12, top: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[C.green, '#fff', '#fff', '#fff', '#fff'].map((c, k) => (
            <div
              key={k}
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: k === 0 ? 'rgba(0,223,69,0.2)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${k === 0 ? C.green : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <div style={{ width: 10, height: 2, background: c, margin: '12px auto 0', opacity: 0.8 }} />
            </div>
          ))}
        </div>
        <svg viewBox="0 0 868 340" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <line x1={70} y1={ORIGIN_Y} x2={820} y2={ORIGIN_Y} stroke="rgba(255,255,255,0.45)" strokeWidth={2} />
          <line x1={ORIGIN_X} y1={20} x2={ORIGIN_X} y2={326} stroke="rgba(255,255,255,0.45)" strokeWidth={2} />
          <path
            d={PARABOLA}
            fill="none"
            stroke={C.greenSoft}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray={curve.strokeDasharray}
            strokeDashoffset={curve.strokeDashoffset}
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,223,69,0.8))' }}
          />
          <circle
            cx={ORIGIN_X + 2 * UX}
            cy={ORIGIN_Y + UY}
            r={9 * vertex}
            fill={C.gold}
            style={{ filter: 'drop-shadow(0 0 8px rgba(230,184,0,0.9))' }}
          />
          <text
            x={ORIGIN_X + 2 * UX + 18}
            y={ORIGIN_Y + UY + 36}
            fill={C.gold}
            fontSize={22}
            fontWeight={700}
            fontFamily={FONT.sans}
            opacity={vertex}
          >
            꼭짓점 (2, −1)
          </text>
          <text x={560} y={74} fill="#f3f7f4" fontSize={34} fontWeight={600} fontFamily={FONT.sans}>
            {eqShown}
          </text>
        </svg>
      </div>
    </div>
  );
};
