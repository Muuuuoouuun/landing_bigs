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
    // (v8.2) out of the screen and down to desk height: a low diagonal view across the desk — the tablet in the
    // foreground, the whale big in the middle as it stands up off the glass, the window glowing behind — then after
    // the whale, through the room to the window
    { t: T.lift + 0.5, x: 1120, y: 120, z: 300, s: 1.05, rx: 72, ry: 0, rz: 0, yaw: -24, d: 1450, e: E.inOutCubic },
    { t: T.window - 0.3, x: 1180, y: -520, z: 820, s: 0.95, rx: 82, ry: 0, rz: 0, yaw: -10, d: 1550, e: E.inOutSine },
    { t: T.window + 0.5, x: 1308, y: -880, z: 1060, s: 2.6, rx: 88, ry: 0, rz: 0, yaw: 0, d: 1700, e: E.inCubic },
  ]);
  const room = t > T.lift ? 1 : 0;
  c.rx += 1.2 * drift(t, 3.1, 0.11) * room;
  c.ry += 1.6 * drift(t, 0.7, 0.09) * room;
  c.d = c.d ?? 1700;
  return c;
}
