// S7 · 다음 날 아침 (19.20–21.00): morning sun on the same desk. Under last night's question, the light draws
// Seo-yun's answer — the whale with its wings and balloons — and then lands on the question mark: its dot becomes
// the slanted ClassIn i-dot, a stamp that cools into ink (the original's smile landing on the box). A parent
// notification slides in: 오늘의 수업 리포트가 도착했어요.
import { E, tw, prog, clamp, lerp, drift, keyed, camMatrix, place, planeModel, xf, measure, slice, catmull, h } from '../core.js';
import { project } from '../line.js';
import { NOTE } from './book.js';
import { whaleStrokes } from './whale.js';
import { createMark } from '../brandmark.js';
import SPRITES from '../../assets/gen/sprites.js';

export default function morningScene(ctx) {
  const { W, H, T, copy } = ctx;
  const el = h('section', 'scene morning');
  ctx.root.appendChild(el);
  const plane = (cls, w, hh, html) => { const d = h('div', `obj ${cls}`, html); d.style.width = `${w}px`; d.style.height = `${hh}px`; el.appendChild(d); return d; };
  const desk = plane('desk', 4200, 2600);
  const nShadow = plane('bshadow', NOTE.w + 260, NOTE.h + 220);
  const note = plane('note', NOTE.w, NOTE.h, `<div class="nd">10월 17일 (금)</div>
    <div class="nl l1"><span>${copy.question[0]}</span></div><div class="nl l2"><span>${copy.question[1].slice(0, -1)}<em class="qm">?</em></span></div>`);
  const props = []
    .map(p => { const m = SPRITES[`${p.src}.png`]; const w = p.h * (m.w / m.h); return { ...p, w, el: plane('prop', w, p.h, `<img src="assets/gen/${p.src}.png" alt="">`) }; });
  const sun = h('div', 'sunlight');
  el.appendChild(sun);
  const notif = h('div', 'notif', `<div class="ic"></div><div class="tx"><div class="r1"><b>${copy.notify.app}</b><span>지금</span></div><div class="r2">${copy.notify.title}</div><div class="r3">${copy.notify.body}</div></div>`);
  el.appendChild(notif);
  const icon = createMark(84, { pad: 4 });
  icon.draw({ fill: 1, dot: 0.8, lift: 0.3 });
  notif.querySelector('.ic').appendChild(icon.el);
  const qm = note.querySelector('.qm');
  const MN = planeModel(NOTE.x, NOTE.y, 0, NOTE.w, NOTE.h, { rz: NOTE.rz });
  // the answer, drawn under the question (notebook-local px)
  const C = [215, 455], S = 0.62;
  const loc = ([x, y]) => [C[0] - x * S, C[1] + y * S]; // mirrored: the whale swims to the right, upwards
  const wings = [catmull([[-30, -66], [-80, -150], [10, -190], [50, -76]], 8), catmull([[-34, -100], [-10, -140]], 4)];
  const balloons = [[150, -190, 30], [225, -165, 34]].map(([x, y, rr]) => Array.from({ length: 29 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }));
  const strings = [[[150, -160], [95, -62]], [[225, -131], [110, -50]]];
  const draws = [
    ...whaleStrokes().map(s => ({ pts: s.pts.map(loc), ink: s.accent ? '#6DBB2C' : '#4A4A4E' })),
    ...wings.map(p => ({ pts: p.map(loc), ink: '#5B9BD5' })),
    ...balloons.map(p => ({ pts: p.map(loc), ink: '#F08A24' })), ...strings.map(p => ({ pts: p.map(loc), ink: '#B0A89A' })),
  ];
  const lens = draws.map(d => { const L = measure(d.pts); return L[L.length - 1]; }), total = lens.reduce((a, b) => a + b, 0);
  let Q = null;
  function layout() {
    const keep = note.style.transform; note.style.transform = 'none';
    const N0 = note.getBoundingClientRect(), sc = N0.width / note.offsetWidth, q = qm.getBoundingClientRect();
    // the question mark's dot: bottom centre of the glyph
    Q = [(q.left - N0.left) / sc + (q.width / sc) * 0.46, (q.top - N0.top) / sc + (q.height / sc) * 0.8];
    note.style.transform = keep;
  }
  // the ClassIn i-dot (slanted parallelogram), in notebook px around the question mark's dot
  const dotShape = s => [[-0.5, -0.62], [0.5, -0.25], [0.5, 0.62], [-0.5, 0.25]].map(([x, y]) => [Q[0] + x * 20 * s, Q[1] + y * 20 * s]);

  function camAt(t) {
    const c = keyed(t, [
      { t: 19.0, x: NOTE.x + 120, y: NOTE.y - 40, z: 0, s: 1.3, rx: 22, ry: 0, rz: -2 },
      { t: T.stamp, x: NOTE.x + 60, y: NOTE.y - 10, z: 0, s: 1.55, rx: 18, ry: 0, rz: -3, e: E.inOutSine },
      { t: 21.3, x: NOTE.x + 40, y: NOTE.y, z: 0, s: 1.62, rx: 16, ry: 0, rz: -3, e: E.inOutSine },
    ]);
    c.ry += drift(t, 2.1, 0.1);
    c.d = 1700;
    return c;
  }

  let cur = null;
  function update(t) {
    const CM = camMatrix(camAt(t), W, H);
    el.style.opacity = tw(t, 19.05, T.morning + 0.25, E.inOutSine) * (1 - tw(t, T.sweepA - 0.25, T.sweepA + 0.15, E.inOutSine));
    place(desk, CM, planeModel(NOTE.x + 200, NOTE.y, -14, 4200, 2600));
    place(nShadow, CM, planeModel(NOTE.x + 26, NOTE.y + 34, -12, NOTE.w + 260, NOTE.h + 220, { rz: NOTE.rz }));
    place(note, CM, MN);
    for (const p of props) place(p.el, CM, planeModel(NOTE.x + p.x, NOTE.y + p.y, p.h / 2, p.w, p.h, { rx: -90 }));
    sun.style.opacity = (0.85 + 0.15 * drift(t, 3, 0.2)).toFixed(3);
    const nk = tw(t, T.notify, T.notify + 0.35, E.outBack);
    notif.style.opacity = clamp(nk * 1.4).toFixed(3);
    notif.style.transform = `translate(-50%, ${((1 - nk) * -150).toFixed(1)}px)`;
    cur = { CM, M: MN };
  }

  function draw(fx, t) {
    if (!cur || !Q) return;
    const P3 = pts => project(cur.CM, pts.map(([x, y]) => xf(cur.M, x, y, 0)));
    const fade = tw(t, 19.1, T.morning + 0.25) * (1 - tw(t, T.sweepA - 0.25, T.sweepA + 0.1));
    // the answer drawn by the light: graphite, wings in blue, balloons in orange, spout in 연두
    const dk = tw(t, T.doodleA, T.doodleB, E.inOutSine);
    let acc = 0;
    draws.forEach((d, j) => {
      const a0 = acc / total, a1 = (acc + lens[j]) / total;
      acc += lens[j];
      const k = clamp((dk - a0) / (a1 - a0));
      if (k <= 0) return;
      fx.line(P3(slice(d.pts, 0, k)), { w: 3, alpha: fade, taper: 0, head: k < 1 ? 0.9 : 0, cool: 1 - 0.7 * (k < 1 ? 1 : 0) * (1 - prog(t, T.doodleB, T.doodleB + 0.3)), ink: d.ink, inkW: 0.85 });
    });
    // the stamp: a light drops onto the question mark — its dot becomes the slanted ClassIn i-dot, then cools to ink
    const drop = prog(t, T.stamp - 0.32, T.stamp);
    if (drop > 0 && drop < 1) {
      const q = P3([Q])[0];
      const from = [q[0] + 160, q[1] - 520];
      const k = E.inCubic(drop);
      fx.line([[lerp(from[0], q[0], Math.max(0, k - 0.3)), lerp(from[1], q[1], Math.max(0, k - 0.3))], [lerp(from[0], q[0], k), lerp(from[1], q[1], k)]], { w: 4.5, alpha: fade, taper: 1, head: 1.2 });
    }
    if (t >= T.stamp) {
      const k = prog(t, T.stamp, T.stamp + 0.5);
      const s = 1 + 0.6 * (1 - E.outBack(Math.min(1, k * 2)));
      const poly = P3(dotShape(s));
      fx.shape(poly, fade * (1 - 0.65 * tw(t, T.stamp + 0.2, T.stamp + 0.8)), 1 - k);
      const q = P3([Q])[0];
      fx.flare(q[0], q[1], 120 * (1 - k) + 20, 0.8 * fade * (1 - k));
      for (let i = 0; i < 2; i++) {
        const rk = prog(t, T.stamp + i * 0.08, T.stamp + 0.6 + i * 0.08);
        if (rk <= 0 || rk >= 1) continue;
        const R = 20 + 90 * E.outCubic(rk);
        fx.line(P3(Array.from({ length: 41 }, (_, a) => [Q[0] + Math.cos(a / 40 * Math.PI * 2) * R, Q[1] + Math.sin(a / 40 * Math.PI * 2) * R * 0.9])), { w: 2 * (1 - rk), alpha: (1 - rk) * fade, taper: 0 });
      }
      // printed: the question mark's dot is covered and the slanted i-dot stays on the page in green ink
      const cov = P3(Array.from({ length: 13 }, (_, a) => [Q[0] + Math.cos(a / 12 * Math.PI * 2) * 10, Q[1] + Math.sin(a / 12 * Math.PI * 2) * 10]));
      fx.inkPoly(cov, '#FBFAF6', fade * tw(t, T.stamp, T.stamp + 0.05));
      fx.inkPoly(P3(dotShape(1)), '#2FB838', fade * tw(t, T.stamp + 0.15, T.stamp + 0.6));
    }
  }

  return { el, range: ctx.S.morning, layout, update, draw };
}
