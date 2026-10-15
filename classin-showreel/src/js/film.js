// Film assembly: stage, global look, scene scheduling and the deterministic render(t) entry point
// used by both the live preview and the frame renderer (render/render.mjs).
import { LineFX } from './line.js';
import { clamp, drift, keyed, E, h } from './core.js';
import slam from './scenes/slam.js';
import appScene from './scenes/app.js';
import classScene from './scenes/classroom.js';
import familyScene from './scenes/family.js';
import futureScene from './scenes/future.js';
import mapScene from './scenes/map.js';
import tagScene from './scenes/tagline.js';
import heroScene from './scenes/hero.js';
import { buildCues } from './cues.js';

const params = new URLSearchParams(location.search);
const P = params.get('fmt') === '9x16';
const W = P ? 1080 : 1920, H = P ? 1920 : 1080;
if (params.has('render')) document.body.classList.add('render');

const TL = await fetch('timeline.json').then(r => r.json());
const DUR = TL.meta.duration;

const stage = document.getElementById('stage');
stage.style.width = `${W}px`;
stage.style.height = `${H}px`;

const bg = h('div', 'bg');
const blob = h('div', 'blob'), blob2 = h('div', 'blob');
bg.append(h('div', 'corner'), blob, blob2, h('div', 'floor'));
const shakeEl = h('div');
shakeEl.id = 'shake';
const vignette = h('div', 'vignette');
const flash = h('div', 'flash');
stage.append(bg, shakeEl, vignette, flash);

const fx = new LineFX(W, H, shakeEl);
fx.canvas.style.zIndex = 50;

const ctx = { W, H, P, T: TL.beats, S: TL.scenes, copy: TL.copy, root: shakeEl, fx, shake: [0, 0], flash: 0 };
const scenes = [slam, appScene, classScene, familyScene, futureScene, mapScene, tagScene, heroScene].map(make => make(ctx));

// the breathing stage light: position (fraction of frame), intensity and colour temperature.
// Neutral by default; warm at home with the family, dawn-white for the future; green only as a hint
// at the brand moments.
const BG = [
  { t: 0, x: 0.5, y: 0.52, a: 0.3, r: 200, g: 230, b: 210 }, { t: 0.4, x: 0.5, y: 0.5, a: 0.8, r: 200, g: 232, b: 212 },
  { t: 1.6, x: 0.52, y: 0.5, a: 0.6, r: 225, g: 230, b: 236 }, { t: 2.4, x: 0.5, y: 0.6, a: 0.9, r: 236, g: 238, b: 242 },
  { t: 4.6, x: 0.5, y: 0.55, a: 0.85, r: 236, g: 238, b: 242 }, { t: 5.2, x: 0.5, y: 0.5, a: 0.7, r: 214, g: 222, b: 236 },
  { t: 9.6, x: 0.55, y: 0.45, a: 0.8, r: 230, g: 222, b: 210 }, { t: 10.6, x: 0.5, y: 0.55, a: 1, r: 255, g: 196, b: 140 },
  { t: 13.6, x: 0.5, y: 0.5, a: 0.95, r: 255, g: 204, b: 150 }, { t: 14.6, x: 0.5, y: 0.35, a: 0.9, r: 214, g: 228, b: 255 },
  { t: 16.6, x: 0.5, y: 0.3, a: 1, r: 236, g: 242, b: 255 }, { t: 17.4, x: 0.5, y: 0.5, a: 0.6, r: 214, g: 222, b: 236 },
  { t: 19.4, x: 0.5, y: 0.55, a: 0.5, r: 228, g: 232, b: 238 }, { t: 23.6, x: 0.5, y: 0.55, a: 0.25, r: 228, g: 232, b: 238 },
  { t: 24.0, x: 0.5, y: 0.5, a: 0.85, r: 205, g: 236, b: 214 }, { t: 26.4, x: 0.5, y: 0.5, a: 0.45, r: 228, g: 232, b: 238 },
  { t: 28.4, x: 0.5, y: 0.5, a: 0.35, r: 228, g: 232, b: 238 }, { t: 28.8, x: 0.5, y: 0.5, a: 0, r: 228, g: 232, b: 238 },
];
const glow = (b, k) => `radial-gradient(circle, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(0.16 * k).toFixed(3)}) 0%, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(0.06 * k).toFixed(3)}) 32%, rgba(0,0,0,0) 66%)`;

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
  // fade from/to black at the very ends
  stage.style.filter = t > DUR - 0.4 ? `brightness(${clamp((DUR - t) / 0.4).toFixed(3)})` : '';
}

await document.fonts.load('800 40px Pretendard');
await Promise.all(['300', '400', '500', '600', '700', '900'].map(w => document.fonts.load(`${w} 20px Pretendard`)));
await document.fonts.load('600 40px Caveat');
await document.fonts.ready;
await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
// measure layout anchors while every scene is displayed (hidden scenes report zero boxes)
for (const s of scenes) if (s.el) s.el.style.display = 'block';
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

