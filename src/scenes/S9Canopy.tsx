import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';

/**
 * 第 9 镜（6 秒 / 180 帧）：为了抢到一缕阳光，树长成了各自的样子
 * 水墨侧剖：顶光倾泻；六种热带树（伞形巨树、圆冠、棕榈、塔形、板根巨树、藤蔓缠树）
 * 以不同速度向光生长，最后一棵伞形巨树冲出林冠，迎光而立
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 940;

type Kind = 'umbrella' | 'round' | 'palm' | 'cone' | 'buttress' | 'vine';
type Spec = {kind: Kind; x: number; h: number; w: number; delay: number; speed: number; tone: number};

const TREES: Spec[] = [
  {kind: 'round', x: 220, h: 430, w: 300, delay: 0, speed: 70, tone: 1},
  {kind: 'palm', x: 470, h: 520, w: 260, delay: 8, speed: 70, tone: 2},
  {kind: 'buttress', x: 760, h: 640, w: 380, delay: 4, speed: 90, tone: 2},
  {kind: 'umbrella', x: 1060, h: 860, w: 520, delay: 14, speed: 120, tone: 3},
  {kind: 'cone', x: 1360, h: 560, w: 220, delay: 6, speed: 80, tone: 1},
  {kind: 'vine', x: 1600, h: 600, w: 300, delay: 10, speed: 90, tone: 2},
  {kind: 'round', x: 1830, h: 380, w: 280, delay: 2, speed: 70, tone: 1},
];
const TONES = ['#B8C49E', '#8EA373', '#6A8758', '#4C6B44'];

export const S9Canopy: React.FC = () => {
  const f = useCurrentFrame();
  const light = interpolate(f, [0, 50], [0.3, 1], cl);
  const crown = interpolate(f, [120, 170], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const camY = interpolate(f, [0, 180], [60, -40], {...cl, easing: Easing.inOut(Easing.sin)});
  const geo = useMemo(() => TREES.map((t, i) => ({...t, ...build(t, i)})), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[56, 4]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="s9" seed={51} />
          <linearGradient id="s9-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF2C6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFF2C6" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="s9-sun" cx="0.56" cy="0" r="0.6">
            <stop offset="0%" stopColor="#FFF4D4" />
            <stop offset="100%" stopColor="#FFF4D4" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s9-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6CBA8" />
            <stop offset="100%" stopColor="#C4B48E" />
          </linearGradient>
          {geo.map((g, i) => (
            <clipPath key={i} id={`s9-grow-${i}`}>
              <rect x={g.x - g.w} width={g.w * 2} y={GROUND - (g.h + 80) * grow(f, g)} height={(g.h + 80) * grow(f, g) + 100} />
            </clipPath>
          ))}
        </defs>
        <rect width={W} height={H} fill="url(#s9-sun)" />
        {/* 顶光 */}
        <g opacity={light} style={{mixBlendMode: 'screen'}}>
          {[760, 940, 1060, 1180, 1320].map((x, i) => (
            <polygon key={i} points={`${x - 40},-20 ${x + 40},-20 ${x + 160 + i * 10},${H} ${x - 160 - i * 10},${H}`} fill="url(#s9-ray)" opacity={0.35 + 0.15 * Math.sin(f * 0.05 + i)} />
          ))}
        </g>
        <g transform={`translate(0 ${camY})`}>
          {/* 远景林影 */}
          <g fill={C.inkWash} opacity={0.14} filter="url(#s9-soft)">
            {new Array(22).fill(0).map((_, i) => (
              <ellipse key={i} cx={i * 92} cy={GROUND - 260 - random(`bg${i}`) * 120} rx={90} ry={70} />
            ))}
          </g>
          {geo.map((g, i) => (
            <g key={i} clipPath={`url(#s9-grow-${i})`} filter="url(#s9-bleed)">
              <path d={g.trunk} fill={C.inkSoft} opacity={0.9} />
              {g.extra ? <path d={g.extra} fill="none" stroke={C.inkSoft} strokeWidth={3} strokeLinecap="round" opacity={0.8} /> : null}
              {g.puffs.map((p, k) => (
                <circle key={k} cx={p.x} cy={p.y} r={p.r} fill={TONES[g.tone - (k % 2)]} opacity={0.92} />
              ))}
              {g.fronds ? <path d={g.fronds} fill="none" stroke={TONES[g.tone]} strokeWidth={9} strokeLinecap="round" /> : null}
            </g>
          ))}
          {/* 巨树冠顶的金边：冲出林冠、迎光 */}
          <g opacity={crown}>
            {geo[3].puffs.slice(0, 9).map((p, k) => (
              <circle key={k} cx={p.x} cy={p.y - 4} r={p.r} fill="none" stroke={C.goldLight} strokeWidth={4} strokeOpacity={0.75} />
            ))}
          </g>
          <rect x={-100} y={GROUND} width={W + 200} height={300} fill="url(#s9-floor)" />
          {/* 林下蕨类 */}
          <g stroke={C.leaf} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} filter="url(#s9-bleed)">
            {new Array(18).fill(0).map((_, i) => {
              const x = i * 112 + random(`fx${i}`) * 40;
              return (
                <g key={i}>
                  {[-1.1, -0.5, 0, 0.5, 1.1].map((a, k) => (
                    <path key={k} d={`M${x},${GROUND + 6} q${Math.sin(a) * 40},${-50} ${Math.sin(a) * 80},${-40 + Math.abs(a) * 30}`} />
                  ))}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <GoldDust count={40} seed="s9d" opacity={light * 0.9} />
    </AbsoluteFill>
  );
};

const grow = (f: number, g: {delay: number; speed: number}) =>
  interpolate(f, [g.delay, g.delay + g.speed], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});

const build = (t: Spec, i: number) => {
  const top = GROUND - t.h;
  const tw = t.kind === 'buttress' ? 46 : t.kind === 'umbrella' ? 34 : t.kind === 'palm' ? 18 : 26;
  // 树干（轻微弯曲）
  const bend = (random(`bd${i}`) - 0.5) * 50;
  let trunk = `M${t.x - tw / 2},${GROUND} C${t.x - tw / 2 + bend},${GROUND - t.h * 0.5} ${t.x - tw * 0.3 + bend},${top + 60} ${t.x - 6},${top + 30} L${t.x + 6},${top + 30} C${t.x + tw * 0.3 + bend},${top + 60} ${t.x + tw / 2 + bend},${GROUND - t.h * 0.5} ${t.x + tw / 2},${GROUND} Z`;
  if (t.kind === 'buttress') {
    trunk += ` M${t.x - 160},${GROUND} Q${t.x - 40},${GROUND - 40} ${t.x - 20},${GROUND - 220} L${t.x},${GROUND} Z M${t.x + 160},${GROUND} Q${t.x + 40},${GROUND - 40} ${t.x + 20},${GROUND - 220} L${t.x},${GROUND} Z`;
  }
  const puffs: {x: number; y: number; r: number}[] = [];
  let fronds = '';
  let extra = '';
  const cx = t.x + bend * 0.6;
  if (t.kind === 'umbrella') {
    for (let k = 0; k < 14; k++) {
      const a = (k / 13) * Math.PI;
      puffs.push({x: cx + Math.cos(a) * t.w * 0.48, y: top + 40 - Math.sin(a) * 50, r: 52 + random(`u${k}`) * 22});
    }
    extra = `M${cx},${top + 60} L${cx - t.w * 0.36},${top + 20} M${cx},${top + 60} L${cx + t.w * 0.36},${top + 20} M${cx},${top + 100} L${cx - t.w * 0.22},${top + 40}`;
  } else if (t.kind === 'round' || t.kind === 'buttress' || t.kind === 'vine') {
    const n = t.kind === 'buttress' ? 12 : 9;
    for (let k = 0; k < n; k++) {
      const a = random(`ra${i}${k}`) * Math.PI * 2;
      const rr = random(`rr${i}${k}`) * t.w * 0.32;
      puffs.push({x: cx + Math.cos(a) * rr, y: top + 70 + Math.sin(a) * rr * 0.7, r: 48 + random(`rs${i}${k}`) * 30});
    }
    if (t.kind === 'vine') {
      for (let k = 0; k < 3; k++) {
        let d = `M${t.x - 14 + k * 12},${GROUND}`;
        for (let y = GROUND; y > top + 80; y -= 30) d += ` Q${t.x + (k % 2 ? 30 : -30)},${y - 15} ${t.x - 14 + k * 12},${y - 30}`;
        extra += d + ' ';
        extra += `M${t.x + 60 + k * 40},${top + 80} q-10,${120 + k * 40} 4,${260 + k * 60} `;
      }
    }
  } else if (t.kind === 'cone') {
    for (let k = 0; k < 8; k++) {
      const yy = top + 20 + k * 52;
      const ww = 30 + k * 18;
      puffs.push({x: cx - ww * 0.5, y: yy, r: 30 + k * 4});
      puffs.push({x: cx + ww * 0.5, y: yy, r: 30 + k * 4});
    }
  } else if (t.kind === 'palm') {
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI + (k / 8) * Math.PI;
      const len = 150 + random(`pl${k}`) * 60;
      fronds += `M${cx},${top + 30} Q${cx + Math.cos(a) * len * 0.6},${top + 30 + Math.sin(a) * len * 0.5 - 30} ${cx + Math.cos(a) * len},${top + 30 + Math.sin(a) * len * 0.4 + 60} `;
    }
    puffs.push({x: cx, y: top + 34, r: 22});
  }
  return {trunk, puffs, fronds, extra};
};
