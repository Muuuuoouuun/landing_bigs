// S5 · 교실 (10.80–14.40): a live ClassIn classroom resolves out of the dive. The light wraps the
// classroom once and lands under the answer on the board, cooling into ink. Pull back: the same
// class, to the same standard, in sixteen branches. Then every class sends its light back In to HQ.
import { E, tw, prog, clamp, lerp, keyed, drift, xf, camMatrix, place, planeModel, bezier, slice, measure, roundRect, boxIn, h } from '../core.js';
import { project } from '../line.js';

const TOOL = {
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  hl: '<path d="M9 11l-6 6v3h9l3-3"/><path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  er: '<path d="M20 20H7L3 16a2 2 0 0 1 0-2.8L13.2 3a2 2 0 0 1 2.8 0L21 8a2 2 0 0 1 0 2.8L12 20"/>',
  sh: '<rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="17" r="4"/>',
  tx: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  la: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  tm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  mo: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
};
const MIC = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SIL = '<svg class="sil" viewBox="0 0 120 100"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fcf8a"/><stop offset="1" stop-color="#2e7d4a"/></linearGradient></defs><circle cx="60" cy="38" r="20" fill="url(#sg)" opacity="0.85"/><path d="M18 100c2-26 20-38 42-38s40 12 42 38z" fill="url(#sg)" opacity="0.7"/></svg>';
const AV = ['#9be7ad', '#7fd6c8', '#b6e88c', '#8fd0f0', '#e6d38a', '#c7b8f2'];

function roomHTML(branch, teacher, students) {
  return `<div class="bar"><img src="assets/logo-132.png" alt=""><span class="rn">${branch} · 고2 수학 정규반 B</span>
    <span class="live"><i></i>LIVE <b class="clock">00:12:48</b></span>
    <span class="rt"><span>학생 ${students.length}/${students.length}</span><span class="rec">● 녹화 중</span></span></div>
  <div class="seats"><div class="seat tch">${SIL}<span class="nm">${teacher} 선생님</span><span class="mic">${MIC}</span><span class="ring"></span></div>
    ${students.map((s, i) => `<div class="seat"><span class="av" style="background:${AV[i % AV.length]}">${s[0]}</span><span class="nm">${s}</span><span class="mic">${MIC}</span><span class="ring"></span><span class="ans">정답 ✓</span></div>`).join('')}</div>
  <div class="board"><div class="bt"><b>2.</b>함수의 극한 · 예제 3</div>
    <div class="hw l1" style="left:70px;top:96px"><span class="lim">lim<small>x→2</small></span><span class="fr"><span>x² − 4</span><span>x − 2</span></span></div>
    <div class="hw l2" style="left:70px;top:270px">= <span class="lim">lim<small>x→2</small></span>(x + 2)</div>
    <div class="hw ans l3" style="left:70px;top:398px">= <span class="g">4</span></div>
    <svg class="graph" viewBox="0 0 360 360"><line class="ax" x1="30" y1="320" x2="340" y2="320"/><line class="ax" x1="60" y1="345" x2="60" y2="20"/>
      <path class="cv" d="M40 300 L330 40"/><circle cx="206" cy="169" r="9"/><text x="214" y="160">(2, 4)</text><text x="300" y="350">x</text><text x="30" y="30">y</text></svg>
    <span class="pen"></span></div>
  <div class="tools">${Object.keys(TOOL).map((k, i) => `<i class="${i === 0 ? 'on' : ''}"><svg viewBox="0 0 24 24">${TOOL[k]}</svg></i>`).join('')}</div>`;
}

const WALL = [
  ['대치 본원', '김서윤'], ['분당 정자', '박민재'], ['인천 송도', '최은우'], ['일산 백석', '정다인'],
  ['수원 영통', '한예준'], ['부산 센텀', '이서연'], ['대전 둔산', '오하린'], ['청주 복대', '서지안'],
  ['대구 수성', '문태오'], ['광주 봉선', '신유진'], ['울산 삼산', '배준혁'], ['창원 상남', '홍가은'],
  ['전주 효자', '노시윤'], ['강릉 교동', '권도하'], ['포항 양덕', '유나윤'], ['제주 노형', '장하람'],
];
const STUDENTS = ['김도윤', '박지후', '최서아', '정하준', '강민서', '윤지우'];
const TROPHY = '<svg viewBox="0 0 48 48"><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset="0.55" stop-color="#f5c542"/><stop offset="1" stop-color="#c98a12"/></linearGradient></defs><path d="M13 7h22v8.5a11 11 0 0 1-22 0z" fill="url(#tg)"/><path d="M13 10H7.5a6 6 0 0 0 6.5 8M35 10h5.5a6 6 0 0 1-6.5 8" stroke="#f5c542" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21 26h6v7h-6z" fill="#d99a1e"/><rect x="14" y="33" width="20" height="6" rx="2" fill="url(#tg)"/><path d="M18 11l2.5 0" stroke="#fff7d6" stroke-width="2.4" stroke-linecap="round" opacity="0.8"/></svg>';

export default function classScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const RW = 1280, RH = 760, GX = 1400, GY = 860;
  const HERO = 5; // 부산 센텀 sits at row 1, col 1 of the 4×4 wall
  const rooms = WALL.map(([b, tch], i) => {
    const r = h('div', 'room obj', roomHTML(b, tch, STUDENTS.map((s, k) => (i === HERO ? s : STUDENTS[(k + i) % 6]))));
    el.appendChild(r);
    const q = s => r.querySelector(s);
    return { el: r, i, col: i % 4, row: Math.floor(i / 4), l1: q('.l1'), l2: q('.l2'), l3: q('.l3'), cv: q('.graph .cv'), dot: q('.graph circle'), gtx: [...r.querySelectorAll('.graph text')], pen: q('.pen'), clock: q('.clock'), ring: [...r.querySelectorAll('.seat .ring')], ans: q('.seat:nth-child(3) .ans') };
  });
  const hero = rooms[HERO];
  // ClassIn's trophy reward: the moment a student is recognised
  const seat = hero.el.querySelector('.seat:nth-child(3)');
  const tro = h('span', 'tro', `${TROPHY}<b>+1</b>`);
  seat.appendChild(tro);
  const av = seat.querySelector('.av');
  // the same moment reaches HQ and the family
  const notif = h('div', 'notif', `<div class="ic"><img src="assets/logo-132.png" alt=""></div><div class="tx"><div class="r1">ClassIn Enterprise · 본사<span>지금</span></div>
    <div class="r2">오늘 수업 1,024개 진행 중</div><div class="r3">128개 지점 모두 본사 기준으로 운영되고 있습니다.</div></div>`);
  const notif2 = h('div', 'notif', `<div class="ic"><img src="assets/logo-132.png" alt=""></div><div class="tx"><div class="r1">ClassIn · 학부모 알림<span>지금</span></div>
    <div class="r2">지후가 오늘 수업에서 트로피를 받았어요</div><div class="r3">부산 센텀지점 · 출석 ✓ · 정답 3회 · 수업 리포트 보기</div></div>`);
  el.append(notif, notif2);

  let A = {};
  function layout() {
    const r = hero.el;
    A.ans = boxIn(hero.l3, r);
    A.four = boxIn(hero.l3.querySelector('.g'), r);
    A.l1 = boxIn(hero.l1, r); A.l2 = boxIn(hero.l2, r); A.l3 = A.ans;
    A.board = boxIn(r.querySelector('.board'), r);
    A.seat = boxIn(seat, r);
    hero.cvLen = hero.cv.getTotalLength();
    rooms.forEach(rm => { rm.cv.style.strokeDasharray = `${hero.cvLen}`; });
  }

  // grid position of a room (world), hero at the origin
  const roomPos = rm => [(rm.col - 1) * GX, (rm.row - 1) * GY, 0];
  const gridC = [GX / 2, GY / 2, 0];

  function camAt(t) {
    const keys = [
      { t: 10.45, x: P ? -230 : 0, y: P ? 40 : 0, s: P ? 1.9 : 1.25, rx: 4, ry: -14 },
      { t: T.classIn, x: P ? -230 : 0, y: P ? 40 : 0, s: P ? 1.42 : 0.95, rx: 3, ry: -8, e: E.outCubic },
      { t: T.lift, x: P ? -230 : 0, y: P ? 40 : 0, s: P ? 1.42 : 0.96, rx: 3, ry: -6, e: E.inOutSine },
      { t: T.trophyB + 0.18, x: P ? -150 : -90, y: P ? -150 : -150, s: P ? 1.75 : 1.22, rx: 2, ry: -3, e: E.inOutCubic },
      { t: T.wallA, x: P ? -150 : -90, y: P ? -130 : -130, s: P ? 1.7 : 1.18, rx: 2, ry: -2, e: E.inOutSine },
      { t: T.wallB + 0.15, x: gridC[0], y: gridC[1], s: P ? 0.4 : 0.31, rx: 10, ry: 4, e: E.inOutQuint },
      { t: T.gatherA, x: gridC[0], y: gridC[1], s: P ? 0.42 : 0.33, rx: 10, ry: 6, e: E.inOutSine },
      { t: 15.05, x: gridC[0], y: gridC[1], s: P ? 0.5 : 0.4, rx: 6, ry: 2 },
    ];
    const c = keyed(t, keys);
    c.rz = 0.8 * drift(t, 3.3, 0.1);
    c.rx += 1.5 * drift(t, 1.1, 0.11);
    c.d = 1800;
    return c;
  }

  const wrote = (t, a, b) => tw(t, a, b, E.inOutSine);
  let cur = null;
  function update(t) {
    const CM = camMatrix(camAt(t), W, H);
    const fin = tw(t, 10.55, T.classIn + 0.1, E.outCubic);
    el.style.opacity = fin;
    const blur = (1 - fin) * 18;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';

    const gather = tw(t, T.gatherA, 15.0, E.inQuint);
    rooms.forEach(rm => {
      const isH = rm === hero;
      const dist = Math.hypot(rm.col - 1, rm.row - 1);
      const appear = isH ? 1 : tw(t, T.wallA + 0.25 + dist * 0.12, T.wallA + 0.6 + dist * 0.12, E.outCubic);
      const [x, y] = roomPos(rm);
      // collapse In toward the wall centre
      const gx = lerp(x, gridC[0], gather), gy = lerp(y, gridC[1], gather);
      const s = (isH ? 1 : lerp(0.9, 1, appear)) * (1 - gather * 0.9);
      rm.el.style.display = appear * (1 - gather) > 0.002 ? 'block' : 'none';
      rm.el.style.opacity = appear * (1 - tw(t, 14.75, 15.0));
      place(rm.el, CM, planeModel(gx, gy, isH ? 0 : -40 * (1 - appear), RW, RH, { s }));
      rm.model = planeModel(gx, gy, 0, RW, RH, { s });
      // handwriting: the hero class is mid-lesson; other branches are at slightly different points
      const off = isH ? 0 : ((rm.i * 37) % 10) / 10 * 0.8 - 0.3;
      const w1 = isH ? 1 : 1, w2 = wrote(t, 10.85 + off, 11.25 + off), w3 = wrote(t, 11.25 + off, 11.55 + off);
      rm.l1.style.clipPath = `inset(-20px ${(1 - w1) * 100}% -20px -20px)`;
      rm.l2.style.clipPath = `inset(-20px ${(1 - w2) * 100}% -20px -20px)`;
      rm.l3.style.clipPath = `inset(-20px ${(1 - w3) * 100}% -20px -20px)`;
      const gk = wrote(t, 11.3 + off, 12.2 + off);
      rm.cv.style.strokeDashoffset = `${(1 - gk) * hero.cvLen}`;
      rm.dot.style.opacity = gk > 0.98 ? 1 : 0;
      rm.gtx.forEach(e => { e.style.opacity = clamp(prog(gk, 0.6, 1)); });
      const secs = 12 * 60 + 48 + Math.floor(t - 10.8) + rm.i * 7;
      rm.clock.textContent = `00:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
      // pen cursor follows whichever line is being written
      if (isH) {
        const writing = t < 11.25 ? ['l2', w2] : ['l3', w3];
        const bx = A[writing[0]];
        const on = (t > 10.85 && t < 11.55);
        rm.pen.style.opacity = on ? 1 : 0;
        rm.pen.style.left = `${bx.x - A.board.x + bx.w * writing[1]}px`;
        rm.pen.style.top = `${bx.y - A.board.y + bx.h * 0.62 + Math.sin(t * 40) * 6}px`;
      }
      // teacher "speaking" ring + correct-answer student
      rm.ring[0].style.opacity = 0.35 + 0.35 * Math.sin(t * 7 + rm.i);
    });
    const ansOn = tw(t, T.lift, T.lift + 0.18, E.outBack);
    hero.ring[2].style.opacity = ansOn;
    hero.ans.style.opacity = ansOn;
    hero.ans.style.transform = `scale(${0.6 + 0.4 * ansOn})`;

    // trophy lands on the student's tile; the avatar lights up
    const tk = tw(t, T.trophyB, T.trophyB + 0.28, E.outBack);
    tro.style.opacity = clamp(prog(t, T.trophyB - 0.02, T.trophyB + 0.08));
    tro.style.transform = `translate(-50%, -50%) scale(${(0.3 + 0.7 * tk).toFixed(3)}) rotate(${((1 - tk) * -18).toFixed(2)}deg)`;
    const bounce = t > T.trophyB ? Math.sin(prog(t, T.trophyB, T.trophyB + 0.35) * Math.PI) * 0.16 : 0;
    av.style.transform = `scale(${1 + bounce})`;
    av.style.boxShadow = t > T.trophyB ? `0 0 0 ${(3 * tk).toFixed(1)}px rgba(245,197,66,0.55), 0 0 ${(26 * tk).toFixed(1)}px rgba(245,197,66,0.6)` : '';
    // notification banner
    const nIn = tw(t, T.notify, T.notify + 0.32, E.outBack), nOut = tw(t, 14.45, 14.75, E.inCubic);
    notif.style.opacity = clamp(prog(t, T.notify, T.notify + 0.12)) * (1 - nOut);
    notif.style.transform = `translateY(${lerp(-200, P ? 120 : 40, nIn) - nOut * 60}px) scale(${P ? 1.45 : 1.18})`;
    notif.style.transformOrigin = '50% 0';
    const n2In = tw(t, T.notify2, T.notify2 + 0.34, E.outBack);
    notif2.style.opacity = clamp(prog(t, T.notify2, T.notify2 + 0.12)) * (1 - nOut);
    notif2.style.transform = `translateY(${lerp(-200, (P ? 120 : 40) + (P ? 1.45 : 1.18) * 128, n2In) - nOut * 60}px) scale(${P ? 1.45 : 1.18})`;
    notif2.style.transformOrigin = '50% 0';

    cur = { CM };
  }

  function draw(fx, t) {
    if (!cur || !hero.model) return;
    const { CM } = cur;
    const toS = (m, pts) => project(CM, pts.map(p => xf(m, p[0], p[1], 0)));
    const a = +el.style.opacity;

    // the wrap: in from below, once around the classroom, into the board, under “= 4”
    const u0 = [A.ans.x - 6, A.ans.y + A.ans.h + 14], u1 = [A.four.x + A.four.w + 30, A.ans.y + A.ans.h + 4];
    const ring = roundRect(-14, -14, RW + 28, RH + 28, 38, 7);
    const path = [
      ...bezier([RW * 0.5, RH * 0.48], [RW * 0.18, RH * 0.9], [-260, RH + 120], [RW * 0.06, RH + 30], 30),
      ...bezier([RW * 0.06, RH + 30], [RW * 0.2, RH + 16], [RW * 0.35, RH + 14], [RW / 2, RH + 14], 12).slice(1),
      ...ring.slice(1),
      ...bezier([RW / 2, RH + 14], [RW * 0.35, RH - 40], [u0[0] - 60, u0[1] + 70], u0, 22).slice(1),
      ...bezier(u0, [lerp(u0[0], u1[0], 0.4), u0[1] + 8], [lerp(u0[0], u1[0], 0.75), u0[1] + 4], [u1[0] - 18, u1[1]], 16).slice(1),
      [u1[0], u1[1] - 16],
    ];
    const L = measure(path);
    const total = L[L.length - 1];
    const uUnder = L[L.length - 18] / total;
    if (t >= T.wrapA && t < 14.9) {
      const k = tw(t, T.wrapA, T.land, E.inOutCubic);
      if (t < T.land) {
        fx.line(toS(hero.model, slice(path, Math.max(0, k - 0.3), k, L)), { w: 4.6, alpha: Math.max(a, 0.6), taper: 1, head: 1, headScale: 1.2 });
      }
      // landed: the underline cools from light into printed ink
      const cool = tw(t, T.land, T.land + 0.5, E.inOutQuad);
      const fade = 1 - tw(t, 14.4, 14.9);
      if (t >= T.land - 0.02) {
        fx.line(toS(hero.model, slice(path, uUnder, 1, L)), { w: 5.5, alpha: a * fade, taper: 0.15, head: 0, cool });
        fx.flare(...toS(hero.model, [u1])[0], 120, 0.7 * (1 - prog(t, T.land, T.land + 0.45)));
      }
    }
    // the reward: a spark leaves the answer and flies to the student who solved it
    if (t >= T.trophyA && t < T.trophyB + 0.6) {
      const from = [u1[0], u1[1] - 16], to = [A.seat.x + A.seat.w / 2, A.seat.y + A.seat.h * 0.42];
      const arc = bezier(from, [from[0] + 160, from[1] - 140], [to[0] + 220, to[1] + 260], to, 36);
      const k = tw(t, T.trophyA, T.trophyB, E.inOutCubic);
      if (t < T.trophyB) fx.line(toS(hero.model, slice(arc, Math.max(0, k - 0.35), k)), { w: 4, alpha: 1, taper: 1, head: 1, headScale: 1.1 });
      const ts = toS(hero.model, [to])[0];
      fx.flare(ts[0], ts[1], 150, 0.85 * (1 - prog(t, T.trophyB, T.trophyB + 0.5)) * (t >= T.trophyB ? 1 : 0), '255,214,110');
      fx.shards(ts[0], ts[1], t, T.trophyB, { n: 16, seed: 21, speed: 520, life: 0.5, len: 26, w: 1.8, spreadY: 1 });
    }
    // every classroom sends its light back In to the centre (to HQ)
    if (t >= T.gatherA - 0.1 && t < 15.05) {
      const center = project(CM, [[gridC[0], gridC[1], 0]])[0];
      rooms.forEach((rm, i) => {
        const [x, y] = roomPos(rm);
        const st = T.gatherA - 0.1 + (i % 5) * 0.03;
        const k = E.inCubic(prog(t, st, 14.98));
        if (k <= 0) return;
        const from = project(CM, [[x, y, 0]])[0];
        const curve = bezier(from, [lerp(from[0], center[0], 0.3) + (i % 2 ? 60 : -60), lerp(from[1], center[1], 0.3)], [lerp(from[0], center[0], 0.8), lerp(from[1], center[1], 0.8)], center, 20);
        fx.line(slice(curve, Math.max(0, k - 0.5), k), { w: rm === hero ? 4.5 : 2.8, alpha: 1 - tw(t, 14.9, 15.03), taper: 1, head: 1, headScale: 0.8 });
      });
      fx.flare(center[0], center[1], 260, 0.8 * tw(t, 14.75, 14.98, E.inQuad) * (1 - tw(t, 14.98, 15.05)));
    }
  }

  return { el, range: ctx.S.class, layout, update, draw };
}
