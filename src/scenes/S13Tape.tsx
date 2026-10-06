import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 13 镜（6 秒 / 180 帧）：1998.7，一卷封箱胶带
 * 木箱表面特写：胶带卷滚过，印字的胶带被拉开（文字随之滚动）
 * 镜头推近，一串电话 / 传真号码被金色手绘圈出、发光
 * 注：公司名与号码为虚构示意
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TAPE_Y = 520;
const TAPE_H = 150;
const UNIT = 'MADEIRAS DO PARÁ · BRASIL · TEL 55-91-223-1998 · FAX 55-91-223-1999 · ';

export const S13Tape: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const unroll = interpolate(f, [0, 70], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const rollX = interpolate(unroll, [0, 1], [-200, 2240]);
  const scroll = interpolate(f, [0, 70], [600, 0], {...cl, easing: Easing.out(Easing.cubic)});
  const zoom = interpolate(f, [70, 130], [1, 1.9], {...cl, easing: io});
  const focus = {x: 1000, y: TAPE_Y + TAPE_H / 2};
  const circle = interpolate(f, [112, 150], [0, 1], {...cl, easing: io});
  const glow = interpolate(f, [130, 170], [0, 1], cl);

  return (
    <AbsoluteFill>
      <Paper />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s13-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C99A62" />
            <stop offset="100%" stopColor="#A87842" />
          </linearGradient>
          <linearGradient id="s13-tape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9D6A6" stopOpacity={0.95} />
            <stop offset="50%" stopColor="#F2E2B8" stopOpacity={0.92} />
            <stop offset="100%" stopColor="#DCC48E" stopOpacity={0.95} />
          </linearGradient>
          <clipPath id="s13-tape-clip">
            <rect x={-100} y={TAPE_Y} width={Math.max(0, rollX + 100)} height={TAPE_H} />
          </clipPath>
          <radialGradient id="s13-glow">
            <stop offset="0%" stopColor={C.goldLight} stopOpacity={0.8} />
            <stop offset="100%" stopColor={C.goldLight} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${focus.x} ${focus.y}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}>
          {/* 木箱板面 */}
          <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#s13-wood)" />
          <g stroke="#7A4A1E" strokeOpacity={0.3} strokeWidth={2} fill="none">
            {new Array(50).fill(0).map((_, i) => {
              const y0 = -100 + i * 26;
              let d = `M-200,${y0}`;
              for (let x = -200; x <= W + 200; x += 40) d += ` L${x},${(y0 + Math.sin(x * 0.004 + i) * 8).toFixed(1)}`;
              return <path key={i} d={d} />;
            })}
          </g>
          {[300, 760].map((y) => (
            <rect key={y} x={-200} y={y} width={W + 400} height={6} fill="#6E3F17" opacity={0.5} />
          ))}
          {/* 钉子 */}
          {[120, 640, 1280, 1800].map((x) => (
            <g key={x}>
              <circle cx={x} cy={270} r={9} fill="#5A5A5A" />
              <circle cx={x} cy={800} r={9} fill="#5A5A5A" />
            </g>
          ))}
          {/* 胶带 */}
          <g clipPath="url(#s13-tape-clip)">
            <rect x={-100} y={TAPE_Y} width={W + 400} height={TAPE_H} fill="url(#s13-tape)" />
            <rect x={-100} y={TAPE_Y} width={W + 400} height={4} fill="#FFF6DC" opacity={0.6} />
            <g transform={`translate(${-scroll} 0)`}>
              {[0, 1, 2].map((k) => (
                <text key={k} x={-40 + k * 2010} y={TAPE_Y + 92} fontFamily={sans} fontWeight={700} fontSize={36} letterSpacing={3} fill="#3E7A4A">
                  {UNIT}
                </text>
              ))}
            </g>
            {/* 反光 */}
            <rect x={-100} y={TAPE_Y + 18} width={W + 400} height={12} fill="#FFFFFF" opacity={0.25} />
          </g>
          {/* 胶带卷 */}
          {unroll < 1 ? (
            <g transform={`translate(${rollX} ${TAPE_Y + TAPE_H / 2})`}>
              <circle r={120} fill="#D9C08A" stroke="#B89A5E" strokeWidth={4} />
              <circle r={70} fill="#EDE2C6" />
              <circle r={56} fill="#C9B080" />
              <g transform={`rotate(${rollX * 0.6})`}>
                <line x1={-56} y1={0} x2={56} y2={0} stroke="#B89A5E" strokeWidth={4} />
              </g>
            </g>
          ) : null}
          {/* 金色手绘圈 */}
          <g>
            <ellipse cx={1000} cy={focus.y} rx={260} ry={70} fill="url(#s13-glow)" opacity={glow} />
            <path
              d={`M760,${focus.y - 10} C760,${focus.y - 70} 1240,${focus.y - 80} 1250,${focus.y - 6} C1260,${focus.y + 60} 780,${focus.y + 74} 770,${focus.y + 6} C764,${focus.y - 30} 820,${focus.y - 60} 900,${focus.y - 66}`}
              fill="none"
              stroke={C.gold}
              strokeWidth={8}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - circle}
            />
          </g>
        </g>
      </svg>
      {/* 号码注释 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 250,
          textAlign: 'center',
          fontFamily: serif,
          fontWeight: 700,
          fontSize: 54,
          letterSpacing: '0.2em',
          color: C.goldAntique,
          opacity: glow,
          transform: `translateY(${(1 - glow) * 16}px)`,
          textShadow: '0 0 20px rgba(251,246,236,0.95)',
        }}
      >
        一条线索
      </div>
      <GoldDust count={24} seed="s13d" opacity={glow * 0.8} />
      <OldPhoto strength={0.5} seed="s13" leak={false} />
    </AbsoluteFill>
  );
};
