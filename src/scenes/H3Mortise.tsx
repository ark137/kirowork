import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {WalkFigure} from '../components/Folk';
import {fernTuft} from '../components/Plants';
import {lerp, ridgePath, smoothNoise} from '../lib/geom';

/**
 * H3 · 榫卯（7 秒 / 210 帧）：约 7000 年前，河姆渡
 * A   0– 96  特写：横梁带着榫头推向立柱，“咔”地插进卯眼；木纹描出一道金线，从梁一路走进柱子
 * B  86–112  特写缩小、化入远景
 * C  96–224  水边干栏式木屋：桩柱一根根立起 → 架高的地板铺开（金色一闪）→ 编墙、茅草顶；有人登上地板
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

// 特写几何
const POST_X = 930; // 立柱正面左缘
const POST_W = 170;
const SIDE = 46; // 侧面宽度（透视）
const BEAM_Y = 452;
const BEAM_H = 136;
const TENON = {y: 486, h: 68, len: 120};
const HIT = 58;

// 远景几何
const WATER = 770;
const FLOOR = 640;
const HOUSES = [
  {x: 470, w: 320, t: 100},
  {x: 960, w: 380, t: 110},
  {x: 1440, w: 320, t: 120},
];

export const H3Mortise: React.FC = () => {
  const f = useCurrentFrame();

  // ── A ──
  const slide = interpolate(f, [8, HIT], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const shoulderX = lerp(-140, POST_X - SIDE, slide);
  const shake = f >= HIT && f < HIT + 8 ? Math.sin((f - HIT) * 2.4) * (HIT + 8 - f) * 0.6 : 0;
  const gold = interpolate(f, [HIT + 2, HIT + 34], [0, 1], {...cl, easing: io});
  const dust = interpolate(f, [HIT, HIT + 22], [0, 1], cl);
  const closeOut = interpolate(f, [88, 112], [0, 1], {...cl, easing: io});
  const closeScale = lerp(1, 0.32, closeOut);

  // ── C ──
  const wideIn = interpolate(f, [92, 112], [0, 1], cl);
  const wideScale = lerp(1.5, 1, interpolate(f, [92, 130], [0, 1], {...cl, easing: Easing.out(Easing.cubic)})) * lerp(1, 1.04, interpolate(f, [130, 224], [0, 1], cl));
  const post = (h: number, k: number) => interpolate(f, [100 + h * 8 + k * 3, 118 + h * 8 + k * 3], [0, 1], {...cl, easing: Easing.out(Easing.back(1.2))});
  const floor = (h: number) => interpolate(f, [134 + h * 6, 150 + h * 6], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const floorGlow = interpolate(f, [146, 160, 196], [0, 1, 0.25], cl);
  const wall = (h: number) => interpolate(f, [156 + h * 6, 174 + h * 6], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const roof = (h: number) => interpolate(f, [168 + h * 6, 188 + h * 6], [0, 1], {...cl, easing: Easing.out(Easing.back(1.3))});
  const climb = interpolate(f, [176, 214], [0, 1], {...cl, easing: Easing.inOut(Easing.quad)});

  const geo = useMemo(() => build(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 30]} />

      {/* ═══ C：干栏式木屋（先画在下层） ═══ */}
      {wideIn > 0 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: wideIn}}>
          <defs>
            <InkDefs p="h3w" seed={123} />
            <linearGradient id="h3-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9DECF" />
              <stop offset="100%" stopColor="#EEE7D6" />
            </linearGradient>
            <radialGradient id="h3-floorglow">
              <stop offset="0%" stopColor="#FFE7A0" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFE7A0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <g transform={`translate(${W / 2} ${FLOOR}) scale(${wideScale}) translate(${-W / 2} ${-FLOOR})`}>
            <path d={geo.far} fill={C.inkWash} opacity={0.2} filter="url(#h3w-wash)" />
            <path d={geo.mid} fill={C.inkWash} opacity={0.3} filter="url(#h3w-wash)" />
            {/* 远处的林 */}
            <g filter="url(#h3w-soft)" opacity={0.55}>
              {geo.trees.map((t, i) => (
                <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={i % 2 ? '#A9B98F' : '#9DB083'} />
              ))}
            </g>
            <rect x={-400} y={WATER} width={W + 800} height={600} fill="url(#h3-water)" />
            <g stroke={C.inkWash} strokeOpacity={0.26} strokeWidth={1.6} strokeLinecap="round">
              {geo.ripples.map((r, i) => {
                const x = ((r.x + f * r.v) % (W + 400)) - 200;
                return <line key={i} x1={x} y1={r.y} x2={x + r.l} y2={r.y} />;
              })}
            </g>
            {HOUSES.map((hs, h) => {
              const x0 = hs.x - hs.w / 2;
              const nPost = 6;
              const fl = floor(h);
              const wl = wall(h);
              const rf = roof(h);
              return (
                <g key={h} filter="url(#h3w-bleed)">
                  {/* 桩柱（含水中倒影） */}
                  {new Array(nPost).fill(0).map((_, k) => {
                    const p = post(h, k);
                    if (p <= 0) return null;
                    const px = x0 + 14 + (k / (nPost - 1)) * (hs.w - 28);
                    const top = WATER + 40 - (WATER + 40 - FLOOR + 6) * p;
                    return (
                      <g key={k}>
                        <rect x={px - 7} y={top} width={14} height={WATER + 40 - top} fill="#6E5238" />
                        <rect x={px - 7} y={WATER + 40} width={14} height={60 * p} fill="#6E5238" opacity={0.18} />
                      </g>
                    );
                  })}
                  {/* 架高的地板 */}
                  {fl > 0 ? (
                    <g>
                      <rect x={hs.x - (hs.w / 2 + 20) * fl} y={FLOOR - 4} width={(hs.w + 40) * fl} height={16} fill="#A47A4C" stroke="#5E4430" strokeWidth={2} />
                      <g stroke="#7A5A3A" strokeWidth={1.4}>
                        {new Array(16).fill(0).map((__, k) => {
                          const x = hs.x - (hs.w / 2 + 20) * fl + k * ((hs.w + 40) * fl) / 16;
                          return <line key={k} x1={x} y1={FLOOR - 4} x2={x} y2={FLOOR + 12} />;
                        })}
                      </g>
                    </g>
                  ) : null}
                  {/* 编织墙 */}
                  {wl > 0 ? (
                    <g>
                      <rect x={x0 + 24} y={FLOOR - 4 - 110 * wl} width={hs.w - 48} height={110 * wl} fill="#C9AE84" />
                      <g stroke="#8C6E4A" strokeWidth={2} opacity={0.7}>
                        {new Array(Math.floor((hs.w - 48) / 18)).fill(0).map((__, k) => (
                          <line key={k} x1={x0 + 32 + k * 18} y1={FLOOR - 4 - 110 * wl} x2={x0 + 32 + k * 18} y2={FLOOR - 4} />
                        ))}
                        {[0.3, 0.6].map((t) => (
                          <line key={t} x1={x0 + 24} y1={FLOOR - 4 - 110 * wl * t} x2={x0 + hs.w - 24} y2={FLOOR - 4 - 110 * wl * t} />
                        ))}
                      </g>
                      <rect x={hs.x - 26} y={FLOOR - 4 - 80 * wl} width={52} height={80 * wl} fill="#4E3E2E" opacity={0.8} />
                    </g>
                  ) : null}
                  {/* 茅草顶 */}
                  {rf > 0 ? (
                    <g transform={`translate(0 ${(1 - rf) * -80})`} opacity={Math.min(1, rf * 2)}>
                      <path d={`M${x0 - 36},${FLOOR - 104} L${hs.x},${FLOOR - 104 - hs.w * 0.42} L${x0 + hs.w + 36},${FLOOR - 104} Z`} fill="#8E7A58" />
                      <g stroke="#6B5A40" strokeWidth={2} opacity={0.6}>
                        {new Array(14).fill(0).map((__, k) => {
                          const t = (k + 0.5) / 14;
                          const bx = lerp(x0 - 36, x0 + hs.w + 36, t);
                          return <line key={k} x1={hs.x + (bx - hs.x) * 0.15} y1={FLOOR - 104 - hs.w * 0.36} x2={bx} y2={FLOOR - 104} />;
                        })}
                      </g>
                      <line x1={hs.x - 14} y1={FLOOR - 104 - hs.w * 0.42 - 16} x2={hs.x + 14} y2={FLOOR - 104 - hs.w * 0.42 + 12} stroke="#5E4430" strokeWidth={5} />
                      <line x1={hs.x + 14} y1={FLOOR - 104 - hs.w * 0.42 - 16} x2={hs.x - 14} y2={FLOOR - 104 - hs.w * 0.42 + 12} stroke="#5E4430" strokeWidth={5} />
                    </g>
                  ) : null}
                </g>
              );
            })}
            {/* 地板上的金色一闪（“架高的地板”） */}
            <g style={{mixBlendMode: 'screen'}} opacity={floorGlow}>
              {HOUSES.map((hs, h) => (
                <ellipse key={h} cx={hs.x} cy={FLOOR + 4} rx={hs.w * 0.7} ry={34} fill="url(#h3-floorglow)" />
              ))}
            </g>
            {/* 独木梯与登上地板的人 */}
            <g opacity={interpolate(f, [170, 182], [0, 1], cl)}>
              <path d={`M1186,${WATER + 30} L1150,${FLOOR + 10}`} stroke="#6E5238" strokeWidth={12} strokeLinecap="round" />
              {[0.2, 0.4, 0.6, 0.8].map((t) => (
                <line key={t} x1={lerp(1186, 1150, t) - 9} y1={lerp(WATER + 30, FLOOR + 10, t)} x2={lerp(1186, 1150, t) + 9} y2={lerp(WATER + 30, FLOOR + 10, t)} stroke="#4E3E2E" strokeWidth={3} />
              ))}
              <WalkFigure x={lerp(1196, 1110, climb)} y={lerp(WATER + 26, FLOOR - 4, Math.min(1, climb * 1.25))} h={150} face={-1} step={f * 0.35} walk={climb < 1 ? 1 : 0} color="#2E2620" />
            </g>
            {/* 前景芦苇 */}
            <g stroke={C.leaf} strokeWidth={5} fill="none" opacity={0.7} strokeLinecap="round" filter="url(#h3w-bleed)">
              {geo.reeds.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>
        </svg>
      ) : null}

      {/* ═══ A：榫卯特写 ═══ */}
      {closeOut < 1 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - closeOut}}>
          <defs>
            <InkDefs p="h3c" seed={121} />
            <clipPath id="h3-beamclip">
              <rect x={-400} y={0} width={POST_X - SIDE / 2 + 400} height={H} />
            </clipPath>
            <radialGradient id="h3-goldglow">
              <stop offset="0%" stopColor="#FFE7A0" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#FFE7A0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="#F1E6D0" />
          <g transform={`translate(${W / 2 + shake} ${H / 2}) scale(${closeScale}) translate(${-W / 2} ${-H / 2})`}>
            {/* 立柱：侧面 + 正面 */}
            <g filter="url(#h3c-bleed)">
              <path d={`M${POST_X - SIDE},-60 L${POST_X},-80 L${POST_X},${H + 80} L${POST_X - SIDE},${H + 100} Z`} fill="#8E643C" />
              <rect x={POST_X} y={-80} width={POST_W} height={H + 160} fill="#B98A58" />
              {/* 卯眼 */}
              <path d={`M${POST_X - SIDE + 6},${TENON.y + 6} L${POST_X - 6},${TENON.y - 2} L${POST_X - 6},${TENON.y + TENON.h - 6} L${POST_X - SIDE + 6},${TENON.y + TENON.h + 2} Z`} fill="#3E2E20" />
            </g>
            <g stroke="#8C6440" strokeWidth={2} fill="none" opacity={0.55}>
              {geo.postGrain.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {/* 横梁 + 榫头（插入后被柱子挡住） */}
            <g clipPath="url(#h3-beamclip)">
              <g filter="url(#h3c-bleed)">
                <rect x={shoulderX + TENON.len - 4} y={TENON.y} width={TENON.len} height={TENON.h} fill="#B88655" stroke="#5E4430" strokeWidth={3} transform={`translate(${-TENON.len} 0)`} />
                <rect x={shoulderX - 1400} y={BEAM_Y} width={1400} height={BEAM_H} fill="#C49464" stroke="#5E4430" strokeWidth={3} />
              </g>
              <g stroke="#8C6440" strokeWidth={2} fill="none" opacity={0.5} transform={`translate(${shoulderX} 0)`}>
                {geo.beamGrain.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </g>
            {/* “咔”：木屑尘 */}
            {dust > 0 && dust < 1
              ? new Array(10).fill(0).map((_, j) => {
                  const a = -Math.PI / 2 + (random(`h3da${j}`) - 0.5) * 2.6;
                  const v = 60 + random(`h3dv${j}`) * 90;
                  return <circle key={j} cx={POST_X - SIDE + Math.cos(a) * v * dust} cy={BEAM_Y + BEAM_H / 2 + Math.sin(a) * v * dust} r={4 * (1 - dust) + 1} fill="#D9BE8E" opacity={1 - dust} />;
                })
              : null}
            {/* 金线：沿木纹从梁走进柱子 */}
            <path d={`M-100,${BEAM_Y + BEAM_H / 2} L${POST_X - SIDE},${BEAM_Y + BEAM_H / 2} C${POST_X + 30},${BEAM_Y + BEAM_H / 2} ${POST_X + 70},${BEAM_Y + 20} ${POST_X + 76},${BEAM_Y - 120} L${POST_X + 80},-100`} fill="none" stroke="#FFE7A0" strokeWidth={14} strokeLinecap="round" opacity={0.35 * gold} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
            <path d={`M-100,${BEAM_Y + BEAM_H / 2} L${POST_X - SIDE},${BEAM_Y + BEAM_H / 2} C${POST_X + 30},${BEAM_Y + BEAM_H / 2} ${POST_X + 70},${BEAM_Y + 20} ${POST_X + 76},${BEAM_Y - 120} L${POST_X + 80},-100`} fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
            <circle cx={POST_X - SIDE / 2} cy={BEAM_Y + BEAM_H / 2} r={120} fill="url(#h3-goldglow)" opacity={interpolate(f, [HIT, HIT + 6, HIT + 40], [0, 0.9, 0.2], cl)} style={{mixBlendMode: 'screen'}} />
          </g>
        </svg>
      ) : null}

      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.55) 88%, rgba(243,234,218,0.75) 100%)'}} />
      <GoldDust count={26} seed="h3d" opacity={0.55} />
    </AbsoluteFill>
  );
};

const build = () => {
  const postGrain = new Array(7).fill(0).map((_, i) => {
    const x0 = POST_X + 16 + i * 23;
    let d = '';
    for (let y = -80; y <= H + 80; y += 30) d += `${d ? 'L' : 'M'}${(x0 + smoothNoise(y * 0.006 + i, `h3pg${i}`, 3) * 8).toFixed(1)},${y} `;
    return d;
  });
  const beamGrain = new Array(5).fill(0).map((_, i) => {
    const y0 = BEAM_Y + 18 + i * 25;
    let d = '';
    for (let x = -1400; x <= 0; x += 40) d += `${d ? 'L' : 'M'}${x},${(y0 + smoothNoise(x * 0.004 + i * 2, `h3bg${i}`, 3) * 6).toFixed(1)} `;
    return d;
  });
  const far = ridgePath(W + 800, 470, 150, 'h3far', WATER, 12, 0.0026);
  const mid = ridgePath(W + 800, 560, 80, 'h3mid', WATER, 12, 0.005);
  const trees = new Array(40).fill(0).map((_, i) => ({x: i * 52 - 40 + random(`h3tx${i}`) * 30, y: WATER - 60 - random(`h3ty${i}`) * 60, r: 40 + random(`h3tr${i}`) * 30}));
  const ripples = new Array(26).fill(0).map((_, i) => ({x: random(`h3rx${i}`) * (W + 400), y: WATER + 60 + random(`h3ry${i}`) * 260, l: 40 + random(`h3rl${i}`) * 110, v: 0.3 + random(`h3rv${i}`) * 0.4}));
  const reeds = [30, 110, 1760, 1850, 1900].map((x, i) => fernTuft(x, H + 10, 160 + i * 12, `h3rd${i}`));
  return {postGrain, beamGrain, far, mid, trees, ripples, reeds};
};
