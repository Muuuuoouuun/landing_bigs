// S7 · Class, In (16.80–21.60): "모든 수업을, / 하나의 시스템 안으로." — the light underlines 안으로,
// then 수업 → Class and 안으로 → In, the rest falls away and Class + In glide together. The arrow
// under them reshapes into the logo's arrow for the hero hit. (The name's own meaning is the payoff.)
import { E, tw, prog, clamp, lerp, h } from '../core.js';
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
    // the merged word, centred where the logo will rest
    const wc = cls.enEl.offsetWidth, wi = inn.enEl.offsetWidth, kern = -F * 0.015;
    const mx = W / 2 - (wc + wi + kern) / 2, my = R.ly + R.g.h / 2 - F / 2;
    L.cls = [mx, my]; L.inn = [mx + wc + kern, my];
    L.wc = wc; L.wi = wi;
    // in Pretendard the I stem sits ~28% into "In"; the dot hovers above it
    L.textArrow = arrowShape(mx + 4, mx + wc + kern + wi * 0.18, my + F * 1.04, [mx + wc + kern + wi * 0.18 + F * 0.05, my - F * 0.16]);
    L.logoArrow = logoArrow(R.lx, R.ly, R.g, P);
    L.under = { x0: inn.x + 4, x1: inn.x + inn.w - 6, y: inn.y + F * 1.08 };
  }

  const appear = (w, i) => (w.line === 0 ? T.tag1 : T.tag2) + i * 0.09;

  function update(t) {
    el.style.opacity = 1 - tw(t, 21.5, 21.62);
    const fadeRest = tw(t, T.morphA, T.morphA + 0.4, E.inCubic);
    const morph = tw(t, T.morphA, T.morphB, E.inOutCubic);
    const glide = tw(t, T.morphB, T.joinB, E.inOutQuint);
    const out = tw(t, T.breath, T.breath + 0.4, E.inCubic);
    WORDS.forEach(w => {
      const idx = WORDS.filter(v => v.line === w.line).indexOf(w);
      const a0 = appear(w, idx);
      const k = tw(t, a0, a0 + 0.5, E.outCubic);
      const settle = tw(t, a0 + 0.25, a0 + 0.95, E.inOutQuad); // sheen settles to solid colour
      let op = k, blur = (1 - k) * 14, dy = (1 - k) * 46;
      if (w.en) {
        op *= 1 - morph;
        blur += morph * 12;
      } else {
        op *= 1 - fadeRest;
        blur += fadeRest * 10;
        dy -= fadeRest * 18;
      }
      w.ko.style.opacity = op;
      w.ko.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
      w.ko.style.transform = `translate(${w.x.toFixed(1)}px, ${(w.y + dy).toFixed(1)}px)`;
      // a band of green-white light sweeps across the whole line as it lands, then settles
      const base = w.ac ? '46,219,76' : '255,255,255';
      const t0 = w.line === 0 ? T.tag1 : T.tag2;
      const p = lerp(-35, 135, tw(t, t0 + 0.05, t0 + 1.0, E.inOutSine));
      const band = 1 - settle * 0.15;
      w.ko.style.backgroundImage = `linear-gradient(100deg, rgb(${base}) 0%, rgb(${base}) ${p - 16}%, rgba(214,255,224,${band}) ${p - 5}%, rgba(57,255,106,${band}) ${p}%, rgba(214,255,224,${band}) ${p + 5}%, rgb(${base}) ${p + 16}%, rgb(${base}) 100%)`;
      w.ko.style.backgroundSize = `${w.lw}px 100%`;
      w.ko.style.backgroundPosition = `${-(w.x - w.lx)}px 0`;
      if (w.en) {
        const target = w === cls ? L.cls : L.inn;
        // the English word appears centred over the Korean one, then glides to the merge
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
    // underline 안으로
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
  }

  return { el, range: ctx.S.tag, layout, update, draw };
}
