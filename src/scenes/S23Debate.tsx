import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {ProfileSilhouette} from '../components/Person';
import {lerp} from '../lib/geom';

/**
 * s23（8 秒 / 240 帧）：父子在会议上争论 → 两条枝干缠成一股
 *   0–120  长桌两端两个剪影（左：父，及肩长发 / 右：子，短发）；对话气泡左右交替、越冒越大，泡里是急促的折线
 * 110–240  最后两只气泡拉长成两条枝干，向桌子中央生长、相互缠绕，汇成一股向上长出新叶
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TABLE_Y = 720;
const LEFT = {x: 360, y: TABLE_Y - 20};
const RIGHT = {x: 1560, y: TABLE_Y - 20};
const MOUTH_L = {x: LEFT.x + 70, y: LEFT.y - 250};
const MOUTH_R = {x: RIGHT.x - 70, y: RIGHT.y - 250};
const MEET = {x: 960, y: 420};

const BUBBLES = [
  {side: -1, at: 6, s: 0.8},
  {side: 1, at: 24, s: 0.9},
  {side: -1, at: 42, s: 1.0},
  {side: 1, at: 58, s: 1.1},
  {side: -1, at: 74, s: 1.2},
  {side: 1, at: 90, s: 1.3},
];

export const S23Debate: React.FC = () => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [112, 190], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const rise = interpolate(f, [176, 236], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const calm = interpolate(f, [100, 150], [0, 1], cl);
  const branches = useMemo(() => buildBranches(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 30]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s23-win" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EEF0EA" />
            <stop offset="100%" stopColor="#F7EEDC" />
          </linearGradient>
        </defs>
        {/* 会议室：大窗与城市远景 */}
        <rect x={180} y={110} width={1560} height={470} fill="url(#s23-win)" stroke="#D2C4A6" strokeWidth={6} />
        <g fill="#D8CDB6" opacity={0.6}>
          {new Array(18).fill(0).map((_, i) => (
            <rect key={i} x={200 + i * 86} y={580 - 90 - ((i * 53) % 140)} width={64} height={90 + ((i * 53) % 140)} />
          ))}
        </g>
        <g stroke="#D2C4A6" strokeWidth={4}>
          {[570, 960, 1350].map((x) => (
            <line key={x} x1={x} y1={110} x2={x} y2={580} />
          ))}
        </g>
        {/* 墙裙（木） */}
        <rect x={0} y={580} width={W} height={H - 580} fill="#E6D6B6" />
        <g stroke="#CDB892" strokeWidth={2} opacity={0.7}>
          {new Array(24).fill(0).map((_, i) => (
            <line key={i} x1={i * 84} y1={600} x2={i * 84} y2={H} />
          ))}
        </g>

        {/* 剪影 */}
        <g transform={`translate(${LEFT.x} ${LEFT.y})`}>
          <ProfileSilhouette who="carl" color="#4A423B" />
        </g>
        <g transform={`translate(${RIGHT.x} ${RIGHT.y}) scale(-1 1)`}>
          <ProfileSilhouette who="ben" color="#4A423B" />
        </g>

        {/* 长桌 */}
        <rect x={300} y={TABLE_Y} width={1320} height={24} rx={4} fill="#8A6440" />
        <rect x={300} y={TABLE_Y + 24} width={1320} height={10} fill="#6E4E31" />
        <rect x={360} y={TABLE_Y + 34} width={22} height={200} fill="#6E4E31" />
        <rect x={1538} y={TABLE_Y + 34} width={22} height={200} fill="#6E4E31" />
        {/* 桌上文件 */}
        <g opacity={0.9}>
          <rect x={560} y={TABLE_Y - 8} width={120} height={8} fill="#FBF6EC" />
          <rect x={1250} y={TABLE_Y - 8} width={120} height={8} fill="#FBF6EC" />
          <rect x={930} y={TABLE_Y - 40} width={60} height={40} rx={6} fill="#C9B48E" />
        </g>

        {/* 气泡 */}
        {BUBBLES.map((b, i) => {
          const t = interpolate(f, [b.at, b.at + 36], [0, 1], cl);
          if (t <= 0 || t >= 1) return null;
          const pop = Easing.out(Easing.back(2))(Math.min(1, t * 3));
          const fade = 1 - Math.max(0, (t - 0.6) / 0.4);
          const m = b.side < 0 ? MOUTH_L : MOUTH_R;
          const bx = m.x + b.side * -1 * (90 + t * 60);
          const by = m.y - 60 - t * 50;
          return (
            <g key={i} transform={`translate(${bx} ${by}) scale(${pop * b.s})`} opacity={fade}>
              <path d={`M-90,-50 Q-90,-80 -60,-80 L60,-80 Q90,-80 90,-50 L90,10 Q90,40 60,40 L${b.side < 0 ? -30 : 50},40 L${b.side < 0 ? -70 : 80},70 L${b.side < 0 ? -50 : 30},40 L-60,40 Q-90,40 -90,10 Z`} fill="#FBF6EC" stroke={C.inkSoft} strokeWidth={3} />
              <path d="M-60,-20 L-36,-46 L-14,-8 L8,-46 L30,-12 L56,-40" fill="none" stroke={i >= 4 ? C.red : C.inkSoft} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
              <text x={70} y={-48} fontSize={28} fontWeight={900} fill={C.red} opacity={i >= 2 ? 1 : 0}>!</text>
            </g>
          );
        })}

        {/* 两条枝干 */}
        <g fill="none" strokeLinecap="round">
          {branches.map((b, i) => (
            <path key={i} d={b} stroke={i === 0 ? '#7A6248' : '#5E4A36'} strokeWidth={10 - i * 1.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - grow} />
          ))}
          {/* 汇合后向上的一股 */}
          {[0, 1].map((k) => {
            let d = `M${MEET.x},${MEET.y}`;
            for (let u = 0; u <= 1.0001; u += 0.05) {
              d += ` L${(MEET.x + Math.sin(u * Math.PI * 4 + k * Math.PI) * 18 * (1 - u * 0.5)).toFixed(1)},${(MEET.y - u * 230).toFixed(1)}`;
            }
            return <path key={k} d={d} stroke={k === 0 ? '#7A6248' : '#5E4A36'} strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - rise} />;
          })}
        </g>
        {/* 新叶 */}
        {[
          [0.2, -1],
          [0.35, 1],
          [0.52, -1],
          [0.68, 1],
          [0.84, -1],
          [1.0, 1],
        ].map(([u, s], i) => {
          const on = interpolate(rise, [u - 0.05, u + 0.15], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
          if (on <= 0) return null;
          const y = MEET.y - u * 230;
          return (
            <path
              key={i}
              transform={`translate(${MEET.x} ${y}) rotate(${s * -40}) scale(${on * s} ${on})`}
              d="M0,0 C20,-26 50,-26 64,-10 C50,8 22,10 0,0 Z"
              fill={i % 2 ? '#86A86A' : C.gold}
            />
          );
        })}
        {/* 汇合点的金光 */}
        <circle cx={MEET.x} cy={MEET.y} r={60} fill="#FFE7A0" opacity={interpolate(f, [180, 196, 236], [0, 0.55, 0.3], cl)} style={{mixBlendMode: 'screen'}} />
      </svg>
      <AbsoluteFill style={{background: `rgba(251,246,236,${0.08 * calm})`}} />
      <GoldDust count={22} seed="s23d" opacity={calm * 0.6} />
    </AbsoluteFill>
  );
};

/** 从两侧嘴边出发、在中央相互缠绕的两条枝干 */
const buildBranches = () => {
  const make = (from: {x: number; y: number}, sign: number) => {
    let d = `M${from.x},${from.y}`;
    for (let u = 0; u <= 1.0001; u += 0.025) {
      const x = lerp(from.x, MEET.x, u);
      const arc = Math.sin(u * Math.PI) * -70;
      const twist = Math.sin(u * Math.PI * 5) * 26 * Math.pow(u, 1.6) * sign;
      const y = lerp(from.y, MEET.y, u) + arc + twist;
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  };
  return [make(MOUTH_L, 1), make(MOUTH_R, -1)];
};
