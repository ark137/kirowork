import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {cooksonia, fernTuft, mossClump} from '../components/Plants';
import {ridgePath} from '../lib/geom';

/**
 * 第 2 镜（7 秒 / 210 帧）：约 4 亿年前
 * A 段 0–118：荒芜大地，苔藓与裸蕨从地面冒出，镜头缓推
 * B 段 108–210：急推进裸蕨茎秆 → 细胞横切面；细胞壁里金色“骨架”（木质素）逐圈生长
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 820;
const HERO = {x: 1010, y: GROUND + 6, h: 250};

export const S2Lignin: React.FC = () => {
  const f = useCurrentFrame();

  // ── A 段：荒原 ──
  const ridges = useMemo(
    () => [
      ridgePath(W, 690, 210, 's2far', GROUND, 14, 0.0022),
      ridgePath(W, 740, 150, 's2mid', GROUND, 12, 0.0035),
      ridgePath(W, 790, 80, 's2near', GROUND + 40, 10, 0.006),
    ],
    [],
  );
  const plants = useMemo(() => {
    const list = [
      {x: HERO.x, y: HERO.y, h: HERO.h, s: 'hero'},
      {x: 860, y: GROUND + 12, h: 150, s: 'p1'},
      {x: 1150, y: GROUND + 18, h: 120, s: 'p2'},
      {x: 760, y: GROUND + 26, h: 90, s: 'p3'},
      {x: 1270, y: GROUND + 30, h: 160, s: 'p4'},
      {x: 560, y: GROUND + 34, h: 110, s: 'p5'},
      {x: 1460, y: GROUND + 40, h: 96, s: 'p6'},
      {x: 380, y: GROUND + 50, h: 130, s: 'p7'},
    ];
    return list.map((p, i) => ({...p, i, ...cooksonia(p.x, p.y, p.h, p.s)}));
  }, []);
  const moss = useMemo(
    () =>
      [
        [640, GROUND + 30, 180],
        [930, GROUND + 22, 260],
        [1220, GROUND + 34, 220],
        [1520, GROUND + 52, 200],
        [300, GROUND + 64, 240],
      ].flatMap(([x, y, w], k) => mossClump(x, y, w, `m${k}`, 30).map((d) => ({...d, k}))),
    [],
  );
  const tufts = useMemo(
    () => [
      fernTuft(470, GROUND + 70, 60, 't1'),
      fernTuft(1380, GROUND + 64, 48, 't2'),
      fernTuft(1640, GROUND + 90, 70, 't3'),
      fernTuft(220, GROUND + 110, 64, 't4'),
    ],
    [],
  );
  const rocks = useMemo(
    () =>
      [
        [180, GROUND + 120, 120, 40],
        [1700, GROUND + 130, 160, 48],
        [1120, GROUND + 96, 70, 20],
      ].map(([x, y, w, h], i) => {
        const j = (k: string) => (random(`rk${i}${k}`) - 0.5) * w * 0.2;
        return `M${x - w / 2},${y} C${x - w / 2 + j('a')},${y - h} ${x + j('b')},${y - h * 1.3} ${x + w * 0.2},${y - h * 0.9} C${x + w / 2},${y - h * 0.6} ${x + w / 2 + j('c')},${y - h * 0.2} ${x + w / 2},${y} Z`;
      }),
    [],
  );

  // 镜头：A 段缓推；B 段快速推进到主茎秆
  const push = interpolate(f, [0, 100], [1, 1.12], {...cl, easing: Easing.inOut(Easing.sin)});
  const dive = interpolate(f, [96, 132], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const sceneScale = push * (1 + dive * 9);
  const focusX = HERO.x;
  const focusY = HERO.y - HERO.h * 0.42;
  const landOpacity = interpolate(f, [112, 130], [1, 0], cl);
  const plantGrow = (i: number) => interpolate(f, [8 + i * 6, 70 + i * 6], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});

  // ── B 段：细胞 ──
  const cellIn = interpolate(f, [114, 136], [0, 1], cl);
  const cellScale = interpolate(f, [114, 210], [1.5, 1.06], {...cl, easing: Easing.out(Easing.cubic)});
  const cells = useMemo(() => buildCells(), []);
  const labelIn = interpolate(f, [168, 186], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});

  return (
    <AbsoluteFill>
      <Paper glowAt={[62, 30]} />
      {/* ── A 段 ── */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: landOpacity}}>
        <defs>
          <InkDefs p="s2" seed={9} />
          <linearGradient id="s2-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9DCC4" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#F6EEDF" stopOpacity={0} />
          </linearGradient>
          {['far', 'mid', 'near'].map((k, i) => (
            <linearGradient key={k} id={`s2-r-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.inkWash} stopOpacity={[0.2, 0.32, 0.5][i]} />
              <stop offset="100%" stopColor={C.inkWash} stopOpacity={[0.02, 0.05, 0.12][i]} />
            </linearGradient>
          ))}
          <linearGradient id="s2-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9C6A2" />
            <stop offset="100%" stopColor="#EADCC0" />
          </linearGradient>
          <radialGradient id="s2-sun">
            <stop offset="0%" stopColor="#FFF4D6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#FFF4D6" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={W} height={GROUND} fill="url(#s2-sky)" />
        <g transform={`translate(${focusX} ${focusY}) scale(${sceneScale}) translate(${-focusX} ${-focusY})`}>
          {/* 远处的薄日 */}
          <g transform={`translate(${-(push - 1) * 300} 0)`}>
            <circle cx={1300} cy={300} r={260} fill="url(#s2-sun)" />
            <circle cx={1300} cy={300} r={58} fill="#FFF8E6" opacity={0.85} />
          </g>
          <path d={ridges[0]} fill="url(#s2-r-far)" filter="url(#s2-wash)" />
          <path d={ridges[1]} fill="url(#s2-r-mid)" filter="url(#s2-wash)" />
          <path d={ridges[2]} fill="url(#s2-r-near)" filter="url(#s2-bleed)" />
          <rect x={-200} y={GROUND} width={W + 400} height={H - GROUND + 200} fill="url(#s2-ground)" />
          {/* 地面干裂纹理 */}
          <g stroke={C.inkWash} strokeOpacity={0.25} strokeWidth={1.4} fill="none" filter="url(#s2-bleed)">
            {new Array(18).fill(0).map((_, i) => {
              const x = random(`cr${i}`) * W;
              const y = GROUND + 30 + random(`cry${i}`) * 220;
              const l = 60 + random(`crl${i}`) * 140;
              return <path key={i} d={`M${x},${y} l${l * 0.4},${-6 + random(`a${i}`) * 12} l${l * 0.3},${-8 + random(`b${i}`) * 16} l${l * 0.3},${-4 + random(`c${i}`) * 8}`} />;
            })}
          </g>
          {rocks.map((d, i) => (
            <path key={i} d={d} fill={C.inkSoft} opacity={0.55} filter="url(#s2-bleed)" />
          ))}
          {/* 苔藓 */}
          {moss.map((m, i) => {
            const d0 = 4 + m.k * 8 + m.v * 24;
            const g = interpolate(f, [d0, d0 + 30], [0, 1], cl);
            return <circle key={i} cx={m.x} cy={m.y} r={m.r * g} fill={m.k % 2 ? C.moss : '#93A06A'} opacity={0.55 + m.v * 0.35} />;
          })}
          {/* 蕨丛 */}
          <g stroke={C.inkSoft} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} filter="url(#s2-bleed)">
            {tufts.map((d, i) => (
              <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - plantGrow(i + 2)} />
            ))}
          </g>
          {/* 裸蕨：茎描边生长 + 顶端孢子囊 */}
          {plants.map((p) => {
            const g = plantGrow(p.i);
            const hero = p.s === 'hero';
            return (
              <g key={p.s} filter="url(#s2-bleed)">
                <path
                  d={p.stems}
                  fill="none"
                  stroke={hero ? '#55603A' : C.inkSoft}
                  strokeOpacity={hero ? 0.95 : 0.6}
                  strokeWidth={hero ? 5 : 3}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - g}
                />
                {p.tips.map((t, j) => (
                  <ellipse
                    key={j}
                    cx={t.x}
                    cy={t.y - 2}
                    rx={t.r * (hero ? 1.5 : 1) * Math.max(0, g * 1.6 - 0.6)}
                    ry={t.r * (hero ? 2 : 1.3) * Math.max(0, g * 1.6 - 0.6)}
                    fill={hero ? C.goldDeep : C.inkWash}
                    opacity={hero ? 0.9 : 0.6}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── B 段：细胞横切面 ── */}
      <AbsoluteFill style={{opacity: cellIn}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 75% at 50% 48%, #F7F3E3 0%, #ECE6CC 60%, #DCD3B0 100%)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <InkDefs p="s2c" seed={21} />
            <radialGradient id="s2-cell" cx="45%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#F4F2DC" />
              <stop offset="70%" stopColor="#DCE2BC" />
              <stop offset="100%" stopColor="#C6D19E" />
            </radialGradient>
            <radialGradient id="s2-vig" cx="50%" cy="50%" r="60%">
              <stop offset="60%" stopColor="#F7F3E3" stopOpacity={0} />
              <stop offset="100%" stopColor="#E9DFC0" stopOpacity={0.9} />
            </radialGradient>
            <filter id="s2-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${W / 2} ${H / 2}) scale(${cellScale}) translate(${-W / 2} ${-H / 2})`}>
            {/* 细胞体 */}
            {cells.map((c, i) => (
              <path key={`b${i}`} d={c.d} fill="url(#s2-cell)" opacity={0.92} filter="url(#s2c-bleed)" />
            ))}
            {/* 细胞内的颗粒 */}
            {cells.map((c, i) =>
              c.dots.map((d, j) => (
                <circle key={`d${i}-${j}`} cx={d.x} cy={d.y} r={d.r} fill={C.jade} opacity={0.35 * (1 - wallP(f, c.dist) * 0.7)} />
              )),
            )}
            {/* 木质素：沿细胞壁的金色加固，由中心向外逐圈生长 */}
            <g filter="url(#s2-glow)">
              {cells.map((c, i) => {
                const p = wallP(f, c.dist);
                if (p <= 0) return null;
                return (
                  <path
                    key={`w${i}`}
                    d={c.d}
                    fill="none"
                    stroke={C.goldDeep}
                    strokeWidth={2 + p * 7}
                    strokeLinejoin="round"
                    strokeOpacity={0.55 + p * 0.4}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - Math.min(1, p * 1.35)}
                  />
                );
              })}
            </g>
            {/* 细胞壁之间的“骨架”纤维 */}
            <g stroke={C.goldLight} strokeWidth={1.4} strokeOpacity={0.8} fill="none">
              {cells.map((c, i) => {
                const p = wallP(f, c.dist);
                if (p < 0.5) return null;
                return <path key={`fb${i}`} d={c.inner} opacity={(p - 0.5) * 2} />;
              })}
            </g>
          </g>
          <rect width={W} height={H} fill="url(#s2-vig)" />
          {/* 标注 */}
          <g opacity={labelIn}>
            <line x1={1172} y1={436} x2={1172 + 160 * labelIn} y2={436} stroke={C.goldAntique} strokeWidth={1.6} />
            <circle cx={1172} cy={436} r={6} fill="none" stroke={C.goldAntique} strokeWidth={2} />
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 1348,
            top: 404,
            opacity: labelIn,
            transform: `translateX(${(1 - labelIn) * 12}px)`,
          }}
        >
          <div style={{fontFamily: serif, fontWeight: 700, fontSize: 40, color: C.goldAntique, letterSpacing: '0.1em'}}>木质素</div>
          <div style={{fontFamily: sans, fontSize: 16, letterSpacing: '0.4em', color: C.inkMute, marginTop: 4}}>LIGNIN</div>
        </div>
      </AbsoluteFill>
      <GoldDust count={28} seed="s2d" opacity={0.6} />
    </AbsoluteFill>
  );
};

/** 细胞壁生长进度：以离中心的距离错开 */
const wallP = (f: number, dist: number) =>
  interpolate(f, [128 + dist * 52, 162 + dist * 52], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});

type Cell = {d: string; inner: string; dist: number; dots: {x: number; y: number; r: number}[]};

/** 错位的六边形网格 → 圆角有机细胞 */
const buildCells = (): Cell[] => {
  const out: Cell[] = [];
  const sx = 150;
  const sy = 128;
  const cx0 = W / 2;
  const cy0 = H / 2;
  for (let r = -6; r <= 6; r++) {
    for (let c = -8; c <= 8; c++) {
      const x = cx0 + c * sx + (r % 2 ? sx / 2 : 0) + (random(`cx${r}${c}`) - 0.5) * 18;
      const y = cy0 + r * sy + (random(`cy${r}${c}`) - 0.5) * 16;
      if (x < -120 || x > W + 120 || y < -120 || y > H + 120) continue;
      const rx = 70 + (random(`crx${r}${c}`) - 0.5) * 10;
      const ry = 60 + (random(`cry${r}${c}`) - 0.5) * 10;
      const pts = new Array(6).fill(0).map((_, k) => {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        const jj = 1 + (random(`cj${r}${c}${k}`) - 0.5) * 0.14;
        return [x + Math.cos(a) * rx * jj, y + Math.sin(a) * ry * jj];
      });
      // 用中点做圆角
      const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let d = '';
      for (let k = 0; k < 6; k++) {
        const p0 = mid(pts[(k + 5) % 6], pts[k]);
        const p1 = mid(pts[k], pts[(k + 1) % 6]);
        if (k === 0) d += `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} `;
        d += `Q${pts[k][0].toFixed(1)},${pts[k][1].toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} `;
      }
      d += 'Z';
      // 内层纤维：一圈收缩的细线
      let inner = '';
      for (let k = 0; k < 6; k++) {
        const q0 = pts[k];
        const q1 = pts[(k + 1) % 6];
        const s = 0.8;
        inner += `M${(x + (q0[0] - x) * s).toFixed(1)},${(y + (q0[1] - y) * s).toFixed(1)} L${(x + (q1[0] - x) * s).toFixed(1)},${(y + (q1[1] - y) * s).toFixed(1)} `;
      }
      const dist = Math.hypot((x - cx0) / W, (y - cy0) / H) * 1.6;
      const dots = new Array(4).fill(0).map((_, k) => ({
        x: x + (random(`dx${r}${c}${k}`) - 0.5) * rx,
        y: y + (random(`dy${r}${c}${k}`) - 0.5) * ry,
        r: 3 + random(`dr${r}${c}${k}`) * 5,
      }));
      out.push({d, inner, dist, dots});
    }
  }
  return out;
};
