import React from 'react';
import {C} from '../theme';

/**
 * “人与木”段落用的水墨剪影（原点在着地点，站立身高约 200 单位，面向 +x；face=-1 镜像）
 */

/** 盘腿坐（围火） */
export const SeatedFigure: React.FC<{x: number; y: number; h?: number; face?: 1 | -1; lean?: number; color?: string; reach?: number}> = ({
  x,
  y,
  h = 200,
  face = 1,
  lean = 0,
  color = C.ink,
  reach = 0,
}) => {
  const s = h / 200;
  const hand = {x: 24 + reach * 22, y: -40 - reach * 18};
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`} fill={color}>
      <path d="M-38,0 C-36,-24 34,-26 40,0 Z" />
      <g transform={`rotate(${lean} 0 -20)`}>
        <path d="M-15,-18 C-20,-58 -16,-86 -7,-94 L9,-94 C16,-86 18,-56 13,-18 Z" />
        <circle cx={3} cy={-106} r={11.5} />
        <path d="M-9,-110 C-10,-124 14,-126 15,-110 C12,-116 -2,-117 -9,-104 Z" />
        <path d={`M3,-86 Q${hand.x * 0.6},${-66} ${hand.x},${hand.y}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        <circle cx={hand.x} cy={hand.y} r={4.6} />
      </g>
    </g>
  );
};

/** 单膝跪地干活：armAngle 为前臂方向（度，0=水平向前，负值向上）；tool：石锛 / 船桨 */
export const KneelFigure: React.FC<{
  x: number;
  y: number;
  h?: number;
  face?: 1 | -1;
  armAngle?: number;
  lean?: number;
  tool?: 'adze' | 'paddle' | null;
  color?: string;
}> = ({x, y, h = 200, face = 1, armAngle = 20, lean = 10, tool = null, color = C.ink}) => {
  const s = h / 200;
  const hip = {x: -4, y: -62};
  const lr = (lean * Math.PI) / 180;
  const sh = {x: hip.x + Math.sin(lr) * 58, y: hip.y - Math.cos(lr) * 58};
  const a = (armAngle * Math.PI) / 180;
  const elbow = {x: sh.x + Math.cos(a * 0.6 + 0.5) * 28, y: sh.y + Math.sin(a * 0.6 + 0.5) * 28};
  const hand = {x: elbow.x + Math.cos(a) * 30, y: elbow.y + Math.sin(a) * 30};
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {/* 腿：后膝着地、前腿屈膝 */}
        <path d={`M${hip.x},${hip.y} L-20,-6 L-50,-2`} strokeWidth={13} />
        <path d={`M${hip.x},${hip.y} L24,-46 L26,-2`} strokeWidth={13} />
        {/* 躯干 */}
        <path d={`M${hip.x},${hip.y} L${sh.x},${sh.y}`} strokeWidth={26} />
        {/* 手臂 */}
        <path d={`M${sh.x},${sh.y} L${elbow.x},${elbow.y} L${hand.x},${hand.y}`} strokeWidth={8} />
        {tool === 'adze' ? (
          <g>
            <path d={`M${hand.x - Math.cos(a) * 10},${hand.y - Math.sin(a) * 10} L${hand.x + Math.cos(a) * 44},${hand.y + Math.sin(a) * 44}`} strokeWidth={4.5} stroke="#5E4430" />
            <path
              d={`M${hand.x + Math.cos(a) * 44},${hand.y + Math.sin(a) * 44} l${Math.cos(a + 1.57) * 16},${Math.sin(a + 1.57) * 16}`}
              strokeWidth={9}
              stroke="#6B6458"
            />
          </g>
        ) : null}
        {tool === 'paddle' ? (
          <g>
            <path d={`M${hand.x - Math.cos(a) * 46},${hand.y - Math.sin(a) * 46} L${hand.x + Math.cos(a) * 70},${hand.y + Math.sin(a) * 70}`} strokeWidth={4} stroke="#5E4430" />
            <path d={`M${hand.x + Math.cos(a) * 64},${hand.y + Math.sin(a) * 64} L${hand.x + Math.cos(a) * 96},${hand.y + Math.sin(a) * 96}`} strokeWidth={12} stroke="#5E4430" />
          </g>
        ) : null}
      </g>
      <g fill={color}>
        <circle cx={sh.x + Math.sin(lr) * 16} cy={sh.y - 20} r={11.5} />
        <path d={`M${sh.x + Math.sin(lr) * 16 - 11},${sh.y - 22} C${sh.x - 10},${sh.y - 40} ${sh.x + 26},${sh.y - 42} ${sh.x + Math.sin(lr) * 16 + 12},${sh.y - 26} Z`} />
        <circle cx={hand.x} cy={hand.y} r={4.6} />
      </g>
    </g>
  );
};

/** 站立 / 行走（侧身）：step 为步态相位（弧度），walk=0 时静立 */
export const WalkFigure: React.FC<{x: number; y: number; h?: number; face?: 1 | -1; step?: number; walk?: number; color?: string; child?: boolean}> = ({
  x,
  y,
  h = 200,
  face = 1,
  step = 0,
  walk = 1,
  color = C.ink,
  child = false,
}) => {
  const s = h / 200;
  const sw = Math.sin(step) * 0.5 * walk;
  const leg = (ph: number) => {
    const knee = {x: Math.sin(ph) * 26 + 4, y: -44};
    const foot = {x: Math.sin(ph) * 46, y: ph > 0 ? -2 : -2 - Math.max(0, -ph) * 10};
    return `M0,-86 L${knee.x.toFixed(1)},${knee.y} L${foot.x.toFixed(1)},${foot.y.toFixed(1)}`;
  };
  const head = child ? 15 : 11.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
        <path d={leg(sw)} strokeWidth={11} />
        <path d={leg(-sw)} strokeWidth={11} />
        <path d={`M0,-90 L2,${child ? -136 : -150}`} strokeWidth={child ? 32 : 28} />
        <path d={`M2,-146 L${Math.sin(-sw) * 30},-100`} strokeWidth={8} />
        <path d={`M2,-146 L${Math.sin(sw) * 30 + 4},-100`} strokeWidth={8} />
      </g>
      <circle cx={4} cy={child ? -172 : -166} r={head} fill={color} />
    </g>
  );
};
