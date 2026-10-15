// S5 · 미래 (14.40–17.00): the heart's light becomes Jihoo's learning path. Past months are drawn
// solid (72 → 80 → 88), today glows (his first presentation, trophy 36), and the light runs on as a
// dashed line into what comes next — 미분, 고3 — towards a dawn on the horizon: 지후의 꿈.
import { E, tw, prog, clamp, lerp, keyed, drift, camMatrix, measure, slice, pointAt, h } from '../core.js';
import { project } from '../line.js';
import { avatar } from '../avatar.js';

const CUP = '<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="#F5C542"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="#E0A92A" stroke-width="1.6" fill="none"/><path d="M10.5 13h3v3h-3z" fill="#E0A92A"/><rect x="8" y="16" width="8" height="3" rx="1" fill="#F5C542"/></svg>';

export default function futureScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const grid = h('canvas', 'mapc');
  grid.width = W; grid.height = H;
  const horizon = h('div', 'horizon');
  el.append(horizon, grid);
  const g = grid.getContext('2d');

  // the path on the ground plane: near (y > 0) → far (y < 0), rising gently into the future
  const Y0 = 520, Y1 = -3000;
  const pathAt = y => [Math.sin((y - Y0) / 760) * 170, y, Math.max(0, (Y0 - y)) * 0.075];
  const path = [];
  for (let y = Y0; y >= Y1; y -= 20) path.push(pathAt(y));
  const L = measure(path), total = L[L.length - 1];
  const uOf = y => L[Math.round((Y0 - y) / 20)] / total;
  const NODE_Y = [420, 300, 180, 30, -520, -1150, -2300];
  const nodes = copy.timeline.map(([a, b, kind], i) => ({ a, b, kind, y: NODE_Y[i], u: uOf(NODE_Y[i]), p: pathAt(NODE_Y[i]) }));
  const uToday = nodes[3].u, uEnd = uOf(-2700);
  const ji = avatar({ seed: 1, hair: 0, smile: 0.95, shirt: '#3F6FB5', id: 'ftJi', w: 80, h: 80 });
  nodes.forEach(n => {
    n.el = h('div', `tl ${n.kind}`, n.kind === 'today'
      ? `<span class="avc">${ji}</span><div><em>${n.a}</em><b>${n.b}</b></div><span class="cp">${CUP}</span>`
      : `<em>${n.a}</em><b>${n.b}</b>`);
    el.appendChild(n.el);
  });

  function camAt(t) {
    const c = keyed(t, P ? [
      { t: 14.2, x: 0, y: 380, z: 0, s: 1.25, rx: 58, rz: -6 },
      { t: T.today + 0.1, x: 0, y: 120, z: 10, s: 1.35, rx: 60, rz: -3, e: E.inOutSine },
      { t: T.futureB, x: 40, y: -900, z: 60, s: 1.25, rx: 66, rz: 2, e: E.inOutSine },
      { t: 17.2, x: 0, y: -1400, z: 80, s: 0.7, rx: 30, rz: 0, e: E.inOutCubic },
    ] : [
      { t: 14.2, x: 0, y: 380, z: 0, s: 1.25, rx: 60, rz: -8 },
      { t: T.today + 0.1, x: 30, y: 100, z: 10, s: 1.35, rx: 62, rz: -4, e: E.inOutSine },
      { t: T.futureB, x: 60, y: -900, z: 60, s: 1.15, rx: 68, rz: 2, e: E.inOutSine },
      { t: 17.2, x: 0, y: -1400, z: 80, s: 0.6, rx: 30, rz: 0, e: E.inOutCubic },
    ]);
    c.ry = 1.5 * drift(t, 2.2, 0.1);
    c.sy = P ? 140 : 90;
    c.d = 1500;
    return c;
  }

  let CM = null;
  function update(t) {
    CM = camMatrix(camAt(t), W, H);
    const a = tw(t, 14.2, 14.55, E.outCubic) * (1 - tw(t, 16.8, 17.2, E.inQuad));
    el.style.opacity = a;
    // faint perspective grid (the ground the path is drawn on)
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1;
    const line = (pts, al) => {
      g.strokeStyle = `rgba(220,228,240,${al})`;
      g.beginPath();
      project(CM, pts).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.stroke();
    };
    for (let x = -1400; x <= 1400; x += 140) line([[x, 700, 0], [x, -3200, 0]], 0.05);
    for (let y = 700; y >= -3200; y -= 140) line([[-1400, y, 0], [1400, y, 0]], 0.05 * clamp(1 - (700 - y) / 4200));
    // dawn on the horizon
    const hp = project(CM, [[0, -3600, 400]])[0];
    horizon.style.transform = `translate(${hp[0].toFixed(1)}px, ${hp[1].toFixed(1)}px)`;
    horizon.style.opacity = tw(t, T.futureA, T.futureB, E.inOutSine) * 0.95;
    // labels appear as the light reaches them
    const head = headU(t);
    nodes.forEach(n => {
      const on = tw(t, timeAt(n.u) - 0.05, timeAt(n.u) + 0.25, E.outBack);
      const [sx, sy] = project(CM, [[n.p[0], n.p[1], n.p[2] + (n.kind === 'today' ? 40 : 26)]])[0];
      n.el.style.opacity = clamp(on) * (head >= n.u - 0.002 ? 1 : 0);
      const sc = n.kind === 'today' ? 1 : n.kind === 'dream' ? 1.15 : 0.9;
      n.el.style.transform = `translate(${(sx - n.el.offsetWidth / 2).toFixed(1)}px, ${(sy - n.el.offsetHeight).toFixed(1)}px) scale(${(sc * (0.7 + 0.3 * clamp(on))).toFixed(3)})`;
    });
  }
  // the light's position along the path over time: past (solid) then future (dashed)
  function headU(t) {
    if (t < T.today) return lerp(0, uToday, E.inOutSine(prog(t, T.pathA, T.today)));
    if (t < T.futureA) return uToday;
    return lerp(uToday, uEnd, E.inOutSine(prog(t, T.futureA, T.futureB)));
  }
  function timeAt(u) {
    if (u <= uToday) return T.pathA + (T.today - T.pathA) * (Math.acos(1 - 2 * clamp(u / uToday)) / Math.PI);
    return T.futureA + (T.futureB - T.futureA) * (Math.acos(1 - 2 * clamp((u - uToday) / (uEnd - uToday))) / Math.PI);
  }

  function draw(fx, t) {
    if (!CM) return;
    const a = +el.style.opacity;
    // the heart's light arrives from above
    if (t >= 14.2 && t < T.pathA + 0.1) {
      const p0 = project(CM, [path[0]])[0];
      const k = E.inQuad(prog(t, 14.2, T.pathA));
      fx.line([[lerp(W / 2, p0[0], k * 0.6), lerp(-200, p0[1], k) - 120], [lerp(W / 2, p0[0], k), lerp(-200, p0[1], k)]], { w: 4.5, alpha: 1, taper: 1, head: 1 });
    }
    if (t < T.pathA) return;
    const u = headU(t);
    // past → today: solid
    const uS = Math.min(u, uToday);
    fx.line(project(CM, slice(path, 0, uS, L)), { w: 4, alpha: a * 0.85, taper: 0.5, head: u <= uToday + 0.001 ? 1 : 0 });
    // today → future: a dashed light
    if (u > uToday) {
      const seg = 0.012, gap = 0.008;
      for (let s0 = uToday; s0 < u; s0 += seg + gap) {
        const s1 = Math.min(u, s0 + seg);
        const fade = 1 - (s0 - uToday) / (uEnd - uToday) * 0.35;
        fx.line(project(CM, slice(path, s0, s1, L)), { w: 3.6, alpha: a * fade, taper: 0, head: 0 });
      }
      const hp = project(CM, [pointAt(path, u, L)])[0];
      fx.head(hp[0], hp[1], 4.2, a);
    }
    // nodes
    nodes.forEach(n => {
      if (u < n.u - 0.001) return;
      const [x, y] = project(CM, [n.p])[0];
      fx.head(x, y, n.kind === 'today' ? 5 : 2.6, a * (n.kind === 'past' ? 0.7 : 1));
      if (n.kind === 'today') fx.flare(x, y, 160, 0.5 * (1 - prog(t, T.today, T.today + 0.6)) + 0.12, '255,236,200');
    });
  }

  return { el, range: ctx.S.future, update, draw };
}
