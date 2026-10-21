// S9 (v8.1) · 11.5–14.6 · 집집마다: through the window, straight down onto the town — a clay model on a street grid,
// every house a plain block on its lot, the original's glowing road lines between them (src/js/town.js). The whale's
// light drops onto a street and runs it with right-angle turns to a classmate's home; behind it a bright edge spreads
// out from the route and the blocks become houses — roofs fold up, real walls, lit windows — while the camera swoops
// from straight down to three-quarters. A whip to the street: houses lined up to the vanishing point, the light still
// on the road, the whale overhead; the windows light near → far, and the camera cranes up and away to the map.
// The tracker card counts the class through: 퀴즈 → 함께 그리기 → 트로피 → 리포트.
import { E, tw, prog, clamp, lerp, catmull, h } from '../core.js';
import { createTown, cross, street } from '../town.js';
import { whalePic } from '../whalepic.js';
import { swimDy } from '../whalegeo.js';

const WHALE_M = 20 / 480; // whale-local units → metres (a 20 m whale over 9 m houses)

export default function dawnScene(ctx) {
  const { W, H, T, copy, gl } = ctx;
  const THREE = gl.THREE;
  const el = h('section', 'scene dawn');
  el.style.zIndex = 45; // the card sits over the 3D layer
  ctx.root.appendChild(el);

  // the tracker card (ClassIn class status), top left
  const st = copy.tracker.steps;
  const card = h('div', 'tracker', `<b>${copy.tracker.title}</b><span>${copy.tracker.sub}</span>
    <div class="steps">${st.map((s, i) => `<i class="d${i}"></i>`).join('<em></em>')}</div>
    <div class="labels">${st.map(s => `<span>${s}</span>`).join('')}</div>`);
  el.appendChild(card);
  const dots = [...card.querySelectorAll('.steps i')], bars = [...card.querySelectorAll('.steps em')];

  // the whale: its swimming picture (canvas) on a camera-facing plane inside the town
  const pic = whalePic('solid');
  pic.el.style.display = 'none';
  el.appendChild(pic.el);
  const cv = pic.el.querySelector('canvas'), D = pic.D;
  const wTex = new THREE.CanvasTexture(cv); wTex.colorSpace = THREE.SRGBColorSpace;
  const u = D.k * WHALE_M, ox = D.x0, oy = D.y0 + 60;            // canvas px of the whale's local origin (PAD 60)
  const wGeo = new THREE.PlaneGeometry(cv.width * u, cv.height * u);
  wGeo.translate(-(ox - cv.width / 2) * u, -(cv.height / 2 - oy) * u, 0);
  const whale = new THREE.Mesh(wGeo, new THREE.MeshBasicMaterial({ map: wTex, transparent: true, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, color: 0xf2eee8 }));
  whale.renderOrder = 5;

  let town = null;
  const ready = createTown(THREE, { env: gl.env, assets: 'assets/gen/', T, W, H }).then(tw_ => { town = tw_; town.scene.add(whale); });

  // the whale's path: over the light in the three-quarter shot; down the street and up into the sky after the whip
  const flyB = catmull([[52, 26], [8, 18], [-60, 21], [-130, 34], [-170, 70], [-160, 150]], 8);
  const atB = k => { const f = clamp(k) * (flyB.length - 1), i = Math.min(flyB.length - 2, Math.floor(f)), q = f - i; return [lerp(flyB[i][0], flyB[i + 1][0], q), lerp(flyB[i][1], flyB[i + 1][1], q)]; };
  function whaleAt(t) {
    if (t < T.whipA + 0.1) {
      const s = Math.min(town.L, town.headS(t) + 10), [x, z] = town.at(s);
      return { p: [x, 24 + 3 * Math.sin(t * 2.4), z], a: clamp((74 - town.pitch(t)) / 12) * (1 - tw(t, T.whipA, T.whipA + 0.1)), A: true };
    }
    const k = tw(t, T.whipB - 0.12, T.mapIn + 0.2, E.inOutSine), [x, y] = atB(k);
    return { p: [x, y, street(0) + lerp(6, -4, k)], a: tw(t, T.whipB - 0.08, T.whipB + 0.06) * (1 - tw(t, T.mapIn - 0.15, T.mapIn + 0.15)), A: false };
  }
  const wings = [catmull([[-30, -58], [-80, -142], [10, -182], [50, -68]], 8), catmull([[-34, -92], [-10, -132]], 4), catmull([[-12, -78], [18, -122]], 4)];
  const flap = t => { const k = Math.sin(t * 10); return ([x, y]) => [x + (x - 10) * 0.08 * k, -62 + (y + 62) * (1 + 0.32 * k)]; };
  // screen pose of the whale: centre, px per local unit, heading, mirror (it faces left; mirrored when moving right)
  const camRight = new THREE.Vector3();
  function screenPose(t) {
    const w = whaleAt(t), q = town.toScreen(...w.p), n = whaleAt(t + 0.03), q2 = town.toScreen(...n.p);
    camRight.setFromMatrixColumn(town.camera.matrixWorld, 0);
    const r = town.toScreen(w.p[0] + camRight.x, w.p[1] + camRight.y, w.p[2] + camRight.z);
    const ppm = Math.hypot(r[0] - q[0], r[1] - q[1]);
    const dx = q2[0] - q[0], dy = q2[1] - q[1], mir = dx > 0 ? -1 : 1;
    let ang = Math.atan2(dy, dx) - (mir > 0 ? Math.PI : 0);
    ang = Math.atan2(Math.sin(ang), Math.cos(ang));
    return { ...w, q, s: ppm * WHALE_M, mir, ang: clamp(ang, -0.45, 0.45) };
  }
  const tilt = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);

  let cur = null;
  function update(t) {
    if (!town) return;
    town.update(t);
    const sp = screenPose(t);
    whale.visible = sp.a > 0.01 && sp.q[2] < 1;
    if (whale.visible) {
      whale.position.set(...sp.p);
      whale.quaternion.copy(town.camera.quaternion).multiply(tilt.setFromAxisAngle(zAxis, -sp.ang));
      whale.scale.set(sp.mir, 1, 1);
      pic.draw({ wave: swimDy(t, 1.3), alpha: sp.a });
      wTex.needsUpdate = true;
    }
    // tracker: the class's steps tick through as the light reaches home
    const ck = tw(t, T.cardA, T.cardA + 0.3, E.outCubic) * (1 - tw(t, T.rise - 0.1, T.rise + 0.2));
    card.style.opacity = ck.toFixed(3);
    card.style.transform = `translate(${((1 - ck) * -30).toFixed(1)}px, 0)`;
    const stepT = [T.cardA + 0.1, T.cardA + 0.35, T.cardA + 0.6, T.cardA + 0.9];
    dots.forEach((d, i) => d.classList.toggle('on', t > stepT[i]));
    bars.forEach((b, i) => b.style.setProperty('--k', tw(t, stepT[i], stepT[i + 1]).toFixed(3)));
    cur = sp;
  }

  function draw(fx, t) {
    if (!town || !cur) return;
    // through the window into the town; out to the map (the nation scene is underneath)
    const a = tw(t, T.window - 0.05, T.window + 0.22) * (1 - tw(t, T.mapIn - 0.3, T.mapIn + 0.12, E.inOutSine));
    if (a <= 0) return;
    const R = gl.renderer, ex = R.toneMappingExposure;
    R.toneMappingExposure = town.exposure;
    gl.canvas.style.opacity = a.toFixed(3);
    gl.draw(town.scene, town.camera);
    R.toneMappingExposure = ex;
    // the light lands: a burst where it drops onto the street
    const la = prog(t, town.RT.a - 0.03, town.RT.a + 0.4);
    if (la > 0 && la < 1) { const [x, z] = town.at(0), q = town.toScreen(x, 0, z); fx.flare(q[0], q[1], 420 * (0.4 + la), 0.7 * (1 - la), '190,255,140'); }
    // the classmate's home: it lights up green as the light arrives
    const ha = prog(t, town.RT.b - 0.02, town.RT.b + 0.6);
    if (ha > 0 && ha < 1) { const q = town.toScreen(town.dest[0], 6, town.dest[1] - 9); fx.flare(q[0], q[1], 260 * (0.5 + ha), 0.6 * Math.sin(ha * Math.PI), '170,250,110'); }
    // the whale's wings of light and the light streaming off its flukes (2D, on its screen pose)
    const sp = cur;
    if (sp.a > 0.01 && sp.q[2] < 1) {
      const wave = swimDy(t, 1.3), fl = flap(t), c = Math.cos(sp.ang), s = Math.sin(sp.ang);
      const toS = ([x, y]) => { const lx = x * sp.s * sp.mir, ly = (y + wave(x)) * sp.s; return [sp.q[0] + lx * c - ly * s, sp.q[1] + lx * s + ly * c]; };
      const lw = clamp(sp.s * 9, 1.6, 4.2);
      for (const wg of wings) fx.line(wg.map(fl).map(toS), { w: lw, alpha: sp.a, taper: 0, head: 0 });
      const trail = [];
      for (let i = 22; i >= 0; i--) {
        const w = whaleAt(t - i * 0.014);
        if (w.A !== sp.A) continue;
        const q = town.toScreen(...w.p);
        if (q[2] < 1) trail.push([q[0] + (236 * sp.s * sp.mir) * c, q[1] + (236 * sp.s * sp.mir) * s]);
      }
      if (trail.length > 1) fx.line(trail, { w: lw * 1.3, alpha: sp.a, taper: 1, head: 0.3 });
      const tail = toS([236, 4]);
      fx.flare(tail[0], tail[1], 60 + 900 * sp.s, 0.28 * sp.a);
    }
    // through the window: a flash of dawn light
    const fw = prog(t, T.window - 0.05, T.window + 0.35);
    if (fw > 0 && fw < 1) fx.flare(W * 0.55, H * 0.4, 900 * (0.5 + fw), 0.55 * (1 - fw), '255,236,200');
  }

  return { el, range: ctx.S.dawn, update, draw, ready, town: () => town };
}
