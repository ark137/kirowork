import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {AnxinLogoArt, LOGO_H, LOGO_TILES, LOGO_W} from '../components/AnxinLogo';

/**
 * 第 7 镜（8 秒 / 240 帧）：1994.7，亲手设计商标
 * 0–40   ：门头上的绿色大树（承接第 6 镜）褪为纸上的铅笔手绘稿
 * 30–80  ：铅笔线稿描出树形与地板条格子
 * 70–170 ：46 块金色地板条自下而上逐块落位，堆成大树
 * 160–240：树干、地平弧、红字出现，金光扫过
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const LW = 980;
const SC = LW / LOGO_W;
const LH = LOGO_H * SC;
const N = LOGO_TILES.length;

export const S7TreeMark: React.FC = () => {
  const f = useCurrentFrame();
  const green = interpolate(f, [0, 36], [1, 0], cl);
  const sketch = interpolate(f, [24, 80], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const sketchFade = interpolate(f, [150, 190], [1, 0.25], cl);
  const trunk = interpolate(f, [150, 176], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const text = interpolate(f, [176, 204], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const sweep = interpolate(f, [190, 236], [-0.3, 1.3], cl);
  const zoom = interpolate(f, [0, 240], [1.08, 0.98], {...cl, easing: Easing.inOut(Easing.sin)});
  const ox = (W - LW) / 2;
  const oy = (H - LH) / 2 - 60;

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 42]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="s7-pencil" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
          </filter>
          <linearGradient id="s7-sweep" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset={Math.max(0, sweep - 0.12)} stopColor="#fff" stopOpacity={0} />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFF6D8" stopOpacity={0.85} />
            <stop offset={Math.min(1, sweep + 0.12)} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="s7-tiles-mask">
            <g transform={`translate(${ox} ${oy}) scale(${SC})`}>
              <AnxinLogoArt tileFill="#fff" textColor="#fff" />
            </g>
          </mask>
        </defs>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})`}>
          {/* 承接第 6 镜：门头绿色大树 */}
          {green > 0 ? (
            <g transform={`translate(${ox} ${oy}) scale(${SC})`} opacity={green}>
              <AnxinLogoArt tileFill="#2E8C4E" showText={false} groundOpacity={0} />
            </g>
          ) : null}
          {/* 铅笔手绘稿 */}
          <g transform={`translate(${ox} ${oy}) scale(${SC})`} opacity={sketchFade} filter="url(#s7-pencil)">
            {LOGO_TILES.map((t) => {
              const p = interpolate(sketch, [t.idx / N * 0.6, t.idx / N * 0.6 + 0.4], [0, 1], cl);
              return (
                <rect
                  key={t.idx}
                  x={-t.w / 2}
                  y={-t.h / 2}
                  width={t.w}
                  height={t.h}
                  fill="none"
                  stroke={C.inkSoft}
                  strokeWidth={3.2}
                  strokeOpacity={0.7}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - p}
                  transform={`translate(${t.cx} ${t.cy}) rotate(${t.rot})`}
                />
              );
            })}
          </g>
          {/* 金色地板条逐块落位 */}
          <g transform={`translate(${ox} ${oy}) scale(${SC})`}>
            <AnxinLogoArt
              tileFill={C.gold}
              trunkOpacity={trunk}
              groundOpacity={trunk}
              textOpacity={text}
              tileStyle={(t) => {
                const start = 70 + (t.idx / N) * 90;
                const p = interpolate(f, [start, start + 16], [0, 1], {...cl, easing: Easing.out(Easing.back(1.5))});
                if (p <= 0) return null;
                return {opacity: Math.min(1, p * 2.2), transform: `translate(${(1 - p) * 40} ${(1 - p) * -180})`};
              }}
            />
          </g>
          {/* 落位时的金光 */}
          {sweep > 0 && sweep < 1.2 ? (
            <rect x={0} y={0} width={W} height={H} fill="url(#s7-sweep)" mask="url(#s7-tiles-mask)" style={{mixBlendMode: 'screen'}} />
          ) : null}
        </g>
      </svg>
      <GoldDust count={36} seed="s7d" opacity={interpolate(f, [80, 160], [0, 0.9], cl)} />
    </AbsoluteFill>
  );
};
