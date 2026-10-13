#!/usr/bin/env python3
"""
Procedural soundtrack for the ClassIn showreel — every sound is synthesized here,
so the audio is original and royalty-free.

Sound direction: warm and weighty rather than bright and clicky.
  music  deep round kick, warm snare (plate), soft shaker instead of hi-hats, sub bass,
         felt piano ostinatos and string pads instead of saw / square arps
  sfx    soft booms, dark whooshes, reverse swells, felt-mallet taps and warm bells —
         no beeps, buzzers, ticks, typing or glitch noise
  master gentle high-shelf cut + low-shelf lift, look-ahead limiter, about -14 LUFS / -1 dBFS

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
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = json.load(open(os.path.join(ROOT, 'src', 'audio', 'soundtrack.json'), encoding='utf-8'))
SR = 48000
FPS = SPEC['fps']
SPF = SR // FPS
TOTAL = SPEC['durationInFrames'] * SPF
M = SPEC['music']
BEAT = M['beatFrames'] * SPF  # samples per beat
EIGHTH, SIXTEENTH = BEAT // 2, BEAT // 4
rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- helpers
def fr(frame):
    return int(round(frame * SPF))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def sweep_filter(x, cutoffs, kind='low', block=256, q_order=2):
    """Time-varying filter: cutoff array (per sample) applied block-wise."""
    out = np.zeros_like(x)
    for i in range(0, len(x), block):
        c = float(np.clip(cutoffs[min(i + block // 2, len(x) - 1)], 40, SR / 2 - 200))
        if kind == 'band':
            sos = butter(q_order, [c * 0.7, min(c * 1.4, SR / 2 - 200)], 'band', fs=SR, output='sos')
        else:
            sos = butter(q_order, c, kind, fs=SR, output='sos')
        out[i:i + block] = sosfilt(sos, x[i:i + block])
    return out


def fade(x, a=0.003, r=0.01):
    n = x.shape[-1]
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e = np.ones(n)
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def norm(x, peak=0.89):
    m = np.max(np.abs(x))
    return x if m == 0 else x * (peak / m)


def stereo(x, pan=0.0):
    """Constant-power pan of a mono signal → (2, n)."""
    a = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def autopan(x, start=-0.6, end=0.6):
    pan = np.linspace(start, end, len(x))
    a = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def add(buf, x, start, gain=1.0, pan=0.0):
    if x.ndim == 1:
        x = stereo(x, pan)
    if start < 0:
        x = x[:, -start:]
        start = 0
    end = min(buf.shape[1], start + x.shape[1])
    if end > start:
        buf[:, start:end] += x[:, : end - start] * gain


def noise(n):
    return rng.standard_normal(n)


def glide(f, n=None):
    """Phase of a (possibly time-varying) frequency → sin()."""
    f = np.asarray(f, dtype=float)
    if f.ndim == 0:
        return np.sin(2 * np.pi * f * tt(n))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


IR_CACHE = {}


def reverb(x, rt=1.6, wet=0.3, pre=0.015, damp=4500, width=1.0):
    """Stereo convolution reverb with a synthetic, damped noise impulse response."""
    key = (rt, pre, damp)
    if key not in IR_CACHE:
        n = int(rt * SR * 1.1)
        t = tt(n)
        decay = np.exp(-6.9 * t / rt)
        irs = []
        for _ in range(2):
            nz = rng.standard_normal(n)
            bright, dark = lp(nz, damp), lp(nz, damp / 4)
            mix = np.clip(t / rt, 0, 1)
            ir = (bright * (1 - mix) + dark * mix) * decay
            ir = np.concatenate([np.zeros(int(pre * SR)), ir])
            irs.append(ir / np.sqrt(np.sum(ir ** 2)))
        IR_CACHE[key] = irs
    irs = IR_CACHE[key]
    if x.ndim == 1:
        x = np.vstack([x, x])
    mono = x.mean(axis=0)
    wl = fftconvolve(mono, irs[0])[: x.shape[1]]
    wr = fftconvolve(mono, irs[1])[: x.shape[1]]
    mid, side = (wl + wr) / 2, (wl - wr) / 2 * width
    return x * (1 - wet * 0.35) + np.vstack([mid + side, mid - side]) * wet


def saturate(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def each(x, fn):
    """Apply a mono filter to each channel of a stereo signal."""
    return np.vstack([fn(x[0]), fn(x[1])]) if x.ndim == 2 else fn(x)


# ---------------------------------------------------------------- instruments
def kick(punch=1.0, dur=0.55):
    """Deep, round kick: long sub body, felt-beater knock instead of a bright click."""
    n = int(dur * SR)
    t = tt(n)
    f = 50 + 100 * np.exp(-t * 30) + 25 * np.exp(-t * 7)
    body = glide(f) * (0.86 * np.exp(-t * 7) + 0.14 * np.exp(-t * 3))
    knock = lp(noise(n), 1200) * np.exp(-t * 140) * 0.3
    return fade(saturate((body + knock) * punch, 1.5) * 0.95, 0.0006, 0.04)


def snare(dur=0.5):
    """Warm snare: pitched body + band-limited wires (no fizz above ~4 kHz)."""
    n = int(dur * SR)
    t = tt(n)
    body = glide(180 + 50 * np.exp(-t * 45)) * np.exp(-t * 20)
    ring = np.sin(2 * np.pi * 330 * t) * np.exp(-t * 28) * 0.25
    wires = bp(noise(n), 300, 6000) * np.exp(-t * 15) * 0.8
    return fade(saturate(body * 0.8 + ring + wires, 1.3) * 0.7, 0.0006, 0.04)


def clap(dur=0.3):
    """Soft layered clap with the top end rolled off (doubles the snare in the brighter chapters)."""
    n = int(dur * SR)
    t = tt(n)
    env = np.zeros(n)
    for k, off in enumerate([0.0, 0.008, 0.017]):
        s = int(off * SR)
        env[s:] += np.exp(-t[: n - s] * (150 if k < 2 else 24)) * (0.7 if k < 2 else 1.0)
    return fade(bp(noise(n), 700, 3600) * env * 0.55)


def shaker(dur=0.1):
    """Soft shaker: rounded attack, mid-high band only — replaces the hi-hats."""
    n = int(dur * SR)
    t = tt(n)
    env = np.minimum(1, t / 0.014) * np.exp(-t * 40)
    return fade(bp(noise(n), 2500, 7500) * env * 0.4, 0.001, 0.01)


def tom(f0=100, dur=0.6):
    n = int(dur * SR)
    t = tt(n)
    body = glide(f0 * (1 + 0.45 * np.exp(-t * 28))) * np.exp(-t * 6.5)
    skin = lp(noise(n), 1600) * np.exp(-t * 40) * 0.35
    return fade(saturate(body + skin, 1.3) * 0.8, 0.0006, 0.05)


def crash(dur=2.4):
    """Dark, distant cymbal swell for section downbeats."""
    n = int(dur * SR)
    t = tt(n)
    x = bp(noise(n), 1800, 9000) * np.exp(-t * 2.2) * np.minimum(1, t / 0.012)
    return lp(x, 8000) * 0.3


def bass(freq, dur, drive=1.3, bright=1.0):
    """Warm sub bass: sine + a little 2nd/3rd harmonic so it reads on small speakers."""
    n = int(dur * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * freq * t) + 0.32 * bright * np.sin(4 * np.pi * freq * t) + 0.1 * bright * np.sin(6 * np.pi * freq * t)
    env = np.minimum(1, t / 0.006) * np.clip((dur - t) / 0.05, 0, 1)
    return lp(saturate(x * env * 0.8, drive), 700)


def piano(freq, dur=1.6, vel=1.0, bright=0.6):
    """Felt piano: stretched partials that decay faster up the series, soft hammer, rolled-off top."""
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    for k in range(1, 14):
        fk = freq * k * np.sqrt(1 + 0.00035 * k * k)
        if fk > 9000:
            break
        amp = (1 / k ** 1.3) * (0.35 + 0.65 * bright) ** (k - 1)
        x += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t * (1.6 + 1.1 * k))
    x += 0.5 * np.sin(2 * np.pi * freq * 1.0012 * t) * np.exp(-t * 2.0)  # second string, a hair sharp
    hammer = lp(noise(n), 1500) * np.exp(-t * 110) * 0.06
    x = (x + hammer) * np.minimum(1, t / 0.005) * vel
    return fade(lp(x, 2600 + 2600 * bright), 0.001, 0.12) * 0.5


def strings(midis, dur, attack=0.45, release=0.7, cutoff=1900, bright=12, vib=0.004):
    """Warm string-section pad: three detuned voices per note, slow vibrato, rolled-off top."""
    n = int(dur * SR)
    t = tt(n)
    L, R = np.zeros(n), np.zeros(n)
    for m in midis:
        for d, side in ((-0.09, 0), (0.0, 2), (0.09, 1)):
            f0 = mtof(m + d)
            inst = f0 * (1 + vib * np.sin(2 * np.pi * rng.uniform(4.6, 5.6) * t + rng.uniform(0, 2 * np.pi)))
            ph = 2 * np.pi * np.cumsum(inst) / SR
            v = np.zeros(n)
            for k in range(1, bright + 1):
                if f0 * k > min(cutoff * 2.5, SR / 2 - 500):
                    break
                v += np.sin(k * ph + rng.uniform(0, 2 * np.pi)) / k ** 1.3
            if side in (0, 2):
                L += v
            if side in (1, 2):
                R += v
    env = np.minimum(1, t / attack) * np.clip((dur - t) / release, 0, 1)
    out = np.vstack([lp(L, cutoff), lp(R, cutoff)]) * env * (0.2 / len(midis))
    return each(out, lambda c: hp(c, 70))


def cello(freq, dur=0.32, vel=1.0):
    """Short low-string note for ostinatos: bowed attack, quick release."""
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    for k in range(1, 12):
        x += np.sin(2 * np.pi * freq * k * t + rng.uniform(0, 2 * np.pi)) / k * np.exp(-t * (3 + 0.7 * k))
    env = np.minimum(1, t / 0.02) * np.exp(-t * 4.5)
    return fade(lp(x * env, 1400) * 0.45 * vel, 0.002, 0.04)


def marimba(freq, dur=0.6, bright=0.6):
    """Soft wooden mallet: inharmonic bar partials (1 : 3.93 : 9.24), a gentle felt click."""
    n = int(dur * SR)
    t = tt(n)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 6.5)
         + 0.22 * bright * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t * 22)
         + 0.05 * bright * np.sin(2 * np.pi * freq * 9.24 * t) * np.exp(-t * 40))
    click = lp(noise(n), 2400) * np.exp(-t * 280) * 0.1
    return fade(lp(x + click, 4500) * 0.6, 0.0015, 0.03)


def bell(freqs, dur=1.6, spacing=0.06, index=1.1, decay=2.6):
    """Warm FM bell (low index, 2:1 ratio) — a soft glassy chime without the clang."""
    n = int(dur * SR)
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        s = int(i * spacing * SR)
        t = tt(n - s)
        mod = np.sin(2 * np.pi * f * 2 * t) * index * np.exp(-t * 5)
        out[s:] += np.sin(2 * np.pi * f * t + mod) * np.exp(-t * decay) * (1 - i * 0.1) * np.minimum(1, t / 0.003)
    return lp(out, 5500)


# ---------------------------------------------------------------- music
CHORDS = {  # name → (bass midi, close voicing around C4–C5)
    'Dm': (38, [62, 65, 69, 74]),
    'Bb': (34, [58, 62, 65, 70]),
    'F': (41, [60, 65, 69, 72]),
    'C': (36, [60, 64, 67, 72]),
    'Gm': (31, [62, 67, 70, 74]),
    'A': (33, [61, 64, 69, 73]),
    'D': (38, [62, 66, 69, 74]),
}

STYLES = {
    # groove · bass · piano figure per chapter
    'drive': dict(kick='four', clap=False, shaker='eighths', bass='eighths', piano='arp8', reg=0, pad_cut=2600, pad_att=0.35, pad_gain=0.9),
    'secure': dict(kick='two', clap=False, shaker='sixteenths', bass='held', piano='pulse', reg=-12, pad_cut=1900, pad_att=0.2, pad_gain=0.8),
    'ai': dict(kick='four', clap=True, shaker='sixteenths', bass='octaves', piano='arp16', reg=0, pad_cut=2800, pad_att=0.1, pad_gain=0.85),
    'lift': dict(kick='four', clap=True, shaker='eighths', bass='eighths', piano='arp8', reg=12, pad_cut=3400, pad_att=0.08, pad_gain=0.95),
}
ARP8 = [0, 2, 1, 2]
ARP16 = [0, 2, 1, 3, 2, 1, 0, 2]


def expand_chords(chords, n_beats):
    per_beat = []
    for name, beats in chords:
        per_beat += [name] * beats
    return [per_beat[min(i, len(per_beat) - 1)] for i in range(n_beats)]


def chord_runs(per_beat):
    """[(first_beat, n_beats, name)] for each run of the same chord."""
    runs, b = [], 0
    while b < len(per_beat):
        run = 1
        while b + run < len(per_beat) and per_beat[b + run] == per_beat[b]:
            run += 1
        runs.append((b, run, per_beat[b]))
        b += run
    return runs


def pad_voicing(name, high=False):
    root, tones = CHORDS[name]
    notes = [root + 12, root + 19, tones[0], tones[1], tones[2]]
    return notes + ([tones[3] + 12] if high else [])


def build_intro(mus, drums, synth):
    """0 → impact: dark string drone, a felt-piano motif falling, heartbeat kicks and a cello
    ostinato that tightens from 8ths to 16ths into the drop."""
    imp = fr(M['intro']['to'])
    dur = imp / SR + 0.6
    add(mus, strings([38, 45, 50, 53], dur, attack=1.2, release=0.5, cutoff=1300, bright=8), 0, 1.0)
    add(mus, np.sin(2 * np.pi * mtof(38) * tt(imp)) * np.minimum(1, tt(imp) / 1.2) * 0.12, 0)
    for k, m in enumerate(M['intro']['motif']):
        add(synth, reverb(piano(mtof(m), 1.8, 0.55, 0.4), 2.2, 0.4), imp - (4 - k) * BEAT, 0.55, pan=(-0.2 if k % 2 else 0.2))
    for k in range(1, 5):
        add(drums, lp(kick(0.7), 500), imp - k * BEAT, 0.35 + 0.1 * (4 - k))
    start = imp - 3 * BEAT
    positions = [start + j * EIGHTH for j in range(4)] + [imp - BEAT + j * SIXTEENTH for j in range(4)]
    for j, p in enumerate(positions):
        m = 38 if j % 3 else 33
        add(synth, cello(mtof(m), 0.28, 0.5 + 0.06 * j), p, 0.75, pan=(-0.25 if j % 2 else 0.25))


def build_groove(sec, synth, drums, kicks):
    st = STYLES[sec['style']]
    start, end = fr(sec['from']), fr(sec['to'])
    n_beats = int(np.ceil((end - start) / BEAT))
    per_beat = expand_chords(sec['chords'], n_beats)

    # string pads: one per chord change
    for b, run, name in chord_runs(per_beat):
        dur = min(run * BEAT, end - (start + b * BEAT)) / SR + 0.5
        pad = strings(pad_voicing(name, sec['style'] == 'lift'), dur, attack=st['pad_att'], release=0.6, cutoff=st['pad_cut'])
        add(synth, pad, start + b * BEAT, st['pad_gain'])
        if st['bass'] == 'held':
            root, _ = CHORDS[name]
            add(synth, bass(mtof(root), dur - 0.4, 1.2), start + b * BEAT, 0.45)

    for b in range(n_beats):
        bpos = start + b * BEAT
        root, tones = CHORDS[per_beat[b]]
        # drums
        if st['kick'] == 'four' or b % 2 == 0:
            add(drums, kick(1.0), bpos, 0.82)
            kicks.append(bpos)
        if st['kick'] == 'two' and b % 2 == 1 and bpos + 3 * SIXTEENTH < end:
            add(drums, kick(0.6), bpos + 3 * SIXTEENTH, 0.35)
        if b % 2 == 1:
            add(drums, reverb(snare(), 1.4 if st['kick'] == 'two' else 1.1, 0.32, damp=4000), bpos, 0.55)
            if st['clap']:
                add(drums, reverb(clap(), 1.0, 0.25, damp=4000), bpos, 0.28)
        steps = 2 if st['shaker'] == 'eighths' else 4
        for s in range(steps):
            sp = bpos + s * (BEAT // steps)
            if sp >= end:
                break
            vel = ([0.8, 0.5] if steps == 2 else [0.6, 0.26, 0.45, 0.26])[s]
            add(drums, shaker(), sp, vel * (0.7 if st['kick'] == 'two' else 1.0), pan=0.3)
        # bass
        if st['bass'] == 'eighths':
            for e in range(2):
                ep = bpos + e * EIGHTH
                if ep < end:
                    add(synth, bass(mtof(root), EIGHTH / SR * 0.92, 1.4), ep, 0.32 if e == 0 else 0.42)
        elif st['bass'] == 'octaves':
            for e in range(2):
                ep = bpos + e * EIGHTH
                if ep < end:
                    add(synth, bass(mtof(root + 12 * e), EIGHTH / SR * 0.92, 1.5), ep, 0.38)
        elif st['bass'] == 'held':
            for e in range(2):  # a quiet 8th pulse an octave up keeps the half-time moving
                ep = bpos + e * EIGHTH
                if ep < end:
                    add(synth, bass(mtof(root + 12), EIGHTH / SR * 0.6, 1.2, 0.6), ep, 0.16)
        # piano figure
        voicing = [m + st['reg'] for m in tones]
        if st['piano'] in ('arp8', 'arp16'):
            per = 2 if st['piano'] == 'arp8' else 4
            pattern = ARP8 if per == 2 else ARP16
            for s in range(per):
                sp = bpos + s * (BEAT // per)
                if sp >= end:
                    break
                step = b * per + s
                note = voicing[pattern[step % len(pattern)]]
                vel = (0.75 if s == 0 else 0.55) * (0.85 if per == 4 else 1.0)
                add(synth, piano(mtof(note), 0.9, vel, 0.8), sp, 0.5, pan=(-0.35 if step % 2 else 0.35))
        elif st['piano'] == 'pulse':
            for e in range(2):
                ep = bpos + e * EIGHTH
                if ep < end:
                    for m in (voicing[0], voicing[2]):
                        add(synth, piano(mtof(m), 0.4, 0.45 if e else 0.6, 0.45), ep, 0.3)
        # AI chapter: a soft bell on each chord change for a little sparkle
        if sec['style'] == 'ai' and (b == 0 or per_beat[b] != per_beat[b - 1]):
            add(synth, reverb(bell([mtof(tones[2] + 12), mtof(tones[0] + 24)], 1.6, 0.07, 0.9), 1.8, 0.4), bpos, 0.12)


def build_variation(sec, synth, drums):
    """The interlude: same harmony world, different treatment — dry soft marimba, light percussion."""
    start, end = fr(sec['from']), fr(sec['to'])
    n_beats = int(np.ceil((end - start) / BEAT))
    per_beat = expand_chords(sec['chords'], n_beats)
    for b, run, name in chord_runs(per_beat):
        _, tones = CHORDS[name]
        add(synth, strings(tones[:3] + [tones[0] - 12], run * BEAT / SR + 0.3, attack=0.05, release=0.3, cutoff=2600, bright=10), start + b * BEAT, 0.5)
    for i, f in enumerate(sec['notes']):  # one mallet note per cell stamp on screen
        m = MARIMBA_RUN[i % len(MARIMBA_RUN)]
        add(synth, marimba(mtof(m)), fr(f), 0.55, pan=(-0.35 if i % 2 else 0.35))
        add(synth, marimba(mtof(m - 12), 0.45, 0.4), fr(f), 0.22)
    for f in sec['stabs']:  # lightly strummed chord on each stamped word
        beat = min(n_beats - 1, (fr(f) - start) // BEAT)
        _, tones = CHORDS[per_beat[beat]]
        for k, m in enumerate(tones[:3]):
            add(synth, marimba(mtof(m + 12), 0.5), fr(f) + k * 60, 0.3, pan=(k - 1) * 0.4)
    for i, (f, m) in enumerate(sec.get('pickup', [])):
        add(synth, marimba(mtof(m), 0.45), fr(f), 0.42, pan=(0.3 if i % 2 else -0.3))
    for b in range(n_beats):
        bpos = start + b * BEAT
        if b % 2 == 0:
            add(drums, lp(kick(0.75), 700), bpos, 0.6)
        else:
            add(drums, lp(clap(0.14), 2600), bpos, 0.4)
        for s in range(4):
            sp = bpos + s * SIXTEENTH
            if sp < end:
                add(drums, shaker(0.07), sp, [0.22, 0.1, 0.16, 0.1][s], pan=-0.25)


MARIMBA_RUN = [65, 69, 72, 74, 77, 81, 84, 89]  # F major pentatonic climb, one note per cell stamp


def build_music():
    mus = np.zeros((2, TOTAL))
    drums = np.zeros((2, TOTAL))
    synth = np.zeros((2, TOTAL))
    kicks = []  # kick sample positions (for sidechain)

    build_intro(mus, drums, synth)
    for sec in M['sections']:
        if sec['style'] == 'variation':
            build_variation(sec, synth, drums)
        else:
            build_groove(sec, synth, drums, kicks)

    # ---- tom rolls into section changes (heavier than snare rolls)
    for f0, f1 in M['fills']:
        p0, p1 = fr(f0), fr(f1)
        p, k = p0, 0
        while p < p1:
            prog = (p - p0) / (p1 - p0)
            add(drums, tom(140 - 60 * prog), p, 0.3 + 0.4 * prog, pan=(-0.3 if k % 2 else 0.3))
            p += SIXTEENTH
            k += 1

    for f in M['crashes']:
        add(drums, reverb(crash(), 1.8, 0.35), fr(f), 0.9)

    # ---- breaks (the bridge into the AI hit): held chord + piano plinks gathering speed
    for brk in M['breaks']:
        br0, br1 = fr(brk['from']), fr(brk['to'])
        _, tones = CHORDS[brk['chord']]
        add(mus, strings(pad_voicing(brk['chord']), (br1 - br0) / SR + 0.4, attack=0.3, release=0.2, cutoff=2200), br0, 1.5)
        p, k = br0 + SIXTEENTH, 0
        while p < br1 - SIXTEENTH // 2:
            m = tones[k % 4] + 12 * (k // 4 % 2)
            add(mus, reverb(piano(mtof(m), 0.7, 0.4 + 0.3 * (p - br0) / (br1 - br0), 0.6), 1.6, 0.35), p, 0.5, pan=np.sin(k * 1.7) * 0.5)
            p += int(EIGHTH * (0.85 ** (k / 2)))
            k += 1

    # ---- outro: tension chord + rising piano arpeggio, then the final D major chord on the logo
    o0, final = fr(M['outro']['from']), fr(M['outro']['hit'])
    _, tension = CHORDS[M['outro']['chord']]
    add(synth, strings(pad_voicing(M['outro']['chord']), (final - o0) / SR + 0.15, attack=0.15, release=0.1), o0, 0.9)
    for j in range((final - o0) // SIXTEENTH):
        m = tension[j % 4] + (12 if j >= 4 else 0)
        add(synth, piano(mtof(m), 0.5, 0.5 + 0.1 * j, 0.6), o0 + j * SIXTEENTH, 0.32, pan=(-0.4 if j % 2 else 0.4))
    tail = TOTAL - final
    add(synth, strings([50, 57, 62, 66, 69, 74, 78], tail / SR, attack=0.04, release=1.4, cutoff=2800, bright=14), final, 1.5)
    for k, m in enumerate([50, 57, 62, 66, 69, 74]):
        add(synth, reverb(piano(mtof(m), 2.6, 0.8, 0.6), 2.4, 0.35), final + k * 90, 0.4)
    add(synth, bass(mtof(26), 2.2, 1.2), final, 0.75)
    add(drums, kick(1.3, 0.9), final, 1.0)
    add(drums, reverb(crash(3.0), 2.4, 0.4), final, 0.8)
    kicks.append(final)

    # ---- sidechain pump (synth bus breathes under every kick)
    sc = np.ones(TOTAL)
    for kp in kicks:
        n = min(int(0.3 * SR), TOTAL - kp)
        sc[kp:kp + n] = np.minimum(sc[kp:kp + n], 1 - 0.38 * np.exp(-tt(n) * 12))
    synth *= sc

    # duck everything under the big impacts (SFX carry those moments)
    duck = np.ones(TOTAL)
    for f, depth in M['ducks']:
        p = fr(f)
        n = min(int(0.6 * SR), TOTAL - p)
        duck[p:p + n] = np.minimum(duck[p:p + n], 1 - depth * np.exp(-tt(n) * 5))

    # gate the groove (incl. reverb tails) during breaks
    gate = np.ones(TOTAL)
    ramp = int(0.03 * SR)
    for brk in M['breaks']:
        g0, g1 = fr(brk['from']), fr(brk['to'])
        gate[g0:g0 + ramp] = np.minimum(gate[g0:g0 + ramp], np.linspace(1, 0.06, ramp))
        gate[g0 + ramp:g1] = 0.06
    buses = {'synth': reverb(synth, 1.6, 0.24, damp=3800), 'drums': reverb(drums, 0.8, 0.1, damp=5000), 'beds': reverb(mus, 2.6, 0.32, damp=3200)}
    print('bus rms  ' + '  '.join(f'{k} {20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12):.1f} dB' for k, v in buses.items()))
    mix = (buses['synth'] + buses['drums']) * gate + buses['beds']
    mix *= duck
    mix = each(mix, lambda c: hp(c, 28))
    fl = int(0.6 * SR)
    mix[:, -fl:] *= np.linspace(1, 0, fl) ** 1.5
    return norm(saturate(mix * 0.9, 1.1), 0.7)


# ---------------------------------------------------------------- sfx
def sfx_boom(size=1.0):
    """Cinematic impact: sub drop + chest thump + low tom, long dark tail — no metallic ring."""
    dur = 2.4 + 0.6 * size
    n = int(dur * SR)
    t = tt(n)
    sub = glide(32 + 58 * np.exp(-t * 7)) * np.exp(-t * (1.7 - 0.4 * size))
    thump = lp(noise(n), 380) * np.exp(-t * 16) * 0.9
    body = glide(85 + 40 * np.exp(-t * 25)) * np.exp(-t * 9) * 0.6
    air = lp(noise(n), 2600) * np.exp(-t * 3.5) * 0.06 * size
    x = saturate(sub * 1.2 + thump + body, 1.4) + air
    return norm(reverb(x, 2.4 + 0.6 * size, 0.36, damp=2400), 0.95)


def sfx_thud():
    """Weighty text slam."""
    n = int(1.0 * SR)
    t = tt(n)
    x = glide(55 + 70 * np.exp(-t * 22)) * np.exp(-t * 7) + lp(noise(n), 900) * np.exp(-t * 28) * 0.6
    return norm(reverb(saturate(x, 1.3), 1.0, 0.22, damp=3000))


def sfx_swell(dur, chord=(50, 57, 62, 65, 69), peak_cut=2600):
    """Reverse swell / riser: a string chord and darkened air rising into a cut-off — no bright hiss."""
    n = int(dur * SR)
    t = tt(n)
    ramp = (t / dur) ** 2.2
    air = sweep_filter(noise(n), np.geomspace(250, peak_cut, n), 'low') * ramp * 0.6
    pad = strings(list(chord), dur, attack=dur * 0.9, release=0.01, cutoff=peak_cut, bright=10)
    pad = pad * ramp
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(35, 70, n)) / SR) * ramp ** 1.5 * 0.5
    x = stereo(air + sub) + pad * 3
    x *= np.minimum(1, (dur - t) / 0.006)
    return norm(reverb(x, 1.2, 0.18, damp=3000))


def sfx_swish(dur=0.45, peak_at=0.55, lo=200, hi=3200):
    """Soft, dark whoosh: band sweep up and back down plus a low air body, panned across."""
    n = int(dur * SR)
    u = tt(n) / dur
    shape = np.where(u < peak_at, (u / peak_at) ** 2, np.exp(-(u - peak_at) * 8))
    cut = lo + (hi - lo) * np.where(u < peak_at, (u / peak_at) ** 1.4, 1 - (u - peak_at) / (1 - peak_at) * 0.75)
    x = sweep_filter(noise(n), cut, 'band') * shape + lp(noise(n), 500) * shape * 0.35
    return norm(reverb(autopan(x, -0.7, 0.7), 0.8, 0.18, damp=3200))


def sfx_open():
    """Opening 'whoom': a low swell blooming into a soft open-fifth bell."""
    n = int(1.6 * SR)
    t = tt(n)
    air = sweep_filter(noise(n), np.concatenate([np.geomspace(200, 1400, n // 3), np.geomspace(1400, 300, n - n // 3)]), 'low') * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) * 0.5
    low = np.sin(2 * np.pi * 55 * t) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) * 0.6
    chime = bell([mtof(74), mtof(81)], 1.6, 0.05, 0.8, 2.2) * 0.25
    return norm(reverb(stereo(air + low + chime), 2.0, 0.3, damp=3500))


def sfx_tap(m, dur=0.4):
    """Felt-mallet UI tap, pitched in key — replaces blips, pops, ticks and toggles."""
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 14)
         + 0.18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 26)
         + 0.06 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 40))
    knock = lp(noise(n), 1400) * np.exp(-t * 250) * 0.08
    return norm(reverb(fade(x + knock, 0.0015, 0.04), 0.7, 0.18, damp=3500))


def sfx_bell(notes, dur=1.8, spacing=0.07):
    return norm(reverb(bell([mtof(m) for m in notes], dur, spacing), 1.8, 0.32, damp=4000))


def sfx_lock():
    """Soft vault 'clunk': low thunk + muted latch, no metallic ring."""
    n = int(0.6 * SR)
    t = tt(n)
    thunk = glide(120 + 60 * np.exp(-t * 45)) * np.exp(-t * 26)
    latch = bp(noise(n), 500, 2200) * np.exp(-t * 140) * 0.5
    second = np.zeros(n)
    s0 = int(0.035 * SR)
    second[s0:] = bp(noise(n - s0), 400, 1800) * np.exp(-tt(n - s0) * 160) * 0.45
    low = lp(noise(n), 300) * np.exp(-t * 35) * 0.4
    return norm(reverb(saturate(thunk + latch + second + low, 1.2), 0.7, 0.2, damp=3000))


def sfx_deny():
    """Access blocked: two muted, falling mallet notes (no buzzer)."""
    n = int(0.6 * SR)
    out = np.zeros(n)
    for s0, m in ((0.0, 64), (0.13, 60)):
        a0 = int(s0 * SR)
        tb = tt(n - a0)
        f = mtof(m)
        out[a0:] += (np.sin(2 * np.pi * f * tb) + 0.2 * np.sin(4 * np.pi * f * tb)) * np.exp(-tb * 16)
    return norm(reverb(lp(out, 900), 0.6, 0.15, damp=2500))


def sfx_rec():
    """Recording starts: two soft rising notes."""
    n = int(0.7 * SR)
    out = np.zeros(n)
    for s0, m in ((0.0, 76), (0.1, 81)):
        a0 = int(s0 * SR)
        tb = tt(n - a0)
        f = mtof(m)
        out[a0:] += (np.sin(2 * np.pi * f * tb) + 0.15 * np.sin(4 * np.pi * f * tb)) * np.exp(-tb * 9) * np.minimum(1, tb / 0.004)
    return norm(reverb(lp(out, 3500), 0.9, 0.22, damp=3500))


def sfx_stack():
    """Data blocks settling: wooden tocks climbing a pentatonic scale."""
    n = int(1.0 * SR)
    out = np.zeros(n)
    for k, m in enumerate([57, 60, 62, 64, 67, 69, 72]):
        s0 = int(k * 0.085 * SR)
        mlen = int(0.18 * SR)
        tb = tt(mlen)
        f = mtof(m)
        tock = (np.sin(2 * np.pi * f * tb) + 0.3 * np.sin(2 * np.pi * f * 2.7 * tb) * np.exp(-tb * 30)) * np.exp(-tb * 22)
        out[s0:s0 + mlen] += tock[: n - s0] * (0.6 + 0.05 * k)
    return norm(reverb(lp(out, 3000), 0.7, 0.18, damp=3000))


def sfx_strike():
    """Strikethrough: a short, soft downward swish."""
    n = int(0.26 * SR)
    t = tt(n)
    x = sweep_filter(noise(n), np.geomspace(2200, 450, n), 'band') * np.minimum(1, t / 0.012) * np.exp(-t * 12)
    return norm(reverb(x, 0.5, 0.15, damp=3000))


def sfx_rise(m):
    """One step of the rising check ladder: warm mallet + bell."""
    n = int(0.9 * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8) * 0.8) * np.exp(-t * 5)
         + 0.15 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12))
    return norm(reverb(fade(lp(x, 4500), 0.002, 0.05), 1.0, 0.25, damp=3500))


def sfx_boot():
    """Devices powering on: a warm glide and a soft open-fifth bloom."""
    n = int(1.1 * SR)
    t = tt(n)
    glide_up = glide(np.geomspace(130, 290, n)) * np.minimum(1, t / 0.2) * np.exp(-np.maximum(0, t - 0.3) * 5) * 0.4
    bloom = bell([mtof(62), mtof(69), mtof(74)], 1.1, 0.04, 0.7, 3.0) * np.clip((t - 0.18) / 0.06, 0, 1) * 0.35
    return norm(reverb(lp(glide_up, 1500) + bloom, 1.2, 0.3, damp=3500))


def sfx_paper_cut():
    """Hard cut into the paper interlude: a page 'thwip' with a low tap under it."""
    n = int(0.35 * SR)
    t = tt(n)
    page = bp(noise(n), 700, 3500) * np.minimum(1, t / 0.008) * np.exp(-t * 30)
    tap = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 28) * 0.6
    return norm(reverb(page + tap, 0.5, 0.12, damp=3000))


def sfx_paper():
    """Sheets folding into the header band."""
    n = int(0.32 * SR)
    u = tt(n) / 0.32
    x = sweep_filter(noise(n), np.geomspace(900, 3200, n), 'band') * np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    return norm(lp(x, 3500))


def sfx_stamp():
    """Rubber stamp: low thump + a dull slap."""
    n = int(0.7 * SR)
    t = tt(n)
    thump = glide(42 + 40 * np.exp(-t * 30)) * np.exp(-t * 14)
    slap = lp(noise(n), 2000) * np.exp(-t * 60) * 0.6
    knock = np.sin(2 * np.pi * 300 * t) * np.exp(-t * 40) * 0.2
    return norm(reverb(saturate(thump + slap + knock, 1.4), 0.7, 0.18, damp=2800))


def sfx_marker(dur=0.7):
    """Marker on the whiteboard: muted friction with stroke modulation."""
    n = int(dur * SR)
    t = tt(n)
    mod = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 6.5 * t + np.sin(2 * np.pi * 1.7 * t)))
    x = bp(noise(n), 900, 3000) * mod * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1)
    return norm(x * 0.7)


def sfx_shimmer(dur=2.6):
    """Logo bloom: warm bell arpeggio over a string swell (D major), soft air."""
    n = int(dur * SR)
    out = np.zeros((2, n))
    for i, m in enumerate([62, 66, 69, 74, 78, 81]):
        s0 = int(i * 0.07 * SR)
        add(out, bell([mtof(m)], dur - i * 0.07, 0, 0.9, 1.8)[: n - s0], s0, 0.5, pan=np.sin(i * 1.3) * 0.6)
    add(out, strings([62, 69, 74], dur, attack=0.05, release=1.2, cutoff=2400) * 2.5, 0)
    add(out, lp(noise(n), 4000) * np.exp(-tt(n) * 2.5) * 0.04, 0)
    return norm(reverb(out, 2.6, 0.4, damp=3500))


def build_sfx():
    beat_s = BEAT / SR
    return {
        'boom': sfx_boom(1.0),
        'boom-big': sfx_boom(1.6),
        'boom-soft': sfx_boom(0.5),
        'thud': sfx_thud(),
        'open': sfx_open(),
        'swell': sfx_swell(28 / FPS),
        'swell-bridge': sfx_swell(28 / FPS, (45, 52, 57, 61, 64), 3000),
        'swell-long': sfx_swell(20 / FPS, (45, 52, 57, 61), 2800),
        'swish': sfx_swish(0.45),
        'swish-fast': sfx_swish(0.3, 0.7, 260, 3400),
        'whoosh': sfx_swish(0.6, 0.6, 160, 2800),
        'tap-1': sfx_tap(69),
        'tap-2': sfx_tap(72),
        'tap-3': sfx_tap(74),
        'tap-4': sfx_tap(77),
        'bell': sfx_bell([74, 81], 1.8, 0.06),
        'bell-3': sfx_bell([77, 81, 84], 2.0, beat_s / 4),
        'lock': sfx_lock(),
        'deny': sfx_deny(),
        'rec': sfx_rec(),
        'stack': sfx_stack(),
        'strike': sfx_strike(),
        'rise-1': sfx_rise(65),
        'rise-2': sfx_rise(69),
        'rise-3': sfx_rise(72),
        'rise-4': sfx_rise(77),
        'boot': sfx_boot(),
        'marker': sfx_marker(),
        'paper-cut': sfx_paper_cut(),
        'paper': sfx_paper(),
        'stamp': sfx_stamp(),
        'shimmer': sfx_shimmer(),
    }


# ---------------------------------------------------------------- io
def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if x.ndim == 1:
        x = stereo(x)
    data = (np.clip(x, -1, 1).T * 32767).astype(np.int16)
    wavfile.write(path, SR, data)


def main():
    music = build_music()
    write(os.path.join(ROOT, 'public', 'audio', 'music.wav'), music)
    sfx = build_sfx()
    sfx_dir = os.path.join(ROOT, 'public', 'audio', 'sfx')
    os.makedirs(sfx_dir, exist_ok=True)
    for stale in os.listdir(sfx_dir):  # drop sounds that are no longer part of the palette
        if stale.endswith('.wav') and stale[:-4] not in sfx:
            os.remove(os.path.join(sfx_dir, stale))
    for name, x in sfx.items():
        write(os.path.join(sfx_dir, f'{name}.wav'), x if x.ndim == 2 else stereo(x))

    # preview mix — same placement/volumes Remotion uses
    mix = music * M['volume']
    missing = set()
    for cue in SPEC['cues']:
        x = sfx.get(cue['sfx'])
        if x is None:
            missing.add(cue['sfx'])
            continue
        add(mix, x if x.ndim == 2 else stereo(x), fr(cue['at']), cue['volume'])
    if missing:
        sys.exit(f'Unknown sfx in soundtrack.json: {sorted(missing)}')
    write(os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav'), master(mix))


def limiter(x, ceiling=0.89, window=1200):
    """Look-ahead brickwall limiter: min-hold the required gain, then smooth it."""
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    held = minimum_filter1d(need, size=window * 2, mode='nearest')
    smooth = np.convolve(held, np.ones(window) / window, mode='same')
    return x * np.minimum(smooth, need)


def tilt(x):
    """Warmth without dulling: a ~-1.5 dB high shelf above 8 kHz takes the edge off any hiss."""
    return x + hp(x, 8000) * -0.16


def master(mix, target_rms_db=-17.0):
    mix = each(mix, lambda c: tilt(hp(c, 36)))
    rms = np.sqrt(np.mean(mix ** 2))
    pre = 20 * np.log10(np.max(np.abs(mix)))
    mix = mix * 10 ** ((target_rms_db - 20 * np.log10(rms)) / 20)
    out = limiter(saturate(mix, 1.05))
    out = np.clip(out, -0.891, 0.891)  # -1 dBFS ceiling guard
    print(f'premix peak {pre:+.1f} dBFS → mastered peak {20 * np.log10(np.max(np.abs(out))):.1f} dBFS, '
          f'rms {20 * np.log10(np.sqrt(np.mean(out ** 2))):.1f} dBFS')
    return out


if __name__ == '__main__':
    main()
