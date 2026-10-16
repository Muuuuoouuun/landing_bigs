// One continuous camera for the first half of the film: Seo-yun's desk at night (z = 0) with the notebook,
// the open book and the tablet; the words rising off the pages into a whale floating above the book (plane
// z = ZB); the dive into the tablet and the pull back out into the room, to the window. Every handover is a
// camera move, not a cut.
import { keyed, drift, E } from './core.js';
import { NOTE, TABLET } from './scenes/book.js';

export const ZB = 900; // height of the whale plane above the book

export function worldCam(t, T) {
  const c = keyed(t, [
    { t: 0, x: NOTE.x + 60, y: NOTE.y - 60, z: 0, s: 1.8, rx: 16, ry: -2, rz: -4 },
    { t: T.land, x: NOTE.x + 50, y: NOTE.y - 40, z: 0, s: 1.7, rx: 18, ry: -1, rz: -4, e: E.outCubic },
    { t: T.writeB, x: NOTE.x + 80, y: NOTE.y + 10, z: 0, s: 1.6, rx: 20, ry: 2, rz: -3, e: E.inOutSine },
    { t: T.jump, x: NOTE.x + 100, y: NOTE.y, z: 0, s: 1.5, rx: 22, ry: 2, rz: -3, e: E.inOutSine },
    { t: T.flip1 + 0.15, x: 40, y: 10, z: 0, s: 1.02, rx: 32, ry: 0, rz: -2, e: E.inOutCubic },
    { t: T.settle, x: 0, y: 10, z: 0, s: 1.06, rx: 34, ry: 0, rz: -1, e: E.inOutSine },
    { t: T.gatherB, x: 20, y: -10, z: ZB, s: 0.98, rx: 6, ry: -5, rz: 0, e: E.inOutCubic },
    { t: T.stall, x: 20, y: -60, z: ZB, s: 1.05, rx: 2, ry: 2, rz: 0, e: E.inOutSine },
    { t: T.dotDrop, x: 0, y: -40, z: ZB, s: 1.1, rx: 0, ry: 0, rz: 0, e: E.inOutSine },
    // the tablet on the desk wakes: dive down into it
    { t: T.enter, x: TABLET.x, y: TABLET.y, z: 0, s: 3.05, rx: 4, ry: 0, rz: -TABLET.rz, e: E.inOutCubic },
    { t: T.exitA, x: TABLET.x, y: TABLET.y, z: 0, s: 3.05, rx: 4, ry: 0, rz: -TABLET.rz },
    // pull back out into the room; the window on the far wall
    { t: T.window - 0.3, x: 700, y: -420, z: 520, s: 0.52, rx: 52, ry: 0, rz: 0, e: E.inOutCubic },
    { t: T.window + 0.5, x: 1308, y: -880, z: 1060, s: 2.6, rx: 88, ry: 0, rz: 0, e: E.inCubic },
  ]);
  const still = t > T.enter - 0.3 && t < T.exitA + 0.3 ? 0 : 1;
  c.rx += 1.2 * drift(t, 3.1, 0.11) * still;
  c.ry += 1.6 * drift(t, 0.7, 0.09) * still;
  c.d = 1700;
  return c;
}
