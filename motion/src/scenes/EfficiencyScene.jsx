import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridFloor } from '../components/Background';
import { Flash, LensStreak, Shake, rgbSplit } from '../components/Fx';
import { KineticText, RollingNumber } from '../components/Kinetic';

export const EFFICIENCY_DURATION = 64;
const SLAM = 10;

// KPI values mirror the claims already on the landing page (ExpectedOutcomes / Scenarios / AdminVisibility).
const KPIS = [
  { tag: 'KPI 01', value: { text: '실시간' }, label: '전 지점 수업 모니터링' },
  { tag: 'KPI 02', value: { from: 60, to: 4, digits: 2, unit: '분' }, label: '이슈 감지 → 개입' },
  { tag: 'KPI 03', value: { from: 30, to: 1, digits: 2, unit: '일' }, label: '신규 지점 오픈 준비' },
  { tag: 'KPI 04', value: { from: 99, to: 0, digits: 2, unit: '건' }, label: '수업 데이터 손실' },
];

const CHART = (() => {
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const t = k / 40;
    const x = -40 + t * 2000;
    const y = 900 - Math.pow(t, 1.8) * 640 + Math.sin(t * 22) * 26 * (1 - t);
    pts.push(`${k === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const KpiTile = ({ kpi, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flip = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 150 } });
  const count = ip(frame, [delay + 4, delay + 26], [0, 1], EASE.out);
  const v = kpi.value;
  const glow = ip(frame, [delay + 22, delay + 26, delay + 40], [0, 1, 0.3]);

  return (
    <div
      style={{
        width: 390,
        height: 246,
        perspective: 1200,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 22,
          padding: '24px 28px',
          boxSizing: 'border-box',
          background: 'linear-gradient(160deg, rgba(18,40,28,0.92), rgba(6,16,11,0.92))',
          border: `1px solid rgba(0,223,69,${0.18 + glow * 0.5})`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${50 * glow}px rgba(0,223,69,${0.35 * glow})`,
          transform: `rotateX(${(1 - flip) * -95}deg)`,
          transformOrigin: '50% 100%',
          opacity: ip(frame, [delay, delay + 4], [0, 1]),
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT.sans,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.24em', color: C.dim }}>
          <span>{kpi.tag}</span>
          <span style={{ color: C.green }}>● LIVE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', color: C.white, fontWeight: 900, letterSpacing: '-0.04em' }}>
          {v.text ? (
            <span style={{ fontSize: 92, lineHeight: 1, color: C.green }}>
              <KineticText text={v.text} mode="scramble" delay={delay + 4} stagger={2} duration={14} />
            </span>
          ) : (
            <>
              <span style={{ fontSize: 108, lineHeight: 1, fontFamily: FONT.mono, fontWeight: 700 }}>
                <RollingNumber value={v.from + (v.to - v.from) * count} digits={v.digits} leadingZeros="hide" />
              </span>
              <span style={{ fontSize: 54, lineHeight: 1, marginLeft: 6, marginBottom: 8, color: C.green }}>{v.unit}</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 14, color: C.mute, fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em' }}>{kpi.label}</div>
        <div style={{ height: 3, marginTop: 14, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${count * 100}%`, height: '100%', background: C.green, boxShadow: `0 0 10px ${C.green}` }} />
        </div>
      </div>
    </div>
  );
};

export const EfficiencyScene = () => {
  const frame = useCurrentFrame();
  const chart = evolvePath(ip(frame, [0, 34], [0, 1], EASE.inOut), CHART);
  const split = ip(frame, [SLAM, SLAM + 12], [14, 0], EASE.out) * (frame >= SLAM ? 1 : 0);
  const push = ip(frame, [0, EFFICIENCY_DURATION], [1.04, 1], EASE.smooth);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={30} glowY={30} glow={0.16} />
      <GridFloor opacity={0.45} speed={7} top={56} />
      <Dust count={26} seed="eff-dust" opacity={0.4} speed={1.5} />

      {/* rising efficiency curve */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        <defs>
          <linearGradient id="effArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.green} stopOpacity="0.28" />
            <stop offset="1" stopColor={C.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${CHART} L 1960 1080 L -40 1080 Z`} fill="url(#effArea)" opacity={ip(frame, [14, 34], [0, 1])} />
        <path
          d={CHART}
          fill="none"
          stroke={C.greenSoft}
          strokeWidth={4}
          strokeDasharray={chart.strokeDasharray}
          strokeDashoffset={chart.strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 12px ${C.green})` }}
        />
      </svg>

      <Shake events={[{ at: SLAM, amp: 14, dur: 12 }]}>
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <div style={{ position: 'absolute', left: 140, top: 150 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 21, letterSpacing: '0.3em', color: C.green, marginBottom: 18 }}>
              <KineticText text="EFFICIENCY, AUTOMATED" mode="scramble" delay={0} stagger={0.5} duration={10} />
            </div>
            <div style={{ fontFamily: FONT.sans, fontSize: 124, lineHeight: 1.08, letterSpacing: '-0.05em', color: C.white }}>
              <div style={{ fontWeight: 800 }}>
                <KineticText text="관리는 AI가," mode="rise" delay={1} stagger={1.5} duration={12} charColor={(i) => (i === 4 || i === 5 ? C.green : undefined)} />
              </div>
              <div style={{ fontWeight: 900, textShadow: rgbSplit(split) }}>
                <KineticText text="본사는 결정만." mode="slam" delay={SLAM} stagger={1.2} />
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              right: 140,
              top: 250,
              width: 560,
              fontFamily: FONT.sans,
              fontWeight: 500,
              fontSize: 30,
              lineHeight: 1.5,
              color: C.mute,
              letterSpacing: '-0.02em',
              textAlign: 'right',
            }}
          >
            <KineticText text="AI가 전 지점 수업을 실시간 분석하고," mode="blur" delay={14} stagger={0.5} duration={10} />
            <br />
            <KineticText text="본사는 리포트로 판단합니다." mode="blur" delay={19} stagger={0.5} duration={10} />
          </div>

          <div style={{ position: 'absolute', left: 140, top: 640, display: 'flex', gap: 20 }}>
            {KPIS.map((k, i) => (
              <KpiTile key={k.tag} kpi={k} delay={16 + i * 4} />
            ))}
          </div>
        </AbsoluteFill>
      </Shake>

      <LensStreak at={SLAM} y={420} dur={14} />
      <Flash at={SLAM} duration={4} peak={0.12} color={C.greenSoft} />
    </AbsoluteFill>
  );
};
