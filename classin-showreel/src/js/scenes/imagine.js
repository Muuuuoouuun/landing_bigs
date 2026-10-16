// S3 · 상상력 (9.60–14.25): from the spark at the front of the brain, the light leaves in five
// ribbons and draws — one continuous line each — a rocket, a ringed planet, a whale, a tree and a
// paper plane. Each drawing cools into ink with a 연두 accent while a pastel wash blooms behind it;
// the camera pulls back so the whole imagination floats around the brain. Then every drawing folds
// back into a seed of light, and the seeds fall towards the homes.
import { E, tw, prog, clamp, lerp, rng, drift, M4, place, measure, slice, h } from '../core.js';
import { project } from '../line.js';
import { ZB } from '../world.js';
import { catmull, SPARK } from './brain.js';

const circle = (cx, cy, r, a0 = 0, a1 = Math.PI * 2, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });

// each drawing: strokes [{ pts, accent }], all in local px around (0, 0)
function rocket() {
  return [
    { pts: catmull([[-38, 72], [-41, 10], [-33, -52], [-17, -102], [0, -130], [17, -102], [33, -52], [41, 10], [38, 72], [0, 79], [-38, 72]], 8) },
    { pts: catmull([[-40, 18], [-74, 62], [-74, 112], [-40, 82]], 8) },
    { pts: catmull([[40, 18], [74, 62], [74, 112], [40, 82]], 8) },
    { pts: circle(0, -32, 20, -Math.PI / 2, Math.PI * 1.5), accent: 1 },
    { pts: catmull([[0, 90], [-16, 128], [12, 166], [-16, 206], [14, 246], [-8, 290]], 8), accent: 1 },
  ];
}
function planet() {
  const ring = [], segs = [];
  const rot = -0.32, rx = 168, ry = 40;
  let curS = null;
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    const x = ex * Math.cos(rot) - ey * Math.sin(rot), y = ex * Math.sin(rot) + ey * Math.cos(rot);
    const visible = Math.sin(a) > 0 || Math.hypot(x, y) > 94;
    if (visible) { if (!curS) { curS = []; segs.push(curS); } curS.push([x, y]); } else curS = null;
    ring.push([x, y]);
  }
  return [
    { pts: circle(0, 0, 90, -Math.PI * 0.75, Math.PI * 1.25, 48) },
    { pts: catmull([[-70, -30], [-20, -42], [40, -36], [82, -22]], 6) },
    ...segs.filter(s => s.length > 2).map(s => ({ pts: s, accent: 1 })),
    { pts: circle(170, -120, 16), accent: 0 },
  ];
}
function whale() {
  return [
    { pts: catmull([[170, -10], [120, -42], [40, -72], [-60, -72], [-140, -42], [-176, 8], [-150, 50], [-60, 72], [40, 62], [120, 30], [170, -10], [205, -52], [244, -62], [218, -18], [254, 12], [206, 6], [170, -10]], 7) },
    { pts: catmull([[-174, 16], [-130, 28], [-88, 24]], 6) },
    { pts: catmull([[-150, 42], [-80, 58], [0, 56], [60, 46]], 6) },
    { pts: circle(-112, -14, 7, 0, Math.PI * 2, 16) },
    { pts: catmull([[-58, -80], [-62, -118], [-84, -150]], 6), accent: 1 },
    { pts: catmull([[-62, -112], [-40, -146]], 4), accent: 1 },
  ];
}
function tree() {
  const can = [];
  for (let i = 0; i <= 120; i++) {
    const a = Math.PI / 2 + 0.55 + (i / 120) * (Math.PI * 2 - 1.1);
    const r = 112 + 18 * Math.abs(Math.sin(a * 4.5));
    can.push([Math.cos(a) * r, -82 + Math.sin(a) * r * 0.92]);
  }
  return [
    { pts: [[-14, 150], ...catmull([[-14, 150], [-10, 70], [-24, 18]], 6)] },
    { pts: can },
    { pts: catmull([[24, 18], [10, 70], [14, 150]], 6) },
    { pts: catmull([[-90, 152], [0, 148], [96, 152]], 6) },
    { pts: circle(-40, -110, 12), accent: 1 }, { pts: circle(36, -60, 12), accent: 1 }, { pts: circle(50, -140, 10), accent: 1 },
  ];
}
function plane() {
  return [
    { pts: [[-112, 12], [112, -42], [-40, 42], [-112, 12]] },
    { pts: [[112, -42], [-56, 22], [-40, 42]] },
    { pts: catmull([[-122, 18], [-196, 44], [-262, 2], [-232, -48], [-180, -20], [-236, 42], [-320, 66]], 7), accent: 1 },
  ];
}

const DRAW = [
  { name: 'rocket', make: rocket, at: 'rocket', wash: '#F6D6C2', pos: [[-990, -330, 120, 1.95, 30], [-520, -1120, 120, 1.6, 30]] },
  { name: 'planet', make: planet, at: 'planet', wash: '#F2E2A6', pos: [[1000, -380, -80, 1.75, 0], [470, -820, -80, 1.45, 0]] },
  { name: 'whale', make: whale, at: 'whale', wash: '#CFE2F0', pos: [[930, 420, 60, 1.7, 0], [430, 980, 60, 1.4, 0]] },
  { name: 'tree', make: tree, at: 'tree', wash: '#DCEBC6', pos: [[-980, 400, -40, 1.75, 0], [-470, 1220, -40, 1.45, 0]] },
  { name: 'plane', make: plane, at: 'plane', wash: '#DCD3EE', pos: [[60, -720, 150, 1.45, -8], [60, -1580, 150, 1.3, -8]] },
];

export default function imagineScene(ctx) {
  const { P, T } = ctx;
  const el = h('section', 'scene imagine');
  ctx.root.appendChild(el);
  const items = DRAW.map((d, i) => {
    const [ox, oy, dz, sc, rot] = d.pos[P ? 1 : 0];
    const a = (rot * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const strokes = d.make().map(s => ({ ...s, pts: s.pts.map(([x, y]) => [ox + (x * ca - y * sa) * sc, oy + (x * sa + y * ca) * sc]) }));
    const lens = strokes.map(s => { const L = measure(s.pts); return L[L.length - 1]; });
    const total = lens.reduce((a, b) => a + b, 0);
    const wash = h('div', 'obj iwash');
    wash.style.background = `radial-gradient(50% 50% at 50% 50%, ${d.wash} 0%, ${d.wash}cc 35%, ${d.wash}00 70%)`;
    el.appendChild(wash);
    const t0 = T[d.at];
    return { ...d, i, ox, oy, z: ZB + dz, sc, strokes, lens, total, wash, t0, t1: t0 + 0.35 + 0.95, seed: i * 1.7 };
  });
  const r = rng(5);
  const sparkles = Array.from({ length: 22 }, () => ({ x: (r() - 0.5) * (P ? 1900 : 3000), y: (r() - 0.5) * (P ? 3400 : 1700), z: ZB + (r() - 0.5) * 300, t: T.stars + r() * 1.0, s: 8 + r() * 14 }));

  // floating offset (after the lift, the imagination drifts gently)
  const floatOf = (it, t) => { const k = tw(t, T.lift - 0.4, T.lift + 0.8); return [drift(t, it.seed, 0.12) * 26 * k, drift(t, it.seed + 3, 0.1) * 20 * k]; };

  let cur = null;
  function update(t) {
    const CM = ctx.CM;
    for (const it of items) {
      const bloom = tw(t, it.t1 - 0.2, it.t1 + 0.9, E.outCubic) * (1 - tw(t, T.seed + it.i * 0.06, T.seed + it.i * 0.06 + 0.5, E.inOutCubic));
      const [fx_, fy] = floatOf(it, t);
      const sz = 520 * it.sc;
      it.wash.style.opacity = (bloom * 0.9).toFixed(3);
      place(it.wash, CM, M4.chain(M4.T(it.ox + fx_, it.oy + fy, it.z - 30), M4.S(0.35 + 0.65 * bloom), M4.T(-sz / 2, -sz / 2, 0)));
      it.wash.style.width = it.wash.style.height = `${sz}px`;
    }
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    const CM = cur.CM;
    const P3 = (pts, z, off) => project(CM, pts.map(p => [p[0] + off[0], p[1] + off[1], z]));
    const spark = [SPARK[0], SPARK[1]];
    for (const it of items) {
      if (t < it.t0) continue;
      const off = floatOf(it, t);
      const back = tw(t, T.seed + it.i * 0.06, T.seed + it.i * 0.06 + 0.5, E.inOutCubic); // folding back into a seed
      const fall = E.inQuad(prog(t, T.scatter + it.i * 0.05, T.scatter + 0.7 + it.i * 0.05));
      // 1 · the ribbon from the spark to the drawing's first point
      const first = it.strokes[0].pts[0];
      const ck = tw(t, it.t0, it.t0 + 0.4, E.inOutCubic);
      if (ck > 0 && t < it.t0 + 0.9) {
        const mid = [(spark[0] + first[0]) / 2 + (first[1] - spark[1]) * 0.25, (spark[1] + first[1]) / 2 - (first[0] - spark[0]) * 0.25];
        const ribbon = catmull([spark, mid, first], 14).map(p => [p[0], p[1]]);
        const zf = k => lerp(ZB, it.z, k);
        const pr = project(CM, ribbon.map((p, j) => [p[0] + off[0] * (j / ribbon.length), p[1] + off[1] * (j / ribbon.length), zf(j / (ribbon.length - 1))]));
        fx.line(slice(pr, Math.max(0, ck - 0.45), ck), { w: 3.6, alpha: 1 - tw(t, it.t0 + 0.4, it.t0 + 0.9), taper: 1, head: ck < 1 ? 1 : 0 });
      }
      // 2 · the drawing, stroke after stroke, by the light; then cooled into ink
      const dk = tw(t, it.t0 + 0.35, it.t1, E.inOutSine) * (1 - back);
      const cool = tw(t, it.t1 - 0.1, it.t1 + 0.5) * (1 - back * 0.7);
      let acc = 0;
      const center = [it.ox, it.oy];
      it.strokes.forEach((s, j) => {
        const a0 = acc / it.total, a1 = (acc + it.lens[j]) / it.total;
        acc += it.lens[j];
        const k = clamp((dk - a0) / (a1 - a0));
        if (k <= 0) return;
        // folding back: strokes shrink towards the drawing's centre
        const pts = back > 0 ? s.pts.map(p => [lerp(p[0], center[0], back * back), lerp(p[1], center[1], back * back)]) : s.pts;
        const pr = P3(slice(pts, 0, k), it.z, off);
        fx.line(pr, { w: 4.4, alpha: 1 - fall, taper: 0, head: k < 1 ? 1 : 0, cool, ink: s.accent ? '#6DBB2C' : '#3A372F', inkW: s.accent ? 1.05 : 0.95 });
      });
      // 3 · the seed of light, then its fall towards the homes
      if (back > 0) {
        const q = P3([[center[0], center[1] + fall * 2200]], it.z, off)[0];
        const qa = P3([[center[0], center[1] + Math.max(0, fall - 0.12) * 2200]], it.z, off)[0];
        fx.head(q[0], q[1], 5 + back * 2, back);
        fx.flare(q[0], q[1], 90, 0.4 * back * (1 - fall));
        if (fall > 0) fx.line([qa, q], { w: 4.5, alpha: 1, taper: 1, head: 1 });
      }
    }
    // little sparkles of imagination
    for (const sp of sparkles) {
      const k = prog(t, sp.t, sp.t + 0.5);
      if (k <= 0 || t > T.seed + 0.4) continue;
      const a = Math.sin(Math.min(1, k) * Math.PI * 0.5) * (1 - tw(t, T.seed, T.seed + 0.4));
      const c = project(CM, [[sp.x, sp.y, sp.z]])[0];
      const s = sp.s * a * CM[0] * 1.6;
      fx.shape([[c[0], c[1] - s], [c[0] + s * 0.25, c[1] - s * 0.25], [c[0] + s, c[1]], [c[0] + s * 0.25, c[1] + s * 0.25], [c[0], c[1] + s], [c[0] - s * 0.25, c[1] + s * 0.25], [c[0] - s, c[1]], [c[0] - s * 0.25, c[1] - s * 0.25]], a * 0.9, 0.8);
    }
  }

  return { el, range: ctx.S.imagine, update, draw };
}
