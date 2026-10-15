// Sound cue sheet — every visible move gets a sound. Built from the same timeline/beats the
// scenes animate with, exported by the renderer to out/cues.json and synthesised by render/audio.py.
import { routeTimes } from './scenes/map.js';

export function buildCues(T, copy) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // S1 slam
  add(0, 'reverse', { dur: T.slam, gain: 0.9 });
  add(T.slam, 'slam');
  add(T.revealA, 'swipe', { dur: T.revealB - T.revealA, gain: 0.7, pan: [-0.6, 0.6] });
  add(T.logoUp, 'whoosh', { dur: 0.6, gain: 0.35, f0: 1800, f1: 700 });
  // S2 console
  add(T.peel, 'whoosh', { dur: 0.65, gain: 0.5, f0: 2400, f1: 500, pan: [0.1, -0.2] });
  add(T.consoleLand, 'thump', { gain: 0.9 });
  add(T.consoleLand, 'zip', { dur: 0.18, gain: 0.45 });
  const n = [...copy.typed].length;
  for (let i = 0; i < n; i++) add(T.typeA + (i * (T.typeB - T.typeA)) / n, 'tick', { gain: 0.42, seed: i });
  for (let i = 0; i < 3; i++) add(T.typeA + 0.3 + i * 0.07, 'pop', { gain: 0.22, pitch: 1 + i * 0.12 });
  for (let i = 0; i < 6; i++) add(T.cardsA + i * 0.055 + 0.04, 'swipe', { dur: 0.32, gain: 0.32, pan: [i % 2 ? 0.5 : -0.5, 0] });
  add(T.cardsB - 0.05, 'thump', { gain: 0.35, f: 120 });
  add(T.cardsB, 'zip', { dur: 0.42, gain: 0.35, f0: 500, f1: 1600 });
  add(4.86, 'whoosh', { dur: 0.45, gain: 0.35, f0: 1400, f1: 600 });
  for (let i = 0; i < copy.branches.length + 1; i++) add(T.checksA + 0.08 + i * 0.062, 'tick', { gain: 0.3, seed: 40 + i, bright: 1.4 });
  add(5.3, 'whoosh', { dur: 0.3, gain: 0.25, f0: 900, f1: 1800 });
  add(T.fillA, 'riser', { dur: T.fillB - T.fillA, gain: 0.45 });
  add(T.tap, 'click', { gain: 0.9 });
  add(T.success, 'chime', { gain: 0.55 });
  add(T.shoot, 'whoosh', { dur: 0.62, gain: 0.85, f0: 400, f1: 5200, big: 1 });
  // S4 map
  add(T.drop, 'boom', { gain: 1 });
  add(T.drop + 0.02, 'shimmer', { dur: 1.2, gain: 0.25 });
  add(7.3, 'whoosh', { dur: 1.1, gain: 0.3, f0: 600, f1: 300, pan: [-0.4, 0.4] });
  const scale = [0, 2, 4, 7, 9, 12, 14, 16];
  routeTimes(T).forEach((r, k) => {
    if (r.n.tier <= 1) add(r.t1, 'pluck', { gain: 0.4, semi: scale[k % scale.length], pan: (r.n.x / 1000 - 0.5) * 1.2 });
    else if (r.n.tier === 2) add(r.t1, 'pluck', { gain: 0.18, semi: scale[(k + 3) % scale.length] + 12, pan: (r.n.x / 1000 - 0.5) * 1.2 });
    else if (k % 3 === 0) add(r.t1, 'tick', { gain: 0.12, seed: 90 + k, bright: 2 });
  });
  add(T.routesB + 0.3, 'chime', { gain: 0.3, soft: 1 });
  add(T.dive, 'whoosh', { dur: 0.65, gain: 0.7, f0: 300, f1: 3000, big: 1 });
  // S5 classroom
  add(T.classIn - 0.05, 'shimmer', { dur: 0.8, gain: 0.25 });
  add(10.85, 'chalk', { dur: 0.4, gain: 0.3 });
  add(11.25, 'chalk', { dur: 0.3, gain: 0.32 });
  add(T.wrapA, 'whoosh', { dur: T.land - T.wrapA, gain: 0.45, f0: 700, f1: 2200, pan: [-0.7, 0.7] });
  add(T.land, 'zip', { dur: 0.16, gain: 0.5, f0: 900, f1: 2600 });
  add(T.land, 'thump', { gain: 0.35, f: 160 });
  add(T.lift, 'pluck', { gain: 0.45, semi: 19 });
  add(T.trophyA, 'swipe', { dur: T.trophyB - T.trophyA, gain: 0.35, pan: [0.2, -0.3] });
  add(T.trophyB, 'reward', { gain: 0.7 });
  add(T.wallA, 'whoosh', { dur: 1.0, gain: 0.45, f0: 2200, f1: 400 });
  for (let i = 0; i < 16; i++) {
    const dist = Math.hypot((i % 4) - 1, Math.floor(i / 4) - 1);
    if (i !== 5) add(T.wallA + 0.25 + dist * 0.12, 'tick', { gain: 0.14, seed: 200 + i, bright: 1.6 });
  }
  add(T.notify, 'notif', { gain: 0.6 });
  add(T.notify2, 'notif', { gain: 0.5, pitch: 1.12 });
  add(T.gatherA - 0.1, 'whoosh', { dur: 0.65, gain: 0.6, f0: 3000, f1: 300, big: 1 });
  // S6 dashboard
  add(T.dashIn, 'thump', { gain: 0.6, f: 90 });
  add(T.dashIn, 'shimmer', { dur: 0.7, gain: 0.2 });
  for (let i = 0; i < 12; i++) add(15.05 + i * 0.058, 'tick', { gain: 0.12, seed: 300 + i, bright: 1.8 });
  add(T.alert, 'blip', { gain: 0.4 });
  add(T.resolved, 'chime', { gain: 0.45 });
  add(T.push, 'whoosh', { dur: 0.75, gain: 0.55, f0: 500, f1: 2600 });
  // S7 tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.28, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.26, pan: [-0.5, 0.3] });
  add(T.underA, 'swipe', { dur: T.underB - T.underA, gain: 0.5, pan: [-0.3, 0.4] });
  add(T.morphA, 'shimmer', { dur: 0.7, gain: 0.3 });
  add(T.morphB, 'swipe', { dur: T.joinB - T.morphB, gain: 0.45, pan: [-0.4, 0.3] });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.8 });
  add(T.conv, 'converge', { dur: T.hero - T.conv, gain: 0.5 });
  // S8 hero — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 1 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.25 });
  add(T.shineB, 'whoosh', { dur: 0.5, gain: 0.18, f0: 1200, f1: 400 });
  add(T.dot, 'ping', { gain: 0.35 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.3, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.22 });
  return c.sort((a, b) => a.t - b.t);
}
