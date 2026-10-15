// S7 · Class, In (16.80–21.60): the light carried out of the dashboard writes "모든 수업을, /
// 하나의 시스템 안으로." word by word, underlines 안으로, then 수업 → Class and 안으로 → In and the
// two glide together. In the breath, every connection in the film converges on the i-dot — the
// emotion lands on the logo. (The name's own meaning is the payoff.)
import { E, tw, prog, clamp, lerp, bezier, rng, h } from '../core.js';
import { arrowShape, logoArrow, logoRest } from '../logo.js';

export default function tagScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const F = P ? 108 : 148;
  const WORDS = [
    ...copy.tag1.map((k, i) => ({ k: i === 0 ? `${k} ` : k, line: 0 })),
    ...copy.tag2.map((k, i) => ({ k: i < 2 ? `${k} ` : k, line: 1 })),
  ];
  WORDS[1].en = 'Class';
  WORDS[5].en = 'In';
  WORDS[5].ac = true;
  for (const w of WORDS) {
    w.ko = h('span', `tw sheen${w.ac ? ' ac' : ''}`, w.k);
    w.ko.style.fontSize = `${F}px`;
    el.appendChild(w.ko);
    if (w.en) {
      w.enEl = h('span', `tw en${w.ac ? ' ac' : ''}`, w.en);
      w.enEl.style.fontSize = `${F}px`;
      el.appendChild(w.enEl);
    }
  }
  const cls = WORDS[1], inn = WORDS[5];
  const R = logoRest(W, H, P);

  // the writing light: centre → along line 1 → swoop → along line 2 → into the underline
  const A0 = T.sweepA, A1 = A0 + 0.2, A2 = T.tag2, A3 = T.tag2 + 0.18, A4 = T.underA;
  const invSine = u => Math.acos(1 - 2 * clamp(u)) / Math.PI;

  let L = {};
  function layout() {
    const lineGap = F * 1.3;
    const top0 = H / 2 - lineGap / 2 - F / 2 + (P ? -20 : 4);
    for (const line of [0, 1]) {
      const ws = WORDS.filter(w => w.line === line);
      const total = ws.reduce((s, w) => s + w.ko.offsetWidth, 0);
      let x = W / 2 - total / 2;
      for (const w of ws) { w.x = x; w.y = top0 + line * lineGap; w.w = w.ko.offsetWidth; w.lx = W / 2 - total / 2; w.lw = total; x += w.w; }
    }
    const wc = cls.enEl.offsetWidth, wi = inn.enEl.offsetWidth, kern = -F * 0.015;
    const mx = W / 2 - (wc + wi + kern) / 2, my = R.ly + R.g.h / 2 - F / 2;
    L.cls = [mx, my]; L.inn = [mx + wc + kern, my];
    L.wc = wc; L.wi = wi;
    L.textArrow = arrowShape(mx + 4, mx + wc + kern + wi * 0.18, my + F * 1.04, [mx + wc + kern + wi * 0.18 + F * 0.05, my - F * 0.16]);
    L.logoArrow = logoArrow(R.lx, R.ly, R.g, P);
    L.under = { x0: inn.x + 4, x1: inn.x + inn.w - 6, y: inn.y + F * 1.08 };
    const w0 = WORDS[0], w3 = WORDS[3];
    L.l1 = { x0: w0.lx - 14, x1: w0.lx + w0.lw + 10, y: w0.y + F * 1.08 };
    L.l2 = { x0: w3.lx - 14, x1: L.under.x0, y: L.under.y };
    L.swoop = bezier([L.l1.x1, L.l1.y], [L.l1.x1 + 80, L.l1.y + 60], [L.l2.x0 - 160, L.l2.y - 40], [L.l2.x0, L.l2.y], 24);
    L.enter = bezier([W / 2, H / 2], [W / 2 - 60, H / 2 + 140], [L.l1.x0 - 160, L.l1.y + 40], [L.l1.x0, L.l1.y], 24);
    // when the light passes each word, that word is written
    for (const w of WORDS) {
      const cx = w.x + w.w * 0.12;
      if (w.line === 0) w.at = A1 + (A2 - A1) * invSine((cx - L.l1.x0) / (L.l1.x1 - L.l1.x0)) - 0.1;
      else if (cx < L.under.x0) w.at = A3 + (A4 - A3) * invSine((cx - L.l2.x0) / (L.l2.x1 - L.l2.x0)) - 0.1;
      else w.at = T.underA + (w.ac ? 0 : 0.35) - 0.06;
    }
  }

  const at = (pts, k) => pts[Math.min(pts.length - 1, Math.round(k * (pts.length - 1)))];
  function headAt(t) {
    if (t < A1) return at(L.enter, E.inOutSine(prog(t, A0, A1)));
    if (t < A2) return [lerp(L.l1.x0, L.l1.x1, E.inOutSine(prog(t, A1, A2))), L.l1.y];
    if (t < A3) return at(L.swoop, E.inOutSine(prog(t, A2, A3)));
    return [lerp(L.l2.x0, L.l2.x1, E.inOutSine(prog(t, A3, A4))), L.l2.y];
  }
  // sheen band position (% of the line) follows the light on that line
  function sheenP(w, t) {
    if (w.line === 0) return t < A1 ? -35 : t > A2 + 0.25 ? 135 : lerp(0, 100, E.inOutSine(prog(t, A1, A2)));
    if (t < A3) return -35;
    if (t < A4) return ((headAt(t)[0] - w.lx) / w.lw) * 100;
    const k = tw(t, T.underA, T.underB, E.inOutCubic);
    return t > T.underB + 0.25 ? 135 : ((lerp(L.under.x0, L.under.x1, k) - w.lx) / w.lw) * 100;
  }

  function update(t) {
    el.style.opacity = 1 - tw(t, 21.5, 21.62);
    const fadeRest = tw(t, T.morphA, T.morphA + 0.4, E.inCubic);
    const morph = tw(t, T.morphA, T.morphB, E.inOutCubic);
    const glide = tw(t, T.morphB, T.joinB, E.inOutQuint);
    const out = tw(t, T.breath, T.breath + 0.4, E.inCubic);
    WORDS.forEach(w => {
      const k = tw(t, w.at, w.at + 0.45, E.outCubic);
      const settle = tw(t, w.at + 0.25, w.at + 0.9, E.inOutQuad);
      let op = k, blur = (1 - k) * 12, dy = (1 - k) * 36;
      if (w.en) { op *= 1 - morph; blur += morph * 12; } else { op *= 1 - fadeRest; blur += fadeRest * 10; dy -= fadeRest * 18; }
      w.ko.style.opacity = op;
      w.ko.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
      w.ko.style.transform = `translate(${w.x.toFixed(1)}px, ${(w.y + dy).toFixed(1)}px)`;
      const base = w.ac ? '46,219,76' : '255,255,255';
      const p = sheenP(w, t), band = 1 - settle * 0.1;
      w.ko.style.backgroundImage = `linear-gradient(100deg, rgb(${base}) 0%, rgb(${base}) ${p - 14}%, rgba(214,255,224,${band}) ${p - 4}%, rgba(57,255,106,${band}) ${p}%, rgba(214,255,224,${band}) ${p + 4}%, rgb(${base}) ${p + 14}%, rgb(${base}) 100%)`;
      w.ko.style.backgroundSize = `${w.lw}px 100%`;
      w.ko.style.backgroundPosition = `${-(w.x - w.lx)}px 0`;
      if (w.en) {
        const target = w === cls ? L.cls : L.inn;
        const sx = w.x + (w.w - (w === cls ? L.wc : L.wi)) / 2;
        const x = lerp(sx, target[0], glide), y = lerp(w.y, target[1], glide);
        w.enEl.style.opacity = morph * (1 - out);
        const eb = (1 - morph) * 12 + out * 10;
        w.enEl.style.filter = eb > 0.05 ? `blur(${eb.toFixed(2)}px)` : '';
        w.enEl.style.transform = `translate(${x.toFixed(1)}px, ${(y - out * 10).toFixed(1)}px)`;
      }
    });
  }

  function draw(fx, t) {
    // the writing light (its trail is simply where it has just been)
    if (t >= A0 && t < A4 + 0.02) {
      const trail = [];
      for (let i = 14; i >= 0; i--) trail.push(headAt(Math.max(A0, t - i * 0.018)));
      fx.line(trail, { w: 3.6, alpha: tw(t, A0, A0 + 0.08), taper: 1, head: 1, headScale: 1.1 });
    }
    // underline 안으로 (picks up exactly where the writing light arrives)
    if (t >= T.underA && t < T.morphA + 0.4) {
      const { x0, x1, y } = L.under;
      const k = tw(t, T.underA, T.underB, E.inOutCubic);
      const pts = [];
      for (let i = 0; i <= 30; i++) pts.push([lerp(x0, x1, (i / 30) * k), y + Math.sin((i / 30) * Math.PI) * 4]);
      if (k > 0.85) pts.push([x1 + (k - 0.85) / 0.15 * 10, y - (k - 0.85) / 0.15 * 14]);
      const fade = 1 - tw(t, T.morphA, T.morphA + 0.35);
      fx.line(pts, { w: 4.6, alpha: fade, taper: k < 1 ? 0.9 : 0.25, head: k < 1 ? 1 : 0.3 });
    }
    // Class → In arrow, then the breath, then it reshapes into the logo's arrow
    if (t >= T.morphB && t < 21.66) {
      const run = tw(t, T.morphB + 0.05, T.joinB + 0.05, E.inOutCubic);
      const re = tw(t, T.breath + 0.1, T.hero - 0.02, E.inOutQuint);
      const pts = L.textArrow.map((p, i) => [lerp(p[0], L.logoArrow[i][0], re), lerp(p[1], L.logoArrow[i][1], re)]);
      const n = Math.max(2, Math.round(pts.length * run));
      const breath = 1 - 0.65 * tw(t, T.breath, T.breath + 0.25) + 0.65 * tw(t, T.hero - 0.12, T.hero);
      fx.line(pts.slice(0, n), { w: lerp(4.2, 5.5, re), alpha: breath, taper: run < 1 ? 0.9 : 0.4, head: run < 1 ? 1 : 0.5 + 0.5 * clamp(prog(t, T.hero - 0.1, T.hero)) });
    }
    // the breath: every connection — branches, classrooms, students, families — converges on the i-dot
    if (t >= T.conv && t < T.hero + 0.02) {
      const D = L.logoArrow[L.logoArrow.length - 1];
      const r = rng(77);
      for (let i = 0; i < 34; i++) {
        const ang = r() * Math.PI * 2, rad = (P ? 1.15 : 0.82) * Math.max(W, H) * (0.75 + r() * 0.4);
        const s = [D[0] + Math.cos(ang) * rad, D[1] + Math.sin(ang) * rad * 0.7];
        const sw = (r() - 0.5) * 0.9;
        const c1 = [lerp(s[0], D[0], 0.35) - Math.sin(ang) * rad * sw, lerp(s[1], D[1], 0.35) + Math.cos(ang) * rad * sw * 0.7];
        const c2 = [lerp(s[0], D[0], 0.8), lerp(s[1], D[1], 0.8)];
        const curve = bezier(s, c1, c2, D, 30);
        const st = T.conv + r() * 0.12, en = T.hero - 0.02 - r() * 0.06;
        const wv = 1.3 + r() * 1.2, av = 0.3 + r() * 0.35;
        const k = E.inQuad(prog(t, st, en));
        if (k <= 0) continue;
        const seg = curve.slice(Math.max(0, Math.floor(curve.length * (k - 0.4))), Math.max(2, Math.ceil(curve.length * k)));
        fx.line(seg, { w: wv, alpha: av * (1 - 0.6 * prog(t, T.hero - 0.05, T.hero + 0.02)), taper: 1, head: 0.5 });
      }
      fx.flare(D[0], D[1], 90 + 120 * prog(t, T.conv, T.hero), 0.35 * prog(t, T.conv + 0.2, T.hero));
    }
  }

  return { el, range: ctx.S.tag, layout, update, draw };
}
