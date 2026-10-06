import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {Torso} from '../components/Person';

/**
 * s24（9 秒 / 270 帧）：2022–2025，两股枝干合成一棵树
 *   0– 80  承接上一镜：两股枝干自下而上相互缠绕，长成一根树干
 *  60–200  三根枝条依次伸出，挂上金色里程碑：2022 出任总裁 / 2023 “树木的秘密”展厅 / 2025 上海旗舰店焕新
 * 140–230  树冠一簇簇长满（金 + 绿）
 * 170–240  父子并肩、抱臂站在树前（与合影同一姿态）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BASE = {x: 960, y: 900};
const TOP_Y = 300;

const MILESTONES = [
  {at: 70, year: '2022', zh: '卢奕开出任总裁', en: 'PRESIDENT', tip: {x: 620, y: 470}, card: {x: 420, y: 430}},
  {at: 115, year: '2023', zh: '“树木的秘密”展厅', en: 'THE SECRET OF TREES · GALLERY', tip: {x: 1300, y: 410}, card: {x: 1510, y: 370}},
  {at: 160, year: '2025', zh: '上海旗舰店焕新', en: 'SHANGHAI FLAGSHIP', tip: {x: 960, y: 230}, card: {x: 960, y: 128}},
];

export const S24Legacy: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const trunk = interpolate(f, [0, 80], [0, 1], {...cl, easing: io});
  const crown = interpolate(f, [140, 230], [0, 1], cl);
  const people = interpolate(f, [176, 220], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const crowns = useMemo(() => buildCrown(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 26]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="s24-halo">
            <stop offset="0%" stopColor="#FFF0C6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#FFF0C6" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s24-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3EADA" stopOpacity={0} />
            <stop offset="38%" stopColor="#F3EADA" stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle cx={960} cy={360} r={520} fill="url(#s24-halo)" opacity={0.6 + crown * 0.4} />

        {/* 地平弧（呼应 Logo） */}
        <path d={`M300,${BASE.y + 10} Q960,${BASE.y - 40} 1620,${BASE.y + 10}`} stroke={C.gold} strokeWidth={4} fill="none" opacity={trunk} />

        {/* 两股缠绕的树干 */}
        <g fill="none" strokeLinecap="round">
          {[0, 1].map((k) => {
            let d = '';
            for (let u = 0; u <= 1.0001; u += 0.02) {
              const w = 30 * (1 - u * 0.6);
              const x = BASE.x + Math.sin(u * Math.PI * 5 + k * Math.PI) * w;
              const y = BASE.y - u * (BASE.y - TOP_Y);
              d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
            }
            return <path key={k} d={d} stroke={k === 0 ? '#7A6248' : '#5E4A36'} strokeWidth={26 - k * 4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - trunk} />;
          })}
        </g>

        {/* 枝条 */}
        {MILESTONES.map((m, i) => {
          const g = interpolate(f, [m.at - 20, m.at + 10], [0, 1], {...cl, easing: io});
          const sy = i === 2 ? TOP_Y + 20 : 620 - i * 60;
          const d = i === 2 ? `M960,${sy} C962,${sy - 30} 958,${m.tip.y + 30} ${m.tip.x},${m.tip.y}` : `M960,${sy} C${(960 + m.tip.x) / 2},${sy - 10} ${m.tip.x + (960 - m.tip.x) * 0.2},${m.tip.y + 40} ${m.tip.x},${m.tip.y}`;
          return <path key={i} d={d} stroke="#6E5842" strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} />;
        })}

        {/* 树冠 */}
        {crowns.map((c, i) => {
          const on = interpolate(crown, [c.d, c.d + 0.25], [0, 1], {...cl, easing: Easing.out(Easing.back(1.4))});
          if (on <= 0) return null;
          return <circle key={i} cx={c.x} cy={c.y} r={c.r * on} fill={c.fill} opacity={0.82} />;
        })}

        {/* 里程碑节点 */}
        {MILESTONES.map((m, i) => {
          const on = interpolate(f, [m.at + 6, m.at + 20], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
          return (
            <g key={i} opacity={on}>
              <line x1={m.tip.x} y1={m.tip.y} x2={m.card.x} y2={m.card.y + 46} stroke={C.goldDeep} strokeWidth={1.6} strokeDasharray="4 5" />
              <circle cx={m.tip.x} cy={m.tip.y} r={12 * on} fill={C.gold} stroke="#FFF6DE" strokeWidth={3} />
            </g>
          );
        })}

        {/* 父子 */}
        <g opacity={people} transform={`translate(0 ${(1 - people) * 60})`}>
          <g transform="translate(815 1110) scale(0.92)">
            <Torso who="carl" arms="crossed" id="s24-c" />
          </g>
          <g transform="translate(1105 1118) scale(0.92)">
            <Torso who="ben" arms="crossed" id="s24-b" />
          </g>
        </g>
        <rect x={0} y={790} width={W} height={H - 790} fill="url(#s24-fade)" />
      </svg>

      {/* 里程碑卡片 */}
      {MILESTONES.map((m, i) => {
        const on = interpolate(f, [m.at + 10, m.at + 28], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
        return (
          <div key={i} style={{position: 'absolute', left: m.card.x - 210, width: 420, top: m.card.y - 44, display: 'flex', justifyContent: 'center', opacity: on, transform: `translateY(${(1 - on) * 10}px)`}}>
            <div style={{padding: '10px 24px 12px', background: 'rgba(251,246,236,0.94)', border: `1.5px solid ${C.gold}`, borderRadius: 8, textAlign: 'center', boxShadow: '0 8px 22px rgba(120,90,40,0.14)'}}>
              <div style={{fontFamily: serif, fontWeight: 700, fontSize: 30, lineHeight: 1.1, color: C.goldDeep, letterSpacing: '0.06em'}}>{m.year}</div>
              <div style={{fontFamily: serif, fontWeight: 600, fontSize: 28, lineHeight: 1.3, color: C.ink, letterSpacing: '0.06em', whiteSpace: 'nowrap'}}>{m.zh}</div>
              <div style={{fontFamily: sans, fontSize: 11, letterSpacing: '0.3em', color: C.inkMute, marginTop: 3, whiteSpace: 'nowrap'}}>{m.en}</div>
            </div>
          </div>
        );
      })}
      <GoldDust count={34} seed="s24d" opacity={0.4 + crown * 0.5} />
    </AbsoluteFill>
  );
};

const buildCrown = () => {
  const out: {x: number; y: number; r: number; fill: string; d: number}[] = [];
  const fills = ['#E8A41C', '#F2C45A', '#9AB57C', '#7BA063', '#E8C36A', '#86A86A'];
  for (let i = 0; i < 70; i++) {
    const a = random(`ca${i}`) * Math.PI * 2;
    const rr = Math.sqrt(random(`cr${i}`));
    const x = 960 + Math.cos(a) * rr * 520;
    const y = 360 + Math.sin(a) * rr * 210;
    // 避开里程碑卡片
    const nearCard = MILESTONES.some((m) => Math.abs(x - m.card.x) < 200 && Math.abs(y - m.card.y) < 70);
    if (nearCard) continue;
    out.push({x, y, r: 36 + random(`cs${i}`) * 40, fill: fills[i % fills.length], d: rr * 0.6});
  }
  return out;
};
