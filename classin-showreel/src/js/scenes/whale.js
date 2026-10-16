// S3 · 상상, 그리고 멈춤 (9.60–12.40): from the spark at the front of the brain the light draws the
// whale of Seo-yun's question — one continuous line. It lifts its head, tries to rise... and stalls: the
// line flickers and comes apart into drifting points. Alone, the imagination only gets this far.
// One point is left — the question itself — and it drops towards the tablet on the desk.
import { E, tw, prog, clamp, lerp, rng, measure, slice, planeModel, xf, h } from '../core.js';
import { project } from '../line.js';
import { ZB } from '../world.js';
import { catmull, SPARK } from './brain.js';
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

export default function whaleScene(ctx) {
  const { T } = ctx;
  const el = h('section', 'scene whale');
  ctx.root.appendChild(el);
  const O = [690, -60], S = 2.1, Z = ZB + 60;
  const base = whaleStrokes();
  const lens = base.map(s => { const L = measure(s.pts); return L[L.length - 1]; });
  const total = lens.reduce((a, b) => a + b, 0);
  // the points it comes apart into
  const r = rng(31);
  const bits = [];
  base.forEach((s, j) => { for (let i = 0; i < s.pts.length; i += 2) bits.push({ p: s.pts[i], vx: (r() - 0.5) * 80, vy: 60 + r() * 220, d: r() * 0.25, s: 1.4 + r() * 2.2 }); });

  // whale pose: drawn level, then lifts its head (rotates up, rises) as it tries to fly
  function pose(t) {
    const up = tw(t, T.whaleB - 0.2, T.stall, E.inOutSine);
    const a = -0.2 * up, rise = -120 * up;
    return ([x, y]) => [O[0] + (x * Math.cos(a) - y * Math.sin(a)) * S, O[1] + rise + (x * Math.sin(a) + y * Math.cos(a)) * S];
  }

  function update() {}

  function draw(fx, t) {
    const CM = ctx.CM;
    const P3 = pts => project(CM, pts.map(p => [p[0], p[1], Z]));
    const tf = pose(t);
    // the ribbon from the spark to the whale's tail
    const first = tf(base[0].pts[0]);
    const ck = tw(t, T.whaleA - 0.1, T.whaleA + 0.3, E.inOutCubic);
    if (ck > 0 && t < T.whaleA + 0.7) {
      const mid = [(SPARK[0] + first[0]) / 2, Math.min(SPARK[1], first[1]) - 260];
      const rib = catmull([SPARK, mid, first], 14);
      const pr = project(CM, rib.map((p, j) => [p[0], p[1], lerp(ZB, Z, j / (rib.length - 1))]));
      fx.line(slice(pr, Math.max(0, ck - 0.45), ck), { w: 4, alpha: 1 - tw(t, T.whaleA + 0.3, T.whaleA + 0.7), taper: 1, head: ck < 1 ? 1 : 0 });
    }
    // the whale, drawn by the light (it keeps glowing softly — it is still imagination)
    const dk = tw(t, T.whaleA + 0.2, T.whaleB, E.inOutSine);
    const flick = t > T.stall ? (Math.sin((t - T.stall) * 70) > 0.1 ? 1 : 0.25) * (1 - prog(t, T.stall, T.stall + 0.3)) : 1;
    if (t < T.stall + 0.3) {
      let acc = 0;
      base.forEach((s, j) => {
        const a0 = acc / total, a1 = (acc + lens[j]) / total;
        acc += lens[j];
        const k = clamp((dk - a0) / (a1 - a0));
        if (k <= 0) return;
        fx.line(P3(slice(s.pts.map(tf), 0, k)), { w: 4.2, alpha: flick, taper: 0, head: k < 1 ? 1 : 0, cool: 0.3, ink: s.accent ? '#A6E86A' : '#DDE7D6', inkW: 0.8 });
      });
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
    // one point is left: the question. It drops to the tablet as the camera dives after it.
    if (t > T.stall + 0.3) {
      const eye = tf([-112, -14]);
      const g = tw(t, T.stall + 0.3, T.lift - 0.2);
      const dive = E.inOutCubic(prog(t, T.lift - 0.15, T.enter));
      // it lands where Seo-yun's tile will be on the class screen
      const to = xf(planeModel(TABLET.x, TABLET.y, 2, TABLET.w, TABLET.h, { rz: TABLET.rz }), TABLET.bez + (419 / 1920) * (TABLET.w - 2 * TABLET.bez), TABLET.bez + (160 / 1080) * (TABLET.h - 2 * TABLET.bez), 0);
      const from = [eye[0], eye[1], Z];
      const p = [lerp(from[0], to[0], dive), lerp(from[1], to[1], dive) - Math.sin(dive * Math.PI) * 200, lerp(from[2], to[2], dive)];
      const q = project(CM, [p])[0];
      const pulse = 0.6 + 0.4 * Math.sin((t - T.stall) * 9);
      fx.head(q[0], q[1], 4 + 2 * g, g * pulse * (1 - prog(t, T.enter - 0.05, T.enter + 0.1)));
      fx.flare(q[0], q[1], 80, 0.4 * g * (1 - prog(t, T.enter - 0.05, T.enter + 0.1)));
      if (dive > 0 && dive < 1) {
        const pa = [lerp(from[0], to[0], Math.max(0, dive - 0.15)), lerp(from[1], to[1], Math.max(0, dive - 0.15)) - Math.sin(Math.max(0, dive - 0.15) * Math.PI) * 200, lerp(from[2], to[2], Math.max(0, dive - 0.15))];
        fx.line(project(CM, [pa, p]), { w: 4, alpha: 1, taper: 1, head: 1 });
      }
    }
  }

  return { el, range: ctx.S.whale, update, draw };
}
