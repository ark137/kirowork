import React from 'react';
import {C, sans} from '../theme';

/**
 * 安信地板 Logo 矢量重绘（坐标系 1024 × 740）
 * 树冠 = 一组倾斜的地板条，按行错缝排布；树干 + 地平弧 + 红字。
 * 导出几何数据，供第 7 / 26 / 27 镜逐块动画使用。
 */
export const LOGO_W = 1024;
export const LOGO_H = 740;

export type Tile = {
  i: number; // 行（从上往下）
  j: number; // 行内序号
  idx: number; // 堆叠顺序（自下而上）
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number; // deg
};

export const LOGO_PARAMS = {ang: 37, pu: 90, pv: 62, tw: 80, th: 52};
/** 顶尖那块地板条的中心 */
const APEX = [512, 40];

/**
 * 错缝排布：每行沿板长方向（右下），行与行沿左下方向递进，奇数行错开半块。
 * 每行的起止序号按原图逐行对照，共 46 块：
 *   行 0–9 块数 = 5, 5, 6, 6, 6, 6, 5, 4, 3, 0
 */
const ROWS: [number, number][] = [
  [0, 4],
  [-0.5, 3.5],
  [-1, 4],
  [-1.5, 3.5],
  [-1, 4], // 左上角留出缺口
  [-1.5, 3.5],
  [-1, 3],
  [-0.5, 2.5],
  [0, 2],
];

const buildTiles = (): Tile[] => {
  const {ang, pu, pv, tw, th} = LOGO_PARAMS;
  const a = (ang * Math.PI) / 180;
  const u = [Math.cos(a), Math.sin(a)];
  const v = [-Math.sin(a), Math.cos(a)];
  const raw: Omit<Tile, 'idx'>[] = [];
  ROWS.forEach(([k0, k1], i) => {
    for (let k = k0, j = 0; k <= k1 + 1e-6; k += 1, j++) {
      const x = APEX[0] + u[0] * k * pu + v[0] * i * pv;
      const y = APEX[1] + u[1] * k * pu + v[1] * i * pv;
      raw.push({i, j, cx: x, cy: y, w: tw, h: th, rot: ang});
    }
  });
  // 自下而上的堆叠顺序
  const sorted = [...raw].sort((p, q) => q.cy - p.cy || p.cx - q.cx);
  return sorted.map((t, idx) => ({...t, idx}));
};

export const LOGO_TILES: Tile[] = buildTiles();

export const TRUNK_PATH =
  'M452,566 C480,590 504,608 522,630 C540,610 564,590 590,574 C572,616 578,662 614,700 L414,700 C452,668 464,612 452,566 Z';
export const GROUND_PATH = 'M226,740 Q520,664 798,740 Q520,694 226,740 Z';

export type LogoProps = {
  /** 每块地板条的样式回调：返回 null 表示不渲染 */
  tileStyle?: (t: Tile) => React.SVGProps<SVGGElement> | null;
  tileFill?: string;
  trunkOpacity?: number;
  groundOpacity?: number;
  textOpacity?: number;
  showText?: boolean;
  textColor?: string;
  renderTileContent?: (t: Tile) => React.ReactNode;
};

export const LogoTileRect: React.FC<{t: Tile; fill: string}> = ({t, fill}) => (
  <rect x={-t.w / 2} y={-t.h / 2} width={t.w} height={t.h} fill={fill} />
);

export const AnxinLogoArt: React.FC<LogoProps> = ({
  tileStyle,
  tileFill = C.gold,
  trunkOpacity = 1,
  groundOpacity = 1,
  textOpacity = 1,
  showText = true,
  textColor = C.red,
  renderTileContent,
}) => {
  return (
    <g>
      {LOGO_TILES.map((t) => {
        const extra = tileStyle ? tileStyle(t) : {};
        if (extra === null) return null;
        const {transform: extraTransform, ...rest} = extra as React.SVGProps<SVGGElement>;
        return (
          <g key={t.idx} {...rest}>
            <g transform={`${extraTransform ?? ''} translate(${t.cx} ${t.cy}) rotate(${t.rot})`}>
              <LogoTileRect t={t} fill={tileFill} />
              {renderTileContent ? renderTileContent(t) : null}
            </g>
          </g>
        );
      })}
      <path d={TRUNK_PATH} fill={tileFill} opacity={trunkOpacity} />
      <path d={GROUND_PATH} fill={tileFill} opacity={groundOpacity} />
      {showText ? (
        <g opacity={textOpacity} fill={textColor} style={{fontFamily: sans, fontWeight: 900}}>
          <text x={6} y={700} fontSize={158} letterSpacing={-2}>
            安信
          </text>
          <text x={700} y={700} fontSize={158} letterSpacing={-2}>
            地板
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** 便捷：完整 SVG Logo */
export const AnxinLogo: React.FC<LogoProps & {width: number; style?: React.CSSProperties}> = ({width, style, ...rest}) => (
  <svg width={width} height={(width * LOGO_H) / LOGO_W} viewBox={`0 0 ${LOGO_W} ${LOGO_H}`} style={style} overflow="visible">
    <AnxinLogoArt {...rest} />
  </svg>
);
