import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {archaeopteris, fernTuft} from '../components/Plants';

/**
 * 第 3 镜（6 秒 / 180 帧）：约 3.85 亿年前，第一片森林
 * 三层水墨古羊齿树自下而上“站起来”，光束从左上穿过树冠，镜头缓慢上摇推进
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 900;

type TreeSpec = {x: number; h: number; w: number; seed: string; layer: 0 | 1 | 2; delay: number};

const TREES: TreeSpec[] = [
  // 远景
  ...new Array(14).fill(0).map((_, i) => ({
    x: 60 + i * 140 + (random(`fx${i}`) - 0.5) * 80,
    h: 380 + random(`fh${i}`) * 160,
    w: 9,
    seed: `far${i}`,
    layer: 0 as const,
    delay: 10 + random(`fd${i}`) * 30,
  })),
  // 中景
  ...[180, 520, 820, 1130, 1420, 1760].map((x, i) => ({
    x,
    h: 560 + random(`mh${i}`) * 140,
    w: 16,
    seed: `mid${i}`,
    layer: 1 as const,
    delay: 0 + i * 5,
  })),
  // 近景（部分出画）
  {x: -40, h: 1100, w: 44, seed: 'near0', layer: 2, delay: 6},
  {x: 1980, h: 1160, w: 50, seed: 'near1', layer: 2, delay: 12},
  {x: 1270, h: 960, w: 30, seed: 'near2', layer: 2, delay: 18},
];

const LAYER = [
  {color: C.inkWash, op: 0.26, base: GROUND - 70, par: 0.25, filter: 'soft'},
  {color: C.inkSoft, op: 0.55, base: GROUND - 20, par: 0.6, filter: 'bleed'},
  {color: C.ink, op: 0.82, base: GROUND + 60, par: 1, filter: 'bleed'},
] as const;

export const S3Forest: React.FC = () => {
  const f = useCurrentFrame();
  const trees = useMemo(
    () => TREES.map((t) => ({...t, geo: archaeopteris(t.x, LAYER[t.layer].base, t.h, t.seed, t.w)})),
    [],
  );
  const tufts = useMemo(
    () => new Array(16).fill(0).map((_, i) => fernTuft(i * 128 + random(`tf${i}`) * 60, GROUND + 70 + random(`ty${i}`) * 40, 70 + random(`ts${i}`) * 50, `tf${i}`)),
    [],
  );

  const camY = interpolate(f, [0, 180], [70, -30], {...cl, easing: Easing.inOut(Easing.sin)});
  const camS = interpolate(f, [0, 180], [1.04, 1.12], cl);
  const rays = interpolate(f, [40, 100], [0, 1], {...cl, easing: Easing.inOut(Easing.sin)});
  const mist = interpolate(f, [0, 180], [0, 60]);

  return (
    <AbsoluteFill>
      <Paper glowAt={[22, 12]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="s3" seed={14} />
          <linearGradient id="s3-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F0E2" stopOpacity={0} />
            <stop offset="60%" stopColor="#F7F0E2" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#F7F0E2" stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="s3-ray" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF1C8" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#FFF1C8" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="s3-sun" cx="0.2" cy="0.05" r="0.6">
            <stop offset="0%" stopColor="#FFF6DC" stopOpacity={1} />
            <stop offset="100%" stopColor="#FFF6DC" stopOpacity={0} />
          </radialGradient>
          {trees.map((t, i) => (
            <clipPath key={i} id={`s3-grow-${i}`}>
              <rect
                x={t.x - t.h}
                width={t.h * 2}
                y={LAYER[t.layer].base - t.h * 1.1 * grow(f, t.delay)}
                height={t.h * 1.2 * grow(f, t.delay) + 80}
              />
            </clipPath>
          ))}
        </defs>
        <rect width={W} height={H} fill="url(#s3-sun)" />
        {[0, 1, 2].map((layer) => {
          const L = LAYER[layer];
          return (
            <g
              key={layer}
              transform={`translate(${W / 2} ${H / 2}) scale(${1 + (camS - 1) * L.par}) translate(${-W / 2} ${-H / 2 + camY * L.par})`}
            >
              {layer === 1 ? <rect x={-200} y={GROUND - 260} width={W + 400} height={500} fill="url(#s3-mist)" transform={`translate(${-mist} 0)`} /> : null}
              {trees.map((t, i) => {
                if (t.layer !== layer) return null;
                return (
                  <g key={i} clipPath={`url(#s3-grow-${i})`} filter={`url(#s3-${L.filter})`} opacity={L.op}>
                    <path d={t.geo.trunk} fill={L.color} />
                    <path d={t.geo.branches} fill="none" stroke={L.color} strokeWidth={layer === 2 ? 5 : layer === 1 ? 3 : 2} strokeLinecap="round" />
                    <path d={t.geo.leaves} fill="none" stroke={L.color} strokeWidth={layer === 2 ? 3 : layer === 1 ? 2 : 1.4} strokeLinecap="round" opacity={0.85} />
                  </g>
                );
              })}
              {layer === 2 ? (
                <g>
                  <rect x={-200} y={GROUND + 60} width={W + 400} height={400} fill="#E3D5B8" />
                  <g stroke={C.inkSoft} strokeWidth={3} fill="none" opacity={0.6} filter="url(#s3-bleed)">
                    {tufts.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                </g>
              ) : null}
            </g>
          );
        })}
        {/* 光束 */}
        <g style={{mixBlendMode: 'screen'}} opacity={rays}>
          {[
            [180, 0.5, 120],
            [420, 0.65, 70],
            [640, 0.4, 150],
            [900, 0.55, 90],
            [1180, 0.35, 60],
          ].map(([x, o, w], i) => {
            const flick = 0.75 + 0.25 * Math.sin(f * 0.05 + i * 1.7);
            return (
              <polygon
                key={i}
                points={`${x - 260},-40 ${x - 260 + w},-40 ${x + 760 + w * 2.2},${H + 40} ${x + 760},${H + 40}`}
                fill="url(#s3-ray)"
                opacity={o * flick}
              />
            );
          })}
        </g>
      </svg>
      <GoldDust count={40} seed="s3d" opacity={rays * 0.9} />
    </AbsoluteFill>
  );
};

const grow = (f: number, delay: number) =>
  interpolate(f, [delay, delay + 80], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
