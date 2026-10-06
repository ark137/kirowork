import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, H, W, sans, serif} from '../theme';
import {Paper} from '../components/Paper';
import {InkDefs} from '../components/Ink';
import {GoldDust} from '../components/GoldDust';

/**
 * s20（8 秒 / 240 帧）：2004–2006，走出去
 * 以太平洋为中心的水墨世界地图；中国（温州）是根。
 *   0– 40  地图墨晕显现，温州金点脉动
 *  36– 90  金线跨太平洋到南美，四个点依次亮起 —— 拉美四国
 *  84–130  金线到美国 —— 收购 ARK FLOORS
 * 124–170  美国 → 中国的虚线回流 —— 凯雷注资 5000 万美元
 * 164–210  金线向西到非洲 —— 投资非洲木材
 * 200–240  每个终点长出细小的金色根须：把根扎向更远的地方
 */
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CENTER_LON = 150;
const SX = 5;
const SY = 5;
const MY = 520;
const proj = (lon: number, lat: number) => {
  const rel = ((((lon - CENTER_LON) % 360) + 540) % 360) - 180;
  return [W / 2 + rel * SX, MY - lat * SY] as const;
};

type LL = [number, number][];
const LAND: LL[] = [
  // 北美
  [[-168,66],[-162,70],[-140,70],[-125,70],[-110,73],[-95,72],[-82,68],[-80,63],[-90,57],[-82,52],[-78,58],[-65,60],[-60,54],[-55,50],[-66,45],[-70,42],[-75,38],[-76,35],[-81,31],[-80,26],[-82,28],[-85,30],[-90,29],[-97,27],[-97,22],[-92,18],[-88,21],[-87,16],[-83,10],[-79,9],[-77,8],[-80,8],[-85,11],[-92,14],[-100,17],[-106,23],[-110,30],[-115,31],[-117,33],[-121,36],[-124,40],[-124,46],[-123,49],[-128,51],[-133,56],[-140,60],[-150,60],[-155,58],[-165,55],[-160,59],[-165,62]],
  // 格陵兰（东岸压到接缝内侧）
  [[-55,60],[-45,60],[-31,68],[-31,80],[-60,82],[-72,78],[-55,68]],
  // 南美
  [[-80,9],[-75,11],[-72,12],[-62,11],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-9],[-39,-15],[-41,-22],[-48,-26],[-53,-34],[-58,-38],[-62,-40],[-65,-45],[-68,-50],[-70,-54],[-74,-52],[-75,-46],[-73,-38],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,-1],[-78,3],[-77,7]],
  // 欧亚
  [[-9,43],[-9,37],[-6,36],[0,38],[3,43],[-1,46],[-4,48],[2,51],[5,53],[8,57],[5,62],[14,67],[20,70],[30,70],[40,67],[44,68],[55,68],[60,70],[70,73],[80,73],[100,77],[110,74],[130,71],[150,71],[170,70],[180,68],[175,64],[163,58],[156,51],[150,59],[140,54],[136,48],[132,43],[128,39],[126,35],[122,31],[120,27],[118,24],[110,21],[108,18],[106,10],[103,1],[100,4],[98,9],[98,16],[94,17],[91,22],[86,20],[80,15],[78,8],[73,16],[72,21],[67,25],[60,25],[57,26],[56,23],[59,22],[55,17],[44,12],[42,15],[35,28],[34,31],[36,36],[30,37],[27,37],[26,40],[23,40],[24,37],[22,37],[19,42],[13,45],[12,42],[16,40],[16,38],[8,44]],
  // 非洲
  [[-17,21],[-17,15],[-15,11],[-12,7],[-8,4],[-2,5],[5,6],[9,4],[10,1],[9,-2],[12,-6],[13,-12],[12,-17],[15,-27],[18,-34],[20,-35],[26,-34],[32,-29],[35,-24],[35,-18],[40,-15],[40,-10],[39,-5],[42,0],[48,5],[51,11],[44,11],[43,13],[38,18],[36,22],[33,28],[32,31],[25,32],[20,31],[15,32],[10,34],[10,37],[0,36],[-6,36],[-10,30],[-13,27]],
  [[44,-25],[47,-25],[50,-15],[49,-12],[44,-16]],
  // 澳洲
  [[114,-22],[114,-34],[118,-35],[123,-34],[131,-31],[137,-34],[140,-38],[147,-39],[150,-37],[153,-30],[153,-25],[146,-19],[142,-11],[141,-17],[136,-12],[131,-12],[126,-14],[122,-18]],
  // 日本、英国、婆罗洲、苏门答腊、新几内亚、新西兰
  [[130,31],[135,34],[140,35],[142,40],[141,43],[144,44],[141,45],[139,40],[136,37],[132,35]],
  [[-5,50],[1,51],[0,53],[-2,56],[-5,58],[-6,55],[-3,54],[-5,52]],
  [[109,1],[117,7],[119,5],[117,0],[116,-4],[110,-3]],
  [[95,5],[98,4],[106,-6],[102,-4]],
  [[131,-1],[141,-3],[150,-10],[143,-9],[138,-8]],
  [[172,-35],[178,-38],[174,-41],[167,-46],[171,-44]],
];

const HUB = proj(120.7, 28);
const LA = [proj(-50, -4), proj(-75, -10), proj(-64, -17), proj(-57, -24)];
const US = proj(-92, 38);
const AF = proj(12, 0);

const smoothPath = (pts: readonly (readonly [number, number])[]) => {
  const mid = (a: readonly number[], b: readonly number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${mid(pts[pts.length - 1], pts[0]).join(',')} `;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % pts.length]);
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)} `;
  }
  return d + 'Z';
};

type Route = {from: readonly [number, number]; to: readonly [number, number]; lift: number; t0: number; t1: number; dashed?: boolean};
const ROUTES: Route[] = [
  {from: HUB, to: LA[2], lift: -150, t0: 36, t1: 74},
  {from: HUB, to: US, lift: -90, t0: 86, t1: 116},
  {from: US, to: HUB, lift: -250, t0: 126, t1: 158, dashed: true},
  {from: HUB, to: AF, lift: -170, t0: 166, t1: 200},
];
const qPath = (r: Route) => {
  const mx = (r.from[0] + r.to[0]) / 2;
  const my = Math.min(r.from[1], r.to[1]) + r.lift;
  return `M${r.from[0]},${r.from[1]} Q${mx},${my} ${r.to[0]},${r.to[1]}`;
};
const qPoint = (r: Route, t: number) => {
  const mx = (r.from[0] + r.to[0]) / 2;
  const my = Math.min(r.from[1], r.to[1]) + r.lift;
  const u = 1 - t;
  return [u * u * r.from[0] + 2 * u * t * mx + t * t * r.to[0], u * u * r.from[1] + 2 * u * t * my + t * t * r.to[1]];
};

/** 终点的金色根须 */
const rootlets = (x: number, y: number, seed: number) =>
  [0, 1, 2, 3].map((k) => {
    const a = Math.PI * (0.25 + k * 0.17) + seed;
    const l = 26 + ((k * 7 + seed * 10) % 14);
    const x1 = x + Math.cos(a) * l;
    const y1 = y + Math.sin(a) * l;
    return `M${x},${y} Q${x + Math.cos(a - 0.4) * l * 0.6},${y + Math.sin(a - 0.4) * l * 0.6} ${x1},${y1} M${x1},${y1} l${Math.cos(a + 0.6) * 10},${Math.sin(a + 0.6) * 10}`;
  }).join(' ');

const CARDS = [
  {at: 64, x: 1440, y: 712, zh: '拉美四国', en: 'LATIN AMERICA · 4 COUNTRIES'},
  {at: 108, x: 1540, y: 196, zh: '收购美国 ARK FLOORS', en: 'ACQUISITION · USA'},
  {at: 148, x: 1180, y: 132, zh: '凯雷注资 5000 万美元', en: 'CARLYLE · US$ 50 M'},
  {at: 192, x: 300, y: 330, zh: '投资非洲木材', en: 'AFRICA · TIMBER'},
];

export const S20World: React.FC = () => {
  const f = useCurrentFrame();
  const io = Easing.inOut(Easing.cubic);
  const mapIn = interpolate(f, [0, 36], [0, 1], {...cl, easing: io});
  const zoom = interpolate(f, [0, 240], [1.04, 1], {...cl, easing: Easing.out(Easing.quad)});
  const roots = interpolate(f, [200, 232], [0, 1], {...cl, easing: io});
  const land = useMemo(() => LAND.map((l) => smoothPath(l.map(([a, b]) => proj(a, b)))), []);

  return (
    <AbsoluteFill>
      <Paper glowAt={[50, 40]} />
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <InkDefs p="wd" seed={91} />
            <radialGradient id="wd-glow">
              <stop offset="0%" stopColor="#FFE7A0" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFE7A0" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* 经纬网 */}
          <g stroke={C.inkMute} strokeWidth={0.8} opacity={0.18 * mapIn} fill="none">
            {[-60, -30, 0, 30, 60].map((lat) => (
              <line key={lat} x1={60} y1={MY - lat * SY} x2={W - 60} y2={MY - lat * SY} strokeDasharray={lat === 0 ? '0' : '4 8'} />
            ))}
            {new Array(13).fill(0).map((_, i) => (
              <line key={i} x1={60 + i * 150} y1={150} x2={60 + i * 150} y2={820} strokeDasharray="4 8" />
            ))}
          </g>
          {/* 大陆：墨晕底 + 细墨边 */}
          <g opacity={mapIn}>
            <g filter="url(#wd-wash)" fill={C.paperShade} opacity={0.45}>
              {land.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <g filter="url(#wd-bleed)" fill="#EADBBE" stroke={C.inkWash} strokeWidth={1.6} strokeOpacity={0.55}>
              {land.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>

          {/* 航线 */}
          {ROUTES.map((r, i) => {
            const p = interpolate(f, [r.t0, r.t1], [0, 1], {...cl, easing: io});
            if (p <= 0) return null;
            const head = qPoint(r, p);
            const flow = r.dashed ? -f * 0.02 : 0;
            return (
              <g key={i}>
                {r.dashed ? (
                  <mask id={`wd-m${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                    <path d={qPath(r)} fill="none" stroke="#fff" strokeWidth={14} pathLength={1} strokeDasharray={`${p} 1`} />
                  </mask>
                ) : null}
                <path
                  d={qPath(r)}
                  fill="none"
                  stroke={C.gold}
                  strokeWidth={r.dashed ? 2.4 : 3.2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={r.dashed ? '0.012 0.012' : `${p} 1`}
                  strokeDashoffset={flow}
                  mask={r.dashed ? `url(#wd-m${i})` : undefined}
                  opacity={0.95}
                />
                {p < 1 ? <circle cx={head[0]} cy={head[1]} r={7} fill="#FFF3CF" stroke={C.gold} strokeWidth={2} /> : null}
                {r.dashed && p > 0.05
                  ? [0.25, 0.55, 0.85].map((o) => {
                      const q = qPoint(r, ((f - r.t0) * 0.012 + o) % 1 * p);
                      return (
                        <text key={o} x={q[0]} y={q[1] - 10} fontFamily={serif} fontWeight={600} fontSize={20} fill={C.goldDeep} textAnchor="middle" opacity={0.8}>
                          $
                        </text>
                      );
                    })
                  : null}
              </g>
            );
          })}

          {/* 拉美四点 */}
          {LA.map(([x, y], i) => {
            const on = interpolate(f, [70 + i * 5, 80 + i * 5], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
            return <circle key={i} cx={x} cy={y} r={8 * on} fill={C.gold} stroke="#FFF6DE" strokeWidth={2} />;
          })}
          {/* 美国、非洲终点 */}
          {[
            {p: US, at: 114},
            {p: AF, at: 198},
          ].map(({p, at}, i) => {
            const on = interpolate(f, [at, at + 10], [0, 1], {...cl, easing: Easing.out(Easing.back(2))});
            return <circle key={i} cx={p[0]} cy={p[1]} r={9 * on} fill={C.gold} stroke="#FFF6DE" strokeWidth={2} />;
          })}
          {/* 根须 */}
          <g fill="none" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
            {[...LA, US, AF].map(([x, y], i) => (
              <path key={i} d={rootlets(x, y, i * 0.37)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - roots} />
            ))}
            <path d={rootlets(HUB[0], HUB[1], 0.9)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - roots} strokeWidth={2.6} />
          </g>

          {/* 温州：根 */}
          <circle cx={HUB[0]} cy={HUB[1]} r={46 + Math.sin(f * 0.12) * 6} fill="url(#wd-glow)" opacity={0.75 * mapIn} />
          <circle cx={HUB[0]} cy={HUB[1]} r={11} fill={C.red} stroke="#FFF6DE" strokeWidth={3} opacity={mapIn} />
        </svg>

        {/* 温州标签 */}
        <div style={{position: 'absolute', left: HUB[0] - 150, width: 140, top: HUB[1] - 16, textAlign: 'right', opacity: mapIn}}>
          <div style={{fontFamily: serif, fontWeight: 600, fontSize: 24, color: C.ink, letterSpacing: '0.12em'}}>温州</div>
          <div style={{fontFamily: sans, fontSize: 12, letterSpacing: '0.3em', color: C.inkMute}}>CHINA</div>
        </div>

        {/* 事件卡片 */}
        {CARDS.map((c, i) => {
          const on = interpolate(f, [c.at, c.at + 16], [0, 1], {...cl, easing: Easing.out(Easing.cubic)});
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: c.x - 200,
                width: 400,
                top: c.y - 40,
                display: 'flex',
                justifyContent: 'center',
                opacity: on,
                transform: `translateY(${(1 - on) * 10}px)`,
              }}
            >
              <div style={{padding: '10px 22px 11px', background: 'rgba(251,246,236,0.92)', border: `1.5px solid ${C.gold}`, borderRadius: 6, textAlign: 'center', boxShadow: '0 6px 20px rgba(120,90,40,0.12)'}}>
                <div style={{fontFamily: serif, fontWeight: 600, fontSize: 30, lineHeight: 1.2, color: C.ink, letterSpacing: '0.06em', whiteSpace: 'nowrap'}}>{c.zh}</div>
                <div style={{fontFamily: sans, fontSize: 12, letterSpacing: '0.3em', color: C.goldDeep, marginTop: 4, whiteSpace: 'nowrap'}}>{c.en}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(243,234,218,0) 78%, rgba(243,234,218,0.6) 90%, rgba(243,234,218,0.8) 100%)'}} />
      <GoldDust count={24} seed="wdd" opacity={0.55} />
    </AbsoluteFill>
  );
};
