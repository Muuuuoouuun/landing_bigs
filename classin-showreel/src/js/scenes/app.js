// S2 · 입장 (1.60–4.80): the light peels off the i-dot onto a student's phone — ClassIn's light app.
// It traces today's class card, the teacher and classmates arrive, the light becomes the fill of
// “수업 입장”, and the screen itself opens up into the classroom.
import { E, tw, prog, clamp, lerp, keyed, drift, xf, camMatrix, place, planeModel, bezier, slice, roundRect, boxIn, h } from '../core.js';
import { project } from '../line.js';
import { logoRest } from '../logo.js';
import { createPhone, PW, PH, BEZ } from '../phone.js';
import { avatar } from '../avatar.js';

const ICON = {
  bell: '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="#F5C542"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="#E0A92A" stroke-width="1.6" fill="none"/><path d="M10.5 13h3v3h-3z" fill="#E0A92A"/><rect x="8" y="16" width="8" height="3" rx="1" fill="#F5C542"/></svg>',
  hw: '<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F59A23"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg>',
};

export default function appScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const phone = createPhone();
  el.appendChild(phone.el);
  const people = [
    avatar({ seed: 11, hair: 2, glasses: true, smile: 0.7, shirt: '#2F3A4A', id: 'apT', w: 80, h: 80 }),
    avatar({ seed: 2, hair: 0, smile: 0.6, id: 'apA', w: 80, h: 80 }),
    avatar({ seed: 3, hair: 1, smile: 0.6, id: 'apB', w: 80, h: 80 }),
    avatar({ seed: 5, hair: 3, smile: 0.6, id: 'apC', w: 80, h: 80 }),
  ];
  const me = avatar({ seed: 1, hair: 0, smile: 0.7, shirt: '#3F6FB5', id: 'apMe', w: 80, h: 80 });
  phone.scr.insertAdjacentHTML('beforeend', `
    <div class="ap-top"><img src="assets/logo-132.png" alt="ClassIn"><div class="r"><span class="bell">${ICON.bell}</span><span class="me">${me}</span></div></div>
    <div class="ap-hi">안녕하세요,<b>지후님</b></div>
    <div class="ap-sec" style="top:190px">오늘의 수업<span>1개</span></div>
    <div class="ccard">
      <div class="row1"><span class="live"><i></i><em>곧 시작</em></span>오늘 19:00</div>
      <div class="tt">${copy.course}</div>
      <div class="st">${copy.teacher} 선생님 · ${copy.branch}</div>
      <div class="ls">${ICON.book}2. 함수의 극한 · 예제 3</div>
      <div class="pres"><span class="stack">${people.map(p => `<span class="avc">${p}</span>`).join('')}</span><span class="txt">입장 대기 중</span></div>
      <div class="abtn"><div class="fill"></div><span class="lb">수업 입장</span></div>
    </div>
    <div class="ap-sec" style="top:556px">이번 주</div>
    <div class="stats"><div>과제<b>${ICON.hw}2</b></div><div>트로피<b>${ICON.trophy}35</b></div><div>다시보기<b>${ICON.play}12</b></div></div>
    <div class="tabbar"><span class="on"><i></i>홈</span><span><i></i>수업</span><span><i></i>과제</span><span><i></i>메시지</span><span><i></i>마이</span></div>
    <div class="toast"><span class="avc">${people[0]}</span><span><b>${copy.teacher} 선생님</b>이 입장했어요</span></div>
    <div class="ripple"></div>`);
  const q = s => phone.scr.querySelector(s);
  const card = q('.ccard'), live = q('.live'), liveTxt = live.querySelector('em');
  const avcs = [...card.querySelectorAll('.pres .avc')], presTxt = card.querySelector('.pres .txt');
  const btn = q('.abtn'), fill = btn.querySelector('.fill'), lb = btn.querySelector('.lb');
  const toast = q('.toast'), ripple = q('.ripple'), edge = phone.el.querySelector('.pedge');
  const shade = h('div', 'abs');
  shade.style.cssText = 'inset:0;background:#1B1B1D;opacity:0;z-index:9';
  phone.scr.appendChild(shade);

  let A = {};
  function layout() {
    A.card = boxIn(card, phone.scr);
    A.btn = boxIn(btn, phone.scr);
  }
  // phone rests at the origin; screen point → world
  const pModel = s => planeModel(0, s.y, 0, phone.W, phone.H, { rx: s.rx, ry: s.ry, rz: s.rz });
  const local = (m, x, y) => xf(m, BEZ + x, BEZ + y, 0);
  const LAND = [
    { t: 1.85, y: 1250, rx: 30, ry: -10, rz: 4 },
    { t: T.phoneLand, y: 0, rx: 6, ry: -8, rz: 0, e: E.outCubic },
    { t: T.phoneLand + 0.14, y: -8, rx: 5, ry: -7, rz: 0, e: E.outQuad },
    { t: T.phoneLand + 0.36, y: 0, rx: 4, ry: -6, rz: 0, e: E.inOutQuad },
    { t: 5.1, y: 0, rx: 2, ry: -2, rz: 0 },
  ];
  function camAt(t) {
    const m0 = pModel({ y: 0, rx: 4, ry: -6, rz: 0 });
    const cc = local(m0, A.card.x + A.card.w / 2, A.card.y + A.card.h / 2);
    const bc = local(m0, A.btn.x + A.btn.w / 2, A.btn.y + A.btn.h / 2);
    const sc = local(m0, PW / 2, PH / 2);
    const k = P ? 1.5 : 1;
    const c = keyed(t, [
      { t: 1.6, x: 0, y: 60, s: 0.95 * k },
      { t: T.phoneLand, x: 0, y: 30, s: 0.98 * k },
      { t: T.traceB, x: cc[0] * 0.5, y: cc[1] * 0.5, s: 1.06 * k, e: E.inOutCubic },
      { t: T.fillA, x: bc[0] * 0.6, y: bc[1] * 0.55, s: 1.28 * k, e: E.inOutSine },
      { t: T.through, x: bc[0] * 0.8, y: bc[1] * 0.7, s: 1.32 * k, e: E.inOutSine },
      { t: 4.9, x: sc[0], y: sc[1], s: 3.4 * k, e: E.inCubic },
      { t: 5.05, x: sc[0], y: sc[1], s: 4.2 * k, e: E.linear },
    ]);
    c.rx = 2 * drift(t, 1.3, 0.13) + 1;
    c.ry = 4 * drift(t, 2.6, 0.1);
    c.d = 1800;
    return c;
  }

  let cur = null;
  function update(t) {
    const ls = keyed(t, LAND);
    const m = pModel(ls);
    const CM = camMatrix(camAt(t), W, H);
    place(phone.el, CM, m);
    phone.el.style.opacity = clamp(prog(t, 1.85, 2.1));
    edge.style.opacity = (t < T.phoneLand ? tw(t, 2.1, T.phoneLand) : 1 - tw(t, T.phoneLand, T.phoneLand + 0.6)) * 0.9;

    // the teacher and classmates arrive
    const tIn = tw(t, 3.05, 3.25, E.outBack), tOut = tw(t, 3.9, 4.1);
    toast.style.opacity = clamp(prog(t, 3.05, 3.15)) * (1 - tOut);
    toast.style.transform = `translateY(${(1 - tIn) * -40 - tOut * 20}px)`;
    const on = t > 3.15;
    live.className = `live${on ? ' on' : ''}`;
    liveTxt.textContent = on ? 'LIVE' : '곧 시작';
    avcs.forEach((a, i) => { const k = tw(t, 3.15 + i * 0.1, 3.35 + i * 0.1, E.outBack); a.style.opacity = clamp(k); a.style.transform = `scale(${0.5 + 0.5 * k})`; });
    const n = avcs.filter((_, i) => t > 3.2 + i * 0.1).length;
    const kids = [0, 0, 2, 4, 5][n];
    presTxt.innerHTML = !n ? '입장 대기 중' : kids ? `<b>${copy.teacher} 선생님</b>과 친구 ${kids}명이 입장했어요` : `<b>${copy.teacher} 선생님</b>이 입장했어요`;

    // fill → tap → entering
    const f = tw(t, T.fillA, T.fillB, E.inOutCubic);
    fill.style.width = `${(f * 100).toFixed(2)}%`;
    btn.style.color = f > 0.5 ? '#fff' : '';
    const press = t > 4.06 && t < 4.24 ? 1 - Math.sin(prog(t, 4.06, 4.24) * Math.PI) * 0.035 : 1;
    btn.style.transform = `scale(${press})`;
    lb.innerHTML = t > T.entering ? '<span class="spin"></span>입장 중…' : '수업 입장';
    const sp = lb.querySelector('.spin');
    if (sp) sp.style.transform = `rotate(${(t * 720) % 360}deg)`;
    const rp = prog(t, T.tap - 0.03, T.tap + 0.4);
    ripple.style.left = `${A.btn.x + A.btn.w * 0.6}px`;
    ripple.style.top = `${A.btn.y + A.btn.h / 2}px`;
    ripple.style.opacity = rp > 0 && rp < 1 ? (rp < 0.15 ? rp / 0.15 : 1 - (rp - 0.15) / 0.85) : 0;
    ripple.style.transform = `scale(${0.4 + rp * 1.4})`;

    // the screen opens into the classroom: content dims to the classroom's charcoal
    shade.style.opacity = tw(t, T.through, 4.78, E.inOutQuad);
    el.style.opacity = 1 - tw(t, 4.86, 5.02);
    cur = { m, CM };
  }

  function draw(fx, t) {
    if (!cur) return;
    const { m, CM } = cur;
    const P3 = pts => project(CM, pts);
    // 1) the light copy peels off the i-dot and falls to the class card
    if (t >= T.peel && t < T.phoneLand + 0.05) {
      const R = logoRest(W, H, P);
      const up = tw(t, T.logoUp, T.logoUp + 0.55, E.inOutCubic) * (P ? 220 : 170);
      const D = [R.lx + R.g.iDotC[0], R.ly + R.g.iDotC[1] - up];
      const tgt = P3([local(m, A.card.x + A.card.w / 2, A.card.y + A.card.h)])[0];
      const path = bezier(D, [D[0] + 80, D[1] + 260], [tgt[0] - 240, tgt[1] - 200], tgt, 48);
      if (t < T.peel + 0.12) {
        const kk = prog(t, T.peel, T.peel + 0.12);
        fx.shape(R.g.iDot.map(p => [R.lx + p[0], R.ly + p[1] - up + kk * 18]), 0.9 * (1 - kk * 0.4), 1);
      } else {
        const k = E.inQuad(prog(t, T.peel + 0.12, T.phoneLand));
        fx.line(slice(path, Math.max(0, k - 0.32), k), { w: 5, alpha: 1, taper: 1, head: 1, headScale: 1.2 });
      }
    }
    // 2) trace today's class card, then rest on it as a soft outline
    if (t >= T.traceA - 0.02 && t < T.fillA + 0.1) {
      const out = roundRect(A.card.x - 3, A.card.y - 3, A.card.w + 6, A.card.h + 6, 28, 7).map(p => local(m, p[0], p[1]));
      const k = tw(t, T.traceA, T.traceB, E.inOutCubic);
      const fade = 1 - tw(t, T.countB, T.fillA + 0.05);
      fx.line(P3(slice(out, 0, k)), { w: 4, alpha: 0.35 + 0.65 * fade, taper: k < 1 ? 0.6 : 0.1, head: k < 1 ? 1 : 0 });
    }
    // 3) become the fill of “수업 입장”, hot head = the leading edge
    if (t >= T.countB && t < T.entering + 0.2) {
      const b = A.btn, y = b.y + b.h - 2;
      const run = [
        ...bezier([A.card.x + 10, A.card.y + A.card.h], [A.card.x - 20, y - 40], [b.x - 30, y + 10], [b.x + 6, y], 20),
        [b.x + b.w - 6, y],
      ].map(p => local(m, p[0], p[1]));
      const k = t < T.fillA ? 0.42 * tw(t, T.countB, T.fillA, E.inQuad) : lerp(0.42, 1, tw(t, T.fillA, T.fillB, E.inOutCubic));
      const fade = 1 - tw(t, T.tap, T.entering + 0.15);
      fx.line(P3(slice(run, Math.max(0, k - 0.45), k)), { w: 4, alpha: fade, taper: 0.4, head: 1 });
    }
    // 4) through the screen: the light streaks outward as the screen fills the frame
    if (t > T.through && t < 5.05) {
      const c = P3([local(m, PW / 2, PH / 2)])[0];
      const k = prog(t, T.through, 5.0);
      const fade = 1 - tw(t, 4.85, 5.02);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r0 = E.inCubic(k) * 900, r1 = r0 + 40 + E.inCubic(k) * 700;
        fx.line([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0 * 0.7], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1 * 0.7]], { w: 2.4, alpha: 0.6 * fade, taper: 1, head: 0 });
      }
    }
  }

  return { el, range: ctx.S.app, layout, update, draw };
}
