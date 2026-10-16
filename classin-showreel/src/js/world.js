// One continuous camera for the first two thirds of the film: Seo-yun's desk at night (z = 0) with the
// notebook, the open book and the tablet; the knowledge rising off the pages; the brain they build (a
// plane floating at z = ZB above the book) and the whale imagined beside it; then the dive into the
// tablet and the pull back out into the room. Every handover is a camera move, not a cut.
import { keyed, drift, E } from './core.js';
import { NOTE, TABLET } from './scenes/book.js';

export const ZB = 900; // height of the brain plane above the book

export function worldCam(t, T) {
  const c = keyed(t, [
    { t: 0, x: NOTE.x + 40, y: NOTE.y - 40, z: 0, s: 1.7, rx: 16, ry: -2, rz: -4 },
    { t: T.writeB, x: NOTE.x + 70, y: NOTE.y + 10, z: 0, s: 1.6, rx: 20, ry: 2, rz: -3, e: E.inOutSine },
    { t: T.jump, x: NOTE.x + 90, y: NOTE.y, z: 0, s: 1.45, rx: 22, ry: 2, rz: -3, e: E.inOutSine },
    { t: T.flip1 + 0.1, x: 30, y: 10, z: 0, s: 1.0, rx: 32, ry: 0, rz: -2, e: E.inOutCubic },
    { t: T.settle, x: 0, y: 10, z: 0, s: 1.05, rx: 34, ry: 0, rz: -2, e: E.inOutSine },
    { t: T.readA + 0.15, x: -120, y: -30, z: 0, s: 1.2, rx: 38, ry: 3, rz: -1, e: E.inOutCubic },
    { t: T.readB, x: 140, y: 0, z: 0, s: 1.22, rx: 38, ry: -3, rz: 0, e: E.inOutSine },
    { t: T.liftB, x: 0, y: -30, z: 420, s: 0.98, rx: 16, ry: 4, rz: 0, e: E.inOutCubic },
    { t: T.arriveB, x: 0, y: 0, z: ZB, s: 1.0, rx: 5, ry: -5, rz: 0, e: E.inOutCubic },
    { t: T.spark, x: 0, y: 0, z: ZB, s: 1.1, rx: 0, ry: 0, rz: 0, e: E.inOutSine },
    { t: T.whaleB, x: 300, y: -30, z: ZB, s: 0.74, rx: -2, ry: 5, rz: 0, e: E.inOutCubic },
    { t: T.lift - 0.15, x: 330, y: -10, z: ZB, s: 0.8, rx: 0, ry: 3, rz: 0, e: E.inOutSine },
    // the tablet on the desk wakes: dive down into it
    { t: T.enter, x: TABLET.x, y: TABLET.y, z: 0, s: 3.05, rx: 4, ry: 0, rz: -TABLET.rz, e: E.inOutCubic },
    { t: T.exitA, x: TABLET.x, y: TABLET.y, z: 0, s: 3.05, rx: 4, ry: 0, rz: -TABLET.rz },
    // pull back out into the room; the window on the far wall
    { t: T.window - 0.2, x: 420, y: -520, z: 300, s: 0.6, rx: 12, ry: 0, rz: 0, e: E.inOutCubic },
    { t: T.window + 0.4, x: 260, y: -900, z: 900, s: 0.9, rx: 4, ry: 0, rz: 0, e: E.inCubic },
  ]);
  const still = t > T.enter - 0.3 && t < T.exitA + 0.3 ? 0 : 1;
  c.rx += 1.2 * drift(t, 3.1, 0.11) * still;
  c.ry += 1.6 * drift(t, 0.7, 0.09) * still;
  c.d = 1700;
  return c;
}
