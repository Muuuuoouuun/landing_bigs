import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { evolvePath } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridPlane } from '../components/Background';
import { Brackets, Flash } from '../components/Fx';
import { KineticText, RollingNumber, Typewriter } from '../components/Kinetic';

export const AI_EVAL_DURATION = 80;

const PANEL = { x: 820, y: 150, w: 980, h: 780 };
const RADAR = { cx: 1060, cy: 486, r: 170 };
const AXES = ['전달력', '상호작용', '질문 유도', '진도 준수', '시간 관리', '학생 참여'];
const VALUES = [0.92, 0.86, 0.95, 0.9, 0.84, 0.93];
const FEATURES = ['AI 수업 요약', 'AI 강의평가', 'AI 학습 리포트', 'AI 참여도 분석', 'AI 이상 감지', 'AI 출결 관리'];
const COMPLETE = 60;

const polar = (k, r) => {
  const a = (k / AXES.length) * Math.PI * 2 - Math.PI / 2;
  return [RADAR.cx + Math.cos(a) * r, RADAR.cy + Math.sin(a) * r];
};
const ring = (r) => `${AXES.map((_, k) => `${k === 0 ? 'M' : 'L'} ${polar(k, r).join(' ')}`).join(' ')} Z`;

const Radar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: frame - 16, fps, config: { damping: 12, stiffness: 90, mass: 0.8 } });
  const breathe = 1 + Math.sin(frame * 0.25) * 0.012 * ip(frame, [40, 50], [0, 1]);
  const data = `${VALUES.map((v, k) => `${k === 0 ? 'M' : 'L'} ${polar(k, RADAR.r * v * grow * breathe).join(' ')}`).join(' ')} Z`;
  const sweep = frame * 9;

  return (
    <>
      {/* rotating radar sweep */}
      <div
        style={{
          position: 'absolute',
          left: RADAR.cx - RADAR.r - 10,
          top: RADAR.cy - RADAR.r - 10,
          width: (RADAR.r + 10) * 2,
          height: (RADAR.r + 10) * 2,
          borderRadius: '50%',
          background: `conic-gradient(from ${sweep}deg, rgba(0,223,69,0.32) 0deg, rgba(0,223,69,0) 70deg, rgba(0,223,69,0) 360deg)`,
          opacity: ip(frame, [6, 14], [0, 1]) * ip(frame, [COMPLETE - 6, COMPLETE + 4], [1, 0.25]),
        }}
      />
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <radialGradient id="radarFill" cx={RADAR.cx} cy={RADAR.cy} r={RADAR.r} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.green} stopOpacity="0.05" />
            <stop offset="1" stopColor={C.green} stopOpacity="0.45" />
          </radialGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f, k) => {
          const ev = evolvePath(ip(frame, [5 + k * 2, 15 + k * 2], [0, 1], EASE.inOut), ring(RADAR.r * f));
          return (
            <path
              key={f}
              d={ring(RADAR.r * f)}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth={1.2}
              strokeDasharray={ev.strokeDasharray}
              strokeDashoffset={ev.strokeDashoffset}
            />
          );
        })}
        {AXES.map((_, k) => {
          const p = ip(frame, [8 + k, 16 + k], [0, 1]);
          const [x, y] = polar(k, RADAR.r * p);
          return <line key={k} x1={RADAR.cx} y1={RADAR.cy} x2={x} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />;
        })}
        <path d={data} fill="url(#radarFill)" stroke={C.greenSoft} strokeWidth={3} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${C.green})` }} />
        {VALUES.map((v, k) => {
          const [x, y] = polar(k, RADAR.r * v * grow * breathe);
          const pop = spring({ frame: frame - 24 - k * 2, fps, config: { damping: 9, stiffness: 220 } });
          return <circle key={k} cx={x} cy={y} r={6.5 * pop} fill="#fff" stroke={C.green} strokeWidth={3} />;
        })}
      </svg>
      {AXES.map((label, k) => {
        const [x, y] = polar(k, RADAR.r + 44);
        const o = ip(frame, [14 + k, 22 + k], [0, 1]);
        const score = Math.round(VALUES[k] * 100 * ip(frame, [18, 44], [0, 1], EASE.out));
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: x - 70,
              top: y - 22,
              width: 140,
              textAlign: 'center',
              opacity: o,
              fontFamily: FONT.sans,
            }}
          >
            <div style={{ color: C.white, fontWeight: 700, fontSize: 19 }}>{label}</div>
            <div style={{ color: C.green, fontFamily: FONT.mono, fontWeight: 700, fontSize: 15 }}>{score}</div>
          </div>
        );
      })}
    </>
  );
};

const MetricRow = ({ label, value, bar, delay, accent = C.green, split }) => {
  const frame = useCurrentFrame();
  const p = ip(frame, [delay, delay + 18], [0, 1], EASE.out);
  return (
    <div style={{ opacity: ip(frame, [delay - 4, delay + 2], [0, 1]), marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT.sans, marginBottom: 9 }}>
        <span style={{ color: C.mute, fontWeight: 600, fontSize: 19 }}>{label}</span>
        <span style={{ color: C.white, fontFamily: FONT.mono, fontWeight: 700, fontSize: 21 }}>{value(p)}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex' }}>
        {split ? (
          <>
            <div style={{ width: `${split[0] * p}%`, background: C.green, boxShadow: `0 0 12px ${C.green}` }} />
            <div style={{ width: `${split[1] * p}%`, background: C.gold, marginLeft: 3 }} />
          </>
        ) : (
          <div style={{ width: `${bar * p}%`, background: `linear-gradient(90deg, ${C.greenDeep}, ${accent})`, boxShadow: `0 0 12px ${accent}` }} />
        )}
      </div>
    </div>
  );
};

const Waveform = ({ x, y, w, h, bars = 56 }) => {
  const frame = useCurrentFrame();
  const o = ip(frame, [30, 38], [0, 1]);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, display: 'flex', alignItems: 'center', gap: 3, opacity: o }}>
      {Array.from({ length: bars }).map((_, k) => {
        const env = 0.35 + 0.65 * Math.abs(noise2D('env', frame * 0.06, k * 0.08));
        const v = Math.abs(noise2D('wave', frame * 0.35, k * 0.35)) * env;
        const teacher = noise2D('spk', Math.floor((frame + k * 0.4) / 9), 0) > -0.2;
        return (
          <div
            key={k}
            style={{
              flex: 1,
              height: `${Math.max(6, v * 100)}%`,
              borderRadius: 2,
              background: teacher ? C.green : C.gold,
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
};

const FeatureWheel = ({ x, y }) => {
  const frame = useCurrentFrame();
  const n = FEATURES.length;
  const active = [0, 1, 2, 3, 4].reduce((acc, k) => acc + ip(frame, [16 + k * 13, 22 + k * 13], [0, 1], EASE.inOut), 1);
  const appear = ip(frame, [8, 18], [0, 1], EASE.out);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 600, height: 300, perspective: 900, perspectiveOrigin: '40px 150px', opacity: appear }}>
      <div style={{ position: 'absolute', left: 0, top: 128, width: 5, height: 46, background: C.green, boxShadow: `0 0 16px ${C.green}` }} />
      {FEATURES.map((f, i) => {
        let d = (((i - active) % n) + n) % n;
        if (d > n / 2) d -= n;
        const theta = d * 34;
        const rad = (theta * Math.PI) / 180;
        const vis = Math.cos(rad);
        if (vis <= 0.05) return null;
        const isActive = Math.abs(d) < 0.5;
        return (
          <div
            key={f}
            style={{
              position: 'absolute',
              left: 30,
              top: 124 + Math.sin(rad) * 140,
              transform: `rotateX(${-theta}deg) scale(${0.72 + 0.28 * vis})`,
              transformOrigin: '0% 50%',
              opacity: Math.pow(vis, 2.2),
              fontFamily: FONT.sans,
              fontWeight: isActive ? 800 : 600,
              fontSize: 46,
              letterSpacing: '-0.03em',
              color: isActive ? C.green : C.white,
              whiteSpace: 'nowrap',
              textShadow: isActive ? '0 0 30px rgba(0,223,69,0.45)' : undefined,
            }}
          >
            {f}
          </div>
        );
      })}
    </div>
  );
};

export const AIEvalScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panelIn = ip(frame, [0, 14], [0, 1], EASE.out);
  const scanY = PANEL.y + 70 + ((frame * 16) % (PANEL.h - 80));
  const scanOn = frame < COMPLETE ? 1 : ip(frame, [COMPLETE, COMPLETE + 6], [1, 0]);
  const score = ip(frame, [18, 54], [0, 94], EASE.out);
  const grade = spring({ frame: frame - 56, fps, config: { damping: 8, stiffness: 200 } });
  const complete = frame >= COMPLETE;
  const blink = Math.floor(frame / 5) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={66} glowY={50} glow={0.18} />
      <GridPlane opacity={0.55} size={64} drift={0.8} />
      <Dust count={24} seed="eval-dust" opacity={0.35} />

      {/* ---- left column ---- */}
      <div style={{ position: 'absolute', left: 120, top: 168, width: 660 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 21, letterSpacing: '0.3em', color: C.green, marginBottom: 16 }}>
          <KineticText text="AI LECTURE EVALUATION" mode="scramble" delay={0} stagger={0.5} duration={12} />
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 132, lineHeight: 1.05, letterSpacing: '-0.055em', color: C.white }}>
          <KineticText text="AI 강의평가" mode="slam" delay={2} stagger={1.4} charColor={(i) => (i < 2 ? C.green : undefined)} />
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 500, fontSize: 31, lineHeight: 1.45, color: C.mute, marginTop: 22, letterSpacing: '-0.02em' }}>
          <KineticText text="모든 강의를 같은 기준으로" mode="blur" delay={12} stagger={0.6} duration={10} />
          <br />
          <KineticText text="자동 분석하고 리포트합니다." mode="blur" delay={18} stagger={0.6} duration={10} />
        </div>
      </div>
      <FeatureWheel x={120} y={560} />

      {/* ---- right analysis panel ---- */}
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 26,
          background: C.panel,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 50px 140px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          opacity: panelIn,
          transform: `perspective(1800px) rotateY(${(1 - panelIn) * -18}deg) translateX(${(1 - panelIn) * 120}px)`,
          overflow: 'hidden',
        }}
      >
        {/* header */}
        <div
          style={{
            height: 66,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 28px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: FONT.sans,
          }}
        >
          <span style={{ color: C.white, fontWeight: 800, fontSize: 22 }}>AI 강의 리포트</span>
          <span style={{ color: C.dim, fontSize: 18 }}>고2 수학 · 심화반 · 강남</span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.18em',
              padding: '7px 14px',
              borderRadius: 8,
              color: complete ? '#04130b' : C.gold,
              background: complete ? C.green : 'rgba(230,184,0,0.12)',
              border: `1px solid ${complete ? C.green : 'rgba(230,184,0,0.5)'}`,
              opacity: complete || blink ? 1 : 0.55,
              boxShadow: complete ? `0 0 24px ${C.green}` : undefined,
            }}
          >
            {complete ? '● ANALYSIS COMPLETE' : '◌ ANALYZING'}
          </span>
        </div>

        {/* summary strip */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            right: 28,
            bottom: 26,
            height: 92,
            borderRadius: 14,
            border: '1px solid rgba(0,223,69,0.25)',
            background: 'rgba(0,223,69,0.06)',
            padding: '14px 20px',
            fontFamily: FONT.sans,
            fontSize: 21,
            lineHeight: 1.5,
            color: C.white,
            opacity: ip(frame, [36, 42], [0, 1]),
          }}
        >
          <span style={{ color: C.green, fontWeight: 800, marginRight: 10 }}>AI 요약 ▸</span>
          <Typewriter
            text="이차함수 꼭짓점 개념 설명 → 예제 3문항 → 질의응답 활발. 개선 제안: 학생 발화 비중 확대"
            delay={38}
            cps={1.8}
            cursorColor={C.green}
          />
        </div>
      </div>

      {/* panel content positioned in frame space */}
      <AbsoluteFill style={{ opacity: panelIn }}>
        <Radar />

        <div style={{ position: 'absolute', left: 1340, top: 236, width: 420 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 16, letterSpacing: '0.28em', color: C.mute, opacity: ip(frame, [12, 18], [0, 1]) }}>
            OVERALL SCORE · 종합
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 6, opacity: ip(frame, [14, 20], [0, 1]) }}>
            <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.white, letterSpacing: '-0.04em' }}>
              <RollingNumber value={score} digits={2} leadingZeros="dim" />
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 30, color: C.dim, marginBottom: 14 }}>/100</span>
            <span
              style={{
                marginLeft: 'auto',
                marginBottom: 18,
                width: 92,
                height: 92,
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT.sans,
                fontWeight: 900,
                fontSize: 48,
                color: '#1a1300',
                background: `linear-gradient(145deg, #ffe680, ${C.gold})`,
                boxShadow: `0 0 ${40 * grade}px rgba(230,184,0,0.7)`,
                transform: `scale(${grade}) rotate(${(1 - grade) * -40}deg)`,
              }}
            >
              A+
            </span>
          </div>
          <div style={{ marginTop: 26 }}>
            <MetricRow label="발화 비율  강사 58 : 학생 42" value={(p) => `${Math.round(58 * p)} : ${Math.round(42 * p)}`} split={[58, 42]} delay={26} />
            <MetricRow label="질문 유도" value={(p) => `${Math.round(37 * p)}회`} bar={74} delay={30} />
            <MetricRow label="학생 참여도" value={(p) => `${Math.round(92 * p)}%`} bar={92} delay={34} />
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.26em', color: C.dim, marginTop: 6, opacity: ip(frame, [30, 38], [0, 1]) }}>
            VOICE ANALYSIS
          </div>
        </div>
        <Waveform x={1340} y={720} w={420} h={64} />

        {/* scan beam */}
        <div
          style={{
            position: 'absolute',
            left: PANEL.x + 8,
            width: PANEL.w - 16,
            top: scanY,
            height: 2,
            opacity: scanOn * ip(frame, [6, 10], [0, 1]),
            background: `linear-gradient(90deg, transparent, ${C.greenSoft}, transparent)`,
            boxShadow: `0 0 18px 4px rgba(0,223,69,0.5)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: PANEL.x + 8,
            width: PANEL.w - 16,
            top: scanY - 80,
            height: 80,
            opacity: scanOn * 0.5 * ip(frame, [6, 10], [0, 1]),
            background: 'linear-gradient(180deg, transparent, rgba(0,223,69,0.16))',
          }}
        />
        <Brackets x={PANEL.x - 14} y={PANEL.y - 14} w={PANEL.w + 28} h={PANEL.h + 28} len={34} opacity={ip(frame, [4, 12], [0, 0.9])} />
      </AbsoluteFill>

      <Flash at={COMPLETE} duration={6} peak={0.18} color={C.green} />
    </AbsoluteFill>
  );
};
