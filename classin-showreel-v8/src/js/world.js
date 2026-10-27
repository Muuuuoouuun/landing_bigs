// The room camera (v8): from the dive (T.dive) the camera sits square over the tablet so its screen is the frame;
// small pushes into the seats and the board while the class plays; at T.lift it comes out of the screen to a low
// diagonal view across the desk (v8.2) and follows the whale to the window on the far wall. Every hand-over is a camera move, not a cut.
import { keyed, drift, E } from './core.js';
import { TABLET, SCREEN_SCALE, classToWorld } from './scenes/room.js';

const at = (px, py, s) => { const p = classToWorld([px, py], 0); return { x: p[0], y: p[1], z: 0, s: SCREEN_SCALE * s, rx: 0, ry: 0, rz: -TABLET.rz, yaw: 0, d: 1700 }; };

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
    // (v8.3) out of the screen to a three-quarter view: the class's pieces fan out around the tablet, the whale rises
    // through them; a slow orbit; then straight down as they lie flat into the grid that becomes the town
    { t: T.lift + 0.55, x: TABLET.x, y: TABLET.y - 120, z: 210, s: 1.3, rx: 44, ry: 0, rz: 0, yaw: -20, d: 1500, e: E.inOutCubic },
    { t: T.window - 0.5, x: TABLET.x, y: TABLET.y - 120, z: 220, s: 1.22, rx: 38, ry: 0, rz: 0, yaw: 12, d: 1500, e: E.inOutSine },
    { t: T.window + 0.05, x: TABLET.x, y: TABLET.y, z: 0, s: 3.1, rx: 0, ry: 0, rz: -TABLET.rz, yaw: 0, d: 1700, e: E.inOutCubic }, // TABLET.x/y is its centre
  ]);
  const room = t > T.lift ? 1 : 0;
  c.rx += 1.2 * drift(t, 3.1, 0.11) * room;
  c.ry += 1.6 * drift(t, 0.7, 0.09) * room;
  c.d = c.d ?? 1700;
  return c;
}
