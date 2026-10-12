import React from 'react';
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { C, EASE, ip } from '../theme';
import { FONT } from '../fonts';
import { BaseBackground, Dust, GridPlane } from '../components/Background';
import { Flash, LensStreak, Shockwave } from '../components/Fx';
import { KineticText, RollingNumber } from '../components/Kinetic';
import { ChapterPill } from '../components/ChapterPill';

/*
 * ② 관리 — a 2×2 control board. Each pillar lights for two beats
 * (데이터 보안 → 녹화 강의 → 클라우드 권한 설정 → 상세 수업 데이터 축적),
 * then all four light together and converge into the data core that the AI scene grows from.
 * Content runs 140 frames (global 240–380); the extra 8 frames are the outgoing cross-fade.
 */
export const MANAGE_DURATION = 148;
const STEP = 28; // two beats per pillar
const ALL = 112;
const END = 140;

const PANEL_W = 440;
const PANEL_H = 320;
const GAP = 26;
const GRID = { x: 1340, y: 560 };
const CORE_END = { x: 960, y: 520 };

const PILLARS = [
  { title: '데이터 보안', en: 'DATA SECURITY', idle: 'STANDBY', active: 'ENCRYPTING', done: 'SECURED' },
  { title: '녹화 강의', en: 'RECORDED CLASSES', idle: 'STANDBY', active: '● REC', done: 'SAVED' },
  { title: '클라우드 권한 설정', en: 'CLOUD PERMISSIONS', idle: 'STANDBY', active: 'APPLYING', done: 'SYNCED' },
  { title: '상세 수업 데이터 축적', en: 'CLASS DATA', idle: 'STANDBY', active: 'COLLECTING', done: 'LIVE' },
];

const HEX = '0123456789ABCDEF';
const cipher = (plain, hex, t, start, dur, seed) => {
  if (t < start) return plain;
  const resolved = Math.floor(ip(t, [start, start + dur], [0, hex.length], EASE.linear));
  return Array.from(hex)
    .map((ch, i) => (i < resolved || ch === ' ' ? ch : HEX[Math.floor(random(`${seed}-${i}-${Math.floor(t / 2)}`) * 16)]))
    .join('');
};

const MiniLock = ({ color = C.green, size = 12 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 12 14" style={{ flexShrink: 0 }}>
    <path d="M 3.5 6 V 4.2 A 2.5 2.5 0 0 1 8.5 4.2 V 6" fill="none" stroke={color} strokeWidth={1.6} />
    <rect x={1.5} y={6} width={9} height={7} rx={1.6} fill={color} />
  </svg>
);

const PanelIcon = ({ kind, color }) => {
  const p = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      {kind === 0 && <path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z M9 12 L11 14 L15 10" {...p} />}
      {kind === 1 && (
        <>
          <rect x="3" y="6" width="13" height="12" rx="2" {...p} />
          <path d="M16 10 L21 7 V17 L16 14" {...p} />
          <circle cx="9.5" cy="12" r="2.2" fill={color} />
        </>
      )}
      {kind === 2 && (
        <>
          <path d="M7 17 H17 A4 4 0 0 0 17.5 9 A6 6 0 0 0 6.5 8.5 A4.3 4.3 0 0 0 7 17 Z" {...p} />
          <circle cx="11" cy="13" r="1.6" fill={color} />
          <path d="M12.5 13 H15.5 M14.5 13 V14.8" {...p} />
        </>
      )}
      {kind === 3 && (
        <>
          <ellipse cx="12" cy="6" rx="7" ry="2.6" {...p} />
          <path d="M5 6 V18 C5 19.4 8.1 20.6 12 20.6 C15.9 20.6 19 19.4 19 18 V6 M5 12 C5 13.4 8.1 14.6 12 14.6 C15.9 14.6 19 13.4 19 12" {...p} />
        </>
      )}
    </svg>
  );
};

/* ---------- panel bodies (t = frames since this pillar lit; negative = not yet) ---------- */
const SecurityBody = ({ t }) => {
  const close = ip(t, [3, 9], [0, 1], EASE.back);
  const shackle = (1 - close) * -16;
  const ring = t >= 9 ? ((t - 9) % 20) / 20 : 0;
  const rows = [
    ['출결 기록', '10/12 출석 24명', '9F3A C21E 77B0'],
    ['수업 영상', 'class_0412.mp4', 'E04D 8A19 3C6F'],
    ['성적 데이터', '중간평가 87점', '51B7 D2E8 0A94'],
  ];
  return (
    <div style={{ display: 'flex', gap: 18, height: '100%' }}>
      <div style={{ width: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {t >= 9 && <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, border: `2px solid ${C.green}`, opacity: 1 - ring, transform: `scale(${0.7 + ring * 0.6})` }} />}
        <svg width="104" height="124" viewBox="0 0 120 140" style={{ filter: t >= 9 ? 'drop-shadow(0 0 14px rgba(0,223,69,0.6))' : undefined }}>
          <defs>
            <linearGradient id="lock-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={t >= 9 ? '#1f8f52' : '#2a3a31'} />
              <stop offset="1" stopColor={t >= 9 ? '#0b4a2a' : '#162019'} />
            </linearGradient>
          </defs>
          <path
            d="M 32 62 V 40 A 28 28 0 0 1 88 40 V 62"
            fill="none"
            stroke={t >= 9 ? C.greenSoft : 'rgba(255,255,255,0.55)'}
            strokeWidth={12}
            strokeLinecap="round"
            transform={`translate(0 ${shackle})`}
          />
          <rect x={14} y={58} width={92} height={74} rx={14} fill="url(#lock-body)" stroke={t >= 9 ? C.green : 'rgba(255,255,255,0.3)'} strokeWidth={2} />
          <circle cx={60} cy={89} r={9} fill="#04130b" />
          <rect x={56} y={92} width={8} height={20} rx={3} fill="#04130b" />
        </svg>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map(([label, plain, hex], i) => {
            const encrypted = t >= 4 + i * 3 + 9;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 82, fontFamily: FONT.sans, fontWeight: 600, fontSize: 15, color: C.mute }}>{label}</span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: FONT.mono,
                    fontWeight: 700,
                    fontSize: 15,
                    color: t >= 4 + i * 3 ? C.greenSoft : 'rgba(255,255,255,0.75)',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {cipher(plain, hex, t, 4 + i * 3, 9, `sec-${i}`)}
                </span>
                <span style={{ opacity: encrypted ? 1 : 0.15 }}>
                  <MiniLock />
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 13, lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
          <div style={{ opacity: ip(t, [12, 15], [0, 1]), color: C.mute }}>
            08:31 강남 원장 <span style={{ color: C.green, fontWeight: 700 }}>✓ 열람 허용</span>
          </div>
          <div style={{ opacity: ip(t, [16, 19], [0, 1]), color: C.mute }}>
            08:32 미등록 기기 <span style={{ color: '#ff6b6b', fontWeight: 700, textShadow: t >= 16 && t < 22 && Math.floor(t) % 2 === 0 ? '0 0 10px #ff6b6b' : undefined }}>✕ 접근 차단</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CHAPTERS = ['도입', '개념', '예제', '질의응답'];
const RecordingBody = ({ t }) => {
  const saved = t >= 8;
  const rec = Math.max(0, Math.min(1, t / 8));
  const head = saved ? ((t - 8) / 40) % 1 : 0;
  const blink = Math.floor(t / 4) % 2 === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ position: 'relative', height: 120, borderRadius: 10, overflow: 'hidden', background: '#0c241a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <svg viewBox="0 0 400 120" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <line x1={40} y1={92} x2={370} y2={92} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          <line x1={110} y1={14} x2={110} y2={110} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          <path d="M 70 20 Q 170 170 270 20" fill="none" stroke={C.greenSoft} strokeWidth={3} strokeLinecap="round" />
          <circle cx={170} cy={95} r={5} fill={C.gold} />
          <text x={292} y={40} fill="rgba(255,255,255,0.8)" fontSize={15} fontFamily={FONT.sans} fontWeight={600}>
            y = x² − 4x + 3
          </text>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 9,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 9px',
            borderRadius: 6,
            fontFamily: FONT.mono,
            fontSize: 12,
            fontWeight: 700,
            color: saved ? '#04130b' : '#fff',
            background: saved ? C.green : 'rgba(255,60,60,0.85)',
            opacity: t < 0 ? 0.5 : 1,
          }}
        >
          {saved ? '✓ 자동 저장 완료' : <>{t >= 0 && blink ? '●' : '○'} REC 00:48:12</>}
        </div>
        {saved && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 46,
              height: 46,
              marginLeft: -23,
              marginTop: -23,
              borderRadius: 23,
              background: 'rgba(0,0,0,0.55)',
              border: `2px solid ${C.green}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${ip(t, [8, 12], [0.4, 1], EASE.back)})`,
            }}
          >
            <svg width="16" height="18" viewBox="0 0 16 18">
              <path d="M2 1 L15 9 L2 17 Z" fill={C.white} />
            </svg>
          </div>
        )}
      </div>
      {/* chapter scrubber */}
      <div>
        <div style={{ position: 'relative', display: 'flex', gap: 4, height: 7 }}>
          {CHAPTERS.map((c, i) => {
            const segFill = Math.max(0, Math.min(1, rec * 4 - i));
            return (
              <div key={c} style={{ flex: 1, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                <div style={{ width: `${segFill * 100}%`, height: '100%', background: saved ? C.green : '#ff5a5a' }} />
              </div>
            );
          })}
          {saved && <div style={{ position: 'absolute', top: -4, left: `${head * 100}%`, width: 3, height: 15, borderRadius: 2, background: '#fff', boxShadow: '0 0 8px #fff' }} />}
        </div>
        <div style={{ display: 'flex', marginTop: 5 }}>
          {CHAPTERS.map((c) => (
            <span key={c} style={{ flex: 1, fontFamily: FONT.sans, fontSize: 12.5, fontWeight: 600, color: C.mute }}>
              {c}
            </span>
          ))}
        </div>
      </div>
      {/* replay library */}
      <div style={{ display: 'flex', gap: 10 }}>
        {['3차시 · 오늘', '2차시', '1차시'].map((label, i) => {
          const slide = ip(t, [10 + i * 3, 16 + i * 3], [0, 1], EASE.out);
          return (
            <div
              key={label}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(140deg, #14402a, #0a2116)',
                border: `1px solid ${i === 0 ? C.green : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 9px',
                transform: `translateX(${(1 - slide) * 120}px)`,
                opacity: slide,
              }}
            >
              <svg width="11" height="12" viewBox="0 0 16 18">
                <path d="M2 1 L15 9 L2 17 Z" fill={C.green} />
              </svg>
              <span style={{ fontFamily: FONT.sans, fontSize: 13, fontWeight: 700, color: C.white, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ROLES = ['본사', '원장', '강사', '조교'];
const RIGHTS = ['열람', '편집', '배포', '통계'];
const MATRIX = [
  [1, 1, 1, 1],
  [1, 1, 0, 1],
  [1, 1, 0, 0],
  [1, 0, 0, 0],
];
const PermissionBody = ({ t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.mono, fontSize: 13, color: C.mute }}>
      <svg width="20" height="14" viewBox="0 0 24 16">
        <path d="M6 15 H18 A4.5 4.5 0 0 0 18.5 6 A6.5 6.5 0 0 0 6.2 5.5 A4.8 4.8 0 0 0 6 15 Z" fill="none" stroke={C.green} strokeWidth={1.8} />
      </svg>
      ClassIn 드라이브 / 본사 / <span style={{ color: C.white, fontWeight: 700 }}>2026 커리큘럼</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(4, 1fr)', rowGap: 8, columnGap: 8, alignItems: 'center' }}>
      <span />
      {RIGHTS.map((r) => (
        <span key={r} style={{ textAlign: 'center', fontFamily: FONT.sans, fontSize: 13.5, fontWeight: 700, color: C.mute }}>
          {r}
        </span>
      ))}
      {ROLES.map((role, ri) => (
        <React.Fragment key={role}>
          <span style={{ fontFamily: FONT.sans, fontSize: 16, fontWeight: 800, color: C.white }}>{role}</span>
          {MATRIX[ri].map((on, ci) => {
            const at = 2 + (ri + ci) * 1.5;
            const v = ip(t, [at, at + 4], [0, 1], EASE.back);
            const shown = t >= at;
            return (
              <div
                key={ci}
                style={{
                  height: 30,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: shown && on ? `rgba(0,223,69,${0.22 * Math.min(1, v)})` : 'rgba(255,255,255,0.03)',
                  border: `1.5px ${shown && on ? 'solid' : 'dashed'} ${shown && on ? C.green : 'rgba(255,255,255,0.14)'}`,
                  transform: `scale(${shown ? 0.85 + 0.15 * v : 1})`,
                }}
              >
                {shown && on ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ opacity: Math.min(1, v) }}>
                    <polyline points="4 12.5 9.5 18 20 6.5" fill="none" stroke={C.green} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : shown ? (
                  <MiniLock color="rgba(255,255,255,0.35)" size={10} />
                ) : null}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const DATA_KINDS = [
  { k: '출결', c: C.green, n: 6 },
  { k: '판서', c: '#4aa3ff', n: 5 },
  { k: '발화', c: C.gold, n: 7 },
  { k: '과제', c: '#b98cff', n: 4 },
  { k: '평가', c: '#ff7a59', n: 5 },
];
const SPARK = 'M 0 34 L 20 30 L 40 31 L 60 24 L 80 22 L 100 15 L 120 12 L 140 5';
const DataBody = ({ t }) => {
  const { fps } = useVideoConfig();
  const value = ip(t, [0, 26], [24180, 24816], EASE.out);
  const spark = evolvePath(ip(t, [2, 20], [0, 1], EASE.inOut), SPARK);
  return (
    <div style={{ display: 'flex', gap: 22, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 168 }}>
          {DATA_KINDS.map((d, ci) => (
            <div key={d.k} style={{ width: 26, display: 'flex', flexDirection: 'column-reverse', gap: 3 }}>
              {Array.from({ length: d.n }).map((_, bi) => {
                const at = 1 + bi * 2.6 + ci * 0.9;
                const s = spring({ frame: t - at, fps, config: { damping: 11, stiffness: 220, mass: 0.5 } });
                if (t < at) return <div key={bi} style={{ height: 19 }} />;
                return (
                  <div
                    key={bi}
                    style={{
                      height: 19,
                      borderRadius: 4,
                      background: d.c,
                      opacity: 0.55 + 0.45 * (bi / d.n),
                      transform: `translateY(${(1 - s) * -90}px)`,
                      boxShadow: `0 0 8px ${d.c}55`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 7 }}>
          {DATA_KINDS.map((d) => (
            <span key={d.k} style={{ width: 26, textAlign: 'center', fontFamily: FONT.sans, fontSize: 11.5, fontWeight: 700, color: C.mute }}>
              {d.k}
            </span>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 700, color: C.mute }}>누적 수업 기록</span>
        <span style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 40, lineHeight: 1, color: C.white, whiteSpace: 'nowrap' }}>
          <RollingNumber value={Math.floor(value / 1000)} digits={2} />,
          <RollingNumber value={value % 1000} digits={3} leadingZeros="show" />
          <span style={{ fontFamily: FONT.sans, fontSize: 22, color: C.green, marginLeft: 6 }}>건</span>
        </span>
        <svg width="140" height="40" viewBox="0 0 140 40" style={{ overflow: 'visible', marginTop: 6 }}>
          <path d={SPARK} fill="none" stroke={C.green} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={spark.strokeDasharray} strokeDashoffset={spark.strokeDashoffset} />
        </svg>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: FONT.sans, fontSize: 13, fontWeight: 700, color: C.green }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: C.green, opacity: t >= 0 && Math.floor(t / 6) % 2 === 0 ? 1 : 0.35 }} />
          실시간 수집 중
        </span>
      </div>
    </div>
  );
};

const BODIES = [SecurityBody, RecordingBody, PermissionBody, DataBody];

const Panel = ({ index, t, all }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pillar = PILLARS[index];
  const Body = BODIES[index];
  const enter = spring({ frame: frame - index * 2, fps, config: { damping: 15, stiffness: 140 } });
  const active = t >= 0 && t < STEP;
  const done = t >= STEP;
  const focus = active ? ip(t, [0, 5], [0, 1], EASE.out) : 0;
  const opacity = all ? 1 : t < 0 ? 0.34 : active ? 1 : 0.8;
  const lit = all || active;
  const status = t < 0 ? pillar.idle : active && t < 9 ? pillar.active : pillar.done;
  const scan = active ? ip(t, [0, 10], [0, 1], EASE.inOut) : 1;

  return (
    <div
      style={{
        width: PANEL_W,
        height: PANEL_H,
        borderRadius: 22,
        background: 'linear-gradient(165deg, rgba(16,36,25,0.94), rgba(5,13,9,0.96))',
        border: `${lit ? 2 : 1}px solid ${lit ? C.green : done ? 'rgba(0,223,69,0.4)' : 'rgba(255,255,255,0.09)'}`,
        boxShadow: lit ? `0 0 ${50 * (all ? 1 : focus)}px rgba(0,223,69,0.32), 0 30px 80px rgba(0,0,0,0.55)` : '0 30px 80px rgba(0,0,0,0.5)',
        opacity: opacity * Math.min(1, enter * 1.3),
        transform: `translateY(${(1 - enter) * 80}px) scale(${1 + 0.035 * focus})`,
        filter: t < 0 && !all ? 'saturate(0.4)' : undefined,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <PanelIcon kind={index} color={t >= 0 || all ? C.green : 'rgba(255,255,255,0.6)'} />
        <span style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 21, color: C.white, letterSpacing: '-0.02em' }}>{pillar.title}</span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: '0.16em',
            padding: '4px 9px',
            borderRadius: 6,
            color: status === pillar.done ? '#04130b' : status === pillar.idle ? C.dim : C.gold,
            background: status === pillar.done ? C.green : status === pillar.idle ? 'rgba(255,255,255,0.05)' : 'rgba(230,184,0,0.14)',
          }}
        >
          {status}
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.dim }}>0{index + 1}</span>
      </div>
      <div style={{ flex: 1, padding: '14px 18px 16px' }}>
        <Body t={t} />
      </div>
      {/* activation scan sweep */}
      {active && scan < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scan * 100}%`,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${C.greenSoft}, transparent)`,
            boxShadow: `0 0 20px 6px rgba(0,223,69,0.35)`,
          }}
        />
      )}
    </div>
  );
};

const PillarList = ({ frame }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {PILLARS.map((p, i) => {
      const t = frame - i * STEP;
      const active = t >= 0 && t < STEP;
      const done = t >= STEP || frame >= ALL;
      const shift = active ? ip(t, [0, 6], [0, 1], EASE.out) : 0;
      return (
        <div key={p.title} style={{ height: 54, display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${shift * 14}px)` }}>
          <span style={{ width: 5, height: 34, borderRadius: 3, background: active ? C.green : 'transparent', boxShadow: active ? `0 0 14px ${C.green}` : undefined }} />
          <span style={{ fontFamily: FONT.mono, fontSize: 16, color: active ? C.green : C.dim, width: 26 }}>0{i + 1}</span>
          <span
            style={{
              fontFamily: FONT.sans,
              fontWeight: active ? 800 : 700,
              fontSize: active ? 36 : 30,
              letterSpacing: '-0.03em',
              color: active ? C.green : done ? 'rgba(243,247,244,0.85)' : 'rgba(243,247,244,0.32)',
              textShadow: active ? '0 0 30px rgba(0,223,69,0.35)' : undefined,
            }}
          >
            {p.title}
          </span>
          {done && !active && (
            <svg width="22" height="22" viewBox="0 0 24 24">
              <polyline points="4 12.5 9.5 18 20 6.5" fill="none" stroke={C.green} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      );
    })}
  </div>
);

export const ManageScene = () => {
  const frame = useCurrentFrame();
  const all = frame >= ALL;
  const pillar = Math.min(3, Math.floor(frame / STEP));
  const indexValue = 1 + [1, 2, 3].reduce((acc, k) => acc + ip(frame, [k * STEP - 2, k * STEP + 6], [0, 1], EASE.inOut), 0);

  // all-lit → slide the board to screen center → collapse into the data core
  const center = ip(frame, [ALL, ALL + 12], [0, 1], EASE.inOut);
  const gx = GRID.x + (CORE_END.x - GRID.x) * center;
  const gy = GRID.y + (CORE_END.y - GRID.y) * center;
  const collapse = ip(frame, [ALL + 16, END], [0, 1], EASE.in);
  const boardScale = (1 - 0.14 * center) * (1 - 0.92 * collapse);
  const boardDim = all ? ip(frame, [ALL + 4, ALL + 10], [1, 0.42]) : 1;
  const leftOut = ip(frame, [ALL - 4, ALL + 4], [1, 0], EASE.in);
  const core = ip(frame, [ALL, ALL + 10], [0, 1], EASE.out) * (1 + collapse * 1.6);

  const panels = [0, 1, 2, 3].map((i) => {
    const col = i % 2 ? 1 : -1;
    const row = i < 2 ? -1 : 1;
    return {
      i,
      x: col * (PANEL_W / 2 + GAP / 2),
      y: row * (PANEL_H / 2 + GAP / 2),
    };
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <BaseBackground glowX={66 - 16 * center} glowY={52} glow={0.14 + 0.12 * center} />
      <GridPlane opacity={0.45} size={64} drift={0.6} />
      <Dust count={26} seed="mgmt-dust" opacity={0.35} />

      {/* the board */}
      <div style={{ position: 'absolute', left: gx, top: gy, transform: `scale(${boardScale})` }}>
        {/* links to the core when everything is lit */}
        {all && (
          <svg width="1200" height="900" viewBox="-600 -450 1200 900" style={{ position: 'absolute', left: -600, top: -450, overflow: 'visible' }}>
            {panels.map((p) => {
              const d = `M ${p.x} ${p.y} L 0 0`;
              const ev = evolvePath(ip(frame, [ALL, ALL + 8], [0, 1], EASE.out), d);
              return <path key={p.i} d={d} stroke={C.greenSoft} strokeWidth={3} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.8} />;
            })}
          </svg>
        )}
        {panels.map((p) => (
          <div
            key={p.i}
            style={{
              position: 'absolute',
              left: p.x * (1 - collapse * 0.6) - PANEL_W / 2,
              top: p.y * (1 - collapse * 0.6) - PANEL_H / 2,
              opacity: boardDim * (1 - collapse),
              filter: all && frame > ALL + 4 ? `blur(${ip(frame, [ALL + 4, ALL + 12], [0, 2.5])}px)` : undefined,
            }}
          >
            <Panel index={p.i} t={frame - p.i * STEP} all={all} />
          </div>
        ))}
      </div>

      {/* data core (grows when the board converges) */}
      {all && (
        <div
          style={{
            position: 'absolute',
            left: gx - 170,
            top: gy - 170,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220,255,230,0.95) 0%, rgba(0,223,69,0.75) 18%, rgba(0,223,69,0.18) 45%, rgba(0,223,69,0) 70%)',
            transform: `scale(${0.25 + core * 0.55})`,
            opacity: Math.min(1, core),
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* left column: chapter copy + pillar list */}
      <div style={{ position: 'absolute', left: 140, top: 236, width: 660, opacity: leftOut, transform: `translateX(${(1 - leftOut) * -40}px)` }}>
        <ChapterPill index="02" label="관리" delay={1} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, fontFamily: FONT.mono, fontSize: 21, letterSpacing: '0.28em', color: C.green, height: 30 }}>
          <span style={{ fontWeight: 700, fontSize: 22 }}>
            0<RollingNumber value={indexValue} digits={1} />
            <span style={{ color: C.dim }}> / 04</span>
          </span>
          <KineticText key={pillar} text={PILLARS[pillar].en} mode="scramble" delay={pillar * STEP + 1} stagger={0.5} duration={12} />
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 132, lineHeight: 1.08, letterSpacing: '-0.055em', color: C.white, marginTop: 18 }}>
          <KineticText text="관리는," mode="rise" delay={2} stagger={2} duration={14} />
          <br />
          <span style={{ color: C.green, textShadow: '0 0 60px rgba(0,223,69,0.35)' }}>
            <KineticText text="시스템이." mode="rise" delay={8} stagger={2} duration={14} />
          </span>
        </div>
        <div style={{ marginTop: 34 }}>
          <PillarList frame={frame} />
        </div>
      </div>

      {/* all-lit statement */}
      {all && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 42% 30% at 50% 48%, rgba(3,8,6,0.85), rgba(3,8,6,0) 100%)', opacity: ip(frame, [ALL, ALL + 6], [0, 1]) * ip(frame, [END - 6, END], [1, 0.4]) }} />
          <div
            style={{
              position: 'relative',
              textAlign: 'center',
              fontFamily: FONT.sans,
              fontWeight: 900,
              fontSize: 112,
              lineHeight: 1.12,
              letterSpacing: '-0.05em',
              color: C.white,
              opacity: ip(frame, [END - 6, END], [1, 0]),
              filter: frame > END - 6 ? `blur(${ip(frame, [END - 6, END], [0, 10])}px)` : undefined,
            }}
          >
            <KineticText text="모든 수업이," mode="slam" delay={ALL + 1} stagger={1.1} />
            <br />
            <span style={{ color: C.green, textShadow: '0 0 50px rgba(0,223,69,0.45)' }}>
              <KineticText text="본사의 자산으로." mode="slam" delay={ALL + 6} stagger={1.1} />
            </span>
          </div>
        </AbsoluteFill>
      )}

      {[STEP, STEP * 2, STEP * 3].map((b) => (
        <Flash key={b} at={b} duration={4} peak={0.1} color={C.greenSoft} />
      ))}
      <Flash at={ALL} duration={7} peak={0.32} color={C.greenSoft} />
      <Shockwave at={ALL + 14} x={CORE_END.x} y={CORE_END.y} maxR={900} dur={20} rings={2} />
      <LensStreak at={ALL} y={CORE_END.y} dur={16} />
    </AbsoluteFill>
  );
};
