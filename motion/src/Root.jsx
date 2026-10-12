import React from 'react';
import { Composition, Folder } from 'remotion';
import './fonts';
import { FPS, HEIGHT, WIDTH } from './theme';
import { SHOWREEL_DURATION, Showreel } from './Showreel';
import { BRANCHES_DURATION, BranchesScene } from './scenes/BranchesScene';
import { STANDARDIZE_DURATION, StandardizeScene } from './scenes/StandardizeScene';
import { MANAGE_DURATION, ManageScene } from './scenes/ManageScene';
import { VARIATION_DURATION, VariationScene } from './scenes/VariationScene';
import { AI_INTRO_DURATION, AIIntroScene } from './scenes/AIIntroScene';
import { AI_EVAL_DURATION, AIEvalScene } from './scenes/AIEvalScene';
import { VALUE_DURATION, ValueScene } from './scenes/ValueScene';
import { OUTRO_DURATION, OutroScene } from './scenes/OutroScene';

const comp = (id, component, durationInFrames) => (
  <Composition id={id} component={component} durationInFrames={durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
);

export const RemotionRoot = () => (
  <>
    <Composition
      id="ClassInShowreel"
      component={Showreel}
      durationInFrames={SHOWREEL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ audio: 'mix' }}
    />
    <Folder name="Scenes">
      {comp('S1-Branches', BranchesScene, BRANCHES_DURATION)}
      {comp('S2-Standardize', StandardizeScene, STANDARDIZE_DURATION)}
      {comp('S3-Manage', ManageScene, MANAGE_DURATION)}
      {comp('S4-Variation', VariationScene, VARIATION_DURATION)}
      {comp('S5-AIIntro', AIIntroScene, AI_INTRO_DURATION)}
      {comp('S6-AIEval', AIEvalScene, AI_EVAL_DURATION)}
      {comp('S7-Value', ValueScene, VALUE_DURATION)}
      {comp('S8-Outro', OutroScene, OUTRO_DURATION)}
    </Folder>
  </>
);
