import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {Person} from '../components/Person';
import {lerp} from '../lib/geom';

/**
 * s22（7 秒 / 210 帧）：2017，卢奕开回国
 * 明亮的机场到达厅：玻璃幕墙外一架飞机缓缓降落；他拉着贴满美国标签的行李箱，从纵深处朝镜头走来。
 * 他走过的地方，身后两侧一株株冒出小树苗；最后他停下，身后的一棵树苗长成小树。
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const VP = {x: 960, y: 470};
const FLOOR_Y = 520;
const WALK_END = 150;

const footAt = (t: number) => {
  // t: 0..1 行进进度 → 脚的位置与缩放
  const e = Easing.out(Easing.quad)(t);
  return {x: lerp(1010, 880, e), y: lerp(560, 860, e), s: lerp(0.18, 0.72, e)};
};

export const S22Return: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, WALK_END], [0, 1], cl);
  const p = footAt(t);
  const walking = f < WALK_END;
  const phase = walking ? f * 0.36 : 0;
  const bob = walking ? Math.abs(Math.sin(phase)) * 6 * p.s : 0;
  const plane = interpolate(f, [0, 210], [0, 1], cl);
  const tree = interpolate(f, [140, 200], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});

  // 树苗：沿行进路线、在他身后两侧依次冒出
  const sprouts = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => {
        const tt = 0.06 + i * 0.065;
        return {tt, side: i % 2 === 0 ? -1 : 1, seed: i, born: tt * WALK_END + 10};
      }),
    [],
  );

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 30]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s22-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7EEF1" />
            <stop offset="100%" stopColor="#F8F0DE" />
          </linearGradient>
          <linearGradient id="s22-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EADFC8" />
            <stop offset="100%" stopColor="#D8C8A8" />
          </linearGradient>
          <radialGradient id="s22-glow">
            <stop offset="0%" stopColor="#FFF4D4" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFF4D4" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* 玻璃幕墙 */}
        <rect x={0} y={90} width={W} height={FLOOR_Y - 90} fill="url(#s22-sky)" />
        <g stroke="#C9C1AE" strokeWidth={6}>
          {new Array(9).fill(0).map((_, i) => (
            <line key={i} x1={i * 240} y1={90} x2={i * 240} y2={FLOOR_Y} />
          ))}
          <line x1={0} y1={300} x2={W} y2={300} strokeWidth={4} />
        </g>
        {/* 跑道远景与降落的飞机 */}
        <rect x={0} y={FLOOR_Y - 34} width={W} height={34} fill="#D9D4C4" opacity={0.6} />
        <g transform={`translate(${lerp(300, 1500, plane)} ${lerp(200, 420, plane)}) rotate(${lerp(8, 2, plane)}) scale(0.9)`} fill="#A9B4BE" opacity={0.85}>
          <path d="M-150,0 C-150,-12 -130,-18 -100,-18 L120,-18 C150,-18 170,-8 176,0 C170,8 150,10 120,10 L-100,10 C-130,10 -150,8 -150,0 Z" />
          <path d="M-10,-6 L-70,-70 L-44,-70 L50,-6 Z" />
          <path d="M-10,4 L-60,48 L-38,48 L40,4 Z" opacity={0.8} />
          <path d="M-130,-14 L-162,-60 L-140,-60 L-100,-16 Z" />
        </g>
        {/* 天花与到达指示牌 */}
        <rect x={0} y={0} width={W} height={90} fill="#EFE6D3" />
        <g transform="translate(960 46)">
          <rect x={-230} y={-30} width={460} height={60} rx={6} fill="#FBF6EC" stroke={C.gold} strokeWidth={2.4} />
          <text x={-150} y={11} fontFamily={serif} fontWeight={600} fontSize={30} fill={C.ink} letterSpacing={6}>到达</text>
          <text x={-40} y={10} fontFamily={sans} fontWeight={600} fontSize={22} fill={C.goldDeep} letterSpacing={6}>ARRIVALS</text>
          <path d="M140,0 L180,0 M166,-12 L180,0 L166,12" stroke={C.goldDeep} strokeWidth={3} fill="none" />
        </g>

        {/* 地面（透视线） */}
        <rect x={0} y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill="url(#s22-floor)" />
        <g stroke="#C9B691" strokeWidth={1.6} opacity={0.6}>
          {new Array(17).fill(0).map((_, i) => {
            const x = -800 + i * 220;
            return <line key={i} x1={VP.x + (x - VP.x) * 0.06} y1={FLOOR_Y} x2={x} y2={H} />;
          })}
          {[0.08, 0.2, 0.38, 0.62, 0.95].map((k) => (
            <line key={k} x1={0} y1={FLOOR_Y + (H - FLOOR_Y) * k} x2={W} y2={FLOOR_Y + (H - FLOOR_Y) * k} />
          ))}
        </g>
        {/* 门洞的暖光 */}
        <ellipse cx={1010} cy={FLOOR_Y + 20} rx={260} ry={60} fill="url(#s22-glow)" />

        {/* 树苗（在人身后，按远近先画） */}
        {sprouts.map((sp) => {
          const g = interpolate(f, [sp.born, sp.born + 30], [0, 1], {...cl, easing: Easing.out(Easing.back(1.6))});
          if (g <= 0) return null;
          const q = footAt(sp.tt);
          const x = q.x + sp.side * 150 * q.s * 1.6;
          return <Sapling key={sp.seed} x={x} y={q.y} s={q.s * 1.2 * g} seed={sp.seed} />;
        })}
        {/* 身后长成的小树 */}
        {tree > 0 ? <SmallTree x={1160} y={760} s={tree} /> : null}

        {/* 他 + 行李箱 */}
        <g transform={`translate(${p.x} ${p.y - bob}) scale(${p.s})`}>
          <ellipse cx={30} cy={4} rx={150} ry={16} fill="#6B5A44" opacity={0.18} />
          <Suitcase />
          <Person who="ben" arms="handle" walk={phase} id="s22-ben" />
        </g>
      </svg>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 80%, rgba(243,234,218,0.5) 92%, rgba(243,234,218,0.7) 100%)'}} />
      <GoldDust count={24} seed="s22d" opacity={0.5} />
    </AbsoluteFill>
  );
};

/** 行李箱（人物局部坐标：右手握拉杆于 (103,-274)） */
const Suitcase: React.FC = () => (
  <g>
    <path d="M100,-276 L100,-214 M124,-276 L124,-214 M96,-280 L128,-280" stroke="#6E6A64" strokeWidth={6} strokeLinecap="round" />
    <rect x={70} y={-216} width={90} height={204} rx={12} fill="#B3473A" />
    <g stroke="#93382D" strokeWidth={3}>
      {[92, 114, 136].map((x) => (
        <line key={x} x1={x} y1={-206} x2={x} y2={-22} />
      ))}
    </g>
    {/* 标签 */}
    <g>
      <circle cx={100} cy={-170} r={20} fill="#FBF6EC" stroke="#22304E" strokeWidth={3} />
      <text x={100} y={-165} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={11} fill="#22304E">U.S.A.</text>
      <rect x={82} y={-128} width={70} height={24} rx={3} fill="#E8A41C" transform="rotate(-8 117 -116)" />
      <text x={117} y={-111} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={9.5} fill="#2A241E" transform="rotate(-8 117 -116)">CALIFORNIA</text>
      <rect x={96} y={-86} width={52} height={30} rx={3} fill="#FBF6EC" stroke="#B9790F" strokeWidth={2} transform="rotate(6 122 -71)" />
      <text x={122} y={-67} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={11} fill="#B9790F" transform="rotate(6 122 -71)">10 YRS</text>
    </g>
    <circle cx={84} cy={-6} r={8} fill="#2A241E" />
    <circle cx={146} cy={-6} r={8} fill="#2A241E" />
  </g>
);

const Sapling: React.FC<{x: number; y: number; s: number; seed: number}> = ({x, y, s, seed}) => {
  const lean = (random(`sp${seed}`) - 0.5) * 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={30} ry={6} fill="#8C7A5C" opacity={0.25} />
      <path d={`M0,0 Q${lean},-40 ${lean * 1.4},-80`} stroke="#6B7D4C" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M${lean * 0.8},-50 C-30,-70 -40,-50 -46,-40 C-30,-34 -10,-40 ${lean * 0.8},-50 Z`} fill="#86A86A" />
      <path d={`M${lean * 1.1},-64 C30,-90 44,-72 50,-62 C34,-54 14,-56 ${lean * 1.1},-64 Z`} fill="#6F9A5A" />
      <path d={`M${lean * 1.4},-80 C${lean * 1.4 - 14},-110 ${lean * 1.4 + 14},-110 ${lean * 1.4},-80 Z`} fill={C.gold} opacity={0.85} />
    </g>
  );
};

const SmallTree: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${0.4 + s * 0.6})`} opacity={Math.min(1, s * 2)}>
    <ellipse cx={0} cy={4} rx={90} ry={14} fill="#8C7A5C" opacity={0.22} />
    <path d="M-10,0 C-8,-80 -14,-150 -4,-230 L6,-230 C14,-150 10,-80 12,0 Z" fill="#7A6248" />
    <path d="M0,-150 C-30,-170 -50,-190 -60,-210 M2,-180 C30,-200 46,-220 52,-240" stroke="#7A6248" strokeWidth={8} fill="none" strokeLinecap="round" />
    {[
      [-60, -250, 70],
      [10, -300, 84],
      [70, -240, 66],
      [-20, -210, 60],
      [40, -200, 54],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r * s} fill={['#86A86A', '#6F9A5A', '#9AB57C', '#7BA063', '#E8C36A'][i]} opacity={0.92} />
    ))}
  </g>
);
