import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { pushCut } from '@remotion/transitions/push-cut';
import { C, EASE, FPS, ip } from './theme';
import { FONT } from './fonts';
import { Grain, Letterbox, Vignette } from './components/Fx';
import { dip, lightWipe, whipUp, zoomBlur } from './transitions/presentations';
import { BRANCHES_DURATION, BranchesScene } from './scenes/BranchesScene';
import { STANDARDIZE_DURATION, StandardizeScene } from './scenes/StandardizeScene';
import { AI_INTRO_DURATION, AIIntroScene } from './scenes/AIIntroScene';
import { AI_EVAL_DURATION, AIEvalScene } from './scenes/AIEvalScene';
import { EFFICIENCY_DURATION, EfficiencyScene } from './scenes/EfficiencyScene';
import { OUTRO_DURATION, OutroScene } from './scenes/OutroScene';
import { Soundtrack } from './audio/Soundtrack';

// Scene list + the transition that leads OUT of each scene.
const TIMELINE = [
  { id: 'branches', label: '01 · BRANCHES', Comp: BranchesScene, dur: BRANCHES_DURATION, out: { p: zoomBlur(), d: 10 } },
  { id: 'standardize', label: '02 · STANDARDIZE', Comp: StandardizeScene, dur: STANDARDIZE_DURATION, out: { p: pushCut({ flashOpacity: 0.28, flashColor: C.greenSoft, outgoingScale: 1.1, incomingStartScale: 1.12, incomingEndScale: 1 }), d: 8 } },
  { id: 'ai', label: '03 · AI', Comp: AIIntroScene, dur: AI_INTRO_DURATION, out: { p: lightWipe(), d: 8 } },
  { id: 'eval', label: '04 · AI 강의평가', Comp: AIEvalScene, dur: AI_EVAL_DURATION, out: { p: whipUp(), d: 10 } },
  { id: 'efficiency', label: '05 · EFFICIENCY', Comp: EfficiencyScene, dur: EFFICIENCY_DURATION, out: { p: dip(), d: 10 } },
  { id: 'outro', label: '06 · CLASSIN', Comp: OutroScene, dur: OUTRO_DURATION, out: null },
];

// Global start frame of every scene (each transition overlaps the previous scene's tail).
const STARTS = TIMELINE.reduce((acc, s, k) => {
  if (k === 0) return [0];
  const prev = TIMELINE[k - 1];
  return [...acc, acc[k - 1] + prev.dur - prev.out.d];
}, []);

export const SHOWREEL_DURATION = STARTS[STARTS.length - 1] + TIMELINE[TIMELINE.length - 1].dur;

const IMPACT = 58; // branches snap into the grid — bars open
const OUTRO_START = STARTS[STARTS.length - 1];

const timecode = (frame) => {
  const s = Math.floor(frame / FPS);
  const f = frame % FPS;
  return `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

const Hud = () => {
  const frame = useCurrentFrame();
  const chapter = TIMELINE[STARTS.reduce((cur, st, k) => (frame >= st + 4 ? k : cur), 0)].label;
  const o = ip(frame, [2, 10], [0, 0.6]) * ip(frame, [SHOWREEL_DURATION - 12, SHOWREEL_DURATION - 2], [1, 0]);
  const text = { position: 'absolute', fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.28em', color: C.white };
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      <div style={{ ...text, left: 48, top: 42, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 9, height: 9, background: C.green }} />
        CLASSIN ENTERPRISE
      </div>
      <div style={{ ...text, right: 48, top: 42 }}>TC {timecode(frame)}</div>
      <div style={{ ...text, left: 48, bottom: 40, color: C.green }}>{chapter}</div>
      <div style={{ ...text, right: 48, bottom: 40, display: 'flex', alignItems: 'center', gap: 14 }}>
        SHOWREEL 2026
        <span style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.2)', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(frame / SHOWREEL_DURATION) * 100}%`, background: C.green }} />
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const Showreel = ({ audio = 'mix' }) => {
  const frame = useCurrentFrame();
  const bars =
    frame < OUTRO_START
      ? ip(frame, [IMPACT, IMPACT + 12], [140, 0], EASE.out)
      : ip(frame, [OUTRO_START + 20, OUTRO_START + 40], [0, 92], EASE.inOut);

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <TransitionSeries>
        {TIMELINE.flatMap((scene) => {
          const { id, Comp, dur, out } = scene;
          const nodes = [
            <TransitionSeries.Sequence key={id} durationInFrames={dur}>
              <Comp />
            </TransitionSeries.Sequence>,
          ];
          if (out) {
            nodes.push(
              <TransitionSeries.Transition key={`${id}-out`} presentation={out.p} timing={linearTiming({ durationInFrames: out.d })} />,
            );
          }
          return nodes;
        })}
      </TransitionSeries>

      <Vignette />
      <Grain />
      <Letterbox size={bars} />
      <Hud />
      <Soundtrack mode={audio} />
    </AbsoluteFill>
  );
};
