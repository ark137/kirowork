import React from 'react';
import {C} from '../theme';

/**
 * 水墨人物剪影（背影），原点在双脚中点，身高 200 单位（约 8 头身）。
 * hair='long' 对应卢伟光（及肩长发），'short' 对应卢奕开。
 */
export const InkFigure: React.FC<{
  x: number;
  y: number;
  height?: number;
  sway?: number;
  hair?: 'long' | 'short';
  color?: string;
  opacity?: number;
  blur?: number;
}> = ({x, y, height = 200, sway = 0, hair = 'long', color = C.ink, opacity = 1, blur = 0}) => {
  const s = height / 200;
  const flap = sway * 2.5;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${s})`}
      opacity={opacity}
      style={{filter: blur > 0 ? `blur(${blur}px)` : undefined}}
    >
      <g fill={color}>
        {/* 腿 */}
        <path d="M-10,-80 L-2,-80 L-3.5,-2 L-9.5,-2 Z" />
        <path d="M2,-80 L10,-80 L9.5,-2 L3.5,-2 Z" />
        <path d="M-12,-2 C-12,-4 -2,-4 -2,-1 L-2,0 L-12,0 Z" />
        <path d="M2,-1 C2,-4 12,-4 12,-2 L12,0 L2,0 Z" />
        {/* 长风衣：肩部收窄，下摆微张 */}
        <path
          d={`M-19,-158 C-23,-156 -24,-148 -23,-138 L-${22 + flap},-70 C-8,-66 8,-66 ${22 + flap},-69 L23,-138 C24,-148 23,-156 19,-158 C12,-162 -12,-162 -19,-158 Z`}
        />
        {/* 手臂 */}
        <path d="M-21,-155 C-27,-140 -28,-118 -27,-98 L-22,-97 C-22,-116 -21,-134 -17,-148 Z" />
        <path d="M21,-155 C27,-140 28,-118 27,-98 L22,-97 C22,-116 21,-134 17,-148 Z" />
        {/* 颈与头 */}
        <rect x={-4.5} y={-168} width={9} height={10} rx={2} />
        <ellipse cx={0} cy={-178} rx={9.5} ry={11.5} />
        {hair === 'long' ? (
          <path d="M-10.5,-181 C-11,-194 11,-194 10.5,-181 L12,-162 C8,-158 3,-160 0,-160 C-3,-160 -8,-158 -12,-162 Z" />
        ) : (
          <path d="M-10.5,-179 C-12,-194 12,-194 10.5,-179 L9.5,-173 L-9.5,-173 Z" />
        )}
      </g>
    </g>
  );
};
