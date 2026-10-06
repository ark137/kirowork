import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** 宣纸底：暖色渐变 + 纤维纹理 */
export const Paper: React.FC<{tint?: string; glowAt?: [number, number]}> = ({
  tint,
  glowAt = [50, 45],
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 75% at ${glowAt[0]}% ${glowAt[1]}%, ${C.paperLight} 0%, ${C.paper} 50%, ${C.paperDeep} 100%)`,
      }}
    >
      {tint ? <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply'}} /> : null}
      <PaperFibers />
    </AbsoluteFill>
  );
};

export const PaperFibers: React.FC<{opacity?: number}> = ({opacity = 0.55}) => (
  <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity}}>
    <filter id="paper-fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="3" seed="7" result="f" />
      <feColorMatrix
        in="f"
        type="matrix"
        values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0.22 -0.06"
      />
    </filter>
    <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="g" />
      <feColorMatrix
        in="g"
        type="matrix"
        values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.16 -0.04"
      />
    </filter>
    <rect width="100%" height="100%" filter="url(#paper-fiber)" />
    <rect width="100%" height="100%" filter="url(#paper-grain)" />
  </svg>
);

/** 全局氛围：暖色暗角 + 胶片颗粒（不压黑，保持亮度） */
export const Atmosphere: React.FC<{vignette?: number; grain?: number}> = ({vignette = 1, grain = 1}) => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(110,78,40,${0.22 * vignette}) 100%)`,
        }}
      />
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.09 * grain, mixBlendMode: 'overlay'}}>
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed={seed * 13 + 1} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
