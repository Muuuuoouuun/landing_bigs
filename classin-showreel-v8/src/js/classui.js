// The ClassIn class screen (v8), drawn on one 1920×1080 canvas as a function of time. The same canvas is the
// texture of the 3D tablet in the opening and the screen of the tablet in the room, so diving into the screen is
// seamless. Generated portraits in the seats, a matte slate board with ink strokes (src/js/ink.js), the class
// tools on the right lighting up as they are used: 빨리 답하기 → 각자 칠판 (+ 타이머) → 트로피.
import { E, tw, prog, clamp, lerp, catmull } from './core.js';
import { inkStroke, slate } from './ink.js';
import { whaleStrokes } from './whalegeo.js';

export const CW = 1920, CH = 1080;
export const BOARD = { x: 40, y: 254, w: 1390, h: 786 };
export const WC = [BOARD.x + 760, BOARD.y + 470], WS = 1.9; // the teacher's whale on the board (whale-local → class px)
export const TILES = [[40, 260], [312, 214], [538, 214], [764, 214], [990, 214], [1216, 214]].map(([x, w]) => ({ x, y: 80, w, h: 160 }));
const PENS = ['#9FD0FF', '#F59A23', '#F29BB8', '#F6C343']; // 도윤 날개 · 하린 풍선 · 민준 구름 · 지아 별
const DRAWER = [2, 3, 4, 5]; // seats of the four friends who draw
export const onBoard = ([x, y]) => [WC[0] + x * WS, WC[1] + y * WS];

const ring = (cx, cy, r, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const cloud = (cx, cy, s) => { const p = []; for (let i = 0; i <= 80; i++) { const a = Math.PI + (i / 80) * Math.PI * 2; const r = s * (1 + 0.22 * Math.abs(Math.sin(a * 2.5))); p.push([cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.75]); } return p; };
const star = (cx, cy, r) => { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.42 : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
// the friends' parts in whale-local units: wings on the back, balloons tied above, clouds and stars around
export const PARTS = [
  [catmull([[-30, -66], [-80, -150], [10, -190], [50, -76]], 10), catmull([[-34, -100], [-10, -140]], 5), catmull([[-12, -86], [18, -130]], 5)],
  [ring(150, -190, 30), [[150, -160], [95, -62]], ring(222, -168, 33), [[222, -135], [110, -52]]],
  [cloud(-330, 60, 34), cloud(258, 92, 28)],
  [star(240, -232, 19), star(-330, -40, 14), star(300, -150, 12)],
];
const bbox = strokes => { const xs = strokes.flat().map(p => p[0]), ys = strokes.flat().map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const PB = PARTS.map(bbox);

function loadImg(src) { const i = new Image(); i.src = src; return i; }
// v8.1 · the question, handwritten by the pen: each syllable is one quick run with the tip on the glass (down and
// up again while it crosses the syllable); between syllables the tip lifts a hair and travels, higher over the
// spaces. One path shared by the board (ink shows only where the tip has been), the 3D pen (devices.js) and the
// sound (cues.js: the friction follows the tip's speed). Tip in class px, lift z in world units, contact c 0/1.
export function makeQuizPen(T, copy) {
  const X0 = BOARD.x + 110, BASE = BOARD.y + 176, GH = 44;
  const mj = u => u * u * u * (10 - 15 * u + 6 * u * u); // minimum-jerk
  let S = null;
  function layout() {
    const c = document.createElement('canvas').getContext('2d');
    c.font = '62px NanumPen';
    const ch = [...copy.quiz[1]], G = [];
    let x = 0;
    ch.forEach((g, i) => { const x1 = c.measureText(ch.slice(0, i + 1).join('')).width; G.push({ g, x0: x, w: x1 - x, sp: g === ' ' }); x = x1; });
    const wt = g => (g.sp ? 0.55 : g.g === '?' ? 0.8 : 1), tot = G.reduce((a, g) => a + wt(g), 0);
    let tt = T.quizA;
    for (const g of G) { g.t0 = tt; tt += (T.quizB - T.quizA) * wt(g) / tot; g.t1 = tt; }
    // segments: contact over a syllable, then a lift to the next syllable's start
    const ink = G.filter(g => !g.sp), seg = [];
    ink.forEach((g, j) => {
      const ph = j * 1.3, down = g.t0 + (g.t1 - g.t0) * 0.74;
      const yAt = u => BASE - GH * (0.47 + 0.3 * Math.cos(u * Math.PI * 2 + ph));
      seg.push({ c: 1, t0: g.t0, t1: down, g, yAt });
      const nx = ink[j + 1];
      if (nx) seg.push({ c: 0, t0: down, t1: nx.t0, a: [X0 + g.x0 + g.w * 0.9, yAt(1)], b: [X0 + nx.x0 + nx.w * 0.1, BASE - GH * (0.47 + 0.3 * Math.cos((j + 1) * 1.3))], hop: G.indexOf(nx) - G.indexOf(g) > 1 ? 0.05 : 0.018, g });
    });
    S = { seg, G, last: ink[ink.length - 1] };
  }
  return t => {
    if (!S) layout();
    const { seg } = S;
    if (t < seg[0].t0) { const s0 = seg[0]; return { x: X0 + s0.g.x0 + s0.g.w * 0.1, y: s0.yAt(0), z: 0, c: t >= T.penTap ? 1 : 0, reveal: 0 }; }
    let i = 0; while (i < seg.length - 1 && t >= seg[i].t1) i++;
    const sg = seg[i], u = clamp((t - sg.t0) / (sg.t1 - sg.t0)), m = mj(u);
    if (sg.c) {
      const g = sg.g;
      return { x: X0 + g.x0 + g.w * (0.1 + 0.8 * m), y: sg.yAt(u), z: 0, c: 1, reveal: g.x0 + g.w * clamp(m * 1.1) };
    }
    return { x: lerp(sg.a[0], sg.b[0], m), y: lerp(sg.a[1], sg.b[1], m), z: sg.hop * Math.sin(Math.PI * u), c: 0, reveal: sg.g.x0 + sg.g.w };
  };
}


export function createClassUI(ctx) {
  const { T, copy } = ctx;
  const quizPen = makeQuizPen(T, copy);
  const canvas = document.createElement('canvas');
  canvas.width = CW; canvas.height = CH;
  const k = canvas.getContext('2d');
  const faces = [0, 1, 2, 3, 4, 5].map(i => loadImg(`assets/gen/face_${i}.jpg`));
  const logo = loadImg('assets/logo-240.png');
  const names = [`${copy.teacher} 선생님`, ...copy.classmates];
  const whale = whaleStrokes().map(s => s.pts.map(onBoard));
  const wLen = whale.map(len), wTot = wLen.reduce((a, b) => a + b, 0);
  let last = -1;

  function len(p) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
  // draw a group of strokes progressively (u 0..1 over their total length), with the pen's light at the tip
  function strokes(list, lens, total, u, o) {
    let acc = 0, tip = null;
    list.forEach((pts, j) => {
      const a0 = acc / total, a1 = (acc + lens[j]) / total;
      acc += lens[j];
      const kk = clamp((u - a0) / (a1 - a0));
      if (kk <= 0) return;
      inkStroke(k, pts, { ...o, u: kk, seed: (o.seed || 1) + j });
      if (kk < 1) { const n = Math.max(1, Math.round((pts.length - 1) * kk)); tip = pts[n]; }
    });
    if (tip && u < 1) head(tip[0], tip[1], o.glow || '170,240,110');
  }
  function head(x, y, rgb, s = 1) {
    k.save();
    k.globalCompositeOperation = 'lighter';
    let g = k.createRadialGradient(x, y, 0, x, y, 54 * s);
    g.addColorStop(0, 'rgba(255,255,240,0.95)'); g.addColorStop(0.16, `rgba(${rgb},0.7)`); g.addColorStop(1, `rgba(${rgb},0)`);
    k.fillStyle = g; k.fillRect(x - 54 * s, y - 54 * s, 108 * s, 108 * s);
    k.restore();
  }
  const rr = (x, y, w, h, r) => { k.beginPath(); k.roundRect(x, y, w, h, r); };

  function header() {
    k.fillStyle = '#0F1114'; k.fillRect(0, 0, CW, 66);
    if (logo.naturalWidth) k.drawImage(logo, 36, 18, 150, 150 * logo.naturalHeight / logo.naturalWidth);
    k.fillStyle = '#ECEDEA'; k.font = '800 26px Pretendard'; k.fillText(copy.course, 206, 42);
    rr(372, 22, 74, 28, 14); k.fillStyle = 'rgba(126,217,87,0.16)'; k.fill();
    k.fillStyle = '#7ED957'; k.beginPath(); k.arc(388, 36, 5, 0, Math.PI * 2); k.fill();
    k.font = '800 15px Pretendard'; k.fillText('LIVE', 400, 41);
    k.fillStyle = '#8E918C'; k.font = '400 18px Pretendard'; k.fillText(`${copy.teacher} 선생님의 수업`, 462, 41);
    k.textAlign = 'right'; k.fillText('00:18:42', 1886, 41); k.textAlign = 'left';
  }

  function seats(t) {
    const winner = 2; // 도윤 presses first
    TILES.forEach((s, i) => {
      k.save(); rr(s.x, s.y, s.w, s.h, 12); k.clip();
      const f = faces[i];
      if (f.naturalWidth) { const sw = Math.min(f.naturalWidth, f.naturalHeight * s.w / s.h), sh = sw * s.h / s.w; k.drawImage(f, (f.naturalWidth - sw) / 2, (f.naturalHeight - sh) * 0.3, sw, sh, s.x, s.y, s.w, s.h); }
      const g = k.createLinearGradient(0, s.y + s.h - 60, 0, s.y + s.h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      k.fillStyle = g; k.fillRect(s.x, s.y + s.h - 60, s.w, 60);
      // (v8.4) 딩! the winner's hand goes up — ClassIn's yellow raised-hand figure rises out of the tile's bottom edge,
      // the arm gives a little wave; it goes back down as the boards open
      if (i === winner && t >= T.ding && t < T.boardsA + 0.15) {
        const up = E.outBack(prog(t, T.ding, T.ding + 0.3)) * (1 - E.inCubic(prog(t, T.boardsA - 0.2, T.boardsA + 0.1)));
        const dt = t - T.ding, wave = 0.22 * Math.sin(dt * 15) * Math.exp(-dt * 3.2);
        raisedHand(s.x + s.w - 40, s.y + s.h + (1 - up) * 170, 1.6, wave);
      }
      k.restore();
      k.font = '600 17px Pretendard';
      const tw2 = k.measureText(names[i]).width;
      rr(s.x + 8, s.y + s.h - 34, tw2 + 16, 26, 7); k.fillStyle = 'rgba(16,18,20,0.72)'; k.fill();
      k.fillStyle = '#fff'; k.fillText(names[i], s.x + 16, s.y + s.h - 15);
      // quick answer: the seats light in turn, then the winner's rings
      let lit = 0;
      if (t > T.buzzA && t < T.ding) { const step = Math.floor((t - T.buzzA) / 0.1); lit = i >= 1 && ((step % 5) + 1 === i) ? 1 : 0; }
      if (i === winner && t >= T.ding) lit = 1 - 0.5 * prog(t, T.ding + 0.6, T.boardsA);
      const drawing = DRAWER.indexOf(i);
      if (drawing >= 0 && t > T.boardsA && t < T.assembleB) lit = Math.max(lit, 0.6);
      if (lit > 0) {
        k.save(); k.shadowColor = 'rgba(140,230,80,0.9)'; k.shadowBlur = 22 * lit;
        rr(s.x + 1.5, s.y + 1.5, s.w - 3, s.h - 3, 12); k.strokeStyle = drawing >= 0 && t > T.boardsA ? PENS[drawing] : '#8BE05A'; k.lineWidth = 4; k.globalAlpha = lit; k.stroke(); k.restore();
      }
      // trophies: a gold cup badge with a count
      const cupT = i === winner ? T.trophyA : drawing >= 0 ? T.trophyA + 0.06 * drawing + 0.1 : null;
      if (cupT && t > cupT + 0.28) {
        const pop = E.outBack(prog(t, cupT + 0.28, cupT + 0.5));
        cup(s.x + s.w - 30, s.y + 30, 24 * pop, i === winner ? '+2' : '+1');
      }
    });
    // "딩!" — the winner of the quick answer
    if (t >= T.ding && t < T.boardsA + 0.2) {
      const s = TILES[winner], p = E.outBack(prog(t, T.ding, T.ding + 0.25)), a = 1 - prog(t, T.boardsA - 0.2, T.boardsA + 0.2);
      k.save(); k.globalAlpha = a; k.translate(s.x + s.w / 2, s.y + s.h + 34); k.scale(p, p);
      rr(-78, -26, 156, 52, 26); k.fillStyle = '#7ED957'; k.shadowColor = 'rgba(126,217,87,0.8)'; k.shadowBlur = 24; k.fill(); k.shadowBlur = 0;
      k.fillStyle = '#0E1A0A'; k.font = '800 26px Pretendard'; k.textAlign = 'center'; k.fillText('딩! 1등', 0, 9); k.restore();
    }
  }

  // ClassIn's raised-hand figure (as on a student's video tile): torso from the bottom edge, head, the left arm up
  function raisedHand(cx, by, sc, wave = 0) {
    const Y = '#FFDD25', gap = 'rgba(40,40,40,0.9)';
    k.save(); k.translate(cx, by); k.scale(sc, sc);
    k.fillStyle = Y;
    rr(-24.5, -29, 49, 40, [12, 12, 0, 0]); k.fill();                     // torso
    k.save(); k.translate(-17, -20); k.rotate(wave);                      // the arm, about the shoulder
    k.strokeStyle = Y; k.lineWidth = 13; k.lineCap = 'round';
    k.beginPath(); k.moveTo(0, 8); k.lineTo(-14, -52); k.stroke();
    k.restore();
    k.beginPath(); k.arc(1, -45, 16.5, 0, Math.PI * 2); k.fillStyle = gap; k.fill();   // the head, cut out of the arm
    k.beginPath(); k.arc(1, -45, 14, 0, Math.PI * 2); k.fillStyle = Y; k.fill();
    k.fillStyle = gap; k.fillRect(10, -14, 1.6, 30);                     // the line of the other arm, down the side
    k.restore();
  }

  function cup(x, y, r, label) {
    if (r <= 0.5) return;
    k.save(); k.translate(x, y); k.scale(r / 24, r / 24);
    k.shadowColor = 'rgba(255,200,60,0.7)'; k.shadowBlur = 12;
    k.beginPath(); k.arc(0, 0, 24, 0, Math.PI * 2); k.fillStyle = 'rgba(20,18,10,0.82)'; k.fill(); k.shadowBlur = 0;
    const g = k.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#FFE9A3'); g.addColorStop(0.55, '#F5C542'); g.addColorStop(1, '#C98A12');
    k.fillStyle = g;
    k.beginPath(); k.moveTo(-10, -12); k.lineTo(10, -12); k.lineTo(10, -4); k.quadraticCurveTo(10, 6, 0, 7); k.quadraticCurveTo(-10, 6, -10, -4); k.closePath(); k.fill();
    k.fillRect(-3, 6, 6, 5); k.fillRect(-7, 10, 14, 4);
    k.strokeStyle = '#F5C542'; k.lineWidth = 2.5; k.beginPath(); k.arc(-12, -6, 4, Math.PI * 0.5, Math.PI * 1.5); k.stroke(); k.beginPath(); k.arc(12, -6, 4, -Math.PI * 0.5, Math.PI * 0.5); k.stroke();
    k.fillStyle = '#FFE9A3'; k.font = '800 13px Pretendard'; k.textAlign = 'center'; k.fillText(label, 0, 40);
    k.restore();
  }

  function panel(t) {
    rr(1460, 80, 420, 960, 14); k.fillStyle = '#181A1E'; k.fill();
    k.fillStyle = '#ECEDEA'; k.font = '800 20px Pretendard'; k.fillText('수업 도구', 1486, 120);
    const on = [[T.buzzA - 0.1, T.boardsA - 0.2], [T.boardsA - 0.1, T.assembleB], [T.trophyA - 0.05, T.lift], [T.boardsA - 0.1, T.assembleA]];
    copy.tools.forEach((name, i) => {
      const y = 140 + i * 62, a = tw(t, on[i][0], on[i][0] + 0.15) * (1 - tw(t, on[i][1], on[i][1] + 0.2));
      rr(1478, y, 384, 50, 12); k.fillStyle = a > 0.01 ? `rgba(126,217,87,${(0.14 * a).toFixed(3)})` : 'rgba(255,255,255,0.03)'; k.fill();
      if (a > 0.01) { k.save(); k.globalAlpha = a; k.strokeStyle = '#7ED957'; k.lineWidth = 2; k.stroke(); k.restore(); }
      toolIcon(i, 1504, y + 25, a);
      k.fillStyle = a > 0.5 ? '#E9FFD6' : '#B5B7B2'; k.font = '600 19px Pretendard'; k.fillText(name, 1532, y + 32);
      if (i === 3 && a > 0.01) { // the timer counts down while everyone draws
        const left = Math.max(0, Math.ceil(30 * (1 - prog(t, T.boardsA, T.assembleA + 1.4))));
        k.fillStyle = '#F6C343'; k.font = '800 19px Pretendard'; k.textAlign = 'right'; k.fillText(`0:${String(left).padStart(2, '0')}`, 1846, y + 32); k.textAlign = 'left';
      }
    });
    k.fillStyle = '#ECEDEA'; k.font = '800 20px Pretendard'; k.fillText('채팅', 1486, 432);
    const at = [T.quizA + 0.1, T.ding + 0.18, T.boardsA - 0.25, T.draw2 + 0.25, T.draw4 + 0.2];
    let y = 456;
    copy.chat.forEach(([who, msg], i) => {
      const a = tw(t, at[i], at[i] + 0.2, E.outCubic);
      if (a <= 0) return;
      const tch = who.includes('선생님');
      k.save(); k.globalAlpha = a; k.translate(0, (1 - a) * 14);
      k.fillStyle = '#8E918C'; k.font = '600 15px Pretendard'; k.fillText(who, 1488, y + 16);
      k.font = '600 18px Pretendard'; const w = Math.min(360, k.measureText(msg).width + 32);
      rr(1484, y + 24, w, 44, 12); k.fillStyle = tch ? '#2E4A7A' : '#2A2C31'; k.fill();
      k.fillStyle = '#F2F2EE'; k.fillText(msg, 1500, y + 53);
      k.restore();
      y += 86;
    });
  }

  function toolIcon(i, x, y, a) {
    k.save(); k.translate(x, y); k.strokeStyle = a > 0.5 ? '#9FE07A' : '#8E918C'; k.fillStyle = k.strokeStyle; k.lineWidth = 2.2; k.lineCap = 'round'; k.lineJoin = 'round';
    if (i === 0) { k.beginPath(); k.arc(0, 2, 9, Math.PI, 0); k.lineTo(9, 6); k.lineTo(-9, 6); k.closePath(); k.stroke(); k.beginPath(); k.moveTo(-12, 10); k.lineTo(12, 10); k.stroke(); }
    else if (i === 1) { for (const [dx, dy] of [[-9, -9], [1, -9], [-9, 1], [1, 1]]) { k.strokeRect(dx, dy, 8, 8); } }
    else if (i === 2) { k.beginPath(); k.moveTo(-7, -9); k.lineTo(7, -9); k.lineTo(7, -3); k.quadraticCurveTo(7, 4, 0, 5); k.quadraticCurveTo(-7, 4, -7, -3); k.closePath(); k.stroke(); k.beginPath(); k.moveTo(0, 5); k.lineTo(0, 9); k.moveTo(-5, 10); k.lineTo(5, 10); k.stroke(); }
    else { k.beginPath(); k.arc(0, 1, 9, 0, Math.PI * 2); k.stroke(); k.beginPath(); k.moveTo(0, 1); k.lineTo(0, -4); k.moveTo(0, 1); k.lineTo(4, 3); k.moveTo(-3, -11); k.lineTo(3, -11); k.stroke(); }
    k.restore();
  }

  function board(t) {
    slate(k, BOARD.x, BOARD.y, BOARD.w, BOARD.h, { r: 14 });
    // tool rail and pages
    rr(BOARD.x + 16, BOARD.y + 18, 48, 360, 12); k.fillStyle = 'rgba(0,0,0,0.25)'; k.fill();
    for (let i = 0; i < 6; i++) { rr(BOARD.x + 24, BOARD.y + 28 + i * 56, 32, 32, 8); k.fillStyle = i === 0 ? 'rgba(126,217,87,0.25)' : 'rgba(255,255,255,0.05)'; k.fill(); }
    // the quiz: a printed label, and the question handwritten by the pen — ink only where its tip has been
    k.save();
    k.font = '600 30px Pretendard'; k.fillStyle = 'rgba(244,244,239,0.6)'; k.textBaseline = 'alphabetic';
    k.fillText(copy.quiz[0], BOARD.x + 112, BOARD.y + 92);
    k.restore();
    const qp = quizPen(t);
    if (qp.reveal > 0) {
      k.save();
      k.font = '62px NanumPen';
      k.shadowColor = 'rgba(0,0,0,0.45)'; k.shadowBlur = 5; k.shadowOffsetY = 2;
      k.beginPath(); k.rect(BOARD.x + 100, BOARD.y + 110, qp.reveal + 10, 100); k.clip(); k.fillStyle = '#A6E86A'; k.fillText(copy.quiz[1], BOARD.x + 110, BOARD.y + 176);
      k.restore();
    }
    if (t > T.penTap && t < T.quizB + 0.05 && qp.c) head(qp.x, qp.y + 6, '170,240,110', 0.55);
    // the teacher's whale
    const wu = prog(t, T.whaleDrawA, T.whaleDrawB);
    if (wu > 0) strokes(whale, wLen, wTot, E.inOutSine(wu), { w: 4.6, color: '#F2F2EE', sheen: 0.45, shadow: 0.6, grain: 0.7, seed: 1 });
    // the friends' parts, once assembled onto the whale
    const asm = prog(t, T.assembleA, T.assembleB);
    PARTS.forEach((part, j) => {
      const d = clamp((asm - j * 0.12) / 0.64);
      if (d < 1) return;
      part.forEach((pts, m) => inkStroke(k, pts.map(onBoard), { w: j === 1 && m % 2 ? 2.4 : 5, color: j === 1 && m % 2 ? '#CFC6B4' : PENS[j], seed: 20 + j * 5 + m, sheen: j === 1 && m % 2 ? 0 : 0.4 }));
    });
  }

  // everyone's own board: four small slates pop out of the seats, each friend draws a part, then they fly onto the whale
  function smallBoards(t) {
    if (t < T.boardsA || t > T.assembleB + 0.05) return;
    const drawT = [T.draw1, T.draw2, T.draw3, T.draw4];
    const asm = prog(t, T.assembleA, T.assembleB);
    // dim the big board a little while the small ones are up
    const dim = tw(t, T.boardsA, T.boardsA + 0.2) * (1 - tw(t, T.assembleA, T.assembleA + 0.3));
    if (dim > 0) { k.fillStyle = `rgba(8,9,11,${(0.45 * dim).toFixed(3)})`; rr(BOARD.x, BOARD.y, BOARD.w, BOARD.h, 14); k.fill(); }
    PARTS.forEach((part, j) => {
      const s = TILES[DRAWER[j]];
      const pop = E.outBack(prog(t, T.boardsA + j * 0.07, T.boardsA + j * 0.07 + 0.32));
      const d = E.inOutCubic(clamp((asm - j * 0.12) / 0.64));
      if (pop <= 0 || d >= 1) return;
      // card rect: from the seat to its place on the board, then flying onto the whale (shrinking into the part's bbox)
      const cw = 300, chh = 200, cx0 = BOARD.x + 120 + j * 330 + cw / 2, cy0 = BOARD.y + 560;
      const sx0 = s.x + s.w / 2, sy0 = s.y + s.h / 2;
      let cx = lerp(sx0, cx0, pop), cy = lerp(sy0, cy0, pop), sc = lerp(0.3, 1, Math.min(1, pop));
      const [bx0, by0, bx1, by1] = PB[j];
      const fit = Math.min((cw - 56) / (bx1 - bx0), (chh - 56) / (by1 - by0));
      const pcx = (bx0 + bx1) / 2, pcy = (by0 + by1) / 2;
      const tgt = onBoard([pcx, pcy]);
      cx = lerp(cx, tgt[0], d); cy = lerp(cy, tgt[1], d);
      const ps = lerp(fit, WS, d); // part scale: mini → board
      const cardA = 1 - clamp(d * 1.6);
      k.save();
      if (cardA > 0) {
        k.globalAlpha = cardA;
        k.translate(cx, cy); k.rotate((1 - d) * (j - 1.5) * 0.035); k.scale(sc * lerp(1, ps / fit, d), sc * lerp(1, ps / fit, d));
        k.shadowColor = 'rgba(0,0,0,0.5)'; k.shadowBlur = 30; k.shadowOffsetY = 10;
        rr(-cw / 2, -chh / 2, cw, chh, 14); k.fillStyle = '#25272C'; k.fill(); k.shadowBlur = 0; k.shadowOffsetY = 0;
        k.strokeStyle = PENS[j]; k.lineWidth = 3; k.stroke();
        k.fillStyle = '#B5B7B2'; k.font = '600 16px Pretendard'; k.fillText(`${copy.classmates[DRAWER[j] - 1]} · ${copy.parts[j]}`, -cw / 2 + 14, -chh / 2 + 26);
        k.setTransform(1, 0, 0, 1, 0, 0);
        k.globalAlpha = 1;
      }
      k.restore();
      // the part itself (drawn progressively in its window), mapped from mini-board space to board space
      const u = prog(t, drawT[j], drawT[j] + 0.42);
      if (u <= 0) return;
      const map = ([x, y]) => [cx + (x - pcx) * ps * (d > 0 ? 1 : sc), cy + (y - pcy) * ps * (d > 0 ? 1 : sc)];
      const lens = part.map(p => len(p));
      strokes(part.map(p => p.map(map)), lens, lens.reduce((a, b) => a + b, 0), u, { w: lerp(4.2, 5, d), color: PENS[j], seed: 20 + j * 5, glow: ['160,210,255', '255,180,90', '255,170,200', '255,220,110'][j] });
    });
  }

  // gold cups flying from the board into the seats
  function trophies(t) {
    if (t < T.trophyA || t > T.trophyA + 0.9) return;
    [2, ...DRAWER].forEach((seat, n) => {
      const t0 = T.trophyA + (n === 0 ? 0 : 0.06 * (n - 1) + 0.1);
      const u = prog(t, t0, t0 + 0.32);
      if (u <= 0 || u >= 1) return;
      const s = TILES[seat], a = [WC[0], WC[1] - 120], b = [s.x + s.w - 30, s.y + 30];
      const e = E.inOutCubic(u), x = lerp(a[0], b[0], e), y = lerp(a[1], b[1], e) - Math.sin(u * Math.PI) * 160;
      cup(x, y, 30 - 6 * u, '');
      head(x, y, '255,200,90', 0.6);
    });
  }

  return {
    canvas,
    ready: Promise.all([...faces, logo].map(i => i.decode().catch(() => {}))),
    draw(t) {
      if (t === last) return;
      last = t;
      k.setTransform(1, 0, 0, 1, 0, 0);
      k.globalAlpha = 1; k.globalCompositeOperation = 'source-over';
      k.fillStyle = '#121417'; k.fillRect(0, 0, CW, CH);
      header();
      board(t);
      smallBoards(t);
      seats(t);
      trophies(t);
      panel(t);
    },
  };
}
