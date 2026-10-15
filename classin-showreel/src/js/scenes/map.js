// S6 · 전국 (16.90–19.20): crane up from Jihoo's path — his classroom in Busan is one light on a map
// of Korea. Then, from every classroom in the country, the same light rises: every child, every
// future. The brightest one lifts off and becomes the light that writes the tagline.
import { E, tw, prog, clamp, lerp, keyed, drift, camMatrix, rng, h } from '../core.js';
import { project } from '../line.js';
import { MAP_W, MAP_H, DOTS, NODES } from '../../assets/korea-map.js';

export default function mapScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const canvas = h('canvas', 'mapc');
  canvas.width = W; canvas.height = H;
  el.appendChild(canvas);
  const g = canvas.getContext('2d');
  const wx = x => x - MAP_W / 2, wy = y => y - MAP_H / 2;
  const bi = NODES.findIndex(n => n.label === '부산 센텀');
  const BUSAN = [wx(NODES[bi].x), wy(NODES[bi].y), 0];

  // every classroom: the named branches + a seeded scatter of land dots
  const r = rng(31);
  const rooms = NODES.map(n => ({ x: wx(n.x), y: wy(n.y), big: n.tier <= 1 }));
  for (let i = 0; i < 150; i++) {
    const k = Math.floor(r() * (DOTS.length / 2)) * 2;
    rooms.push({ x: wx(DOTS[k]), y: wy(DOTS[k + 1]), big: false });
  }
  const maxD = Math.max(...rooms.map(o => Math.hypot(o.x - BUSAN[0], o.y - BUSAN[1])));
  rooms.forEach((o, i) => {
    const d = Math.hypot(o.x - BUSAN[0], o.y - BUSAN[1]);
    o.t0 = i === bi ? T.mapIn + 0.15 : T.pillarsA + (d / maxD) * (T.pillarsB - T.pillarsA - 0.25) + r() * 0.2;
    o.hgt = i === bi ? 150 : o.big ? 70 + r() * 30 : 26 + r() * 34;
  });

  const label = h('div', 'mlabel me', `<i></i>${copy.branch.replace('지점', '')} · 지후의 교실`);
  const card = h('div', 'mcap', '<b>오늘, 전국 <em class="n">1</em>개의 교실에서</b><span>1,000+ 다지점 학원 · ClassIn</span>');
  el.append(label, card);
  if (P) { card.style.left = '50%'; card.style.marginLeft = '-240px'; card.style.top = '150px'; }
  const num = card.querySelector('.n');

  function camAt(t) {
    const c = keyed(t, P ? [
      { t: 16.75, x: BUSAN[0], y: BUSAN[1], s: 4.2, rx: 0, rz: 0 },
      { t: T.pillarsA, x: BUSAN[0] * 0.6, y: BUSAN[1] * 0.6, s: 2.0, rx: 30, rz: -6, e: E.inOutCubic },
      { t: T.pillarsB, x: 20, y: 120, s: 1.25, rx: 50, rz: -10, e: E.inOutSine },
      { t: 19.6, x: 30, y: 100, s: 1.3, rx: 52, rz: -12 },
    ] : [
      { t: 16.75, x: BUSAN[0], y: BUSAN[1], s: 4.0, rx: 0, rz: 0 },
      { t: T.pillarsA, x: BUSAN[0] * 0.6, y: BUSAN[1] * 0.6, s: 1.7, rx: 32, rz: -6, e: E.inOutCubic },
      { t: T.pillarsB, x: 10, y: 80, s: 0.95, rx: 52, rz: -10, e: E.inOutSine },
      { t: 19.6, x: 20, y: 60, s: 1.0, rx: 54, rz: -12 },
    ]);
    c.ry = 1.5 * drift(t, 2.2, 0.1);
    c.sx = P ? 0 : 120 * tw(t, T.pillarsA, T.pillarsB);
    c.sy = P ? 140 * tw(t, T.pillarsA, T.pillarsB) : 20;
    c.d = 1700;
    return c;
  }

  let CM = null;
  function update(t) {
    CM = camMatrix(camAt(t), W, H);
    const a = tw(t, 16.75, 17.15, E.outQuad) * (1 - tw(t, 19.1, 19.55, E.inQuad));
    el.style.opacity = a;
    const blur = (1 - tw(t, 16.75, 17.1)) * 8;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
    g.clearRect(0, 0, W, H);
    const lit = rooms.filter(o => t > o.t0).map(o => [o.x, o.y, clamp((t - o.t0) / 0.4)]);
    for (let i = 0; i < DOTS.length; i += 2) {
      const x = wx(DOTS[i]), y = wy(DOTS[i + 1]);
      const w = CM[3] * x + CM[7] * y + CM[15];
      if (w <= 0.05) continue;
      const sx = (CM[0] * x + CM[4] * y + CM[12]) / w, sy = (CM[1] * x + CM[5] * y + CM[13]) / w;
      if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) continue;
      let glow = 0;
      for (const [lx, ly, k] of lit) { const dd = (x - lx) ** 2 + (y - ly) ** 2; if (dd < 3600) glow = Math.max(glow, k * (1 - dd / 3600)); }
      const size = Math.max(1.1, (CM[0] ** 2 + CM[1] ** 2) ** 0.5 / w * 3.6);
      g.fillStyle = `rgba(${lerp(150, 255, glow) | 0},${lerp(156, 252, glow) | 0},${lerp(166, 240, glow) | 0},${lerp(0.4, 0.95, glow)})`;
      g.fillRect(sx - size / 2, sy - size / 2, size, size);
    }
    const [lx, ly] = project(CM, [[BUSAN[0], BUSAN[1], 165]])[0];
    const lk = tw(t, T.mapIn + 0.2, T.mapIn + 0.45, E.outBack);
    label.style.opacity = clamp(lk) * (1 - tw(t, 18.9, 19.2));
    label.style.transform = `translate(${(lx - label.offsetWidth / 2).toFixed(1)}px, ${(ly - label.offsetHeight - 8).toFixed(1)}px) scale(${0.6 + 0.4 * clamp(lk)})`;
    const ck = tw(t, T.pillarsA + 0.1, T.pillarsA + 0.45, E.outCubic) * (1 - tw(t, 18.95, 19.25));
    card.style.opacity = ck;
    card.style.transform = `translateY(${(1 - ck) * -20}px)`;
    num.textContent = Math.max(1, Math.round(1024 * E.outCubic(prog(t, T.pillarsA, T.pillarsB)))).toLocaleString('en-US');
  }

  function draw(fx, t) {
    if (!CM) return;
    const a = +el.style.opacity;
    // the light comes down from Jihoo's path onto his classroom
    if (t < T.mapIn + 0.2) {
      const bp = project(CM, [BUSAN])[0];
      const k = E.inQuad(prog(t, 16.75, T.mapIn + 0.15));
      fx.line([[bp[0], bp[1] - 700 * (1 - k) - 160], [bp[0], bp[1] - 700 * (1 - k)]], { w: 5, alpha: k, taper: 1, head: 1 });
    }
    // every classroom's light rises
    rooms.forEach((o, i) => {
      if (t < o.t0) return;
      const p = prog(t, o.t0, o.t0 + 0.5);
      const top = o.hgt * E.outCubic(p);
      const hero = i === bi;
      fx.line(project(CM, [[o.x, o.y, 0], [o.x, o.y, top]]), { w: hero ? 4.2 : o.big ? 2.4 : 1.6, alpha: a * (hero ? 1 : o.big ? 0.85 : 0.6), taper: 0.85, head: hero ? 0.9 : 0.35 });
      const base = project(CM, [[o.x, o.y, 0]])[0];
      if (p < 1) fx.flare(base[0], base[1], hero ? 120 : 40, (1 - p) * (hero ? 0.6 : 0.3), '235,245,255');
    });
    // the brightest light lifts off towards the camera — it will write the tagline
    if (t > T.liftOff) {
      const top = project(CM, [[BUSAN[0], BUSAN[1], 150]])[0];
      const k = E.inCubic(prog(t, T.liftOff, 19.2));
      const x = lerp(top[0], W / 2, k), y = lerp(top[1], H / 2, k);
      fx.line([[lerp(top[0], x, 0.6), lerp(top[1], y, 0.6) + 40], [x, y]], { w: 4 + k * 2, alpha: 1, taper: 1, head: 1, headScale: 1 + k });
    }
  }

  return { el, range: ctx.S.map, update, draw };
}
