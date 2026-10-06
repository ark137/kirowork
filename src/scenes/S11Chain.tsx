import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 11 镜（6 秒 / 180 帧）：海外货源攥在中间商手里
 * 扁平信息图：巴西雨林 → 远洋货船 → 中国工厂；木箱沿虚线流动
 * 一只大手从上方落下，攥住链条中段：线条收紧变红，木箱在手前堆积，后段断流
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const Y = 560;
const NODES = [
  {x: 300, label: '巴西', sub: 'BRAZIL'},
  {x: 960, label: '中间商', sub: 'MIDDLEMEN'},
  {x: 1620, label: '安信', sub: 'ANXIN'},
];
const GRAB = 84;

export const S11Chain: React.FC = () => {
  const f = useCurrentFrame();
  const out = Easing.out(Easing.cubic);
  const draw = interpolate(f, [0, 36], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const nodeIn = (i: number) => interpolate(f, [6 + i * 10, 26 + i * 10], [0, 1], {...cl, easing: Easing.out(Easing.back(1.6))});
  const hand = interpolate(f, [GRAB - 26, GRAB], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const grip = interpolate(f, [GRAB, GRAB + 10], [0, 1], {...cl, easing: out});
  const squeeze = grip * (1 + 0.04 * Math.sin(f * 0.5));
  const red = interpolate(f, [GRAB, GRAB + 20], [0, 1], cl);
  const label = interpolate(f, [GRAB + 14, GRAB + 34], [0, 1], {...cl, easing: out});
  const dash = -f * 6;

  // 木箱：抓住之前匀速流动；之后前段在手前堆积，后段停止
  const crates = new Array(10).fill(0).map((_, i) => {
    const speed = 7;
    const spawn = i * 16;
    let x = NODES[0].x + (f - spawn) * speed;
    if (f > GRAB) {
      const xAtGrab = NODES[0].x + (GRAB - spawn) * speed;
      if (xAtGrab < NODES[1].x - 80) {
        // 还没过中点：堆在手前
        const queue = i;
        x = Math.min(NODES[0].x + (f - spawn) * speed, NODES[1].x - 110 - (queue % 4) * 54);
      } else {
        // 已过中点：继续前进但只剩少量
        x = xAtGrab + (f - GRAB) * speed * 0.6;
      }
    }
    return {i, x, alive: f >= spawn && x < NODES[2].x - 60};
  });

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="s11-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#6B4E2A" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* 世界地图暗纹 */}
        <g fill={C.paperDeep} opacity={0.6}>
          <path d="M160,330 Q260,300 340,360 Q380,460 330,560 Q300,660 260,760 Q220,640 210,540 Q150,450 160,330 Z" />
          <path d="M1480,300 Q1640,260 1780,320 Q1820,420 1740,480 Q1640,520 1560,470 Q1500,400 1480,300 Z" />
          <path d="M840,320 Q960,290 1060,340 Q1080,460 1000,560 Q940,620 900,540 Q860,430 840,320 Z" />
        </g>
        {/* 链条 */}
        <g>
          <path
            d={`M${NODES[0].x},${Y} L${NODES[1].x - 40 * squeeze},${Y} L${NODES[1].x + 40 * squeeze},${Y} L${NODES[2].x},${Y}`}
            fill="none"
            stroke={red > 0.5 ? C.seal : C.goldDeep}
            strokeOpacity={0.9}
            strokeWidth={6}
            strokeDasharray="22 14"
            strokeDashoffset={dash}
            pathLength={undefined}
            style={{clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`}}
          />
          {/* 后段断流变淡 */}
          <rect x={NODES[1].x + 60} y={Y - 10} width={NODES[2].x - NODES[1].x - 60} height={20} fill="#F3EADA" opacity={red * 0.6} />
        </g>
        {/* 木箱 */}
        {crates.map((c) =>
          c.alive ? (
            <g key={c.i} transform={`translate(${c.x} ${Y - 30})`}>
              <rect x={-24} y={-24} width={48} height={48} fill="#C8914F" stroke="#7A4A20" strokeWidth={3} />
              <path d="M-24,-24 L24,24 M24,-24 L-24,24" stroke="#7A4A20" strokeWidth={2.4} opacity={0.6} />
            </g>
          ) : null,
        )}
        {/* 节点 */}
        {NODES.map((n, i) => {
          const p = nodeIn(i);
          const isMid = i === 1;
          return (
            <g key={i} transform={`translate(${n.x} ${Y}) scale(${p})`} opacity={p}>
              <circle r={isMid ? 74 : 92} fill="#FBF6EC" stroke={isMid ? C.inkMute : C.goldDeep} strokeWidth={4} strokeDasharray={isMid ? '8 8' : undefined} />
              {i === 0 ? <ForestIcon /> : null}
              {i === 1 ? <ShipIcon /> : null}
              {i === 2 ? <FactoryIcon /> : null}
              <text y={isMid ? 118 : 136} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={36} fill={C.ink}>
                {n.label}
              </text>
              <text y={isMid ? 146 : 164} textAnchor="middle" fontFamily={sans} fontSize={15} letterSpacing={4} fill={C.inkMute}>
                {n.sub}
              </text>
            </g>
          );
        })}
        {/* 大手 */}
        <g transform={`translate(${NODES[1].x} ${interpolate(hand, [0, 1], [-520, Y - 40])})`} filter="url(#s11-shadow)">
          <Fist grip={grip} />
        </g>
        {/* 价格标签 */}
        <g opacity={label}>
          {[
            [NODES[1].x - 230, Y - 190, '¥ ↑'],
            [NODES[1].x + 210, Y - 220, '¥ ↑↑'],
            [NODES[1].x + 40, Y - 330, '¥ ↑↑↑'],
          ].map(([x, y, t], i) => (
            <g key={i} transform={`translate(${x} ${(y as number) - label * 16}) rotate(${-8 + i * 8})`}>
              <path d="M-50,-24 L40,-24 L62,0 L40,24 L-50,24 Z" fill={C.seal} />
              <circle cx={-34} cy={0} r={6} fill="#FBF6EC" />
              <text x={6} y={10} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={26} fill="#FBF6EC">
                {t}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <OldPhoto strength={0.45} seed="s11" leak={false} />
    </AbsoluteFill>
  );
};

const ForestIcon = () => (
  <g>
    {[-34, 0, 34].map((x, i) => (
      <g key={x}>
        <rect x={x - 5} y={10} width={10} height={36} fill="#6B4E2A" />
        <circle cx={x} cy={-4 - (i === 1 ? 14 : 0)} r={i === 1 ? 34 : 26} fill={C.leaf} />
      </g>
    ))}
  </g>
);
const ShipIcon = () => (
  <g>
    <path d="M-52,10 L52,10 L38,36 L-38,36 Z" fill={C.inkSoft} />
    <rect x={-36} y={-16} width={26} height={24} fill="#C8914F" />
    <rect x={-6} y={-16} width={26} height={24} fill="#B57A40" />
    <rect x={24} y={-30} width={16} height={38} fill="#E9DCC2" />
  </g>
);
const FactoryIcon = () => (
  <g>
    <path d="M-56,40 L-56,-6 L-26,-26 L-26,-6 L4,-26 L4,-6 L34,-26 L34,40 Z" fill={C.goldDeep} />
    <rect x={40} y={-52} width={16} height={92} fill={C.goldAntique} />
    <rect x={-40} y={10} width={18} height={18} fill="#FBF6EC" />
    <rect x={-6} y={10} width={18} height={18} fill="#FBF6EC" />
  </g>
);

/** 握拳的大手（从上方伸下，指节朝前） */
const Fist: React.FC<{grip: number}> = ({grip}) => (
  <g>
    <path d="M-110,-700 L110,-700 L96,-150 L-96,-150 Z" fill="#4A4642" />
    <rect x={-104} y={-170} width={208} height={36} rx={8} fill="#36322E" />
    <path d={`M-96,-140 C-120,-80 -${118 - grip * 10},20 -80,${60 - grip * 10} L80,${60 - grip * 10} C${118 - grip * 10},20 120,-80 96,-140 Z`} fill="#D9A984" />
    {[-60, -20, 20, 60].map((x, i) => (
      <g key={x}>
        <rect x={x - 20} y={-10 - grip * 14} width={40} height={80 - grip * 6} rx={20} fill="#E2B693" stroke="#B9886A" strokeWidth={3} />
        <path d={`M${x - 12},${20 - grip * 10} q12,8 24,0`} stroke="#B9886A" strokeWidth={2.4} fill="none" />
        {void i}
      </g>
    ))}
    <path d={`M-96,-60 C-140,-40 -136,${10 + grip * 10} -96,${20 + grip * 8} L-70,${0 + grip * 6} Z`} fill="#D49F7A" stroke="#B9886A" strokeWidth={3} />
  </g>
);
