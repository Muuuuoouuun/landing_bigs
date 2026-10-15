// S1 · SLAM (0.00–1.60): the light rushes in from deep space, slams into the i-dot and runs
// Class → In under the wordmark, revealing the official logo.
import { E, tw, prog, clamp, lerp, shake, bezier, slice, measure, pointAt, camMatrix, h } from '../core.js';
import { project } from '../line.js';
import { createLogo, logoArrow, logoRest } from '../logo.js';

export default function slam(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const LW = P ? 820 : 900;
  const logo = createLogo(LW);
  el.appendChild(logo.el);
  const g = logo.geo;
  const { lx, ly } = logoRest(W, H, P);

  // screen-space anchors
  const D = [lx + g.iDotC[0], ly + g.iDotC[1]];
  const base = ly + g.h + (P ? 30 : 34);
  const S = [lx + g.left + 6, base];
  // the arrow: under "Class", then hooks up the slant into the i-dot (Class → In)
  const arrow = logoArrow(lx, ly, g, P);
  // the approach: from deep space (z far away, low-left) into the start of the arrow
  const approach = bezier([W * 0.86, H * 0.08, -3400], [W * 0.05, H * 1.05, -1500], [S[0] - 700, S[1] + 24, -200], [S[0], S[1], 0], 70);
  const path = [...approach, ...arrow.slice(1)];
  const L = measure(path), total = L[L.length - 1];
  const uS = L[approach.length - 1] / total; // where the arrow starts
  const cam = camMatrix({ x: W / 2, y: H / 2, d: 1500 }, W, H);
  const strandOffsets = [[0, 0], [0.9, 2.1], [2.2, 4.4]];

  function update(t) {
    // reveal C → n behind the running light
    const rv = tw(t, T.revealA, T.revealB, E.inOutCubic);
    logo.reveal(t < T.revealA ? -60 : lerp(-60, g.w + 80, rv));
    // after the rest, the logo rises away (the light copy peels off in the console scene)
    const up = tw(t, T.logoUp, T.logoUp + 0.55, E.inOutCubic);
    logo.el.style.transform = `translate(${lx}px, ${Math.round(ly - up * (P ? 220 : 170))}px) scale(${1 - up * 0.06})`;
    logo.el.style.opacity = 1 - tw(t, T.logoUp + 0.1, T.logoUp + 0.6, E.inQuad);
    logo.el.style.filter = up > 0.01 ? `blur(${(up * 10).toFixed(2)}px)` : '';
    const sh = shake(t, T.slam, P ? 18 : 16, 0.36);
    ctx.shake[0] += sh[0]; ctx.shake[1] += sh[1];
    ctx.flash += 0.32 * (1 - prog(t, T.slam, T.slam + 0.28)) * (t >= T.slam ? 1 : 0);
  }

  function draw(fx, t) {
    if (t < T.slam) {
      // head accelerates in from deep space; 3 strands braid into one as it arrives
      const k = E.inQuad(prog(t, -0.02, T.slam));
      const head = lerp(0.3, 1, k), tail = Math.max(0, head - 0.5);
      for (const [i, [ph, fr]] of strandOffsets.entries()) {
        const seg = slice(path, tail, head, L).map((p, j, arr) => {
          const u = j / arr.length, amp = i ? 44 * (1 - k * 0.8) * (0.3 + u * 0.7) : 0;
          return [p[0] + Math.sin(u * 9 + ph + t * 30 * fr) * amp, p[1] + Math.cos(u * 7 + ph + t * 24) * amp, p[2]];
        });
        fx.line(project(cam, seg), { w: i ? 3 : 8, alpha: i ? 0.85 : 1, taper: 1, head: i ? 0.3 : 1, headScale: 2 });
      }
      // light dust shed along the trail
      for (let d = 0; d < 26; d++) {
        const u = tail + ((d * 0.618) % 1) * (head - tail);
        const p = project(cam, [pointAt(path, u, L)])[0];
        const off = Math.sin(d * 7.3) * 30;
        fx.head(p[0] + off, p[1] + Math.cos(d * 3.1) * 30, 1.1, 0.5 * (1 - Math.abs(u - head) * 1.6));
      }
      return;
    }
    // impact
    fx.flare(D[0], D[1], 330 * (1 - prog(t, T.slam, T.slam + 0.5)) + 40, 1 - prog(t, T.slam, T.slam + 0.6));
    fx.shards(D[0], D[1], t, T.slam, { n: 22, seed: 11, speed: 1500, life: 0.55, len: 90, w: 2.4 });
    // the glowing i-dot cools off as the official dot is revealed underneath
    const dotA = 1 - tw(t, T.revealB - 0.1, T.revealB + 0.35, E.inOutQuad);
    fx.shape(g.iDot.map(p => [lx + p[0], ly + p[1]]), dotA, 1);
    // the arrow stays lit, a hot pulse runs Class → In, then the light dies down
    const tailIn = tw(t, T.slam, T.revealA + 0.15, E.outCubic);
    const a = 1 - tw(t, T.revealB - 0.05, T.revealB + 0.42, E.inOutQuad);
    const arrowSeg = slice(path, lerp(uS - 0.12, uS, tailIn), 1, L);
    fx.line(project(cam, arrowSeg), { w: 5.5, alpha: a * 0.85, taper: 0.55, head: 0 });
    const pulse = tw(t, T.revealA, T.revealB, E.inOutCubic);
    if (t < T.revealB + 0.05) {
      const hu = lerp(uS, 1, pulse);
      fx.line(project(cam, slice(path, Math.max(uS, hu - 0.16), hu, L)), { w: 7, alpha: 1, taper: 1, head: 1, headScale: 1.3 });
    }
    // the dot keeps a faint ember while resting
    const ember = clamp(tw(t, T.revealB, T.revealB + 0.2) * (1 - tw(t, 0.8, 1.02)));
    if (ember > 0) fx.flare(D[0], D[1], 120, 0.25 * ember);
  }

  return { el, range: ctx.S.slam, update, draw, logoPos: { lx, ly, g, D } };
}
