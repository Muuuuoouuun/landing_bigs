// S7–S8 (v8) · 9.45–11.85 · the finished drawing comes alive: the generated light-whale fills in over the teacher's
// whale on the board (head to tail), rises off the glass as the camera pulls back out of the tablet, turns in the air
// and flies across the room to the window — wearing the friends' wings and balloons in light.
import { E, tw, prog, clamp, lerp, rng, M4 } from '../core.js';
import { project } from '../line.js';
import { whalePic } from '../whalepic.js';
import { swimDy } from '../whalegeo.js';
import { WC, WS, PARTS } from '../classui.js';
import { TABLET, classToWorld } from './room.js';
import WH from '../../assets/gen/whale.js';

const SX = (TABLET.w - 2 * TABLET.bez) / 1920;
const P1 = [860, -260, 640], P2 = [1308, -872, 1050]; // swings left over the desk, then into the window
const PENS = ['#9FD0FF', '#F59A23'];

export default function whaleScene(ctx) {
  const { T } = ctx;
  const el = document.createElement('section');
  el.className = 'scene whale';
  ctx.root.appendChild(el);
  const pic = whalePic('glow');
  el.appendChild(pic.el);
  const r = rng(31);
  const body = WH.glow.body;
  const sparks = Array.from({ length: 40 }, () => ({ i: Math.floor(r() * body.length), ph: r(), sp: 0.7 + r() * 0.6, dx: -20 - r() * 60, dy: -30 - r() * 50 }));
  const P0 = [...classToWorld(WC, 2)];

  // whale-local → world
  function pose(t) {
    const up = tw(t, T.lift - 0.05, T.flyA + 0.05, E.inOutCubic);
    const turn = tw(t, T.lift + 0.3, T.flyA + 0.3, E.inOutCubic);
    const fk = tw(t, T.flyA, T.window + 0.15, E.inOutSine);
    const b = [P0[0], P0[1], P0[2] + 130 * up];
    const pos = b.map((v, i) => (1 - fk) * (1 - fk) * v + 2 * fk * (1 - fk) * P1[i] + fk * fk * P2[i]);
    const s = lerp(WS * SX, 0.72, up) * lerp(1, 0.5, fk);
    const stand = tw(t, T.lift - 0.1, T.flyA + 0.15, E.inOutCubic); // peels off the glass and turns to face the room
    const M = M4.chain(M4.T(pos[0], pos[1], pos[2]), M4.RX(-90 * stand), M4.RX(-17.2 * fk), M4.RZ(lerp(TABLET.rz, -22, fk)), M4.RY(180 * turn), M4.S(s, s, 1));
    return { M, pos, up, edge: 0.35 + 0.65 * Math.abs(Math.cos(turn * Math.PI)) };
  }
  const ap = (M, [x, y]) => [M[0] * x + M[4] * y + M[12], M[1] * x + M[5] * y + M[13], M[2] * x + M[6] * y + M[14]];

  function update(t) {
    const vis = t > T.liftA && t < T.window + 0.45;
    pic.el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) { ctx.whaleGlow = null; return pic.clear(); }
    const { M, pos } = pose(t);
    place2(pic.el, ctx.CM, pic.model(M));
    ctx.whaleGlow = { pos, a: tw(t, T.liftA, T.lift) * (1 - tw(t, T.window + 0.1, T.window + 0.45)) };
    const rv = tw(t, T.liftA, T.liftA + 0.4, E.inOutSine);
    const out = 1 - tw(t, T.window + 0.2, T.window + 0.45);
    pic.draw({ wave: swimDy(t, tw(t, T.liftA + 0.3, T.lift) * 1.2), reveal: lerp(-300, 300, rv), soft: 70, alpha: 0.95 * out });
  }
  function place2(e, CM, m) { e.style.transform = `matrix3d(${M4.mul(CM, m).map(v => +v.toFixed(6)).join(',')})`; }

  function draw(fx, t) {
    if (t < T.liftA + 0.2 || t > T.window + 0.45) return;
    const { M, pos, edge } = pose(t), CM = ctx.CM;
    const al = tw(t, T.liftA + 0.2, T.liftA + 0.5) * (1 - tw(t, T.window + 0.2, T.window + 0.45)) * edge;
    const wave = swimDy(t, 1.2), k = Math.sin(t * 10) * tw(t, T.lift, T.flyA);
    // the friends' wings (beating) and balloons, in light
    PARTS[0].forEach(w => {
      const pts = w.map(([x, y]) => { const x2 = x + (x - 10) * 0.08 * k, y2 = -62 + (y + 62) * (1 + 0.32 * k) + wave(x); return ap(M, [x2, y2]); });
      fx.line(project(CM, pts), { w: 3.4, alpha: al, taper: 0, head: 0, cool: 0.15, ink: PENS[0], inkW: 0.8 });
    });
    PARTS[1].forEach((w, m) => {
      const pts = w.map(([x, y]) => ap(M, [x, y + wave(x) + Math.sin(t * 3 + m) * 4]));
      fx.line(project(CM, pts), { w: m % 2 ? 1.6 : 3, alpha: al * (m % 2 ? 0.6 : 1), taper: 0, head: 0, cool: 0.25, ink: m % 2 ? '#CFC6B4' : PENS[1], inkW: 0.8 });
    });
    // sparkles drifting off it
    for (const p of sparks) {
      const age = (t * p.sp + p.ph) % 1, b = body[p.i];
      const q = project(CM, [ap(M, [b[0] + p.dx * age, b[1] + p.dy * age + wave(b[0])])])[0];
      fx.head(q[0], q[1], 0.9, al * Math.sin(age * Math.PI) * 0.8);
    }
    const e = project(CM, [pos])[0];
    fx.flare(e[0], e[1], 220, 0.28 * al);
  }

  return { el, range: ctx.S.whale, update, draw };
}
