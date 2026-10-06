import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';
import {wobblyCircle} from '../lib/geom';

/**
 * 第 5 镜（6 秒 / 180 帧）：大学时期，大连理工，船舶设计
 * 船体型线图逐线描出 → 木纹与船壳板从左到右铺满船体 → 一粒种子落在图纸上，长出一道年轮
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BLUE = '#3E5C86';
const HULL = 'M380,404 L1460,366 C1504,420 1496,526 1416,604 L540,616 C462,614 408,566 392,500 Z';
const SEED = {x: 790, y: 770};

export const S5Blueprint: React.FC = () => {
  const f = useCurrentFrame();
  const draw = (a: number, b: number) => interpolate(f, [a, b], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const wood = interpolate(f, [52, 104], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const seedT = interpolate(f, [100, 128], [0, 1], {...cl, easing: Easing.in(Easing.quad)});
  const landed = f >= 128;
  const ringP = (k: number) => interpolate(f, [128 + k * 10, 160 + k * 10], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const push = interpolate(f, [118, 180], [1, 1.22], {...cl, easing: Easing.inOut(Easing.cubic)});
  const drift = interpolate(f, [0, 180], [0, -20]);

  const grain = useMemo(() => {
    const lines: string[] = [];
    for (let i = 0; i < 46; i++) {
      const y0 = 360 + i * 6 + random(`g${i}`) * 3;
      let d = `M360,${y0}`;
      for (let x = 360; x <= 1520; x += 20) {
        const y = y0 + Math.sin(x * 0.006 + i * 0.7) * 6 + Math.sin(x * 0.021 + i) * 2;
        d += ` L${x},${y.toFixed(1)}`;
      }
      lines.push(d);
    }
    // 两处木节
    return lines;
  }, []);
  const seedPos = {
    x: SEED.x + Math.sin(seedT * 5) * 40 * (1 - seedT),
    y: interpolate(seedT, [0, 1], [-60, SEED.y]),
    rot: seedT * 260,
  };
  const bounce = landed ? Math.max(0, Math.sin((f - 128) * 0.5) * 8 * Math.exp(-(f - 128) * 0.25)) : 0;

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="s5-grid" width={40} height={40} patternUnits="userSpaceOnUse">
            <path d="M40,0 L0,0 0,40" fill="none" stroke={BLUE} strokeOpacity={0.1} strokeWidth={1} />
          </pattern>
          <pattern id="s5-grid-l" width={200} height={200} patternUnits="userSpaceOnUse">
            <path d="M200,0 L0,0 0,200" fill="none" stroke={BLUE} strokeOpacity={0.16} strokeWidth={1.2} />
          </pattern>
          <clipPath id="s5-hull">
            <path d={HULL} />
          </clipPath>
          <linearGradient id="s5-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9A15A" />
            <stop offset="55%" stopColor="#C2843F" />
            <stop offset="100%" stopColor="#A86A2E" />
          </linearGradient>
          <linearGradient id="s5-wipe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="92%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="s5-wood-mask">
            <rect x={300} y={300} width={1300 * wood} height={400} fill="url(#s5-wipe)" />
          </mask>
          <radialGradient id="s5-seedglow">
            <stop offset="0%" stopColor={C.goldLight} stopOpacity={0.9} />
            <stop offset="100%" stopColor={C.goldLight} stopOpacity={0} />
          </radialGradient>
          <filter id="s5-pencil" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </defs>

        <g transform={`translate(${SEED.x} ${SEED.y}) scale(${push}) translate(${-SEED.x} ${-SEED.y + drift})`}>
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#s5-grid)" />
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#s5-grid-l)" />

          {/* 木纹船体 */}
          <g clipPath="url(#s5-hull)" mask="url(#s5-wood-mask)">
            <rect x={340} y={340} width={1200} height={300} fill="url(#s5-wood)" opacity={0.9} />
            <g stroke="#8A5524" strokeOpacity={0.35} strokeWidth={1.3} fill="none">
              {grain.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {/* 船壳板（列板）分缝 */}
            <g stroke="#6E3F17" strokeOpacity={0.55} strokeWidth={2} fill="none">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <path key={k} d={`M370,${430 + k * 32} C700,${440 + k * 36} 1100,${420 + k * 38} 1500,${380 + k * 44}`} />
              ))}
            </g>
            <ellipse cx={720} cy={470} rx={22} ry={9} fill="none" stroke="#7A4A1E" strokeOpacity={0.6} strokeWidth={2} />
            <ellipse cx={1180} cy={520} rx={16} ry={7} fill="none" stroke="#7A4A1E" strokeOpacity={0.6} strokeWidth={2} />
          </g>

          {/* 型线图 */}
          <g stroke={BLUE} fill="none" strokeLinecap="round" filter="url(#s5-pencil)">
            <path d={HULL} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw(0, 36)} />
            <g clipPath="url(#s5-hull)" strokeOpacity={0.55} strokeWidth={1.4}>
              {[440, 480, 520, 560, 590].map((y, i) => (
                <line key={y} x1={360} y1={y} x2={360 + 1180 * draw(14 + i * 4, 44 + i * 4)} y2={y - 8} strokeDasharray={y === 520 ? '10 6' : undefined} />
              ))}
              {new Array(12).fill(0).map((_, i) => {
                const x = 470 + i * 84;
                const p = draw(20 + i * 2, 46 + i * 2);
                return <line key={i} x1={x} y1={340} x2={x} y2={340 + 300 * p} />;
              })}
            </g>
            {/* 设计水线标注 */}
            <g opacity={draw(30, 50)}>
              <path d="M1520,512 L1540,500 L1560,512" strokeWidth={1.6} />
              <line x1={1500} y1={512} x2={1620} y2={512} strokeWidth={1.4} />
            </g>
            {/* 总长尺寸线 */}
            <g opacity={draw(34, 56)} strokeWidth={1.4}>
              <line x1={380} y1={668} x2={1460} y2={668} />
              <line x1={380} y1={652} x2={380} y2={684} />
              <line x1={1460} y1={652} x2={1460} y2={684} />
              <path d="M396,662 L380,668 L396,674 M1444,662 L1460,668 L1444,674" />
            </g>
            {/* 横剖面（右上） */}
            <g transform="translate(1660 170)" opacity={draw(24, 60)} strokeWidth={1.8}>
              <line x1={0} y1={-20} x2={0} y2={210} strokeOpacity={0.5} strokeDasharray="6 5" />
              {[0, 1, 2, 3, 4].map((k) => {
                const w = 150 - k * 22;
                return (
                  <g key={k} strokeOpacity={0.75}>
                    <path d={`M0,${200} C${w * 0.7},${200} ${w},${150 - k * 6} ${w},${10 + k * 4}`} />
                    <path d={`M0,${200} C${-w * 0.7},${200} ${-w},${150 - k * 6} ${-w},${10 + k * 4}`} />
                  </g>
                );
              })}
              <line x1={-170} y1={120} x2={170} y2={120} strokeOpacity={0.45} strokeDasharray="10 6" />
            </g>
          </g>
          <text x={920} y={700} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontSize={22} fill={BLUE} opacity={draw(40, 60) * 0.85}>
            L.O.A. 86.00 m
          </text>
          <text x={1630} y={500} fontFamily={sans} fontSize={16} fill={BLUE} opacity={draw(30, 50) * 0.8} letterSpacing={2}>
            DWL
          </text>

          {/* 图签 */}
          <g transform="translate(1400 730)" opacity={draw(44, 70)}>
            <rect width={400} height={110} fill="none" stroke={BLUE} strokeOpacity={0.6} strokeWidth={1.6} />
            <line x1={0} y1={52} x2={400} y2={52} stroke={BLUE} strokeOpacity={0.4} />
            <line x1={150} y1={52} x2={150} y2={110} stroke={BLUE} strokeOpacity={0.4} />
            <text x={200} y={36} textAnchor="middle" fontFamily={serif} fontWeight={600} fontSize={24} fill={BLUE} letterSpacing={4}>
              船舶型线图
            </text>
            <text x={75} y={88} textAnchor="middle" fontFamily={sans} fontSize={15} fill={BLUE} letterSpacing={2}>
              大连理工
            </text>
            <text x={275} y={88} textAnchor="middle" fontFamily={sans} fontSize={15} fill={BLUE} letterSpacing={2}>
              设计 · 卢伟光
            </text>
          </g>

          {/* 三角板与铅笔 */}
          <g opacity={draw(0, 20)}>
            <path d="M120,980 L120,700 L440,980 Z" fill="#CFE0EA" fillOpacity={0.35} stroke={BLUE} strokeOpacity={0.4} strokeWidth={2} />
            <path d="M170,940 L170,820 L300,940 Z" fill={C.paper} fillOpacity={0.6} stroke={BLUE} strokeOpacity={0.3} />
            <g transform={`translate(${1580 - draw(0, 36) * 40} 940) rotate(-24)`}>
              <rect x={0} y={-11} width={300} height={22} fill={C.gold} />
              <rect x={300} y={-11} width={34} height={22} fill="#C9B79A" />
              <path d="M0,-11 L-44,0 L0,11 Z" fill="#E7C9A0" />
              <path d="M-30,-4 L-44,0 L-30,4 Z" fill={C.ink} />
              <line x1={0} y1={0} x2={300} y2={0} stroke={C.goldDeep} strokeWidth={2} />
            </g>
          </g>

          {/* 种子落下 → 年轮 */}
          {landed
            ? [0, 1, 2].map((k) => {
                const p = ringP(k);
                if (p <= 0) return null;
                return (
                  <path
                    key={k}
                    d={wobblyCircle(SEED.x, SEED.y, 30 + k * 34, `s5r${k}`, 0.03)}
                    fill="none"
                    stroke={k === 2 ? C.goldAntique : C.goldDeep}
                    strokeWidth={k === 2 ? 3.2 : 2}
                    strokeOpacity={0.85 - k * 0.12}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - p}
                  />
                );
              })
            : null}
          {landed ? <circle cx={SEED.x} cy={SEED.y} r={90 * ringP(0)} fill="url(#s5-seedglow)" opacity={0.6} /> : null}
          <g transform={`translate(${seedPos.x} ${landed ? SEED.y - bounce : seedPos.y}) rotate(${landed ? 260 : seedPos.rot})`}>
            <path d="M0,-16 C10,-12 12,6 0,16 C-12,6 -10,-12 0,-16 Z" fill="#7A4E26" />
            <path d="M0,-12 C4,-6 4,6 0,12" stroke="#C99A62" strokeWidth={1.6} fill="none" />
          </g>
        </g>
      </svg>
      <OldPhoto strength={0.5} seed="s5" leak={false} />
    </AbsoluteFill>
  );
};
