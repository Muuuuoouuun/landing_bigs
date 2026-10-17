// S9 (v8) · 11.6–14.4 · 집집마다: through the window, the town at dawn — a still clay town (generated houses as clay
// massing models). Nothing pops up: the camera glides over it while the whale, now the real 3D whale, flies ahead of
// a plane of light that sweeps across and paints every house with its texture. A whip to a low street angle, and the
// windows light one by one. The tracker card counts the class through: 퀴즈 → 함께 그리기 → 트로피 → 리포트.
import { E, tw, prog, clamp, lerp, rng, keyed, camMatrix, place, planeModel, M4, catmull, h } from '../core.js';
import { project } from '../line.js';
import { swimDy } from '../whalegeo.js';
import { whalePic } from '../whalepic.js';
import SPRITES from '../../assets/gen/sprites.js';

const IDS = Object.keys(SPRITES).filter(k => /^houses8_[abc]_\d\.webp$/.test(k)).map(k => k.replace('.webp', ''));

export default function dawnScene(ctx) {
  const { W, H, T, copy } = ctx;
  const el = h('section', 'scene dawn');
  ctx.root.appendChild(el);
  const sky = h('div', 'plate8 sky8'), town = h('div', 'plate8 town8'), world = h('div', 'hworld'), haze = h('div', 'haze8');
  const pic = whalePic('solid');
  el.append(sky, town, world, pic.el, haze);

  // the tracker card (ClassIn class status), top left
  const st = copy.tracker.steps;
  const card = h('div', 'tracker', `<b>${copy.tracker.title}</b><span>${copy.tracker.sub}</span>
    <div class="steps">${st.map((s, i) => `<i class="d${i}"></i>`).join('<em></em>')}</div>
    <div class="labels">${st.map(s => `<span>${s}</span>`).join('')}</div>`);
  el.appendChild(card);
  const dots = [...card.querySelectorAll('.steps i')], bars = [...card.querySelectorAll('.steps em')];

  // the clay town: rows of houses standing still on an (invisible) ground
  const r = rng(21);
  const houses = [];
  [-3400, -2950, -2500, -2080, -1660, -1260].forEach((z, ri) => {
    for (let x = -2900 + (ri % 2) * 260; x <= 3300; x += 540 + r() * 60) {
      const id = IDS[Math.floor(r() * IDS.length)], m = SPRITES[`${id}.webp`];
      const hh = (id.startsWith('houses8_c') ? 520 : 400) * (0.9 + r() * 0.2), w = hh * (m.w / m.h);
      houses.push({ id, x: x + (r() - 0.5) * 120, z: z + (r() - 0.5) * 90, w, h: hh });
    }
  });
  houses.sort((a, b) => a.z - b.z);
  for (const o of houses) {
    const shd = h('div', 'obj shd8'); shd.style.width = `${o.w * 1.25}px`; shd.style.height = `${o.w * 0.55}px`;
    const e = h('div', 'obj hs8', `<img src="assets/gen/${o.id}_clay.webp" alt=""><img class="b" src="assets/gen/${o.id}.webp" alt=""><img class="l" src="assets/gen/${o.id}_lit.webp" alt=""><img class="g" src="assets/gen/${o.id}_glow.webp" alt=""><i class="edge"></i>`);
    e.style.width = `${o.w}px`; e.style.height = `${o.h}px`;
    world.append(shd, e);
    Object.assign(o, { el: e, shd, b: e.querySelector('.b'), l: e.querySelector('.l'), g: e.querySelector('.g'), edge: e.querySelector('.edge'),
      M: planeModel(o.x, -o.h / 2, o.z, o.w, o.h), MS: planeModel(o.x, -2, o.z + o.w * 0.12, o.w * 1.25, o.w * 0.55, { rx: 90 }) });
  }
  // the plane of light (a tall sheet across the depth of the town) and its bright core column
  const cur = h('div', 'obj curtain8'); cur.style.width = '3200px'; cur.style.height = '1100px';
  const col = h('div', 'obj column8'); col.style.width = '240px'; col.style.height = '1500px';
  world.append(cur, col);

  // shot A: high and wide, gliding · whip · shot B: low on the street, pushing in · then up towards the sky
  const CAM = [
    { t: 11.5, x: -900, y: -880, z: -1400, s: 0.58, rx: -26, ry: 11, rz: -1 },
    { t: T.sweepB, x: 100, y: -760, z: -1900, s: 0.66, rx: -21, ry: 3, rz: 0, e: E.inOutSine },
    { t: T.whipB, x: 1250, y: -400, z: -2750, s: 0.9, rx: -8, ry: -24, rz: 2, e: E.inOutExpo },
    { t: T.rise, x: 1420, y: -380, z: -2900, s: 0.97, rx: -7, ry: -28, rz: 1, e: E.outSine },
    { t: T.mapIn + 0.15, x: 1500, y: -1500, z: -3000, s: 0.8, rx: 14, ry: -26, rz: 0, e: E.inCubic },
  ];
  const sweepX = t => lerp(-3600, 3900, tw(t, T.dawnA - 0.25, T.sweepB, E.inOutSine));
  const B = keyed(T.rise, CAM);
  const ord = [...houses].sort((a, b) => Math.hypot(a.x - B.x, (a.z - B.z) * 0.7) - Math.hypot(b.x - B.x, (b.z - B.z) * 0.7));
  ord.forEach((o, i) => { o.litAt = T.whipB + 0.02 + 0.55 * (i / ord.length) ** 0.8; o.cls = i % 5 === 0; });

  // the whale: ahead of the light across the town in shot A; across the street in shot B, then up to the sky
  const pathA = t => [sweepX(t) + 420, -780 + Math.sin(t * 2) * 30, -2250];
  const pathB = catmull([[300, -620, -2500], [1100, -700, -2750], [1700, -900, -2950], [2100, -1700, -3300]].map(p => [p[0], p[1]]), 10)
    .map((p, i, a) => [p[0], p[1], lerp(-2500, -3300, i / (a.length - 1))]);
  const atB = u => { const f = clamp(u) * (pathB.length - 1), i = Math.min(pathB.length - 2, Math.floor(f)), k = f - i; return pathB[i].map((v, j) => lerp(v, pathB[i + 1][j], k)); };
  function whaleAt(t) {
    if (t < T.whipA + 0.12) { const p = pathA(t), q = pathA(t + 0.02); return { p, dir: Math.atan2(q[1] - p[1], q[0] - p[0]), sc: 1.15, A: true }; }
    const u = tw(t, T.whipB - 0.1, T.mapIn + 0.1, E.inOutSine), p = atB(u), q = atB(u + 0.01);
    return { p, dir: Math.atan2(q[1] - p[1], q[0] - p[0]), sc: 1.05, A: false };
  }
  const wings = [catmull([[-30, -58], [-80, -142], [10, -182], [50, -68]], 8), catmull([[-34, -92], [-10, -132]], 4), catmull([[-12, -78], [18, -122]], 4)];
  const flap = t => { const k = Math.sin(t * 10); return ([x, y]) => [x + (x - 10) * 0.08 * k, -62 + (y + 62) * (1 + 0.32 * k)]; };

  let curS = null;
  function update(t) {
    const cam = keyed(t, CAM);
    cam.d = 1700;
    const CM = camMatrix(cam, W, H);
    el.style.opacity = (tw(t, T.window - 0.05, T.window + 0.3) * (1 - tw(t, T.mapIn - 0.05, T.mapIn + 0.3, E.inOutSine))).toFixed(3);
    sky.style.transform = `translate(${(-cam.ry * 9 - cam.x * 0.02).toFixed(1)}px, ${(cam.rx * 6 + 60).toFixed(1)}px)`;
    town.style.transform = `translate(${(-cam.ry * 16 - cam.x * 0.06).toFixed(1)}px, ${(cam.rx * 9 + 170 + (cam.s - 0.6) * 140).toFixed(1)}px) scale(${(1 + (cam.s - 0.6) * 0.35).toFixed(3)})`;
    const day = tw(t, T.window, T.mapIn, E.inOutSine);
    sky.style.filter = `brightness(${lerp(0.82, 1.06, day).toFixed(3)})`;
    const sx = sweepX(t);
    for (const o of houses) {
      const wq = CM[3] * o.x + CM[7] * (-o.h / 2) + CM[11] * o.z + CM[15], sw = (o.w * cam.s) / Math.max(wq, 0.01);
      const near = wq > 0.2 ? clamp((1000 - sw) / 120) : 0;
      o.el.style.visibility = o.shd.style.visibility = near > 0 ? 'visible' : 'hidden';
      if (near <= 0) continue;
      o.el.style.opacity = o.shd.style.opacity = near.toFixed(3);
      place(o.el, CM, o.M);
      place(o.shd, CM, o.MS);
      const paint = clamp((sx - (o.x - o.w / 2)) / o.w);
      o.b.style.clipPath = `inset(0 ${((1 - paint) * 100).toFixed(2)}% 0 0)`;
      o.edge.style.left = `${(paint * 100).toFixed(2)}%`;
      o.edge.style.opacity = paint > 0 && paint < 1 ? '1' : '0';
      const on = prog(t, o.litAt, o.litAt + 0.06);
      o.l.style.opacity = on.toFixed(3);
      o.g.style.opacity = (0.6 * on).toFixed(3);
    }
    const ca = tw(t, T.dawnA - 0.2, T.dawnA) * (1 - tw(t, T.sweepB - 0.1, T.sweepB + 0.05));
    cur.style.opacity = ca.toFixed(3);
    col.style.opacity = (0.9 * ca).toFixed(3);
    place(cur, CM, planeModel(sx, -540, -2300, 3200, 1100, { ry: 90 }));
    place(col, CM, planeModel(sx, -600, -2300, 240, 1500));
    // the whale (mirrored to face its way, turned along its path, swimming)
    const w = whaleAt(t);
    const wa = tw(t, T.window, T.window + 0.3) * (1 - tw(t, T.mapIn - 0.1, T.mapIn + 0.2));
    pic.el.style.visibility = wa > 0 ? 'visible' : 'hidden';
    if (wa > 0) {
      place(pic.el, CM, pic.model(M4.chain(M4.T(w.p[0], w.p[1], w.p[2]), M4.RZ((w.dir * 180) / Math.PI), M4.S(-w.sc, w.sc, 1))));
      pic.draw({ wave: swimDy(t, 1.3), alpha: wa });
      pic.el.style.filter = `brightness(${lerp(0.88, 1.1, day).toFixed(3)}) saturate(${lerp(0.92, 1.06, day).toFixed(3)}) sepia(${(0.1 * day).toFixed(3)})`;
    } else pic.clear();
    // tracker: the class's steps tick through as the light reaches home
    const ck = tw(t, T.cardA, T.cardA + 0.3, E.outCubic) * (1 - tw(t, T.rise - 0.1, T.rise + 0.2));
    card.style.opacity = ck.toFixed(3);
    card.style.transform = `translate(${((1 - ck) * -30).toFixed(1)}px, 0)`;
    const stepT = [T.cardA + 0.1, T.cardA + 0.35, T.cardA + 0.6, T.cardA + 0.9];
    dots.forEach((d, i) => d.classList.toggle('on', t > stepT[i]));
    bars.forEach((b, i) => b.style.setProperty('--k', tw(t, stepT[i], stepT[i + 1]).toFixed(3)));
    curS = { CM, cam };
  }

  function draw(fx, t) {
    if (!curS) return;
    const { CM } = curS;
    const fade = tw(t, T.window, T.window + 0.35) * (1 - tw(t, T.mapIn - 0.1, T.mapIn + 0.3));
    // windows light: a warm bloom over each house as it lights (연두 for the classmates' homes)
    for (const o of houses) {
      const k = prog(t, o.litAt, o.litAt + 0.4);
      if (k <= 0 || o.el.style.visibility === 'hidden') continue;
      const q = project(CM, [[o.x, -o.h * 0.42, o.z]])[0];
      if (q[0] < -100 || q[0] > W + 100 || q[1] < -100 || q[1] > H + 100) continue;
      const sz = (o.w * curS.cam.s) / Math.max(0.3, CM[3] * o.x + CM[11] * o.z + CM[15]);
      fx.flare(q[0], q[1], Math.min(120, sz * 0.25) * (1 + 1.2 * (1 - k)), (o.cls ? 0.45 : 0.22) * fade * (1 - 0.5 * k), o.cls ? '150,230,80' : '255,190,100');
    }
    // the whale's wings of light and the light streaming off its flukes
    const w = whaleAt(t), sc = w.sc, wave = swimDy(t, 1.3), fl = flap(t);
    const orient = ([x, y]) => { const lx = -x * sc, ly = (y + wave(x)) * sc; return [w.p[0] + lx * Math.cos(w.dir) - ly * Math.sin(w.dir), w.p[1] + lx * Math.sin(w.dir) + ly * Math.cos(w.dir), w.p[2]]; };
    for (const wg of wings) fx.line(project(CM, wg.map(fl).map(orient)), { w: 3.4, alpha: fade, taper: 0, head: 0 });
    const tail = orient([236, 4]);
    const trail = [];
    for (let i = 24; i >= 0; i--) { const tt = t - i * 0.012; const q = whaleAt(tt); if (q.A !== w.A) continue; trail.push([q.p[0] + tail[0] - w.p[0], q.p[1] + tail[1] - w.p[1], q.p[2]]); }
    if (trail.length > 1) fx.line(project(CM, trail), { w: 4.6, alpha: fade, taper: 1, head: 0.3 });
    const e = project(CM, [tail])[0];
    fx.flare(e[0], e[1], 150, 0.28 * fade);
    // through the window: a flash of dawn light
    const fw = prog(t, T.window - 0.05, T.window + 0.35);
    if (fw > 0 && fw < 1) fx.flare(W * 0.55, H * 0.4, 900 * (0.5 + fw), 0.55 * (1 - fw), '255,236,200');
  }

  return { el, range: ctx.S.dawn, update, draw };
}
