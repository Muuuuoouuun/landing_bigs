// Sound cue sheet — every visible move gets a sound. Built from the same timeline/beats the
// scenes animate with, exported by the renderer to out/cues.json and synthesised by render/audio.py.

export function buildCues(T) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // S1 night: the spark writes the question, the ? glows, the light leaps into the book
  add(0, 'drop', { gain: 0.5 });
  add(T.writeA, 'pencil', { dur: T.writeB - T.writeA, gain: 0.32, seed: 7 });
  add(T.qmark, 'chime', { gain: 0.35, soft: 1 });
  add(T.jump, 'whoosh', { dur: 0.45, gain: 0.32, f0: 700, f1: 2600, pan: [-0.5, 0.2] });
  [T.flip1, T.flip2, T.flip3].forEach((t, i) => add(t - 0.05, 'page', { dur: 0.36, gain: 0.5 - i * 0.05, pan: 0.3 - i * 0.2, seed: 3 + i }));
  add(T.settle - 0.02, 'thump', { gain: 0.3, f: 120 });
  add(T.readA, 'pencil', { dur: T.readB - T.readA, gain: 0.15, seed: 8 });
  add(T.liftA, 'air', { dur: T.liftB - T.liftA, gain: 0.22 });
  for (let i = 0; i < 8; i++) add(T.liftA + 0.05 + i * 0.09, 'pluck', { gain: 0.1 + (i % 3) * 0.03, semi: [0, 4, 7, 12, 9, 14, 16, 19][i], pan: Math.sin(i * 1.9) * 0.6 });
  add(T.liftB - 0.5, 'riser', { dur: 0.5, gain: 0.28 });
  // S2 the brain
  add(T.drop, 'boom', { gain: 0.65 });
  add(T.drop, 'whoosh', { dur: 0.7, gain: 0.45, f0: 500, f1: 3200 });
  for (let i = 0; i < 12; i++) add(T.arriveA + 0.35 + (i * (T.arriveB - T.arriveA - 0.35)) / 12, 'pop', { gain: 0.12, pitch: 0.9 + (i % 4) * 0.12 });
  add(T.outlineA, 'zip', { dur: T.outlineB - T.outlineA, gain: 0.26, f0: 500, f1: 1600 });
  [T.fire1, T.fire2].forEach((t, i) => { add(t, 'synapse', { gain: 0.5 + i * 0.1, seed: 40 + i }); add(t, 'pluck', { gain: 0.24, semi: 12 + i * 2 }); });
  add(T.spark - 0.35, 'riser', { dur: 0.35, gain: 0.3 });
  add(T.spark, 'chime', { gain: 0.5, soft: 1 });
  add(T.spark, 'synapse', { gain: 0.7, seed: 44 });
  // S3 the whale imagined... and the stall
  add(T.whaleA, 'whoosh', { dur: 0.5, gain: 0.3, f0: 700, f1: 2600, pan: [0, 0.5] });
  add(T.whaleA + 0.2, 'pencil', { dur: T.whaleB - T.whaleA - 0.2, gain: 0.2, seed: 51 });
  [0, 4, 7].forEach((s, i) => add(T.whaleB - 0.3 + i * 0.16, 'pluck', { gain: 0.22, semi: s + 2, pan: 0.3 }));
  add(T.stall, 'stall', { gain: 0.6 });
  add(T.stall + 0.3, 'reverse', { dur: T.lift - T.stall - 0.3, gain: 0.3 });
  // S4 ClassIn: the tablet wakes, the question goes to the teacher, everyone draws, the answer returns
  add(T.tabletOn, 'notif', { gain: 0.5 });
  add(T.lift, 'whoosh', { dur: T.enter - T.lift + 0.1, gain: 0.5, f0: 400, f1: 2600, big: 1 });
  add(T.handup, 'pop', { gain: 0.32, pitch: 0.9 });
  add(T.askA, 'blip', { gain: 0.45 });
  add(T.askA + 0.05, 'zip', { dur: T.askB - T.askA, gain: 0.25, f0: 700, f1: 1800, pan: [-0.2, -0.6] });
  add(T.teachA, 'blip', { gain: 0.35 });
  add(T.teachA, 'chalk', { dur: T.teachB - T.teachA, gain: 0.3 });
  [0, 1, 2, 3].forEach(i => { add(T.friendsA + i * 0.18, 'pluck', { gain: 0.2, semi: [7, 9, 12, 14][i], pan: -0.5 + i * 0.33 }); add(T.friendsA + i * 0.18, 'marker', { dur: 0.5, gain: 0.18, seed: 60 + i }); });
  add(T.returnA + 0.1, 'riser', { dur: T.returnB - T.returnA - 0.1, gain: 0.32 });
  add(T.returnB, 'reward', { gain: 0.7 });
  add(T.swimA, 'whoosh', { dur: 0.5, gain: 0.35, f0: 600, f1: 2400 });
  add(T.exitA, 'whoosh', { dur: 0.8, gain: 0.45, f0: 2400, f1: 500 });
  add(T.window - 0.2, 'air', { dur: 0.8, gain: 0.3 });
  // S5 dawn: every window it passes lights up
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  for (let i = 0; i < 12; i++) add(T.landA + ((T.landB - T.landA) * i) / 12 + 0.05, 'pluck', { gain: 0.13 + 0.07 * (i % 3 === 0), semi: scale[i % scale.length], pan: Math.sin(i * 1.3) * 0.7 });
  add(T.sunrise, 'shimmer', { dur: 1.6, gain: 0.25 });
  add(T.liftOff - 0.3, 'air', { dur: 0.8, gain: 0.25 });
  // S6 tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.26, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.24, pan: [-0.5, 0.4] });
  add(T.underA, 'marker', { dur: 0.32, gain: 0.35, seed: 90 });
  add(T.underA + 0.3, 'marker', { dur: T.underB - T.underA - 0.25, gain: 0.35, seed: 91 });
  add(T.glowA, 'shimmer', { dur: 0.8, gain: 0.22 });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.75 });
  add(T.conv, 'converge', { dur: T.hero - T.conv, gain: 0.5 });
  // S7 hero — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 0.95 });
  add(T.hero + 0.08, 'pencil', { dur: T.traceB - T.hero, gain: 0.16, seed: 99 });
  add(T.traceB, 'ink', { dur: T.fillB - T.traceB + 0.3, gain: 0.3 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.22 });
  add(T.dot, 'ping', { gain: 0.32 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.28, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.2 });
  return c.sort((a, b) => a.t - b.t);
}
