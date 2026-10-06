import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 10 镜（6 秒 / 180 帧）：1998，禁伐
 * 左：一纸红头公文滑入，正文逐行显现，红章“禁止砍伐”重重盖下（画面一震）
 * 右：工厂木料场的原木堆，红章落下后一根根消失，最后只剩空地和几块垫木
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const STAMP = 70;
const LOGS = (() => {
  const out: {x: number; y: number; r: number; k: number}[] = [];
  const rows = [7, 6, 5, 4, 3];
  let k = 0;
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) {
      out.push({x: 1260 + (i - (n - 1) / 2) * 92, y: 780 - r * 80, r: 44 + random(`lr${k}`) * 4, k: k++});
    }
  });
  return out;
})();

export const S10Ban: React.FC = () => {
  const f = useCurrentFrame();
  const docIn = interpolate(f, [0, 26], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const lines = (i: number) => interpolate(f, [16 + i * 4, 30 + i * 4], [0, 1], cl);
  const stamp = interpolate(f, [STAMP - 8, STAMP], [0, 1], {...cl, easing: Easing.in(Easing.cubic)});
  const hit = f >= STAMP ? Math.exp(-(f - STAMP) * 0.25) : 0;
  const shake = hit * Math.sin((f - STAMP) * 2.2) * 10;
  const inkSpread = interpolate(f, [STAMP, STAMP + 10], [0.92, 1], cl);
  const dim = interpolate(f, [STAMP, 170], [0, 0.18], cl);

  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
      <Paper glowAt={[40, 40]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s10-log" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E3B57A" />
            <stop offset="100%" stopColor="#B57A40" />
          </linearGradient>
          <filter id="s10-stamp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.6" result="holes" />
            <feComposite in="SourceGraphic" in2="holes" operator="in" />
          </filter>
          <filter id="s10-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#6B4E2A" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* 木料场 */}
        <g>
          <rect x={900} y={840} width={720} height={14} fill="#B9A988" />
          {[1000, 1260, 1520].map((x) => (
            <rect key={x} x={x - 60} y={824} width={120} height={18} fill="#8C7350" />
          ))}
          {LOGS.map((l) => {
            // 红章落下后，从上往下一根根被运走
            const order = LOGS.length - 1 - l.k;
            const t0 = STAMP + 8 + order * 3.2;
            const gone = interpolate(f, [t0, t0 + 10], [0, 1], {...cl, easing: Easing.in(Easing.quad)});
            if (gone >= 1) return null;
            return (
              <g key={l.k} transform={`translate(${l.x + gone * 160} ${l.y - gone * 60})`} opacity={1 - gone}>
                <circle r={l.r} fill="url(#s10-log)" stroke="#7A4A20" strokeWidth={4} />
                <circle r={l.r * 0.66} fill="none" stroke="#9A6430" strokeWidth={2} opacity={0.7} />
                <circle r={l.r * 0.36} fill="none" stroke="#9A6430" strokeWidth={2} opacity={0.7} />
                <circle r={4} fill="#7A4A20" />
              </g>
            );
          })}
          {/* 空地上的标签 */}
          <g opacity={interpolate(f, [150, 170], [0, 1], cl)}>
            <text x={1260} y={760} textAnchor="middle" fontFamily={sans} fontSize={30} letterSpacing={10} fill={C.inkMute}>
              原 料 告 罄
            </text>
          </g>
        </g>

        {/* 公文 */}
        <g transform={`translate(${560 - (1 - docIn) * 500} ${520}) rotate(${-3 + (1 - docIn) * -8})`} opacity={docIn} filter="url(#s10-shadow)">
          <rect x={-300} y={-400} width={600} height={800} fill="#FDFBF5" />
          <text x={0} y={-300} textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={66} fill={C.red} letterSpacing={6}>
            文　件
          </text>
          <rect x={-250} y={-266} width={500} height={5} fill={C.red} />
          <path d="M-12,-268 L0,-280 L12,-268 Z" fill={C.red} />
          {/* 标题用抽象粗线表示，不虚构具体公文名称 */}
          <rect x={-190} y={-214} width={380 * lines(0)} height={18} rx={6} fill="#6E655A" />
          <rect x={-120} y={-184} width={240 * lines(0)} height={14} rx={6} fill="#8E8576" />
          {new Array(9).fill(0).map((_, i) => {
            const w = [460, 500, 480, 500, 420, 500, 470, 360, 0][i];
            return <rect key={i} x={-250} y={-130 + i * 44} width={w * lines(i)} height={8} rx={4} fill="#C9C0AE" />;
          })}
          <text x={200} y={300} textAnchor="end" fontFamily={sans} fontSize={22} fill={C.inkSoft} opacity={lines(8)}>
            一九九八年
          </text>
          {/* 红章 */}
          {stamp > 0 ? (
            <g transform={`translate(70 160) scale(${(2.4 - 1.4 * stamp) * inkSpread}) rotate(-14)`} opacity={stamp}>
              <g filter="url(#s10-stamp)">
                <rect x={-150} y={-62} width={300} height={124} rx={10} fill="none" stroke={C.seal} strokeWidth={10} />
                <text x={0} y={26} textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={76} fill={C.seal} letterSpacing={8}>
                  禁止砍伐
                </text>
              </g>
            </g>
          ) : null}
        </g>
      </svg>
      {/* 章落下时的冲击闪白 */}
      <AbsoluteFill style={{background: '#FFF6E6', opacity: hit * 0.35}} />
      <AbsoluteFill style={{background: '#6B5C4A', opacity: dim, mixBlendMode: 'multiply'}} />
      <OldPhoto strength={0.55} seed="s10" leak={false} />
    </AbsoluteFill>
  );
};
