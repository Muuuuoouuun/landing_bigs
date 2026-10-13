import { Easing, interpolate } from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Light "trust" palette: cool off-white paper, deep navy type, and a soft pastel family
// (mint · sky · lavender · butter · peach). ClassIn green is the brand thread; each chapter
// leans on its own accent (표준화 green · 관리 blue · AI violet · 가치 amber/green).
export const C = {
  bg: '#F6F8FC', // page background
  bgDeep: '#EDF1F8',
  page: '#E3E8F1', // matte around the opening / closing card frame
  surface: '#FFFFFF', // cards and windows
  surfaceAlt: '#F4F7FB', // wells inside cards
  panel: 'rgba(255, 255, 255, 0.94)',
  ink: '#17233C', // primary type (deep navy)
  inkSoft: '#46566F',
  mute: 'rgba(23, 35, 60, 0.62)',
  dim: 'rgba(23, 35, 60, 0.38)',
  line: 'rgba(23, 35, 60, 0.13)',
  hair: 'rgba(23, 35, 60, 0.07)',
  green: '#1EA85A', // brand accent, calm enough for white backgrounds
  greenInk: '#147A43', // green type on white / mint
  greenSoft: '#5CC98E',
  greenDeep: '#BFE9D2', // pastel end of green gradients
  mint: '#E3F6EC',
  brand: '#04bc09', // logo green
  gold: '#E8A33D', // warm amber accent
  goldInk: '#A86A10',
  amberSoft: '#FFE9C6',
  blue: '#3F7CF0',
  blueInk: '#2556C4',
  blueSoft: '#8FB5FA',
  sky: '#E5EEFF',
  violet: '#7B6CF0',
  violetInk: '#5B4BD1',
  violetSoft: '#B9AEF9',
  lavender: '#EFEBFF',
  coral: '#EB7462',
  peach: '#FFEAE3',
  white: '#FFFFFF',
};

// Soft, cool shadows (navy-tinted, never black) for cards floating on the light page.
export const SHADOW = {
  soft: '0 10px 30px rgba(31, 52, 96, 0.10)',
  card: '0 24px 60px rgba(31, 52, 96, 0.12), 0 4px 14px rgba(31, 52, 96, 0.06)',
  float: '0 40px 100px rgba(31, 52, 96, 0.18), 0 8px 24px rgba(31, 52, 96, 0.08)',
};

// '#RRGGBB' → 'rgba(r, g, b, a)'
export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
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
