// One continuous camera for the first half of the film: the open book on the desk (z = 0), the
// knowledge rising off its pages, the brain they build (a plane floating at z = ZB above the book)
// and the imagination that blooms around it. Book, brain and imagination all draw through it, so the
// handovers are camera moves, not cuts.
import { keyed, drift, E } from './core.js';

export const ZB = 900; // height of the brain plane above the book

export function worldCam(t, T, P) {
  const k = P ? 0.9 : 1; // book framing in portrait
  const kn = P ? 0.98 : 1; // brain framing in portrait
  const c = keyed(t, [
    { t: 0, x: 120, y: -40, z: 0, s: 1.75 * k, rx: 16, ry: -4, rz: -6 },
    { t: T.drip + 0.1, x: 110, y: -30, z: 0, s: 1.6 * k, rx: 18, ry: -4, rz: -5, e: E.outCubic },
    { t: T.settle, x: 0, y: 10, z: 0, s: 1.05 * k, rx: 34, ry: 0, rz: -2, e: E.inOutCubic },
    { t: T.readA + 0.2, x: P ? -190 : -150, y: -40, z: 0, s: (P ? 1.3 : 1.18) * k, rx: 38, ry: 3, rz: -1, e: E.inOutCubic },
    { t: T.readB, x: P ? 190 : 150, y: 20, z: 0, s: (P ? 1.3 : 1.2) * k, rx: 40, ry: -3, rz: 0, e: E.inOutSine },
    { t: T.liftB, x: 0, y: -30, z: 420, s: 0.98 * k, rx: 16, ry: 4, rz: 0, e: E.inOutCubic },
    { t: T.arriveB, x: 0, y: 0, z: ZB, s: 1.0 * kn, rx: 5, ry: -5, rz: 0, e: E.inOutCubic },
    { t: T.spark, x: 0, y: 0, z: ZB, s: 1.1 * kn, rx: 0, ry: 0, rz: 0, e: E.inOutSine },
    { t: T.lift, x: 0, y: -20, z: ZB, s: P ? 0.5 : 0.6, rx: -2, ry: 4, rz: 0, e: E.inOutCubic },
    { t: T.seed, x: 0, y: 0, z: ZB, s: P ? 0.47 : 0.56, rx: 1, ry: -3, rz: 0, e: E.inOutSine },
    { t: T.scatter + 0.5, x: 0, y: 1500, z: ZB, s: P ? 0.47 : 0.56, rx: 18, ry: -2, rz: 0, e: E.inCubic },
  ]);
  c.rx += 1.2 * drift(t, 3.1, 0.11);
  c.ry += 1.6 * drift(t, 0.7, 0.09);
  c.d = 1700;
  return c;
}
