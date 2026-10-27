// v8.2 · bar 7: the neighbourhood as real 3D on a street grid. Every house stands on its lot from the first frame as
// a plain grey block — same orientation, same spacing, 2 to 4 floors — like the original's massing city, with its
// glowing road lines. The light runs along the streets with right-angle turns; wherever it has passed, a front
// spreads out from the route and colour fills the blocks behind a thin bright edge: soft tones taken from the
// friends' pens (sky, peach, pink, butter) and cream, the class's homes along the route in ClassIn mint, the one it
// reaches in ClassIn green. Window grids appear with the colour and light up; small round trees turn green; street
// lamps come on. No photographs — only blocks, colour and light. Nothing moves but the camera.
import { E, clamp, lerp, prog, rng } from './core.js';

// ---------- layout (metres) ----------
const LOT = 11, HW = 9.0, HD = 7.4, YARD = 2.2;            // lot pitch, house front width, depth, front yard
const PX = 52, PZ = 28, BL = 44, BD = 20;                   // block pitch / size (4 lots × 2 rows)
const FLOOR = 2.9;                                          // storey height (2–4 floors)
const BI = [-5, 4], BJ = [-4, 3];
export const street = j => j * PZ + PZ / 2;                 // street centre between block rows j and j+1 (z)
export const cross = i => i * PX + PX / 2;                  // cross street centre (x)

// the light's route: along the streets, right-angle turns, to one house
export const ROUTE = [[-112, street(-2)], [cross(-2), street(-2)], [cross(-2), street(0)], [cross(0), street(0)], [cross(0), street(1)], [120.5, street(1)]];
// default beats (the film passes its own timeline): window, light lands, sweep done, whip, rise, map
const TDEF = { window: 11.6, dawnA: 12.0, sweepB: 13.1, whipA: 13.12, whipB: 13.38, rise: 14.0, mapIn: 14.35 };
const SPREAD = 140;                                         // m/s: how fast the change spreads out from the route
const ease = E.inOutSine, inv = e => Math.acos(1 - 2 * e) / Math.PI;

const GLSL_FIELD = /* glsl */`
uniform float uTime; uniform vec4 uSeg[8]; uniform vec2 uSegT[8]; uniform int uNSeg; uniform float uSpread;
float fieldT(vec2 p) {
  float best = 1e5;
  for (int i = 0; i < 8; i++) {
    if (i >= uNSeg) break;
    vec2 a = uSeg[i].xy, ab = uSeg[i].zw - uSeg[i].xy;
    float s = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
    best = min(best, mix(uSegT[i].x, uSegT[i].y, s) + length(p - a - ab * s) / uSpread);
  }
  return best;
}`;

export async function createTown(THREE, { env = null, assets = '../assets/gen/', T = TDEF, W = 1920, H = 1080 } = {}) {
  const RT = { a: T.dawnA, b: T.sweepB - 0.15 };              // the light lands / reaches the house

  // ---------- route: arc lengths, arrival times ----------
  const segL = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
  const L = segL.reduce((a, b) => a + b, 0);
  const cum = [0]; segL.forEach(l => cum.push(cum[cum.length - 1] + l));
  const arrive = cum.map(s => RT.a + (RT.b - RT.a) * inv(s / L));
  const headS = t => L * ease(prog(t, RT.a, RT.b));
  function at(s) {
    let i = 0; while (i < segL.length - 1 && s > cum[i + 1]) i++;
    const k = clamp((s - cum[i]) / segL[i]), a = ROUTE[i], b = ROUTE[i + 1];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  }
  function nearestS(x, z) {
    let best = 1e9, bs = 0;
    for (let i = 0; i < segL.length; i++) {
      const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1], abx = bx - ax, abz = bz - az;
      const q = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)), d = Math.hypot(x - ax - abx * q, z - az - abz * q);
      if (d < best) { best = d; bs = cum[i] + q * segL[i]; }
    }
    return bs;
  }
  const timeAtS = s => RT.a + (RT.b - RT.a) * inv(clamp(s / L));
  function fieldT(x, z) {
    let best = 1e5;
    for (let i = 0; i < segL.length; i++) {
      const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1], abx = bx - ax, abz = bz - az;
      const s = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz));
      best = Math.min(best, lerp(arrive[i], arrive[i + 1], s) + Math.hypot(x - ax - abx * s, z - az - abz * s) / SPREAD);
    }
    return best;
  }
  const U = {
    uTime: { value: 0 }, uSpread: { value: SPREAD }, uNSeg: { value: segL.length },
    uSeg: { value: Array.from({ length: 8 }, (_, i) => i < segL.length ? new THREE.Vector4(ROUTE[i][0], ROUTE[i][1], ROUTE[i + 1][0], ROUTE[i + 1][1]) : new THREE.Vector4()) },
    uSegT: { value: Array.from({ length: 8 }, (_, i) => i < segL.length ? new THREE.Vector2(arrive[i], arrive[i + 1]) : new THREE.Vector2()) },
    uClay: { value: new THREE.Color(0xb1b7c0) }, uEdge: { value: new THREE.Color(0xc8ff8c) },
    uWarm: { value: new THREE.Color(0xffb35c).multiplyScalar(2.4) },
  };

  // ---------- the houses ----------
  // palette (sRGB): the friends' pens softened — 지아's butter, 하린's peach, 민준's pink, 도윤's sky — cream, and ClassIn
  const PAL = [[0xeee8dd, 30], [0xbcd9f2, 18], [0xf6c9a0, 16], [0xf3c4d2, 14], [0xf5de9a, 14], [0xd9e4dc, 8]];
  const MINT = 0x6fd6a8, BRAND = 0x10b415;
  const lin = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const pick = u => { let acc = 0; const tot = PAL.reduce((q, p) => q + p[1], 0); for (const [hex, w] of PAL) { acc += w / tot; if (u <= acc) return hex; } return PAL[0][0]; };
  const distRoute = (x, z) => { let best = 1e9; for (let i = 0; i < segL.length; i++) { const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1], abx = bx - ax, abz = bz - az; const q = clamp(((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)); best = Math.min(best, Math.hypot(x - ax - abx * q, z - az - abz * q)); } return best; };
  const r = rng(808);
  const houses = [];
  const dest = ROUTE[ROUTE.length - 1];
  const LS = { street: street(0), x0: 46 }, LOWLIT = T.whipB + 0.04;                    // the street the low shot runs along (lights near → far)
  for (let i = BI[0]; i <= BI[1]; i++) for (let j = BJ[0]; j <= BJ[1]; j++) for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
    const cx = i * PX - BL / 2 + LOT / 2 + k * LOT;
    const cz = j * PZ + (row ? 1 : -1) * (BD / 2 - YARD - HD / 2);
    const u = r(), floors = u < 0.12 ? 4 : u < 0.6 ? 3 : 2;
    const home = Math.abs(cx - dest[0]) < 1 && Math.abs(cz - (dest[1] - PZ / 2 + (BD / 2 - YARD - HD / 2))) < 1;
    const cls = !home && distRoute(cx, cz) < 15 && r() < 0.4;
    const hex = home ? BRAND : cls ? MINT : pick(r());
    const tB = fieldT(cx, cz);
    const onStreet = Math.abs(cz - LS.street) < 9 && cx < LS.x0 + 6;
    const tLit = onStreet ? LOWLIT + Math.max(0, LS.x0 - cx) * 0.0055 : tB + 0.45 + r() * 0.7;
    houses.push({ cx, cz, rot: row ? 0 : Math.PI, floors, tB, tLit, seed: Math.floor(r() * 97) * 4, col: lin(hex), home, cls });
  }

  // geometry buffers: position, normal, aF (face-local metres: x from the face centre, height), aWin (window column
  // spacing [0 = none], half-width of the window band, wall height, seed), aHouse (tB, tLit, self-lit, -), colour
  const buf = () => ({ p: [], n: [], f: [], w: [], h: [], c: [] });
  const B = { house: buf() };
  function push(b, hs, pts, nor, fpts, win, col, self = 0) {   // nor: one normal, or one per vertex
    const c = Math.cos(hs.rot), s = Math.sin(hs.rot);
    const w = ([x, y, z]) => [hs.cx + c * x + s * z, y, hs.cz - s * x + c * z];
    const wn = ([x, y, z]) => [c * x + s * z, y, -s * x + c * z];
    const idx = pts.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
    for (const q of idx) {
      b.p.push(...w(pts[q])); b.n.push(...wn(Array.isArray(nor[0]) ? nor[q] : nor)); b.f.push(...fpts[q]); b.w.push(...win);
      b.h.push(hs.tB, hs.tLit, self, 0); b.c.push(...col);
    }
  }
  const NOWIN = [0, 0, 0, 0];
  for (const hs of houses) {
    const Hh = hs.floors * FLOOR + 0.3, x0 = -HW / 2, x1 = HW / 2, z0 = -HD / 2, z1 = HD / 2;
    const face = (pts, nor, wdt, sp) => push(B.house, hs, pts, nor, [[-wdt / 2, 0], [wdt / 2, 0], [wdt / 2, Hh], [-wdt / 2, Hh]], sp ? [sp, Math.floor((wdt - 1.2) / sp) * sp / 2, Hh, hs.seed + (nor[0] > 0 ? 1 : nor[0] < 0 ? 2 : nor[2] < 0 ? 3 : 0)] : NOWIN, hs.col);
    face([[x0, 0, z1], [x1, 0, z1], [x1, Hh, z1], [x0, Hh, z1]], [0, 0, 1], HW, 2.2);       // front: 3–4 windows a floor
    face([[x1, 0, z0], [x0, 0, z0], [x0, Hh, z0], [x1, Hh, z0]], [0, 0, -1], HW, 3.0);
    face([[x1, 0, z1], [x1, 0, z0], [x1, Hh, z0], [x1, Hh, z1]], [1, 0, 0], HD, 3.4);
    face([[x0, 0, z0], [x0, 0, z1], [x0, Hh, z1], [x0, Hh, z0]], [-1, 0, 0], HD, 3.4);
    const top = hs.col.map(v => Math.min(1, v * 1.06));
    push(B.house, hs, [[x0, Hh, z1], [x1, Hh, z1], [x1, Hh, z0], [x0, Hh, z0]], [0, 1, 0], [[0, 0], [0, 0], [0, 0], [0, 0]], NOWIN, top);
  }
  // (v8.2) the homes' light gathers into it: just before it lands, threads of light lift off the roofs around the
  // landing point and fall in with it; then, as it runs, each home beside the route sends a thread up and into it
  const motes = [];
  { const rr = rng(4242), [lx, lz] = at(0);
    for (const hs of houses) {
      const top = hs.floors * FLOOR + 0.8, dl = Math.hypot(hs.cx - lx, hs.cz - lz);
      if (dl < 48 && rr() < 0.75) { const t1 = RT.a - 0.01; motes.push({ x: hs.cx, y: top, z: hs.cz, t0: t1 - 0.2 - rr() * 0.12 - dl * 0.0015, t1, bend: 10 + rr() * 8, pre: true }); continue; }
      if (distRoute(hs.cx, hs.cz) > 28 || rr() < 0.3) continue;
      const t1 = timeAtS(nearestS(hs.cx, hs.cz)) + 0.05 + rr() * 0.08;
      motes.push({ x: hs.cx, y: top, z: hs.cz, t0: t1 - 0.2 - rr() * 0.1, t1, bend: 7 + rr() * 9 });
    }
  }
  // round trees in the front yards and street lamps on the kerbs (blocks too: grey first, then colour)
  const tmp = new THREE.IcosahedronGeometry(1, 2).toNonIndexed(), tp = tmp.attributes.position, tn = tmp.attributes.normal;
  const GREENS = [0x8fcf8a, 0x74bf7e, 0xa6d98f, 0x6fb98a].map(lin), TRUNK = lin(0x9a8a7a), POLE = lin(0xdedad3), LAMP = lin(0xfff1d0);
  const blob = (hs, cx, cy, cz, sx, sy, col, self = 0) => {
    for (let v = 0; v < tp.count; v += 3) {
      const pts = [0, 1, 2].map(q => [cx + tp.getX(v + q) * sx, cy + tp.getY(v + q) * sy, cz + tp.getZ(v + q) * sx]);
      const nn = [0, 1, 2].map(q => [tn.getX(v + q), tn.getY(v + q), tn.getZ(v + q)]);
      push(B.house, hs, pts, nn, [[0, 0], [0, 0], [0, 0]], NOWIN, col, self);
    }
  };
  const post = (hs, cx, cz, rr, h, col) => {
    for (let q = 0; q < 6; q++) {
      const a0 = q / 6 * Math.PI * 2, a1 = (q + 1) / 6 * Math.PI * 2;
      const pts = [[cx + Math.cos(a1) * rr, 0, cz + Math.sin(a1) * rr], [cx + Math.cos(a0) * rr, 0, cz + Math.sin(a0) * rr], [cx + Math.cos(a0) * rr, h, cz + Math.sin(a0) * rr], [cx + Math.cos(a1) * rr, h, cz + Math.sin(a1) * rr]];
      push(B.house, hs, pts, [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], [[0, 0], [0, 0], [0, 0], [0, 0]], NOWIN, col);
    }
  };
  { const rr = rng(77);
    for (let i = BI[0]; i <= BI[1]; i++) for (let j = BJ[0]; j <= BJ[1]; j++) for (const row of [0, 1]) for (let k = 0; k <= 4; k++) {
      const tx = i * PX - BL / 2 + k * LOT, tz = j * PZ + (row ? 1 : -1) * (BD / 2 - 1.1);
      if (rr() < 0.4 || (tx > 22 && Math.abs(tz - street(0)) < 9)) continue;   // keep the low shot's foreground clear
      const hs = { cx: 0, cz: 0, rot: 0, tB: fieldT(tx, tz), tLit: 99 }, s0 = 1.5 + rr() * 0.7;
      post(hs, tx, tz, 0.16, 2.0, TRUNK);
      blob(hs, tx, 2.0 + s0 * 0.9, tz, s0, s0 * 1.1, GREENS[Math.floor(rr() * GREENS.length)]);
    }
    for (let j = BJ[0] - 1; j <= BJ[1]; j++) for (let i = BI[0]; i <= BI[1]; i++) for (const dx of [-13, 13]) {
      const lx = i * PX + dx, lz = street(j) - 3.3, hs = { cx: 0, cz: 0, rot: 0, tB: fieldT(lx, lz), tLit: fieldT(lx, lz) + 0.3 };
      post(hs, lx, lz, 0.09, 5.2, POLE);
      blob(hs, lx, 5.45, lz, 0.32, 0.32, LAMP, 1);
    } }
  function geo(b) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
    g.setAttribute('aF', new THREE.Float32BufferAttribute(b.f, 2));
    g.setAttribute('aWin', new THREE.Float32BufferAttribute(b.w, 4));
    g.setAttribute('aHouse', new THREE.Float32BufferAttribute(b.h, 4));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
    g.computeBoundingSphere();
    return g;
  }

  // ---------- materials: grey → colour behind the spreading front; window grids appear and light ----------
  function morph(mat, { ground = false } = {}) {
    // every variant compiles its own program (onBeforeCompile bodies share one source string)
    mat.customProgramCacheKey = () => `town2-${ground ? 'G' : 'h'}`;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      if (ground) {
        sh.uniforms.uClayMap = { value: groundClay }; sh.uniforms.uRoad = { value: roadTex };
        sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      } else {
        sh.vertexShader = 'attribute vec2 aF; attribute vec4 aWin; attribute vec4 aHouse;\nvarying vec3 vW; varying vec2 vF; varying vec4 vWin; varying vec4 vH;\n' + sh.vertexShader
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz; vF = aF; vWin = aWin; vH = aHouse;');
      }
      sh.fragmentShader = (ground ? 'varying vec3 vW;\nuniform sampler2D uClayMap; uniform sampler2D uRoad;\n' : 'varying vec3 vW; varying vec2 vF; varying vec4 vWin; varying vec4 vH;\n')
        + 'uniform vec3 uClay; uniform vec3 uEdge; uniform vec3 uWarm;\n' + GLSL_FIELD + '\n' + sh.fragmentShader
          .replace('#include <map_fragment>', ground ? /* glsl */`
float Tf = fieldT(vW.xz); float kT = smoothstep(0.0, 0.05, uTime - Tf);
diffuseColor.rgb *= mix(texture2D(uClayMap, vMapUv).rgb, texture2D(map, vMapUv).rgb, kT);` : /* glsl */`
float Tf = fieldT(vW.xz); float kT = smoothstep(0.0, 0.05, uTime - Tf);
float ao = mix(0.66, 1.0, smoothstep(0.0, 1.8, vW.y));
// window grid (only once the colour is in): columns centred on the face, one row per storey
float win = 0.0, lit = 0.0;
if (vWin.x > 0.0) {
  float sp = vWin.x, gx = vF.x / sp + 0.5, col = floor(gx), row = floor(vF.y / 2.9);
  vec2 g = vec2(fract(gx), fract(vF.y / 2.9)), aa = fwidth(vec2(gx, vF.y / 2.9)) * 1.2;
  float ix = smoothstep(0.24 - aa.x, 0.24 + aa.x, g.x) * (1.0 - smoothstep(0.76 - aa.x, 0.76 + aa.x, g.x));
  float iy = smoothstep(0.26 - aa.y, 0.26 + aa.y, g.y) * (1.0 - smoothstep(0.8 - aa.y, 0.8 + aa.y, g.y));
  float band = step(abs(vF.x), vWin.y) * step(vF.y, vWin.z - 0.5) * step(0.4, vF.y);
  win = ix * iy * band * kT;
  float sd = floor(vWin.w + 0.5);                              // interpolated constants wobble: snap before hashing
  float h = fract(sin(col * 12.9898 + row * 78.233 + sd * 0.7311) * 43758.5453);
  lit = win * step(h, 0.7);
}
vec3 base = mix(uClay, vColor, kT);
if (vWin.x > 0.0) base *= 1.0 - 0.1 * kT * (step(vWin.z - 0.32, vF.y) + step(vF.y, 0.45));
base = mix(base, vec3(0.16, 0.2, 0.26), win * 0.85);
diffuseColor.rgb *= base * ao;`)
          .replace('#include <color_fragment>', ground ? '#include <color_fragment>' : '')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + /* glsl */`
float eb = uTime - Tf;
totalEmissiveRadiance += uEdge * exp(-pow((eb - 0.007) / 0.0055, 2.0)) * 2.4;` + (ground ? `
totalEmissiveRadiance += texture2D(uRoad, vMapUv).rgb * (1.0 - kT) * 1.6;` : `
float on = clamp((uTime - vH.y) / 0.12, 0.0, 1.0);
totalEmissiveRadiance += uWarm * lit * on;
totalEmissiveRadiance += vec3(1.0, 0.86, 0.6) * 2.2 * vH.z * kT * on;`));
    };
    return mat;
  }

  // ground: textured (asphalt, sidewalks, yards) and clay, with the original's glowing road lines in the clay state
  const GX = [-330, 330], GZ = [-190, 190], GW = 4096, GH = Math.round(GW * (GZ[1] - GZ[0]) / (GX[1] - GX[0]));
  const toPx = (x, z) => [(x - GX[0]) / (GX[1] - GX[0]) * GW, (z - GZ[0]) / (GZ[1] - GZ[0]) * GH];
  const mpx = GW / (GX[1] - GX[0]);
  function canvasTex(draw) {
    const c = document.createElement('canvas'); c.width = GW; c.height = GH;
    draw(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = false;
    return t;
  }
  const blocks = [];
  for (let i = BI[0]; i <= BI[1]; i++) for (let j = BJ[0]; j <= BJ[1]; j++) blocks.push([i * PX - BL / 2, j * PZ - BD / 2, BL, BD]);
  const rect = (k, x, z, w, d) => { const [a, b] = toPx(x, z); k.fillRect(a, b, w * mpx, d * mpx); };
  function noise(k, n, a, col, sz = 2) { const rr = rng(n); k.fillStyle = col; for (let i = 0; i < 90000; i++) { k.globalAlpha = rr() * a; k.fillRect(rr() * GW, rr() * GH, sz, sz); } k.globalAlpha = 1; }
  // contact shadow around every footprint: drawn small and blurred, then scaled up (software canvas filters are slow)
  const aoC = (() => {
    const c = document.createElement('canvas'), f = 8; c.width = GW / f; c.height = Math.ceil(GH / f);
    const k = c.getContext('2d'); k.filter = `blur(${(1.4 * mpx / f).toFixed(2)}px)`; k.fillStyle = 'rgba(20,16,12,0.55)';
    for (const hs of houses) { const [a, b] = toPx(hs.cx - HW / 2 - 0.5, hs.cz - HD / 2 - 0.5); k.fillRect(a / f, b / f, (HW + 1) * mpx / f, (HD + 1) * mpx / f); }
    return c;
  })();
  function ao(k) { k.save(); k.imageSmoothingEnabled = true; k.drawImage(aoC, 0, 0, GW, GH); k.restore(); }
  const groundTex = canvasTex(k => {
    k.fillStyle = '#5c6270'; k.fillRect(0, 0, GW, GH);                                  // asphalt (blue-grey)
    noise(k, 3, 0.12, '#40444e'); noise(k, 4, 0.08, '#7d8392');
    for (const [x, z, w, d] of blocks) { k.fillStyle = '#ebe6dc'; rect(k, x - 1.6, z - 1.6, w + 3.2, d + 3.2); }   // sidewalks
    for (const [x, z, w, d] of blocks) {
      k.fillStyle = '#d8e6c8'; rect(k, x, z, w, d);                                       // lots: lawn
      const rr = rng(Math.round(x * 7 + z));
      for (let q = 0; q < 8; q++) { k.fillStyle = rr() < 0.6 ? '#bfdcab' : '#efe4cf'; rect(k, x + (q % 4) * LOT + 0.6, z + (q < 4 ? 0.3 : BD - 2.1), LOT - 1.2, 1.8); }
    }
    noise(k, 5, 0.1, '#ffffff', 1);
    // centre lines and crosswalks
    k.strokeStyle = 'rgba(246,222,140,0.75)'; k.lineWidth = 0.18 * mpx; k.setLineDash([3 * mpx, 3 * mpx]);
    for (let j = BJ[0] - 1; j <= BJ[1]; j++) { k.beginPath(); const [a, b] = toPx(GX[0], street(j)); k.moveTo(a, b); k.lineTo(GW, b); k.stroke(); }
    k.setLineDash([]); k.fillStyle = 'rgba(235,235,230,0.7)';
    for (let i = BI[0] - 1; i <= BI[1]; i++) for (let j = BJ[0] - 1; j <= BJ[1]; j++) for (let q = 0; q < 6; q++) rect(k, cross(i) - 3.5 + q * 1.3, street(j) - 5.6, 0.6, 2.2);
    ao(k);
  });
  const groundClay = canvasTex(k => {
    k.fillStyle = '#a3a7ae'; k.fillRect(0, 0, GW, GH);                                  // the grey model
    for (const [x, z, w, d] of blocks) { k.fillStyle = '#c3c6cc'; rect(k, x - 1.6, z - 1.6, w + 3.2, d + 3.2); }
    noise(k, 6, 0.06, '#6d7179', 2);
    ao(k);
  });
  const roadTex = canvasTex(k => {
    k.fillStyle = '#000'; k.fillRect(0, 0, GW, GH);
    k.strokeStyle = 'rgba(120,200,255,0.55)'; k.lineWidth = 0.35 * mpx; k.shadowColor = 'rgba(120,200,255,0.9)'; k.shadowBlur = 1.5 * mpx;
    for (let j = BJ[0] - 1; j <= BJ[1]; j++) { k.beginPath(); const [a, b] = toPx(GX[0], street(j)); k.moveTo(a, b); k.lineTo(GW, b); k.stroke(); }
    for (let i = BI[0] - 1; i <= BI[1]; i++) { k.beginPath(); const [a, b] = toPx(cross(i), GZ[0]); k.moveTo(a, b); k.lineTo(a, GH); k.stroke(); }
  });
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.2;   // the studio env only lifts the shadows a touch; sun + sky do the lighting
  const std = o => new THREE.MeshStandardMaterial({ envMapIntensity: 0.12, ...o });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(GX[1] - GX[0], GZ[1] - GZ[0]), morph(std({ map: groundTex, roughness: 0.95 }), { ground: true }));
  ground.rotation.x = -Math.PI / 2; ground.position.set((GX[0] + GX[1]) / 2, 0, (GZ[0] + GZ[1]) / 2); ground.receiveShadow = true;
  // PlaneGeometry uv: v up = −z after the rotation; our canvas has flipY false with row 0 at GZ[0] (north) → flip v
  { const uv = ground.geometry.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setY(q, 1 - uv.getY(q)); }
  scene.add(ground);
  // beyond the modelled blocks: plain ground that the fog carries to the horizon
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), std({ color: 0x9a9ea6, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.06; outer.receiveShadow = true;
  scene.add(outer);
  const homes = new THREE.Mesh(geo(B.house), morph(std({ roughness: 0.72, vertexColors: true })));
  homes.castShadow = homes.receiveShadow = true; homes.frustumCulled = false;
  scene.add(homes);
  // sky dome + light
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`varying vec3 vD;
      void main(){ float y = vD.y; vec3 hz = vec3(1.0, 0.74, 0.58), mid = vec3(0.62, 0.62, 0.78), top = vec3(0.26, 0.33, 0.55);
        vec3 c = y < 0.0 ? hz * 0.9 : mix(hz, mid, smoothstep(0.0, 0.18, y)); c = mix(c, top, smoothstep(0.18, 0.75, y));
        gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
      }`,
  }));
  scene.add(sky);
  scene.fog = new THREE.Fog(0xe9c2ad, 200, 900);
  const sun = new THREE.DirectionalLight(0xffd8b8, 2.6);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0x8fa3d6, 0x4a423c, 0.85));
  const SUN = new THREE.Vector3(0.8, 0.3, 0.42).normalize();   // low dawn sun from the east

  // the route: a glowing ribbon on the road, revealed up to the head, and the head itself
  // sampled every metre, corners rounded (moving average over ±4 m), offset along the local normal
  const raw = [];
  for (let s = 0; s <= L; s += 1) raw.push(at(s));
  const pts = raw.map((_, q) => {
    let x = 0, z = 0, n = 0;
    for (let d = -4; d <= 4; d++) { const p = raw[clamp(q + d, 0, raw.length - 1)]; x += p[0]; z += p[1]; n++; }
    return [x / n, z / n, q];
  });
  const rp = [], ruv = [], ri = [], WG = 6;
  pts.forEach(([x, z, s], q) => {
    const a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)];
    const nx = b[0] - a[0], nz = b[1] - a[1], l = Math.hypot(nx, nz) || 1, ox = -nz / l * WG / 2, oz = nx / l * WG / 2;
    rp.push(x + ox, 0.08, z + oz, x - ox, 0.08, z - oz); ruv.push(0, s, 1, s);
    if (q) { const a2 = 2 * q; ri.push(a2 - 2, a2 - 1, a2, a2 - 1, a2 + 1, a2); }
  });
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri);
  const RU = { uHead: { value: 0 } };
  const ribbon = new THREE.Mesh(rg, new THREE.ShaderMaterial({
    uniforms: RU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */`varying vec2 vUv; uniform float uHead;
      void main(){ if (vUv.y > uHead) discard; float x = (vUv.x - 0.5) * 2.0;
        float hot = exp(-(uHead - vUv.y) / 16.0), tail = smoothstep(0.0, 6.0, vUv.y);
        float core = exp(-pow(x / 0.07, 2.0)), glow = exp(-pow(x / 0.5, 2.0));
        vec3 c = vec3(0.4, 1.0, 0.2) * glow * (0.3 + 1.1 * hot) + vec3(0.96, 1.0, 0.86) * core * (1.3 + 2.2 * hot);
        gl_FragColor = vec4(c * tail, 1.0); }`,
  }));
  ribbon.frustumCulled = false;
  scene.add(ribbon);
  // gathering threads: a soft point at each thread's head and five fading points behind it (additive)
  const TRAIL = 12, NM = motes.length * (TRAIL + 1);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(NM * 3), 3));
  mg.setAttribute('aA', new THREE.Float32BufferAttribute(new Float32Array(NM * 2), 2));   // alpha, size (m)
  const MU = { uScale: { value: 1 } };
  const motePts = new THREE.Points(mg, new THREE.ShaderMaterial({
    uniforms: MU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
    vertexShader: 'attribute vec2 aA; varying float vA; uniform float uScale; void main(){ vA = aA.x; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = max(1.5, aA.y * uScale / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0 || vA <= 0.0) discard; float core = smoothstep(0.45, 0.0, d), halo = exp(-d * d * 5.0); gl_FragColor = vec4((vec3(1.0, 0.98, 0.9) * core + vec3(0.45, 1.0, 0.3) * halo * 0.6) * vA, 1.0); }',
  }));
  motePts.frustumCulled = false;
  scene.add(motePts);
  const qb = (a0, c, b, e) => a0 * (1 - e) * (1 - e) + 2 * c * e * (1 - e) + b * e * e;
  function moteAt(m, t) {
    const u = clamp((t - m.t0) / (m.t1 - m.t0)), e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
    const [hx, hz] = m.pre ? at(0) : at(headS(t)), hy = m.pre ? 2.2 + 30 * (1 - E.inCubic(prog(t, RT.a - 0.14, RT.a))) : 2.2;
    const cx = (m.x + hx) / 2, cz = (m.z + hz) / 2, cy = Math.max(m.y, hy) + m.bend;
    return [qb(m.x, cx, hx, e), qb(m.y, cy, hy, e), qb(m.z, cz, hz, e)];
  }
  function updateMotes(t) {
    const P = mg.attributes.position.array, A = mg.attributes.aA.array;
    let i = 0;
    for (const m of motes) {
      for (let k = 0; k <= TRAIL; k++) {
        const tt = t - k * 0.006, on = tt >= m.t0 && tt <= m.t1 && t >= m.t0;
        const p = on ? moteAt(m, tt) : [0, -100, 0];
        P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2];
        const fade = 1 - k / (TRAIL + 1), land = 1 - 0.6 * prog(tt, m.t1 - 0.04, m.t1);
        A[i * 2] = on ? fade * land : 0; A[i * 2 + 1] = (k ? 2.0 : 2.8) * (0.4 + 0.6 * fade);
        i++;
      }
    }
    mg.attributes.position.needsUpdate = true; mg.attributes.aA.needsUpdate = true;
  }
  const headTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d');
    const g = k.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.12, 'rgba(230,255,190,0.9)'); g.addColorStop(0.35, 'rgba(140,240,80,0.35)'); g.addColorStop(1, 'rgba(110,230,60,0)');
    k.fillStyle = g; k.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  })();
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: headTex, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  scene.add(head);
  const headLight = new THREE.PointLight(0x9cff6a, 0, 0, 2);
  scene.add(headLight);

  // ---------- camera: top-down over the blocks → swoop to 3/4 → whip to the street → crane up ----------
  const camera = new THREE.PerspectiveCamera(22, W / H, 1, 4000);
  const KEYS = [
    { t: T.window - 0.1, tg: [-46, 0, -18], yaw: -5, pitch: 89, dist: 270, fov: 22 },
    { t: T.dawnA, tg: [-34, 0, -10], yaw: -1, pitch: 88.5, dist: 236, fov: 22, e: E.outQuad },
    { t: RT.b, tg: [24, 0, 20], yaw: 30, pitch: 40, dist: 175, fov: 30, e: E.inOutCubic },
    { t: T.whipA, tg: [30, 0, 22], yaw: 35, pitch: 37, dist: 165, fov: 30, e: E.outQuad },
    { t: T.whipB, tg: [-30, 4.5, street(0) - 0.8], yaw: 90, pitch: -1, dist: 76, fov: 34, e: E.inOutExpo },
    { t: T.rise, tg: [-42, 4.5, street(0) - 0.8], yaw: 90, pitch: -1, dist: 70, fov: 34, e: E.inOutSine },
    { t: T.mapIn + 0.25, tg: [-10, 0, 8], yaw: 90, pitch: 86, dist: 320, fov: 26, e: E.inCubic },
  ];
  function cam(t) {
    let i = 0; while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = (b.e || (x => x))(clamp((t - a.t) / (b.t - a.t)));
    const P = {}; for (const key of ['yaw', 'pitch', 'dist', 'fov']) P[key] = lerp(a[key], b[key], k);
    P.tg = a.tg.map((v, q) => lerp(v, b.tg[q], k));
    return P;
  }

  function update(t) {
    U.uTime.value = t;
    const P = cam(t), yw = P.yaw * Math.PI / 180, pt = P.pitch * Math.PI / 180;
    const dir = new THREE.Vector3(-Math.sin(yw) * Math.cos(pt), -Math.sin(pt), -Math.cos(yw) * Math.cos(pt));
    const tg = new THREE.Vector3(...P.tg);
    camera.position.copy(tg).addScaledVector(dir, -P.dist);
    camera.up.set(0, 1, 0);
    camera.fov = P.fov; camera.updateProjectionMatrix();
    camera.lookAt(tg);
    // fog follows the camera distance so the top-down shot stays clear and the low shot gets depth
    scene.fog.near = P.dist + 60; scene.fog.far = P.dist + 700;
    sky.position.copy(camera.position);
    // sun: shadows framed on what the camera sees
    const ext = clamp(P.dist * 0.5, 55, 220);
    sun.target.position.copy(tg).setY(0);
    sun.position.copy(sun.target.position).addScaledVector(SUN, 600);
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 100, far: 1200 });
    sun.shadow.camera.updateProjectionMatrix();
    MU.uScale.value = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    updateMotes(t);
    // route
    const s = headS(t), [hx, hz] = at(s), on = t > RT.a - 0.14 && t < RT.b + 0.6;
    RU.uHead.value = t < RT.a ? 0 : s;
    head.visible = on; head.position.set(hx, 2.2, hz);
    const drop = 1 - E.inCubic(prog(t, RT.a - 0.14, RT.a));                    // falls out of the sky onto the street
    const hs = 11 * (1 + 0.12 * Math.sin(t * 40) + 5 * drop) * (t > RT.b ? 1 - prog(t, RT.b, RT.b + 0.6) : 1);
    head.material.opacity = 1 - 0.7 * drop;
    head.scale.set(hs, hs, 1);
    headLight.position.set(hx, 6, hz); headLight.intensity = on ? 1600 * (t > RT.b ? 1 - prog(t, RT.b, RT.b + 0.6) : 1) : 0;
  }

  // world → screen px (for 2D overlays: the whale's light, flares)
  const pv = new THREE.Vector3();
  function toScreen(x, y, z) { pv.set(x, y, z).project(camera); return [(pv.x + 1) / 2 * W, (1 - pv.y) / 2 * H, pv.z]; }
  return { scene, camera, update, houses, motes, fieldT, headS, at, L, RT, toScreen, dest, exposure: 0.9, pitch: t => cam(t).pitch };
}
