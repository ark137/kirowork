import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {smoothNoise} from '../lib/geom';

/**
 * 第 8 镜（6 秒 / 180 帧）：数千万年后，亚马逊
 * A  0–96   水墨地图：南美与非洲从相拥处缓缓漂开，海洋墨晕铺开；亚马逊河自西向东描出，绿意沿流域洇开
 * B 84–180  推入流域 → 雨林俯瞰：层层树冠、蜿蜒河流、云雾升腾、鸟群掠过
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 简化的大陆轮廓（各自局部坐标）
const SA = [[130,20],[200,10],[262,40],[322,72],[392,128],[404,172],[372,222],[334,272],[302,332],[252,384],[222,432],[192,482],[170,506],[158,472],[170,420],[160,362],[150,302],[120,242],[80,202],[58,150],[80,100],[110,60]];
const AF = [[100,20],[220,0],[300,30],[342,82],[420,150],[440,182],[402,232],[372,302],[332,382],[292,442],[262,482],[232,472],[212,402],[200,332],[180,272],[140,242],[80,232],[30,200],[10,150],[30,80]];
const RIVER = 'M92,170 C130,150 160,182 196,166 C232,150 252,178 288,162 C320,148 344,156 372,148';
const TRIBS = ['M150,170 C140,210 130,240 120,268', 'M196,166 C200,210 214,246 230,272', 'M252,170 C262,130 252,100 236,80', 'M300,160 C312,200 316,236 300,270', 'M330,154 C340,120 330,96 318,74'];

const blob = (pts: number[][], seed: string) => {
  // 用中点二次曲线把多边形变圆润，再加轻微抖动
  const j = pts.map(([x, y], i) => [x + (random(`${seed}x${i}`) - 0.5) * 6, y + (random(`${seed}y${i}`) - 0.5) * 6]);
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = '';
  for (let i = 0; i < j.length; i++) {
    const p = j[i];
    const n = j[(i + 1) % j.length];
    const m = mid(p, n);
    if (i === 0) d += `M${mid(j[j.length - 1], p).join(',')} `;
    d += `Q${p[0]},${p[1]} ${m[0]},${m[1]} `;
  }
  return d + 'Z';
};

export const S8Amazon: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);

  // ── A：地图 ──
  const drift = interpolate(f, [0, 80], [0, 1], {...cl, easing: io});
  const sea = interpolate(f, [0, 60], [0, 1], cl);
  const river = interpolate(f, [34, 78], [0, 1], {...cl, easing: io});
  const green = interpolate(f, [52, 96], [0, 1], {...cl, easing: io});
  const mapZoom = interpolate(f, [70, 112], [1, 3.6], {...cl, easing: Easing.in(Easing.cubic)});
  const mapOpacity = interpolate(f, [96, 114], [1, 0], cl);
  const saX = 640 - drift * 120;
  const afX = 860 + drift * 190;
  const saPath = useMemo(() => blob(SA, 'sa'), []);
  const afPath = useMemo(() => blob(AF, 'af'), []);

  // ── B：雨林俯瞰 ──
  const forestIn = interpolate(f, [96, 120], [0, 1], cl);
  const fly = interpolate(f, [96, 180], [0, 1], cl);
  const crowns = useMemo(() => buildCrowns(), []);
  const riverB = useMemo(() => {
    let d = 'M-100,760';
    for (let x = -100; x <= W + 200; x += 40) {
      const y = 640 + smoothNoise(x * 0.004, 'riv', 3) * 150 + (x - 960) * 0.06;
      d += ` L${x},${y.toFixed(1)}`;
    }
    return d;
  }, []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[55, 35]} />

      {/* ── A：水墨地图 ── */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: mapOpacity}}>
        <defs>
          <InkDefs p="s8" seed={41} />
          <radialGradient id="s8-sea" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#C9D6D2" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#C9D6D2" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="s8-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.leaf} stopOpacity={0.75} />
            <stop offset="100%" stopColor={C.leaf} stopOpacity={0} />
          </radialGradient>
          <clipPath id="s8-sa-clip">
            <path d={saPath} />
          </clipPath>
        </defs>
        <g transform={`translate(${saX + 230} 560) scale(${mapZoom}) translate(${-saX - 230} -560)`}>
          <ellipse cx={W / 2} cy={H / 2} rx={900 * sea} ry={520 * sea} fill="url(#s8-sea)" filter="url(#s8-wash)" />
          {/* 经纬线 */}
          <g stroke={C.inkWash} strokeOpacity={0.12} strokeWidth={1.2} fill="none">
            {[-2, -1, 0, 1, 2].map((k) => (
              <ellipse key={k} cx={W / 2} cy={H / 2} rx={Math.abs(k) * 180 + 2} ry={460} />
            ))}
            {[-2, -1, 0, 1, 2].map((k) => (
              <line key={`h${k}`} x1={200} y1={H / 2 + k * 110} x2={W - 200} y2={H / 2 + k * 110} />
            ))}
          </g>
          {/* 非洲 */}
          <g transform={`translate(${afX} 300) rotate(${drift * 6})`}>
            <path d={afPath} fill={C.paperDeep} stroke={C.inkSoft} strokeWidth={3} strokeOpacity={0.6} filter="url(#s8-bleed)" />
          </g>
          {/* 南美 */}
          <g transform={`translate(${saX} 300) rotate(${-drift * 8} 200 260)`}>
            <path d={saPath} fill={C.paperDeep} stroke={C.inkSoft} strokeWidth={3} strokeOpacity={0.6} filter="url(#s8-bleed)" />
            <g clipPath="url(#s8-sa-clip)">
              <ellipse cx={230} cy={170} rx={220 * green} ry={130 * green} fill="url(#s8-green)" filter="url(#s8-wash)" />
            </g>
            <g fill="none" stroke="#5C7E8C" strokeLinecap="round" filter="url(#s8-bleed)">
              <path d={RIVER} strokeWidth={5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - river} />
              {TRIBS.map((d, i) => (
                <path key={i} d={d} strokeWidth={2.4} strokeOpacity={0.8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - interpolate(river, [0.3 + i * 0.1, 0.8 + i * 0.04], [0, 1], cl)} />
              ))}
            </g>
            <text x={230} y={128} textAnchor="middle" fontFamily={sans} fontSize={15} letterSpacing={6} fill={C.inkSoft} opacity={green}>
              AMAZONIA
            </text>
          </g>
          {/* 水汽：从大西洋飘向陆地的云 */}
          {new Array(10).fill(0).map((_, i) => {
            const t = ((f * 0.008 + i / 10) % 1);
            const x = 1000 - t * 420;
            const y = 420 + random(`cl${i}`) * 140;
            return <ellipse key={i} cx={x} cy={y} rx={40 + random(`cr${i}`) * 30} ry={14} fill="#FBF6EC" opacity={Math.sin(t * Math.PI) * 0.75 * sea} filter="url(#s8-soft)" />;
          })}
        </g>
      </svg>

      {/* ── B：雨林俯瞰 ── */}
      <AbsoluteFill style={{opacity: forestIn}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <InkDefs p="s8b" seed={43} />
            <linearGradient id="s8-haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4EEDD" />
              <stop offset="100%" stopColor="#DCE3CC" />
            </linearGradient>
            <linearGradient id="s8-river" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E9E2C8" />
              <stop offset="50%" stopColor="#FFF4D2" />
              <stop offset="100%" stopColor="#E9E2C8" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#s8-haze)" />
          <g transform={`translate(${W / 2} ${H / 2}) scale(${1.15 + fly * 0.14}) translate(${-W / 2 - fly * 60} ${-H / 2 + fly * 30})`}>
            {/* 远—中—近三层树冠 */}
            {[0, 1, 2].map((layer) => (
              <g key={layer} filter={layer === 0 ? 'url(#s8b-soft)' : 'url(#s8b-bleed)'}>
                {crowns
                  .filter((c) => c.layer === layer)
                  .map((c, i) => (
                    <g key={i}>
                      {c.puffs.map((p, k) => (
                        <circle key={k} cx={p.x} cy={p.y} r={p.r} fill={[['#B9C7A2', '#A9B98E'], ['#8FA676', '#7E9766'], ['#5F7F55', '#4F7048']][layer][k % 2]} opacity={[0.55, 0.8, 0.95][layer]} />
                      ))}
                    </g>
                  ))}
                {layer === 1 ? (
                  <g>
                    <path d={riverB} fill="none" stroke="url(#s8-river)" strokeWidth={70} strokeLinecap="round" opacity={0.95} />
                    <path d={riverB} fill="none" stroke="#FFF8E2" strokeWidth={10} strokeOpacity={0.5} />
                  </g>
                ) : null}
              </g>
            ))}
            {/* 云雾升腾 */}
            {new Array(14).fill(0).map((_, i) => {
              const t = ((f * 0.006 + i / 14) % 1);
              const x = random(`mx${i}`) * W;
              const y = 900 - t * 700;
              return <ellipse key={i} cx={x} cy={y} rx={160 + random(`mr${i}`) * 140} ry={44} fill="#FBF8EE" opacity={Math.sin(t * Math.PI) * 0.6} filter="url(#s8b-soft)" />;
            })}
          </g>
          {/* 鸟群 */}
          <g stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.6}>
            {new Array(7).fill(0).map((_, i) => {
              const x = interpolate(f, [110, 180], [-100 - i * 40, 900 - i * 40]);
              const y = 300 + i * 18 + Math.sin(f * 0.1 + i) * 6;
              const w = 10 + Math.sin(f * 0.5 + i) * 4;
              return <path key={i} d={`M${x - 12},${y} Q${x - 6},${y - w} ${x},${y} Q${x + 6},${y - w} ${x + 12},${y}`} />;
            })}
          </g>
        </svg>
      </AbsoluteFill>
      <GoldDust count={26} seed="s8d" opacity={0.5} />
    </AbsoluteFill>
  );
};

type Crown = {layer: number; puffs: {x: number; y: number; r: number}[]};
const buildCrowns = (): Crown[] => {
  const out: Crown[] = [];
  const conf = [
    {layer: 0, n: 60, r: [40, 70], yMin: -100, yMax: 1200},
    {layer: 1, n: 70, r: [55, 95], yMin: -100, yMax: 1200},
    {layer: 2, n: 26, r: [80, 130], yMin: 650, yMax: 1250},
  ];
  for (const c of conf) {
    for (let i = 0; i < c.n; i++) {
      const cx = random(`cx${c.layer}${i}`) * (W + 400) - 200;
      const cy = c.yMin + random(`cy${c.layer}${i}`) * (c.yMax - c.yMin);
      const r = c.r[0] + random(`cr${c.layer}${i}`) * (c.r[1] - c.r[0]);
      const puffs = new Array(5).fill(0).map((_, k) => ({
        x: cx + Math.cos((k / 5) * Math.PI * 2) * r * 0.45,
        y: cy + Math.sin((k / 5) * Math.PI * 2) * r * 0.4,
        r: r * (0.55 + random(`pr${c.layer}${i}${k}`) * 0.25),
      }));
      out.push({layer: c.layer, puffs});
    }
  }
  return out;
};
