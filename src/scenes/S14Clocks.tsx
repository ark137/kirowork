import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 14 镜（7 秒 / 210 帧）：语言不通，隔着 11 小时
 * 左钟“温州”、右钟“巴西”，指针飞转（相差 11 小时，一边白天一边黑夜）
 * 中间一台老式按键电话，不断拨出：电波沿弧线飞向对岸
 * “喂？”与“Alô?”的气泡相互错过；右下角拨号次数的计数一笔笔增加
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const LEFT = {x: 440, y: 470};
const RIGHT = {x: 1480, y: 470};
const PHONE = {x: 960, y: 640};

export const S14Clocks: React.FC = () => {
  const f = useCurrentFrame();
  const out = Easing.out(Easing.cubic);
  const appear = interpolate(f, [0, 24], [0, 1], {...cl, easing: Easing.out(Easing.back(1.4))});
  // 时间流逝：从 21:00（温州）开始，7 秒走完约 3 天
  const hours = 21 + interpolate(f, [16, 210], [0, 72], {...cl, easing: Easing.inOut(Easing.sin)});
  const hz = hours % 24;
  const hb = (hours - 11 + 24) % 24;
  const isDay = (h: number) => h >= 6 && h < 18;
  const calls = Math.floor(interpolate(f, [30, 200], [0, 37], cl));

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 45]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="s14-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#6B4E2A" floodOpacity="0.25" />
          </filter>
        </defs>
        {/* 连线弧 */}
        <path
          d={`M${LEFT.x + 170},${LEFT.y - 60} Q${W / 2},${120} ${RIGHT.x - 170},${RIGHT.y - 60}`}
          fill="none"
          stroke={C.goldDeep}
          strokeWidth={3}
          strokeDasharray="10 12"
          strokeDashoffset={-f * 3}
          opacity={0.6 * appear}
        />
        {/* 飞出的电波点 */}
        {new Array(6).fill(0).map((_, i) => {
          const t = ((f - 30) * 0.012 + i / 6) % 1;
          if (f < 30) return null;
          const x0 = LEFT.x + 170;
          const x1 = RIGHT.x - 170;
          const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (W / 2) + t * t * x1;
          const y = (1 - t) * (1 - t) * (LEFT.y - 60) + 2 * (1 - t) * t * 120 + t * t * (RIGHT.y - 60);
          return <circle key={i} cx={x} cy={y} r={7} fill={C.gold} opacity={Math.sin(t * Math.PI)} />;
        })}

        <Clock {...LEFT} hour={hz} label="温州" sub="WENZHOU · UTC+8" day={isDay(hz)} s={appear} />
        <Clock {...RIGHT} hour={hb} label="巴西" sub="BRAZIL · UTC−3" day={isDay(hb)} s={appear} />
        <text x={W / 2} y={360} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={54} fill={C.goldAntique} opacity={appear}>
          − 11 h
        </text>

        {/* 电话 */}
        <g transform={`translate(${PHONE.x} ${PHONE.y}) scale(${appear})`} filter="url(#s14-shadow)">
          <Phone f={f} />
        </g>
        {/* 拨号电波 */}
        {new Array(3).fill(0).map((_, k) => {
          const t = ((f * 0.03 + k / 3) % 1);
          return (
            <path
              key={k}
              d={`M${PHONE.x - 60 - t * 120},${PHONE.y - 70 - t * 60} Q${PHONE.x},${PHONE.y - 150 - t * 110} ${PHONE.x + 60 + t * 120},${PHONE.y - 70 - t * 60}`}
              fill="none"
              stroke={C.goldDeep}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={(1 - t) * 0.7 * appear}
            />
          );
        })}

        {/* 对话气泡：相互错过 */}
        {[
          {t0: 40, x: LEFT.x + 40, y: 210, text: '喂？', side: 1},
          {t0: 70, x: RIGHT.x - 40, y: 200, text: 'Alô?', side: -1},
          {t0: 110, x: LEFT.x + 80, y: 230, text: 'Hello… ?', side: 1},
          {t0: 140, x: RIGHT.x - 70, y: 220, text: 'Como? Não entendo…', side: -1},
          {t0: 168, x: LEFT.x + 60, y: 200, text: 'Wood… madeira?', side: 1},
        ].map((b, i) => {
          const p = interpolate(f, [b.t0, b.t0 + 10, b.t0 + 34, b.t0 + 44], [0, 1, 1, 0], cl);
          if (p <= 0) return null;
          const w = 40 + b.text.length * 22;
          return (
            <g key={i} transform={`translate(${b.x} ${b.y - (1 - p) * 10}) scale(${0.85 + 0.15 * p})`} opacity={p}>
              <rect x={-w / 2} y={-38} width={w} height={64} rx={30} fill="#FFFDF6" stroke={C.inkMute} strokeWidth={2} />
              <path d={`M${b.side * -10},26 L${b.side * -30},52 L${b.side * 14},26 Z`} fill="#FFFDF6" stroke={C.inkMute} strokeWidth={2} />
              <rect x={-w / 2 + 4} y={22} width={w - 8} height={8} fill="#FFFDF6" />
              <text y={6} textAnchor="middle" fontFamily={b.side > 0 ? serif : sans} fontWeight={600} fontSize={28} fill={C.ink}>
                {b.text}
              </text>
              {/* 问号：听不懂 */}
              <text x={w / 2 + 6} y={-30} fontFamily={serif} fontWeight={900} fontSize={34} fill={C.seal} opacity={p}>
                ?
              </text>
            </g>
          );
        })}

        {/* 拨号计数（正字记号） */}
        <g transform="translate(1690 790)" opacity={appear}>
          <text x={0} y={-16} fontFamily={sans} fontSize={18} letterSpacing={4} fill={C.inkMute}>
            拨出次数
          </text>
          {new Array(calls).fill(0).map((_, i) => {
            const g = Math.floor(i / 5);
            const k = i % 5;
            const gx = (g % 4) * 72;
            const gy = Math.floor(g / 4) * 52;
            if (k < 4) return <line key={i} x1={gx + k * 12} y1={gy + 10} x2={gx + k * 12 + 2} y2={gy + 46} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />;
            return <line key={i} x1={gx - 6} y1={gy + 40} x2={gx + 46} y2={gy + 16} stroke={C.seal} strokeWidth={4} strokeLinecap="round" />;
          })}
        </g>
      </svg>
      <OldPhoto strength={0.45} seed="s14" leak={false} />
    </AbsoluteFill>
  );
};

const Clock: React.FC<{x: number; y: number; hour: number; label: string; sub: string; day: boolean; s: number}> = ({x, y, hour, label, sub, day, s}) => {
  const hA = (hour % 12) * 30;
  const mA = (hour % 1) * 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={170} fill={day ? '#FFF6DE' : '#5D7090'} opacity={0.9} />
      <circle r={170} fill="none" stroke={C.goldDeep} strokeWidth={8} />
      <circle r={150} fill="none" stroke={C.goldDeep} strokeWidth={1.5} opacity={0.5} />
      {new Array(12).fill(0).map((_, i) => (
        <line key={i} x1={0} y1={-140} x2={0} y2={i % 3 === 0 ? -116 : -128} stroke={day ? C.ink : '#F4EEDC'} strokeWidth={i % 3 === 0 ? 6 : 3} transform={`rotate(${i * 30})`} />
      ))}
      {/* 日 / 月 */}
      {day ? (
        <g transform="translate(0 64)">
          <circle r={20} fill={C.gold} />
          {new Array(8).fill(0).map((_, i) => (
            <line key={i} x1={0} y1={-28} x2={0} y2={-36} stroke={C.gold} strokeWidth={4} transform={`rotate(${i * 45})`} />
          ))}
        </g>
      ) : (
        <g transform="translate(0 64)">
          <circle r={20} fill="#F4EEDC" />
          <circle cx={9} cy={-6} r={18} fill="#5D7090" />
          {[[-50, -10], [40, 20], [-30, 30]].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={2.4} fill="#F4EEDC" opacity={0.8} />
          ))}
        </g>
      )}
      <line x1={0} y1={0} x2={0} y2={-78} stroke={day ? C.ink : '#F4EEDC'} strokeWidth={9} strokeLinecap="round" transform={`rotate(${hA})`} />
      <line x1={0} y1={0} x2={0} y2={-118} stroke={day ? C.ink : '#F4EEDC'} strokeWidth={5} strokeLinecap="round" transform={`rotate(${mA})`} />
      <circle r={10} fill={C.seal} />
      <text y={230} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={44} fill={C.ink}>
        {label}
      </text>
      <text y={262} textAnchor="middle" fontFamily={sans} fontSize={16} letterSpacing={4} fill={C.inkMute}>
        {sub}
      </text>
      <text y={-196} textAnchor="middle" fontFamily={sans} fontWeight={600} fontSize={26} fill={C.inkSoft}>
        {String(Math.floor(hour)).padStart(2, '0')}:{String(Math.floor((hour % 1) * 60)).padStart(2, '0')}
      </text>
    </g>
  );
};

const Phone: React.FC<{f: number}> = ({f}) => {
  const pressed = Math.floor(f / 4) % 12;
  return (
    <g>
      <path d="M-130,40 L130,40 L110,-40 L-110,-40 Z" fill="#E7E1D0" stroke="#8A7E68" strokeWidth={3} />
      <rect x={-130} y={38} width={260} height={16} rx={6} fill="#CFC6B0" />
      {/* 听筒 */}
      <g transform={`translate(0 ${-58 + Math.sin(f * 0.3) * 1.5})`}>
        <path d="M-120,0 C-120,-30 -90,-36 -70,-24 L70,-24 C90,-36 120,-30 120,0 C120,14 96,16 86,4 L-86,4 C-96,16 -120,14 -120,0 Z" fill="#3E3A36" />
      </g>
      {/* 按键 */}
      {new Array(12).fill(0).map((_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const on = i === pressed;
        return <rect key={i} x={-42 + c * 30} y={-28 + r * 16} width={24} height={12} rx={3} fill={on ? C.gold : '#F7F3E8'} stroke="#8A7E68" strokeWidth={1.4} />;
      })}
      {/* 电话线 */}
      <path d={`M130,30 C${180},${60} ${170},${110} ${220},${120}`} fill="none" stroke="#3E3A36" strokeWidth={4} />
      {new Array(10).fill(0).map((_, i) => (
        <circle key={i} cx={140 + i * 8} cy={40 + i * 8 + Math.sin(i) * 4} r={5} fill="none" stroke="#3E3A36" strokeWidth={2} />
      ))}
      {void random}
    </g>
  );
};
