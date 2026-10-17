// S11 (v8) · 15.9–17.6 · the next morning (real 3D): the phone lies on the walnut desk in low sunlight, its shadow
// long across the grain. The same notification sound as the opening — the parent's report slides down the lock
// screen: 오늘의 수업 리포트가 도착했어요 · 퀴즈 3개 정답, 트로피 2개를 받았어요 🏆. The film opened on this phone; it
// closes on it.
import { E, tw, prog, clamp, lerp } from '../core.js';
import { bodyGeo, roundRectGeo, metal, screenMat, glareTex } from '../gl.js';

export default function morningScene(ctx) {
  const { T, copy, gl, W, H } = ctx;
  const THREE = gl.THREE;
  const scene = new THREE.Scene();
  scene.environment = gl.env;
  const camera = new THREE.PerspectiveCamera(28, W / H, 0.05, 100);
  const sun = new THREE.DirectionalLight(0xffe2b8, 3.2);
  sun.position.set(-4, 3.2, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -3; sun.shadow.camera.right = 3; sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
  sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a1c, 0.5));

  // the desk (generated walnut texture)
  const img = new Image();
  img.src = 'assets/gen/desk_wood.jpg';
  const deskTex = new THREE.Texture(img);
  deskTex.colorSpace = THREE.SRGBColorSpace;
  deskTex.wrapS = deskTex.wrapT = THREE.RepeatWrapping;
  deskTex.repeat.set(1.2, 1.2);
  deskTex.anisotropy = 8;
  img.onload = () => { deskTex.needsUpdate = true; };
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshStandardMaterial({ map: deskTex, roughness: 0.62, metalness: 0, envMapIntensity: 0.4 }));
  desk.receiveShadow = true;
  scene.add(desk);

  // the phone, lying on the desk
  const N = copy.notify;
  const lc = document.createElement('canvas'); lc.width = 720; lc.height = 1500;
  const lk = lc.getContext('2d');
  const lockTex = new THREE.CanvasTexture(lc); lockTex.colorSpace = THREE.SRGBColorSpace; lockTex.anisotropy = 8;
  function drawLock(t) {
    let g = lk.createLinearGradient(0, 0, 300, 1500); g.addColorStop(0, '#F4D9AE'); g.addColorStop(0.45, '#E9B98A'); g.addColorStop(1, '#B9785A');
    lk.fillStyle = g; lk.fillRect(0, 0, 720, 1500);
    g = lk.createRadialGradient(520, 260, 10, 520, 260, 760); g.addColorStop(0, 'rgba(255,248,220,0.7)'); g.addColorStop(1, 'rgba(255,248,220,0)'); lk.fillStyle = g; lk.fillRect(0, 0, 720, 1500);
    lk.fillStyle = '#000'; lk.beginPath(); lk.roundRect(290, 40, 140, 40, 20); lk.fill();
    lk.fillStyle = 'rgba(60,36,20,0.85)'; lk.textAlign = 'center';
    lk.font = '600 30px Pretendard'; lk.fillText(N.date, 360, 190);
    lk.font = '300 190px Pretendard'; lk.fillText(N.time, 360, 370);
    const p = E.outBack(prog(t, T.notify, T.notify + 0.32)), a = clamp(prog(t, T.notify, T.notify + 0.1));
    if (a > 0) {
      const nx = 46, ny = lerp(300, 470, p), nw = 628, nh = 250;
      lk.save(); lk.globalAlpha = a;
      lk.shadowColor = 'rgba(80,40,10,0.25)'; lk.shadowBlur = 30; lk.shadowOffsetY = 10;
      lk.fillStyle = 'rgba(250,248,244,0.96)'; lk.beginPath(); lk.roundRect(nx, ny, nw, nh, 44); lk.fill();
      lk.shadowBlur = 0; lk.shadowOffsetY = 0;
      lk.fillStyle = '#fff'; lk.beginPath(); lk.roundRect(nx + 32, ny + 32, 72, 72, 18); lk.fill();
      lk.strokeStyle = 'rgba(0,0,0,0.08)'; lk.lineWidth = 2; lk.stroke();
      lk.fillStyle = '#10B415'; lk.save(); lk.translate(nx + 68, ny + 68); lk.transform(1, -0.45, 0, 1, 0, 0); lk.fillRect(-9, -20, 18, 42); lk.restore();
      lk.textAlign = 'left'; lk.fillStyle = '#6a6c6e'; lk.font = '600 28px Pretendard'; lk.fillText(N.app, nx + 124, ny + 64);
      lk.textAlign = 'right'; lk.fillText('지금', nx + nw - 34, ny + 64);
      lk.textAlign = 'left'; lk.fillStyle = '#141516'; lk.font = '800 36px Pretendard'; lk.fillText(N.title, nx + 34, ny + 150);
      lk.fillStyle = '#4b4d50'; lk.font = '400 28px Pretendard'; lk.fillText(N.body, nx + 34, ny + 198);
      lk.restore();
    }
    lockTex.needsUpdate = true;
  }
  const phone = new THREE.Group();
  const PW = 0.76, PH = 1.58, PD = 0.085;
  const body = new THREE.Mesh(bodyGeo(PW, PH, PD, 0.115, 0.02), metal(0xc9b9a6, 0.3));
  body.castShadow = true;
  const bezel = new THREE.Mesh(roundRectGeo(PW - 0.024, PH - 0.024, 0.103), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }));
  bezel.position.z = PD / 2 + 0.0004;
  const scr = new THREE.Mesh(roundRectGeo(PW - 0.05, PH - 0.05, 0.085), screenMat(lockTex));
  scr.position.z = PD / 2 + 0.0008;
  const glare = new THREE.Mesh(roundRectGeo(PW - 0.05, PH - 0.05, 0.085), new THREE.MeshBasicMaterial({ map: glareTex(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glare.position.z = PD / 2 + 0.0012;
  phone.add(body, bezel, scr, glare);
  phone.position.set(0.15, -0.05, PD / 2);
  phone.rotation.z = -0.32;
  scene.add(phone);

  function update(t) {
    drawLock(t);
    // a slow push down towards the phone, drifting around it
    const k = tw(t, 15.8, 17.6, E.inOutSine);
    const ang = lerp(-0.5, -0.32, k), dist = lerp(3.6, 2.85, k), tilt = lerp(0.62, 0.42, k);
    camera.position.set(0.15 + Math.sin(ang) * dist * Math.sin(tilt), -0.05 - Math.cos(ang) * dist * Math.sin(tilt), dist * Math.cos(tilt));
    camera.up.set(0, 0, 1);
    camera.lookAt(0.12, 0.02, 0);
  }

  function draw(fx, t) {
    const a = tw(t, 15.85, 16.08) * (1 - tw(t, T.sweepA - 0.3, T.sweepA - 0.02));
    if (a <= 0) return;
    gl.canvas.style.opacity = a.toFixed(3);
    gl.draw(scene, camera);
    // the report arrives: a soft flare on the screen
    const f = prog(t, T.notify, T.notify + 0.5);
    if (f > 0 && f < 1) fx.flare(W * 0.52, H * 0.45, 420 * (0.4 + f), 0.35 * (1 - f) * a, '255,230,170');
  }

  return { el: null, range: ctx.S.morning, update, draw };
}
