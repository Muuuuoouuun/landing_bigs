// The room camera (v8): from the dive (T.dive) the camera sits square over the tablet so its screen is the frame;
// small pushes into the seats and the board while the class plays; at T.lift it pulls back out into the room and
// climbs to the window on the far wall. Every hand-over is a camera move, not a cut.
import { keyed, drift, E } from './core.js';
import { TABLET, SCREEN_SCALE, classToWorld } from './scenes/room.js';

const at = (px, py, s) => { const p = classToWorld([px, py], 0); return { x: p[0], y: p[1], z: 0, s: SCREEN_SCALE * s, rx: 0, ry: 0, rz: -TABLET.rz }; };

export function worldCam(t, T) {
  const c = keyed(t, [
    { t: 0, ...at(960, 540, 1) },
    { t: T.dive, ...at(960, 540, 1) },
    { t: T.whaleDrawB, ...at(960, 540, 1) },
    // quick answer: push into the seats
    { t: T.buzzA + 0.15, ...at(820, 420, 1.32), e: E.inOutCubic },
    { t: T.ding + 0.5, ...at(800, 400, 1.38), e: E.inOutSine },
    // everyone's board
    { t: T.boardsA + 0.2, ...at(900, 560, 1.08), e: E.inOutCubic },
    { t: T.assembleA, ...at(880, 590, 1.12), e: E.inOutSine },
    // the drawing comes together, the light, the whale
    { t: T.assembleB, ...at(860, 560, 1.18), e: E.inOutCubic },
    { t: T.lift, ...at(820, 520, 1.24), e: E.inOutSine },
    // pull back out into the room; the window on the far wall
    { t: T.lift + 0.45, x: TABLET.x - 60, y: TABLET.y + 40, z: 150, s: 1.25, rx: 30, ry: 0, rz: -2, e: E.outCubic },
    { t: T.window - 0.3, x: 700, y: -420, z: 520, s: 0.52, rx: 52, ry: 0, rz: 0, e: E.inOutSine },
    { t: T.window + 0.5, x: 1308, y: -880, z: 1060, s: 2.6, rx: 88, ry: 0, rz: 0, e: E.inCubic },
  ]);
  const room = t > T.lift ? 1 : 0;
  c.rx += 1.2 * drift(t, 3.1, 0.11) * room;
  c.ry += 1.6 * drift(t, 0.7, 0.09) * room;
  c.d = 1700;
  return c;
}
