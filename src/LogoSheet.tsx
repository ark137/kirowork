import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AnxinLogo, AnxinLogoArt, LOGO_H, LOGO_TILES, LOGO_W} from './components/AnxinLogo';
import {Paper, Atmosphere} from './components/Paper';
import {C, sans} from './theme';

const PW = 560; // 每个面板宽度
const PH = (PW * LOGO_H) / LOGO_W;
const label: React.CSSProperties = {
  fontFamily: sans,
  fontSize: 22,
  letterSpacing: '0.2em',
  color: C.inkSoft,
  textAlign: 'center',
  marginTop: 18,
};

/** Logo 校对页：原图 | 原图与重绘叠加（蓝色描边 = 重绘） | 重绘（带编号） */
export const LogoCompare: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly'}}>
      <div>
        <Img src={staticFile('ref/logo-original.png')} style={{width: PW, display: 'block'}} />
        <div style={label}>原图</div>
      </div>
      <div>
        <div style={{position: 'relative', width: PW, height: PH}}>
          <Img src={staticFile('ref/logo-original.png')} style={{width: PW, position: 'absolute', left: 0, top: 0}} />
          <svg width={PW} height={PH} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} style={{position: 'absolute', left: 0, top: 0}}>
            {LOGO_TILES.map((t) => (
              <rect
                key={t.idx}
                x={-t.w / 2}
                y={-t.h / 2}
                width={t.w}
                height={t.h}
                fill="none"
                stroke="#1455FF"
                strokeWidth={4}
                transform={`translate(${t.cx} ${t.cy}) rotate(${t.rot})`}
              />
            ))}
          </svg>
        </div>
        <div style={label}>叠加（蓝框 = 重绘位置）</div>
      </div>
      <div>
        <svg width={PW} height={PH} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} overflow="visible">
          <AnxinLogoArt
            renderTileContent={(t) => (
              <text
                transform={`rotate(${-t.rot})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={46}
                fontFamily={sans}
                fontWeight={700}
                fill="#fff"
              >
                {t.idx + 1}
              </text>
            )}
          />
        </svg>
        <div style={label}>重绘 · {LOGO_TILES.length} 块（编号 = 堆叠顺序）</div>
      </div>
    </AbsoluteFill>
    <Atmosphere />
  </AbsoluteFill>
);

/** 堆叠预演：地板条自下而上落下成树 */
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
            return {opacity: Math.min(1, p * 2), transform: `translate(0 ${(1 - p) * -110})`};
          }}
        />
      </AbsoluteFill>
      <Atmosphere />
    </AbsoluteFill>
  );
};
