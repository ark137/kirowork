import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {GoldDust} from '../components/GoldDust';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 15 镜（6 秒 / 180 帧）：一个多月后，传真机响了（夜，中等亮度）
 * A  0–84   传真纸一张张飞出窗外，化作星点，没有回音；墙上日历一页页翻过
 * B 84–180  寂静的夜。传真机指示灯忽然变绿、震动；纸缓缓吐出：“COTAÇÃO 报价单 — Luis”
 *           暖光从机器里漫开，照亮整个房间
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FAX = {x: 820, y: 720};
const RING = 100;

export const S15Fax: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const ring = f >= RING ? 1 : 0;
  const buzz = f >= RING && f < RING + 30 ? Math.sin((f - RING) * 2.4) * 3 : 0;
  const paperOut = interpolate(f, [RING + 14, 172], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const warm = interpolate(f, [RING, RING + 50], [0, 1], {...cl, easing: io});
  const page = Math.floor(interpolate(f, [6, 90], [0, 34], cl));
  const day = 7 + page; // 7 月 7 日起
  const month = day > 31 ? 8 : 7;
  const dd = day > 31 ? day - 31 : day;
  const push = interpolate(f, [RING, 180], [1, 1.12], {...cl, easing: io});

  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s15-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#56688A" />
            <stop offset="100%" stopColor="#6C7C98" />
          </linearGradient>
          <radialGradient id="s15-lamp" cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#FFE2A8" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#FFE2A8" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="s15-warm" cx="43%" cy="62%" r="60%">
            <stop offset="0%" stopColor="#FFE6A8" stopOpacity={0.95} />
            <stop offset="60%" stopColor="#F7C86A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F7C86A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${FAX.x} ${FAX.y - 120}) scale(${push}) translate(${-FAX.x} ${-FAX.y + 120})`}>
          <rect width={W} height={H} fill="url(#s15-wall)" />
          {/* 窗与夜空 */}
          <g>
            <rect x={1220} y={150} width={520} height={440} fill="#2F3D58" stroke="#8B94A8" strokeWidth={12} />
            <line x1={1480} y1={150} x2={1480} y2={590} stroke="#8B94A8" strokeWidth={8} />
            <line x1={1220} y1={370} x2={1740} y2={370} stroke="#8B94A8" strokeWidth={8} />
            {new Array(30).fill(0).map((_, i) => (
              <circle key={i} cx={1230 + random(`st${i}`) * 500} cy={160 + random(`sy${i}`) * 420} r={1.5 + random(`sr${i}`) * 2} fill="#F4EEDC" opacity={0.5 + 0.5 * Math.sin(f * 0.1 + i)} />
            ))}
            <circle cx={1640} cy={240} r={34} fill="#F4EEDC" />
            <circle cx={1654} cy={230} r={30} fill="#2F3D58" />
          </g>
          {/* 墙上日历 */}
          <g transform="translate(300 220)">
            <rect x={-90} y={0} width={180} height={210} fill="#FBF6EC" />
            <rect x={-90} y={0} width={180} height={52} fill={C.seal} />
            <text x={0} y={36} textAnchor="middle" fontFamily={sans} fontWeight={700} fontSize={28} fill="#FBF6EC">
              1998 · {month} 月
            </text>
            <text x={0} y={168} textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={100} fill={C.ink}>
              {dd}
            </text>
            {/* 翻页 */}
            {f < 92 ? (
              <rect x={-90} y={52} width={180} height={158} fill="#FBF6EC" opacity={0.7} transform={`translate(0 52) scale(1 ${Math.abs(Math.cos(f * 0.9))}) translate(0 -52)`} />
            ) : null}
          </g>
          {/* 台灯 */}
          <g>
            <path d="M1060,520 L1120,420 L1180,520 Z" fill="#3E4A3A" />
            <rect x={1114} y={520} width={12} height={160} fill="#3E4A3A" />
            <ellipse cx={1120} cy={690} rx={60} ry={12} fill="#3E4A3A" />
            <ellipse cx={1120} cy={700} rx={340} ry={220} fill="url(#s15-lamp)" />
          </g>
          {/* 桌面 */}
          <rect x={-100} y={780} width={W + 200} height={320} fill="#7A5A3E" />
          <rect x={-100} y={780} width={W + 200} height={16} fill="#9A7650" />
          {/* 传真机 */}
          <g transform={`translate(${FAX.x + buzz} ${FAX.y})`}>
            <path d="M-200,60 L200,60 L180,-60 L-180,-60 Z" fill="#E4DED0" stroke="#8A7E68" strokeWidth={4} />
            <rect x={-150} y={-90} width={300} height={34} rx={6} fill="#CFC8B6" />
            <rect x={-140} y={-80} width={280} height={8} fill="#6E6656" />
            <rect x={60} y={-36} width={100} height={36} rx={4} fill={ring ? '#9FE3A4' : '#B9C4B0'} />
            <circle cx={-130} cy={-20} r={10} fill={ring ? '#4FD06A' : '#6E7A6A'} />
            {ring ? <circle cx={-130} cy={-20} r={24} fill="#4FD06A" opacity={0.35 + 0.25 * Math.sin(f * 0.6)} /> : null}
            {new Array(6).fill(0).map((_, i) => (
              <rect key={i} x={-90 + (i % 3) * 30} y={-36 + Math.floor(i / 3) * 18} width={22} height={12} rx={3} fill="#F7F3E8" stroke="#8A7E68" strokeWidth={1.2} />
            ))}
            {/* 吐出的报价单 */}
            {paperOut > 0 ? (
              <g transform={`translate(0 ${-90}) `}>
                <g transform={`translate(0 ${-paperOut * 300})`}>
                  <rect x={-130} y={0} width={260} height={paperOut * 300} fill="#FFFDF4" stroke="#C9B48A" strokeWidth={2} />
                  <g opacity={paperOut > 0.25 ? 1 : 0}>
                    <text x={0} y={42} textAnchor="middle" fontFamily={sans} fontWeight={800} fontSize={30} fill={C.ink} letterSpacing={4}>
                      COTAÇÃO
                    </text>
                    <text x={0} y={72} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={22} fill={C.inkSoft} letterSpacing={6}>
                      报 价 单
                    </text>
                  </g>
                  <g opacity={paperOut > 0.55 ? 1 : 0}>
                    {[0, 1, 2, 3].map((k) => (
                      <g key={k}>
                        <rect x={-100} y={98 + k * 30} width={110} height={6} fill="#BDB49E" />
                        <rect x={40} y={98 + k * 30} width={60} height={6} fill="#BDB49E" />
                      </g>
                    ))}
                  </g>
                  <g opacity={paperOut > 0.85 ? 1 : 0}>
                    <text x={80} y={270} textAnchor="end" fontFamily={serif} fontStyle="italic" fontSize={30} fill="#2F5D8A">
                      — Luis
                    </text>
                  </g>
                </g>
              </g>
            ) : null}
          </g>
          {/* 响铃波纹 */}
          {ring
            ? [0, 1, 2].map((k) => {
                const t = (((f - RING) * 0.035 + k / 3) % 1);
                return <circle key={k} cx={FAX.x - 130} cy={FAX.y - 20} r={20 + t * 120} fill="none" stroke="#4FD06A" strokeWidth={3} opacity={(1 - t) * 0.6 * (f < RING + 60 ? 1 : 0.4)} />;
              })
            : null}
        </g>
        {/* A：飞走的传真纸 */}
        {new Array(7).fill(0).map((_, i) => {
          const t0 = 4 + i * 11;
          const t = interpolate(f, [t0, t0 + 40], [0, 1], cl);
          if (t <= 0 || t >= 1) return null;
          const x = FAX.x + t * 860;
          const y = FAX.y - 140 - t * 420 - Math.sin(t * 3) * 60;
          const s = 1 - t * 0.85;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${t * 220 + i * 20}) scale(${s})`} opacity={1 - t * 0.9}>
              <rect x={-80} y={-100} width={160} height={200} fill="#FFFDF4" />
              {[0, 1, 2, 3, 4].map((k) => (
                <rect key={k} x={-60} y={-70 + k * 28} width={120 - (k % 2) * 30} height={6} fill="#BDB49E" />
              ))}
            </g>
          );
        })}
      </svg>
      {/* 暖光漫开 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 60% at 43% 60%, rgba(255,230,168,0.75) 0%, rgba(247,200,106,0.25) 55%, rgba(247,200,106,0) 100%)', opacity: warm, mixBlendMode: 'screen'}} />
      <GoldDust count={30} seed="s15d" opacity={warm * 0.9} color="#FFE6B0" />
      <OldPhoto strength={0.45} seed="s15" leak={false} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(30,36,50,0) 72%, rgba(30,36,50,0.4) 100%)'}} />
    </AbsoluteFill>
  );
};
