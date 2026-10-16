// Sound cue sheet — every visible move gets a sound. Built from the same timeline/beats the
// scenes animate with, exported by the renderer to out/cues.json and synthesised by render/audio.py.

export function buildCues(T) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // bar 1 · the hook: comet → slam → the mark reveals → the i-dot's light drops to the notebook
  add(0, 'reverse', { dur: T.slam, gain: 0.85 });
  add(T.slam, 'slam');
  add(T.revealA, 'swipe', { dur: T.revealB - T.revealA, gain: 0.6, pan: [-0.6, 0.6] });
  add(T.revealB, 'shimmer', { dur: 0.6, gain: 0.16 });
  add(T.fall, 'whoosh', { dur: T.land - T.fall, gain: 0.4, f0: 2200, f1: 500, pan: [0.3, -0.4] });
  add(T.land, 'drop', { gain: 0.6 });
  // bar 2 · the question
  add(T.writeA, 'pencil', { dur: T.writeB - T.writeA, gain: 0.32, seed: 7 });
  add(T.qmark, 'chime', { gain: 0.35, soft: 1 });
  add(T.jump, 'whoosh', { dur: 0.4, gain: 0.32, f0: 700, f1: 2600, pan: [-0.5, 0.2] });
  // bar 3 · the book, the words, the whale
  add(T.drop, 'boom', { gain: 0.6 });
  [T.flip1, T.flip2, T.flip3].forEach((t, i) => add(t - 0.04, 'page', { dur: 0.3, gain: 0.5 - i * 0.05, pan: 0.3 - i * 0.2, seed: 3 + i }));
  add(T.liftA, 'air', { dur: T.gatherB - T.liftA, gain: 0.22 });
  for (let i = 0; i < 12; i++) add(T.gatherA + 0.4 + (i * (T.gatherB - T.gatherA - 0.4)) / 12, 'pop', { gain: 0.12, pitch: 0.9 + (i % 4) * 0.12, pan: Math.sin(i * 1.7) * 0.5 });
  add(T.whaleA, 'pencil', { dur: T.whaleB - T.whaleA, gain: 0.18, seed: 51 });
  [0, 4, 7, 12].forEach((s, i) => add(T.whaleB - 0.3 + i * 0.14, 'pluck', { gain: 0.22, semi: s + 2, pan: 0.2 }));
  // bar 4 · the stall
  add(T.whaleB + 0.1, 'riser', { dur: T.stall - T.whaleB - 0.1, gain: 0.28 });
  add(T.stall, 'stall', { gain: 0.6 });
  add(T.stall + 0.3, 'reverse', { dur: T.tabletOn - T.stall - 0.3, gain: 0.3 });
  // bars 5–6 · ClassIn: the question goes to the teacher, everyone draws, the answer comes back
  add(T.tabletOn, 'notif', { gain: 0.5 });
  add(T.dotDrop, 'whoosh', { dur: T.enter - T.dotDrop + 0.1, gain: 0.5, f0: 400, f1: 2600, big: 1 });
  add(T.handup, 'pop', { gain: 0.32, pitch: 0.9 });
  add(T.askA, 'blip', { gain: 0.45 });
  add(T.askA + 0.05, 'zip', { dur: T.askB - T.askA, gain: 0.25, f0: 700, f1: 1800, pan: [-0.2, -0.6] });
  add(T.teachA, 'blip', { gain: 0.35 });
  add(T.teachA, 'chalk', { dur: T.teachB - T.teachA, gain: 0.3 });
  [0, 1, 2, 3].forEach(i => { add(T.friendsA + i * 0.18, 'pluck', { gain: 0.2, semi: [7, 9, 12, 14][i], pan: -0.5 + i * 0.33 }); add(T.friendsA + i * 0.18, 'marker', { dur: 0.5, gain: 0.18, seed: 60 + i }); });
  add(T.returnA + 0.1, 'riser', { dur: T.returnB - T.returnA - 0.1, gain: 0.32 });
  add(T.returnB, 'reward', { gain: 0.7 });
  add(T.swimA, 'whoosh', { dur: 0.4, gain: 0.35, f0: 600, f1: 2400 });
  add(T.exitA, 'whoosh', { dur: 0.8, gain: 0.5, f0: 2400, f1: 500, big: 1 });
  add(T.window - 0.3, 'air', { dur: 0.8, gain: 0.3 });
  // bar 7 · every home
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  for (let i = 0; i < 12; i++) add(T.landA + ((T.landB - T.landA) * i) / 12 + 0.05, 'pluck', { gain: 0.13 + 0.07 * (i % 3 === 0), semi: scale[i % scale.length], pan: Math.sin(i * 1.3) * 0.7 });
  [0, 1, 2, 3].forEach(i => add(T.cardA + 0.1 + [0, 0.35, 0.7, 1.15][i], 'tick', { gain: 0.25, seed: 30 + i, bright: 1.5 }));
  // bar 8 · nationwide
  add(T.rise, 'whoosh', { dur: T.mapIn - T.rise + 0.3, gain: 0.45, f0: 400, f1: 3000 });
  add(T.mapIn, 'shimmer', { dur: 1.2, gain: 0.25 });
  for (let i = 0; i < 16; i++) add(T.spreadA + (i / 16) * (T.spreadB - T.spreadA), 'pluck', { gain: 0.12 + 0.08 * (i % 4 === 0), semi: scale[i % scale.length] + (i > 9 ? 12 : 0), pan: Math.sin(i * 1.9) * 0.6 });
  add(T.liftOff - 0.2, 'air', { dur: 0.6, gain: 0.3 });
  // bar 9 · the morning
  add(T.morning, 'shimmer', { dur: 1.0, gain: 0.2 });
  add(T.doodleA, 'pencil', { dur: T.doodleB - T.doodleA, gain: 0.28, seed: 70 });
  add(T.stamp - 0.3, 'zip', { dur: 0.3, gain: 0.2, f0: 1400, f1: 600 });
  add(T.stamp, 'ping', { gain: 0.45 });
  add(T.notify, 'notif', { gain: 0.55 });
  // bar 10 · tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.26, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.24, pan: [-0.5, 0.4] });
  add(T.underA, 'marker', { dur: 0.32, gain: 0.35, seed: 90 });
  add(T.underA + 0.3, 'marker', { dur: T.underB - T.underA - 0.25, gain: 0.35, seed: 91 });
  add(T.underB, 'zip', { dur: T.breath - T.underB, gain: 0.2, f0: 900, f1: 2000, pan: [0.2, 0.4] });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.75 });
  add(T.conv, 'converge', { dur: T.hero - T.conv, gain: 0.5 });
  // bar 11–12 · hero + end card — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 0.95 });
  add(T.hero + 0.08, 'pencil', { dur: T.traceB - T.hero, gain: 0.16, seed: 99 });
  add(T.traceB, 'ink', { dur: T.fillB - T.traceB + 0.3, gain: 0.3 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.22 });
  add(T.dot, 'ping', { gain: 0.32 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.28, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.2 });
  return c.sort((a, b) => a.t - b.t);
}
