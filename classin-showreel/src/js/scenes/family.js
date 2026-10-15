// S4 · 가족 (10.20–14.40): the spark from Jihoo's trophy travels home. On his mother's phone it
// arrives as a ClassIn notification; she opens today's class report — attendance, the quiz, his
// first presentation, the trophy, the teacher's note, the replay — and sends a thank-you. The heart
// she sends becomes the light that carries the story into his future.
import { E, tw, prog, clamp, keyed, drift, xf, camMatrix, place, planeModel, bezier, slice, boxIn, h } from '../core.js';
import { project } from '../line.js';
import { createPhone, PW, PH, BEZ } from '../phone.js';
import { avatar } from '../avatar.js';

const CUP = '<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="#F5C542"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="#E0A92A" stroke-width="1.6" fill="none"/><path d="M10.5 13h3v3h-3z" fill="#E0A92A"/><rect x="8" y="16" width="8" height="3" rx="1" fill="#F5C542"/></svg>';
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.5 1.1 4.2 2.3h2c.7-1.2 2.1-2.3 4.2-2.3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>';

export default function familyScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  // warm home bokeh behind the phone
  const bokeh = h('div', 'bokeh');
  for (let i = 0; i < 9; i++) bokeh.appendChild(h('i'));
  el.appendChild(bokeh);
  const phone = createPhone('warm');
  el.appendChild(phone.el);
  const ji = avatar({ seed: 1, hair: 0, smile: 0.95, shirt: '#3F6FB5', id: 'fmJi', w: 96, h: 96 });
  const tch = avatar({ seed: 11, hair: 2, glasses: true, smile: 0.7, shirt: '#2F3A4A', id: 'fmT', w: 80, h: 80 });
  phone.scr.insertAdjacentHTML('beforeend', `
    <div class="lock"><div class="clock">20:12</div><div class="date">12월 1일 월요일</div></div>
    <div class="lnotif"><div class="ic"><img src="assets/logo-132.png" alt=""></div><div class="tx"><div class="r1">ClassIn 학부모<span>지금</span></div>
      <div class="r2">지후가 오늘 수업에서 트로피를 받았어요</div><div class="r3">${copy.course} · ${copy.teacher} 선생님</div></div></div>
    <div class="report"><div class="rin">
      <div class="rh"><span class="bk">‹</span>오늘의 수업 리포트<span class="dt">12.01 (월)</span></div>
      <div class="who"><span class="avc">${ji}</span><div><b>${copy.student}</b><em>${copy.course} · ${copy.branch}</em></div></div>
      <div class="grid4">
        <div><span>출석</span><b class="okc">✓</b><em>18:58 입장</em></div>
        <div><span>답변기</span><b class="okc">✓</b><em>정답 (C)</em></div>
        <div class="first"><span>발표</span><b>1회</b><em>첫 발표!</em></div>
        <div class="gold"><span>트로피</span><b>${CUP}+1</b><em>총 36개</em></div>
      </div>
      <div class="cmt"><div class="ch"><span class="avc">${tch}</span><b>${copy.teacher} 선생님</b><span class="tm">방금</span></div><p class="ctext"></p></div>
      <div class="rep"><div class="th"><span class="mini">= 4</span><span class="pl">▶</span><span class="du">24:13</span></div><div class="rt"><b>수업 다시보기</b><em>지후 발표 장면</em></div></div>
      <div class="thx"><span class="hb">${HEART}</span><span class="lt">선생님께 감사 인사 보내기</span></div>
      <div class="grow"><div class="gh"><b>지후의 성장 기록</b><span>단원평가 72 → 88</span></div>
        <svg viewBox="0 0 320 70"><path class="ga" d="M10 60 L90 44 L170 30 L250 16 L250 70 L10 70 Z"/><path class="gl" d="M10 60 L90 44 L170 30 L250 16"/><path class="gf" d="M250 16 L310 6"/><circle cx="250" cy="16" r="5"/></svg>
        <div class="gx"><span>9월</span><span>10월</span><span>11월</span><span>오늘</span><span>다음</span></div></div>
    </div></div>`);
  const q = s => phone.scr.querySelector(s);
  const lock = q('.lock'), ln = q('.lnotif'), report = q('.report'), rin = q('.rin'), ctext = q('.ctext'), thx = q('.thx'), thxLt = thx.querySelector('.lt');
  const cells = [...q('.grid4').children], rep = q('.rep'), cmt = q('.cmt');
  const chars = [...copy.comment];

  let A = {};
  function layout() {
    A.notif = boxIn(ln, phone.scr);
    A.heart = boxIn(thx.querySelector('.hb'), phone.scr);
    A.thx = boxIn(thx, phone.scr);
  }
  const pModel = s => planeModel(0, s.y, 0, phone.W, phone.H, { rx: s.rx, ry: s.ry, rz: s.rz });
  const local = (m, x, y) => xf(m, BEZ + x, BEZ + y, 0);
  const IN = [
    { t: 9.95, y: -900, rx: -18, ry: 10, rz: -4 },
    { t: T.notify - 0.05, y: 0, rx: -3, ry: 8, rz: 0, e: E.outCubic },
    { t: 13.4, y: 0, rx: 2, ry: 2, rz: 0, e: E.inOutSine },
    { t: 14.75, y: 260, rx: 18, ry: -4, rz: 0, e: E.inCubic },
  ];
  function camAt(t) {
    const k = P ? 1.55 : 1;
    const c = keyed(t, [
      { t: 9.95, x: 0, y: -80, s: 0.95 * k },
      { t: T.notify, x: 0, y: -150, s: 1.15 * k, e: E.outCubic },
      { t: T.open + 0.3, x: 0, y: -150, s: 1.22 * k, e: E.inOutCubic },
      { t: T.commentB, x: 0, y: 40, s: 1.32 * k, e: E.inOutSine },
      { t: T.thanks, x: 0, y: 190, s: 1.36 * k, e: E.inOutSine },
      { t: 14.75, x: 0, y: -240, s: 0.9 * k, e: E.inOutCubic },
    ]);
    c.rx = 1.5 * drift(t, 4.1, 0.12);
    c.ry = 3 * drift(t, 1.9, 0.1);
    c.d = 1800;
    return c;
  }

  let cur = null;
  function update(t) {
    const m = pModel(keyed(t, IN));
    const CM = camMatrix(camAt(t), W, H);
    place(phone.el, CM, m);
    el.style.opacity = tw(t, 10.18, 10.5, E.outCubic) * (1 - tw(t, 14.3, 14.75, E.inQuad));
    bokeh.style.transform = `translate(${(drift(t, 2, 0.06) * 30).toFixed(1)}px, ${(drift(t, 5, 0.05) * 20).toFixed(1)}px)`;

    // lock screen + notification delivered by the light
    const nIn = tw(t, T.notify, T.notify + 0.3, E.outBack);
    ln.style.opacity = clamp(prog(t, T.notify, T.notify + 0.1)) * (1 - tw(t, T.open, T.open + 0.2));
    ln.style.transform = `translateY(${(1 - nIn) * -40}px) scale(${t > T.open - 0.08 && t < T.open + 0.05 ? 0.97 : 1})`;
    // open the report: it slides up over the lock screen
    const op = tw(t, T.open - 0.02, T.open + 0.5, E.inOutCubic);
    report.style.transform = `translateY(${((1 - op) * PH).toFixed(1)}px)`;
    lock.style.opacity = 1 - op * 0.6;
    phone.scr.querySelector('.sbar').style.color = op > 0.5 ? '#17181B' : '#fff';
    cells.forEach((c, i) => { const k = tw(t, T.open + 0.2 + i * 0.08, T.open + 0.45 + i * 0.08, E.outBack); c.style.opacity = clamp(k); c.style.transform = `translateY(${(1 - k) * 14}px)`; });
    const nC = Math.floor(chars.length * prog(t, T.commentA, T.commentB));
    ctext.textContent = chars.slice(0, nC).join('');
    cmt.style.opacity = tw(t, T.commentA - 0.25, T.commentA);
    rep.style.opacity = tw(t, T.replay - 0.1, T.replay + 0.15);
    // the page scrolls as she reads
    const sc = tw(t, T.commentA - 0.1, T.thanks - 0.15, E.inOutSine) * 150 + tw(t, T.heart, 14.2, E.inOutSine) * 90;
    rin.style.transform = `translateY(${-sc.toFixed(1)}px)`;
    // thank-you
    const sent = t > T.thanks + 0.06;
    thx.classList.toggle('sent', sent);
    thxLt.textContent = sent ? '감사 인사를 보냈어요' : '선생님께 감사 인사 보내기';
    const pr = t > T.thanks - 0.04 && t < T.thanks + 0.12 ? 0.96 : 1;
    const hp = t > T.heart ? 1 + Math.sin(prog(t, T.heart, T.heart + 0.35) * Math.PI) * 0.45 : 1;
    thx.style.transform = `scale(${pr})`;
    thx.querySelector('.hb').style.transform = `scale(${hp})`;
    cur = { m, CM, sc };
  }

  function draw(fx, t) {
    if (!cur || !A.notif) return;
    const { m, CM, sc } = cur;
    const P3 = pts => project(CM, pts);
    // the spark arrives from the classroom and becomes the notification
    if (t >= 10.1 && t < T.notify + 0.25) {
      const tgt = P3([local(m, A.notif.x + 34, A.notif.y + A.notif.h / 2)])[0];
      const path = bezier([W * 0.55, -300], [W * 0.62, H * 0.1], [tgt[0] + 220, tgt[1] - 200], tgt, 36);
      const k = E.inOutCubic(prog(t, 10.1, T.notify));
      fx.line(slice(path, Math.max(0, k - 0.35), k), { w: 4.5, alpha: 1 - tw(t, T.notify + 0.05, T.notify + 0.25), taper: 1, head: 1, headScale: 1.2 });
      fx.flare(tgt[0], tgt[1], 150, 0.6 * (1 - prog(t, T.notify, T.notify + 0.4)) * (t > T.notify ? 1 : 0), '255,236,200');
    }
    // the heart she sends rises out of the phone — the light now carries his future
    if (t >= T.heart && t < 14.6) {
      const hpos = P3([local(m, A.heart.x + A.heart.w / 2, A.heart.y + A.heart.h / 2 - sc)])[0];
      const path = bezier(hpos, [hpos[0] - 40, hpos[1] - 260], [W * 0.5 + 120, H * 0.2], [W * 0.5, -260], 40);
      const k = E.inOutCubic(prog(t, T.heartFly, 14.5));
      fx.flare(hpos[0], hpos[1], 120, 0.55 * (1 - prog(t, T.heart, T.heart + 0.5)), '255,190,190');
      if (t > T.heartFly) fx.line(slice(path, Math.max(0, k - 0.3), k), { w: 4.5, alpha: 1, taper: 1, head: 1, headScale: 1.3 });
    }
  }

  return { el, range: ctx.S.family, layout, update, draw };
}
