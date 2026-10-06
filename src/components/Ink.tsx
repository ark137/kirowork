import React from 'react';

/**
 * 水墨滤镜组（放进各场景 svg 的 <defs> 里）
 * - {p}-bleed  ：边缘轻微洇开、抖动
 * - {p}-wash   ：大面积墨晕（更强的位移 + 柔化）
 * - {p}-soft   ：远景柔化
 */
export const InkDefs: React.FC<{p: string; seed?: number}> = ({p, seed = 3}) => (
  <>
    <filter id={`${p}-bleed`} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
    </filter>
    <filter id={`${p}-wash`} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed={seed + 5} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="18" result="d" />
      <feGaussianBlur in="d" stdDeviation="1.6" />
    </filter>
    <filter id={`${p}-soft`} x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="3" />
    </filter>
  </>
);
