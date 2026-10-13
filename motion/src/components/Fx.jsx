import React from 'react';
import { AbsoluteFill, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import { noise2D } from '@remotion/noise';
import { C, EASE, SHADOW, ip } from '../theme';

/** Fine animated film grain: 4 noise tiles cycled with random offsets, kept faint on the light page. */
export const Grain = ({ opacity = 0.16 }) => {
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
      <AbsoluteFill style={{ ...layer, opacity: 0.025, mixBlendMode: 'multiply' }} />
    </>
  );
};

/** Soft, cool light falloff toward the corners. */
export const Vignette = ({ strength = 0.07 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(31,52,96,${strength}) 100%)`,
    }}
  />
);

/**
 * Light-theme letterbox: the film sits in a rounded card on a pale matte, opens to full
 * bleed on the first impact and closes back into a card at the end.
 * The children always render in the same slot, so nothing remounts as the matte opens.
 */
export const FrameMatte = ({ inset, children }) => {
  const on = inset > 0.5;
  const ix = inset * 0.5;
  const radius = Math.min(32, inset * 0.3);
  return (
    <AbsoluteFill style={{ background: C.page }}>
      {on && <div style={{ position: 'absolute', left: ix, right: ix, top: inset, bottom: inset, borderRadius: radius, boxShadow: SHADOW.float }} />}
      <AbsoluteFill style={{ clipPath: on ? `inset(${inset}px ${ix}px round ${radius}px)` : undefined }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Flash = ({ at, duration = 7, peak = 0.85, color = '#ffffff' }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + duration], [0, peak, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.out,
  });
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: 'none' }} />;
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

/** Expanding ring(s) — a soft impact ripple. */
export const Shockwave = ({ at, x = 960, y = 540, maxR = 900, dur = 22, rings = 3, color = C.greenSoft, peak = 0.7 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {Array.from({ length: rings }).map((_, k) => {
          const f = frame - at - k * 3;
          if (f < 0 || f > dur) return null;
          const r = ip(f, [0, dur], [10, maxR * (1 - k * 0.18)], EASE.out);
          const o = ip(f, [0, dur], [peak, 0], EASE.smooth);
          const w = ip(f, [0, dur], [7, 0.5], EASE.out);
          return <circle key={k} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={w} opacity={o} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Horizontal light ray that blooms on an impact — tinted so it reads on a light page. */
export const LensStreak = ({ at, y = 540, x = 960, dur = 18, width = 1700, color = '110,160,250', core = '92,201,142' }) => {
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
  };
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          ...base,
          top: y - 40,
          height: 80,
          opacity: o * 0.3,
          filter: 'blur(22px)',
          background: `linear-gradient(90deg, transparent, rgba(${color},0.7) 35%, rgba(${core},0.8) 50%, rgba(${color},0.7) 65%, transparent)`,
        }}
      />
      <div
        style={{
          ...base,
          top: y - 1.5,
          height: 3,
          opacity: o * 0.85,
          filter: 'blur(1px)',
          background: `linear-gradient(90deg, transparent, rgba(${color},0.8) 30%, rgba(${core},1) 50%, rgba(${color},0.8) 70%, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Text-shadow double exposure in pastel mint / sky (a soft take on an RGB split). */
export const rgbSplit = (px) =>
  px > 0.15 ? `${px}px 0 rgba(92,201,142,0.5), ${-px}px 0 rgba(120,160,250,0.5)` : undefined;

/** HUD corner brackets around a box. */
export const Brackets = ({ x, y, w, h, len = 26, color = C.blueSoft, opacity = 1, thickness = 2 }) => {
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
