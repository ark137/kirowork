import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';

/**
 * s21（8 秒 / 240 帧）：2007–2010，成为很多重要地方的脚下
 * 一条连续的地板线贯穿画面；四座抽象建筑线稿依次被“画”出：
 *   奥运场馆（编织的椭圆碗）→ 苏州吴江工厂（锯齿天窗）→ 上海世博中心（长挑檐、细柱、玻璃幕墙）→ 整木定制（护墙板与拱门）
 * 每座建筑画完后，脚下的地板一块块亮成金色；最后整条地板线被金光贯通。
 * （均为抽象线稿，不使用任何奥运 / 世博标志）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BASE = 700;
const XS = [300, 740, 1180, 1620];
const STEP = 44;
const START = 8;
const DRAW = 40;

const ITEMS = [
  {zh: '奥运场馆', en: 'OLYMPIC VENUES'},
  {zh: '苏州吴江工厂', en: 'WUJIANG, SUZHOU'},
  {zh: '上海世博中心', en: 'EXPO CENTER, SHANGHAI'},
  {zh: '整木定制', en: 'BESPOKE WHOLE-WOOD'},
];

/** 线稿路径（局部坐标，原点在建筑底部中心） */
const DRAWINGS: string[][] = [
  // 奥运场馆：椭圆碗 + 编织钢构
  (() => {
    const d: string[] = [];
    d.push('M-180,0 L-180,-60 C-180,-150 -90,-170 0,-170 C90,-170 180,-150 180,-60 L180,0');
    d.push('M-160,-150 C-100,-182 100,-182 160,-150 C100,-128 -100,-128 -160,-150 Z');
    for (let k = -8; k <= 8; k++) {
      const x = k * 22;
      d.push(`M${x - 40},0 C${x - 20},-60 ${x + 10},-120 ${x + 30},-162`);
      d.push(`M${x + 40},0 C${x + 20},-60 ${x - 10},-120 ${x - 30},-162`);
    }
    return d;
  })(),
  // 苏州吴江工厂：锯齿天窗厂房
  (() => {
    const d: string[] = ['M-190,0 L-190,-110 L190,-110 L190,0'];
    for (let k = 0; k < 6; k++) {
      const x = -190 + k * 63.3;
      d.push(`M${x},-110 L${x + 44},-160 L${x + 44},-110`);
      d.push(`M${x + 44},-160 L${x + 63.3},-110`);
    }
    for (let k = 0; k < 7; k++) d.push(`M${-170 + k * 54},-80 h30 v34 h-30 Z`);
    d.push('M-40,0 L-40,-36 L40,-36 L40,0');
    return d;
  })(),
  // 上海世博中心：长挑檐 + 细柱 + 玻璃幕墙
  (() => {
    const d: string[] = ['M-200,-170 L200,-170 L200,-156 L-200,-156 Z', 'M-170,-156 L-170,0 M170,-156 L170,0'];
    for (let k = 0; k < 13; k++) d.push(`M${-150 + k * 25},-148 L${-150 + k * 25},0`);
    for (let k = 0; k < 4; k++) d.push(`M-150,${-118 + k * 32} L150,${-118 + k * 32}`);
    d.push('M-210,-182 L210,-182');
    return d;
  })(),
  // 整木定制：护墙板、拱门、顶角线
  (() => {
    const d: string[] = ['M-180,0 L-180,-200 L180,-200 L180,0', 'M-180,-186 L180,-186', 'M-180,-178 L180,-178'];
    d.push('M-46,0 L-46,-120 C-46,-150 46,-150 46,-120 L46,0');
    d.push('M-34,0 L-34,-118 C-34,-138 34,-138 34,-118 L34,0');
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const x0 = sx < 0 ? -166 + k * 58 : 66 + k * 58;
        d.push(`M${x0},-164 h50 v84 h-50 Z`);
        d.push(`M${x0 + 8},-156 h34 v68 h-34 Z`);
        d.push(`M${x0},-64 h50 v52 h-50 Z`);
      }
    }
    d.push('M-180,-70 L-60,-70 M60,-70 L180,-70');
    return d;
  })(),
];

export const S21Landmarks: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const floorIn = interpolate(f, [0, 30], [0, 1], {...cl, easing: io});
  const finale = interpolate(f, [192, 228], [0, 1], {...cl, easing: io});

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="lm" seed={101} />
          <linearGradient id="lm-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCE9B8" stopOpacity={0} />
            <stop offset="100%" stopColor="#F7D47A" stopOpacity={0.5} />
          </linearGradient>
          <clipPath id="lm-bowl">
            <path d="M-180,0 L-180,-60 C-180,-150 -90,-170 0,-170 C90,-170 180,-150 180,-60 L180,0 Z" />
          </clipPath>
          <linearGradient id="lm-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFF3CF" stopOpacity={0} />
            <stop offset="50%" stopColor="#FFF3CF" stopOpacity={1} />
            <stop offset="100%" stopColor="#FFF3CF" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* 远景：柔和金色日轮 + 淡墨城市天际线 */}
        <circle cx={W / 2} cy={300} r={170} fill="#FBE6AE" opacity={0.45 * floorIn} filter="url(#lm-soft)" />
        <g fill={C.paperShade} opacity={0.22 * floorIn} filter="url(#lm-wash)">
          {new Array(26).fill(0).map((_, k) => {
            const h = 90 + ((k * 37) % 7) * 26 + (k % 3) * 18;
            return <rect key={k} x={40 + k * 72} y={BASE - h - 40} width={58} height={h + 40} />;
          })}
        </g>
        <g fill="none" stroke={C.inkMute} strokeWidth={1.2} opacity={0.25 * floorIn}>
          <path d="M140,250 q60,-26 120,0 q40,-18 80,0" />
          <path d="M1480,200 q70,-30 140,0 q50,-22 100,0" />
          <path d="M760,170 q50,-20 100,0" />
        </g>

        {/* 地板线：木条 */}
        <g opacity={floorIn}>
          {new Array(48).fill(0).map((_, k) => {
            const x = 60 + k * 37.5;
            const owner = XS.findIndex((cx) => Math.abs(cx - (x + 18)) < 210);
            const litAt = owner >= 0 ? START + owner * STEP + DRAW + Math.abs(XS[owner] - (x + 18)) / 18 : 999;
            const lit = Math.max(interpolate(f, [litAt, litAt + 10], [0, 1], cl), finale);
            return (
              <g key={k}>
                <rect x={x} y={BASE} width={35} height={22} rx={2} fill={mixHex('#D9C6A2', C.gold, lit)} stroke={C.goldAntique} strokeOpacity={0.35} strokeWidth={1} />
                <line x1={x + 4} y1={BASE + 8} x2={x + 31} y2={BASE + 10} stroke="#FFF2CC" strokeOpacity={0.35 + lit * 0.4} strokeWidth={1.2} />
              </g>
            );
          })}
          <line x1={60} y1={BASE} x2={W - 60} y2={BASE} stroke={C.goldAntique} strokeWidth={2} opacity={0.7} />
          {finale > 0 && finale < 1 ? (
            <rect x={60 + finale * (W - 120) - 160} y={BASE - 6} width={320} height={34} fill="url(#lm-sweep)" style={{mixBlendMode: 'screen'}} />
          ) : null}
        </g>

        {/* 四座建筑 */}
        {DRAWINGS.map((paths, i) => {
          const t0 = START + i * STEP;
          const draw = interpolate(f, [t0, t0 + DRAW], [0, 1], {...cl, easing: io});
          const glow = interpolate(f, [t0 + DRAW - 6, t0 + DRAW + 16], [0, 1], cl);
          return (
            <g key={i} transform={`translate(${XS[i]} ${BASE}) scale(1.06 1.4)`}>
              {/* 落成后的暖光 */}
              <rect x={-200} y={-200} width={400} height={200} fill="url(#lm-fill)" opacity={glow * 0.8} />
              <g filter="url(#lm-bleed)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                {paths.map((d, k) => (
                  <path
                    key={k}
                    d={d}
                    clipPath={i === 0 && k >= 2 ? 'url(#lm-bowl)' : undefined}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - Math.min(1, Math.max(0, draw * 1.3 - (k / paths.length) * 0.3))}
                    stroke={glow > 0.5 ? C.goldDeep : C.inkSoft}
                    strokeWidth={k === 0 ? 2.6 : 1.5}
                    opacity={0.9}
                  />
                ))}
              </g>
            </g>
          );
        })}
      </svg>

      {/* 标签 */}
      {ITEMS.map((it, i) => {
        const t0 = START + i * STEP + DRAW - 4;
        const on = interpolate(f, [t0, t0 + 16], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
        return (
          <div key={i} style={{position: 'absolute', left: XS[i] - 200, width: 400, top: BASE + 44, textAlign: 'center', opacity: on, transform: `translateY(${(1 - on) * 8}px)`}}>
            <div style={{fontFamily: serif, fontWeight: 600, fontSize: 32, lineHeight: 1.2, letterSpacing: '0.12em', color: C.ink}}>{it.zh}</div>
            <div style={{fontFamily: sans, fontSize: 12, letterSpacing: '0.3em', color: C.goldDeep, marginTop: 6}}>{it.en}</div>
          </div>
        );
      })}
      <GoldDust count={26} seed="lmd" opacity={0.55} />
    </AbsoluteFill>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};
