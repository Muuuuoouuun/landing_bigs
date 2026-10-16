// THE line. Every scene draws the light through this one module so it looks identical
// everywhere and can be handed from scene to scene without a seam.
import { clamp, lerp, measure, rng } from './core.js';

// v5 — light on ivory paper: a 연두 (yellow-green) filament with a pale hot centre and a soft
// lime haze, defined by a faint deeper-green edge so it reads on a bright background.
export const C = {
  green: '#A6DE5C',
  edge: '#4E9A1A',
  hi: '#86D23A',
  core: '#F7FFE6',
  ink: '#34322C',
};

export class LineFX {
  constructor(W, H, mount) {
    this.W = W; this.H = H;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.canvas.className = 'fx';
    mount.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    const off = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    this.glowC = off(); this.coreC = off();
    this.g = this.glowC.getContext('2d');
    this.c = this.coreC.getContext('2d');
    for (const k of [this.g, this.c]) { k.lineCap = 'round'; k.lineJoin = 'round'; }
    this.inks = [];
    this.dots = [];
  }

  // a printed dot (no glow): neurons, seeds, map points
  dot(x, y, r, color = C.ink, a = 1) { if (a > 0.003 && r > 0.05) this.dots.push([x, y, r, color, a]); }

  begin() {
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.g.clearRect(0, 0, this.W, this.H);
    this.c.clearRect(0, 0, this.W, this.H);
    this.inks.length = 0;
    this.dots.length = 0;
    this.used = false;
  }

  /*
    line(pts, o) — pts are screen points ordered tail → head.
    o.w      core width in px (head end)
    o.alpha  overall intensity 0..1
    o.taper  0 = uniform, 1 = tail fades to nothing
    o.head   brightness of the hot head 0..1 (0 = no head)
    o.cool   0 = pure light, 1 = cooled into printed ink (no glow)
  */
  line(pts, o = {}) {
    if (!pts || pts.length < 2) return;
    const w = o.w ?? 5, alpha = clamp(o.alpha ?? 1), taper = o.taper ?? 0.85, cool = clamp(o.cool ?? 0);
    if (alpha <= 0.002) return;
    this.used = true;
    const L = measure(pts), total = L[L.length - 1];
    if (total < 0.5) { if (o.head) this.head(pts[pts.length - 1][0], pts[pts.length - 1][1], w, alpha * o.head); return; }
    const N = Math.min(18, Math.max(2, Math.ceil(total / 26)));
    // chunk the polyline so width/alpha can ramp from tail to head
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s0 = (i / N) * total, s1 = ((i + 1) / N) * total;
      const seg = [];
      while (j < pts.length - 1 && L[j + 1] < s0) j++;
      const at = s => {
        let k = j;
        while (k < pts.length - 2 && L[k + 1] < s) k++;
        const u = (s - L[k]) / (L[k + 1] - L[k] || 1);
        return [lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u)];
      };
      seg.push(at(s0));
      for (let k = j + 1; k < pts.length && L[k] < s1; k++) seg.push(pts[k]);
      seg.push(at(s1));
      const f = (i + 1) / N;
      const a = alpha * lerp(1 - taper, 1, f ** 1.4);
      const ww = w * lerp(1 - taper * 0.6, 1, f);
      if (cool < 1) {
        this.stroke(this.g, seg, ww * 2.6, C.green, a * (1 - cool) * 0.8);
        this.stroke(this.c, seg, ww * 1.45, C.edge, a * (1 - cool) * 0.22);
        this.stroke(this.c, seg, ww * 1.1, C.hi, a * (1 - cool) * 0.95);
        this.stroke(this.c, seg, ww * 0.42, C.core, a * (1 - cool));
      }
      if (cool > 0) this.inks.push({ seg, w: ww * (o.inkW ?? 0.9), a: a * cool, color: o.ink || C.ink });
    }
    if (o.head) {
      const p = pts[pts.length - 1];
      this.head(p[0], p[1], w * (o.headScale ?? 1), alpha * o.head * (1 - cool));
    }
  }

  stroke(k, seg, w, color, a) {
    if (a <= 0.003) return;
    k.globalAlpha = clamp(a);
    k.strokeStyle = color;
    k.lineWidth = Math.max(0.6, w);
    k.beginPath();
    k.moveTo(seg[0][0], seg[0][1]);
    for (let i = 1; i < seg.length; i++) k.lineTo(seg[i][0], seg[i][1]);
    k.stroke();
  }

  // hot head: a white core inside a green bloom
  head(x, y, w, a = 1) {
    if (a <= 0.003) return;
    this.used = true;
    const r = w * 4.2;
    let gr = this.c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,246,${a})`);
    gr.addColorStop(0.3, `rgba(206,242,140,${0.85 * a})`);
    gr.addColorStop(1, 'rgba(150,214,70,0)');
    this.c.globalAlpha = 1;
    this.c.fillStyle = gr;
    this.c.fillRect(x - r, y - r, r * 2, r * 2);
    const R = w * 11;
    gr = this.g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, `rgba(170,226,90,${0.6 * a})`);
    gr.addColorStop(1, 'rgba(170,226,90,0)');
    this.g.globalAlpha = 1;
    this.g.fillStyle = gr;
    this.g.fillRect(x - R, y - R, R * 2, R * 2);
  }

  // soft bloom (impacts, flares)
  flare(x, y, r, a = 1, tint = '176,228,96') {
    if (a <= 0.003) return;
    this.used = true;
    const gr = this.g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${tint},${0.9 * a})`);
    gr.addColorStop(0.35, `rgba(${tint},${0.35 * a})`);
    gr.addColorStop(1, `rgba(${tint},0)`);
    this.g.globalAlpha = 1;
    this.g.fillStyle = gr;
    this.g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // filled light shape (e.g. the slanted i-dot glowing)
  shape(poly, a = 1, glow = 1) {
    if (a <= 0.003) return;
    this.used = true;
    for (const [k, col, al] of [[this.g, C.green, 0.8 * glow], [this.c, C.hi, 1]]) {
      k.globalAlpha = clamp(a * al);
      k.fillStyle = col;
      k.beginPath();
      poly.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])));
      k.closePath();
      k.fill();
    }
  }

  // light shards flying out of an impact at (x, y), born at t0
  shards(x, y, t, t0, { n = 18, seed = 1, speed = 900, life = 0.5, len = 60, w = 2.2, spreadY = 0.55 } = {}) {
    const age = t - t0;
    if (age < 0 || age > life * 1.6) return;
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2, v = speed * (0.35 + r() * 0.9), lf = life * (0.5 + r() * 0.8);
      if (age > lf) continue;
      const k = age / lf;
      const dist = v * lf * (1 - (1 - k) ** 2.4) / 2.4;
      const dx = Math.cos(ang), dy = Math.sin(ang) * spreadY;
      const px = x + dx * dist, py = y + dy * dist;
      const l = len * (1 - k) * (0.4 + r() * 0.8);
      this.line([[px - dx * l, py - dy * l], [px, py]], { w: w * (1 - k * 0.6), alpha: (1 - k) ** 1.2, taper: 1, head: 0.35 * (1 - k) });
    }
  }

  end() {
    const k = this.ctx;
    k.globalCompositeOperation = 'source-over';
    for (const ink of this.inks) {
      k.globalAlpha = clamp(ink.a);
      k.strokeStyle = ink.color;
      k.lineWidth = ink.w;
      k.lineCap = 'round';
      k.lineJoin = 'round';
      k.beginPath();
      k.moveTo(ink.seg[0][0], ink.seg[0][1]);
      for (let i = 1; i < ink.seg.length; i++) k.lineTo(ink.seg[i][0], ink.seg[i][1]);
      k.stroke();
    }
    for (const [x, y, r, col, a] of this.dots) {
      k.globalAlpha = clamp(a);
      k.fillStyle = col;
      k.beginPath();
      k.arc(x, y, r, 0, Math.PI * 2);
      k.fill();
    }
    if (!this.used) return;
    k.globalAlpha = 1;
    k.filter = 'blur(22px)';
    k.globalAlpha = 0.75;
    k.drawImage(this.glowC, 0, 0);
    k.filter = 'blur(6px)';
    k.globalAlpha = 0.6;
    k.drawImage(this.glowC, 0, 0);
    k.filter = 'blur(1px)';
    k.globalAlpha = 0.8;
    k.drawImage(this.coreC, 0, 0);
    k.filter = 'none';
    k.globalAlpha = 1;
    k.drawImage(this.coreC, 0, 0);
    k.globalCompositeOperation = 'source-over';
  }
}

// project an array of world points through a camera matrix (+ optional model) to screen
export function project(M, pts) {
  return pts.map(p => {
    const w = M[3] * p[0] + M[7] * p[1] + M[11] * (p[2] || 0) + M[15];
    return [(M[0] * p[0] + M[4] * p[1] + M[8] * (p[2] || 0) + M[12]) / w, (M[1] * p[0] + M[5] * p[1] + M[9] * (p[2] || 0) + M[13]) / w];
  });
}
