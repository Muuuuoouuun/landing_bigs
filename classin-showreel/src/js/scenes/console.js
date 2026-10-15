// S2 · 기준 (1.60–4.80) + S3 · 배포 (4.80–7.20)
// The light peels off the i-dot and becomes the console's focus line; the curriculum assets lift
// into 3D; the light traces card 1, becomes the fill of “전 지점에 배포”, then shoots through the screen.
import { E, tw, prog, clamp, lerp, keyed, drift, xf, camMatrix, place, planeModel, bezier, slice, measure, roundRect, boxIn, h } from '../core.js';
import { project } from '../line.js';
import { logoGeometry } from '../logo.js';

const ICON = {
  dash: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  branch: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  monitor: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24">${ICON[k]}</svg>`;

function thumb(i) {
  switch (i) {
    case 0: return `<div class="th-weeks">${Array.from({ length: 12 }, (_, k) => `<i class="${k < 5 ? 'on' : ''}">${k + 1}주</i>`).join('')}</div>`;
    case 1: return `<div class="th-pdf"><div class="pg" style="transform:translate(-14px,4px) rotate(-8deg)"></div><div class="pg" style="transform:translate(10px,2px) rotate(6deg)"></div><div class="pg"></div><span class="tag">PDF</span></div>`;
    case 2: return `<div class="th-board"><span style="left:16px;top:8px">f(x) = x² − 4</span><span style="left:30px;top:50px;font-size:22px;color:#8ff0a5">lim → 4</span></div>`;
    case 3: return `<div class="th-check"><div><i>✓</i>1회 모의고사</div><div><i>✓</i>단원평가 A형</div><div><i>✓</i>오답 클리닉</div></div>`;
    case 4: return `<div class="th-roles"><span>정규</span><span>대체</span><span>조교</span></div>`;
    default: return `<div class="th-qr"><div class="qr"></div><div class="bell"><b>QR 출결</b>알림톡 자동 발송</div></div>`;
  }
}

export default function consoleScene(ctx) {
  const { W, H, P, T, copy } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);

  /* ---------- device + screens ---------- */
  const DW = 1240, DH = 800;
  const device = h('div', 'device obj');
  const rim = h('div', 'rim');
  const screen = h('div', 'screen');
  device.append(rim, h('div', 'cam-dot'), screen);
  const sidebar = (active) => `<div class="side">${[
    ['dash', '대시보드'], ['branch', '지점 관리', '128'], ['book', '커리큘럼'], ['shield', '강사 · 권한', '342'],
    ['monitor', '수업 모니터링'], ['chart', '데이터 리포트'], ['gear', '설정'],
  ].map(([ic, l, n]) => `<div class="it ${l === active ? 'on' : ''}">${svg(ic)}${l}${n ? `<span class="n">${n}</span>` : ''}</div>`).join('')}
  <div class="foot"><b>하람에듀 본사</b>128개 지점 · 1,024개 반</div></div>`;
  const topbar = crumb => `<div class="topbar"><img src="assets/logo-132.png" alt=""><span class="tb-ent">ENTERPRISE</span><span class="tb-crumb">${crumb}</span><div class="tb-right">본사 운영팀<span class="avatar">HQ</span></div></div>`;

  const scrA = h('div', 'scr', `${topbar('본사 관리자 › 커리큘럼 › <b>배포</b>')}${sidebar('커리큘럼')}
    <div class="main">
      <div class="m-title">커리큘럼 배포</div>
      <div class="m-sub">본사 기준을 전 지점에 한 번에 적용합니다.</div>
      <div class="grid-label">선택한 커리큘럼 구성<span>6개 항목</span></div>
      ${[0, 1, 2, 3, 4, 5].map(i => `<div class="slot" style="left:${40 + (i % 3) * 310}px;top:${246 + Math.floor(i / 3) * 212}px"></div>`).join('')}
      <div class="search">${svg('search')}<span class="ph">배포할 커리큘럼 검색</span><span class="typed"></span><span class="caret"></span><span class="kbd">⌘K</span></div>
      <div class="suggest">${copy.suggest.map((s, i) => `<div class="row ${i === 0 ? 'on' : ''}">${svg('doc')}<span><b>${s[0]}</b>${s[1]}</span><span class="meta">${s[2]}</span></div>`).join('')}</div>
    </div>`);
  const managers = ['김하은', '이준서', '박소윤', '최도현', '정예린', '강시우', '윤채원', '임건우'];
  const scrB = h('div', 'scr', `${topbar('본사 관리자 › 커리큘럼 › <b>배포 설정</b>')}${sidebar('커리큘럼')}
    <div class="main">
      <div class="hdr"><div class="mini">${thumb(0)}</div><div><div class="tt">${copy.cards[0][0]}</div><div class="mm">12주 · 48차시 · 교재 248p · 평가지 12종 · 판서 템플릿 48개</div></div><span class="badge">본사 표준</span></div>
      <div class="sec">배포 대상<span>지점을 선택하세요</span></div>
      <div class="chips"><span class="on">전 지점 128</span><span>수도권 54</span><span>영남 31</span><span>호남 18</span><span>충청 15</span><span>강원 · 제주 10</span></div>
      <div class="blist">${copy.branches.map((b, i) => `<div class="r"><span class="cb"></span><span class="nm">${b[0]}</span><span class="mg">원장 ${managers[i]}</span><span class="cl">${b[1]}</span><span class="st">대기</span></div>`).join('')}<div class="r"><span class="cb"></span>+ 120개 지점</div></div>
      <div class="dfoot"><div class="sum"><b class="cnt">0</b>개 지점 선택 · 1,024개 반 · 강사 342명<br>적용일 2026.12.01 (화) 00:00</div>
        <div class="btn"><div class="fill"></div><span class="lbl">전 지점에 배포</span><span class="ok"><i>✓</i>128개 지점에 배포되었습니다</span></div></div>
    </div>`);
  screen.append(scrA, scrB, h('div', 'glare'));
  el.appendChild(device);

  const cards = copy.cards.map((c, i) => {
    const card = h('div', 'card obj', `<div class="thumb">${thumb(i)}</div><div class="ct">${c[0]}</div><div class="cm">${c[1]}</div>${i === 0 ? '<span class="chip">v3</span>' : ''}`);
    el.appendChild(card);
    return card;
  });
  const touch = h('div', 'touch obj');
  el.appendChild(touch);

  const typed = scrA.querySelector('.typed'), caret = scrA.querySelector('.caret'), ph = scrA.querySelector('.ph');
  const suggest = scrA.querySelector('.suggest');
  const rows = [...scrB.querySelectorAll('.blist .r')];
  const cnt = scrB.querySelector('.cnt');
  const btn = scrB.querySelector('.btn'), fill = btn.querySelector('.fill'), lbl = btn.querySelector('.lbl'), ok = btn.querySelector('.ok');
  const chars = [...copy.typed];

  /* ---------- geometry (local screen px → device → world) ---------- */
  let A = {};
  const SCR = 16; // screen inset inside the device
  function layout() {
    const b = (e, root) => boxIn(e, root);
    A.input = b(scrA.querySelector('.search'), screen);
    A.slots = [...scrA.querySelectorAll('.slot')].map(e => b(e, screen));
    A.hdrMini = b(scrB.querySelector('.hdr .mini'), screen);
    A.hdr = b(scrB.querySelector('.hdr'), screen);
    A.list = b(scrB.querySelector('.blist'), screen);
    A.btn = b(btn, screen);
  }
  // device rests at the world origin; local screen point → world
  const devModel = s => planeModel(0, s.y, 0, DW, DH, { rx: s.rx, ry: s.ry });
  const local = (m, x, y) => xf(m, SCR + x, SCR + y, 0);
  const centerOf = (m, bx) => local(m, bx.x + bx.w / 2, bx.y + bx.h / 2);

  // device landing on the beat
  const DEV = [
    { t: 1.85, y: 1050, rx: 34, ry: -4 },
    { t: T.consoleLand, y: 0, rx: 6, ry: -3, e: E.outCubic },
    { t: T.consoleLand + 0.14, y: -7, rx: 5, ry: -3, e: E.outQuad },
    { t: T.consoleLand + 0.36, y: 0, rx: 5, ry: -3, e: E.inOutQuad },
    { t: 7.3, y: 0, rx: 4, ry: -2 },
  ];

  // card fan: final 3D positions (world) relative to the device; card 1 front and centre
  const FAN = P
    ? [[0, 40, 470, 0, 1.25], [-300, -330, 230, 16, 1], [300, -330, 230, -16, 1], [-330, 380, 200, 18, 1], [330, 380, 200, -18, 1], [0, -560, 120, 0, 0.95]]
    : [[0, 40, 470, 0, 1.25], [-560, -150, 250, 22, 1], [560, -150, 250, -22, 1], [-600, 230, 170, 26, 1], [600, 230, 170, -26, 1], [0, -330, 110, 0, 0.95]];

  function cardState(i, t, m) {
    const slot = A.slots[i];
    const home = local(m, slot.x + slot.w / 2, slot.y + slot.h / 2);
    const [fx, fy, fz, fry, fs] = FAN[i];
    const st = T.cardsA + i * 0.055;
    const lift = tw(t, st, st + 0.16, E.outCubic);
    const fly = tw(t, st + 0.08, T.cardsB - 0.12 + i * 0.02, E.inOutQuint);
    const bob = tw(t, T.cardsB - 0.3, T.cardsB + 0.2, E.outQuad);
    let x = lerp(home[0], fx, fly), y = lerp(home[1], fy, fly) - Math.sin(fly * Math.PI) * 60, z = lerp(home[2] + 2, fz, fly) + lift * 60 * (1 - fly);
    let ry = fry * fly + Math.sin(fly * Math.PI) * (i % 2 ? -28 : 28), rx = 6 * (1 - fly) + Math.sin(fly * Math.PI) * -10, s = lerp(1, fs, fly);
    y += Math.sin(t * 2.1 + i) * 6 * bob;
    // card 1 flies back into the deploy page header; the others fall away out of focus
    if (i === 0) {
      const k = tw(t, 4.86, 5.3, E.inOutQuint);
      const dst = local(m, A.hdrMini.x + A.hdrMini.w / 2, A.hdrMini.y + A.hdrMini.h / 2);
      x = lerp(x, dst[0], k); y = lerp(y, dst[1], k); z = lerp(z, dst[2] + 1, k);
      s = lerp(s, A.hdrMini.w / 288 * 1.0, k); ry = lerp(ry, -3, k); rx = lerp(rx, 5, k);
    }
    return { x, y, z, ry, rx, s, home };
  }

  function camAt(t) {
    const m0 = devModel({ y: 0, rx: 5, ry: -3 });
    const inp = centerOf(m0, A.input), list = centerOf(m0, A.list), bt = centerOf(m0, A.btn);
    const c1 = FAN[0];
    const keys = P ? [
      { t: 1.6, x: 0, y: 60, z: 0, s: 0.84 },
      { t: T.consoleLand, x: 0, y: 30, z: 0, s: 0.86 },
      { t: 2.75, x: inp[0] - 230, y: inp[1] + 70, z: 0, s: 1.7, e: E.outCubic },
      { t: 3.3, x: inp[0] - 200, y: inp[1] + 80, z: 0, s: 1.9 },
      { t: 3.68, x: 0, y: 20, z: 100, s: 0.95 },
      { t: T.cardsB, x: 0, y: 40, z: 120, s: 1.0 },
      { t: T.traceB, x: c1[0], y: c1[1], z: c1[2], s: 2.2, e: E.inOutCubic },
      { t: 5.25, x: list[0] - 124, y: list[1] - 20, z: 0, s: 1.55 },
      { t: 5.62, x: bt[0] - 60, y: bt[1] - 180, z: 0, s: 2.1 },
      { t: 6.62, x: bt[0] - 30, y: bt[1] - 140, z: 0, s: 2.35 },
      { t: 7.25, x: bt[0], y: bt[1], z: 0, s: 30, e: E.inExpo },
    ] : [
      { t: 1.6, x: 0, y: 40, z: 0, s: 0.92 },
      { t: T.consoleLand, x: 0, y: 20, z: 0, s: 0.92 },
      { t: 2.75, x: inp[0] - 60, y: inp[1] + 60, z: 0, s: 1.22, e: E.outCubic },
      { t: 3.3, x: inp[0] - 20, y: inp[1] + 80, z: 0, s: 1.36 },
      { t: 3.68, x: 0, y: -20, z: 80, s: 0.8 },
      { t: T.cardsB, x: 0, y: 10, z: 100, s: 0.84 },
      { t: T.traceB, x: c1[0], y: c1[1], z: c1[2], s: 1.8, e: E.inOutCubic },
      { t: 5.25, x: list[0], y: list[1] - 10, z: 0, s: 1.22 },
      { t: 5.62, x: bt[0] - 160, y: bt[1] - 170, z: 0, s: 1.5 },
      { t: 6.62, x: bt[0] - 20, y: bt[1] - 120, z: 0, s: 1.8 },
      { t: 7.25, x: bt[0], y: bt[1], z: 0, s: 30, e: E.inExpo },
    ];
    const c = keyed(t, keys);
    c.rx = 3 * drift(t, 1.7, 0.12) + 2;
    c.ry = 5 * drift(t, 3.1, 0.1);
    c.rz = 0.6 * drift(t, 5.2, 0.09);
    c.d = 1700;
    return c;
  }

  let cur = null; // per-frame cache shared by update() and draw()
  function update(t) {
    const ds = keyed(t, DEV);
    const m = devModel(ds);
    const cam = camAt(t);
    const CM = camMatrix(cam, W, H);
    place(device, CM, m);
    device.style.opacity = clamp(prog(t, 1.85, 2.15));
    rim.style.opacity = clamp(env1(t, 2.1, T.consoleLand, T.consoleLand + 0.75) * 0.9 + 0.25 * tw(t, 2.0, 2.4) * (1 - tw(t, 2.9, 3.5)));

    // typing + autocomplete
    const nType = Math.floor(chars.length * prog(t, T.typeA, T.typeB));
    typed.textContent = chars.slice(0, nType).join('');
    ph.style.opacity = nType ? 0 : 1;
    caret.style.opacity = t > T.typeA - 0.1 && t < T.cardsA ? ((t * 2.2) % 1 < 0.6 || t < T.typeB ? 1 : 0) : 0;
    const sg = tw(t, T.typeA + 0.28, T.typeA + 0.42, E.outCubic) * (1 - tw(t, T.typeB + 0.02, T.cardsA, E.inQuad));
    suggest.style.opacity = sg;
    suggest.style.transform = `scaleY(${0.9 + 0.1 * sg})`;
    [...suggest.children].forEach((r, i) => { r.style.opacity = clamp(prog(t, T.typeA + 0.3 + i * 0.07, T.typeA + 0.42 + i * 0.07)); });

    // screen A → B
    const ab = tw(t, 4.55, 4.9, E.inOutQuad);
    scrA.style.opacity = 1 - ab;
    scrB.style.opacity = ab;

    // cards
    cards.forEach((card, i) => {
      const s = cardState(i, t, m);
      const appear = clamp(prog(t, T.typeB - 0.04 + i * 0.03, T.typeB + 0.1 + i * 0.03));
      const gone = i === 0 ? tw(t, 5.2, 5.32) : tw(t, 4.5 + i * 0.03, 4.85 + i * 0.03, E.inQuad);
      card.style.opacity = appear * (1 - gone);
      card.style.display = appear * (1 - gone) > 0.001 ? 'block' : 'none';
      card.style.zIndex = Math.round(s.z + 1000);
      const blur = i === 0 ? 0 : (tw(t, T.cardsB - 0.2, T.cardsB + 0.2) * 3 + gone * 8);
      card.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
      place(card, CM, planeModel(s.x, s.y, s.z, 288, 190, { rx: s.rx, ry: s.ry, s: s.s }));
      s.model = planeModel(s.x, s.y, s.z, 288, 190, { rx: s.rx, ry: s.ry, s: s.s });
      if (i === 0) cur = { ...(cur || {}), card1: s };
    });

    // checklist
    let checked = 0;
    rows.forEach((r, i) => {
      const on = t > T.checksA + 0.08 + i * 0.062;
      if (on) checked++;
      r.querySelector('.cb').className = `cb ${on ? 'on' : ''}`;
      r.querySelector('.cb').textContent = on ? '✓' : '';
      const st = r.querySelector('.st');
      if (st) { st.className = `st ${on ? 'on' : ''}`; st.textContent = on ? '선택됨' : '대기'; }
    });
    cnt.textContent = checked >= rows.length ? '128' : String(Math.round(checked * 15.3));

    // fill → tap → success
    const f = tw(t, T.fillA, T.fillB, E.inOutCubic);
    fill.style.width = `${(f * 100).toFixed(2)}%`;
    lbl.style.color = f > 0.55 ? '#fff' : '';
    const press = t > 6.0 && t < 6.2 ? 1 - Math.sin(prog(t, 6.0, 6.2) * Math.PI) * 0.035 : 1;
    btn.style.transform = `scale(${press})`;
    const okA = tw(t, T.success + 0.03, T.success + 0.18, E.outCubic);
    lbl.style.opacity = 1 - tw(t, T.success - 0.04, T.success + 0.05);
    ok.style.opacity = okA;
    ok.style.transform = `translateY(${(1 - okA) * 10}px)`;
    // touch ripple
    const tp = prog(t, T.tap - 0.04, T.tap + 0.4);
    const bc = local(m, A.btn.x + A.btn.w * 0.62, A.btn.y + A.btn.h / 2);
    touch.style.opacity = tp > 0 && tp < 1 ? (tp < 0.15 ? tp / 0.15 : 1 - (tp - 0.15) / 0.85) : 0;
    place(touch, CM, planeModel(bc[0], bc[1], bc[2] + 2, 120, 120, { s: 0.5 + tp * 1.1 }));

    // fly-through
    const thr = prog(t, 6.8, 7.25);
    el.style.filter = thr > 0 ? `blur(${(thr * thr * 14).toFixed(2)}px) brightness(${1 + thr * 1.6})` : '';
    el.style.opacity = 1 - tw(t, 7.1, 7.25);
    ctx.flash += 0.8 * env1(t, 6.95, 7.18, 7.32);

    cur = { ...cur, m, CM, cam };
  }

  function draw(fx, t) {
    if (!cur) return;
    const { m, CM } = cur;
    const P3 = pts => project(CM, pts);

    // 1) the light copy peels off the i-dot and falls into the search field
    if (t >= T.peel && t < T.consoleLand + 0.2) {
      const g = logoGeometry(P ? 820 : 900);
      const lx = Math.round(W / 2 - g.w / 2), ly = Math.round(H / 2 - g.h / 2 - (P ? 40 : 10));
      const up = tw(t, T.logoUp, T.logoUp + 0.55, E.inOutCubic) * (P ? 220 : 170);
      const D = [lx + g.iDotC[0], ly + g.iDotC[1] - up];
      const inL = P3([local(m, A.input.x + 14, A.input.y + A.input.h)])[0];
      const path = bezier([D[0], D[1]], [D[0] + 60, D[1] + 260], [inL[0] - 260, inL[1] - 220], [inL[0], inL[1]], 48);
      const k = E.inQuad(prog(t, T.peel + 0.12, T.consoleLand));
      if (t < T.peel + 0.12) {
        const kk = prog(t, T.peel, T.peel + 0.12);
        fx.shape(g.iDot.map(p => [lx + p[0], ly + p[1] - up + kk * 18]), 0.9 * (1 - kk * 0.4), 1);
      } else {
        fx.line(slice(path, Math.max(0, k - 0.32), k), { w: 5, alpha: 1, taper: 1, head: 1, headScale: 1.2 });
      }
    }
    // 2) slot in as the search field's focus line
    if (t >= T.consoleLand - 0.02 && t < T.cardsA + 0.12) {
      const y = A.input.y + A.input.h;
      const run = tw(t, T.consoleLand - 0.02, T.consoleLand + 0.16, E.outCubic);
      const fade = 1 - tw(t, T.typeB + 0.02, T.cardsA + 0.1, E.inQuad);
      const seg = [];
      for (let i = 0; i <= 24; i++) seg.push(local(m, A.input.x + 14 + (A.input.w - 28) * (i / 24) * run, y));
      fx.line(P3(seg), { w: 3.6, alpha: fade * (0.85 + 0.15 * Math.sin(t * 9)), taper: 0.25, head: run < 1 ? 1 : 0.35 });
    }
    // 3) trace card 1, then cool off as it flies into the header
    if (t >= T.cardsB - 0.02 && t < 5.35 && cur.card1) {
      const outline = roundRect(-2, -2, 292, 194, 18, 6);
      const pts = P3(outline.map(p => xf(cur.card1.model, p[0], p[1], 0)));
      const k = tw(t, T.cardsB, T.traceB - 0.02, E.inOutCubic);
      const fade = 1 - tw(t, 4.95, 5.3, E.inQuad);
      fx.line(slice(pts, 0, k), { w: 4.2, alpha: fade, taper: 0.5, head: k < 1 ? 1 : 0 });
    }
    // 4) run down to the button, become its fill
    if (t >= 5.3 && t < T.success + 0.25) {
      const bx = A.btn, by = bx.y + bx.h - 3;
      const route = [
        ...bezier([A.hdr.x + 30, A.hdr.y + A.hdr.h], [A.hdr.x - 10, A.hdr.y + 300], [bx.x - 120, by + 20], [bx.x + 4, by], 30),
        [bx.x + bx.w - 4, by],
      ].map(p => local(m, p[0], p[1]));
      const L = measure(route), uB = L[L.length - 2] / L[L.length - 1];
      let head;
      if (t < T.fillA) head = lerp(0, uB, tw(t, 5.3, T.fillA, E.inQuad));
      else head = lerp(uB, 1, tw(t, T.fillA, T.fillB, E.inOutCubic));
      const fade = 1 - tw(t, T.tap, T.success + 0.2, E.inQuad);
      const seg = slice(route, Math.max(t < T.fillA ? 0 : uB, head - 0.4), head, L);
      fx.line(P3(seg), { w: 4, alpha: fade, taper: t < T.fillA ? 1 : 0.2, head: 1 });
    }
    // 5) shoot out through the screen
    if (t >= T.shoot && t < 7.36) {
      const c = P3([local(m, A.btn.x + A.btn.w / 2, A.btn.y + A.btn.h / 2)])[0];
      const k = prog(t, T.shoot, 7.2);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.42 + Math.sin(i * 7.1) * 0.12;
        const r0 = E.inCubic(k) * (700 + i * 40), r1 = r0 + 60 + E.inCubic(k) * 900;
        const fade = 1 - tw(t, 7.12, 7.33, E.inQuad);
        fx.line([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1]], { w: i === 4 ? 6 : 2.4, alpha: fade * (1 - k * 0.5) * (i === 4 ? 1 : 0.55), taper: 1, head: i === 4 ? 1 : 0 });
      }
      fx.flare(c[0], c[1], 160 + k * 500, 0.6 * k * (1 - tw(t, 7.15, 7.34, E.inQuad)));
    }
  }

  return { el, range: ctx.S.console, layout, update, draw, debug: () => ({ A, cam: cur && cur.cam }) };
}

// helper: rises over [a, b], falls over [b, c]
function env1(t, a, b, c) {
  return t < b ? E.outCubic(prog(t, a, b)) : 1 - E.inOutQuad(prog(t, b, c));
}
