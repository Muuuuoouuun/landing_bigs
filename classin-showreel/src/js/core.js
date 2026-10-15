// Core: timing helpers, easing, seeded randomness, and the 2.5D camera.
// Everything is a pure function of time so any frame can be rendered in any order.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const mix2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];

export const E = {
  linear: x => x,
  inQuad: x => x * x,
  outQuad: x => 1 - (1 - x) * (1 - x),
  inOutQuad: x => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
  inCubic: x => x * x * x,
  outCubic: x => 1 - (1 - x) ** 3,
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  outQuart: x => 1 - (1 - x) ** 4,
  inOutQuart: x => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2),
  inQuint: x => x ** 5,
  outQuint: x => 1 - (1 - x) ** 5,
  inOutQuint: x => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2),
  inExpo: x => (x === 0 ? 0 : 2 ** (10 * x - 10)),
  outExpo: x => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
  inOutExpo: x => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  outBack: x => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
  inBack: x => 2.70158 * x ** 3 - 1.70158 * x * x,
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
};

// eased progress of t through [a, b]
export const tw = (t, a, b, e = E.inOutCubic) => e(prog(t, a, b));
// rises over [a, b], falls over [c, d]
export const env = (t, a, b, c, d, e = E.inOutCubic) => tw(t, a, b, e) * (1 - tw(t, c, d, e));

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// slow organic wobble in [-1, 1]
export const drift = (t, seed = 0, f = 0.15) =>
  Math.sin(t * f * 6.2832 + seed) * 0.62 + Math.sin(t * f * 1.73 * 6.2832 + seed * 2.31) * 0.38;

// decaying camera shake after time t0
export function shake(t, t0, amp = 12, dur = 0.35, freq = 31) {
  const k = (t - t0) / dur;
  if (k < 0 || k > 1) return [0, 0];
  const a = amp * (1 - k) ** 2;
  return [Math.sin((t - t0) * freq * 6.28) * a, Math.cos((t - t0) * freq * 4.9) * a * 0.7];
}

/* ---------- 4x4 matrices (column-major, same order as CSS matrix3d) ---------- */
export const M4 = {
  id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  },
  T: (x, y, z = 0) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  S: (x, y = x, z = 1) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
  RX(deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
  RY(deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
  RZ(deg) { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  P: d => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1 / d, 0, 0, 0, 1],
  chain: (...ms) => ms.reduce((a, b) => M4.mul(a, b)),
  css: m => `matrix3d(${m.map(v => +v.toFixed(6)).join(',')})`,
  apply(m, x, y, z = 0) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, w];
  },
};

/*
  Camera: looks at world point (x, y, z). rx/ry/rz rotate the world around that point,
  s scales it, dolly pushes it toward the viewer, d is the perspective distance.
  World units are pixels: with s=1 and no rotation, world (x, y, 0) sits on screen 1:1.
*/
export function camMatrix(cam, W, H) {
  return M4.chain(
    M4.T(W / 2 + (cam.sx || 0), H / 2 + (cam.sy || 0), 0),
    M4.P(cam.d || 1600),
    M4.T(0, 0, cam.dolly || 0),
    M4.RZ(cam.rz || 0),
    M4.RX(cam.rx || 0),
    M4.RY(cam.ry || 0),
    M4.S(cam.s ?? 1, cam.s ?? 1, cam.s ?? 1),
    M4.T(-(cam.x || 0), -(cam.y || 0), -(cam.z || 0)),
  );
}

// A flat DOM plane living in the world: place(el, camM, model) positions its top-left (0,0) via model.
export function place(el, camM, model) {
  el.style.transform = M4.css(model ? M4.mul(camM, model) : camM);
}

// model for a w×h plane centred on (x, y, z) with optional rotations
export function planeModel(x, y, z, w, h, { rx = 0, ry = 0, rz = 0, s = 1 } = {}) {
  return M4.chain(M4.T(x, y, z), M4.RZ(rz), M4.RX(rx), M4.RY(ry), M4.S(s, s, s), M4.T(-w / 2, -h / 2, 0));
}

/* ---------- polylines ---------- */
// cumulative arc lengths for a polyline
export function measure(pts) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], (pts[i][2] || 0) - (pts[i - 1][2] || 0)));
  return L;
}

// sub-polyline between normalized arc positions a..b (0..1)
export function slice(pts, a, b, L = measure(pts)) {
  const total = L[L.length - 1];
  a = clamp(a) * total; b = clamp(b) * total;
  if (b <= a || pts.length < 2) return [];
  const at = s => {
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
    const p = pts[i - 1], q = pts[i];
    return [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2] || 0, q[2] || 0, k)];
  };
  const out = [at(a)];
  for (let i = 0; i < pts.length; i++) if (L[i] > a && L[i] < b) out.push(pts[i]);
  out.push(at(b));
  return out;
}

export function pointAt(pts, u, L = measure(pts)) {
  const s = slice(pts, Math.max(0, u - 1e-4), u, L);
  return s.length ? s[s.length - 1] : pts[0];
}

// sample a cubic bezier (2D or 3D) into n points
export function bezier(p0, p1, p2, p3, n = 32) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1, 2].map(k => u * u * u * (p0[k] || 0) + 3 * u * u * t * (p1[k] || 0) + 3 * u * t * t * (p2[k] || 0) + t * t * t * (p3[k] || 0)));
  }
  return out;
}

// rounded rectangle outline starting at bottom-centre, going clockwise (left first)
export function roundRect(x, y, w, h, r, n = 8) {
  const pts = [[x + w / 2, y + h]];
  const arc = (cx, cy, a0, a1) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(x + r, y + h - r, Math.PI / 2, Math.PI);
  arc(x + r, y + r, Math.PI, Math.PI * 1.5);
  arc(x + w - r, y + r, -Math.PI / 2, 0);
  arc(x + w - r, y + h - r, 0, Math.PI / 2);
  pts.push([x + w / 2, y + h]);
  return pts;
}

export const fmt = n => n.toLocaleString('en-US');

// affine transform of a point (for model matrices, w = 1) → [x, y, z]
export function xf(m, x, y, z = 0) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

/*
  Keyframed values: keys = [{ t, ...values, e? }]. Each key's `e` is the easing used to
  arrive at it from the previous key (default inOutQuint — long, filmic eases).
*/
export function keyed(t, keys) {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t <= b.t) {
      const a = keys[i - 1];
      const k = (b.e || E.inOutQuint)((t - a.t) / (b.t - a.t));
      const o = {};
      for (const key in b) if (key !== 't' && key !== 'e') o[key] = typeof b[key] === 'number' ? lerp(a[key] ?? b[key], b[key], k) : b[key];
      for (const key in a) if (!(key in o) && key !== 't' && key !== 'e') o[key] = a[key];
      return o;
    }
  }
  return { ...keys[keys.length - 1] };
}

// layout helper: element box relative to an ancestor (layout space, ignores transforms)
export function boxIn(el, root) {
  let x = 0, y = 0, e = el;
  while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export function h(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}
