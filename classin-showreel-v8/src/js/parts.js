// The four friends' drawings (v8.5): 도윤 날개 · 하린 풍선 · 민준 제트 엔진 · 지아 선글라스 — in whale-local units
// (nose x = −240, flukes x = +240, y down), where they sit on the teacher's whale. Drawn the way a friend would with
// a stylus: each element is an outline in ink, its colour laid in underneath once the outline closes (a soft
// gradient with pigment grain), then the details and the shine. drawPart() draws a part at any scale and progress
// and returns the pen's tip; partLines() gives the outlines (animated: the wing beats, the balloons bob, the flame
// flickers) for the whale made of light.
import { catmull, clamp, lerp } from './core.js';
import { inkStroke, inkFill } from './ink.js';

const D2R = Math.PI / 180;
const bez = (p0, p1, p2, p3, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  return [0, 1].map(j => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j]);
});
const rot = ([x, y], a, [cx, cy]) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
const ellipse = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const len = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
const lin = (a, b, stops) => ({ type: 'lin', a, b, stops });
const rad = (c, r0, r1, stops) => ({ type: 'rad', c, r0, r1, stops });

// ---------- 도윤 · 날개: a bird's wing raised from the back — long primaries at the top, secondaries behind, a row
// of coverts over their roots and the leading edge drawn last, firm
function wing() {
  const P0 = [-24, -82], SC = 0.88;
  const sc = p => [P0[0] + (p[0] - P0[0]) * SC, P0[1] + (p[1] - P0[1]) * SC];
  const LE = bez(P0, [-52, -138], [-46, -196], [2, -214], 40).map(sc);
  const at = s => { const f = clamp(s) * (LE.length - 1), i = Math.min(LE.length - 2, Math.floor(f)), q = f - i; return [lerp(LE[i][0], LE[i + 1][0], q), lerp(LE[i][1], LE[i + 1][1], q)]; };
  const nrm = s => { const a = at(s - 0.02), b = at(s + 0.02), d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [-(b[1] - a[1]) / d, (b[0] - a[0]) / d]; };
  // one flight feather: base, direction, length, width — a long leaf with a rounded tip and its shaft
  const feather = (b, ang, L, W, light, mid) => {
    const loc = [[0, 0], [0.12 * L, -0.34 * W], [0.5 * L, -0.5 * W], [0.86 * L, -0.4 * W], [L, -0.04 * W], [0.9 * L, 0.32 * W], [0.5 * L, 0.46 * W], [0.12 * L, 0.3 * W]];
    const pts = catmull(loc, 6, true).map(p => rot([b[0] + p[0], b[1] + p[1]], ang, b));
    const tip = rot([b[0] + L, b[1]], ang, b);
    return [{ pts, closed: true, fill: lin(b, tip, [[0, light], [1, mid]]), w: 0.62 },
      { pts: [0.3, 0.6, 0.88].map(f => rot([b[0] + f * L, b[1] + 0.04 * W], ang, b)), w: 0.24, color: '#6E98C4', sheen: 0, detail: true }];
  };
  // a band of coverts along the leading edge: from the edge in by d, its inner edge scalloped (n feathers' tips)
  const band = (s0, s1, d, n, amp) => {
    const N = 240, edge = [], inner = [];
    for (let i = 0; i <= N; i++) {
      const s = s0 + (s1 - s0) * i / N, p = at(s), m = nrm(s), f = (i / N) * n;
      const taper = 0.45 + 0.55 * Math.sin(Math.PI * (i / N)) ** 0.6;   // slimmer at the root and at the tip
      const dd = d * taper + amp * taper * Math.sin(Math.PI * (f - Math.floor(f))) ** 0.7;
      edge.push(p); inner.push([p[0] + m[0] * dd, p[1] + m[1] * dd]);
    }
    return { pts: [...edge, ...inner.slice().reverse()], inner };
  };
  const els = [];
  [[0.99, -16, 104], [0.9, -9, 112], [0.8, -2, 112], [0.7, 5, 106], [0.6, 11, 98]].forEach(([s, a, L]) => els.push(...feather(at(s), a * D2R, L * SC, 25 * SC, '#F3F9FF', '#B7D9F6')));
  [[0.5, 16, 88], [0.4, 20, 82], [0.3, 24, 76], [0.2, 27, 70], [0.1, 30, 62]].forEach(([s, a, L]) => els.push(...feather(at(s), a * D2R, L * SC, 26 * SC, '#EEF6FF', '#A9D0F2')));
  const big = band(0.03, 0.97, 26, 6, 11), small = band(0.06, 0.94, 12, 8, 6);
  els.push({ pts: big.pts, closed: true, w: 0.62, fill: lin(at(0.5), [at(0.5)[0] + 40, at(0.5)[1] + 25], [[0, '#FFFFFF'], [1, '#D3E8FB']]) });
  els.push({ pts: small.inner, w: 0.36, color: '#86B3DE', sheen: 0, detail: true });
  els.push({ pts: LE, w: 1.15, sheen: 0.5 });
  return { key: 'wing', pen: '#9FD0FF', glow: '160,210,255', els, root: P0 };
}

// ---------- 하린 · 풍선: three balloons (egg-shaped, a tied knot, a highlight), their strings wavy, tied together on
// the whale's back
function balloons() {
  const T = [118, -58];
  const B = [
    { c: [146, -166], r: [27, 32], tilt: -0.16, light: '#FFE4BF', base: '#F59A23', dark: '#B4600E' },
    { c: [204, -192], r: [29, 34], tilt: 0.04, light: '#FFD9D9', base: '#FF6B6B', dark: '#B83A44' },
    { c: [262, -142], r: [25, 30], tilt: 0.2, light: '#FFF5CC', base: '#FFCB3D', dark: '#C08A10' },
  ];
  const els = [];
  B.forEach((b, i) => {
    const [cx, cy] = b.c, [rx, ry] = b.r;
    const egg = Array.from({ length: 49 }, (_, j) => { const a = (j / 48) * Math.PI * 2, sn = Math.sin(a); return rot([cx + rx * Math.cos(a) * (1 - 0.15 * sn), cy + ry * sn], b.tilt, b.c); });
    els.push({ pts: egg, closed: true, w: 0.8, color: b.dark, grp: i, fill: rad([cx - rx * 0.38, cy - ry * 0.42], rx * 0.1, rx * 1.45, [[0, b.light], [0.42, b.base], [1, b.dark]]) });
    const knot = [[cx, cy + ry - 1], [cx - 5, cy + ry + 7], [cx + 5, cy + ry + 7], [cx, cy + ry - 1]].map(p => rot(p, b.tilt, b.c));
    els.push({ pts: knot, closed: true, w: 0.5, color: b.dark, grp: i, fill: b.base });
    els.push({ pts: ellipse(cx, cy, rx * 0.62, ry * 0.64, 3.55, 4.35, 10).map(p => rot(p, b.tilt, b.c)), w: 0.55, color: 'rgba(255,255,255,0.9)', sheen: 0, grp: i, shine: true });
    const k0 = rot([cx, cy + ry + 7], b.tilt, b.c), dx = T[0] - k0[0], dy = T[1] - k0[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const wig = [0, 6, -5, 4, -2, 0].map((o, j, a) => { const f = j / (a.length - 1); return [k0[0] + dx * f + nx * o, k0[1] + dy * f + ny * o]; });
    els.push({ pts: catmull(wig, 6), w: 0.32, color: '#D8D1C2', sheen: 0, grp: i, string: true });
  });
  els.push({ pts: ellipse(T[0], T[1], 4, 3, 0, Math.PI * 2, 12), closed: true, w: 0.4, color: '#D8D1C2', fill: '#D8D1C2' });
  return { key: 'balloons', pen: '#F59A23', glow: '255,180,90', els, tie: T, B };
}

// ---------- 민준 · 제트 엔진: a turbofan hung under the tail on a pylon, seen three-quarters from the front: the
// intake lip, the fan and its spinner, panel seams, the nozzle and the flame
function jet() {
  const cy = 50, x0 = 118, x1 = 228, R0 = 25, R1 = 17, xn = 250;
  const els = [];
  els.push({ pts: [[152, cy - R0 + 3], [204, cy - R1 - 1], [188, -9], [160, -14], [152, cy - R0 + 3]], closed: true, w: 0.6, color: '#7D8AA0', fill: lin([170, -14], [170, cy - 20], [[0, '#7F8A9C'], [1, '#B8C2D1']]) });
  const top = bez([x0, cy - R0], [150, cy - R0 - 2], [200, cy - R1 - 2], [x1, cy - R1], 16);
  const back = ellipse(x1, cy, 4, R1, -Math.PI / 2, Math.PI / 2, 10);
  const bot = bez([x1, cy + R1], [200, cy + R1 + 2], [150, cy + R0 + 2], [x0, cy + R0], 16);
  const front = ellipse(x0, cy, 10, R0, Math.PI / 2, Math.PI * 1.5, 16);
  els.push({ pts: [...top, ...back, ...bot, ...front], closed: true, w: 0.8, color: '#8796AD', shadow: 0.6,
    fill: lin([170, cy - R0], [170, cy + R0], [[0, '#F4F7FB'], [0.3, '#D3DAE4'], [0.75, '#8F9BAE'], [1, '#5F6B7E']]) });
  els.push({ pts: [[x1, cy - R1], [xn, cy - 11], ...ellipse(xn, cy, 3.5, 11, -Math.PI / 2, Math.PI / 2, 8).slice(1), [x1, cy + R1]], closed: true, w: 0.6, color: '#6B778C', fill: lin([240, cy - 15], [240, cy + 15], [[0, '#A9B3C2'], [1, '#3C4557']]) });
  els.push({ pts: ellipse(xn, cy, 3.5, 11, 0, Math.PI * 2, 16), closed: true, w: 0.35, color: '#3A4252', fill: '#1B1F28' });
  // panel seams around the nacelle (the near half only)
  for (const [x, r] of [[152, 23.5], [194, 20]]) els.push({ pts: ellipse(x, cy, 3.5, r, -Math.PI / 2, Math.PI / 2, 12), w: 0.26, color: '#6F7C92', sheen: 0, detail: true });
  els.push({ pts: bez([128, cy - R0 + 4], [160, cy - R0 + 2], [196, cy - R1 + 1], [220, cy - R1 + 3], 12), w: 0.3, color: 'rgba(255,255,255,0.95)', sheen: 0, shine: true });
  // the intake: lip, the dark inside, fan blades, spinner
  els.push({ pts: ellipse(x0, cy, 10, R0, 0, Math.PI * 2, 32), closed: true, w: 0.75, color: '#8796AD', fill: lin([x0 - 10, cy - R0], [x0 + 10, cy + R0], [[0, '#FFFFFF'], [1, '#AEB8C7']]) });
  els.push({ pts: ellipse(x0 + 1.5, cy, 7, R0 - 6, 0, Math.PI * 2, 28), closed: true, w: 0.4, color: '#4A5466', fill: rad([x0 + 1.5, cy], 1, R0, [[0, '#3A4252'], [1, '#141820']]) });
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2, b2 = a + 0.5;
    els.push({ pts: [[x0 + 1.5 + Math.cos(a) * 1.2, cy + Math.sin(a) * 4], [x0 + 1.5 + Math.cos(a + 0.25) * 4.2, cy + Math.sin(a + 0.25) * 11], [x0 + 1.5 + Math.cos(b2) * 6.6, cy + Math.sin(b2) * (R0 - 6.6)]], w: 0.2, color: '#AEB9CA', sheen: 0, detail: true });
  }
  els.push({ pts: ellipse(x0 + 0.5, cy, 2.6, 6, 0, Math.PI * 2, 16), closed: true, w: 0.3, color: '#C9D2DF', fill: '#EEF2F7' });
  // the flame: an outer orange teardrop and a white-hot core; it flickers
  const F = xn + 1;
  els.push({ pts: catmull([[F, cy - 9], [F + 18, cy - 12], [F + 46, cy - 7], [F + 68, cy - 1], [F + 46, cy + 7], [F + 18, cy + 12], [F, cy + 9]], 6, true), closed: true, w: 0.45, color: '#FF8A3D', flame: true, sheen: 0,
    fill: lin([F, cy], [F + 68, cy], [[0, '#FFF3CF'], [0.35, '#FFB050'], [1, 'rgba(255,110,40,0.15)']]) });
  els.push({ pts: catmull([[F, cy - 5], [F + 12, cy - 6], [F + 32, cy], [F + 12, cy + 6], [F, cy + 5]], 6, true), closed: true, line: false, flame: true, fill: lin([F, cy], [F + 32, cy], [[0, '#FFFFFF'], [1, 'rgba(255,240,200,0.4)']]) });
  for (const [dy, x0s, x1s] of [[-17, 18, 52], [18, 24, 58]]) els.push({ pts: [[F + x0s, cy + dy], [F + x1s, cy + dy * 0.8]], w: 0.3, color: 'rgba(255,214,160,0.75)', sheen: 0, flame: true, shine: true });
  return { key: 'jet', pen: '#B4C2D8', glow: '200,215,240', els, nozzle: [F, cy] };
}

// ---------- 지아 · 선글라스: aviators over the whale's eye — dark gradient lenses with a glare, a gold frame, the
// bridge forward and the arm back over the head
function shades() {
  // an aviator lens: flat top, the deep rounded bottom on the nose side (nose: −1 = towards −x)
  const aviator = (cx, cy, w, h, nose) => catmull([[-0.5, -0.46], [-0.02, -0.52], [0.48, -0.46], [0.54, -0.18], [0.4, 0.2], [0.12, 0.46], [-0.2, 0.52], [-0.44, 0.34], [-0.54, -0.06]]
    .map(([x, y]) => [cx - nose * x * w, cy + y * h]), 7, true);
  const els = [];
  const near = aviator(-100, -12, 42, 30, 1), far = aviator(-145, -15, 27, 27, -1);
  const glass = (cx, cy, h) => lin([cx, cy - h / 2], [cx, cy + h / 2], [[0, '#41598A'], [0.5, '#1B2540'], [1, '#07090F']]);
  els.push({ pts: far, closed: true, w: 0.85, shadow: 0.6, fill: glass(-145, -15, 27) });
  els.push({ pts: near, closed: true, w: 0.95, shadow: 0.7, fill: glass(-100, -12, 30) });
  els.push({ pts: catmull([[-132, -26], [-126, -29], [-121, -27]], 4), w: 0.8 });          // the bridge
  els.push({ pts: catmull([[-157, -28], [-140, -31], [-121, -30], [-100, -31], [-80, -29]], 5), w: 0.55 }); // the brow bar
  els.push({ pts: [[-79, -26], [-66, -25], [-54, -22], [-47, -16]], w: 0.85 });            // the arm, back over the head
  els.push({ pts: [[-113, -21], [-102, -4]], w: 0.5, color: 'rgba(255,255,255,0.9)', sheen: 0, shine: true });
  els.push({ pts: [[-105, -24], [-97, -12]], w: 0.3, color: 'rgba(255,255,255,0.7)', sheen: 0, shine: true });
  els.push({ pts: [[-151, -20], [-144, -9]], w: 0.4, color: 'rgba(255,255,255,0.75)', sheen: 0, shine: true });
  return { key: 'shades', pen: '#F6C343', glow: '255,220,110', els };
}

export const PARTS = [wing(), balloons(), jet(), shades()];
PARTS.forEach(p => {
  p.els.forEach((e, i) => { e.len = e.line === false ? 12 : len(e.pts); e.seed = 40 + i; });
  p.total = p.els.reduce((a, e) => a + e.len, 0);
  const xs = p.els.flatMap(e => e.pts.map(q => q[0])), ys = p.els.flatMap(e => e.pts.map(q => q[1]));
  p.bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
});

// the element's points at time t: the flame flickers; for the whale made of light, k (−1..1) beats the wing and
// bob makes the balloons bob on their strings
export function partPts(part, e, t = 0, k = 0, bob = false) {
  let pts = e.pts;
  if (e.flame) {
    const [fx, fy] = part.nozzle, s = 1 + 0.12 * Math.sin(t * 37) + 0.07 * Math.sin(t * 61 + 1), w = 1 + 0.06 * Math.sin(t * 43);
    pts = pts.map(([x, y]) => [fx + (x - fx) * s, fy + (y - fy) * w]);
  }
  if (k && part.key === 'wing') pts = pts.map(p => rot(p, -0.22 * k, part.root));
  if (bob && part.key === 'balloons' && e.grp != null) {
    const ox = Math.sin(t * 2.6 + e.grp * 1.7) * 4, oy = Math.sin(t * 3.3 + e.grp) * 3, n = pts.length - 1;
    pts = e.string ? pts.map(([x, y], i) => [x + ox * (1 - i / n), y + oy * (1 - i / n)]) : pts.map(([x, y]) => [x + ox, y + oy]);
  }
  return pts;
}

function style(k, f, map, sc) {
  if (typeof f === 'string') return f;
  let g;
  if (f.type === 'lin') { const a = map(f.a), b = map(f.b); g = k.createLinearGradient(a[0], a[1], b[0], b[1]); }
  else { const c = map(f.c); g = k.createRadialGradient(c[0], c[1], f.r0 * sc, c[0], c[1], f.r1 * sc); }
  for (const [o, col] of f.stops) g.addColorStop(o, col);
  return g;
}

// draw part (whale-local → canvas through map, sc canvas px per unit) up to progress u (0..1, along its total
// length, element by element); o.w: nominal pen width (px); o.t: time (the flame). Returns the pen's tip (or null).
export function drawPart(k, part, map, sc, u, o = {}) {
  const W = o.w ?? 5, t = o.t ?? 0;
  let acc = 0, tip = null;
  for (const e of part.els) {
    const a0 = acc / part.total, a1 = (acc + e.len) / part.total;
    acc += e.len;
    const kk = clamp((u - a0) / Math.max(1e-6, a1 - a0));
    if (kk <= 0) break;
    const pts = partPts(part, e, t).map(map);
    if (e.fill && kk >= 1) inkFill(k, pts, style(k, e.fill, map, sc), { alpha: (o.alpha ?? 1) * (u >= 1 ? 1 : clamp((u - a1) / 0.05)), grain: 0.35, shadow: e.shadow ?? 0.3, blur: 3 * sc });
    if (e.line !== false) inkStroke(k, pts, { u: kk, w: W * (e.w ?? 1), color: e.color || part.pen, seed: e.seed, sheen: e.sheen ?? 0.35, shadow: e.fill ? 0.2 : 0.45, grain: e.shine ? 0 : 0.5, alpha: o.alpha ?? 1,
      taperIn: e.closed ? W * 0.5 : undefined, taperOut: e.closed ? W * 0.5 : undefined });
    if (kk < 1) { const n = Math.max(1, Math.round((pts.length - 1) * kk)); tip = pts[n]; }
  }
  return tip;
}

// the outlines in light: [{ pts, color, w }] (w relative to the main line); details and shine left out
export function partLines(part, t = 0, k = 0, { detail = false, bob = false } = {}) {
  return part.els.filter(e => e.line !== false && (detail || !e.detail) && !e.shine)
    .map(e => ({ pts: partPts(part, e, t, k, bob), color: e.color && !e.color.startsWith('rgba') ? e.color : part.pen, w: e.w ?? 1 }));
}
