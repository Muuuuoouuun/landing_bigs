// S4–S8 (v8) · 3.72–12.0 · the room at night and the class on the tablet. From the dive until the whale lifts, the
// camera sits square over the tablet so its screen is the frame: the class canvas (src/js/classui.js) is mapped onto
// the tablet's glass in true 3D, so when the camera pulls back out it is simply the tablet on the desk — walnut desk,
// lamp, plant, pencil cup, the phone, the bedroom wall with its window (night → dawn). The light that runs over the
// finished drawing (the friends' parts on the teacher's whale) is drawn here too.
import { E, tw, prog, clamp, lerp, M4, xf, place, planeModel, h } from '../core.js';
import { project } from '../line.js';
import { CW, CH, onBoard, PARTS, WC, TILES } from '../classui.js';
import { whaleStrokes } from '../whalegeo.js';
import SPRITES from '../../assets/gen/sprites.js';

export const TABLET = { x: 930, y: 70, w: 660, h: 390.5, rz: 5, bez: 22 }; // screen 616 × 346.5 = 16:9
export const PHONE = { x: 330, y: 230, w: 150, h: 312, rz: -14 };
const SX = (TABLET.w - 2 * TABLET.bez) / CW, SY = (TABLET.h - 2 * TABLET.bez) / CH;
export const MT = planeModel(TABLET.x, TABLET.y, 2, TABLET.w, TABLET.h, { rz: TABLET.rz });
// class px → world (on the tablet's glass, z above it)
export const MS = (z = 1) => M4.chain(MT, M4.T(TABLET.bez, TABLET.bez, z), M4.S(SX, SY, 1));
export const classToWorld = ([x, y], z = 1) => xf(MS(z), x, y, 0);
export const SCREEN_SCALE = 1920 / (TABLET.w - 2 * TABLET.bez); // camera scale at which the screen is the frame

// (v8.3) the class screen comes apart: 16 pieces (header, six seats, four tools, five chat lines) lift off the glass and
// fan out around the tablet; then they lie down flat into a 4 × 4 grid of grey blocks — the town seen from above
export const FRAGS = [
  { x: 0, y: 0, w: 1920, h: 66 },
  ...TILES.map(q => ({ x: q.x, y: q.y, w: q.w, h: q.h })),
  ...[0, 1, 2, 3].map(i => ({ x: 1478, y: 140 + i * 62, w: 384, h: 50 })),
  ...[0, 1, 2, 3, 4].map(i => ({ x: 1484, y: 456 + i * 86, w: 360, h: 72 })),
];
export const fragTimes = T => ({
  up: FRAGS.map((_, i) => T.liftA + 0.3 + i * 0.035),              // leaves the glass
  grid: FRAGS.map((_, i) => T.window - 0.62 + ((i * 7) % 16) * 0.018), // lies down into the grid
  FAN: 0.5, LAY: 0.36,
});

export default function roomScene(ctx) {
  const { T } = ctx;
  const el = h('section', 'scene room');
  ctx.root.appendChild(el);
  const plane = (cls, w, hh, html) => { const d = h('div', `obj ${cls}`, html); d.style.width = `${w}px`; d.style.height = `${hh}px`; el.appendChild(d); return d; };
  const desk = plane('desk', 5200, 3200);
  const wall = plane('wall7', 3600, 2025, '<img class="wn" src="assets/gen/wall_night.jpg" alt=""><img class="wd" src="assets/gen/wall_dawn.jpg" alt="">');
  const wallDawn = wall.querySelector('.wd');
  const PROPS = [
    { src: 'props_night_0', x: -930, y: -380, h: 640 }, { src: 'props_night_1', x: 1560, y: -420, h: 380 },
    { src: 'props_night_2', x: -260, y: 300, h: 300 }, { src: 'props_night_3', x: -760, y: 380, h: 220 },
  ].map(p => { const m = SPRITES[`${p.src}.png`] || { w: 400, h: 400 }; const w = p.h * (m.w / m.h); const d = plane('prop', w, p.h, `<img src="assets/gen/${p.src}.png" alt="">`); return { ...p, w, el: d }; });
  const glowD = plane('tglow', 2200, 1500);
  const tShadow = plane('bshadow', TABLET.w + 300, TABLET.h + 260);
  const pShadow = plane('bshadow', PHONE.w + 160, PHONE.h + 160);
  const phone = plane('phone8', PHONE.w, PHONE.h, '<i></i>');
  const tab = plane('tablet8', TABLET.w, TABLET.h, '<i class="glass"></i>');
  const screen = ctx.classUI.canvas;
  screen.className = 'obj classcv';
  el.appendChild(screen);
  const night = h('div', 'nightpool');
  el.appendChild(night);
  const wglow = h('div', 'nightpool');
  wglow.style.mixBlendMode = 'screen';
  el.appendChild(wglow);
  const FT = fragTimes(T);
  const frags = FRAGS.map((f, i) => {
    const d = h('div', 'obj frag', '<canvas></canvas><i class="gy"></i>');
    d.style.width = `${f.w}px`; d.style.height = `${f.h}px`;
    const cv = d.querySelector('canvas'); cv.width = f.w; cv.height = f.h;
    el.appendChild(d);
    // fan pose (class px around the screen, lift z in world units, tilt towards the camera, scale)
    let fan;
    if (i === 0) fan = { cx: 960, cy: -420, z: 300, rx: -24, rz: 0, k: 0.95 };
    else if (i <= 6) { const o = i - 3.5; fan = { cx: 960 + o * 360, cy: -150 - 34 * o * o, z: 210 + 22 * Math.abs(o), rx: -30, rz: o * 3.2, k: 1.9 }; }
    else if (i <= 10) { const j = i - 7; fan = { cx: 2420 + j * 40, cy: 120 + j * 230, z: 130 + j * 34, rx: -18, rz: -6 + j * 3.5, k: 2.1 }; }
    else { const j = i - 11; fan = { cx: -520 - j * 30, cy: 160 + j * 200, z: 120 + j * 30, rx: -18, rz: 6 - j * 2.5, k: 2.0 }; }
    // grid pose: a 4 × 4 grid of equal cells (the town's block proportions) over the screen, flat on the glass
    const cw = 420, ch = 190, gap = 60, col = i % 4, row = Math.floor(i / 4);
    const grid = { cx: 30 + col * (cw + gap) + cw / 2, cy: 70 + row * (ch + gap) + ch / 2, z: 6, rx: 0, rz: 0, sx: cw / f.w, sy: ch / f.h };
    return { f, d, cv, g: cv.getContext('2d'), gy: d.querySelector('.gy'), fan, grid, up: FT.up[i], lay: FT.grid[i] };
  });

  // the finished drawing (class px), for the light to run over
  const drawing = [...whaleStrokes().map(s => s.pts), ...PARTS.flat()].map(p => p.map(onBoard));
  const dLen = drawing.map(p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; });
  const dTot = dLen.reduce((a, b) => a + b, 0);

  let cur = null;
  function update(t) {
    const CM = ctx.CM;
    ctx.classUI.draw(t);
    place(desk, CM, M4.T(-2600, -1500, -14));
    place(wall, CM, planeModel(300, -880, 1012, 3600, 2025, { rx: -90 }));
    wallDawn.style.opacity = tw(t, T.lift + 0.3, T.window + 0.2, E.inOutSine).toFixed(3);
    for (const p of PROPS) place(p.el, CM, planeModel(p.x, p.y, p.h / 2, p.w, p.h, { rx: -90 }));
    place(glowD, CM, planeModel(TABLET.x, TABLET.y + 60, 1, 2200, 1500, { rz: TABLET.rz }));
    glowD.style.opacity = (0.9 * (1 - 0.4 * tw(t, T.window - 0.4, T.window + 0.3))).toFixed(3);
    place(tShadow, CM, planeModel(TABLET.x + 14, TABLET.y + 30, -12, TABLET.w + 300, TABLET.h + 260, { rz: TABLET.rz }));
    place(pShadow, CM, planeModel(PHONE.x + 10, PHONE.y + 20, -12, PHONE.w + 160, PHONE.h + 160, { rz: PHONE.rz }));
    place(phone, CM, planeModel(PHONE.x, PHONE.y, 1, PHONE.w, PHONE.h, { rz: PHONE.rz }));
    place(tab, CM, MT);
    place(screen, CM, MS(1));
    // (v8.3) no photographed room: once the whale is out, desk, wall and props fall away into the dark
    const off = 1 - tw(t, T.lift - 0.15, T.lift + 0.35);
    for (const e of [desk, wall, phone, tShadow, pShadow, ...PROPS.map(p => p.el)]) e.style.opacity = off.toFixed(3);
    const gone = 1 - tw(t, T.window - 0.4, T.window - 0.08);       // the tablet itself leaves as the grid forms
    for (const e of [tab, screen, glowD]) e.style.opacity = (gone * (e === glowD ? 0.9 : 1)).toFixed(3);
    const g2 = screen.getContext('2d');
    for (const q of frags) {
      const a1 = tw(t, q.up, q.up + FT.FAN, E.inOutCubic), a2 = tw(t, q.lay, q.lay + FT.LAY, E.inOutCubic), f = q.f;
      q.d.style.visibility = a1 > 0 ? 'visible' : 'hidden';
      if (a1 <= 0) continue;
      q.g.drawImage(screen, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      const L = (a, b, k) => a + (b - a) * k;
      const p = { cx: L(L(f.x + f.w / 2, q.fan.cx, a1), q.grid.cx, a2), cy: L(L(f.y + f.h / 2, q.fan.cy, a1), q.grid.cy, a2), z: L(L(2, q.fan.z, a1), q.grid.z, a2),
        rx: L(q.fan.rx * a1, 0, a2), rz: L(q.fan.rz * a1, 0, a2), sx: L(L(1, q.fan.k, a1), q.grid.sx, a2), sy: L(L(1, q.fan.k, a1), q.grid.sy, a2) };
      const c = classToWorld([p.cx, p.cy], p.z);
      place(q.d, CM, M4.chain(M4.T(c[0], c[1], c[2]), M4.RZ(TABLET.rz + p.rz), M4.RX(p.rx), M4.S(SX * p.sx, SY * p.sy, 1), M4.T(-f.w / 2, -f.h / 2, 0)));
      q.gy.style.opacity = tw(t, q.lay + 0.1, q.lay + FT.LAY + 0.05).toFixed(3);
      q.d.style.opacity = gone > 0.01 || a2 > 0.5 ? '1' : '0';
      // its place on the glass goes dark as it leaves
      g2.save(); g2.globalAlpha = Math.min(1, a1 * 1.4); g2.fillStyle = '#0D0F12'; g2.fillRect(f.x - 4, f.y - 4, f.w + 8, f.h + 8); g2.restore();
    }
    el.style.opacity = (1 - tw(t, T.window + 0.2, T.window + 0.5)).toFixed(3);
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    // the night: the tablet's glow lights the desk, the rest falls away into the dark — and once the whale is out,
    // the pool of light travels with it across the room (computed here: the whale has placed itself by now)
    const CM = cur.CM, wg = ctx.whaleGlow;
    let Lp = project(CM, [[TABLET.x, TABLET.y, 0]])[0], R = 1300 * Math.min(CM[0] * CM[0] + CM[1] * CM[1], 4) ** 0.5 + 180;
    if (wg && wg.a > 0) {
      const q = project(CM, [wg.pos])[0], k = wg.a * tw(t, T.lift, T.flyA + 0.2);
      Lp = [lerp(Lp[0], q[0], k), lerp(Lp[1], q[1], k)]; R = lerp(R, 900, k);
      wglow.style.background = `radial-gradient(circle at ${q[0].toFixed(1)}px ${q[1].toFixed(1)}px, rgba(150,236,110,${(0.32 * wg.a).toFixed(3)}) 0px, rgba(150,236,110,${(0.1 * wg.a).toFixed(3)}) 260px, rgba(0,0,0,0) 620px)`;
    } else wglow.style.background = 'none';
    const dark = 0.62 * (1 - 0.75 * tw(t, T.lift - 0.1, T.flyA + 0.35) - 0.25 * tw(t, T.flyA + 0.35, T.window + 0.3)); // the room opens up as the whale comes out
    night.style.background = `radial-gradient(circle at ${Lp[0].toFixed(1)}px ${Lp[1].toFixed(1)}px, rgba(9,10,13,${(dark * 0.05).toFixed(3)}) 0px, rgba(9,10,13,${(dark * 0.35).toFixed(3)}) ${(R * 0.42).toFixed(0)}px, rgba(9,10,13,${dark.toFixed(3)}) ${R.toFixed(0)}px)`;
    // rings of light spread over the glass as the whale comes out of it
    for (let i = 0; i < 3; i++) {
      const k = prog(t, T.liftA + 0.15 + i * 0.12, T.liftA + 0.75 + i * 0.12);
      if (k <= 0 || k >= 1) continue;
      const r = 120 + 760 * E.outCubic(k), ring = [];
      for (let a2 = 0; a2 <= 64; a2++) { const q = (a2 / 64) * Math.PI * 2; ring.push(classToWorld([WC[0] + Math.cos(q) * r, WC[1] + Math.sin(q) * r * 0.62], 2)); }
      fx.line(project(CM, ring), { w: 2.6 * (1 - k) + 0.6, alpha: 0.75 * (1 - k), taper: 0, head: 0 });
    }
    // the light runs over the finished drawing — the friends' parts and the teacher's whale become one
    const u = tw(t, T.lightA, T.lightB, E.inOutSine), cool = tw(t, T.lightB, T.lift);
    if (u <= 0 || t > T.lift + 0.2) return;
    let acc = 0;
    drawing.forEach((pts, j) => {
      const a0 = acc / dTot, a1 = (acc + dLen[j]) / dTot;
      acc += dLen[j];
      const k = clamp((u - a0) / (a1 - a0));
      if (k <= 0) return;
      const n = Math.max(2, Math.round(pts.length * k));
      fx.line(project(cur.CM, pts.slice(0, n).map(p => classToWorld(p, 2))), { w: 4.2, alpha: 1 - cool, taper: 0, head: k < 1 ? 1 : 0 });
    });
  }

  return { el, range: ctx.S.room, update, draw };
}
