// S5 · 집집마다 (14.40–16.80): through the window — the whale, wings and all, flies out over the town at
// dawn. Generated plates (sky and distant mountains, the misty town) carry the depth; cut-out generated houses and
// trees stand in front in real 3D. Every home the whale passes lights up — the classmates' homes first (연두),
// then the neighbours' — and a glass tracker card counts the class through: 질문 → 함께 그리기 → 답 → 리포트.
// Then the whale climbs towards the sun and the camera rises after it (the nation scene takes over).
import { E, tw, prog, clamp, lerp, rng, drift, keyed, camMatrix, place, planeModel, xf, catmull, h } from '../core.js';
import { project } from '../line.js';
import { whaleStrokes } from './whale.js';
import SPRITES from '../../assets/gen/sprites.js';

const HOUSES = Object.keys(SPRITES).filter(k => k.startsWith('houses_'));
const TREES = ['trees_0.png', 'trees_1.png', 'trees_2.png'];

export default function dawnScene(ctx) {
  const { W, H, T, copy } = ctx;
  const el = h('section', 'scene dawn');
  ctx.root.appendChild(el);
  const sky = h('div', 'plate', '<img src="assets/gen/sky_dawn.jpg" alt="">');
  const town = h('div', 'plate town', '<img src="assets/gen/town_far.jpg" alt="">');
  const world = h('div', 'hworld');
  const haze = h('div', 'haze');
  el.append(sky, town, world, haze);

  // the tracker card (ClassIn class status), top left — the original's "Arriving today"
  const st = copy.tracker.steps;
  const card = h('div', 'tracker', `<b>${copy.tracker.title}</b><span>${copy.tracker.sub}</span>
    <div class="steps">${st.map((s, i) => `<i class="d${i}"></i>`).join('<em></em>')}</div>
    <div class="labels">${st.map(s => `<span>${s}</span>`).join('')}</div>`);
  el.appendChild(card);
  const dots = [...card.querySelectorAll('.steps i')], bars = [...card.querySelectorAll('.steps em')];

  // the foreground neighbourhood: rows of cut-out houses and trees on an (invisible) ground, receding
  const r = rng(77);
  const items = [];
  const rows = [-2600, -2150, -1750, -1380, -1040, -720];
  rows.forEach((z, ri) => {
    const step = 560 - ri * 18;
    for (let x = -3000 + (ri % 2) * step * 0.5; x <= 3000; x += step) {
      const tree = r() < 0.22;
      const src = tree ? TREES[Math.floor(r() * TREES.length)] : HOUSES[Math.floor(r() * HOUSES.length)];
      const m = SPRITES[src];
      const hh = tree ? 300 + r() * 120 : 330 + r() * 90;
      items.push({ src, tree, x: x + (r() - 0.5) * 160, z: z + (r() - 0.5) * 120, h: hh, w: hh * (m.w / m.h), seed: r() });
    }
  });
  items.sort((a, b) => a.z - b.z);
  for (const it of items) {
    const d = h('div', 'obj spr', `<img class="dk" src="assets/gen/${it.src}" alt="">${it.tree ? '' : `<img class="lt" src="assets/gen/${it.src}" alt="">`}`);
    d.style.width = `${it.w}px`; d.style.height = `${it.h}px`;
    world.appendChild(d);
    it.el = d; it.lt = d.querySelector('.lt');
    it.m = planeModel(it.x, -it.h / 2, it.z, it.w, it.h);
  }

  // the whale's flight: in from the upper left (the window), low over the rooftops, then up towards the sun
  const PATH = catmull([[-2400, -1500, -600], [-1300, -820, -1000], [-300, -560, -1500], [700, -620, -2000], [1400, -1100, -2600], [1700, -2000, -3600]].map(p => [p[0], p[1]]), 12)
    .map((p, i, a) => { const u = i / (a.length - 1); return [p[0], p[1], lerp(-600, -3600, u ** 1.1)]; });
  const flyK = t => tw(t, T.townIn - 0.3, T.mapIn + 0.2, E.inOutSine);
  const at = u => { const f = clamp(u) * (PATH.length - 1), i = Math.min(PATH.length - 2, Math.floor(f)), k = f - i; return PATH[i].map((v, j) => lerp(v, PATH[i + 1][j], k)); };
  const samples = Array.from({ length: 200 }, (_, i) => { const tt = lerp(T.townIn, T.mapIn, i / 199); return [tt, at(flyK(tt))]; });
  for (const it of items) {
    if (it.tree) continue;
    let best = 1e9, bt = 0;
    for (const [tt, p] of samples) { const d = Math.hypot(p[0] - it.x, (p[2] - it.z) * 1.3); if (d < best) { best = d; bt = tt; } }
    it.cls = best < 700;
    it.litAt = it.cls ? bt + 0.05 : clamp(bt + 0.2 + best / 3000 + it.seed * 0.3, T.landA, T.rise);
  }
  const wings = [catmull([[-30, -66], [-80, -150], [10, -190], [50, -76]], 8), catmull([[-34, -100], [-10, -140]], 4), catmull([[-12, -86], [18, -130]], 4)];
  const body = whaleStrokes();

  function camAt(t) {
    const c = keyed(t, [
      { t: 14.2, x: -1500, y: -900, z: -700, s: 0.95, rx: -6, ry: 8 },
      { t: T.landA + 0.3, x: -600, y: -560, z: -1100, s: 0.82, rx: -12, ry: 3, e: E.inOutSine },
      { t: T.landB, x: 300, y: -560, z: -1700, s: 0.74, rx: -14, ry: -2, e: E.inOutSine },
      { t: T.mapIn + 0.4, x: 900, y: -1700, z: -2600, s: 0.6, rx: 8, ry: -3, e: E.inCubic },
    ]);
    c.rz = 0.6 * drift(t, 1.7, 0.1);
    c.d = 1700;
    return c;
  }

  let cur = null;
  function update(t) {
    const cam = camAt(t), CM = camMatrix(cam, W, H);
    el.style.opacity = tw(t, 14.25, T.window + 0.5, E.inOutSine) * (1 - tw(t, T.mapIn - 0.1, T.mapIn + 0.4, E.inOutSine));
    // plates: parallax with the camera; the sky slides least, the town more
    const k = tw(t, 14.2, T.mapIn + 0.4);
    const rise = tw(t, T.rise, T.mapIn + 0.4, E.inCubic);
    sky.style.transform = `translate(${(-60 * k).toFixed(1)}px, ${(rise * 260).toFixed(1)}px) scale(${(1.12 + 0.04 * k).toFixed(4)})`;
    town.style.transform = `translate(${(-180 * k).toFixed(1)}px, ${(rise * 620 + 40).toFixed(1)}px) scale(${(1.08 + 0.18 * k).toFixed(4)})`;
    const day = tw(t, 14.4, T.mapIn, E.inOutSine);
    sky.style.filter = `brightness(${lerp(0.78, 1.08, day).toFixed(3)}) saturate(${lerp(0.9, 1.05, day).toFixed(3)})`;
    town.style.filter = `brightness(${lerp(0.72, 1.0, day).toFixed(3)})`;
    haze.style.opacity = (0.35 + 0.4 * rise).toFixed(3);
    world.style.filter = `brightness(${lerp(0.7, 1, day).toFixed(3)})`;
    for (const it of items) {
      const wq = CM[3] * it.x + CM[7] * (-it.h / 2) + CM[11] * it.z + CM[15];
      const sw = (it.w * cam.s) / Math.max(wq, 0.01);
      const near = wq > 0.2 ? clamp((900 - sw) / 300) : 0;
      it.el.style.visibility = near > 0 ? 'visible' : 'hidden';
      it.el.style.opacity = near.toFixed(3);
      if (near > 0) place(it.el, CM, it.m);
      if (it.lt) it.lt.style.opacity = tw(t, it.litAt, it.litAt + 0.3, E.outCubic).toFixed(3);
    }
    // tracker: steps tick through as the class's work arrives home
    const ck = tw(t, T.cardA, T.cardA + 0.35, E.outCubic) * (1 - tw(t, T.rise + 0.2, T.mapIn + 0.2));
    card.style.opacity = ck.toFixed(3);
    card.style.transform = `translate(${((1 - ck) * -30).toFixed(1)}px, 0)`;
    const stepT = [T.cardA + 0.1, T.cardA + 0.45, T.cardA + 0.8, T.cardA + 1.25];
    dots.forEach((d, i) => d.classList.toggle('on', t > stepT[i]));
    bars.forEach((b, i) => b.style.setProperty('--k', tw(t, stepT[i], stepT[i + 1]).toFixed(3)));
    cur = { CM, cam };
  }

  function draw(fx, t) {
    if (!cur) return;
    const { CM } = cur;
    const fade = tw(t, 14.3, T.window + 0.5) * (1 - tw(t, T.mapIn, T.mapIn + 0.4));
    // windows light up: a warm bloom over each house as it lights (연두 for the classmates' homes)
    for (const it of items) {
      if (it.tree) continue;
      const k = prog(t, it.litAt, it.litAt + 0.45);
      if (k <= 0 || it.el.style.visibility === 'hidden') continue;
      const q = project(CM, [xf(it.m, it.w * 0.5, it.h * 0.58, 0)])[0];
      if (q[0] < -100 || q[0] > W + 100 || q[1] < -100 || q[1] > H + 100) continue;
      const pop = 1 + 1.2 * (1 - k);
      const sz = (it.w * cur.cam.s) / Math.max(0.3, CM[3] * it.x + CM[11] * it.z + CM[15]);
      fx.flare(q[0], q[1], Math.min(110, sz * 0.22) * pop, (it.cls ? 0.5 : 0.3) * fade * (1 - 0.5 * k), it.cls ? '150,230,80' : '255,190,100');
    }
    // the whale and its trail of light
    const u = flyK(t);
    const p = at(u), pa = at(u - 0.004), pb = at(u + 0.004);
    const dir = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
    const sc = 1.35, swim = Math.sin(t * 6) * 0.08;
    const orient = ([x, y]) => { const lx = -x * sc, ly = y * sc * (1 + swim * (x / 200)); return [p[0] + lx * Math.cos(dir) - ly * Math.sin(dir), p[1] + lx * Math.sin(dir) + ly * Math.cos(dir), p[2]]; };
    for (const s of [...body, ...wings.map(w => ({ pts: w }))]) fx.line(project(CM, s.pts.map(orient)), { w: 3.8, alpha: fade, taper: 0, head: 0, cool: 0.2, ink: s.accent ? '#A6E86A' : '#F4F6EE', inkW: 0.8 });
    const trail = [];
    for (let i = 26; i >= 0; i--) trail.push(at(Math.max(0, u - i * 0.006)));
    fx.line(project(CM, trail), { w: 5, alpha: fade, taper: 1, head: 1 });
    const e = project(CM, [p])[0];
    fx.flare(e[0], e[1], 240, 0.3 * fade);
  }

  return { el, range: ctx.S.dawn, update, draw };
}
