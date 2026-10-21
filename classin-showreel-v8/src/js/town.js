// v8.1 · bar 7 (look test): the neighbourhood as real 3D on a street grid. Every house stands on its lot from the
// first frame as a plain warm-white block — same orientation, same spacing, floors of 2 or 3 — like the original's
// massing city. The light runs along the streets with right-angle turns; wherever it has passed, a front spreads out
// from the route and the blocks become houses: the flat top folds up into a tiled gable roof (no bounce), the clay
// gives way to the walls' real texture behind a thin bright edge, then the windows light. Nothing moves but the
// roofs and the camera. Wall/roof textures are rectified out of the generated house sheets (render/facades.py).
import { E, clamp, lerp, prog, rng } from './core.js';

// ---------- layout (metres) ----------
const LOT = 11, HW = 9.0, HD = 7.4, YARD = 2.2;            // lot pitch, house front width, depth, front yard
const PX = 52, PZ = 28, BL = 44, BD = 20;                   // block pitch / size (4 lots × 2 rows)
const H3 = 8.8, H2 = 8.8 * 678 / 1000, RISE = 1.97;         // wall heights (3F / 2F), gable rise (28°)
const OG = 0.35, OE = 0.45, SLAB = 0.18, PARA = 0.7;        // overhangs, roof slab, parapet
const BI = [-5, 4], BJ = [-4, 3];
export const street = j => j * PZ + PZ / 2;                 // street centre between block rows j and j+1 (z)
export const cross = i => i * PX + PX / 2;                  // cross street centre (x)

// the light's route: along the streets, right-angle turns, to one house
export const ROUTE = [[-200, street(-2)], [cross(-2), street(-2)], [cross(-2), street(0)], [cross(0), street(0)], [cross(0), street(1)], [120.5, street(1)]];
export const RT = { a: 12.0, b: 12.95 };                    // head leaves / arrives
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

export async function createTown(THREE, { env = null, base = '../assets/gen/town/', W = 1920, H = 1080 } = {}) {
  const meta = await (await fetch(base + 'town.json')).json();
  const loader = new THREE.TextureLoader();
  const load = f => new Promise((res, rej) => loader.load(base + f, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));
  const [atlas, glowTex, roofTex] = await Promise.all([load('atlas.webp'), load('atlas_glow.webp'), load('roof.webp')]);

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
    uGlow: { value: glowTex }, uClay: { value: new THREE.Color(0xe6dfd4) }, uEdge: { value: new THREE.Color(0xc8ff8c) },
    uWarm: { value: new THREE.Color(0xffb35c).multiplyScalar(2.4) },
  };

  // ---------- the houses ----------
  const r = rng(808);
  const houses = [];
  const T = { street: street(0), x0: 46 };                    // the street the low shot runs along (lights near → far)
  for (let i = BI[0]; i <= BI[1]; i++) for (let j = BJ[0]; j <= BJ[1]; j++) for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
    const cx = i * PX - BL / 2 + LOT / 2 + k * LOT;
    const cz = j * PZ + (row ? 1 : -1) * (BD / 2 - YARD - HD / 2);
    const floors = r() < 0.55 ? 3 : 2, gable = r() < 0.75, v = Math.floor(r() * 4), flip = r() < 0.5, tint = r();
    const tB = fieldT(cx, cz);
    const onStreet = Math.abs(cz - T.street) < 9 && cx < T.x0 + 6;
    const tLit = onStreet ? 13.42 + Math.max(0, T.x0 - cx) * 0.0055 : tB + 0.55 + r() * 0.7;
    houses.push({ cx, cz, rot: row ? 0 : Math.PI, floors, gable, v, flip, tint, tB, tLit });
  }

  // geometry buffers: position (house), aPos0 (block), normal / aNor0, uv, aHouse (tB, tLit, tint, -), aLy (height)
  const buf = () => ({ p: [], p0: [], n: [], n0: [], uv: [], h: [], ly: [], c: [] });
  const B = { wall: buf(), roof: buf(), flat: buf(), trim: buf() };
  const reg = name => meta.regions[name];
  function push(b, hs, pts, pts0, nor, nor0, uvs, col) {
    // pts: 4 (quad) or 3 (tri) local points; world = rotate(rot) + (cx, cz)
    const c = Math.cos(hs.rot), s = Math.sin(hs.rot);
    const w = ([x, y, z]) => [hs.cx + c * x + s * z, y, hs.cz - s * x + c * z];
    const wn = ([x, y, z]) => [c * x + s * z, y, -s * x + c * z];
    const idx = pts.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
    for (const q of idx) {
      b.p.push(...w(pts[q])); b.p0.push(...w(pts0[q])); b.n.push(...wn(nor)); b.n0.push(...wn(nor0));
      b.uv.push(...uvs[q]); b.h.push(hs.tB, hs.tLit, hs.tint, 0); b.ly.push(pts[q][1]); b.c.push(...(col || [1, 1, 1]));
    }
  }
  const UP = [0, 1, 0];
  for (const hs of houses) {
    const Hh = hs.floors === 3 ? H3 : H2, x0 = -HW / 2, x1 = HW / 2, z0 = -HD / 2, z1 = HD / 2;
    const inset = (R, k) => { const d = (R[2] - R[0]) * k; return [R[0] + d, R[1], R[2] - d, R[3], R[4], R[5]]; };
    const fr = inset(reg(`c${hs.v}_front${hs.floors}`), 0.004), bk = inset(reg(`c${(hs.v + 2) % 4}_front${hs.floors}`), 0.004), sd = inset(reg(`c${hs.v}_side${hs.floors}`), 0.018);
    const fu = (R, flip) => flip ? [R[2], R[0]] : [R[0], R[2]];
    const quadUV = (R, flip, vTop = R[3]) => { const [ua, ub] = fu(R, flip); return [[ua, R[1]], [ub, R[1]], [ub, vTop], [ua, vTop]]; };
    // side texture: wall part, then the gable triangle above it
    const sWallTop = sd[1] + (sd[3] - sd[1]) * (sd[5] - meta.gable) / sd[5];
    const sApex = sd[1] + (sd[3] - sd[1]) * (sd[5] - meta.gable + RISE / Hh * (sd[5] - meta.gable)) / sd[5];
    const same = a => a;
    const quad = (b, pts, nor, uvs) => push(b, hs, pts, pts, nor, nor, uvs);
    quad(B.wall, [[x0, 0, z1], [x1, 0, z1], [x1, Hh, z1], [x0, Hh, z1]], [0, 0, 1], quadUV(fr, hs.flip));
    quad(B.wall, [[x1, 0, z0], [x0, 0, z0], [x0, Hh, z0], [x1, Hh, z0]], [0, 0, -1], quadUV(bk, !hs.flip));
    quad(B.wall, [[x1, 0, z1], [x1, 0, z0], [x1, Hh, z0], [x1, Hh, z1]], [1, 0, 0], quadUV(sd, false, sWallTop));
    quad(B.wall, [[x0, 0, z0], [x0, 0, z1], [x0, Hh, z1], [x0, Hh, z0]], [-1, 0, 0], quadUV(sd, true, sWallTop));
    if (hs.gable) {
      const um = (sd[0] + sd[2]) / 2;
      push(B.wall, hs, [[x1, Hh, z1], [x1, Hh, z0], [x1, Hh + RISE, 0]], [[x1, Hh, z1], [x1, Hh, z0], [x1, Hh, 0]], [1, 0, 0], [1, 0, 0], [[sd[0], sWallTop], [sd[2], sWallTop], [um, sApex]]);
      push(B.wall, hs, [[x0, Hh, z0], [x0, Hh, z1], [x0, Hh + RISE, 0]], [[x0, Hh, z0], [x0, Hh, z1], [x0, Hh, 0]], [-1, 0, 0], [-1, 0, 0], [[sd[2], sWallTop], [sd[0], sWallTop], [um, sApex]]);
      // two slopes (tiles), each a slab: top, fascia at the eave, soffit, rake edges
      const tan = RISE / (HD / 2), cs = Math.cos(Math.atan(tan)), sn = Math.sin(Math.atan(tan));
      for (const sg of [1, -1]) {
        const zr = 0, ze = sg * (z1 + OE), yr = Hh + RISE + SLAB, ye = Hh + SLAB - OE * tan;
        const xa = x0 - OG, xb = x1 + OG, wz = sg * z1;
        const top = sg > 0 ? [[xa, ye, ze], [xb, ye, ze], [xb, yr, zr], [xa, yr, zr]] : [[xb, ye, ze], [xa, ye, ze], [xa, yr, zr], [xb, yr, zr]];
        const top0 = sg > 0 ? [[x0, Hh, wz], [x1, Hh, wz], [x1, Hh, 0], [x0, Hh, 0]] : [[x1, Hh, wz], [x0, Hh, wz], [x0, Hh, 0], [x1, Hh, 0]];
        push(B.roof, hs, top, top0, [0, cs, sg * sn], UP, [[0.03, 0.02], [0.97, 0.02], [0.97, 0.985], [0.03, 0.985]]);
        const wood = [0.36, 0.25, 0.18];
        // fascia (vertical strip under the eave edge)
        const fa = sg > 0 ? [[xa, ye - SLAB, ze], [xb, ye - SLAB, ze], [xb, ye, ze], [xa, ye, ze]] : [[xb, ye - SLAB, ze], [xa, ye - SLAB, ze], [xa, ye, ze], [xb, ye, ze]];
        const fa0 = fa.map(([x, , z]) => [clamp(x, x0, x1), Hh, sg * z1]);
        push(B.trim, hs, fa, fa0, [0, 0, sg], UP, [[0, 0], [1, 0], [1, 1], [0, 1]], wood);
        // soffit (underside, facing down) from the eave back to the wall
        const so = sg > 0 ? [[xb, ye - SLAB, ze], [xa, ye - SLAB, ze], [xa, Hh, wz], [xb, Hh, wz]] : [[xa, ye - SLAB, ze], [xb, ye - SLAB, ze], [xb, Hh, wz], [xa, Hh, wz]];
        push(B.trim, hs, so, so.map(([x, , z]) => [clamp(x, x0, x1), Hh, wz]), [0, -1, 0], UP, [[0, 0], [1, 0], [1, 1], [0, 1]], wood.map(v => v * 0.8));
        // rake edges (the slab's ends at the gables)
        for (const xs of [xa, xb]) {
          const e = [[xs, ye - SLAB, ze], [xs, ye, ze], [xs, yr, zr], [xs, yr - SLAB, zr]];
          const pts = (xs === xa) === (sg > 0) ? [e[0], e[3], e[2], e[1]] : e;
          push(B.trim, hs, pts, pts.map(([x, , z]) => [clamp(x, x0, x1), Hh, z > 0 === sg > 0 ? sg * z1 : 0]), [xs === xa ? -1 : 1, 0, 0], [xs === xa ? -1 : 1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], wood);
        }
      }
    } else {
      // flat roof: the top stays (green waterproofing), a parapet rises around it
      push(B.flat, hs, [[x0, Hh, z1], [x1, Hh, z1], [x1, Hh, z0], [x0, Hh, z0]], [[x0, Hh, z1], [x1, Hh, z1], [x1, Hh, z0], [x0, Hh, z0]], UP, UP, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      const con = [0.78, 0.76, 0.72], t = 0.22, yP = Hh + PARA;
      const ring = [[x0, z1, x1, z1, [0, 0, 1]], [x1, z1, x1, z0, [1, 0, 0]], [x1, z0, x0, z0, [0, 0, -1]], [x0, z0, x0, z1, [-1, 0, 0]]];
      for (const [ax, az, bx, bz, nn] of ring) {
        const o = [[ax, Hh, az], [bx, Hh, bz], [bx, yP, bz], [ax, yP, az]];
        push(B.trim, hs, o, o.map(([x, , z]) => [x, Hh, z]), nn, nn, [[0, 0], [1, 0], [1, 1], [0, 1]], con);
        const ix = -nn[0] * t, iz = -nn[2] * t;                 // inner face + cap
        const inn = [[bx + ix, Hh, bz + iz], [ax + ix, Hh, az + iz], [ax + ix, yP, az + iz], [bx + ix, yP, bz + iz]];
        push(B.trim, hs, inn, inn.map(([x, , z]) => [x, Hh, z]), nn.map(v => -v), nn.map(v => -v), [[0, 0], [1, 0], [1, 1], [0, 1]], con.map(v => v * 0.85));
        const cap = [[ax, yP, az], [bx, yP, bz], [bx + ix, yP, bz + iz], [ax + ix, yP, az + iz]];
        push(B.trim, hs, cap, cap.map(([x, , z]) => [x, Hh, z]), UP, UP, [[0, 0], [1, 0], [1, 1], [0, 1]], con.map(v => v * 1.05));
      }
    }
  }
  // utility poles along the north kerb of every street (part of the model: clay first, concrete after), wires between
  const wires = [];
  const POLE_H = 9.5, ARM = 8.8;
  for (let j = BJ[0] - 1; j <= BJ[1]; j++) {
    const pz = street(j) - 3.3, row = [];
    for (let i = BI[0]; i <= BI[1]; i++) for (const dx of [-13, 13]) row.push(i * PX + dx);
    for (const px of row) {
      const hs = { cx: px, cz: pz, rot: 0, tB: fieldT(px, pz), tLit: 99, tint: 0.5 }, con = [0.66, 0.65, 0.63];
      for (let q = 0; q < 8; q++) {
        const a0 = q / 8 * Math.PI * 2, a1 = (q + 1) / 8 * Math.PI * 2, r0 = 0.17, r1 = 0.12;
        const pa = [[Math.cos(a0) * r0, 0, Math.sin(a0) * r0], [Math.cos(a1) * r0, 0, Math.sin(a1) * r0], [Math.cos(a1) * r1, POLE_H, Math.sin(a1) * r1], [Math.cos(a0) * r1, POLE_H, Math.sin(a0) * r1]];
        const nn = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
        push(B.trim, hs, pa.slice().reverse(), pa.slice().reverse(), nn, nn, [[0, 0], [1, 0], [1, 1], [0, 1]], con);
      }
      // crossarm across the street direction
      const box = (x0, y0, z0, x1, y1, z1, col) => {
        const F = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
          [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]]];
        for (const f of F) push(B.trim, hs, f.slice(0, 4), f.slice(0, 4), f[4], f[4], [[0, 0], [1, 0], [1, 1], [0, 1]], col);
      };
      box(-0.07, ARM - 0.06, -1.0, 0.07, ARM + 0.06, 1.0, [0.5, 0.48, 0.46]);
      if ((px / 13) % 3 === 0) box(-0.35, 6.4, 0.18, 0.35, 7.5, 0.75, [0.55, 0.56, 0.57]);   // a transformer can
    }
    for (let q = 0; q < row.length - 1; q++) for (const dz of [-0.85, 0, 0.85]) {
      const xa = row[q], xb = row[q + 1], N = 10;
      for (let k = 0; k < N; k++) {
        const u0 = k / N, u1 = (k + 1) / N, sag = u => 0.55 * 4 * u * (1 - u);
        wires.push(lerp(xa, xb, u0), ARM - sag(u0), pz + dz, lerp(xa, xb, u1), ARM - sag(u1), pz + dz);
      }
    }
  }
  function geo(b) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    g.setAttribute('aPos0', new THREE.Float32BufferAttribute(b.p0, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
    g.setAttribute('aNor0', new THREE.Float32BufferAttribute(b.n0, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setAttribute('aHouse', new THREE.Float32BufferAttribute(b.h, 4));
    g.setAttribute('aLy', new THREE.Float32BufferAttribute(b.ly, 1));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
    g.computeBoundingSphere();
    return g;
  }

  // ---------- materials: clay → texture behind the spreading front; roofs fold; windows light ----------
  const VERT_HEAD = /* glsl */`
attribute vec3 aPos0; attribute vec3 aNor0; attribute vec4 aHouse; attribute float aLy;
varying vec3 vW; varying float vLit; varying float vLy; varying float vTint;
uniform float uTime;
float foldK() { float k = clamp((uTime - aHouse.x + 0.03) / 0.22, 0.0, 1.0); return 1.0 - pow(1.0 - k, 3.0); }`;
  function morph(mat, { glow = false, ground = false, roof = false } = {}) {
    // every variant compiles its own program (onBeforeCompile bodies share one source string)
    mat.customProgramCacheKey = () => `town-${glow ? 'g' : ''}${ground ? 'G' : ''}${roof ? 'r' : ''}${mat.map ? 'm' : ''}${mat.vertexColors ? 'c' : ''}`;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      if (ground) {
        sh.uniforms.uClayMap = { value: groundClay }; sh.uniforms.uRoad = { value: roadTex };
        sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      } else {
        sh.vertexShader = VERT_HEAD + '\n' + sh.vertexShader
          .replace('#include <beginnormal_vertex>', 'float kR = foldK();\nvec3 objectNormal = normalize(mix(aNor0, normal, kR));')
          .replace('#include <begin_vertex>', 'vec3 transformed = mix(aPos0, position, kR);\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz; vLit = clamp((uTime - aHouse.y) / 0.12, 0.0, 1.0); vLy = aLy; vTint = aHouse.z;');
      }
      sh.fragmentShader = (ground ? 'varying vec3 vW;\nuniform sampler2D uClayMap; uniform sampler2D uRoad;\n' : 'varying vec3 vW; varying float vLit; varying float vLy; varying float vTint;\n')
        + 'uniform sampler2D uGlow; uniform vec3 uClay; uniform vec3 uEdge; uniform vec3 uWarm;\n' + GLSL_FIELD + '\n' + sh.fragmentShader
          .replace('#include <map_fragment>', ground ? /* glsl */`
float Tf = fieldT(vW.xz); float kT = smoothstep(0.0, 0.05, uTime - Tf);
diffuseColor.rgb *= mix(texture2D(uClayMap, vMapUv).rgb, texture2D(map, vMapUv).rgb, kT);` : /* glsl */`
float Tf = fieldT(vW.xz); float kT = smoothstep(0.0, 0.05, uTime - Tf);
vec3 tex = vec3(1.0);
#ifdef USE_MAP
tex = texture2D(map, vMapUv).rgb * (0.9 + 0.2 * vTint);
#endif
` + (roof ? 'tex = mix(vec3(dot(tex, vec3(0.333))), tex, 0.35) * (vTint > 0.68 ? vec3(1.05, 0.72, 0.58) : vec3(0.78, 0.8, 0.84));\n' : '') + `
float ao = mix(0.62, 1.0, smoothstep(0.0, 1.6, vLy));
diffuseColor.rgb *= mix(uClay, tex, kT) * ao;`)
          .replace('#include <color_fragment>', ground ? '#include <color_fragment>' : '#ifdef USE_COLOR\ndiffuseColor.rgb *= mix(vec3(1.0), vColor, kT);\n#endif')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + /* glsl */`
float eb = uTime - Tf;
totalEmissiveRadiance += uEdge * exp(-pow((eb - 0.007) / 0.0055, 2.0)) * 2.4;` + (ground ? `
totalEmissiveRadiance += texture2D(uRoad, vMapUv).rgb * (1.0 - kT) * 1.6;` : '') + (glow ? `
totalEmissiveRadiance += texture2D(uGlow, vMapUv).rgb * uWarm * vLit * kT;` : ''));
    };
    return mat;
  }
  function depthMat() {
    const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = VERT_HEAD + '\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = mix(aPos0, position, foldK());');
    };
    return m;
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
    k.fillStyle = '#4b4e55'; k.fillRect(0, 0, GW, GH);                                  // asphalt
    noise(k, 3, 0.25, '#2c2e33'); noise(k, 4, 0.18, '#777a80');
    for (const [x, z, w, d] of blocks) { k.fillStyle = '#bdb6aa'; rect(k, x - 1.6, z - 1.6, w + 3.2, d + 3.2); }   // sidewalks
    for (const [x, z, w, d] of blocks) {
      k.fillStyle = '#a9a294'; rect(k, x, z, w, d);                                       // lots
      const rr = rng(Math.round(x * 7 + z));
      for (let q = 0; q < 8; q++) { k.fillStyle = rr() < 0.55 ? '#6f7f4c' : '#9a9384'; rect(k, x + (q % 4) * LOT + 0.6, z + (q < 4 ? 0.3 : BD - 2.1), LOT - 1.2, 1.8); }
    }
    noise(k, 5, 0.2, '#ffffff', 1);
    // centre lines and crosswalks
    k.strokeStyle = 'rgba(230,214,150,0.55)'; k.lineWidth = 0.18 * mpx; k.setLineDash([3 * mpx, 3 * mpx]);
    for (let j = BJ[0] - 1; j <= BJ[1]; j++) { k.beginPath(); const [a, b] = toPx(GX[0], street(j)); k.moveTo(a, b); k.lineTo(GW, b); k.stroke(); }
    k.setLineDash([]); k.fillStyle = 'rgba(235,235,230,0.7)';
    for (let i = BI[0] - 1; i <= BI[1]; i++) for (let j = BJ[0] - 1; j <= BJ[1]; j++) for (let q = 0; q < 6; q++) rect(k, cross(i) - 3.5 + q * 1.3, street(j) - 5.6, 0.6, 2.2);
    ao(k);
  });
  const groundClay = canvasTex(k => {
    k.fillStyle = '#cdc5b8'; k.fillRect(0, 0, GW, GH);
    for (const [x, z, w, d] of blocks) { k.fillStyle = '#e3dccf'; rect(k, x - 1.6, z - 1.6, w + 3.2, d + 3.2); }
    noise(k, 6, 0.08, '#8a8070', 2);
    ao(k);
  });
  const roadTex = canvasTex(k => {
    k.fillStyle = '#000'; k.fillRect(0, 0, GW, GH);
    k.strokeStyle = 'rgba(120,200,255,0.55)'; k.lineWidth = 0.35 * mpx; k.shadowColor = 'rgba(120,200,255,0.9)'; k.shadowBlur = 1.5 * mpx;
    for (let j = BJ[0] - 1; j <= BJ[1]; j++) { k.beginPath(); const [a, b] = toPx(GX[0], street(j)); k.moveTo(a, b); k.lineTo(GW, b); k.stroke(); }
    for (let i = BI[0] - 1; i <= BI[1]; i++) { k.beginPath(); const [a, b] = toPx(cross(i), GZ[0]); k.moveTo(a, b); k.lineTo(a, GH); k.stroke(); }
  });
  const flatTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d');
    k.fillStyle = '#5b7a62'; k.fillRect(0, 0, 256, 256); const rr = rng(9);
    for (let i = 0; i < 40; i++) { k.fillStyle = `rgba(${rr() < 0.5 ? '40,60,45' : '150,170,140'},${0.06 + rr() * 0.1})`; k.beginPath(); k.ellipse(rr() * 256, rr() * 256, 10 + rr() * 40, 6 + rr() * 20, rr() * 3, 0, 7); k.fill(); }
    k.strokeStyle = 'rgba(30,40,30,0.25)'; k.lineWidth = 3; k.strokeRect(2, 2, 252, 252);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

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
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), std({ color: 0x8e8a84, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.06; outer.receiveShadow = true;
  scene.add(outer);
  const mk = (b, mat) => { const m = new THREE.Mesh(geo(b), mat); m.castShadow = m.receiveShadow = true; m.customDepthMaterial = depthMat(); m.frustumCulled = false; scene.add(m); return m; };
  mk(B.wall, morph(std({ map: atlas, roughness: 0.85 }), { glow: true }));
  mk(B.roof, morph(std({ map: roofTex, roughness: 0.55 }), { roof: true }));
  mk(B.flat, morph(std({ map: flatTex, roughness: 0.8 }), {}));
  mk(B.trim, morph(std({ roughness: 0.8, vertexColors: true }), {}));

  // wires appear once their street has been reached by the change (in the clay model there are none)
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
  scene.add(new THREE.LineSegments(wg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vW;\n' + GLSL_FIELD + '\nvoid main(){ float k = smoothstep(0.05, 0.2, uTime - fieldT(vW.xz)); if (k <= 0.0) discard; gl_FragColor = vec4(vec3(0.09, 0.09, 0.1), 0.85 * k); }',
  })));
  // trees in the front yards (cut-out sprites): only for the low shots, they fade out as the camera climbs
  const treeMats = await Promise.all(['trees_0.png', 'trees_1.png', 'trees_2.png'].map(f => new Promise(res => loader.load('../assets/gen/' + f, t => {
    t.colorSpace = THREE.SRGBColorSpace;
    res(new THREE.SpriteMaterial({ map: t, alphaTest: 0.5, color: 0x9a98a6, fog: true, transparent: true }));
  }))));
  const ASPECT = [403 / 431, 405 / 431, 190 / 452];
  const trees = new THREE.Group(); scene.add(trees);
  { const rr = rng(77);
    for (let i = BI[0]; i <= BI[1]; i++) for (let j = BJ[0]; j <= BJ[1]; j++) for (const row of [0, 1]) for (let k = 0; k <= 4; k++) {
      const tx = i * PX - BL / 2 + k * LOT, tz = j * PZ + (row ? 1 : -1) * (BD / 2 - 1.1);
      if (rr() < 0.45 || (tx > 22 && Math.abs(tz - street(0)) < 9)) continue;   // keep the low shot's foreground clear
      const v = rr() < 0.75 ? Math.floor(rr() * 2) : 2, h = v === 2 ? 5.6 + rr() * 1.2 : 4.2 + rr() * 1.4;
      const sp = new THREE.Sprite(treeMats[v]); sp.center.set(0.5, 0.02);
      sp.scale.set(h * ASPECT[v], h, 1);
      sp.position.set(tx, 0, tz);
      trees.add(sp);
    } }
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
  const sun = new THREE.DirectionalLight(0xffc49a, 2.6);
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
    { t: 11.6, tg: [-40, 0, -14], yaw: -4, pitch: 89, dist: 250, fov: 22 },
    { t: 12.0, tg: [-34, 0, -10], yaw: -1, pitch: 88.5, dist: 236, fov: 22, e: E.inOutSine },
    { t: 12.95, tg: [24, 0, 20], yaw: 30, pitch: 40, dist: 175, fov: 30, e: E.inOutCubic },
    { t: 13.12, tg: [30, 0, 22], yaw: 35, pitch: 37, dist: 165, fov: 30, e: E.outSine || (x => Math.sin(x * Math.PI / 2)) },
    { t: 13.38, tg: [-30, 4.5, street(0) - 0.8], yaw: 90, pitch: -1, dist: 76, fov: 34, e: E.inOutExpo },
    { t: 14.0, tg: [-42, 4.5, street(0) - 0.8], yaw: 90, pitch: -1, dist: 70, fov: 34, e: E.inOutSine },
    { t: 14.6, tg: [-10, 0, 8], yaw: 90, pitch: 88, dist: 430, fov: 26, e: E.inOutCubic },
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
    const tk = clamp((28 - P.pitch) / 12);
    trees.visible = tk > 0.01; treeMats.forEach(m => { m.opacity = tk; });
    // sun: shadows framed on what the camera sees
    const ext = clamp(P.dist * 0.5, 55, 220);
    sun.target.position.copy(tg).setY(0);
    sun.position.copy(sun.target.position).addScaledVector(SUN, 600);
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 100, far: 1200 });
    sun.shadow.camera.updateProjectionMatrix();
    // route
    const s = headS(t), [hx, hz] = at(s), on = t > RT.a - 0.1 && t < RT.b + 0.6;
    RU.uHead.value = t < RT.a ? 0 : s;
    head.visible = on; head.position.set(hx, 2.2, hz);
    const hs = 11 * (1 + 0.12 * Math.sin(t * 40)) * (t > RT.b ? 1 - prog(t, RT.b, RT.b + 0.6) : 1);
    head.scale.set(hs, hs, 1);
    headLight.position.set(hx, 6, hz); headLight.intensity = on ? 1600 * (t > RT.b ? 1 - prog(t, RT.b, RT.b + 0.6) : 1) : 0;
  }

  return { scene, camera, update, houses, fieldT, headS, at, L };
}
