import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {OldPhoto} from '../components/OldPhoto';
import {AnxinLogoArt} from '../components/AnxinLogo';

/**
 * 第 6 镜（7 秒 / 210 帧）：1994.4.8，温州，第一家门店（28 m²）
 * 依据原照片 assets/安信地板第一家门店.png 的构图用 SVG 重绘（照片坐标 1040 × 693）
 * 0–60   ：一张老照片摆在宣纸上（白边、胶带、微倾）
 * 40–150 ：镜头推入照片，店里灯光亮起
 * 150–210：上摇推近门头的绿色大树商标（交给第 7 镜）
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const PW = 1040;
const PH = 693;
const BASE = W / PW;

export const EMBLEM = {x: 596, y: 128};

export const S6Store: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const z1 = interpolate(f, [0, 150], [0.64, 1.2], {...cl, easing: Easing.inOut(Easing.sin)});
  const zoomT = interpolate(f, [150, 210], [0, 1], {...cl, easing: io});
  // 对数空间插值，保证急推时速度均匀
  const z = Math.exp(Math.log(z1) + (Math.log(5.3) - Math.log(1.2)) * zoomT);
  const cx0 = interpolate(f, [0, 150], [520, 548], cl);
  const cy0 = interpolate(f, [0, 150], [346, 318], cl);
  const cx = cx0 + (EMBLEM.x - cx0) * zoomT;
  const cy = cy0 + (EMBLEM.y - cy0) * zoomT;
  const rot = interpolate(f, [0, 80], [-3.2, 0], {...cl, easing: io});
  const lights = interpolate(f, [30, 90], [0.35, 1], cl);
  const S = BASE * z;

  return (
    <AbsoluteFill>
      <Paper />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: 'saturate(0.84) sepia(0.1) contrast(0.97)'}}>
        <defs>
          <filter id="s6-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#6B4E2A" floodOpacity="0.35" />
          </filter>
          <radialGradient id="s6-spot">
            <stop offset="0%" stopColor="#FFF0C8" stopOpacity={1} />
            <stop offset="30%" stopColor="#FFC56E" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#FFC56E" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="s6-interior" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E2A20" />
            <stop offset="100%" stopColor="#5A3A26" />
          </linearGradient>
          <linearGradient id="s6-yellow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4D52E" />
            <stop offset="100%" stopColor="#E9C41F" />
          </linearGradient>
          <linearGradient id="s6-table" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7A2C16" />
            <stop offset="45%" stopColor="#9E4422" />
            <stop offset="75%" stopColor="#C77834" />
            <stop offset="100%" stopColor="#E3A55C" />
          </linearGradient>
          <clipPath id="s6-photo">
            <rect x={0} y={0} width={PW} height={PH} />
          </clipPath>
        </defs>
        <g transform={`translate(${W / 2} ${H / 2}) rotate(${rot}) scale(${S}) translate(${-cx} ${-cy})`}>
          {/* 照片白边 + 投影 */}
          <rect x={-26} y={-26} width={PW + 52} height={PH + 80} fill="#FBF8F1" filter="url(#s6-shadow)" />
          <g clipPath="url(#s6-photo)">
            <StoreArt f={f} lights={lights} />
          </g>
          {/* 胶带 */}
          <rect x={-40} y={-44} width={150} height={40} fill="#F4ECD8" opacity={0.75} transform="rotate(-12 35 -24)" />
          <rect x={PW - 110} y={-44} width={150} height={40} fill="#F4ECD8" opacity={0.75} transform={`rotate(10 ${PW - 35} -24)`} />
          <text x={PW - 10} y={PH + 40} textAnchor="end" fontFamily={serif} fontStyle="italic" fontSize={22} fill={C.inkMute}>
            1994.4.8 · 温州
          </text>
        </g>
      </svg>
      <OldPhoto strength={0.9} seed="s6" />
      {/* 字幕托底：底部宣纸色渐隐带 */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(251,246,236,0) 72%, rgba(251,246,236,0.82) 88%, rgba(251,246,236,0.9) 100%)'}} />
    </AbsoluteFill>
  );
};

/** 门店插画（照片坐标系） */
const StoreArt: React.FC<{f: number; lights: number}> = ({f, lights}) => {
  const pennants = useMemo(() => new Array(24).fill(0).map((_, i) => ({x: 156 + i * 28.8, red: i % 2 === 1})), []);
  const confetti = useMemo(
    () => new Array(40).fill(0).map((_, i) => ({x: 240 + random(`cf${i}`) * 640, y: 640 + random(`cfy${i}`) * 50, r: random(`cfr${i}`) * 180, s: 3 + random(`cfs${i}`) * 4})),
    [],
  );
  const seams = [148, 255, 362, 458, 548, 640, 712, 790, 858, 925];
  return (
    <g>
      {/* 天花与左侧招牌 */}
      <rect x={0} y={0} width={PW} height={PH} fill="#E6E0D4" />
      <polygon points="540,0 1040,0 1040,132 978,122" fill="#E9E4DA" />
      <g stroke="#CFC6B6" strokeWidth={2}>
        {new Array(26).fill(0).map((_, i) => (
          <line key={i} x1={560 + i * 20} y1={0} x2={600 + i * 20} y2={130} />
        ))}
      </g>
      <rect x={0} y={0} width={30} height={130} fill="#3E73A8" />
      <circle cx={872} cy={74} r={16} fill="#F2F0EA" stroke="#9A9284" strokeWidth={2} />
      <rect x={862} y={58} width={20} height={6} fill="#9A9284" />
      {/* 右侧外墙 */}
      <rect x={985} y={130} width={60} height={500} fill="#D9D2C2" />
      <rect x={995} y={250} width={45} height={380} fill="#2E4A78" opacity={0.85} />

      {/* 室内 */}
      <rect x={90} y={236} width={812} height={410} fill="url(#s6-interior)" />
      {/* 后墙上方的暗字 */}
      <g fill="#2A1C14" opacity={0.75} fontFamily={serif} fontWeight={900}>
        <text x={240} y={300} fontSize={40}>安</text>
        <text x={490} y={300} fontSize={40}>信</text>
      </g>
      {/* 左后墙木饰面 */}
      {new Array(9).fill(0).map((_, i) => (
        <rect key={i} x={246 + i * 22} y={345} width={21} height={176} fill={['#8B3A1E', '#9C4A26', '#7A3018'][i % 3]} />
      ))}
      {/* 中央灯箱 */}
      <rect x={444} y={346} width={130} height={104} fill="#2A1A12" />
      <g opacity={lights}>
        <g transform="translate(493 352) scale(0.03)">
          <AnxinLogoArt tileFill="#4FD06A" showText={false} groundOpacity={0} />
        </g>
        <ellipse cx={509} cy={372} rx={30} ry={24} fill="#7CFF9A" opacity={0.25} />
        <text x={466} y={392} fontFamily={serif} fontWeight={900} fontSize={13} fill="#FF5A3C">安信</text>
        <text x={520} y={392} fontFamily={serif} fontWeight={900} fontSize={13} fill="#FF5A3C">地板</text>
      </g>
      {/* 右侧斜向展示墙板 */}
      {new Array(9).fill(0).map((_, i) => {
        const x0 = 655 + i * 24;
        const colors = ['#7A2A16', '#8E3A1C', '#A44C24', '#6A2412', '#B5602E', '#8A3418', '#C27238', '#93421E', '#7E3016'];
        return <polygon key={i} points={`${x0},${330 + i * 2} ${x0 + 22},${328 + i * 2} ${x0 + 30},${560} ${x0 + 6},${562}`} fill={colors[i]} />;
      })}
      <g stroke="#2A1A12" strokeWidth={1.5} opacity={0.6}>
        {new Array(9).fill(0).map((_, i) => (
          <line key={i} x1={655 + i * 24} y1={330} x2={661 + i * 24} y2={562} />
        ))}
      </g>
      {/* 白色栏板 */}
      <rect x={690} y={548} width={190} height={8} fill="#F2EEE6" />
      {new Array(14).fill(0).map((_, i) => (
        <rect key={i} x={694 + i * 13.5} y={520} width={6} height={30} fill="#F2EEE6" />
      ))}
      {/* 射灯 */}
      {[...new Array(8).fill(0).map((_, i) => [258 + i * 25, 352]), ...new Array(9).fill(0).map((_, i) => [640 + i * 25, 334 - i * 1.5]), [100, 262], [104, 286], [98, 312], [108, 334]].map(([x, y], i) => (
        <g key={i} opacity={lights * (0.85 + 0.15 * Math.sin(f * 0.3 + i))}>
          <circle cx={x} cy={y} r={14} fill="url(#s6-spot)" />
          <circle cx={x} cy={y} r={2.2} fill="#FFF6DC" />
        </g>
      ))}
      {/* 光晕洒在墙板上 */}
      <rect x={240} y={345} width={210} height={180} fill="#FFB860" opacity={0.12 * lights} />
      <rect x={640} y={330} width={240} height={230} fill="#FFB860" opacity={0.12 * lights} />

      {/* 门头 —— 上排大板 */}
      <rect x={30} y={12} width={952} height={148} fill="url(#s6-yellow)" />
      {/* 下排内凹板 */}
      <rect x={88} y={158} width={898} height={80} fill="#E2BC1E" />
      <rect x={88} y={158} width={898} height={8} fill="#C9A418" opacity={0.6} />
      <g stroke="#C29E17" strokeWidth={2.4}>
        {seams.map((x) => (
          <line key={x} x1={x} y1={12} x2={x} y2={158} />
        ))}
        {seams.map((x) => (
          <line key={`b${x}`} x1={x + 18} y1={160} x2={x + 18} y2={238} />
        ))}
      </g>
      {/* 门头红字 */}
      <g fill="#C51D1D" fontFamily={serif} fontWeight={900}>
        <text x={292} y={128} fontSize={84} transform="rotate(-3 330 100)">安</text>
        <text x={402} y={138} fontSize={82} transform="rotate(4 440 108)">信</text>
        <text x={706} y={180} fontSize={66} transform="rotate(-4 740 150)">地</text>
        <text x={784} y={184} fontSize={68} transform="rotate(5 815 155)">板</text>
        <text x={868} y={150} fontSize={15}>门</text>
        <text x={868} y={168} fontSize={15}>市</text>
        <rect x={870} y={176} width={11} height={11} />
      </g>
      {/* 绿色大树商标 */}
      <g transform={`translate(${EMBLEM.x - 935 * 0.068} 80) scale(0.068)`}>
        <AnxinLogoArt tileFill="#2E8C4E" showText={false} groundOpacity={0} />
      </g>

      {/* 挂旗 */}
      <line x1={150} y1={180} x2={850} y2={180} stroke="#8A7A5A" strokeWidth={1.5} />
      {pennants.map((p, i) => {
        const sw = Math.sin(f * 0.08 + i * 0.6) * 2.2;
        return (
          <g key={i} transform={`rotate(${sw} ${p.x + 14} 180)`}>
            <rect x={p.x} y={181} width={27} height={i % 3 === 0 ? 62 : 100} fill={p.red ? '#D12A2A' : '#F2D33A'} />
            <circle cx={p.x + 13.5} cy={204} r={6} fill={p.red ? '#F2D33A' : '#D12A2A'} />
            <rect x={p.x + 5} y={218} width={17} height={3} fill={p.red ? '#F7E7A0' : '#8A6A2A'} opacity={0.7} />
            <rect x={p.x + 7} y={226} width={13} height={3} fill={p.red ? '#F7E7A0' : '#8A6A2A'} opacity={0.6} />
          </g>
        );
      })}

      {/* 立柱 */}
      <rect x={0} y={136} width={92} height={430} fill="url(#s6-yellow)" />
      <rect x={898} y={236} width={92} height={390} fill="url(#s6-yellow)" />
      <g stroke="#C29E17" strokeWidth={2.4}>
        {[250, 362, 472].map((y) => (
          <line key={y} x1={0} y1={y} x2={92} y2={y} />
        ))}
        {[345, 455, 560].map((y) => (
          <line key={y} x1={898} y1={y} x2={990} y2={y} />
        ))}
      </g>
      <text x={4} y={176} fontFamily={serif} fontWeight={900} fontSize={20} fill="#2E5FA0">营</text>

      {/* 地面 */}
      <rect x={0} y={640} width={PW} height={60} fill="#D7D2C8" />
      <g stroke="#BDB6A8" strokeWidth={1.4}>
        {new Array(12).fill(0).map((_, i) => (
          <line key={i} x1={i * 95} y1={640} x2={i * 95 - 40} y2={PH} />
        ))}
        <line x1={0} y1={664} x2={PW} y2={664} />
      </g>
      <rect x={230} y={622} width={680} height={20} fill="#33495E" opacity={0.8} />
      {/* 开张的红色鞭炮纸屑 */}
      {confetti.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.s} height={c.s * 0.6} fill="#C8262A" opacity={0.75} transform={`rotate(${c.r} ${c.x} ${c.y})`} />
      ))}

      {/* 中央展台 */}
      <polygon points="352,456 682,456 696,520 336,520" fill="url(#s6-table)" />
      <g stroke="#3A1A0C" strokeOpacity={0.45} strokeWidth={1.4}>
        {new Array(12).fill(0).map((_, i) => {
          const t = (i + 1) / 13;
          return <line key={i} x1={352 + 330 * t} y1={456} x2={336 + 360 * t} y2={520} />;
        })}
      </g>
      <rect x={336} y={452} width={346} height={6} fill="#F3EEE4" />
      <rect x={430} y={440} width={40} height={14} fill="#F3EEE4" />
      <rect x={344} y={518} width={350} height={128} fill="#ECC72C" />
      <polygon points="336,470 344,520 344,646 336,640" fill="#C9A21C" />
      <rect x={344} y={518} width={350} height={6} fill="#F7E07A" />
      {/* 四幅展示画 */}
      {[
        [388, 546, 74, 96],
        [475, 546, 70, 96],
        [554, 546, 66, 92],
        [626, 546, 64, 90],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#F6F2EA" stroke="#B35A3A" strokeWidth={2.4} />
          {i === 0 ? (
            <g>
              <path d={`M${x + 20},${y + 80} L${x + 26},${y + 40} M${x + 44},${y + 82} L${x + 46},${y + 36}`} stroke="#6A5A4A" strokeWidth={3} />
              <circle cx={x + 26} cy={y + 32} r={14} fill="#A8B88A" opacity={0.8} />
              <circle cx={x + 48} cy={y + 28} r={12} fill="#C9A47A" opacity={0.8} />
            </g>
          ) : null}
          {i === 1 ? (
            <g transform={`translate(${x + 9} ${y + 8}) scale(0.028)`}>
              <AnxinLogoArt tileFill="#3FA05A" showText={false} groundOpacity={0} />
            </g>
          ) : null}
          {i === 2 ? (
            <g>
              <circle cx={x + 24} cy={y + 52} r={18} fill="#D9B28A" />
              <circle cx={x + 44} cy={y + 34} r={14} fill="#E6CDA8" />
              <rect x={x + 8} y={y + 74} width={50} height={6} fill="#8A6A4A" opacity={0.6} />
            </g>
          ) : null}
          {i === 3 ? (
            <g fill="#9A8C7A">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <rect key={k} x={x + 10} y={y + 14 + k * 11} width={w - 20 - (k % 2) * 12} height={3} />
              ))}
            </g>
          ) : null}
        </g>
      ))}
      <rect x={398} y={448} width={22} height={14} fill="#F3EEE4" />
      <rect x={584} y={436} width={36} height={20} fill="#F3EEE4" />
      {[388, 396, 404, 412].map((x) => (
        <rect key={x} x={x} y={424} width={6} height={22} fill="#F8F4EE" />
      ))}

      {/* 左侧样板货架 */}
      <rect x={106} y={392} width={4} height={300} fill="#E6E4DE" />
      <rect x={236} y={392} width={4} height={300} fill="#E6E4DE" />
      <rect x={120} y={328} width={124} height={64} fill="#F7F6F1" stroke="#CFCBC0" strokeWidth={2} />
      <g transform="translate(168 332) scale(0.03)">
        <AnxinLogoArt tileFill="#2E9A54" showText={false} groundOpacity={0} />
      </g>
      <g fill="#C51D1D" fontFamily={serif} fontWeight={900} fontSize={13}>
        <text x={130} y={384}>安信</text>
        <text x={202} y={384}>地板</text>
      </g>
      {['#E4E0D8', '#E8CFA2', '#DDBB86', '#E6C895', '#D9AE74', '#E9D2AA', '#D7A96E', '#B4302A'].map((c, i) => {
        const y = 412 + i * 30;
        return (
          <g key={i}>
            <polygon points={`${112},${y + 22} ${236},${y + 22} ${232},${y} ${118},${y + 4}`} fill={c} />
            <line x1={110} y1={y + 23} x2={238} y2={y + 23} stroke="#BFBAB0" strokeWidth={2} />
          </g>
        );
      })}
      <rect x={0} y={566} width={106} height={130} fill="#ECEAE4" />
      <rect x={0} y={548} width={80} height={20} rx={8} fill="#F4F3EF" />

      {/* 右侧告示牌 */}
      <g>
        <line x1={846} y1={610} x2={836} y2={636} stroke="#6A5A4A" strokeWidth={3} />
        <line x1={936} y1={610} x2={948} y2={636} stroke="#6A5A4A" strokeWidth={3} />
        <rect x={836} y={450} width={112} height={164} fill="#E8913E" />
        <rect x={850} y={458} width={84} height={100} fill="#1E1C1A" />
        <rect x={850} y={458} width={84} height={16} fill="#F2D33A" />
        <g stroke="#F2EEE6" strokeWidth={1} opacity={0.6}>
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={856} y1={490 + k * 13} x2={928} y2={490 + k * 13} />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <line key={`v${k}`} x1={870 + k * 16} y1={482} x2={870 + k * 16} y2={552} />
          ))}
        </g>
      </g>
      {/* 盆栽 */}
      <polygon points="944,580 986,580 980,628 950,628" fill="#F4F2EE" />
      <g stroke="#3F6A34" strokeWidth={4} strokeLinecap="round" fill="none">
        {new Array(12).fill(0).map((_, i) => {
          const a = -Math.PI / 2 + (i / 11 - 0.5) * 2.4;
          const l = 50 + random(`pl${i}`) * 40;
          const sw = Math.sin(f * 0.06 + i) * 3;
          return <path key={i} d={`M965,580 q${Math.cos(a) * l * 0.5},${Math.sin(a) * l * 0.6 - 10} ${Math.cos(a) * l + sw},${Math.sin(a) * l * 0.9}`} />;
        })}
      </g>
      {/* 靠墙的地板条 */}
      <polygon points="988,378 1012,376 1034,622 1010,624" fill="#9A5A2C" />
      <polygon points="1012,376 1030,374 1040,500 1040,620 1034,622" fill="#7E4420" />
    </g>
  );
};

export const _unused = {sans};
