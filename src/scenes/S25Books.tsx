import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';

/**
 * s25（7 秒 / 210 帧）：书页翻动——他的故事被写进了这些书
 *   0–140  一本摊开的书，书页一页页翻过；左页依次是：《读者》/ MBA 教材 / 国家统编中学生教材 / 浙江省初中德育课程教材 /《风云浙商-2》
 * 130–210  书页静下来，一个金色的“信”字在书上方显现；四周漂浮着各国语言的“信任”
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const TITLES = ['《读者》', 'MBA 教材', '国家统编中学生教材', '浙江省初中德育课程教材', '《风云浙商-2》'];
const SPINE = {x: 960, y: 520};
const PW = 520;
const PH = 600;
const FLIP0 = 24;
const FLIP_EVERY = 26;
const FLIP_LEN = 22;
const WORDS = [
  {t: 'Trust', x: 300, y: 220},
  {t: 'Confiança', x: 1590, y: 250},
  {t: 'Confianza', x: 230, y: 760},
  {t: 'Vertrauen', x: 1660, y: 720},
  {t: 'Confiance', x: 520, y: 120},
  {t: 'Fiducia', x: 1400, y: 110},
];

export const S25Books: React.FC = () => {
  const f = useCurrentFrame();
  const bookIn = interpolate(f, [0, 20], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  // 第 i 次翻页发生在 [FLIP0 + i·EVERY, +LEN]；翻过一半后，左页换成下一本书
  const FLIPS = TITLES.length - 1;
  let leftIdx = 0;
  let flipIdx = -1;
  let flipT = 0;
  for (let i = 0; i < FLIPS; i++) {
    const s0 = FLIP0 + i * FLIP_EVERY;
    if (f >= s0 + FLIP_LEN / 2) leftIdx = i + 1;
    if (f >= s0 && f < s0 + FLIP_LEN) {
      flipIdx = i;
      flipT = interpolate(f, [s0, s0 + FLIP_LEN], [0, 1], {...cl, easing: Easing.inOut(Easing.sin)});
    }
  }
  const settle = interpolate(f, [136, 170], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const xin = interpolate(f, [140, 180], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  // 翻页过程中，右页露出的是“下一页”的正文
  const rightSeed = flipIdx >= 0 ? flipIdx + 1 : leftIdx;

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 36]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="s25-gutter" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#5B4A36" stopOpacity={0.18} />
          </linearGradient>
          <radialGradient id="s25-glow">
            <stop offset="0%" stopColor="#FFE9A8" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFE9A8" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g opacity={bookIn} transform={`translate(0 ${(1 - bookIn) * 40 + settle * 60}) translate(${SPINE.x} ${SPINE.y}) scale(${1 - settle * 0.12}) translate(${-SPINE.x} ${-SPINE.y})`}>
          {/* 书影与封皮 */}
          <ellipse cx={SPINE.x} cy={SPINE.y + PH / 2 + 30} rx={PW + 80} ry={30} fill="#5B4A36" opacity={0.15} />
          <rect x={SPINE.x - PW - 16} y={SPINE.y - PH / 2 - 12} width={PW * 2 + 32} height={PH + 28} rx={10} fill="#7E412B" />
          {/* 书页厚度 */}
          {[6, 4, 2].map((o) => (
            <g key={o}>
              <rect x={SPINE.x - PW - o} y={SPINE.y - PH / 2 + o} width={PW} height={PH} fill="#EFE4CC" />
              <rect x={SPINE.x + o} y={SPINE.y - PH / 2 + o} width={PW} height={PH} fill="#EFE4CC" />
            </g>
          ))}
          {/* 左页 */}
          <Page x={SPINE.x - PW} side="left">
            <TitlePage idx={leftIdx} />
          </Page>
          {/* 右页（下一页内容） */}
          <Page x={SPINE.x} side="right">
            <TextPage seed={`r${rightSeed}`} highlight={settle} />
          </Page>
          {/* 正在翻动的页 */}
          {flipIdx >= 0 ? (
            <g transform={`translate(${SPINE.x} 0) scale(${Math.cos(flipT * Math.PI)} 1) translate(${-SPINE.x} 0)`}>
              {flipT < 0.5 ? (
                <Page x={SPINE.x} side="right" shade={flipT * 0.6}>
                  <TextPage seed={`r${flipIdx}`} highlight={0} />
                </Page>
              ) : (
                <Page x={SPINE.x} side="right" shade={(1 - flipT) * 0.6} mirrored>
                  <TitlePage idx={flipIdx + 1} />
                </Page>
              )}
            </g>
          ) : null}
          <rect x={SPINE.x - 40} y={SPINE.y - PH / 2} width={40} height={PH} fill="url(#s25-gutter)" />
          <rect x={SPINE.x} y={SPINE.y - PH / 2} width={40} height={PH} fill="url(#s25-gutter)" transform={`translate(${SPINE.x * 2} 0) scale(-1 1)`} />
        </g>

        {/* “信” */}
        <circle cx={SPINE.x} cy={150} r={170} fill="url(#s25-glow)" opacity={xin * 0.8} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: SPINE.x - 200,
          width: 400,
          top: 150 - 110,
          textAlign: 'center',
          fontFamily: serif,
          fontWeight: 700,
          fontSize: 200,
          lineHeight: '220px',
          color: C.goldDeep,
          opacity: xin,
          transform: `scale(${0.9 + xin * 0.1})`,
          filter: `blur(${(1 - xin) * 8}px)`,
          textShadow: '0 0 30px rgba(255,236,180,0.9)',
        }}
      >
        信
      </div>
      {WORDS.map((w, i) => {
        const on = interpolate(f, [150 + i * 6, 176 + i * 6], [0, 1], cl);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: w.x - 150,
              width: 300,
              top: w.y + Math.sin(f * 0.04 + i) * 8 - on * 10,
              textAlign: 'center',
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 34,
              color: C.inkSoft,
              opacity: on * 0.55,
              letterSpacing: '0.04em',
            }}
          >
            {w.t}
          </div>
        );
      })}
      <GoldDust count={30} seed="s25d" opacity={0.6} />
    </AbsoluteFill>
  );
};

const Page: React.FC<{x: number; side: 'left' | 'right'; shade?: number; mirrored?: boolean; children: React.ReactNode}> = ({x, shade = 0, mirrored, children}) => (
  <g>
    <rect x={x} y={SPINE.y - PH / 2} width={PW} height={PH} fill="#FBF6EA" />
    <g transform={mirrored ? `translate(${x * 2 + PW} 0) scale(-1 1)` : undefined}>
      <g transform={`translate(${x} ${SPINE.y - PH / 2})`}>{children}</g>
    </g>
    {shade > 0 ? <rect x={x} y={SPINE.y - PH / 2} width={PW} height={PH} fill="#5B4A36" opacity={shade * 0.4} /> : null}
    <rect x={x} y={SPINE.y - PH / 2} width={PW} height={PH} fill="none" stroke="#D8C8A6" strokeWidth={1} />
  </g>
);

/** 左页：收录于 + 书名 */
const TitlePage: React.FC<{idx: number}> = ({idx}) => {
  const t = TITLES[Math.max(0, Math.min(TITLES.length - 1, idx))];
  const fs = t.length > 9 ? 34 : t.length > 6 ? 40 : 52;
  return (
    <g>
      <text x={PW / 2} y={150} textAnchor="middle" fontFamily={sans} fontSize={16} letterSpacing={8} fill={C.inkMute}>
        收录于 · INCLUDED IN
      </text>
      <line x1={PW / 2 - 40} y1={182} x2={PW / 2 + 40} y2={182} stroke={C.gold} strokeWidth={2} />
      <text x={PW / 2} y={290} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={fs} letterSpacing={4} fill={C.ink}>
        {t}
      </text>
      <text x={PW / 2} y={PH - 60} textAnchor="middle" fontFamily={serif} fontSize={18} fill={C.inkMute}>
        {`— ${String(idx + 1).padStart(2, '0')} —`}
      </text>
      {/* 小小的树形徽记 */}
      <g transform={`translate(${PW / 2} 410)`} fill={C.gold} opacity={0.75}>
        {[[0, -40], [-16, -20], [16, -20], [-30, 0], [0, 0], [30, 0]].map(([x, y], i) => (
          <rect key={i} x={x - 11} y={y - 8} width={22} height={16} transform={`rotate(36.87 ${x} ${y})`} />
        ))}
        <rect x={-4} y={10} width={8} height={26} />
      </g>
    </g>
  );
};

/** 右页：正文（抽象行），中间一行描金 */
const TextPage: React.FC<{seed: string; highlight: number}> = ({seed, highlight}) => (
  <g>
    {new Array(16).fill(0).map((_, i) => {
      const w = i % 6 === 5 ? 200 : 360 + random(`${seed}${i}`) * 60;
      const hi = i === 7;
      return <rect key={i} x={60} y={90 + i * 28} width={w} height={8} rx={4} fill={hi ? C.gold : C.inkMute} opacity={hi ? 0.45 + highlight * 0.5 : 0.3} />;
    })}
  </g>
);
