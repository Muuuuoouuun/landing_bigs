// S4 · ClassIn 수업 (12.00–16.60): the question's light drops into the tablet on the desk; the screen
// wakes and the camera dives into a live ClassIn class. Seo-yun raises her hand and her question travels
// to the teacher (ClassIn chat). The teacher draws the whale on the board — "뜨는 힘 > 무게" — and the
// classmates, given the pen, add wings, balloons, clouds and stars in their own colours. All of it
// gathers into one light that comes back to Seo-yun. The finished whale swims off the board, the
// camera pulls back out of the tablet into the dawn-lit room, and the whale flies to the window.
import { E, tw, prog, clamp, lerp, M4, place, planeModel, measure, slice, catmull, h } from '../core.js';
import { project } from '../line.js';
import { avatar } from '../avatar.js';
import { createMark } from '../brandmark.js';
import { TABLET } from './book.js';
import { whaleStrokes } from './whale.js';


const HAND = '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6.5 7S5 17.5 4.5 15l-1-3.2a1.5 1.5 0 0 1 2.7-1.2L8 13" fill="#fff" stroke="#3A2A00" stroke-width="1.2" stroke-linejoin="round"/></svg>';
const CUP = '<svg viewBox="0 0 48 48"><defs><linearGradient id="lcup" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A3"/><stop offset="0.55" stop-color="#F5C542"/><stop offset="1" stop-color="#C98A12"/></linearGradient></defs><path d="M13 7h22v8.5a11 11 0 0 1-22 0z" fill="url(#lcup)"/><path d="M13 10H7.5a6 6 0 0 0 6.5 8M35 10h5.5a6 6 0 0 1-6.5 8" stroke="#F5C542" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21 26h6v7h-6z" fill="#D99A1E"/><rect x="14" y="33" width="20" height="6" rx="2" fill="url(#lcup)"/></svg>';
const TOOLS = ['<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', '<path d="M4 4l7 17 2.5-7.5L21 11z"/>', '<path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0L21 8a2 2 0 0 1 0 2.8L12 20"/>', '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>', '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="17" r="4"/>', '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'];

const W0 = 1920, H0 = 1080;
const BOARD = { x: 40, y: 254, w: 1390, h: 786 };
const WC = [BOARD.x + 760, BOARD.y + 520], WS = 1.9; // whale on the board
const PENS = { 도윤: '#9FD0FF', 하린: '#F59A23', 민준: '#F29BB8', 지아: '#F6C343' };

const star = (cx, cy, r) => { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
const ring = (cx, cy, r, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const cloud = (cx, cy, s) => { const p = []; for (let i = 0; i <= 60; i++) { const a = Math.PI + (i / 60) * Math.PI * 2; const r = s * (1 + 0.22 * Math.abs(Math.sin(a * 2.5))); p.push([cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.75]); } return p; };

export default function lessonScene(ctx) {
  const { W, H, T, copy } = ctx;
  const el = h('section', 'scene lesson');
  ctx.root.appendChild(el);

  // ---------- the room: tablet on the desk, its glow, the far wall with the window ----------
  const glowD = h('div', 'obj tglow'); glowD.style.width = '2200px'; glowD.style.height = '1500px';
  const tab = h('div', 'obj tablet6', '<div class="tglass"><div class="tsplash"></div></div>');
  tab.style.width = `${TABLET.w}px`; tab.style.height = `${TABLET.h}px`;
  el.append(glowD, tab);
  const splash = tab.querySelector('.tsplash'), glass = tab.querySelector('.tglass');
  const splashMark = createMark(300, { pad: 20 });
  splashMark.draw({ fill: 1, dot: 1, lift: 0.3 });
  splash.appendChild(splashMark.el);

  // ---------- the class (a 1920×1080 screen mapped onto the tablet) ----------
  const cls = h('div', 'cls');
  const names = copy.classmates; // 서윤, 도윤, 하린, 민준, 지아
  const seeds = [3, 2, 9, 4, 5], hair = [1, 0, 2, 0, 3];
  const seat = (i, s) => avatar({ seed: seeds[i], hair: hair[i], smile: s, id: `ls${i}${Math.round(s * 10)}`, w: 214, h: 160 });
  cls.innerHTML = `
    <div class="cbar"><span class="clogo"></span><b>${copy.course}</b><span class="live"><i></i>LIVE</span><span class="who">${copy.teacher} 선생님의 수업</span><span class="tm">00:18:42</span></div>
    <div class="seats">
      <div class="seat tch">${avatar({ seed: 11, hair: 3, glasses: true, smile: 0.7, shirt: '#3F6FB5', id: 'lsT', w: 260, h: 160 })}<span class="nm">${copy.teacher} 선생님</span><span class="ring"></span></div>
      ${names.map((n, i) => `<div class="seat s${i}"><div class="cam a0">${seat(i, 0.5)}</div>${i === 0 ? `<div class="cam a1">${seat(0, 0.95)}</div>` : ''}<span class="nm">${n}</span><span class="ring"></span>${i === 0 ? `<span class="hand">${HAND}</span><span class="cup">${CUP}<b>+1</b></span>` : `<span class="pen" style="background:${PENS[n]}"></span>`}</div>`).join('')}
    </div>
    <div class="board"><div class="pages"><span class="on">1</span><span>2</span><span>+</span></div>
      <div class="tools">${TOOLS.map((d, i) => `<i class="${i === 0 ? 'on' : ''}"><svg viewBox="0 0 24 24">${d}</svg></i>`).join('')}</div>
      <div class="bw b1">${copy.board[0]}</div><div class="bw b2">${copy.board[1]}</div>
      ${Object.keys(PENS).map(n => `<span class="ptag" data-n="${n}" style="background:${PENS[n]}">${n}</span>`).join('')}
    </div>
    <div class="chat"><div class="ch">채팅</div>
      <div class="msg m0 me"><b>${names[0]}</b><p>선생님! 고래가 하늘을 날 수 있어요?</p></div>
      <div class="msg m1 t"><b>${copy.teacher} 선생님</b><p>좋은 질문! 우리 같이 그려 볼까? ✏️</p></div>
      <div class="msg m2"><b>도윤</b><p>날개를 달아 주자!</p></div>
      <div class="msg m3"><b>하린</b><p>풍선도!</p></div>
      <div class="msg m4"><b>지아</b><p>별까지 날아가게 ⭐</p></div>
    </div>`;
  el.appendChild(cls);
  const clsMark = createMark(150, { pad: 6 });
  clsMark.draw({ fill: 1, dot: 0.7, lift: 0.4 });
  cls.querySelector('.clogo').appendChild(clsMark.el);
  const q = s => cls.querySelector(s);
  const seatEls = [...cls.querySelectorAll('.seat')];
  const msgs = [...cls.querySelectorAll('.msg')];
  const b1 = q('.b1'), b2 = q('.b2');
  const tags = Object.fromEntries([...cls.querySelectorAll('.ptag')].map(e => [e.dataset.n, e]));

  // board drawings (screen px of the 1920×1080 class)
  const onBoard = ([x, y]) => [WC[0] + x * WS, WC[1] + y * WS];
  const whale = whaleStrokes().map(s => ({ ...s, pts: s.pts.map(onBoard) }));
  const arrows = [-150, -10, 130].map(x => [[WC[0] + x * WS * 0.5, WC[1] + 260], [WC[0] + x * WS * 0.5, WC[1] + 150]]);
  const doodles = [
    { who: '도윤', t0: T.friendsA, strokes: [catmull([[-30, -66], [-80, -150], [10, -190], [50, -76]].map(onBoard), 8), catmull([[-34, -100], [-10, -140]].map(onBoard), 4), catmull([[-12, -86], [18, -130]].map(onBoard), 4)] },
    { who: '하린', t0: T.friendsA + 0.18, strokes: [ring(...onBoard([150, -190]), 30), [onBoard([150, -160]), onBoard([95, -62])], ring(...onBoard([225, -165]), 34), [onBoard([225, -131]), onBoard([110, -50])]] },
    { who: '민준', t0: T.friendsA + 0.36, strokes: [cloud(...onBoard([-330, 70]), 36), cloud(...onBoard([340, 70]), 32)] },
    { who: '지아', t0: T.friendsA + 0.52, strokes: [star(...onBoard([310, -190]), 22), star(...onBoard([390, -120]), 15), star(...onBoard([-300, -60]), 15)] },
  ];
  for (const d of doodles) { d.lens = d.strokes.map(s => { const L = measure(s); return L[L.length - 1]; }); d.total = d.lens.reduce((a, b) => a + b, 0); }
  const wLens = whale.map(s => { const L = measure(s.pts); return L[L.length - 1]; }), wTotal = wLens.reduce((a, b) => a + b, 0);

  let A = null;
  function layout() {
    const box = e => { const r = e.getBoundingClientRect(), c = cls.getBoundingClientRect(), k = c.width / W0; return { x: (r.left - c.left) / k, y: (r.top - c.top) / k, w: r.width / k, h: r.height / k }; };
    const keep = cls.style.transform; cls.style.transform = 'none'; cls.style.display = 'block';
    A = { seats: seatEls.map(box), m0: box(msgs[0]), b1: box(b1), b2: box(b2) };
    cls.style.transform = keep;
  }
  const seatC = i => { const s = A.seats[i]; return [s.x + s.w / 2, s.y + s.h / 2]; };

  // tablet model + its screen corners in the world
  const MT = planeModel(TABLET.x, TABLET.y, 2, TABLET.w, TABLET.h, { rz: TABLET.rz });
  let cur = null;
  function update(t) {
    const CM = ctx.CM;
    const inRoom = t < T.enter + 0.05 || t > T.exitA - 0.05;
    for (const e of [glowD, tab]) e.style.visibility = inRoom ? 'visible' : 'hidden';
    place(tab, CM, MT);
    place(glowD, CM, planeModel(TABLET.x, TABLET.y + 60, 1, 2200, 1500, { rz: TABLET.rz }));
    const on = tw(t, T.tabletOn - 0.1, T.tabletOn + 0.25, E.outCubic);
    const warm = Math.max(on * 0.9, tw(t, T.exitA, T.window, E.inOutSine));
    glowD.style.opacity = warm.toFixed(3);
    glass.style.background = `rgba(${lerp(8, 24, on) | 0},${lerp(9, 26, on) | 0},${lerp(11, 30, on) | 0},1)`;
    splash.style.opacity = (on * (1 - tw(t, T.enter - 0.2, T.enter))).toFixed(3);

    // the class screen mapped onto the tablet glass, filling the frame once we're inside
    const s0 = [TABLET.bez, TABLET.bez], s1 = [TABLET.w - TABLET.bez, TABLET.h - TABLET.bez];
    const M = M4.mul(CM, MT);
    const c00 = M4.apply(M, s0[0], s0[1], 0), c11 = M4.apply(M, s1[0], s1[1], 0);
    const f = tw(t, T.enter - 0.14, T.enter, E.inOutSine) * (1 - tw(t, T.exitA, T.exitA + 0.14, E.inOutSine));
    const x0 = lerp(Math.min(c00[0], c11[0]), 0, f), y0 = lerp(Math.min(c00[1], c11[1]), 0, f);
    const x1 = lerp(Math.max(c00[0], c11[0]), W, f), y1 = lerp(Math.max(c00[1], c11[1]), H, f);
    const sx = (x1 - x0) / W0, sy = (y1 - y0) / H0;
    const vis = tw(t, T.tabletOn + 0.12, T.tabletOn + 0.32) * (1 - tw(t, T.exitA + 0.25, T.exitA + 0.6));
    cls.style.display = vis > 0.001 ? 'block' : 'none';
    cls.style.opacity = vis.toFixed(3);
    cls.style.transform = `translate(${x0.toFixed(2)}px, ${y0.toFixed(2)}px) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`;
    // inside the class
    const raised = t > T.handup && t < T.returnB + 0.4;
    seatEls[1].classList.toggle('raised', raised);
    const hd = seatEls[1].querySelector('.hand');
    hd.style.opacity = tw(t, T.handup, T.handup + 0.15) * (1 - tw(t, T.teachA + 0.3, T.teachA + 0.5));
    hd.style.transform = `translateY(${(Math.sin(t * 10) * 3).toFixed(2)}px) rotate(${(Math.sin(t * 10) * 8).toFixed(1)}deg)`;
    const smile = tw(t, T.returnB - 0.05, T.returnB + 0.1);
    seatEls[1].querySelector('.a1').style.opacity = smile.toFixed(3);
    const cup = seatEls[1].querySelector('.cup');
    const ck = tw(t, T.returnB + 0.05, T.returnB + 0.35, E.outBack);
    cup.style.opacity = clamp(ck * 1.2).toFixed(3);
    cup.style.transform = `scale(${(0.4 + 0.6 * ck).toFixed(3)})`;
    // rings: 서윤 asks, the teacher answers, each classmate draws, the answer comes back to 서윤
    const ringK = (i, a, b) => seatEls[i].querySelector('.ring').style.opacity = (tw(t, a, a + 0.1) * (1 - tw(t, b, b + 0.2))).toFixed(3);
    ringK(0, T.askB - 0.05, T.teachB + 0.2);
    ringK(1, T.returnB - 0.05, T.exitA);
    doodles.forEach((d, j) => ringK(2 + j, d.t0 - 0.05, d.t0 + 0.6));
    // chat
    const chatAt = [T.askA, T.teachA, T.friendsA + 0.05, T.friendsA + 0.25, T.friendsA + 0.55];
    msgs.forEach((m, i) => { const k = tw(t, chatAt[i], chatAt[i] + 0.25, E.outCubic); m.style.opacity = k.toFixed(3); m.style.transform = `translateY(${((1 - k) * 18).toFixed(1)}px)`; });
    // teacher's chalk text
    const tk1 = tw(t, T.teachA, T.teachA + 0.32, E.inOutSine), tk2 = tw(t, T.teachA + 0.3, T.teachA + 0.5, E.inOutSine);
    b1.style.clipPath = `inset(-20px ${((1 - tk1) * 100).toFixed(2)}% -20px -20px)`;
    b2.style.clipPath = `inset(-20px ${((1 - tk2) * 100).toFixed(2)}% -20px -20px)`;
    // name tags follow each classmate's pen (ClassIn shows who is drawing)
    for (const d of doodles) {
      const k = tw(t, d.t0, d.t0 + 0.55, E.inOutSine);
      const tag = tags[d.who];
      tag.style.opacity = (tw(t, d.t0, d.t0 + 0.08) * (1 - tw(t, d.t0 + 0.55, d.t0 + 0.75))).toFixed(3);
      const p = penPos(d, k);
      tag.style.transform = `translate(${(p[0] - BOARD.x + 14).toFixed(1)}px, ${(p[1] - BOARD.y + 12).toFixed(1)}px)`;
    }
    cur = { CM, X: p => [x0 + p[0] * sx, y0 + p[1] * sy], vis, M };
  }

  function penPos(d, k) {
    let acc = 0;
    for (let j = 0; j < d.strokes.length; j++) {
      const a1 = (acc + d.lens[j]) / d.total;
      if (k <= a1 || j === d.strokes.length - 1) { const a0 = acc / d.total; const s = slice(d.strokes[j], 0, clamp((k - a0) / (a1 - a0))); return s[s.length - 1] || d.strokes[j][0]; }
      acc += d.lens[j];
    }
    return d.strokes[0][0];
  }
  // draw a list of strokes progressively (k 0..1 over their total length)
  function drawStrokes(fx, strokes, lens, total, k, X, o) {
    let acc = 0;
    strokes.forEach((s, j) => {
      const pts = s.pts || s;
      const a0 = acc / total, a1 = (acc + lens[j]) / total;
      acc += lens[j];
      const kk = clamp((k - a0) / (a1 - a0));
      if (kk <= 0) return;
      fx.line(slice(pts, 0, kk).map(X), { ...o, head: kk < 1 ? 1 : 0, ink: s.accent ? '#A6E86A' : o.ink });
    });
  }

  function draw(fx, t) {
    if (!cur || !A) return;
    const { X, vis } = cur;
    const inside = vis > 0.01;
    if (inside) {
      // the question's light arrives in 서윤's tile (from the dive), and travels up to the teacher
      const sC = seatC(1), tC = seatC(0);
      const arrive = tw(t, T.enter - 0.1, T.handup, E.outCubic);
      if (t < T.askA) { const p = X(sC); fx.head(p[0], p[1], 5, arrive * vis); fx.flare(p[0], p[1], 120, 0.5 * arrive * vis); }
      if (t > T.askA - 0.05 && t < T.askB + 0.3) {
        const k = tw(t, T.askA, T.askB, E.inOutCubic);
        const path = catmull([sC, [lerp(sC[0], tC[0], 0.5), sC[1] - 150], tC], 16);
        fx.line(slice(path, Math.max(0, k - 0.45), k).map(X), { w: 4, alpha: vis * (1 - prog(t, T.askB, T.askB + 0.3)), taper: 1, head: k < 1 ? 1 : 0 });
        if (t > T.askB) { const p = X(tC); fx.flare(p[0], p[1], 140, 0.7 * vis * (1 - prog(t, T.askB, T.askB + 0.4))); }
      }
      // the teacher's pen: from her tile down to the board, then the whale in chalk + lime arrows
      const wk = tw(t, T.teachA + 0.45, T.teachB, E.inOutSine);
      const chalk = { w: 3.6, alpha: vis * (1 - 0.5 * tw(t, T.returnA, T.returnA + 0.1) + 0.5 * tw(t, T.returnA + 0.1, T.returnA + 0.3)), taper: 0, cool: tw(t, T.teachB, T.teachB + 0.4) * 0.85, ink: '#F2F2EE', inkW: 0.9 };
      if (t > T.teachA && t < T.teachA + 0.5) {
        const k = tw(t, T.teachA, T.teachA + 0.5, E.inOutSine);
        const a = [A.b1.x + A.b1.w * Math.min(1, k * 1.6), A.b1.y + A.b1.h * (k < 0.62 ? 0.7 : 1.7)];
        const p = X(a); fx.head(p[0], p[1], 4, vis);
      }
      if (wk > 0 && t < T.swimA + 0.05) drawStrokes(fx, whale, wLens, wTotal, wk, X, chalk);
      const ak = tw(t, T.teachB - 0.1, T.teachB + 0.3);
      if (ak > 0 && t < T.swimA + 0.05) arrows.forEach(ar => fx.line(slice(ar, 0, ak).map(X), { w: 4, alpha: vis * 0.9, taper: 0.6, head: ak < 1 ? 1 : 0, cool: 0.6, ink: '#A6E86A', inkW: 0.9 }));
      // classmates draw in their own pen colours
      for (const d of doodles) {
        const k = tw(t, d.t0, d.t0 + 0.55, E.inOutSine);
        if (k <= 0 || t > T.swimA + 0.05) continue;
        // their light comes down from their tile first
        if (t < d.t0 + 0.12) { const sc = seatC(names.indexOf(d.who) + 1), p0 = d.strokes[0][0]; const kk = prog(t, d.t0 - 0.12, d.t0 + 0.12); fx.line([X(sc), X([lerp(sc[0], p0[0], kk), lerp(sc[1], p0[1], kk)])], { w: 3, alpha: vis, taper: 1, head: 1 }); }
        drawStrokes(fx, d.strokes, d.lens, d.total, k, X, { w: 4, alpha: vis, taper: 0, cool: tw(t, d.t0 + 0.3, d.t0 + 0.65), ink: PENS[d.who], inkW: 1.1 });
      }
      // everything gathers into one light and comes back to 서윤
      if (t > T.returnA && t < T.returnB + 0.4) {
        const k = tw(t, T.returnA + 0.1, T.returnB, E.inOutCubic);
        const from = onBoard([-112, -14]), to = sC;
        const path = catmull([from, [lerp(from[0], to[0], 0.5) - 120, lerp(from[1], to[1], 0.5)], to], 16);
        fx.line(slice(path, Math.max(0, k - 0.5), k).map(X), { w: 5, alpha: vis * (1 - prog(t, T.returnB, T.returnB + 0.35)), taper: 1, head: k < 1 ? 1.2 : 0 });
        const p = X(from); fx.flare(p[0], p[1], 200, 0.6 * vis * (1 - k));
        if (t > T.returnB) { const pp = X(to); fx.flare(pp[0], pp[1], 160, 0.8 * vis * (1 - prog(t, T.returnB, T.returnB + 0.4))); }
      }
    }
    // the finished whale (with its wings) swims off the board, out of the screen, into the room
    if (t > T.swimA) {
      const parts = [...whale, { pts: doodles[0].strokes[0] }, { pts: doodles[0].strokes[1] }, { pts: doodles[0].strokes[2] }];
      const k = tw(t, T.swimA, T.exitA + 0.1, E.inCubic);
      if (t < T.exitA + 0.1 && inside) {
        const off = [k * 260, -k * 900];
        for (const s of parts) fx.line(s.pts.map(p => X([p[0] + off[0], p[1] + off[1]])), { w: 4, alpha: vis, taper: 0, cool: 0.4 * (1 - k), ink: s.accent ? '#A6E86A' : '#F2F2EE', inkW: 0.9 });
      }
      // in the room: the whale flies from the tablet across the desk to the window
      if (t > T.exitA + 0.05) {
        const fk = tw(t, T.exitA + 0.05, T.window + 0.35, E.inOutSine);
        const P0 = [TABLET.x, TABLET.y - 120, 260], P1 = [1150, -420, 760], P2 = [1308, -872, 1050]; // → the window on the wall
        const u = fk, a = [(1 - u) * (1 - u) * P0[0] + 2 * u * (1 - u) * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * u * (1 - u) * P1[1] + u * u * P2[1], (1 - u) * (1 - u) * P0[2] + 2 * u * (1 - u) * P1[2] + u * u * P2[2]];
        const sc = lerp(0.62, 0.32, fk), swim = Math.sin(t * 7) * 0.06;
        const al = tw(t, T.exitA + 0.05, T.exitA + 0.3) * (1 - tw(t, T.window + 0.2, T.window + 0.45));
        for (const s of parts) {
          const pts = s.pts.map(([x, y]) => { const lx = (x - WC[0]) * sc, ly = (y - WC[1]) * sc; return [a[0] + lx, a[1] + ly * Math.cos(0.3), a[2] - ly * Math.sin(0.3) + lx * swim]; });
          fx.line(project(cur.CM, pts), { w: 3.6, alpha: al, taper: 0, head: 0 });
        }
        const e = project(cur.CM, [a])[0];
        fx.flare(e[0], e[1], 160, 0.35 * al);
      }
    }
  }

  return { el, range: ctx.S.lesson, layout, update, draw };
}
