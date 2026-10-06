import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';
import {AnxinLogoArt} from '../components/AnxinLogo';

/**
 * 第 19 镜（5 秒 / 150 帧）：1999，上海青浦
 * 承接卫星轮伐镜头：巴西原木运抵 → 锯齿屋顶厂房一跨一跨升起 → 烟囱冒烟、金色厂牌亮起，镜头缓缓后拉
 * （工厂建成于 1999 年，排在雨林与轮伐之后：木头有了着落，才有自己的工厂）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const GROUND = 780;
const BAYS = 7;
const BAY_W = 150;
const FX = 520; // 厂房左端

export const Factory: React.FC = () => {
  const f = useCurrentFrame();
  const out = Easing.out(Easing.cubic);
  const bay = (i: number) => interpolate(f, [26 + i * 7, 58 + i * 7], [0, 1], {...cl, easing: Easing.out(Easing.back(1.2))});
  const office = interpolate(f, [62, 92], [0, 1], {...cl, easing: out});
  const sign = interpolate(f, [86, 110], [0, 1], {...cl, easing: out});
  const truckX = interpolate(f, [0, 70], [-380, 300], {...cl, easing: Easing.out(Easing.quad)});
  const zoom = interpolate(f, [0, 150], [1.12, 1], {...cl, easing: Easing.inOut(Easing.sin)});

  return (
    <AbsoluteFill>
      <Paper glowAt={[60, 30]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s8-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F6E7C6" />
            <stop offset="100%" stopColor="#F8F1E2" />
          </linearGradient>
          <linearGradient id="s8-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9E2D2" />
            <stop offset="100%" stopColor="#D8CDB6" />
          </linearGradient>
        </defs>
        <rect width={W} height={GROUND} fill="url(#s8-sky)" />
        <circle cx={1500} cy={260} r={90} fill="#FBE3A6" opacity={0.8} />
        <g transform={`translate(${W / 2} ${GROUND}) scale(${zoom}) translate(${-W / 2} ${-GROUND})`}>
          {/* 远景城市剪影 */}
          <g fill="#D9C8A8" opacity={0.7}>
            {new Array(22).fill(0).map((_, i) => {
              const h = 60 + random(`bd${i}`) * 120;
              return <rect key={i} x={i * 90 - 20} y={GROUND - 120 - h} width={70} height={h + 120} />;
            })}
          </g>
          <rect x={-200} y={GROUND - 4} width={W + 400} height={H} fill="#E4D5B8" />
          <rect x={-200} y={GROUND + 60} width={W + 400} height={70} fill="#CDBB98" />
          <g stroke="#F6EEDC" strokeWidth={4} strokeDasharray="40 30">
            <line x1={-200} y1={GROUND + 95} x2={W + 200} y2={GROUND + 95} />
          </g>

          {/* 锯齿屋顶厂房 */}
          {new Array(BAYS).fill(0).map((_, i) => {
            const p = bay(i);
            if (p <= 0) return null;
            const x = FX + i * BAY_W;
            const h = 230;
            return (
              <g key={i} transform={`translate(0 ${(1 - p) * h})`} opacity={Math.min(1, p * 2)}>
                <rect x={x} y={GROUND - h} width={BAY_W} height={h} fill="url(#s8-wall)" stroke="#BCAE92" strokeWidth={2} />
                <path d={`M${x},${GROUND - h} L${x + BAY_W * 0.72},${GROUND - h - 70} L${x + BAY_W * 0.72},${GROUND - h} Z`} fill="#A9583A" />
                <path d={`M${x + BAY_W * 0.72},${GROUND - h - 70} L${x + BAY_W},${GROUND - h} L${x + BAY_W * 0.72},${GROUND - h} Z`} fill="#9FC3D8" opacity={0.9} />
                {[0, 1].map((k) => (
                  <rect key={k} x={x + 22 + k * 62} y={GROUND - h + 40} width={44} height={60} fill="#8FB3C8" opacity={0.75} />
                ))}
                {i % 3 === 1 ? <rect x={x + 30} y={GROUND - 120} width={90} height={120} fill="#7A6A54" /> : null}
                {i % 3 === 1 ? (
                  <g stroke="#5E5040" strokeWidth={2}>
                    {[0, 1, 2, 3, 4].map((k) => (
                      <line key={k} x1={x + 30} y1={GROUND - 110 + k * 22} x2={x + 120} y2={GROUND - 110 + k * 22} />
                    ))}
                  </g>
                ) : null}
              </g>
            );
          })}
          {/* 烟囱 */}
          <g transform={`translate(0 ${(1 - bay(5)) * 300})`} opacity={bay(5)}>
            <rect x={FX + BAY_W * 5 + 40} y={GROUND - 430} width={36} height={200} fill="#B9A88A" />
            <rect x={FX + BAY_W * 5 + 36} y={GROUND - 440} width={44} height={14} fill="#9C8B6E" />
            {new Array(5).fill(0).map((_, k) => {
              const t = ((f * 0.012 + k / 5) % 1);
              return (
                <circle
                  key={k}
                  cx={FX + BAY_W * 5 + 58 + t * 90}
                  cy={GROUND - 450 - t * 160}
                  r={18 + t * 40}
                  fill="#FBF6EC"
                  opacity={(1 - t) * 0.7}
                />
              );
            })}
          </g>
          {/* 办公楼 + 金色厂牌 */}
          <g transform={`translate(0 ${(1 - office) * 320})`} opacity={office}>
            <rect x={FX - 240} y={GROUND - 320} width={220} height={320} fill="#EFE8D8" stroke="#BCAE92" strokeWidth={2} />
            {new Array(5).fill(0).map((_, r) =>
              new Array(3).fill(0).map((__, c) => (
                <rect key={`${r}${c}`} x={FX - 220 + c * 66} y={GROUND - 296 + r * 56} width={46} height={34} fill="#9FC3D8" opacity={0.8} />
              )),
            )}
          </g>
          <g opacity={sign} transform={`translate(${FX + 30} ${GROUND - 330}) scale(${0.9 + sign * 0.1})`}>
            <rect x={0} y={0} width={680} height={72} fill="#FBF6EC" stroke={C.gold} strokeWidth={4} />
            <g transform="translate(18 8) scale(0.042)">
              <AnxinLogoArt tileFill={C.gold} />
            </g>
            <text x={120} y={48} fontFamily={sans} fontWeight={900} fontSize={34} fill={C.red} letterSpacing={6}>
              安信地板 · 上海青浦工厂
            </text>
          </g>
          {/* 木材堆 */}
          {new Array(3).fill(0).map((_, s) => (
            <g key={s} opacity={office}>
              {new Array(5).fill(0).map((__, r) => (
                <rect key={r} x={1640 + s * 70 - r * 0} y={GROUND - 22 - r * 22} width={60 - (r % 2) * 8} height={18} fill={['#B5743A', '#A0602C', '#C78A4A'][(r + s) % 3]} stroke="#7A4A20" strokeWidth={1.5} />
              ))}
            </g>
          ))}
          {/* 运木货车 */}
          <g transform={`translate(${truckX} ${GROUND + 70})`}>
            <rect x={0} y={-80} width={210} height={70} fill="#7E4A22" />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={6} y={-78 + k * 22} width={198} height={18} fill={['#C78A4A', '#B5743A', '#D89A58'][k]} />
            ))}
            <rect x={214} y={-74} width={76} height={64} fill={C.gold} rx={6} />
            <rect x={240} y={-66} width={40} height={26} fill="#CFE4F0" />
            {[40, 160, 252].map((x) => (
              <g key={x}>
                <circle cx={x} cy={-6} r={18} fill={C.ink} />
                <circle cx={x} cy={-6} r={7} fill="#CFC3AC" />
              </g>
            ))}
          </g>
        </g>
      </svg>
      <OldPhoto strength={0.6} seed="s8" leak={false} />
    </AbsoluteFill>
  );
};
