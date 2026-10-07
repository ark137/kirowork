import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';

/**
 * satellite（9 秒 / 270 帧）：卫星遥感轮伐，25 块、25 年一个轮回
 *   0–90   俯瞰雨林；卫星从右上掠过，扫描线自上而下“画”出金色 5×5 网格
 *  84–240  年份计数 1→25：每年只采一块（树冠消失、露出土地），次年补种，幼苗逐年长回
 *          右侧轮回盘：25 个刻度逐年点亮
 * 240–270  第 25 年：第 1 块已重新成林，轮回盘闭合，金色箭头回到起点
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const N = 5;
export const CELL_W = 164;
export const CELL_H = 124;
export const GX = 380;
export const GY = 196;
export const GW = CELL_W * N;
export const GH = CELL_H * N;
const WHEEL = {x: 1540, y: 470, r: 150};
const Y0 = 84; // 第 1 年开始
const Y1 = 236; // 第 25 年结束
const YEARS = 25;

/** 蛇形顺序：第 k 年采伐的格子 */
export const ORDER = new Array(N * N).fill(0).map((_, k) => {
  const r = Math.floor(k / N);
  const c = r % 2 === 0 ? k % N : N - 1 - (k % N);
  return {r, c};
});

export const GREENS = ['#5E7F55', '#6F8F62', '#4F7048', '#7E9B6A'];
/** 河流（mill 镜头末帧与此对齐） */
export const SAT_RIVER = 'M-40,880 C300,820 420,960 760,900 C1080,840 1240,980 1960,900';

export const SSatellite: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);

  const satT = interpolate(f, [0, 96], [0, 1], cl);
  const satX = 1980 - satT * 2200;
  const satY = 70 + Math.sin(satT * Math.PI) * 30;
  const scan = interpolate(f, [22, 80], [0, 1], {...cl, easing: io});
  const gridIn = scan;
  const hud = interpolate(f, [30, 60], [0, 1], cl);

  // 连续“年”时间：0 → 25
  const T = interpolate(f, [Y0, Y1], [0, YEARS], cl);
  const year = Math.min(YEARS, Math.floor(T) + 1);
  const loop = interpolate(f, [238, 262], [0, 1], {...cl, easing: io});

  const bg = useMemo(() => buildBackground(), []);
  const cells = useMemo(() => buildCells(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[40, 30]} tint="rgba(170,195,150,0.12)" />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="st" seed={81} />
          <linearGradient id="st-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE9A8" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#FFE9A8" stopOpacity={0} />
          </linearGradient>
          <clipPath id="st-grid">
            <rect x={GX} y={GY} width={GW} height={GH} />
          </clipPath>
          <clipPath id="st-scan">
            <rect x={GX - 20} y={GY - 20} width={GW + 40} height={(GH + 40) * scan} />
          </clipPath>
        </defs>

        {/* 外围雨林（淡） */}
        <g filter="url(#st-soft)" opacity={0.28}>
          {bg.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={GREENS[i % 4]} opacity={0.55} />
          ))}
        </g>
        {/* 河流 */}
        <path d={SAT_RIVER} fill="none" stroke="#EFE4C4" strokeWidth={44} opacity={0.9} />

        {/* 林区底 */}
        <rect x={GX - 10} y={GY - 10} width={GW + 20} height={GH + 20} fill="#F1E8D2" opacity={0.6} rx={6} />

        {/* 25 块林地 */}
        <g clipPath="url(#st-grid)">
          {cells.map((cell, idx) => {
            const k = cell.k; // 第 k 年(0 起)采伐
            const x0 = GX + cell.c * CELL_W;
            const y0 = GY + cell.r * CELL_H;
            const age = T - k; // <0：尚未采伐（成熟林）；0~0.5：采伐；>0.5：再生
            const cut = age >= 0 ? interpolate(age, [0, 0.45], [0, 1], cl) : 0;
            const regrow = age > 0.6 ? Math.pow(Math.min(1, (age - 0.6) / 22), 0.75) : 0;
            const scale = age < 0 ? 1 : cut < 1 ? 1 - cut : 0.12 + 0.88 * regrow;
            const soil = age < 0 ? 0 : cut < 1 ? cut : 1 - regrow;
            const young = age > 0.6 ? 1 - regrow : 0;
            const active = age >= 0 && age < 1;
            return (
              <g key={idx}>
                <rect x={x0} y={y0} width={CELL_W} height={CELL_H} fill="#7F9A6B" opacity={0.35} />
                {/* 裸露的土地 + 采伐痕 */}
                <g opacity={soil}>
                  <rect x={x0} y={y0} width={CELL_W} height={CELL_H} fill="#DCC7A0" />
                  <g stroke="#B99A6A" strokeWidth={3} opacity={0.6}>
                    {[0.25, 0.5, 0.75].map((t) => (
                      <line key={t} x1={x0 + 14} y1={y0 + CELL_H * t} x2={x0 + CELL_W - 14} y2={y0 + CELL_H * t + 6} />
                    ))}
                  </g>
                </g>
                {/* 树冠 */}
                <g filter="url(#st-bleed)">
                  {cell.crowns.map((b, j) => {
                    const r = b.r * scale;
                    if (r < 0.6) return null;
                    const fill = young > 0.05 ? mix(GREENS[j % 4], '#B9CF8E', young * 0.8) : GREENS[j % 4];
                    return (
                      <g key={j}>
                        <circle cx={b.x + 3} cy={b.y + 4} r={r} fill="#3E5A38" opacity={0.35} />
                        <circle cx={b.x} cy={b.y} r={r} fill={fill} />
                        <circle cx={b.x - r * 0.3} cy={b.y - r * 0.3} r={r * 0.38} fill="#E6EDC8" opacity={0.25} />
                      </g>
                    );
                  })}
                </g>
                {active ? (
                  <rect x={x0 + 3} y={y0 + 3} width={CELL_W - 6} height={CELL_H - 6} fill="none" stroke={C.gold} strokeWidth={5} opacity={1 - Math.max(0, age - 0.7) / 0.3} />
                ) : null}
              </g>
            );
          })}
        </g>

        {/* 金色网格（随扫描线出现） */}
        <g clipPath="url(#st-scan)" opacity={gridIn}>
          <rect x={GX} y={GY} width={GW} height={GH} fill="none" stroke={C.goldDeep} strokeWidth={3} />
          <g stroke={C.gold} strokeWidth={1.6} opacity={0.9}>
            {new Array(N - 1).fill(0).map((_, i) => (
              <g key={i}>
                <line x1={GX + (i + 1) * CELL_W} y1={GY} x2={GX + (i + 1) * CELL_W} y2={GY + GH} />
                <line x1={GX} y1={GY + (i + 1) * CELL_H} x2={GX + GW} y2={GY + (i + 1) * CELL_H} />
              </g>
            ))}
          </g>
          {cells.map((cell, idx) => (
            <text key={idx} x={GX + cell.c * CELL_W + 10} y={GY + cell.r * CELL_H + 22} fontFamily={sans} fontSize={14} fontWeight={600} fill="#FFF6DC" letterSpacing={1} style={{paintOrder: 'stroke'}} stroke="rgba(60,80,50,0.45)" strokeWidth={3}>
              {String(cell.k + 1).padStart(2, '0')}
            </text>
          ))}
        </g>
        {/* 扫描线 */}
        {scan > 0 && scan < 1 ? (
          <g>
            <line x1={GX - 40} y1={GY + GH * scan} x2={GX + GW + 40} y2={GY + GH * scan} stroke="#FFF1C2" strokeWidth={3} />
            <rect x={GX - 40} y={GY + GH * scan - 60} width={GW + 80} height={60} fill="url(#st-beam)" transform={`rotate(180 ${GX + GW / 2} ${GY + GH * scan - 30})`} />
          </g>
        ) : null}

        {/* HUD 角标 */}
        <g stroke={C.goldDeep} strokeWidth={2.4} fill="none" opacity={hud}>
          {[
            [GX - 26, GY - 26, 1, 1],
            [GX + GW + 26, GY - 26, -1, 1],
            [GX - 26, GY + GH + 26, 1, -1],
            [GX + GW + 26, GY + GH + 26, -1, -1],
          ].map(([x, y, sx, sy], i) => (
            <path key={i} d={`M${x},${y + sy * 34} L${x},${y} L${x + sx * 34},${y}`} />
          ))}
        </g>

        {/* 轮回盘 */}
        <g opacity={hud}>
          <circle cx={WHEEL.x} cy={WHEEL.y} r={WHEEL.r + 26} fill="#FBF6EC" opacity={0.75} />
          {new Array(YEARS).fill(0).map((_, i) => {
            const a = -Math.PI / 2 + (i / YEARS) * Math.PI * 2;
            const lit = T > i ? 1 : 0;
            const cur = Math.floor(T) === i && T < YEARS;
            return (
              <line
                key={i}
                x1={WHEEL.x + Math.cos(a) * (WHEEL.r - 16)}
                y1={WHEEL.y + Math.sin(a) * (WHEEL.r - 16)}
                x2={WHEEL.x + Math.cos(a) * (WHEEL.r + (cur ? 12 : 4))}
                y2={WHEEL.y + Math.sin(a) * (WHEEL.r + (cur ? 12 : 4))}
                stroke={lit ? C.gold : C.inkMute}
                strokeWidth={cur ? 6 : 3.4}
                strokeLinecap="round"
                opacity={lit ? 1 : 0.35}
              />
            );
          })}
          <circle
            cx={WHEEL.x}
            cy={WHEEL.y}
            r={WHEEL.r - 30}
            fill="none"
            stroke={C.gold}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - T / YEARS}
            transform={`rotate(-90 ${WHEEL.x} ${WHEEL.y})`}
            opacity={0.8}
          />
          {/* 闭环箭头 */}
          <g opacity={loop} transform={`translate(${WHEEL.x} ${WHEEL.y - WHEEL.r + 30}) scale(${0.6 + loop * 0.4})`}>
            <path d="M-14,-12 L6,0 L-14,12" fill="none" stroke={C.goldDeep} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* 卫星 */}
        <g transform={`translate(${satX} ${satY}) rotate(-8)`}>
          <polygon points={`-30,20 30,20 ${180},${GY + 300 - satY} ${-180},${GY + 300 - satY}`} fill="url(#st-beam)" opacity={0.5 * (1 - scan * 0.6)} />
          <g stroke={C.inkSoft} strokeWidth={2}>
            <rect x={-92} y={-12} width={62} height={24} fill="#C9D6E0" />
            <rect x={30} y={-12} width={62} height={24} fill="#C9D6E0" />
            {[-78, -62, -46, 44, 60, 76].map((x) => (
              <line key={x} x1={x} y1={-12} x2={x} y2={12} />
            ))}
            <line x1={-30} y1={0} x2={30} y2={0} />
            <rect x={-18} y={-18} width={36} height={36} rx={4} fill={C.gold} />
          </g>
          <circle cx={0} cy={22} r={5} fill={C.inkSoft} />
        </g>
      </svg>

      {/* 年份计数 + 轮回盘中心文字 */}
      <div style={{position: 'absolute', left: WHEEL.x - 120, width: 240, top: WHEEL.y - 62, textAlign: 'center', opacity: hud}}>
        <div style={{fontFamily: sans, fontSize: 14, letterSpacing: '0.34em', color: C.inkMute}}>YEAR</div>
        <div style={{fontFamily: serif, fontWeight: 600, fontSize: 64, lineHeight: 1.05, color: C.goldDeep}}>
          {f < Y0 ? '—' : String(year).padStart(2, '0')}
          <span style={{fontSize: 26, color: C.inkMute}}> / 25</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: WHEEL.x - 160, width: 320, top: WHEEL.y + WHEEL.r + 46, textAlign: 'center', opacity: hud}}>
        <div style={{fontFamily: serif, fontWeight: 600, fontSize: 26, letterSpacing: '0.16em', color: C.inkSoft}}>
          {loop > 0.5 ? '一个轮回' : '每年只采一块'}
        </div>
        <div style={{fontFamily: sans, fontSize: 13, letterSpacing: '0.3em', color: C.inkMute, marginTop: 6}}>
          {loop > 0.5 ? '25-YEAR CYCLE' : 'ONE PLOT A YEAR'}
        </div>
      </div>
      <div style={{position: 'absolute', left: GX, width: GW, textAlign: 'right', top: GY - 62, fontFamily: sans, fontSize: 14, letterSpacing: '0.3em', color: C.inkMute, opacity: hud}}>
        SATELLITE SURVEY · 25 PLOTS
      </div>

      <AbsoluteFill
        style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 76%, rgba(243,234,218,0.6) 88%, rgba(243,234,218,0.8) 100%)'}}
      />
      <GoldDust count={22} seed="std" opacity={0.5} />
    </AbsoluteFill>
  );
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

export const buildCells = () =>
  ORDER.map(({r, c}, k) => {
    const crowns: {x: number; y: number; r: number}[] = [];
    const x0 = GX + c * CELL_W;
    const y0 = GY + r * CELL_H;
    for (let j = 0; j < 14; j++) {
      crowns.push({
        x: x0 + 14 + random(`cx${k}${j}`) * (CELL_W - 28),
        y: y0 + 14 + random(`cy${k}${j}`) * (CELL_H - 28),
        r: 20 + random(`cr${k}${j}`) * 14,
      });
    }
    return {r, c, k, crowns};
  });

export const buildBackground = () =>
  new Array(170).fill(0).map((_, i) => ({
    x: random(`bx${i}`) * (W + 100) - 50,
    y: random(`by${i}`) * (H + 100) - 50,
    r: 26 + random(`br${i}`) * 26,
  }));
