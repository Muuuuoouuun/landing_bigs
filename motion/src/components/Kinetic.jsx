import React from 'react';
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { EASE, ip } from '../theme';

const GLYPHS_LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';
const GLYPHS_HANGUL = '가나다라마바사아자차카타파하교육수업지점관리기준표준화분석평가';
const isHangul = (ch) => /[가-힣]/.test(ch);

const randomGlyph = (ch, seed) => {
  const pool = isHangul(ch) ? GLYPHS_HANGUL : GLYPHS_LATIN;
  return pool[Math.floor(random(seed) * pool.length)];
};

/**
 * Per-character kinetic typography.
 * mode: rise | slam | blur | flip | scramble | pop | drop
 * exitMode: up | blur | fall | scatter
 */
export const KineticText = ({
  text,
  delay = 0,
  stagger = 1.5,
  mode = 'rise',
  duration = 16,
  exitAt = null,
  exitDuration = 10,
  exitStagger = 0.6,
  exitMode = 'blur',
  jitter = 0,
  charColor,
  style,
  charStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Array.from(text);
  const masked = mode === 'rise' || exitMode === 'up';

  return (
    <span
      style={{
        display: 'inline-block',
        whiteSpace: 'pre',
        overflow: masked ? 'hidden' : 'visible',
        paddingBottom: masked ? '0.14em' : 0,
        marginBottom: masked ? '-0.14em' : 0,
        verticalAlign: 'bottom',
        perspective: mode === 'flip' ? 900 : undefined,
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        const local = frame - delay - i * stagger;
        const p = ip(local, [0, duration], [0, 1], EASE.out);
        let tx = 0;
        let ty = 0;
        let scale = 1;
        let rot = 0;
        let rotX = 0;
        let blur = 0;
        let opacity = 1;
        let content = ch;

        switch (mode) {
          case 'rise':
            ty = (1 - p) * 115;
            break;
          case 'slam':
            scale = interpolate(local, [0, 6, 9, 14], [2.8, 0.94, 1.03, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            opacity = ip(local, [0, 3], [0, 1]);
            blur = ip(local, [0, 6], [16, 0], EASE.in);
            break;
          case 'blur':
            opacity = p;
            blur = (1 - p) * 18;
            tx = (1 - p) * 40;
            scale = 1 + (1 - p) * 0.2;
            break;
          case 'flip':
            rotX = (1 - p) * -100;
            opacity = ip(local, [0, 5], [0, 1]);
            break;
          case 'scramble': {
            opacity = ip(local, [0, 2], [0, 1]);
            const resolved = local >= duration * 0.75;
            if (!resolved && ch.trim() !== '' && local >= 0) {
              content = randomGlyph(ch, `${text}-${i}-${Math.floor(frame / 2)}`);
            }
            break;
          }
          case 'pop': {
            const s = spring({ frame: local, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
            scale = s;
            opacity = ip(local, [0, 3], [0, 1]);
            break;
          }
          case 'drop': {
            const s = spring({ frame: local, fps, config: { damping: 13, stiffness: 170, mass: 0.7 } });
            ty = (1 - s) * -140;
            rot = (1 - s) * (random(`drop-${text}-${i}`) - 0.5) * 60;
            opacity = ip(local, [0, 3], [0, 1]);
            break;
          }
          default:
            break;
        }

        if (exitAt !== null) {
          const e = ip(frame - exitAt - i * exitStagger, [0, exitDuration], [0, 1], EASE.in);
          if (e > 0) {
            if (exitMode === 'up') {
              ty -= e * 115;
            } else if (exitMode === 'fall') {
              ty += e * 140;
              rot += e * (random(`fall-${text}-${i}`) - 0.5) * 70;
              opacity *= 1 - e;
            } else if (exitMode === 'scatter') {
              const a = random(`sc-${text}-${i}`) * Math.PI * 2;
              tx += Math.cos(a) * e * 260;
              ty += Math.sin(a) * e * 180;
              rot += (random(`scr-${text}-${i}`) - 0.5) * e * 120;
              blur += e * 10;
              opacity *= 1 - e;
            } else {
              opacity *= 1 - e;
              blur += e * 16;
              tx -= e * 30;
            }
          }
        }

        let jx = 0;
        let jy = 0;
        if (jitter) {
          const amp = typeof jitter === 'function' ? jitter(frame, i) : jitter;
          jx = noise2D(`jx-${i}`, frame * 0.35, i) * amp;
          jy = noise2D(`jy-${i}`, frame * 0.35, i) * amp * 0.6;
          rot += noise2D(`jr-${i}`, frame * 0.25, i) * amp * 0.8;
        }

        const unit = mode === 'rise' || exitMode === 'up' ? '%' : 'px';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity,
              color: charColor ? charColor(i, ch) : undefined,
              transform: `translate(${tx}px, ${ty}${unit}) translate(${jx}px, ${jy}px) scale(${scale}) rotate(${rot}deg) rotateX(${rotX}deg)`,
              transformOrigin: mode === 'flip' ? '50% 100%' : '50% 60%',
              filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              ...charStyle,
            }}
          >
            {content}
          </span>
        );
      })}
    </span>
  );
};

/** Odometer-style number: every digit column physically rolls. */
export const RollingNumber = ({ value, digits = 1, leadingZeros = 'dim', style }) => {
  const v = Math.max(0, value);
  const cols = [];
  for (let p = digits - 1; p >= 0; p--) {
    const unit = 10 ** p;
    const base = Math.floor(v / unit) % 10;
    const lower = v % unit;
    const raw = p === 0 ? v % 1 : Math.max(0, lower - (unit - 1));
    // Snap: digits hold still most of the time and roll quickly between values.
    const t = Math.min(1, Math.max(0, (raw - 0.3) / 0.4));
    const frac = t * t * (3 - 2 * t);
    const pos = base + frac;
    const isLeading = p > 0 && v < unit;
    cols.push(
      <span
        key={p}
        style={{
          display: 'inline-block',
          height: '1em',
          lineHeight: '1em',
          overflow: 'hidden',
          verticalAlign: 'top',
          opacity: isLeading && leadingZeros === 'dim' ? 0.22 : 1,
          width: isLeading && leadingZeros === 'hide' ? 0 : undefined,
        }}
      >
        <span style={{ display: 'block', transform: `translateY(${-pos}em)` }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, k) => (
            <span key={k} style={{ display: 'block', height: '1em' }}>
              {d}
            </span>
          ))}
        </span>
      </span>,
    );
  }
  return (
    <span style={{ display: 'inline-block', fontFeatureSettings: '"tnum"', whiteSpace: 'nowrap', ...style }}>
      {cols}
    </span>
  );
};

/**
 * Slot-machine word roller with fake vertical motion blur (SVG directional blur).
 * changes[i] = frame at which words[i] rolls into place.
 */
export const WordSlot = ({ words, changes, size, rollDuration = 11, id, style, wordStyle }) => {
  const frame = useCurrentFrame();
  const indexAt = (f) =>
    changes.reduce((acc, c) => acc + ip(f, [c, c + rollDuration], [0, 1], EASE.inOut), 0);
  const idx = indexAt(frame);
  const velocity = Math.abs(idx - indexAt(frame - 1)) * size * 1.2;
  const blurAmount = Math.min(velocity * 0.35, 28);
  const filterId = `slot-blur-${id}`;
  const lineH = 1.2;

  return (
    <span style={{ display: 'inline-block', position: 'relative', ...style }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={filterId} x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation={`0 ${blurAmount.toFixed(2)}`} />
        </filter>
      </svg>
      <span
        style={{
          display: 'block',
          height: `${lineH}em`,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            transform: `translateY(${-idx * lineH}em)`,
            filter: blurAmount > 0.4 ? `url(#${filterId})` : undefined,
          }}
        >
          {['', ...words].map((w, k) => (
            <span
              key={k}
              style={{ display: 'block', height: `${lineH}em`, lineHeight: `${lineH}em`, whiteSpace: 'pre', ...wordStyle }}
            >
              {w || ' '}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
};

/** Typewriter with blinking block cursor. */
export const Typewriter = ({ text, delay = 0, cps = 1.2, cursorColor, style }) => {
  const frame = useCurrentFrame();
  const chars = Array.from(text);
  const shown = Math.max(0, Math.min(chars.length, Math.floor((frame - delay) * cps)));
  const done = shown >= chars.length;
  const blink = done ? Math.floor(frame / 8) % 2 === 0 : true;
  return (
    <span style={{ whiteSpace: 'pre-wrap', ...style }}>
      {chars.slice(0, shown).join('')}
      {frame >= delay && (
        <span
          style={{
            display: 'inline-block',
            width: '0.55em',
            height: '1.05em',
            marginLeft: 2,
            verticalAlign: '-0.15em',
            background: cursorColor,
            opacity: blink ? 1 : 0,
          }}
        />
      )}
    </span>
  );
};
