"""
Synthesized instruments for the score and the sound effects. Each returns a dry signal — mono (n,)
unless noted — and leaves space (reverb / delay) to the bus it is mixed into.
"""
import numpy as np

from dsp import (SR, bp, each, fade, glide, hp, lp, mtof, noise, peak_eq, rng, saturate, stereo, sweep_filter, tt)


# ---------------------------------------------------------------- drums & percussion
def kick(punch=1.0, dur=0.55):
    """Deep, round kick: long sub body, felt-beater knock instead of a bright click."""
    n = int(dur * SR)
    t = tt(n)
    f = 50 + 100 * np.exp(-t * 30) + 25 * np.exp(-t * 7)
    body = glide(f) * (0.86 * np.exp(-t * 7) + 0.14 * np.exp(-t * 3))
    knock = lp(noise(n), 1200) * np.exp(-t * 140) * 0.3
    return fade(saturate((body + knock) * punch, 1.5) * 0.95, 0.0006, 0.04)


def snare(dur=0.5):
    """Warm snare: pitched body + band-limited wires (no fizz above ~6 kHz)."""
    n = int(dur * SR)
    t = tt(n)
    body = glide(180 + 50 * np.exp(-t * 45)) * np.exp(-t * 20)
    ring = np.sin(2 * np.pi * 330 * t) * np.exp(-t * 28) * 0.25
    wires = bp(noise(n), 300, 6000) * np.exp(-t * 15) * 0.8
    return fade(saturate(body * 0.8 + ring + wires, 1.3) * 0.7, 0.0006, 0.04)


def snare_soft(vel=1.0, dur=0.25):
    """Brushed roll stroke: mostly wires, little body."""
    n = int(dur * SR)
    t = tt(n)
    wires = bp(noise(n), 400, 5000) * np.exp(-t * 26) * np.minimum(1, t / 0.004)
    body = glide(200 + 30 * np.exp(-t * 50)) * np.exp(-t * 30) * 0.3
    return fade((wires + body) * 0.5 * vel, 0.0005, 0.03)


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


def timpani(freq, dur=2.4, vel=1.0):
    """Timpani: membrane modes (1 : 1.5 : 1.98 : 2.44 : 2.94), a slight pitch settle, felt mallet."""
    n = int(dur * SR)
    t = tt(n)
    bend = 1 + 0.05 * np.exp(-t * 14)
    x = np.zeros(n)
    for ratio, amp, dec in ((1.0, 1.0, 1.6), (1.5, 0.45, 2.6), (1.98, 0.3, 3.4), (2.44, 0.18, 4.5), (2.94, 0.1, 6.0)):
        x += amp * np.sin(2 * np.pi * np.cumsum(freq * ratio * bend) / SR + rng.uniform(0, 2 * np.pi)) * np.exp(-t * dec)
    mallet = lp(noise(n), 900) * np.exp(-t * 45) * 0.5
    x = saturate((x + mallet) * vel, 1.3) * np.minimum(1, t / 0.002)
    return fade(x * 0.6, 0.0005, 0.25)


def crash(dur=2.4):
    """Dark, distant cymbal for section downbeats."""
    n = int(dur * SR)
    t = tt(n)
    x = bp(noise(n), 1800, 9000) * np.exp(-t * 2.2) * np.minimum(1, t / 0.012)
    return lp(x, 8000) * 0.3


def cymbal_swell(dur):
    """Reverse cymbal: a crash played backwards, so it breathes in and stops on the downbeat."""
    x = crash(dur + 0.4)[::-1][-int(dur * SR):]
    return fade(x * np.linspace(0.3, 1, len(x)) ** 2, 0.05, 0.004)


# ---------------------------------------------------------------- bass
def bass(freq, dur, drive=1.3, bright=1.0):
    """Warm sub bass: sine + a little 2nd/3rd harmonic so it reads on small speakers."""
    n = int(dur * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * freq * t) + 0.32 * bright * np.sin(4 * np.pi * freq * t) + 0.1 * bright * np.sin(6 * np.pi * freq * t)
    env = np.minimum(1, t / 0.006) * np.clip((dur - t) / 0.05, 0, 1)
    return lp(saturate(x * env * 0.8, drive), 700)


def pluck_bass(freq, dur=0.7):
    """Upright pizzicato: quickly fading harmonics and a finger thump."""
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    for k in range(1, 9):
        x += np.sin(2 * np.pi * freq * k * t) / k ** 1.5 * np.exp(-t * (4 + 2.2 * k))
    thump = lp(noise(n), 700) * np.exp(-t * 80) * 0.25
    return fade(lp(x + thump, 1600) * 0.7, 0.001, 0.05)


# ---------------------------------------------------------------- keys & mallets
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


def bell_pluck(freq, dur=1.0, vel=1.0):
    """Glassy pluck for the AI figure: a quick FM 'ping' over a soft sine body."""
    n = int(dur * SR)
    t = tt(n)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * 1.5 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * 3.5) + 0.25 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 6)
    return fade(lp(x * np.minimum(1, t / 0.002) * vel, 5000) * 0.5, 0.001, 0.08)


# ---------------------------------------------------------------- sustained ensembles (stereo)
def strings(midis, dur, attack=0.45, release=0.7, cutoff=1900, bright=12, vib=0.004, bow=0.0):
    """String section: three detuned voices per note, slow vibrato, body resonances, optional bow noise."""
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
    if bow:
        out += np.vstack([bp(noise(n), 1500, 5000), bp(noise(n), 1500, 5000)]) * env * bow * 0.02
    # wooden body: a little warmth at 320 Hz and presence at 1.2 kHz
    return each(out, lambda c: peak_eq(peak_eq(hp(c, 70), 320, 2.0), 1200, 1.5))


FORMANTS = {
    'ah': [(700, 1.0), (1220, 0.55), (2600, 0.3)],
    'oo': [(320, 1.0), (800, 0.45), (2240, 0.15)],
}


def choir(midis, dur, vowel='ah', attack=0.6, release=0.8, breath=0.04):
    """Formant choir pad: three singers per note through vowel formants, vibrato easing in."""
    n = int(dur * SR)
    t = tt(n)
    out = np.zeros((2, n))
    for m in midis:
        for v in range(3):
            f0 = mtof(m + rng.uniform(-0.12, 0.12))
            vib = 1 + 0.006 * np.sin(2 * np.pi * rng.uniform(4.8, 5.8) * t + rng.uniform(0, 2 * np.pi)) * np.clip(t / 0.8, 0, 1)
            ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
            src = np.zeros(n)
            for k in range(1, 40):
                if f0 * k > 5000:
                    break
                src += np.sin(k * ph + rng.uniform(0, 2 * np.pi)) / k
            voice = sum(g * bp(src, f * 0.85, f * 1.15) for f, g in FORMANTS[vowel])
            out += stereo(voice, (v - 1) * 0.5 + rng.uniform(-0.1, 0.1))
    env = np.minimum(1, t / attack) * np.clip((dur - t) / release, 0, 1)
    out += np.vstack([bp(noise(n), 2000, 6000), bp(noise(n), 2000, 6000)]) * breath
    return each(out * env, lambda c: lp(c, 5000)) * (0.25 / len(midis))


def brass(midis, dur, attack=0.15, release=0.4, bright=1.0):
    """Soft horn section: two detuned voices per note, the filter opening as the note swells."""
    n = int(dur * SR)
    t = tt(n)
    cutoff = (350 + 1900 * bright * (1 - np.exp(-t / max(attack, 0.01) * 1.2))) * (0.75 + 0.25 * np.exp(-t * 1.5))
    out = np.zeros((2, n))
    for m in midis:
        for d, pan in ((-0.05, -0.3), (0.05, 0.3)):
            f0 = mtof(m + d)
            ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * t))) / SR
            src = np.zeros(n)
            for k in range(1, 30):
                if f0 * k > 6000:
                    break
                src += np.sin(k * ph) / k
            out += stereo(sweep_filter(src, cutoff, 'low'), pan)
    env = np.minimum(1, t / max(attack, 0.005)) ** 1.5 * np.clip((dur - t) / release, 0, 1)
    return saturate(out * env * (0.3 / len(midis)), 1.2)


def stab(midis, dur=1.8, bright=0.6):
    """Orchestral hit: strings and horns on the same chord, struck and left to ring out."""
    n = int(dur * SR)
    decay = np.exp(-tt(n) * 2.2)
    s = strings(midis, dur, attack=0.006, release=dur * 0.9, cutoff=1600 + 1600 * bright, bright=12, vib=0.0)
    b = brass(midis, dur, attack=0.02, release=dur * 0.8, bright=bright)
    return (s + b * 0.7) * decay


def cello(freq, dur=0.32, vel=1.0):
    """Short low-string note for ostinatos: bowed attack, quick release."""
    n = int(dur * SR)
    t = tt(n)
    x = np.zeros(n)
    for k in range(1, 12):
        x += np.sin(2 * np.pi * freq * k * t + rng.uniform(0, 2 * np.pi)) / k * np.exp(-t * (3 + 0.7 * k))
    env = np.minimum(1, t / 0.02) * np.exp(-t * 4.5)
    return fade(lp(x * env, 1400) * 0.45 * vel, 0.002, 0.04)
