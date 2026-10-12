import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath, getPointAtLength, getLength } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridPlane } from '../components/Background';
import { Flash, LensStreak } from '../components/Fx';
import { KineticText, RollingNumber, WordSlot } from '../components/Kinetic';
import { ClassroomWindow } from '../components/ClassroomWindow';
import { ChapterPill } from '../components/ChapterPill';

// ① 표준화 — 같은 인프라 · 같은 수업 · 같은 콘텐츠.
// Content runs 140 frames (global 100–240); the extra 8 frames are the outgoing push-cut.
export const STANDARDIZE_DURATION = 148;
// Beat changes land on the music grid (one beat = 14 frames).
const BEATS = [0, 42, 98];
const BEAT_LENS = [42, 56, 42];
const VCX = 1340; // visual column center
const VCY = 540;

const COPY = [
  {
    en: 'SAME INFRASTRUCTURE',
    sub: '전 지점이 하나의 클라우드 플랫폼 위에서',
    chips: ['통합 계정', '모든 기기 지원', '무중단 스트리밍'],
  },
  {
    en: 'SAME CLASS',
    sub: '어느 지점, 어느 강사든 같은 수업 품질',
    chips: ['수업 템플릿', '실시간 판서', '학생 참여 도구'],
  },
  {
    en: 'SAME CONTENT',
    sub: '본사 커리큘럼을 전 지점에 원클릭 배포',
    chips: ['교재', '진도표', '평가지 · 과제'],
  },
];

const AREAS = ['강남', '분당', '대치', '목동', '송도', '일산', '해운대', '수성', '둔산', '광교', '평촌', '중계'];

/* ---------------- Beat 0 — one cloud infrastructure for every branch ---------------- */
const INFRA_BRANCHES = ['강남', '분당', '대치', '송도'];
const CORE = { x: VCX, y: 300 };
const CARD = { w: 200, h: 196, y: 610 };
const cardX = (k) => VCX + (k - 1.5) * 222;
const infraLink = (k) => {
  const x = cardX(k);
  const top = CARD.y - CARD.h / 2;
  return `M ${CORE.x} ${CORE.y + 46} C ${CORE.x} ${CORE.y + 150}, ${x} ${top - 110}, ${x} ${top}`;
};

const DeviceIcon = ({ kind, on, flicker }) => {
  const screenOn = on ? (flicker ? 0.55 : 1) : 0;
  const stroke = on ? C.green : 'rgba(255,255,255,0.28)';
  const screen = (x, y, w, h, r) => (
    <>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="#06110b" stroke={stroke} strokeWidth={1.6} />
      <g opacity={screenOn}>
        <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={r - 1} fill="url(#dev-screen)" />
        <rect x={x + 4} y={y + 4} width={w * 0.35} height={2.5} rx={1} fill={C.green} />
        <path
          d={`M ${x + 5} ${y + h - 6} Q ${x + w * 0.45} ${y + h * 0.25} ${x + w - 5} ${y + h - 9}`}
          fill="none"
          stroke={C.greenSoft}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </g>
    </>
  );
  return (
    <svg width="56" height="46" viewBox="0 0 56 46" style={{ overflow: 'visible', filter: on ? 'drop-shadow(0 0 6px rgba(0,223,69,0.55))' : undefined }}>
      {kind === 'pc' && (
        <>
          {screen(4, 2, 48, 31, 3)}
          <path d="M 24 34 L 22 41 M 32 34 L 34 41 M 17 42 H 39" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {kind === 'tablet' && screen(14, 1, 28, 42, 5)}
      {kind === 'board' && (
        <>
          {screen(1, 4, 54, 30, 2)}
          <path d="M 12 36 L 8 45 M 44 36 L 48 45 M 18 37 H 38" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

const InfraVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = ip(frame, [36, 42], [0, 1], EASE.in);
  const core = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${-exit * 260}px)`,
        opacity: 1 - exit,
        filter: exit > 0.05 ? `blur(${exit * 14}px)` : undefined,
      }}
    >
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="dev-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14583a" />
            <stop offset="1" stopColor="#0a2d1e" />
          </linearGradient>
        </defs>
        {INFRA_BRANCHES.map((_, k) => {
          const d = infraLink(k);
          const ev = evolvePath(ip(frame, [3 + k, 13 + k], [0, 1], EASE.inOut), d);
          return (
            <path key={k} d={d} fill="none" stroke={C.green} strokeOpacity={0.5} strokeWidth={2} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          );
        })}
        {/* data pulses flowing core → branches */}
        {frame >= 12 &&
          INFRA_BRANCHES.map((_, k) =>
            [0, 0.5].map((off) => {
              const d = infraLink(k);
              const t = (((frame - 12) / 16 + off + k * 0.13) % 1 + 1) % 1;
              const pt = getPointAtLength(d, getLength(d) * t);
              return <circle key={`${k}-${off}`} cx={pt.x} cy={pt.y} r={4.5} fill={C.greenSoft} style={{ filter: `drop-shadow(0 0 6px ${C.green})` }} />;
            }),
          )}
        {/* rotating orbit around the core */}
        <ellipse
          cx={CORE.x}
          cy={CORE.y}
          rx={210}
          ry={70}
          fill="none"
          stroke={C.green}
          strokeOpacity={0.35 * core}
          strokeWidth={1.5}
          strokeDasharray="3 12"
          transform={`rotate(${frame * 0.6} ${CORE.x} ${CORE.y})`}
        />
      </svg>

      {/* cloud core */}
      <div
        style={{
          position: 'absolute',
          left: CORE.x - 160,
          top: CORE.y - 46,
          width: 320,
          height: 92,
          borderRadius: 46,
          transform: `scale(${core})`,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,223,69,0.42), rgba(0,70,30,0.35) 70%)',
          border: `2px solid ${C.green}`,
          boxShadow: `0 0 ${50 + 20 * Math.sin(frame * 0.35)}px rgba(0,223,69,0.45)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          fontFamily: FONT.sans,
        }}
      >
        <svg width="46" height="32" viewBox="0 0 46 32">
          <path d="M 12 29 H 36 A 9 9 0 0 0 37 11 A 12 12 0 0 0 14 9 A 10 10 0 0 0 12 29 Z" fill="none" stroke={C.white} strokeWidth={2.6} strokeLinejoin="round" />
        </svg>
        <div>
          <div style={{ color: C.white, fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', lineHeight: 1 }}>ClassIn Cloud</div>
          <div style={{ color: C.green, fontFamily: FONT.mono, fontWeight: 700, fontSize: 12, letterSpacing: '0.26em', marginTop: 5 }}>ENTERPRISE CORE</div>
        </div>
      </div>

      {/* branch cards with devices powering on */}
      {INFRA_BRANCHES.map((name, k) => {
        const pop = spring({ frame: frame - 8 - k * 1.5, fps, config: { damping: 13, stiffness: 180 } });
        const devices = ['pc', 'tablet', 'board'];
        const onAt = (j) => 14 + k * 2 + j * 2.5;
        const allOn = frame >= onAt(2) + 3;
        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: cardX(k) - CARD.w / 2,
              top: CARD.y - CARD.h / 2,
              width: CARD.w,
              height: CARD.h,
              borderRadius: 18,
              transform: `scale(${pop})`,
              background: 'linear-gradient(165deg, rgba(18,40,28,0.95), rgba(6,16,11,0.95))',
              border: `1.5px solid ${allOn ? 'rgba(0,223,69,0.7)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: allOn ? '0 0 34px rgba(0,223,69,0.3)' : '0 20px 50px rgba(0,0,0,0.5)',
              padding: '16px 16px 12px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: FONT.sans,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: C.white, fontWeight: 800, fontSize: 21 }}>{name} 지점</span>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: allOn ? C.green : 'rgba(255,255,255,0.25)', boxShadow: allOn ? `0 0 10px ${C.green}` : undefined }} />
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', rowGap: 6, marginTop: 8 }}>
              {devices.map((d, j) => {
                const t0 = onAt(j);
                return (
                  <div key={d} style={{ gridColumn: j === 2 ? '1 / span 2' : undefined }}>
                    <DeviceIcon kind={d} on={frame >= t0} flicker={frame >= t0 && frame < t0 + 3 && Math.floor(frame) % 2 === 0} />
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: '0.2em', color: allOn ? C.green : C.dim }}>{allOn ? '● ONLINE' : '○ BOOTING'}</div>
          </div>
        );
      })}

      {/* "same" badges */}
      <div style={{ position: 'absolute', left: VCX - 330, top: 752, width: 660, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {['같은 계정', '같은 화면', '같은 도구'].map((label, k) => {
          const s = spring({ frame: frame - 22 - k * 3, fps, config: { damping: 12, stiffness: 200 } });
          return (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 999,
                border: `1.5px solid ${C.green}`,
                background: 'rgba(0,223,69,0.12)',
                color: C.white,
                fontFamily: FONT.sans,
                fontWeight: 800,
                fontSize: 21,
                transform: `scale(${s})`,
                opacity: Math.min(1, s * 1.5),
              }}
            >
              <span style={{ color: C.green }}>=</span>
              {label}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Beat A — one class, cloned to every branch ---------------- */
const ClassVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = ip(frame, [0, 13], [0, 1], EASE.out);
  const shrink = ip(frame, [32, 42], [0, 1], EASE.inOut);
  const push = ip(frame, [0, 32], [0.97, 1.03], EASE.smooth);
  const exit = ip(frame, [50, 56], [0, 1], EASE.in);
  const TILE = 0.3;
  const GAP_X = 900 * TILE + 26;
  const GAP_Y = 540 * TILE + 46;

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${-exit * 260}px)`,
        opacity: 1 - exit,
        filter: exit > 0.05 ? `blur(${exit * 14}px)` : undefined,
      }}
    >
      {Array.from({ length: 9 }).map((_, k) => {
        const col = (k % 3) - 1;
        const row = Math.floor(k / 3) - 1;
        const hero = k === 4;
        const pop = hero ? 1 : spring({ frame: frame - 35 - Math.abs(col) * 2 - Math.abs(row) * 3 - (k % 2), fps, config: { damping: 13, stiffness: 170 } });
        if (!hero && frame < 35) return null;
        const scale = hero ? (push + (TILE - push) * shrink) : TILE * pop;
        const x = VCX + col * GAP_X;
        const y = VCY + row * GAP_Y - 10;
        const heroIn = hero ? { x: (1 - enter) * 340, rotY: (1 - enter) * -32, op: enter } : { x: 0, rotY: 0, op: 1 };
        const labelOp = ip(frame, [40, 46], [0, 1]);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x - 450,
              top: y - 270,
              width: 900,
              height: 540,
              opacity: heroIn.op,
              transform: `perspective(1600px) translateX(${heroIn.x}px) rotateY(${heroIn.rotY}deg) scale(${scale})`,
            }}
          >
            <ClassroomWindow t={frame} branch={AREAS[k]} live={hero} />
            {/* branch label under each tile (sized to survive the 0.3 scale) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 560,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                opacity: labelOp,
                fontFamily: FONT.sans,
                fontWeight: 700,
                fontSize: 54,
                color: C.white,
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 13, background: C.green, boxShadow: `0 0 30px ${C.green}` }} />
              {AREAS[k]}
              <span style={{ fontFamily: FONT.mono, fontSize: 40, color: C.green, letterSpacing: '0.1em' }}>SYNC</span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- Beat B — curriculum deployed to every branch ---------------- */
const DOCS = [
  { t: '커리큘럼', c: C.green },
  { t: '교재', c: '#4aa3ff' },
  { t: '진도표', c: C.gold },
  { t: '평가지', c: '#ff7a59' },
  { t: '과제', c: '#b98cff' },
];
const RX = 430;
const RY = 290;

const DocCard = ({ title, color, w = 104, h = 132 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 10,
      background: 'linear-gradient(160deg, #13261d, #0a1510)',
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
      overflow: 'hidden',
      fontFamily: FONT.sans,
    }}
  >
    <div style={{ height: 8, background: color }} />
    <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>{title}</div>
      {[86, 64, 78, 52, 70].map((wd, k) => (
        <div key={k} style={{ height: 4, width: `${wd}%`, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
      ))}
    </div>
  </div>
);

const ContentVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = ip(frame, [36, 42], [0, 1], EASE.in);
  const hub = spring({ frame: frame - 1, fps, config: { damping: 12, stiffness: 160 } });
  const nodes = Array.from({ length: 12 }).map((_, k) => {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    return { k, x: VCX + Math.cos(a) * RX, y: VCY + Math.sin(a) * RY, a };
  });
  const progress = ip(frame, [13, 34], [0, 1], EASE.smooth);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + exit * 0.35})`,
        transformOrigin: `${VCX}px ${VCY}px`,
        opacity: 1 - exit,
        filter: exit > 0.05 ? `blur(${exit * 12}px)` : undefined,
      }}
    >
      {/* orbit + spokes */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <ellipse
          cx={VCX}
          cy={VCY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke={C.line}
          strokeWidth={1.5}
          strokeDasharray="4 10"
          opacity={ip(frame, [2, 10], [0, 1])}
          transform={`rotate(${frame * 0.4} ${VCX} ${VCY})`}
        />
        {nodes.map((n) => {
          const p = ip(frame, [5 + n.k * 0.5, 13 + n.k * 0.5], [0, 1]);
          return (
            <line
              key={n.k}
              x1={VCX}
              y1={VCY}
              x2={VCX + (n.x - VCX) * p}
              y2={VCY + (n.y - VCY) * p}
              stroke={C.green}
              strokeOpacity={0.35}
              strokeWidth={1.2}
            />
          );
        })}
      </svg>

      {/* flying packets — curved paths hub → branch */}
      {nodes.map((n) => {
        const start = 13 + n.k * 1.3;
        const t = ip(frame, [start, start + 11], [0, 1], EASE.inOut);
        if (t <= 0 || t >= 1) return null;
        const mx = (VCX + n.x) / 2 + Math.cos(n.a + Math.PI / 2) * 90;
        const my = (VCY + n.y) / 2 + Math.sin(n.a + Math.PI / 2) * 90;
        const path = `M ${VCX} ${VCY} Q ${mx} ${my} ${n.x} ${n.y}`;
        const pt = getPointAtLength(path, getLength(path) * t);
        const doc = DOCS[n.k % DOCS.length];
        return (
          <div
            key={n.k}
            style={{
              position: 'absolute',
              left: pt.x - 15,
              top: pt.y - 19,
              width: 30,
              height: 38,
              borderRadius: 5,
              background: '#10231a',
              border: `1.5px solid ${doc.c}`,
              boxShadow: `0 0 18px ${doc.c}`,
              transform: `rotate(${(1 - t) * 30}deg) scale(${0.7 + Math.sin(t * Math.PI) * 0.5})`,
            }}
          />
        );
      })}

      {/* branch nodes */}
      {nodes.map((n) => {
        const pop = spring({ frame: frame - 3 - n.k * 0.7, fps, config: { damping: 12, stiffness: 190 } });
        const arrive = 13 + n.k * 1.3 + 11;
        const done = frame >= arrive;
        const ring = ip(frame, [arrive, arrive + 12], [0, 1], EASE.out);
        return (
          <div key={n.k} style={{ position: 'absolute', left: n.x - 34, top: n.y - 34, width: 68, height: 68 }}>
            {done && (
              <div
                style={{
                  position: 'absolute',
                  inset: -ring * 30,
                  borderRadius: '50%',
                  border: `2px solid ${C.green}`,
                  opacity: 1 - ring,
                }}
              />
            )}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                transform: `scale(${pop})`,
                background: done ? 'rgba(0,223,69,0.18)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${done ? C.green : 'rgba(255,255,255,0.2)'}`,
                boxShadow: done ? `0 0 26px rgba(0,223,69,0.55)` : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {done ? (
                <svg width="30" height="30" viewBox="0 0 24 24">
                  <polyline points="4 12.5 9.5 18 20 6.5" fill="none" stroke={C.green} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <div style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.4)' }} />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                top: 76,
                left: -40,
                width: 148,
                textAlign: 'center',
                fontFamily: FONT.sans,
                fontWeight: 600,
                fontSize: 18,
                color: done ? C.white : C.dim,
                opacity: pop,
              }}
            >
              {AREAS[n.k]}
            </div>
          </div>
        );
      })}

      {/* HQ hub + fanned documents */}
      <div
        style={{
          position: 'absolute',
          left: VCX - 80,
          top: VCY - 80,
          width: 160,
          height: 160,
          borderRadius: 34,
          transform: `scale(${hub})`,
          background: 'radial-gradient(circle at 50% 35%, rgba(0,223,69,0.45), rgba(0,80,30,0.25) 60%, rgba(0,0,0,0.2))',
          border: `2px solid ${C.green}`,
          boxShadow: `0 0 60px rgba(0,223,69,${0.35 + 0.25 * Math.sin(frame * 0.4)})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.sans,
        }}
      >
        <div style={{ color: C.white, fontWeight: 900, fontSize: 34, letterSpacing: '-0.03em' }}>본사</div>
        <div style={{ color: C.green, fontFamily: FONT.mono, fontWeight: 700, fontSize: 16, letterSpacing: '0.2em' }}>HQ</div>
      </div>
      {DOCS.map((d, k) => {
        const s = spring({ frame: frame - 2 - k * 1.5, fps, config: { damping: 14, stiffness: 150 } });
        const spread = k - 2;
        const leave = ip(frame, [12 + k, 20 + k], [0, 1], EASE.in);
        return (
          <div
            key={d.t}
            style={{
              position: 'absolute',
              left: VCX - 52 + spread * 92 * s,
              top: VCY - 66 - 150 * s + Math.abs(spread) * 16 * s + leave * 120,
              transform: `rotate(${spread * 9 * s}deg) scale(${s * (1 - leave * 0.6)})`,
              opacity: 1 - leave,
            }}
          >
            <DocCard title={d.t} color={d.c} />
          </div>
        );
      })}

      {/* deploy progress */}
      <div
        style={{
          position: 'absolute',
          left: VCX - 300,
          top: VCY + RY + 92,
          width: 600,
          opacity: ip(frame, [8, 14], [0, 1]),
          fontFamily: FONT.mono,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', color: C.mute, fontSize: 18, letterSpacing: '0.12em', marginBottom: 10 }}>
          <span>DEPLOY → ALL BRANCHES</span>
          <span style={{ color: C.green, fontWeight: 700 }}>
            <RollingNumber value={progress * 128} digits={3} /> / 128
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${C.greenDeep}, ${C.green})`,
              boxShadow: `0 0 16px ${C.green}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Left column copy ---------------- */
const Chip = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 200 } });
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 999,
        border: `1px solid ${C.line}`,
        background: 'rgba(0,223,69,0.08)',
        color: C.white,
        fontFamily: FONT.sans,
        fontWeight: 600,
        fontSize: 22,
        transform: `scale(${s}) translateY(${(1 - s) * 20}px)`,
        opacity: Math.min(1, s * 1.5),
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 4, background: C.green }} />
      {label}
    </span>
  );
};

const BeatCopy = ({ copy, len }) => {
  const frame = useCurrentFrame();
  const out = ip(frame, [len - 6, len], [1, 0], EASE.in);
  return (
    <div style={{ opacity: out, filter: out < 0.95 ? `blur(${(1 - out) * 10}px)` : undefined }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 34, color: C.mute, letterSpacing: '-0.02em', marginBottom: 30 }}>
        <KineticText text={copy.sub} mode="blur" delay={6} stagger={0.7} duration={12} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', maxWidth: 680 }}>
        {copy.chips.map((c, k) => (
          <Chip key={c} label={c} delay={12 + k * 3} />
        ))}
      </div>
    </div>
  );
};

export const StandardizeScene = () => {
  const frame = useCurrentFrame();
  const beat = frame < BEATS[1] ? 0 : frame < BEATS[2] ? 1 : 2;
  const indexValue = BEATS.reduce((acc, b, k) => acc + (k === 0 ? 1 : ip(frame, [b - 2, b + 6], [0, 1], EASE.inOut)), 0);
  const divider = ip(frame, [2, 20], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={70} glowY={50} glow={0.14} />
      <GridPlane opacity={0.5} size={72} />
      <Dust count={28} seed="std-dust" opacity={0.35} />

      {/* right visual column */}
      <Sequence from={BEATS[0]} durationInFrames={BEAT_LENS[0]}>
        <InfraVisual />
      </Sequence>
      <Sequence from={BEATS[1]} durationInFrames={BEAT_LENS[1]}>
        <ClassVisual />
      </Sequence>
      <Sequence from={BEATS[2]}>
        <ContentVisual />
      </Sequence>

      {/* left fade so copy always reads */}
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(3,8,6,0.95) 0%, rgba(3,8,6,0.85) 32%, rgba(3,8,6,0) 48%)' }} />

      {/* divider */}
      <div
        style={{
          position: 'absolute',
          left: 790,
          top: 540 - 330 * divider,
          height: 660 * divider,
          width: 1,
          background: `linear-gradient(180deg, transparent, ${C.line}, transparent)`,
        }}
      />

      {/* headline column */}
      <div style={{ position: 'absolute', left: 140, top: 236, width: 660 }}>
        <ChapterPill index="01" label="표준화" delay={1} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, fontFamily: FONT.mono, fontSize: 21, letterSpacing: '0.28em', color: C.green, height: 30 }}>
          <span style={{ fontWeight: 700, fontSize: 22 }}>
            0<RollingNumber value={indexValue} digits={1} />
            <span style={{ color: C.dim }}> / 03</span>
          </span>
          <span style={{ position: 'relative' }}>
            {COPY.map((c, k) =>
              beat === k ? (
                <KineticText key={k} text={c.en} mode="scramble" delay={BEATS[k] + 2} stagger={0.5} duration={12} />
              ) : null,
            )}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT.sans,
            fontWeight: 900,
            fontSize: 172,
            lineHeight: 1.08,
            letterSpacing: '-0.055em',
            color: C.white,
            marginTop: 18,
          }}
        >
          <KineticText text="같은" mode="rise" delay={1} stagger={2.2} duration={14} />
          <div style={{ color: C.green, textShadow: '0 0 60px rgba(0,223,69,0.35)' }}>
            <WordSlot id="std" words={['인프라', '수업', '콘텐츠']} changes={[4, BEATS[1] - 3, BEATS[2] - 3]} size={172} />
          </div>
        </div>
        <div style={{ marginTop: 34, position: 'relative', height: 160 }}>
          {COPY.map((c, k) => (
            <Sequence key={k} from={BEATS[k]} durationInFrames={BEAT_LENS[k]} layout="none">
              <div style={{ position: 'absolute', inset: 0 }}>
                <BeatCopy copy={c} len={BEAT_LENS[k]} />
              </div>
            </Sequence>
          ))}
        </div>
      </div>

      {BEATS.slice(1).map((b) => (
        <React.Fragment key={b}>
          <Flash at={b - 1} duration={4} peak={0.12} color={C.greenSoft} />
          <LensStreak at={b - 1} y={540} dur={12} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
