// Premium ink (v8): board strokes as a good digital pen on a matte slate, instead of uniform canvas lines.
// Each stroke is a filled outline whose width follows a pen-pressure curve (soft taper in, longer taper out, a
// slight living wobble), with a soft contact shadow, a fine pigment grain, a thin sheen along the light side and a
// faint darker rim. inkStroke(k, pts, o) draws onto a 2D context; u < 1 draws the stroke only up to that fraction
// (the pen still writing: the tip stays round and full).
import { clamp, rng } from './core.js';

let GRAIN = null;
function grain(k) {
  if (GRAIN) return GRAIN;
  const S = 160, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S, S), r = rng(5);
  for (let i = 0; i < S * S; i++) {
    const v = r();
    const d = v < 0.5 ? 0 : 255, a = Math.abs(v - 0.5) ** 2.2 * 2 * 120; // speckle: mostly faint, a few strong
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = d;
    img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  GRAIN = k.createPattern(c, 'repeat');
  return GRAIN;
}

// arc-length resample to ~step px
function resample(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    let t = step - carry;
    while (t <= d) { out.push([x0 + ((x1 - x0) * t) / d, y0 + ((y1 - y0) * t) / d]); t += step; }
    carry = d - (t - step);
  }
  const last = pts[pts.length - 1];
  if (Math.hypot(last[0] - out[out.length - 1][0], last[1] - out[out.length - 1][1]) > 0.5) out.push(last);
  return out;
}

const smooth = x => x * x * (3 - 2 * x);

function outline(p, width) {
  const L = [], R = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const n = Math.hypot(nx, ny) || 1;
    nx /= n; ny /= n;
    const w = width[i] / 2;
    L.push([p[i][0] + nx * w, p[i][1] + ny * w]);
    R.push([p[i][0] - nx * w, p[i][1] - ny * w]);
  }
  return { L, R };
}

function path(k, { L, R }, p, width) {
  k.beginPath();
  k.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) k.lineTo(L[i][0], L[i][1]);
  const e = p[p.length - 1], we = width[width.length - 1] / 2;
  const ae = Math.atan2(L[L.length - 1][1] - e[1], L[L.length - 1][0] - e[0]);
  k.arc(e[0], e[1], Math.max(0.01, we), ae, ae - Math.PI, true); // round cap at the tip
  for (let i = R.length - 1; i >= 0; i--) k.lineTo(R[i][0], R[i][1]);
  const s = p[0], ws = width[0] / 2;
  const as = Math.atan2(R[0][1] - s[1], R[0][0] - s[0]);
  k.arc(s[0], s[1], Math.max(0.01, ws), as, as - Math.PI, true);
  k.closePath();
}

/*
  o.w       nominal width (px)        o.color   ink colour
  o.u       how much is drawn (0..1)  o.seed    wobble seed
  o.sheen   0..1 highlight            o.shadow  0..1 contact shadow
  o.grain   0..1 pigment grain        o.alpha   overall opacity
  o.taperIn / o.taperOut  taper lengths in px
*/
export function inkStroke(k, pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const w = o.w ?? 6, u = clamp(o.u ?? 1), alpha = o.alpha ?? 1;
  if (u <= 0 || alpha <= 0.003) return;
  const full = resample(pts, Math.max(1.2, w * 0.35));
  let total = 0;
  const S = [0];
  for (let i = 1; i < full.length; i++) S.push((total += Math.hypot(full[i][0] - full[i - 1][0], full[i][1] - full[i - 1][1])));
  const n = Math.max(2, Math.round(full.length * u));
  const p = full.slice(0, n);
  const tin = o.taperIn ?? Math.min(w * 3, total * 0.2), tout = o.taperOut ?? Math.min(w * 6, total * 0.3);
  const r = rng(o.seed ?? 3), ph = r() * 10, fr = 0.02 + r() * 0.02;
  const writing = u < 1;
  const width = p.map((_, i) => {
    const s = S[i];
    const pin = 0.35 + 0.65 * smooth(clamp(s / tin));
    const pout = writing ? 1 : 0.18 + 0.82 * smooth(clamp((total - s) / tout));
    return w * pin * pout * (0.93 + 0.07 * Math.sin(s * fr + ph));
  });
  const ol = outline(p, width);
  k.save();
  k.globalAlpha = alpha;
  // contact shadow
  if ((o.shadow ?? 0.5) > 0) {
    k.save();
    k.shadowColor = `rgba(0,0,0,${0.55 * (o.shadow ?? 0.5)})`;
    k.shadowBlur = w * 1.1;
    k.shadowOffsetY = w * 0.3;
    path(k, ol, p, width);
    k.fillStyle = o.color || '#F2F2EE';
    k.fill();
    k.restore();
  }
  path(k, ol, p, width);
  k.fillStyle = o.color || '#F2F2EE';
  k.fill();
  // pigment grain, clipped to the stroke
  if ((o.grain ?? 0.6) > 0) {
    k.save();
    k.clip();
    k.globalAlpha = alpha * (o.grain ?? 0.6) * 0.55;
    k.fillStyle = grain(k);
    k.fillRect(Math.min(...ol.L.map(q => q[0]), ...ol.R.map(q => q[0])) - w, Math.min(...ol.L.map(q => q[1]), ...ol.R.map(q => q[1])) - w,
      total + 4 * w + 400, total + 4 * w + 400);
    k.restore();
    path(k, ol, p, width);
  }
  // faint darker rim for definition
  k.lineWidth = Math.max(0.6, w * 0.08);
  k.strokeStyle = 'rgba(0,0,0,0.22)';
  k.stroke();
  // sheen: a thin highlight riding the upper-left side of the stroke
  const sh = o.sheen ?? 0.4;
  if (sh > 0 && w > 2.5) {
    const hw = width.map(v => v * 0.26);
    const off = p.map((q, i) => {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const m = Math.hypot(nx, ny) || 1;
      nx /= m; ny /= m;
      if (nx + ny > 0) { nx = -nx; ny = -ny; } // towards the light (upper left)
      return [q[0] + nx * width[i] * 0.2, q[1] + ny * width[i] * 0.2];
    });
    path(k, outline(off, hw), off, hw);
    k.fillStyle = `rgba(255,255,255,${0.42 * sh})`;
    k.fill();
  }
  k.restore();
}

// the matte slate the strokes sit on: charcoal with fine grain, a faint dot grid and a soft sheen
export function slate(k, x, y, w, h, o = {}) {
  k.save();
  k.beginPath();
  k.roundRect(x, y, w, h, o.r ?? 14);
  k.clip();
  const g = k.createLinearGradient(x, y, x + w * 0.4, y + h);
  g.addColorStop(0, o.top || '#2A2C31');
  g.addColorStop(1, o.bottom || '#1E2024');
  k.fillStyle = g;
  k.fillRect(x, y, w, h);
  k.globalAlpha = 0.5;
  k.fillStyle = grain(k);
  k.fillRect(x, y, w, h);
  k.globalAlpha = 1;
  k.fillStyle = 'rgba(255,255,255,0.045)';
  const step = o.grid ?? 34;
  for (let gy = y + step / 2; gy < y + h; gy += step) for (let gx = x + step / 2; gx < x + w; gx += step) { k.beginPath(); k.arc(gx, gy, 1.1, 0, Math.PI * 2); k.fill(); }
  const s = k.createLinearGradient(x, y, x + w, y + h);
  s.addColorStop(0, 'rgba(255,255,255,0.06)');
  s.addColorStop(0.35, 'rgba(255,255,255,0)');
  s.addColorStop(0.8, 'rgba(255,255,255,0)');
  s.addColorStop(1, 'rgba(255,255,255,0.03)');
  k.fillStyle = s;
  k.fillRect(x, y, w, h);
  const v = k.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.35)');
  k.fillStyle = v;
  k.fillRect(x, y, w, h);
  k.restore();
  k.save();
  k.beginPath();
  k.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, o.r ?? 14);
  k.strokeStyle = 'rgba(255,255,255,0.07)';
  k.lineWidth = 1;
  k.stroke();
  k.restore();
}
