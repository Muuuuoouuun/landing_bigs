// Film assembly: stage, global look, scene scheduling and the deterministic render(t) entry point
// used by both the live preview and the frame renderer (render/render.mjs).
import { LineFX } from './line.js';
import { clamp, drift, keyed, camMatrix, rng, tw, E, h, pchip } from './core.js';
import { worldCam } from './world.js';
import devicesScene from './scenes/devices.js';
import roomScene, { FRAGS, fragTimes } from './scenes/room.js';
import whaleScene from './scenes/whale.js';
import dawnScene from './scenes/dawn.js';
import nationScene from './scenes/nation.js';
import morningScene from './scenes/morning.js';
import tagScene from './scenes/tagline.js';
import heroScene from './scenes/hero.js';
import { createGL } from './gl.js';
import { createClassUI } from './classui.js';
import { buildCues } from './cues.js';

const params = new URLSearchParams(location.search);
const P = params.get('fmt') === '9x16';
const W = P ? 1080 : 1920, H = P ? 1920 : 1080;
if (params.has('render')) document.body.classList.add('render');
if (P) document.body.classList.add('portrait');

const TL = await fetch('timeline.json').then(r => r.json());
// story time (what the scenes and beats are written in) plays through a smooth warp (v7.1: 28.8 s → 21.0 s, the
// moves 1.45–1.6× faster, the reading moments 1.2×). render(u) takes film time u; cues and beats are mapped out.
const WK = TL.meta.warp || [[0, 0], [TL.meta.duration, TL.meta.duration]];
const story = pchip(WK.map(k => k[1]), WK.map(k => k[0]));
const DUR = WK[WK.length - 1][1];
const film = s => { let a = -1, b = DUR + 4; for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (story(m) < s) a = m; else b = m; } return (a + b) / 2; };
const mapCue = c => { const o = { ...c, t: +film(c.t).toFixed(4) }; if (c.dur != null) o.dur = +(film(c.t + c.dur) - o.t).toFixed(4); return o; };

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
const vignette = h('div', 'vignette'), vigNight = h('div', 'vignette night');
const flash = h('div', 'flash');
stage.append(bg, shakeEl, vignette, vigNight, flash);

const fx = new LineFX(W, H, shakeEl);
fx.canvas.style.zIndex = 50;
const gl = createGL(W, H, shakeEl);

const ctx = { W, H, P, T: TL.beats, S: TL.scenes, copy: TL.copy, root: shakeEl, fx, gl, shake: [0, 0], flash: 0, CM: null };
ctx.classUI = createClassUI(ctx);
const scenes = [roomScene, whaleScene, dawnScene, nationScene, morningScene, tagScene, heroScene, devicesScene].map(make => make(ctx));

// night → day: 0 = the dark stage and room, 1 = ivory paper (the dawn and nation scenes paint their own skies)
const dayK = t => tw(t, 15.75, 16.15, E.inOutSine);
const NIGHT = [11, 12, 14], DAY = [246, 241, 230];
// the key light drifting over the stage: position (fraction of frame), intensity, tint
const BG = [
  { t: 0, x: 0.55, y: 0.48, a: 0.9, r: 170, g: 236, b: 150 }, { t: 1.4, x: 0.52, y: 0.46, a: 0.8, r: 180, g: 236, b: 160 },
  { t: 2.4, x: 0.5, y: 0.5, a: 0.7, r: 190, g: 226, b: 200 }, { t: 3.7, x: 0.5, y: 0.5, a: 0.4, r: 200, g: 220, b: 210 },
  { t: 10.0, x: 0.5, y: 0.55, a: 0.6, r: 255, g: 214, b: 160 }, { t: 12.0, x: 0.5, y: 0.5, a: 0.8, r: 255, g: 220, b: 170 },
  { t: 15.6, x: 0.5, y: 0.4, a: 0.8, r: 255, g: 230, b: 190 }, { t: 16.2, x: 0.6, y: 0.4, a: 0.9, r: 255, g: 240, b: 210 },
  { t: 17.5, x: 0.5, y: 0.5, a: 0.7, r: 250, g: 248, b: 232 }, { t: 19.6, x: 0.5, y: 0.5, a: 0.5, r: 250, g: 248, b: 232 },
  { t: 20.0, x: 0.5, y: 0.48, a: 1, r: 238, g: 252, b: 212 }, { t: 22.2, x: 0.5, y: 0.5, a: 0.7, r: 250, g: 248, b: 232 },
  { t: 24.0, x: 0.5, y: 0.5, a: 0.6, r: 250, g: 248, b: 232 },
];
const glow = (b, k, L) => { const a0 = 0.16 + 0.69 * L, a1 = 0.06 + 0.29 * L; return `radial-gradient(circle, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(a0 * k).toFixed(3)}) 0%, rgba(${b.r | 0},${b.g | 0},${b.b | 0},${(a1 * k).toFixed(3)}) 34%, rgba(0,0,0,0) 68%)`; };

function render(u) {
  const t = story(u);
  ctx.shake = [0, 0];
  ctx.flash = 0;
  const L = dayK(t);
  ctx.day = L;
  fx.light = L;
  bg.style.background = `rgb(${NIGHT.map((v, i) => Math.round(v + (DAY[i] - v) * L)).join(',')})`;
  tex.style.opacity = (0.55 * L).toFixed(3);
  vignette.style.opacity = L.toFixed(3);
  vigNight.style.opacity = (1 - L).toFixed(3);
  const b = keyed(t, BG);
  const bx = (b.x + drift(t, 1.3, 0.05) * 0.06) * W, by = (b.y + drift(t, 4.1, 0.045) * 0.05) * H;
  blob.style.transform = `translate(${bx}px, ${by}px) scale(${(P ? 1.25 : 1) * (1 + 0.06 * drift(t, 2, 0.08))})`;
  blob.style.background = glow(b, 1, L);
  blob.style.opacity = clamp(b.a * (0.9 + 0.1 * drift(t, 7, 0.21)));
  blob2.style.background = glow(b, 0.7, L);
  blob2.style.transform = `translate(${W - bx * 0.6}px, ${H * 0.95}px) scale(0.8)`;
  blob2.style.opacity = clamp(b.a * 0.35);

  ctx.cam = worldCam(t, ctx.T, P);
  ctx.CM = camMatrix(ctx.cam, W, H);
  fx.begin();
  gl.begin();
  const live = [];
  for (const s of scenes) {
    const on = t >= s.range[0] && t <= s.range[1];
    if (s.el) s.el.style.display = on ? 'block' : 'none';
    if (on) { s.update(t); live.push(s); }
  }
  for (const s of live) s.draw?.(fx, t);
  fx.end();
  gl.end();

  shakeEl.style.transform = `translate(${ctx.shake[0].toFixed(2)}px, ${ctx.shake[1].toFixed(2)}px)`;
  flash.style.opacity = clamp(ctx.flash);
}

await document.fonts.load('800 40px Pretendard');
await Promise.all(['300', '400', '500', '600', '700', '900'].map(w => document.fonts.load(`${w} 20px Pretendard`)));
await document.fonts.load('600 40px Caveat');
await document.fonts.load("400 40px NanumPen", '오늘의 퀴즈: 고래가 하늘을 날려면?');
await document.fonts.ready;
await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
await ctx.classUI.ready;
await Promise.all(scenes.map(s => s.ready));
// measure layout anchors while every scene is displayed (hidden scenes report zero boxes)
for (const s of scenes) if (s.el) s.el.style.display = 'block';
ctx.CM = camMatrix(worldCam(0, ctx.T, P), W, H);
for (const s of scenes) s.layout?.();
for (const s of scenes) if (s.el) s.el.style.display = 'none';

// what the motion-driven sounds need: the 3D pen's tip track and when the light reaches each house in view
function cueData() {
  const dev = scenes[scenes.length - 1], town = scenes[2].town?.();
  const X = { pen: dev.track?.(240) };
  // (v8.3) the class's pieces leaving the glass and lying down into the grid
  const FT = fragTimes(TL.beats);
  X.frags = FRAGS.map((f, i) => ({ up: FT.up[i], lay: FT.grid[i] + FT.LAY, pan: +(((f.x + f.w / 2) / 1920) * 1.2 - 0.6).toFixed(2), col: i % 4, row: Math.floor(i / 4) }));
  if (town) X.town = town.houses.map(hs => { town.update(hs.tB); const q = town.toScreen(hs.cx, 4, hs.cz); return { t: hs.tB, x: q[0], y: q[1], z: q[2], f3: hs.floors === 3 }; })
    .filter(q => q.z < 1 && q.x > -50 && q.x < W + 50 && q.y > -50 && q.y < H + 50).map(q => ({ t: +q.t.toFixed(4), pan: +((q.x / W) * 1.2 - 0.6).toFixed(2), f3: q.f3 }));
  if (town) X.motes = town.motes.map(m => { town.update(m.t1); const q = town.toScreen(m.x, m.y, m.z); return { t: m.t1, x: q[0], y: q[1], z: q[2] }; })
    .filter(q => q.z < 1 && q.x > -50 && q.x < W + 50 && q.y > -50 && q.y < H + 50).map(q => ({ t: +q.t.toFixed(4), pan: +((q.x / W) * 1.2 - 0.6).toFixed(2) }));
  return X;
}
const beatsOut = Object.fromEntries(Object.entries(TL.beats).map(([k, v]) => [k, +film(v).toFixed(4)]));
const barsOut = Array.from({ length: Math.ceil(TL.meta.duration / TL.meta.bar) + 1 }, (_, k) => +film(k * TL.meta.bar).toFixed(4));
window.__film = {
  render, duration: DUR, fps: TL.meta.fps, W, H, ready: true, scenes, story, film,
  cues: buildCues(TL.beats, TL.copy, cueData()).map(mapCue),
  music: { duration: DUR, bpm: TL.meta.music?.bpm || TL.meta.bpm, beats: beatsOut, bars: barsOut },
};

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

