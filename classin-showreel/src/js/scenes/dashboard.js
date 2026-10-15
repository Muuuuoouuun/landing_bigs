// S6 · 본사로 (14.40–16.80): the gathered light opens into the HQ dashboard and becomes its live
// chart line. "현장에 묻지 마세요" — every branch, every class, visible from one screen.
import { E, tw, lerp, keyed, drift, xf, camMatrix, place, planeModel, boxIn, fmt, h } from '../core.js';
import { project } from '../line.js';

const SERIES = [120, 160, 210, 330, 470, 610, 700, 760, 820, 900, 940, 990, 1010, 1024, 1018, 1022, 1024];
const XL = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function dashScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const DW = 1440, DH = 860;
  const CW = 900, CH = 420, PL = 70, PR = 30, PT = 80, PB = 46;
  const px = i => PL + (i / (SERIES.length - 1)) * (CW - PL - PR);
  const py = v => CH - PB - (v / 1100) * (CH - PT - PB);
  const area = `M${px(0)},${py(0) + 0} ${SERIES.map((v, i) => `L${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')} L${px(SERIES.length - 1)},${CH - PB} L${px(0)},${CH - PB} Z`;
  const grid = [0, 250, 500, 750, 1000].map(v => `<line class="gl" x1="${PL}" x2="${CW - PR}" y1="${py(v)}" y2="${py(v)}"/><text class="lb" x="${PL - 14}" y="${py(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
  const xl = XL.map((l, i) => `<text class="lb" x="${PL + (i / (XL.length - 1)) * (CW - PL - PR)}" y="${CH - 16}" text-anchor="middle">${l}</text>`).join('');
  const rowsHTML = [['대치 본원', '48반'], ['분당 정자', '36반'], ['인천 송도', '28반'], ['대전 둔산', '24반'], ['대구 수성', '32반'], ['부산 센텀', '30반'], ['광주 봉선', '22반']]
    .map(([n, c]) => `<div class="rw"><i></i>${n}<span class="c">${c} 진행 중</span><span class="ok">정상</span></div>`).join('');
  const bars = ['대치', '분당', '송도', '일산', '수원', '대전', '청주', '대구', '광주', '부산', '울산', '창원', '전주', '강릉', '포항', '제주'];

  const dash = h('div', 'dash obj', `<div class="hd"><img src="assets/logo-132.png" alt=""><span class="tb-ent">ENTERPRISE</span><span class="tt">전국 지점 실시간 현황</span>
      <span class="rt">2026.12.01 (화) <b class="clk">19:42:08</b><span class="lv"><i></i>LIVE</span></span></div>
    <div class="kpis">
      <div class="kpi hl"><div class="kl">진행 중 수업</div><div class="kv"><span class="n0">0</span><small>개</small></div><div class="kd">128개 지점 · 실시간</div></div>
      <div class="kpi"><div class="kl">평균 출석률</div><div class="kv"><span class="n1">0</span><small>%</small></div><div class="kd">+2.1%p 지난주 대비</div></div>
      <div class="kpi"><div class="kl">평균 데이터 응답</div><div class="kv"><span class="n2">0</span><small>초</small></div><div class="kd">서버 가동률 99.9%</div></div>
      <div class="kpi"><div class="kl">수업 데이터 보존</div><div class="kv"><span class="n3">0</span><small>%</small></div><div class="kd">데이터 손실 0건</div></div>
    </div>
    <div class="chart"><div class="ct">시간대별 동시 수업<span>전 지점 합계</span></div><div class="now"><span class="nn">0</span><small>개 수업</small></div>
      <svg width="${CW}" height="${CH}"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39FF6A" stop-opacity="0.32"/><stop offset="1" stop-color="#04BC09" stop-opacity="0"/></linearGradient>
        <clipPath id="arc"><rect class="arcr" x="0" y="0" width="0" height="${CH}"/></clipPath></defs>${grid}${xl}<path d="${area}" fill="url(#ar)" clip-path="url(#arc)"/></svg></div>
    <div class="status"><div class="st">지점 상태<span>● 128 / 128 정상</span></div><div class="rows"><div class="alert"><div class="in"><i></i><span class="am">분당 정자 3반 · 접속 불안정 감지</span><span class="sub">원격 진단 중</span></div></div>${rowsHTML}</div></div>
    <div class="align"><div class="at">지점별 커리큘럼 진도<span>고2 수학 정규 커리큘럼 v3 · 본사 기준 대비</span></div><div class="av">편차 0%</div>
      <div class="bars">${bars.map(b => `<div><b></b><span>${b}</span></div>`).join('')}</div></div>`);
  el.appendChild(dash);
  const $ = s => dash.querySelector(s);
  const nums = [$('.n0'), $('.n1'), $('.n2'), $('.n3')], nn = $('.nn'), clk = $('.clk');
  const arcr = $('.arcr'), alert = $('.alert'), am = $('.am'), asub = alert.querySelector('.sub');
  const barEls = [...dash.querySelectorAll('.align .bars b')];

  let A = {};
  function layout() { A.chart = boxIn($('.chart'), dash); }

  function camAt(t) {
    const keys = P ? [
      { t: 14.85, x: 0, y: 0, s: 0.18, rx: 10, ry: 0 },
      { t: 15.35, x: -290, y: -150, s: 1.2, rx: 4, ry: 6, e: E.outQuint },
      { t: 15.75, x: -250, y: -60, s: 1.18, rx: 3, ry: 2, e: E.inOutSine },
      { t: 16.15, x: -80, y: 40, s: 1.05, rx: 3, ry: -4, e: E.inOutSine },
      { t: 16.95, x: 330, y: 0, s: 3.2, rx: 2, ry: 0, e: E.inExpo },
    ] : [
      { t: 14.85, x: 0, y: 0, s: 0.18, rx: 10, ry: 0 },
      { t: 15.35, x: 0, y: 0, s: 1.0, rx: 5, ry: 6, e: E.outQuint },
      { t: 16.15, x: -40, y: 10, s: 1.07, rx: 3, ry: -4, e: E.inOutSine },
      { t: 16.95, x: 0, y: 0, s: 4.2, rx: 2, ry: 0, e: E.inExpo },
    ];
    const c = keyed(t, keys);
    c.rz = 0.6 * drift(t, 2.4, 0.1);
    c.d = 1800;
    return c;
  }

  // world position of the chart line's points (dashboard centred on the origin)
  const chartPts = () => SERIES.map((v, i) => [A.chart.x + px(i), A.chart.y + py(v)]);
  const headAt = k => {
    const pts = chartPts(), f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), u = f - i;
    const out = pts.slice(0, i + 1);
    out.push([lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]);
    return out;
  };

  let cur = null;
  function update(t) {
    const cam = camAt(t);
    // final push dives into the live head of the chart line
    if (t > 16.15) {
      const hp = chartPts()[SERIES.length - 1];
      const k = tw(t, 16.15, 16.95, E.inQuad);
      cam.x = lerp(cam.x, hp[0] - DW / 2, k); cam.y = lerp(cam.y, hp[1] - DH / 2, k);
    }
    const CM = camMatrix(cam, W, H);
    const m = planeModel(0, 0, 0, DW, DH);
    place(dash, CM, m);
    const vis = tw(t, 14.82, 15.12, E.outCubic) * (1 - tw(t, 16.55, 16.92, E.inOutSine));
    el.style.opacity = vis;
    const blur = (1 - tw(t, 14.85, 15.25)) * 10 + tw(t, 16.35, 16.92, E.inQuad) * 18;
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';

    const c = tw(t, 15.05, 15.75, E.outCubic);
    nums[0].textContent = fmt(Math.round(1024 * c));
    nums[1].textContent = (98.7 * c).toFixed(1);
    nums[2].textContent = (0.3 * c).toFixed(1);
    nums[3].textContent = String(Math.round(100 * c));
    const k = tw(t, 15.05, 15.95, E.inOutCubic);
    arcr.setAttribute('width', (PL + k * (CW - PL - PR)).toFixed(1));
    const idx = Math.round(k * (SERIES.length - 1));
    nn.textContent = fmt(SERIES[idx]);
    const secs = 42 * 60 + 8 + Math.floor((t - 14.4) * 1);
    clk.textContent = `19:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    // alert → resolved within 4 minutes
    const al = tw(t, T.alert, T.alert + 0.2, E.outCubic);
    alert.style.height = `${(al * 52).toFixed(1)}px`;
    const ok = t > T.resolved;
    alert.className = `alert${ok ? ' ok' : ''}`;
    am.textContent = ok ? '분당 정자 3반 · 원격 지원 연결' : '분당 정자 3반 · 접속 불안정 감지';
    asub.textContent = ok ? '4분 내 해결 ✓' : '원격 진단 중';
    barEls.forEach((b, i) => {
      const hgt = tw(t, 15.15 + i * 0.03, 15.6 + i * 0.03, E.outBack);
      b.style.height = `${(hgt * 40).toFixed(1)}px`;
    });
    cur = { CM, m, k };
  }

  function draw(fx, t) {
    if (!cur || t < 15.0) return;
    const { CM, m, k } = cur;
    const a = +el.style.opacity;
    const pts = headAt(k).map(p => xf(m, p[0], p[1], 0));
    const sc = project(CM, pts);
    fx.line(sc, { w: 4.2, alpha: a, taper: k < 1 ? 0.6 : 0.2, head: 1, headScale: 1 + 0.15 * Math.sin(t * 8) });
    if (k >= 1) {
      const hp = sc[sc.length - 1];
      const pulse = (t * 1.4) % 1;
      fx.flare(hp[0], hp[1], 40 + pulse * 70, a * 0.5 * (1 - pulse));
    }
  }

  return { el, range: ctx.S.dash, layout, update, draw };
}
