// The ClassIn wordmark, rebuilt in code from the traced glyph outlines (assets/logo-paths.js) and
// rendered as a material on canvas: an enamel/ink body in the brand green with a 연두 (yellow-green)
// light falling across it, fine pigment grain, a soft bevel, a contact shadow on the ivory paper and
// a slow specular sheen. Because it is geometry, it can also be *drawn*: the outline traced by the
// light, the ink flooding outward from the i-dot, glyph by glyph.
import { GLYPHS } from '../assets/logo-paths.js';
import { clamp, lerp, rng, h } from './core.js';

const X0 = 2, Y0 = 4, BW = 2714, BH = 706; // union bbox of the glyphs in path units
export const MARK_ASPECT = BH / BW;
export const ORDER = ['C', 'l', 'a', 's1', 's2', 'iStem', 'n', 'iDot'];

const paths = Object.fromEntries(ORDER.map(k => [k, new Path2D(GLYPHS[k].d)]));
const union = new Path2D();
for (const k of ORDER) union.addPath(paths[k]);
const body = new Path2D(); // everything but the i-dot (the dot is the light — it gets its own material)
for (const k of ORDER) if (k !== 'iDot') body.addPath(paths[k]);

// pigment grain: multi-octave value noise + fine speckle, baked once (deterministic)
let GRAIN = null;
function grain() {
  if (GRAIN) return GRAIN;
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const k = c.getContext('2d'), img = k.createImageData(S, S), r = rng(77);
  const oct = [64, 16, 4].map(n => { const g = new Float32Array((n + 1) * (n + 1)); for (let i = 0; i < g.length; i++) g[i] = r(); return { n, g }; });
  const val = (o, x, y) => {
    const fx = (x / S) * o.n, fy = (y / S) * o.n, ix = fx | 0, iy = fy | 0, u = fx - ix, v = fy - iy;
    const a = o.g[iy * (o.n + 1) + ix], b = o.g[iy * (o.n + 1) + ix + 1], cc = o.g[(iy + 1) * (o.n + 1) + ix], d = o.g[(iy + 1) * (o.n + 1) + ix + 1];
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return lerp(lerp(a, b, su), lerp(cc, d, su), sv);
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const n = val(oct[0], x, y) * 0.25 + val(oct[1], x, y) * 0.35 + val(oct[2], x, y) * 0.4;
      const v = clamp(0.5 + (n - 0.5) * 0.9 + (r() - 0.5) * 0.42);
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
      img.data[i + 3] = 255;
    }
  k.putImageData(img, 0, 0);
  GRAIN = c;
  return c;
}

function geometry(w) {
  const k = w / BW;
  const P = (x, y) => [(x - X0) * k, (y - Y0) * k];
  const box = n => { const [a, b, c, d] = GLYPHS[n].box; const p = P(a, b), q = P(c, d); return { x0: p[0], y0: p[1], x1: q[0], y1: q[1] }; };
  const d = box('iDot');
  // the i-dot is a parallelogram slanting down to the right
  const iDot = [P(2099, 4.7), P(2229, 49.5), P(2229, 117.4), P(2099, 75.7)];
  return {
    k, w, h: w * MARK_ASPECT, box,
    iDot,
    iDotC: [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2],
    left: box('C').x0, right: box('n').x1, baseline: box('l').y1,
  };
}

/*
  createMark(w, { pad }) → { el, canvas, geo, draw(state) }
  state: {
    trace  0..1  outline drawn by the light (glyph by glyph, C → n)
    fill   0..1  ink flooding out from the i-dot (radius as a fraction of the logo diagonal)
    dot    0..1  the i-dot lit (glossy 연두 gel)
    lift   0..1  how far the mark stands off the paper (shadow size, bevel strength)
    sheen  -0.3..1.3  position of the specular band across the mark (outside 0..1 = off)
    alpha  overall opacity
  }
*/
export function createMark(w, { pad = Math.round(w * 0.12) } = {}) {
  const geo = geometry(w);
  const CW = Math.ceil(w + pad * 2), CH = Math.ceil(geo.h + pad * 2);
  const el = h('div', 'mark obj');
  el.style.width = `${CW}px`;
  el.style.height = `${CH}px`;
  const canvas = h('canvas');
  canvas.width = CW; canvas.height = CH;
  el.appendChild(canvas);
  const g = canvas.getContext('2d');
  const off = () => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; };
  const [lc, L] = off(); // the lit, textured mark before masking
  const [mc, M] = off(); // scratch for inner shadows
  const pat = g.createPattern(grain(), 'repeat');
  const unit = new DOMMatrix().translate(pad, pad).scale(geo.k).translate(-X0, -Y0);
  const tr = (ctx) => ctx.setTransform(unit);
  const S = geo.k / 0.33; // style scale relative to a ~900 px mark
  // glyph order for tracing, and each glyph's outline length (approx from its bbox perimeter)
  // traced outward from the i-dot (where the light lands): i, n, s, s, a, l, C
  const glyphs = ['iStem', 'n', 's2', 's1', 'a', 'l', 'C'];
  const dotC = [pad + geo.iDotC[0], pad + geo.iDotC[1]];
  const diag = Math.hypot(CW, CH);

  // inner shadow of `path` with offset (dx, dy) and blur, in color — classic even-odd cut-out trick
  function inner(ctx, path, dx, dy, blur, color, comp = 'source-over') {
    M.setTransform(1, 0, 0, 1, 0, 0);
    M.clearRect(0, 0, CW, CH);
    M.save();
    tr(M);
    M.clip(path, 'evenodd');
    M.setTransform(1, 0, 0, 1, 0, 0);
    M.shadowColor = color; M.shadowBlur = blur; M.shadowOffsetX = dx + 4000; M.shadowOffsetY = dy;
    const hole = new Path2D();
    hole.rect(-4000 - 200, -200, CW + 400, CH + 400);
    const p2 = new Path2D();
    p2.addPath(path, new DOMMatrix().translate(-4000, 0).multiply(unit));
    hole.addPath(p2);
    M.fillStyle = '#000';
    M.fill(hole, 'evenodd');
    M.restore();
    ctx.save();
    ctx.globalCompositeOperation = comp;
    ctx.drawImage(mc, 0, 0);
    ctx.restore();
  }

  function paintBody(ctx, s) {
    // base: the official green, warmed by a 연두 light from the upper left
    ctx.save();
    tr(ctx);
    const gr = ctx.createLinearGradient(X0, Y0, X0 + BW * 0.75, Y0 + BH * 1.6);
    gr.addColorStop(0, '#8FDC3C');
    gr.addColorStop(0.32, '#3FCB2A');
    gr.addColorStop(0.62, '#0BBE0F');
    gr.addColorStop(1, '#03A20F');
    ctx.fillStyle = gr;
    ctx.fill(body, 'evenodd');
    ctx.restore();
    // pigment grain (overlay) and slow ink density mottling (multiply)
    ctx.save();
    tr(ctx); ctx.clip(body, 'evenodd');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.5;
    const top = ctx.createLinearGradient(0, pad, 0, pad + geo.h);
    top.addColorStop(0, 'rgba(255,255,240,0.9)');
    top.addColorStop(0.5, 'rgba(255,255,255,0)');
    top.addColorStop(1, 'rgba(0,40,0,0.5)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, CW, CH);
    ctx.restore();
    // bevel: a soft dark lip bottom-right, a bright lip top-left
    const lift = s.lift ?? 1;
    inner(ctx, body, -2 * S, -3.2 * S, 5 * S, `rgba(0,58,8,${0.42 * lift})`, 'source-atop');
    inner(ctx, body, 1.4 * S, 2 * S, 1.6 * S, `rgba(255,255,236,${0.9 * lift})`, 'source-atop');
    // crisp satin rim
    ctx.save();
    tr(ctx); ctx.clip(body, 'evenodd');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.strokeStyle = 'rgba(255,255,240,0.9)';
    ctx.lineWidth = 2.4 * S / geo.k;
    ctx.stroke(body);
    ctx.restore();
  }

  function paintDot(ctx, s) {
    const a = s.dot ?? 1;
    ctx.save();
    tr(ctx);
    const d = GLYPHS.iDot.box;
    const gr = ctx.createLinearGradient(d[0], d[1], d[2], d[3]);
    gr.addColorStop(0, `rgb(${lerp(11, 196, a) | 0},${lerp(190, 246, a) | 0},${lerp(15, 120, a) | 0})`);
    gr.addColorStop(0.55, `rgb(${lerp(11, 132, a) | 0},${lerp(190, 222, a) | 0},${lerp(15, 58, a) | 0})`);
    gr.addColorStop(1, `rgb(${lerp(3, 60, a) | 0},${lerp(162, 190, a) | 0},${lerp(15, 30, a) | 0})`);
    ctx.fillStyle = gr;
    ctx.fill(paths.iDot);
    ctx.restore();
    inner(ctx, paths.iDot, -2.5 * S, -4 * S, 6 * S, `rgba(20,90,0,${0.45 * (s.lift ?? 1)})`, 'source-atop');
    inner(ctx, paths.iDot, 1.6 * S, 2.4 * S, 2.5 * S, `rgba(255,255,240,${0.95 * (s.lift ?? 1)})`, 'source-atop');
  }

  function draw(s = {}) {
    const alpha = s.alpha ?? 1, fill = s.fill ?? 1, trace = s.trace ?? 1, lift = s.lift ?? 1, dot = s.dot ?? 0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, CW, CH);
    if (alpha <= 0.001) return;
    g.globalAlpha = alpha;

    // 1 · the lit mark, textured
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalCompositeOperation = 'source-over';
    L.globalAlpha = 1;
    L.clearRect(0, 0, CW, CH);
    if (fill > 0) {
      paintBody(L, s);
      paintDot(L, { ...s, dot });
      // specular sheen: a soft diagonal band sliding across
      const sh = s.sheen ?? -1;
      if (sh > -0.3 && sh < 1.3) {
        L.save();
        L.globalCompositeOperation = 'source-atop';
        const x = lerp(-0.25, 1.25, sh) * CW, sk = CH * 0.9;
        const band = L.createLinearGradient(x - sk * 0.5 - 120 * S, 0, x + sk * 0.5 + 120 * S, CH);
        band.addColorStop(0, 'rgba(255,255,255,0)');
        band.addColorStop(0.42, 'rgba(255,255,236,0)');
        band.addColorStop(0.5, 'rgba(255,255,236,0.55)');
        band.addColorStop(0.58, 'rgba(255,255,236,0)');
        band.addColorStop(1, 'rgba(255,255,255,0)');
        L.fillStyle = band;
        L.fillRect(0, 0, CW, CH);
        L.restore();
      }
      // ink flood: only what the ink has reached so far, with a soft wet edge
      if (fill < 1) {
        const R = fill * diag * 1.05, edge = 60 * S;
        L.save();
        L.globalCompositeOperation = 'destination-in';
        const rg = L.createRadialGradient(dotC[0], dotC[1], Math.max(0, R - edge), dotC[0], dotC[1], R + 1);
        rg.addColorStop(0, 'rgba(0,0,0,1)');
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        L.fillStyle = rg;
        L.fillRect(0, 0, CW, CH);
        L.restore();
      }
    }

    // 2 · on the paper: contact shadow (wide, soft) + tight occlusion, both from the masked mark
    if (fill > 0) {
      g.save();
      g.shadowColor = `rgba(92,80,40,${0.26 * lift})`;
      g.shadowBlur = 34 * S * (0.5 + 0.5 * lift);
      g.shadowOffsetY = 18 * S * lift;
      g.shadowOffsetX = 6 * S * lift;
      g.drawImage(lc, -6000, 0); // draw far off-canvas so only the shadow lands
      g.restore();
      g.save();
      g.translate(6000, 0);
      g.shadowColor = `rgba(60,64,24,${0.3 * lift})`;
      g.shadowBlur = 5 * S;
      g.shadowOffsetY = 3 * S * lift;
      g.drawImage(lc, -6000, 0);
      g.restore();
      g.drawImage(lc, 0, 0);
    }

    // 3 · the outline being traced by the light, glyph by glyph (C → n), fading as the ink arrives
    if (trace > 0 && trace < 1.6 && fill < 1) {
      g.save();
      tr(g);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const n = glyphs.length;
      glyphs.forEach((name, i) => {
        const k = clamp(trace * (n + 2) / 3 - i * 0.62); // overlapping glyph windows
        if (k <= 0) return;
        const len = glyphLen[name];
        const lw = 5 / geo.k * S;
        g.setLineDash([len * k, len * 2]);
        g.lineDashOffset = 0;
        g.globalAlpha = alpha * (1 - fill);
        g.shadowColor = 'rgba(150,226,70,0.95)';
        g.shadowBlur = 16 * S;
        g.strokeStyle = '#8ED84A';
        g.lineWidth = lw;
        g.stroke(paths[name]);
        g.shadowBlur = 0;
        g.strokeStyle = 'rgba(250,255,236,0.95)';
        g.lineWidth = lw * 0.36;
        g.stroke(paths[name]);
      });
      g.restore();
    }
  }

  // outline lengths, measured once through SVG
  const glyphLen = {};
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute'; svg.style.width = '0'; svg.style.height = '0';
  document.body.appendChild(svg);
  for (const name of ORDER) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', GLYPHS[name].d);
    svg.appendChild(p);
    glyphLen[name] = p.getTotalLength();
  }
  svg.remove();

  return { el, canvas, geo, pad, CW, CH, draw, dotScreen: () => dotC };
}
