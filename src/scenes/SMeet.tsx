import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, serif, sans} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {InkFigure} from '../components/InkFigure';
import {TreeRings, makeRings} from '../components/TreeRings';
import {lerp, smoothNoise, wobblyCircle} from '../lib/geom';

/**
 * meet（8 秒 / 240 帧）：1999，雨林深处的相遇
 * A   0–110  林下：顶光斜射，一棵板根巨树顶天立地；他从左侧走来，停下，抬手扶住树干
 * B 110–150  掌心触到树皮：金色涟漪荡开，树皮纹理被一路点亮
 * C 130–175  镜头推进掌心 → 化入树的横截面
 * D 150–240  年轮由内向外长出；一条金色时间轴从树心沿半径伸出：
 *            树心 = 4 亿年前（墨色，地球时间）… 最外一圈 = 1999（金色，人的时间）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 900;
const TX = 1210; // 巨树中轴
const HAND = {x: 1072, y: 690};
const RC = {x: 900, y: 470}; // 年轮中心
const RINGS = makeRings(13, 'meet');

/** 巨树半宽：上部略收，近地面板根外扩 */
const halfW = (y: number) => {
  const base = 120 + (y / GROUND) * 22;
  const flare = Math.pow(Math.max(0, (y - 640) / (GROUND - 640)), 2.2) * 260;
  return base + flare;
};

export const SMeet: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);

  // ── A：走近、抬手 ──
  const walk = interpolate(f, [0, 78], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const figX = lerp(560, 985, walk);
  const bob = walk < 1 ? Math.abs(Math.sin(f * 0.32)) * 3 : 0;
  const lift = interpolate(f, [84, 108], [0, 1], {...cl, easing: io});
  const shoulder = {x: figX + 19 * 1.15, y: GROUND - 150 * 1.15};
  const handNow = {x: lerp(shoulder.x + 6, HAND.x, lift), y: lerp(GROUND - 100 * 1.15, HAND.y, lift)};

  // ── B：触碰 ──
  const touch = interpolate(f, [108, 150], [0, 1], cl);
  const reveal = interpolate(f, [110, 150], [0, 1000], {...cl, easing: Easing.out(Easing.cubic)});

  // ── C：推进 ──
  const push = interpolate(f, [128, 172], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const k = lerp(1, 7, push * push);
  const cX = lerp(HAND.x, RC.x, push);
  const cY = lerp(HAND.y, RC.y, push);
  const forestOpacity = interpolate(f, [146, 170], [1, 0], cl);

  // ── D：年轮 + 时间轴 ──
  const ringsIn = interpolate(f, [148, 168], [0, 1], cl);
  const ringScale = interpolate(f, [148, 200], [0.7, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const progress = RINGS.map((_, i) => interpolate(f, [152 + i * 4, 172 + i * 4], [0, 1], {...cl, easing: Easing.out(Easing.quad)}));
  const axis = interpolate(f, [176, 214], [0, 1], {...cl, easing: io});
  const rMax = RINGS[RINGS.length - 1].r;
  const axisEnd = rMax + 210;

  const bg = useMemo(() => buildBackground(), []);
  const bark = useMemo(() => buildBark(), []);
  const trunkPath = useMemo(() => buildTrunk(), []);

  const ringIdx = [0, 6, 11, 12];
  const hiPaths = useMemo(() => ringIdx.map((i) => wobblyCircle(RC.x, RC.y, RINGS[i].r, RINGS[i].seed, 0.022)), []);
  const ticks = [
    {r: RINGS[0].r, top: '约 4 亿年前', sub: 'EARTH TIME', tone: 'ink' as const, above: true, at: 0.0},
    {r: RINGS[6].r, top: '数千万年前', sub: 'AMAZONIA', tone: 'ink' as const, above: false, at: 0.42},
    {r: RINGS[11].r, top: '1994', sub: 'ANXIN', tone: 'gold' as const, above: false, at: 0.8},
    {r: rMax, top: '1999', sub: 'THE MEETING', tone: 'gold' as const, above: true, at: 0.92},
  ];

  return (
    <AbsoluteFill>
      <Paper glowAt={[62, 0]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="mt" seed={61} />
          <linearGradient id="mt-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF2C6" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#FFF2C6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="mt-trunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8C7760" />
            <stop offset="35%" stopColor="#6E5C49" />
            <stop offset="100%" stopColor="#4E4134" />
          </linearGradient>
          <linearGradient id="mt-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9CDA9" />
            <stop offset="100%" stopColor="#C6B58E" />
          </linearGradient>
          <radialGradient id="mt-touch">
            <stop offset="0%" stopColor="#FFE7A0" stopOpacity={1} />
            <stop offset="100%" stopColor="#FFE7A0" stopOpacity={0} />
          </radialGradient>
          <clipPath id="mt-reveal">
            <circle cx={HAND.x} cy={HAND.y} r={reveal} />
          </clipPath>
          <clipPath id="mt-trunkclip">
            <path d={trunkPath} />
          </clipPath>
        </defs>

        {/* ── 林下（A–C） ── */}
        <g opacity={forestOpacity} transform={`translate(${cX} ${cY}) scale(${k}) translate(${-HAND.x} ${-HAND.y})`}>
          {/* 远景：淡墨树干与树冠 */}
          <g filter="url(#mt-soft)">
            {bg.far.map((t, i) => (
              <g key={i} opacity={0.22}>
                <rect x={t.x - t.w / 2} y={-40} width={t.w} height={GROUND + 40} fill={C.inkWash} />
              </g>
            ))}
            {bg.canopy.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={i % 2 ? '#A9B98F' : '#9DB083'} opacity={0.55} />
            ))}
          </g>
          {/* 中景树干 */}
          <g filter="url(#mt-bleed)">
            {bg.mid.map((t, i) => (
              <rect key={i} x={t.x - t.w / 2} y={-40} width={t.w} height={GROUND + 40} fill={C.inkSoft} opacity={0.42} />
            ))}
          </g>
          {/* 顶光 */}
          <g style={{mixBlendMode: 'screen'}}>
            {[700, 860, 1480, 1620].map((x, i) => (
              <polygon
                key={i}
                points={`${x - 30},-40 ${x + 40},-40 ${x - 260 + i * 20},${GROUND + 40} ${x - 420 + i * 10},${GROUND + 40}`}
                fill="url(#mt-ray)"
                opacity={0.42 + 0.12 * Math.sin(f * 0.04 + i * 1.3)}
              />
            ))}
          </g>
          {/* 地面 */}
          <rect x={-200} y={GROUND} width={W + 400} height={400} fill="url(#mt-floor)" />

          {/* 巨树 */}
          <g filter="url(#mt-bleed)">
            <path d={trunkPath} fill="url(#mt-trunk)" />
            {/* 板根的受光面 */}
            {[-1, 1].map((s) => (
              <path
                key={s}
                d={`M${TX + s * 40},${GROUND - 300} Q${TX + s * 120},${GROUND - 90} ${TX + s * 330},${GROUND} L${TX + s * 250},${GROUND} Q${TX + s * 90},${GROUND - 70} ${TX + s * 20},${GROUND - 220} Z`}
                fill={s < 0 ? '#9C8770' : '#5A4A3B'}
                opacity={0.85}
              />
            ))}
          </g>
          <g clipPath="url(#mt-trunkclip)">
            <g fill="none" stroke="#3E3328" strokeWidth={3} strokeLinecap="round" opacity={0.45}>
              {bark.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {/* 被点亮的树皮纹理 */}
            <g clipPath="url(#mt-reveal)" fill="none" stroke={C.goldLight} strokeWidth={3.4} strokeLinecap="round" opacity={0.9 * (1 - interpolate(f, [150, 172], [0, 1], cl))}>
              {bark.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>
          {/* 藤蔓 */}
          <g fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" opacity={0.55}>
            {[1320, 1370, 640, 1700].map((x, i) => (
              <path key={i} d={`M${x},-20 q${18 + i * 4},${160 + i * 30} ${-6},${320 + i * 50} q-20,60 ${8},${120 + i * 20}`} />
            ))}
          </g>

          {/* 他 */}
          <ellipse cx={figX} cy={GROUND + 4} rx={46} ry={7} fill="#5B4A36" opacity={0.25} />
          <InkFigure
            x={figX}
            y={GROUND - bob}
            height={230}
            hair="long"
            sway={walk < 1 ? Math.sin(f * 0.32) : 0}
            color="#2E2822"
            reach={lift > 0 ? handNow : undefined}
          />

          {/* 触碰的光 */}
          <g style={{mixBlendMode: 'screen'}} opacity={touch > 0 ? 1 : 0}>
            <circle cx={HAND.x} cy={HAND.y} r={70 + touch * 40} fill="url(#mt-touch)" opacity={interpolate(f, [108, 120, 170], [0, 1, 0.6], cl)} />
            {[0, 1, 2].map((i) => {
              const t = interpolate(f, [110 + i * 9, 150 + i * 9], [0, 1], cl);
              return t > 0 && t < 1 ? (
                <circle key={i} cx={HAND.x} cy={HAND.y} r={20 + t * 260} fill="none" stroke={C.goldLight} strokeWidth={3 * (1 - t) + 0.5} opacity={1 - t} />
              ) : null;
            })}
          </g>

          {/* 前景蕨叶 */}
          <g fill="none" stroke="#5E7D52" strokeWidth={7} strokeLinecap="round" opacity={0.75} filter="url(#mt-bleed)">
            {[{x: 80, s: 1.4}, {x: 260, s: 1}, {x: 1820, s: 1.5}, {x: 1640, s: 0.9}].map((p, i) => (
              <g key={i}>
                {[-1.2, -0.7, -0.25, 0.25, 0.7, 1.2].map((a, j) => (
                  <path key={j} d={`M${p.x},${H + 20} q${Math.sin(a) * 90 * p.s},${-140 * p.s} ${Math.sin(a) * 190 * p.s},${(-90 + Math.abs(a) * 70) * p.s}`} />
                ))}
              </g>
            ))}
          </g>
        </g>

        {/* ── 年轮与时间轴（D） ── */}
        <g opacity={ringsIn}>
          <g transform={`translate(${RC.x} ${RC.y}) scale(${ringScale}) translate(${-RC.x} ${-RC.y})`}>
            <circle cx={RC.x} cy={RC.y} r={rMax + 40} fill="#F7EBD2" opacity={0.6} />
            <TreeRings rings={RINGS} progress={progress} cx={RC.x} cy={RC.y} strokeScale={1.3} />
            <circle cx={RC.x} cy={RC.y} r={6} fill={C.goldAntique} />
            {/* 被时间轴“点名”的那一圈：描金高亮 */}
            {hiPaths.map((d, j) => {
              if (j === 0) return null;
              const on = interpolate(f, [178 + ticks[j].at * 38, 196 + ticks[j].at * 38], [0, 1], cl);
              const gold = ticks[j].tone === 'gold';
              return (
                <path key={j} d={d} fill="none" stroke={gold ? C.gold : C.inkWash} strokeWidth={gold ? 4 : 3} opacity={on * (gold ? 0.95 : 0.6)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - on} />
              );
            })}
          </g>
          {/* 时间轴 */}
          <line x1={RC.x} y1={RC.y} x2={RC.x + axisEnd * axis} y2={RC.y} stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
          <line x1={RC.x} y1={RC.y} x2={RC.x + axisEnd * axis} y2={RC.y} stroke="#FFF3CF" strokeWidth={1} strokeLinecap="round" opacity={0.8} />
          {ticks.map((t, i) => {
            const on = interpolate(f, [176 + t.at * 38, 188 + t.at * 38], [0, 1], cl);
            const x = RC.x + t.r;
            const gold = t.tone === 'gold';
            const last = i === ticks.length - 1;
            const pulse = last ? 1 + 0.25 * Math.sin(Math.max(0, f - 214) * 0.18) * interpolate(f, [214, 222], [0, 1], cl) : 1;
            return (
              <g key={i} opacity={on}>
                <circle cx={x} cy={RC.y} r={(last ? 9 : 5.5) * pulse} fill={gold ? C.gold : C.inkSoft} stroke="#FFF6DE" strokeWidth={2} />
                {last ? <circle cx={x} cy={RC.y} r={30 * pulse} fill="url(#mt-touch)" opacity={0.6} /> : null}
                <line x1={x} y1={RC.y + (t.above ? -12 : 12)} x2={x} y2={RC.y + (t.above ? -46 : 46)} stroke={gold ? C.goldDeep : C.inkMute} strokeWidth={1.4} />
              </g>
            );
          })}
        </g>
        {/* 收尾：时间轴最前端，一个很小的人影 */}
        <g opacity={interpolate(f, [212, 230], [0, 1], cl)}>
          <InkFigure x={RC.x + axisEnd} y={RC.y - 2} height={52} hair="long" color={C.goldAntique} />
        </g>
      </svg>

      {/* 刻度文字（HTML 便于排版） */}
      {ticks.map((t, i) => {
        const on = interpolate(f, [178 + t.at * 38, 194 + t.at * 38], [0, 1], cl) * ringsIn;
        const gold = t.tone === 'gold';
        const x = RC.x + t.r;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 160,
              width: 320,
              top: t.above ? RC.y - 122 : RC.y + 50,
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              opacity: on,
              transform: `translateY(${(1 - on) * (t.above ? 8 : -8)}px)`,
            }}
          >
            <div style={{padding: '6px 16px 7px', borderRadius: 10, background: 'rgba(251,246,236,0.86)', boxShadow: '0 0 18px rgba(251,246,236,0.9)'}}>
            <div
              style={{
                fontFamily: serif,
                fontWeight: 600,
                lineHeight: 1.15,
                fontSize: gold ? 34 : 26,
                letterSpacing: '0.06em',
                color: gold ? C.goldDeep : C.inkSoft,
                textShadow: '0 0 12px rgba(251,246,236,0.95)',
              }}
            >
              {t.top}
            </div>
            <div style={{fontFamily: sans, fontSize: 13, letterSpacing: '0.3em', color: C.inkMute, marginTop: 3}}>{t.sub}</div>
            </div>
          </div>
        );
      })}

      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.55) 88%, rgba(243,234,218,0.75) 100%)',
        }}
      />
      <GoldDust count={34} seed="mtd" opacity={0.7} />
    </AbsoluteFill>
  );
};

const buildTrunk = () => {
  let left = '';
  let right = '';
  const pts: number[] = [];
  for (let y = -60; y <= GROUND; y += 20) pts.push(y);
  pts.forEach((y, i) => {
    const wob = smoothNoise(y * 0.01, 'trk', 3) * 10;
    left += `${i === 0 ? 'M' : 'L'}${(TX - halfW(y) + wob).toFixed(1)},${y} `;
  });
  [...pts].reverse().forEach((y) => {
    const wob = smoothNoise(y * 0.01 + 7, 'trk2', 3) * 10;
    right += `L${(TX + halfW(y) + wob).toFixed(1)},${y} `;
  });
  return `${left}${right}Z`;
};

const buildBark = () => {
  const out: string[] = [];
  for (let i = 0; i < 24; i++) {
    const u = (i + 0.5) / 24 - 0.5; // -0.5..0.5 横向位置（相对半宽）
    let d = '';
    for (let y = -60; y <= GROUND + 10; y += 24) {
      const x = TX + u * 2 * halfW(y) * 0.95 + smoothNoise(y * 0.012 + i * 3.1, `bk${i}`, 3) * 9;
      d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y} `;
    }
    out.push(d);
  }
  return out;
};

const buildBackground = () => {
  const far = new Array(16).fill(0).map((_, i) => ({x: i * 128 + random(`fx${i}`) * 60, w: 26 + random(`fw${i}`) * 30}));
  const mid = [140, 420, 1680, 1860].map((x, i) => ({x, w: 50 + random(`mw${i}`) * 30}));
  const canopy = new Array(34).fill(0).map((_, i) => ({
    x: (i / 33) * (W + 200) - 100 + random(`cx${i}`) * 40,
    y: -20 + random(`cy${i}`) * 140,
    r: 90 + random(`cr${i}`) * 70,
  }));
  return {far, mid, canopy};
};
