import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, interpolateColors, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {KneelFigure} from '../components/Folk';
import {fernTuft} from '../components/Plants';
import {lerp, ridgePath, wobblyCircle} from '../lib/geom';

/**
 * H2 · 舟（5 秒 / 150 帧）：约 8000 年前，跨湖桥
 *   0– 30  H1 的金色年轮压扁、落到湖面，化作涟漪散去；晨雾湖岸，一根原木横在岸边
 *  10– 80  石锛一下下敲击，火烧掏空，木屑飞起：原木渐渐变成独木舟
 *  80–110  独木舟推入水中，水花与一圈圈涟漪（年轮）
 * 104–164  先民跪在舟里划桨，舟轻轻滑开
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const WATER = 650;
const LOG = {x: 640, y: 708};
const HALF = 250;
const R = 30;
const STRIKES = [16, 28, 40, 52, 64, 76];

const hull = (p: number) => {
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = -1 + (i / 24) * 2;
    top.push(`${(u * HALF).toFixed(1)},${(-R - p * 16 * Math.pow(Math.abs(u), 5)).toFixed(1)}`);
    bot.unshift(`${(u * HALF).toFixed(1)},${(R - p * 28 * u * u).toFixed(1)}`);
  }
  const cx = HALF + lerp(R * 1.3, 30, p);
  const yb = R - p * 28;
  const yt = -R - p * 16;
  return `M${top[0]} L${top.join(' L')} C${cx},${yt} ${cx},${yb} ${HALF},${yb} L${bot.join(' L')} C${-cx},${yb} ${-cx},${yt} ${-HALF},${yt} Z`;
};

export const H2Canoe: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const carve = interpolate(f, [10, 80], [0, 1], {...cl, easing: Easing.inOut(Easing.quad)});
  const launch = interpolate(f, [80, 108], [0, 1], {...cl, easing: io});
  const glide = interpolate(f, [104, 164], [0, 1], cl);
  const camX = interpolate(f, [56, 164], [0, -300], {...cl, easing: Easing.inOut(Easing.sin)});
  const ringsIn = interpolate(f, [0, 30], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});

  // 石锛：每 12 帧一击（慢抬、快落）
  const last = [...STRIKES].reverse().find((s) => f >= s - 10);
  const ph = last === undefined ? 0 : interpolate(f, [last - 10, last - 2, last], [0, 1, 0], cl);
  const arm = f > 80 ? 30 : lerp(30, -110, ph);
  const workerOp = interpolate(f, [84, 98], [1, 0], cl);

  const canoeX = LOG.x + launch * 560 + glide * 200;
  const canoeY = LOG.y + launch * 74 + (launch > 0.9 ? Math.sin(f * 0.15) * 2.5 : 0);
  const tilt = Math.sin(launch * Math.PI) * 4;
  const paddler = interpolate(f, [100, 114], [0, 1], cl);
  const paddle = 50 + 30 * Math.sin(f * 0.22);
  const woodCol = interpolateColors(carve, [0, 1], ['#7E5A3C', '#A67A4E']);

  const geo = useMemo(() => build(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[62, 26]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="h2" seed={111} />
          <linearGradient id="h2-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DCE0D2" />
            <stop offset="100%" stopColor="#EEE7D6" />
          </linearGradient>
          <linearGradient id="h2-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F0E2" stopOpacity={0} />
            <stop offset="100%" stopColor="#F7F0E2" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <g transform={`translate(${camX * 0.2} 0)`}>
          <path d={geo.far} fill={C.inkWash} opacity={0.22} filter="url(#h2-wash)" />
          <path d={geo.mid} fill={C.inkWash} opacity={0.34} filter="url(#h2-wash)" />
          <rect x={-200} y={WATER - 90} width={W + 800} height={110} fill="url(#h2-mist)" />
        </g>
        <rect x={-200} y={WATER} width={W + 400} height={H} fill="url(#h2-water)" />
        {/* H1 的年轮 → 湖面涟漪 */}
        <g fill="none" opacity={1 - ringsIn}>
          {geo.rings.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={i % 2 ? C.goldDeep : C.gold}
              strokeWidth={2.6}
              transform={`translate(${W / 2} ${lerp(H / 2, 820, ringsIn)}) scale(${1 + ringsIn * 0.6} ${lerp(1, 0.14, ringsIn)}) translate(${-W / 2} ${-H / 2})`}
            />
          ))}
        </g>
        <g transform={`translate(${camX} 0)`}>
          {/* 水纹 */}
          <g stroke={C.inkWash} strokeOpacity={0.28} strokeWidth={1.6} strokeLinecap="round">
            {geo.ripples.map((r, i) => {
              const x = ((r.x - f * r.v) % (W + 600)) - 100;
              return <line key={i} x1={x} y1={r.y} x2={x + r.l} y2={r.y} />;
            })}
          </g>
          {/* 湖岸 */}
          <path d="M-300,1100 L-300,690 C100,676 600,690 960,712 C1060,720 1130,748 1200,790 L1260,1100 Z" fill="#D8C8A4" filter="url(#h2-bleed)" />
          <path d="M960,712 C1060,720 1130,748 1200,790" stroke={C.inkWash} strokeWidth={3} fill="none" opacity={0.35} />
          <g stroke={C.leaf} strokeWidth={4} fill="none" opacity={0.7} strokeLinecap="round" filter="url(#h2-bleed)">
            {geo.reeds.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {/* 木屑 */}
          <g fill="#C9A06A">
            {geo.shavings.map((s, i) => (i / geo.shavings.length < carve ? <ellipse key={i} cx={s.x} cy={s.y} rx={6} ry={2.4} transform={`rotate(${s.r} ${s.x} ${s.y})`} opacity={0.9} /> : null))}
          </g>

          {/* 独木舟（由原木变来） */}
          <ellipse cx={canoeX} cy={canoeY + R + 6 - launch * 20} rx={HALF * 0.95} ry={10} fill="#3E3226" opacity={0.18 * (1 - launch)} />
          <g transform={`translate(${canoeX} ${canoeY}) rotate(${tilt})`}>
            {paddler > 0 ? (
              <g opacity={paddler}>
                <KneelFigure x={40} y={-R - 4} h={200} face={1} armAngle={paddle} lean={18} tool="paddle" color="#2E2620" />
              </g>
            ) : null}
            <path d={hull(carve)} fill={woodCol} stroke="#5E4430" strokeWidth={3} />
            <g stroke="#5E4430" strokeWidth={1.6} fill="none" opacity={0.5 * (1 - carve * 0.6)}>
              {[-12, 0, 12].map((y, i) => (
                <path key={i} d={`M${-HALF + 20},${y} C${-80},${y + 6} ${80},${y - 6} ${HALF - 20},${y}`} />
              ))}
            </g>
            {/* 掏空的舱 */}
            <ellipse cx={0} cy={-R - 1} rx={210 * carve} ry={10 * carve} fill="#3E3226" opacity={0.9} />
            <ellipse cx={0} cy={-R - 1} rx={210 * carve} ry={10 * carve} fill="none" stroke="#C9A06A" strokeWidth={2} opacity={0.8} />
            {/* 火烧：余烬与青烟 */}
            {f > 12 && f < 70
              ? geo.embers.map((e, i) => {
                  const t = ((f - 12) * 0.03 + e.p) % 1;
                  return (
                    <g key={i}>
                      <circle cx={e.x * carve + e.x * 0.3} cy={-R - 2} r={4} fill="#E8862E" opacity={0.8 * (1 - interpolate(f, [56, 70], [0, 1], cl))} />
                      <circle cx={e.x + t * 30} cy={-R - 20 - t * 120} r={10 + t * 26} fill="#F3EEE2" opacity={(1 - t) * 0.5} />
                    </g>
                  );
                })
              : null}
          </g>

          {/* 敲凿的人（岸上） */}
          <g opacity={workerOp}>
            <KneelFigure x={1000} y={720} h={220} face={-1} armAngle={arm} lean={24} tool="adze" color="#2E2620" />
          </g>
          {/* 每一击飞起的木屑 */}
          {STRIKES.map((s, k) => {
            const t = interpolate(f, [s, s + 16], [0, 1], cl);
            if (t <= 0 || t >= 1) return null;
            return (
              <g key={k}>
                {[0, 1, 2, 3, 4].map((j) => {
                  const vx = (random(`h2cv${k}${j}`) - 0.3) * 120;
                  const vy = -60 - random(`h2cy${k}${j}`) * 80;
                  return <rect key={j} x={860 + vx * t} y={LOG.y - R - 6 + vy * t + 200 * t * t} width={7} height={3} fill="#C9A06A" transform={`rotate(${t * 400 + j * 70} ${860 + vx * t} ${LOG.y - R + vy * t})`} opacity={1 - t} />;
                })}
              </g>
            );
          })}

          {/* 入水：水花 + 涟漪年轮 */}
          {[0, 1, 2, 3, 4].map((i) => {
            const t = interpolate(f, [100 + i * 8, 150 + i * 8], [0, 1], cl);
            return t > 0 && t < 1 ? (
              <ellipse key={i} cx={LOG.x + 560 + 40} cy={LOG.y + 74 + R} rx={60 + t * 420} ry={8 + t * 40} fill="none" stroke={i % 2 ? C.gold : C.inkWash} strokeWidth={2.4 * (1 - t) + 0.6} opacity={(1 - t) * 0.8} />
            ) : null;
          })}
          {f > 98 && f < 124
            ? new Array(9).fill(0).map((_, j) => {
                const t = (f - 98) / 26;
                const vx = (random(`h2sx${j}`) - 0.5) * 180;
                return <circle key={j} cx={LOG.x + 560 - HALF * 0.6 + vx * t} cy={LOG.y + 90 - 120 * t + 220 * t * t} r={3.4} fill="#F7F3E8" opacity={1 - t} />;
              })
            : null}
        </g>
      </svg>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.55) 88%, rgba(243,234,218,0.75) 100%)'}} />
      <GoldDust count={24} seed="h2d" opacity={0.5} />
    </AbsoluteFill>
  );
};

const build = () => {
  const far = ridgePath(W + 800, 520, 150, 'h2far', WATER, 12, 0.0024);
  const mid = ridgePath(W + 800, 590, 80, 'h2mid', WATER, 12, 0.004);
  const rings = [90, 170, 250, 340, 440, 560].map((r, i) => wobblyCircle(W / 2, H / 2, r, `h1r${i}`, 0.03));
  const ripples = new Array(30).fill(0).map((_, i) => ({x: random(`h2rx${i}`) * (W + 600), y: WATER + 20 + random(`h2ry${i}`) * 380, l: 40 + random(`h2rl${i}`) * 120, v: 0.3 + random(`h2rv${i}`) * 0.4}));
  const reeds = [40, 110, 170, 260, 330].map((x, i) => fernTuft(x, 700, 90 + i * 10, `h2rd${i}`));
  const shavings = new Array(40).fill(0).map((_, i) => ({x: 420 + random(`h2shx${i}`) * 520, y: 742 + random(`h2shy${i}`) * 26, r: random(`h2shr${i}`) * 180}));
  const embers = new Array(6).fill(0).map((_, i) => ({x: -150 + i * 60, p: random(`h2ep${i}`)}));
  return {far, mid, rings, ripples, reeds, shavings, embers};
};
