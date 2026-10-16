// S4 · 가정 (14.25–18.95): the seeds of imagination fall into a town of homes. Each one splits into
// threads of light that land in a window — and the window lights up, warm with a 연두 screen glow.
// The camera pushes through one window: inside, 서윤 is in a live ClassIn class on her tablet, the
// teacher sketching Saturn's rings on the board, and a little rocket floating in her thought bubble.
// Then we pull far back: every home in the town is lit, and the lights rise.
import { E, tw, prog, clamp, lerp, rng, drift, keyed, camMatrix, M4, place, planeModel, bezier, slice, xf, h } from '../core.js';
import { project } from '../line.js';
import { avatar } from '../avatar.js';
import { createMark } from '../brandmark.js';

const WALL = ['#FFF6E4', '#F6E5C6', '#E3EDD2', '#DCE7F0', '#F8DFCF', '#F3EAD8'];
const ROOF = ['#B89C76', '#A68B67', '#8FA77A', '#86A0B6', '#C98D72', '#AE9C80'];

export default function homesScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene homes');
  ctx.root.appendChild(el);
  const world = h('div', 'hworld');
  el.appendChild(world);
  const ground = h('div', 'obj hground');
  ground.style.width = '9000px'; ground.style.height = '7000px';
  world.appendChild(ground);

  // the town: rows from far to near, the hero home front and centre
  const r = rng(21);
  const houses = [];
  const rows = [-3000, -2500, -2050, -1650, -1280, -930, -600, -280];
  rows.forEach((z, ri) => {
    const step = 330 + ri * 6;
    for (let x = -2600 + (ri % 2) * step * 0.5; x <= 2600; x += step) {
      if (ri >= 6 && Math.abs(x) < 380) continue; // keep the front of the hero home clear
      houses.push({ x: x + (r() - 0.5) * 90, z: z + (r() - 0.5) * 80, s: 0.85 + r() * 0.35, c: Math.floor(r() * WALL.length), wins: r() > 0.45 ? 2 : 1, tall: r() > 0.7 });
    }
  });
  const hero = { x: 0, z: 160, s: 1.35, c: 0, wins: 1, hero: true, tall: false };
  houses.push(hero);
  houses.sort((a, b) => a.z - b.z); // painter's order: far first
  for (const hs of houses) {
    const w = 190 * hs.s, bh = (hs.tall ? 170 : 128) * hs.s, rh = 78 * hs.s;
    hs.w = w; hs.hh = bh + rh; hs.bh = bh;
    const d = h('div', 'obj house');
    d.style.width = `${w}px`; d.style.height = `${hs.hh}px`;
    d.innerHTML = `<i class="roof" style="background:${ROOF[hs.c]};height:${rh + 2}px"></i><i class="body" style="background:${WALL[hs.c]};top:${rh}px;height:${bh}px"></i><i class="door" style="left:${w * 0.62}px;width:${w * 0.18}px;height:${bh * 0.42}px"></i>`;
    hs.winEls = [];
    const n = hs.hero ? 1 : hs.wins;
    for (let i = 0; i < n; i++) {
      const ww = hs.hero ? w * (P ? 0.3 : 0.44) : w * 0.24, wh = hs.hero ? ww * (P ? 16 / 9 : 9 / 16) : ww * 0.8;
      const wx = hs.hero ? w * 0.12 : n === 1 ? w * 0.18 : w * (0.1 + i * 0.3), wy = rh + (hs.hero ? bh * 0.16 : bh * 0.18);
      const win = h('i', 'win', '<b class="lit"></b>');
      win.style.cssText = `left:${wx}px;top:${wy}px;width:${ww}px;height:${wh}px`;
      d.appendChild(win);
      hs.winEls.push({ el: win, lit: win.firstChild, x: wx, y: wy, w: ww, h: wh });
    }
    const sh = h('div', 'obj hshadow');
    sh.style.width = `${w * 1.5}px`; sh.style.height = `${w * 0.7}px`;
    world.append(sh, d);
    hs.el = d; hs.sh = sh;
    hs.dist = Math.hypot(hs.x * 0.8, hs.z - 160);
  }
  // light order: hero first-ish, then outward
  const byDist = [...houses].sort((a, b) => a.dist - b.dist);
  byDist.forEach((hs, i) => {
    hs.thread = i < 26;
    hs.litAt = hs.thread ? lerp(T.landA, T.landB, (i / 26) ** 0.8) + (hs.hero ? 0.25 : 0) : lerp(T.landB, T.fieldB - 0.2, (i - 26) / (byDist.length - 26)) + r() * 0.2;
    hs.seed = r();
  });
  // far field: hundreds of homes as warm points on the ground towards the horizon
  const field = [];
  for (let i = 0; i < 700; i++) {
    const z = -3300 - r() * 3200, x = (r() - 0.5) * (6000 + (-z - 3300) * 1.8);
    field.push({ x, z, at: lerp(T.landB, T.fieldB, clamp((Math.hypot(x * 0.5, z + 3300) / 4200) + r() * 0.15)), s: r() });
  }

  // the interior seen through the hero window
  const inside = h('div', 'interior');
  const kid = avatar({ seed: 3, hair: 1, smile: 0.95, shirt: '#E9A2A2', id: 'kid', w: 360, h: 360, bare: true, hairColor: 0 });
  const mom = avatar({ seed: 8, hair: 2, smile: 0.8, shirt: '#8FB3A0', id: 'mom', w: 420, h: 420, bare: true, hairColor: 1 });
  const tch = avatar({ seed: 11, hair: 3, glasses: true, smile: 0.75, shirt: '#3F6FB5', id: 'htch', w: 160, h: 120 });
  const st = [2, 5, 9].map((s, i) => avatar({ seed: s, smile: 0.7 + i * 0.08, id: `hst${i}`, w: 160, h: 120 }));
  inside.innerHTML = `
    <div class="iwall"></div><div class="ilamp"></div><div class="idesk"></div>
    <div class="imom">${mom}</div>
    <div class="tablet"><div class="tscr">
      <div class="tbar"><span class="tlogo"></span><b>${copy.course}</b><span class="live"><i></i>LIVE</span><span class="tm">00:24:13</span></div>
      <div class="tboard">
        <svg viewBox="0 0 560 340"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path class="bd b1" d="M190 170 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0" stroke="#3A372F" stroke-width="4"/>
          <path class="bd b2" d="M96 196 C 150 238, 300 196, 290 150 C 284 124, 232 128, 200 136" stroke="#6DBB2C" stroke-width="5"/>
          <path class="bd b3" d="M430 96 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0" stroke="#3A372F" stroke-width="4"/>
          <path class="bd b4" d="M330 120 C 360 90, 380 160, 410 130" stroke="#6DBB2C" stroke-width="4"/></g></svg>
        <div class="hw">토성의 고리는 얼음 조각!</div>
      </div>
      <div class="tside"><div class="tile t0">${tch}<em>${copy.teacher} 선생님</em></div>${st.map((a, i) => `<div class="tile t${i + 1}${i === 0 ? ' me' : ''}">${a}<em>${['서윤', '도윤', '하린'][i]}</em>${i === 0 ? '<span class="hand">✋</span>' : ''}</div>`).join('')}</div>
      <div class="ttool"><i></i><i></i><i class="on"></i><i></i><span>손들기</span></div>
    </div></div>
    <div class="ikid">${kid}</div>
    <div class="think"><i></i><i></i><div class="cloud"><svg viewBox="0 0 200 140"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="tr" d="M100 22 C 116 40, 122 70, 116 96 L 84 96 C 78 70, 84 40, 100 22 Z M84 80 L64 108 L84 100 M116 80 L136 108 L116 100" stroke="#3A372F" stroke-width="4"/><path class="tr2" d="M100 104 C 92 116, 108 122, 100 136" stroke="#6DBB2C" stroke-width="4"/><circle class="tr3" cx="100" cy="56" r="9" stroke="#6DBB2C" stroke-width="4"/></g></svg></div></div>
    <div class="iframe"></div>`;
  el.appendChild(inside);
  const inner = h('div', 'iin');
  inner.append(...inside.childNodes);
  inside.appendChild(inner);
  const mini = createMark(118, { pad: 6 });
  mini.draw({ fill: 1, dot: 0.6, lift: 0.4 });
  inside.querySelector('.tlogo').appendChild(mini.el);
  const q = s => inside.querySelector(s);
  const boardPaths = [...inside.querySelectorAll('.bd')], thinkPaths = [...inside.querySelectorAll('.think path, .think circle')];
  const think = q('.think'), hand = q('.hand'), live = q('.live');

  function camAt(t) {
    const k = P ? 0.62 : 1;
    const hw = hero.winEls[0];
    const wy = -(hero.hh - (hw.y + hw.h / 2)); // window centre height
    const wx = hero.x - hero.w / 2 + hw.x + hw.w / 2;
    const dIn = 1700 * (1 - (hw.w * k) / W) + 6; // dolly that brings the window to the full frame
    const c = keyed(t, [
      { t: 14.0, x: 0, y: -1500, z: -900, s: 0.8 * k, rx: -12, ry: 0, dolly: 0 },
      { t: T.townIn + 0.5, x: 60, y: -260, z: -900, s: 0.78 * k, rx: -24, ry: 3, dolly: 0, e: E.outCubic },
      { t: T.pushA, x: wx, y: wy - 20, z: hero.z, s: 1.0 * k, rx: -10, ry: -2, dolly: 0, e: E.inOutSine },
      { t: T.window, x: wx, y: wy, z: hero.z, s: 1.0 * k, rx: 0, ry: 0, dolly: dIn, e: E.inCubic },
      { t: T.pullA, x: wx, y: wy, z: hero.z, s: 1.0 * k, rx: 0, ry: 0, dolly: dIn },
      { t: T.pullA + 0.5, x: wx, y: wy, z: hero.z, s: 1.0 * k, rx: -8, ry: 0, dolly: 0, e: E.outCubic },
      { t: T.fieldB, x: 0, y: -380, z: -2300, s: 0.44 * k, rx: -26, ry: 2, dolly: 0, e: E.inOutCubic },
      { t: 19.7, x: 0, y: -800, z: -2300, s: 0.42 * k, rx: -30, ry: 2, dolly: 0, e: E.inOutSine },
    ]);
    const inside = tw(t, T.pushA, T.window) * (1 - tw(t, T.pullA, T.pullA + 0.3));
    c.ry += 1.5 * drift(t, 2.2, 0.1) * (1 - inside);
    c.d = 1700;
    return c;
  }

  let cur = null;
  function update(t) {
    const cam = camAt(t);
    const CM = camMatrix(cam, W, H);
    el.style.opacity = tw(t, 14.05, 14.45, E.outCubic) * (1 - tw(t, 19.25, 19.7, E.inOutSine));
    place(ground, CM, planeModel(0, 0, -2600, 9000, 7000, { rx: 90 }));
    for (const hs of houses) {
      place(hs.el, CM, planeModel(hs.x, -hs.hh / 2, hs.z, hs.w, hs.hh));
      place(hs.sh, CM, planeModel(hs.x + hs.w * 0.12, 0, hs.z + hs.w * 0.12, hs.w * 1.5, hs.w * 0.7, { rx: 90 }));
      const k = tw(t, hs.litAt, hs.litAt + 0.35, E.outCubic);
      for (const wn of hs.winEls) wn.lit.style.opacity = k.toFixed(3);
    }
    // the interior: mapped onto the hero window's screen box, opaque once it fills the frame
    const wn = hero.winEls[0];
    const m = planeModel(hero.x, -hero.hh / 2, hero.z, hero.w, hero.hh);
    const a = M4.apply(M4.mul(CM, m), wn.x, wn.y, 0), b = M4.apply(M4.mul(CM, m), wn.x + wn.w, wn.y + wn.h, 0);
    // the window box grows with the push; the last stretch eases it exactly onto the frame
    const f = tw(t, T.pushA + 0.25, T.window, E.inOutSine) * (1 - tw(t, T.pullA, T.pullA + 0.4, E.inOutSine));
    const x0 = lerp(a[0], 0, f), y0 = lerp(a[1], 0, f), x1 = lerp(b[0], W, f), y1 = lerp(b[1], H, f);
    const sx = (x1 - x0) / W, sy = (y1 - y0) / H;
    const fill = Math.min(sx, sy);
    const vis = clamp((fill - 0.1) / 0.45);
    inside.style.display = fill > 0.04 && t > T.pushA && t < T.pullA + 0.6 ? 'block' : 'none';
    inside.style.opacity = vis.toFixed(3);
    inside.style.transform = `translate(${x0.toFixed(2)}px, ${y0.toFixed(2)}px) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`;
    const ip = 1 + 0.05 * tw(t, T.window - 0.1, T.pullA, E.inOutSine);
    inner.style.transform = `scale(${ip.toFixed(4)})`;
    // inside: the live class
    const bk = tw(t, T.tablet - 0.1, T.thought + 0.2, E.inOutSine);
    boardPaths.forEach((p, i) => { const k = clamp(bk * 4 - i * 0.8); p.style.strokeDashoffset = (1 - k).toFixed(3); });
    q('.hw').style.opacity = tw(t, T.tablet + 0.3, T.tablet + 0.6);
    const th = tw(t, T.thought, T.thought + 0.35, E.outBack);
    think.style.opacity = clamp(th);
    think.style.transform = `scale(${(0.6 + 0.4 * th).toFixed(3)})`;
    const tk = tw(t, T.thought + 0.15, T.pullA, E.inOutSine);
    thinkPaths.forEach((p, i) => { p.style.strokeDashoffset = (1 - clamp(tk * 2 - i * 0.4)).toFixed(3); });
    hand.style.transform = `translateY(${(Math.sin(t * 9) * 3).toFixed(2)}px) rotate(${(Math.sin(t * 9) * 8).toFixed(1)}deg)`;
    live.firstChild.style.opacity = 0.5 + 0.5 * Math.sin(t * 6);
    q('.ikid').style.transform = `translateY(${(Math.sin(t * 2.2) * 3).toFixed(2)}px)`;
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    const CM = cur.CM;
    const P3 = pts => project(CM, pts);
    const fade = 1 - tw(t, T.pushA + 0.2, T.window - 0.1) * (1 - tw(t, T.pullA + 0.1, T.pullA + 0.5));
    // threads of light landing in the windows
    for (const hs of houses) {
      if (!hs.thread) continue;
      const wn = hs.winEls[0];
      const m = planeModel(hs.x, -hs.hh / 2, hs.z, hs.w, hs.hh);
      const target = xf(m, wn.x + wn.w / 2, wn.y + wn.h / 2, 0);
      const T0 = hs.litAt - 0.75, k = E.inOutCubic(prog(t, T0, hs.litAt));
      if (t < T0 || t > hs.litAt + 0.6) continue;
      const from = [hs.x * 0.35 + (hs.seed - 0.5) * 600, -2600, -900 + hs.seed * 400];
      const path = bezier(from, [from[0], -1400, from[2]], [target[0] + (hs.seed - 0.5) * 300, target[1] - 600, target[2] + 200], [target[0], target[1], target[2]], 30);
      const pr = P3(path);
      fx.line(slice(pr, Math.max(0, k - 0.35), k), { w: 3.6, alpha: fade * (1 - prog(t, hs.litAt, hs.litAt + 0.4)), taper: 1, head: k < 1 ? 1 : 0 });
      if (t > hs.litAt) {
        const q0 = pr[pr.length - 1];
        fx.flare(q0[0], q0[1], 110 * CM[0] + 30, 0.7 * fade * (1 - prog(t, hs.litAt, hs.litAt + 0.6)));
      }
    }
    // every lit window glows (reads from far away)
    const far = tw(t, T.pullA + 0.2, T.fieldB);
    if (far > 0) for (const hs of houses) {
      const k = prog(t, hs.litAt, hs.litAt + 0.4);
      if (k <= 0) continue;
      const m = planeModel(hs.x, -hs.hh / 2, hs.z, hs.w, hs.hh);
      for (const wn of hs.winEls) {
        const q0 = P3([xf(m, wn.x + wn.w / 2, wn.y + wn.h / 2, 0)])[0];
        fx.flare(q0[0], q0[1], 34, 0.9 * k * far, '255,200,90');
        fx.dot(q0[0], q0[1], 3, hs.seed > 0.55 ? '#8DD63F' : '#FFB938', k * far);
      }
    }
    // the far field of homes
    for (const f of field) {
      const k = prog(t, f.at, f.at + 0.4);
      if (k <= 0) continue;
      const q0 = P3([[f.x, -30, f.z]])[0];
      if (q0[0] < -40 || q0[0] > W + 40 || q0[1] < -40 || q0[1] > H + 40) continue;
      const sz = Math.max(0.8, 2200 / (2200 - f.z * 0.6) * 3.2 * CM[0]);
      fx.dot(q0[0], q0[1], sz * 1.8, 'rgba(255,214,120,0.45)', k * fade);
      fx.dot(q0[0], q0[1], sz, f.s > 0.6 ? '#8DD63F' : '#F2B84B', k * fade);
    }
    // the lights rise: threads leaving the town upwards
    if (t > T.liftOff - 0.4) {
      const k = tw(t, T.liftOff - 0.4, 19.7, E.inCubic);
      for (let i = 0; i < 22; i++) {
        const hs = byDist[i];
        const wn = hs.winEls[0];
        const m = planeModel(hs.x, -hs.hh / 2, hs.z, hs.w, hs.hh);
        const s0 = xf(m, wn.x + wn.w / 2, wn.y, 0);
        const path = bezier(s0, [s0[0], s0[1] - 600, s0[2]], [s0[0] * 0.3, -2600, s0[2]], [0, -4200, -600], 26);
        const kk = clamp(k * 1.25 - hs.seed * 0.25);
        fx.line(slice(P3(path), Math.max(0, kk - 0.3), kk), { w: 3, alpha: 1, taper: 1, head: 1 });
      }
    }
  }

  return { el, range: ctx.S.homes, update, draw };
}
