import React from 'react';
import { AbsoluteFill, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { noise2D } from '@remotion/noise';
import { C, EASE, ip } from '../theme';

/** Animated 35mm-style film grain: 4 noise tiles cycled with random offsets. */
export const Grain = ({ opacity = 0.32 }) => {
  const frame = useCurrentFrame();
  const tile = staticFile(`grain/grain-${frame % 4}.png`);
  const x = Math.floor(random(`gx-${frame}`) * 384);
  const y = Math.floor(random(`gy-${frame}`) * 384);
  const layer = {
    backgroundImage: `url(${tile})`,
    backgroundPosition: `${x}px ${y}px`,
    backgroundSize: '384px 384px',
    pointerEvents: 'none',
  };
  return (
    <>
      <AbsoluteFill style={{ ...layer, opacity, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ ...layer, opacity: 0.045, mixBlendMode: 'screen' }} />
    </>
  );
};

export const Vignette = ({ strength = 0.72 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 52%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const Letterbox = ({ size }) =>
  size > 0.5 ? (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size, background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size, background: '#000' }} />
    </AbsoluteFill>
  ) : null;

export const Flash = ({ at, duration = 7, peak = 0.85, color = '#ffffff' }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + duration], [0, peak, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.out,
  });
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none' }} />;
};

/** Camera shake driven by simplex noise; each event decays out. */
export const Shake = ({ events, children, style }) => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  let r = 0;
  events.forEach(({ at, amp = 20, dur = 16 }, k) => {
    if (frame < at) return;
    const d = ip(frame, [at, at + dur], [1, 0], EASE.out);
    x += noise2D(`shx-${k}`, frame * 0.9, 0) * amp * d;
    y += noise2D(`shy-${k}`, frame * 0.9, 1) * amp * d;
    r += noise2D(`shr-${k}`, frame * 0.6, 2) * amp * 0.04 * d;
  });
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)`, ...style }}>{children}</AbsoluteFill>
  );
};

/** Expanding ring(s) — impact shockwave. */
export const Shockwave = ({ at, x = 960, y = 540, maxR = 900, dur = 22, rings = 3, color = C.green }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {Array.from({ length: rings }).map((_, k) => {
          const f = frame - at - k * 3;
          if (f < 0 || f > dur) return null;
          const r = ip(f, [0, dur], [10, maxR * (1 - k * 0.18)], EASE.out);
          const o = ip(f, [0, dur], [0.9, 0], EASE.smooth);
          const w = ip(f, [0, dur], [10, 0.5], EASE.out);
          return <circle key={k} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={w} opacity={o} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Anamorphic horizontal lens streak that blooms on an impact. */
export const LensStreak = ({ at, y = 540, x = 960, dur = 18, width = 1700, color = '120,255,170' }) => {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < -1 || f > dur) return null;
  const o = interpolate(f, [-1, 1, dur], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sx = ip(f, [0, dur], [0.35, 1.25], EASE.out);
  const base = {
    position: 'absolute',
    left: x - width / 2,
    width,
    transform: `scaleX(${sx})`,
    pointerEvents: 'none',
    mixBlendMode: 'screen',
  };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          ...base,
          top: y - 40,
          height: 80,
          opacity: o * 0.35,
          filter: 'blur(22px)',
          background: `linear-gradient(90deg, transparent, rgba(${color},0.8) 35%, #fff 50%, rgba(${color},0.8) 65%, transparent)`,
        }}
      />
      <div
        style={{
          ...base,
          top: y - 2,
          height: 4,
          opacity: o,
          filter: 'blur(1.5px)',
          background: `linear-gradient(90deg, transparent, rgba(${color},0.9) 30%, #fff 50%, rgba(${color},0.9) 70%, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Text-shadow chromatic aberration (cheap RGB split). */
export const rgbSplit = (px) =>
  px > 0.15 ? `${px}px 0 rgba(255,40,90,0.85), ${-px}px 0 rgba(0,230,255,0.85)` : undefined;

/** HUD corner brackets around a box. */
export const Brackets = ({ x, y, w, h, len = 26, color = C.green, opacity = 1, thickness = 2 }) => {
  const s = { position: 'absolute', borderColor: color, borderStyle: 'solid', width: len, height: len, opacity };
  return (
    <>
      <div style={{ ...s, left: x, top: y, borderWidth: `${thickness}px 0 0 ${thickness}px` }} />
      <div style={{ ...s, left: x + w - len, top: y, borderWidth: `${thickness}px ${thickness}px 0 0` }} />
      <div style={{ ...s, left: x, top: y + h - len, borderWidth: `0 0 ${thickness}px ${thickness}px` }} />
      <div style={{ ...s, left: x + w - len, top: y + h - len, borderWidth: `0 ${thickness}px ${thickness}px 0` }} />
    </>
  );
};

/** Horizontal slice-displacement glitch for any block of content. */
export const SliceGlitch = ({ amount, slices = 9, seed = 'g', children, height = 1080 }) => {
  const frame = useCurrentFrame();
  if (amount < 0.02) return <AbsoluteFill>{children}</AbsoluteFill>;
  const step = Math.floor(frame / 2);
  return (
    <AbsoluteFill>
      {Array.from({ length: slices }).map((_, k) => {
        const top = (k / slices) * 100;
        const bottom = 100 - ((k + 1) / slices) * 100;
        const r = random(`${seed}-${k}-${step}`) - 0.5;
        const dx = Math.abs(r) > 0.18 ? r * amount * 220 : 0;
        return (
          <AbsoluteFill
            key={k}
            style={{
              clipPath: `inset(${top}% 0 ${bottom}% 0)`,
              transform: `translateX(${dx}px)`,
              height,
            }}
          >
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
