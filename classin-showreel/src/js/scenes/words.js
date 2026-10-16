// S3 · 단어가 모여 고래가 되다 (5.55–9.40): the words, formulas and pictures on the final spread lift off the
// page, swirl up and fly into place along the outline of a whale floating above the book. They ride the whale
// as it tries to rise, and fall away with it when it stalls.
import { E, tw, prog, clamp, lerp, rng, M4, place, measure, slice, h } from '../core.js';
import { TILT } from './book.js';
import { whaleStrokes, whalePose, WHALE } from './whale.js';

export default function wordsScene(ctx) {
  const { T } = ctx;
  const el = h('section', 'scene words');
  ctx.root.appendChild(el);
  let toks = [];
  const r = rng(42);

  function layout() {
    toks = ctx.tokens;
    // targets: evenly spaced along the whale's strokes (most on the body outline)
    const strokes = whaleStrokes();
    const lens = strokes.map(s => { const L = measure(s.pts); return L[L.length - 1]; });
    const share = strokes.map((s, i) => (i === 0 ? 0.62 : 0.38 * lens[i] / lens.slice(1).reduce((a, b) => a + b, 0)));
    const targets = [];
    strokes.forEach((s, i) => {
      const n = Math.max(1, Math.round(share[i] * toks.length));
      for (let j = 0; j < n; j++) { const p = slice(s.pts, 0, (j + 0.5) / n); targets.push(p[p.length - 1]); }
    });
    while (targets.length < toks.length) targets.push(targets[targets.length % 7]);
    targets.length = toks.length;
    // match left-to-right so the paths don't tangle
    const tk = toks.map((k, i) => ({ i, key: (k.page === 'L' ? 0 : 1000) + k.x + k.y * 0.2 })).sort((a, b) => a.key - b.key);
    const tg = targets.map(p => ({ p, key: p[0] })).sort((a, b) => a.key - b.key);
    tk.forEach((o, j) => { toks[o.i].target = tg[j].p; });
    toks.forEach(k => {
      k.seed = r();
      k.delay = clamp((k.page === 'L' ? 0 : 0.12) + (k.y / 680) * 0.25 + r() * 0.12, 0, 0.5);
      k.arrive = lerp(T.gatherA + 0.45, T.gatherB, (Math.floor(r() * 4) + r() * 0.5) / 4.5);
      k.scale = clamp(40 / Math.max(k.w * 0.5, k.h), 0.42, 0.85);
      k.tilt = (k.page === 'L' ? 1 : -1) * TILT;
      const c = M4.apply(k.M, k.x + k.w / 2, k.y + k.h / 2, 0);
      k.c0 = [c[0], c[1], 0.4];
      k.fall = [(r() - 0.5) * 120, 120 + r() * 260];
    });
  }

  function tokenAt(k, t) {
    const u = tw(t, T.liftA + k.delay, T.gatherA + 0.7, E.inOutSine);
    const rel = [k.c0[0], k.c0[1] + 20];
    const ang = u * (0.7 + 0.5 * k.seed) * (k.page === 'L' ? 1 : -1);
    const rad = 1 - 0.3 * u, ca = Math.cos(ang), sa = Math.sin(ang);
    const L = [(rel[0] * ca - rel[1] * sa) * rad, (rel[0] * sa + rel[1] * ca) * rad - 20 - u * 60, k.c0[2] + u * (360 + 200 * k.seed) + Math.sin(t * 2.1 + k.seed * 9) * 14 * u];
    const g = E.inOutCubic(prog(t, T.gatherA - 0.1, k.arrive));
    const B = whalePose(t, T)(k.target);
    const arc = Math.sin(g * Math.PI) * 120;
    let p = [lerp(L[0], B[0], g), lerp(L[1], B[1], g) - arc * 0.4, lerp(L[2], WHALE.Z, g) + arc];
    // the stall: they fall away with the whale
    const f = clamp((t - T.stall - 0.1 - k.seed * 0.2) / 0.9);
    if (f > 0) p = [p[0] + k.fall[0] * f, p[1] + k.fall[1] * f * f, p[2]];
    return { p, u, g, f, s: lerp(1, k.scale, g) * (1 + 0.12 * Math.sin(Math.PI * u) * (1 - g)) };
  }

  let shown = true;
  function update(t) {
    const CM = ctx.CM, cam = ctx.cam;
    const show = t >= T.liftA && t < T.stall + 1.3;
    if (!show && !shown) return;
    shown = show;
    for (const k of toks) {
      k.el.style.display = show ? 'block' : 'none';
      if (!show) continue;
      const { p, u, g, f, s } = tokenAt(k, t);
      const b = Math.min(u * 1.4, 1);
      const flutter = Math.sin(t * 3 + k.seed * 20) * 10 * u * (1 - g) + f * 40 * (k.seed - 0.5);
      place(k.el, CM, M4.chain(M4.T(p[0], p[1], p[2]), M4.RY(-cam.ry * b), M4.RX(-cam.rx * b), M4.RZ(-cam.rz * b + flutter), M4.RY(k.tilt * (1 - b)), M4.S(s, s, 1), M4.T(-k.w / 2, -k.h / 2, 0)));
      // they light up as they leave the page, glow 연두 as the light traces through them, dim as they fall
      const trace = tw(t, T.whaleA + (k.target[0] + 260) / 520 * (T.whaleB - T.whaleA) - 0.1, T.whaleA + (k.target[0] + 260) / 520 * (T.whaleB - T.whaleA) + 0.25);
      const L = clamp(Math.max(0.55 * (1 - g), trace * (1 - tw(t, T.whaleB + 0.2, T.stall)) * 0.9 + 0.25 * g));
      k.el.style.color = `rgb(${lerp(226, 176, L) | 0},${lerp(230, 242, L) | 0},${lerp(222, 120, L) | 0})`;
      k.el.style.textShadow = L > 0.02 ? `0 0 ${(14 * L).toFixed(1)}px rgba(140,230,80,${(0.9 * L).toFixed(3)})` : 'none';
      k.el.style.opacity = ((1 - f) * (t < T.stall ? 1 : 1 - 0.3 * tw(t, T.stall, T.stall + 0.3))).toFixed(3);
    }
  }

  return { el, range: ctx.S.words, layout, update };
}
