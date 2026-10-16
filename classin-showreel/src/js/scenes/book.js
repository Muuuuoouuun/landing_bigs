// S1 · 질문과 책 (0.00–4.80): night, a dark desk. A spark of 연두 light writes a question in Seo-yun's
// notebook — "만약에 고래가 하늘을 난다면?" — and the question mark glows. The light jumps to the open
// science book beside it, turns its pages, reads about whales and buoyancy, and the words begin to lift
// off the page (the knowledge module takes the tokens from there). Only what the light touches is lit.
import { E, tw, prog, clamp, lerp, M4, xf, place, planeModel, bezier, slice, h } from '../core.js';
import { project } from '../line.js';

export const PW = 500, PH = 680, TILT = 4;
export const NOTE = { x: -860, y: 110, w: 470, h: 600, rz: -6 };
export const TABLET = { x: 930, y: 70, w: 660, h: 392, rz: 5, bez: 22 };

const wrap = s => s.split(' ').map(w => `<span class="tk">${w}</span>`).join(' ');

// spreads: [left, right] — the last spread's .tk spans are the tokens that lift off
const SPREADS = [
  [
    `<div class="ph">국어 · 2단원</div><h3>이야기의 힘</h3>
     <p>옛날 옛적, 바다가 보이는 작은 마을에 질문이 많은 아이가 살았습니다. 아이는 매일 저녁 등대 아래에 앉아 별을 세었습니다.</p>
     <p>“별은 왜 밤에만 보일까?” 아이의 물음은 바람을 타고 바다 건너까지 퍼져 나갔습니다.</p><div class="pn">24</div>`,
    `<p>할머니는 웃으며 말했습니다. “궁금한 마음이 있으면, 이야기는 언제나 시작된단다.”</p>
     <div class="pic"><svg viewBox="0 0 300 150"><path d="M0 120 L70 60 L120 100 L180 40 L300 120" fill="none" stroke="#B9AE98" stroke-width="3"/><circle cx="240" cy="40" r="16" fill="none" stroke="#B9AE98" stroke-width="3"/></svg></div>
     <p>그날 밤, 아이는 처음으로 자신의 이야기를 공책에 적기 시작했습니다.</p><div class="pn">25</div>`,
  ],
  [
    `<div class="ph">과학 · 3단원</div><h3>태양계 여행</h3>
     <div class="pic"><svg viewBox="0 0 300 170"><circle cx="150" cy="85" r="16" fill="#E9C46A"/><ellipse cx="150" cy="85" rx="60" ry="24" fill="none" stroke="#B9AE98" stroke-width="2"/><ellipse cx="150" cy="85" rx="100" ry="42" fill="none" stroke="#B9AE98" stroke-width="2"/><ellipse cx="150" cy="85" rx="140" ry="62" fill="none" stroke="#B9AE98" stroke-width="2"/><circle cx="210" cy="85" r="6" fill="#7FB3D5"/><circle cx="62" cy="62" r="8" fill="#D98C6A"/></svg></div>
     <p>지구는 하루에 한 바퀴 스스로 돌고, 일 년에 한 바퀴 태양 둘레를 돕니다.</p><div class="pn">58</div>`,
    `<h4>달의 모양 변화</h4><div class="moons"><i></i><i></i><i></i><i></i><i></i></div>
     <p>달은 스스로 빛을 내지 않습니다. 햇빛을 받아 반사하기 때문에 모양이 바뀌어 보입니다.</p><div class="pn">59</div>`,
  ],
  [
    `<div class="ph">과학 · 4단원</div><h3>하늘을 나는 것들</h3>
     <div class="pic"><svg viewBox="0 0 300 170"><path d="M30 120 C 90 60, 160 60, 230 100" fill="none" stroke="#B9AE98" stroke-width="3"/><path d="M200 70 l40 10 -30 24 z" fill="none" stroke="#8A8272" stroke-width="3"/><circle cx="80" cy="60" r="22" fill="none" stroke="#B9AE98" stroke-width="3"/><path d="M80 82 v30" stroke="#B9AE98" stroke-width="2"/></svg></div>
     <p>새는 날개로 공기를 밀어 내고, 풍선은 공기보다 가벼워서 떠오릅니다.</p><div class="pn">70</div>`,
    `<h4>생각해 볼까요?</h4><ol><li>왜 배는 물에 뜰까?</li><li>구름은 왜 떨어지지 않을까?</li></ol>
     <p>뜨는 것과 가라앉는 것에는 어떤 차이가 있을까요?</p><div class="pn">71</div>`,
  ],
  [
    `<div class="ph">과학 · 5단원</div><h3><span class="tk">바다의</span> <span class="tk">거인,</span> <span class="tk">고래</span></h3>
     <p class="big">${wrap('고래는 바다에 살지만 물고기가 아니에요. 숨을 쉬러 물 위로 올라오고, 노래로 멀리 있는 친구를 부릅니다.')}</p>
     <div class="chips"><span class="tk chip">바다</span><span class="tk chip">고래</span><span class="tk chip">노래</span><span class="tk chip">숨</span><span class="tk chip">파도</span></div>
     <div class="pic sm"><span class="tk svgk"><svg viewBox="0 0 120 120"><path d="M14 64 C 30 40, 80 36, 98 58 C 104 50, 112 44, 114 40 C 112 52, 110 60, 104 66 C 86 86, 34 88, 14 64 Z" fill="none" stroke="#7FA6C0" stroke-width="4" stroke-linejoin="round"/><circle cx="36" cy="60" r="3" fill="#7FA6C0"/></svg></span>
       <span class="tk svgk"><svg viewBox="0 0 120 120"><path d="M8 70 C 24 54, 40 54, 56 70 S 88 86, 112 64" fill="none" stroke="#9C927F" stroke-width="4"/><path d="M8 90 C 24 74, 40 74, 56 90 S 88 106, 112 84" fill="none" stroke="#C3B9A6" stroke-width="3"/></svg></span></div><div class="pn">86</div>`,
    `<div class="ph r">뜨고 가라앉는 힘</div>
     <div class="hand"><span class="tk">뜨는</span> <span class="tk">힘</span> <span class="tk">&gt;</span> <span class="tk">무게</span></div>
     <div class="row"><span class="tk sym">하늘</span><span class="tk sym">구름</span><span class="tk sym">바람</span><span class="tk sym">날개</span></div>
     <p class="big">${wrap('물이 밀어 올리는 힘을 부력이라고 해요. 무거운 배도, 커다란 고래도 그래서 물에 뜰 수 있어요.')}</p>
     <div class="row en"><span class="tk">whale</span> <span class="tk">sky</span> <span class="tk">air</span> <span class="tk">float</span> <span class="tk">?</span></div><div class="pn">87</div>`,
  ],
];

export default function bookScene(ctx) {
  const { T, copy } = ctx;
  const el = h('section', 'scene book');
  ctx.root.appendChild(el);

  const plane = (cls, w, hh, html) => { const d = h('div', `obj ${cls}`, html); d.style.width = `${w}px`; d.style.height = `${hh}px`; el.appendChild(d); return d; };
  const desk = plane('desk', 5200, 3200);
  const shadow = plane('bshadow', 1500, 1060);
  const nShadow = plane('bshadow', NOTE.w + 260, NOTE.h + 220);
  const note = plane('note', NOTE.w, NOTE.h, `<i class="rings"></i><div class="nd">10월 16일 (목)</div>
    <div class="nl l1"><span>${copy.question[0]}</span></div><div class="nl l2"><span>${copy.question[1].slice(0, -1)}<em class="qm">?</em></span></div>`);
  const cover = plane('bcover', PW * 2 + 44, PH + 36);
  const stackL = plane('bstack l', PW + 8, PH + 10), stackR = plane('bstack r', PW + 8, PH + 10);
  const pageL = plane('page l', PW, PH), pageR = plane('page r', PW, PH);
  const ribbon = plane('ribbon', 22, 150);
  const flip = plane('page flip', PW, PH);
  const flipB = plane('page l flipb', PW, PH);
  const night = h('div', 'nightpool');
  el.appendChild(night);
  const shadeR = h('div', 'shade'); pageR.appendChild(shadeR);
  const mk = (html, side) => h('div', `pin ${side}`, html);
  const faces = SPREADS.map(([l, r], i) => [mk(l, i === 3 ? 'l fin' : 'l'), mk(r, i === 3 ? 'r fin' : 'r')]);
  const fShade = h('div', 'shade'), bShade = h('div', 'shade');
  const lines = [...note.querySelectorAll('.nl span')], qm = note.querySelector('.qm');

  function setPage(p, node, shadeEl) {
    if (p.firstChild === node) return;
    p.replaceChildren(node);
    if (shadeEl) p.appendChild(shadeEl);
  }
  const MR = M4.chain(M4.RY(-TILT), M4.T(0, -PH / 2, 0));
  const ML = M4.chain(M4.RY(TILT), M4.T(-PW, -PH / 2, 0));
  const MN = planeModel(NOTE.x, NOTE.y, 0, NOTE.w, NOTE.h, { rz: NOTE.rz });
  const flipT = [[T.flip1 - 0.06, T.flip1 + 0.24], [T.flip2 - 0.04, T.flip2 + 0.24], [T.flip3 - 0.02, T.flip3 + 0.3]];
  const flipModel = a => M4.chain(M4.RY(lerp(-TILT, -180 + TILT, a)), M4.RX(Math.sin(a * Math.PI) * 3), M4.T(0, -PH / 2, Math.sin(a * Math.PI) * 30));

  const tokens = [];
  const finalL = faces[3][0], finalR = faces[3][1];
  const backL = mk(SPREADS[3][0], 'l fin');
  let NL = null; // handwriting lines in notebook-local px
  function layout() {
    setPage(pageL, finalL); setPage(pageR, finalR, shadeR);
    for (const [face, M] of [[finalL, ML], [finalR, MR]]) {
      const pg = face.parentElement, keep = pg.style.transform;
      pg.style.transform = 'none';
      const R0 = pg.getBoundingClientRect();
      for (const sp of face.querySelectorAll('.tk')) {
        const rc = [...sp.getClientRects()].find(q => q.width > 2) || sp.getBoundingClientRect();
        const sc = R0.width / pg.offsetWidth;
        const x = (rc.left - R0.left) / sc, y = (rc.top - R0.top) / sc;
        const w = sp.offsetWidth, hh = sp.offsetHeight;
        const cs = getComputedStyle(sp);
        const tk = h('div', `tok ${sp.className.replace('tk', '').trim()}`, sp.innerHTML);
        tk.style.font = cs.font; tk.style.letterSpacing = cs.letterSpacing;
        tk.style.width = `${w + 1}px`; tk.style.height = `${hh}px`;
        if (sp.classList.contains('chip')) { tk.style.borderRadius = cs.borderRadius; tk.style.padding = cs.padding; }
        tokens.push({ el: tk, src: sp, w, h: hh, page: face === finalL ? 'L' : 'R', M, x, y, word: sp.textContent });
      }
      pg.style.transform = keep;
    }
    for (const t of tokens) ctx.tokLayer.appendChild(t.el);
    // the notebook's handwriting
    const keep = note.style.transform;
    note.style.transform = 'none';
    const N0 = note.getBoundingClientRect(), sc = N0.width / note.offsetWidth;
    NL = lines.map(sp => { const r = sp.getBoundingClientRect(); return { x: (r.left - N0.left) / sc, y: (r.top - N0.top) / sc, w: r.width / sc, h: r.height / sc }; });
    const q = qm.getBoundingClientRect();
    NL.q = { x: (q.left - N0.left) / sc + q.width / sc / 2, y: (q.top - N0.top) / sc + q.height / sc * 0.45 };
    note.style.transform = keep;
  }
  ctx.tokens = tokens;
  ctx.book = { ML, MR, PW, PH };

  // the pen tip while writing: line 1 then line 2, with a little handwriting wobble
  const writeK = t => tw(t, T.writeA, T.writeB, E.linear);
  function penAt(t) {
    const k = writeK(t);
    const w0 = NL[0].w, w1 = NL[1].w, tot = w0 + w1;
    const s = k * tot;
    const L = s < w0 ? NL[0] : NL[1], u = s < w0 ? s / w0 : (s - w0) / w1;
    const x = L.x + L.w * u, y = L.y + L.h * (0.62 + 0.18 * Math.sin(t * 47) + 0.08 * Math.sin(t * 23));
    return { local: [x, y], world: xf(MN, x, y, 0), line: s < w0 ? 0 : 1, u };
  }
  const qWorld = () => xf(MN, NL.q.x, NL.q.y, 0);
  const JUMP_TO = [190, -60, 0];

  // reading path: left page first line → over the gutter → the handwritten "뜨는 힘 > 무게"
  let read = null;
  function readLines() {
    if (read) return read;
    const at = (tk, end) => { const p = xf(tk.M, tk.x + (end ? tk.w : 0), tk.y + tk.h + 4, 0); return [p[0], p[1], 0]; };
    const L = tokens.filter(k => k.page === 'L' && k.src.closest('p.big'));
    const R = tokens.filter(k => k.page === 'R' && k.src.closest('.hand'));
    const firstLine = L.filter(k => Math.abs(k.y - L[0].y) < 4);
    const a = [at(firstLine[0], false), at(firstLine[firstLine.length - 1], true)];
    const b = [at(R[0], false), at(R[R.length - 1], true)];
    const pts = [
      ...bezier(a[0], [lerp(a[0][0], a[1][0], 0.33), a[0][1], 0], [lerp(a[0][0], a[1][0], 0.66), a[1][1], 0], a[1], 16),
      ...bezier(a[1], [a[1][0] + 80, a[1][1] - 160, 60], [b[0][0] - 120, b[0][1] - 140, 60], b[0], 24).slice(1),
      ...bezier(b[0], [lerp(b[0][0], b[1][0], 0.33), b[0][1] + 2, 0], [lerp(b[0][0], b[1][0], 0.66), b[1][1] - 2, 0], b[1], 16).slice(1),
    ];
    read = { pts, words: [...firstLine, ...R] };
    return read;
  }

  // where the light is (world) — the night pool follows it
  function lightAt(t) {
    if (!NL) return [0, 0, 0];
    if (t < T.writeB) return penAt(t).world;
    if (t < T.jump) return qWorld();
    if (t < T.flip1 - 0.06) { const k = E.inOutCubic(prog(t, T.jump, T.flip1 - 0.06)); const q = qWorld(); return [lerp(q[0], JUMP_TO[0], k), lerp(q[1], JUMP_TO[1], k), Math.sin(k * Math.PI) * 220]; }
    if (t < T.settle) {
      let fi = 0;
      for (let i = 0; i < 3; i++) if (t >= flipT[i][0]) fi = i;
      const a = E.inOutCubic(prog(t, flipT[fi][0], flipT[fi][1]));
      return xf(flipModel(a), PW * 0.92, PH * 0.12, 0);
    }
    if (t < T.readA) return xf(ML, 60, 200, 0);
    const { pts } = readLines();
    const k = tw(t, T.readA, T.readB, E.inOutSine);
    const s = slice(pts, 0, Math.max(0.001, k));
    return s[s.length - 1];
  }

  let cur = null;
  function update(t) {
    const CM = ctx.CM;
    // the desk fades away under the brain, and is there again when we come back out of the tablet
    const back = t > T.lift ? tw(t, T.exitA, T.exitA + 0.4, E.inOutSine) : 0;
    const away = tw(t, T.liftB - 0.2, T.arriveB, E.inOutSine);
    el.style.visibility = t > T.arriveB + 0.2 && back <= 0 ? 'hidden' : 'visible';
    el.style.opacity = (t > T.lift ? back : 1 - away * 0.8).toFixed(3);
    el.style.filter = t > T.liftB && t < T.lift ? `blur(${(away * 7).toFixed(2)}px)` : '';
    place(desk, CM, M4.T(-2600, -1500, -14));
    place(shadow, CM, M4.chain(M4.T(14, 26, -12), M4.T(-750, -530, 0)));
    place(nShadow, CM, planeModel(NOTE.x + 16, NOTE.y + 24, -12, NOTE.w + 260, NOTE.h + 220, { rz: NOTE.rz }));
    place(note, CM, MN);
    place(cover, CM, M4.T(-(PW + 22), -(PH / 2 + 18), -8));
    place(stackL, CM, M4.chain(M4.RY(TILT * 0.6), M4.T(-PW - 6, -PH / 2 - 4, -4)));
    place(stackR, CM, M4.chain(M4.RY(-TILT * 0.6), M4.T(-2, -PH / 2 - 4, -4)));
    place(ribbon, CM, M4.T(PW - 140, PH / 2 - 12, -5));
    place(pageL, CM, ML);
    place(pageR, CM, MR);

    // handwriting revealed behind the pen
    if (NL) {
      const p = penAt(t), k = writeK(t);
      lines.forEach((sp, i) => {
        const u = k >= 1 ? 1 : i < p.line ? 1 : i === p.line ? p.u : 0;
        sp.style.clipPath = `inset(-20px ${((1 - u) * 100).toFixed(2)}% -20px -20px)`;
      });
      const qg = tw(t, T.qmark - 0.1, T.qmark + 0.2) * (1 - tw(t, T.jump + 0.1, T.flip1));
      qm.style.textShadow = qg > 0.01 ? `0 0 ${(24 * qg).toFixed(1)}px rgba(150,232,90,${(0.95 * qg).toFixed(3)}), 0 0 ${(6 * qg).toFixed(1)}px rgba(230,255,200,${qg.toFixed(3)})` : 'none';
      qm.style.color = qg > 0.01 ? `rgb(${lerp(58, 170, qg) | 0},${lerp(56, 236, qg) | 0},${lerp(50, 110, qg) | 0})` : '';
    }

    // page riffle
    let fi = -1, fk = 0;
    for (let i = 0; i < 3; i++) if (t >= flipT[i][0]) { fi = i; fk = prog(t, flipT[i][0], flipT[i][1]); }
    const flipping = fi >= 0 && fk < 1;
    setPage(pageL, faces[fi < 0 ? 0 : fk < 1 ? fi : fi + 1][0]);
    setPage(pageR, faces[fi < 0 ? 0 : fi + 1][1], shadeR);
    flip.style.display = flipping ? 'block' : 'none';
    flipB.style.display = 'none';
    if (flipping) {
      const a = E.inOutCubic(fk);
      const Mf = flipModel(a);
      if (a < 0.5) {
        setPage(flip, faces[fi][1], fShade);
        place(flip, CM, Mf);
        fShade.style.background = `linear-gradient(90deg, rgba(60,45,20,${(0.05 + a * 0.3).toFixed(3)}), rgba(255,255,255,${(a * 0.2).toFixed(3)}))`;
      } else {
        flip.style.display = 'none';
        flipB.style.display = 'block';
        setPage(flipB, fi === 2 ? backL : faces[fi + 1][0], bShade);
        place(flipB, CM, M4.chain(Mf, M4.T(PW, 0, 0), M4.RY(180)));
        bShade.style.background = `linear-gradient(270deg, rgba(60,45,20,${((1 - a) * 0.3).toFixed(3)}), rgba(0,0,0,0))`;
      }
      shadeR.style.background = `linear-gradient(90deg, rgba(70,50,20,${(0.22 * Math.sin(a * Math.PI)).toFixed(3)}), rgba(0,0,0,0) ${(30 + a * 60).toFixed(0)}%)`;
    } else shadeR.style.background = 'none';

    // static tokens hand over to the world tokens the moment they start to lift (and light up)
    const live = t >= T.liftA && t < T.exitA;
    finalL.classList.toggle('tkoff', live);
    finalR.classList.toggle('tkoff', live);

    // the night: only what the light touches is lit; a faint moonlight keeps the desk readable
    const focus = t > T.lift ? [TABLET.x, TABLET.y, 0] : lightAt(t);
    const Lp = project(CM, [focus])[0];
    const R = (t > T.lift ? 1100 : 520) * CM[0] + 160;
    const dark = t > T.lift ? 0.72 * (1 - tw(t, T.exitA + 0.3, T.window + 0.3)) : 0.86 * (1 - tw(t, T.liftA, T.liftB + 0.4));
    night.style.background = `radial-gradient(circle at ${Lp[0].toFixed(1)}px ${Lp[1].toFixed(1)}px, rgba(9,10,13,${(dark * 0.05).toFixed(3)}) 0px, rgba(9,10,13,${(dark * 0.35).toFixed(3)}) ${(R * 0.42).toFixed(0)}px, rgba(9,10,13,${dark.toFixed(3)}) ${R.toFixed(0)}px)`;
    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur || !NL) return;
    const P3 = pts => project(cur.CM, pts);
    // 1 · the spark appears and writes the question
    if (t < T.writeB + 0.15) {
      const p = penAt(t);
      const born = tw(t, 0, T.drip + 0.1, E.outCubic);
      const trail = [];
      for (let i = 10; i >= 0; i--) trail.push(penAt(Math.max(T.writeA, t - i * 0.012)).world);
      if (t > T.writeA) fx.line(P3(trail), { w: 3.4, alpha: 1, taper: 1, head: 0 });
      const q = P3([p.world])[0];
      fx.head(q[0], q[1], 4.5, born);
      fx.flare(q[0], q[1], 90, 0.45 * born);
    }
    // 2 · the question mark glows, then the light leaps to the book
    if (t > T.qmark - 0.15 && t < T.flip1 + 0.2) {
      const q = P3([qWorld()])[0];
      const g = tw(t, T.qmark - 0.1, T.qmark + 0.2) * (1 - tw(t, T.jump, T.jump + 0.3));
      fx.flare(q[0], q[1], 160, 0.8 * g);
      fx.head(q[0], q[1], 5, g);
      if (t > T.jump) {
        const a = qWorld();
        const path = bezier(a, [a[0] + 200, a[1] - 160, 320], [JUMP_TO[0] - 260, JUMP_TO[1] - 200, 320], JUMP_TO, 40);
        const k = E.inOutCubic(prog(t, T.jump, T.flip1 - 0.06));
        fx.line(P3(slice(path, Math.max(0, k - 0.4), k)), { w: 4.5, alpha: 1 - prog(t, T.flip1 - 0.1, T.flip1 + 0.2), taper: 1, head: 1, headScale: 1.2 });
      }
    }
    // 3 · the light turns the pages (riding the corner of each turning page)
    if (t > T.flip1 - 0.1 && t < T.readA + 0.1) {
      const q = P3([lightAt(t)])[0];
      fx.head(q[0], q[1], 4, 0.9);
      fx.flare(q[0], q[1], 70, 0.35);
    }
    // 4 · the light reads
    if (t > T.readA - 0.1 && t < T.liftA + 0.4 && tokens.length) {
      const { pts, words } = readLines();
      const k = tw(t, T.readA, T.readB, E.inOutSine);
      const fade = 1 - tw(t, T.readB, T.liftA + 0.35);
      fx.line(P3(slice(pts, Math.max(0, k - 0.22), k)), { w: 3.6, alpha: fade, taper: 1, head: 1 });
      fx.line(P3(slice(pts, 0, k)), { w: 2.4, alpha: 0.7 * fade, taper: 0 });
      ctx.readK = k;
      ctx.readWords = words;
    }
  }

  return { el, range: ctx.S.book, layout, update, draw };
}
