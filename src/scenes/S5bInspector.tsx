import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';
import {OldPhoto} from '../components/OldPhoto';
import {YearTag} from '../components/YearTag';
import {ridgePath, wobblyCircle} from '../lib/geom';

/**
 * 第 5.5 镜（10.5 秒 / 315 帧）：1988–1994，中华人民共和国船舶检验局温州渔船检验处，验船师
 * 动画按“内部帧”（原 9 秒 / 270 帧的编排）书写，再经 warp 拉伸到 315 帧：
 *   新增的 45 帧放在 A 段（+32）和 B 段（+14），给加长的第一句字幕留出阅读时间；C、D 段节奏不变，
 *   因此 D 段结尾（内部第 270 帧，实际第 315 帧）与原版完全一致，可无缝接第 6 镜。
 * A   0–80  清晨渔港，木质渔船靠岸；他沿船舷敲击船板，每一下漾开一圈金色“年轮”
 * B  72–160 检验证书一年一张盖章叠起，年份 1988 → 1994；渔船进出、日影移动
 * C 156–204 最后一次验船：检验锤与记录夹放在系缆桩上，摘下工作帽，转身望向岸上
 * D 198–270 特写：手抚船板，弯曲的旧船板被抚平、变亮，成为一片木地板（接第 6 镜）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const QUAY = 838; // 码头面
const GUNWALE = 560; // 船舷上沿
const HULL_X0 = 600;
const HULL_X1 = 1760;
const TAPS = [
  {f: 26, x: 690, figX: 600},
  {f: 46, x: 900, figX: 810},
  {f: 66, x: 1110, figX: 1020},
];
const CERT_START = 82;
const CERT_GAP = 12;
const CERTS = 7; // 1988 … 1994

/** 实际帧 → 内部帧（分段线性）。实际 315 帧 = 内部 270 帧；超出后按 1:1 延伸 */
const WARP_ACTUAL = [0, 112, 206, 250, 315];
const WARP_INTERNAL = [0, 80, 160, 204, 270];
export const warpFrame = (f: number) => interpolate(f, WARP_ACTUAL, WARP_INTERNAL, {extrapolateLeft: 'clamp', extrapolateRight: 'extend'});

export const S5bInspector: React.FC = () => {
  const f = warpFrame(useCurrentFrame());
  const io = Easing.inOut(Easing.cubic);

  // ── 年份：随证书滚动 ──
  const yi = Math.max(0, Math.min(CERTS - 1, Math.floor((f - CERT_START) / CERT_GAP)));
  const year = String(1988 + (f < CERT_START ? 0 : yi));

  // ── 人物位置：在三处敲击点之间走动；C 段停在船头附近 ──
  let figX = TAPS[0].figX;
  let walking = false;
  for (let k = 0; k < TAPS.length - 1; k++) {
    const a = TAPS[k].f + 6;
    const b = TAPS[k + 1].f - 4;
    if (f >= a && f < b) {
      figX = interpolate(f, [a, b], [TAPS[k].figX, TAPS[k + 1].figX], {...cl, easing: Easing.inOut(Easing.quad)});
      walking = true;
    } else if (f >= b) figX = TAPS[k + 1].figX;
  }
  // C 段：走回船头旁的系缆桩
  if (f >= 156) {
    figX = interpolate(f, [156, 178], [TAPS[2].figX, 470], {...cl, easing: Easing.inOut(Easing.quad)});
    walking = f < 178;
  }
  const tapSwing = TAPS.reduce((acc, t) => {
    const d = f - t.f;
    if (d > -10 && d < 8) return Math.max(acc, interpolate(d, [-10, 0, 8], [0, 1, 0], cl));
    return acc;
  }, 0);
  const facing = f >= 186 ? -1 : 1; // 最后转身望向岸上（左）
  const toolsDown = interpolate(f, [178, 188], [0, 1], {...cl, easing: Easing.out(Easing.quad)});
  const capOff = interpolate(f, [186, 196], [0, 1], {...cl, easing: Easing.out(Easing.quad)});

  // ── 镜头 ──
  const push = interpolate(f, [0, 200], [1.0, 1.1], {...cl, easing: Easing.inOut(Easing.sin)});
  const pan = interpolate(f, [0, 80, 156, 200], [40, -80, -80, 120], {...cl, easing: io});
  const harborOpacity = interpolate(f, [196, 214], [1, 0], cl);
  const sunT = interpolate(f, [0, 200], [0, 1], cl);

  // ── 证书段遮罩 ──
  const certVeil = interpolate(f, [72, 88, 150, 162], [0, 1, 1, 0], cl);

  // ── 特写段 ──
  const closeIn = interpolate(f, [198, 220], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
  const handX = interpolate(f, [202, 246], [-180, 1700], {...cl, easing: Easing.inOut(Easing.sin)});
  const handLift = interpolate(f, [242, 260], [0, -900], {...cl, easing: Easing.in(Easing.cubic)});
  const flatten = interpolate(f, [212, 256], [0, 1], {...cl, easing: io});
  const sweep = interpolate(f, [236, 268], [-0.4, 1.4], cl);
  const handOut = 1;

  const ridge = useMemo(() => ridgePath(W + 600, 470, 120, 's5bmt', 600, 12, 0.003), []);
  const bgBoats = useMemo(
    () => [
      {y: 560, s: 0.32, x0: 1900, v: -2.4, seed: 'b1'},
      {y: 545, s: 0.24, x0: -200, v: 1.8, seed: 'b2'},
      {y: 575, s: 0.4, x0: 300, v: 0.4, seed: 'b3'},
    ],
    [],
  );

  return (
    <AbsoluteFill>
      <Paper glowAt={[70, 30]} />

      {/* ═════════ A–C：渔港 ═════════ */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: harborOpacity}}>
        <defs>
          <InkDefs p="s5b" seed={17} />
          <linearGradient id="s5b-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3E6CC" />
            <stop offset="70%" stopColor="#F8EBD2" />
            <stop offset="100%" stopColor="#F6E2BC" />
          </linearGradient>
          <linearGradient id="s5b-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9D3BE" />
            <stop offset="100%" stopColor="#C5BFA6" />
          </linearGradient>
          <radialGradient id="s5b-sun">
            <stop offset="0%" stopColor="#FFF6DA" stopOpacity={1} />
            <stop offset="40%" stopColor="#FFE2A0" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#FFE2A0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s5b-hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B07A45" />
            <stop offset="100%" stopColor="#7E5530" />
          </linearGradient>
          <linearGradient id="s5b-quay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDBFA4" />
            <stop offset="100%" stopColor="#B9A988" />
          </linearGradient>
          <linearGradient id="s5b-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4E4" stopOpacity={0} />
            <stop offset="100%" stopColor="#FBF4E4" stopOpacity={0.85} />
          </linearGradient>
          <clipPath id="s5b-hullclip">
            <path d={HULL_PATH} />
          </clipPath>
        </defs>

        <g transform={`translate(${W / 2} ${H / 2}) scale(${push}) translate(${-W / 2 + pan} ${-H / 2})`}>
          <rect x={-600} y={-200} width={W + 1200} height={700} fill="url(#s5b-sky)" />
          {/* 日影 */}
          <g transform={`translate(${interpolate(sunT, [0, 1], [1500, 1180])} ${interpolate(sunT, [0, 1], [330, 230])})`}>
            <circle r={300} fill="url(#s5b-sun)" />
            <circle r={52} fill="#FFF8E6" opacity={0.9} />
          </g>
          <path d={ridge} fill={C.inkWash} opacity={0.2} filter="url(#s5b-wash)" transform="translate(-300 0)" />
          <rect x={-600} y={540} width={W + 1200} height={400} fill="url(#s5b-sea)" />
          {/* 远处渔船（B 段进出港） */}
          {bgBoats.map((b, i) => {
            const x = b.x0 + b.v * f;
            return (
              <g key={i} transform={`translate(${x} ${b.y}) scale(${b.s})`} opacity={0.55} filter="url(#s5b-bleed)">
                <SmallBoat seed={b.seed} />
              </g>
            );
          })}
          <rect x={-600} y={470} width={W + 1200} height={110} fill="url(#s5b-mist)" />
          {/* 桅杆林 */}
          <g stroke={C.inkWash} strokeOpacity={0.35} strokeWidth={3}>
            {new Array(14).fill(0).map((_, i) => {
              const x = -200 + i * 170 + random(`ms${i}`) * 60;
              const h = 160 + random(`mh${i}`) * 120;
              return <line key={i} x1={x} y1={560} x2={x + (random(`ml${i}`) - 0.5) * 16} y2={560 - h} />;
            })}
          </g>

          {/* 主渔船：木质船体 */}
          <g filter="url(#s5b-bleed)">
            {/* 驾驶舱与桅杆 */}
            <rect x={1380} y={GUNWALE - 150} width={220} height={150} fill="#E9DCC2" stroke="#8B6B48" strokeWidth={4} />
            <rect x={1360} y={GUNWALE - 170} width={260} height={24} fill="#7E5530" />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={1400 + k * 66} y={GUNWALE - 128} width={48} height={40} fill="#A9C7D6" opacity={0.85} />
            ))}
            <line x1={1220} y1={GUNWALE} x2={1220} y2={GUNWALE - 360} stroke="#6E4A28" strokeWidth={9} />
            <line x1={1220} y1={GUNWALE - 330} x2={1400} y2={GUNWALE - 170} stroke="#6E4A28" strokeWidth={2} />
            <line x1={1220} y1={GUNWALE - 330} x2={900} y2={GUNWALE} stroke="#6E4A28" strokeWidth={2} />
            <g transform={`translate(1220 ${GUNWALE - 360})`}>
              <path d={`M0,0 L${60 + Math.sin(f * 0.15) * 6},${8 + Math.sin(f * 0.2) * 3} L0,26 Z`} fill={C.seal} />
            </g>
            <path d={HULL_PATH} fill="url(#s5b-hull)" />
            {/* 船板 */}
            <g clipPath="url(#s5b-hullclip)">
              {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                <path
                  key={k}
                  d={`M${HULL_X0 - 40},${GUNWALE + 22 + k * 38} C${900},${GUNWALE + 30 + k * 40} ${1400},${GUNWALE + 24 + k * 40} ${HULL_X1 + 40},${GUNWALE + 8 + k * 42}`}
                  fill="none"
                  stroke="#5E3C1E"
                  strokeOpacity={0.55}
                  strokeWidth={2.4}
                />
              ))}
              {/* 木纹 */}
              <g stroke="#E0B47A" strokeOpacity={0.22} strokeWidth={1.4} fill="none">
                {new Array(26).fill(0).map((_, i) => {
                  const y0 = GUNWALE + 10 + i * 11;
                  let d = `M${HULL_X0 - 40},${y0}`;
                  for (let x = HULL_X0 - 40; x <= HULL_X1 + 40; x += 30) d += ` L${x},${(y0 + Math.sin(x * 0.008 + i) * 4).toFixed(1)}`;
                  return <path key={i} d={d} />;
                })}
              </g>
              {/* 船钉 */}
              <g fill="#3E2A16" opacity={0.6}>
                {new Array(7).fill(0).map((_, r) =>
                  new Array(18).fill(0).map((__, c) => <circle key={`${r}-${c}`} cx={HULL_X0 + 40 + c * 64 + (r % 2) * 32} cy={GUNWALE + 40 + r * 38} r={2.6} />),
                )}
              </g>
              {/* 敲击处的金色年轮波纹 */}
              {TAPS.map((t, k) => {
                const d = f - t.f;
                if (d < 0 || d > 40) return null;
                return [0, 1, 2].map((r) => {
                  const p = interpolate(d - r * 5, [0, 30], [0, 1], cl);
                  if (p <= 0) return null;
                  return (
                    <path
                      key={`${k}-${r}`}
                      d={wobblyCircle(t.x, 696, 12 + p * 90, `tap${k}${r}`, 0.05)}
                      fill="none"
                      stroke={C.goldLight}
                      strokeWidth={4 - p * 2.6}
                      strokeOpacity={(1 - p) * 0.95}
                      transform={`translate(${t.x} 696) scale(1 0.62) translate(${-t.x} -696)`}
                    />
                  );
                });
              })}
            </g>
            {/* 船舷护木与船号 */}
            <path d={`M${HULL_X0 - 30},${GUNWALE - 4} L${HULL_X1 + 20},${GUNWALE - 30}`} stroke="#5E3C1E" strokeWidth={14} strokeLinecap="round" />
            <text x={1330} y={GUNWALE + 68} fontFamily={sans} fontWeight={700} fontSize={34} fill="#F6EEDC" opacity={0.85} letterSpacing={3}>
              浙瓯渔 3108
            </text>
            {/* 船眼（温州渔船特色） */}
            <g transform={`translate(${HULL_X0 + 90} ${GUNWALE + 52})`}>
              <ellipse rx={30} ry={18} fill="#F6EEDC" />
              <circle r={11} fill={C.ink} />
              <circle cx={-3} cy={-3} r={3} fill="#fff" />
            </g>
          </g>

          {/* 码头 */}
          <rect x={-600} y={QUAY - 14} width={W + 1200} height={H - QUAY + 300} fill="url(#s5b-quay)" />
          <rect x={-600} y={QUAY - 18} width={W + 1200} height={10} fill="#A8987A" />
          <g stroke="#A8987A" strokeWidth={2} opacity={0.7}>
            {new Array(26).fill(0).map((_, i) => (
              <line key={i} x1={-560 + i * 120} y1={QUAY - 8} x2={-600 + i * 120} y2={H + 200} />
            ))}
          </g>
          {/* 系缆桩 + 缆绳 */}
          <g>
            <path d={`M412,${QUAY - 70} C520,${QUAY - 40} 600,${QUAY - 110} ${HULL_X0 + 60},${GUNWALE + 70}`} fill="none" stroke="#8C7350" strokeWidth={6} />
            <rect x={380} y={QUAY - 80} width={64} height={70} rx={10} fill="#5F584E" />
            <rect x={370} y={QUAY - 88} width={84} height={18} rx={8} fill="#6E665A" />
          </g>
          {/* 放下的工具 */}
          {toolsDown > 0 ? (
            <g opacity={toolsDown} transform={`translate(${412} ${QUAY - 92 - (1 - toolsDown) * 40})`}>
              <rect x={-36} y={-10} width={50} height={8} fill="#5E3C1E" transform="rotate(-8)" />
              <rect x={10} y={-22} width={20} height={14} fill="#4A4642" transform="rotate(-8)" />
              <rect x={-30} y={-46} width={44} height={36} fill="#E9E3D2" stroke="#7A6A50" strokeWidth={2} transform="rotate(6)" />
              <rect x={-16} y={-50} width={16} height={7} fill="#7A6A50" transform="rotate(6)" />
            </g>
          ) : null}

          {/* 人物（侧身扁平剪影） */}
          <Inspector x={figX} y={QUAY} f={f} walking={walking} swing={tapSwing} facing={facing} capOff={capOff} holding={toolsDown < 0.5} />
        </g>
      </svg>

      {/* ═════════ B：证书叠起 ═════════ */}
      <AbsoluteFill style={{opacity: certVeil}}>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 70% at 50% 46%, rgba(251,246,236,0.94) 0%, rgba(251,246,236,0.82) 60%, rgba(243,234,218,0.7) 100%)'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="s5b-cert-shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#6B4E2A" floodOpacity="0.25" />
            </filter>
          </defs>
          {new Array(CERTS).fill(0).map((_, k) => {
            const t0 = CERT_START + k * CERT_GAP;
            const p = interpolate(f, [t0 - 8, t0 + 4], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
            if (p <= 0) return null;
            const stamp = interpolate(f, [t0 + 2, t0 + 8], [0, 1], {...cl, easing: Easing.out(Easing.back(2.4))});
            const rot = (random(`cr${k}`) - 0.5) * 9;
            const dx = (random(`cx${k}`) - 0.5) * 70;
            const dy = -k * 7;
            return (
              <g
                key={k}
                transform={`translate(${W / 2 + dx} ${H / 2 - 40 + dy - (1 - p) * 120}) rotate(${rot + (1 - p) * 10})`}
                opacity={Math.min(1, p * 1.5)}
                filter="url(#s5b-cert-shadow)"
              >
                <Certificate year={1988 + k} no={k} stamp={stamp} />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>

      {/* ═════════ D：手抚船板 → 木地板 ═════════ */}
      <AbsoluteFill style={{opacity: closeIn}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 50% 46%, #FFF3D0 0%, #F4DFAE ${55 + flatten * 10}%, #E5C487 100%)`}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="s5b-plank" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mix('#9C6A3A', '#DDA75E', flatten)} />
              <stop offset="50%" stopColor={mix('#80522A', '#C98D47', flatten)} />
              <stop offset="100%" stopColor={mix('#5E3A1C', '#AC6E31', flatten)} />
            </linearGradient>
            <linearGradient id="s5b-sweep" x1="0" y1="0" x2="1" y2="0.25">
              <stop offset={Math.max(0, sweep - 0.14)} stopColor="#fff" stopOpacity={0} />
              <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFF6D6" stopOpacity={0.9} />
              <stop offset={Math.min(1, sweep + 0.14)} stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <clipPath id="s5b-plankclip">
              <path d={plankPath(flatten)} />
            </clipPath>
          </defs>
          <g transform={`translate(${W / 2} ${H / 2 - 40}) scale(${interpolate(f, [198, 270], [1.08, 1.0], cl)})`}>
            <ellipse cx={0} cy={170} rx={780} ry={36} fill="#6B4A1E" opacity={0.2 * flatten} />
            <path d={plankPath(flatten)} fill="url(#s5b-plank)" />
            <g clipPath="url(#s5b-plankclip)">
              <g stroke={mix('#3E2410', '#7A4A1E', flatten)} strokeOpacity={0.4} strokeWidth={2} fill="none">
                {new Array(30).fill(0).map((_, i) => {
                  const y0 = -116 + i * 8 + random(`pg${i}`) * 3;
                  let d = `M-800,${y0}`;
                  for (let x = -800; x <= 800; x += 24) {
                    const bow = (1 - flatten) * 60 * (1 - (x / 800) ** 2);
                    d += ` L${x},${(y0 - bow + Math.sin(x * 0.006 + i * 0.6) * 7 + Math.sin(x * 0.02 + i) * 2).toFixed(1)}`;
                  }
                  return <path key={i} d={d} />;
                })}
              </g>
              {/* 旧船板上的船钉与填缝，抚过后消失 */}
              <g opacity={1 - flatten}>
                {[-560, -280, 0, 280, 560].map((x) => (
                  <circle key={x} cx={x} cy={-40 - (1 - (x / 800) ** 2) * 60 * (1 - flatten)} r={7} fill="#2E1E10" />
                ))}
                <path d={`M-800,${-118} Q0,${-178} 800,${-118}`} stroke="#3A2A1A" strokeWidth={8} fill="none" opacity={0.6} />
              </g>
              <ellipse cx={-240} cy={-20 - (1 - flatten) * 52} rx={60} ry={20} fill="none" stroke="#7A4A1E" strokeOpacity={0.5} strokeWidth={3} />
              <ellipse cx={330} cy={46 - (1 - flatten) * 46} rx={46} ry={15} fill="none" stroke="#7A4A1E" strokeOpacity={0.5} strokeWidth={3} />
              <rect x={-800} y={-200} width={1600} height={400} fill="url(#s5b-sweep)" style={{mixBlendMode: 'screen'}} />
            </g>
          </g>
          {/* 手 */}
          <g transform={`translate(${handX} ${410 + handLift}) rotate(78)`} opacity={handOut}>
            <Hand />
          </g>
        </svg>
      </AbsoluteFill>

      <YearTag year={year} note="WENZHOU · SHIP INSPECTOR" />
      <GoldDust count={30} seed="s5bd" opacity={interpolate(f, [200, 250], [0.3, 0.9], cl)} />
      <OldPhoto strength={0.45} seed="s5b" leak={false} />
    </AbsoluteFill>
  );
};

/** 主渔船船体：船头在左（高翘），船尾在右 */
const HULL_PATH = `M${HULL_X0 - 40},${GUNWALE - 40} L${HULL_X1 + 20},${GUNWALE - 30} C${HULL_X1 + 30},${GUNWALE + 120} ${HULL_X1 - 30},${GUNWALE + 230} ${HULL_X1 - 140},${GUNWALE + 290} L${HULL_X0 + 220},${GUNWALE + 300} C${HULL_X0 + 80},${GUNWALE + 240} ${HULL_X0 - 20},${GUNWALE + 120} ${HULL_X0 - 40},${GUNWALE - 40} Z`;

const SmallBoat: React.FC<{seed: string}> = ({seed}) => (
  <g fill={C.inkSoft}>
    <path d="M-300,0 L300,-10 C300,60 240,110 180,120 L-180,124 C-250,100 -290,50 -300,0 Z" />
    <rect x={60} y={-120} width={140} height={110} />
    <line x1={-40} y1={0} x2={-40} y2={-260 - random(seed) * 60} stroke={C.inkSoft} strokeWidth={10} />
  </g>
);

/** 侧身扁平人物：工作帽、制服、检验锤、记录夹。原点在双脚，朝右。 */
const Inspector: React.FC<{
  x: number;
  y: number;
  f: number;
  walking: boolean;
  swing: number;
  facing: number;
  capOff: number;
  holding: boolean;
}> = ({x, y, f, walking, swing, facing, capOff, holding}) => {
  const step = walking ? Math.sin(f * 0.45) : 0;
  const bob = walking ? Math.abs(Math.sin(f * 0.45)) * 4 : 0;
  const armAng = holding ? -70 + swing * 85 : 10; // 敲击：锤子向前下方挥
  const jacket = '#3E5373';
  const trousers = '#2F3B4E';
  const skin = '#E6BE98';
  const hair = '#2A241E';
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${facing} 1)`}>
      <ellipse cx={0} cy={bob + 4} rx={50} ry={8} fill="#000" opacity={0.15} />
      {/* 腿 */}
      <g transform={`rotate(${step * 16} 0 -150)`}>
        <rect x={-9} y={-150} width={20} height={146} rx={6} fill={trousers} />
        <path d="M-9,-6 L24,-6 Q30,0 24,4 L-9,4 Z" fill="#1E1A16" />
      </g>
      <g transform={`rotate(${-step * 16} 0 -150)`}>
        <rect x={-11} y={-150} width={20} height={146} rx={6} fill={trousers} />
        <path d="M-11,-6 L22,-6 Q28,0 22,4 L-11,4 Z" fill="#1E1A16" />
      </g>
      {/* 后臂：拿记录夹 */}
      <g transform="rotate(-40 -2 -250)">
        <rect x={-10} y={-252} width={18} height={84} rx={8} fill={jacket} />
        {holding ? <rect x={-26} y={-180} width={44} height={56} fill="#E9E3D2" stroke="#7A6A50" strokeWidth={2} transform="rotate(40 -4 -150)" /> : null}
      </g>
      {/* 躯干：制服夹克 */}
      <path d="M-28,-258 Q-34,-200 -26,-142 L30,-142 Q38,-200 30,-258 Q0,-270 -28,-258 Z" fill={jacket} />
      <rect x={-26} y={-152} width={56} height={10} fill="#2A3850" />
      <rect x={8} y={-238} width={14} height={10} fill="#E7C26A" />
      <path d="M-4,-262 L10,-238 L22,-262 Z" fill="#F2EEE4" />
      {/* 头 */}
      <rect x={-6} y={-276} width={14} height={16} fill={skin} />
      <ellipse cx={4} cy={-298} rx={20} ry={23} fill={skin} />
      <path d="M-16,-300 C-20,-322 18,-330 24,-306 L22,-300 C10,-306 -4,-306 -12,-292 L-14,-276 C-20,-282 -20,-292 -16,-300 Z" fill={hair} />
      <circle cx={18} cy={-300} r={2.4} fill={hair} />
      {/* 工作帽（摘下后拿在手里） */}
      <g transform={`translate(${capOff * 18} ${capOff * 130}) rotate(${capOff * -24})`}>
        <path d="M-20,-312 Q4,-336 26,-314 L28,-306 L-20,-306 Z" fill="#2E4664" />
        <path d="M18,-308 L46,-304 Q40,-298 18,-300 Z" fill="#1E2E44" />
        <rect x={-2} y={-322} width={10} height={6} fill="#E7C26A" />
      </g>
      {/* 前臂：检验锤 */}
      <g transform={`rotate(${armAng} 6 -250)`}>
        <rect x={-3} y={-252} width={18} height={92} rx={8} fill={jacket} />
        <circle cx={6} cy={-158} r={9} fill={skin} />
        {holding ? (
          <g>
            <rect x={2} y={-160} width={8} height={70} fill="#6E4A28" />
            <rect x={-12} y={-98} width={36} height={18} rx={3} fill="#4A4642" />
          </g>
        ) : null}
      </g>
    </g>
  );
};

/** 渔船检验证书 */
const Certificate: React.FC<{year: number; no: number; stamp: number}> = ({year, no, stamp}) => (
  <g>
    <rect x={-300} y={-200} width={600} height={400} fill="#FBF7EC" stroke="#C9B48A" strokeWidth={3} />
    <rect x={-284} y={-184} width={568} height={368} fill="none" stroke="#C9B48A" strokeWidth={1.5} />
    <text x={0} y={-130} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={40} fill={C.ink} letterSpacing={8}>
      渔船检验证书
    </text>
    <text x={0} y={-90} textAnchor="middle" fontFamily={sans} fontSize={20} fill={C.inkSoft} letterSpacing={4}>
      中华人民共和国船舶检验局温州渔船检验处
    </text>
    {[
      ['船名', `浙瓯渔 ${3101 + no * 7}`],
      ['船体材料', '木质'],
      ['检验类别', '定期检验'],
      ['检验日期', `${year} 年`],
      ['验船师', '卢伟光'],
    ].map(([k, v], i) => (
      <g key={k} fontFamily={sans} fontSize={20}>
        <text x={-230} y={-34 + i * 40} fill={C.inkMute}>
          {k}
        </text>
        <text x={-80} y={-34 + i * 40} fill={C.ink}>
          {v}
        </text>
        <line x1={-90} y1={-26 + i * 40} x2={150} y2={-26 + i * 40} stroke="#D8C8A6" strokeWidth={1.2} />
      </g>
    ))}
    {/* 红章 */}
    <g transform={`translate(190 110) scale(${1.6 - 0.6 * stamp}) rotate(${-12 * stamp})`} opacity={Math.min(1, stamp * 1.4)}>
      <circle r={62} fill="none" stroke={C.seal} strokeWidth={6} />
      <circle r={50} fill="none" stroke={C.seal} strokeWidth={2} />
      <path d="M0,-22 L6,-7 L22,-7 L9,3 L14,19 L0,9 L-14,19 L-9,3 L-22,-7 L-6,-7 Z" fill={C.seal} />
      <text y={42} textAnchor="middle" fontFamily={serif} fontWeight={700} fontSize={13} fill={C.seal}>
        检验专用章
      </text>
    </g>
  </g>
);

/** 俯视的手（右手，掌心向下，手指朝右），连袖口 */
const Hand: React.FC = () => (
  <g>
    <path d="M-1100,-96 L-170,-84 L-160,94 L-1100,108 Z" fill="#3E5373" />
    <path d="M-1100,-96 L-170,-84 L-172,-60 L-1100,-66 Z" fill="#53698C" opacity={0.6} />
    <rect x={-190} y={-90} width={40} height={184} rx={10} fill="#2F4260" />
    <path d="M-160,-70 C-90,-82 -20,-80 30,-64 C40,-30 40,30 30,62 C-20,80 -90,82 -160,72 Z" fill="#E6BE98" />
    {[-52, -18, 16, 48].map((y, i) => (
      <rect key={i} x={20} y={y - 15} width={[150, 176, 168, 136][i]} height={30} rx={15} fill="#E6BE98" stroke="#C99D78" strokeWidth={1.5} />
    ))}
    <path d="M-60,70 C-20,120 40,130 80,112 C90,100 80,88 64,86 C30,90 -10,80 -40,58 Z" fill="#E1B690" stroke="#C99D78" strokeWidth={1.5} />
  </g>
);

/** 船板（flatten 0 = 弯曲的旧船板，1 = 平直的地板） */
const plankPath = (t: number) => {
  const bow = (1 - t) * 60;
  const r = 8 * t;
  return `M-760,${-120 + r} Q0,${-120 - bow * 2} 760,${-120 + r} L760,${120 - r} Q0,${120 - bow * 2} -760,${120 - r} Z`;
};

/** 两个十六进制颜色插值 */
const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};
