// The real-3D layer (v8): one WebGL canvas between the 2.5D stage and the light. Scenes that need true 3D (the
// phone, the tablet, the pen) build their own THREE.Scene + camera and call gl.draw(scene, camera) from draw();
// film.js clears the layer every frame, so it is empty whenever no 3D shot is on screen. Deterministic: no clocks,
// no animation loop — a frame is rendered only when render(t) asks for it.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

export { THREE };

export function createGL(W, H, mount) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  const canvas = renderer.domElement;
  canvas.className = 'gl';
  mount.appendChild(canvas);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  let used = false;
  return {
    THREE, renderer, canvas, env,
    begin() { renderer.setClearColor(0x000000, 0); renderer.clear(true, true, true); canvas.style.opacity = '1'; used = false; },
    draw(scene, camera) { renderer.render(scene, camera); used = true; },
    end() { canvas.style.visibility = used ? 'visible' : 'hidden'; },
  };
}

// ---------- shared geometry and materials ----------
// a device body: big corner radius in the face, softly rounded edges (extruded rounded rect with a bevel)
export function bodyGeo(w, h, d, r, bev) {
  const s = new THREE.Shape(), x = -w / 2 + bev, y = -h / 2 + bev, W2 = w - 2 * bev, H2 = h - 2 * bev, R = Math.max(0.001, r - bev);
  s.moveTo(x + R, y); s.lineTo(x + W2 - R, y); s.absarc(x + W2 - R, y + R, R, -Math.PI / 2, 0); s.lineTo(x + W2, y + H2 - R);
  s.absarc(x + W2 - R, y + H2 - R, R, 0, Math.PI / 2); s.lineTo(x + R, y + H2); s.absarc(x + R, y + H2 - R, R, Math.PI / 2, Math.PI);
  s.lineTo(x, y + R); s.absarc(x + R, y + R, R, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 6, curveSegments: 32 });
  g.translate(0, 0, -(d - 2 * bev) / 2);
  return g;
}
// a rounded-rect plane with 0..1 UVs (screens, bezels)
export function roundRectGeo(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 24), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}
export const metal = (c, r = 0.28) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: r, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.6 });
// the screen shows its canvas exactly (unlit, not tone-mapped) so a full-frame screen matches the 2D stage pixel for pixel
export const screenMat = tex => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
// a faint glass sheen over a screen (fades out as the camera dives in)
export function glareTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const k = c.getContext('2d'), g = k.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.32, 'rgba(255,255,255,0.05)'); g.addColorStop(0.33, 'rgba(255,255,255,0.0)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.0)'); g.addColorStop(0.64, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0.0)');
  k.fillStyle = g; k.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// the pen: white body, a ClassIn-green band, a graphite cone and a little light at the nib
export function makePen() {
  const pen = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ef, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1.25, 64), white); pen.add(body);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.036, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); cap.position.y = 0.625; pen.add(cap);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0372, 0.0372, 0.07, 64), new THREE.MeshPhysicalMaterial({ color: 0x12b416, metalness: 0.35, roughness: 0.25, clearcoat: 1 }));
  band.position.y = 0.46; pen.add(band);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.007, 0.13, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.3 }));
  cone.position.y = -0.69; pen.add(cone);
  pen.userData.tipY = -0.755;
  return pen;
}
