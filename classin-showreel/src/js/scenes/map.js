// S4 · 전국 (7.20–10.80): the light drops onto Seoul HQ on a night dot-map of Korea, the camera swoops
// to a 3/4 view and the light itself draws the deployment routes out to every branch.
import { E, tw, prog, clamp, lerp, keyed, drift, camMatrix, bezier, slice, h } from '../core.js';
import { project } from '../line.js';
import { MAP_W, MAP_H, DOTS, NODES } from '../../assets/korea-map.js';

// shared with the sound design (cues.js): when each branch's route leaves HQ and arrives
export function routeTimes(T) {
  const hq = NODES[0];
  const maxD = Math.max(...NODES.map(n => Math.hypot(n.x - hq.x, n.y - hq.y)));
  return NODES.slice(1).map((n, k) => {
    const d = Math.hypot(n.x - hq.x, n.y - hq.y);
    const j = Math.sin(k * 12.9898) * 0.5 + 0.5;
    const t0 = T.routesA + (d / maxD) * 1.55 + j * 0.18 + (n.tier === 3 ? 0.12 : 0);
    return { n, i: k + 1, d, j, t0, t1: t0 + 0.42 + (d / maxD) * 0.45 };
  });
}

export default function mapScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const canvas = h('canvas', 'mapc');
  canvas.width = W; canvas.height = H;
  el.appendChild(canvas);
  const g = canvas.getContext('2d');

  // world: map centred on the origin
  const wx = x => x - MAP_W / 2, wy = y => y - MAP_H / 2;
  const hq = NODES[0];
  const HQ = [wx(hq.x), wy(hq.y), 0];
  const busanIdx = NODES.findIndex(n => n.label === '부산 센텀');
  const BUSAN = [wx(NODES[busanIdx].x), wy(NODES[busanIdx].y), 0];

  // each branch: when its route leaves HQ, how long it flies, and its arc
  const routes = routeTimes(T).map(({ n, i, t0, t1, d, j }) => {
    const end = [wx(n.x), wy(n.y), 0];
    const mid = [(HQ[0] + end[0]) / 2, (HQ[1] + end[1]) / 2];
    const nx = -(end[1] - HQ[1]) / (d || 1), ny = (end[0] - HQ[0]) / (d || 1);
    const bend = (j - 0.5) * 0.25 * d;
    const lift = 10 + d * 0.11;
    const pts = bezier(HQ, [lerp(HQ[0], mid[0], 0.6) + nx * bend, lerp(HQ[1], mid[1], 0.6) + ny * bend, lift], [lerp(end[0], mid[0], 0.5) + nx * bend * 0.5, lerp(end[1], mid[1], 0.5) + ny * bend * 0.5, lift * 0.75], end, 36);
    return { n, i, t0, t1, pts, end, hero: i === busanIdx };
  });

  // labels for the named branches (billboards in screen space)
  const labels = NODES.map((n, i) => {
    if (n.tier > 1) return null;
    const lb = h('div', `mlabel${i === 0 ? ' hq' : ''}`, i === 0 ? `<i></i>${n.label}` : `<i></i>${n.label}<span>동기화 ✓</span>`);
    el.appendChild(lb);
    return lb;
  });

  const tracker = h('div', 'tracker', `<div class="t1">전 지점 동기화<span class="live"><i></i>실시간</span></div>
    <div class="t2">고2 수학 정규 커리큘럼 v3 · 2026.12.01 적용</div>
    <div class="bar"><b></b><div class="dots"><i></i><i></i><i></i><i></i></div></div>
    <div class="steps"><span>기준 설정</span><span>배포</span><span>지점 동기화</span><span>수업 개설</span></div>
    <div class="cnt">동기화된 지점<b>0</b><em>/ 128</em></div>`);
  el.appendChild(tracker);
  if (P) { tracker.style.left = '50%'; tracker.style.marginLeft = '-235px'; tracker.style.top = '120px'; }
  const tBar = tracker.querySelector('.bar b'), tDots = [...tracker.querySelectorAll('.dots i')], tSteps = [...tracker.querySelectorAll('.steps span')], tCnt = tracker.querySelector('.cnt b');

  function camAt(t) {
    const keys = P ? [
      { t: 6.9, x: HQ[0], y: HQ[1], s: 3.6, rx: 0, rz: 0 },
      { t: T.drop, x: HQ[0], y: HQ[1], s: 2.7, rx: 0, rz: 0, e: E.outCubic },
      { t: T.swoopB, x: 30, y: 20, s: 1.28, rx: 46, rz: -8, e: E.inOutQuint },
      { t: T.dive - 0.05, x: 60, y: 80, s: 1.36, rx: 48, rz: -4, e: E.inOutSine },
      { t: 10.95, x: BUSAN[0], y: BUSAN[1], s: 7, rx: 38, rz: -2, e: E.inExpo },
    ] : [
      { t: 6.9, x: HQ[0], y: HQ[1], s: 3.4, rx: 0, rz: 0 },
      { t: T.drop, x: HQ[0], y: HQ[1], s: 2.6, rx: 0, rz: 0, e: E.outCubic },
      { t: T.swoopB, x: 10, y: 60, s: 0.96, rx: 47, rz: -10, e: E.inOutQuint },
      { t: T.dive - 0.05, x: 50, y: 110, s: 1.04, rx: 49, rz: -5, e: E.inOutSine },
      { t: 10.95, x: BUSAN[0], y: BUSAN[1], s: 7, rx: 40, rz: -2, e: E.inExpo },
    ];
    const c = keyed(t, keys);
    c.ry = 1.5 * drift(t, 2.2, 0.1);
    c.sx = P ? 0 : 170 * tw(t, 7.4, T.swoopB); // leave room for the tracker card
    c.sy = P ? 120 * tw(t, 7.4, T.swoopB) : -10 * tw(t, 7.4, T.swoopB);
    c.d = 1700;
    return c;
  }

  let CM = null;
  function update(t) {
    CM = camMatrix(camAt(t), W, H);
    const a = tw(t, 6.95, T.drop + 0.1, E.outQuad) * (1 - tw(t, 10.42, 10.8, E.inQuad));
    el.style.opacity = a;
    const blur = (1 - tw(t, 7.0, 7.45, E.outCubic)) * 10 + tw(t, 10.45, 10.95, E.inQuad) * 16;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';

    // dots — brighter near branches that have already synced
    g.clearRect(0, 0, W, H);
    const lit = routes.filter(r => t > r.t1).map(r => [r.end[0], r.end[1], clamp((t - r.t1) / 0.5)]);
    lit.push([HQ[0], HQ[1], clamp((t - T.drop) / 0.4) * 1.6]);
    for (let i = 0; i < DOTS.length; i += 2) {
      const x = wx(DOTS[i]), y = wy(DOTS[i + 1]);
      const w = CM[3] * x + CM[7] * y + CM[15];
      if (w <= 0.05) continue;
      const sx = (CM[0] * x + CM[4] * y + CM[12]) / w, sy = (CM[1] * x + CM[5] * y + CM[13]) / w;
      if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) continue;
      let glow = 0;
      for (const [lx, ly, k] of lit) { const dd = (x - lx) ** 2 + (y - ly) ** 2; if (dd < 9000) glow = Math.max(glow, k * (1 - dd / 9000)); }
      const size = Math.max(1.1, (CM[0] ** 2 + CM[1] ** 2) ** 0.5 / w * 3.9);
      g.fillStyle = glow > 0.02 ? `rgba(${lerp(96, 120, glow) | 0},${lerp(140, 255, glow) | 0},${lerp(118, 140, glow) | 0},${lerp(0.58, 1, glow)})` : 'rgba(116,168,140,0.58)';
      g.fillRect(sx - size / 2, sy - size / 2, size, size);
    }

    // labels
    labels.forEach((lb, i) => {
      if (!lb) return;
      const n = NODES[i];
      const r = i ? routes[i - 1] : null;
      const on = i === 0 ? tw(t, T.drop + 0.1, T.drop + 0.35, E.outBack) : tw(t, r.t1 + 0.05, r.t1 + 0.28, E.outBack);
      const [sx, sy] = project(CM, [[wx(n.x), wy(n.y), i === 0 ? 120 : 80]])[0];
      lb.style.opacity = clamp(on);
      lb.style.transform = `translate(${(sx - lb.offsetWidth / 2).toFixed(1)}px, ${(sy - lb.offsetHeight - 10).toFixed(1)}px) scale(${0.6 + 0.4 * clamp(on)})`;
    });

    // tracker
    const k = prog(t, T.routesA, T.routesB);
    const synced = routes.filter(r => t > r.t1).length;
    tCnt.textContent = synced >= routes.length ? '128' : String(Math.round((synced / routes.length) * 128));
    tBar.style.width = `${(lerp(33.3, 66.6, E.inOutQuad(k)) + (t > T.routesB ? tw(t, T.routesB, T.routesB + 0.3) * 33.4 : 0)).toFixed(2)}%`;
    tDots.forEach((d, i) => { d.className = (i < 2 || (i === 2 && t > T.routesB - 0.05) || (i === 3 && t > T.routesB + 0.3)) ? 'on' : ''; });
    tSteps.forEach((s, i) => { s.className = (i < 2 || (i === 2 && t > T.routesA) || (i === 3 && t > T.routesB + 0.3)) ? 'on' : ''; });
    const tin = tw(t, T.drop + 0.25, T.drop + 0.65, E.outCubic) * (1 - tw(t, T.dive, T.dive + 0.3, E.inQuad));
    tracker.style.opacity = tin;
    tracker.style.transform = `translateY(${(1 - tin) * -24}px)`;
  }

  function draw(fx, t) {
    if (!CM) return;
    const a = el.style.opacity;
    // the drop: the light falls onto Seoul
    const hqS = project(CM, [HQ])[0];
    if (t < T.drop + 0.05) {
      const k = E.inQuad(prog(t, 6.98, T.drop));
      fx.line([[hqS[0] + (1 - k) * 40, hqS[1] - 900 * (1 - k) - 220], [hqS[0], hqS[1] - (1 - k) * 900]], { w: 6, alpha: k, taper: 1, head: 1, headScale: 1.4 });
    }
    // HQ ripple + core
    for (let r = 0; r < 3; r++) {
      const kk = prog(t, T.drop + r * 0.5, T.drop + r * 0.5 + 1.1);
      if (kk > 0 && kk < 1) fx.line(project(CM, ring(HQ, 12 + kk * 90)), { w: 2.4 * (1 - kk), alpha: (1 - kk) * a, taper: 0, head: 0 });
    }
    if (t >= T.drop) fx.head(hqS[0], hqS[1], 5, a);
    fx.flare(hqS[0], hqS[1], 150, 0.35 * (1 - prog(t, T.drop, T.drop + 0.6)) * (t >= T.drop ? 1 : 0));

    // routes — the light draws itself out to each branch, then leaves a cooled trail
    for (const r of routes) {
      if (t < r.t0) continue;
      const k = E.inOutCubic(prog(t, r.t0, r.t1));
      const sc = project(CM, slice(r.pts, Math.max(0, k - 0.55), k));
      const done = t > r.t1;
      const wv = r.hero ? 4.5 : r.n.tier === 3 ? 1.6 : 2.6;
      const ra = r.hero ? 1 : r.n.tier === 3 ? 0.6 : 0.85;
      if (!done) fx.line(sc, { w: wv, alpha: a * ra, taper: 1, head: 1, headScale: r.hero ? 1.3 : 0.7 });
      else fx.line(project(CM, r.pts), { w: wv * 0.55, alpha: a * ra * lerp(0.9, r.hero ? 0.6 : 0.22, clamp((t - r.t1) / 0.6)), taper: 0.7, head: 0 });
      if (done) {
        const p = prog(t, r.t1, r.t1 + 0.35);
        const top = (r.n.tier <= 1 ? 70 : r.n.tier === 2 ? 40 : 24) * E.outCubic(p);
        fx.line(project(CM, [r.end, [r.end[0], r.end[1], top]]), { w: r.hero ? 3.4 : 2.2, alpha: a * 0.9, taper: 0.9, head: 0.4 });
        const kk = prog(t, r.t1, r.t1 + 0.8);
        if (kk < 1) fx.line(project(CM, ring(r.end, 6 + kk * 46)), { w: 1.8 * (1 - kk), alpha: (1 - kk) * a, taper: 0, head: 0 });
        const ps = project(CM, [r.end])[0];
        fx.head(ps[0], ps[1], r.n.tier <= 1 ? 3.2 : 2.2, a * 0.9);
      }
    }
    // the dive: the Busan pillar flares and the light shoots at the camera
    if (t > T.dive) {
      const ps = project(CM, [BUSAN])[0];
      fx.flare(ps[0], ps[1], 90 + 260 * prog(t, T.dive, 10.8), 0.55 * prog(t, T.dive, 10.6) * (1 - prog(t, 10.6, 10.85)));
    }
  }

  return { el, range: ctx.S.map, update, draw };
}

function ring(c, r, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 0]); }
  return pts;
}
