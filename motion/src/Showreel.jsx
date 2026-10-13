import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { pushCut } from '@remotion/transitions/push-cut';
import { C, EASE, FPS, ip } from './theme';
import { FONT } from './fonts';
import { FrameMatte, Grain, Vignette } from './components/Fx';
import { dip, iris, lightWipe, whipUp, zoomBlur } from './transitions/presentations';
import { BRANCHES_DURATION, BranchesScene } from './scenes/BranchesScene';
import { STANDARDIZE_DURATION, StandardizeScene } from './scenes/StandardizeScene';
import { MANAGE_DURATION, ManageScene } from './scenes/ManageScene';
import { VARIATION_DURATION, VariationScene } from './scenes/VariationScene';
import { AI_INTRO_DURATION, AIIntroScene } from './scenes/AIIntroScene';
import { AI_EVAL_DURATION, AIEvalScene } from './scenes/AIEvalScene';
import { VALUE_DURATION, ValueScene } from './scenes/ValueScene';
import { OUTRO_DURATION, OutroScene } from './scenes/OutroScene';
import { Soundtrack } from './audio/Soundtrack';

// Scene list + the transition that leads OUT of each scene (null = hard cut).
// `accent` tints the HUD chapter label and progress bar while the scene is on screen.
// Every scene starts on the music grid (beat = 14 frames from the impact at 58):
// 0 · 100 · 268 · 422 · 478 · 534 · 632 · 730 → 810 frames = 27 s.
const TIMELINE = [
  { id: 'branches', label: '01 · BRANCHES', accent: C.green, Comp: BranchesScene, dur: BRANCHES_DURATION, out: { p: zoomBlur(), d: 10 } },
  { id: 'standardize', label: '02 · 표준화', accent: C.green, Comp: StandardizeScene, dur: STANDARDIZE_DURATION, out: { p: pushCut({ flashOpacity: 0.5, flashColor: C.white, outgoingScale: 1.1, incomingStartScale: 1.12, incomingEndScale: 1 }), d: 8 } },
  { id: 'manage', label: '03 · 관리', accent: C.blue, Comp: ManageScene, dur: MANAGE_DURATION, out: null },
  { id: 'variation', label: '04 · INTERLUDE', accent: C.ink, Comp: VariationScene, dur: VARIATION_DURATION, out: { p: iris({ color: C.violet }), d: 8 } },
  { id: 'ai', label: '05 · AI', accent: C.violet, Comp: AIIntroScene, dur: AI_INTRO_DURATION, out: { p: lightWipe({ color: C.violet }), d: 8 } },
  { id: 'eval', label: '06 · AI 강의평가', accent: C.violet, Comp: AIEvalScene, dur: AI_EVAL_DURATION, out: { p: whipUp(), d: 10 } },
  { id: 'value', label: '07 · 가치', accent: C.gold, Comp: ValueScene, dur: VALUE_DURATION, out: { p: dip(), d: 10 } },
  { id: 'outro', label: '08 · CLASSIN', accent: C.green, Comp: OutroScene, dur: OUTRO_DURATION, out: null },
];

const overlap = (scene) => (scene.out ? scene.out.d : 0);

// Global start frame of every scene (each transition overlaps the previous scene's tail).
const STARTS = TIMELINE.reduce((acc, s, k) => {
  if (k === 0) return [0];
  const prev = TIMELINE[k - 1];
  return [...acc, acc[k - 1] + prev.dur - overlap(prev)];
}, []);

export const SHOWREEL_DURATION = STARTS[STARTS.length - 1] + TIMELINE[TIMELINE.length - 1].dur;

const IMPACT = 58; // branches snap into the grid — the card frame opens to full bleed
const OUTRO_START = STARTS[STARTS.length - 1];

const timecode = (frame) => {
  const s = Math.floor(frame / FPS);
  const f = frame % FPS;
  return `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

const Hud = () => {
  const frame = useCurrentFrame();
  const scene = TIMELINE[STARTS.reduce((cur, st, k) => (frame >= st + 4 ? k : cur), 0)];
  const o = ip(frame, [2, 10], [0, 0.66]) * ip(frame, [SHOWREEL_DURATION - 12, SHOWREEL_DURATION - 2], [1, 0]);
  const text = { position: 'absolute', fontFamily: FONT.mono, fontSize: 15, letterSpacing: '0.28em', color: C.ink };
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      <div style={{ ...text, left: 48, top: 42, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: C.green }} />
        CLASSIN ENTERPRISE
      </div>
      <div style={{ ...text, right: 48, top: 42 }}>TC {timecode(frame)}</div>
      <div style={{ ...text, left: 48, bottom: 40, color: scene.accent, fontWeight: 700 }}>{scene.label}</div>
      <div style={{ ...text, right: 48, bottom: 40, display: 'flex', alignItems: 'center', gap: 14 }}>
        SHOWREEL 2026
        <span style={{ width: 120, height: 2, background: C.line, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(frame / SHOWREEL_DURATION) * 100}%`, background: scene.accent }} />
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const Showreel = ({ audio = 'mix' }) => {
  const frame = useCurrentFrame();
  // inset of the rounded card frame: opens to full bleed on the impact, closes again for the end card
  const inset =
    frame < OUTRO_START
      ? ip(frame, [IMPACT, IMPACT + 12], [140, 0], EASE.out)
      : ip(frame, [OUTRO_START + 40, OUTRO_START + 60], [0, 92], EASE.inOut);

  return (
    <AbsoluteFill style={{ background: C.bgDeep }}>
      <FrameMatte inset={inset}>
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
      </FrameMatte>

      <Vignette />
      <Grain />
      <Hud />
      <Soundtrack mode={audio} />
    </AbsoluteFill>
  );
};
