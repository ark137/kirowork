import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {lerp} from '../lib/geom';

/**
 * H4 · 故宫（7 秒 / 210 帧）：1420，紫禁城
 * A   6– 92  特写：一组斗拱从坐斗开始，拱、斗、昂一层层叠起（与第 7 镜 Logo 地板条堆叠同一动作）
 * B  92–168  镜头后拉：一组 → 一排斗拱，托起金黄的屋檐；红柱、重檐、汉白玉台基
 * C 168–224  再拉开：雾中层层宫殿屋顶，飞鸟掠过
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

const BASE = 628; // 斗拱底（额枋顶）
const HERO = 960;
const SETS = new Array(15).fill(0).map((_, k) => 470 + k * 70);
const COLS = [470, 610, 750, 890, 1030, 1170, 1310, 1450];
const ROOF = '#D9A53A';
const ROOF_D = '#B8862A';
const RED = '#A8423A';
const TEAL = '#4E7F78';
const BLUE = '#3D5F7A';
const GOLD_LINE = '#F2D27A';

type Part = {kind: 'dou' | 'gong' | 'ang' | 'fang'; x: number; y: number; w: number; h: number};

/** 一组斗拱（自下而上的叠放顺序） */
const PARTS: Part[] = [
  {kind: 'dou', x: 0, y: -9, w: 22, h: 9},
  {kind: 'gong', x: 0, y: -15, w: 64, h: 6},
  {kind: 'dou', x: -26, y: -21, w: 11, h: 6},
  {kind: 'dou', x: 0, y: -21, w: 11, h: 6},
  {kind: 'dou', x: 26, y: -21, w: 11, h: 6},
  {kind: 'gong', x: 0, y: -27, w: 84, h: 6},
  {kind: 'dou', x: -36, y: -33, w: 11, h: 6},
  {kind: 'dou', x: -12, y: -33, w: 11, h: 6},
  {kind: 'dou', x: 12, y: -33, w: 11, h: 6},
  {kind: 'dou', x: 36, y: -33, w: 11, h: 6},
  {kind: 'ang', x: 0, y: -39, w: 102, h: 6},
  {kind: 'dou', x: -40, y: -45, w: 11, h: 6},
  {kind: 'dou', x: 0, y: -45, w: 11, h: 6},
  {kind: 'dou', x: 40, y: -45, w: 11, h: 6},
  {kind: 'fang', x: 0, y: -51, w: 70, h: 6},
];
const STEP = 4.6;
const START = 6;

const PartShape: React.FC<{p: Part; cx: number}> = ({p, cx}) => {
  const x = cx + p.x;
  const y = BASE + p.y;
  if (p.kind === 'dou') {
    // 斗：上宽下窄
    return <path d={`M${x - p.w / 2},${y} L${x + p.w / 2},${y} L${x + p.w * 0.36},${y + p.h} L${x - p.w * 0.36},${y + p.h} Z`} fill={TEAL} stroke={GOLD_LINE} strokeWidth={0.5} />;
  }
  if (p.kind === 'gong') {
    // 拱：两端向下卷杀
    return (
      <path
        d={`M${x - p.w / 2},${y} L${x + p.w / 2},${y} Q${x + p.w / 2 + 2},${y + p.h} ${x + p.w / 2 - 4},${y + p.h} L${x - p.w / 2 + 4},${y + p.h} Q${x - p.w / 2 - 2},${y + p.h} ${x - p.w / 2},${y} Z`}
        fill={BLUE}
        stroke={GOLD_LINE}
        strokeWidth={0.5}
      />
    );
  }
  if (p.kind === 'ang') {
    // 昂：两端尖嘴
    return <path d={`M${x - p.w / 2 + 6},${y} L${x + p.w / 2 - 6},${y} L${x + p.w / 2 + 4},${y + p.h + 2} L${x - p.w / 2 - 4},${y + p.h + 2} Z`} fill={TEAL} stroke={GOLD_LINE} strokeWidth={0.5} />;
  }
  return <rect x={x - p.w / 2} y={y} width={p.w} height={p.h} fill={RED} stroke={GOLD_LINE} strokeWidth={0.4} />;
};

export const H4Palace: React.FC = () => {
  const f = useCurrentFrame();
  const back = interpolate(f, [92, 168], [0, 1], {...cl, easing: io});
  const Z = Math.exp(lerp(Math.log(11), 0, back)) * lerp(1, 1.045, interpolate(f, [168, 224], [0, 1], cl));
  const cx = HERO;
  const cy = lerp(BASE - 22, 560, back);
  const hallIn = interpolate(f, [96, 130], [0, 1], cl);
  const farIn = interpolate(f, [140, 196], [0, 1], cl);
  const geo = useMemo(() => build(), []);

  /** 第 i 个构件在第 k 组上的落位进度 */
  const partP = (k: number, i: number) => {
    const delay = Math.abs(k - 7) * 2.6;
    const t0 = START + delay + i * STEP;
    return interpolate(f, [t0, t0 + 9], [0, 1], {...cl, easing: Easing.out(Easing.back(1.6))});
  };

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 22]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="h4" seed={141} />
          <linearGradient id="h4-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6B84E" />
            <stop offset="100%" stopColor={ROOF_D} />
          </linearGradient>
          <linearGradient id="h4-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F0E2" stopOpacity={0} />
            <stop offset="100%" stopColor="#F7F0E2" stopOpacity={0.95} />
          </linearGradient>
          <radialGradient id="h4-sun" cx="0.5" cy="0.2" r="0.6">
            <stop offset="0%" stopColor="#FFF4D4" />
            <stop offset="100%" stopColor="#FFF4D4" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#h4-sun)" />

        {/* 远景：雾中层层宫殿屋顶（不随特写缩放，单独视差） */}
        <g opacity={farIn} filter="url(#h4-soft)">
          {geo.far.map((r, i) => (
            <g key={i} opacity={r.o}>
              <path d={`M${r.x - r.w / 2 - 20},${r.y} Q${r.x - r.w / 2 + 10},${r.y - 6} ${r.x - r.w / 2 + 24},${r.y - r.h} L${r.x + r.w / 2 - 24},${r.y - r.h} Q${r.x + r.w / 2 - 10},${r.y - 6} ${r.x + r.w / 2 + 20},${r.y} Z`} fill={ROOF} />
              <rect x={r.x - r.w / 2 + 14} y={r.y} width={r.w - 28} height={r.h * 1.1} fill={RED} opacity={0.6} />
            </g>
          ))}
          <rect x={-100} y={560} width={W + 200} height={160} fill="url(#h4-mist)" />
        </g>

        <g transform={`translate(${W / 2} ${H / 2}) scale(${Z}) translate(${-cx} ${-cy})`}>
          {/* 大殿主体 */}
          <g opacity={hallIn}>
            {/* 汉白玉台基 */}
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={300 - k * 60} y={860 + k * 30} width={1320 + k * 120} height={30} fill={['#EFE9DC', '#E6DFD0', '#DDD5C4'][k]} stroke="#BDB3A0" strokeWidth={1.2} />
                <g stroke="#BDB3A0" strokeWidth={1}>
                  {new Array(26 + k * 2).fill(0).map((_, j) => (
                    <line key={j} x1={300 - k * 60 + j * 52} y1={860 + k * 30} x2={300 - k * 60 + j * 52} y2={872 + k * 30} />
                  ))}
                </g>
              </g>
            ))}
            {/* 红墙与门窗 */}
            <rect x={440} y={640} width={1040} height={220} fill={RED} />
            {COLS.slice(0, -1).map((x, i) => (
              <g key={i}>
                <rect x={x + 20} y={680} width={100} height={180} fill="#8E3A30" />
                <g stroke={GOLD_LINE} strokeWidth={1} opacity={0.55}>
                  {new Array(5).fill(0).map((__, j) => (
                    <line key={j} x1={x + 20 + (j + 1) * 16.6} y1={684} x2={x + 20 + (j + 1) * 16.6} y2={790} />
                  ))}
                  {new Array(6).fill(0).map((__, j) => (
                    <line key={`h${j}`} x1={x + 22} y1={690 + j * 18} x2={x + 118} y2={690 + j * 18} />
                  ))}
                </g>
              </g>
            ))}
            {/* 红柱 */}
            {COLS.map((x) => (
              <rect key={x} x={x - 9} y={636} width={18} height={226} fill="#B8473C" />
            ))}
          </g>
          {/* 额枋（青绿彩画），随斗拱一起在特写里可见 */}
          <rect x={430} y={BASE} width={1060} height={12} fill={BLUE} stroke={GOLD_LINE} strokeWidth={0.6} />
          <g stroke={GOLD_LINE} strokeWidth={0.6} fill="none" opacity={0.8}>
            {SETS.map((x) => (
              <path key={x} d={`M${x - 16},${BASE + 6} q8,-5 16,0 q8,5 16,0`} />
            ))}
          </g>

          {/* 斗拱：一层层叠起 */}
          {SETS.map((sx, k) => (
            <g key={sx}>
              {PARTS.map((p, i) => {
                const t = partP(k, i);
                if (t <= 0) return null;
                return (
                  <g key={i} transform={`translate(0 ${(1 - t) * -26})`} opacity={Math.min(1, t * 2.5)}>
                    <PartShape p={p} cx={sx} />
                  </g>
                );
              })}
            </g>
          ))}
          {/* 挑檐枋 */}
          <rect x={430} y={BASE - 57} width={1060} height={6} fill={RED} opacity={interpolate(f, [START + 70, START + 90], [0, 1], cl)} />

          {/* 下檐屋顶 + 上层 + 上檐 */}
          <g opacity={hallIn}>
            <path d={`M300,${BASE - 40} Q340,${BASE - 64} 380,${BASE - 58} L1540,${BASE - 58} Q1580,${BASE - 64} 1620,${BASE - 40} L1460,${BASE - 130} L460,${BASE - 130} Z`} fill="url(#h4-roof)" />
            <g stroke={ROOF_D} strokeWidth={2} opacity={0.6}>
              {new Array(48).fill(0).map((_, j) => {
                const x = 400 + j * 23.5;
                return <line key={j} x1={lerp(x, 960, 0.12)} y1={BASE - 128} x2={x} y2={BASE - 60} />;
              })}
            </g>
            <rect x={600} y={BASE - 196} width={720} height={68} fill={RED} />
            <g>
              {new Array(11).fill(0).map((_, j) => (
                <g key={j} transform={`translate(${620 + j * 68} ${BASE - 196})`}>
                  <rect x={-12} y={-8} width={24} height={8} fill={TEAL} />
                  <rect x={-6} y={-14} width={12} height={6} fill={BLUE} />
                </g>
              ))}
            </g>
            <path d={`M470,${BASE - 206} Q510,${BASE - 232} 550,${BASE - 224} L1370,${BASE - 224} Q1410,${BASE - 232} 1450,${BASE - 206} L1200,${BASE - 330} L720,${BASE - 330} Z`} fill="url(#h4-roof)" />
            <g stroke={ROOF_D} strokeWidth={2} opacity={0.6}>
              {new Array(36).fill(0).map((_, j) => {
                const x = 560 + j * 23.5;
                return <line key={j} x1={lerp(x, 960, 0.3)} y1={BASE - 328} x2={x} y2={BASE - 226} />;
              })}
            </g>
            <rect x={700} y={BASE - 342} width={520} height={14} fill={ROOF_D} />
            {[700, 1220].map((x, i) => (
              <path key={i} d={`M${x},${BASE - 328} l0,-36 q${i ? 22 : -22},-6 ${i ? 18 : -18},${22} l${i ? -6 : 6},14 Z`} fill={ROOF_D} />
            ))}
          </g>
        </g>

        {/* 飞鸟 */}
        <g stroke={C.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.55 * farIn}>
          {new Array(5).fill(0).map((_, i) => {
            const x = interpolate(f, [150, 224], [1500 + i * 40, 600 + i * 40]);
            const y = 200 + i * 16 + Math.sin(f * 0.1 + i) * 6;
            const w = 9 + Math.sin(f * 0.5 + i) * 4;
            return <path key={i} d={`M${x - 11},${y} Q${x - 5},${y - w} ${x},${y} Q${x + 5},${y - w} ${x + 11},${y}`} />;
          })}
        </g>
      </svg>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.55) 88%, rgba(243,234,218,0.78) 100%)'}} />
      <GoldDust count={34} seed="h4d" opacity={0.65} />
    </AbsoluteFill>
  );
};

const build = () => {
  const far = new Array(9).fill(0).map((_, i) => ({
    x: 120 + i * 220 + (random(`h4fx${i}`) - 0.5) * 60,
    y: 600 - random(`h4fy${i}`) * 60,
    w: 160 + random(`h4fw${i}`) * 120,
    h: 40 + random(`h4fh${i}`) * 20,
    o: 0.35 + random(`h4fo${i}`) * 0.25,
  }));
  return {far};
};
