import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {SeatedFigure} from '../components/Folk';
import {fernTuft} from '../components/Plants';
import {lerp, smoothNoise, wobblyCircle} from '../lib/geom';

/**
 * H1 · 火（5 秒 / 150 帧，交叉淡化时可延长到 164 帧）：数十万年前
 *   0– 40  承接第一片森林：林边，天色转入暮色
 *  18– 44  一截枯枝落进石圈
 *  44– 90  火苗腾起，暖光铺开，围坐的人影被映亮，火光在树干上摇曳
 * 100–150  镜头推近火心，火星里浮出一圈圈金色年轮（接 H2 的涟漪）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 868;
const FIRE = {x: 960, y: 852};

export const H1Fire: React.FC = () => {
  const f = useCurrentFrame();
  const dusk = interpolate(f, [0, 44], [0, 1], {...cl, easing: Easing.inOut(Easing.sin)});
  const drop = interpolate(f, [18, 42], [0, 1], {...cl, easing: Easing.in(Easing.quad)});
  const flame = interpolate(f, [42, 84], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const lit = interpolate(f, [46, 92], [0, 1], cl);
  const push = interpolate(f, [96, 152], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const zoom = lerp(1, 3.4, push);
  const flick = 0.85 + 0.15 * smoothNoise(f * 0.35, 'flk', 3);
  const geo = useMemo(() => build(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[30, 14]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="h1" seed={101} />
          <radialGradient id="h1-glow">
            <stop offset="0%" stopColor="#FFD98A" stopOpacity={0.95} />
            <stop offset="45%" stopColor="#F2A646" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F2A646" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="h1-core">
            <stop offset="0%" stopColor="#FFF6DA" />
            <stop offset="60%" stopColor="#FFE3A0" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFE3A0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="h1-ray" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF1C8" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#FFF1C8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${FIRE.x} ${FIRE.y - 40}) scale(${zoom}) translate(${-FIRE.x} ${-FIRE.y + 40})`}>
          {/* 残留的林间光束（承接第 3 镜） */}
          <g style={{mixBlendMode: 'screen'}} opacity={1 - dusk}>
            {[180, 420, 640, 900].map((x, i) => (
              <polygon key={i} points={`${x - 260},-40 ${x - 160},-40 ${x + 900},${H + 40} ${x + 760},${H + 40}`} fill="url(#h1-ray)" opacity={0.45} />
            ))}
          </g>
          {/* 远景林 */}
          <g filter="url(#h1-soft)" opacity={0.5}>
            {geo.far.map((t, i) => (
              <g key={i}>
                <rect x={t.x - t.w / 2} y={t.top} width={t.w} height={GROUND - t.top} fill={C.inkWash} />
                <ellipse cx={t.x} cy={t.top} rx={t.w * 4} ry={t.w * 2.4} fill={C.inkWash} opacity={0.7} />
              </g>
            ))}
          </g>
          {/* 中景树干：被火光映暖 */}
          <g filter="url(#h1-bleed)">
            {geo.mid.map((t, i) => {
              const d = Math.abs(t.x - FIRE.x);
              const warm = lit * Math.max(0, 1 - d / 900) * flick;
              return (
                <g key={i}>
                  <path d={t.d} fill={C.inkSoft} opacity={0.82} />
                  <path d={t.d} fill="#E9A04A" opacity={warm * 0.55} style={{mixBlendMode: 'screen'}} />
                </g>
              );
            })}
            {geo.canopy.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={i % 2 ? '#5C6A4E' : '#6B7A58'} opacity={0.75} />
            ))}
          </g>
          {/* 地面 */}
          <rect x={-400} y={GROUND} width={W + 800} height={600} fill="#CDB896" />
          <g stroke={C.inkSoft} strokeWidth={3} fill="none" opacity={0.55} filter="url(#h1-bleed)">
            {geo.tufts.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* 暖光 */}
          <ellipse cx={FIRE.x} cy={FIRE.y - 30} rx={760 * flame * flick} ry={520 * flame * flick} fill="url(#h1-glow)" style={{mixBlendMode: 'screen'}} />
          <ellipse cx={FIRE.x} cy={GROUND + 10} rx={420 * flame} ry={46 * flame} fill="#FFD48A" opacity={0.45 * flame} />

          {/* 围坐的人：随火光显现 */}
          <g opacity={interpolate(lit, [0, 0.6], [0, 1], cl)}>
            <SeatedFigure x={720} y={GROUND + 6} h={250} face={1} lean={6} color="#2E2620" reach={0.4 + 0.2 * Math.sin(f * 0.08)} />
            <SeatedFigure x={828} y={GROUND + 20} h={230} face={1} lean={-4} color="#352B22" />
            <SeatedFigure x={1112} y={GROUND + 18} h={236} face={-1} lean={4} color="#352B22" reach={0.6} />
            <SeatedFigure x={1228} y={GROUND + 4} h={200} face={-1} lean={-2} color="#2E2620" />
            {/* 人影投在身后的地面 */}
            {[720, 828, 1112, 1228].map((x, i) => (
              <ellipse key={i} cx={x + (x - FIRE.x) * 0.35} cy={GROUND + 18} rx={70} ry={8} fill="#3E3226" opacity={0.22 * flame} />
            ))}
          </g>

          {/* 石圈 */}
          {geo.stones.map((s, i) => (
            <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} fill={i % 2 ? '#8A7A66' : '#6B5C4A'} />
          ))}

          {/* 枯枝落下 */}
          <g transform={`translate(${lerp(760, FIRE.x, drop)} ${lerp(420, FIRE.y - 8, drop)}) rotate(${lerp(-60, 8, drop)})`} opacity={1 - interpolate(f, [70, 100], [0, 0.6], cl)}>
            <path d="M-70,0 L70,-4 M-20,-1 L-44,-22 M30,-2 L50,-20" stroke="#4E3E2E" strokeWidth={9} strokeLinecap="round" fill="none" />
          </g>

          {/* 火焰 */}
          {flame > 0 ? (
            <g transform={`translate(${FIRE.x} ${FIRE.y}) scale(${flame})`}>
              {[
                {c: '#E8862E', w: 70, h: 190, o: 0.9},
                {c: C.gold, w: 52, h: 150, o: 0.95},
                {c: '#FFE7A8', w: 30, h: 96, o: 1},
              ].map((L, k) => (
                <g key={k}>
                  {[-1, 0, 1].map((j) => {
                    const hh = L.h * (0.8 + 0.25 * smoothNoise(f * 0.3 + j * 3 + k, `fl${k}${j}`, 3)) * (j === 0 ? 1 : 0.7);
                    const sway = smoothNoise(f * 0.2 + j * 5, `fs${k}${j}`, 2) * 16;
                    const x0 = j * L.w * 0.45;
                    return (
                      <path
                        key={j}
                        d={`M${x0 - L.w / 2},0 C${x0 - L.w / 2},${-hh * 0.45} ${x0 + sway - 6},${-hh * 0.7} ${x0 + sway},${-hh} C${x0 + sway + 6},${-hh * 0.7} ${x0 + L.w / 2},${-hh * 0.45} ${x0 + L.w / 2},0 Z`}
                        fill={L.c}
                        opacity={L.o}
                      />
                    );
                  })}
                </g>
              ))}
              <path d="M-60,4 L60,-2 M-40,8 L50,10" stroke="#3E3226" strokeWidth={10} strokeLinecap="round" />
            </g>
          ) : null}
          {/* 火星 */}
          {geo.sparks.map((s, i) => {
            const t = ((f - 52) * s.v + s.p) % 90;
            if (f < 52 || t < 0) return null;
            const u = t / 90;
            return (
              <circle
                key={i}
                cx={FIRE.x + s.dx * u * 120 + Math.sin(f * 0.1 + i) * 10}
                cy={FIRE.y - 60 - u * s.h}
                r={2.4 * (1 - u) + 0.6}
                fill="#FFE3A0"
                opacity={(1 - u) * flame}
              />
            );
          })}
        </g>

        {/* 火心里浮出的年轮（屏幕坐标，交给 H2 的涟漪） */}
        <g style={{mixBlendMode: 'screen'}}>
          <circle cx={W / 2} cy={H / 2} r={lerp(0, 900, push)} fill="url(#h1-core)" opacity={push} />
        </g>
        <g fill="none">
          {geo.rings.map((d, i) => {
            const p = interpolate(f, [116 + i * 5, 150 + i * 5], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
            return p > 0 ? (
              <path key={i} d={d} stroke={i % 2 ? C.goldDeep : C.gold} strokeWidth={3 - i * 0.3} opacity={p * 0.85} transform={`translate(${W / 2} ${H / 2}) scale(${0.2 + p * 0.8}) translate(${-W / 2} ${-H / 2})`} />
            ) : null;
          })}
        </g>
      </svg>
      {/* 暮色 */}
      <AbsoluteFill style={{background: `rgba(96,72,58,${0.4 * dusk * (1 - push)})`, mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 72%, rgba(243,234,218,0.55) 88%, rgba(243,234,218,0.75) 100%)'}} />
      <GoldDust count={30} seed="h1d" opacity={0.4 + 0.5 * flame} />
    </AbsoluteFill>
  );
};

const build = () => {
  const far = new Array(16).fill(0).map((_, i) => ({x: i * 130 + random(`h1fx${i}`) * 60, w: 12 + random(`h1fw${i}`) * 10, top: 300 + random(`h1ft${i}`) * 160}));
  const mid = [120, 330, 560, 1380, 1590, 1820].map((x, i) => {
    const w = 34 + random(`h1mw${i}`) * 22;
    const lean = (random(`h1ml${i}`) - 0.5) * 40;
    return {x, d: `M${x - w / 2},${GROUND + 4} C${x - w / 2 + lean * 0.3},${GROUND - 300} ${x - w * 0.3 + lean},${120} ${x - w * 0.25 + lean},-40 L${x + w * 0.25 + lean},-40 C${x + w * 0.3 + lean},${120} ${x + w / 2 + lean * 0.3},${GROUND - 300} ${x + w / 2},${GROUND + 4} Z`};
  });
  const canopy = new Array(30).fill(0).map((_, i) => ({x: (i / 29) * (W + 200) - 100 + random(`h1cx${i}`) * 50, y: -30 + random(`h1cy${i}`) * 130, r: 80 + random(`h1cr${i}`) * 60}));
  const tufts = new Array(14).fill(0).map((_, i) => fernTuft(i * 150 + random(`h1tf${i}`) * 60, GROUND + 6, 50 + random(`h1ts${i}`) * 40, `h1tf${i}`));
  const stones = new Array(11).fill(0).map((_, i) => {
    const a = (i / 11) * Math.PI * 2;
    return {x: FIRE.x + Math.cos(a) * 74, y: FIRE.y + 6 + Math.sin(a) * 14, rx: 15 + random(`h1sr${i}`) * 6, ry: 9 + random(`h1sy${i}`) * 3};
  }).sort((a, b) => a.y - b.y);
  const sparks = new Array(26).fill(0).map((_, i) => ({dx: random(`h1sx${i}`) - 0.5, v: 0.8 + random(`h1sv${i}`) * 0.9, p: random(`h1sp${i}`) * 90, h: 260 + random(`h1sh${i}`) * 280}));
  const rings = [90, 170, 250, 340, 440, 560].map((r, i) => wobblyCircle(W / 2, H / 2, r, `h1r${i}`, 0.03));
  return {far, mid, canopy, tufts, stones, sparks, rings};
};
