import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { FPS, HEIGHT, WIDTH } from './theme';
import { SHOWREEL_DURATION, Showreel } from './Showreel';
import { BRANCHES_DURATION, BranchesScene } from './scenes/BranchesScene';
import { STANDARDIZE_DURATION, StandardizeScene } from './scenes/StandardizeScene';
import { AI_INTRO_DURATION, AIIntroScene } from './scenes/AIIntroScene';
import { AI_EVAL_DURATION, AIEvalScene } from './scenes/AIEvalScene';
import { EFFICIENCY_DURATION, EfficiencyScene } from './scenes/EfficiencyScene';
import { OUTRO_DURATION, OutroScene } from './scenes/OutroScene';

const comp = (id, component, durationInFrames) => (
  <Composition id={id} component={component} durationInFrames={durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
);

export const RemotionRoot = () => (
  <>
    {comp('ClassInShowreel', Showreel, SHOWREEL_DURATION)}
    <Folder name="Scenes">
      {comp('S1-Branches', BranchesScene, BRANCHES_DURATION)}
      {comp('S2-Standardize', StandardizeScene, STANDARDIZE_DURATION)}
      {comp('S3-AIIntro', AIIntroScene, AI_INTRO_DURATION)}
      {comp('S4-AIEval', AIEvalScene, AI_EVAL_DURATION)}
      {comp('S5-Efficiency', EfficiencyScene, EFFICIENCY_DURATION)}
      {comp('S6-Outro', OutroScene, OUTRO_DURATION)}
    </Folder>
  </>
);
