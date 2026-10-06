import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W, serif} from '../theme';
import {Paper} from '../components/Paper';
import {TreeRings, makeRings} from '../components/TreeRings';
import {GoldDust} from '../components/GoldDust';
import {InkFigure} from '../components/InkFigure';
import {ridgePath} from '../lib/geom';

/**
 * 序章（第 0–1 镜，共 9 秒 / 270 帧）
 * 0：宣纸上一粒金点，年轮一圈圈长开，圈上闪过“1 年 … 4 亿年”
 * 1：镜头后拉、下摇，年轮沉入地平线化作落日；一个人的背影站在通往落日的路上
 */
const RING_COUNT = 30;
const LABELS: {ring: number; text: string}[] = [
  {ring: 1, text: '1 年'},
  {ring: 3, text: '10 年'},
  {ring: 5, text: '100 年'},
  {ring: 7, text: '1,000 年'},
  {ring: 9, text: '1 万年'},
  {ring: 10, text: '100 万年'},
  {ring: 11, text: '1,000 万年'},
  {ring: 12, text: '1 亿年'},
  {ring: 13, text: '4 亿年'},
];

const ringStart = (i: number) => (i < 14 ? 8 + i * 7.5 : 140 + (i - 14) * 5);
const HORIZON = 742;

const clampOpt = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Prologue: React.FC = () => {
  const f = useCurrentFrame();
  const rings = useMemo(() => makeRings(RING_COUNT, 'pro'), []);
  const progress = rings.map((_, i) =>
    interpolate(f, [ringStart(i), ringStart(i) + 28], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.sin)}),
  );

  // 镜头：前 5 秒缓慢后拉，后 4 秒继续后拉并下沉到地平线
  const scale =
    f < 150
      ? interpolate(f, [0, 150], [1.9, 1.0], {...clampOpt, easing: Easing.out(Easing.quad)})
      : interpolate(f, [150, 270], [1.0, 0.66], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
  const cy = interpolate(f, [140, 240], [H / 2 - 20, HORIZON - 6], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
  const cx = W / 2;
  const rot = interpolate(f, [0, 270], [0, 6]);

  // 中心金点
  const dotIn = interpolate(f, [0, 14], [0, 1], clampOpt);
  const pulse = 1 + 0.08 * Math.sin(f * 0.18);

  // 第 1 镜元素
  const ground = interpolate(f, [150, 200], [0, 1], {...clampOpt, easing: Easing.out(Easing.cubic)});
  const mountains = interpolate(f, [158, 220], [0, 1], {...clampOpt, easing: Easing.out(Easing.cubic)});
  const rays = interpolate(f, [170, 240], [0, 1], clampOpt);
  const man = interpolate(f, [178, 222], [0, 1], {...clampOpt, easing: Easing.out(Easing.quad)});
  const road = interpolate(f, [168, 250], [0, 1], {...clampOpt, easing: Easing.inOut(Easing.cubic)});
  const dustIn = interpolate(f, [20, 80], [0, 1], clampOpt);

  const ridges = useMemo(
    () => [
      ridgePath(W, HORIZON + 2, 70, 'far', HORIZON, 10, 0.0032),
      ridgePath(W, HORIZON + 6, 46, 'mid', HORIZON, 10, 0.006),
    ],
    [],
  );

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, interpolate(f, [140, 240], [48, 66], clampOpt)]} />

      {/* 落日光芒（丁达尔感） */}
      <AbsoluteFill
        style={{
          opacity: rays * 0.9,
          background: `repeating-conic-gradient(from ${f * 0.06}deg at 50% ${(HORIZON / H) * 100}%, rgba(247,212,122,0.28) 0deg 3deg, rgba(247,212,122,0) 3deg 11deg)`,
          WebkitMaskImage: `radial-gradient(circle at 50% ${(HORIZON / H) * 100}%, black 18%, transparent 62%)`,
          maskImage: `radial-gradient(circle at 50% ${(HORIZON / H) * 100}%, black 18%, transparent 62%)`,
        }}
      />

      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="dot-glow">
            <stop offset="0%" stopColor={C.goldLight} stopOpacity={1} />
            <stop offset="35%" stopColor={C.gold} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="sun-wash">
            <stop offset="0%" stopColor="#FFF3D2" stopOpacity={0.9} />
            <stop offset="60%" stopColor={C.goldLight} stopOpacity={0.25} />
            <stop offset="100%" stopColor={C.goldLight} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EFE2C8" />
            <stop offset="30%" stopColor={C.paper} />
            <stop offset="100%" stopColor={C.paperLight} />
          </linearGradient>
          <radialGradient id="sun-reflect" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor={C.goldLight} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.goldLight} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="shadow-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.inkWash} stopOpacity={0.28} />
            <stop offset="100%" stopColor={C.inkWash} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ridge-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.inkWash} stopOpacity={0.32} />
            <stop offset="100%" stopColor={C.inkWash} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ridge-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.inkSoft} stopOpacity={0.45} />
            <stop offset="100%" stopColor={C.inkSoft} stopOpacity={0} />
          </linearGradient>
          <filter id="ink-bleed">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
          </filter>
        </defs>

        {/* 年轮 */}
        <g transform={`translate(${cx} ${cy}) scale(${scale}) rotate(${rot})`}>
          <circle r={260} fill="url(#sun-wash)" opacity={0.5 + rays * 0.5} />
          <TreeRings rings={rings} progress={progress} strokeScale={1 / Math.max(0.75, scale)} />
          <circle r={70 * pulse} fill="url(#dot-glow)" opacity={dotIn} />
          <circle r={6} fill={C.goldDeep} opacity={dotIn} />
        </g>

        {/* 年轮上闪过的数字（屏幕空间，保持可读） */}
        {LABELS.map((l, k) => {
          const t0 = ringStart(l.ring) + 6;
          const isLast = k === LABELS.length - 1;
          const op = isLast
            ? interpolate(f, [t0, t0 + 10, 140, 156], [0, 1, 1, 0], clampOpt)
            : interpolate(f, [t0, t0 + 6, t0 + 18, t0 + 26], [0, 1, 1, 0], clampOpt);
          if (op <= 0) return null;
          // 只放在上半圈和两侧，避开底部字幕区
          const ang = ((isLast ? -32 : -168 + k * 21) * Math.PI) / 180;
          const rr = rings[l.ring].r * scale + 16;
          const x = cx + Math.cos(ang) * rr;
          const y = cy + Math.sin(ang) * rr;
          return (
            <text
              key={l.text}
              x={x}
              y={y}
              fill={isLast ? C.goldAntique : C.goldDeep}
              opacity={op}
              fontFamily={serif}
              fontSize={isLast ? 38 : 22}
              fontWeight={isLast ? 700 : 500}
              letterSpacing={2}
              textAnchor={Math.cos(ang) >= 0 ? 'start' : 'end'}
              style={{filter: `blur(${(1 - op) * 3}px)`}}
            >
              {l.text}
            </text>
          );
        })}

        {/* 地平线、远山、大地 */}
        <g opacity={ground}>
          <rect x={0} y={HORIZON} width={W} height={H - HORIZON} fill="url(#ground-grad)" />
          <ellipse cx={W / 2} cy={HORIZON} rx={620} ry={150} fill="url(#sun-reflect)" opacity={rays} />
          <g transform={`translate(0 ${(1 - mountains) * 30})`} opacity={mountains}>
            <path d={ridges[0]} fill="url(#ridge-far)" />
            <path d={ridges[1]} fill="url(#ridge-mid)" />
          </g>
          <rect x={0} y={HORIZON - 1} width={W} height={2} fill={C.goldDeep} opacity={0.35} />
        </g>

        {/* 通往落日的路 */}
        <g opacity={ground} filter="url(#ink-bleed)">
          <path
            d={`M${W / 2 - 2},${HORIZON + 4} C${W / 2 + 40},${HORIZON + 80} ${W / 2 + 160},${HORIZON + 170} ${W / 2 + 260},${H + 20}`}
            fill="none"
            stroke={C.inkWash}
            strokeOpacity={0.5}
            strokeWidth={2.4}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - road}
          />
          <path
            d={`M${W / 2 + 2},${HORIZON + 4} C${W / 2 - 30},${HORIZON + 80} ${W / 2 - 130},${HORIZON + 170} ${W / 2 - 250},${H + 20}`}
            fill="none"
            stroke={C.inkWash}
            strokeOpacity={0.35}
            strokeWidth={1.6}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - road}
          />
        </g>

        {/* 人：背影望向落日，身后长影 */}
        {/* 逆光长影：从脚下拉向镜头 */}
        <path
          d={`M${W / 2 + 52},846 L${W / 2 + 76},846 L${W / 2 + 118},${846 + 64 * man} L${W / 2 + 84},${846 + 64 * man} Z`}
          fill="url(#shadow-grad)"
          opacity={man}
        />
        <g filter="url(#ink-bleed)">
          <InkFigure
            x={W / 2 + 64}
            y={846}
            height={190}
            sway={Math.sin(f * 0.09)}
            opacity={man}
            blur={(1 - man) * 8}
          />
        </g>
      </svg>

      <GoldDust opacity={dustIn * 0.8} />
    </AbsoluteFill>
  );
};
