// S3 · 교실 (4.80–10.20): a ClassIn classroom, rebuilt by eye from ClassIn's own UI — neutral
// charcoal blackboard, video seats on top, vertical toolbox, multi-page board. The teacher writes
// (the light is her pen), runs a quiz (Responder), Jihoo raises his hand, is brought on stage, solves
// it himself (now the light is his pen) and receives a trophy. Close on his face.
import { E, tw, prog, clamp, lerp, keyed, drift, xf, camMatrix, place, planeModel, bezier, slice, boxIn, h } from '../core.js';
import { project } from '../line.js';
import { avatar } from '../avatar.js';

const TOOL = {
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  sel: '<path d="M4 4l7 17 2.5-7.5L21 11z"/>',
  er: '<path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0L21 8a2 2 0 0 1 0 2.8L12 20"/>',
  tx: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  sh: '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="17" r="4"/>',
  tm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3"/><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
  qz: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8.5 4 4 0 0 1 17.5 18z"/>',
  tro: '<path d="M7 4h10v4a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M10.5 13h3v3h-3zM8 16h8v3H8z"/>',
};
const MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const CUP = '<svg viewBox="0 0 48 48"><defs><linearGradient id="cupg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A3"/><stop offset="0.55" stop-color="#F5C542"/><stop offset="1" stop-color="#C98A12"/></linearGradient></defs><path d="M13 7h22v8.5a11 11 0 0 1-22 0z" fill="url(#cupg)"/><path d="M13 10H7.5a6 6 0 0 0 6.5 8M35 10h5.5a6 6 0 0 1-6.5 8" stroke="#F5C542" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21 26h6v7h-6z" fill="#D99A1E"/><rect x="14" y="33" width="20" height="6" rx="2" fill="url(#cupg)"/></svg>';
const HAND = '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6.5 7S5 17.5 4.5 15l-1-3.2a1.5 1.5 0 0 1 2.7-1.2L8 13" fill="#fff" stroke="#3A2A00" stroke-width="1.2" stroke-linejoin="round"/></svg>';

export default function classScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const RW = 1280, RH = 760;
  const STU = copy.classmates; // index 1 = 박지후
  const JI = 1;
  const seed = [2, 1, 3, 4, 6, 5];
  const hair = [0, 0, 1, 0, 3, 2];
  const trophies = [28, 35, 31, 22, 40, 19];
  const room = h('div', 'croom obj', `
    <div class="seats">
      <div class="seat tch"><div class="cam">${avatar({ seed: 11, hair: 2, glasses: true, smile: 0.65, shirt: '#2F3A4A', id: 'crT', w: 196, h: 120 })}</div><span class="nm">${copy.teacher} 선생님</span><span class="mic">${MIC}</span><span class="ring"></span></div>
      ${STU.map((n, i) => `<div class="seat" data-i="${i}"><div class="cam">${avatar({ seed: seed[i], hair: hair[i], smile: 0.5, id: `crS${i}`, w: 160, h: 120 })}</div><span class="nm">${n.slice(1)}</span><span class="tc">${CUP}<b>${trophies[i]}</b></span><span class="mic">${MIC}</span><span class="ok">✓</span><span class="hand">${HAND}</span><span class="away">무대 위</span></div>`).join('')}
    </div>
    <div class="board">
      <div class="pages"><span class="on">1</span><span>2</span><span>3</span><span>+</span></div>
      <div class="hw t1" style="left:64px;top:96px"><span class="lim">lim<small>x→2</small></span><span class="fr"><span>x² − 4</span><span>x − 2</span></span> = ?</div>
      <div class="hw j1" style="left:64px;top:300px">= <span class="lim">lim<small>x→2</small></span>(x + 2)</div>
      <div class="hw j2" style="left:64px;top:430px">= <span class="ans">4</span></div>
      <div class="quiz"><div class="qh"><b>답변기</b> · Q1<span class="acc">정답률 <em>0</em>%</span></div>
        <div class="bars">${copy.quiz.map(([k, v, n]) => `<div class="bar${n === 5 ? ' c' : ''}"><b class="n">${n}</b><i style="--h:${(n / 6) * 100}%"></i><span>${k}<em>${v}</em></span></div>`).join('')}</div>
        <div class="sub">제출 <b class="cnt">0</b>/6</div></div>
      <span class="pen"></span>
    </div>
    <div class="tools">${Object.keys(TOOL).map((k, i) => `<i class="${i === 0 ? 'on' : ''}"><svg viewBox="0 0 24 24">${TOOL[k]}</svg></i>`).join('')}</div>`);
  el.appendChild(room);
  // Jihoo's stage tile (a separate plane so it can fly from his seat onto the board)
  const stageAv = s => avatar({ seed: seed[JI], hair: hair[JI], smile: s, id: `crStage${Math.round(s * 100)}`, w: 360, h: 270, shirt: '#3F6FB5' });
  const stage = h('div', 'stage obj', `<div class="cam a0">${stageAv(0.55)}</div><div class="cam a1">${stageAv(0.95)}</div><span class="nm">${STU[JI]}</span><span class="auth"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>판서 권한</span><span class="cup">${CUP}<b>+1</b></span>`);
  el.appendChild(stage);
  const seats = [...room.querySelectorAll('.seat[data-i]')];
  const jSeat = seats[JI];
  const q = s => room.querySelector(s);
  const t1 = q('.t1'), j1 = q('.j1'), j2 = q('.j2'), pen = q('.pen');
  const quiz = q('.quiz'), acc = quiz.querySelector('.acc em'), cnt = quiz.querySelector('.cnt'), bars = [...quiz.querySelectorAll('.bar')];
  const stA0 = stage.querySelector('.a0'), stA1 = stage.querySelector('.a1'), stCup = stage.querySelector('.cup'), stAuth = stage.querySelector('.auth');
  const jCount = jSeat.querySelector('.tc b');

  let A = {};
  const SW = 360, SH = 270;
  function layout() {
    A.board = boxIn(q('.board'), room);
    A.t1 = boxIn(t1, room); A.j1 = boxIn(j1, room); A.j2 = boxIn(j2, room);
    A.ans = boxIn(j2.querySelector('.ans'), room);
    A.quiz = boxIn(quiz, room);
    A.jSeat = boxIn(jSeat, room);
    A.tSeat = boxIn(q('.seat.tch'), room);
    A.stage = { x: A.board.x + A.board.w - SW - 96, y: A.board.y + 150, w: SW, h: SH };
  }

  const rModel = planeModel(0, 0, 0, RW, RH);
  const local = (x, y, z = 0) => xf(rModel, x, y, z);
  function camAt(t) {
    const st = A.stage, sc = local(st.x + SW / 2, st.y + SH * 0.45), qz = local(A.quiz.x + A.quiz.w / 2, A.quiz.y + A.quiz.h / 2);
    const keys = P ? [
      { t: 4.7, x: -150, y: 40, s: 2.0, rx: 2, ry: -4 },
      { t: T.drop + 0.25, x: -260, y: 30, s: 1.5, rx: 3, ry: -6, e: E.outCubic },
      { t: T.writeB, x: -220, y: 20, s: 1.5, rx: 3, ry: -4 },
      { t: T.quizA + 0.3, x: qz[0] - 40, y: qz[1] - 40, s: 1.55, rx: 2, ry: 2, e: E.inOutCubic },
      { t: T.correct + 0.15, x: qz[0] - 60, y: qz[1] - 60, s: 1.6, rx: 2, ry: 3 },
      { t: T.stageB, x: sc[0] - 80, y: sc[1] - 120, s: 1.45, rx: 2, ry: -2, e: E.inOutCubic },
      { t: T.trophyB, x: sc[0] - 140, y: sc[1] - 10, s: 1.5, rx: 2, ry: -3, e: E.inOutSine },
      { t: 10.3, x: sc[0], y: sc[1] - 10, s: 3.1, rx: 1, ry: -1, e: E.inOutCubic },
    ] : [
      { t: 4.7, x: 0, y: 0, s: 1.35, rx: 2, ry: -4 },
      { t: T.drop + 0.25, x: 0, y: 10, s: 0.97, rx: 3, ry: -6, e: E.outCubic },
      { t: T.writeB, x: -120, y: 20, s: 1.12, rx: 3, ry: -5 },
      { t: T.quizA + 0.3, x: qz[0] * 0.6, y: qz[1] * 0.5, s: 1.18, rx: 2, ry: 2, e: E.inOutCubic },
      { t: T.correct + 0.15, x: qz[0] * 0.6, y: qz[1] * 0.5, s: 1.22, rx: 2, ry: 3 },
      { t: T.stageB, x: sc[0] * 0.55, y: (sc[1] - 160) * 0.6, s: 1.1, rx: 2, ry: -2, e: E.inOutCubic },
      { t: T.trophyB, x: sc[0] * 0.55, y: sc[1] * 0.4, s: 1.15, rx: 2, ry: -3, e: E.inOutSine },
      { t: 10.3, x: sc[0], y: sc[1] - 10, s: 2.7, rx: 1, ry: -1, e: E.inOutCubic },
    ];
    const c = keyed(t, keys);
    c.rx += 1.2 * drift(t, 1.1, 0.12);
    c.ry += 2 * drift(t, 2.7, 0.1);
    c.rz = 0.5 * drift(t, 3.3, 0.09);
    c.d = 1800;
    return c;
  }

  // where Jihoo's tile is: in his seat, flying, or on stage
  function stageRect(t) {
    const k = tw(t, T.stageA, T.stageB, E.inOutQuint);
    const s = A.jSeat, st = A.stage;
    return { x: lerp(s.x, st.x, k), y: lerp(s.y, st.y, k), w: lerp(s.w, SW, k), h: lerp(s.h, SH, k), k, lift: Math.sin(k * Math.PI) * 120 };
  }
  const reveal = (e, k) => { e.style.clipPath = `inset(-30px ${((1 - k) * 100).toFixed(2)}% -30px -30px)`; };

  let cur = null;
  function update(t) {
    const CM = camMatrix(camAt(t), W, H);
    place(room, CM, rModel);
    const fin = tw(t, 4.8, 5.05, E.outCubic);
    el.style.opacity = fin * (1 - tw(t, 9.88, 10.18, E.inQuad));
    const blur = (1 - fin) * 10 + tw(t, 9.85, 10.3, E.inQuad) * 14;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';

    // teacher writes the problem; Jihoo writes the answer
    const w1 = tw(t, T.writeA, T.writeB, E.inOutSine);
    reveal(t1, w1);
    const wj1 = tw(t, T.write2A, T.write2A + 0.38, E.inOutSine), wj2 = tw(t, T.write2A + 0.4, T.write2B, E.inOutSine);
    reveal(j1, wj1); reveal(j2, wj2);
    const writing = t > T.writeA && t < T.writeB ? [A.t1, w1] : t > T.write2A && t < T.write2B ? (t < T.write2A + 0.39 ? [A.j1, wj1] : [A.j2, wj2]) : null;
    pen.style.opacity = writing ? 1 : 0;
    if (writing) {
      pen.style.left = `${writing[0].x - A.board.x + writing[0].w * writing[1]}px`;
      pen.style.top = `${writing[0].y - A.board.y + writing[0].h * 0.6 + Math.sin(t * 38) * 7}px`;
    }
    const penAt = writing ? [writing[0].x + writing[0].w * writing[1], writing[0].y + writing[0].h * 0.6 + Math.sin(t * 38) * 7] : null;

    // the Responder: submissions tick in on the seats, bars rise, the correct answer lights orange
    const qIn = tw(t, T.quizA, T.quizA + 0.3, E.outBack), qOut = tw(t, T.stageA - 0.15, T.stageA + 0.15, E.inQuad);
    quiz.style.opacity = clamp(prog(t, T.quizA, T.quizA + 0.12)) * (1 - qOut);
    quiz.style.transform = `translateY(${(1 - qIn) * 30 + qOut * -20}px) scale(${0.92 + 0.08 * qIn})`;
    let sub = 0;
    seats.forEach((s, i) => {
      const on = t > T.submitA + i * 0.075 && t < T.stageA + 0.2;
      if (on) sub++;
      s.querySelector('.ok').style.opacity = on ? 1 : 0;
    });
    cnt.textContent = String(sub);
    const bk = tw(t, T.barsA, T.barsB, E.outCubic);
    bars.forEach(b => { b.querySelector('i').style.transform = `scaleY(${bk.toFixed(3)})`; b.classList.toggle('lit', t > T.correct); });
    acc.textContent = String(Math.round(83 * tw(t, T.barsA, T.barsB)));

    // Jihoo raises his hand → onto the stage
    const hk = tw(t, T.hand, T.hand + 0.2, E.outBack);
    const hand = jSeat.querySelector('.hand');
    hand.style.opacity = clamp(hk) * (1 - tw(t, T.stageA, T.stageA + 0.15));
    hand.style.transform = `translateY(${(1 - hk) * 14}px) rotate(${Math.sin(t * 14) * 8 * hk}deg)`;
    jSeat.classList.toggle('raised', t > T.hand && t < T.stageA);
    const r = stageRect(t);
    const onStage = t > T.stageA;
    jSeat.classList.toggle('empty', onStage);
    stage.style.display = onStage ? 'block' : 'none';
    if (onStage) {
      const c = local(r.x + r.w / 2, r.y + r.h / 2, r.lift * 0.6);
      place(stage, CM, planeModel(c[0], c[1], c[2], SW, SH, { s: r.w / SW }));
      stage.classList.toggle('live', r.k > 0.95);
    }
    stAuth.style.opacity = tw(t, T.stageB - 0.05, T.stageB + 0.15) * (1 - tw(t, T.trophyA, T.trophyA + 0.2));
    // trophy +1 and a bigger smile
    const tk = tw(t, T.trophyB, T.trophyB + 0.3, E.outBack);
    stCup.style.opacity = clamp(prog(t, T.trophyB - 0.02, T.trophyB + 0.08));
    stCup.style.transform = `translate(-50%, -50%) scale(${(0.3 + 0.7 * tk).toFixed(3)}) rotate(${((1 - tk) * -16).toFixed(2)}deg)`;
    const smile = tw(t, T.trophyB, T.trophyB + 0.25);
    stA1.style.opacity = smile;
    stA0.style.opacity = 1 - smile;
    const bounce = t > T.trophyB ? Math.sin(prog(t, T.trophyB, T.trophyB + 0.4) * Math.PI) * 0.035 : 0;
    stA1.style.transform = stA0.style.transform = `scale(${1 + bounce})`;
    jCount.textContent = t > T.trophyB + 0.1 ? '36' : '35';
    q('.seat.tch .ring').style.opacity = t > T.writeA && t < T.writeB ? 0.6 + 0.3 * Math.sin(t * 9) : 0.15;
    cur = { CM, pen: penAt };
  }

  function draw(fx, t) {
    if (!cur || !A.board) return;
    const { CM } = cur;
    const S = pts => project(CM, pts.map(p => local(p[0], p[1], p[2] || 0)));
    const a = +el.style.opacity;
    // the light arrives from the phone and becomes the teacher's pen
    if (t >= 4.75 && t < T.writeA + 0.05) {
      const k = E.inOutCubic(prog(t, 4.75, T.writeA));
      const from = [RW / 2, RH / 2], to = [A.t1.x, A.t1.y + A.t1.h * 0.6];
      const path = bezier(from, [from[0] - 120, from[1] + 220], [to[0] + 60, to[1] + 260], to, 30);
      fx.line(S(slice(path, Math.max(0, k - 0.4), k)), { w: 4, alpha: Math.max(a, 0.5), taper: 1, head: 1 });
    }
    if (cur.pen) {
      const [px, py] = S([cur.pen])[0];
      fx.head(px, py, 3.2, a);
    }
    // stage: the light carries Jihoo's tile from his seat onto the board
    if (t > T.stageA && t < T.stageB + 0.15) {
      const k = tw(t, T.stageA, T.stageB, E.inOutQuint);
      const s = A.jSeat, st = A.stage;
      const path = bezier([s.x + s.w / 2, s.y + s.h, 0], [s.x + s.w / 2, s.y + s.h + 160, 90], [st.x + 40, st.y + SH + 80, 60], [st.x + SW / 2, st.y + SH + 6, 0], 30);
      fx.line(S(slice(path, Math.max(0, k - 0.35), k)), { w: 3.6, alpha: a * (1 - tw(t, T.stageB, T.stageB + 0.15)), taper: 1, head: 1 });
    }
    // trophy: the light flies from the teacher to Jihoo, then a gold burst
    if (t >= T.trophyA && t < T.trophyB + 0.7) {
      const ts = A.tSeat, st = A.stage;
      const from = [ts.x + ts.w / 2, ts.y + ts.h * 0.5], to = [st.x + SW * 0.82, st.y + SH * 0.3];
      const arc = bezier(from, [from[0] + 260, from[1] - 160, 120], [to[0] - 120, to[1] - 300, 120], to, 36);
      const k = tw(t, T.trophyA, T.trophyB, E.inOutCubic);
      if (t < T.trophyB) fx.line(S(slice(arc, Math.max(0, k - 0.35), k)), { w: 4, alpha: a, taper: 1, head: 1, headScale: 1.1 });
      const tp = S([to])[0];
      fx.flare(tp[0], tp[1], 240, 0.85 * (1 - prog(t, T.trophyB, T.trophyB + 0.55)) * (t >= T.trophyB ? 1 : 0), '255,214,110');
      fx.shards(tp[0], tp[1], t, T.trophyB, { n: 18, seed: 21, speed: 700, life: 0.55, len: 34, w: 2, spreadY: 1 });
    }
    // a spark lifts off the trophy — towards home
    if (t > T.rise - 0.05 && t < 10.35) {
      const st = A.stage;
      const tp = S([[st.x + SW * 0.82, st.y + SH * 0.3, 0]])[0];
      const k = E.inCubic(prog(t, T.rise - 0.05, 10.32));
      const path = bezier(tp, [tp[0] + 60, tp[1] - 200], [W * 0.62, -120], [W * 0.55, -400], 30);
      fx.line(slice(path, Math.max(0, k - 0.3), k), { w: 4.5, alpha: 1, taper: 1, head: 1, headScale: 1.2 });
    }
  }

  return { el, range: ctx.S.class, layout, update, draw };
}
