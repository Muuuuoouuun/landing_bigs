import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';
import { FONT } from '../fonts';

/** Chapter marker ("01 표준화", "02 관리") floating above a headline column. */
export const ChapterPill = ({ index, label, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: -66,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 18px 6px 6px',
        borderRadius: 999,
        border: `1.5px solid ${C.line}`,
        background: 'rgba(0,223,69,0.08)',
        transform: `translateY(${(1 - s) * 16}px)`,
        opacity: Math.min(1, s * 1.4),
        ...style,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: C.green,
          color: '#04130b',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {index}
      </span>
      <span style={{ color: C.white, fontFamily: FONT.sans, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>{label}</span>
    </div>
  );
};
