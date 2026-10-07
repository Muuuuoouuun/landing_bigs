import React from 'react';
import { Html5Audio, Sequence, staticFile } from 'remotion';
import spec from './soundtrack.json';

/**
 * mode "mix"   — the mastered premix (music + every SFX cue, limited to -1 dBFS). Default for renders.
 * mode "stems" — music + each SFX cue as separate tracks, placed live from soundtrack.json.
 *                Handy in Studio for nudging a cue; run `npm run audio` afterwards to re-master the mix.
 * mode "off"   — silent.
 */
export const Soundtrack = ({ mode = 'mix' }) => {
  if (mode === 'off') return null;
  if (mode === 'mix') return <Html5Audio src={staticFile(spec.music.mixFile)} name="soundtrack (mastered)" />;
  return (
    <>
      <Html5Audio src={staticFile(spec.music.file)} volume={spec.music.volume} name="music" />
      {spec.cues.map((cue, i) => (
        <Sequence key={`${cue.sfx}-${cue.at}-${i}`} from={cue.at} layout="none" name={`sfx · ${cue.sfx}`}>
          <Html5Audio src={staticFile(`audio/sfx/${cue.sfx}.wav`)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
};
