// S2 · 뇌 (3.35–9.60): the words, formulas and pictures lift off the page, swirl up, and gather on a
// plane floating above the book into the shape of a brain. The light traces its folds; on the beat,
// impulses run through a network between the words — what was read is now connected thought — and a
// spark at the front of the brain sets off the imagination.
import { E, tw, prog, clamp, lerp, rng, M4, place, slice, h } from '../core.js';
import { project } from '../line.js';
import { ZB } from '../world.js';
import { TILT } from './book.js';

// closed / open Catmull-Rom through points
export function catmull(pts, n = 8, closed = false) {
  const out = [], N = pts.length;
  const P = i => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(closed ? out[0].slice() : pts[N - 1].slice());
  return out;
}

const SX = 800, SY = 680;
const OUT = [[-0.44, 0.10], [-0.49, -0.05], [-0.45, -0.20], [-0.35, -0.33], [-0.20, -0.41], [-0.02, -0.44], [0.16, -0.42], [0.31, -0.35], [0.43, -0.23], [0.49, -0.08], [0.48, 0.06], [0.42, 0.15],
  [0.32, 0.17], [0.20, 0.16], [0.10, 0.18], [0.0, 0.22], [-0.12, 0.25], [-0.25, 0.24], [-0.36, 0.19]];
const CEREB = [[0.12, 0.20], [0.24, 0.18], [0.36, 0.19], [0.43, 0.25], [0.38, 0.32], [0.26, 0.355], [0.15, 0.32], [0.10, 0.26]];
const STEM = [[0.04, 0.21], [0.11, 0.23], [0.105, 0.34], [0.09, 0.45], [0.03, 0.46], [0.035, 0.34], [0.0, 0.25]];
const SULCI = [
  [[0.02, -0.43], [0.0, -0.30], [0.05, -0.18], [0.02, -0.06], [0.07, 0.04]],
  [[-0.36, 0.12], [-0.22, 0.07], [-0.08, 0.05], [0.06, 0.01], [0.18, -0.05]],
  [[-0.32, -0.30], [-0.24, -0.21], [-0.32, -0.12], [-0.22, -0.04]],
  [[-0.15, -0.40], [-0.12, -0.28], [-0.18, -0.18], [-0.10, -0.10], [-0.14, -0.01]],
  [[0.16, -0.40], [0.14, -0.28], [0.22, -0.20], [0.18, -0.08]],
  [[0.34, -0.31], [0.28, -0.19], [0.37, -0.09], [0.31, 0.06]],
  [[-0.30, 0.18], [-0.16, 0.15], [-0.02, 0.14], [0.12, 0.09], [0.26, 0.07]],
  [[0.16, 0.245], [0.27, 0.23], [0.39, 0.245]],
  [[0.15, 0.29], [0.27, 0.29], [0.38, 0.29]],
];
const S = p => [p[0] * SX, p[1] * SY];
export const BRAIN_OUT = catmull(OUT.map(S), 8, true);
const BRAIN_CB = catmull(CEREB.map(S), 6, true), BRAIN_ST = catmull(STEM.map(S), 6, true);
const BRAIN_SULCI = SULCI.map(c => catmull(c.map(S), 8));
export const SPARK = [-0.36 * SX, -0.16 * SY]; // front of the brain (prefrontal)

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export default function brainScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene brain');
  ctx.root.appendChild(el);
  // the soft lime wash that fills the brain once it's formed
  const wash = h('div', 'obj bwash');
  const dd = c => 'M' + c.map(p => `${(p[0] + SX / 2 + 40).toFixed(1)} ${(p[1] + SY / 2 + 40).toFixed(1)}`).join(' L') + ' Z';
  const d = dd(BRAIN_ST) + dd(BRAIN_CB) + dd(BRAIN_OUT);
  wash.innerHTML = `<svg width="${SX + 80}" height="${SY + 80}" viewBox="0 0 ${SX + 80} ${SY + 80}"><defs><radialGradient id="bw" cx="38%" cy="40%" r="70%"><stop offset="0" stop-color="#E4F6C8"/><stop offset="0.7" stop-color="#CDEBA4"/><stop offset="1" stop-color="#B3DF7C"/></radialGradient></defs><path d="${d}" fill="url(#bw)"/></svg>`;
  wash.style.width = `${SX + 80}px`; wash.style.height = `${SY + 80}px`;
  el.appendChild(wash);

  let toks = [], targets = [], edges = [], dots = [], ready = false;
  const r = rng(42);
  function layout() {
    toks = ctx.tokens;
    // targets: jittered grid inside the outline, kept off the very edge
    const pts = [];
    const step = 64;
    for (let y = -SY * 0.45; y < SY * 0.45; y += step * 0.62)
      for (let x = -SX * 0.5; x < SX * 0.5; x += step) {
        const px = x + (r() - 0.5) * step * 0.6 + ((Math.round(y / step) % 2) * step) / 2, py = y + (r() - 0.5) * step * 0.4;
        if (inside(BRAIN_OUT, px, py) && inside(BRAIN_OUT, px - 34, py) && inside(BRAIN_OUT, px + 34, py) && inside(BRAIN_OUT, px, py - 18) && inside(BRAIN_OUT, px, py + 18)) pts.push([px, py]);
      }
    // pick as many as there are tokens, spread evenly
    pts.sort(() => r() - 0.5);
    targets = pts.slice(0, toks.length);
    while (targets.length < toks.length) targets.push(pts[targets.length % pts.length]);
    // match tokens → targets by left-to-right order so paths don't cross much
    const tk = toks.map((k, i) => ({ i, key: (k.page === 'L' ? 0 : PWX) + k.x + k.y * 0.2 }));
    tk.sort((a, b) => a.key - b.key);
    const tg = targets.map((p, i) => ({ p, key: p[0] + p[1] * 0.2 })).sort((a, b) => a.key - b.key);
    tk.forEach((o, j) => { toks[o.i].target = tg[j].p; });
    toks.forEach((k, i) => {
      k.seed = r();
      k.delay = clamp((k.page === 'L' ? 0 : 0.25) + (k.y / 680) * 0.45 + r() * 0.2, 0, 0.9);
      k.arrive = lerp(T.arriveA + 0.35, T.arriveB, (Math.floor(r() * 4) + r() * 0.5) / 4.5);
      k.scale = clamp(30 / Math.max(k.w * 0.5, k.h), 0.3, 0.62);
      const side = k.page === 'L' ? 1 : -1;
      k.tilt = side * TILT;
      const c = M4.apply(k.M, k.x + k.w / 2, k.y + k.h / 2, 0);
      k.c0 = [c[0], c[1], 0.4];
    });
    // network: each target to its two nearest neighbours
    const seen = new Set();
    toks.forEach((a, i) => {
      const near = toks.map((b, j) => [j, Math.hypot(a.target[0] - b.target[0], a.target[1] - b.target[1])]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2);
      for (const [j, dd] of near) { const key = i < j ? `${i}-${j}` : `${j}-${i}`; if (!seen.has(key) && dd < 170) { seen.add(key); edges.push([i, j]); } }
    });
    // distance (in hops, weighted) from the spark for the impulse timing
    toks.forEach(k => { k.dist = Math.hypot(k.target[0] - SPARK[0], k.target[1] - SPARK[1]); });
    // neuron dots
    for (let i = 0; i < 220; i++) {
      const x = (r() - 0.5) * SX, y = (r() - 0.5) * SY;
      if (inside(BRAIN_OUT, x, y)) dots.push([x, y, 1.2 + r() * 2.2, r()]);
    }
    ready = true;
  }
  const PWX = 1000;

  // world position of a token at time t (+ its billboard amount and scale)
  function tokenAt(k, t, cam) {
    const u = tw(t, T.liftA + k.delay, T.drop + 0.9, E.inOutSine);
    const G = [0, -20];
    const rel = [k.c0[0] - G[0], k.c0[1] - G[1]];
    const ang = u * (0.8 + 0.5 * k.seed) * (k.page === 'L' ? 1 : -1);
    const rad = 1 - 0.3 * u;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const L = [G[0] + (rel[0] * ca - rel[1] * sa) * rad, G[1] + (rel[0] * sa + rel[1] * ca) * rad - u * 60, k.c0[2] + u * (380 + 220 * k.seed) + Math.sin(t * 2.1 + k.seed * 9) * 14 * u];
    const g = E.inOutCubic(prog(t, T.drop - 0.25, k.arrive));
    const B = [k.target[0], k.target[1], ZB];
    const arc = Math.sin(g * Math.PI) * 120;
    const p = [lerp(L[0], B[0], g), lerp(L[1], B[1], g) - arc * 0.4, lerp(L[2], B[2], g) + arc];
    return { p, u, g, s: lerp(1, k.scale, g) * (1 + 0.12 * Math.sin(Math.PI * u) * (1 - g)) };
  }

  let cur = null;
  function update(t) {
    const CM = ctx.CM, cam = ctx.cam;
    const show = t >= T.liftA && t < T.lift + 0.2;
    // dims when the imagination stalls, gone as the camera dives into the tablet
    const fade = (1 - 0.55 * tw(t, T.stall, T.stall + 0.4) * (1 - tw(t, T.lift - 0.25, T.lift))) * (1 - tw(t, T.lift - 0.15, T.lift + 0.15, E.inOutSine));
    // wash
    const wk = tw(t, T.outlineA + 0.3, T.outlineB + 0.4) * fade;
    wash.style.opacity = (wk * (0.16 + 0.22 * tw(t, T.spark - 0.1, T.spark + 0.3) * (1 - tw(t, T.spark + 0.3, T.whaleB)))).toFixed(3);
    place(wash, CM, M4.T(-SX / 2 - 40, -SY / 2 - 40, ZB - 2));
    for (const k of toks) {
      k.el.style.display = show ? 'block' : 'none';
      if (!show) continue;
      const { p, u, g, s } = tokenAt(k, t, cam);
      const b = Math.min(u * 1.4, 1);
      const flutter = Math.sin(t * 3 + k.seed * 20) * 10 * u * (1 - g);
      const m = M4.chain(M4.T(p[0], p[1], p[2]), M4.RY(-cam.ry * b), M4.RX(-cam.rx * b), M4.RZ(-cam.rz * b + flutter), M4.RY(k.tilt * (1 - b)), M4.S(s, s, 1), M4.T(-k.w / 2, -k.h / 2, 0));
      place(k.el, CM, m);
      // colour: ink → 연두 as an impulse passes through it
      let lit = 0;
      for (const ft of [T.fire1, T.fire2, T.spark]) {
        const at = ft + k.dist / 1400;
        if (t > at) lit = Math.max(lit, 1 - prog(t, at, at + 0.45));
      }
      if (ctx.readWords && ctx.readWords.includes(k) && t < T.liftA + 0.6) lit = Math.max(lit, 0.6 * (ctx.readK > 0 ? 1 : 0) * (1 - prog(t, T.liftA, T.liftA + 0.6)));
      const base = g > 0.98 ? 0.15 * fade : 0;
      const L = Math.max(lit, base);
      k.el.style.color = `rgb(${lerp(226, 176, L) | 0},${lerp(230, 242, L) | 0},${lerp(222, 120, L) | 0})`;
      k.el.style.textShadow = L > 0.02 ? `0 0 ${(14 * L).toFixed(1)}px rgba(140,230,80,${(0.9 * L).toFixed(3)})` : 'none';
      k.el.style.opacity = fade.toFixed(3);
    }
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur || !ready || t < T.drop - 0.5) return;
    const CM = cur.CM;
    const fade = (1 - 0.55 * tw(t, T.stall, T.stall + 0.4) * (1 - tw(t, T.lift - 0.25, T.lift))) * (1 - tw(t, T.lift - 0.15, T.lift + 0.15, E.inOutSine));
    if (fade <= 0) return;
    const W3 = pts => project(CM, pts.map(p => [p[0], p[1], ZB]));
    // neuron dots appear as the words arrive
    const dk = tw(t, T.arriveA, T.arriveB + 0.4);
    for (const [x, y, rr, s] of dots) {
      if (s > dk) continue;
      const q = W3([[x, y]])[0];
      fx.dot(q[0], q[1], rr * cur.CM[0] * 0.9 + 0.4, '#7E8C72', 0.7 * fade);
    }
    // the folds traced by the light, then left as fine 연두 ink
    const ok = tw(t, T.outlineA, T.outlineB, E.inOutSine);
    if (ok > 0) {
      const all = [BRAIN_OUT, BRAIN_CB, BRAIN_ST, ...BRAIN_SULCI];
      all.forEach((c, i) => {
        const k0 = clamp(ok * 1.3 - i * 0.04);
        if (k0 <= 0) return;
        const pts = W3(c);
        fx.line(slice(pts, 0, k0), { w: i > 2 ? 2 : 3, alpha: fade * (i > 2 ? 0.7 : 1), taper: 0, cool: 0.5, ink: i > 2 ? '#5E9E33' : '#7BC23A', inkW: 1 });
        if (k0 < 1) fx.line(slice(pts, Math.max(0, k0 - 0.25), k0), { w: i ? 3 : 4.5, alpha: 1, taper: 1, head: 1 });
      });
    }
    // the network between the words, and impulses running through it on the beat
    const nk = tw(t, T.arriveB - 0.4, T.outlineB);
    if (nk > 0) {
      for (const [i, j] of edges) {
        const a = toks[i].target, b = toks[j].target;
        const seg = W3([a, b]);
        fx.line(seg, { w: 1.2, alpha: 0.35 * nk * fade, taper: 0, cool: 1, ink: '#6FA84A', inkW: 1 });
        for (const ft of [T.fire1, T.fire2, T.spark]) {
          const at = ft + Math.min(toks[i].dist, toks[j].dist) / 1400;
          const k = prog(t, at, at + 0.22);
          if (k > 0 && k < 1) {
            const from = toks[i].dist < toks[j].dist ? seg : [seg[1], seg[0]];
            fx.line(slice(from, Math.max(0, k - 0.5), k), { w: 2.6, alpha: (1 - k * 0.4) * fade, taper: 1, head: 0.8 });
          }
        }
      }
    }
    // the spark
    if (t > T.spark - 0.3) {
      const q = W3([SPARK])[0];
      const a = tw(t, T.spark - 0.3, T.spark, E.inQuad) * (1 - tw(t, T.spark + 0.1, T.spark + 0.9));
      fx.flare(q[0], q[1], 260, a);
      fx.head(q[0], q[1], 6, a);
      fx.shards(q[0], q[1], t, T.spark, { n: 16, seed: 9, speed: 900, life: 0.5, len: 50, w: 2.2, spreadY: 1 });
    }
  }

  ctx.brain = { SPARK, ZB };
  return { el, range: ctx.S.brain, layout, update, draw };
}
