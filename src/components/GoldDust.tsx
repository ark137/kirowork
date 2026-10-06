import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';

/** 漂浮的金色微尘 */
export const GoldDust: React.FC<{count?: number; seed?: string; opacity?: number; color?: string}> = ({
  count = 46,
  seed = 'dust',
  opacity = 1,
  color = C.goldLight,
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <radialGradient id={`dust-${seed}`}>
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {new Array(count).fill(0).map((_, i) => {
        const x0 = random(`${seed}x${i}`) * W;
        const y0 = random(`${seed}y${i}`) * H;
        const sp = 0.15 + random(`${seed}s${i}`) * 0.5;
        const r = 2 + random(`${seed}r${i}`) * 6;
        const y = ((y0 - frame * sp) % H + H) % H;
        const x = x0 + Math.sin(frame * 0.02 + i) * 14;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.05 + i * 1.7));
        return <circle key={i} cx={x} cy={y} r={r} fill={`url(#dust-${seed})`} opacity={tw} />;
      })}
    </svg>
  );
};
