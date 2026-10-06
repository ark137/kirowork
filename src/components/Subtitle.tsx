import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, sans, serif} from '../theme';
import type {Sub} from '../timeline';

/** 底部双语字幕：逐字墨晕显影，整体淡出 */
export const Subtitle: React.FC<{sub: Sub; tone?: 'ink' | 'light'}> = ({sub, tone = 'ink'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const chars = Array.from(sub.zh);
  const per = Math.min(1.6, 26 / chars.length);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const enIn = interpolate(frame, [chars.length * per * 0.5, chars.length * per * 0.5 + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isLight = tone === 'light';
  const color = isLight ? '#FFF8EA' : C.ink;
  const halo = isLight
    ? '0 0 18px rgba(20,24,36,0.55), 0 1px 2px rgba(20,24,36,0.4)'
    : '0 0 20px rgba(251,246,236,0.95), 0 0 6px rgba(251,246,236,0.9)';
  const fontSize = chars.length > 26 ? 38 : 44;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 82,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: out,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize,
          letterSpacing: '0.08em',
          color,
          textShadow: halo,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, i) => {
          const p = interpolate(frame - i * per, [0, 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: p,
                filter: `blur(${(1 - p) * 6}px)`,
                transform: `translateY(${(1 - p) * 10}px)`,
                whiteSpace: 'pre',
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 22,
          letterSpacing: '0.04em',
          color: isLight ? 'rgba(255,248,234,0.85)' : C.inkMute,
          textShadow: halo,
          opacity: enIn,
          transform: `translateY(${(1 - enIn) * 6}px)`,
        }}
      >
        {sub.en}
      </div>
    </div>
  );
};
