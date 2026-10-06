import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, sans, serif} from '../theme';

/** 左上角年份标签：金线生长 + 文字擦出 */
export const YearTag: React.FC<{year: string; note?: string; tone?: 'ink' | 'light'}> = ({year, note, tone = 'ink'}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const ease = Easing.out(Easing.cubic);
  const line = interpolate(frame, [4, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const txt = interpolate(frame, [12, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const sub = interpolate(frame, [24, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const light = tone === 'light';
  return (
    <div style={{position: 'absolute', left: 104, top: 84, opacity: out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 60 * line, height: 2, background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`}} />
        <div
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 42,
            letterSpacing: '0.06em',
            color: light ? C.goldLight : C.goldDeep,
            clipPath: `inset(0 ${(1 - txt) * 100}% 0 0)`,
            textShadow: light ? '0 0 14px rgba(20,24,36,0.5)' : '0 0 12px rgba(251,246,236,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {year}
        </div>
      </div>
      {note ? (
        <div
          style={{
            marginLeft: 80,
            marginTop: 6,
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '0.32em',
            color: light ? 'rgba(255,248,234,0.75)' : C.inkMute,
            opacity: sub,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
};
