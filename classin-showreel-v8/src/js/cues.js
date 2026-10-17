// Sound cue sheet (v8) — every visible move gets a sound. Built from the same beats the scenes animate with,
// exported by the renderer to out/cues.json and synthesised by render/audio.py.

export function buildCues(T) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // bar 1 · the phone spins in, the notification slams, the button fills, a tap
  add(0, 'reverse', { dur: T.slam, gain: 0.8 });
  add(T.slam, 'slam');
  add(T.slam + 0.03, 'notif', { gain: 0.42 });
  add(T.btnA, 'zip', { dur: T.btnB - T.btnA, gain: 0.22, f0: 600, f1: 1800, pan: [-0.2, 0.2] });
  add(T.tap, 'blip', { gain: 0.5 });
  // bar 2 · phone → tablet, the pen, the quiz, into the screen
  add(T.morphA, 'whoosh', { dur: T.morphB - T.morphA, gain: 0.38, f0: 500, f1: 1900 });
  add(T.morphB - 0.06, 'pop', { gain: 0.3, pitch: 0.75 });
  add(T.penIn, 'whoosh', { dur: T.penTap - T.penIn, gain: 0.3, f0: 1900, f1: 700, pan: [0.6, 0.1] });
  add(T.penTap, 'tick', { gain: 0.42, seed: 4, bright: 1.6 });
  add(T.quizA, 'pencil', { dur: T.quizB - T.quizA, gain: 0.26, seed: 8 });
  add(T.diveA, 'whoosh', { dur: T.dive - T.diveA + 0.1, gain: 0.45, f0: 400, f1: 2600, big: 1 });
  add(T.whaleDrawA, 'chalk', { dur: T.whaleDrawB - T.whaleDrawA, gain: 0.26 });
  // bar 3 · quick answer: the seats light in a run, one presses first
  add(T.drop, 'boom', { gain: 0.5 });
  for (let i = 0; i < 7; i++) add(T.buzzA + i * 0.1, 'tick', { gain: 0.16 + 0.03 * (i % 2), seed: 10 + i, bright: 1.2 + (i % 3) * 0.2, pan: -0.5 + (i % 5) * 0.25 });
  add(T.ding, 'chime', { gain: 0.48 });
  add(T.ding + 0.18, 'blip', { gain: 0.3 });
  // bar 4 · everyone's board: four slates pop out, four parts drawn on the beat
  [0, 1, 2, 3].forEach(i => add(T.boardsA + i * 0.07, 'pop', { gain: 0.24, pitch: 0.9 + i * 0.1, pan: -0.5 + i * 0.33 }));
  [T.draw1, T.draw2, T.draw3, T.draw4].forEach((t, i) => {
    add(t, 'marker', { dur: 0.42, gain: 0.2, seed: 60 + i });
    add(t, 'pluck', { gain: 0.22, semi: [7, 9, 12, 14][i], pan: -0.5 + i * 0.33 });
  });
  // bar 5 · together: the parts fly onto the whale, trophies, the light runs over it, the whale comes alive
  add(T.assembleA, 'whoosh', { dur: 0.5, gain: 0.32, f0: 900, f1: 2200 });
  [0, 1, 2, 3].forEach(i => add(T.assembleA + 0.12 * i + 0.3, 'pop', { gain: 0.2, pitch: 1.1 + i * 0.08 }));
  add(T.trophyA + 0.28, 'reward', { gain: 0.6 });
  add(T.lightA, 'riser', { dur: T.lightB - T.lightA + 0.4, gain: 0.3 });
  [0, 4, 7, 12].forEach((s, i) => add(T.liftA + i * 0.1, 'pluck', { gain: 0.2, semi: s + 2, pan: 0.2 }));
  // bar 6 · out of the screen, across the room, through the window
  add(T.lift, 'whoosh', { dur: 0.7, gain: 0.45, f0: 2400, f1: 500, big: 1 });
  add(T.flyA, 'air', { dur: T.window - T.flyA, gain: 0.28 });
  add(T.window - 0.1, 'shimmer', { dur: 0.8, gain: 0.25 });
  // bar 7 · every home: the light sweeps the clay town into houses, a whip, the windows light
  add(T.dawnA, 'swipe', { dur: T.sweepB - T.dawnA, gain: 0.22, pan: [-0.7, 0.7] });
  add(T.whipA, 'whoosh', { dur: T.whipB - T.whipA + 0.1, gain: 0.5, f0: 3000, f1: 600, big: 1 });
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  for (let i = 0; i < 8; i++) add(T.whipB + 0.04 + i * 0.075, 'pluck', { gain: 0.13 + 0.06 * (i % 3 === 0), semi: scale[i % scale.length], pan: Math.sin(i * 1.3) * 0.7 });
  [0, 1, 2, 3].forEach(i => add(T.cardA + 0.1 + [0, 0.25, 0.5, 0.8][i], 'tick', { gain: 0.22, seed: 30 + i, bright: 1.5 }));
  // bar 8 · nationwide
  add(T.rise, 'whoosh', { dur: T.mapIn - T.rise + 0.3, gain: 0.42, f0: 400, f1: 3000 });
  add(T.mapIn, 'shimmer', { dur: 1.0, gain: 0.24 });
  for (let i = 0; i < 12; i++) add(T.spreadA + (i / 12) * (T.spreadB - T.spreadA), 'pluck', { gain: 0.12 + 0.08 * (i % 4 === 0), semi: scale[i % scale.length] + (i > 8 ? 12 : 0), pan: Math.sin(i * 1.9) * 0.6 });
  add(T.liftOff - 0.15, 'air', { dur: 0.5, gain: 0.28 });
  // bar 9 · the morning report — the same sound as the first notification
  add(T.morning, 'shimmer', { dur: 0.8, gain: 0.2 });
  add(T.notify, 'notif', { gain: 0.5 });
  // bar 9.75–10 · tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.26, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.24, pan: [-0.5, 0.4] });
  add(T.underA, 'marker', { dur: T.underB - T.underA, gain: 0.35, seed: 91 });
  add(T.underB, 'zip', { dur: T.breath - T.underB, gain: 0.2, f0: 900, f1: 2000, pan: [0.2, 0.4] });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.75 });
  add(T.penUp, 'whoosh', { dur: T.hero - T.penUp, gain: 0.3, f0: 700, f1: 2400 });
  // bar 11–12 · the pen becomes the i + end card — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 0.95 });
  add(T.traceB, 'ink', { dur: T.fillB - T.traceB + 0.3, gain: 0.3 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.22 });
  add(T.dot, 'ping', { gain: 0.32 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.28, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.2 });
  return c.sort((a, b) => a.t - b.t);
}
