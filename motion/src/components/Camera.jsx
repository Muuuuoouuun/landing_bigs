import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, EASE, SHADOW, ip } from '../theme';
import { FONT } from '../fonts';
import { KineticText } from './Kinetic';

/*
 * Beat-locked coverage editing: a scene is laid out once (the "stage") and a shot list cuts
 * between framings of it — the wide composition and close-ups on a feature.
 *
 * shots: [{ at, cam?: { cx, cy, scale, sx?, sy? } }]
 *   at          first frame of the shot (scene-local)
 *   cam         close-up framing: stage point (cx, cy) is placed at screen (sx, sy) at `scale`;
 *               omit for the wide shot
 */
export const shotAt = (shots, frame) => {
  let k = 0;
  for (let i = 0; i < shots.length; i++) {
    if (frame >= shots[i].at) k = i;
  }
  return { ...shots[k], index: k, end: shots[k + 1] ? shots[k + 1].at : Infinity };
};

export const isCloseUp = (shots, frame) => Boolean(shotAt(shots, frame).cam);

/** Applies the current shot's framing; every cut lands with a small punch-in, then drifts slowly. */
export const Camera = ({ shots, children, drift = 0.03, punch = 0.025 }) => {
  const frame = useCurrentFrame();
  const shot = shotAt(shots, frame);
  const local = frame - shot.at;
  const cam = shot.cam;
  const span = Math.min(shot.end - shot.at, 56);
  const travel = ip(local, [0, span], [0, 1], EASE.linear);
  const land = shot.index > 0 ? ip(local, [0, 7], [punch, 0], EASE.out) : 0;
  const scale = (cam ? cam.scale : 1) * (1 + drift * travel * (cam ? 1 : 0.35) + land);
  const cx = cam ? cam.cx : 960;
  const cy = cam ? cam.cy : 540;
  const sx = cam?.sx ?? 960;
  const sy = cam?.sy ?? 540;
  return (
    <AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${sx - scale * cx}px, ${sy - scale * cy}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * Left-hand caption for a close-up shot: kicker · title (string or array of lines) ·
 * one-line description, over a soft wash so it reads on top of the zoomed stage.
 */
export const ShotCaption = ({ from, to, kicker, title, desc, color = C.green }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const lines = Array.isArray(title) ? title : [title];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(246,248,252,0.97) 0%, rgba(246,248,252,0.9) 30%, rgba(246,248,252,0) 46%)' }} />
      <div style={{ position: 'absolute', left: 140, top: 0, bottom: 0, width: 660, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 20, letterSpacing: '0.28em', color, opacity: ip(frame, [from, from + 3], [0, 1]) }}>{kicker}</div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 84, lineHeight: 1.1, letterSpacing: '-0.05em', color: C.ink, marginTop: 16 }}>
          {lines.map((line, k) => (
            <div key={line}>
              <KineticText text={line} mode="rise" delay={from + k * 2} stagger={0.7} duration={9} />
            </div>
          ))}
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 31, lineHeight: 1.45, letterSpacing: '-0.02em', color: C.mute, marginTop: 22 }}>
          <KineticText text={desc} mode="blur" delay={from + 3} stagger={0.25} duration={8} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Compact lower-third label for a close-up insert (no wash — the shot stays full bleed). */
export const LowerThird = ({ from, to, kicker, text, color = C.green }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const p = ip(frame, [from + 2, from + 9], [0, 1], EASE.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        bottom: 84,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 26px 14px 18px',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: SHADOW.card,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
        fontFamily: FONT.sans,
      }}
    >
      <span style={{ width: 5, height: 34, borderRadius: 3, background: color }} />
      <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 16, letterSpacing: '0.22em', color }}>{kicker}</span>
      <span style={{ fontWeight: 700, fontSize: 27, letterSpacing: '-0.02em', color: C.ink }}>{text}</span>
    </div>
  );
};
