import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W} from '../theme';
import {Paper} from '../components/Paper';
import {GoldDust} from '../components/GoldDust';
import {AnxinLogoArt, LOGO_H, LOGO_TILES, LOGO_W, type Tile} from '../components/AnxinLogo';
import {lerp} from '../lib/geom';

/**
 * s26（10 秒 / 300 帧）：放大的金色 Logo，每块地板条变成一扇亮灯的小窗
 * 镜头从几扇窗的特写开始，缓缓拉远到整棵“地板树”；46 扇窗依次亮起，
 * 窗里是 10 种生活空间轮换：客厅、书房、儿童房、厨房、卧室、餐厅、一家人的笑脸、绿植、阅读角、钢琴——每间屋子脚下都是木地板。
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const LW = 1000;
const SC = LW / LOGO_W;
const LH = LOGO_H * SC;
const OX = (W - LW) / 2;
const OY = 70;
const FOCUS = LOGO_TILES[Math.floor(LOGO_TILES.length * 0.18)];
const ROOMS = 10;

const litAt = (t: Tile) => {
  const d = Math.hypot(t.cx - FOCUS.cx, t.cy - FOCUS.cy);
  return 8 + d * 0.11 + random(`lit${t.idx}`) * 18;
};

export const S26Windows: React.FC = () => {
  const f = useCurrentFrame();
  const pull = interpolate(f, [20, 210], [0, 1], {...cl, easing: Easing.inOut(Easing.cubic)});
  const k = lerp(3.2, 1, pull);
  const fx = OX + FOCUS.cx * SC;
  const fy = OY + FOCUS.cy * SC;
  // 起始：焦点窗位于画面中央并放大；结束：恒等变换（整棵 Logo 树居中）
  const cx = lerp(W / 2, fx, pull);
  const cy = lerp(H / 2 - 40, fy, pull);
  const glow = interpolate(f, [120, 260], [0, 1], cl);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="s26-win">
            <rect x={-56} y={-44} width={112} height={88} rx={4} />
          </clipPath>
          <radialGradient id="s26-glow">
            <stop offset="0%" stopColor="#FFE9B0" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#FFE9B0" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${k}) translate(${-fx} ${-fy})`}>
          <g transform={`translate(${OX} ${OY}) scale(${SC})`}>
            <ellipse cx={LOGO_W / 2} cy={560} rx={900} ry={600} fill="url(#s26-glow)" opacity={0.35 + glow * 0.5} />
            <AnxinLogoArt
              tileFill={C.gold}
              showText={false}
              renderTileContent={(t) => {
                const on = interpolate(f, [litAt(t), litAt(t) + 14], [0, 1], cl);
                const flicker = 0.92 + 0.08 * Math.sin(f * 0.15 + t.idx);
                return (
                  <g>
                    <rect x={-56} y={-44} width={112} height={88} rx={4} fill="#C98A16" />
                    <g clipPath="url(#s26-win)" opacity={on}>
                      <g transform={`rotate(${-t.rot})`}>
                        <rect x={-100} y={-100} width={200} height={200} fill="#FFF3D8" opacity={flicker} />
                        <Room kind={(t.idx * 7) % ROOMS} />
                      </g>
                    </g>
                    {/* 窗框十字 */}
                    <rect x={-56} y={-44} width={112} height={88} rx={4} fill="none" stroke="#B9790F" strokeWidth={4} />
                  </g>
                );
              }}
            />
          </g>
        </g>
      </svg>
      <GoldDust count={36} seed="s26d" opacity={0.4 + glow * 0.4} />
    </AbsoluteFill>
  );
};

const WOOD = '#C98F4E';
const INK = '#5B4A36';

/** 10 种房间（正立，约 120 × 100 区域，原点居中；底部是木地板） */
const Room: React.FC<{kind: number}> = ({kind}) => {
  const floor = (
    <g>
      <rect x={-80} y={24} width={160} height={40} fill={WOOD} />
      {[-60, -30, 0, 30, 60].map((x) => (
        <line key={x} x1={x} y1={24} x2={x - 8} y2={64} stroke="#A9733A" strokeWidth={2} />
      ))}
    </g>
  );
  let body: React.ReactNode = null;
  switch (kind) {
    case 0: // 客厅：沙发 + 落地灯 + 挂画
      body = (
        <g>
          <rect x={-34} y={-30} width={26} height={18} fill="none" stroke={INK} strokeWidth={2.5} />
          <rect x={-44} y={0} width={70} height={24} rx={6} fill="#8FA6B8" />
          <rect x={-50} y={-4} width={12} height={28} rx={5} fill="#7A92A6" />
          <rect x={20} y={-4} width={12} height={28} rx={5} fill="#7A92A6" />
          <line x1={44} y1={24} x2={44} y2={-24} stroke={INK} strokeWidth={2.5} />
          <path d="M34,-24 L54,-24 L48,-36 L40,-36 Z" fill={C.gold} />
        </g>
      );
      break;
    case 1: // 书房：书架 + 书桌
      body = (
        <g>
          <rect x={-48} y={-38} width={40} height={62} fill="#9C6A3E" />
          {[-30, -12, 6].map((y, i) => (
            <g key={y}>
              <line x1={-48} y1={y} x2={-8} y2={y} stroke="#7A4E2A" strokeWidth={2} />
              {[0, 1, 2, 3].map((b) => (
                <rect key={b} x={-45 + b * 9} y={y - 14} width={6} height={14} fill={['#B3473A', '#566A80', C.gold, '#7BA063'][(b + i) % 4]} />
              ))}
            </g>
          ))}
          <rect x={4} y={0} width={48} height={6} fill="#9C6A3E" />
          <rect x={8} y={6} width={4} height={18} fill="#9C6A3E" />
          <rect x={44} y={6} width={4} height={18} fill="#9C6A3E" />
          <path d="M30,0 L30,-14 L22,-20" stroke={INK} strokeWidth={2.5} fill="none" />
        </g>
      );
      break;
    case 2: // 儿童房：小床 + 星星 + 气球
      body = (
        <g>
          <rect x={-46} y={6} width={58} height={18} rx={4} fill="#E9A0A0" />
          <rect x={-50} y={-6} width={8} height={30} fill="#9C6A3E" />
          <rect x={-40} y={0} width={16} height={8} rx={3} fill="#FBF6EC" />
          <path d="M-20,-30 l4,9 l10,1 l-8,6 l3,10 l-9,-6 l-9,6 l3,-10 l-8,-6 l10,-1 Z" fill={C.gold} />
          <ellipse cx={36} cy={-22} rx={11} ry={14} fill="#E07A5F" />
          <path d="M36,-8 Q32,6 38,22" stroke={INK} strokeWidth={1.5} fill="none" />
        </g>
      );
      break;
    case 3: // 厨房：橱柜 + 锅 + 热气
      body = (
        <g>
          <rect x={-50} y={-2} width={100} height={26} fill="#E8DCC4" stroke="#BCAE92" strokeWidth={2} />
          <rect x={-50} y={-6} width={100} height={6} fill="#9C6A3E" />
          <rect x={-44} y={-40} width={36} height={18} fill="#E8DCC4" stroke="#BCAE92" strokeWidth={2} />
          <path d="M6,-6 L6,-18 L34,-18 L34,-6 Z" fill="#566A80" />
          <path d="M14,-24 q-6,-8 0,-14 M22,-26 q-6,-8 0,-14 M30,-24 q-6,-8 0,-14" stroke="#BCAE92" strokeWidth={2} fill="none" />
        </g>
      );
      break;
    case 4: // 卧室：床 + 枕头 + 台灯
      body = (
        <g>
          <rect x={-50} y={-10} width={10} height={34} fill="#9C6A3E" />
          <rect x={-40} y={4} width={80} height={20} rx={4} fill="#A9B98E" />
          <rect x={-36} y={-4} width={22} height={10} rx={4} fill="#FBF6EC" />
          <rect x={44} y={6} width={12} height={18} fill="#9C6A3E" />
          <path d="M42,6 L58,6 L54,-6 L46,-6 Z" fill={C.gold} />
        </g>
      );
      break;
    case 5: // 餐厅：餐桌 + 椅子 + 吊灯
      body = (
        <g>
          <line x1={0} y1={-48} x2={0} y2={-26} stroke={INK} strokeWidth={2} />
          <path d="M-12,-20 L12,-20 L6,-28 L-6,-28 Z" fill={C.gold} />
          <rect x={-30} y={0} width={60} height={6} fill="#9C6A3E" />
          <rect x={-24} y={6} width={4} height={18} fill="#9C6A3E" />
          <rect x={20} y={6} width={4} height={18} fill="#9C6A3E" />
          <path d="M-46,24 L-46,-6 M-46,8 L-34,8 L-34,24" stroke="#7A4E2A" strokeWidth={4} fill="none" />
          <path d="M46,24 L46,-6 M46,8 L34,8 L34,24" stroke="#7A4E2A" strokeWidth={4} fill="none" />
        </g>
      );
      break;
    case 6: // 一家人的笑脸
      body = (
        <g>
          {[
            [-30, -6, 15, '#566A80'],
            [0, -12, 17, '#22304E'],
            [30, -2, 12, '#B3473A'],
          ].map(([x, y, r, c], i) => (
            <g key={i}>
              <path d={`M${(x as number) - (r as number) * 1.3},24 Q${x},${(y as number) + (r as number) * 0.8} ${(x as number) + (r as number) * 1.3},24 Z`} fill={c as string} />
              <circle cx={x as number} cy={y as number} r={r as number} fill="#ECCDAE" />
              <path d={`M${(x as number) - (r as number) * 0.45},${(y as number) + 2} Q${x},${(y as number) + (r as number) * 0.6} ${(x as number) + (r as number) * 0.45},${(y as number) + 2}`} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
      break;
    case 7: // 绿植 + 窗帘
      body = (
        <g>
          <path d="M-56,-44 Q-40,-10 -50,24 L-56,24 Z" fill="#E9C9A0" />
          <path d="M56,-44 Q40,-10 50,24 L56,24 Z" fill="#E9C9A0" />
          <path d="M-12,24 L-8,4 L8,4 L12,24 Z" fill="#B3473A" />
          {[-40, -10, 20, 50].map((a, i) => (
            <path key={i} transform={`translate(0 4) rotate(${a - 10})`} d="M0,0 C10,-14 10,-30 0,-40 C-10,-30 -10,-14 0,0 Z" fill={i % 2 ? '#6F9A5A' : '#86A86A'} />
          ))}
        </g>
      );
      break;
    case 8: // 阅读角：扶手椅 + 灯 + 书
      body = (
        <g>
          <path d="M-36,24 L-36,-14 Q-36,-26 -24,-26 L4,-26 Q16,-26 16,-14 L16,24 Z" fill="#C2704E" />
          <rect x={-42} y={-2} width={64} height={18} rx={6} fill="#A85A3C" />
          <line x1={38} y1={24} x2={38} y2={-30} stroke={INK} strokeWidth={2.5} />
          <path d="M26,-30 L50,-30 L44,-42 L32,-42 Z" fill={C.gold} />
          <rect x={-14} y={-8} width={16} height={10} fill="#FBF6EC" transform="rotate(-10)" />
        </g>
      );
      break;
    default: // 钢琴
      body = (
        <g>
          <rect x={-44} y={-30} width={88} height={54} rx={3} fill="#3A3430" />
          <rect x={-40} y={-4} width={80} height={10} fill="#FBF6EC" />
          {new Array(9).fill(0).map((_, i) => (
            <rect key={i} x={-36 + i * 9} y={-4} width={4} height={6} fill="#3A3430" />
          ))}
          <rect x={-16} y={-24} width={32} height={14} fill="#FBF6EC" opacity={0.8} />
        </g>
      );
  }
  return (
    <g transform="scale(0.78)">
      {floor}
      {body}
    </g>
  );
};
