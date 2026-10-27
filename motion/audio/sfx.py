"""
Sound effects — soft, weighty, and played *with* the score rather than over it.

Tempo: every sound knows its hit — the peak of a whoosh, the tick of a cut, the attack of a chime, the
end of a swell — and generate.py places that hit on the 16th-note grid (see grid.py). Lengths are
musical: a cut pulls focus for a 16th, a swish rises for an 8th, a zoom for a beat; arpeggios run in
16ths and 32nds, and chimes carry a dotted-8th echo whose repeats land on the grid too.

Harmony: tuned sounds are voiced from the chord sounding at their hit — UI taps climb its chord tones,
bells ring its root and fifth, hits stab it in the low register, low thumps sit on its root or fifth.
Risers breathe in the harmony under them (Dm into the impact, the dominant A into the AI slam and the
logo). Every transition has its own move (zoom, push, iris, wipe, whip, dip), close-up cuts get a
soft focus pull, and repeated sounds come in variants.
"""
from collections import namedtuple

import numpy as np

from dsp import (SR, add, autopan, bp, delay, fade, glide, lp, mtof, noise, norm, reverb, rng, saturate, stereo,
                 sweep_filter, tt)
from grid import CHORDS, is_minor, note_in, tones_from
from instruments import bell, choir, stab, strings

Tempo = namedtuple('Tempo', 'beat e8 s16 t32')
A_MAJ = [45, 52, 57, 61, 64]  # the dominant held by the bridge and the outro: risers into the AI slam and the logo
DM_LOW = [38, 45, 50, 53, 57]


class Sfx:
    """A palette entry. make(chord) returns (signal, hit in seconds); tuned entries are rebuilt for the
    chord under each cue, the others ignore it and are rendered once."""

    def __init__(self, make, tuned=False, end_fade=0.015):
        self.make, self.tuned, self.end_fade = make, tuned, end_fade

    def render(self, chord=None):
        x, hit = self.make(chord)
        return finish(x if x.ndim == 2 else stereo(x), fade_s=self.end_fade), hit


def room(x, rt, wet, **kw):
    """Reverb for a one-shot: the room rings out past the dry sound (a cut-off tail clicks)."""
    return reverb(x, rt, wet, keep_tail=True, **kw)


def echo(x, T, feedback=0.32, mix=0.2, repeats=4):
    """Dotted-8th ping-pong echo, the same figure the keys use in the score: every repeat lands on the grid."""
    if x.ndim == 1:
        x = stereo(x)
    t = 0.75 * T.beat
    x = np.hstack([x, np.zeros((2, int(t * (repeats + 1) * SR)))])
    return delay(x, t, feedback=feedback, mix=mix, repeats=repeats, damp=3000)


def finish(x, floor_db=-80, fade_s=0.015):
    """Trim the silent end and close every sound with a short fade, so no cue ever stops on a click."""
    level = np.max(np.abs(x), axis=0)
    alive = np.nonzero(level > level.max() * 10 ** (floor_db / 20))[0]
    x = x[:, : alive[-1] + 1] if len(alive) else x
    nf = min(int(fade_s * SR), x.shape[1])
    x = x.copy()
    x[:, -nf:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, nf)))
    x[:, : int(0.001 * SR)] *= np.linspace(0, 1, int(0.001 * SR))
    return x


def low_voicing(name, top=()):
    """An orchestral-hit voicing in the low register: root, fifth, octave, third, fifth (+ extra degrees)."""
    root = 36 + (CHORDS[name][0] - 36) % 12
    third = 3 if is_minor(name) else 4
    return [root, root + 7, root + 12, root + 12 + third, root + 19] + [root + d for d in top]


def thump_hz(name, low, high):
    """The chord's root — or failing that its fifth — inside [low, high] (midi), as a frequency."""
    for degree in (0, 2):
        m = note_in(name, degree, low, high)
        if low <= m <= high:
            return mtof(m)
    return mtof(note_in(name, 0, low, high + 12))


# ---------------------------------------------------------------- hits and the swells into them
def _low_end(n, size):
    t = tt(n)
    sub = glide(32 + 58 * np.exp(-t * 7)) * np.exp(-t * (1.7 - 0.4 * size))
    thump = lp(noise(n), 380) * np.exp(-t * 16) * 0.9
    body = glide(85 + 40 * np.exp(-t * 25)) * np.exp(-t * 9) * 0.6
    air = lp(noise(n), 2600) * np.exp(-t * 3.5) * 0.06 * size
    return stereo(saturate(sub * 1.2 + thump + body, 1.4) + air)


def sfx_hit(chord, size=1.0, bright=0.5, voices=False):
    """Cinematic impact: sub drop + chest thump + an orchestral stab on the music's chord."""
    dur = 2.4 + 0.6 * size
    n = int(dur * SR)
    x = _low_end(n, size)
    x += stab(chord, dur, bright) * (0.9 + 0.3 * size)
    if voices:
        x += choir(chord[1:5], dur, 'ah', attack=0.01, release=dur * 0.85) * np.exp(-tt(n) * 1.6) * 1.2
    x = fade(x, 0.0005, 0.6)  # the dry body fades out before the room takes over
    return norm(room(x, 2.4 + 0.6 * size, 0.36, pre=0.02, damp=2400, er=8), 0.95)


def sfx_reverse_swell(chord, dur, bright=0.5):
    """A struck chord's reverb, reversed: a swell that breathes in the harmony under it and keeps growing
    right up to its hit — its end."""
    n = int(dur * SR)
    struck = np.zeros((2, int((dur + 1.2) * SR)))
    add(struck, stab(chord, 0.5, bright), 0)
    wet = reverb(struck, 2.8, 1.0, pre=0.0, damp=3000, er=0) - struck * 0.65  # (almost) only the tail
    rev = wet[:, ::-1][:, -n:]
    level = np.sqrt(np.convolve((rev ** 2).mean(axis=0), np.ones(2400) / 2400, mode='same'))
    rev = rev / np.maximum(level, level.max() * 0.05)  # flatten the tail's own crest: the ramp alone shapes the swell
    t = tt(n)
    ramp = np.expm1(4 * t / dur) / np.expm1(4)  # exponential: the last 16th carries the biggest push into the hit
    air = sweep_filter(noise(n), np.geomspace(250, 2600, n), 'low') * ramp ** 1.4 * 0.35
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(35, 70, n)) / SR) * ramp ** 1.8 * 0.4
    x = norm(rev, 1.0) * ramp + stereo(air + sub)
    x = x * np.minimum(1, (dur - t) / 0.006)
    return norm(x, 0.9)


def sfx_thud(f0):
    """Weighty text slam, tuned to the chord's root or fifth."""
    n = int(1.0 * SR)
    t = tt(n)
    x = glide(f0 + 70 * np.exp(-t * 22)) * np.exp(-t * 7) + lp(noise(n), 900) * np.exp(-t * 28) * 0.6
    return norm(room(saturate(x, 1.3), 1.0, 0.22, damp=3000))


# ---------------------------------------------------------------- moves (transitions and cuts)
def _band_whoosh(rise, fall, lo, hi, pan=(-0.7, 0.7), body=0.35, settle=0.75):
    """Band-passed air that sweeps up for `rise` seconds and settles back over `fall`.
    Returns (stereo signal, envelope); the peak — the sound's hit — sits at `rise`."""
    n = int((rise + fall) * SR)
    t = tt(n)
    up = np.clip(t / rise, 0, 1)
    after = np.clip((t - rise) / fall, 0, 1)
    shape = np.where(t < rise, up ** 2, np.exp(-after * 2.4) * 0.5 * (1 + np.cos(np.pi * after)))
    cut = lo + (hi - lo) * np.where(t < rise, up ** 1.4, 1 - after * settle)
    x = sweep_filter(noise(n), cut, 'band') * shape + lp(noise(n), 500) * shape * body
    return autopan(x, *pan), shape


def sfx_swish(T, lo=200, hi=3200, pan=(-0.7, 0.7)):
    """Soft, dark whoosh into a beat change: rises for an 8th, settles for an 8th."""
    x, _ = _band_whoosh(T.e8, T.e8, lo, hi, pan)
    return norm(room(x, 0.8, 0.18, damp=3200)), T.e8


def sfx_zoom(T):
    """Zoom-through: the air rushes for a whole beat into the pass-through, a soft tone climbing under it."""
    x, shape = _band_whoosh(T.beat, T.e8, 250, 3600, (-0.3, 0.3), body=0.25, settle=0.5)
    tone = glide(np.geomspace(180, 720, x.shape[1])) * shape * 0.12
    return norm(room(x + stereo(tone), 0.9, 0.2, damp=3500)), T.beat


def sfx_push(T, chord):
    """Push cut: an 8th of rush that lands on the edit with a soft punch on the chord's root or fifth."""
    x, _ = _band_whoosh(T.e8, T.s16, 300, 3600, (-0.2, 0.2), body=0.4)
    n = x.shape[1]
    s0 = int(T.e8 * SR)
    tb = tt(n - s0)
    hit = np.zeros(n)
    hit[s0:] = glide(thump_hz(chord, 40, 47) + 60 * np.exp(-tb * 40)) * np.exp(-tb * 18) * 0.7
    return norm(room(x + stereo(hit), 0.8, 0.18, damp=3000)), T.e8


def sfx_iris(T, chord):
    """Iris opening: an open fifth blooms on the hit as the circle starts to open, a breathy swirl peaking an 8th later."""
    dur = T.s16 + T.beat
    n = int(dur * SR)
    t = tt(n)
    peak = T.s16 + T.e8
    swirl = sweep_filter(noise(n), np.geomspace(400, 3000, n), 'band') * np.where(t < peak, t / peak, np.clip((dur - t) / (dur - peak), 0, 1)) ** 1.5
    root = note_in(chord, 0, 79, 90)
    shimmer = np.zeros(n)
    s0 = int(T.s16 * SR)
    shimmer[s0:] = bell([mtof(root), mtof(root + 7)], (n - s0) / SR, T.t32, 0.7, 3.0)[: n - s0] * 0.3
    pan = np.sin(2 * np.pi * 1.4 * t) * 0.6
    a = (pan + 1) * np.pi / 4
    x = np.vstack([swirl * np.cos(a), swirl * np.sin(a)]) * 0.8 + stereo(shimmer)
    return norm(room(x, 1.6, 0.3, damp=3800)), T.s16


def sfx_wipe(T, chord):
    """Light wipe: an airy 8th-note sweep with a faint glassy edge on the chord's root, left to right."""
    x, shape = _band_whoosh(T.e8, T.e8, 500, 3800, (-0.8, 0.8), body=0.15)
    n = x.shape[1]
    glass = bell([mtof(note_in(chord, 0, 84, 95))], n / SR, 0, 0.6, 4.0)[:n] * shape * 0.15
    return norm(room(x + autopan(glass, -0.8, 0.8), 1.0, 0.22, damp=4000)), T.e8


def sfx_whip(T):
    """Whip pan: a 16th up, an 8th back down, thrown across the stereo field."""
    x, _ = _band_whoosh(T.s16, T.e8, 300, 3800, (0.9, -0.9), body=0.3, settle=0.85)
    return norm(room(x, 0.7, 0.15, damp=3200)), T.s16


def sfx_dip(T):
    """Dip to white: a slow soft breath, three 16ths in and three out."""
    rise = 3 * T.s16
    n = int(2 * rise * SR)
    t = tt(n)
    env = np.sin(np.pi * np.clip(t / (2 * rise), 0, 1)) ** 2
    x = sweep_filter(noise(n), np.concatenate([np.geomspace(300, 1800, n // 2), np.geomspace(1800, 400, n - n // 2)]), 'low') * env
    return norm(room(stereo(x), 1.6, 0.3, damp=3000)), rise


def sfx_cut(T, chord, lo, hi, pan):
    """Close-up cut: a 16th of focus pull — an air puff into a muted tick on the chord's root or fifth."""
    x, _ = _band_whoosh(T.s16, T.s16, lo, hi, pan, body=0.2)
    n = x.shape[1]
    s0 = int(T.s16 * SR)
    tb = tt(n - s0)
    tick = np.zeros(n)
    tick[s0:] = glide(thump_hz(chord, 45, 52) + 50 * np.exp(-tb * 60)) * np.exp(-tb * 40) * 0.5
    return norm(room(x * 0.8 + stereo(tick), 0.6, 0.15, damp=3000)), T.s16


# ---------------------------------------------------------------- interface & foley
def sfx_open(chord):
    """Opening 'whoom': a low swell under a soft open-fifth chime that rings with the motif's first note."""
    n = int(1.6 * SR)
    t = tt(n)
    air = sweep_filter(noise(n), np.concatenate([np.geomspace(200, 1400, n // 3), np.geomspace(1400, 300, n - n // 3)]), 'low') * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) * 0.5
    low = np.sin(2 * np.pi * thump_hz(chord, 31, 38) * t) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) * 0.6
    root = note_in(chord, 0, 72, 83)
    chime = bell([mtof(root), mtof(root + 7)], 1.6, 0.05, 0.8, 2.2) * 0.25
    return norm(room(stereo(air + low + chime), 2.0, 0.3, damp=3500)), 0.0


def _mallet(m, dur=0.4):
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 14)
         + 0.18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 26)
         + 0.06 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 40))
    knock = lp(noise(n), 1400) * np.exp(-t * 250) * 0.08
    return fade(x + knock, 0.0015, 0.04)


def sfx_tap(T, m):
    """Felt-mallet UI tap on a chord tone, with a soft dotted-8th echo."""
    return norm(room(echo(_mallet(m), T, mix=0.16, repeats=3), 0.7, 0.18, damp=3500)), 0.0


def sfx_tiles(T, chord):
    """The grid filling in: eight mallet notes climbing the chord (plus its colour tone) in 32nds across the stereo field."""
    notes = tones_from(chord, 64, 8, extra=(10,) if is_minor(chord) else (9,))
    step = int(T.t32 * SR)
    out = np.zeros((2, 7 * step + int(0.5 * SR)))
    for i, m in enumerate(notes):
        add(out, _mallet(m, 0.5) * (0.55 + 0.04 * i), i * step, pan=-0.7 + 0.2 * i)
    return norm(room(echo(out, T, mix=0.14, repeats=3), 0.7, 0.18, damp=3500)), 0.0


def sfx_bell(T, notes, spacing):
    return norm(room(echo(bell([mtof(m) for m in notes], 1.8, spacing), T, mix=0.18), 1.8, 0.32, damp=4000)), 0.0


def sfx_lock(chord):
    """Vault latch: a short slide, then a soft 'chunk' on the chord's root with a muted metal glint. The hit is the chunk."""
    n = int(0.7 * SR)
    t = tt(n)
    slide = bp(noise(n), 600, 2500) * np.clip(t / 0.05, 0, 1) * (t < 0.06) * 0.22
    s0 = int(0.06 * SR)
    tb = tt(n - s0)
    chunk = np.zeros(n)
    chunk[s0:] = (glide(thump_hz(chord, 45, 52) + 70 * np.exp(-tb * 50)) * np.exp(-tb * 28)
                  + lp(noise(n - s0), 300) * np.exp(-tb * 35) * 0.35
                  + lp((np.sin(2 * np.pi * 2300 * tb) + 0.7 * np.sin(2 * np.pi * 3170 * tb)) * np.exp(-tb * 70), 4000) * 0.07
                  + bp(noise(n - s0), 500, 2200) * np.exp(-tb * 140) * 0.4)
    return norm(room(saturate(slide + chunk, 1.2), 0.7, 0.2, damp=3000)), 0.06


def _two_notes(notes, step, decay, bright, cutoff):
    n = int(0.8 * SR)
    out = np.zeros(n)
    for k, m in enumerate(notes):
        a0 = int(k * step * SR)
        tb = tt(n - a0)
        f = mtof(m)
        out[a0:] += (np.sin(2 * np.pi * f * tb) + bright * np.sin(4 * np.pi * f * tb)) * np.exp(-tb * decay) * np.minimum(1, tb / 0.004)
    return lp(out, cutoff)


def sfx_deny(T, chord):
    """Access blocked: two muted, falling mallet notes a 16th apart — the chord's third down to its root (no buzzer)."""
    third = note_in(chord, 1, 60, 71)
    root = note_in(chord, 0, third - 11, third - 1)
    return norm(room(_two_notes([third, root], T.s16, 16, 0.2, 900), 0.6, 0.15, damp=2500)), 0.0


def sfx_rec(T, chord):
    """Recording starts: the chord's fifth rising to the root above it, a 16th apart."""
    fifth = note_in(chord, 2, 72, 79)
    root = note_in(chord, 0, fifth + 1, fifth + 12)
    return norm(room(echo(_two_notes([fifth, root], T.s16, 9, 0.15, 3500), T, mix=0.16, repeats=3), 0.9, 0.22, damp=3500)), 0.0


def sfx_stack(T, chord):
    """Data blocks settling: wooden tocks climbing two octaves of the chord in 32nds."""
    step = int(T.t32 * SR)
    notes = tones_from(chord, 55, 7)
    n = 6 * step + int(0.4 * SR)
    out = np.zeros(n)
    mlen = int(0.18 * SR)
    tb = tt(mlen)
    for k, m in enumerate(notes):
        f = mtof(m)
        tock = (np.sin(2 * np.pi * f * tb) + 0.3 * np.sin(2 * np.pi * f * 2.7 * tb) * np.exp(-tb * 30)) * np.exp(-tb * 22)
        out[k * step:k * step + mlen] += tock * (0.6 + 0.05 * k)
    return norm(room(echo(lp(out, 3000), T, mix=0.12, repeats=3), 0.7, 0.18, damp=3000)), 0.0


def sfx_strike(scale=1.0):
    """Strikethrough: a short, soft downward swish (each of the four a little lower)."""
    n = int(0.26 * SR)
    t = tt(n)
    x = sweep_filter(noise(n), np.geomspace(2200 * scale, 450 * scale, n), 'band') * np.minimum(1, t / 0.012) * np.exp(-t * 12)
    return norm(room(x, 0.5, 0.15, damp=3000)), 0.012


def _glass_note(m, decay=5.0):
    n = int(0.9 * SR)
    t = tt(n)
    f = mtof(m)
    return (np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8) * 0.8) * np.exp(-t * decay)
            + 0.15 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12))


def sfx_rise(T, m):
    """One step of a rising check ladder: warm mallet + bell on a chord tone, echoing in dotted 8ths."""
    return norm(room(echo(fade(lp(_glass_note(m), 4500), 0.002, 0.05), T, mix=0.16, repeats=3), 1.0, 0.25, damp=3500)), 0.0


def sfx_land(T, m):
    """A block landing in the glass case: a soft felt thock two octaves down under a tuned glass note."""
    n = int(0.9 * SR)
    t = tt(n)
    note = _glass_note(m, 6.0)
    thock = glide(mtof(m - 24) * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 24) * 0.55
    click = lp(noise(n), 3000) * np.exp(-t * 320) * 0.1
    x = fade(lp(note * 0.85 + thock + click, 5000), 0.001, 0.05)
    return norm(room(echo(x, T, mix=0.14, repeats=3), 0.9, 0.22, damp=3500)), 0.0


def sfx_boot(T, chord):
    """Devices powering on: an 8th-note glide up to the chord's root, then root–fifth–octave blooming in 32nds.
    The hit is the bloom — 'ONLINE'."""
    root = note_in(chord, 0, 55, 66)
    rise = T.e8
    n = int((rise + 1.1) * SR)
    t = tt(n)
    glide_up = glide(np.geomspace(mtof(root - 12), mtof(root), n)) * np.minimum(1, t / rise) * np.exp(-np.maximum(0, t - rise) * 5) * 0.3
    s0 = int(rise * SR)
    bloom = np.zeros(n)
    bloom[s0:] = bell([mtof(root), mtof(root + 7), mtof(root + 12)], (n - s0) / SR, T.t32, 0.7, 3.0)[: n - s0] * 0.42
    return norm(room(lp(glide_up, 1500) + bloom, 1.2, 0.3, damp=3500)), rise


def sfx_marker(T, strokes_per_beat, dur=0.7):
    """Marker on the whiteboard: muted friction whose strokes run in time (16th triplets or 32nds)."""
    n = int(dur * SR)
    t = tt(n)
    rate = strokes_per_beat / T.beat / 2  # |sin| strokes twice per cycle
    mod = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * rate * t + 0.6 * np.sin(2 * np.pi * (rate / 3.8) * t + rng.uniform(0, 3))))
    x = bp(noise(n), 900, 3000) * mod * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1)
    return norm(x * 0.7), 0.0


def sfx_paper_cut(chord):
    """Hard cut into the paper interlude: a page 'thwip' with a low tap on the chord's root under it."""
    n = int(0.35 * SR)
    t = tt(n)
    page = bp(noise(n), 700, 3500) * np.minimum(1, t / 0.008) * np.exp(-t * 30)
    tap = np.sin(2 * np.pi * mtof(note_in(chord, 0, 40, 47)) * t) * np.exp(-t * 28) * 0.6
    return norm(room(page + tap, 0.5, 0.12, damp=3000)), 0.0


def sfx_paper():
    """Sheets folding into the header band. The hit is the middle of the fold, where it is loudest."""
    n = int(0.32 * SR)
    u = tt(n) / 0.32
    x = sweep_filter(noise(n), np.geomspace(900, 3200, n), 'band') * np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    return norm(lp(x, 3500)), 0.16


def sfx_stamp(chord):
    """Rubber stamp: low thump + a dull slap + the paper under it, the knock on the chord's root."""
    n = int(0.7 * SR)
    t = tt(n)
    thump = glide(42 + 40 * np.exp(-t * 30)) * np.exp(-t * 14)
    slap = lp(noise(n), 2000) * np.exp(-t * 60) * 0.6
    paper = bp(noise(n), 900, 2600) * np.exp(-t * 45) * 0.25
    knock = np.sin(2 * np.pi * mtof(note_in(chord, 0, 60, 71)) * t) * np.exp(-t * 40) * 0.2
    return norm(room(saturate(thump + slap + paper + knock, 1.4), 0.7, 0.18, damp=2800)), 0.0


def sfx_shimmer(T, chord, dur=2.6):
    """Logo bloom: a warm bell arpeggio up the chord in 32nds over a string swell, soft air."""
    n = int(dur * SR)
    out = np.zeros((2, n))
    notes = tones_from(chord, note_in(chord, 0, 60, 71), 6)
    for i, m in enumerate(notes):
        s0 = int(i * T.t32 * SR)
        add(out, bell([mtof(m)], dur - i * T.t32, 0, 0.9, 1.8)[: n - s0], s0, 0.5, pan=np.sin(i * 1.3) * 0.6)
    add(out, strings([notes[0], notes[0] + 7, notes[0] + 12], dur, attack=0.05, release=1.2, cutoff=2400) * 2.5, 0)
    add(out, lp(noise(n), 4000) * np.exp(-tt(n) * 2.5) * 0.04, 0)
    return norm(room(out, 2.6, 0.4, damp=3500)), 0.0


def build_sfx(spec):
    beat = spec['music']['beatFrames'] / spec['fps']
    T = Tempo(beat, beat / 2, beat / 4, beat / 8)
    fixed = lambda make, **kw: Sfx(lambda _: make(), **kw)  # noqa: E731
    tuned = lambda make: Sfx(make, tuned=True)  # noqa: E731
    tap = lambda k: tuned(lambda ch: sfx_tap(T, tones_from(ch, 67, 4)[k - 1]))  # noqa: E731
    rise = lambda k: tuned(lambda ch: sfx_rise(T, tones_from(ch, 65, 4)[k - 1]))  # noqa: E731
    land = lambda k: tuned(lambda ch: sfx_land(T, tones_from(ch, 65, 4)[k - 1]))  # noqa: E731

    def bell2(ch):
        root = note_in(ch, 0, 70, 81)
        return sfx_bell(T, [root, root + 7], T.t32)

    def bell3(ch):
        root = note_in(ch, 0, 70, 81)
        return sfx_bell(T, [root, root + (3 if is_minor(ch) else 4), root + 7], T.s16)

    return {
        # hits, and the swells that breathe into them (a swell's hit is its end)
        'boom': tuned(lambda ch: (sfx_hit(low_voicing(ch), 1.0, 0.45), 0.0)),
        'boom-big': tuned(lambda ch: (sfx_hit(low_voicing(ch, (24,)), 1.6, 0.6, voices=True), 0.0)),
        'boom-soft': tuned(lambda ch: (sfx_hit(low_voicing(ch), 0.5, 0.5), 0.0)),
        'boom-final': tuned(lambda ch: (sfx_hit(low_voicing(ch, (24, 28 if not is_minor(ch) else 27)), 1.3, 0.75, voices=True), 0.0)),
        'swell': fixed(lambda: (sfx_reverse_swell(DM_LOW, 2 * beat, 0.45), 2 * beat), end_fade=0.004),
        'swell-bridge': fixed(lambda: (sfx_reverse_swell(A_MAJ, 2 * beat, 0.6), 2 * beat), end_fade=0.004),
        'swell-long': fixed(lambda: (sfx_reverse_swell(A_MAJ + [69], 1.5 * beat, 0.75), 1.5 * beat), end_fade=0.004),
        'thud': tuned(lambda ch: (sfx_thud(thump_hz(ch, 31, 36)), 0.0)),
        'thud-high': tuned(lambda ch: (sfx_thud(thump_hz(ch, 36, 43)), 0.0)),
        # moves
        'zoom': fixed(lambda: sfx_zoom(T)),
        'push': tuned(lambda ch: sfx_push(T, ch)),
        'iris': tuned(lambda ch: sfx_iris(T, ch)),
        'wipe': tuned(lambda ch: sfx_wipe(T, ch)),
        'whip': fixed(lambda: sfx_whip(T)),
        'dip': fixed(lambda: sfx_dip(T)),
        'swish': fixed(lambda: sfx_swish(T)),
        'swish-b': fixed(lambda: sfx_swish(T, 240, 2800, (0.7, -0.7))),
        'cut-1': tuned(lambda ch: sfx_cut(T, ch, 400, 2600, (-0.5, 0.2))),
        'cut-2': tuned(lambda ch: sfx_cut(T, ch, 450, 3000, (0.5, -0.2))),
        'cut-3': tuned(lambda ch: sfx_cut(T, ch, 380, 2400, (-0.3, 0.4))),
        'cut-4': tuned(lambda ch: sfx_cut(T, ch, 420, 2800, (0.3, -0.4))),
        'cut-out': tuned(lambda ch: sfx_cut(T, ch, 300, 1900, (0.3, -0.3))),  # back to the wide shot: lower, softer
        # interface & foley
        'open': tuned(sfx_open),
        'tap-1': tap(1),
        'tap-2': tap(2),
        'tap-3': tap(3),
        'tap-4': tap(4),
        'tiles': tuned(lambda ch: sfx_tiles(T, ch)),
        'bell': tuned(bell2),
        'bell-3': tuned(bell3),
        'lock': tuned(sfx_lock),
        'deny': tuned(lambda ch: sfx_deny(T, ch)),
        'rec': tuned(lambda ch: sfx_rec(T, ch)),
        'stack': tuned(lambda ch: sfx_stack(T, ch)),
        'strike-1': fixed(lambda: sfx_strike(1.0)),
        'strike-2': fixed(lambda: sfx_strike(0.92)),
        'strike-3': fixed(lambda: sfx_strike(0.85)),
        'strike-4': fixed(lambda: sfx_strike(0.78)),
        'rise-1': rise(1),
        'rise-2': rise(2),
        'rise-3': rise(3),
        'rise-4': rise(4),
        'land-1': land(1),
        'land-2': land(2),
        'land-3': land(3),
        'land-4': land(4),
        'boot': tuned(lambda ch: sfx_boot(T, ch)),
        'marker-1': fixed(lambda: sfx_marker(T, 6)),
        'marker-2': fixed(lambda: sfx_marker(T, 8)),
        'marker-3': fixed(lambda: sfx_marker(T, 6, 0.6)),
        'paper-cut': tuned(sfx_paper_cut),
        'paper': fixed(sfx_paper),
        'stamp': tuned(sfx_stamp),
        'shimmer': tuned(lambda ch: sfx_shimmer(T, ch)),
    }


def sfx_bus_fx(x):
    """Glue the effects into the music's space: a touch of the same hall."""
    return reverb(x, 2.4, 0.08, pre=0.02, damp=3000, er=6)
