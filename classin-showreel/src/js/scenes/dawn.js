// S5 · 새벽, 모든 집으로 (16.40–19.60): through the window, the whale — wings and all — flies out into
// the dawn over the town, trailing the 연두 light. Every window it passes lights up: the classmates'
// homes first, then home after home to the horizon. It climbs towards the rising sun and the whole
// sky turns to day — ivory paper, where the tagline will be written.
import { E, tw, prog, clamp, lerp, rng, drift, keyed, camMatrix, place, planeModel, xf, h } from '../core.js';
import { project } from '../line.js';
import { whaleStrokes } from './whale.js';
import { catmull } from './brain.js';

const WALL = ['#FFF6E4', '#F6E5C6', '#E3EDD2', '#DCE7F0', '#F8DFCF', '#F3EAD8'];
const ROOF = ['#B89C76', '#A68B67', '#8FA77A', '#86A0B6', '#C98D72', '#AE9C80'];
const mixc = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const rgb = c => `rgb(${c.join(',')})`;

export default function dawnScene(ctx) {
  const { W, H, T } = ctx;
  const el = h('section', 'scene dawn');
  ctx.root.appendChild(el);
  const skyEl = h('div', 'dsky'), sun = h('div', 'dsun');
  const world = h('div', 'hworld');
  el.append(skyEl, sun, world);
  const ground = h('div', 'obj hground6');
  ground.style.width = '12000px'; ground.style.height = '8700px';
  // (no ground plane: it would cross the lens on the climb — the sky gradient carries the land below the horizon)

  const r = rng(21);
  const houses = [];
  const rows = [-4200, -3600, -3050, -2550, -2100, -1700, -1330, -980, -650];
  rows.forEach((z, ri) => {
    const step = 330 + ri * 4;
    for (let x = -3400 + (ri % 2) * step * 0.5; x <= 3400; x += step) houses.push({ x: x + (r() - 0.5) * 90, z: z + (r() - 0.5) * 80, s: 0.85 + r() * 0.35, c: Math.floor(r() * WALL.length), wins: r() > 0.45 ? 2 : 1, tall: r() > 0.7, seed: r() });
  });
  houses.sort((a, b) => a.z - b.z);
  for (const hs of houses) {
    const w = 190 * hs.s, bh = (hs.tall ? 170 : 128) * hs.s, rh = 78 * hs.s;
    hs.w = w; hs.hh = bh + rh;
    const d = h('div', 'obj house');
    d.style.width = `${w}px`; d.style.height = `${hs.hh}px`;
    d.innerHTML = `<i class="roof" style="background:${ROOF[hs.c]};height:${rh + 2}px"></i><i class="body" style="background:${WALL[hs.c]};top:${rh}px;height:${bh}px"></i><i class="door" style="left:${w * 0.62}px;width:${w * 0.18}px;height:${bh * 0.42}px"></i>`;
    hs.wins = Array.from({ length: hs.wins }, (_, i) => {
      const ww = w * 0.24, wh = ww * 0.8, wx = hs.wins === 1 ? w * 0.18 : w * (0.1 + i * 0.3), wy = rh + bh * 0.18;
      const win = h('i', 'win', '<b class="lit"></b>');
      win.style.cssText = `left:${wx}px;top:${wy}px;width:${ww}px;height:${wh}px`;
      d.appendChild(win);
      return { lit: win.firstChild, x: wx + ww / 2, y: wy + wh / 2 };
    });
    world.appendChild(d);
    hs.el = d;
    hs.m = planeModel(hs.x, -hs.hh / 2, hs.z, w, hs.hh);
  }

  // the whale's flight: from the window (upper left) down over the rooftops, then up into the sun
  const PATH = catmull([[-2600, -1700, -700], [-1500, -700, -1100], [-500, -420, -1500], [500, -460, -2000], [1300, -700, -2700], [1700, -1500, -3800], [1500, -2600, -5200]].map(p => [p[0], p[1]]), 12)
    .map((p, i, a) => { const u = i / (a.length - 1); return [p[0], p[1], lerp(-700, -5200, u ** 1.15)]; });
  const flyK = t => tw(t, T.townIn - 0.25, 19.55, E.inOutSine);
  const at = u => { const f = clamp(u) * (PATH.length - 1), i = Math.min(PATH.length - 2, Math.floor(f)), k = f - i; return PATH[i].map((v, j) => lerp(v, PATH[i + 1][j], k)); };
  // each home lights when the whale passes; the rest follow outward, to the horizon
  const samples = Array.from({ length: 240 }, (_, i) => { const tt = lerp(T.townIn, 19.4, i / 239); return [tt, at(flyK(tt))]; });
  for (const hs of houses) {
    let best = 1e9, bt = 0;
    for (const [tt, p] of samples) { const d = Math.hypot(p[0] - hs.x, (p[2] - hs.z) * 1.4); if (d < best) { best = d; bt = tt; } }
    hs.class = best < 520;
    hs.litAt = hs.class ? bt + 0.05 : clamp(bt + 0.25 + best / 2600 + hs.seed * 0.25, T.landA, 19.3);
  }
  const wings = [catmull([[-30, -66], [-90, -190], [10, -250], [50, -80]], 8), catmull([[-40, -110], [-10, -160]], 4), catmull([[-20, -90], [20, -150]], 4)];
  const body = whaleStrokes();

  function camAt(t) {
    const c = keyed(t, [
      { t: 16.3, x: -1500, y: -1300, z: -900, s: 0.95, rx: -4, ry: 6 },
      { t: T.landA + 0.2, x: -700, y: -620, z: -1300, s: 0.78, rx: -16, ry: 3, e: E.inOutSine },
      { t: T.landB, x: 300, y: -560, z: -2000, s: 0.62, rx: -20, ry: -2, e: E.inOutSine },
      { t: T.liftOff, x: 900, y: -1200, z: -3200, s: 0.55, rx: -6, ry: -3, e: E.inOutSine },
      { t: 19.7, x: 1200, y: -2200, z: -4600, s: 0.6, rx: 4, ry: -3, e: E.inOutSine },
    ]);
    c.rz = 0.8 * drift(t, 1.7, 0.1);
    c.d = 1700;
    return c;
  }

  let cur = null;
  function update(t) {
    const cam = camAt(t), CM = camMatrix(cam, W, H);
    el.style.opacity = tw(t, 16.35, T.window + 0.45, E.inOutSine) * (1 - tw(t, 19.25, 19.7, E.inOutSine));
    // sky: blue hour → dawn → day (ivory)
    const d1 = tw(t, 16.4, T.landB, E.inOutSine), d2 = tw(t, T.landB, 19.1, E.inOutSine);
    const top = rgb(mixc(mixc([24, 30, 58], [120, 128, 168], d1), [246, 241, 230], d2));
    const mid = rgb(mixc(mixc([86, 72, 120], [228, 170, 160], d1), [248, 240, 226], d2));
    const hor = rgb(mixc(mixc([214, 140, 112], [255, 214, 160], d1), [255, 240, 214], d2));
    const hz = project(CM, [[0, 0, -9000]])[0][1];
    const hp = clamp(hz / H, 0.05, 1.2) * 100;
    skyEl.style.background = `linear-gradient(180deg, ${top} 0%, ${mid} ${(hp * 0.62).toFixed(1)}%, ${hor} ${hp.toFixed(1)}%, ${hor} 100%)`;
    const sunY = hz - lerp(-40, 420, tw(t, T.landA, 19.4, E.inOutSine));
    sun.style.transform = `translate(${(W * 0.66).toFixed(0)}px, ${sunY.toFixed(0)}px) scale(${(0.8 + 0.6 * d2).toFixed(3)})`;
    sun.style.opacity = (0.5 + 0.5 * d1).toFixed(3);
    // the town comes out of the dark
    const b = lerp(0.3, 1, tw(t, 16.4, 18.9, E.inOutSine));
    world.style.filter = `brightness(${b.toFixed(3)}) saturate(${lerp(0.6, 1, b).toFixed(3)})`;
    void ground;
    for (const hs of houses) {
      // anything at or behind the lens is hidden (a plane crossing the camera would smear across the frame)
      const wq = CM[3] * hs.x + CM[7] * (-hs.hh / 2) + CM[11] * hs.z + CM[15];
      const sw = (hs.w * cam.s) / Math.max(wq, 0.01); // on-screen width; fade out anything that looms at the lens
      const near = wq > 0.2 ? clamp((700 - sw) / 300) : 0;
      hs.el.style.visibility = near > 0 ? 'visible' : 'hidden';
      hs.el.style.opacity = near.toFixed(3);
      place(hs.el, CM, hs.m);
      const k = tw(t, hs.litAt, hs.litAt + 0.3, E.outCubic);
      for (const wn of hs.wins) wn.lit.style.opacity = k.toFixed(3);
    }
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    const CM = cur.CM;
    const fade = tw(t, 16.35, T.window + 0.45) * (1 - tw(t, 19.3, 19.7));
    // windows glow (the classmates' homes in 연두, every other home warm)
    for (const hs of houses) {
      const k = prog(t, hs.litAt, hs.litAt + 0.35);
      if (k <= 0) continue;
      for (const wn of hs.wins) {
        const q = project(CM, [xf(hs.m, wn.x, wn.y, 0)])[0];
        if (q[0] < -60 || q[0] > W + 60 || q[1] < -60 || q[1] > H + 60) continue;
        const pop = hs.class ? 1 + 1.5 * (1 - k) : 1;
        fx.flare(q[0], q[1], (hs.class ? 60 : 34) * pop, (hs.class ? 0.9 : 0.6) * k * fade, hs.class ? '150,230,80' : '255,196,90');
        fx.dot(q[0], q[1], hs.class ? 3.4 : 2.4, hs.class ? '#B6F07A' : '#FFD27A', k * fade);
      }
    }
    // the whale and its trail of light
    const u = flyK(t);
    const p = at(u), pa = at(u - 0.004), pb = at(u + 0.004);
    const dir = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
    const sc = 1.25, swim = Math.sin(t * 6) * 0.08;
    const orient = ([x, y]) => { const lx = -x * sc, ly = y * sc * (1 + swim * (x / 200)); return [p[0] + lx * Math.cos(dir) - ly * Math.sin(dir), p[1] + lx * Math.sin(dir) + ly * Math.cos(dir), p[2]]; };
    for (const s of [...body, ...wings.map(w => ({ pts: w }))]) fx.line(project(CM, s.pts.map(orient)), { w: 3.6, alpha: fade, taper: 0, head: 0, cool: 0.25, ink: s.accent ? '#A6E86A' : '#F4F6EE', inkW: 0.8 });
    const trail = [];
    for (let i = 24; i >= 0; i--) trail.push(at(Math.max(0, u - i * 0.006)));
    fx.line(project(CM, trail), { w: 5, alpha: fade, taper: 1, head: 1 });
    const e = project(CM, [p])[0];
    fx.flare(e[0], e[1], 220, 0.3 * fade);
  }

  return { el, range: ctx.S.dawn, update, draw };
}
