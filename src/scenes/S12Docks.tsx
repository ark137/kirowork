import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans} from '../theme';
import {GoldDust} from '../components/GoldDust';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 12 镜（6 秒 / 180 帧）：1998，码头（夜，保持中等亮度的灰蓝）
 * 集装箱与吊机剪影、港灯暖光；搬运工扛箱走过（前景，视差）
 * 他蹲在一摞木箱前，手电光一箱一箱扫过箱体上的标签
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 860;
const CRATES = [
  {x: 1060, y: GROUND - 90, w: 170, h: 90, label: 'BRASIL'},
  {x: 1240, y: GROUND - 90, w: 170, h: 90, label: 'MADEIRA'},
  {x: 1150, y: GROUND - 180, w: 170, h: 90, label: 'PARÁ'},
  {x: 1420, y: GROUND - 90, w: 170, h: 90, label: 'IPÊ'},
  {x: 1330, y: GROUND - 180, w: 170, h: 90, label: 'EXPORT'},
  {x: 1240, y: GROUND - 270, w: 170, h: 90, label: 'BRASIL'},
];

export const S12Docks: React.FC = () => {
  const f = useCurrentFrame();
  const pan = interpolate(f, [0, 180], [0, -90], {...cl, easing: Easing.inOut(Easing.sin)});
  // 手电光：依次照向每个木箱
  const target = interpolate(f, [20, 160], [0, CRATES.length - 1], {...cl, easing: Easing.inOut(Easing.sin)});
  const ti = Math.round(target);
  const lerpI = (k: 'x' | 'y') => {
    const a = Math.floor(target);
    const b = Math.min(CRATES.length - 1, a + 1);
    const t = target - a;
    const ca = CRATES[a];
    const cb = CRATES[b];
    return k === 'x' ? ca.x + ca.w / 2 + (cb.x - ca.x) * t : ca.y + ca.h / 2 + (cb.y - ca.y) * t;
  };
  const beamX = lerpI('x');
  const beamY = lerpI('y');
  const hand = {x: 900, y: GROUND - 120};
  const lightOn = interpolate(f, [10, 20], [0, 1], cl);
  const workers = useMemo(() => [0, 1, 2].map((i) => ({speed: 3.2 + i * 0.7, off: i * 640, scale: 1.25 + i * 0.12})), []);

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s12-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4C5D7A" />
            <stop offset="70%" stopColor="#6E7F98" />
            <stop offset="100%" stopColor="#8F98A6" />
          </linearGradient>
          <radialGradient id="s12-lamp">
            <stop offset="0%" stopColor="#FFE2A8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFE2A8" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="s12-spot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4D0" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#FFE6A0" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#FFE6A0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s12-beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFF4D0" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#FFF4D0" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#s12-sky)" />
        <circle cx={1620} cy={180} r={46} fill="#F4EEDC" opacity={0.85} />
        <circle cx={1620} cy={180} r={140} fill="#F4EEDC" opacity={0.12} />

        <g transform={`translate(${pan * 0.4} 0)`}>
          {/* 吊机 */}
          {[260, 760, 1500].map((x, i) => (
            <g key={x} fill="#39465C" opacity={0.85}>
              <rect x={x} y={180 + i * 20} width={22} height={GROUND - 180} />
              <rect x={x + 120} y={180 + i * 20} width={22} height={GROUND - 180} />
              <rect x={x - 200} y={160 + i * 20} width={520} height={26} />
              <path d={`M${x},${GROUND} L${x + 142},${300} M${x + 142},${GROUND} L${x},${300}`} stroke="#39465C" strokeWidth={6} />
              <line x1={x - 120} y1={186 + i * 20} x2={x - 120} y2={340 + i * 30} stroke="#39465C" strokeWidth={3} />
              <circle cx={x + 300} cy={150 + i * 20} r={6} fill="#FF7A5A" opacity={0.5 + 0.5 * Math.sin(f * 0.2 + i)} />
            </g>
          ))}
        </g>
        <g transform={`translate(${pan * 0.7} 0)`}>
          {/* 集装箱墙 */}
          {new Array(4).fill(0).map((_, r) =>
            new Array(10).fill(0).map((__, c) => {
              const cols = ['#8A5A48', '#5E7488', '#9A8250', '#6A7C62', '#7E6A8A'];
              const col = cols[Math.floor(random(`ct${r}${c}`) * cols.length)];
              return (
                <g key={`${r}-${c}`}>
                  <rect x={-100 + c * 230} y={GROUND - 130 - r * 110} width={224} height={104} fill={col} opacity={0.75} />
                  <g stroke="#2A3242" strokeOpacity={0.25} strokeWidth={2}>
                    {new Array(10).fill(0).map((___, k) => (
                      <line key={k} x1={-90 + c * 230 + k * 22} y1={GROUND - 128 - r * 110} x2={-90 + c * 230 + k * 22} y2={GROUND - 28 - r * 110} />
                    ))}
                  </g>
                </g>
              );
            }),
          )}
          {/* 港灯 */}
          {[200, 980, 1760].map((x) => (
            <g key={x}>
              <rect x={x - 4} y={260} width={8} height={GROUND - 260} fill="#2E3848" />
              <circle cx={x} cy={256} r={160} fill="url(#s12-lamp)" />
              <circle cx={x} cy={256} r={10} fill="#FFF2D0" />
              <path d={`M${x - 12},${262} L${x - 160},${GROUND} L${x + 160},${GROUND} L${x + 12},${262} Z`} fill="#FFE6B0" opacity={0.08} />
            </g>
          ))}
        </g>
        {/* 地面 */}
        <rect x={0} y={GROUND} width={W} height={H - GROUND} fill="#5E6676" />
        <rect x={0} y={GROUND} width={W} height={6} fill="#8F98A6" opacity={0.5} />

        {/* 木箱堆 */}
        {CRATES.map((c, i) => {
          const lit = Math.max(0, 1 - Math.abs(target - i) * 1.2) * lightOn;
          return (
            <g key={i}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#8E6440" stroke="#4A3220" strokeWidth={3} />
              <g stroke="#4A3220" strokeWidth={2} opacity={0.6}>
                <line x1={c.x} y1={c.y + c.h / 2} x2={c.x + c.w} y2={c.y + c.h / 2} />
                <line x1={c.x + 10} y1={c.y + 6} x2={c.x + c.w - 10} y2={c.y + c.h - 6} />
              </g>
              {/* 标签 / 封箱胶带 */}
              <rect x={c.x + 26} y={c.y + 24} width={c.w - 52} height={40} fill="#E9DFC6" opacity={0.55 + lit * 0.45} />
              <text x={c.x + c.w / 2} y={c.y + 52} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={20} fill="#3A2A1A" letterSpacing={3} opacity={0.45 + lit * 0.55}>
                {c.label}
              </text>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#FFF0C8" opacity={lit * 0.28} />
            </g>
          );
        })}

        {/* 他：蹲在箱前，手持手电 */}
        <g>
          <ellipse cx={860} cy={GROUND + 6} rx={70} ry={10} fill="#000" opacity={0.25} />
          <g fill="#2A2F3A">
            {/* 蹲姿 */}
            <path d="M800,860 L820,790 L870,790 L900,860 L880,860 L860,812 L840,860 Z" />
            <path d="M812,800 C800,740 820,690 860,680 C900,690 912,740 900,800 Z" />
            <circle cx={858} cy={656} r={24} />
            <path d="M836,650 C834,628 880,626 882,650 L884,676 C876,672 840,672 832,676 Z" />
            {/* 伸出的手臂 */}
            <path d={`M880,710 L${hand.x},${hand.y - 4} L${hand.x + 4},${hand.y + 12} L874,736 Z`} />
          </g>
          {/* 手电 */}
          <g transform={`translate(${hand.x} ${hand.y}) rotate(${(Math.atan2(beamY - hand.y, beamX - hand.x) * 180) / Math.PI})`}>
            <rect x={-6} y={-8} width={34} height={16} rx={4} fill="#3A3A3A" />
            <rect x={26} y={-10} width={10} height={20} fill="#9A9A9A" />
          </g>
        </g>
        {/* 光束 + 光斑 */}
        <g opacity={lightOn} style={{mixBlendMode: 'screen'}}>
          <polygon points={beamPoly(hand.x + 34, hand.y, beamX, beamY)} fill="url(#s12-beam)" opacity={0.55} />
          <ellipse cx={beamX} cy={beamY} rx={130} ry={90} fill="url(#s12-spot)" />
        </g>

        {/* 前景搬运工（虚化、视差） */}
        {workers.map((w, i) => {
          const x = ((f * w.speed + w.off) % (W + 600)) - 300;
          const bob = Math.abs(Math.sin(f * 0.3 + i)) * 6;
          return (
            <g key={i} transform={`translate(${x} ${H + 30 - bob}) scale(${w.scale})`} opacity={0.9} style={{filter: 'blur(3px)'}}>
              <g fill="#1F2430">
                <rect x={-22} y={-150} width={18} height={150} rx={6} transform={`rotate(${Math.sin(f * 0.3 + i) * 12} -13 -150)`} />
                <rect x={4} y={-150} width={18} height={150} rx={6} transform={`rotate(${-Math.sin(f * 0.3 + i) * 12} 13 -150)`} />
                <path d="M-36,-300 L36,-300 L30,-140 L-30,-140 Z" />
                <circle cx={0} cy={-326} r={24} />
              </g>
              <rect x={-60} y={-410} width={120} height={80} fill="#6E4C30" stroke="#3A2618" strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      <GoldDust count={20} seed="s12d" opacity={0.35} color="#FFE6B0" />
      <OldPhoto strength={0.5} seed="s12" leak={false} />
      {/* 字幕托底：底部渐暗，保证浅色字幕可读 */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,36,50,0) 70%, rgba(30,36,50,0.45) 100%)'}} />
      {void ti}
    </AbsoluteFill>
  );
};

const beamPoly = (x0: number, y0: number, x1: number, y1: number) => {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const n0 = 8;
  const n1 = 90;
  const px = -Math.sin(a);
  const py = Math.cos(a);
  return [
    [x0 + px * n0, y0 + py * n0],
    [x1 + px * n1, y1 + py * n1],
    [x1 - px * n1, y1 - py * n1],
    [x0 - px * n0, y0 - py * n0],
  ]
    .map((p) => p.join(','))
    .join(' ');
};

export const _c = C;
