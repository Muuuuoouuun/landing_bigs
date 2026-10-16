// S3–S4 · 상상, 그리고 멈춤 (5.55–9.60): the words read from the book gather in the air into the shape of
// a whale — Seo-yun's question — and the light traces its outline through them. It lifts its head and tries
// to rise... and stalls: the line flickers and comes apart into falling points. Alone, the imagination only
// gets this far. One point is left — the question — and it drops into the tablet on the desk.
import { E, tw, prog, clamp, lerp, rng, measure, slice, planeModel, xf, catmull, h } from '../core.js';
import { project } from '../line.js';
import { ZB } from '../world.js';
import { TABLET } from './book.js';

export function whaleStrokes() {
  return [
    { pts: catmull([[170, -10], [120, -42], [40, -72], [-60, -72], [-140, -42], [-176, 8], [-150, 50], [-60, 72], [40, 62], [120, 30], [170, -10], [205, -52], [244, -62], [218, -18], [254, 12], [206, 6], [170, -10]], 7) },
    { pts: catmull([[-174, 16], [-130, 28], [-88, 24]], 6) },
    { pts: catmull([[-150, 42], [-80, 58], [0, 56], [60, 46]], 6) },
    { pts: Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [-112 + Math.cos(a) * 7, -14 + Math.sin(a) * 7]; }) },
    { pts: catmull([[-20, 40], [10, 84], [40, 70], [30, 44]], 6) }, // flipper
    { pts: catmull([[-58, -80], [-62, -118], [-84, -150]], 6), accent: 1 },
    { pts: catmull([[-62, -112], [-40, -146]], 4), accent: 1 },
  ];
}

// the whale in the air above the book: plane z = ZB, centre O, scale S; it lifts its head as it tries to rise
export const WHALE = { O: [20, -30], S: 2.1, Z: ZB };
export function whalePose(t, T) {
  const up = tw(t, T.whaleB - 0.1, T.stall, E.inOutSine);
  const a = -0.2 * up, rise = -110 * up, bob = Math.sin(t * 2.4) * 6 * tw(t, T.gatherB - 0.3, T.whaleB);
  return ([x, y]) => [WHALE.O[0] + (x * Math.cos(a) - y * Math.sin(a)) * WHALE.S, WHALE.O[1] + rise + bob + (x * Math.sin(a) + y * Math.cos(a)) * WHALE.S];
}
// where Seo-yun's tile will be on the class screen, in desk space (the question lands there)
export function seatOnTablet() {
  return xf(planeModel(TABLET.x, TABLET.y, 2, TABLET.w, TABLET.h, { rz: TABLET.rz }), TABLET.bez + (419 / 1920) * (TABLET.w - 2 * TABLET.bez), TABLET.bez + (160 / 1080) * (TABLET.h - 2 * TABLET.bez), 0);
}

export default function whaleScene(ctx) {
  const { T } = ctx;
  const el = h('section', 'scene whale');
  ctx.root.appendChild(el);
  const base = whaleStrokes();
  const lens = base.map(s => { const L = measure(s.pts); return L[L.length - 1]; });
  const total = lens.reduce((a, b) => a + b, 0);
  const r = rng(31);
  const bits = [];
  base.forEach(s => { for (let i = 0; i < s.pts.length; i += 2) bits.push({ p: s.pts[i], vx: (r() - 0.5) * 90, vy: 80 + r() * 240, d: r() * 0.25, s: 1.4 + r() * 2.2 }); });
  const eye = [-112, -14];

  function draw(fx, t) {
    const CM = ctx.CM;
    const tf = whalePose(t, T);
    const P3 = pts => project(CM, pts.map(p => [p[0], p[1], WHALE.Z]));
    // the light traces the outline through the gathered words, then keeps it softly glowing (it is imagination)
    const dk = tw(t, T.whaleA, T.whaleB, E.inOutSine);
    const flick = t > T.stall ? (Math.sin((t - T.stall) * 70) > 0.1 ? 1 : 0.25) * (1 - prog(t, T.stall, T.stall + 0.3)) : 1;
    if (t < T.stall + 0.3 && dk > 0) {
      let acc = 0;
      base.forEach((s, j) => {
        const a0 = acc / total, a1 = (acc + lens[j]) / total;
        acc += lens[j];
        const k = clamp((dk - a0) / (a1 - a0));
        if (k <= 0) return;
        fx.line(P3(slice(s.pts.map(tf), 0, k)), { w: 4.4, alpha: flick, taper: 0, head: k < 1 ? 1.1 : 0, cool: 0.25, ink: s.accent ? '#A6E86A' : '#DDE7D6', inkW: 0.8 });
      });
      const e = P3([tf(eye)])[0];
      fx.flare(e[0], e[1], 180, 0.25 * tw(t, T.whaleB - 0.2, T.whaleB + 0.2) * flick);
    }
    // it comes apart: points drifting down and dimming
    if (t > T.stall + 0.15) {
      const k0 = t - (T.stall + 0.15);
      for (const b of bits) {
        const k = clamp((k0 - b.d) / 0.9);
        if (k <= 0) continue;
        const p = tf(b.p);
        const q = P3([[p[0] + b.vx * k, p[1] + b.vy * k * k]])[0];
        fx.dot(q[0], q[1], b.s * (1 - k * 0.6), '#B9E58A', (1 - k) * 0.85);
      }
    }
    // one point is left — the question — breathing; then it drops into the tablet as the camera dives after it
    if (t > T.stall + 0.3) {
      const e = tf(eye);
      const g = tw(t, T.stall + 0.3, T.dotDrop - 0.2);
      const dive = E.inOutCubic(prog(t, T.dotDrop, T.enter));
      const from = [e[0], e[1], WHALE.Z], to = seatOnTablet();
      const at = k => [lerp(from[0], to[0], k), lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 200, lerp(from[2], to[2], k)];
      const q = project(CM, [at(dive)])[0];
      const pulse = 0.6 + 0.4 * Math.sin((t - T.stall) * 9);
      const out = 1 - prog(t, T.enter - 0.05, T.enter + 0.1);
      fx.head(q[0], q[1], 4 + 2 * g, g * pulse * out);
      fx.flare(q[0], q[1], 80, 0.4 * g * out);
      if (dive > 0 && dive < 1) fx.line(project(CM, [at(Math.max(0, dive - 0.15)), at(dive)]), { w: 4, alpha: 1, taper: 1, head: 1 });
    }
  }

  return { el, range: ctx.S.whale, update() {}, draw };
}
