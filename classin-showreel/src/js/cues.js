// Sound cue sheet — every visible move gets a sound. Built from the same timeline/beats the
// scenes animate with, exported by the renderer to out/cues.json and synthesised by render/audio.py.

export function buildCues(T) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // S1 the book: a drop of light, the pages riffle, the light reads, the words lift
  add(0, 'reverse', { dur: T.drip, gain: 0.35 });
  add(T.drip, 'drop', { gain: 0.9 });
  add(T.drip + 0.02, 'shimmer', { dur: 0.9, gain: 0.14 });
  [T.flip1, T.flip2, T.flip3].forEach((t, i) => add(t - 0.06, 'page', { dur: 0.42, gain: 0.55 - i * 0.05, pan: 0.3 - i * 0.2, seed: 3 + i }));
  add(T.settle - 0.02, 'thump', { gain: 0.35, f: 120 });
  add(T.readA, 'chalk', { dur: T.readB - T.readA, gain: 0.18 });
  add(T.liftA, 'air', { dur: T.liftB - T.liftA, gain: 0.22 });
  for (let i = 0; i < 10; i++) add(T.liftA + 0.1 + i * 0.13, 'pluck', { gain: 0.1 + (i % 3) * 0.03, semi: [0, 4, 7, 12, 9, 14, 16, 19, 12, 21][i], pan: Math.sin(i * 1.9) * 0.6 });
  add(T.liftB - 0.6, 'riser', { dur: 0.6, gain: 0.3 });
  // S2 the brain: the words arrive on the beat, the folds are traced, impulses fire
  add(T.drop, 'boom', { gain: 0.65 });
  add(T.drop, 'whoosh', { dur: 0.7, gain: 0.45, f0: 500, f1: 3200 });
  for (let i = 0; i < 4; i++) add(T.drop + 0.6 * (i + 1), 'tick', { gain: 0.22, seed: 20 + i, bright: 1.3 });
  for (let i = 0; i < 12; i++) add(T.arriveA + 0.35 + (i * (T.arriveB - T.arriveA - 0.35)) / 12, 'pop', { gain: 0.12, pitch: 0.9 + (i % 4) * 0.12 });
  add(T.outlineA, 'zip', { dur: T.outlineB - T.outlineA, gain: 0.26, f0: 500, f1: 1600 });
  [T.fire1, T.fire2].forEach((t, i) => { add(t, 'synapse', { gain: 0.5 + i * 0.1, seed: 40 + i }); add(t, 'pluck', { gain: 0.24, semi: 12 + i * 2 }); });
  add(T.spark - 0.35, 'riser', { dur: 0.35, gain: 0.3 });
  add(T.spark, 'chime', { gain: 0.5, soft: 1 });
  add(T.spark, 'synapse', { gain: 0.7, seed: 44 });
  // S3 imagination: each drawing gets its own little phrase
  [['rocket', 0], ['planet', 4], ['whale', 7], ['tree', 9], ['plane', 12]].forEach(([k, s], i) => {
    add(T[k], 'whoosh', { dur: 0.45, gain: 0.25, f0: 700, f1: 2600, pan: i % 2 ? 0.5 : -0.5 });
    add(T[k] + 0.35, 'pencil', { dur: 0.95, gain: 0.2, seed: 50 + i });
    add(T[k] + 1.3, 'pluck', { gain: 0.26, semi: s + 2, pan: i % 2 ? 0.4 : -0.4 });
  });
  add(T.lift, 'shimmer', { dur: 1.4, gain: 0.22 });
  for (let i = 0; i < 8; i++) add(T.stars + i * 0.12, 'tick', { gain: 0.12, seed: 70 + i, bright: 1.8 });
  add(T.seed, 'reverse', { dur: 0.5, gain: 0.35 });
  add(T.scatter, 'whoosh', { dur: 0.8, gain: 0.5, f0: 2600, f1: 400, big: 1 });
  // S4 homes: every window that lights gets a soft note; push in; the class; pull out
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  for (let i = 0; i < 14; i++) add(T.landA + ((T.landB - T.landA) * i) / 14 + 0.05, 'pluck', { gain: 0.13 + 0.07 * (i % 3 === 0), semi: scale[i % scale.length], pan: Math.sin(i * 1.3) * 0.7 });
  add(T.pushA, 'whoosh', { dur: T.window - T.pushA + 0.1, gain: 0.4, f0: 400, f1: 2200 });
  add(T.window, 'thump', { gain: 0.3, f: 110 });
  add(T.tablet, 'notif', { gain: 0.32 });
  add(T.tablet + 0.1, 'pencil', { dur: 0.9, gain: 0.18, seed: 80 });
  add(T.thought, 'pop', { gain: 0.3, pitch: 1.2 });
  add(T.thought + 0.1, 'pluck', { gain: 0.22, semi: 14 });
  add(T.pullA, 'whoosh', { dur: 0.9, gain: 0.4, f0: 2400, f1: 500 });
  add(T.pullA + 0.4, 'shimmer', { dur: 1.4, gain: 0.2 });
  add(T.liftOff - 0.3, 'air', { dur: 0.8, gain: 0.25 });
  // S5 tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.26, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.24, pan: [-0.5, 0.4] });
  add(T.underA, 'marker', { dur: 0.32, gain: 0.35, seed: 90 });
  add(T.underA + 0.3, 'marker', { dur: T.underB - T.underA - 0.25, gain: 0.35, seed: 91 });
  add(T.glowA, 'shimmer', { dur: 0.8, gain: 0.22 });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.75 });
  add(T.conv, 'converge', { dur: T.hero - T.conv, gain: 0.5 });
  // S6 hero — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 0.95 });
  add(T.hero + 0.08, 'pencil', { dur: T.traceB - T.hero, gain: 0.16, seed: 99 });
  add(T.traceB, 'ink', { dur: T.fillB - T.traceB + 0.3, gain: 0.3 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.22 });
  add(T.dot, 'ping', { gain: 0.32 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.28, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.2 });
  return c.sort((a, b) => a.t - b.t);
}
