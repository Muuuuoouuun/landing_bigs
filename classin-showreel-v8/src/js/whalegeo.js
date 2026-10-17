// The whale's geometry (no scene dependencies): the outline traced from the generated light-whale picture
// (render/whale_trace.py), in local units — nose at x = -240, fluke tip at x = +240, y down.
import { catmull } from './core.js';
import WH from '../assets/gen/whale.js';

const G = WH.glow;
export const WHALE_EYE = G.eye;
export function whaleBody() { return [...G.body, G.body[0]]; }
const ring = (c, r, n = 17) => Array.from({ length: n }, (_, i) => { const a = (i / (n - 1)) * Math.PI * 2; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
// stroke 0 is the silhouette (closed); then the flipper's edge, the jaw and the eye
export function whaleStrokes() {
  return [{ pts: whaleBody() }, { pts: catmull(G.flipper, 6) }, { pts: catmull(G.jaw, 6) }, { pts: ring(G.eye, 4.5) }];
}
// swimming: a travelling wave that grows towards the flukes (vertical offset in local units)
export function swimDy(t, amp = 1) {
  return x => { const k = Math.max(0, (x + 120) / 360); return amp * Math.sin(t * 4.2 - x * 0.012) * 14 * k * k; };
}
export function swim(t, amp = 1) { const f = swimDy(t, amp); return ([x, y]) => [x, y + f(x)]; }
