// S0 · 훅 (0.00–2.40): in the dark, a 연두 comet streaks in from deep space and slams into the i-dot; the
// code-built ClassIn mark reveals out of the impact — the light tracing it, the ink flooding from the dot. The
// mark lifts away, and the i-dot's light drops down onto Seo-yun's notebook, where it becomes the pen tip.
// (The original's "logo → product" handover: here, logo → one child's question.)
import { E, tw, prog, clamp, lerp, shake, bezier, slice, h } from '../core.js';
import { project } from '../line.js';
import { createMark } from '../brandmark.js';
import { markRest } from './hero.js';

export default function introScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene intro');
  ctx.root.appendChild(el);
  const R = markRest(W, H, P);
  const mark = createMark(R.w);
  el.appendChild(mark.el);
  const D = [R.lx + mark.geo.iDotC[0], R.ly + mark.geo.iDotC[1]];
  // the comet's approach: from deep in the frame (small, low left) curving up into the dot
  const approach = bezier([W * 0.18, H * 0.92], [W * 0.3, H * 0.4], [D[0] - 420, D[1] - 260], D, 40);

  function update(t) {
    const up = tw(t, T.logoUp, T.land - 0.2, E.inOutCubic);
    el.style.opacity = (1 - up).toFixed(3);
    const trace = tw(t, T.slam, T.revealA + 0.4, E.inOutSine);
    const fill = tw(t, T.revealA - 0.02, T.revealB, E.inOutCubic);
    mark.draw({ trace, fill, lift: 0.35, dot: 1, sheen: t > T.revealB && t < T.logoUp ? lerp(-0.25, 1.25, tw(t, T.revealB, T.logoUp, E.inOutSine)) : -1, alpha: t >= T.slam ? 1 : 0 });
    mark.el.style.transformOrigin = `${mark.pad + mark.geo.iDotC[0]}px ${mark.pad + mark.geo.iDotC[1]}px`;
    const sc = 1 + 0.06 * (1 - tw(t, T.slam, T.revealB, E.outCubic));
    mark.el.style.transform = `translate(${R.lx - mark.pad}px, ${(R.ly - mark.pad - up * 120).toFixed(2)}px) scale(${sc.toFixed(4)})`;
    mark.el.style.filter = up > 0.01 ? `blur(${(up * 10).toFixed(2)}px)` : '';
    const sh = shake(t, T.slam, 14, 0.32);
    ctx.shake[0] += sh[0]; ctx.shake[1] += sh[1];
    ctx.flash += 0.45 * (t >= T.slam ? 1 - prog(t, T.slam, T.slam + 0.3) : 0);
  }

  function draw(fx, t) {
    // the approach
    if (t < T.slam + 0.02) {
      const k = E.inQuad(prog(t, -0.05, T.slam));
      fx.line(slice(approach, Math.max(0, k - 0.45), k), { w: 6, alpha: 1, taper: 1, head: 1, headScale: 1.5 });
    }
    // the impact
    if (t >= T.slam && t < T.logoUp) {
      fx.flare(D[0], D[1], 300 * (1 - prog(t, T.slam, T.slam + 0.5)) + 40, 1 - prog(t, T.slam, T.slam + 0.7));
      fx.shards(D[0], D[1], t, T.slam, { n: 22, seed: 3, speed: 1300, life: 0.5, len: 80, w: 2.4, spreadY: 1 });
    }
    // the dot stays lit, then its light drops onto the notebook (where the desk scene picks it up as the pen)
    if (t >= T.slam) {
      const up = tw(t, T.logoUp, T.land - 0.2, E.inOutCubic);
      const d0 = [D[0], D[1] - up * 120];
      if (t < T.fall) { fx.head(d0[0], d0[1], 5, 0.8); fx.flare(d0[0], d0[1], 110, 0.35); }
      else if (t < T.land + 0.05) {
        const k = E.inOutCubic(prog(t, T.fall, T.land));
        const pen = project(ctx.CM, [ctx.book?.pen0?.() || [0, 0, 0]])[0];
        const path = bezier([D[0], D[1]], [D[0] + 60, D[1] - 160], [pen[0] + 200, pen[1] - 380], pen, 36);
        fx.line(slice(path, Math.max(0, k - 0.3), k), { w: 4.6, alpha: 1, taper: 1, head: 1, headScale: 1.3 });
      }
    }
  }

  return { el, range: ctx.S.intro, update, draw };
}
