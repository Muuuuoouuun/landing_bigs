"""
Shared DSP for the procedural soundtrack — filters, envelopes, space, dynamics and stereo.
Signals are float64 at 48 kHz: mono (n,) or stereo (2, n).
"""
from functools import lru_cache

import numpy as np
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- basics
def tt(n):
    return np.arange(n) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(n):
    return rng.standard_normal(n)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)


def peak_eq(x, fc, gain_db, q=0.9):
    """RBJ peaking biquad."""
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * fc / SR
    alpha = np.sin(w) / (2 * q)
    b0, b1, b2 = 1 + alpha * a, -2 * np.cos(w), 1 - alpha * a
    a0, a1, a2 = 1 + alpha / a, -2 * np.cos(w), 1 - alpha / a
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]])
    return sosfilt(sos, x)


def each(x, fn):
    """Apply a mono process to each channel of a stereo signal."""
    return np.vstack([fn(x[0]), fn(x[1])]) if x.ndim == 2 else fn(x)


@lru_cache(maxsize=None)
def _sweep_sos(kind, step, q_order):
    c = 2 ** (step / 96)  # cutoffs quantised to 1/96 octave (0.7 %) so sweeps reuse coefficients
    if kind == 'band':
        return butter(q_order, [c * 0.7, min(c * 1.4, SR / 2 - 200)], 'band', fs=SR, output='sos')
    return butter(q_order, c, kind, fs=SR, output='sos')


def sweep_filter(x, cutoffs, kind='low', block=64, q_order=2):
    """Time-varying filter: the cutoff follows a per-sample array, updated every block with the filter
    state carried across — restarting each block from silence buzzes at SR/block and fizzes up top."""
    out = np.zeros_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(cutoffs[min(i + block // 2, len(x) - 1)], 40, SR / 2 - 400))
        sos = _sweep_sos(kind, int(round(np.log2(c) * 96)), q_order)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
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


def glide(f, n=None):
    """sin() of a (possibly time-varying) frequency."""
    f = np.asarray(f, dtype=float)
    if f.ndim == 0:
        return np.sin(2 * np.pi * f * tt(n))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def saturate(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- stereo
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


def widen(x, amount=1.3):
    """Scale the side signal (mid/side)."""
    mid, side = (x[0] + x[1]) / 2, (x[0] - x[1]) / 2 * amount
    return np.vstack([mid + side, mid - side])


def mono_lows(x, fc=120):
    """Below fc both channels carry the same (mid) signal — tight, mono-safe low end."""
    mid = (x[0] + x[1]) / 2
    low = lp(mid, fc, 4)
    return np.vstack([hp(x[0], fc, 4) + low, hp(x[1], fc, 4) + low])


# ---------------------------------------------------------------- space
@lru_cache(maxsize=None)
def _impulse(rt, pre, damp, er):
    """Stereo IR: a few early reflections, then a diffuse tail that darkens as it decays. Each room has its
    own seeded generator, so it sounds the same whatever was synthesized before it."""
    g = np.random.default_rng([int(rt * 1000), int(pre * 1e5), int(damp), er])
    n = int(rt * SR * 1.1)
    t = tt(n)
    decay = np.exp(-6.9 * t / rt)
    irs = []
    for _ in range(2):
        nz = g.standard_normal(n)
        bright, dark = lp(nz, damp), lp(nz, damp / 4)
        mix = np.clip(t / rt, 0, 1)
        tail = (bright * (1 - mix) + dark * mix) * decay
        tail *= np.clip(t / 0.02, 0, 1)  # the tail swells in behind the early reflections
        body = tail / np.sqrt(np.sum(tail ** 2))
        if er:
            early = np.zeros(n)
            for k in range(er):
                d = int(g.uniform(0.004, 0.012 + 0.006 * er) * SR)
                if d < n:
                    early[d] += g.choice([-1, 1]) * g.uniform(0.35, 0.8) * (1 - k / (er + 1))
            early = lp(early, damp)
            body = body + 0.55 * early / np.sqrt(np.sum(early ** 2))  # reflections carry ~a quarter of the energy
        ir = np.concatenate([np.zeros(int(pre * SR)), body])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


def reverb(x, rt=1.6, wet=0.3, pre=0.015, damp=4500, width=1.0, er=6, lo_cut=120, keep_tail=False):
    """Stereo convolution reverb with early reflections and a damped noise tail. The send is high-passed at
    lo_cut: a noise tail answers any single low pitch with a random gain (a room mode), and low tails are mud.
    keep_tail lengthens the output so a one-shot rings out instead of stopping with its dry sound."""
    irs = _impulse(rt, pre, damp, er)
    if x.ndim == 1:
        x = np.vstack([x, x])
    if keep_tail:
        x = np.pad(x, ((0, 0), (0, len(irs[0]))))
    send = x.mean(axis=0)
    if lo_cut:
        send = hp(send, lo_cut)
    wl = fftconvolve(send, irs[0])[: x.shape[1]]
    wr = fftconvolve(send, irs[1])[: x.shape[1]]
    mid, side = (wl + wr) / 2, (wl - wr) / 2 * width
    return x * (1 - wet * 0.35) + np.vstack([mid + side, mid - side]) * wet


def delay(x, time, feedback=0.35, mix=0.2, repeats=6, damp=3500):
    """Ping-pong delay: each repeat darker than the last, alternating sides."""
    if x.ndim == 1:
        x = stereo(x)
    n = x.shape[1]
    d = int(time * SR)
    src = x.mean(axis=0)
    wet = np.zeros_like(x)
    for r in range(1, repeats + 1):
        off = r * d
        if off >= n:
            break
        tap = lp(src, damp * 0.85 ** r)[: n - off] * feedback ** (r - 1)
        wet[(r + 1) % 2, off:] += tap
    return x + wet * mix


# ---------------------------------------------------------------- dynamics
def _env_db(x, block):
    mono = np.max(np.abs(x), axis=0) if x.ndim == 2 else np.abs(x)
    nb = int(np.ceil(len(mono) / block))
    pad = np.pad(mono, (0, nb * block - len(mono)))
    rms = np.sqrt(np.mean(pad.reshape(nb, block) ** 2, axis=1))
    return 20 * np.log10(rms + 1e-9)


def _smooth(target, attack, release, block):
    """One-pole attack/release smoothing over block values (gain reduction in dB, ≤ 0)."""
    a_att = np.exp(-block / (attack * SR))
    a_rel = np.exp(-block / (release * SR))
    out = np.zeros_like(target)
    g = 0.0
    for i, v in enumerate(target):
        coef = a_att if v < g else a_rel
        g = coef * g + (1 - coef) * v
        out[i] = g
    return out


def _apply_gain_db(x, gr_db, block):
    n = x.shape[-1]
    centers = np.arange(len(gr_db)) * block + block / 2
    gain = 10 ** (np.interp(np.arange(n), centers, gr_db) / 20)
    return x * gain


def compress(x, threshold_db=-18, ratio=2.0, attack=0.01, release=0.15, knee_db=6, makeup_db=0.0, block=240):
    """Stereo-linked RMS compressor with a soft knee."""
    lvl = _env_db(x, block)
    over = lvl - threshold_db
    gr = np.where(over <= -knee_db / 2, 0.0,
                  np.where(over >= knee_db / 2, -over * (1 - 1 / ratio),
                           -(1 - 1 / ratio) * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    gr = _smooth(gr, attack, release, block)
    return _apply_gain_db(x, gr + makeup_db, block)


def duck(x, key, depth_db=4.0, threshold_db=-32, range_db=18, attack=0.006, release=0.3, block=240):
    """Side-chain ducking: x dips by up to depth_db as the key rises above threshold."""
    lvl = _env_db(key, block)
    amount = np.clip((lvl - threshold_db) / range_db, 0, 1)
    gr = _smooth(-depth_db * amount, attack, release, block)
    gr = gr[: int(np.ceil(x.shape[-1] / block))]
    if len(gr) < int(np.ceil(x.shape[-1] / block)):
        gr = np.pad(gr, (0, int(np.ceil(x.shape[-1] / block)) - len(gr)))
    return _apply_gain_db(x, gr, block)


def limiter(x, ceiling=0.89, window=1200):
    """Look-ahead brickwall limiter: min-hold the required gain, then smooth it."""
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    held = minimum_filter1d(need, size=window * 2, mode='nearest')
    padded = np.pad(held, window // 2, mode='edge')  # zero padding would fade the first and last 12 ms
    smooth = np.convolve(padded, np.ones(window) / window, mode='valid')[: len(held)]
    return x * np.minimum(smooth, need)


def tilt(x):
    """Warmth without dulling: a ~-1.5 dB high shelf above 8 kHz takes the edge off any hiss."""
    return x + hp(x, 8000) * -0.16
