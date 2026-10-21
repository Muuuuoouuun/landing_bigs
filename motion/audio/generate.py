#!/usr/bin/env python3
"""
Procedural soundtrack for the ClassIn showreel — every sound is synthesized here,
so the audio is original and royalty-free.

Sound direction: warm, weighty and cinematic rather than bright and clicky.
  music  a D minor cue that resolves to D major: felt piano, string section, choir, soft horns,
         timpani, deep round kick, warm snare, sub bass — the hook's four-note motif returns
         in every chapter (score.py)
  sfx    in-key orchestral hits, reverse swells built from those hits, one move per transition,
         felt-mallet UI taps, soft foley — no beeps, buzzers, ticks or glitch noise (sfx.py)
  master the effects sit in the music's hall, the music ducks under them, gentle high shelf,
         look-ahead limiter, about -14 LUFS / -1 dBFS

Modules: dsp.py (filters, space, dynamics) · instruments.py · score.py · sfx.py

Outputs (48 kHz, 16-bit WAV):
  public/audio/music.wav        BGM locked to the video edit (128.57 BPM = 14 frames/beat)
  public/audio/sfx/<name>.wav   sound effects, placed by src/audio/soundtrack.json
  public/audio/soundtrack.wav   music + SFX premixed per soundtrack.json and mastered

Timing comes from src/audio/soundtrack.json — edit cues there, then run `npm run audio`.
Requires: numpy, scipy.
"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile

from dsp import SR, add, duck, each, hp, limiter, saturate, stereo, tilt
from score import build_music
from sfx import build_sfx, sfx_bus_fx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = json.load(open(os.path.join(ROOT, 'src', 'audio', 'soundtrack.json'), encoding='utf-8'))


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if x.ndim == 1:
        x = stereo(x)
    data = (np.clip(x, -1, 1).T * 32767).astype(np.int16)
    wavfile.write(path, SR, data)


def db(x):
    return 20 * np.log10(max(x, 1e-12))


def master(mix, target_rms_db=-17.6):
    mix = each(mix, lambda c: tilt(hp(c, 36)))
    n_in, n_out = int(0.005 * SR), int(0.8 * SR)  # the reel ends on a fade, never on a cut-off tail
    mix[:, :n_in] *= np.linspace(0, 1, n_in)
    mix[:, -n_out:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, n_out)))
    pre = db(np.max(np.abs(mix)))
    mix = mix * 10 ** ((target_rms_db - db(np.sqrt(np.mean(mix ** 2)))) / 20)
    out = limiter(saturate(mix, 1.05))
    out = np.clip(out, -0.891, 0.891)  # -1 dBFS ceiling guard
    print(f'premix peak {pre:+.1f} dBFS → mastered peak {db(np.max(np.abs(out))):.1f} dBFS, '
          f'rms {db(np.sqrt(np.mean(out ** 2))):.1f} dBFS')
    return out


def main():
    spf = SR // SPEC['fps']
    music = build_music(SPEC)
    write(os.path.join(ROOT, 'public', 'audio', 'music.wav'), music)

    sfx = build_sfx(SPEC)
    sfx_dir = os.path.join(ROOT, 'public', 'audio', 'sfx')
    os.makedirs(sfx_dir, exist_ok=True)
    for stale in os.listdir(sfx_dir):  # drop sounds that are no longer part of the palette
        if stale.endswith('.wav') and stale[:-4] not in sfx:
            os.remove(os.path.join(sfx_dir, stale))
    for name, x in sfx.items():
        write(os.path.join(sfx_dir, f'{name}.wav'), x)

    # premix — same placement and volumes Remotion uses in "stems" mode
    missing = sorted({c['sfx'] for c in SPEC['cues'] if c['sfx'] not in sfx})
    if missing:
        sys.exit(f'Unknown sfx in soundtrack.json: {missing}')
    fx = np.zeros_like(music)
    for cue in SPEC['cues']:
        add(fx, sfx[cue['sfx']], cue['at'] * spf, cue['volume'])
    fx = sfx_bus_fx(fx)
    bed = duck(music * SPEC['music']['volume'], fx, depth_db=3.0, threshold_db=-30, range_db=16)
    print(f"music rms {db(np.sqrt(np.mean(bed ** 2))):.1f} dBFS · sfx rms {db(np.sqrt(np.mean(fx ** 2))):.1f} dBFS")
    write(os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav'), master(bed + fx))


if __name__ == '__main__':
    main()
