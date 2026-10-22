// S1–S3 (v8.2) · 0.00–3.72 · real 3D (three.js): the ClassIn app icon — the seagull, a glossy tile — rushes out of
// the dark on a streak of light and stops dead on the beat in front of the phone; it glints, then flies into its
// slot and the notification opens around it: 오늘은 상상 퀴즈 수업! The pen's light fills [입장하기], a tap, and
// the phone stretches and turns into a tablet with the live class on it. As it lands the pen flips in (one turn,
// slowing), touches down and writes the question — its tip on the handwriting path, its body hanging on a damped
// spring (v8.1) — then lifts away as the camera dives into the screen until it is the frame (the room scene's tablet
// shows the very same canvas, so the hand-over is invisible).
import { E, tw, prog, clamp, lerp } from '../core.js';
import { bodyGeo, roundRectGeo, metal, screenMat, glareTex, makePen } from '../gl.js';
import { makeQuizPen } from '../classui.js';

const PH = { w: 0.76, h: 1.58, d: 0.085, r: 0.115 };
const TB = { w: 1.52, h: 2.64, d: 0.07, r: 0.12 }; // the tablet, in the phone's portrait frame (it ends turned 90°)
const SW = 2.56, SH = 1.44; // the tablet's screen: exactly 16:9

export default function devicesScene(ctx) {
  const { T, copy, gl, W, H } = ctx;
  const THREE = gl.THREE;
  const scene = new THREE.Scene();
  scene.environment = gl.env;
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.02, 100);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8f7a8, 3.0); rim.position.set(6, 3, -3); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffffff, 1.4); rim2.position.set(-6, -1, -2); scene.add(rim2);

  // ---------- lock screen (canvas texture) ----------
  const lc = document.createElement('canvas'); lc.width = 720; lc.height = 1500;
  const lk = lc.getContext('2d');
  const lockTex = new THREE.CanvasTexture(lc); lockTex.colorSpace = THREE.SRGBColorSpace; lockTex.anisotropy = 8;
  const L = copy.lock;
  // the official ClassIn app icon (the seagull), drawn as iOS does: a continuous-corner tile; glint 0..1 sweeps a sheen
  const appIcon = new Image();
  appIcon.src = 'assets/classin_app_icon.png';
  const iconReady = appIcon.decode().catch(() => {});
  function appIconOn(k, x, y, s, glint = 0) {
    k.save();
    k.beginPath(); k.roundRect(x, y, s, s, s * 0.2237); k.clip();
    k.drawImage(appIcon, x, y, s, s);
    if (glint > 0 && glint < 1) {
      const gx = x - s + glint * 3 * s, g = k.createLinearGradient(gx, y, gx + s * 0.6, y + s);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = g; k.fillRect(x, y, s, s);
    }
    k.restore();
  }
  function drawLock(t) {
    lk.setTransform(1, 0, 0, 1, 0, 0);
    let g = lk.createLinearGradient(0, 0, 400, 1500); g.addColorStop(0, '#1d3b2a'); g.addColorStop(0.5, '#14261f'); g.addColorStop(1, '#0a110e');
    lk.fillStyle = g; lk.fillRect(0, 0, 720, 1500);
    g = lk.createRadialGradient(560, 300, 10, 560, 300, 700); g.addColorStop(0, 'rgba(140,230,90,0.45)'); g.addColorStop(1, 'rgba(140,230,90,0)'); lk.fillStyle = g; lk.fillRect(0, 0, 720, 1500);
    lk.fillStyle = '#000'; lk.beginPath(); lk.roundRect(290, 40, 140, 40, 20); lk.fill();
    lk.fillStyle = 'rgba(255,255,255,0.9)'; lk.textAlign = 'center';
    lk.font = '600 30px Pretendard'; lk.fillText(L.date, 360, 190);
    lk.font = '300 190px Pretendard'; lk.fillText(L.time, 360, 370);
    // the notification slams in on the beat
    const p = prog(t, T.notifIn, T.notifIn + 0.18), a = clamp(p * 3);
    if (a > 0) {
      const s = lerp(1.18, 1, E.outCubic(p)), nx = 52, ny = 470, nw = 616, nh = 290;
      lk.save(); lk.globalAlpha = a; lk.translate(360, ny + nh / 2); lk.scale(s, s); lk.translate(-360, -(ny + nh / 2));
      lk.fillStyle = 'rgba(245,246,243,0.95)'; lk.beginPath(); lk.roundRect(nx, ny, nw, nh, 44); lk.fill();
      if (t >= T.iconLand) appIconOn(lk, nx + 30, ny + 28, 78);
      lk.textAlign = 'left'; lk.fillStyle = '#3d3f42'; lk.font = '700 29px Pretendard'; lk.fillText(L.app, nx + 126, ny + 66);
      lk.textAlign = 'right'; lk.fillText('지금', nx + nw - 34, ny + 64);
      lk.textAlign = 'left'; lk.fillStyle = '#141516'; lk.font = '800 42px Pretendard'; lk.fillText(L.title, nx + 34, ny + 152);
      lk.fillStyle = '#4b4d50'; lk.font = '400 29px Pretendard'; lk.fillText(L.sub, nx + 34, ny + 196);
      const bx = nx + 34, by = ny + 222, bw = nw - 68, f = tw(t, T.btnA, T.btnB, E.inOutCubic);
      lk.fillStyle = '#E3E5E1'; lk.beginPath(); lk.roundRect(bx, by, bw, 46, 23); lk.fill();
      if (f > 0) {
        g = lk.createLinearGradient(bx, 0, bx + bw * f, 0); g.addColorStop(0, '#11A715'); g.addColorStop(1, '#52D13A');
        lk.save(); lk.beginPath(); lk.roundRect(bx, by, bw, 46, 23); lk.clip(); lk.fillStyle = g; lk.fillRect(bx, by, bw * f, 46);
        if (f < 1) { const hg = lk.createRadialGradient(bx + bw * f, by + 23, 0, bx + bw * f, by + 23, 40); hg.addColorStop(0, 'rgba(250,255,230,1)'); hg.addColorStop(1, 'rgba(170,240,110,0)'); lk.fillStyle = hg; lk.fillRect(bx + bw * f - 40, by - 20, 80, 86); }
        lk.restore();
      }
      lk.fillStyle = f > 0.5 ? '#fff' : '#55575a'; lk.font = '800 26px Pretendard'; lk.textAlign = 'center'; lk.fillText(L.btn, nx + nw / 2, by + 32);
      // the tap
      const tp = prog(t, T.tap, T.tap + 0.35);
      if (tp > 0 && tp < 1) { lk.strokeStyle = `rgba(200,255,160,${(1 - tp).toFixed(3)})`; lk.lineWidth = 6; lk.beginPath(); lk.arc(nx + nw / 2, by + 23, 20 + tp * 140, 0, Math.PI * 2); lk.stroke(); }
      lk.restore();
    }
    lockTex.needsUpdate = true;
  }

  // ---------- the device ----------
  const dev = new THREE.Group();
  scene.add(dev);
  const bodyMat = metal(0x2b2e33, 0.26);
  const bezelMat = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.6 });
  const body = new THREE.Mesh(undefined, bodyMat), bezel = new THREE.Mesh(undefined, bezelMat);
  const lockScr = new THREE.Mesh(undefined, screenMat(lockTex));
  const classTex = new THREE.CanvasTexture(ctx.classUI.canvas); classTex.colorSpace = THREE.SRGBColorSpace; classTex.anisotropy = 8;
  const classScr = new THREE.Mesh(roundRectGeo(SW, SH, 0.03), screenMat(classTex));
  classScr.rotation.z = -Math.PI / 2; // the class screen is landscape inside the portrait frame
  const glare = new THREE.Mesh(roundRectGeo(1, 1, 0.02), new THREE.MeshBasicMaterial({ map: glareTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dev.add(body, bezel, lockScr, classScr, glare);
  let dims = '';
  function shape(w, h, d, r, round) {
    const key = [w, h, d, r, round].map(v => v.toFixed(4)).join();
    if (key === dims) return;
    dims = key;
    body.geometry?.dispose(); bezel.geometry?.dispose(); lockScr.geometry?.dispose();
    body.geometry = bodyGeo(w, h, d, r, Math.min(0.02, d * 0.26));
    bezel.geometry = roundRectGeo(w - 0.024, h - 0.024, r - 0.012); bezel.position.z = d / 2 + 0.0004;
    lockScr.geometry = roundRectGeo(w - 0.05, h - 0.05, Math.max(0.01, r - 0.03)); lockScr.position.z = d / 2 + 0.0008;
    classScr.position.z = d / 2 + 0.0009;
    classScr.scale.set((h - 0.08) / SW, (w - 0.08) / SH, 1);
    if (Math.abs(round - 0.03) > 1e-4) { classScr.geometry.dispose(); classScr.geometry = roundRectGeo(SW, SH, Math.max(0.0005, round)); }
    glare.scale.set(w - 0.05, h - 0.05, 1); glare.position.z = d / 2 + 0.0012;
  }

  // ---------- the app icon tile (v8.2 brand hook) ----------
  const ICON = 0.5, ID = 0.06;
  const iconCv = document.createElement('canvas'); iconCv.width = iconCv.height = 512;
  const iconTex = new THREE.CanvasTexture(iconCv); iconTex.colorSpace = THREE.SRGBColorSpace; iconTex.anisotropy = 8;
  iconReady.then(() => { const k = iconCv.getContext('2d'); k.beginPath(); k.roundRect(0, 0, 512, 512, 512 * 0.2237); k.clip(); k.drawImage(appIcon, 0, 0, 512, 512); iconTex.needsUpdate = true; });
  const tile = new THREE.Group();
  const tileBody = new THREE.Mesh(bodyGeo(ICON, ICON, ID, ICON * 0.2237, 0.014), metal(0x1b1c1f, 0.22));
  const tileFace = new THREE.Mesh(roundRectGeo(ICON - 0.004, ICON - 0.004, ICON * 0.2237 - 0.002), new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, toneMapped: false }));
  tileFace.position.z = ID / 2 + 0.0006;
  const tileGlint = new THREE.Mesh(roundRectGeo(ICON - 0.004, ICON - 0.004, ICON * 0.2237 - 0.002), new THREE.MeshBasicMaterial({ map: glareTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  tileGlint.position.z = ID / 2 + 0.0012;
  tile.add(tileBody, tileFace, tileGlint);
  scene.add(tile);
  // where the icon sits in the notification (lock-screen canvas px → the phone's screen)
  const SLOT = { x: 52 + 30 + 39, y: 470 + 28 + 39, s: 78 };
  const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _f = new THREE.Vector3();
  function placeTile(t) {
    tile.visible = t < T.iconLand;
    if (!tile.visible) return;
    // hold pose: 2.3 in front of the camera, facing it
    camera.getWorldDirection(_f);
    const hold = camera.position.clone().addScaledVector(_f, 1.95 - 0.1 * tw(t, T.slam, T.iconFly, E.outCubic));
    const holdQ = camera.quaternion.clone().multiply(_q.setFromEuler(new THREE.Euler(0.05, lerp(-0.22, 0.18, tw(t, T.slam, T.iconFly, E.inOutSine)), 0)));
    if (t < T.slam) {                                              // the rush in, stopping dead on the slam
      const u = 1 - (1 - prog(t, 0, T.slam)) ** 3;
      const far = camera.position.clone().addScaledVector(_f, 16).add(new THREE.Vector3(1.4, 0.7, 0));
      tile.position.copy(far.lerp(hold, u));
      tile.quaternion.copy(holdQ).multiply(_q.setFromEuler(new THREE.Euler(0, 0, -0.6 * (1 - u))));
      tile.scale.setScalar(1);
    } else if (t < T.iconFly) {
      tile.position.copy(hold); tile.quaternion.copy(holdQ); tile.scale.setScalar(1);
    } else {                                                       // into its slot in the notification
      const k = E.inOutCubic(prog(t, T.iconFly, T.iconLand));
      lockScr.updateMatrixWorld(true);
      const W2 = PH.w - 0.05, H2 = PH.h - 0.05;
      _p.set((SLOT.x / 720 - 0.5) * W2, (0.5 - SLOT.y / 1500) * H2, 0.004);
      const slot = lockScr.localToWorld(_p.clone()), slotQ = lockScr.getWorldQuaternion(new THREE.Quaternion());
      tile.position.copy(hold.lerp(slot, k));
      tile.quaternion.copy(holdQ.slerp(slotQ, k));
      const sc = lerp(1, (SLOT.s / 720) * W2 / ICON, k);
      tile.scale.set(sc, sc, sc * (1 - 0.9 * k));
    }
    tileGlint.material.opacity = 0.9 * Math.sin(Math.PI * prog(t, T.slam + 0.04, T.iconFly));
    tileGlint.material.map.offset.set(lerp(0.6, -0.6, prog(t, T.slam + 0.04, T.iconFly)), 0);
  }

  // ---------- the pen ----------
  const pen = makePen();
  scene.add(pen);
  const nib = new THREE.PointLight(0x9fe07a, 0, 1.4);
  scene.add(nib);

  // a point on the class screen (class px) in world space
  const v = new THREE.Vector3();
  function screenPoint(px, py) {
    v.set((px / 1920 - 0.5) * SW, (0.5 - py / 1080) * SH, 0);
    classScr.updateMatrixWorld(true);
    return classScr.localToWorld(v.clone());
  }

  // ---------- the pen rig (v8.1) ----------
  // Everything in the class screen's own frame (x, y in its plane, z off the glass), so the hand-held pen ignores the
  // device's motion. The tip follows a path: a flip-in arc that slows into the touch-down, the handwriting
  // (makeQuizPen: shared with the board's ink and the sound), a press and a lift-off. The top hangs on a damped
  // spring towards "tip + pen length × lean": the body trails the tip, leans into each move and settles with a small
  // wobble. Integrated deterministically from T.penIn at 960 Hz on every call (render(t) stays pure).
  const quizPen = makeQuizPen(T, copy);
  const UPV = new THREE.Vector3(0, 1, 0), PEN_L = 0.66 - pen.userData.tipY;
  const loc = (px, py, z = 0) => new THREE.Vector3((px / 1920 - 0.5) * SW, (0.5 - py / 1080) * SH, z);
  const lean = (tilt, az) => new THREE.Vector3(Math.sin(tilt) * Math.cos(az), Math.sin(tilt) * Math.sin(az), Math.cos(tilt));
  const TILT = 0.74, AZ = 0.5;                                     // ≈ 42° off the glass normal, top towards upper right
  const FLIP_AX = new THREE.Vector3(Math.cos(AZ + Math.PI / 2), Math.sin(AZ + Math.PI / 2), 0);
  const S0 = new THREE.Vector3(2.3, 1.7, 1.7), SC = new THREE.Vector3(1.3, 1.25, 1.05);
  function tipAt(t) {
    const q0 = quizPen(T.penTap), start = loc(q0.x, q0.y);
    if (t < T.penTap) {                                            // flight: a curved arc, slowing into the glass
      const u = clamp((t - T.penIn) / (T.penTap - T.penIn)), m = 1 - (1 - u) ** 2.4, a = 1 - m;
      return { p: S0.clone().multiplyScalar(a * a).addScaledVector(SC, 2 * a * m).addScaledVector(start, m * m), c: 0 };
    }
    if (t < T.quizB) {
      const q = quizPen(t), press = -0.005 * Math.sin(Math.PI * clamp((t - T.penTap) / 0.07));
      return { p: loc(q.x, q.y, q.z + press), c: q.c };
    }
    const q = quizPen(T.quizB), v = (t - T.quizB) / 0.3, e = E.inCubic(clamp(v)), dip = -0.004 * Math.sin(Math.PI * clamp(v / 0.15));
    return { p: loc(q.x, q.y).add(new THREE.Vector3(0.95 * e, 0.55 * e, 1.6 * e + dip)), c: v < 0.06 ? 1 : 0 };
  }
  function leanAt(t) {
    const d = lean(TILT + 0.4 * tw(t, T.quizB + 0.03, T.quizB + 0.3), AZ);
    if (t < T.penTap) {                                            // one turn end over end, slowing as it comes in
      const u = clamp((t - T.penIn) / (T.penTap - 0.04 - T.penIn)), f = (1 - Math.exp(-3.4 * u)) / (1 - Math.exp(-3.4));
      d.applyAxisAngle(FLIP_AX, -Math.PI * 2 * (1 - f));
    }
    return d;
  }
  const _top = new THREE.Vector3(), _vel = new THREE.Vector3(), _tg = new THREE.Vector3(), _acc = new THREE.Vector3();
  function penState(t) {
    const dt = 1 / 960, t1 = Math.min(t, T.dive);
    let tp = tipAt(T.penIn).p;
    _top.copy(tp).addScaledVector(leanAt(T.penIn), PEN_L); _vel.set(0, 0, 0);
    for (let s = T.penIn; s < t1; s += dt) {
      const flying = s < T.penTap, w = 2 * Math.PI * (flying ? 9 : 4.2), z = flying ? 0.75 : 0.42;
      tp = tipAt(s + dt).p;
      _tg.copy(tp).addScaledVector(leanAt(s + dt), PEN_L);
      _acc.copy(_tg).sub(_top).multiplyScalar(w * w).addScaledVector(_vel, -2 * z * w);
      _vel.addScaledVector(_acc, dt);
      const prev = _top.clone();
      _top.addScaledVector(_vel, dt);
      _top.sub(tp).setLength(PEN_L).add(tp);                         // rigid: the top stays a pen length from the tip
      _vel.copy(_top).sub(prev).divideScalar(dt);
    }
    const tip = tipAt(t1);
    return { tip: tip.p, top: _top.clone(), c: tip.c };
  }
  // the tip's track for the sound (cues.js): contact, speed along the glass (screen widths / s), height
  function track(fs = 240) {
    const out = { t0: T.penIn, fs, c: [], sp: [], z: [] };
    let prev = tipAt(T.penIn).p;
    for (let t = T.penIn; t < T.quizB + 0.32; t += 1 / fs) {
      const p = tipAt(t);
      out.c.push(p.c); out.sp.push(+(Math.hypot(p.p.x - prev.x, p.p.y - prev.y) * fs / SW).toFixed(4)); out.z.push(+p.p.z.toFixed(4));
      prev = p.p;
    }
    return out;
  }

  function update(t) {
    drawLock(t);
    ctx.classUI.draw(t);
    classTex.needsUpdate = true;
    // phone → tablet: a rubbery stretch while it turns to landscape
    const mk = prog(t, T.morphA, T.morphB);
    const st = E.outBack(mk), turn = E.inOutCubic(prog(t, T.morphA, T.morphB - 0.15));
    const w = lerp(PH.w, TB.w, st), h = lerp(PH.h, TB.h, st), d = lerp(PH.d, TB.d, mk), r = lerp(PH.r, TB.r, mk);
    const dive = prog(t, T.diveA, T.dive);
    shape(w, h, d, r, lerp(0.03, 0.0005, E.inCubic(dive)));
    const cf = tw(t, T.morphA + 0.35, T.morphB - 0.05);
    lockScr.material.opacity = 1 - cf; classScr.material.opacity = cf;
    lockScr.visible = cf < 1; classScr.visible = cf > 0;
    glare.material.opacity = 0.9 * (1 - tw(t, T.diveA, T.dive - 0.15));
    // the phone spins in and stops dead on the slam; a slow push; it leans back as a tablet; faces us for the dive
    const spin = E.outCubic(prog(t, 0, T.slam));
    dev.position.set(lerp(0.9, 0, spin), lerp(-0.7, 0, spin), lerp(-3.5, 0, spin));
    dev.rotation.set(lerp(-0.3, 0.06, spin) - 0.26 * tw(t, T.morphA, T.morphB) * (1 - E.inOutCubic(dive)), lerp(-Math.PI * 4, 0, spin) + 0.18 * Math.sin(t * 1.3) * (1 - mk) * spin, turn * Math.PI / 2);
    dev.updateMatrixWorld(true);
    // camera: close on the phone → pull back for the tablet → dive head-on into the screen (it fills the frame at T.dive)
    const c0 = new THREE.Vector3(lerp(0, 0.06, tw(t, T.slam, T.tap)), lerp(0.05, 0.1, tw(t, T.slam, T.tap)), lerp(4.2, 3.35, tw(t, T.slam, T.tap, E.inOutSine)));
    const c1 = new THREE.Vector3(0.1, 0.35, 5.4);
    const pos = c0.clone().lerp(c1, tw(t, T.morphA, T.morphB, E.inOutCubic));
    const look = new THREE.Vector3(0, 0, 0);
    if (dive > 0) {
      const ctr = screenPoint(960, 540), n = new THREE.Vector3(0, 0, 1).applyQuaternion(classScr.getWorldQuaternion(new THREE.Quaternion()));
      const D = (SH / 2) / Math.tan(THREE.MathUtils.degToRad(15));
      const end = ctr.clone().addScaledVector(n, D);
      const k = E.inOutCubic(dive);
      pos.lerp(end, k);
      look.lerp(ctr, k);
    }
    camera.position.copy(pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
    placeTile(t);
    // the pen (v8.1 rig): tip on its path in the screen's frame, body from the spring-hung top
    const pr = penState(t);
    pen.visible = t > T.penIn && t < T.dive - 0.06;
    if (pen.visible) {
      classScr.updateMatrixWorld(true);
      const tipW = classScr.localToWorld(pr.tip.clone()), topW = classScr.localToWorld(pr.top.clone());
      const dir = topW.sub(tipW).normalize();
      pen.quaternion.setFromUnitVectors(UPV, dir);
      pen.position.copy(tipW).addScaledVector(dir, -pen.userData.tipY);
      nib.position.copy(tipW).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(classScr.getWorldQuaternion(new THREE.Quaternion())), 0.05);
      nib.intensity = 2.6 * pr.c * (1 - tw(t, T.quizB, T.quizB + 0.1));
    }
    ctx.flash += 0.4 * (t >= T.slam ? 1 - prog(t, T.slam, T.slam + 0.25) : 0) + 0.25 * (t >= T.tap ? 1 - prog(t, T.tap, T.tap + 0.2) : 0);
    if (t >= T.slam && t < T.slam + 0.3) { const a = (1 - prog(t, T.slam, T.slam + 0.3)) * 14; ctx.shake[0] += Math.sin(t * 190) * a; ctx.shake[1] += Math.cos(t * 160) * a; }
  }

  function draw(fx, t) {
    if (t >= T.dive) return; // the room scene's tablet takes over, pixel for pixel
    gl.draw(scene, camera);
    // the slam: shards of light out of the notification; the tap's flare
    if (t < T.slam + 0.05) {                                       // the streak of light the icon rides in on
      const pts = [];
      for (let i = 10; i >= 0; i--) { const tt = Math.max(0, Math.min(T.slam, t) - i * 0.016); placeTile(tt); const q = tile.position.clone().project(camera); pts.push([(q.x + 1) / 2 * W, (1 - q.y) / 2 * H]); }
      placeTile(t);
      fx.line(pts, { w: 6, alpha: 1 - prog(t, T.slam, T.slam + 0.05), taper: 1, head: 0.8 });
    }
    if (t >= T.slam && t < T.slam + 0.6) fx.shards(W * 0.5, H * 0.47, t, T.slam, { n: 18, seed: 3, speed: 1300, life: 0.5, len: 80, w: 2.4, spreadY: 0.8 });
  }

  return { el: null, range: ctx.S.devices, update, draw, track, ready: iconReady };
}
