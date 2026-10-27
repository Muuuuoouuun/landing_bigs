"""
Where the music is at any frame — the beat grid every sound locks to, and the chord sounding there.

The grid is anchored on the impact (music.intro.to) and runs one beat per music.beatFrames frames
(14 frames = 128.57 BPM at 30 fps), so a 16th note is 3.5 frames and lands on whole samples (5600).
"""
import math

from dsp import SR

CHORDS = {  # name → (bass midi, close voicing around C4–C5)
    'Dm': (38, [62, 65, 69, 74]),
    'Bb': (34, [58, 62, 65, 70]),
    'F': (41, [60, 65, 69, 72]),
    'C': (36, [60, 64, 67, 72]),
    'Gm': (31, [62, 67, 70, 74]),
    'A': (33, [61, 64, 69, 73]),
    'D': (38, [62, 66, 69, 74]),
}


def is_minor(name):
    return name.endswith('m')


def triad(name):
    """Root, third and fifth as pitch classes (root first)."""
    root = CHORDS[name][0] % 12
    return [root, (root + (3 if is_minor(name) else 4)) % 12, (root + 7) % 12]


def tones_from(name, low, count, extra=()):
    """`count` ascending chord tones starting at the first one at or above midi `low`.
    `extra` adds colour degrees (semitones above the root, e.g. 9 for a sixth)."""
    pcs = set(triad(name)) | {(triad(name)[0] + e) % 12 for e in extra}
    out, m = [], low
    while len(out) < count:
        if m % 12 in pcs:
            out.append(m)
        m += 1
    return out


def note_in(name, degree, low, high):
    """The chord's root (degree 0), third (1) or fifth (2) placed inside [low, high] (midi, inclusive)."""
    pc = triad(name)[degree]
    m = low + (pc - low) % 12
    return m if m <= high else m - 12


class MusicGrid:
    def __init__(self, spec):
        M = spec['music']
        self.M = M
        self.spf = SR // spec['fps']
        self.origin = M['intro']['to']  # the impact is beat 0
        self.beat = M['beatFrames']

    def sample(self, frame):
        return int(round(frame * self.spf))

    def snap(self, frame, div=4, lead=1.3, lag=3.0):
        """The nearest 1/div-beat grid point to `frame`. A sound may trail its picture by up to `lag`
        frames (100 ms) but never run ahead of it by more than `lead` (43 ms — about where an early
        sound starts to read as out of sync)."""
        step = self.beat / div
        n = (frame - self.origin) / step
        points = [self.origin + k * step for k in (math.floor(n), math.ceil(n))]
        ok = [g for g in points if -lead <= g - frame <= lag]
        return min(ok, key=lambda g: (abs(g - frame), -g)) if ok else frame

    def chord_at(self, frame):
        M = self.M
        if frame < self.origin:
            return 'Dm'  # the intro drone
        for brk in M['breaks']:
            if brk['from'] <= frame < brk['to']:
                return brk['chord']
        outro = M['outro']
        if frame >= outro['hit']:
            return 'D'  # the finale resolves to D major
        if frame >= outro['from']:
            return outro['chord']
        for sec in M['sections']:
            if sec['from'] <= frame < sec['to']:
                per_beat = [name for name, beats in sec['chords'] for _ in range(beats)]
                return per_beat[min(int((frame - sec['from']) // self.beat), len(per_beat) - 1)]
        return 'Dm'
