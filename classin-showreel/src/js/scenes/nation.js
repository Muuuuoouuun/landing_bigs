// S6 · 전국으로 (16.80–19.20): the whale climbs into the sun, the camera rises above the clouds (generated
// cloud-sea plate) and the country appears beneath — the real outline of Korea as a dot map (KOSTAT boundaries).
// From the town the light spreads home to home, city to city, until the whole map is lit; pillars of light rise
// from the cities and fine 연두 arcs tie them together. The card: 전국 1,000+ 다지점 학원 · 오늘도, 집집마다 수업 중.
import { E, tw, prog, clamp, lerp, rng, drift, keyed, camMatrix, bezier, slice, h } from '../core.js';
import { project } from '../line.js';
import { MAP_W, MAP_H, DOTS, NODES } from '../../assets/korea-map.js';

const ORIGIN = [405, 660]; // the spread starts in the middle of the country and runs out to every coast
const CITY = { '서울 본사': '서울', '인천 송도': '인천', '강릉': '강릉', '대전 둔산': '대전', '대구 수성': '대구', '광주 봉선': '광주', '부산 센텀': '부산', '제주': '제주' };

export default function nationScene(ctx) {
  const { W, H, T, copy } = ctx;
  const el = h('section', 'scene nation');
  ctx.root.appendChild(el);
  const plate = h('div', 'plate', '<img src="assets/gen/aerial.jpg" alt="">');
  const shade = h('div', 'nshade');
  const labels = h('div', 'nlabels');
  const card = h('div', 'tracker nat', `<b>${copy.nation.big}</b><span>${copy.nation.sub}</span>`);
  el.append(plate, shade, labels, card);
  const r = rng(9);
  const dots = [];
  for (let i = 0; i < DOTS.length; i += 2) {
    const x = DOTS[i] - MAP_W / 2, y = DOTS[i + 1] - MAP_H / 2;
    const d = Math.hypot(DOTS[i] - ORIGIN[0], DOTS[i + 1] - ORIGIN[1]);
    dots.push({ x, y, d, s: r() });
  }
  const maxD = Math.max(...dots.map(d => d.d));
  const nodes = NODES.map(n => ({ ...n, X: n.x - MAP_W / 2, Y: n.y - MAP_H / 2, d: Math.hypot(n.x - ORIGIN[0], n.y - ORIGIN[1]), city: CITY[n.label] }));
  const lab = nodes.filter(n => n.city).map(n => { const e = h('span', 'ncity', n.city); labels.appendChild(e); return { n, e }; });
  const litT = d => lerp(T.spreadA, T.spreadB, (d / maxD) ** 0.9);

  function camAt(t) {
    const c = keyed(t, [
      { t: 16.5, x: 0, y: 260, z: 0, s: 0.34, rx: 48, ry: 0, rz: -6 },
      { t: T.spreadA, x: 0, y: 60, z: 0, s: 0.6, rx: 34, ry: 0, rz: -3, e: E.outCubic },
      { t: T.spreadB, x: 20, y: 40, z: 0, s: 0.68, rx: 26, ry: 0, rz: 0, e: E.inOutSine },
      { t: 19.6, x: 20, y: 60, z: 0, s: 0.72, rx: 20, ry: 0, rz: 1, e: E.inOutSine },
    ]);
    c.ry += 2 * drift(t, 0.9, 0.1);
    c.d = 1700;
    return c;
  }

  let cur = null;
  function update(t) {
    const CM = camMatrix(camAt(t), W, H);
    el.style.opacity = tw(t, T.mapIn - 0.3, T.mapIn + 0.25, E.inOutSine) * (1 - tw(t, T.liftOff + 0.05, 19.45, E.inOutSine));
    const k = tw(t, 16.5, 19.6);
    plate.style.transform = `scale(${lerp(1.22, 1.08, k).toFixed(4)}) translateY(${lerp(30, -10, k).toFixed(1)}px)`;
    shade.style.opacity = lerp(0.72, 0.35, tw(t, T.spreadA, T.liftOff)).toFixed(3);
    for (const { n, e } of lab) {
      const q = project(CM, [[n.X, n.Y, 0]])[0];
      const on = tw(t, litT(n.d) + 0.1, litT(n.d) + 0.35, E.outCubic) * (1 - tw(t, T.liftOff - 0.1, T.liftOff + 0.2));
      e.style.opacity = on.toFixed(3);
      e.style.transform = `translate(${(q[0] + 12).toFixed(1)}px, ${(q[1] - 34 - on * 6).toFixed(1)}px)`;
    }
    const ck = tw(t, T.nationCard, T.nationCard + 0.35, E.outCubic) * (1 - tw(t, T.liftOff, T.liftOff + 0.3));
    card.style.opacity = ck.toFixed(3);
    card.style.transform = `translate(${((1 - ck) * -30).toFixed(1)}px, 0)`;
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    const { CM } = cur;
    const fade = tw(t, T.mapIn - 0.2, T.mapIn + 0.3) * (1 - tw(t, T.liftOff + 0.05, 19.4));
    if (fade <= 0) return;
    // the map: every dot is a neighbourhood; dim until the light reaches it, then warm, some 연두
    for (const d of dots) {
      const q = project(CM, [[d.x, d.y, 0]])[0];
      const lit = prog(t, litT(d.d), litT(d.d) + 0.25);
      const sz = 0.7 + 1.1 * CM[0];
      if (lit <= 0) { fx.dot(q[0], q[1], sz * 0.75, 'rgba(210,225,240,0.5)', 0.5 * fade); continue; }
      fx.dot(q[0], q[1], sz * (1 + 0.5 * (1 - lit)), d.s > 0.82 ? '#A6E86A' : '#FFD27A', fade * (0.75 + 0.25 * lit));
    }
    // the wave front
    const wk = prog(t, T.spreadA, T.spreadB);
    if (wk > 0 && wk < 1) {
      const R = (wk ** (1 / 0.9)) * maxD;
      const ring = Array.from({ length: 73 }, (_, i) => { const a = (i / 72) * Math.PI * 2; return [ORIGIN[0] - MAP_W / 2 + Math.cos(a) * R, ORIGIN[1] - MAP_H / 2 + Math.sin(a) * R, 0]; });
      fx.line(project(CM, ring), { w: 2, alpha: 0.35 * fade * (1 - wk), taper: 0 });
    }
    // cities: a pillar of light rises as the wave arrives, and an arc ties it back to where it began
    const o = [ORIGIN[0] - MAP_W / 2, ORIGIN[1] - MAP_H / 2, 0];
    for (const n of nodes) {
      const t0 = litT(n.d);
      const k = tw(t, t0, t0 + 0.4, E.outCubic);
      if (k <= 0) continue;
      const hgt = (n.tier === 0 ? 260 : n.tier === 1 ? 200 : n.tier === 2 ? 130 : 80) * k;
      const base = [n.X, n.Y, 0];
      const pil = project(CM, [base, [n.X, n.Y, hgt]]);
      fx.line(pil, { w: n.tier <= 1 ? 3.2 : 2.2, alpha: fade * (1 - 0.4 * tw(t, T.liftOff - 0.3, T.liftOff)), taper: 0.7, head: n.tier <= 1 ? 0.8 : 0.4 });
      if (n.tier <= 2 && n.d > 30) {
        const arc = bezier(o, [o[0] * 0.5 + n.X * 0.5, o[1] * 0.5 + n.Y * 0.5, 140 + n.d * 0.25], [n.X, n.Y, 90], base, 24);
        const ak = tw(t, t0 - 0.35, t0, E.inOutSine);
        fx.line(slice(project(CM, arc), 0, ak), { w: 1.4, alpha: 0.5 * fade, taper: 0, cool: 0.6, ink: '#A6E86A', inkW: 1 });
        if (ak < 1) { const q = slice(project(CM, arc), Math.max(0, ak - 0.25), ak); fx.line(q, { w: 2.6, alpha: fade, taper: 1, head: 1 }); }
      }
      fx.flare(pil[0][0], pil[0][1], (n.tier <= 1 ? 70 : 40) * (1 + (1 - k)), 0.5 * fade * (1 - 0.5 * k));
    }
    // the origin: where the whale came down
    const oq = project(CM, [o])[0];
    fx.flare(oq[0], oq[1], 160, 0.6 * fade * tw(t, T.mapIn, T.spreadA));
    // lift-off: every light rises towards the frame top (into the morning)
    if (t > T.liftOff - 0.3) {
      const lk = tw(t, T.liftOff - 0.3, 19.4, E.inCubic);
      for (const n of nodes.filter(n => n.tier <= 1)) {
        const b = project(CM, [[n.X, n.Y, 200]])[0];
        fx.line([b, [lerp(b[0], W / 2, lk * 0.6), lerp(b[1], -100, lk)]], { w: 3, alpha: fade, taper: 1, head: 1 });
      }
    }
  }

  return { el, range: ctx.S.nation, update, draw };
}
