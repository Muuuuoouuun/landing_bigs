// Sound cue sheet — every visible move gets a sound. Built from the same timeline/beats the
// scenes animate with, exported by the renderer to out/cues.json and synthesised by render/audio.py.

export function buildCues(T, copy) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // S1 slam
  add(0, 'reverse', { dur: T.slam, gain: 0.9 });
  add(T.slam, 'slam');
  add(T.revealA, 'swipe', { dur: T.revealB - T.revealA, gain: 0.7, pan: [-0.6, 0.6] });
  add(T.logoUp, 'whoosh', { dur: 0.6, gain: 0.35, f0: 1800, f1: 700 });
  // S2 the student's phone
  add(T.peel, 'whoosh', { dur: 0.65, gain: 0.5, f0: 2400, f1: 500, pan: [0.1, -0.2] });
  add(T.phoneLand, 'thump', { gain: 0.8, f: 90 });
  add(T.traceA, 'zip', { dur: T.traceB - T.traceA, gain: 0.35, f0: 600, f1: 1800 });
  add(3.05, 'notif', { gain: 0.42 });
  for (let i = 0; i < 4; i++) add(3.15 + i * 0.1, 'pop', { gain: 0.2, pitch: 1 + i * 0.12 });
  add(T.fillA, 'riser', { dur: T.fillB - T.fillA, gain: 0.42 });
  add(T.tap, 'click', { gain: 0.85 });
  add(T.through, 'whoosh', { dur: 0.6, gain: 0.8, f0: 400, f1: 5200, big: 1 });
  // S3 the classroom
  add(T.drop, 'boom', { gain: 0.9 });
  add(T.writeA, 'chalk', { dur: T.writeB - T.writeA, gain: 0.32 });
  add(T.quizA, 'pop', { gain: 0.35, pitch: 0.8 });
  for (let i = 0; i < 6; i++) add(T.submitA + i * 0.075, 'tick', { gain: 0.3, seed: 10 + i, bright: 1.4 });
  add(T.barsA, 'zip', { dur: T.barsB - T.barsA, gain: 0.3, f0: 500, f1: 1400 });
  add(T.correct, 'chime', { gain: 0.42, soft: 1 });
  add(T.hand, 'pop', { gain: 0.35, pitch: 0.9 });
  add(T.stageA, 'swipe', { dur: T.stageB - T.stageA, gain: 0.45, pan: [-0.3, 0.4] });
  add(T.write2A, 'chalk', { dur: T.write2B - T.write2A, gain: 0.3 });
  add(T.trophyA, 'swipe', { dur: T.trophyB - T.trophyA, gain: 0.35, pan: [-0.4, 0.3] });
  add(T.trophyB, 'reward', { gain: 0.75 });
  add(T.rise, 'whoosh', { dur: 0.6, gain: 0.45, f0: 600, f1: 2600, pan: [0, 0.4] });
  // S4 home — the family
  add(T.homeIn, 'shimmer', { dur: 0.9, gain: 0.18 });
  add(T.notify, 'notif', { gain: 0.6 });
  add(T.open, 'click', { gain: 0.35 });
  const n = Math.min(18, [...copy.comment].length);
  for (let i = 0; i < n; i++) add(T.commentA + (i * (T.commentB - T.commentA)) / n, 'tick', { gain: 0.1, seed: 60 + i, bright: 1.2 });
  add(T.replay, 'pop', { gain: 0.2, pitch: 1.1 });
  add(T.thanks, 'click', { gain: 0.4 });
  add(T.heart, 'pluck', { gain: 0.45, semi: 12 });
  add(T.heartFly, 'whoosh', { dur: 0.9, gain: 0.45, f0: 500, f1: 2400, pan: [0, 0.3] });
  // S5 the future
  add(T.pathA, 'zip', { dur: T.today - T.pathA, gain: 0.35, f0: 500, f1: 1500 });
  [0, 2, 4].forEach((s, i) => add(T.pathA + 0.05 + i * 0.16, 'pluck', { gain: 0.22, semi: s }));
  add(T.today, 'chime', { gain: 0.38, soft: 1 });
  [7, 9, 12].forEach((s, i) => add(T.futureA + 0.2 + i * 0.4, 'pluck', { gain: 0.25, semi: s + 2 }));
  add(T.futureA, 'air', { dur: T.futureB - T.futureA, gain: 0.25 });
  add(T.futureB, 'whoosh', { dur: 0.6, gain: 0.4, f0: 300, f1: 1800 });
  // S6 every classroom in the country
  add(T.mapIn, 'shimmer', { dur: 1.0, gain: 0.2 });
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  for (let i = 0; i < 14; i++) add(T.pillarsA + (i / 14) * (T.pillarsB - T.pillarsA), 'pluck', { gain: 0.16 + 0.1 * (i % 3 === 0), semi: scale[i % scale.length] + (i > 8 ? 12 : 0), pan: Math.sin(i * 1.7) * 0.6 });
  add(T.liftOff, 'whoosh', { dur: 0.45, gain: 0.4, f0: 700, f1: 2600 });
  // S7 tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.28, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.26, pan: [-0.5, 0.3] });
  add(T.underA, 'swipe', { dur: T.underB - T.underA, gain: 0.45, pan: [-0.3, 0.4] });
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
