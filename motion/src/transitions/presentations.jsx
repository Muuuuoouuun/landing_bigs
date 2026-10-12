import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { C, EASE, ip } from '../theme';

const lin = (p, input, output) => ip(p, input, output, EASE.linear);

/* Zoom-through with blur: outgoing rushes past the camera, incoming settles in. */
const ZoomBlur = ({ children, presentationDirection, presentationProgress: p }) => {
  const entering = presentationDirection === 'entering';
  const style = entering
    ? {
        opacity: lin(p, [0.3, 0.75], [0, 1]),
        transform: `scale(${interpolate(p, [0, 1], [0.8, 1])})`,
        filter: p < 0.98 ? `blur(${lin(p, [0.3, 1], [16, 0])}px)` : undefined,
      }
    : {
        opacity: lin(p, [0.3, 0.7], [1, 0]),
        transform: `scale(${interpolate(p, [0, 1], [1, 1.7])})`,
        filter: `blur(${lin(p, [0, 0.7], [0, 24])}px)`,
      };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
export const zoomBlur = () => ({ component: ZoomBlur, props: {} });

/* Diagonal light wipe with a glowing leading edge. */
const LightWipe = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{ filter: `brightness(${lin(p, [0, 1], [1, 0.4])})` }}>{children}</AbsoluteFill>;
  }
  const skew = 260;
  const x = interpolate(p, [0, 1], [-skew, 1920 + 40]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(0 0, ${x + skew}px 0, ${x}px 100%, 0 100%)` }}>{children}</AbsoluteFill>
      {p < 1 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <line x1={x + skew} y1={-10} x2={x} y2={1090} stroke="#fff" strokeWidth={4} style={{ filter: `drop-shadow(0 0 14px ${C.green}) drop-shadow(0 0 30px ${C.green})` }} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
export const lightWipe = () => ({ component: LightWipe, props: {} });

/* Vertical whip-pan: both scenes travel upward with motion smear. */
const WhipUp = ({ children, presentationDirection, presentationProgress: p }) => {
  const entering = presentationDirection === 'entering';
  const blur = Math.sin(p * Math.PI) * 18;
  const y = entering ? interpolate(p, [0, 1], [1080, 0]) : interpolate(p, [0, 1], [0, -1080]);
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${y}px) scaleY(${1 + Math.sin(p * Math.PI) * 0.06})`,
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
export const whipUp = () => ({ component: WhipUp, props: {} });

/* Dip through black. */
const Dip = ({ children, presentationDirection, presentationProgress: p }) => {
  const opacity = presentationDirection === 'entering' ? lin(p, [0.5, 1], [0, 1]) : lin(p, [0, 0.5], [1, 0]);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
export const dip = () => ({ component: Dip, props: {} });

/* Iris: the incoming scene opens through a circle growing from the centre, with a glowing rim. */
const Iris = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const { x = 960, y = 500 } = passedProps;
  const r = 1260 * p * p; // quadratic: visibly opens across the whole transition
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>{children}</AbsoluteFill>
      {p < 1 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <circle cx={x} cy={y} r={r} fill="none" stroke={C.greenSoft} strokeWidth={5} style={{ filter: `drop-shadow(0 0 12px ${C.green}) drop-shadow(0 0 28px ${C.green})` }} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
export const iris = (props = {}) => ({ component: Iris, props });
