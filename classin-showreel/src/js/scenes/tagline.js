// S5 · 태그라인 (19.20–24.00): on clean paper the light writes "책 속의 배움이 모여, / 모든 집의
// 상상력으로." — a 연두 marker runs under 배움 and 상상력. Then the threads rising from every home
// come in from the edges of the frame and converge on one point: where the i-dot of the logo will land.
import { E, tw, prog, clamp, lerp, rng, bezier, slice, h } from '../core.js';
import { markRest } from './hero.js';

export default function tagScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene tag');
  ctx.root.appendChild(el);
  const mkLine = parts => {
    const d = h('div', 'tl');
    d.innerHTML = parts.map((p, i) => `<span class="${i === 1 ? 'ac' : ''}">${i === 1 ? `<em class="mk"></em>` : ''}${p}</span>`).join('');
    el.appendChild(d);
    return d;
  };
  const L1 = mkLine(copy.tag1), L2 = mkLine(copy.tag2);
  const lines = [L1, L2];
  let G = null;
  function layout() {
    G = lines.map((d, i) => {
      const w = d.offsetWidth, hh = d.offsetHeight;
      const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 + (i ? 1 : -1) * (P ? 78 : 72) - hh / 2);
      d.style.transform = `translate(${x}px, ${y}px)`;
      const ac = d.querySelector('.ac');
      return { x, y, w, h: hh, ax: x + ac.offsetLeft, aw: ac.offsetWidth, base: y + hh * 0.86 };
    });
  }
  const win = [[T.sweepA, T.tag2 - 0.1], [T.tag2, T.underA - 0.05]];
  const under = [[T.underA, T.underA + 0.32], [T.underA + 0.3, T.underB + 0.05]];
  const r = rng(13);
  const threads = Array.from({ length: 30 }, (_, i) => {
    const side = i % 3; // bottom, left, right
    const u = r();
    const from = side === 0 ? [lerp(-200, W + 200, u), H + 120] : side === 1 ? [-160, lerp(H * 0.2, H + 100, u)] : [W + 160, lerp(H * 0.2, H + 100, u)];
    return { from, d: r() * 0.18, bend: (r() - 0.5) * 0.6 };
  });

  function update(t) {
    el.style.opacity = tw(t, 19.05, 19.3) * (1 - tw(t, T.breath - 0.2, T.hero - 0.05, E.inQuad));
    lines.forEach((d, i) => {
      const k = tw(t, win[i][0], win[i][1], E.inOutSine);
      const g = G[i];
      const edge = k * (g.w + 80) - 40;
      d.style.webkitMaskImage = d.style.maskImage = `linear-gradient(90deg, #000 ${edge - 30}px, transparent ${edge + 30}px)`;
      const rec = tw(t, T.glowB, T.breath, E.inOutSine);
      d.style.transform = `translate(${g.x}px, ${(g.y - rec * 10 * (i ? -1 : 1)).toFixed(2)}px) scale(${(1 - rec * 0.03).toFixed(4)})`;
      d.style.filter = rec > 0.01 ? `blur(${(rec * 3).toFixed(2)}px)` : '';
      d.style.opacity = (1 - rec * 0.85).toFixed(3);
      const mk = d.querySelector('.mk');
      mk.style.transform = `scaleX(${tw(t, under[i][0], under[i][1], E.inOutCubic).toFixed(4)})`;
      const glow = tw(t, T.glowA, T.glowA + 0.4) * (1 - tw(t, T.glowB, T.breath));
      d.querySelector('.ac').style.textShadow = glow > 0.01 ? `0 0 ${(18 * glow).toFixed(1)}px rgba(141,214,63,${(0.6 * glow).toFixed(3)})` : 'none';
    });
  }

  function draw(fx, t) {
    if (!G) return;
    // the writing light at the reveal edge
    lines.forEach((d, i) => {
      const g = G[i], [a, b] = win[i];
      if (t < a || t > b + 0.15) return;
      const k = tw(t, a, b, E.inOutSine);
      const x = g.x + k * (g.w + 80) - 40;
      const pts = [[g.x - 10, g.base + 8], [x, g.base + 8]];
      fx.line(slice(pts, Math.max(0, 1 - 160 / Math.max(1, x - g.x + 10)), 1), { w: 3.4, alpha: 1 - prog(t, b, b + 0.15), taper: 1, head: 1 });
    });
    // the light that lays the marker
    under.forEach(([a, b], i) => {
      if (t < a || t > b + 0.2) return;
      const g = G[i], k = tw(t, a, b, E.inOutCubic);
      const y = g.base - 6;
      fx.line([[g.ax + k * g.aw * 0.7, y], [g.ax + k * g.aw, y]], { w: 4, alpha: 1 - prog(t, b, b + 0.2), taper: 1, head: 1 });
    });
    // the threads from every home converge on the i-dot
    if (t > T.conv - 0.2) {
      const D = markRest(W, H, P).dot;
      for (const th of threads) {
        const k = E.inCubic(prog(t, T.conv + th.d * 0.3, T.hero));
        if (k <= 0) continue;
        const c1 = [lerp(th.from[0], D[0], 0.35) + th.bend * 400, lerp(th.from[1], D[1], 0.2)];
        const c2 = [lerp(th.from[0], D[0], 0.8), lerp(th.from[1], D[1], 0.75) + th.bend * 200];
        const path = bezier(th.from, c1, c2, D, 30);
        fx.line(slice(path, Math.max(0, k - 0.35), k), { w: 2.6, alpha: clamp(k * 3), taper: 1, head: 0.7 });
      }
      const gk = tw(t, T.conv, T.hero, E.inQuad);
      fx.flare(D[0], D[1], 60 + 120 * gk, 0.6 * gk);
    }
  }

  return { el, range: ctx.S.tag, layout, update, draw };
}
