import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {TreeRings, makeRings} from '../components/TreeRings';
import {AnxinLogoArt, LOGO_H, LOGO_TILES, LOGO_W} from '../components/AnxinLogo';

/**
 * s27（8 秒 / 240 帧）：收束
 *   0– 70  年轮从一点金光里一圈圈长出（呼应序章）
 *  50–140  46 块地板条从各自所在的年轮上飞出，落回原位，堆成金色大树；年轮隐去
 * 120–160  树干、地平弧显现
 * 150–190  红色“安信地板”浮现；金光扫过，定格
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const LW = 760;
const SC = LW / LOGO_W;
const LH = LOGO_H * SC;
const OX = (W - LW) / 2;
const OY = 96;
// 树冠中心（Logo 坐标）
const CC = {x: 933, y: 560};
const RC = {x: OX + CC.x * SC, y: OY + CC.y * SC};
const RINGS = makeRings(12, 'fin');
const N = LOGO_TILES.length;

export const S27Finale: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const ringsOut = interpolate(f, [100, 150], [1, 0], cl);
  const progress = RINGS.map((_, i) => interpolate(f, [4 + i * 4, 26 + i * 4], [0, 1], {...cl, easing: Easing.out(Easing.quad)}));
  const trunk = interpolate(f, [120, 156], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const text = interpolate(f, [150, 186], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const sweep = interpolate(f, [178, 226], [-0.3, 1.3], cl);
  const breathe = 1 + Math.sin(Math.max(0, f - 190) * 0.05) * 0.004;

  // 每块地板条的起点：沿“树心 → 地板条”方向投到某一圈年轮上
  const starts = useMemo(
    () =>
      LOGO_TILES.map((t) => {
        const dx = t.cx - CC.x;
        const dy = t.cy - CC.y;
        const len = Math.hypot(dx, dy) || 1;
        const r = RINGS[3 + (t.idx % 9)].r / SC; // 换算到 Logo 坐标
        return {x: CC.x + (dx / len) * r, y: CC.y + (dy / len) * r};
      }),
    [],
  );

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 34]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="s27-core">
            <stop offset="0%" stopColor="#FFF0C2" stopOpacity={1} />
            <stop offset="100%" stopColor="#FFF0C2" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s27-sweep" x1="0" y1="0" x2="1" y2="0.3">
            <stop offset={Math.max(0, sweep - 0.12)} stopColor="#fff" stopOpacity={0} />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFF6D8" stopOpacity={0.85} />
            <stop offset={Math.min(1, sweep + 0.12)} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="s27-mask">
            <g transform={`translate(${OX} ${OY}) scale(${SC})`}>
              <AnxinLogoArt tileFill="#fff" textColor="#fff" />
            </g>
          </mask>
        </defs>
        <circle cx={RC.x} cy={RC.y} r={420} fill="url(#s27-core)" opacity={0.55} />
        {/* 年轮 */}
        <g opacity={ringsOut}>
          <TreeRings rings={RINGS} progress={progress} cx={RC.x} cy={RC.y} strokeScale={1.2} />
          <circle cx={RC.x} cy={RC.y} r={6 + Math.sin(f * 0.2) * 1.5} fill={C.goldDeep} />
        </g>

        <g transform={`translate(${W / 2} ${OY + LH / 2}) scale(${breathe}) translate(${-W / 2} ${-(OY + LH / 2)})`}>
          <g transform={`translate(${OX} ${OY}) scale(${SC})`}>
            <AnxinLogoArt
              tileFill={C.gold}
              trunkOpacity={trunk}
              groundOpacity={trunk}
              textOpacity={text}
              tileStyle={(t) => {
                const st = 50 + (t.idx / N) * 70;
                const p = interpolate(f, [st, st + 26], [0, 1], {...cl, easing: io});
                if (p <= 0) return null;
                const s0 = starts[t.idx];
                return {
                  opacity: Math.min(1, p * 3),
                  transform: `translate(${(s0.x - t.cx) * (1 - p)} ${(s0.y - t.cy) * (1 - p)})`,
                };
              }}
            />
          </g>
          {sweep > 0 && sweep < 1.2 ? <rect x={0} y={0} width={W} height={H} fill="url(#s27-sweep)" mask="url(#s27-mask)" style={{mixBlendMode: 'screen'}} /> : null}
        </g>
      </svg>
      <GoldDust count={44} seed="s27d" opacity={0.85} />
    </AbsoluteFill>
  );
};
