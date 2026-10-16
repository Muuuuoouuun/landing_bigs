// Film assembly: stage, global look, scene scheduling and the deterministic render(t) entry point
// used by both the live preview and the frame renderer (render/render.mjs).
import { LineFX } from './line.js';
import { clamp, drift, keyed, camMatrix, rng, h } from './core.js';
import { worldCam } from './world.js';
import bookScene from './scenes/book.js';
import brainScene from './scenes/brain.js';
import imagineScene from './scenes/imagine.js';
import homesScene from './scenes/homes.js';
import tagScene from './scenes/tagline.js';
import heroScene from './scenes/hero.js';
import { buildCues } from './cues.js';

const params = new URLSearchParams(location.search);
const P = params.get('fmt') === '9x16';
const W = P ? 1080 : 1920, H = P ? 1920 : 1080;
if (params.has('render')) document.body.classList.add('render');
if (P) document.body.classList.add('portrait');

const TL = await fetch('timeline.json').then(r => r.json());
const DUR = TL.meta.duration;

const stage = document.getElementById('stage');
stage.style.width = `${W}px`;
stage.style.height = `${H}px`;

const bg = h('div', 'bg');
const blob = h('div', 'blob'), blob2 = h('div', 'blob');
// paper fibre texture, baked once (deterministic)
const tex = document.createElement('canvas');
tex.width = W; tex.height = H; tex.className = 'tex';
{
  const k = tex.getContext('2d'), r = rng(11);
  k.fillStyle = '#fff'; k.fillRect(0, 0, W, H);
  for (let i = 0; i < (W * H) / 900; i++) {
    const x = r() * W, y = r() * H, l = 6 + r() * 26, a = r() * Math.PI;
    k.strokeStyle = `rgba(150,130,95,${(0.04 + r() * 0.08).toFixed(3)})`;
    k.lineWidth = 0.6 + r() * 0.8;
    k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l); k.stroke();
  }
  const img = k.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 16; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  k.putImageData(img, 0, 0);
}
bg.append(tex, blob, blob2);
const shakeEl = h('div');
shakeEl.id = 'shake';
const vignette = h('div', 'vignette');
const flash = h('div', 'flash');
stage.append(bg, shakeEl, vignette, flash);

const fx = new LineFX(W, H, shakeEl);
fx.canvas.style.zIndex = 50;
const tokLayer = h('div', 'toklayer');

const ctx = { W, H, P, T: TL.beats, S: TL.scenes, copy: TL.copy, root: shakeEl, fx, tokLayer, shake: [0, 0], flash: 0, CM: null };
const scenes = [bookScene, brainScene, imagineScene, homesScene, tagScene, heroScene].map(make => make(ctx));
shakeEl.appendChild(tokLayer);

// the warm key light drifting over the paper: position (fraction of frame), intensity, tint
const BG = [
  { t: 0, x: 0.55, y: 0.4, a: 0.7, r: 255, g: 246, b: 222 }, { t: 4.8, x: 0.5, y: 0.45, a: 0.9, r: 246, g: 252, b: 226 },
  { t: 9.6, x: 0.5, y: 0.5, a: 1, r: 240, g: 252, b: 214 }, { t: 12.0, x: 0.45, y: 0.45, a: 0.9, r: 255, g: 244, b: 226 },
  { t: 14.4, x: 0.5, y: 0.3, a: 0.9, r: 255, g: 238, b: 206 }, { t: 17.0, x: 0.5, y: 0.5, a: 1, r: 255, g: 234, b: 196 },
  { t: 19.2, x: 0.5, y: 0.5, a: 0.7, r: 250, g: 248, b: 232 }, { t: 23.6, x: 0.5, y: 0.5, a: 0.5, r: 250, g: 248, b: 232 },
  { t: 24.0, x: 0.5, y: 0.48, a: 1, r: 238, g: 252, b: 212 }, { t: 26.4, x: 0.5, y: 0.5, a: 0.7, r: 250, g: 248, b: 232 },
  { t: 28.8, x: 0.5, y: 0.5, a: 0.6, r: 250, g: 248, b: 232 },
];
const glow = (b, k) => `radial-gradient(circle, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(0.85 * k).toFixed(3)}) 0%, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(0.35 * k).toFixed(3)}) 34%, rgba(255,255,255,0) 68%)`;

function render(t) {
  ctx.shake = [0, 0];
  ctx.flash = 0;
  const b = keyed(t, BG);
  const bx = (b.x + drift(t, 1.3, 0.05) * 0.06) * W, by = (b.y + drift(t, 4.1, 0.045) * 0.05) * H;
  blob.style.transform = `translate(${bx}px, ${by}px) scale(${(P ? 1.25 : 1) * (1 + 0.06 * drift(t, 2, 0.08))})`;
  blob.style.background = glow(b, 1);
  blob.style.opacity = clamp(b.a * (0.9 + 0.1 * drift(t, 7, 0.21)));
  blob2.style.background = glow(b, 0.7);
  blob2.style.transform = `translate(${W - bx * 0.6}px, ${H * 0.95}px) scale(0.8)`;
  blob2.style.opacity = clamp(b.a * 0.35);

  ctx.cam = worldCam(t, ctx.T, P);
  ctx.CM = camMatrix(ctx.cam, W, H);
  fx.begin();
  const live = [];
  for (const s of scenes) {
    const on = t >= s.range[0] && t <= s.range[1];
    if (s.el) s.el.style.display = on ? 'block' : 'none';
    if (on) { s.update(t); live.push(s); }
  }
  for (const s of live) s.draw?.(fx, t);
  fx.end();

  shakeEl.style.transform = `translate(${ctx.shake[0].toFixed(2)}px, ${ctx.shake[1].toFixed(2)}px)`;
  flash.style.opacity = clamp(ctx.flash);
}

await document.fonts.load('800 40px Pretendard');
await Promise.all(['300', '400', '500', '600', '700', '900'].map(w => document.fonts.load(`${w} 20px Pretendard`)));
await document.fonts.load('600 40px Caveat');
await document.fonts.ready;
await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
// measure layout anchors while every scene is displayed (hidden scenes report zero boxes)
for (const s of scenes) if (s.el) s.el.style.display = 'block';
ctx.CM = camMatrix(worldCam(0, ctx.T, P), W, H);
for (const s of scenes) s.layout?.();
for (const s of scenes) if (s.el) s.el.style.display = 'none';

window.__film = { render, duration: DUR, fps: TL.meta.fps, W, H, ready: true, scenes, cues: buildCues(TL.beats, TL.copy) };

/* ---------- live preview ---------- */
if (!params.has('render')) {
  const fit = () => {
    const k = Math.min(innerWidth / W, (innerHeight - 52) / H);
    stage.style.transform = `scale(${k})`;
    stage.parentElement.style.paddingBottom = '52px';
  };
  addEventListener('resize', fit);
  fit();
  const scrub = document.getElementById('scrub'), time = document.getElementById('time'), btn = document.getElementById('play');
  document.getElementById('fmt').href = P ? '?' : '?fmt=9x16';
  document.getElementById('fmt').textContent = P ? '16:9' : '9:16';
  scrub.max = DUR;
  let playing = false, t0 = 0, start = 0;
  const show = t => { render(t); scrub.value = t; time.textContent = `${t.toFixed(2)}s`; };
  const tick = now => {
    if (!playing) return;
    let t = start + (now - t0) / 1000;
    if (t > DUR) { t = 0; start = 0; t0 = now; }
    show(t);
    requestAnimationFrame(tick);
  };
  btn.onclick = () => {
    playing = !playing;
    btn.textContent = playing ? '❚❚ Pause' : '▶︎ Play';
    if (playing) { start = +scrub.value >= DUR ? 0 : +scrub.value; t0 = performance.now(); requestAnimationFrame(tick); }
  };
  scrub.oninput = () => { playing = false; btn.textContent = '▶︎ Play'; show(+scrub.value); };
  show(+(params.get('t') || 0));
}

