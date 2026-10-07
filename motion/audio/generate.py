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


def pad_chord(midis, dur, attack=0.35, release=0.6, bright=10):
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
    return np.vstack([lp(L, 2600), lp(R, 2600)]) * env * trem * (0.22 / len(midis))


# ---------------------------------------------------------------- music
def build_music():
    mus = np.zeros((2, TOTAL))
    drums = np.zeros((2, TOTAL))
    synth = np.zeros((2, TOTAL))
    kicks = []  # kick sample positions (for sidechain)

    imp = fr(M['impact'])
    a0, a1 = fr(M['sectionA'][0]), fr(M['sectionA'][1])
    b0, b1 = fr(M['sectionB'][0]), fr(M['sectionB'][1])
    fill0, fill1 = fr(M['fill'][0]), fr(M['fill'][1])
    final = fr(M['finalHit'])
    eighth, sixteenth = BEAT // 2, BEAT // 4

    # ---- intro: drone + heartbeat + accelerating clock ticks into the impact
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

    # ---- section A groove (Dm | Bb | C | A) and section B (Dm | Bb | Gm A)
    A_bars = [(38, [62, 65, 69]), (34, [58, 62, 65]), (36, [60, 64, 67]), (33, [57, 61, 64])]
    B_bars = [(38, [62, 65, 69]), (34, [58, 62, 65]), (31, [55, 58, 62])]

    def groove(start, end, bars, ai=False):
        bar_len = 4 * BEAT
        pos = start
        bi = 0
        while pos < end:
            root, chord = bars[min(bi, len(bars) - 1)]
            bar_end = min(end, pos + bar_len)
            # pad
            add(synth, pad_chord(chord + [chord[0] - 12], (bar_end - pos) / SR + 0.4, attack=0.05 if ai else 0.25), pos, 0.9)
            for beat in range(4):
                bpos = pos + beat * BEAT
                if bpos >= end:
                    break
                # in the last bar of section B, switch the harmony to A (dominant) halfway
                cur_root, cur_chord = (33, [57, 61, 64]) if (ai and bi == 2 and beat >= 2) else (root, chord)
                add(drums, kick(1.0), bpos, 0.95)
                kicks.append(bpos)
                if beat in (1, 3):
                    add(drums, clap(), bpos, 0.55)
                for s in range(4):
                    sp = bpos + s * sixteenth
                    if sp >= end:
                        break
                    vel = [0.55, 0.22, 0.38, 0.22][s]
                    if s == 2:
                        add(drums, hat(True, 0.18), sp, 0.32, pan=0.3)
                    add(drums, hat(), sp, vel, pan=0.3)
                    # arp
                    pattern = [0, 2, 1, 2] if not ai else [0, 2, 1, 2, 0, 1]
                    tone = cur_chord[pattern[(beat * 4 + s) % len(pattern)]] + 12
                    if ai and (beat * 4 + s) % 5 == 3:
                        tone += 12
                    note = pluck(mtof(tone), 0.22, 'square' if ai else 'saw', 0.9 if ai else 1.3)
                    add(synth, note, sp, 0.30 if ai else 0.26, pan=(-0.45 if s % 2 else 0.45))
                    if ai and s == 3 and beat % 2:
                        add(synth, pluck(mtof(tone + 7), 0.08, 'square'), sp + sixteenth // 2, 0.18, pan=0.6)
                # bass 8ths (off-beat pumping)
                for e in range(2):
                    ep = bpos + e * eighth
                    if ep >= end:
                        break
                    bn = bass_note(mtof(cur_root + (12 if (ai and e == 1) else 0)), eighth / SR * 0.95, 2.2 if ai else 1.6)
                    add(synth, bn, ep, 0.55 if e else 0.4)
            pos = bar_end
            bi += 1

    groove(a0, a1, A_bars)
    groove(b0, b1, B_bars, ai=True)

    # snare roll fill into the efficiency slam
    p = fill0
    step = sixteenth
    k = 0
    while p < fill1:
        add(drums, clap(0.12), p, 0.25 + 0.5 * (p - fill0) / (fill1 - fill0), pan=(-0.2 if k % 2 else 0.2))
        p += step if (p - fill0) < (fill1 - fill0) / 2 else step // 2
        k += 1
    # crash on the slam
    crash_n = int(1.8 * SR)
    crash = hp(rng.standard_normal(crash_n), 5000) * np.exp(-tt(crash_n) * 2.6) * 0.35
    add(drums, reverb(crash, 1.8, 0.4), fr(M['effSlam']))

    # ---- break before the AI hit: filtered swell
    br0, br1 = a1, b0
    nb = br1 - br0 + int(0.2 * SR)
    swell = sweep_filter(rng.standard_normal(nb), np.geomspace(400, 9000, nb), 'band') * np.linspace(0, 0.3, nb) ** 1.5
    add(mus, swell, br0)
    add(mus, pad_chord([57, 61, 64, 69], (br1 - br0) / SR + 0.5, attack=0.12), br0, 0.8)

    # ---- outro: tension on A, then the final D major chord on the logo
    o0 = b1
    add(synth, pad_chord([57, 61, 64, 69], (final - o0) / SR + 0.2, attack=0.1), o0, 0.9)
    for j in range((final - o0) // sixteenth):
        tone = [69, 73, 76, 81][j % 4] + (12 if j > 8 else 0)
        add(synth, pluck(mtof(tone), 0.15, 'saw', 1.1), o0 + j * sixteenth, 0.12 + 0.012 * j, pan=(-0.5 if j % 2 else 0.5))
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
    for f, depth in [(M['impact'], 0.5), (M['aiHit'], 0.55)]:
        p = fr(f)
        n = min(int(0.6 * SR), TOTAL - p)
        duck[p:p + n] = np.minimum(duck[p:p + n], 1 - depth * np.exp(-tt(n) * 5))

    # hard gate on the groove (incl. reverb tails) for the "그리고 이제," pause before the AI hit
    gate = np.ones(TOTAL)
    g0, g1 = br0, br1
    ramp = int(0.03 * SR)
    gate[g0:g0 + ramp] = np.linspace(1, 0.08, ramp)
    gate[g0 + ramp:g1] = 0.08
    mix = (reverb(synth, 1.4, 0.28) + reverb(drums, 0.9, 0.12, damp=6000)) * gate + reverb(mus, 2.4, 0.35)
    mix *= duck
    mix = np.vstack([hp(mix[0], 28), hp(mix[1], 28)])
    # final fade
    fl = int(0.5 * SR)
    mix[:, -fl:] *= np.linspace(1, 0, fl) ** 1.5
    return norm(saturate(mix * 0.9, 1.15), 0.7)


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
        'riser': sfx_riser(12 / FPS),
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
