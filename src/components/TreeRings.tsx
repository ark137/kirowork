import React, {useMemo} from 'react';
import {C} from '../theme';
import {wobblyCircle} from '../lib/geom';

export type RingSpec = {r: number; seed: string};

/** 年轮半径序列：越往外越宽松（早材 / 晚材交替） */
export const makeRings = (count: number, seed = 'ring'): RingSpec[] =>
  new Array(count).fill(0).map((_, i) => ({
    r: 10 + 25 * i * (1 + i * 0.014),
    seed: `${seed}${i}`,
  }));

/**
 * 年轮：每圈 = 淡色木带（填充）+ 墨金描边（路径生长）
 * progress[i] ∈ [0,1] 控制第 i 圈的描边进度
 */
export const TreeRings: React.FC<{
  rings: RingSpec[];
  progress: number[];
  cx?: number;
  cy?: number;
  strokeScale?: number;
}> = ({rings, progress, cx = 0, cy = 0, strokeScale = 1}) => {
  const paths = useMemo(() => rings.map((r) => wobblyCircle(cx, cy, r.r, r.seed, 0.022)), [rings, cx, cy]);
  const order = rings.map((_, i) => i).reverse();
  return (
    <g>
      <defs>
        <filter id="ring-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
      </defs>
      {/* 木带填充（外圈先画） */}
      {order.map((i) => {
        const p = progress[i] ?? 0;
        if (p <= 0) return null;
        const band = i % 2 === 0 ? C.goldLight : C.paperDeep;
        return <path key={`f${i}`} d={paths[i]} fill={band} opacity={0.22 * Math.min(1, p * 1.4)} />;
      })}
      {/* 年轮描边 */}
      <g filter="url(#ring-ink)">
        {rings.map((_, i) => {
          const p = progress[i] ?? 0;
          if (p <= 0) return null;
          const strong = i % 4 === 3;
          return (
            <path
              key={`s${i}`}
              d={paths[i]}
              fill="none"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - p}
              stroke={strong ? C.goldAntique : C.goldDeep}
              strokeOpacity={strong ? 0.85 : 0.55}
              strokeWidth={(strong ? 3.2 : 1.8) * strokeScale}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </g>
  );
};
