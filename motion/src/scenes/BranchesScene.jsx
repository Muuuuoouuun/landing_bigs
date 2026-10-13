import React, { useMemo } from 'react';
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { C, EASE, SHADOW, alpha, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust } from '../components/Background';
import { Flash, LensStreak, Shake, Shockwave, SliceGlitch, rgbSplit } from '../components/Fx';
import { KineticText, RollingNumber } from '../components/Kinetic';

export const BRANCHES_DURATION = 110;
const IMPACT = 58;
const SLAM = 78;

const COLS = 16;
const ROWS = 8;
const SX = 104;
const SY = 96;
const NODE_W = 60;
const NODE_H = 40;
const CHAOS_COLORS = [C.gold, C.coral, '#8A97AD', C.violet, C.blue];
const AREAS = ['강남', '분당', '대치', '목동', '송도', '일산', '해운대', '수성', '둔산', '광교', '평촌', '중계'];

const useNodes = () =>
  useMemo(() => {
    const out = [];
    const cx = 960;
    const cy = 540;
    const x0 = cx - ((COLS - 1) * SX) / 2;
    const y0 = cy - ((ROWS - 1) * SY) / 2;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const gx = x0 + c * SX;
        const gy = y0 + r * SY;
        const dist = Math.hypot(gx - cx, gy - cy) / Math.hypot(x0 - cx, y0 - cy);
        out.push({
          i,
          gx,
          gy,
          dist,
          cx: -140 + random(`ncx-${i}`) * 2200,
          cy: -80 + random(`ncy-${i}`) * 1240,
          depth: 0.5 + random(`nd-${i}`) * 1.15,
          rot: (random(`nr-${i}`) - 0.5) * 64,
          appear: 3 + random(`na-${i}`) * 26,
          color: CHAOS_COLORS[Math.floor(random(`nc-${i}`) * CHAOS_COLORS.length)],
          bars: [25 + random(`b0-${i}`) * 70, 15 + random(`b1-${i}`) * 80, 10 + random(`b2-${i}`) * 85],
          label: i % 11 === 3 ? AREAS[(i / 11) % AREAS.length | 0] : null,
        });
      }
    }
    return out;
  }, []);

const BranchNode = ({ status, border, bars, glow, label, labelOpacity }) => (
  <div
    style={{
      position: 'relative',
      width: NODE_W,
      height: NODE_H,
      borderRadius: 7,
      border: `1.5px solid ${border}`,
      background: C.surface,
      boxShadow: glow > 0.01 ? `${SHADOW.soft}, 0 0 0 ${5 * glow}px ${alpha(C.green, 0.22 * glow)}` : SHADOW.soft,
      padding: '7px 8px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: status, flexShrink: 0 }} />
      <div style={{ height: 4, width: `${bars[0]}%`, background: 'rgba(23,35,60,0.28)', borderRadius: 2 }} />
    </div>
    <div style={{ height: 4, width: `${bars[1]}%`, background: C.line, borderRadius: 2 }} />
    <div style={{ height: 4, width: `${bars[2]}%`, background: C.line, borderRadius: 2 }} />
    {label && (
      <div
        style={{
          position: 'absolute',
          top: -26,
          left: 0,
          fontFamily: FONT.sans,
          fontWeight: 600,
          fontSize: 15,
          color: C.mute,
          whiteSpace: 'nowrap',
          opacity: labelOpacity,
        }}
      >
        {label}
      </div>
    )}
  </div>
);

const ORDER_BARS = [62, 78, 46];

const NodeField = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = useNodes();
  const lineStart = IMPACT + 6;

  return (
    <AbsoluteFill>
      {/* HQ → branch propagation lines */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="hqLine" cx="960" cy="540" r="900" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.green} stopOpacity="0.7" />
            <stop offset="1" stopColor={C.greenSoft} stopOpacity="0.15" />
          </radialGradient>
        </defs>
        {nodes.map((n) => {
          const t0 = lineStart + n.dist * 14;
          const p = ip(frame, [t0, t0 + 9], [0, 1], EASE.out);
          if (p <= 0) return null;
          const x2 = 960 + (n.gx - 960) * p;
          const y2 = 540 + (n.gy - 540) * p;
          return <line key={n.i} x1={960} y1={540} x2={x2} y2={y2} stroke="url(#hqLine)" strokeWidth={1.1} opacity={0.75} />;
        })}
      </svg>

      {nodes.map((n) => {
        const appear = spring({ frame: frame - n.appear, fps, config: { damping: 12, stiffness: 180, mass: 0.5 } });
        if (frame < n.appear) return null;
        const t = spring({
          frame: frame - IMPACT - n.dist * 7,
          fps,
          config: { damping: 14, stiffness: 150, mass: 0.7 },
        });
        const chaosX = n.cx + noise2D(`dx-${n.i}`, frame * 0.02, 0) * 40;
        const chaosY = n.cy + noise2D(`dy-${n.i}`, frame * 0.02, 1) * 30;
        const shiver = ip(frame, [36, IMPACT], [0, 7], EASE.in);
        const jx = noise2D(`jx-${n.i}`, frame * 0.6, 3) * shiver * (1 - t);
        const jy = noise2D(`jy-${n.i}`, frame * 0.6, 4) * shiver * (1 - t);
        const x = chaosX + (n.gx - chaosX) * t + jx;
        const y = chaosY + (n.gy - chaosY) * t + jy;
        const scale = (n.depth + (1 - n.depth) * t) * appear;
        const rot = n.rot * (1 - t) + noise2D(`rr-${n.i}`, frame * 0.03, 0) * 10 * (1 - t);
        const dof = Math.abs(n.depth - 1) * 4 * (1 - t);
        const ordered = t > 0.55;
        const reach = lineStart + n.dist * 14 + 8;
        const pulse = ip(frame, [reach, reach + 3], [0, 1]) * ip(frame, [reach + 3, reach + 16], [1, 0.25]);
        const bars = n.bars.map((b, k) => b + (ORDER_BARS[k] - b) * Math.min(1, t));

        return (
          <div
            key={n.i}
            style={{
              position: 'absolute',
              left: x - NODE_W / 2,
              top: y - NODE_H / 2,
              transform: `scale(${scale}) rotate(${rot}deg)`,
              filter: dof > 0.4 ? `blur(${dof}px)` : undefined,
              opacity: ordered ? 1 : 0.55 + 0.45 * Math.min(1, n.depth),
            }}
          >
            <BranchNode
              status={ordered ? C.green : n.color}
              border={ordered ? alpha(C.green, 0.4 + pulse * 0.6) : `${n.color}88`}
              bars={bars}
              glow={pulse}
              label={n.label}
              labelOpacity={1 - t}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const BranchesScene = () => {
  const frame = useCurrentFrame();
  const glitch = ip(frame, [44, IMPACT - 1], [0, 1], EASE.in) * (frame < IMPACT ? 1 : 0);
  const camera =
    frame < IMPACT ? ip(frame, [0, IMPACT], [1.08, 1.0], EASE.smooth) : ip(frame, [IMPACT, BRANCHES_DURATION], [0.97, 1.07], EASE.smooth);
  const scan = ip(frame, [0, 9], [0, 1], EASE.out);
  const scanOpacity = ip(frame, [8, 18], [1, 0]);
  const leftShade = ip(frame, [2, 14], [0, 1]) * ip(frame, [IMPACT - 2, IMPACT], [1, 0]);
  const centerShade = ip(frame, [SLAM - 10, SLAM], [0, 1]);
  const branchCount = ip(frame, [4, 54], [1, 128], EASE.inOut);
  const isChaosWord = (i) => i >= 4 && i <= 6;
  const slamSplit = ip(frame, [SLAM, SLAM + 14], [16, 0], EASE.out) * (frame >= SLAM ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowY={50} glow={frame < IMPACT ? 0.06 : 0.2} />
      <Dust count={36} seed="b-dust" opacity={0.45} />

      <Shake
        events={[
          { at: IMPACT, amp: 30, dur: 20 },
          { at: SLAM, amp: 16, dur: 14 },
        ]}
      >
        <AbsoluteFill style={{ transform: `scale(${camera})` }}>
          <SliceGlitch amount={glitch} seed="branches">
            <NodeField />
          </SliceGlitch>
        </AbsoluteFill>

        {/* left legibility shade for the problem statement */}
        <AbsoluteFill
          style={{
            opacity: leftShade,
            background: 'linear-gradient(90deg, rgba(246,248,252,0.94) 0%, rgba(246,248,252,0.8) 38%, rgba(246,248,252,0) 70%)',
          }}
        />
        {/* center shade behind the slam headline */}
        <AbsoluteFill
          style={{
            opacity: centerShade,
            background: 'radial-gradient(ellipse 46% 34% at 50% 52%, rgba(246,248,252,0.94) 0%, rgba(246,248,252,0.65) 55%, rgba(246,248,252,0) 100%)',
          }}
        />

        {/* HQ core bloom */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 520,
              height: 520,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(92,201,142,0.55) 0%, rgba(92,201,142,0.16) 35%, rgba(92,201,142,0) 70%)',
              opacity: ip(frame, [IMPACT + 2, IMPACT + 10], [0, 1]) * ip(frame, [SLAM, SLAM + 20], [1, 0.55]),
              transform: `scale(${ip(frame, [IMPACT + 2, IMPACT + 14], [0.2, 1], EASE.back)})`,
            }}
          />
        </AbsoluteFill>

        {/* --- PROBLEM: chaos copy --- */}
        {frame < IMPACT + 2 && (
          <AbsoluteFill style={{ padding: '0 150px', justifyContent: 'center', textShadow: rgbSplit(glitch * 9) }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 22, letterSpacing: '0.32em', color: C.goldInk, marginBottom: 28 }}>
              <KineticText text="SCALING WITHOUT A STANDARD" mode="scramble" delay={4} stagger={0.6} duration={14} exitAt={50} exitMode="scatter" />
            </div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 96, lineHeight: 1.12, letterSpacing: '-0.04em', color: C.ink }}>
              <KineticText text="지점이 늘어날수록," mode="rise" delay={7} stagger={1.6} duration={14} exitAt={51} exitMode="scatter" />
              <br />
              <KineticText
                text="수업은 제각각이 됩니다."
                mode="rise"
                delay={17}
                stagger={1.6}
                duration={14}
                exitAt={52}
                exitMode="scatter"
                charColor={(i) => (isChaosWord(i) ? C.coral : undefined)}
                jitter={(f, i) => (isChaosWord(i) ? ip(f, [22, 54], [1.5, 13], EASE.in) : ip(f, [44, 56], [0, 4], EASE.in))}
              />
            </div>
          </AbsoluteFill>
        )}

        {/* branch counter */}
        {frame < IMPACT + 2 && (
          <div
            style={{
              position: 'absolute',
              right: 150,
              bottom: 170,
              textAlign: 'right',
              opacity: ip(frame, [4, 12], [0, 1]) * ip(frame, [50, IMPACT], [1, 0]),
              textShadow: rgbSplit(glitch * 7),
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 168, lineHeight: 1, color: C.ink, letterSpacing: '-0.02em' }}>
              <RollingNumber value={branchCount} digits={3} />
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 20, letterSpacing: '0.4em', color: C.mute, marginTop: 12 }}>
              BRANCHES · 지점
            </div>
          </div>
        )}

        {/* --- SOLUTION: one standard --- */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 600,
              fontSize: 60,
              color: C.inkSoft,
              letterSpacing: '-0.02em',
              marginBottom: 6,
              opacity: frame >= IMPACT + 8 ? 1 : 0,
            }}
          >
            <KineticText text="모든 지점에," mode="rise" delay={IMPACT + 10} stagger={1.4} duration={12} />
          </div>
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: 220,
              lineHeight: 1.05,
              letterSpacing: '-0.055em',
              color: C.ink,
              textShadow: rgbSplit(slamSplit),
              opacity: frame >= SLAM ? 1 : 0,
            }}
          >
            <KineticText
              text="하나의 기준."
              mode="slam"
              delay={SLAM}
              stagger={1.2}
              charColor={(i) => (i === 6 ? C.green : undefined)}
            />
          </div>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 22,
              color: C.greenInk,
              letterSpacing: `${ip(frame, [SLAM + 8, SLAM + 34], [0.2, 0.62])}em`,
              marginTop: 26,
              opacity: frame >= SLAM + 8 ? 1 : 0,
            }}
          >
            <KineticText text="ONE STANDARD · EVERY BRANCH" mode="blur" delay={SLAM + 8} stagger={0.35} duration={10} />
          </div>
        </AbsoluteFill>
      </Shake>

      {/* opening scanline */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: scanOpacity }}>
        <div
          style={{
            width: `${scan * 100}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.greenSoft}, ${C.green}, ${C.greenSoft}, transparent)`,
            boxShadow: `0 0 18px ${alpha(C.green, 0.35)}`,
          }}
        />
      </AbsoluteFill>

      <Shockwave at={IMPACT} maxR={1100} dur={24} />
      <Shockwave at={SLAM} maxR={700} dur={20} rings={2} color={C.blueSoft} />
      <LensStreak at={IMPACT} />
      <LensStreak at={SLAM} y={560} dur={14} />
      <Flash at={IMPACT} duration={9} peak={0.6} />
      <Flash at={SLAM} duration={5} peak={0.4} color={C.white} />
    </AbsoluteFill>
  );
};
