import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath, getPointAtLength, getLength } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridPlane } from '../components/Background';
import { Flash, LensStreak } from '../components/Fx';
import { KineticText, RollingNumber, WordSlot } from '../components/Kinetic';
import { ClassroomWindow } from '../components/ClassroomWindow';

export const STANDARDIZE_DURATION = 140;
// Beat changes land on the music grid (one beat = 14 frames).
const BEATS = [0, 56, 98];
const BEAT_LENS = [56, 42, 42];
const VCX = 1340; // visual column center
const VCY = 540;

const COPY = [
  {
    en: 'STANDARDIZED CLASS',
    sub: '어느 지점, 어느 강사든 같은 수업 품질',
    chips: ['수업 템플릿', '실시간 판서', '녹화 · 다시보기'],
  },
  {
    en: 'STANDARDIZED CONTENT',
    sub: '본사 커리큘럼을 전 지점에 원클릭 배포',
    chips: ['교재', '진도표', '평가지 · 과제'],
  },
  {
    en: 'STANDARDIZED MANAGEMENT',
    sub: '권한 · 출결 · 과제 · 평가를 하나의 체계로',
    chips: ['직급별 권한', '지점 통계', '중앙 관제'],
  },
];

const AREAS = ['강남', '분당', '대치', '목동', '송도', '일산', '해운대', '수성', '둔산', '광교', '평촌', '중계'];

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

/* ---------------- Beat C — one management hierarchy ---------------- */
const TREE = (() => {
  const hq = { x: VCX, y: 230, w: 260, h: 74, t: '본사 최고관리자', s: 'HQ ADMIN' };
  const branches = [-1, 0, 1].map((d, k) => ({ x: VCX + d * 310, y: 420, w: 200, h: 64, t: `지점 원장 ${'ABC'[k]}`, s: 'BRANCH' }));
  const teachers = [];
  branches.forEach((b) => [-1, 1].forEach((d) => teachers.push({ x: b.x + d * 76, y: 590, w: 132, h: 56, t: '강사', s: 'TEACHER' })));
  const elbow = (a, b) => `M ${a.x} ${a.y + a.h / 2} L ${a.x} ${(a.y + b.y) / 2} L ${b.x} ${(a.y + b.y) / 2} L ${b.x} ${b.y - b.h / 2}`;
  const links1 = branches.map((b) => elbow(hq, b));
  const links2 = teachers.map((t, k) => elbow(branches[Math.floor(k / 2)], t));
  return { hq, branches, teachers, links1, links2 };
})();

const PERMS = ['전사 통계', '커리큘럼 배포', '강사 배정', '출결·과제·평가'];

const OrgNode = ({ n, pop, accent }) => (
  <div
    style={{
      position: 'absolute',
      left: n.x - n.w / 2,
      top: n.y - n.h / 2,
      width: n.w,
      height: n.h,
      borderRadius: 14,
      transform: `scale(${pop})`,
      background: accent ? 'rgba(0,223,69,0.16)' : 'rgba(255,255,255,0.045)',
      border: `1.5px solid ${accent ? C.green : 'rgba(0,223,69,0.45)'}`,
      boxShadow: accent ? '0 0 40px rgba(0,223,69,0.35)' : undefined,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT.sans,
    }}
  >
    <div style={{ color: C.white, fontWeight: 800, fontSize: n.h > 60 ? 24 : 19, letterSpacing: '-0.02em' }}>{n.t}</div>
    <div style={{ color: C.green, fontFamily: FONT.mono, fontSize: 11, letterSpacing: '0.24em', marginTop: 2 }}>{n.s}</div>
  </div>
);

const ManageVisual = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (d) => spring({ frame: frame - d, fps, config: { damping: 12, stiffness: 190 } });
  const l1 = ip(frame, [4, 14], [0, 1], EASE.inOut);
  const l2 = ip(frame, [12, 22], [0, 1], EASE.inOut);
  const enter = ip(frame, [0, 10], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ opacity: enter, transform: `translateY(${(1 - enter) * 60}px)` }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {[...TREE.links1.map((d) => [d, l1]), ...TREE.links2.map((d) => [d, l2])].map(([d, p], k) => {
          const ev = evolvePath(p, d);
          return (
            <path
              key={k}
              d={d}
              fill="none"
              stroke={C.green}
              strokeOpacity={0.6}
              strokeWidth={2}
              strokeDasharray={ev.strokeDasharray}
              strokeDashoffset={ev.strokeDashoffset}
            />
          );
        })}
        {/* sync pulses travelling down the hierarchy */}
        {TREE.links2.map((d2, k) => {
          const t = ip(frame, [24 + (k % 3) * 2, 38 + (k % 3) * 2], [0, 1], EASE.smooth);
          if (t <= 0 || t >= 1) return null;
          const d1 = TREE.links1[Math.floor(k / 2)];
          const full = `${d1} ${d2.replace('M', 'L')}`;
          const pt = getPointAtLength(full, getLength(full) * t);
          return <circle key={k} cx={pt.x} cy={pt.y} r={6} fill={C.greenSoft} style={{ filter: `drop-shadow(0 0 8px ${C.green})` }} />;
        })}
      </svg>

      <OrgNode n={TREE.hq} pop={pop(0)} accent />
      {TREE.branches.map((b, k) => (
        <OrgNode key={k} n={b} pop={pop(11 + k)} />
      ))}
      {TREE.teachers.map((t, k) => (
        <OrgNode key={k} n={t} pop={pop(19 + k * 0.8)} />
      ))}

      {/* permission toggles */}
      <div style={{ position: 'absolute', left: VCX - 460, top: 712, width: 920, display: 'flex', gap: 16 }}>
        {PERMS.map((p, k) => {
          const on = ip(frame, [24 + k * 3, 29 + k * 3], [0, 1], EASE.inOut);
          const appear = pop(18 + k * 2);
          return (
            <div
              key={p}
              style={{
                flex: 1,
                height: 64,
                borderRadius: 14,
                transform: `scale(${appear})`,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,${0.1 + on * 0.15})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                fontFamily: FONT.sans,
                fontWeight: 700,
                fontSize: 18,
                color: C.white,
              }}
            >
              {p}
              <div
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: on > 0.5 ? C.green : 'rgba(255,255,255,0.18)',
                  boxShadow: on > 0.5 ? `0 0 14px ${C.green}` : undefined,
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3 + on * 22,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#fff',
                  }}
                />
              </div>
            </div>
          );
        })}
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
        <ClassVisual />
      </Sequence>
      <Sequence from={BEATS[1]} durationInFrames={BEAT_LENS[1]}>
        <ContentVisual />
      </Sequence>
      <Sequence from={BEATS[2]}>
        <ManageVisual />
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
          <KineticText text="표준화" mode="rise" delay={1} stagger={2.2} duration={14} />
          <div style={{ color: C.green, textShadow: '0 0 60px rgba(0,223,69,0.35)' }}>
            <WordSlot id="std" words={['수업', '콘텐츠', '관리']} changes={[4, BEATS[1] - 3, BEATS[2] - 3]} size={172} />
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
