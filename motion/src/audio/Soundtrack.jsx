import React from 'react';
import { Html5Audio, Sequence, staticFile } from 'remotion';
import spec from './soundtrack.json';
import placed from './cues.generated.json';

/**
 * mode "mix"   — the mastered premix (music + every SFX cue, limited to -1 dBFS). Default for renders.
 * mode "stems" — music + each SFX cue as separate tracks, placed where `npm run audio` locked their hits
 *                to the beat grid (cues.generated.json, to the nearest frame). Handy in Studio for checking
 *                a cue; edit soundtrack.json and run `npm run audio` again to move one.
 * mode "off"   — silent.
 */
export const Soundtrack = ({ mode = 'mix' }) => {
  if (mode === 'off') return null;
  if (mode === 'mix') return <Html5Audio src={staticFile(spec.music.mixFile)} name="soundtrack (mastered)" />;
  return (
    <>
      <Html5Audio src={staticFile(spec.music.file)} volume={spec.music.volume} name="music" />
      {placed.cues.map((cue, i) => {
        const from = Math.round(cue.from);
        return (
          <Sequence key={`${cue.file}-${i}`} from={Math.max(0, from)} layout="none" name={`sfx · ${cue.file}`}>
            <Html5Audio src={staticFile(`audio/sfx/${cue.file}.wav`)} volume={cue.volume} trimBefore={Math.max(0, -from)} />
          </Sequence>
        );
      })}
    </>
  );
};
