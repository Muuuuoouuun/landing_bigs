// S1 · 책 (0.00–4.80): a drop of 연두 light falls onto an open book on an ivory desk. The pages riffle
// — 국어, 수학, 과학 — and settle on a spread full of words, formulas and questions. The light reads
// along the lines; then everything on the page begins to lift off it (the knowledge module takes the
// tokens from there).
import { E, tw, prog, clamp, lerp, M4, place, bezier, slice, h } from '../core.js';
import { project } from '../line.js';

export const PW = 500, PH = 680, TILT = 4;

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
    `<div class="ph">수학 · 6단원</div><h3>피타고라스의 정리</h3>
     <div class="pic"><svg viewBox="0 0 300 170"><path d="M40 150 L260 150 L40 30 Z" fill="none" stroke="#8A8272" stroke-width="3"/><path d="M40 132 h18 v18" fill="none" stroke="#8A8272" stroke-width="2"/><text x="140" y="168" font-size="18" fill="#8A8272">a</text><text x="18" y="96" font-size="18" fill="#8A8272">b</text><text x="160" y="80" font-size="18" fill="#8A8272">c</text></svg></div>
     <div class="fx1">a² + b² = c²</div><div class="pn">112</div>`,
    `<h4>확인 문제</h4><ol><li>3, 4, ?</li><li>5, 12, ?</li><li>8, 15, ?</li></ol>
     <p>직각삼각형의 빗변의 길이를 구해 봅시다. 생활 속에서 직각을 찾아볼까요?</p><div class="pn">113</div>`,
  ],
  [
    `<div class="ph">과학 · 3단원</div><h3>태양계 여행</h3>
     <div class="pic"><svg viewBox="0 0 300 170"><circle cx="150" cy="85" r="16" fill="#E9C46A"/><ellipse cx="150" cy="85" rx="60" ry="24" fill="none" stroke="#B9AE98" stroke-width="2"/><ellipse cx="150" cy="85" rx="100" ry="42" fill="none" stroke="#B9AE98" stroke-width="2"/><ellipse cx="150" cy="85" rx="140" ry="62" fill="none" stroke="#B9AE98" stroke-width="2"/><circle cx="210" cy="85" r="6" fill="#7FB3D5"/><circle cx="62" cy="62" r="8" fill="#D98C6A"/></svg></div>
     <p>지구는 하루에 한 바퀴 스스로 돌고, 일 년에 한 바퀴 태양 둘레를 돕니다.</p><div class="pn">58</div>`,
    `<h4>달의 모양 변화</h4><div class="moons"><i></i><i></i><i></i><i></i><i></i></div>
     <p>달은 스스로 빛을 내지 않습니다. 햇빛을 받아 반사하기 때문에 모양이 바뀌어 보입니다.</p><div class="pn">59</div>`,
  ],
  [
    `<div class="ph">생각 더하기</div><h3><span class="tk">생각하는</span> <span class="tk">힘</span></h3>
     <p class="big">${wrap('책을 펼치면 바다와 별, 숫자와 노래가 기다립니다. 읽은 것들은 마음속에서 서로 만나 새로운 생각이 됩니다.')}</p>
     <div class="chips"><span class="tk chip">바다</span><span class="tk chip">별</span><span class="tk chip">고래</span><span class="tk chip">나무</span><span class="tk chip">로켓</span></div>
     <div class="pic sm"><span class="tk svgk"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="14" fill="#E9C46A"/><ellipse cx="60" cy="60" rx="48" ry="20" fill="none" stroke="#9C927F" stroke-width="3"/><circle cx="104" cy="56" r="6" fill="#7FB3D5"/></svg></span>
       <span class="tk svgk"><svg viewBox="0 0 120 120"><path d="M14 92 L106 92 L14 22 Z" fill="none" stroke="#9C927F" stroke-width="3"/></svg></span></div><div class="pn">86</div>`,
    `<div class="ph r">질문 노트</div>
     <div class="hand"><span class="tk">만약에</span> <span class="tk">고래가</span> <span class="tk">하늘을</span> <span class="tk">난다면?</span></div>
     <div class="fx1 sm"><span class="tk">a²</span> <span class="tk">+</span> <span class="tk">b²</span> <span class="tk">=</span> <span class="tk">c²</span></div>
     <div class="row"><span class="tk sym">π</span><span class="tk sym">E=mc²</span><span class="tk sym">H₂O</span><span class="tk sym">♪</span><span class="tk sym">∞</span></div>
     <p class="big">${wrap('질문은 생각의 씨앗입니다. 왜? 어떻게? 만약에? 오늘 읽은 한 줄이 내일의 상상이 됩니다.')}</p>
     <div class="row en"><span class="tk">Hello,</span> <span class="tk">world!</span> <span class="tk">가나다</span> <span class="tk">ABC</span> <span class="tk">1+1</span></div><div class="pn">87</div>`,
  ],
];

export default function bookScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene book');
  ctx.root.appendChild(el);

  const plane = (cls, w, hh) => { const d = h('div', `obj ${cls}`); d.style.width = `${w}px`; d.style.height = `${hh}px`; el.appendChild(d); return d; };
  const shadow = plane('bshadow', 1500, 1060);
  const cover = plane('bcover', PW * 2 + 44, PH + 36);
  const stackL = plane('bstack l', PW + 8, PH + 10), stackR = plane('bstack r', PW + 8, PH + 10);
  const pageL = plane('page l', PW, PH), pageR = plane('page r', PW, PH);
  const ribbon = plane('ribbon', 22, 150);
  const flip = plane('page flip', PW, PH);
  const flipB = plane('page l flipb', PW, PH);
  const shadeR = h('div', 'shade'); pageR.appendChild(shadeR);
  const mk = (html, side) => { const d = h('div', `pin ${side}`, html); return d; };
  // page faces
  const faces = SPREADS.map(([l, r], i) => [mk(l, i === 3 ? 'l fin' : 'l'), mk(r, i === 3 ? 'r fin' : 'r')]);
  const fShade = h('div', 'shade'), bShade = h('div', 'shade');

  function setPage(p, node, shadeEl) {
    if (p.firstChild === node) return;
    p.replaceChildren(node);
    if (shadeEl) p.appendChild(shadeEl);
  }
  // models: pages hinge on the spine (x = 0), right page tilts by -TILT, left by +TILT
  const right = (ry) => M4.chain(M4.RY(ry), M4.T(0, -PH / 2, 0));
  const MR = right(-TILT);
  const ML = M4.chain(M4.RY(TILT), M4.T(-PW, -PH / 2, 0));
  const flipT = [[T.flip1 - 0.08, T.flip1 + 0.3], [T.flip2 - 0.06, T.flip2 + 0.3], [T.flip3 - 0.04, T.flip3 + 0.38]];

  // tokens: built from the final spread (laid out on the static faces), handed to ctx for the knowledge module
  const tokens = [];
  const finalL = faces[3][0], finalR = faces[3][1];
  // a clone of the final left face for the back of the last flipping page
  const backL = mk(SPREADS[3][0], 'l fin');
  function layout() {
    // measure tokens on their faces (temporarily mount the final faces)
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
        tk.style.font = cs.font; tk.style.color = cs.color; tk.style.letterSpacing = cs.letterSpacing;
        tk.style.width = `${w + 1}px`; tk.style.height = `${hh}px`;
        if (sp.classList.contains('chip')) { tk.style.background = cs.backgroundColor; tk.style.borderRadius = cs.borderRadius; tk.style.padding = cs.padding; tk.style.boxShadow = cs.boxShadow; }
        const page = face === finalL ? 'L' : 'R';
        tokens.push({ el: tk, src: sp, w, h: hh, page, M, x, y, word: sp.textContent });
      }
      pg.style.transform = keep;
    }
    for (const t of tokens) ctx.tokLayer.appendChild(t.el);
  }
  ctx.tokens = tokens;
  ctx.book = { ML, MR, PW, PH };

  let cur = null;
  function update(t) {
    const CM = ctx.CM;
    el.style.opacity = 1 - tw(t, T.liftB - 0.2, T.arriveB, E.inOutSine) * 0.75;
    el.style.filter = t > T.liftB ? `blur(${(tw(t, T.liftB, T.arriveB, E.inOutSine) * 7).toFixed(2)}px)` : '';
    place(shadow, CM, M4.chain(M4.T(14, 26, -12), M4.T(-750, -530, 0)));
    place(cover, CM, M4.T(-(PW + 22), -(PH / 2 + 18), -8));
    place(stackL, CM, M4.chain(M4.RY(TILT * 0.6), M4.T(-PW - 6, -PH / 2 - 4, -4)));
    place(stackR, CM, M4.chain(M4.RY(-TILT * 0.6), M4.T(-2, -PH / 2 - 4, -4)));
    place(ribbon, CM, M4.T(PW - 140, PH / 2 - 12, -5));
    place(pageL, CM, ML);
    place(pageR, CM, MR);

    // which flip is running (or the last finished)
    let fi = -1, fk = 0;
    for (let i = 0; i < 3; i++) if (t >= flipT[i][0]) { fi = i; fk = prog(t, flipT[i][0], flipT[i][1]); }
    const flipping = fi >= 0 && fk < 1;
    const leftIdx = fi < 0 ? 0 : fk < 1 ? fi : fi + 1;
    const rightIdx = fi < 0 ? 0 : fi + 1;
    setPage(pageL, faces[leftIdx][0]);
    setPage(pageR, faces[rightIdx][1], shadeR);
    flip.style.display = flipping ? 'block' : 'none';
    flipB.style.display = 'none';
    if (flipping) {
      const a = E.inOutCubic(fk);
      const ry = lerp(-TILT, -180 + TILT, a);
      // a page bends a little as it turns: lift its middle by tilting towards the camera
      const bend = Math.sin(a * Math.PI) * 10;
      const Mf = M4.chain(M4.RY(ry), M4.RX(bend * 0.3), M4.T(0, -PH / 2, Math.sin(a * Math.PI) * 30));
      if (a < 0.5) {
        setPage(flip, faces[fi][1], fShade);
        place(flip, CM, Mf);
        fShade.style.background = `linear-gradient(90deg, rgba(60,45,20,${(0.05 + a * 0.3).toFixed(3)}), rgba(255,255,255,${(a * 0.2).toFixed(3)}))`;
        fShade.style.opacity = 1;
      } else {
        flip.style.display = 'none';
        flipB.style.display = 'block';
        setPage(flipB, fi === 2 ? backL : faces[fi + 1][0], bShade);
        place(flipB, CM, M4.chain(Mf, M4.T(PW, 0, 0), M4.RY(180)));
        bShade.style.background = `linear-gradient(270deg, rgba(60,45,20,${((1 - a) * 0.3).toFixed(3)}), rgba(0,0,0,0))`;
        bShade.style.opacity = 1;
      }
      shadeR.style.background = `linear-gradient(90deg, rgba(70,50,20,${(0.22 * Math.sin(a * Math.PI)).toFixed(3)}), rgba(0,0,0,0) ${(30 + a * 60).toFixed(0)}%)`;
    } else shadeR.style.background = 'none';

    // static tokens hand over to the world tokens once the spread has settled
    const live = t >= T.settle;
    finalL.classList.toggle('tkoff', live);
    finalR.classList.toggle('tkoff', live);
    backL.classList.toggle('tkoff', false);
    cur = { CM };
  }

  // the reading light: underlines a line on the left page, arcs over the gutter, reads the question
  let lines = null;
  function readLines() {
    if (lines) return lines;
    const at = (tk, end) => { const p = M4.apply(M4.chain(tk.M), tk.x + (end ? tk.w : 0), tk.y + tk.h + 4, 0); return [p[0], p[1], 0]; };
    const L = tokens.filter(k => k.page === 'L' && k.el.parentElement && k.src.closest('p.big'));
    const R = tokens.filter(k => k.page === 'R' && k.src.closest('.hand'));
    const firstLine = L.filter(k => Math.abs(k.y - L[0].y) < 4);
    const a = [at(firstLine[0], false), at(firstLine[firstLine.length - 1], true)];
    const b = [at(R[0], false), at(R[R.length - 1], true)];
    const pts = [
      ...bezier(a[0], [lerp(a[0][0], a[1][0], 0.33), a[0][1], 0], [lerp(a[0][0], a[1][0], 0.66), a[1][1], 0], a[1], 16),
      ...bezier(a[1], [a[1][0] + 80, a[1][1] - 160, 60], [b[0][0] - 120, b[0][1] - 140, 60], b[0], 24).slice(1),
      ...bezier(b[0], [lerp(b[0][0], b[1][0], 0.33), b[0][1] + 2, 0], [lerp(b[0][0], b[1][0], 0.66), b[1][1] - 2, 0], b[1], 16).slice(1),
    ];
    lines = { pts, words: [...firstLine, ...R] };
    return lines;
  }

  function draw(fx, t) {
    if (!cur) return;
    const P3 = pts => project(cur.CM, pts);
    // the drop of light falling onto the page
    const D = [120, -40, 0];
    if (t < T.drip + 0.9) {
      const k = E.inQuad(prog(t, -0.25, T.drip));
      if (t < T.drip) {
        const top = [D[0] - 60, D[1] - 120, 900];
        const p = [lerp(top[0], D[0], k), lerp(top[1], D[1], k), lerp(top[2], 0, k)];
        const q = [lerp(top[0], D[0], Math.max(0, k - 0.18)), lerp(top[1], D[1], Math.max(0, k - 0.18)), lerp(top[2], 0, Math.max(0, k - 0.18))];
        const s = P3([q, p]);
        fx.line(s, { w: 5, alpha: 1, taper: 1, head: 1, headScale: 1.4 });
      }
      // ripple rings on the paper
      for (let r = 0; r < 3; r++) {
        const rk = prog(t, T.drip + r * 0.09, T.drip + 0.75 + r * 0.09);
        if (rk <= 0 || rk >= 1) continue;
        const R = E.outCubic(rk) * (160 + r * 70);
        const ring = [];
        for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; ring.push([D[0] + Math.cos(a) * R, D[1] + Math.sin(a) * R, 0]); }
        fx.line(P3(ring), { w: 2.4 * (1 - rk), alpha: (1 - rk) * 0.9, taper: 0, head: 0 });
      }
      const sp = P3([D])[0];
      fx.flare(sp[0], sp[1], 120, 0.8 * (t >= T.drip ? 1 - prog(t, T.drip, T.drip + 0.6) : 0));
      if (t >= T.drip) fx.head(sp[0], sp[1], 5, 1 - prog(t, T.drip, T.flip1));
    }
    // the light reads
    if (t > T.readA - 0.1 && t < T.liftA + 0.4 && tokens.length) {
      const { pts, words } = readLines();
      const k = tw(t, T.readA, T.readB, E.inOutSine);
      const fade = 1 - tw(t, T.readB, T.liftA + 0.35);
      fx.line(P3(slice(pts, Math.max(0, k - 0.22), k)), { w: 3.6, alpha: fade, taper: 1, head: 1 });
      // what's been read stays underlined in 연두 ink
      fx.line(P3(slice(pts, 0, k)), { w: 2.2, alpha: 0.85 * fade, taper: 0, cool: 1, ink: '#8DD63F', inkW: 1 });
      ctx.readK = k;
      ctx.readWords = words;
    }
  }

  return { el, range: ctx.S.book, layout, update, draw };
}
