#!/usr/bin/env python3
"""
Procedural soundtrack for the ClassIn showreel — every sound is synthesized here,
so the audio is original and royalty-free.

Outputs (48 kHz, 16-bit WAV):
  public/audio/music.wav        BGM locked to the video edit (128.57 BPM = 14 frames/beat)
  public/audio/sfx/<name>.wav   sound effects, placed by src/audio/soundtrack.json
  public/audio/soundtrack.wav   music + SFX premixed per soundtrack.json and mastered (limiter, -1 dBFS)

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
    n = len(x)
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


def add(buf, x, start, gain=1.0, pan=0.0):
    if x.ndim == 1:
        x = stereo(x, pan)
    if start < 0:
        x = x[:, -start:]
        start = 0
    end = min(buf.shape[1], start + x.shape[1])
    if end > start:
        buf[:, start:end] += x[:, : end - start] * gain


def additive(freq, n, harmonics, amp_fn, phase_jitter=False):
    t = tt(n)
    out = np.zeros(n)
    for k in harmonics:
        if freq * k > SR / 2 - 500:
            break
        ph = rng.uniform(0, 2 * np.pi) if phase_jitter else 0.0
        out += amp_fn(k, t) * np.sin(2 * np.pi * freq * k * t + ph)
    return out


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
            noise = rng.standard_normal(n)
            bright, dark = lp(noise, damp), lp(noise, damp / 4)
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


# ---------------------------------------------------------------- instruments
def kick(punch=1.0, dur=0.42):
    n = int(dur * SR)
    t = tt(n)
    f = 44 + 120 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(n), 1800) * np.exp(-t * 380) * 0.35
    return fade(saturate((body + click) * punch, 1.8) * 0.95, 0.0005, 0.02)


def clap(dur=0.32):
    n = int(dur * SR)
    t = tt(n)
    noise = bp(rng.standard_normal(n), 900, 7000)
    env = np.zeros(n)
    for k, off in enumerate([0.0, 0.009, 0.018]):
        s = int(off * SR)
        env[s:] += np.exp(-(t[: n - s]) * (160 if k < 2 else 22)) * (0.8 if k < 2 else 1.0)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.4
    return fade((noise * env + body) * 0.7)


def hat(open_=False, dur=None):
    dur = dur or (0.3 if open_ else 0.06)
    n = int(dur * SR)
    t = tt(n)
    x = hp(rng.standard_normal(n), 7500, 4) * np.exp(-t * (11 if open_ else 70))
    return fade(x * 0.5, 0.0005, 0.01)


def bass_note(freq, dur, drive=1.6):
    n = int(dur * SR)
    tone = additive(freq, n, range(1, 26), lambda k, t: (1 / k) * np.exp(-t * (3 + 0.9 * k)))
    sub = np.sin(2 * np.pi * freq / 2 * tt(n)) * 0.55
    return fade(saturate(tone * 0.8 + sub, drive) * 0.7, 0.004, 0.03)


def pluck(freq, dur, wave='saw', bright=1.0):
    n = int(dur * SR)
    hs = range(1, 40, 2) if wave == 'square' else range(1, 40)
    x = additive(freq, n, hs, lambda k, t: (1 / k) * np.exp(-t * (5 + 1.6 * k / bright)))
    return fade(x * 0.6, 0.002, 0.02)


def pad_chord(midis, dur, attack=0.35, release=0.6, bright=10, cutoff=2600):
    n = int(dur * SR)
    t = tt(n)
    L, R = np.zeros(n), np.zeros(n)
    for m in midis:
        for d, side in [(-0.12, 0), (0.0, 2), (0.12, 1)]:
            f = mtof(m + d)
            v = additive(f, n, range(1, bright + 1), lambda k, _t: (1 / k ** 1.25) * np.ones_like(_t), phase_jitter=True)
            if side in (0, 2):
                L += v
            if side in (1, 2):
                R += v
    env = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release).clip(0, 1)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.35 * t)
    return np.vstack([lp(L, cutoff), lp(R, cutoff)]) * env * trem * (0.22 / len(midis))


# ---------------------------------------------------------------- music
CHORDS = {  # name → (bass midi, voicing)
    'Dm': (38, [62, 65, 69]),
    'Bb': (34, [58, 62, 65]),
    'C': (36, [60, 64, 67]),
    'A': (33, [57, 61, 64]),
    'Gm': (31, [55, 58, 62]),
    'F': (41, [60, 65, 69]),
}

STYLES = {
    # drums, arp and bass flavour per chapter
    'drive': dict(kick='four', arp='saw', arp_pattern=[0, 2, 1, 2], arp_vol=0.26, bass='eighths', pad_attack=0.25, pad_cutoff=2600),
    'secure': dict(kick='half', arp='blips', arp_pattern=None, arp_vol=0.07, bass='sixteenths', pad_attack=0.15, pad_cutoff=1500),
    'ai': dict(kick='four', arp='square', arp_pattern=[0, 2, 1, 2, 0, 1], arp_vol=0.30, bass='octaves', pad_attack=0.05, pad_cutoff=2600),
    'lift': dict(kick='four', arp='bright', arp_pattern=[0, 1, 2, 3], arp_vol=0.27, bass='eighths', pad_attack=0.05, pad_cutoff=4200),
}


def expand_chords(chords, n_beats):
    per_beat = []
    for name, beats in chords:
        per_beat += [name] * beats
    return [per_beat[min(i, len(per_beat) - 1)] for i in range(n_beats)]


def build_music():
    mus = np.zeros((2, TOTAL))
    drums = np.zeros((2, TOTAL))
    synth = np.zeros((2, TOTAL))
    kicks = []  # kick sample positions (for sidechain)
    eighth, sixteenth = BEAT // 2, BEAT // 4

    # ---- intro: drone + heartbeat + accelerating clock ticks into the impact
    imp = fr(M['intro']['to'])
    n = imp
    t = tt(n)
    drone = (np.sin(2 * np.pi * mtof(26) * t) + 0.5 * np.sin(2 * np.pi * mtof(33) * t) + 0.25 * np.sin(2 * np.pi * mtof(38) * t * 1.002))
    drone *= np.minimum(1, t / 0.8) * 0.45
    add(mus, drone, 0)
    wind = sweep_filter(rng.standard_normal(n), np.geomspace(300, 2400, n), 'band') * np.linspace(0, 0.12, n)
    add(mus, wind, 0, pan=0.0)
    for k in range(1, 5):
        add(drums, lp(kick(0.6), 600), imp - k * BEAT, 0.5 * (1 - k * 0.15))
    tick_pos = [imp - j * eighth for j in range(1, 9)] + [imp - BEAT + j * sixteenth for j in (1, 3)]
    for p in tick_pos:
        add(drums, hp(hat(), 3000) * 0.9, p, 0.7, pan=0.25 if (p // eighth) % 2 else -0.25)

    # ---- grooves, one style per chapter
    for sec in M['sections']:
        if sec['style'] == 'variation':
            build_variation(sec, synth, drums)
            continue
        st = STYLES[sec['style']]
        start, end = fr(sec['from']), fr(sec['to'])
        n_beats = int(np.ceil((end - start) / BEAT))
        per_beat = expand_chords(sec['chords'], n_beats)
        # pads: one per chord change
        b = 0
        while b < n_beats:
            name = per_beat[b]
            run = 1
            while b + run < n_beats and per_beat[b + run] == name:
                run += 1
            _, tones = CHORDS[name]
            dur = min(run * BEAT, end - (start + b * BEAT)) / SR + 0.4
            voicing = tones + [tones[0] - 12] + ([tones[0] + 12] if sec['style'] == 'lift' else [])
            add(synth, pad_chord(voicing, dur, attack=st['pad_attack'], cutoff=st['pad_cutoff'], bright=14 if sec['style'] == 'lift' else 10), start + b * BEAT, 0.9 if sec['style'] != 'secure' else 0.75)
            b += run
        for b in range(n_beats):
            bpos = start + b * BEAT
            root, tones = CHORDS[per_beat[b]]
            # drums
            if st['kick'] == 'four' or b % 2 == 0:
                add(drums, kick(1.0), bpos, 0.95)
                kicks.append(bpos)
            if st['kick'] == 'half' and b % 2 == 1:
                ghost = bpos + 3 * sixteenth
                if ghost < end:
                    add(drums, kick(0.7), ghost, 0.45)
            if b % 2 == 1:
                add(drums, reverb(clap(), 1.6, 0.35) if st['kick'] == 'half' else clap(), bpos, 0.55)
            for sxt in range(4):
                sp = bpos + sxt * sixteenth
                if sp >= end:
                    break
                vel = [0.55, 0.22, 0.38, 0.22][sxt] * (0.6 if st['kick'] == 'half' else 1.0)
                if sxt == 2 and st['kick'] == 'four':
                    add(drums, hat(True, 0.18), sp, 0.32 if sec['style'] != 'lift' else 0.42, pan=0.3)
                if sxt == 2 and st['kick'] == 'half':
                    rim = bp(rng.standard_normal(int(0.03 * SR)), 1500, 5000) * np.exp(-tt(int(0.03 * SR)) * 160)
                    add(drums, rim, sp, 0.35, pan=-0.35)
                add(drums, hat(), sp, vel, pan=0.3)
                # arps
                step = b * 4 + sxt
                if st['arp'] == 'blips':
                    if random_gate(sec['from'], step):
                        f = mtof(tones[step % 3] + 24 + 12 * (step % 2))
                        add(synth, sfx_blip_raw(f, f * 1.08, 0.05), sp, st['arp_vol'], pan=rng.uniform(-0.7, 0.7))
                else:
                    pattern = st['arp_pattern']
                    pick = pattern[step % len(pattern)]
                    tone = (tones[pick] if pick < 3 else tones[0] + 12) + 12
                    if st['arp'] == 'square' and step % 5 == 3:
                        tone += 12
                    wave = 'square' if st['arp'] == 'square' else 'saw'
                    bright = {'saw': 1.3, 'square': 0.9, 'bright': 2.0}[st['arp']]
                    add(synth, pluck(mtof(tone), 0.22, wave, bright), sp, st['arp_vol'], pan=(-0.45 if sxt % 2 else 0.45))
                    if st['arp'] == 'bright':
                        add(synth, pluck(mtof(tone + 12), 0.16, 'saw', 1.6), sp, 0.09, pan=(0.6 if sxt % 2 else -0.6))
                    if st['arp'] == 'square' and sxt == 3 and b % 2:
                        add(synth, pluck(mtof(tone + 7), 0.08, 'square'), sp + sixteenth // 2, 0.18, pan=0.6)
            # bass
            if st['bass'] == 'sixteenths':
                for sxt in range(4):
                    sp = bpos + sxt * sixteenth
                    if sp >= end:
                        break
                    bn = lp(bass_note(mtof(root), sixteenth / SR * 0.85, 1.4), 520)
                    add(synth, bn, sp, 0.62 if sxt == 0 else 0.42)
            else:
                for e in range(2):
                    ep = bpos + e * eighth
                    if ep >= end:
                        break
                    octave = 12 if (st['bass'] == 'octaves' and e == 1) else 0
                    bn = bass_note(mtof(root + octave), eighth / SR * 0.95, 2.2 if st['bass'] == 'octaves' else 1.6)
                    add(synth, bn, ep, 0.55 if e else 0.4)

    # ---- snare-roll fills into section changes
    for f0, f1 in M['fills']:
        p0, p1 = fr(f0), fr(f1)
        p, k = p0, 0
        while p < p1:
            add(drums, clap(0.12), p, 0.25 + 0.5 * (p - p0) / (p1 - p0), pan=(-0.2 if k % 2 else 0.2))
            p += sixteenth if (p - p0) < (p1 - p0) / 2 else sixteenth // 2
            k += 1

    # ---- crashes on section downbeats / big moments
    crash_n = int(1.8 * SR)
    crash = reverb(hp(rng.standard_normal(crash_n), 5000) * np.exp(-tt(crash_n) * 2.6) * 0.35, 1.8, 0.4)
    for f in M['crashes']:
        add(drums, crash, fr(f))

    # ---- breaks (the bridge into the AI hit): filtered swell + held chord
    for brk in M['breaks']:
        br0, br1 = fr(brk['from']), fr(brk['to'])
        nb = br1 - br0 + int(0.2 * SR)
        swell = sweep_filter(rng.standard_normal(nb), np.geomspace(400, 9000, nb), 'band') * np.linspace(0, 0.3, nb) ** 1.5
        add(mus, swell, br0)
        _, tones = CHORDS[brk['chord']]
        add(mus, pad_chord(tones + [tones[0] + 12], (br1 - br0) / SR + 0.5, attack=0.12), br0, 0.8)

    # ---- outro: tension chord + rising arp, then the final D major chord on the logo
    o0, final = fr(M['outro']['from']), fr(M['outro']['hit'])
    _, tension = CHORDS[M['outro']['chord']]
    add(synth, pad_chord(tension + [tension[0] + 12], (final - o0) / SR + 0.2, attack=0.1), o0, 0.9)
    for j in range((final - o0) // sixteenth):
        tone = [tension[0], tension[1], tension[2], tension[0] + 12][j % 4] + 12 + (12 if j > 5 else 0)
        add(synth, pluck(mtof(tone), 0.15, 'saw', 1.1), o0 + j * sixteenth, 0.12 + 0.02 * j, pan=(-0.5 if j % 2 else 0.5))
    tail = TOTAL - final
    add(synth, pad_chord([50, 57, 62, 66, 69, 76], tail / SR, attack=0.02, release=1.4, bright=14), final, 1.6)
    add(synth, bass_note(mtof(26), 1.6, 1.3), final, 0.8)
    add(drums, kick(1.3, 0.9), final, 1.0)
    kicks.append(final)

    # ---- sidechain pump (synth bus ducks under every kick)
    sc = np.ones(TOTAL)
    for kp in kicks:
        n = min(int(0.3 * SR), TOTAL - kp)
        sc[kp:kp + n] = np.minimum(sc[kp:kp + n], 1 - 0.55 * np.exp(-tt(n) * 14))
    synth *= sc

    # duck everything under the big impacts (SFX carry those moments)
    duck = np.ones(TOTAL)
    for f, depth in M['ducks']:
        p = fr(f)
        n = min(int(0.6 * SR), TOTAL - p)
        duck[p:p + n] = np.minimum(duck[p:p + n], 1 - depth * np.exp(-tt(n) * 5))

    # hard gate on the groove (incl. reverb tails) during breaks
    gate = np.ones(TOTAL)
    ramp = int(0.03 * SR)
    for brk in M['breaks']:
        g0, g1 = fr(brk['from']), fr(brk['to'])
        gate[g0:g0 + ramp] = np.minimum(gate[g0:g0 + ramp], np.linspace(1, 0.08, ramp))
        gate[g0 + ramp:g1] = 0.08
    mix = (reverb(synth, 1.4, 0.28) + reverb(drums, 0.9, 0.12, damp=6000)) * gate + reverb(mus, 2.4, 0.35)
    mix *= duck
    mix = np.vstack([hp(mix[0], 28), hp(mix[1], 28)])
    # final fade
    fl = int(0.5 * SR)
    mix[:, -fl:] *= np.linspace(1, 0, fl) ** 1.5
    return norm(saturate(mix * 0.9, 1.15), 0.7)


MARIMBA_RUN = [65, 69, 72, 74, 77, 81, 84, 89]  # F major pentatonic climb, one note per cell stamp


def marimba(freq, dur=0.6, bright=1.0):
    """Wooden mallet tone: inharmonic bar partials (1 : 3.93 : 9.24) + mallet click."""
    n = int(dur * SR)
    t = tt(n)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 7)
         + 0.34 * bright * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t * 24)
         + 0.12 * bright * np.sin(2 * np.pi * freq * 9.24 * t) * np.exp(-t * 45))
    click = bp(rng.standard_normal(n), 1800, 6000) * np.exp(-t * 320) * 0.25
    return fade((x + click) * 0.6, 0.0008, 0.03)


def build_variation(sec, synth, drums):
    """The interlude: same harmony world, opposite treatment — dry marimba, light percussion, no pump."""
    start, end = fr(sec['from']), fr(sec['to'])
    n_beats = int(np.ceil((end - start) / BEAT))
    per_beat = expand_chords(sec['chords'], n_beats)
    b = 0
    while b < n_beats:
        name = per_beat[b]
        run = 1
        while b + run < n_beats and per_beat[b + run] == name:
            run += 1
        _, tones = CHORDS[name]
        add(synth, pad_chord(tones + [tones[0] + 12], run * BEAT / SR + 0.3, attack=0.02, cutoff=3400, bright=12), start + b * BEAT, 0.55)
        b += run
    # marimba climb — one note per cell stamp on screen
    for i, f in enumerate(sec['notes']):
        m = MARIMBA_RUN[i % len(MARIMBA_RUN)]
        add(synth, marimba(mtof(m)), fr(f), 0.55, pan=(-0.35 if i % 2 else 0.35))
        add(synth, marimba(mtof(m - 12), 0.4, 0.6), fr(f), 0.2)
    # chord stabs on the stamped statement words (lightly strummed)
    for f in sec['stabs']:
        beat = min(n_beats - 1, (fr(f) - start) // BEAT)
        _, tones = CHORDS[per_beat[beat]]
        for k, m in enumerate(tones):
            add(synth, marimba(mtof(m + 12), 0.5), fr(f) + k * 60, 0.3, pan=(k - 1) * 0.4)
    # pickup turnaround on the last beat, leading into the bridge
    for i, (f, m) in enumerate(sec.get('pickup', [])):
        add(synth, marimba(mtof(m), 0.45), fr(f), 0.42, pan=(0.3 if i % 2 else -0.3))
    # light, dry percussion: soft boom on 1 & 3, snaps on 2 & 4, shaker 16ths
    for b in range(n_beats):
        bpos = start + b * BEAT
        if b % 2 == 0:
            add(drums, lp(kick(0.75), 900), bpos, 0.6)
        else:
            add(drums, hp(clap(0.14), 1800), bpos, 0.45)
        for sxt in range(4):
            sp = bpos + sxt * (BEAT // 4)
            if sp < end:
                add(drums, hat(), sp, [0.16, 0.08, 0.12, 0.08][sxt], pan=-0.25)


def random_gate(seed, step, density=0.32):
    """Deterministic sparse trigger for the 'data blip' texture."""
    return np.random.default_rng(hash((seed, step)) % (2 ** 32)).random() < density


# ---------------------------------------------------------------- sfx
def sfx_impact(big=False):
    dur = 2.6 if big else 2.0
    n = int(dur * SR)
    t = tt(n)
    sub = np.sin(2 * np.pi * np.cumsum(28 + 60 * np.exp(-t * 9)) / SR) * np.exp(-t * (1.6 if big else 2.2))
    thump = lp(rng.standard_normal(n), 1800) * np.exp(-t * 18) * 0.9
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in [(196, 4, 0.25), (311, 5, 0.18), (467, 6, 0.14), (742, 8, 0.1), (1180, 11, 0.06)])
    crack = hp(rng.standard_normal(n), 2500) * np.exp(-t * 45) * 0.5
    x = saturate(sub * 1.3 + thump + metal + crack, 1.6)
    x = reverb(x, 2.8 if big else 2.2, 0.45, damp=3500)
    if big:
        sparkle = hp(rng.standard_normal(n), 6000) * np.exp(-t * 3) * 0.15
        x += stereo(sparkle, 0)
    return norm(x, 0.95)


def sfx_slam():
    n = int(1.1 * SR)
    t = tt(n)
    body = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t * 20)) / SR) * np.exp(-t * 6)
    snap = bp(rng.standard_normal(n), 800, 6000) * np.exp(-t * 35)
    return norm(reverb(saturate(body + snap * 0.7, 1.4), 1.2, 0.3))


def sfx_hit():
    n = int(0.6 * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * np.cumsum(70 + 120 * np.exp(-t * 30)) / SR) * np.exp(-t * 10) + bp(rng.standard_normal(n), 1500, 8000) * np.exp(-t * 50) * 0.5
    return norm(reverb(x, 0.9, 0.25))


def sfx_subdrop():
    n = int(1.4 * SR)
    t = tt(n)
    f = 30 + 70 * np.exp(-t * 3.2)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.01) * np.exp(-t * 1.8)
    return norm(saturate(x, 1.3))


def sfx_whoosh(dur=0.55, peak_at=0.55, lo=250, hi=5200, pan_sweep=True):
    n = int(dur * SR)
    t = tt(n) / dur
    shape = np.where(t < peak_at, (t / peak_at) ** 2.2, np.exp(-(t - peak_at) * 9))
    cut = lo + (hi - lo) * np.where(t < peak_at, (t / peak_at) ** 1.5, 1 - (t - peak_at) / (1 - peak_at) * 0.7)
    x = sweep_filter(rng.standard_normal(n), cut, 'band') * shape
    if pan_sweep:
        pan = np.linspace(-0.8, 0.8, n)
        a = (pan + 1) * np.pi / 4
        st = np.vstack([x * np.cos(a), x * np.sin(a)])
    else:
        st = stereo(x)
    return norm(reverb(st, 0.8, 0.2))


def sfx_reverse(dur=1.2):
    n = int(dur * SR)
    t = tt(n)
    cym = hp(rng.standard_normal(n), 3500) * np.exp(-t[::-1] * 3.2)
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 900, n)) / SR) * (t / dur) ** 3 * 0.25
    x = (cym + tone) * np.minimum(1, (dur - t) / 0.004)
    return norm(reverb(x, 1.2, 0.25))


def sfx_riser(dur):
    n = int(dur * SR)
    t = tt(n)
    noise = sweep_filter(rng.standard_normal(n), np.geomspace(500, 9000, n), 'band') * (t / dur) ** 2
    tone = sum(np.sin(2 * np.pi * np.cumsum(np.geomspace(f, f * 4, n)) / SR) for f in (150, 225, 300)) * (t / dur) ** 2.5 * 0.2
    x = (noise + tone) * np.minimum(1, (dur - t) / 0.003)
    return norm(reverb(x, 1.0, 0.2))


def sfx_glitch(dur=0.46):
    n = int(dur * SR)
    out = np.zeros(n)
    pos = 0
    while pos < n:
        seg = int(rng.uniform(0.012, 0.05) * SR)
        kind = rng.integers(0, 3)
        tseg = tt(seg)
        if kind == 0:
            s = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2400) * tseg))
        elif kind == 1:
            s = rng.standard_normal(seg)
        else:
            s = np.sin(2 * np.pi * rng.uniform(80, 400) * tseg) * 1.5
        reps = rng.integers(1, 4)
        chunk = np.resize(np.tile(s[: seg // reps], reps), seg)
        crush = rng.integers(4, 24)
        chunk = np.resize(np.repeat(chunk[::crush], crush), seg)
        out[pos:pos + seg] = chunk[: n - pos] * rng.uniform(0.3, 1.0)
        pos += seg + int(rng.uniform(0, 0.01) * SR)
    out *= np.linspace(0.5, 1, n)
    return norm(np.vstack([out, np.roll(out, 90)]) * 0.8)


def sfx_blip_raw(f0, f1, dur=0.07):
    """Dry, un-normalized blip (used inside the music bed)."""
    n = int(dur * SR)
    t = tt(n)
    f = np.geomspace(f0, f1, n)
    return fade((np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 45), 0.001, 0.01)


def sfx_blip(f0, f1, dur=0.07):
    n = int(dur * SR)
    t = tt(n)
    f = np.geomspace(f0, f1, n)
    x = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 45)
    return norm(reverb(fade(x, 0.001, 0.01), 0.5, 0.15))


def sfx_tick():
    n = int(0.03 * SR)
    t = tt(n)
    x = hp(rng.standard_normal(n), 3000) * np.exp(-t * 400) + np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 180) * 0.6
    return norm(x)


def sfx_counter(dur=1.7):
    """Rolling odometer ticks that decelerate."""
    n = int(dur * SR)
    out = np.zeros((2, n))
    tick = sfx_tick()
    times = []
    x = 0.0
    gap = 0.028
    while x < dur - 0.05:
        times.append(x)
        x += gap
        gap *= 1.045
    for i, tm in enumerate(times):
        add(out, tick * (0.9 - 0.4 * i / len(times)), int(tm * SR), pan=(0.2 if i % 2 else -0.2))
    return norm(out)


def sfx_type(dur=1.0):
    n = int(dur * SR)
    out = np.zeros((2, n))
    x = 0.0
    while x < dur - 0.04:
        k = int(0.02 * SR)
        t = tt(k)
        click = bp(rng.standard_normal(k), 1500, 7000) * np.exp(-t * 300) + np.sin(2 * np.pi * rng.uniform(380, 520) * t) * np.exp(-t * 120) * 0.4
        add(out, click * rng.uniform(0.5, 1.0), int(x * SR), pan=rng.uniform(-0.2, 0.2))
        x += rng.uniform(0.035, 0.075)
    return norm(out)


def sfx_pen(dur=0.7):
    """Marker on a smart board: band-limited friction with stroke modulation."""
    n = int(dur * SR)
    t = tt(n)
    mod = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 6.5 * t + np.sin(2 * np.pi * 1.7 * t)))
    x = bp(rng.standard_normal(n), 1800, 6500) * mod * np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.08)
    return norm(x * 0.7)


def sfx_bell(freqs, dur=1.4, spacing=0.07):
    n = int(dur * SR)
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        s = int(i * spacing * SR)
        t = tt(n - s)
        mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 6)
        out[s:] += np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2) * (1 - i * 0.12)
    return norm(reverb(out, 1.6, 0.35))


def sfx_shimmer(dur=2.2):
    n = int(dur * SR)
    out = np.zeros((2, n))
    notes = [74, 78, 81, 86, 90, 93, 98]
    for i, m in enumerate(notes):
        t = tt(n - int(i * 0.06 * SR))
        f = mtof(m)
        v = np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4)) * np.exp(-t * 2.4) * 0.5
        add(out, v, int(i * 0.06 * SR), pan=np.sin(i * 1.3) * 0.7)
    air = hp(rng.standard_normal(n), 7000) * np.exp(-tt(n) * 2.5) * 0.08
    add(out, air, 0)
    return norm(reverb(out, 2.4, 0.45))


def sfx_scan():
    n = int(0.5 * SR)
    t = tt(n)
    f = np.geomspace(300, 4200, n)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.5 + sweep_filter(rng.standard_normal(n), f, 'band') * np.exp(-t * 6) * 0.6
    return norm(reverb(x, 1.0, 0.3))


def sfx_toggle():
    n = int(0.08 * SR)
    t = tt(n)
    x = hp(rng.standard_normal(n), 2000) * np.exp(-t * 500) + np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 90) * 0.5
    return norm(x)


def sfx_flip():
    a = sfx_whoosh(0.22, 0.6, 900, 7000, pan_sweep=False)
    n = a.shape[1]
    click = np.zeros(n)
    k = int(0.02 * SR)
    click[int(0.13 * SR):int(0.13 * SR) + k] = hp(rng.standard_normal(k), 2500) * np.exp(-tt(k) * 300)
    return norm(a + stereo(click) * 0.6)


def sfx_data(dur=0.9):
    n = int(dur * SR)
    out = np.zeros((2, n))
    x = 0.0
    while x < dur - 0.06:
        f = rng.choice([1320, 1760, 1980, 2640, 2960, 3520])
        b = sfx_blip(f, f * rng.choice([0.9, 1.1, 1.25]), 0.045)
        add(out, b * rng.uniform(0.3, 0.8), int(x * SR), pan=rng.uniform(-0.7, 0.7))
        x += rng.uniform(0.025, 0.06)
    return norm(out)


def sfx_analyze(dur=1.8):
    n = int(dur * SR)
    t = tt(n)
    carrier = np.sin(2 * np.pi * 110 * t) * 0.3 + np.sign(np.sin(2 * np.pi * 220.5 * t)) * 0.05
    gate = (np.sin(2 * np.pi * 12 * t) > 0).astype(float) * 0.5 + 0.5
    hiss = bp(rng.standard_normal(n), 3000, 9000) * 0.08 * gate
    x = lp(carrier, 1500) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t)) + hiss
    x *= np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.3)
    return norm(np.vstack([x, np.roll(x, 120)]))


def sfx_pop():
    n = int(0.12 * SR)
    t = tt(n)
    f = np.geomspace(500, 1300, n)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)
    return norm(reverb(fade(x, 0.001, 0.01), 0.4, 0.15))


def sfx_cut():
    w = sfx_whoosh(0.3, 0.7, 600, 8000, pan_sweep=False)
    h = sfx_hit()
    out = np.zeros((2, max(w.shape[1], int(0.21 * SR) + h.shape[1])))
    add(out, w, 0, 0.8)
    add(out, h, int(0.09 * SR), 0.7)
    return norm(out)


def sfx_boot():
    """Power-on: rising tone + digital chirps + soft chord bloom."""
    n = int(0.9 * SR)
    t = tt(n)
    f = np.geomspace(160, 1100, n)
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.25) * np.exp(-np.maximum(0, t - 0.25) * 6) * 0.45
    chord = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (74, 81, 86)) * np.maximum(0, np.minimum(1, (t - 0.2) / 0.1)) * np.exp(-np.maximum(0, t - 0.2) * 4) * 0.2
    out = np.zeros(n)
    for k, d in enumerate([0.18, 0.24, 0.30]):
        blip = sfx_blip_raw(2600 + k * 400, 3200 + k * 400, 0.04)
        s0 = int(d * SR)
        out[s0:s0 + len(blip)] += blip * 0.4
    return norm(reverb(sweep + chord + out, 1.2, 0.3))


def sfx_lock():
    """Vault latch: metallic click + low thunk + short ring."""
    n = int(0.5 * SR)
    t = tt(n)
    click = bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t * 260)
    thunk = np.sin(2 * np.pi * np.cumsum(110 + 80 * np.exp(-t * 40)) / SR) * np.exp(-t * 22)
    ring = (np.sin(2 * np.pi * 1240 * t) * 0.5 + np.sin(2 * np.pi * 2130 * t) * 0.3) * np.exp(-t * 18) * 0.35
    second = np.zeros(n)
    s0 = int(0.045 * SR)
    second[s0:] = bp(rng.standard_normal(n - s0), 1500, 6000) * np.exp(-tt(n - s0) * 300) * 0.7
    return norm(reverb(saturate(click + thunk * 0.9 + ring + second, 1.3), 0.6, 0.2))


def sfx_deny():
    """Blocked access: two short detuned square buzzes."""
    n = int(0.36 * SR)
    t = tt(n)
    buzz = (np.sign(np.sin(2 * np.pi * 140 * t)) + np.sign(np.sin(2 * np.pi * 147 * t))) * 0.5
    env = np.zeros(n)
    for s0 in (0.0, 0.17):
        a0, a1 = int(s0 * SR), int((s0 + 0.13) * SR)
        env[a0:a1] = np.exp(-tt(a1 - a0) * 9)
    return norm(lp(buzz * env, 2200) * 0.8)


def sfx_rec():
    """REC start: two clean beeps."""
    n = int(0.3 * SR)
    t = tt(n)
    out = np.zeros(n)
    for s0 in (0.0, 0.11):
        a0, a1 = int(s0 * SR), int((s0 + 0.07) * SR)
        tb = tt(a1 - a0)
        out[a0:a1] += np.sin(2 * np.pi * 1320 * tb) * np.minimum(1, tb / 0.004) * np.minimum(1, (0.07 - tb) / 0.01)
    return norm(reverb(out * 0.8, 0.5, 0.15))


def sfx_stack():
    """Data blocks dropping into place, pitch climbing."""
    n = int(0.9 * SR)
    out = np.zeros(n)
    for k in range(7):
        s0 = int(k * 0.085 * SR)
        m = int(0.12 * SR)
        tb = tt(m)
        f0 = 170 * 2 ** (k / 7)
        thock = np.sin(2 * np.pi * np.cumsum(f0 + f0 * 1.5 * np.exp(-tb * 60)) / SR) * np.exp(-tb * 30)
        tick = hp(rng.standard_normal(m), 3000) * np.exp(-tb * 400) * 0.3
        out[s0:s0 + m] += (thock + tick)[: n - s0] * (0.7 + 0.04 * k)
    return norm(reverb(out, 0.7, 0.18))


def sfx_strike():
    """Strikethrough zip: quick downward swish."""
    n = int(0.22 * SR)
    t = tt(n)
    cut = np.geomspace(7000, 900, n)
    x = sweep_filter(rng.standard_normal(n), cut, 'band') * np.minimum(1, t / 0.01) * np.exp(-t * 14)
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(1400, 500, n)) / SR) * np.exp(-t * 20) * 0.25
    return norm(reverb(x + tone, 0.5, 0.15))


def sfx_up(m):
    """One step of the rising check-chime ladder."""
    n = int(0.6 * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 10) * 1.2) * np.exp(-t * 5)
         + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) * 0.25)
    return norm(reverb(fade(x, 0.002, 0.05), 1.0, 0.25))


def sfx_snap():
    """Shutter / paper snap — the hard cut into the paper interlude."""
    n = int(0.25 * SR)
    t = tt(n)
    out = np.zeros(n)
    for s0, g in ((0.0, 1.0), (0.028, 0.7)):
        a0, m = int(s0 * SR), int(0.02 * SR)
        out[a0:a0 + m] += bp(rng.standard_normal(m), 2000, 9000) * np.exp(-tt(m) * 260) * g
    out += np.sin(2 * np.pi * 95 * t) * np.exp(-t * 30) * 0.5
    return norm(reverb(out, 0.4, 0.12))


def sfx_paper():
    """Paper sheets folding into the header band."""
    n = int(0.3 * SR)
    t = tt(n) / 0.3
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.5
    x = sweep_filter(rng.standard_normal(n), np.geomspace(1200, 4500, n), 'band') * shape
    crackle = (rng.random(n) > 0.995) * rng.uniform(0.3, 1, n)
    return norm(x + lp(crackle, 6000) * 0.4)


def sfx_stamp():
    """Rubber stamp: low thump + slap + a small wood knock."""
    n = int(0.6 * SR)
    t = tt(n)
    thump = np.sin(2 * np.pi * np.cumsum(45 + 40 * np.exp(-t * 30)) / SR) * np.exp(-t * 16)
    slap = lp(rng.standard_normal(n), 3200) * np.exp(-t * 70) * 0.8
    knock = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 40) * 0.25
    return norm(reverb(saturate(thump + slap + knock, 1.4), 0.6, 0.18))


def build_sfx():
    beat_s = BEAT / SR
    return {
        'impact': sfx_impact(),
        'impact-big': sfx_impact(big=True),
        'slam': sfx_slam(),
        'hit': sfx_hit(),
        'subdrop': sfx_subdrop(),
        'whoosh': sfx_whoosh(0.55, 0.6),
        'whoosh-fast': sfx_whoosh(0.4, 0.75, 400, 7000),
        'swipe': sfx_whoosh(0.25, 0.5, 1200, 9000),
        'reverse': sfx_reverse(1.2),
        'riser-long': sfx_riser(20 / FPS),
        'glitch': sfx_glitch(14 / FPS),
        'blip-1': sfx_blip(1800, 2400),
        'blip-2': sfx_blip(2200, 2900),
        'blip-3': sfx_blip(1500, 2000),
        'tick': sfx_tick(),
        'counter': sfx_counter(),
        'type': sfx_type(),
        'pen': sfx_pen(),
        'ding': sfx_bell([mtof(81), mtof(88)], 1.4, 0.06),
        'chime': sfx_bell([mtof(74), mtof(78), mtof(81), mtof(86)], 1.8, beat_s / 4),
        'chime-small': sfx_bell([mtof(86), mtof(93)], 1.0, 0.05),
        'shimmer': sfx_shimmer(),
        'scan': sfx_scan(),
        'toggle': sfx_toggle(),
        'flip': sfx_flip(),
        'data': sfx_data(),
        'analyze': sfx_analyze(),
        'pop': sfx_pop(),
        'cut': sfx_cut(),
        'boot': sfx_boot(),
        'lock': sfx_lock(),
        'deny': sfx_deny(),
        'rec': sfx_rec(),
        'stack': sfx_stack(),
        'strike': sfx_strike(),
        'up-1': sfx_up(77),
        'up-2': sfx_up(81),
        'up-3': sfx_up(84),
        'up-4': sfx_up(89),
        'riser-bridge': sfx_riser(28 / FPS),
        'snap': sfx_snap(),
        'paper': sfx_paper(),
        'stamp': sfx_stamp(),
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
    for name, x in sfx.items():
        write(os.path.join(ROOT, 'public', 'audio', 'sfx', f'{name}.wav'), x if x.ndim == 2 else stereo(x))

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
    mastered = master(mix)
    write(os.path.join(ROOT, 'public', 'audio', 'soundtrack.wav'), mastered)


def limiter(x, ceiling=0.89, window=1200):
    """Look-ahead brickwall limiter: min-hold the required gain, then smooth it."""
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    held = minimum_filter1d(need, size=window * 2, mode='nearest')
    smooth = np.convolve(held, np.ones(window) / window, mode='same')
    return x * np.minimum(smooth, need)


def master(mix, target_rms_db=-17.5):
    mix = np.vstack([hp(mix[0], 30), hp(mix[1], 30)])
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
