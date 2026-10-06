import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, sans, serif} from '../theme';

/** 木线（地球时间）用的小年轮图标：三圈由内向外长出 */
const RingIcon: React.FC<{p: number}> = ({p}) => (
  <svg width={60} height={44} viewBox="-30 -22 60 44" style={{overflow: 'visible'}}>
    {[6, 12, 18].map((r, i) => {
      const k = Math.max(0, Math.min(1, p * 3 - i));
      return (
        <ellipse key={r} cx={0} cy={0} rx={r * 1.08 * k} ry={r * k} fill="none"
          stroke={i === 2 ? C.inkWash : C.inkSoft} strokeWidth={i === 2 ? 1.6 : 1.2} opacity={0.85 - i * 0.15} />
      );
    })}
    <circle cx={0} cy={0} r={2.2 * Math.min(1, p * 3)} fill={C.goldDeep} />
  </svg>
);

/**
 * 左上角年份标签：金线生长 + 文字擦出
 * variant='earth'：木线（地质时间）——墨色字 + 年轮小图标 + “EARTH TIME” 前缀，与人线的金色年份区分
 */
export const YearTag: React.FC<{year: string; note?: string; tone?: 'ink' | 'light'; variant?: 'earth'}> = ({
  year,
  note,
  tone = 'ink',
  variant,
}) => {
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
  const earth = variant === 'earth';
  const noteText = earth ? `EARTH TIME${note ? ` · ${note}` : ''}` : note;
  return (
    <div style={{position: 'absolute', left: 104, top: 84, opacity: out}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        {earth ? (
          <RingIcon p={line} />
        ) : (
          <div style={{width: 60 * line, height: 2, background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`}} />
        )}
        <div
          style={{
            fontFamily: serif,
            fontWeight: 600,
            fontSize: 42,
            letterSpacing: '0.06em',
            color: earth ? C.inkSoft : light ? C.goldLight : C.goldDeep,
            clipPath: `inset(0 ${(1 - txt) * 100}% 0 0)`,
            textShadow: light ? '0 0 14px rgba(20,24,36,0.5)' : '0 0 12px rgba(251,246,236,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {year}
        </div>
      </div>
      {noteText ? (
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
          {noteText}
        </div>
      ) : null}
    </div>
  );
};
