// Sound cue sheet (v8.1) — every visible move gets a sound. Built from the same beats the scenes animate with,
// exported by the renderer to out/cues.json and synthesised by render/audio.py. v8.1: the pen and the drawing are
// driven by the motion itself — the 3D pen's tip track (devices.js: contact, speed, height) becomes touch-downs
// (modal 'tok'), friction ('scribble', loudness and brightness following the tip's speed) and air ('penfly'); the
// town's blocks fold into houses with a cascade of small wooden clacks timed by when the light reaches each one.

const mj = u => 30 * u * u * (1 - u) * (1 - u); // minimum-jerk speed profile (area 1)
// a run of strokes as a friction envelope: n strokes, each a speed bell, short lifts between
function strokes(dur, n, fs, seed) {
  let r = seed * 9301 + 49297; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const N = Math.round(dur * fs), c = new Array(N).fill(0), sp = new Array(N).fill(0);
  const w = Array.from({ length: n }, () => 0.7 + rnd() * 0.6), tot = w.reduce((a, b) => a + b, 0);
  let i0 = 0;
  w.forEach(x => {
    const len = Math.round(N * x / tot), down = Math.round(len * 0.82);
    for (let i = 0; i < down && i0 + i < N; i++) { c[i0 + i] = 1; sp[i0 + i] = +(mj(i / down) * (0.8 + rnd() * 0.3)).toFixed(3); }
    i0 += len;
  });
  return { fs, c, sp };
}

// (v8.5) a smooth density envelope of arrival times (Gaussian, σ s) sampled at fs over [t0, t1], peak 1
function density(times, t0, t1, sg = 0.05, fs = 100) {
  const n = Math.max(2, Math.round((t1 - t0) * fs)), env = new Array(n).fill(0);
  for (const tm of times) for (let i = 0; i < n; i++) { const d = (t0 + i / fs - tm) / sg; if (Math.abs(d) < 4) env[i] += Math.exp(-0.5 * d * d); }
  const mx = Math.max(...env) || 1;
  return env.map(v => +(v / mx).toFixed(3));
}

export function buildCues(T, copy, X = {}) {
  const c = [];
  const add = (t, type, o = {}) => c.push({ t: +t.toFixed(4), type, ...o });

  // bar 1 · the phone spins in, the notification slams, the button fills, a tap
  add(0, 'reverse', { dur: T.slam, gain: 0.8 });
  add(T.slam, 'slam');
  add(T.slam + 0.04, 'shimmer', { dur: T.iconFly - T.slam, gain: 0.18 });       // the icon's glint
  add(T.iconFly, 'whoosh', { dur: T.iconLand - T.iconFly + 0.05, gain: 0.26, f0: 1800, f1: 700, pan: [0, -0.3] });
  add(T.notifIn + 0.02, 'notif', { gain: 0.42 });
  add(T.iconLand, 'tok', { gain: 0.3, bright: 0.85, body: 0.5, seed: 11 });     // it seats in its slot
  add(T.btnA, 'zip', { dur: T.btnB - T.btnA, gain: 0.22, f0: 600, f1: 1800, pan: [-0.2, 0.2] });
  add(T.tap, 'blip', { gain: 0.5 });
  // bar 2 · phone → tablet, the pen, the quiz, into the screen
  add(T.morphA, 'whoosh', { dur: T.morphB - T.morphA, gain: 0.38, f0: 500, f1: 1900 });
  add(T.morphB - 0.06, 'pop', { gain: 0.3, pitch: 0.75 });
  if (X.pen) {
    const P = X.pen, at = i => P.t0 + i / P.fs, sl = (a, b) => [Math.round((a - P.t0) * P.fs), Math.round((b - P.t0) * P.fs)];
    // in through the air: one turn end over end (the swish follows the flip's angle), slowing into the glass
    const [f0, f1] = sl(T.penIn, T.penTap);
    const rot = P.sp.slice(f0, f1).map((_, i) => { const u = Math.min(1, i / P.fs / (T.penTap - 0.04 - T.penIn)); return +(Math.PI * 2 * (1 - (1 - Math.exp(-3.4 * u)) / (1 - Math.exp(-3.4)))).toFixed(3); });
    add(T.penIn, 'penfly', { fs: P.fs, sp: P.sp.slice(f0, f1), rot, gain: 0.34, pan: [0.55, 0.05] });
    // every touch-down of the nib: the first one firm, then one small tick per syllable
    let first = true;
    for (let i = 1; i < P.c.length; i++) if (P.c[i] && !P.c[i - 1]) {
      add(at(i), 'tok', first ? { gain: 0.55, bright: 1, body: 1 } : { gain: 0.13 + 0.04 * ((i * 7) % 3), bright: 1.1, body: 0.25, seed: i });
      first = false;
    }
    // writing: friction under the nib, loudness and brightness from the tip's speed
    const [w0, w1] = sl(T.penTap, T.quizB + 0.06);
    add(T.penTap, 'scribble', { fs: P.fs, c: P.c.slice(w0, w1), sp: P.sp.slice(w0, w1), tip: 'nib', gain: 0.32 });
    // lift-off and away into the dive
    const [e0, e1] = sl(T.quizB, T.quizB + 0.3);
    add(T.quizB + 0.02, 'tok', { gain: 0.07, bright: 1.4, body: 0.1, seed: 99 });
    add(T.quizB, 'penfly', { fs: P.fs, sp: P.sp.slice(e0, e1), gain: 0.24, pan: [0.1, 0.6] });
  }
  add(T.diveA, 'whoosh', { dur: T.dive - T.diveA + 0.1, gain: 0.45, f0: 400, f1: 2600, big: 1 });
  add(T.whaleDrawA, 'scribble', { ...strokes(T.whaleDrawB - T.whaleDrawA, 6, 240, 3), tip: 'felt', gain: 0.3 });
  // bar 3 · quick answer: the seats light in a run, one presses first
  add(T.drop, 'boom', { gain: 0.5 });
  for (let i = 0; i < 7; i++) add(T.buzzA + i * 0.1, 'tick', { gain: 0.16 + 0.03 * (i % 2), seed: 10 + i, bright: 1.2 + (i % 3) * 0.2, pan: -0.5 + (i % 5) * 0.25 });
  add(T.ding, 'chime', { gain: 0.48 });
  add(T.ding + 0.03, 'pop', { gain: 0.22, pitch: 1.15 });                   // (v8.4) the raised hand pops up
  add(T.ding + 0.18, 'blip', { gain: 0.3 });
  // bar 4 · everyone's board: four slates pop out, four parts drawn on the beat
  [0, 1, 2, 3].forEach(i => add(T.boardsA + i * 0.07, 'pop', { gain: 0.24, pitch: 0.9 + i * 0.1, pan: -0.5 + i * 0.33 }));
  [T.draw1, T.draw2, T.draw3, T.draw4].forEach((t, i) => {
    add(t, 'scribble', { ...strokes(0.42, 3 + (i % 2), 240, 60 + i), tip: 'felt', gain: 0.3, pan: -0.5 + i * 0.33 });
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
  if (X.frags) {
    // (v8.5) the class's pieces come off the glass one after another and rise: one airy lift (rising in pitch) with a
    // single soft glass note as the first one leaves — no run of ticks
    const u0 = Math.min(...X.frags.map(f => f.up)), u1 = Math.max(...X.frags.map(f => f.up));
    add(u0 - 0.05, 'settle', { dur: u1 - u0 + 0.4, gain: 0.2, f0: 600, f1: 2800, pan: [-0.2, 0.25] });
    add(u0, 'bell', { gain: 0.08, note: 81, pan: -0.15 });
    // (v8.5) … and lie down into the grid in one soft gesture, locking into the town with a deep, glassy landing
    const l0 = Math.min(...X.frags.map(f => f.lay)) - 0.36, l1 = Math.max(...X.frags.map(f => f.lay));
    add(l0, 'settle', { dur: l1 - l0 + 0.06, gain: 0.26, f0: 2400, f1: 480, pan: [-0.15, 0.15] });
    add(l1 - 0.01, 'thoom', { gain: 0.32 });
  }
  add(T.window - 0.2, 'glasspad', { dur: 1.3, gain: 0.13, notes: [74, 78, 81, 86], peak: 0.4 });
  // bar 7 · every home: the light sweeps the clay town into houses, a whip, the windows light
  add(T.dawnA - 0.02, 'land', { gain: 0.5 });
  add(T.dawnA, 'swipe', { dur: T.sweepB - 0.15 - T.dawnA, gain: 0.16, pan: [-0.6, 0.5] });
  if (X.motes && X.motes.length) {
    // (v8.5) the homes' threads of light arriving: one shimmering glass texture swelling with how many arrive (no
    // run of little bells), and a single soft bell on each of the two biggest gatherings
    const ts = X.motes.map(m => m.t), t0 = Math.min(...ts) - 0.15, t1 = Math.max(...ts) + 0.15, env = density(ts, t0, t1, 0.06);
    add(t0, 'gather', { fs: 100, env, gain: 0.15, notes: [86, 90, 93, 98] });
    const peaks = env.map((v, i) => [v, i]).filter(([v, i]) => i > 0 && i < env.length - 1 && v >= env[i - 1] && v > env[i + 1] && v > 0.55).sort((a, b) => b[0] - a[0]).slice(0, 2).sort((a, b) => a[1] - b[1]);
    peaks.forEach(([, i], j) => add(t0 + i / 100, 'bell', { gain: 0.14, note: [86, 93][j], pan: j ? 0.25 : -0.25 }));
  }
  if (X.town) {
    // the blocks become houses where the light has passed: a soft brushed swell that follows them (in view only)
    const ts = X.town.filter(hs => hs.t >= T.dawnA && hs.t <= T.whipA).map(hs => hs.t);
    if (ts.length) { const t0 = Math.min(...ts) - 0.2, t1 = Math.max(...ts) + 0.2; add(t0, 'bloom', { fs: 100, env: density(ts, t0, t1, 0.09), gain: 0.1 }); }
  }
  add(T.whipA, 'whoosh', { dur: T.whipB - T.whipA + 0.1, gain: 0.5, f0: 3000, f1: 600, big: 1 });
  // (v8.5) the windows light near → far: one warm felt-piano chord (Dadd9), rolled gently, with a glass swell
  add(T.whipB + 0.02, 'chord', { gain: 0.3, notes: [50, 57, 66, 69, 76], roll: 0.02, dur: 2.6 });
  add(T.whipB + 0.05, 'glasspad', { dur: 1.1, gain: 0.08, notes: [78, 81, 86, 90], peak: 0.3 });
  [0, 1, 2, 3].forEach(i => add(T.cardA + 0.1 + [0, 0.25, 0.5, 0.8][i], 'tick', { gain: 0.12, seed: 30 + i, bright: 0.85 }));
  // bar 8 · nationwide
  add(T.rise, 'whoosh', { dur: T.mapIn - T.rise + 0.3, gain: 0.42, f0: 400, f1: 3000 });
  add(T.mapIn - 0.05, 'glasspad', { dur: 1.4, gain: 0.12, notes: [81, 86, 90, 93], peak: 0.35 });
  // (v8.5) the country lighting up: a glass texture growing with the spread, two soft bells — no run of plucks
  { const n = Math.round((T.spreadB - T.spreadA + 0.3) * 100); add(T.spreadA, 'gather', { fs: 100, env: Array.from({ length: n }, (_, i) => +Math.min(1, Math.sin(Math.PI * i / n) * 1.3).toFixed(3)), gain: 0.12, notes: [81, 86, 90, 93] }); }
  add(T.spreadA + 0.05, 'bell', { gain: 0.12, note: 86, pan: -0.2 });
  add(T.spreadA + 0.55, 'bell', { gain: 0.1, note: 93, pan: 0.2 });
  add(T.liftOff - 0.15, 'air', { dur: 0.5, gain: 0.28 });
  // bar 9 · the morning report — the same sound as the first notification
  add(T.morning, 'shimmer', { dur: 0.8, gain: 0.2 });
  add(T.notify, 'notif', { gain: 0.5 });
  // bar 9.75–10 · tagline
  add(T.sweepA, 'swipe', { dur: T.tag2 - T.sweepA, gain: 0.26, pan: [-0.6, 0.6] });
  add(T.tag2 + 0.05, 'swipe', { dur: T.underA - T.tag2, gain: 0.24, pan: [-0.5, 0.4] });
  add(T.underA, 'scribble', { ...strokes(T.underB - T.underA, 1, 240, 91), tip: 'felt', gain: 0.34 });
  add(T.underB, 'zip', { dur: T.breath - T.underB, gain: 0.2, f0: 900, f1: 2000, pan: [0.2, 0.4] });
  add(T.breath, 'reverse', { dur: T.hero - T.breath, gain: 0.75 });
  { // the pen rises, its spin dying away (five turns), and its nib lands on the i
    const fs = 240, D = T.hero - 0.02 - T.penUp, n = Math.round(D * fs), sp = [], rot = [];
    for (let i = 0; i < n; i++) { const u = i / n; sp.push(+(3 * (1 - u) ** 2).toFixed(3)); rot.push(+(5 * 2 * Math.PI * (1 - (1 - Math.exp(-4 * u)) / (1 - Math.exp(-4)))).toFixed(3)); }
    add(T.penUp, 'penfly', { fs, sp, rot, gain: 0.3, pan: [0.4, 0.1] });
    add(T.hero - 0.02, 'tok', { gain: 0.4, bright: 0.9, body: 1.2, seed: 7 });
  }
  // bar 11–12 · the pen becomes the i + end card — nothing else within 60 ms of the hit
  add(T.hero, 'hit', { gain: 0.95 });
  add(T.traceB, 'ink', { dur: T.fillB - T.traceB + 0.3, gain: 0.3 });
  add(T.shineA, 'air', { dur: T.shineB - T.shineA, gain: 0.22 });
  add(T.dot, 'ping', { gain: 0.32 });
  add(T.lineA, 'zip', { dur: T.lineB - T.lineA, gain: 0.28, f0: 1200, f1: 2400, pan: [-0.3, 0.3] });
  add(T.lineB, 'shimmer', { dur: 1.4, gain: 0.2 });
  return c.sort((a, b) => a.t - b.t);
}
