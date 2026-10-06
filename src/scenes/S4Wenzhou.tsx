import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {OldPhoto} from '../components/OldPhoto';
import {ridgePath} from '../lib/geom';

/**
 * 第 4 镜（5 秒 / 150 帧）：1966，温州
 * 水墨江南水街：远山双塔、临水商铺（悬挂“卢记”等布招）、乌篷船、柳枝；镜头横移
 * 右侧竖排“卢伟光”落款 + 红印
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const BANK = 640; // 河岸线
const WATER = 660;

type House = {x: number; w: number; h: number; roof: 'gable' | 'flat'; sign?: string; lantern?: boolean; seed: string};

const HOUSES: House[] = [
  {x: -40, w: 260, h: 230, roof: 'gable', seed: 'h0'},
  {x: 230, w: 200, h: 270, roof: 'gable', sign: '茶', lantern: true, seed: 'h1'},
  {x: 440, w: 300, h: 250, roof: 'gable', sign: '卢记', lantern: true, seed: 'h2'},
  {x: 750, w: 220, h: 300, roof: 'gable', seed: 'h3'},
  {x: 980, w: 260, h: 240, roof: 'gable', sign: '布', seed: 'h4'},
  {x: 1250, w: 210, h: 280, roof: 'gable', lantern: true, seed: 'h5'},
  {x: 1470, w: 280, h: 230, roof: 'gable', sign: '南货', seed: 'h6'},
  {x: 1760, w: 240, h: 290, roof: 'gable', seed: 'h7'},
  {x: 2010, w: 260, h: 250, roof: 'gable', lantern: true, seed: 'h8'},
];

export const S4Wenzhou: React.FC = () => {
  const f = useCurrentFrame();
  const pan = interpolate(f, [0, 150], [0, -150], {...cl, easing: Easing.inOut(Easing.sin)});
  const zoom = interpolate(f, [0, 150], [1.03, 1.08], cl);
  const nameIn = interpolate(f, [30, 70], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const sealIn = interpolate(f, [62, 74], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
  const boatX = interpolate(f, [0, 150], [1180, 1020]);
  const ridges = useMemo(
    () => [ridgePath(W + 400, 470, 160, 'wzfar', BANK, 12, 0.0026), ridgePath(W + 400, 540, 90, 'wzmid', BANK, 12, 0.005)],
    [],
  );

  const houses = (reflect: boolean) =>
    HOUSES.map((h, i) => <HouseShape key={i} h={h} f={f} reflect={reflect} />);

  return (
    <AbsoluteFill>
      <Paper glowAt={[40, 30]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <InkDefs p="s4" seed={31} />
          <linearGradient id="s4-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E7DCC6" />
            <stop offset="100%" stopColor="#F3EADA" />
          </linearGradient>
          <linearGradient id="s4-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.inkWash} stopOpacity={0.22} />
            <stop offset="100%" stopColor={C.inkWash} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="s4-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.inkWash} stopOpacity={0.36} />
            <stop offset="100%" stopColor={C.inkWash} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="s4-refl-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="s4-refl-mask">
            <rect x={-400} y={WATER} width={W + 1200} height={H} fill="url(#s4-refl-fade)" />
          </mask>
          <filter id="s4-ripple" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={`0.002 ${0.06 + 0.01 * Math.sin(f * 0.08)}`} numOctaves="2" seed={Math.floor(f / 3)} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <g transform={`translate(${W / 2} ${H / 2}) scale(${zoom}) translate(${-W / 2} ${-H / 2})`}>
          {/* 远山 + 江心双塔 */}
          <g transform={`translate(${pan * 0.25} 0)`}>
            <path d={ridges[0]} fill="url(#s4-far)" filter="url(#s4-wash)" />
            <Pagoda x={560} y={418} s={1} />
            <Pagoda x={1500} y={432} s={0.8} />
            <path d={ridges[1]} fill="url(#s4-mid)" filter="url(#s4-wash)" />
          </g>
          {/* 河面 */}
          <rect x={-200} y={WATER - 4} width={W + 400} height={H} fill="url(#s4-water)" />
          {/* 倒影 */}
          <g transform={`translate(${pan * 0.7} 0)`}>
            <g mask="url(#s4-refl-mask)" filter="url(#s4-ripple)" opacity={0.5}>
              <g transform={`translate(0 ${WATER * 2}) scale(1 -1)`}>{houses(true)}</g>
            </g>
            {/* 临水街屋 */}
            <g filter="url(#s4-bleed)">{houses(false)}</g>
            {/* 石驳岸 */}
            <rect x={-200} y={BANK} width={W + 800} height={WATER - BANK} fill={C.inkWash} opacity={0.4} />
            <g stroke={C.paperLight} strokeOpacity={0.5} strokeWidth={1.2}>
              {new Array(40).fill(0).map((_, i) => (
                <line key={i} x1={-200 + i * 70} y1={BANK + 2} x2={-200 + i * 70} y2={WATER - 2} />
              ))}
            </g>
          </g>
          {/* 水纹 */}
          <g stroke={C.inkWash} strokeOpacity={0.28} strokeWidth={1.6} strokeLinecap="round">
            {new Array(26).fill(0).map((_, i) => {
              const y = WATER + 30 + random(`rw${i}`) * 360;
              const x = ((random(`rx${i}`) * (W + 300) - f * (0.3 + random(`rs${i}`) * 0.4)) % (W + 300)) - 100;
              const l = 40 + random(`rl${i}`) * 120;
              return <line key={i} x1={x} y1={y} x2={x + l} y2={y} />;
            })}
          </g>
          {/* 乌篷船 */}
          <g transform={`translate(${boatX + pan * 0.9} ${WATER + 170 + Math.sin(f * 0.1) * 3})`} filter="url(#s4-bleed)">
            <path d="M-170,0 Q-120,26 0,28 Q120,26 175,-6 L150,4 Q0,10 -150,2 Z" fill={C.ink} opacity={0.85} />
            <path d="M-80,-2 Q-40,-62 30,-60 Q70,-58 80,-2 Z" fill={C.inkSoft} opacity={0.85} />
            <g stroke={C.paperLight} strokeOpacity={0.3} strokeWidth={1.4}>
              {[-60, -36, -12, 12, 36, 60].map((x) => (
                <line key={x} x1={x} y1={-54} x2={x} y2={-4} />
              ))}
            </g>
            {/* 船夫 */}
            <g transform="translate(130 -6)">
              <circle cx={0} cy={-52} r={7} fill={C.ink} />
              <path d="M-14,-48 L14,-48 L18,-58 L-18,-58 Z" fill={C.ink} />
              <path d="M-7,-44 L7,-44 L9,-4 L-9,-4 Z" fill={C.ink} />
              <line x1={-26} y1={-70} x2={36} y2={34} stroke={C.ink} strokeWidth={3} />
            </g>
            <path d="M-170,30 Q0,48 175,24" stroke={C.inkWash} strokeOpacity={0.3} strokeWidth={2} fill="none" />
          </g>
          {/* 前景柳枝 */}
          <Willow f={f} />
        </g>
      </svg>

      {/* 落款：竖排名字 + 红印 */}
      <div style={{position: 'absolute', right: 210, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div
          style={{
            writingMode: 'vertical-rl',
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 96,
            letterSpacing: '0.18em',
            color: C.ink,
            opacity: nameIn,
            filter: `blur(${(1 - nameIn) * 10}px)`,
            textShadow: '0 0 24px rgba(251,246,236,0.95)',
            clipPath: `inset(0 0 ${(1 - nameIn) * 100}% 0)`,
          }}
        >
          卢伟光
        </div>
        <div
          style={{
            marginTop: 22,
            width: 62,
            height: 62,
            background: C.seal,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 24,
            color: '#FBEFE2',
            writingMode: 'vertical-rl',
            letterSpacing: '0.04em',
            opacity: Math.min(1, sealIn * 1.5),
            transform: `scale(${1.5 - 0.5 * sealIn}) rotate(${3 * sealIn}deg)`,
          }}
        >
          温州
        </div>
        <div style={{marginTop: 18, fontFamily: sans, fontSize: 15, letterSpacing: '0.42em', color: C.inkMute, opacity: nameIn}}>CARL LU</div>
      </div>
      <OldPhoto strength={0.55} seed="s4" leak={false} />
    </AbsoluteFill>
  );
};

/** 江心屿双塔意象 */
const Pagoda: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={C.inkWash} opacity={0.42} filter="url(#s4-bleed)">
    {new Array(6).fill(0).map((_, i) => {
      const w = 34 - i * 4;
      const yy = -i * 22;
      return (
        <g key={i}>
          <rect x={-w / 2} y={yy - 18} width={w} height={18} />
          <path d={`M${-w / 2 - 10},${yy - 18} Q0,${yy - 26} ${w / 2 + 10},${yy - 18} L${w / 2 + 4},${yy - 14} L${-w / 2 - 4},${yy - 14} Z`} />
        </g>
      );
    })}
    <rect x={-1.5} y={-160} width={3} height={30} />
  </g>
);

const HouseShape: React.FC<{h: House; f: number; reflect: boolean}> = ({h, f, reflect}) => {
  const top = BANK - h.h;
  const roofH = 70;
  const sway = Math.sin(f * 0.07 + h.x) * 2;
  return (
    <g>
      {/* 白墙 */}
      <rect x={h.x} y={top + roofH - 6} width={h.w} height={h.h - roofH + 6} fill="#F6EFE2" stroke={C.inkWash} strokeOpacity={0.5} strokeWidth={1.4} />
      {/* 墙面水渍 */}
      <rect x={h.x} y={BANK - 50} width={h.w} height={50} fill={C.inkWash} opacity={0.12} />
      {/* 屋顶：两端起翘 */}
      <path
        d={`M${h.x - 26},${top + roofH} Q${h.x - 10},${top + roofH - 8} ${h.x + 10},${top + 18} L${h.x + h.w - 10},${top + 18} Q${h.x + h.w + 10},${top + roofH - 8} ${h.x + h.w + 26},${top + roofH} Z`}
        fill={C.ink}
        opacity={0.82}
      />
      <g stroke={C.paperLight} strokeOpacity={0.18} strokeWidth={1}>
        {new Array(Math.floor(h.w / 14)).fill(0).map((_, i) => (
          <line key={i} x1={h.x + 12 + i * 14} y1={top + 22} x2={h.x + 4 + i * 14} y2={top + roofH - 4} />
        ))}
      </g>
      {/* 二层窗格 */}
      {new Array(Math.max(2, Math.floor(h.w / 70))).fill(0).map((_, i, arr) => {
        const ww = 44;
        const gap = (h.w - arr.length * ww) / (arr.length + 1);
        const x = h.x + gap + i * (ww + gap);
        return (
          <g key={i}>
            <rect x={x} y={top + roofH + 22} width={ww} height={40} fill={C.inkSoft} opacity={0.6} />
            <g stroke="#F6EFE2" strokeWidth={1.2} opacity={0.7}>
              <line x1={x + ww / 2} y1={top + roofH + 22} x2={x + ww / 2} y2={top + roofH + 62} />
              <line x1={x} y1={top + roofH + 42} x2={x + ww} y2={top + roofH + 42} />
            </g>
          </g>
        );
      })}
      {/* 一层店面：木门板 */}
      <rect x={h.x + 14} y={BANK - 110} width={h.w - 28} height={110} fill="#8A6A48" opacity={0.75} />
      <g stroke={C.ink} strokeOpacity={0.35} strokeWidth={1.2}>
        {new Array(Math.floor((h.w - 28) / 22)).fill(0).map((_, i) => (
          <line key={i} x1={h.x + 14 + (i + 1) * 22} y1={BANK - 110} x2={h.x + 14 + (i + 1) * 22} y2={BANK} />
        ))}
      </g>
      {/* 雨棚 */}
      <path d={`M${h.x + 4},${BANK - 112} L${h.x + h.w - 4},${BANK - 112} L${h.x + h.w + 8},${BANK - 96} L${h.x - 8},${BANK - 96} Z`} fill={C.ink} opacity={0.7} />
      {/* 布招 */}
      {h.sign && !reflect ? (
        <g transform={`translate(${h.x + h.w - 54} ${BANK - 220}) rotate(${sway * 0.6})`}>
          <line x1={-14} y1={-8} x2={30} y2={-8} stroke={C.ink} strokeWidth={2} />
          <rect x={0} y={-6} width={36} height={h.sign.length * 34 + 14} fill="#EFE3C8" stroke={C.ink} strokeOpacity={0.6} />
          {Array.from(h.sign).map((ch, k) => (
            <text
              key={k}
              x={18}
              y={24 + k * 34}
              textAnchor="middle"
              fontFamily={serif}
              fontWeight={700}
              fontSize={26}
              fill={h.sign === '卢记' ? C.seal : C.ink}
            >
              {ch}
            </text>
          ))}
        </g>
      ) : null}
      {/* 灯笼 */}
      {h.lantern ? (
        <g transform={`translate(${h.x + 40} ${BANK - 92}) rotate(${sway})`}>
          <line x1={0} y1={-6} x2={0} y2={6} stroke={C.ink} strokeWidth={1.5} />
          <ellipse cx={0} cy={22} rx={13} ry={17} fill={C.seal} opacity={reflect ? 0.5 : 0.85} />
          <rect x={-6} y={4} width={12} height={4} fill={C.ink} />
          <rect x={-6} y={38} width={12} height={4} fill={C.ink} />
          {!reflect ? <ellipse cx={0} cy={22} rx={30} ry={30} fill="#FFD9A0" opacity={0.18} /> : null}
        </g>
      ) : null}
    </g>
  );
};

const Willow: React.FC<{f: number}> = ({f}) => {
  const strands = useMemo(
    () =>
      new Array(16).fill(0).map((_, i) => ({
        x: -20 + i * 26 + random(`wx${i}`) * 20,
        len: 220 + random(`wl${i}`) * 260,
        ph: random(`wp${i}`) * 6,
      })),
    [],
  );
  return (
    <g filter="url(#s4-bleed)">
      <path d="M-40,40 Q200,-10 470,70" stroke={C.ink} strokeWidth={8} fill="none" opacity={0.75} />
      {strands.map((s, i) => {
        const sw = Math.sin(f * 0.05 + s.ph) * 14;
        const y0 = 40 + (s.x / 470) * 30;
        const d = `M${s.x},${y0} Q${s.x + sw * 0.5},${y0 + s.len * 0.5} ${s.x + sw},${y0 + s.len}`;
        let leaves = '';
        for (let k = 1; k < 14; k++) {
          const t = k / 14;
          const px = s.x + sw * t * t;
          const py = y0 + s.len * t;
          const side = k % 2 ? 1 : -1;
          leaves += `M${px.toFixed(1)},${py.toFixed(1)} q${side * 7},${4} ${side * 10},${14} `;
        }
        return (
          <g key={i} opacity={0.7}>
            <path d={d} stroke={C.inkSoft} strokeWidth={1.6} fill="none" />
            <path d={leaves} stroke={C.leaf} strokeOpacity={0.75} strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};
