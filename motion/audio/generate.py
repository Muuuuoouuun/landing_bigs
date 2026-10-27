#!/usr/bin/env python3
"""
Procedural soundtrack for the ClassIn showreel — every sound is synthesized here,
so the audio is original and royalty-free.

Sound direction: warm, weighty and cinematic rather than bright and clicky.
  music  a D minor cue that resolves to D major: felt piano, string section, choir, soft horns,
         timpani, deep round kick, warm snare, sub bass — the hook's four-note motif returns
         in every chapter (score.py)
  sfx    played with the score: every cue's hit is locked to the 16th-note grid, tuned sounds are
         voiced from the chord under them, chimes echo in dotted 8ths; one move per transition,
         felt-mallet UI taps, soft foley — no beeps, buzzers, ticks or glitch noise (sfx.py)
  master the effects sit in the music's hall, the music ducks under them, gentle high shelf,
         look-ahead limiter, about -14 LUFS / -1 dBFS

Modules: dsp.py (filters, space, dynamics) · grid.py (beat grid, chord timeline) · instruments.py ·
score.py · sfx.py

Outputs (48 kHz, 16-bit WAV):
  public/audio/music.wav        BGM locked to the video edit (128.57 BPM = 14 frames/beat)
  public/audio/sfx/<name>.wav   sound effects; tuned ones as <name>-<chord>.wav
  public/audio/soundtrack.wav   music + SFX premixed per soundtrack.json and mastered
  src/audio/cues.generated.json where each cue's file starts once locked to the grid (stems mode)

Timing comes from src/audio/soundtrack.json — a cue's `at` is the frame where it should hit (its peak,
tick or attack); the generator moves that hit onto the nearest 16th note. Edit cues there, then run
`npm run audio`.
Requires: numpy, scipy.
"""
import json
import os
import sys

import numpy as np
from scipy.io import wavfile

from dsp import SR, add, duck, each, hp, limiter, saturate, stereo, tilt
from grid import MusicGrid
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


def family(name):
    """tap-3 → tap: numbered variants are one instrument playing a run."""
    head, _, tail = name.rpartition('-')
    return head if tail.isdigit() else name


def resolve(grid, palette):
    """Lock every cue's hit to the 16th grid (unless it says "snap": false) and pick the chord under it.
    Two notes of one run never share a grid point: a collision moves the later note on by a 16th."""
    placed, last = [], {}
    for cue in sorted(SPEC['cues'], key=lambda c: c['at']):
        at = grid.snap(cue['at']) if cue.get('snap', True) else cue['at']
        fam = family(cue['sfx'])
        while at <= last.get(fam, -1e9):
            at += grid.beat / 4
        last[fam] = at
        chord = grid.chord_at(at) if palette[cue['sfx']].tuned else None
        file = f"{cue['sfx']}-{chord.lower()}" if chord else cue['sfx']
        placed.append(dict(sfx=cue['sfx'], volume=cue['volume'], wrote=cue['at'], at=at, chord=chord, file=file))
    return placed


def main():
    grid = MusicGrid(SPEC)
    music = build_music(SPEC)
    write(os.path.join(ROOT, 'public', 'audio', 'music.wav'), music)

    palette = build_sfx(SPEC)
    missing = sorted({c['sfx'] for c in SPEC['cues'] if c['sfx'] not in palette})
    if missing:
        sys.exit(f'Unknown sfx in soundtrack.json: {missing}')
    placed = resolve(grid, palette)
    sounds = {}  # file → (signal, hit seconds), one render per sound and chord
    for p in placed:
        if p['file'] not in sounds:
            sounds[p['file']] = palette[p['sfx']].render(p['chord'])
        p['start'] = grid.sample(p['at']) - int(round(sounds[p['file']][1] * SR))

    sfx_dir = os.path.join(ROOT, 'public', 'audio', 'sfx')
    os.makedirs(sfx_dir, exist_ok=True)
    for stale in os.listdir(sfx_dir):  # drop sounds the cue sheet no longer uses
        if stale.endswith('.wav') and stale[:-4] not in sounds:
            os.remove(os.path.join(sfx_dir, stale))
    for file, (x, _) in sounds.items():
        write(os.path.join(sfx_dir, f'{file}.wav'), x)
    with open(os.path.join(ROOT, 'src', 'audio', 'cues.generated.json'), 'w', encoding='utf-8') as f:
        comment = ('Generated by audio/generate.py from soundtrack.json — do not edit. Start frame of each cue file once '
                   'its hit is locked to the beat grid; used by <Soundtrack mode="stems">.')
        rows = ',\n'.join('    ' + json.dumps({'from': round(p['start'] / grid.spf, 3), 'file': p['file'], 'volume': p['volume']})
                           for p in placed)
        f.write(f'{{\n  "_comment": {json.dumps(comment, ensure_ascii=False)},\n  "cues": [\n{rows}\n  ]\n}}\n')
    moved = [abs(p['at'] - p['wrote']) for p in placed]
    print(f"{len(placed)} cues on the 16th grid ({len(sounds)} sounds) · moved {np.mean(moved) / 30 * 1000:.0f} ms on average, "
          f"at most {max(moved) / 30 * 1000:.0f} ms")

    # premix — every hit on its exact grid sample
    fx = np.zeros_like(music)
    for p in placed:
        add(fx, sounds[p['file']][0], p['start'], p['volume'])
    fx = sfx_bus_fx(fx)
    bed = duck(music * SPEC['music']['volume'], fx, depth_db=3.0, threshold_db=-30, range_db=16)
    print(f"music rms {db(np.sqrt(np.mean(bed ** 2))):.1f} dBFS · sfx rms {db(np.sqrt(np.mean(fx ** 2))):.1f} dBFS")
    write(os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav'), master(bed + fx))


if __name__ == '__main__':
    main()
