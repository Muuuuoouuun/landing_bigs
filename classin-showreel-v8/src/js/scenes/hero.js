// S13 (v8) · 히어로 (19.55–22.2) + 엔드카드 (22.2–24.0): the pen (real 3D) spins up out of the frame and stands
// where the logo's i will be — its nib is the i's slanted foot, its light the i-dot. On the hit the light traces
// the wordmark C → n and the ink floods out after it: the code-built mark settles onto the paper with its satin
// bevel, grain and shadow; a slow sheen crosses it. End card (v8.3, no logo, no light): the line set in blocks — grey
// blocks rise into a precise grid, roll over one by one on the beat to show their coloured faces with the words, the
// colour drains away and the ink stays; 즐거운 alone in ClassIn green, underlined by a solid bar drawn left to right.
import { E, tw, prog, clamp, lerp, shake, h } from '../core.js';
import { createMark } from '../brandmark.js';
import { makePen } from '../gl.js';

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
  // ---- end card: the line in blocks (v8.3) ----
  const LINES = P ? [['즐거운', '수업'], ['하나가,'], ['전국', '모든'], ['집으로.']] : [['즐거운', '수업', '하나가,'], ['전국', '모든', '집으로.']];
  const FACES = ['#BCD9F2', '#F6C9A0', '#F3C4D2', '#F5DE9A', '#BDEBD3', '#EEE8DD'];
  const end = h('div', 'endblk');
  const blocks = [];
  LINES.forEach(words => {
    const row = h('div', 'erow');
    words.forEach(w => {
      const i = blocks.length;
      const b = h('div', 'blk', `<i class="fr"></i><i class="bt" style="background:${FACES[i % FACES.length]}"></i><span>${w}</span>`);
      row.appendChild(b);
      blocks.push({ el: b, fr: b.querySelector('.fr'), bt: b.querySelector('.bt'), sp: b.querySelector('span'), w });
    });
    end.appendChild(row);
  });
  const ul = h('i', 'eul');
  blocks[0].sp.appendChild(ul);
  const e3 = h('div', 'e3', copy.proof);
  end.appendChild(e3);
  el.appendChild(end);

  // the pen that becomes the i (three.js): stands from the i's foot to the i-dot
  const { gl } = ctx, THREE = gl.THREE;
  const pscene = new THREE.Scene();
  pscene.environment = gl.env;
  const pcam = new THREE.PerspectiveCamera(14, W / H, 0.1, 100);
  pcam.position.set(0, 0, 10); pcam.lookAt(0, 0, 0);
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 4, 6); pscene.add(key);
  const rimL = new THREE.DirectionalLight(0xc8f7a8, 2.2); rimL.position.set(4, 1, -2); pscene.add(rimL);
  const pen = makePen();
  pscene.add(pen);
  const U = (2 * 10 * Math.tan(THREE.MathUtils.degToRad(7))) / H; // world units per px on the z = 0 plane
  const kk = R.w / 2714;
  const foot = [R.lx + ((2105 + 2222.5) / 2 - 2) * kk, R.ly + (700 - 4) * kk]; // the i's slanted foot
  const toW = ([x, y]) => [(x - W / 2) * U, (H / 2 - y) * U];

  function layout() {}

  function update(t) {
    el.style.opacity = clamp(prog(t, T.hero - 0.1, T.hero)) * (1 - tw(t, T.fadeA, 24.0, E.inOutSine));
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
    // end card: rise (stagger), roll over on the beat (no bounce), colour drains, the emphasis is drawn
    const ED = T.dot;                                              // the end card starts as the mark has gone
    end.style.opacity = (tw(t, ED - 0.05, ED + 0.05) * (1 - tw(t, T.fadeA, 24.0, E.inOutSine))).toFixed(3);
    blocks.forEach((b, i) => {
      const rise = tw(t, ED + i * 0.04, ED + i * 0.04 + 0.32, E.outQuart);
      const roll = tw(t, ED + 0.34 + i * 0.09, ED + 0.34 + i * 0.09 + 0.3, E.inOutQuart);
      const drain = tw(t, ED + 0.95, ED + 1.2, E.inOutSine);
      b.el.style.transform = `translateY(${((1 - rise) * 70).toFixed(1)}px) rotateX(${(90 * roll).toFixed(2)}deg)`;
      b.el.style.opacity = rise.toFixed(3);
      b.fr.style.opacity = (1 - drain).toFixed(3);
      b.bt.style.opacity = (1 - drain).toFixed(3);
      b.sp.style.color = i === 0 ? `rgb(${Math.round(lerp(29, 16, drain))},${Math.round(lerp(31, 180, drain))},${Math.round(lerp(28, 21, drain))})` : '#1D1F1C';
    });
    ul.style.transform = `scaleX(${tw(t, ED + 1.0, ED + 1.3, E.inOutCubic).toFixed(4)})`;
    e3.style.opacity = tw(t, ED + 1.15, ED + 1.45).toFixed(3);
    e3.style.transform = `translateY(${((1 - tw(t, ED + 1.15, ED + 1.45, E.outQuart)) * 14).toFixed(1)}px)`;
  }

  function draw(fx, t) {
    if (t >= T.penUp && t < T.hero) {
      // the pen (v8.1): rises out of the frame and slows into place while its spin dies away (ending on a whole turn);
      // it tips upright on a damped spring — about 3° past, and back — so its nib lands on the i's foot on the hit
      const DU = T.hero - 0.02 - T.penUp, u = clamp((t - T.penUp) / DU), tt = u * DU;
      const k = 1 - (1 - u) ** 3;
      const top = [R.dot[0], R.dot[1]];
      const len = (foot[1] - top[1]) * U; // world length from the i's foot to the dot
      const sy = lerp(0.9, len / 1.416, E.inOutCubic(u)), sx = lerp(0.9, 1.15, u);
      pen.scale.set(sx, sy, sx);
      const spin = 5 * 2 * Math.PI * (1 - (1 - Math.exp(-4 * u)) / (1 - Math.exp(-4)));
      const w = 2 * Math.PI * 2.2, z = 0.7, wd = w * Math.sqrt(1 - z * z);
      const tilt = -1.1 * Math.exp(-z * w * tt) * (Math.cos(wd * tt) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tt));
      pen.rotation.set(0, spin, tilt);
      const fw = toW(foot), from = [fw[0] + 1.2, fw[1] - 1.6];
      pen.position.set(lerp(from[0], fw[0], k), lerp(from[1], fw[1], k), 0);
      pen.updateMatrixWorld(true);
      // keep the nib on the path: offset so the tip sits at the interpolated foot point
      const tip = new THREE.Vector3(0, pen.userData.tipY, 0).applyMatrix4(pen.matrixWorld);
      pen.position.x += lerp(from[0], fw[0], k) - tip.x; pen.position.y += lerp(from[1], fw[1], k) - tip.y;
      gl.draw(pscene, pcam);
      // the light gathering at the pen's top — where the i-dot will be
      pen.updateMatrixWorld(true);
      const cap = new THREE.Vector3(0, 0.66, 0).applyMatrix4(pen.matrixWorld).project(pcam);
      fx.head((cap.x + 1) / 2 * W, (1 - cap.y) / 2 * H, 3 + 2 * k, tw(t, T.hero - 0.25, T.hero - 0.02));
    }
    if (t < T.hero) return;
    const D = R.dot;
    // impact at the dot
    fx.flare(D[0], D[1], 240 * (1 - prog(t, T.hero, T.hero + 0.5)) + 40, 1 - prog(t, T.hero, T.hero + 0.6));
    fx.shards(D[0], D[1], t, T.hero, { n: 14, seed: 5, speed: 1000, life: 0.45, len: 60, w: 2, spreadY: 1 });
    fx.shape(mark.geo.iDot.map(p => [R.lx + p[0], R.ly + p[1]]), 1 - tw(t, T.hero + 0.1, T.hero + 0.5, E.inOutQuad), 1);
  }

  return { el, range: ctx.S.hero, layout, update, draw };
}
