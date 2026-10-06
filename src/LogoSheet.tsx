import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {AnxinLogo, LOGO_TILES} from './components/AnxinLogo';
import {Paper, Atmosphere} from './components/Paper';
import {C, sans} from './theme';

/** Logo 重绘校对页：静态 Logo + 地板条自下而上堆叠预演 */
export const LogoSheet: React.FC = () => {
  const f = useCurrentFrame();
  const n = LOGO_TILES.length;
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly'}}>
        <AnxinLogo width={760} />
        <AnxinLogo
          width={760}
          showText={false}
          trunkOpacity={interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'})}
          groundOpacity={1}
          tileStyle={(t) => {
            const start = 10 + (t.idx / n) * 70;
            const p = interpolate(f, [start, start + 16], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.back(1.6)),
            });
            if (p <= 0) return null;
            return {opacity: Math.min(1, p * 2), transform: `translate(0 ${(1 - p) * -60})`};
          }}
        />
      </AbsoluteFill>
      <div style={{position: 'absolute', bottom: 60, width: '100%', textAlign: 'center', fontFamily: sans, color: C.inkMute, letterSpacing: '0.3em', fontSize: 18}}>
        LOGO 矢量重绘 · {n} 块地板条
      </div>
      <Atmosphere />
    </AbsoluteFill>
  );
};
