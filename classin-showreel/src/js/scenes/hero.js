// S8 · 히어로 (21.60–24.00) + S9 · 엔드카드 (24.00–26.40)
// On the hit the arrow slots into the i-dot and the official wordmark reveals C → n again; it holds,
// pixel-exact, with a slow light passing beneath. Then the i-dot's light becomes a single dot,
// stretches into a line, and the end card opens out of it.
import { E, tw, prog, clamp, lerp, shake, slice, measure, h } from '../core.js';
import { createLogo, logoArrow, logoRest } from '../logo.js';

export default function heroScene(ctx) {
  const { W, H, P, T } = ctx;
  const el = h('section', 'scene');
  ctx.root.appendChild(el);
  const R = logoRest(W, H, P);
  const { g, lx, ly } = R;
  const under = h('div', 'under');
  el.appendChild(under);
  const logo = createLogo(g.w);
  el.appendChild(logo.el);
  const sub1 = h('div', 'sub1', 'ENTERPRISE');
  const sub2 = h('div', 'sub2', '다지점 학원을 위한 교육 운영 시스템');
  el.append(sub1, sub2);

  const spot = h('div', 'spot');
  const top = h('div', 'mask'), bot = h('div', 'mask');
  const e1 = h('div', 'e1', P ? '1,000개 이상의 다지점 학원이<br>선택한 교육 운영 시스템' : '<b>1,000+</b> 다지점 학원이 선택한 교육 운영 시스템');
  const e2 = h('div', 'e2', `<img src="assets/logo-240.png" alt="ClassIn" style="width:240px"><span>ENTERPRISE</span>`);
  const e3 = h('div', 'e3', '14일 무료 체험<i>|</i>전담 CSM 지원<i>|</i>무료 도입 컨설팅');
  top.appendChild(e1);
  bot.append(e2, e3);
  el.append(spot, top, bot);

  const D = [lx + g.iDotC[0], ly + g.iDotC[1]];
  const arrow = logoArrow(lx, ly, g, P);
  const AL = measure(arrow);
  const CY = Math.round(H / 2);

  function layout() {
    sub1.style.transform = `translate(${Math.round(W / 2 - sub1.offsetWidth / 2 + 7)}px, ${Math.round(ly + g.h + (P ? 70 : 64))}px)`;
    // masks: everything above / below the end-card line
    top.style.top = '0px'; top.style.height = `${CY}px`;
    bot.style.top = `${CY}px`; bot.style.height = `${H - CY}px`;
    e1.style.top = `${CY - (P ? 176 : 104)}px`;
    e2.style.top = '38px';
    e3.style.top = `${P ? 140 : 126}px`;
  }

  function update(t) {
    el.style.opacity = clamp(prog(t, T.hero - 0.12, T.hero));
    const rv = tw(t, T.hero, T.hero + 0.34, E.outCubic);
    logo.reveal(t < T.hero ? -60 : lerp(-60, g.w + 80, rv));
    const def = tw(t, T.shineB, T.dot, E.inOutQuad);
    logo.el.style.transform = `translate(${lx}px, ${ly}px)${def > 0 ? ` scale(${1 + def * 0.04})` : ''}`;
    logo.el.style.transformOrigin = `${g.iDotC[0]}px ${g.iDotC[1]}px`;
    logo.el.style.opacity = 1 - tw(t, T.shineB + 0.15, T.dot, E.inQuad);
    logo.el.style.filter = def > 0.01 ? `blur(${(def * 16).toFixed(2)}px)` : '';
    const s = tw(t, T.sub, T.sub + 0.45, E.outCubic) * (1 - tw(t, T.shineB - 0.1, T.shineB + 0.3));
    sub1.style.opacity = s;
    sub2.style.opacity = s;
    sub2.style.transform = `translate(${Math.round(W / 2 - sub2.offsetWidth / 2)}px, ${Math.round(ly + g.h + (P ? 118 : 108) + (1 - s) * 14)}px)`;
    const sh = shake(t, T.hero, 9, 0.3);
    ctx.shake[0] += sh[0]; ctx.shake[1] += sh[1];
    ctx.flash += 0.22 * (t >= T.hero ? 1 - prog(t, T.hero, T.hero + 0.3) : 0);
    // the slow light passing beneath the logo
    const sk = tw(t, T.shineA, T.shineB, E.inOutSine);
    under.style.opacity = Math.sin(sk * Math.PI) * 0.9;
    under.style.transform = `translate(${lerp(lx - 120, lx + g.w + 120, sk)}px, ${ly + g.h + 40}px)`;
    // end card
    const op = tw(t, T.lineB, T.lineB + 0.7, E.outQuint);
    e1.style.transform = `translate(-50%, ${((1 - op) * (P ? 180 : 110)).toFixed(1)}px)`;
    e2.style.transform = `translate(-50%, ${((1 - op) * -110).toFixed(1)}px)`;
    e3.style.transform = `translate(-50%, ${((1 - tw(t, T.lineB + 0.15, T.lineB + 0.85, E.outQuint)) * -150).toFixed(1)}px)`;
    e1.style.opacity = op; e2.style.opacity = op; e3.style.opacity = tw(t, T.lineB + 0.15, T.lineB + 0.85);
    spot.style.opacity = tw(t, T.lineA, T.lineB + 0.6, E.inOutQuad);
  }

  function draw(fx, t) {
    if (t < T.hero) return;
    // the slot-in: arrow lit, impact at the dot, a pulse runs C → n with the reveal
    fx.flare(D[0], D[1], 260 * (1 - prog(t, T.hero, T.hero + 0.45)) + 30, 1 - prog(t, T.hero, T.hero + 0.55));
    fx.shards(D[0], D[1], t, T.hero, { n: 14, seed: 5, speed: 1100, life: 0.45, len: 70, w: 2 });
    const dotA = 1 - tw(t, T.hero + 0.12, T.hero + 0.45, E.inOutQuad);
    fx.shape(g.iDot.map(p => [lx + p[0], ly + p[1]]), dotA, 1);
    const fade = 1 - tw(t, T.hero + 0.2, T.hero + 0.6, E.inOutQuad);
    fx.line(arrow, { w: 5.5, alpha: fade * 0.8, taper: 0.5, head: 0 });
    const pk = tw(t, T.hero, T.hero + 0.34, E.outCubic);
    if (pk < 1) fx.line(slice(arrow, Math.max(0, pk - 0.18), pk, AL), { w: 7, alpha: 1, taper: 1, head: 1 });

    // the i-dot's light becomes a single dot, travels to centre, stretches into the line
    if (t > T.shineB) {
      const glow = tw(t, T.shineB, T.shineB + 0.35);
      const mv = tw(t, T.dot - 0.2, T.lineA + 0.02, E.inOutCubic);
      const x = lerp(D[0], W / 2, mv), y = lerp(D[1], CY, mv);
      const st = tw(t, T.lineA, T.lineB, E.outQuint);
      const half = st * (P ? 300 : 330);
      if (st <= 0.001) {
        fx.head(x, y, 4 + (1 - mv) * 2, glow);
      } else {
        const cool = tw(t, T.lineB, T.lineB + 0.8) * 0.7;
        const pts = [];
        for (let i = 0; i <= 24; i++) pts.push([W / 2 - half + (2 * half * i) / 24, CY]);
        fx.line(pts, { w: lerp(5, 2.6, st), alpha: 1, taper: 0, head: 0, cool: cool * 0.4 });
        fx.head(W / 2, CY, lerp(5, 2, st), 1 - st * 0.7);
      }
    }
  }

  return { el, range: ctx.S.hero, layout, update, draw };
}
