import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, interpolateColors, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {fernTuft} from '../components/Plants';
import {lerp, smoothNoise} from '../lib/geom';
import {CELL_H, CELL_W, GH, GREENS, GW, GX, GY, N, SAT_RIVER, SSatellite, buildBackground, buildCells} from './SSatellite';

/**
 * mill（8 秒 / 240 帧）：1999，巴西 · 雨林边的原材料工厂；先规划，后采伐
 * A   0– 96  侧视水墨：河岸边木结构厂房一跨跨立起，原木堆场、小码头、驳船靠岸；
 *            前景两个剪影握手——及肩长发（他）与草帽（路易斯）
 * B  90–166  俯视：规划图在木桌上展开，墨线画出 25 块轮伐区、采伐道、河岸保护林、育苗区；
 *            镜头推入图纸，纸面化作真实林地，线条延伸进林子
 * C 166–240  镜头升到俯视，规划线拉直、变金，成为卫星镜头的 5×5 网格；
 *            末帧与 satellite 第 0 帧完全一致（网格淡出，由卫星扫描重新画出）
 *
 * B/C 的“世界坐标”= satellite 的画面坐标：镜头回到 1:1 时两镜无缝衔接。
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const io = Easing.inOut(Easing.cubic);

// ── A：侧视 ──
const BANK = 708; // 厂房地面
const RIVER_TOP = 716;
const RIVER_BOT = 872;
const FEET = 884;
const MX = 720;
const BAYS = 6;
const BW = 104;
const POST_H = 150;
const FIG_H = 270;
const HS = {x: 330, y: FEET - 110 * (FIG_H / 200)}; // 握手点

// ── B/C：俯视（世界坐标）──
const FOCUS = {x: 930, y: 560};
const PAPER = {x: 300, y: 130, w: 1260, h: 860};
const NURSERY = {x: 1270, y: 566, w: 220, h: 168};
const MILL_TOP = {x: 1300, y: 772, w: 170, h: 58};
const BELT_MAX_X = 1236;
const ROADS = [
  'M1385,800 C1330,766 1252,738 1206,706 L380,706',
  'M722,706 L722,196',
  'M1050,706 L1050,196',
];
const ROAD_EXT = ['M380,706 L-600,706', 'M722,196 L722,-500', 'M1050,196 L1050,-500'];

// satellite 河流的三次贝塞尔采样（用于河岸保护林、地图符号避让）
const RIVER_SEGS = [
  [[-40, 880], [300, 820], [420, 960], [760, 900]],
  [[760, 900], [1080, 840], [1240, 980], [1960, 900]],
];
const RIVER_PTS = (() => {
  const pts: {x: number; y: number}[] = [];
  for (const [p0, p1, p2, p3] of RIVER_SEGS) {
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const u = 1 - t;
      pts.push({
        x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      });
    }
  }
  return pts;
})();
const riverY = (x: number) => {
  if (x <= RIVER_PTS[0].x) return RIVER_PTS[0].y;
  for (let i = 1; i < RIVER_PTS.length; i++) {
    const a = RIVER_PTS[i - 1];
    const b = RIVER_PTS[i];
    if (x <= b.x) return lerp(a.y, b.y, (x - a.x) / Math.max(1e-6, b.x - a.x));
  }
  return RIVER_PTS[RIVER_PTS.length - 1].y;
};
const inRect = (x: number, y: number, r: {x: number; y: number; w: number; h: number}, pad = 0) =>
  x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;
const CLEARING = {x: 1250, y: 540, w: 270, h: 320};

/** 网格线：手绘抖动（wob=1）→ 笔直（wob=0） */
const gridLines = (wob: number) => {
  const out: {d: string; outer: boolean}[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number, seed: string, outer: boolean) => {
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const len = Math.hypot(nx, ny);
    const shift = outer ? 0 : (random(`${seed}-sh`) - 0.5) * 30 * wob;
    let d = '';
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const o = (smoothNoise(t * 3.2, seed, 3) * 9 * Math.sin(Math.PI * t) + shift * Math.sin(Math.PI * t) ** 0.4) * wob;
      const x = lerp(x1, x2, t) + (nx / len) * o;
      const y = lerp(y1, y2, t) + (ny / len) * o;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    out.push({d, outer});
  };
  for (let i = 0; i <= N; i++) {
    const outer = i === 0 || i === N;
    line(GX + i * CELL_W, GY, GX + i * CELL_W, GY + GH, `gv${i}`, outer);
    line(GX, GY + i * CELL_H, GX + GW, GY + i * CELL_H, `gh${i}`, outer);
  }
  return out;
};

export const SMill: React.FC = () => {
  const f = useCurrentFrame();

  // ── 段落透明度 ──
  const aOp = interpolate(f, [84, 100], [1, 0], cl);
  const bOp = interpolate(f, [86, 100], [0, 1], cl);

  // ── 镜头（B/C 世界变换）──
  const rise = interpolate(f, [166, 204], [0, 1], {...cl, easing: io});
  const m =
    f < 132
      ? interpolate(f, [90, 132], [0.74, 0.78], cl)
      : f < 166
        ? interpolate(f, [132, 166], [0.78, 1.45], {...cl, easing: io})
        : interpolate(f, [166, 204], [1.45, 1], {...cl, easing: io});
  const ax = lerp(960, FOCUS.x, rise);
  const ay = lerp(540, FOCUS.y, rise);
  const world = `translate(${ax} ${ay}) scale(${m}) translate(${-FOCUS.x} ${-FOCUS.y})`;

  // ── B ──
  const unroll = interpolate(f, [94, 116], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const draw = (i: number, n: number) => interpolate(f, [104 + (i / n) * 16, 120 + (i / n) * 16], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const labels = interpolate(f, [112, 128], [0, 1], cl) * interpolate(f, [138, 150], [1, 0], cl);
  const tableOp = interpolate(f, [136, 158], [1, 0], cl);
  const forestIn = interpolate(f, [132, 154], [0, 1], cl);
  const extDraw = interpolate(f, [138, 164], [0, 1], {...cl, easing: io});
  const onForest = interpolate(f, [134, 152], [0, 1], cl);

  // ── C ──
  const wob = interpolate(f, [168, 200], [1, 0], {...cl, easing: io});
  const extrasOut = interpolate(f, [172, 198], [1, 0], cl);
  const lushOut = interpolate(f, [176, 204], [1, 0], cl);
  const satIn = interpolate(f, [196, 214], [0, 1], cl);
  const gridOut = interpolate(f, [222, 238], [1, 0], {...cl, easing: Easing.in(Easing.quad)});
  const glint = interpolate(f, [202, 226], [0, 1], {...cl, easing: io});
  const lineCol = interpolateColors(f, [130, 150, 170, 194], ['#6B4E2E', '#6B4E2E', '#FFF1CC', C.gold]);
  const outerCol = interpolateColors(f, [130, 150, 170, 194], ['#5A3E22', '#5A3E22', '#FFF1CC', C.goldDeep]);
  const innerW = f < 166 ? 2.6 : lerp(2.6, 1.6, rise);
  const outerW = f < 166 ? 3.4 : lerp(3.4, 3, rise);

  const grid = useMemo(() => gridLines(wob), [wob]);
  const a = useMemo(() => buildA(), []);
  const top = useMemo(() => buildTop(), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[62, 18]} />

      {/* ═════════ A：河岸、厂房、握手 ═════════ */}
      {aOp > 0 ? <SceneA f={f} a={a} opacity={aOp} /> : null}

      {/* ═════════ B/C：俯视（下层：木桌、真实林地、图纸）═════════ */}
      {bOp > 0 && satIn < 1 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: bOp}}>
          <defs>
            <InkDefs p="mlb" seed={91} />
            <pattern id="ml-hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1={0} y1={0} x2={0} y2={14} stroke="#5C7A4E" strokeWidth={2.4} opacity={0.75} />
            </pattern>
            <linearGradient id="ml-roll" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D9CBA8" />
              <stop offset="45%" stopColor="#FBF4E2" />
              <stop offset="100%" stopColor="#BFAE88" />
            </linearGradient>
            <clipPath id="ml-unroll">
              <rect x={PAPER.x} y={PAPER.y - 20} width={PAPER.w * unroll} height={PAPER.h + 40} />
            </clipPath>
            <clipPath id="ml-belt">
              <rect x={-200} y={0} width={BELT_MAX_X + 200} height={1400} />
            </clipPath>
          </defs>
          <g transform={world}>
            {/* 木桌 */}
            <g opacity={tableOp}>
              <rect x={-1000} y={-800} width={3900} height={2800} fill="#C6A57A" />
              {top.planks.map((p, i) => (
                <g key={i}>
                  <rect x={-1000} y={p.y} width={3900} height={p.h} fill={p.tone} opacity={0.5} />
                  <line x1={-1000} y1={p.y} x2={2900} y2={p.y} stroke="#8C6A45" strokeWidth={3} opacity={0.7} />
                  <path d={p.grain} fill="none" stroke="#9C7A52" strokeWidth={1.6} opacity={0.45} />
                </g>
              ))}
              {/* 铅笔、分规 */}
              <g transform="translate(1640 360) rotate(62)">
                <rect x={0} y={-8} width={300} height={16} fill="#D9A23A" />
                <rect x={300} y={-8} width={26} height={16} fill="#B9B2A2" />
                <path d="M0,-8 L-34,0 L0,8 Z" fill="#E8D2A8" />
                <path d="M-22,-3 L-34,0 L-22,3 Z" fill={C.ink} />
              </g>
              <g transform="translate(1680 860)" stroke="#8E6A2A" strokeWidth={6} strokeLinecap="round">
                <line x1={0} y1={0} x2={-60} y2={150} />
                <line x1={0} y1={0} x2={50} y2={152} />
                <circle cx={0} cy={0} r={11} fill="#C9A24A" />
              </g>
              {/* 图纸阴影 */}
              <rect x={PAPER.x + 14} y={PAPER.y + 18} width={PAPER.w * unroll} height={PAPER.h} fill="#5A4026" opacity={0.28} filter="url(#mlb-soft)" />
            </g>

            {/* 真实林地（与 satellite 同构） */}
            <g opacity={forestIn}>
              <rect x={-1000} y={-800} width={3900} height={2800} fill="#E9E3CB" />
              <g filter="url(#mlb-soft)" opacity={0.28}>
                {top.satBg.map((b, i) => (
                  <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={GREENS[i % 4]} opacity={0.55} />
                ))}
              </g>
              {/* 茂密林冠（镜头升起后淡去，只剩卫星视角的淡林） */}
              <g opacity={lushOut} filter="url(#mlb-bleed)">
                {top.lush.map((c, i) => (
                  <g key={i}>
                    <circle cx={c.x + 5} cy={c.y + 7} r={c.r} fill="#3E5A38" opacity={0.35} />
                    <circle cx={c.x} cy={c.y} r={c.r * 0.94} fill={c.fill} />
                    <circle cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.32} r={c.r * 0.36} fill="#E6EDC8" opacity={0.22} />
                  </g>
                ))}
                {/* 河岸保护林：沿河更密、更深 */}
                {top.reserve.map((c, i) => (
                  <circle key={`r${i}`} cx={c.x} cy={c.y} r={c.r} fill={i % 2 ? '#3F5F3A' : '#4C6B44'} />
                ))}
              </g>
              <path d={SAT_RIVER} fill="none" stroke="#EFE4C4" strokeWidth={44} opacity={0.9} />
              <rect x={GX - 10} y={GY - 10} width={GW + 20} height={GH + 20} fill="#F1E8D2" opacity={0.6} rx={6} />
              {top.cells.map((cell, idx) => {
                const x0 = GX + cell.c * CELL_W;
                const y0 = GY + cell.r * CELL_H;
                return (
                  <g key={idx}>
                    <rect x={x0} y={y0} width={CELL_W} height={CELL_H} fill="#7F9A6B" opacity={0.35} />
                    <g filter="url(#mlb-bleed)">
                      {cell.crowns.map((b, j) => (
                        <g key={j}>
                          <circle cx={b.x + 3} cy={b.y + 4} r={b.r} fill="#3E5A38" opacity={0.35} />
                          <circle cx={b.x} cy={b.y} r={b.r} fill={GREENS[j % 4]} />
                          <circle cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.3} r={b.r * 0.38} fill="#E6EDC8" opacity={0.25} />
                        </g>
                      ))}
                    </g>
                  </g>
                );
              })}
              {/* 工厂空地：俯视的厂房屋顶、堆场、码头、育苗区、采伐道 */}
              <g opacity={extrasOut}>
                <rect x={CLEARING.x} y={CLEARING.y} width={CLEARING.w} height={CLEARING.h - 30} rx={30} fill="#DCC7A0" filter="url(#mlb-bleed)" />
                <g>
                  {top.saplings.map((s, i) => (
                    <g key={i}>
                      <circle cx={s.x} cy={s.y} r={s.r + 2} fill="#7E9B6A" opacity={0.5} />
                      <circle cx={s.x} cy={s.y} r={s.r} fill="#B9CF8E" />
                    </g>
                  ))}
                </g>
                <rect x={MILL_TOP.x} y={MILL_TOP.y} width={MILL_TOP.w} height={MILL_TOP.h} fill="#8A6444" stroke="#5E4430" strokeWidth={3} />
                <line x1={MILL_TOP.x} y1={MILL_TOP.y + MILL_TOP.h / 2} x2={MILL_TOP.x + MILL_TOP.w} y2={MILL_TOP.y + MILL_TOP.h / 2} stroke="#5E4430" strokeWidth={3} />
                {new Array(9).fill(0).map((_, i) => (
                  <line key={i} x1={MILL_TOP.x + 10 + i * 19} y1={MILL_TOP.y + 4} x2={MILL_TOP.x + 10 + i * 19} y2={MILL_TOP.y + MILL_TOP.h - 4} stroke="#A07A55" strokeWidth={1.5} />
                ))}
                {[0, 1, 2, 3].map((k) => (
                  <rect key={k} x={1262} y={752 + k * 14} width={30} height={9} rx={4} fill="#B97B42" stroke="#7A4A20" strokeWidth={1.4} />
                ))}
                <rect x={1414} y={830} width={14} height={60} fill="#8A6A48" />
                <rect x={1432} y={872} width={92} height={26} rx={10} fill="#5E4A36" />
                {[0, 1, 2].map((k) => (
                  <rect key={k} x={1440} y={876 + k * 7} width={64} height={5} rx={2.5} fill="#C78A4A" />
                ))}
                {ROADS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#D8C29A" strokeWidth={18} strokeLinecap="round" opacity={0.95} />
                ))}
                {ROAD_EXT.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#D8C29A" strokeWidth={18} strokeLinecap="round" opacity={0.95} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - extDraw} />
                ))}
              </g>
            </g>

            {/* 图纸 */}
            <g opacity={tableOp}>
              <g clipPath="url(#ml-unroll)">
                <rect x={PAPER.x} y={PAPER.y} width={PAPER.w} height={PAPER.h} fill="#F6EEDA" stroke="#CDB48C" strokeWidth={3} />
                <rect x={PAPER.x + 22} y={PAPER.y + 22} width={PAPER.w - 44} height={PAPER.h - 44} fill="none" stroke="#8A7A66" strokeWidth={1.4} opacity={0.6} />
                {/* 林地符号 */}
                <g fill="none" stroke="#8A7A66" strokeWidth={1.8} strokeLinecap="round" opacity={0.55}>
                  {top.glyphs.map((g, i) => (
                    <path key={i} d={`M${g.x - 8},${g.y + 4} Q${g.x},${g.y - 9} ${g.x + 8},${g.y + 4} M${g.x},${g.y + 1} L${g.x},${g.y + 9}`} />
                  ))}
                </g>
                {/* 河流 + 保护林 */}
                <g clipPath="url(#ml-belt)">
                  <path d={SAT_RIVER} fill="none" stroke="url(#ml-hatch)" strokeWidth={128} opacity={0.75} />
                </g>
                <path d={SAT_RIVER} fill="none" stroke="#9FB3B5" strokeWidth={34} opacity={0.75} />
                <path d={SAT_RIVER} fill="none" stroke="#6E8790" strokeWidth={1.6} transform="translate(0 -17)" opacity={0.8} />
                <path d={SAT_RIVER} fill="none" stroke="#6E8790" strokeWidth={1.6} transform="translate(0 17)" opacity={0.8} />
                {/* 育苗区 */}
                <g fill="#6F9A78" opacity={draw(3, 4)}>
                  {top.saplings.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={3.4} />
                  ))}
                </g>
                {/* 厂房符号 */}
                <g opacity={draw(2, 4)}>
                  <rect x={MILL_TOP.x} y={MILL_TOP.y} width={MILL_TOP.w} height={MILL_TOP.h} fill="url(#ml-hatch)" stroke="#5A3E22" strokeWidth={2.4} />
                  <line x1={1421} y1={830} x2={1421} y2={886} stroke="#5A3E22" strokeWidth={4} />
                </g>
                {/* 标注 */}
                <g opacity={labels}>
                  <text x={GX} y={GY - 20} fontFamily={serif} fontWeight={600} fontSize={26} fill="#5A3E22" letterSpacing={3}>
                    25 块轮伐区
                    <tspan fontFamily={sans} fontSize={14} fontWeight={500} letterSpacing={4} fill="#8A7A66" dx={16}>25 ROTATION PLOTS</tspan>
                  </text>
                  <text x={PAPER.x + PAPER.w - 44} y={PAPER.y + 66} textAnchor="end" fontFamily={serif} fontWeight={600} fontSize={34} fill="#5A3E22" letterSpacing={6}>
                    林区规划图
                  </text>
                  <text x={PAPER.x + PAPER.w - 44} y={PAPER.y + 92} textAnchor="end" fontFamily={sans} fontSize={14} fill="#8A7A66" letterSpacing={5}>
                    FOREST PLAN · BRAZIL
                  </text>
                  <g transform={`translate(${PAPER.x + PAPER.w - 90} ${PAPER.y + 170})`} stroke="#5A3E22" strokeWidth={2} fill="none">
                    <circle r={26} opacity={0.7} />
                    <path d="M0,-34 L7,0 L0,34 L-7,0 Z" fill="#5A3E22" opacity={0.85} />
                    <text y={-42} textAnchor="middle" fontFamily={sans} fontSize={16} fill="#5A3E22" stroke="none" fontWeight={600}>N</text>
                  </g>
                  <MapLabel x={1210} y={772} zh="采伐道" en="HARVEST ROAD" anchor="end" />
                  <MapLabel x={600} y={968} zh="河岸保护林 · 不采伐" en="RIPARIAN RESERVE" anchor="middle" box={240} />
                  <MapLabel x={NURSERY.x + NURSERY.w / 2} y={NURSERY.y - 14} zh="育苗区" en="NURSERY" anchor="middle" />
                  <MapLabel x={1290} y={866} zh="原材料工厂" en="RAW-MATERIAL MILL" anchor="end" small box={150} />
                </g>
              </g>
              {/* 纸卷 */}
              {unroll > 0 && unroll < 1 ? (
                <g>
                  <rect x={PAPER.x + PAPER.w * unroll - 16} y={PAPER.y - 6} width={34} height={PAPER.h + 12} rx={16} fill="url(#ml-roll)" stroke="#A8946C" strokeWidth={2} />
                  <rect x={PAPER.x + PAPER.w * unroll + 22} y={PAPER.y + 10} width={18} height={PAPER.h} fill="#5A4026" opacity={0.18} filter="url(#mlb-soft)" />
                </g>
              ) : null}
            </g>
          </g>
        </svg>
      ) : null}

      {/* ═════════ C：satellite 第 0 帧（定格）淡入 ═════════ */}
      {satIn > 0 ? (
        <AbsoluteFill style={{opacity: satIn}}>
          <Freeze frame={0}>
            <SSatellite />
          </Freeze>
        </AbsoluteFill>
      ) : null}

      {/* ═════════ B/C：上层规划线（网格 → 金色网格）═════════ */}
      {bOp > 0 && gridOut > 0 ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: bOp * gridOut}}>
          <defs>
            <mask id="ml-roadmask" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
              {ROADS.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="#fff" strokeWidth={26} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw(i, 4)} />
              ))}
              {ROAD_EXT.map((d, i) => (
                <path key={`e${i}`} d={d} fill="none" stroke="#fff" strokeWidth={26} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - extDraw} />
              ))}
            </mask>
            <clipPath id="ml-unroll2">
              <rect x={PAPER.x} y={PAPER.y - 20} width={PAPER.w * unroll} height={PAPER.h + 40} />
            </clipPath>
            <clipPath id="ml-glint">
              <rect x={-200} y={-300} width={180} height={1800} transform={`translate(${lerp(GX - 300, GX + GW + 500, glint)} 0) rotate(18)`} />
            </clipPath>
          </defs>
          <g transform={world}>
            {/* 采伐道、保护林边界、育苗区边界（升起时淡去） */}
            <g opacity={extrasOut} mask="url(#ml-roadmask)">
              {[...ROADS, ...ROAD_EXT].map((d, i) => (
                <g key={i}>
                  <path d={d} fill="none" stroke="#FFF3D6" strokeWidth={9} opacity={0.65 * onForest} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#9A4A26" strokeWidth={4.5} strokeDasharray="18 12" strokeLinecap="round" />
                </g>
              ))}
            </g>
            <g opacity={extrasOut} clipPath={f < 136 ? 'url(#ml-unroll2)' : undefined}>
              <g clipPath="url(#ml-belt2)">
                {[-64, 64].map((dy) => (
                  <path key={dy} d={SAT_RIVER} transform={`translate(0 ${dy})`} fill="none" stroke={onForest > 0.5 ? '#E9F0C8' : '#4E6E44'} strokeWidth={3} strokeDasharray="12 9" opacity={draw(1, 4)} />
                ))}
              </g>
              <rect x={NURSERY.x} y={NURSERY.y} width={NURSERY.w} height={NURSERY.h} fill="none" stroke={onForest > 0.5 ? '#E9F0C8' : '#4E6E44'} strokeWidth={3} strokeDasharray="12 9" opacity={draw(3, 4)} rx={6} />
            </g>
            <defs>
              <clipPath id="ml-belt2">
                <rect x={-800} y={0} width={BELT_MAX_X + 800} height={1400} />
              </clipPath>
            </defs>
            {/* 25 块轮伐区网格 */}
            <g clipPath={f < 136 ? 'url(#ml-unroll2)' : undefined} fill="none" strokeLinecap="round">
              {grid.map((g, i) => (
                <path key={`s${i}`} d={g.d} stroke="#2E3A28" strokeWidth={(g.outer ? outerW : innerW) + 3} opacity={0.3 * onForest * (1 - satIn)} />
              ))}
              {grid.map((g, i) => (
                <path
                  key={i}
                  d={g.d}
                  stroke={g.outer ? outerCol : lineCol}
                  strokeWidth={g.outer ? outerW : innerW}
                  opacity={g.outer ? 1 : 0.9}
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - draw(0, 4) * 1.0}
                />
              ))}
              {/* 金色网格成形时的一道流光 */}
              {glint > 0 && glint < 1 ? (
                <g clipPath="url(#ml-glint)">
                  {grid.map((g, i) => (
                    <path key={`g${i}`} d={g.d} stroke="#FFF6D8" strokeWidth={(g.outer ? outerW : innerW) + 1.6} />
                  ))}
                </g>
              ) : null}
            </g>
          </g>
        </svg>
      ) : null}

      {/* 字幕托底（satellite 自带同款托底，淡入时交给它） */}
      <AbsoluteFill
        style={{
          opacity: 1 - satIn,
          background: 'linear-gradient(180deg, rgba(243,234,218,0) 74%, rgba(243,234,218,0.58) 88%, rgba(243,234,218,0.78) 100%)',
        }}
      />
      <GoldDust count={30} seed="mld" opacity={0.6 * (1 - satIn)} />
    </AbsoluteFill>
  );
};

const MapLabel: React.FC<{x: number; y: number; zh: string; en: string; anchor: 'start' | 'middle' | 'end'; small?: boolean; box?: number}> = ({x, y, zh, en, anchor, small, box}) => (
  <g>
    {box ? (
      <rect x={anchor === 'middle' ? x - box / 2 : anchor === 'end' ? x - box : x} y={y - (small ? 40 : 48)} width={box} height={small ? 48 : 58} rx={6} fill="#F6EEDA" opacity={0.92} />
    ) : null}
    <text x={x} y={y - (small ? 16 : 20)} textAnchor={anchor} fontFamily={serif} fontWeight={600} fontSize={small ? 19 : 23} fill="#5A3E22" letterSpacing={2} stroke="#F6EEDA" strokeWidth={5} style={{paintOrder: 'stroke'}}>
      {zh}
    </text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={sans} fontSize={small ? 11 : 13} fill="#8A7A66" letterSpacing={3} stroke="#F6EEDA" strokeWidth={4} style={{paintOrder: 'stroke'}}>
      {en}
    </text>
  </g>
);

// ═════════════════════════ A：侧视 ═════════════════════════

/** 侧身剪影（面向 +x，原点在双脚，200 单位高）：hair=及肩长发（他），hat=草帽（路易斯） */
const SideFigure: React.FC<{x: number; y: number; h: number; face: 1 | -1; kind: 'hair' | 'hat'; hand: {x: number; y: number}; color: string}> = ({x, y, h, face, kind, hand, color}) => {
  const s = h / 200;
  const lx = (hand.x - x) / (s * face);
  const ly = (hand.y - y) / s;
  const sh = {x: 3, y: -153};
  const ctrl = {x: (sh.x + lx) / 2 - 4, y: (sh.y + ly) / 2 + 16};
  return (
    <g transform={`translate(${x} ${y}) scale(${s * face} ${s})`}>
      <g fill={color}>
        {/* 后臂 */}
        <path d="M-4,-154 Q-11,-128 -8,-100" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
        {/* 腿与鞋 */}
        <path d="M-8,-88 L1,-88 L-1,-3 L-8,-3 Z" />
        <path d="M0,-88 L10,-88 L10,-3 L3,-3 Z" />
        <path d="M-10,-5 L5,-5 C8,-5 9,-2 9,0 L-10,0 Z" />
        <path d="M2,-5 L15,-5 C18,-5 19,-2 19,0 L2,0 Z" />
        {kind === 'hair' ? (
          /* 长风衣 */
          <path d="M-13,-160 C-19,-150 -20,-118 -19,-70 L14,-70 C17,-112 16,-146 9,-160 C3,-164 -7,-164 -13,-160 Z" />
        ) : (
          /* 衬衫 + 腰带 */
          <>
            <path d="M-15,-160 C-20,-148 -20,-118 -17,-92 L16,-92 C18,-118 18,-146 11,-160 C3,-164 -8,-164 -15,-160 Z" />
            <path d="M-15,-95 L16,-95 L12,-84 L-12,-84 Z" />
          </>
        )}
        {/* 颈、头、鼻 */}
        <rect x={-4} y={-171} width={8} height={13} rx={2} />
        <ellipse cx={1} cy={-180} rx={9.5} ry={11} />
        <path d="M9.5,-184 L13.6,-178.5 L9.8,-176.4 Z" />
        {kind === 'hair' ? (
          <path d="M-10,-186 C-9,-196 9,-197 11,-187 L9,-185 C5,-190 -2,-189 -5,-184 C-6,-176 -8,-168 -9,-159 C-12,-158 -14,-163 -13,-170 C-12,-176 -11,-181 -10,-186 Z" />
        ) : (
          <>
            <ellipse cx={1} cy={-187} rx={24} ry={3.4} />
            <path d="M-10,-187 C-10,-202 12,-202 12,-187 Z" />
            <line x1={-10} y1={-190} x2={12} y2={-190} stroke="#8A7656" strokeWidth={1.6} />
          </>
        )}
      </g>
      {/* 前臂：伸向握手点 */}
      <path d={`M${sh.x},${sh.y} Q${ctrl.x},${ctrl.y} ${lx},${ly}`} fill="none" stroke={color} strokeWidth={8.5} strokeLinecap="round" />
      <ellipse cx={lx} cy={ly} rx={5.4} ry={4.6} fill={color} />
    </g>
  );
};

const SceneA: React.FC<{f: number; a: ReturnType<typeof buildA>; opacity: number}> = ({f, a, opacity}) => {
  const zoom = interpolate(f, [0, 100], [1, 1.06], {...cl, easing: Easing.inOut(Easing.sin)});
  const bay = (i: number) => interpolate(f, [6 + i * 8, 30 + i * 8], [0, 1], {...cl, easing: Easing.out(Easing.back(1.15))});
  const roofDone = bay(BAYS - 1);
  const dock = interpolate(f, [22, 46], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const bargeX = interpolate(f, [0, 66], [460, 0], {...cl, easing: Easing.out(Easing.cubic)});
  const bob = Math.sin(f * 0.12) * 2;
  const saw = f * 0.5;

  // 人物：走近 → 伸手 → 握手（上下两下）
  const step = interpolate(f, [0, 22], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const himX = lerp(190, 236, step);
  const luisX = lerp(476, 424, step);
  const s = FIG_H / 200;
  const ext = interpolate(f, [18, 40], [0, 1], {...cl, easing: io});
  const pump = f > 40 ? Math.sin((f - 40) * 0.42) * 7 * interpolate(f, [40, 78], [1, 0], cl) : 0;
  const hs = {x: HS.x, y: HS.y + pump};
  const restHim = {x: himX + 5 * s, y: FEET - 100 * s};
  const restLuis = {x: luisX - 5 * s, y: FEET - 100 * s};
  const handHim = {x: lerp(restHim.x, hs.x - 3, ext), y: lerp(restHim.y, hs.y, ext)};
  const handLuis = {x: lerp(restLuis.x, hs.x + 3, ext), y: lerp(restLuis.y, hs.y, ext)};
  const glow = interpolate(f, [40, 52, 86], [0, 1, 0.5], cl);

  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <InkDefs p="mla" seed={89} />
        <linearGradient id="mla-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF2C6" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#FFF2C6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="mla-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCDFCB" />
          <stop offset="100%" stopColor="#E9E5D2" />
        </linearGradient>
        <radialGradient id="mla-glow">
          <stop offset="0%" stopColor="#FFE7A0" stopOpacity={1} />
          <stop offset="100%" stopColor="#FFE7A0" stopOpacity={0} />
        </radialGradient>
        {new Array(BAYS).fill(0).map((_, i) => (
          <clipPath key={i} id={`mla-bay${i}`}>
            <rect x={MX + i * BW - 20} y={BANK - (POST_H + 120) * Math.max(0, bay(i))} width={BW + 40} height={(POST_H + 120) * Math.max(0, bay(i)) + 4} />
          </clipPath>
        ))}
      </defs>
      <g transform={`translate(${W / 2} ${BANK}) scale(${zoom}) translate(${-W / 2} ${-BANK})`}>
        {/* 顶光 */}
        <g style={{mixBlendMode: 'screen'}}>
          {[980, 1180, 1420].map((x, i) => (
            <polygon key={i} points={`${x - 40},-20 ${x + 40},-20 ${x + 140 + i * 20},${BANK} ${x - 160},${BANK}`} fill="url(#mla-ray)" opacity={0.32 + 0.1 * Math.sin(f * 0.05 + i)} />
          ))}
        </g>
        {/* 远景雨林墙 */}
        <g filter="url(#mla-soft)">
          {a.far.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={i % 2 ? '#B4C29C' : '#A9B98F'} opacity={0.55} />
          ))}
        </g>
        {/* 冠层上方的露生巨树 */}
        <g filter="url(#mla-bleed)">
          {[{x: 250, top: 300, w: 300}, {x: 1690, top: 280, w: 340}].map((t, i) => (
            <g key={i}>
              <path d={`M${t.x - 12},${BANK - 60} L${t.x - 5},${t.top + 40} L${t.x + 5},${t.top + 40} L${t.x + 12},${BANK - 60} Z`} fill={C.inkWash} opacity={0.55} />
              {new Array(9).fill(0).map((_, k) => {
                const ang = (k / 8) * Math.PI;
                return <circle key={k} cx={t.x + Math.cos(ang) * t.w * 0.45} cy={t.top + 40 - Math.sin(ang) * 34} r={40 + random(`em${i}${k}`) * 16} fill="#8EA373" opacity={0.85} />;
              })}
            </g>
          ))}
        </g>
        <g filter="url(#mla-bleed)">
          {a.trunks.map((t, i) => (
            <rect key={i} x={t.x - t.w / 2} y={t.y} width={t.w} height={BANK - t.y} fill={C.inkWash} opacity={0.38} />
          ))}
          {a.mid.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={['#8FA676', '#7E9766', '#6A8758'][i % 3]} opacity={0.88} />
          ))}
        </g>
        {/* 空地 */}
        <path d={a.ground} fill="#DCCFAC" />

        {/* 原木堆场 */}
        <g>
          {a.logs.map((l, i) => {
            const p = interpolate(f, [l.t, l.t + 10], [0, 1], {...cl, easing: Easing.out(Easing.bounce)});
            if (p <= 0) return null;
            return (
              <g key={i} transform={`translate(0 ${(1 - p) * -60})`} opacity={Math.min(1, p * 3)}>
                <circle cx={l.x} cy={l.y} r={13} fill={l.fill} stroke="#7A4A20" strokeWidth={2} />
                <circle cx={l.x} cy={l.y} r={7} fill="none" stroke="#8E5A2A" strokeWidth={1.2} opacity={0.8} />
                <circle cx={l.x} cy={l.y} r={2} fill="#7A4A20" />
              </g>
            );
          })}
        </g>

        {/* 木结构厂房：一跨一跨立起 */}
        {new Array(BAYS).fill(0).map((_, i) => {
          const p = bay(i);
          if (p <= 0) return null;
          const x = MX + i * BW;
          const topY = BANK - POST_H;
          const closed = i === 0 || i === 1 || i === 5;
          return (
            <g key={i} clipPath={`url(#mla-bay${i})`}>
              <g filter="url(#mla-bleed)">
                {/* 屋顶 */}
                <path d={`M${x - 10},${topY + 8} L${x + BW + 10},${topY + 8} L${x + BW + 4},${topY - 64} L${x - 4},${topY - 64} Z`} fill="#7B5A3A" />
                {[0, 1, 2, 3].map((k) => (
                  <line key={k} x1={x - 8 + k * 1.5} y1={topY - 4 - k * 16} x2={x + BW + 8 - k * 1.5} y2={topY - 4 - k * 16} stroke="#5E4430" strokeWidth={2} opacity={0.6} />
                ))}
                <rect x={x - 6} y={topY - 70} width={BW + 12} height={8} fill="#5E4430" />
                {/* 立柱、横梁、斜撑 */}
                <rect x={x} y={topY} width={10} height={POST_H} fill="#6E5238" />
                <rect x={x + BW - 10} y={topY} width={10} height={POST_H} fill="#6E5238" />
                <rect x={x} y={topY} width={BW} height={10} fill="#6E5238" />
                <path d={`M${x + 10},${topY + 40} L${x + 40},${topY + 10} M${x + BW - 10},${topY + 40} L${x + BW - 40},${topY + 10}`} stroke="#6E5238" strokeWidth={6} />
                {closed ? (
                  <g>
                    <rect x={x + 10} y={BANK - 70} width={BW - 20} height={70} fill="#9C7A55" />
                    {[0, 1, 2, 3, 4].map((k) => (
                      <line key={k} x1={x + 22 + k * 17} y1={BANK - 70} x2={x + 22 + k * 17} y2={BANK} stroke="#7A5C3E" strokeWidth={1.6} />
                    ))}
                  </g>
                ) : (
                  <rect x={x + 10} y={topY + 10} width={BW - 20} height={POST_H - 10} fill="#5E4A36" opacity={0.22} />
                )}
              </g>
              {/* 内景：圆锯与原木 */}
              {i === 3 ? (
                <g transform={`translate(${x + BW / 2} ${BANK - 52}) rotate(${saw * 40})`}>
                  <circle r={30} fill="#BFB6A4" stroke="#6E6658" strokeWidth={2} />
                  {new Array(16).fill(0).map((__, k) => {
                    const ang = (k / 16) * Math.PI * 2;
                    return <path key={k} d={`M${Math.cos(ang) * 28},${Math.sin(ang) * 28} L${Math.cos(ang + 0.14) * 36},${Math.sin(ang + 0.14) * 36} L${Math.cos(ang + 0.3) * 28},${Math.sin(ang + 0.3) * 28} Z`} fill="#6E6658" />;
                  })}
                  <circle r={6} fill="#6E6658" />
                </g>
              ) : null}
              {i === 2 || i === 4 ? (
                <g>
                  <rect x={x + 6} y={BANK - 34} width={BW - 12} height={22} rx={11} fill="#B97B42" stroke="#7A4A20" strokeWidth={2} />
                  <rect x={x + 16} y={BANK - 12} width={BW - 32} height={12} fill="#6E5238" />
                </g>
              ) : null}
            </g>
          );
        })}
        {/* 蒸汽烟囱 */}
        <g opacity={roofDone}>
          <rect x={MX + BW * 5 + 40} y={BANK - POST_H - 130} width={20} height={80} fill="#6E5238" />
          {new Array(5).fill(0).map((_, k) => {
            const t = (f * 0.014 + k / 5) % 1;
            return <circle key={k} cx={MX + BW * 5 + 50 + t * 70} cy={BANK - POST_H - 140 - t * 130} r={12 + t * 30} fill="#FBF6EC" opacity={(1 - t) * 0.65 * roofDone} />;
          })}
        </g>

        {/* 河 */}
        <rect x={-100} y={RIVER_TOP} width={W + 200} height={RIVER_BOT - RIVER_TOP + 40} fill="url(#mla-river)" />
        <rect x={-100} y={RIVER_TOP} width={W + 200} height={36} fill="#9DAE88" opacity={0.22} filter="url(#mla-soft)" />
        <g strokeLinecap="round">
          {a.ripples.map((r, i) => {
            const x = ((r.x + f * r.v) % (W + 200)) - 100;
            return <line key={i} x1={x} y1={r.y} x2={x + r.l} y2={r.y} stroke={i % 3 ? '#FBF6EC' : '#A8B3A4'} strokeWidth={i % 3 ? 3 : 2} opacity={0.75} />;
          })}
        </g>

        {/* 码头 */}
        <g>
          <rect x={1380} y={RIVER_TOP - 6} width={270 * dock} height={12} fill="#8A6A48" />
          {[1396, 1476, 1556, 1636].map((px, k) =>
            1380 + 270 * dock > px ? <rect key={k} x={px} y={RIVER_TOP + 6} width={8} height={70} fill="#6E5238" opacity={0.85} /> : null,
          )}
        </g>
        {/* 驳船 */}
        <g transform={`translate(${bargeX} ${bob})`}>
          <path d={`M1648,${RIVER_TOP + 16} Q1600,${RIVER_TOP + 40} 1520,${RIVER_TOP + 50}`} fill="none" stroke="#5E4A36" strokeWidth={2} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={1478 + k * 8} y={748 - k * 14} width={230 - k * 16} height={14} rx={7} fill={['#C78A4A', '#B5743A', '#D89A58'][k]} stroke="#7A4A20" strokeWidth={1.5} />
          ))}
          <rect x={1730} y={728} width={42} height={40} fill="#7A6048" />
          <rect x={1740} y={736} width={14} height={12} fill="#E9E2C8" />
          <path d="M1440,764 L1796,764 L1772,802 L1464,802 Z" fill="#5E4A36" />
          <line x1={1440} y1={766} x2={1796} y2={766} stroke="#3E3226" strokeWidth={3} />
          <path d="M1464,804 L1772,804" stroke="#A8B3A4" strokeWidth={3} opacity={0.6} />
        </g>

        {/* 前景河岸 */}
        <path d="M-120,1120 L-120,880 C180,864 520,872 780,902 C880,914 960,962 1000,1120 Z" fill="#6B5C4A" opacity={0.5} filter="url(#mla-wash)" />
        <g fill="none" stroke="#5E7D52" strokeWidth={4} strokeLinecap="round" opacity={0.75} filter="url(#mla-bleed)">
          {a.tufts.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* 握手：光 + 两个剪影 */}
        <circle cx={HS.x} cy={HS.y} r={70 + glow * 30} fill="url(#mla-glow)" opacity={glow * 0.8} style={{mixBlendMode: 'screen'}} />
        <ellipse cx={(himX + luisX) / 2} cy={FEET + 4} rx={150} ry={9} fill="#3E3226" opacity={0.25} />
        <SideFigure x={himX} y={FEET} h={FIG_H} face={1} kind="hair" hand={handHim} color="#2E2822" />
        <SideFigure x={luisX} y={FEET} h={FIG_H * 1.01} face={-1} kind="hat" hand={handLuis} color="#3A3128" />

        {/* 前景蕨叶 */}
        <g fill="none" stroke="#5E7D52" strokeWidth={7} strokeLinecap="round" opacity={0.7} filter="url(#mla-bleed)">
          {[{x: 1830, s: 1.4}, {x: 1680, s: 0.9}].map((p, i) => (
            <g key={i}>
              {[-1.2, -0.7, -0.25, 0.25, 0.7, 1.2].map((ang, j) => (
                <path key={j} d={`M${p.x},${H + 20} q${Math.sin(ang) * 90 * p.s},${-140 * p.s} ${Math.sin(ang) * 190 * p.s},${(-90 + Math.abs(ang) * 70) * p.s}`} />
              ))}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
};

const buildA = () => {
  const far = new Array(44).fill(0).map((_, i) => ({
    x: i * 46 - 20 + random(`mfx${i}`) * 30,
    y: 470 + smoothNoise(i * 0.4, 'mfy', 3) * 40,
    r: 70 + random(`mfr${i}`) * 40,
  }));
  const mid = new Array(40).fill(0).map((_, i) => ({
    x: i * 52 - 30 + random(`mmx${i}`) * 26,
    y: 570 + smoothNoise(i * 0.5, 'mmy', 3) * 26,
    r: 52 + random(`mmr${i}`) * 32,
  }));
  const trunks = new Array(26).fill(0).map((_, i) => ({x: i * 78 + random(`mtx${i}`) * 40, y: 590, w: 10 + random(`mtw${i}`) * 10}));
  let ground = `M-100,${BANK + 40} L-100,650`;
  for (let x = -100; x <= W + 100; x += 40) ground += ` L${x},${(646 + smoothNoise(x * 0.006, 'mgr', 3) * 10).toFixed(1)}`;
  ground += ` L${W + 100},${BANK + 40} Z`;
  const logs: {x: number; y: number; t: number; fill: string}[] = [];
  const stacks = [{x: 470, rows: 4}, {x: 586, rows: 3}, {x: 672, rows: 2}];
  stacks.forEach((st, si) => {
    let n = 0;
    for (let r = 0; r < st.rows; r++) {
      const cnt = st.rows - r;
      for (let k = 0; k < cnt; k++) {
        logs.push({
          x: st.x + (k - (cnt - 1) / 2) * 26,
          y: BANK - 13 - r * 22,
          t: 16 + si * 12 + n * 2.2,
          fill: ['#B97B42', '#C78A4A', '#A86A34'][(k + r + si) % 3],
        });
        n++;
      }
    }
  });
  const ripples = new Array(34).fill(0).map((_, i) => ({
    x: random(`rpx${i}`) * (W + 200),
    y: RIVER_TOP + 14 + random(`rpy${i}`) * (RIVER_BOT - RIVER_TOP - 10),
    l: 30 + random(`rpl${i}`) * 70,
    v: 0.5 + random(`rpv${i}`) * 0.7,
  }));
  const tufts = [60, 140, 520, 600, 700].map((x, i) => fernTuft(x, 900 + (x > 500 ? 6 : 0), 36 + i * 4, `mtf${i}`));
  return {far, mid, trunks, ground, logs, ripples, tufts};
};

// ═════════════════════════ B/C：俯视几何 ═════════════════════════
const buildTop = () => {
  const planks = new Array(22).fill(0).map((_, i) => {
    const y = -800 + i * 130;
    let grain = '';
    for (let g = 0; g < 3; g++) {
      let d = '';
      for (let x = -1000; x <= 2900; x += 60) {
        const yy = y + 30 + g * 34 + smoothNoise(x * 0.004 + i * 3 + g, `pg${i}${g}`, 3) * 8;
        d += `${d ? 'L' : 'M'}${x},${yy.toFixed(1)} `;
      }
      grain += d;
    }
    return {y, h: 130, tone: i % 2 ? '#BE9B6E' : '#CCAE84', grain};
  });
  const satBg = buildBackground();
  const cells = buildCells();
  const nearRiver = (x: number, y: number, pad: number) => Math.abs(y - riverY(x)) < pad;
  const lush: {x: number; y: number; r: number; fill: string}[] = [];
  for (let i = 0; i < 420; i++) {
    const x = random(`lx${i}`) * 3200 - 640;
    const y = random(`ly${i}`) * 2100 - 520;
    if (x > GX - 6 && x < GX + GW + 6 && y > GY - 6 && y < GY + GH + 6) continue;
    if (nearRiver(x, y, 46) || inRect(x, y, CLEARING, 10)) continue;
    lush.push({x, y, r: 44 + random(`lr${i}`) * 40, fill: ['#6F8F62', '#5E7F55', '#7E9B6A', '#4F7048'][i % 4]});
  }
  const reserve: {x: number; y: number; r: number}[] = [];
  for (let x = -700; x <= 2600; x += 22) {
    if (x > CLEARING.x - 10 && x < CLEARING.x + CLEARING.w + 10) continue;
    for (const side of [-1, 1]) {
      const k = Math.round(x * 10 + side);
      reserve.push({x: x + random(`rvx${k}`) * 10, y: riverY(x) + side * (34 + random(`rvy${k}`) * 26), r: 18 + random(`rvr${k}`) * 14});
    }
  }
  const saplings: {x: number; y: number; r: number}[] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 9; c++) {
      saplings.push({x: NURSERY.x + 22 + c * 22, y: NURSERY.y + 22 + r * 25, r: 6 + random(`sp${r}${c}`) * 2});
    }
  }
  const glyphs: {x: number; y: number}[] = [];
  for (let i = 0; i < 260; i++) {
    const x = PAPER.x + 40 + random(`gx${i}`) * (PAPER.w - 80);
    const y = PAPER.y + 40 + random(`gy${i}`) * (PAPER.h - 80);
    if (nearRiver(x, y, 74) || inRect(x, y, CLEARING, 14) || inRect(x, y, {x: PAPER.x + PAPER.w - 360, y: PAPER.y, w: 360, h: 220})) continue;
    if (y < GY + 6 && y > GY - 60 && x < GX + 520) continue; // 标题“25 块轮伐区”
    glyphs.push({x, y});
  }
  return {planks, satBg, cells, lush, reserve, saplings, glyphs};
};
