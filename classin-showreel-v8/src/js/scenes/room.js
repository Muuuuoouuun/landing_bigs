// S4–S8 (v8) · 3.72–12.0 · the room at night and the class on the tablet. From the dive until the whale lifts, the
// camera sits square over the tablet so its screen is the frame: the class canvas (src/js/classui.js) is mapped onto
// the tablet's glass in true 3D, so when the camera pulls back out it is simply the tablet on the desk — walnut desk,
// lamp, plant, pencil cup, the phone, the bedroom wall with its window (night → dawn). The light that runs over the
// finished drawing (the friends' parts on the teacher's whale) is drawn here too.
import { E, tw, prog, clamp, lerp, M4, xf, place, planeModel, h } from '../core.js';
import { project } from '../line.js';
import { CW, CH, onBoard, PARTS } from '../classui.js';
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
    // the night: the tablet's glow lights the desk; the rest falls away into the dark
    const Lp = project(CM, [[TABLET.x, TABLET.y, 0]])[0];
    const R = 1300 * CM[0] + 180;
    const dark = 0.62 * (1 - tw(t, T.lift + 0.4, T.window + 0.3));
    night.style.background = `radial-gradient(circle at ${Lp[0].toFixed(1)}px ${Lp[1].toFixed(1)}px, rgba(9,10,13,${(dark * 0.05).toFixed(3)}) 0px, rgba(9,10,13,${(dark * 0.35).toFixed(3)}) ${(R * 0.42).toFixed(0)}px, rgba(9,10,13,${dark.toFixed(3)}) ${R.toFixed(0)}px)`;
    el.style.opacity = (1 - tw(t, T.window + 0.2, T.window + 0.5)).toFixed(3);
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
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
