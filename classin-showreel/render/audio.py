"""Original score + sound design, synthesised in code (numpy only).

Reads src/timeline.json (bars, beats, VO lines) and out/cues.json (every visible move, exported by
the renderer) and writes out/audio.wav plus stems (out/stems/music.wav, sfx.wav, vo.wav).

  python3 render/audio.py            # music + SFX (+ VO if render/vo/vo_XX.wav exist)

Music: 100 BPM (one bar = 2.4 s), D major. Felt keys, pad and soft sub from frame 0 (the book); kick,
clap and hats from the drop, when the words gather into the brain (4.80); a lift as the imagination
opens out (12.00); the drums step back while the light writes the tagline (19.20); a breath before the
hero (23.40, only a reversed swell); a full warm chord and a low hit on 24.00 under the end card.
"""
import json, math, os, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TL = json.load(open(os.path.join(ROOT, 'src', 'timeline.json'), encoding='utf-8'))
CUES = json.load(open(os.path.join(ROOT, 'out', 'cues.json'), encoding='utf-8'))
B = TL['beats']
DUR = TL['meta']['duration']
BAR = TL['meta']['bar']
BEAT = BAR / 4
N = int(DUR * SR) + SR  # one second of tail room, trimmed at the end
rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def place(bus, sig, t, gain=1.0, pan=0.0):
    """mix a mono (or stereo) signal into a stereo bus at time t with constant-power pan"""
    i = int(round(t * SR))
    if i >= bus.shape[1] or sig.size == 0:
        return
    if sig.ndim == 1:
        if np.isscalar(pan):
            a = (pan + 1) * math.pi / 4
            st = np.vstack([sig * math.cos(a), sig * math.sin(a)])
        else:  # pan sweep
            p = np.linspace(pan[0], pan[1], sig.size)
            a = (p + 1) * np.pi / 4
            st = np.vstack([sig * np.cos(a), sig * np.sin(a)])
    else:
        st = sig
    j = min(bus.shape[1], i + st.shape[1])
    if i < 0:
        st = st[:, -i:]
        i = 0
    bus[:, i:j] += gain * st[:, : j - i]


def fft_filter(x, lo=None, hi=None, slope=2):
    """zero-phase spectral band filter (soft edges)"""
    n = 1 << int(np.ceil(np.log2(len(x) + 1)))
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 * slope))
    if hi:
        g *= 1 / (1 + (f / hi) ** (2 * slope))
    return np.fft.irfft(X * g, n)[: len(x)]


def band_sweep(dur, f0, f1, width=0.6, seed=0):
    """noise whose band centre glides from f0 to f1 (log), via overlap-added spectral frames"""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    if n < 64:
        return np.zeros(n)
    win, hop = 2048, 512
    frames = max(1, (n + win) // hop)
    out = np.zeros(frames * hop + win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    lf = np.log(np.maximum(freqs, 20))
    w = np.hanning(win)
    for k in range(frames):
        u = min(1.0, k * hop / max(1, n))
        fc = math.exp(math.log(f0) + (math.log(f1) - math.log(f0)) * u)
        mag = np.exp(-0.5 * ((lf - math.log(fc)) / width) ** 2)
        spec = mag * np.exp(1j * r.uniform(0, 2 * np.pi, freqs.size))
        out[k * hop : k * hop + win] += np.fft.irfft(spec, win) * w
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def bell_env(n, peak=0.6, p=2.0):
    x = np.linspace(0, 1, n)
    return np.where(x < peak, (x / peak) ** p, ((1 - x) / (1 - peak)) ** (p * 0.8))


def sine_sweep(dur, f0, f1, curve='exp'):
    t = tvec(dur)
    if curve == 'exp':
        f = f0 * (f1 / f0) ** (t / dur)
    else:
        f = f0 + (f1 - f0) * (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb_ir(dur=2.6, seed=3, damp=3200):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    ir = r.standard_normal((2, n)) * np.exp(-np.arange(n) / (0.55 * SR))
    ir[0] = fft_filter(ir[0], hi=damp, lo=180)
    ir[1] = fft_filter(ir[1], hi=damp, lo=180)
    ir[:, : int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve(x, ir):
    n = 1 << int(np.ceil(np.log2(x.shape[1] + ir.shape[1])))
    out = np.zeros((2, x.shape[1]))
    for c in range(2):
        y = np.fft.irfft(np.fft.rfft(x[c], n) * np.fft.rfft(ir[c], n), n)
        out[c] = y[: x.shape[1]]
    return out


# ---------------------------------------------------------------- music
CHORDS = {
    'Dadd9': [50, 57, 62, 64, 66, 69], 'Bm7': [47, 54, 59, 62, 66, 69], 'Gmaj7': [43, 50, 55, 59, 62, 66],
    'D': [50, 57, 62, 66, 69, 74], 'A': [45, 52, 57, 61, 64, 69], 'Em7': [52, 59, 62, 67, 71, 74],
    'Asus4': [45, 52, 57, 62, 64, 69],
}
ROOTS = {'Dadd9': 38, 'Bm7': 35, 'Gmaj7': 43, 'D': 38, 'A': 45, 'Em7': 40, 'Asus4': 45}
# one chord per bar: logo · app · classroom ×2 · trophy · family · future · every classroom · tagline · breath · hero · end
PROG = ['Dadd9', 'Bm7', 'Gmaj7', 'A', 'Bm7', 'Gmaj7', 'D', 'A', 'Em7', 'Asus4', 'Dadd9', 'Dadd9']
DROP, LIFT, BREATH, HERO = B['drop'], B['lift'], B['breath'], B['hero']
CALM = B['sweepA']  # drums step back while the light writes the tagline
BB, HB = int(BREATH // BAR), int(HERO // BAR)  # breath bar, hero bar


def soft_tone(f, dur, harm=(1, 0.32, 0.12, 0.05), detune=0.0):
    t = tvec(dur)
    s = np.zeros_like(t)
    for k, a in enumerate(harm, 1):
        s += a * np.sin(2 * np.pi * f * k * (1 + detune) * t + k * 0.7)
    return s


def build_music():
    pad, keys, sub, drums, pl = (np.zeros((2, N)) for _ in range(5))
    # pad: one voice per chord tone, three detuned copies, slow swell per bar
    for b, ch in enumerate(PROG):
        t0 = b * BAR
        if t0 >= DUR:
            break
        L = BAR + 0.9 if b < HB + 1 else DUR - t0 + 1.0
        if b == BB:
            L = BREATH - t0 + 0.05  # the breath: the pad cuts out on beat 4
        for m in CHORDS[ch][1:]:
            for d, pan in ((-0.004, -0.5), (0.0, 0.0), (0.004, 0.5)):
                s = soft_tone(midi(m), L, harm=(1, 0.45, 0.22, 0.12, 0.06), detune=d)
                e = adsr(len(s), a=0.6 if b not in (int(DROP // BAR), HB) else 0.02, r=0.8 if b != BB else 0.04)
                place(pad, s * e * 0.022, t0, pan=pan)
    pad[0] = fft_filter(pad[0], hi=2600, lo=90)
    pad[1] = fft_filter(pad[1], hi=2600, lo=90)

    # felt keys: 8th-note arpeggio, felt-soft, from frame 0 (rests in the breath)
    pattern = [0, 2, 3, 1, 4, 2, 3, 5]
    for b, ch in enumerate(PROG[:BB + 1]):
        for k in range(8):
            t = b * BAR + k * BEAT / 2
            if BREATH - 0.05 <= t < HERO:
                continue
            m = CHORDS[ch][1 + pattern[k] % 5] + 12
            vel = (0.9 if k % 2 == 0 else 0.6) * (0.95 if b < int(DROP // BAR) else 1.0)
            s = soft_tone(midi(m), 1.4, harm=(1, 0.25, 0.08)) * env_exp(int(1.4 * SR), 0.45) * adsr(int(1.4 * SR), 0.004, 0.2)
            place(keys, s * 0.05 * vel, t, pan=0.25 * math.sin(k * 1.3))
    keys[0] = fft_filter(keys[0], hi=3200)
    keys[1] = fft_filter(keys[1], hi=3200)

    # plucks: 16ths in pentatonic from the drop to the breath
    penta = [74, 76, 78, 81, 83, 86]
    for i in range(int((BREATH - DROP) / (BEAT / 4))):
        t = DROP + i * BEAT / 4
        if i % 4 == 3 or (t < LIFT and i % 2):
            continue
        m = penta[(i * 5 + (i // 8)) % len(penta)]
        s = soft_tone(midi(m), 0.4, harm=(1, 0.5, 0.2)) * env_exp(int(0.4 * SR), 0.09)
        place(pl, s * (0.022 if t < LIFT else 0.03), t, pan=0.45 * math.sin(i * 0.9))

    # sub: root per bar, ducked by the kick after the drop
    for b, ch in enumerate(PROG):
        t0 = b * BAR
        if t0 >= DUR:
            break
        L = BAR if b < HB else DUR - t0 + 0.5
        if b == BB:
            L = BREATH - t0
        s = np.sin(2 * np.pi * midi(ROOTS[ch]) * tvec(L)) + 0.15 * np.sin(4 * np.pi * midi(ROOTS[ch]) * tvec(L))
        e = adsr(len(s), 0.08 if b != HB else 0.005, 0.15 if b != BB else 0.03) * (0.5 if b < int(DROP // BAR) else 1.0)
        if b >= HB:
            e *= env_exp(len(s), 2.8)
        place(sub, s * e * 0.16, t0)

    # drums from the drop to the breath
    kick_t = []
    t = DROP
    while t < CALM - 0.01:
        kick_t.append(t)
        t += BEAT
    for t in kick_t:
        k = sine_sweep(0.42, 160, 44) * env_exp(int(0.42 * SR), 0.11)
        k[: int(0.003 * SR)] += rng.standard_normal(int(0.003 * SR)) * 0.4
        place(drums, k * 0.5, t)
        # sidechain pump on pad + sub
        i0, i1 = int(t * SR), min(N, int((t + 0.32) * SR))
        duck = 1 - 0.45 * np.exp(-np.arange(i1 - i0) / (0.09 * SR))
        sub[:, i0:i1] *= duck
        pad[:, i0:i1] *= 1 - 0.25 * np.exp(-np.arange(i1 - i0) / (0.12 * SR))
    for b in range(int(DROP // BAR), BB + 1):
        for beat in (1, 3):
            t = b * BAR + beat * BEAT
            if t >= CALM:
                continue
            c = np.zeros(int(0.25 * SR))
            for off in (0, 0.011, 0.023):
                j = int(off * SR)
                n = int(0.012 * SR)
                c[j : j + n] += rng.standard_normal(n) * np.linspace(1, 0.2, n)
            tail = rng.standard_normal(len(c)) * env_exp(len(c), 0.06) * 0.5
            c = fft_filter(c + tail, lo=900, hi=5200)
            place(drums, c * 0.16, t, pan=0.05)
    i = 0
    t = DROP + BEAT / 2
    step = BEAT / 2
    while t < BREATH - 0.01:
        n = int(0.06 * SR)
        hh = fft_filter(rng.standard_normal(n), lo=7000) * env_exp(n, 0.018 if t < LIFT else 0.014)
        acc = 1.0 if abs(((t - DROP) / BEAT) % 1 - 0.5) < 0.01 else 0.6
        place(drums, hh * 0.05 * acc, t, pan=0.3)
        step = BEAT / 2 if t < LIFT else BEAT / 4
        t += step
        i += 1
    # the lift: crash + brighter pad
    n = int(2.2 * SR)
    crash = fft_filter(rng.standard_normal(n), lo=4500) * env_exp(n, 0.6)
    place(drums, crash * 0.06, LIFT, pan=-0.1)
    # fill into the tagline
    for k in range(8):
        t = CALM - BEAT * 2 + k * BEAT / 4
        n = int(0.09 * SR)
        sn = fft_filter(rng.standard_normal(n), lo=1200, hi=7000) * env_exp(n, 0.03)
        place(drums, sn * (0.04 + k * 0.012), t)

    # the hero: full warm chord + low hit, ringing under the end card
    for m in [38, 45, 50, 57, 62, 64, 66, 69, 74]:
        s = soft_tone(midi(m), DUR - HERO + 1, harm=(1, 0.3, 0.1, 0.04)) * env_exp(int((DUR - HERO + 1) * SR), 2.2)
        s *= adsr(len(s), 0.004, 0.6)
        place(keys, s * 0.05, HERO, pan=((m % 7) - 3) / 6)
    # end card: a soft arpeggio echo
    for k, m in enumerate([74, 78, 81, 86]):
        s = soft_tone(midi(m), 1.6, harm=(1, 0.2)) * env_exp(int(1.6 * SR), 0.6)
        place(keys, s * 0.03, B['lineB'] + k * BEAT / 2, pan=-0.3 + k * 0.2)

    music = pad + keys * 1.0 + sub + drums + pl
    return music, {'pad': pad, 'keys': keys, 'sub': sub, 'drums': drums}


# ---------------------------------------------------------------- sound design
def sfx_voice(c):
    ty, g = c['type'], c.get('gain', 1.0)
    dur = c.get('dur', 0.3)
    if ty == 'slam':
        n = int(1.4 * SR)
        boom = sine_sweep(1.4, 120, 38) * env_exp(n, 0.32)
        thud = np.sin(2 * np.pi * 190 * tvec(1.4)) * env_exp(n, 0.05)
        crack = fft_filter(rng.standard_normal(n), lo=1500) * env_exp(n, 0.012)
        shim = band_sweep(1.4, 7000, 9000, 0.5, seed=1) * env_exp(n, 0.35)
        return (boom * 0.9 + thud * 0.5 + crack * 0.6 + shim * 0.18) * g, 0.0, 0.25
    if ty == 'hit':
        n = int(3.2 * SR)
        boom = sine_sweep(3.2, 95, 34) * env_exp(n, 0.75)
        thud = np.sin(2 * np.pi * 150 * tvec(3.2)) * env_exp(n, 0.07)
        crack = fft_filter(rng.standard_normal(n), lo=900) * env_exp(n, 0.02)
        shim = band_sweep(3.2, 5500, 8000, 0.5, seed=2) * env_exp(n, 0.9)
        return (boom * 1.0 + thud * 0.5 + crack * 0.35 + shim * 0.12) * g, 0.0, 0.35
    if ty == 'boom':
        n = int(1.8 * SR)
        s = sine_sweep(1.8, 90, 40) * env_exp(n, 0.45) + fft_filter(rng.standard_normal(n), hi=400) * env_exp(n, 0.06) * 0.6
        return s * 0.8 * g, 0.0, 0.2
    if ty in ('whoosh', 'swipe', 'air'):
        f0, f1 = c.get('f0', 800 if ty == 'swipe' else 600), c.get('f1', 4200 if ty == 'swipe' else 2400)
        if ty == 'air':
            f0, f1 = 2000, 6000
        s = band_sweep(dur, f0, f1, 0.55 if ty != 'air' else 0.8, seed=int(c['t'] * 100)) * bell_env(int(dur * SR), 0.72 if ty == 'whoosh' else 0.5, 1.6)
        if c.get('big'):
            n = int(dur * SR)
            s = s + 0.5 * fft_filter(rng.standard_normal(n), hi=260) * bell_env(n, 0.8, 2)
        return s * g * 0.6, c.get('pan', 0.0), 0.15
    if ty == 'reverse':
        n = int(dur * SR)
        nz = band_sweep(dur, 500, 6000, 0.7, seed=5) * np.linspace(0, 1, n) ** 3
        ch = sum(np.sin(2 * np.pi * midi(m) * tvec(dur)) for m in (62, 66, 69, 74)) * np.linspace(0, 1, n) ** 4 * 0.25
        return (nz * 0.7 + ch) * g * 0.6, 0.0, 0.3
    if ty == 'thump':
        f = c.get('f', 80)
        s = sine_sweep(0.35, f * 1.8, f) * env_exp(int(0.35 * SR), 0.07)
        return s * g * 0.7, 0.0, 0.05
    if ty == 'zip':
        f0, f1 = c.get('f0', 600), c.get('f1', 2400)
        n = int(dur * SR)
        s = sine_sweep(dur, f0, f1) * bell_env(n, 0.8, 1.5) * 0.35 + band_sweep(dur, f0 * 2, f1 * 2, 0.4, seed=9) * bell_env(n, 0.8, 1.5) * 0.4
        return s * g, c.get('pan', 0.0), 0.15
    if ty == 'tick':
        r = np.random.default_rng(c.get('seed', 0))
        n = int(0.05 * SR)
        f = 3000 * c.get('bright', 1) * (0.9 + 0.2 * r.random())
        s = np.sin(2 * np.pi * f * tvec(0.05)) * env_exp(n, 0.006) * 0.5
        s[: int(0.0015 * SR)] += r.standard_normal(int(0.0015 * SR)) * 0.6
        return s * g, (r.random() - 0.5) * 0.4, 0.04
    if ty == 'pop':
        s = sine_sweep(0.08, 1100 * c.get('pitch', 1), 700 * c.get('pitch', 1)) * env_exp(int(0.08 * SR), 0.02)
        return s * g, 0.15, 0.05
    if ty == 'riser':
        n = int(dur * SR)
        s = sum(np.sin(2 * np.pi * np.cumsum(300 * (4 ** (np.arange(n) / n)) * k) / SR) / k for k in (1, 2, 3)) * 0.3
        s = s * np.linspace(0.1, 1, n) ** 2 + band_sweep(dur, 800, 5000, 0.5, seed=11) * np.linspace(0, 1, n) ** 2 * 0.5
        return s * g, 0.0, 0.15
    if ty == 'click':
        n = int(0.15 * SR)
        s = np.sin(2 * np.pi * 2200 * tvec(0.15)) * env_exp(n, 0.006) * 0.6 + np.sin(2 * np.pi * 130 * tvec(0.15)) * env_exp(n, 0.03) * 0.7
        s[: int(0.001 * SR)] += 0.8
        return s * g, 0.0, 0.08
    if ty == 'chime':
        n = int(1.6 * SR)
        s = np.zeros(n)
        notes = (81, 86) if not c.get('soft') else (86, 90)
        for k, m in enumerate(notes):
            j = int(k * 0.07 * SR)
            f = midi(m)
            v = sum(a * np.sin(2 * np.pi * f * p * tvec(1.6)) * env_exp(n, tau) for p, a, tau in ((1, 1, 0.5), (2.76, 0.3, 0.15), (5.4, 0.12, 0.06)))
            s[j:] += v[: n - j]
        return s * g * 0.35, 0.1, 0.3
    if ty == 'ping':
        n = int(1.8 * SR)
        f = midi(86)
        s = np.sin(2 * np.pi * f * tvec(1.8)) * env_exp(n, 0.6) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tvec(1.8)) * env_exp(n, 0.15)
        return s * g * 0.4, 0.0, 0.35
    if ty == 'pluck':
        f = midi(74 + c.get('semi', 0))
        n = int(0.7 * SR)
        s = (np.sin(2 * np.pi * f * tvec(0.7)) + 0.35 * np.sin(4 * np.pi * f * tvec(0.7))) * env_exp(n, 0.16) * adsr(n, 0.002, 0.05)
        return s * g * 0.5, c.get('pan', 0.0), 0.25
    if ty == 'shimmer':
        n = int(dur * SR)
        s = band_sweep(dur, 6000, 8500, 0.35, seed=int(c['t'] * 10)) * bell_env(n, 0.25, 1.4) * 0.5
        r = np.random.default_rng(int(c['t'] * 1000))
        for _ in range(10):
            j = int(r.random() * n * 0.8)
            m = int(0.25 * SR)
            f = 2000 + r.random() * 4000
            sp = np.sin(2 * np.pi * f * tvec(0.25)) * env_exp(m, 0.05) * 0.15
            s[j : j + m] += sp[: max(0, min(m, n - j))]
        return s * g, 0.0, 0.4
    if ty == 'chalk':
        n = int(dur * SR)
        r = np.random.default_rng(int(c['t'] * 100))
        gate = np.repeat(r.random(int(dur * 60) + 2) > 0.35, SR // 60)[:n]
        gate = np.convolve(gate.astype(float), np.ones(200) / 200, mode='same')
        s = fft_filter(r.standard_normal(n), lo=1800, hi=6000) * gate * adsr(n, 0.01, 0.05)
        return s * g * 0.5, -0.2, 0.08
    if ty == 'reward':  # trophy: warm bell arpeggio + sparkle
        n = int(1.8 * SR)
        s = np.zeros(n)
        for k, m in enumerate((74, 78, 81, 86)):
            j = int(k * 0.055 * SR)
            f = midi(m)
            v = sum(a * np.sin(2 * np.pi * f * p * tvec(1.8)) * env_exp(n, tau) for p, a, tau in ((1, 1, 0.55), (2.0, 0.25, 0.25), (3.01, 0.12, 0.12)))
            s[j:] += v[: n - j] * (0.7 + 0.1 * k)
        s += band_sweep(1.8, 6500, 9500, 0.4, seed=33) * env_exp(n, 0.4) * 0.25
        return s * g * 0.3, -0.15, 0.35
    if ty == 'converge':  # many soft threads drawn in: rising airy swell
        n = int(dur * SR)
        s = band_sweep(dur, 3000, 900, 0.9, seed=44) * np.linspace(0, 1, n) ** 2.5
        s += sum(np.sin(2 * np.pi * midi(m) * tvec(dur)) for m in (81, 86, 90)) * np.linspace(0, 1, n) ** 3 * 0.12
        return s * g * 0.55, 0.0, 0.4
    if ty == 'notif':
        n = int(0.5 * SR)
        s = np.zeros(n)
        for k, f in enumerate((1318.5 * c.get('pitch', 1), 1760.0 * c.get('pitch', 1))):
            j = int(k * 0.085 * SR)
            v = np.sin(2 * np.pi * f * tvec(0.5)) * env_exp(n, 0.09)
            s[j:] += v[: n - j]
        return s * g * 0.4, 0.0, 0.2
    if ty == 'blip':
        n = int(0.4 * SR)
        s = np.zeros(n)
        for k, f in enumerate((523.3, 392.0)):
            j = int(k * 0.11 * SR)
            v = soft_tone(f, 0.4, harm=(1, 0.3)) * env_exp(n, 0.06)
            s[j:] += v[: n - j]
        return s * g * 0.4, 0.2, 0.1
    if ty == 'drop':  # a drop of light onto paper: water-drop pluck + soft low knock
        n = int(1.2 * SR)
        f = sine_sweep(0.12, 1500, 520) * env_exp(int(0.12 * SR), 0.03)
        s = np.zeros(n)
        s[: f.size] += f * 0.8
        s += np.sin(2 * np.pi * 110 * tvec(1.2)) * env_exp(n, 0.09) * 0.7
        s += sum(np.sin(2 * np.pi * midi(m) * tvec(1.2)) * env_exp(n, 0.5) for m in (86, 93)) * 0.12
        return s * g, 0.0, 0.35
    if ty == 'page':  # a page turning: a soft swish with paper flutter
        r = np.random.default_rng(c.get('seed', 0))
        n = int(dur * SR)
        flutter = 1 + 0.6 * np.sin(2 * np.pi * np.cumsum(np.linspace(30, 12, n)) / SR)
        s = band_sweep(dur, 1800, 5200, 0.9, seed=c.get('seed', 0)) * bell_env(n, 0.45, 1.6) * flutter * 0.8
        s += fft_filter(r.standard_normal(n), lo=300, hi=1600) * bell_env(n, 0.6, 2.4) * 0.25
        return s * g, c.get('pan', 0.0), 0.12
    if ty == 'synapse':  # an impulse through the network: bright crackle sweep + glassy tone
        r = np.random.default_rng(c.get('seed', 0))
        n = int(0.7 * SR)
        s = np.zeros(n)
        for k in range(14):
            j = int((k / 14) ** 1.3 * 0.45 * SR)
            m = int(0.03 * SR)
            v = np.sin(2 * np.pi * (2200 + 2600 * r.random()) * tvec(0.03)) * env_exp(m, 0.006)
            s[j : j + m] += v[: max(0, min(m, n - j))] * 0.35
        s += np.sin(2 * np.pi * midi(93) * tvec(0.7)) * env_exp(n, 0.2) * 0.25
        return s * g, (r.random() - 0.5) * 0.5, 0.35
    if ty in ('pencil', 'marker'):  # light drawing: graphite / felt tip on paper
        r = np.random.default_rng(c.get('seed', 0))
        n = int(dur * SR)
        lo, hi = (2500, 8000) if ty == 'pencil' else (900, 4200)
        strokes = np.convolve((r.random(int(dur * 18) + 2) > 0.3).astype(float).repeat(SR // 18)[:n], np.ones(400) / 400, mode='same')
        if strokes.size < n:
            strokes = np.pad(strokes, (0, n - strokes.size))
        s = fft_filter(r.standard_normal(n), lo=lo, hi=hi) * strokes * adsr(n, 0.02, 0.06)
        return s * g * (0.35 if ty == 'pencil' else 0.5), c.get('pan', 0.0), 0.06
    if ty == 'ink':  # ink flooding into the mark: soft rising warm swell
        n = int(dur * SR)
        s = band_sweep(dur, 300, 1400, 0.8, seed=12) * bell_env(n, 0.35, 1.5) * 0.6
        s += sum(np.sin(2 * np.pi * midi(m) * tvec(dur)) for m in (74, 78, 81)) * bell_env(n, 0.4, 1.8) * 0.1
        return s * g, 0.0, 0.3
    return np.zeros(1), 0.0, 0.0


def build_sfx():
    dry, wet = np.zeros((2, N)), np.zeros((2, N))
    for c in CUES:
        if c['type'] != 'hit' and abs(c['t'] - HERO) < 0.06:
            continue  # nothing but the hero hit within 60 ms of it
        sig, pan, send = sfx_voice(c)
        place(dry, sig, c['t'], pan=pan)
        place(wet, sig * send, c['t'], pan=pan)
    return dry, wet


def build_vo():
    vo = np.zeros((2, N))
    found = False
    for k, (t, _line) in enumerate(TL['copy']['vo'], 1):
        p = os.path.join(ROOT, 'render', 'vo', f'vo_{k:02d}.wav')
        if not os.path.exists(p):
            continue
        with wave.open(p) as w:
            sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
            x = np.frombuffer(w.readframes(w.getnframes()), dtype={2: np.int16, 4: np.int32}[sw]).astype(np.float64)
            x /= float(2 ** (8 * sw - 1))
            x = x.reshape(-1, ch).mean(axis=1)
        if sr != SR:
            x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
        place(vo, x * 0.9, t)
        found = True
    return vo, found


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    y = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y.T * 32767).astype(np.int16).tobytes())


def main():
    music, stems = build_music()
    sfx, sfx_wet = build_sfx()
    vo, has_vo = build_vo()
    # breath: music fully out between the breath and the hit
    i0, i1 = int(BREATH * SR), int(HERO * SR)
    fade = int(0.05 * SR)
    music[:, i0 : i0 + fade] *= np.linspace(1, 0, fade)
    music[:, i0 + fade : i1] = 0
    if has_vo:  # keep music ≥ 12 dB under every word
        env = np.abs(vo).max(axis=0)
        env = np.convolve(env, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
        duck = 1 - 0.75 * np.clip(env * 8, 0, 1)
        music *= duck
    ir = reverb_ir()
    wet = convolve(music * 0.22 + sfx_wet, ir)
    mix = music * 0.9 + sfx * 0.85 + wet * 0.35 + vo
    mix = mix[:, : int(DUR * SR)]
    # gentle bus glue + soft clip; loudness is finalised by ffmpeg loudnorm in encode.sh
    peak = np.abs(mix).max()
    mix = np.tanh(mix / peak * 1.4) / np.tanh(1.4) * 0.89
    # fade out over the last 0.4 s with the picture
    n = int(0.4 * SR)
    mix[:, -n:] *= np.linspace(1, 0, n) ** 1.5
    out = os.path.join(ROOT, 'out')
    write(os.path.join(out, 'audio.wav'), mix)
    write(os.path.join(out, 'stems', 'music.wav'), (music / peak * 0.9)[:, : int(DUR * SR)])
    write(os.path.join(out, 'stems', 'sfx.wav'), (sfx / peak * 0.9)[:, : int(DUR * SR)])
    if has_vo:
        write(os.path.join(out, 'stems', 'vo.wav'), vo[:, : int(DUR * SR)])
    print(f'audio: {DUR:.1f}s · {len(CUES)} cues · VO {"on" if has_vo else "off (no render/vo/*.wav)"} → out/audio.wav')


if __name__ == '__main__':
    sys.exit(main())
