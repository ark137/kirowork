import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {H, W} from '../theme';

/**
 * 老照片质感（线 B）：暖色偏移 + 褪色 + 灰尘斑点 + 偶发划痕 + 漏光
 * strength 0–1，保持整体明亮，不压黑。
 */
export const OldPhoto: React.FC<{strength?: number; seed?: string; leak?: boolean}> = ({
  strength = 1,
  seed = 'op',
  leak = true,
}) => {
  const f = useCurrentFrame();
  const step = Math.floor(f / 2); // 每 2 帧换一次灰尘
  const specks = new Array(14).fill(0).map((_, i) => ({
    x: random(`${seed}sx${i}-${step}`) * W,
    y: random(`${seed}sy${i}-${step}`) * H,
    r: 0.6 + random(`${seed}sr${i}-${step}`) * 2.2,
    o: random(`${seed}so${i}-${step}`) > 0.55 ? 1 : 0,
    light: random(`${seed}sl${i}-${step}`) > 0.6,
  }));
  const scratchOn = random(`${seed}sc-${Math.floor(f / 5)}`) > 0.72;
  const scratchX = random(`${seed}scx-${Math.floor(f / 5)}`) * W;
  const leakA = 0.5 + 0.5 * Math.sin(f * 0.035 + 1.3);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: strength}}>
      {/* 暖色褪色：把阴影抬亮成棕，把高光推向奶油 */}
      <AbsoluteFill style={{background: 'rgba(238,214,170,0.16)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'rgba(255,240,214,0.12)', mixBlendMode: 'screen'}} />
      {leak ? (
        <AbsoluteFill
          style={{
            mixBlendMode: 'screen',
            opacity: 0.35 * leakA,
            background: 'radial-gradient(ellipse 40% 55% at 4% 18%, rgba(255,170,90,0.75) 0%, rgba(255,170,90,0) 70%)',
          }}
        />
      ) : null}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {specks.map((s, i) =>
          s.o ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.light ? '#FFF6E6' : '#4A3A28'} opacity={0.35} /> : null,
        )}
        {scratchOn ? (
          <line x1={scratchX} y1={0} x2={scratchX + 6} y2={H} stroke="#FFF6E6" strokeOpacity={0.18} strokeWidth={1.2} />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
