import React from 'react';
import { AbsoluteFill, Freeze, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { EASE, ip } from '../theme';
import { FONT } from '../fonts';

/*
 * Interlude — a "variation" on the film's theme, dropped into the middle of the reel.
 * Same message, opposite treatment: ivory paper instead of dark glass, a flat Swiss grid
 * instead of glowing HUD, color blocks instead of light, and motion stepped on twos
 * (stop-motion staccato) instead of smooth easing.
 *
 * Global 352–408 (four beats). Beats 1–2: the system's eight parts stamp into the grid on
 * 16th notes (each stamp is a marimba note in the score). Beats 3–4: the grid folds into a
 * header band and the chapter's statement is stamped like a poster (words at 34/36/38/42).
 * The last 8 frames overlap the iris that opens into the dark data-core bridge.
 */
export const VARIATION_DURATION = 64;

const PAPER = '#f2efe6';
const INK = '#0c1f16';
const DEEP = '#0b3d2b';
const BRAND = '#04bc09';
const GOLD = '#e6b800';
const HAIR = 'rgba(12,31,22,0.16)';

const X0 = 96;
const Y0 = 186;
const CW = 432;
const CH = 354;
const BAND = { y: 104, h: 64, w: 216 };

// 16th-note stamp times (frames) — mirrored by the marimba notes in soundtrack.json
const STAMPS = [0, 4, 7, 11, 14, 18, 21, 25];
const FOLD = [28, 32]; // the grid folds into the header band on beat 3

const CELLS = [
  { word: '인프라', group: '표준화', bg: INK, fg: PAPER, accent: BRAND, icon: 'rack' },
  { word: '수업', group: '표준화', bg: BRAND, fg: INK, accent: INK, icon: 'curve' },
  { word: '콘텐츠', group: '표준화', bg: PAPER, fg: INK, accent: BRAND, icon: 'docs' },
  { word: '보안', group: '관리', bg: DEEP, fg: PAPER, accent: GOLD, icon: 'lock' },
  { word: '녹화', group: '관리', bg: GOLD, fg: INK, accent: INK, icon: 'rec' },
  { word: '권한', group: '관리', bg: PAPER, fg: INK, accent: BRAND, icon: 'key' },
  { word: '데이터', group: '관리', bg: INK, fg: BRAND, accent: BRAND, icon: 'bars' },
  { word: 'ClassIn', group: 'ONE SYSTEM', bg: BRAND, fg: '#ffffff', accent: '#ffffff', icon: 'logo' },
];

const Icon = ({ kind, color }) => {
  const p = { fill: 'none', stroke: color, strokeWidth: 7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      {kind === 'rack' && [10, 36, 62].map((y) => (
        <g key={y}>
          <rect x={8} y={y} width={76} height={20} rx={5} {...p} />
          <circle cx={22} cy={y + 10} r={3.5} fill={color} />
        </g>
      ))}
      {kind === 'curve' && (
        <>
          <path d="M 10 70 H 84 M 30 84 V 8" {...p} strokeWidth={5} />
          <path d="M 12 14 Q 42 130 76 14" {...p} />
        </>
      )}
      {kind === 'docs' && (
        <>
          <rect x={22} y={6} width={58} height={70} rx={6} {...p} />
          <rect x={10} y={18} width={58} height={70} rx={6} {...p} fill={color === BRAND ? PAPER : 'none'} />
          <path d="M 22 40 H 56 M 22 54 H 50 M 22 68 H 44" {...p} strokeWidth={5} />
        </>
      )}
      {kind === 'lock' && (
        <>
          <path d="M 28 42 V 30 A 18 18 0 0 1 64 30 V 42" {...p} />
          <rect x={16} y={42} width={60} height={44} rx={10} fill={color} />
        </>
      )}
      {kind === 'rec' && (
        <>
          <circle cx={46} cy={46} r={36} {...p} />
          <circle cx={46} cy={46} r={20} fill={color} />
        </>
      )}
      {kind === 'key' && (
        <>
          <circle cx={28} cy={46} r={18} {...p} />
          <path d="M 46 46 H 86 M 72 46 V 62 M 84 46 V 58" {...p} />
        </>
      )}
      {kind === 'bars' && [10, 30, 50, 70].map((x, i) => <rect key={x} x={x} y={74 - (i + 1) * 16} width={14} height={(i + 1) * 16 + 10} rx={3} fill={color} />)}
    </svg>
  );
};

const cellRect = (k, fold) => {
  const gx = X0 + (k % 4) * CW;
  const gy = Y0 + Math.floor(k / 4) * CH;
  const bx = X0 + k * BAND.w;
  return {
    x: interpolate(fold, [0, 1], [gx, bx]),
    y: interpolate(fold, [0, 1], [gy, BAND.y]),
    w: interpolate(fold, [0, 1], [CW, BAND.w]),
    h: interpolate(fold, [0, 1], [CH, BAND.h]),
  };
};

const Cell = ({ k, frame }) => {
  const cell = CELLS[k];
  const t = frame - STAMPS[k];
  if (t < 0) return null;
  const fold = ip(frame, FOLD, [0, 1], EASE.inOut);
  const r = cellRect(k, fold);
  const stamp = interpolate(t, [0, 2, 4], [1.1, 0.97, 1], { extrapolateRight: 'clamp' });
  const flash = t < 2; // one stepped frame inverted for punch
  const bg = flash ? cell.fg : cell.bg;
  const fg = flash ? cell.bg : cell.fg;
  const detail = 1 - Math.min(1, fold * 3);
  const wordSize = interpolate(fold, [0, 1], [112, 26]);
  const pad = interpolate(fold, [0, 1], [28, 14]);
  const rise = interpolate(t, [0, 4], [26, 0], { extrapolateRight: 'clamp' });
  const isLogo = cell.icon === 'logo';

  return (
    <div
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        background: bg,
        boxShadow: cell.bg === PAPER ? `inset 0 0 0 2px ${INK}` : undefined,
        transform: `scale(${fold > 0 ? 1 : stamp}) rotate(${fold > 0 ? 0 : (1 - Math.min(1, t / 4)) * (k % 2 ? 2.5 : -2.5)}deg)`,
        overflow: 'hidden',
        color: fg,
      }}
    >
      {/* index + group */}
      <div style={{ position: 'absolute', left: pad, top: pad - 4, display: 'flex', gap: 12, alignItems: 'baseline', opacity: detail }}>
        <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 16 }}>0{k + 1}</span>
        <span style={{ fontFamily: isLogo ? FONT.mono : FONT.sans, fontWeight: 700, fontSize: isLogo ? 14 : 18, letterSpacing: isLogo ? '0.24em' : 0 }}>{cell.group}</span>
      </div>
      {/* icon */}
      {!isLogo && (
        <div style={{ position: 'absolute', right: pad, top: pad, opacity: detail }}>
          <Icon kind={cell.icon} color={flash ? cell.bg : cell.accent} />
        </div>
      )}
      {/* word / logo */}
      {isLogo ? (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${rise}px)` }}>
          <Img
            src={staticFile(flash ? 'classin-logo.png' : 'classin-logo-white.png')}
            style={{ width: interpolate(fold, [0, 1], [300, 120]), height: 'auto', borderRadius: 0 }}
          />
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: pad,
            bottom: interpolate(fold, [0, 1], [pad - 6, 14]),
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: wordSize,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            transform: `translateY(${rise}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          {cell.word}
        </div>
      )}
    </div>
  );
};

const StampWord = ({ at, frame, children, style }) => {
  const t = frame - at;
  if (t < 0) return <span style={{ ...style, visibility: 'hidden' }}>{children}</span>;
  const s = interpolate(t, [0, 2, 4], [1.28, 0.95, 1], { extrapolateRight: 'clamp' });
  return <span style={{ display: 'inline-block', transform: `scale(${s})`, transformOrigin: '50% 70%', ...style }}>{children}</span>;
};

const AssetStamp = ({ frame }) => {
  const t = frame - 42;
  if (t < 0) return null;
  const s = interpolate(t, [0, 3, 6], [1.8, 0.94, 1], { extrapolateRight: 'clamp' });
  const rot = interpolate(t, [0, 6, 40], [-44, -14, -6], { extrapolateRight: 'clamp' });
  const ring = 'ASSET · 본사 자산 · ASSET · 본사 자산 · ';
  return (
    <div style={{ position: 'absolute', left: 1440, top: 500, width: 280, height: 280, transform: `scale(${s}) rotate(${rot}deg)` }}>
      <svg width="280" height="280" viewBox="0 0 280 280">
        <defs>
          <path id="stamp-ring" d="M 140 140 m -104 0 a 104 104 0 1 1 208 0 a 104 104 0 1 1 -208 0" />
        </defs>
        <circle cx={140} cy={140} r={136} fill={GOLD} />
        <circle cx={140} cy={140} r={124} fill="none" stroke={INK} strokeWidth={3} />
        <circle cx={140} cy={140} r={82} fill="none" stroke={INK} strokeWidth={3} />
        <text fill={INK} fontFamily={FONT.mono} fontWeight={700} fontSize={19} letterSpacing="3">
          <textPath href="#stamp-ring">{ring}</textPath>
        </text>
        <text x={140} y={146} textAnchor="middle" fill={INK} fontFamily={FONT.sans} fontWeight={900} fontSize={54} letterSpacing="-2">
          본사
        </text>
        <text x={140} y={176} textAnchor="middle" fill={INK} fontFamily={FONT.mono} fontWeight={700} fontSize={16} letterSpacing="4">
          ASSET
        </text>
      </svg>
    </div>
  );
};

const VariationContent = () => {
  const frame = useCurrentFrame(); // stepped on twos by the <Freeze> wrapper
  const lines = ip(frame, [0, 4], [0, 1], EASE.out);
  const gridFade = 1 - ip(frame, FOLD, [0, 1]);
  const underline = ip(frame, [44, 50], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ background: frame < 2 ? '#ffffff' : PAPER, overflow: 'hidden' }}>
      {/* Swiss grid hairlines */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: gridFade }}>
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={`v${k}`} x1={X0 + k * CW} y1={Y0 - 40} x2={X0 + k * CW} y2={Y0 - 40 + (2 * CH + 80) * lines} stroke={HAIR} strokeWidth={1.5} />
        ))}
        {[0, 1, 2].map((k) => (
          <line key={`h${k}`} x1={X0 - 40} y1={Y0 + k * CH} x2={X0 - 40 + (4 * CW + 80) * lines} y2={Y0 + k * CH} stroke={HAIR} strokeWidth={1.5} />
        ))}
      </svg>

      {CELLS.map((_, k) => (
        <Cell key={k} k={k} frame={frame} />
      ))}

      {/* poster statement */}
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 318,
          fontFamily: FONT.sans,
          fontWeight: 900,
          fontSize: 176,
          lineHeight: 1.12,
          letterSpacing: '-0.055em',
          color: INK,
        }}
      >
        <div>
          <StampWord at={34} frame={frame}>모든</StampWord> <StampWord at={36} frame={frame}>수업이,</StampWord>
        </div>
        <div>
          <StampWord at={38} frame={frame}>본사의</StampWord>{' '}
          <StampWord at={42} frame={frame}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ color: BRAND }}>자산</span>으로.
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 10,
                  height: 16,
                  width: `${underline * 88}%`,
                  background: BRAND,
                  zIndex: -1,
                  opacity: 0.35,
                }}
              />
            </span>
          </StampWord>
        </div>
      </div>
      <AssetStamp frame={frame} />

      {/* editorial labels */}
      <div style={{ position: 'absolute', left: X0, bottom: 150, fontFamily: FONT.mono, fontWeight: 700, fontSize: 15, letterSpacing: '0.3em', color: INK, opacity: 0.55 }}>INTERLUDE</div>
      <div style={{ position: 'absolute', right: X0, bottom: 150, fontFamily: FONT.mono, fontWeight: 700, fontSize: 15, letterSpacing: '0.3em', color: INK, opacity: 0.55 }}>
        ONE SYSTEM · EVERY CLASS
      </div>
    </AbsoluteFill>
  );
};

export const VariationScene = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Freeze frame={Math.floor(frame / 2) * 2}>
        <VariationContent />
      </Freeze>
    </AbsoluteFill>
  );
};
