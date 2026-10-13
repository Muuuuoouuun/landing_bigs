import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { C, EASE, alpha, ip } from '../theme';

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

/* Diagonal wipe with a soft tinted leading edge (the outgoing scene stays bright underneath). */
const LightWipe = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const { color = C.violet } = passedProps;
  const skew = 260;
  const x = interpolate(p, [0, 1], [-skew, 1920 + 40]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `polygon(0 0, ${x + skew}px 0, ${x}px 100%, 0 100%)` }}>{children}</AbsoluteFill>
      {p < 1 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <line x1={x + skew} y1={-10} x2={x} y2={1090} stroke={alpha(color, 0.16)} strokeWidth={46} style={{ filter: 'blur(12px)' }} />
          <line x1={x + skew} y1={-10} x2={x} y2={1090} stroke={color} strokeWidth={3} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
export const lightWipe = (props = {}) => ({ component: LightWipe, props });

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

/* Dip through the page colour (a soft fade through white on the light theme). */
const Dip = ({ children, presentationDirection, presentationProgress: p }) => {
  const opacity = presentationDirection === 'entering' ? lin(p, [0.5, 1], [0, 1]) : lin(p, [0, 0.5], [1, 0]);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
export const dip = () => ({ component: Dip, props: {} });

/* Iris: the incoming scene opens through a circle growing from the centre, with a soft tinted rim. */
const Iris = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const { x = 960, y = 500, color = C.violet } = passedProps;
  const r = 1260 * p * p; // quadratic: visibly opens across the whole transition
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>{children}</AbsoluteFill>
      {p < 1 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <circle cx={x} cy={y} r={r} fill="none" stroke={alpha(color, 0.18)} strokeWidth={40} style={{ filter: 'blur(10px)' }} />
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={4} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
export const iris = (props = {}) => ({ component: Iris, props });
