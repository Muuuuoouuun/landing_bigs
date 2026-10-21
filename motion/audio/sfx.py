"""
Sound effects — soft, weighty and in key with the score.

Hits carry an orchestral stab on the chord the music is on (Dm on the impact and the AI slam,
F on the crossing, D major on the logo). Each riser is a struck chord's reverb played backwards, in
the harmony sounding under it — Dm into the impact, the dominant (A major) into the AI slam and the
logo — so it breathes into the hit instead of rubbing against the music. Every transition has its
own move (zoom, push, iris, wipe, whip, dip), close-up cuts get a soft focus pull, and repeated
sounds come in variants.
"""
import numpy as np

from dsp import (SR, add, autopan, bp, fade, glide, lp, mtof, noise, norm, reverb, rng, saturate, stereo,
                 sweep_filter, tt)
from instruments import bell, choir, stab, strings


def room(x, rt, wet, **kw):
    """Reverb for a one-shot: the room rings out past the dry sound (a cut-off tail clicks)."""
    return reverb(x, rt, wet, keep_tail=True, **kw)


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


DM_LOW = [38, 45, 50, 53, 57]
F_MAJ = [41, 48, 53, 57, 60]
D_MAJ = [38, 45, 50, 54, 57, 62, 66]
A_MAJ = [45, 52, 57, 61, 64]  # the dominant: the bridge and the outro hold this chord


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
    """A struck chord's reverb, reversed: a swell that breathes in the harmony under it."""
    n = int(dur * SR)
    struck = np.zeros((2, int((dur + 1.2) * SR)))
    add(struck, stab(chord, 0.5, bright), 0)
    wet = reverb(struck, 2.8, 1.0, pre=0.0, damp=3000, er=0) - struck * 0.65  # (almost) only the tail
    rev = wet[:, ::-1][:, -n:]
    t = tt(n)
    ramp = (t / dur) ** 1.6
    air = sweep_filter(noise(n), np.geomspace(250, 2600, n), 'low') * ramp ** 1.4 * 0.35
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(35, 70, n)) / SR) * ramp ** 1.8 * 0.4
    x = norm(rev, 1.0) * ramp + stereo(air + sub)
    x = x * np.minimum(1, (dur - t) / 0.006)
    return norm(x, 0.9)


def sfx_thud(f0=55):
    """Weighty text slam."""
    n = int(1.0 * SR)
    t = tt(n)
    x = glide(f0 + 70 * np.exp(-t * 22)) * np.exp(-t * 7) + lp(noise(n), 900) * np.exp(-t * 28) * 0.6
    return norm(room(saturate(x, 1.3), 1.0, 0.22, damp=3000))


# ---------------------------------------------------------------- moves (transitions and cuts)
def _band_whoosh(dur, peak_at, lo, hi, pan=(-0.7, 0.7), body=0.35, settle=0.75):
    n = int(dur * SR)
    u = tt(n) / dur
    after = np.clip((u - peak_at) / (1 - peak_at), 0, 1)
    shape = np.where(u < peak_at, (u / peak_at) ** 2, np.exp(-after * 2.4) * 0.5 * (1 + np.cos(np.pi * after)))
    cut = lo + (hi - lo) * np.where(u < peak_at, (u / peak_at) ** 1.4, 1 - (u - peak_at) / (1 - peak_at) * settle)
    x = sweep_filter(noise(n), cut, 'band') * shape + lp(noise(n), 500) * shape * body
    return autopan(x, *pan), shape


def sfx_swish(dur=0.45, peak_at=0.55, lo=200, hi=3200, pan=(-0.7, 0.7)):
    """Soft, dark whoosh: band sweep up and back down plus a low air body, panned across."""
    x, _ = _band_whoosh(dur, peak_at, lo, hi, pan)
    return norm(room(x, 0.8, 0.18, damp=3200))


def sfx_zoom():
    """Zoom-through: the air rises in pitch as the shot rushes past, a soft tone climbing under it."""
    dur, peak = 0.6, 0.7
    x, shape = _band_whoosh(dur, peak, 250, 3600, (-0.3, 0.3), body=0.25, settle=0.5)
    n = x.shape[1]
    tone = glide(np.geomspace(180, 720, n)) * shape * 0.12
    return norm(room(x + stereo(tone), 0.9, 0.2, damp=3500))


def sfx_push():
    """Push cut: a short rush that lands on the edit with a soft punch."""
    dur = 0.36
    x, _ = _band_whoosh(dur, 0.6, 300, 3600, (-0.2, 0.2), body=0.4)
    n = x.shape[1]
    hit = np.zeros(n)
    s0 = int(0.6 * dur * SR)
    m = n - s0
    tb = tt(m)
    hit[s0:] = glide(110 + 60 * np.exp(-tb * 40)) * np.exp(-tb * 18) * 0.7
    return norm(room(x + stereo(hit), 0.8, 0.18, damp=3000))


def sfx_iris():
    """Iris opening: a breathy swirl and a soft open-fifth shimmer blooming as the circle widens."""
    dur = 0.75
    n = int(dur * SR)
    t = tt(n)
    swirl = sweep_filter(noise(n), np.geomspace(400, 3000, n), 'band') * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    shimmer = bell([mtof(81), mtof(88)], dur, 0.05, 0.7, 3.0) * np.clip((t - 0.15) / 0.1, 0, 1) * 0.3
    pan = np.sin(2 * np.pi * 1.4 * t) * 0.6
    a = (pan + 1) * np.pi / 4
    x = np.vstack([swirl * np.cos(a), swirl * np.sin(a)]) * 0.8 + stereo(shimmer)
    return norm(room(x, 1.6, 0.3, damp=3800))


def sfx_wipe():
    """Light wipe: an airy sweep with a faint glassy edge, left to right."""
    x, shape = _band_whoosh(0.5, 0.5, 500, 3800, (-0.8, 0.8), body=0.15)
    n = x.shape[1]
    glass = bell([mtof(86)], n / SR, 0, 0.6, 4.0)[:n] * shape * 0.15
    return norm(room(x + autopan(glass, -0.8, 0.8), 1.0, 0.22, damp=4000))


def sfx_whip():
    """Whip pan: a fast up-and-down sweep thrown across the stereo field."""
    x, _ = _band_whoosh(0.38, 0.45, 300, 3800, (0.9, -0.9), body=0.3, settle=0.85)
    return norm(room(x, 0.7, 0.15, damp=3200))


def sfx_dip():
    """Dip to white: a slow soft breath that swells and settles."""
    dur = 0.8
    n = int(dur * SR)
    t = tt(n)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    x = sweep_filter(noise(n), np.concatenate([np.geomspace(300, 1800, n // 2), np.geomspace(1800, 400, n - n // 2)]), 'low') * env
    return norm(room(stereo(x), 1.6, 0.3, damp=3000))


def sfx_cut(lo, hi, pan, f0):
    """Close-up cut: a quick focus pull — a short air puff and a muted low tick."""
    dur = 0.24
    x, _ = _band_whoosh(dur, 0.7, lo, hi, pan, body=0.2)
    n = x.shape[1]
    tick = np.zeros(n)
    s0 = int(0.7 * dur * SR)
    tb = tt(n - s0)
    tick[s0:] = glide(f0 + 50 * np.exp(-tb * 60)) * np.exp(-tb * 40) * 0.5
    return norm(room(x * 0.8 + stereo(tick), 0.6, 0.15, damp=3000))


# ---------------------------------------------------------------- interface & foley
def sfx_open():
    """Opening 'whoom': a low swell blooming into a soft open-fifth bell."""
    n = int(1.6 * SR)
    t = tt(n)
    air = sweep_filter(noise(n), np.concatenate([np.geomspace(200, 1400, n // 3), np.geomspace(1400, 300, n - n // 3)]), 'low') * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) * 0.5
    low = np.sin(2 * np.pi * 55 * t) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) * 0.6
    chime = bell([mtof(74), mtof(81)], 1.6, 0.05, 0.8, 2.2) * 0.25
    return norm(room(stereo(air + low + chime), 2.0, 0.3, damp=3500))


def sfx_tap(m, dur=0.4):
    """Felt-mallet UI tap, pitched in key — replaces blips, pops, ticks and toggles."""
    n = int(dur * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t * 14)
         + 0.18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 26)
         + 0.06 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 40))
    knock = lp(noise(n), 1400) * np.exp(-t * 250) * 0.08
    return norm(room(fade(x + knock, 0.0015, 0.04), 0.7, 0.18, damp=3500))


def sfx_tiles():
    """The grid filling in: eight soft mallet notes cascading across the stereo field (F major pentatonic)."""
    taps = [sfx_tap(m, 0.5) for m in [65, 69, 72, 74, 77, 81, 84, 86]]
    step = int(0.045 * SR)
    out = np.zeros((2, max(i * step + t.shape[1] for i, t in enumerate(taps))))
    for i, t in enumerate(taps):  # each tap a little further right
        add(out, t.mean(axis=0) * (0.55 + 0.04 * i), i * step, pan=-0.7 + 0.2 * i)
    return norm(out)


def sfx_bell(notes, dur=1.8, spacing=0.07):
    return norm(room(bell([mtof(m) for m in notes], dur, spacing), 1.8, 0.32, damp=4000))


def sfx_lock():
    """Vault latch: a short slide, then a soft 'chunk' with a muted metal glint."""
    n = int(0.7 * SR)
    t = tt(n)
    slide = bp(noise(n), 600, 2500) * np.clip(t / 0.05, 0, 1) * (t < 0.06) * 0.22
    s0 = int(0.06 * SR)
    tb = tt(n - s0)
    chunk = np.zeros(n)
    chunk[s0:] = (glide(130 + 70 * np.exp(-tb * 50)) * np.exp(-tb * 28)
                  + lp(noise(n - s0), 300) * np.exp(-tb * 35) * 0.35
                  + lp((np.sin(2 * np.pi * 2300 * tb) + 0.7 * np.sin(2 * np.pi * 3170 * tb)) * np.exp(-tb * 70), 4000) * 0.07
                  + bp(noise(n - s0), 500, 2200) * np.exp(-tb * 140) * 0.4)
    return norm(room(saturate(slide + chunk, 1.2), 0.7, 0.2, damp=3000))


def sfx_deny():
    """Access blocked: two muted, falling mallet notes (no buzzer)."""
    n = int(0.6 * SR)
    out = np.zeros(n)
    for s0, m in ((0.0, 64), (0.13, 60)):
        a0 = int(s0 * SR)
        tb = tt(n - a0)
        f = mtof(m)
        out[a0:] += (np.sin(2 * np.pi * f * tb) + 0.2 * np.sin(4 * np.pi * f * tb)) * np.exp(-tb * 16)
    return norm(room(lp(out, 900), 0.6, 0.15, damp=2500))


def sfx_rec():
    """Recording starts: two soft rising notes."""
    n = int(0.7 * SR)
    out = np.zeros(n)
    for s0, m in ((0.0, 76), (0.1, 81)):
        a0 = int(s0 * SR)
        tb = tt(n - a0)
        f = mtof(m)
        out[a0:] += (np.sin(2 * np.pi * f * tb) + 0.15 * np.sin(4 * np.pi * f * tb)) * np.exp(-tb * 9) * np.minimum(1, tb / 0.004)
    return norm(room(lp(out, 3500), 0.9, 0.22, damp=3500))


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
    return norm(room(lp(out, 3000), 0.7, 0.18, damp=3000))


def sfx_strike(scale=1.0):
    """Strikethrough: a short, soft downward swish (each of the four a little lower)."""
    n = int(0.26 * SR)
    t = tt(n)
    x = sweep_filter(noise(n), np.geomspace(2200 * scale, 450 * scale, n), 'band') * np.minimum(1, t / 0.012) * np.exp(-t * 12)
    return norm(room(x, 0.5, 0.15, damp=3000))


def sfx_rise(m):
    """One step of the rising check ladder: warm mallet + bell."""
    n = int(0.9 * SR)
    t = tt(n)
    f = mtof(m)
    x = (np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 8) * 0.8) * np.exp(-t * 5)
         + 0.15 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12))
    return norm(room(fade(lp(x, 4500), 0.002, 0.05), 1.0, 0.25, damp=3500))


def sfx_boot():
    """Devices powering on: a warm glide and a soft open-fifth bloom."""
    n = int(1.1 * SR)
    t = tt(n)
    glide_up = glide(np.geomspace(130, 290, n)) * np.minimum(1, t / 0.2) * np.exp(-np.maximum(0, t - 0.3) * 5) * 0.4
    bloom = bell([mtof(62), mtof(69), mtof(74)], 1.1, 0.04, 0.7, 3.0) * np.clip((t - 0.18) / 0.06, 0, 1) * 0.35
    return norm(room(lp(glide_up, 1500) + bloom, 1.2, 0.3, damp=3500))


def sfx_marker(rate=6.5, dur=0.7):
    """Marker on the whiteboard: muted friction with stroke modulation (rate varies per line)."""
    n = int(dur * SR)
    t = tt(n)
    mod = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * rate * t + np.sin(2 * np.pi * (rate / 3.8) * t + rng.uniform(0, 3))))
    x = bp(noise(n), 900, 3000) * mod * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1)
    return norm(x * 0.7)


def sfx_paper_cut():
    """Hard cut into the paper interlude: a page 'thwip' with a low tap under it."""
    n = int(0.35 * SR)
    t = tt(n)
    page = bp(noise(n), 700, 3500) * np.minimum(1, t / 0.008) * np.exp(-t * 30)
    tap = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 28) * 0.6
    return norm(room(page + tap, 0.5, 0.12, damp=3000))


def sfx_paper():
    """Sheets folding into the header band."""
    n = int(0.32 * SR)
    u = tt(n) / 0.32
    x = sweep_filter(noise(n), np.geomspace(900, 3200, n), 'band') * np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    return norm(lp(x, 3500))


def sfx_stamp():
    """Rubber stamp: low thump + a dull slap + the paper under it."""
    n = int(0.7 * SR)
    t = tt(n)
    thump = glide(42 + 40 * np.exp(-t * 30)) * np.exp(-t * 14)
    slap = lp(noise(n), 2000) * np.exp(-t * 60) * 0.6
    paper = bp(noise(n), 900, 2600) * np.exp(-t * 45) * 0.25
    knock = np.sin(2 * np.pi * 300 * t) * np.exp(-t * 40) * 0.2
    return norm(room(saturate(thump + slap + paper + knock, 1.4), 0.7, 0.18, damp=2800))


def sfx_shimmer(dur=2.6):
    """Logo bloom: warm bell arpeggio over a string swell (D major), soft air."""
    n = int(dur * SR)
    out = np.zeros((2, n))
    for i, m in enumerate([62, 66, 69, 74, 78, 81]):
        s0 = int(i * 0.07 * SR)
        add(out, bell([mtof(m)], dur - i * 0.07, 0, 0.9, 1.8)[: n - s0], s0, 0.5, pan=np.sin(i * 1.3) * 0.6)
    add(out, strings([62, 69, 74], dur, attack=0.05, release=1.2, cutoff=2400) * 2.5, 0)
    add(out, lp(noise(n), 4000) * np.exp(-tt(n) * 2.5) * 0.04, 0)
    return norm(room(out, 2.6, 0.4, damp=3500))


def build_sfx(spec):
    fps = spec['fps']
    beat_s = spec['music']['beatFrames'] / fps
    palette = {
        # hits, and the swells that breathe into them
        'boom': sfx_hit(DM_LOW, 1.0, 0.45),
        'boom-big': sfx_hit(DM_LOW + [62], 1.6, 0.6, voices=True),
        'boom-soft': sfx_hit(F_MAJ, 0.5, 0.5),
        'boom-final': sfx_hit(D_MAJ, 1.3, 0.75, voices=True),
        'swell': sfx_reverse_swell(DM_LOW, 28 / fps, 0.45),
        'swell-bridge': sfx_reverse_swell(A_MAJ, 28 / fps, 0.6),
        'swell-long': sfx_reverse_swell(A_MAJ + [69], 20 / fps, 0.75),
        'thud': sfx_thud(55),
        'thud-high': sfx_thud(68),
        # moves
        'zoom': sfx_zoom(),
        'push': sfx_push(),
        'iris': sfx_iris(),
        'wipe': sfx_wipe(),
        'whip': sfx_whip(),
        'dip': sfx_dip(),
        'swish': sfx_swish(0.45),
        'swish-b': sfx_swish(0.45, 0.5, 240, 2800, (0.7, -0.7)),
        'cut-1': sfx_cut(400, 2600, (-0.5, 0.2), 140),
        'cut-2': sfx_cut(450, 3000, (0.5, -0.2), 125),
        'cut-3': sfx_cut(380, 2400, (-0.3, 0.4), 150),
        'cut-4': sfx_cut(420, 2800, (0.3, -0.4), 132),
        'cut-out': sfx_cut(300, 1900, (0.3, -0.3), 110),  # back to the wide shot: lower, softer
        # interface & foley
        'open': sfx_open(),
        'tap-1': sfx_tap(69),
        'tap-2': sfx_tap(72),
        'tap-3': sfx_tap(74),
        'tap-4': sfx_tap(77),
        'tiles': sfx_tiles(),
        'bell': sfx_bell([74, 81], 1.8, 0.06),
        'bell-3': sfx_bell([77, 81, 84], 2.0, beat_s / 4),
        'lock': sfx_lock(),
        'deny': sfx_deny(),
        'rec': sfx_rec(),
        'stack': sfx_stack(),
        'strike-1': sfx_strike(1.0),
        'strike-2': sfx_strike(0.92),
        'strike-3': sfx_strike(0.85),
        'strike-4': sfx_strike(0.78),
        'rise-1': sfx_rise(65),
        'rise-2': sfx_rise(69),
        'rise-3': sfx_rise(72),
        'rise-4': sfx_rise(77),
        'boot': sfx_boot(),
        'marker-1': sfx_marker(6.5),
        'marker-2': sfx_marker(7.4),
        'marker-3': sfx_marker(5.8, 0.6),
        'paper-cut': sfx_paper_cut(),
        'paper': sfx_paper(),
        'stamp': sfx_stamp(),
        'shimmer': sfx_shimmer(),
    }
    return {name: finish(x if x.ndim == 2 else stereo(x)) for name, x in palette.items()}


def sfx_bus_fx(x):
    """Glue the effects into the music's space: a touch of the same hall."""
    return reverb(x, 2.4, 0.08, pre=0.02, damp=3000, er=6)
