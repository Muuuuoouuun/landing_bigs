// S6 · 히어로 (24.00–26.40) + S7 · 엔드카드 (26.40–28.80): the converged light lands as the i-dot.
// From the dot the light traces the wordmark C → n, and the ink floods out after it — the code-built
// mark settles onto the paper with its satin bevel, grain and shadow; a slow sheen crosses it. Then the
// i-dot's light becomes a single point, stretches into a line, and the end card opens out of it.
import { E, tw, prog, clamp, lerp, shake, h } from '../core.js';
import { createMark } from '../brandmark.js';

// where the mark rests (shared with the tagline's convergence point)
export function markRest(W, H, P) {
  const w = P ? 820 : 980;
  const hh = w * (706 / 2714);
  const lx = Math.round(W / 2 - w / 2), ly = Math.round(H / 2 - hh / 2 - (P ? 60 : 30));
  const k = w / 2714;
  return { w, lx, ly, dot: [lx + (2164 - 2) * k, ly + (61 - 4) * k] };
}

export default function heroScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene hero');
  ctx.root.appendChild(el);
  const R = markRest(W, H, P);
  const mark = createMark(R.w);
  el.appendChild(mark.el);
  R.dot = [R.lx + mark.geo.iDotC[0], R.ly + mark.geo.iDotC[1]];
  const sub = h('div', 'hsub', copy.sub);
  el.appendChild(sub);
  const CY = Math.round(H / 2);
  const top = h('div', 'mask'), bot = h('div', 'mask');
  const e1 = h('div', 'e1', P ? copy.end.replace(', ', ',<br>') : copy.end);
  const small = createMark(P ? 300 : 320, { pad: 30 });
  const e2 = h('div', 'e2');
  e2.appendChild(small.el);
  const e3 = h('div', 'e3', copy.proof);
  top.appendChild(e1);
  bot.append(e2, e3);
  el.append(top, bot);
  small.draw({ fill: 1, dot: 0.7, lift: 0.6 });

  function layout() {
    top.style.top = '0px'; top.style.height = `${CY}px`;
    bot.style.top = `${CY}px`; bot.style.height = `${H - CY}px`;
    e1.style.top = `${CY - (P ? 200 : 110)}px`;
    e2.style.top = '22px';
    e3.style.top = `${P ? 150 : 140}px`;
  }

  function update(t) {
    el.style.opacity = clamp(prog(t, T.hero - 0.1, T.hero)) * (1 - tw(t, T.fadeA, 28.8, E.inOutSine));
    const trace = tw(t, T.hero, T.traceB, E.inOutSine);
    const fill = tw(t, T.hero + 0.06, T.fillB, E.inOutCubic);
    const lift = lerp(0.25, 1, tw(t, T.traceB, T.fillB + 0.3, E.outCubic));
    const dot = 1 - 0.5 * tw(t, T.hero + 0.3, T.fillB + 0.4);
    const sheen = t > T.shineA && t < T.shineB ? lerp(-0.25, 1.25, tw(t, T.shineA, T.shineB, E.inOutSine)) : -1;
    const out = tw(t, T.shineB, T.dot, E.inOutQuad);
    mark.draw({ trace, fill, lift, dot: Math.max(dot, out), sheen, alpha: 1 });
    // a gentle settle: the mark tilts up off the paper and lands flat
    const st = tw(t, T.hero, T.fillB + 0.4, E.outCubic);
    const sc = (1 + 0.035 * (1 - st)) * (1 + out * 0.04);
    mark.el.style.transformOrigin = `${mark.pad + mark.geo.iDotC[0]}px ${mark.pad + mark.geo.iDotC[1]}px`;
    mark.el.style.transform = `translate(${R.lx - mark.pad}px, ${R.ly - mark.pad}px) perspective(1600px) rotateX(${(8 * (1 - st)).toFixed(3)}deg) rotateY(${(-10 * (1 - st)).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    mark.el.style.opacity = (1 - out).toFixed(3);
    mark.el.style.filter = out > 0.01 ? `blur(${(out * 12).toFixed(2)}px)` : '';
    const s = tw(t, T.sub, T.sub + 0.5, E.outCubic) * (1 - tw(t, T.shineB - 0.1, T.shineB + 0.3));
    sub.style.opacity = s.toFixed(3);
    sub.style.transform = `translate(${Math.round(W / 2 - sub.offsetWidth / 2)}px, ${Math.round(R.ly + R.w * 0.2604 + (P ? 70 : 62) + (1 - s) * 14)}px)`;
    const sh = shake(t, T.hero, 6, 0.28);
    ctx.shake[0] += sh[0]; ctx.shake[1] += sh[1];
    ctx.flash += 0.35 * (t >= T.hero ? 1 - prog(t, T.hero, T.hero + 0.35) : 0);
    // end card
    const op = tw(t, T.lineB, T.lineB + 0.7, E.outQuint);
    e1.style.transform = `translate(-50%, ${((1 - op) * (P ? 200 : 120)).toFixed(1)}px)`;
    e2.style.transform = `translate(-50%, ${((1 - op) * -120).toFixed(1)}px)`;
    e3.style.transform = `translate(-50%, ${((1 - tw(t, T.lineB + 0.15, T.lineB + 0.85, E.outQuint)) * -160).toFixed(1)}px)`;
    e1.style.opacity = op; e2.style.opacity = op; e3.style.opacity = tw(t, T.lineB + 0.15, T.lineB + 0.85);
    small.draw({ fill: 1, dot: 0.7, lift: 0.6, sheen: t > T.lineB + 0.6 ? lerp(-0.25, 1.25, tw(t, T.lineB + 0.6, T.lineB + 1.8, E.inOutSine)) : -1 });
  }

  function draw(fx, t) {
    if (t < T.hero) return;
    const D = R.dot;
    // impact at the dot
    fx.flare(D[0], D[1], 240 * (1 - prog(t, T.hero, T.hero + 0.5)) + 40, 1 - prog(t, T.hero, T.hero + 0.6));
    fx.shards(D[0], D[1], t, T.hero, { n: 14, seed: 5, speed: 1000, life: 0.45, len: 60, w: 2, spreadY: 1 });
    fx.shape(mark.geo.iDot.map(p => [R.lx + p[0], R.ly + p[1]]), 1 - tw(t, T.hero + 0.1, T.hero + 0.5, E.inOutQuad), 1);
    // the i-dot's light becomes a single point, travels to centre, stretches into the line
    if (t > T.shineB) {
      const glow = tw(t, T.shineB, T.shineB + 0.35);
      const mv = tw(t, T.dot - 0.2, T.lineA + 0.02, E.inOutCubic);
      const x = lerp(D[0], W / 2, mv), y = lerp(D[1], CY, mv);
      const st = tw(t, T.lineA, T.lineB, E.outQuint);
      const half = st * (P ? 300 : 340);
      if (st <= 0.001) fx.head(x, y, 4 + (1 - mv) * 2, glow);
      else {
        const cool = tw(t, T.lineB, T.lineB + 0.8);
        const pts = [];
        for (let i = 0; i <= 24; i++) pts.push([W / 2 - half + (2 * half * i) / 24, CY]);
        fx.line(pts, { w: lerp(5, 2.4, st), alpha: 1, taper: 0, head: 0, cool: cool * 0.85, ink: '#8DD63F', inkW: 0.9 });
        fx.head(W / 2, CY, lerp(5, 2, st), 1 - st * 0.75);
      }
    }
  }

  return { el, range: ctx.S.hero, layout, update, draw };
}
