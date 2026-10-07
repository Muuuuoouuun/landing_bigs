import { Easing, interpolate } from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Brand palette — matches the landing page (deep forest black + ClassIn green + gold accent)
export const C = {
  bg: '#030806',
  bgDeep: '#010302',
  panel: 'rgba(8, 22, 15, 0.78)',
  green: '#00df45',
  greenSoft: '#5dff8f',
  brand: '#04bc09',
  greenDeep: '#0b3d2b',
  gold: '#e6b800',
  white: '#f3f7f4',
  mute: 'rgba(243, 247, 244, 0.64)',
  dim: 'rgba(243, 247, 244, 0.34)',
  line: 'rgba(0, 223, 69, 0.3)',
  hair: 'rgba(255, 255, 255, 0.1)',
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.87, 0, 0.13, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  smooth: Easing.bezier(0.45, 0, 0.55, 1),
  linear: Easing.linear,
};

// Clamped interpolate with an ease — the workhorse for every motion in the reel.
export const ip = (frame, input, output, easing = EASE.out) =>
  interpolate(frame, input, output, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
