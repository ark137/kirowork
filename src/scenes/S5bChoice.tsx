import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkFigure} from '../components/InkFigure';
import {GoldDust} from '../components/GoldDust';
import {OldPhoto} from '../components/OldPhoto';

/**
 * 第 5.5 镜（7 秒 / 210 帧）：毕业之后 —— 放下“铁饭碗”，选择木头
 * 0–60    机关办公室，桌上一只冒着热气的“铁饭碗”，镜头缓推
 * 55–112  他走到桌前，放下辞呈与工作证
 * 112–160 转身走向门口，门推开，金光涌入，镜头推向光
 * 150–210 光里浮出一片木地板：金光沿木纹流过（衔接第 6 镜的第一家店）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FLOOR = 860;
const DESK = {x: 620, w: 600, top: 636};
const DOOR = {x: 1480, w: 210, top: 250};

export const S5bChoice: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);

  // ── 人物轨迹 ──
  const enter = interpolate(f, [52, 92], [120, 760], {...cl, easing: Easing.out(Easing.quad)});
  const leave = interpolate(f, [116, 166], [760, DOOR.x + 60], {...cl, easing: Easing.inOut(Easing.quad)});
  const figX = f < 112 ? enter : leave;
  const walking = (f >= 52 && f < 92) || f >= 116;
  const bob = walking ? Math.abs(Math.sin(f * 0.42)) * 7 : 0;
  const figS = interpolate(f, [116, 166], [1, 0.82], {...cl, easing: io});
  const figIn = interpolate(f, [52, 64], [0, 1], cl);
  const figH = 330 * figS;

  // ── 道具动画 ──
  const bowlLabel = interpolate(f, [12, 34, 100, 124], [0, 1, 1, 0], cl);
  const letter = interpolate(f, [90, 110], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const badge = interpolate(f, [100, 116], [0, 1], {...cl, easing: Easing.out(Easing.back(1.6))});
  const doorOpen = interpolate(f, [122, 158], [0, 1], {...cl, easing: io});
  const bowlDim = interpolate(f, [112, 150], [1, 0.55], cl);
  const clockSpin = interpolate(f, [0, 150], [0, 900]);

  // ── 镜头 ──
  const push = interpolate(f, [0, 110], [1.0, 1.1], {...cl, easing: Easing.inOut(Easing.sin)});
  const toDoor = interpolate(f, [116, 176], [0, 1], {...cl, easing: io});
  const camScale = push + toDoor * 1.1;
  const camX = 960 + (DOOR.x + DOOR.w / 2 - 960) * toDoor;
  const camY = 540 + (520 - 540) * toDoor;

  // ── 光爆与地板特写 ──
  const flash = interpolate(f, [146, 176, 190], [0, 1, 0.0], {...cl, easing: Easing.inOut(Easing.sin)});
  const boardIn = interpolate(f, [160, 192], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const boardZoom = interpolate(f, [160, 210], [1.02, 1.1], cl);
  const sweep = interpolate(f, [176, 208], [-0.4, 1.4], {...cl, easing: Easing.inOut(Easing.sin)});
  const officeOpacity = interpolate(f, [160, 184], [1, 0], cl);

  const steam = useMemo(() => new Array(7).fill(0).map((_, i) => ({ph: i / 7, dx: (random(`st${i}`) - 0.5) * 36})), []);
  const beams = useMemo(() => [0, 1, 2, 3].map((i) => ({x: 180 + i * 96, w: 42 + random(`bm${i}`) * 30})), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />

      {/* ── 办公室 ── */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: officeOpacity}}>
        <defs>
          <linearGradient id="s5b-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6E6D4" />
            <stop offset="100%" stopColor="#D5D5BF" />
          </linearGradient>
          <linearGradient id="s5b-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDB28A" />
            <stop offset="100%" stopColor="#B99B70" />
          </linearGradient>
          <linearGradient id="s5b-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF3CC" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#FFF3CC" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="s5b-doorlight" cx="50%" cy="60%" r="70%">
            <stop offset="0%" stopColor="#FFF6D6" />
            <stop offset="55%" stopColor="#FFD98A" />
            <stop offset="100%" stopColor="#F4B64A" />
          </radialGradient>
          <linearGradient id="s5b-iron" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A4642" />
            <stop offset="100%" stopColor="#1F1C1A" />
          </linearGradient>
          <filter id="s5b-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${camScale}) translate(${-camX} ${-camY})`}>
          {/* 墙与地 */}
          <rect x={-600} y={-400} width={W + 1200} height={FLOOR + 400} fill="url(#s5b-wall)" />
          <rect x={-600} y={FLOOR - 220} width={W + 1200} height={16} fill="#BDBDA6" opacity={0.7} />
          <rect x={-600} y={FLOOR} width={W + 1200} height={H - FLOOR + 400} fill="url(#s5b-floor)" />
          <g stroke="#A88A5E" strokeOpacity={0.35} strokeWidth={2}>
            {new Array(16).fill(0).map((_, i) => (
              <line key={i} x1={-300 + i * 180} y1={FLOOR} x2={-520 + i * 220} y2={H + 300} />
            ))}
          </g>

          {/* 窗与光束 */}
          <g>
            <rect x={200} y={170} width={360} height={400} fill="#F6F0DC" stroke="#8B8B78" strokeWidth={10} />
            <g stroke="#8B8B78" strokeWidth={6}>
              <line x1={380} y1={170} x2={380} y2={570} />
              <line x1={200} y1={370} x2={560} y2={370} />
            </g>
            <rect x={210} y={180} width={340} height={380} fill="#FFF8E0" opacity={0.85} />
            {beams.map((b, i) => (
              <polygon
                key={i}
                points={`${b.x + 60},${560} ${b.x + 60 + b.w},${560} ${b.x + 420 + b.w},${FLOOR + 20} ${b.x + 380},${FLOOR + 20}`}
                fill="url(#s5b-beam)"
                opacity={0.55 + 0.25 * Math.sin(f * 0.04 + i)}
              />
            ))}
          </g>

          {/* 挂钟（时间在走） */}
          <g transform="translate(960 230)">
            <circle r={52} fill="#FBF6EC" stroke="#6B5C4A" strokeWidth={6} />
            {new Array(12).fill(0).map((_, i) => (
              <line key={i} x1={0} y1={-42} x2={0} y2={-36} stroke="#6B5C4A" strokeWidth={3} transform={`rotate(${i * 30})`} />
            ))}
            <line x1={0} y1={0} x2={0} y2={-26} stroke={C.ink} strokeWidth={5} strokeLinecap="round" transform={`rotate(${clockSpin / 12})`} />
            <line x1={0} y1={0} x2={0} y2={-38} stroke={C.ink} strokeWidth={3} strokeLinecap="round" transform={`rotate(${clockSpin})`} />
            <circle r={5} fill={C.seal} />
          </g>

          {/* 文件柜与奖状 */}
          <g>
            <rect x={1290} y={560} width={150} height={300} fill="#9DA291" stroke="#7B8072" strokeWidth={4} />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={1300} y={572 + k * 96} width={130} height={86} fill="#AEB3A2" stroke="#7B8072" strokeWidth={2} />
                <rect x={1346} y={606 + k * 96} width={38} height={10} fill="#5E6354" />
              </g>
            ))}
            <rect x={1280} y={340} width={160} height={116} fill="#FBF6EC" stroke="#8B6B3E" strokeWidth={8} />
            <rect x={1300} y={362} width={120} height={10} fill={C.seal} opacity={0.75} />
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={1300} y={386 + k * 16} width={120 - (k % 2) * 30} height={5} fill="#B9AE98" />
            ))}
          </g>

          {/* 门（右）：门洞里是金色的光，门扇向内推开 */}
          <g>
            <rect x={DOOR.x - 16} y={DOOR.top - 16} width={DOOR.w + 32} height={FLOOR - DOOR.top + 16} fill="#8B6B48" />
            <rect x={DOOR.x} y={DOOR.top} width={DOOR.w} height={FLOOR - DOOR.top} fill="url(#s5b-doorlight)" opacity={0.15 + doorOpen * 0.85} />
            {/* 门外的木料堆剪影 */}
            <g opacity={doorOpen} clipPath="url(#s5b-doorclip)">
              {[0, 1, 2, 3, 4].map((k) => (
                <rect key={k} x={DOOR.x + 16 + k * 36} y={FLOOR - 88 - (k % 2) * 30} width={30} height={88 + (k % 2) * 30} fill="#B8773C" opacity={0.75} />
              ))}
            </g>
            <clipPath id="s5b-doorclip">
              <rect x={DOOR.x} y={DOOR.top} width={DOOR.w} height={FLOOR - DOOR.top} />
            </clipPath>
            {/* 门扇：绕左侧铰链收窄 */}
            <g transform={`translate(${DOOR.x} 0) scale(${1 - doorOpen * 0.86} 1)`}>
              <rect x={0} y={DOOR.top} width={DOOR.w} height={FLOOR - DOOR.top} fill="#A9835A" stroke="#7A5A38" strokeWidth={5} />
              <rect x={22} y={DOOR.top + 30} width={DOOR.w - 44} height={200} fill="none" stroke="#7A5A38" strokeWidth={4} />
              <rect x={22} y={DOOR.top + 270} width={DOOR.w - 44} height={260} fill="none" stroke="#7A5A38" strokeWidth={4} />
              <circle cx={DOOR.w - 26} cy={DOOR.top + 330} r={9} fill="#E7C26A" />
            </g>
            {/* 光线涌出 */}
            <polygon
              points={`${DOOR.x},${DOOR.top + 60} ${DOOR.x - 760 * doorOpen},${FLOOR + 10} ${DOOR.x - 260 * doorOpen},${FLOOR + 10} ${DOOR.x},${FLOOR - 220}`}
              fill="#FFE6A4"
              opacity={0.45 * doorOpen}
            />
          </g>

          {/* 办公桌 */}
          <g>
            <ellipse cx={DESK.x + DESK.w / 2} cy={FLOOR + 14} rx={DESK.w / 2 + 40} ry={22} fill="#000" opacity={0.12} />
            <rect x={DESK.x} y={DESK.top} width={DESK.w} height={FLOOR - DESK.top} fill="#8E6A45" />
            <rect x={DESK.x - 24} y={DESK.top - 18} width={DESK.w + 48} height={30} fill="#B88C5A" />
            <rect x={DESK.x + 40} y={DESK.top + 30} width={220} height={150} fill="#7A5A3A" stroke="#5E4428" strokeWidth={3} />
            <rect x={DESK.x + 128} y={DESK.top + 90} width={44} height={10} fill="#D8B875" />
            {/* 桌上：文件堆 */}
            <g>
              <rect x={DESK.x + 20} y={DESK.top - 70} width={120} height={52} fill="#F6EFDF" stroke="#B9AE98" strokeWidth={2} />
              <rect x={DESK.x + 28} y={DESK.top - 100} width={110} height={30} fill="#FBF6EC" stroke="#B9AE98" strokeWidth={2} />
              <rect x={DESK.x + 20} y={DESK.top - 72} width={120} height={8} fill={C.seal} opacity={0.7} />
            </g>
            {/* 搪瓷茶缸 */}
            <g transform={`translate(${DESK.x + 190} ${DESK.top - 18})`}>
              <rect x={-30} y={-64} width={60} height={64} rx={6} fill="#F4F2EA" stroke="#2F5D8A" strokeWidth={4} />
              <rect x={-30} y={-64} width={60} height={10} fill="#2F5D8A" />
              <path d="M30,-50 q24,2 24,22 q0,20 -24,20" fill="none" stroke="#2F5D8A" strokeWidth={6} />
            </g>
            {/* 台灯 */}
            <g transform={`translate(${DESK.x + DESK.w - 70} ${DESK.top - 18})`}>
              <ellipse cx={0} cy={0} rx={40} ry={8} fill="#2E6B4A" />
              <path d="M0,0 L-6,-90 L40,-130" fill="none" stroke="#2E6B4A" strokeWidth={7} strokeLinecap="round" />
              <path d="M22,-126 L70,-150 L74,-110 Z" fill="#3E8A62" />
            </g>

            {/* 铁饭碗 */}
            <g transform={`translate(${DESK.x + 370} ${DESK.top - 18})`} opacity={bowlDim}>
              <ellipse cx={0} cy={2} rx={76} ry={9} fill="#000" opacity={0.18} />
              <path d="M-72,-62 L72,-62 Q66,-6 0,-2 Q-66,-6 -72,-62 Z" fill="url(#s5b-iron)" />
              <ellipse cx={0} cy={-62} rx={72} ry={13} fill="#6A6560" />
              <ellipse cx={0} cy={-62} rx={72} ry={13} fill="none" stroke={C.gold} strokeWidth={5} />
              <ellipse cx={0} cy={-64} rx={60} ry={8} fill="#F6EDD4" />
              <g fill="#FFFBEA" opacity={0.9}>
                {new Array(14).fill(0).map((_, i) => (
                  <ellipse key={i} cx={-44 + (i % 7) * 15} cy={-66 + Math.floor(i / 7) * 5} rx={5} ry={2.4} />
                ))}
              </g>
              <path d="M-50,-50 Q-40,-20 -20,-12" fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
              {/* 热气 */}
              {steam.map((st, i) => {
                const t = ((f * 0.012 + st.ph) % 1);
                return (
                  <ellipse
                    key={i}
                    cx={st.dx + Math.sin(t * 6 + i) * 10}
                    cy={-80 - t * 110}
                    rx={8 + t * 16}
                    ry={10 + t * 18}
                    fill="#FFFFFF"
                    opacity={(1 - t) * 0.55 * bowlDim}
                    filter="url(#s5b-soft)"
                  />
                );
              })}
            </g>

            {/* 辞呈与工作证 */}
            <g opacity={letter} transform={`translate(${DESK.x + 300} ${DESK.top - 28 - (1 - letter) * 120}) rotate(${-6 + (1 - letter) * 20})`}>
              <rect x={-44} y={-6} width={88} height={14} fill="#000" opacity={0.08} />
              <rect x={-42} y={-62} width={84} height={64} fill="#FFFDF4" stroke="#B9AE98" strokeWidth={2} />
              <text x={0} y={-36} textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={22} fill={C.ink}>辞呈</text>
              <rect x={-24} y={-26} width={48} height={3} fill="#B9AE98" />
              <rect x={-24} y={-18} width={34} height={3} fill="#B9AE98" />
              <rect x={14} y={-22} width={20} height={20} fill={C.seal} opacity={0.85} />
            </g>
            <g opacity={badge} transform={`translate(${DESK.x + 420} ${DESK.top - 14 - (1 - badge) * 60}) rotate(${8 - (1 - badge) * 30})`}>
              <rect x={-30} y={-42} width={60} height={42} rx={4} fill="#E9F0F6" stroke="#2F5D8A" strokeWidth={3} />
              <rect x={-22} y={-34} width={18} height={22} fill="#9DB7CC" />
              <rect x={0} y={-32} width={22} height={4} fill="#2F5D8A" />
              <rect x={0} y={-24} width={18} height={4} fill="#2F5D8A" />
            </g>
          </g>

          {/* “铁饭碗”字样 */}
          <g opacity={bowlLabel} transform={`translate(${DESK.x + 370} ${DESK.top - 230 - (1 - bowlLabel) * 14})`}>
            <text textAnchor="middle" fontFamily={serif} fontWeight={900} fontSize={54} fill={C.ink} letterSpacing={8} style={{filter: 'drop-shadow(0 0 10px rgba(251,246,236,0.9))'}}>
              铁饭碗
            </text>
            <text y={32} textAnchor="middle" fontFamily={serif} fontStyle="italic" fontSize={18} fill={C.inkMute} letterSpacing={3}>
              the iron rice bowl
            </text>
          </g>

          {/* 人物（背影剪影） */}
          <g opacity={figIn}>
            <ellipse cx={figX} cy={FLOOR + 6} rx={70 * figS} ry={11 * figS} fill="#000" opacity={0.16} />
            <InkFigure x={figX} y={FLOOR - bob} height={figH} sway={Math.sin(f * 0.42) * (walking ? 1 : 0.1)} />
          </g>
        </g>
      </svg>

      {/* 光爆 */}
      <AbsoluteFill
        style={{
          opacity: flash,
          background: 'radial-gradient(ellipse 70% 80% at 72% 56%, #FFF8E2 0%, #FFE39A 45%, #F7C864 100%)',
        }}
      />

      {/* ── 地板特写 ── */}
      <AbsoluteFill style={{opacity: boardIn}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 50% 46%, #FFF3D0 0%, #F7E3B0 55%, #EBCB86 100%)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="s5b-plank" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9A15A" />
              <stop offset="50%" stopColor="#C58A45" />
              <stop offset="100%" stopColor="#A86A2E" />
            </linearGradient>
            <linearGradient id="s5b-sweep" x1="0" y1="0" x2="1" y2="0.25">
              <stop offset={Math.max(0, sweep - 0.14)} stopColor="#fff" stopOpacity={0} />
              <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFF6D6" stopOpacity={0.9} />
              <stop offset={Math.min(1, sweep + 0.14)} stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <clipPath id="s5b-plank-clip">
              <rect x={-760} y={-120} width={1520} height={240} rx={8} />
            </clipPath>
          </defs>
          <g transform={`translate(${W / 2 + (1 - boardIn) * 420} ${H / 2 - 50}) rotate(${-7 * (1 - boardIn)}) scale(${boardZoom})`}>
            <ellipse cx={0} cy={150} rx={760} ry={34} fill="#6B4A1E" opacity={0.22} />
            <rect x={-760} y={-120} width={1520} height={240} rx={8} fill="url(#s5b-plank)" />
            <g clipPath="url(#s5b-plank-clip)">
              <g stroke="#7A4A1E" strokeOpacity={0.4} strokeWidth={2} fill="none">
                {new Array(30).fill(0).map((_, i) => {
                  const y0 = -116 + i * 8 + random(`pg${i}`) * 3;
                  let d = `M-770,${y0}`;
                  for (let x = -770; x <= 770; x += 24) {
                    d += ` L${x},${(y0 + Math.sin(x * 0.006 + i * 0.6) * 7 + Math.sin(x * 0.02 + i) * 2).toFixed(1)}`;
                  }
                  return <path key={i} d={d} />;
                })}
              </g>
              <ellipse cx={-240} cy={-20} rx={60} ry={20} fill="none" stroke="#7A4A1E" strokeOpacity={0.5} strokeWidth={3} />
              <ellipse cx={-240} cy={-20} rx={34} ry={10} fill="none" stroke="#7A4A1E" strokeOpacity={0.4} strokeWidth={2} />
              <ellipse cx={330} cy={46} rx={46} ry={15} fill="none" stroke="#7A4A1E" strokeOpacity={0.5} strokeWidth={3} />
              {/* 企口接缝 */}
              <rect x={-760} y={-120} width={1520} height={6} fill="#F0C987" opacity={0.7} />
              <rect x={-760} y={114} width={1520} height={6} fill="#7A4A1E" opacity={0.5} />
              <rect x={-760} y={-120} width={1520} height={240} fill="url(#s5b-sweep)" style={{mixBlendMode: 'screen'}} />
            </g>
          </g>
        </svg>
      </AbsoluteFill>
      <GoldDust count={34} seed="s5b" opacity={interpolate(f, [120, 180], [0, 0.9], cl)} />
      <OldPhoto strength={0.4} seed="s5b" leak={false} />
    </AbsoluteFill>
  );
};
