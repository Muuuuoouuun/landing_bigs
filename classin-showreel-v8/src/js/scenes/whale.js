// S3–S4 · 상상, 그리고 멈춤 (5.55–9.60): the words read from the book gather in the air into the shape of
// a whale — Seo-yun's question — and the light traces its outline through them. It lifts its head and tries
// to rise... and stalls: the line flickers and comes apart into falling points. Alone, the imagination only
// gets this far. One point is left — the question — and it drops into the tablet on the desk.
import { E, tw, prog, clamp, lerp, rng, measure, slice, planeModel, xf, catmull, M4, place, h } from '../core.js';
import WH from '../../assets/gen/whale.js';
import { whalePic } from '../whalepic.js';
import { project } from '../line.js';
import { ZB } from '../world.js';
import { TABLET } from './book.js';

// The whale is the generated picture (render/whale_trace.py): a humpback made of light. Its silhouette was traced
// from the picture, so the light draws exactly the outline the picture then fills. Local units: nose at x = -240,
// fluke tip at x = +240, y down. Stroke 0 is the silhouette (closed); then the flipper's edge, the jaw and the eye.
const G = WH.glow;
export const WHALE_EYE = G.eye;
export function whaleBody() { return [...G.body, G.body[0]]; }
const ring = (c, r, n = 17) => Array.from({ length: n }, (_, i) => { const a = (i / (n - 1)) * Math.PI * 2; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
export function whaleStrokes() {
  return [{ pts: whaleBody() }, { pts: catmull(G.flipper, 6) }, { pts: catmull(G.jaw, 6) }, { pts: ring(G.eye, 4.5) }];
}
// swimming: a travelling wave that grows towards the flukes (vertical offset in local units)
export function swimDy(t, amp = 1) {
  return x => { const k = Math.max(0, (x + 120) / 360); return amp * Math.sin(t * 4.2 - x * 0.012) * 14 * k * k; };
}
export function swim(t, amp = 1) { const f = swimDy(t, amp); return ([x, y]) => [x, y + f(x)]; }

// the whale in the air above the book: plane z = ZB, centre O, scale S. It swims, lifts its head as it tries to
// rise, and sinks back as it stalls.
export const WHALE = { O: [20, -30], S: 2.1, Z: ZB };
function whaleState(t, T) {
  const up = tw(t, T.whaleB - 0.1, T.stall, E.inOutSine), sink = tw(t, T.stall, T.stall + 0.6, E.inCubic);
  return {
    a: -0.2 * up + 0.1 * sink,
    dy: -110 * up + Math.sin(t * 2.4) * 6 * tw(t, T.gatherB - 0.3, T.whaleB) + 50 * sink,
    wave: swimDy(t, tw(t, T.gatherB - 0.4, T.whaleB) * (1 - sink)),
  };
}
export function whalePose(t, T) {
  const s = whaleState(t, T), c = Math.cos(s.a), sn = Math.sin(s.a);
  return ([x, y]) => { const yy = y + s.wave(x); return [WHALE.O[0] + (x * c - yy * sn) * WHALE.S, WHALE.O[1] + s.dy + (x * sn + yy * c) * WHALE.S]; };
}
function whaleMatrix(t, T) {
  const s = whaleState(t, T);
  return M4.chain(M4.T(WHALE.O[0], WHALE.O[1] + s.dy, WHALE.Z), M4.RZ((s.a * 180) / Math.PI), M4.S(WHALE.S, WHALE.S, 1));
}
// where Seo-yun's tile will be on the class screen, in desk space (the question lands there)
export function seatOnTablet() {
  return xf(planeModel(TABLET.x, TABLET.y, 2, TABLET.w, TABLET.h, { rz: TABLET.rz }), TABLET.bez + (419 / 1920) * (TABLET.w - 2 * TABLET.bez), TABLET.bez + (160 / 1080) * (TABLET.h - 2 * TABLET.bez), 0);
}

export default function whaleScene(ctx) {
  const { T } = ctx;
  const el = h('section', 'scene whale');
  ctx.root.appendChild(el);
  const pic = whalePic('glow');
  el.appendChild(pic.el);
  const base = whaleStrokes();
  const lens = base.map(s => { const L = measure(s.pts); return L[L.length - 1]; });
  const total = lens.reduce((a, b) => a + b, 0);
  const r = rng(31);
  // when it stalls it comes apart into points: along the outline and all through the body
  const body = G.body;
  const inside = (x, y) => { let c = false; for (let i = 0, j = body.length - 1; i < body.length; j = i++) { const [xi, yi] = body[i], [xj, yj] = body[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const bits = [];
  base[0].pts.forEach((p, i) => { if (i % 3 === 0) bits.push({ p, vx: (r() - 0.5) * 90, vy: 80 + r() * 240, d: r() * 0.25, s: 1.4 + r() * 2.2 }); });
  while (bits.length < 260) { const p = [lerp(-240, 240, r()), lerp(-85, 115, r())]; if (inside(...p)) bits.push({ p, vx: (r() - 0.5) * 120, vy: 60 + r() * 260, d: r() * 0.3, s: 1 + r() * 1.8 }); }
  // sparkles that drift off it while it swims (it is imagination)
  const sparks = Array.from({ length: 46 }, () => ({ i: Math.floor(r() * body.length), ph: r(), sp: 0.7 + r() * 0.6, dx: -20 - r() * 60, dy: -30 - r() * 50 }));
  const eye = WHALE_EYE;
  const flickAt = t => (t > T.stall ? (Math.sin((t - T.stall) * 70) > 0.1 ? 1 : 0.25) * (1 - prog(t, T.stall, T.stall + 0.3)) : 1);

  function update(t) {
    // the picture fills in behind the light, head to tail, then flickers out when it stalls
    const rk = tw(t, T.whaleA + 0.1, T.whaleB + 0.25, E.inOutSine);
    const on = t > T.whaleA && t < T.stall + 0.35;
    pic.el.style.visibility = on ? 'visible' : 'hidden';
    if (!on) return pic.clear();
    const s = whaleState(t, T);
    place(pic.el, ctx.CM, pic.model(whaleMatrix(t, T)));
    pic.draw({ wave: s.wave, reveal: lerp(-300, 300, rk), soft: 70, alpha: 0.95 * flickAt(t) });
  }

  function draw(fx, t) {
    const CM = ctx.CM;
    const tf = whalePose(t, T);
    const P3 = pts => project(CM, pts.map(p => [p[0], p[1], WHALE.Z]));
    // the light traces the outline through the gathered words; once the picture has filled in, it settles to a rim
    const dk = tw(t, T.whaleA, T.whaleB, E.inOutSine);
    const flick = flickAt(t);
    const rim = 1 - 0.55 * tw(t, T.whaleB, T.whaleB + 0.4);
    if (t < T.stall + 0.3 && dk > 0) {
      let acc = 0;
      base.forEach((s, j) => {
        const a0 = acc / total, a1 = (acc + lens[j]) / total;
        acc += lens[j];
        const k = clamp((dk - a0) / (a1 - a0));
        if (k <= 0) return;
        fx.line(P3(slice(s.pts.map(tf), 0, k)), { w: j ? 3 : 4.4, alpha: flick * (j ? rim * 0.6 : rim), taper: 0, head: k < 1 ? 1.1 : 0, cool: 0.2, ink: '#DDE7D6', inkW: 0.7 });
      });
      const e = P3([tf(eye)])[0];
      fx.flare(e[0], e[1], 180, 0.25 * tw(t, T.whaleB - 0.2, T.whaleB + 0.2) * flick);
    }
    // sparkles drifting off the back and the flukes
    const sk = tw(t, T.whaleB - 0.2, T.whaleB + 0.2) * (1 - prog(t, T.stall, T.stall + 0.2));
    if (sk > 0) for (const p of sparks) {
      const age = ((t * p.sp + p.ph) % 1);
      const b = tf(body[p.i]);
      const q = P3([[b[0] + p.dx * age, b[1] + p.dy * age]])[0];
      fx.head(q[0], q[1], 0.9, sk * Math.sin(age * Math.PI) * 0.8);
    }
    // it comes apart: points drifting down and dimming
    if (t > T.stall + 0.1) {
      const k0 = t - (T.stall + 0.1);
      for (const b of bits) {
        const k = clamp((k0 - b.d) / 0.9);
        if (k <= 0 || k >= 1) continue;
        const p = tf(b.p);
        const q = P3([[p[0] + b.vx * k, p[1] + b.vy * k * k]])[0];
        fx.head(q[0], q[1], b.s * 0.45 * (1 - k * 0.6), (1 - k) * 0.7);
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

  return { el, range: ctx.S.whale, update, draw };
}
