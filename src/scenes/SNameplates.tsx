import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {smoothNoise} from '../lib/geom';

/**
 * nameplates（5 秒 / 150 帧）：他在雨林里找到的四种木头
 * 四张标本名牌依次从上方垂落、轻轻摆动后静止；上半部是各自心材的木纹色样，
 * 下半部是商品名 / 中文名 / 学名。最后一道金光从左到右扫过四块木样。
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SPECIES = [
  {trade: 'Ipe', zh: '重蚁木', sci: 'Handroanthus spp.', base: '#6E4C2E', dark: '#46301D', light: '#8A6440'},
  {trade: 'Cumaru', zh: '二翅豆', sci: 'Dipteryx odorata', base: '#9A6538', dark: '#6E4424', light: '#B88452'},
  {trade: 'Garapa', zh: '铁苏木', sci: 'Apuleia leiocarpa', base: '#C59A58', dark: '#9C773F', light: '#DDB878'},
  {trade: 'Balsamo', zh: '香脂木豆', sci: 'Myroxylon balsamum', base: '#7E412B', dark: '#58291A', light: '#9C5A3E'},
];
const CW = 310;
const CH = 470;
const SW = 230; // 木样高度
const TOP = 210;
const XS = [420, 780, 1140, 1500];

export const SNameplates: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(f, [0, 150], [1, 1.04], cl);
  const sweep = interpolate(f, [92, 140], [-0.2, 1.2], {...cl, easing: Easing.inOut(Easing.sin)});
  const grains = useMemo(() => SPECIES.map((_, i) => buildGrain(i)), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 30]} tint="rgba(190,210,170,0.10)" />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <InkDefs p="np" seed={71} />
            {SPECIES.map((_, i) => (
              <clipPath key={i} id={`np-sw-${i}`}>
                <rect x={-CW / 2 + 16} y={16} width={CW - 32} height={SW} rx={4} />
              </clipPath>
            ))}
            <linearGradient id="np-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFF4D2" stopOpacity={0} />
              <stop offset="50%" stopColor="#FFF4D2" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#FFF4D2" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* 背景：淡墨大叶 */}
          <g filter="url(#np-wash)" opacity={0.2} fill={C.leaf}>
            {[
              [80, 120, -30, 1.4],
              [1840, 160, 210, 1.6],
              [140, 960, 20, 1.2],
              [1780, 980, 160, 1.3],
            ].map(([x, y, r, s], i) => (
              <path key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} d="M0,0 C60,-70 200,-60 260,0 C200,60 60,70 0,0 Z" />
            ))}
          </g>

          {SPECIES.map((sp, i) => {
            const delay = 4 + i * 13;
            const drop = spring({frame: f - delay, fps, config: {damping: 14, stiffness: 90, mass: 0.9}});
            const swing = Math.sin((f - delay) * 0.16) * 5 * Math.exp(-Math.max(0, f - delay) * 0.035) * (f > delay ? 1 : 0);
            const y = TOP - (1 - drop) * 700;
            const x = XS[i];
            const g = grains[i];
            return (
              <g key={i} opacity={f > delay ? 1 : 0}>
                {/* 吊绳 */}
                <line x1={x} y1={-20} x2={x + Math.sin((swing * Math.PI) / 180) * (y + 20)} y2={y} stroke={C.inkMute} strokeWidth={1.6} />
                <g transform={`translate(${x} ${y}) rotate(${swing})`}>
                  {/* 阴影 */}
                  <rect x={-CW / 2 + 8} y={10} width={CW} height={CH} rx={8} fill="#5B4A36" opacity={0.14} filter="url(#np-soft)" />
                  {/* 卡片 */}
                  <rect x={-CW / 2} y={0} width={CW} height={CH} rx={8} fill="#FBF5E8" stroke={C.goldDeep} strokeWidth={1.4} />
                  <rect x={-CW / 2 + 7} y={7} width={CW - 14} height={CH - 14} rx={5} fill="none" stroke={C.gold} strokeWidth={0.8} opacity={0.6} />
                  {/* 木样 */}
                  <g clipPath={`url(#np-sw-${i})`}>
                    <rect x={-CW / 2} y={0} width={CW} height={SW + 40} fill={sp.base} />
                    {g.map((l, k) => (
                      <path key={k} d={l.d} fill="none" stroke={l.dark ? sp.dark : sp.light} strokeWidth={l.w} opacity={l.o} />
                    ))}
                    <rect x={sweep * (W + 600) - 300 - x - 60} y={-40} width={120} height={SW + 120} fill="url(#np-sweep)" opacity={0.55} transform={`skewX(-18)`} style={{mixBlendMode: 'screen'}} />
                  </g>
                  <rect x={-CW / 2 + 16} y={16} width={CW - 32} height={SW} rx={4} fill="none" stroke="#3A2A1A" strokeOpacity={0.25} />
                  {/* 吊孔 */}
                  <circle cx={0} cy={0} r={7} fill="#FBF5E8" stroke={C.goldDeep} strokeWidth={1.6} />
                  {/* 编号 */}
                  <text x={CW / 2 - 22} y={SW + 40} textAnchor="end" fontFamily={sans} fontSize={13} letterSpacing={3} fill={C.inkMute}>
                    {`N° 0${i + 1}`}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* 文字（HTML，跟随卡片落下与摆动） */}
        {SPECIES.map((sp, i) => {
          const delay = 4 + i * 13;
          const drop = spring({frame: f - delay, fps, config: {damping: 14, stiffness: 90, mass: 0.9}});
          const swing = Math.sin((f - delay) * 0.16) * 5 * Math.exp(-Math.max(0, f - delay) * 0.035) * (f > delay ? 1 : 0);
          const y = TOP - (1 - drop) * 700;
          const txt = interpolate(f, [delay + 14, delay + 30], [0, 1], cl);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: XS[i] - CW / 2,
                top: y,
                width: CW,
                height: CH,
                transformOrigin: `${CW / 2}px 0px`,
                transform: `rotate(${swing}deg)`,
                opacity: f > delay ? 1 : 0,
              }}
            >
              <div style={{position: 'absolute', top: SW + 52, left: 0, right: 0, textAlign: 'center', opacity: txt}}>
                <div style={{fontFamily: serif, fontWeight: 600, fontSize: 46, lineHeight: 1.15, color: C.ink, letterSpacing: '0.04em'}}>{sp.trade}</div>
                <div style={{fontFamily: serif, fontWeight: 500, fontSize: 28, lineHeight: 1.2, color: C.goldDeep, letterSpacing: '0.24em', marginTop: 6}}>{sp.zh}</div>
                <div style={{width: 40, height: 1, background: C.gold, margin: '14px auto 10px'}} />
                <div style={{fontFamily: serif, fontStyle: 'italic', fontSize: 17, color: C.inkMute, letterSpacing: '0.04em'}}>{sp.sci}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <GoldDust count={28} seed="npd" opacity={0.6} />
    </AbsoluteFill>
  );
};

/** 心材木纹：起伏的纵向纹理 + 一组“山纹” */
const buildGrain = (i: number) => {
  const out: {d: string; dark: boolean; w: number; o: number}[] = [];
  const n = 22;
  for (let k = 0; k < n; k++) {
    const x0 = -CW / 2 + 10 + (k / (n - 1)) * (CW - 20) + (random(`g${i}${k}`) - 0.5) * 8;
    let d = '';
    for (let y = -10; y <= SW + 40; y += 10) {
      const x = x0 + smoothNoise(y * 0.012 + k * 0.4, `gn${i}`, 3) * 14 + smoothNoise(y * 0.05 + k, `gm${i}${k}`, 2) * 2;
      d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y} `;
    }
    out.push({d, dark: k % 3 !== 1, w: 1 + random(`gw${i}${k}`) * 2.6, o: 0.35 + random(`go${i}${k}`) * 0.4});
  }
  // 山纹（弦切面的拱形纹）
  const cx = (random(`ac${i}`) - 0.5) * 60;
  for (let k = 0; k < 6; k++) {
    const w = 20 + k * 16;
    const top = 40 + k * 22;
    out.push({
      d: `M${cx - w},${SW + 40} C${cx - w},${top + 60} ${cx - w * 0.3},${top} ${cx},${top} C${cx + w * 0.3},${top} ${cx + w},${top + 60} ${cx + w},${SW + 40}`,
      dark: true,
      w: 1.6,
      o: 0.45,
    });
  }
  return out;
};
