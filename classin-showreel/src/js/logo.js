// The official ClassIn wordmark. Brand rule: only move, scale, fade or mask it — never redraw
// or recolour. We use pre-scaled copies of the official PNG so it is pixel-exact at rest, and the
// traced glyph geometry (logo-paths.js) only to know *where* things are (i-dot, baseline, glyphs).
import { GLYPHS } from '../assets/logo-paths.js';
import { h, bezier } from './core.js';

const SRC_W = 5427, CROP_X = 5, CROP_Y = 8; // official PNG trimmed to its bbox (see render/README)
export const LOGO_ASPECT = 1413 / 5427;
const SIZES = [900, 820, 1800, 240, 132];

// glyph geometry in local px for a logo rendered `w` wide
export function logoGeometry(w) {
  const k = w / SRC_W;
  const X = x => (x * 2 - CROP_X) * k, Y = y => (y * 2 - CROP_Y) * k;
  const box = n => { const [x0, y0, x1, y1] = GLYPHS[n].box; return { x0: X(x0), y0: Y(y0), x1: X(x1), y1: Y(y1) }; };
  const d = box('iDot');
  // the i-dot is a parallelogram slanting down to the right (~20°)
  const iDot = [[d.x0, Y(4.7)], [d.x1, Y(49.5)], [d.x1, Y(117.4)], [d.x0, Y(75.7)]];
  const C = box('C'), n = box('n'), stem = box('iStem');
  return {
    w, h: w * LOGO_ASPECT,
    iDot,
    iDotC: [(d.x0 + d.x1) / 2, (Y(4.7) + Y(117.4)) / 2],
    stemTop: [(stem.x0 + stem.x1) / 2, stem.y0],
    left: C.x0, right: n.x1,
    baseline: box('l').y1,
    xOf: name => box(name),
  };
}

export function createLogo(w) {
  const size = SIZES.includes(w) ? w : SIZES.find(s => s >= w) || 1800;
  const el = h('div', 'logo obj');
  el.style.width = `${w}px`;
  el.style.height = `${(w * LOGO_ASPECT).toFixed(2)}px`;
  const img = h('img');
  img.src = `assets/logo-${size}.png`;
  img.alt = 'ClassIn';
  img.style.width = '100%';
  img.style.height = '100%';
  img.draggable = false;
  el.appendChild(img);
  const geo = logoGeometry(w);
  return {
    el, img, geo,
    // reveal everything left of x with an edge slanted like the i-dot cut; feather in px
    reveal(x) {
      if (x >= geo.w + 60) { el.style.clipPath = 'none'; return; }
      const s = geo.h * 0.36; // slant offset (top leans right)
      el.style.clipPath = `polygon(-20px -20px, ${x + s}px -20px, ${x - s}px ${geo.h + 20}px, -20px ${geo.h + 20}px)`;
    },
  };
}

/*
  The brand arrow — our own drawing, not part of the logo: it runs under "Class" and hooks up
  the i's slant into the dot (Class → In). Same sampling everywhere so shapes can morph.
  left: x where it starts, stemX: x of the i stem, base: y of the run, dot: [x, y] of the i-dot.
*/
export function arrowShape(left, stemX, base, dot) {
  const span = stemX - left;
  return [
    ...bezier([left, base, 0], [left + span * 0.4, base + 6, 0], [stemX - span * 0.33, base + 8, 0], [stemX - span * 0.1, base - 6, 0], 40),
    ...bezier([stemX - span * 0.1, base - 6, 0], [stemX + span * 0.015, base - 14, 0], [dot[0] - span * 0.03, dot[1] + (base - dot[1]) * 0.55, 0], [dot[0], dot[1], 0], 30).slice(1),
  ];
}

// the arrow for the official logo placed at (lx, ly)
export function logoArrow(lx, ly, g, P) {
  const base = ly + g.h + (P ? 30 : 34);
  const stem = g.xOf('iStem');
  return arrowShape(lx + g.left + 6, lx + (stem.x0 + stem.x1) / 2, base, [lx + g.iDotC[0], ly + g.iDotC[1]]);
}

// where the logo rests (shared by the opening slam and the hero end)
export function logoRest(W, H, P) {
  const g = logoGeometry(P ? 820 : 900);
  return { g, lx: Math.round(W / 2 - g.w / 2), ly: Math.round(H / 2 - g.h / 2 - (P ? 40 : 10)) };
}
