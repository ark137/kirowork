import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {SeatedFigure, WalkFigure} from '../components/Folk';
import {lerp} from '../lib/geom';

/**
 * H5 · 木屋里的家（5 秒 / 150 帧，交叉淡化时延长到 164 帧）
 *   0– 60  江南雨夜：青瓦木屋，木格窗透出暖光，雨打屋檐，石板路上映着窗光
 *  44–100  镜头推进木格窗，穿窗而入
 *  80–150  屋里：一家人围桌吃饭，孩子赤脚跑过木地板
 * 126–164  灯光化开成宣纸般的暖白，交给第 4 镜（1966 温州老街）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);
const WIN = {x: 760, y: 380, w: 400, h: 250};

export const H5Home: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [44, 100], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const zoom = lerp(1, 5.2, push);
  const outside = interpolate(f, [84, 100], [1, 0], cl);
  const inside = interpolate(f, [82, 100], [0, 1], cl);
  const bloom = interpolate(f, [124, 156], [0, 1], {...cl, easing: Easing.inOut(Easing.sin)});
  const run = interpolate(f, [92, 146], [0, 1], cl);
  const lampFlick = 0.92 + 0.08 * Math.sin(f * 0.3) * Math.sin(f * 0.17);
  const geo = useMemo(() => build(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />

      {/* ═══ 屋外：雨夜 ═══ */}
      {outside > 0 ? (
        <AbsoluteFill style={{opacity: outside}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <defs>
              <InkDefs p="h5o" seed={151} />
              <radialGradient id="h5-winglow">
                <stop offset="0%" stopColor="#FFD98A" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#FFD98A" stopOpacity={0} />
              </radialGradient>
              <linearGradient id="h5-win" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE6A8" />
                <stop offset="100%" stopColor="#F2B65C" />
              </linearGradient>
            </defs>
            <g transform={`translate(${WIN.x + WIN.w / 2} ${WIN.y + WIN.h / 2}) scale(${zoom}) translate(${-WIN.x - WIN.w / 2} ${-WIN.y - WIN.h / 2})`}>
              {/* 远处的屋影 */}
              <g filter="url(#h5o-soft)" opacity={0.5}>
                {[-120, 1500, 1760].map((x, i) => (
                  <g key={i}>
                    <rect x={x} y={300} width={300} height={420} fill="#4E5868" />
                    <path d={`M${x - 30},310 L${x + 150},230 L${x + 330},310 Z`} fill="#3A4250" />
                    <rect x={x + 110} y={420} width={70} height={60} fill="#E9B866" opacity={0.6} />
                  </g>
                ))}
              </g>
              {/* 木屋正面 */}
              <g filter="url(#h5o-bleed)">
                <rect x={440} y={250} width={1040} height={470} fill="#6E5440" />
                {new Array(26).fill(0).map((_, i) => (
                  <line key={i} x1={460 + i * 40} y1={250} x2={460 + i * 40} y2={720} stroke="#5A4434" strokeWidth={3} />
                ))}
                <rect x={440} y={700} width={1040} height={24} fill="#4E3E30" />
                {/* 青瓦檐 */}
                <path d="M370,262 Q420,240 470,232 L1450,232 Q1500,240 1550,262 L1480,150 L440,150 Z" fill="#3E4652" />
                <g stroke="#5D6878" strokeWidth={3}>
                  {new Array(40).fill(0).map((_, i) => (
                    <line key={i} x1={455 + i * 26} y1={154} x2={420 + i * 27.5} y2={244} />
                  ))}
                </g>
                {/* 木门 */}
                <rect x={1220} y={430} width={160} height={290} fill="#5A4434" />
                <line x1={1300} y1={430} x2={1300} y2={720} stroke="#3E3026" strokeWidth={3} />
              </g>
              {/* 木格窗与窗里的人影 */}
              <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="url(#h5-win)" />
              <g fill="#7A4E2A" opacity={0.6}>
                <SeatedFigure x={870} y={WIN.y + WIN.h + 4} h={170} face={1} color="#7A4E2A" reach={0.5} />
                <SeatedFigure x={1060} y={WIN.y + WIN.h + 4} h={160} face={-1} color="#7A4E2A" reach={0.4} />
                <SeatedFigure x={968} y={WIN.y + WIN.h + 8} h={110} face={1} color="#7A4E2A" />
              </g>
              <g stroke="#4E3828" strokeWidth={7}>
                {[1, 2, 3, 4, 5, 6, 7].map((k) => (
                  <line key={k} x1={WIN.x + (k * WIN.w) / 8} y1={WIN.y} x2={WIN.x + (k * WIN.w) / 8} y2={WIN.y + WIN.h} />
                ))}
                {[1, 2, 3, 4].map((k) => (
                  <line key={`h${k}`} x1={WIN.x} y1={WIN.y + (k * WIN.h) / 5} x2={WIN.x + WIN.w} y2={WIN.y + (k * WIN.h) / 5} />
                ))}
              </g>
              <rect x={WIN.x - 10} y={WIN.y - 10} width={WIN.w + 20} height={WIN.h + 20} fill="none" stroke="#3E3026" strokeWidth={14} />
              <ellipse cx={WIN.x + WIN.w / 2} cy={WIN.y + WIN.h / 2} rx={420} ry={300} fill="url(#h5-winglow)" opacity={0.55 * lampFlick} style={{mixBlendMode: 'screen'}} />
              {/* 石板路与窗光倒影 */}
              <rect x={-200} y={724} width={W + 400} height={500} fill="#5E6878" />
              <g stroke="#7C8696" strokeWidth={2} opacity={0.6}>
                {new Array(8).fill(0).map((_, i) => (
                  <line key={i} x1={-200} y1={760 + i * 44} x2={W + 200} y2={760 + i * 44} />
                ))}
              </g>
              <ellipse cx={WIN.x + WIN.w / 2} cy={800} rx={WIN.w * 0.45} ry={60} fill="#F2C878" opacity={0.22} style={{filter: 'blur(18px)'}} />
            </g>
            {/* 雨 */}
            <g stroke="#DCE4EE" strokeWidth={1.6} strokeLinecap="round" opacity={0.5}>
              {geo.rain.map((r, i) => {
                const y = ((r.y + f * r.v) % (H + 200)) - 100;
                return <line key={i} x1={r.x - y * 0.12} y1={y} x2={r.x - y * 0.12 - 6} y2={y + r.l} />;
              })}
            </g>
          </svg>
          <AbsoluteFill style={{background: 'rgba(70,88,118,0.38)', mixBlendMode: 'multiply'}} />
        </AbsoluteFill>
      ) : null}

      {/* ═══ 屋里：木地板上的家 ═══ */}
      {inside > 0 ? (
        <AbsoluteFill style={{opacity: inside}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            <defs>
              <InkDefs p="h5i" seed={153} />
              <radialGradient id="h5-lamp">
                <stop offset="0%" stopColor="#FFF0C8" stopOpacity={1} />
                <stop offset="50%" stopColor="#FFD98A" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#FFD98A" stopOpacity={0} />
              </radialGradient>
              <linearGradient id="h5-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B88A58" />
                <stop offset="100%" stopColor="#D2A46C" />
              </linearGradient>
            </defs>
            <g transform={`translate(960 600) scale(${lerp(1.12, 1, interpolate(f, [84, 150], [0, 1], {...cl, easing: Easing.out(Easing.cubic)}))}) translate(-960 -600)`}>
              {/* 木板墙 */}
              <rect x={-100} y={-100} width={W + 200} height={720} fill="#C29A6A" />
              {new Array(30).fill(0).map((_, i) => (
                <line key={i} x1={-60 + i * 70} y1={-100} x2={-60 + i * 70} y2={620} stroke="#A07A50" strokeWidth={3} opacity={0.7} />
              ))}
              {/* 木格窗（从屋里看，外面是雨夜） */}
              <rect x={1280} y={160} width={360} height={260} fill="#6D7A90" />
              <g stroke="#7A5A3A" strokeWidth={8}>
                {[1, 2, 3, 4, 5].map((k) => (
                  <line key={k} x1={1280 + k * 60} y1={160} x2={1280 + k * 60} y2={420} />
                ))}
                {[1, 2, 3].map((k) => (
                  <line key={`h${k}`} x1={1280} y1={160 + k * 65} x2={1640} y2={160 + k * 65} />
                ))}
              </g>
              {/* 木地板：透视 */}
              <path d={`M-200,620 L${W + 200},620 L${W + 600},${H + 100} L-600,${H + 100} Z`} fill="url(#h5-floor)" />
              <g stroke="#9C7448" strokeWidth={2.4} opacity={0.75}>
                {new Array(23).fill(0).map((_, i) => {
                  const x = -200 + i * 105;
                  return <line key={i} x1={x} y1={620} x2={960 + (x - 960) * 1.9} y2={H + 100} />;
                })}
                {[660, 720, 800, 900, 1030].map((y) => (
                  <line key={y} x1={-600} y1={y} x2={W + 600} y2={y} opacity={0.35} />
                ))}
              </g>
              {/* 灯光洒在地板上 */}
              <ellipse cx={900} cy={760} rx={700} ry={180} fill="#FFE2A0" opacity={0.4 * lampFlick} style={{mixBlendMode: 'screen'}} />
              {/* 矮桌与碗 */}
              <g filter="url(#h5i-bleed)">
                <rect x={720} y={600} width={380} height={22} fill="#6E5238" />
                <rect x={744} y={622} width={18} height={70} fill="#5E4430" />
                <rect x={1058} y={622} width={18} height={70} fill="#5E4430" />
                {[790, 880, 960, 1040].map((x, i) => (
                  <path key={i} d={`M${x - 20},600 Q${x},622 ${x + 20},600 Z`} fill={i === 1 ? '#E9E2D2' : '#D9D0BE'} />
                ))}
                {[0, 1, 2].map((k) => (
                  <path key={k} d={`M${880 + k * 10},592 q6,-18 0,-34`} stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.35 + 0.15 * Math.sin(f * 0.1 + k)} />
                ))}
              </g>
              {/* 一家人 */}
              <SeatedFigure x={660} y={700} h={300} face={1} lean={4} color="#3E3026" reach={0.6} />
              <SeatedFigure x={1170} y={700} h={290} face={-1} lean={-3} color="#4A382C" reach={0.5 + 0.1 * Math.sin(f * 0.12)} />
              {/* 孩子赤脚跑过木地板 */}
              <WalkFigure x={lerp(380, 1460, run)} y={900} h={250} face={1} step={f * 0.6} walk={1} child color="#3E3026" />
              <ellipse cx={lerp(380, 1460, run)} cy={894} rx={40} ry={6} fill="#5E4430" opacity={0.25} />
              {/* 吊灯 */}
              <line x1={910} y1={-100} x2={910} y2={250} stroke="#4E3E30" strokeWidth={3} />
              <path d="M870,250 L950,250 L936,292 L884,292 Z" fill="#E9B866" />
              <circle cx={910} cy={290} r={360 * lampFlick} fill="url(#h5-lamp)" style={{mixBlendMode: 'screen'}} />
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}

      {/* 暖光化开：交给 1966 温州老街 */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse ${60 + bloom * 80}% ${50 + bloom * 80}% at 47% 30%, rgba(255,240,206,${0.95 * bloom}) 0%, rgba(246,236,214,${0.9 * bloom}) 55%, rgba(243,234,218,${0.75 * bloom}) 100%)`}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.5) 88%, rgba(243,234,218,0.72) 100%)'}} />
      <GoldDust count={26} seed="h5d" opacity={0.3 + 0.4 * inside} />
    </AbsoluteFill>
  );
};

const build = () => {
  const rain = new Array(140).fill(0).map((_, i) => ({x: random(`h5rx${i}`) * (W + 300), y: random(`h5ry${i}`) * (H + 200), v: 26 + random(`h5rv${i}`) * 14, l: 22 + random(`h5rl${i}`) * 26}));
  return {rain};
};
