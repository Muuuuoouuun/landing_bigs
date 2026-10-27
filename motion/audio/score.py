"""
The score — a 27 s cue in D minor that resolves to D major, locked to the edit (one beat = 14 frames).

Through-line: the hook's falling four-note motif (D–A–F–E on felt piano) is the theme. It comes back
as the violins' top line over the drop, as a bell-pluck figure in the AI chapter, and resolved in D major
on the logo. Sections build by layers, the music drops out for a breath before each big hit, and every
section downbeat that matters gets a timpani.

Timing comes from soundtrack.json (sections, chords, melodies, hits, gaps, fills, crashes, ducks);
the sound of each style lives here.
"""
import numpy as np

from dsp import (SR, add, compress, delay, each, hp, lp, mono_lows, mtof, norm, reverb, saturate, tt, widen)
from grid import CHORDS, MusicGrid
from instruments import (bass, bell, bell_pluck, brass, cello, choir, clap, crash, cymbal_swell, kick, marimba, piano,
                         pluck_bass, shaker, snare, snare_soft, strings, timpani, tom)

ARP8 = [0, 2, 1, 2]
ARP16 = [0, 2, 1, 3, 2, 1, 0, 2]
MARIMBA_RUN = [65, 69, 72, 74, 77, 81, 84, 89]  # F major pentatonic climb, one note per cell stamp
BUSES = ('drums', 'perc', 'bass', 'keys', 'strings', 'choir', 'bed')


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


class Score:
    def __init__(self, spec):
        self.M = spec['music']
        self.spf = SR // spec['fps']
        self.total = spec['durationInFrames'] * self.spf
        self.beat = self.M['beatFrames'] * self.spf
        self.eighth, self.sixteenth = self.beat // 2, self.beat // 4
        self.bus = {name: np.zeros((2, self.total)) for name in BUSES}
        self.kicks = []
        self.grid = MusicGrid(spec)

    def fr(self, frame):
        return int(round(frame * self.spf))

    # ------------------------------------------------------------ shared pieces
    def pads(self, start, end, per_beat, cutoff, attack, gain, high=False):
        for b, run, name in chord_runs(per_beat):
            dur = min(run * self.beat, end - (start + b * self.beat)) / SR + 0.5
            add(self.bus['strings'], strings(pad_voicing(name, high), dur, attack=attack, release=0.6, cutoff=cutoff, bow=0.6), start + b * self.beat, gain)

    def kick_at(self, pos, punch=1.0, gain=0.82, pump=True):
        add(self.bus['drums'], kick(punch), pos, gain)
        if pump:
            self.kicks.append(pos)

    def backbeat(self, pos, clap_too=False, long_tail=False):
        add(self.bus['drums'], reverb(snare(), 1.4 if long_tail else 1.1, 0.32, damp=4000, er=0), pos, 0.55)
        if clap_too:
            add(self.bus['drums'], reverb(clap(), 1.0, 0.25, damp=4000, er=0), pos, 0.28)

    def shakers(self, bpos, end, steps, scale=1.0):
        for s in range(steps):
            sp = bpos + s * (self.beat // steps)
            if sp >= end:
                break
            vel = ([0.8, 0.5] if steps == 2 else [0.6, 0.26, 0.45, 0.26])[s]
            add(self.bus['drums'], shaker(), sp, vel * scale, pan=0.3)

    def piano_figure(self, bpos, end, b, voicing, per, gain=0.5, bright=0.8):
        pattern = ARP8 if per == 2 else ARP16
        for s in range(per):
            sp = bpos + s * (self.beat // per)
            if sp >= end:
                break
            step = b * per + s
            vel = (0.75 if s == 0 else 0.55) * (0.85 if per == 4 else 1.0)
            add(self.bus['keys'], piano(mtof(voicing[pattern[step % len(pattern)]]), 0.9, vel, bright), sp, gain, pan=(-0.35 if step % 2 else 0.35))

    def section_bounds(self, sec):
        start, end = self.fr(sec['from']), self.fr(sec['to'])
        n_beats = int(np.ceil((end - start) / self.beat))
        return start, end, n_beats, expand_chords(sec['chords'], n_beats)

    # ------------------------------------------------------------ sections
    def intro(self):
        """0 → impact: dark string drone, the felt-piano motif falling, heartbeat kicks and a cello
        ostinato that tightens from 8ths to 16ths — then an 8th-note breath before the drop."""
        imp = self.fr(self.M['intro']['to'])
        dur = imp / SR + 0.6
        add(self.bus['bed'], strings([38, 45, 50, 53], dur, attack=1.2, release=0.5, cutoff=1300, bright=8, bow=0.8), 0, 0.75)
        add(self.bus['bed'], np.sin(2 * np.pi * mtof(38) * tt(imp)) * np.minimum(1, tt(imp) / 1.2) * 0.09, 0)
        for k, m in enumerate(self.M['intro']['motif']):
            add(self.bus['bed'], reverb(piano(mtof(m), 1.8, 0.55, 0.4), 2.4, 0.42, pre=0.02, damp=3500), imp - (4 - k) * self.beat, 0.55, pan=(-0.2 if k % 2 else 0.2))
        for k in range(1, 5):
            add(self.bus['drums'], lp(kick(0.7), 500), imp - k * self.beat, 0.35 + 0.1 * (4 - k))
        start = imp - 3 * self.beat
        positions = [start + j * self.eighth for j in range(4)] + [imp - self.beat + j * self.sixteenth for j in range(3)]
        for j, p in enumerate(positions):
            add(self.bus['strings'], cello(mtof(38 if j % 3 else 33), 0.28, 0.5 + 0.06 * j), p, 0.75, pan=(-0.25 if j % 2 else 0.25))

    def drive(self, sec):
        """Impact + ① 표준화: four-on-the-floor; the piano joins on bar 2, claps and 16th shakers on bar 4."""
        start, end, n_beats, per_beat = self.section_bounds(sec)
        piano_from = self.fr(sec.get('pianoFrom', sec['from']))
        lift = self.fr(sec.get('lift', sec['to']))
        self.pads(start, end, per_beat, cutoff=2600, attack=0.35, gain=0.85)
        for b in range(n_beats):
            bpos = start + b * self.beat
            root, tones = CHORDS[per_beat[b]]
            self.kick_at(bpos)
            if b % 2 == 1:
                self.backbeat(bpos, clap_too=bpos >= lift)
            self.shakers(bpos, end, 4 if bpos >= lift else 2)
            for e in range(2):
                ep = bpos + e * self.eighth
                if ep < end:
                    add(self.bus['bass'], bass(mtof(root), self.eighth / SR * 0.92, 1.4), ep, 0.26 if e == 0 else 0.34)
            if bpos >= piano_from:
                self.piano_figure(bpos, end, b, tones, 2, gain=0.75)

    def secure(self, sec):
        """② 관리: a two-beat pulse (one chord per shot), held bass, a muted piano pulse and a low cello
        ostinato in 16ths that keeps the close-ups precise."""
        start, end, n_beats, per_beat = self.section_bounds(sec)
        self.pads(start, end, per_beat, cutoff=1900, attack=0.2, gain=0.75)
        for b, run, name in chord_runs(per_beat):
            root, _ = CHORDS[name]
            dur = min(run * self.beat, end - (start + b * self.beat)) / SR + 0.1
            add(self.bus['bass'], bass(mtof(root), dur, 1.2), start + b * self.beat, 0.24)
        for b in range(n_beats):
            bpos = start + b * self.beat
            root, tones = CHORDS[per_beat[b]]
            if b % 2 == 0:
                self.kick_at(bpos)
            elif bpos + 3 * self.sixteenth < end:
                add(self.bus['drums'], kick(0.6), bpos + 3 * self.sixteenth, 0.35)
            if b % 2 == 1:
                self.backbeat(bpos, long_tail=True)
            self.shakers(bpos, end, 4, 0.7)
            for e in range(2):
                ep = bpos + e * self.eighth
                if ep < end:
                    add(self.bus['bass'], bass(mtof(root + 12), self.eighth / SR * 0.6, 1.2, 0.6), ep, 0.16)
                    for m in (tones[0] - 12, tones[2] - 12):
                        add(self.bus['keys'], piano(mtof(m), 0.4, 0.45 if e else 0.6, 0.45), ep, 0.3)
            for s in range(4):
                sp = bpos + s * self.sixteenth
                if sp < end:
                    m = root + 12 if s % 2 == 0 else root + 19
                    add(self.bus['strings'], cello(mtof(m), 0.16, 0.5 if s == 0 else 0.35), sp, 0.5, pan=(-0.3 if s % 2 else 0.3))

    def variation(self, sec):
        """The interlude: same harmony world, different treatment — dry soft marimba, pizzicato bass, light percussion."""
        start, end, n_beats, per_beat = self.section_bounds(sec)
        for b, run, name in chord_runs(per_beat):
            root, tones = CHORDS[name]
            add(self.bus['strings'], strings(tones[:3] + [tones[0] - 12], run * self.beat / SR + 0.3, attack=0.05, release=0.3, cutoff=2600, bright=10), start + b * self.beat, 0.45)
        for b in range(n_beats):
            if b % 2 == 0:
                root, _ = CHORDS[per_beat[b]]
                add(self.bus['bass'], pluck_bass(mtof(root + 12)), start + b * self.beat, 0.5)
        # the stamps on screen step in whole frames; the mallets play them as exact 16ths (words as 32nds)
        for i, f in enumerate(sec['notes']):  # one mallet note per cell stamp on screen
            m = MARIMBA_RUN[i % len(MARIMBA_RUN)]
            pos = self.fr(self.grid.snap(f))
            add(self.bus['keys'], marimba(mtof(m)), pos, 0.55, pan=(-0.35 if i % 2 else 0.35))
            add(self.bus['keys'], marimba(mtof(m - 12), 0.45, 0.4), pos, 0.22)
        for f in sec['stabs']:  # lightly strummed chord on each stamped word
            pos = self.fr(self.grid.snap(f, 8))
            beat = min(n_beats - 1, (pos - start) // self.beat)
            _, tones = CHORDS[per_beat[beat]]
            for k, m in enumerate(tones[:3]):
                add(self.bus['keys'], marimba(mtof(m + 12), 0.5), pos + k * 60, 0.3, pan=(k - 1) * 0.4)
        for i, (f, m) in enumerate(sec.get('pickup', [])):
            add(self.bus['keys'], marimba(mtof(m), 0.45), self.fr(self.grid.snap(f)), 0.42, pan=(0.3 if i % 2 else -0.3))
        for b in range(n_beats):
            bpos = start + b * self.beat
            if b % 2 == 0:
                add(self.bus['drums'], kick(0.75), bpos, 0.55)
            else:
                add(self.bus['drums'], clap(0.14), bpos, 0.35)
            for s in range(4):
                sp = bpos + s * self.sixteenth
                if sp < end:
                    add(self.bus['drums'], shaker(0.07), sp, [0.22, 0.1, 0.16, 0.1][s], pan=-0.25)

    def ai(self, sec):
        """AI slam + ③ AI 강의평가: the fullest groove — claps, a tom pickup every bar, octave bass,
        16th piano, a choir bed and a bell on each chord change."""
        start, end, n_beats, per_beat = self.section_bounds(sec)
        self.pads(start, end, per_beat, cutoff=2800, attack=0.1, gain=0.8)
        for b, run, name in chord_runs(per_beat):
            dur = min(run * self.beat, end - (start + b * self.beat)) / SR + 0.6
            add(self.bus['choir'], choir(pad_voicing(name)[1:4], dur, 'ah', attack=0.3, release=0.6), start + b * self.beat, 1.1)
        for b in range(n_beats):
            bpos = start + b * self.beat
            root, tones = CHORDS[per_beat[b]]
            self.kick_at(bpos)
            if b % 2 == 1:
                self.backbeat(bpos, clap_too=True)
            if b % 4 == 3:
                for off, f0 in ((self.eighth, 120), (3 * self.sixteenth, 92)):
                    if bpos + off < end:
                        add(self.bus['drums'], tom(f0), bpos + off, 0.4, pan=(0.25 if f0 > 100 else -0.25))
            self.shakers(bpos, end, 4)
            for e in range(2):
                ep = bpos + e * self.eighth
                if ep < end:
                    add(self.bus['bass'], bass(mtof(root + 12 * e), self.eighth / SR * 0.92, 1.5), ep, 0.32)
            self.piano_figure(bpos, end, b, tones, 4, gain=0.34)
            if b == 0 or per_beat[b] != per_beat[b - 1]:
                add(self.bus['keys'], reverb(bell([mtof(tones[2] + 12), mtof(tones[0] + 24)], 1.6, 0.07, 0.9), 1.8, 0.4), bpos, 0.12)

    def lift(self, sec):
        """④ 가치: tension while the waste blocks are struck out (half-time, a snare roll that builds),
        then the release as ClassIn lands — full major-key groove, high strings and the piano-octave melody."""
        start, end, n_beats, per_beat = self.section_bounds(sec)
        release = self.fr(sec.get('release', sec['from']))
        for b, run, name in chord_runs(per_beat):
            pos = start + b * self.beat
            dur = min(run * self.beat, end - pos) / SR + 0.5
            after = pos >= release
            add(self.bus['strings'], strings(pad_voicing(name, after), dur, attack=0.08 if after else 0.25, release=0.6, cutoff=3400 if after else 2000, bow=0.6), pos, 0.95 if after else 0.8)
            if not after:
                root, _ = CHORDS[name]
                add(self.bus['bass'], bass(mtof(root), dur - 0.4, 1.2), pos, 0.3)
        # the build: 8ths then 16ths on a brushed snare, climbing into the release
        p, k = start + self.beat, 0
        while p < release:
            prog = (p - start) / max(1, release - start)
            add(self.bus['drums'], snare_soft(0.35 + 0.65 * prog), p, 0.5, pan=(-0.15 if k % 2 else 0.15))
            p += self.eighth if p < release - self.beat else self.sixteenth
            k += 1
        for b in range(n_beats):
            bpos = start + b * self.beat
            root, tones = CHORDS[per_beat[b]]
            if bpos < release:
                if b % 2 == 0:
                    self.kick_at(bpos, gain=0.7)
                for e in range(2):
                    ep = bpos + e * self.eighth
                    add(self.bus['strings'], cello(mtof(root + 12), 0.25, 0.6), ep, 0.55)
                continue
            self.kick_at(bpos)
            if b % 2 == 1:
                self.backbeat(bpos, clap_too=True)
            self.shakers(bpos, end, 2)
            for e in range(2):
                ep = bpos + e * self.eighth
                if ep < end:
                    add(self.bus['bass'], bass(mtof(root), self.eighth / SR * 0.92, 1.4), ep, 0.28 if e == 0 else 0.36)
            self.piano_figure(bpos, end, b, [m + 12 for m in tones], 2, gain=0.42, bright=0.85)

    def bridge(self, brk):
        """'쌓인 데이터 위에서,' — held chord, a choir breathing in, piano plinks gathering speed."""
        br0, br1 = self.fr(brk['from']), self.fr(brk['to'])
        _, tones = CHORDS[brk['chord']]
        add(self.bus['bed'], strings(pad_voicing(brk['chord']), (br1 - br0) / SR + 0.4, attack=0.3, release=0.2, cutoff=2200), br0, 1.5)
        add(self.bus['bed'], choir([57, 61, 64, 69], (br1 - br0) / SR + 0.2, 'oo', attack=(br1 - br0) / SR * 0.8, release=0.1), br0, 0.9)
        p, k = br0 + self.sixteenth, 0
        while p < br1 - self.sixteenth // 2:
            m = tones[k % 4] + 12 * (k // 4 % 2)
            add(self.bus['bed'], reverb(piano(mtof(m), 0.7, 0.4 + 0.3 * (p - br0) / (br1 - br0), 0.6), 1.6, 0.35), p, 0.5, pan=np.sin(k * 1.7) * 0.5)
            p += int(self.eighth * (0.85 ** (k / 2)))
            k += 1

    def outro(self, o):
        """A major tension — timpani roll, snare roll, rising piano — a breath, then the D major finale."""
        o0, final = self.fr(o['from']), self.fr(o['hit'])
        span = (final - o0) / SR
        add(self.bus['strings'], strings(pad_voicing(o['chord']), span + 0.15, attack=span * 0.7, release=0.1, cutoff=2600), o0, 1.0)
        for j in range(7):  # rising A major arpeggio in 32nds, up into the breath
            m = CHORDS[o['chord']][1][j % 4] + (12 if j >= 4 else 0)
            add(self.bus['keys'], piano(mtof(m), 0.5, 0.5 + 0.07 * j, 0.7), o0 + j * (self.sixteenth // 2), 0.32, pan=(-0.4 if j % 2 else 0.4))
        p, k = o0, 0
        while p < final - self.sixteenth // 2:
            prog = (p - o0) / (final - o0)
            add(self.bus['perc'], timpani(mtof(33), 0.6, 0.25 + 0.6 * prog), p, 0.5)
            add(self.bus['drums'], snare_soft(0.4 + 0.6 * prog), p, 0.45, pan=(-0.15 if k % 2 else 0.15))
            p += self.sixteenth if prog < 0.5 else self.sixteenth // 2
            k += 1
        tail = self.total - final
        add(self.bus['strings'], strings([50, 57, 62, 66, 69, 74, 78], tail / SR, attack=0.04, release=1.4, cutoff=2800, bright=14, bow=0.6), final, 1.4)
        add(self.bus['strings'], brass([50, 57, 62, 66], min(2.4, tail / SR), attack=0.12, release=1.0, bright=0.8), final, 0.7)
        add(self.bus['choir'], choir([57, 62, 66, 69], tail / SR, 'ah', attack=0.15, release=1.2), final, 2.0)
        for k, m in enumerate([50, 57, 62, 66, 69, 74]):
            add(self.bus['keys'], piano(mtof(m), 2.6, 0.8, 0.6), final + k * 90, 0.4)
        low_d = bass(mtof(38), 2.4, 1.2)
        add(self.bus['bass'], low_d * np.exp(-tt(len(low_d)) * 0.9), final, 0.5)  # rings out instead of holding
        self.kick_at(final, punch=1.3)

    # ------------------------------------------------------------ cross-section layers
    def melodies(self):
        for mel in self.M.get('melodies', []):
            voice = mel['voice']
            for i, (f, m, beats) in enumerate(mel['notes']):
                pos = self.fr(f)
                dur = beats * self.beat / SR
                pan = -0.25 if i % 2 else 0.25
                if voice == 'violins':
                    add(self.bus['strings'], strings([m], dur + 0.35, attack=0.18, release=0.35, cutoff=4200, bright=14, vib=0.006, bow=1.0), pos, 0.5)
                elif voice == 'bellpluck':
                    add(self.bus['keys'], bell_pluck(mtof(m), dur + 0.7, 0.9), pos, 0.85, pan=pan)
                elif voice == 'pianoOct':
                    add(self.bus['keys'], piano(mtof(m), dur + 1.2, 0.85, 0.8) + piano(mtof(m - 12), dur + 1.2, 0.7, 0.7), pos, 0.55, pan=pan * 0.6)
                elif voice == 'bells':
                    add(self.bus['keys'], bell([mtof(m)], dur + 1.4, 0, 0.9, 1.6) * 0.6 + piano(mtof(m), dur + 1.4, 0.75, 0.6), pos, 0.5, pan=pan * 0.6)

    def hits(self):
        for f in self.M.get('hits', []):
            add(self.bus['perc'], timpani(mtof(38), 2.6, 1.15), self.fr(f), 0.85)
        for f in self.M.get('crashes', []):
            add(self.bus['perc'], crash(), self.fr(f), 0.9)
        for f0, f1 in self.M.get('swells', []):
            add(self.bus['perc'], cymbal_swell((self.fr(f1) - self.fr(f0)) / SR), self.fr(f0), 0.8)
        for f0, f1 in self.M.get('fills', []):  # tom rolls into section changes
            p0, p1 = self.fr(f0), self.fr(f1)
            p, k = p0, 0
            while p < p1:
                prog = (p - p0) / (p1 - p0)
                add(self.bus['drums'], tom(140 - 60 * prog), p, 0.3 + 0.4 * prog, pan=(-0.3 if k % 2 else 0.3))
                p += self.sixteenth
                k += 1

    # ------------------------------------------------------------ mix
    def render(self):
        self.intro()
        builders = {'drive': self.drive, 'secure': self.secure, 'variation': self.variation, 'ai': self.ai, 'lift': self.lift}
        for sec in self.M['sections']:
            builders[sec['style']](sec)
        for brk in self.M['breaks']:
            self.bridge(brk)
        self.outro(self.M['outro'])
        self.melodies()
        self.hits()

        total = self.total
        # side-chain pump from the kick: bass breathes most, keys least
        sc = np.zeros(total)
        for kp in self.kicks:
            n = min(int(0.3 * SR), total - kp)
            sc[kp:kp + n] = np.maximum(sc[kp:kp + n], np.exp(-tt(n) * 12))
        b = self.bus
        bass_bus = mono_lows(saturate(b['bass'] * (1 - 0.45 * sc), 1.15), 140)
        keys = delay(reverb(b['keys'] * (1 - 0.2 * sc), 1.4, 0.22, pre=0.012, damp=4500, er=4), time=0.75 * self.beat / SR, feedback=0.32, mix=0.1)
        strings_bus = widen(reverb(b['strings'] * (1 - 0.3 * sc), 2.6, 0.26, pre=0.025, damp=3400, er=8), 1.25)
        choir_bus = widen(reverb(b['choir'] * (1 - 0.25 * sc), 3.0, 0.4, pre=0.03, damp=3000, er=8), 1.3)
        dry_drums = reverb(b['drums'], 0.8, 0.1, damp=5000, er=6)
        drums = dry_drums * 0.75 + compress(dry_drums, -26, 4, 0.003, 0.08, makeup_db=6) * 0.35  # parallel squash for weight
        perc = reverb(b['perc'], 2.8, 0.3, pre=0.02, damp=2800, er=8)
        bed = reverb(b['bed'], 2.6, 0.32, damp=3200)
        self.stems = dict(drums=drums, perc=perc, bass=bass_bus, keys=keys, strings=strings_bus, choir=choir_bus, bed=bed)
        self.rms = {k: 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12) for k, v in self.stems.items()}

        # breaks gate the groove; gaps are a full breath before a hit
        gate = np.ones(total)
        ramp = int(0.03 * SR)
        for brk in self.M['breaks']:
            g0, g1 = self.fr(brk['from']), self.fr(brk['to'])
            gate[g0:g0 + ramp] = np.minimum(gate[g0:g0 + ramp], np.linspace(1, 0.06, ramp))
            gate[g0 + ramp:g1] = 0.06
        groove = (drums + bass_bus + keys + strings_bus + choir_bus) * gate + perc + bed
        breath = np.ones(total)
        r, back = int(0.012 * SR), int(0.003 * SR)
        for f0, f1 in self.M.get('gaps', []):
            g0, g1 = self.fr(f0), self.fr(f1)
            breath[g0 - r:g0] = np.minimum(breath[g0 - r:g0], np.linspace(1, 0, r))
            breath[g0:g1] = 0
            breath[g1:g1 + back] = np.minimum(breath[g1:g1 + back], np.linspace(0, 1, back))
        mix = groove * breath

        duck = np.ones(total)
        for f, depth in self.M['ducks']:
            p = self.fr(f)
            n = min(int(0.6 * SR), total - p)
            duck[p:p + n] = np.minimum(duck[p:p + n], 1 - depth * np.exp(-tt(n) * 5))
        mix = compress(mix * duck, threshold_db=-14, ratio=1.6, attack=0.02, release=0.2)  # glue
        mix = each(mix, lambda c: hp(c, 28))
        fl = int(0.6 * SR)
        mix[:, -fl:] *= np.linspace(1, 0, fl) ** 1.5
        return norm(saturate(mix * 0.9, 1.1), 0.7)


def build_music(spec):
    score = Score(spec)
    music = score.render()
    print('bus rms  ' + '  '.join(f'{k} {v:.1f}' for k, v in score.rms.items()))
    return music
