import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { noise2D } from '@remotion/noise';
import { C } from '../theme';

export const BaseBackground = ({ glowX = 50, glowY = 45, glow = 0.16, color = '0,223,69' }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 60% 55% at ${glowX}% ${glowY}%, rgba(${color},${glow}) 0%, rgba(${color},0) 70%), linear-gradient(180deg, #04100a 0%, ${C.bg} 55%, ${C.bgDeep} 100%)`,
    }}
  />
);

/** Infinite perspective floor grid scrolling toward camera. */
export const GridFloor = ({ opacity = 0.5, speed = 6, tilt = 72, top = 52 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: `50% ${top - 12}%`, opacity, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          left: '-60%',
          width: '220%',
          top: `${top}%`,
          height: '140%',
          transformOrigin: '50% 0%',
          transform: `rotateX(${tilt}deg)`,
          backgroundImage: `linear-gradient(${C.line} 1.5px, transparent 1.5px), linear-gradient(90deg, ${C.line} 1.5px, transparent 1.5px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0px ${frame * speed}px`,
          maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 60%, transparent 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Flat technical grid with radial falloff. */
export const GridPlane = ({ opacity = 0.35, size = 80, drift = 0.4 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `linear-gradient(${C.hair} 1px, transparent 1px), linear-gradient(90deg, ${C.hair} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${frame * drift}px ${frame * drift * 0.5}px`,
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, #000 30%, transparent 85%)',
      }}
    />
  );
};

/** Floating bokeh dust — depth-of-field particles. */
export const Dust = ({ count = 46, seed = 'dust', opacity = 0.6, speed = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      {Array.from({ length: count }).map((_, i) => {
        const depth = random(`${seed}-d-${i}`);
        const size = 2 + depth * 9;
        const bx = random(`${seed}-x-${i}`) * 1920;
        const by = random(`${seed}-y-${i}`) * 1080;
        const x = bx + noise2D(`${seed}-nx-${i}`, frame * 0.008 * speed, i) * 120 + frame * depth * 0.6 * speed;
        const y = by + noise2D(`${seed}-ny-${i}`, frame * 0.008 * speed, i) * 90 - frame * (0.3 + depth) * speed;
        const wy = ((y % 1080) + 1080) % 1080;
        const wx = ((x % 1920) + 1920) % 1920;
        const tw = 0.4 + 0.6 * Math.abs(noise2D(`${seed}-t-${i}`, frame * 0.05, 0));
        const gold = random(`${seed}-c-${i}`) > 0.85;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: wx,
              top: wy,
              width: size,
              height: size,
              borderRadius: '50%',
              background: gold ? C.gold : C.greenSoft,
              opacity: tw * (0.25 + depth * 0.6),
              filter: `blur(${(1 - depth) * 3 + (depth > 0.85 ? 3 : 0)}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Radial speed lines bursting from a center. */
export const SpeedLines = ({ cx = 960, cy = 540, count = 64, progress = 1, opacity = 1, seed = 'sl', color = C.green }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: count }).map((_, i) => {
          const a = (i / count) * Math.PI * 2 + random(`${seed}-a-${i}`) * 0.1;
          const r0 = 120 + random(`${seed}-r-${i}`) * 260 + progress * 600;
          const len = 80 + random(`${seed}-l-${i}`) * 420 * progress;
          const flick = random(`${seed}-f-${i}-${Math.floor(frame / 2)}`) > 0.25 ? 1 : 0.2;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r0}
              y1={cy + Math.sin(a) * r0}
              x2={cx + Math.cos(a) * (r0 + len)}
              y2={cy + Math.sin(a) * (r0 + len)}
              stroke={random(`${seed}-c-${i}`) > 0.8 ? '#ffffff' : color}
              strokeWidth={1 + random(`${seed}-w-${i}`) * 2.5}
              strokeLinecap="round"
              opacity={flick * (0.25 + random(`${seed}-o-${i}`) * 0.6)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
